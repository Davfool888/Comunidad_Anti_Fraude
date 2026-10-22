"""Cámara del comercio y notificaciones push.

Comercio (cabecera X-Merchant-Code):
  GET  /api/merchants/me                configuración de su cámara
  PUT  /api/merchants/me/camera         activar / cambiar fuente / apagar
  POST /api/merchants/me/camera/frame   imagen del «modo cámara»

Comunidad (mientras dura la alerta):
  GET  /api/alerts/{id}/camera          estado de la cámara del afectado
  GET  /api/alerts/{id}/camera/frame    imagen en vivo
  GET  /api/alerts/{id}/evidence        imágenes guardadas como evidencia

Avisos:
  GET  /api/push/key · POST /api/push/subscribe · POST /api/push/unsubscribe
"""

from __future__ import annotations

import asyncio
import sqlite3
from datetime import UTC, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Header, HTTPException, Request, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

from ..config import settings
from ..db import get_db, now_iso
from ..security import RateLimiter, client_ip, merchant_from_code
from ..services import camera, push
from ..services.events import broadcaster
from ..services.images import InvalidImage, sanitize_image

router = APIRouter(prefix="/api", tags=["cámara"])

# Una imagen por segundo como máximo por comercio (el modo alerta sube cada ~1 s)
frame_limiter = RateLimiter(70)
view_limiter = RateLimiter(120)


def require_merchant(
    db: Annotated[sqlite3.Connection, Depends(get_db)],
    x_merchant_code: Annotated[str | None, Header()] = None,
) -> sqlite3.Row:
    merchant = merchant_from_code(db, x_merchant_code)
    if not merchant:
        raise HTTPException(401, "Necesita el código de acceso de un comercio verificado.")
    return merchant


def camera_settings(merchant: sqlite3.Row) -> dict:
    return {
        "mode": merchant["camera_mode"],
        "enabled": bool(merchant["camera_enabled"]),
        "ip_configured": bool(merchant["camera_url"]),
        "ip_status": merchant["camera_url_status"],
        "consent_at": merchant["camera_consent_at"],
        "device_online": camera.device_online(merchant["id"]),
        "window_minutes": settings.camera_window_minutes,
    }


@router.get("/merchants/me")
def me(merchant: Annotated[sqlite3.Row, Depends(require_merchant)]) -> dict:
    return {
        "id": merchant["id"],
        "name": merchant["name"],
        "business": merchant["business"],
        "network_id": merchant["network_id"],
        "community_id": merchant["community_id"],
        "camera": camera_settings(merchant),
    }


class CameraConfig(BaseModel):
    mode: Literal["ninguna", "dispositivo", "ip"]
    enabled: bool
    # obligatorio para activar: el local tiene aviso de videovigilancia
    consent: bool = False
    url: str | None = Field(default=None, max_length=500)


@router.put("/merchants/me/camera")
def configure_camera(
    body: CameraConfig,
    db: Annotated[sqlite3.Connection, Depends(get_db)],
    merchant: Annotated[sqlite3.Row, Depends(require_merchant)],
) -> dict:
    if body.enabled and body.mode != "ninguna" and not body.consent and not merchant["camera_consent_at"]:
        raise HTTPException(422, "Para activar la cámara confirme que el local tiene aviso de videovigilancia.")
    url, url_status = merchant["camera_url"], merchant["camera_url_status"]
    if body.mode == "ip" and body.url is not None and body.url.strip() != (merchant["camera_url"] or ""):
        try:
            url = camera.validate_camera_url(body.url)
        except camera.CameraError as error:
            raise HTTPException(422, str(error)) from error
        url_status = "pendiente"  # una dirección nueva siempre la revisa un moderador
    if body.mode == "ip" and not url:
        raise HTTPException(422, "Escriba la dirección de la cámara IP.")
    db.execute(
        """UPDATE merchants SET camera_mode = ?, camera_enabled = ?, camera_url = ?, camera_url_status = ?,
                  camera_consent_at = COALESCE(camera_consent_at, ?) WHERE id = ?""",
        (
            body.mode,
            int(body.enabled and body.mode != "ninguna"),
            url,
            url_status,
            now_iso() if body.consent else None,
            merchant["id"],
        ),
    )
    updated = db.execute("SELECT * FROM merchants WHERE id = ?", (merchant["id"],)).fetchone()
    return camera_settings(updated)


