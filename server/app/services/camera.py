"""Cámara del comercio: imágenes en vivo durante una alerta.

Dos fuentes:
  · **dispositivo**: un celular o tablet del local en «modo cámara» sube una
    imagen cada pocos segundos (los rostros ya vienen pixelados desde el
    navegador). Se guardan sólo las últimas imágenes, en memoria.
  · **ip**: una cámara del local con imagen web (instantánea JPEG o flujo
    MJPEG). El servidor la consulta y reenvía la imagen: la dirección de la
    cámara nunca llega al navegador, así nadie puede espiar el local después.

Al crear una alerta se guardan las últimas imágenes como evidencia.
"""

from __future__ import annotations

import ipaddress
import secrets
import socket
import sqlite3
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from urllib.parse import urlparse

import httpx

from ..config import settings
from ..db import now_iso


@dataclass
class Frame:
    data: bytes
    at: float  # time.time()


# merchant_id → últimas imágenes del modo dispositivo
_frames: dict[int, deque[Frame]] = defaultdict(lambda: deque(maxlen=10))


def store_frame(merchant_id: int, data: bytes) -> None:
    _frames[merchant_id].append(Frame(data, time.time()))


def latest_frame(merchant_id: int, max_age: float = 60) -> Frame | None:
    frames = _frames.get(merchant_id)
    if not frames:
        return None
    frame = frames[-1]
    return frame if time.time() - frame.at <= max_age else None


def device_online(merchant_id: int) -> bool:
    return latest_frame(merchant_id, max_age=30) is not None


# ---------------------------------------------------------------------------
# Cámara IP
# ---------------------------------------------------------------------------


class CameraError(ValueError):
    pass


def validate_camera_url(url: str) -> str:
    """Acepta http(s) a una cámara; bloquea direcciones del propio servidor.

    Las cámaras IP suelen estar en la red local del comercio, por eso se
    permiten IPs privadas, pero nunca loopback, link-local (metadatos de la
    nube) ni otros puertos del servidor. Además la dirección la aprueba un
    moderador antes de usarse.
    """
    url = url.strip()
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise CameraError("La dirección debe empezar por http:// o https://.")
    if parsed.username or parsed.password:
        # las credenciales en la URL se filtrarían en registros
        raise CameraError("No incluya usuario ni contraseña en la dirección.")
    _check_host(parsed.hostname)
    return url


def _check_host(hostname: str) -> None:
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror as error:
        raise CameraError("No se encontró la cámara en esa dirección.") from error
    for info in infos:
        address = ipaddress.ip_address(info[4][0])
        if address.is_loopback or address.is_link_local or address.is_multicast or address.is_unspecified:
            raise CameraError("Esa dirección no está permitida para una cámara.")


def _jpeg_from_mjpeg(chunks) -> bytes | None:
    """Saca la primera imagen JPEG de un flujo MJPEG (multipart/x-mixed-replace)."""
    buffer = b""
    for chunk in chunks:
        buffer += chunk
        start = buffer.find(b"\xff\xd8")
        end = buffer.find(b"\xff\xd9", start + 2) if start >= 0 else -1
        if start >= 0 and end > start:
            return buffer[start : end + 2]
        if len(buffer) > settings.max_frame_bytes:
            return None
    return None


def fetch_ip_frame(url: str) -> bytes:
    """Una imagen de la cámara IP (instantánea o primer cuadro del MJPEG)."""
    parsed = urlparse(url)
    _check_host(parsed.hostname or "")  # se revalida: el DNS pudo cambiar
    try:
        with httpx.stream("GET", url, timeout=4.0, follow_redirects=False) as response:
            if response.status_code != 200:
                raise CameraError(f"La cámara respondió {response.status_code}.")
            kind = response.headers.get("content-type", "").lower()
            if kind.startswith("multipart/"):
                frame = _jpeg_from_mjpeg(response.iter_bytes())
            elif kind.startswith("image/"):
                data = b""
                for chunk in response.iter_bytes():
                    data += chunk
                    if len(data) > settings.max_frame_bytes:
                        raise CameraError("La imagen de la cámara es demasiado grande.")
                frame = data
            else:
                raise CameraError("La dirección no entrega una imagen de cámara (JPEG o MJPEG).")
    except httpx.HTTPError as error:
        raise CameraError("No se pudo conectar con la cámara.") from error
    if not frame:
        raise CameraError("La cámara no envió imagen.")
    return frame


# ---------------------------------------------------------------------------
# Disponibilidad durante una alerta
# ---------------------------------------------------------------------------


def window_end(created_at: str) -> datetime:
    return datetime.fromisoformat(created_at) + timedelta(minutes=settings.camera_window_minutes)


def camera_ready(merchant: sqlite3.Row | None) -> bool:
    if not merchant or not merchant["camera_enabled"] or merchant["status"] != "verificado":
        return False
    if merchant["camera_mode"] == "ip":
        return merchant["camera_url_status"] == "aprobada" and bool(merchant["camera_url"])
    if merchant["camera_mode"] == "dispositivo":
        return True
    return False


def camera_info(db: sqlite3.Connection, alert: sqlite3.Row) -> dict:
    """Datos públicos de la cámara del comercio afectado (sin la dirección)."""
    merchant_id = alert["affected_merchant_id"]
    merchant = db.execute("SELECT * FROM merchants WHERE id = ?", (merchant_id,)).fetchone() if merchant_id else None
    ends = window_end(alert["created_at"])
    live = camera_ready(merchant) and datetime.now(UTC) < ends and alert["status"] != "rechazada"
    evidence = db.execute("SELECT COUNT(*) FROM alert_evidence WHERE alert_id = ?", (alert["id"],)).fetchone()[0]
    return {
        "affected_merchant": (
            {"id": merchant["id"], "name": merchant["name"], "business": merchant["business"]} if merchant else None
        ),
        "camera": {
            "available": bool(live),
            "mode": merchant["camera_mode"] if merchant and live else None,
            "online": bool(live and (merchant["camera_mode"] == "ip" or device_online(merchant["id"]))),
            "live_until": ends.isoformat(timespec="seconds"),
            "evidence": int(evidence),
        },
    }


def save_evidence(db: sqlite3.Connection, alert_id: int, merchant: sqlite3.Row | None) -> int:
    """Guarda las imágenes recientes del comercio afectado como evidencia."""
    if not camera_ready(merchant):
        return 0
    frames: list[bytes] = []
    if merchant["camera_mode"] == "dispositivo":
        cutoff = time.time() - 120
        frames = [frame.data for frame in list(_frames.get(merchant["id"], [])) if frame.at >= cutoff][-5:]
    elif merchant["camera_mode"] == "ip":
        try:
            frames = [fetch_ip_frame(merchant["camera_url"])]
        except CameraError:
            frames = []
    saved = 0
    for data in frames:
        name = f"{secrets.token_hex(12)}.jpg"
        (settings.uploads_dir / name).write_bytes(data)
        db.execute(
            "INSERT INTO alert_evidence (alert_id, file, captured_at) VALUES (?, ?, ?)", (alert_id, name, now_iso())
        )
        saved += 1
    return saved