@router.post("/merchants/me/camera/frame", status_code=204)
async def upload_frame(
    request: Request,
    merchant: Annotated[sqlite3.Row, Depends(require_merchant)],
    image: Annotated[UploadFile, File()],
) -> Response:
    frame_limiter.check(f"m{merchant['id']}:{client_ip(request)}")
    if merchant["camera_mode"] != "dispositivo" or not merchant["camera_enabled"]:
        raise HTTPException(409, "Active el modo cámara de este dispositivo en «Mi comercio».")
    data = await image.read(settings.max_frame_bytes + 1)
    if len(data) > settings.max_frame_bytes:
        raise HTTPException(413, "La imagen es demasiado grande.")
    try:
        clean = await asyncio.to_thread(sanitize_image, data)  # valida y quita metadatos
    except InvalidImage as error:
        raise HTTPException(415, str(error)) from error
    camera.store_frame(merchant["id"], clean.data)
    return Response(status_code=204)


def _alert(db: sqlite3.Connection, alert_id: int) -> sqlite3.Row:
    row = db.execute("SELECT * FROM alerts WHERE id = ? AND status IN ('sin_verificar', 'verificada')", (alert_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Alerta no encontrada.")
    return row


@router.get("/alerts/{alert_id}/camera")
def alert_camera(alert_id: int, db: Annotated[sqlite3.Connection, Depends(get_db)]) -> dict:
    return camera.camera_info(db, _alert(db, alert_id))


@router.get("/alerts/{alert_id}/camera/frame")
async def alert_camera_frame(alert_id: int, request: Request, db: Annotated[sqlite3.Connection, Depends(get_db)]) -> Response:
    view_limiter.check(client_ip(request))
    alert = _alert(db, alert_id)
    if datetime.now(UTC) >= camera.window_end(alert["created_at"]):
        raise HTTPException(410, "La transmisión de esta alerta ya terminó.")
    merchant = db.execute("SELECT * FROM merchants WHERE id = ?", (alert["affected_merchant_id"],)).fetchone()
    if not camera.camera_ready(merchant):
        raise HTTPException(404, "El comercio afectado no tiene cámara activa.")
    if merchant["camera_mode"] == "dispositivo":
        frame = camera.latest_frame(merchant["id"])
        if not frame:
            raise HTTPException(503, "La cámara del local no está enviando imagen en este momento.")
        data = frame.data
    else:
        try:
            raw = await asyncio.to_thread(camera.fetch_ip_frame, merchant["camera_url"])
            data = (await asyncio.to_thread(sanitize_image, raw)).data
        except (camera.CameraError, InvalidImage) as error:
            raise HTTPException(503, str(error)) from error
    return Response(data, media_type="image/jpeg", headers={"Cache-Control": "no-store"})


@router.get("/alerts/{alert_id}/evidence")
def alert_evidence(alert_id: int, db: Annotated[sqlite3.Connection, Depends(get_db)]) -> list[dict]:
    _alert(db, alert_id)
    rows = db.execute("SELECT file, captured_at FROM alert_evidence WHERE alert_id = ? ORDER BY id", (alert_id,)).fetchall()
    return [{"url": f"/api/uploads/{row['file']}", "captured_at": row["captured_at"]} for row in rows]


# ---------------------------------------------------------------------------
# Notificaciones push
# ---------------------------------------------------------------------------


@router.get("/push/key")
def push_key() -> dict:
    return {"key": push.public_key()}


class PushKeys(BaseModel):
    p256dh: str = Field(max_length=200)
    auth: str = Field(max_length=100)


class PushSubscription(BaseModel):
    endpoint: str = Field(max_length=1000)
    keys: PushKeys
    network_id: str = Field(min_length=2, max_length=64)
    community_id: str | None = Field(default=None, max_length=64)


@router.post("/push/subscribe", status_code=201)
def subscribe(
    body: PushSubscription,
    db: Annotated[sqlite3.Connection, Depends(get_db)],
    x_merchant_code: Annotated[str | None, Header()] = None,
) -> dict:
    if not body.endpoint.startswith("https://"):
        raise HTTPException(422, "Suscripción no válida.")
    merchant = merchant_from_code(db, x_merchant_code)
    db.execute(
        """INSERT INTO push_subscriptions (endpoint, p256dh, auth, network_id, community_id, merchant_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(endpoint) DO UPDATE SET network_id = excluded.network_id,
               community_id = excluded.community_id, merchant_id = excluded.merchant_id""",
        (
            body.endpoint,
            body.keys.p256dh,
            body.keys.auth,
            body.network_id,
            body.community_id,
            merchant["id"] if merchant else None,
            now_iso(),
        ),
    )
    return {"ok": True}


class PushEndpoint(BaseModel):
    endpoint: str = Field(max_length=1000)


@router.post("/push/unsubscribe")
def unsubscribe(body: PushEndpoint, db: Annotated[sqlite3.Connection, Depends(get_db)]) -> dict:
    db.execute("DELETE FROM push_subscriptions WHERE endpoint = ?", (body.endpoint,))
    return {"ok": True}


def broadcast_camera_alert(alert: dict) -> None:
    """Avisa por el flujo en vivo y por push (el modo cámara del afectado sube el ritmo)."""
    broadcaster.publish("alert", alert)
    push.notify_alert(alert)
