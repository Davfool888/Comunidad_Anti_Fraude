"""Notificaciones Web Push: avisos de alerta aunque la página esté cerrada.

El estándar exige un par de claves VAPID para firmar los avisos. Se generan
la primera vez y se guardan en `server/data/vapid_private.pem` (fuera de git).
Los envíos van en un hilo aparte para no demorar la publicación de la alerta.
"""

from __future__ import annotations

import base64
import json
import logging
import sqlite3
import threading
from functools import lru_cache

from cryptography.hazmat.primitives import serialization
from py_vapid import Vapid02
from pywebpush import WebPushException, webpush

from ..config import settings
from ..db import connect

log = logging.getLogger("red_segura.push")


@lru_cache(maxsize=1)
def _vapid() -> Vapid02:
    path = settings.database_path.parent / "vapid_private.pem"
    if path.exists():
        return Vapid02.from_file(str(path))
    vapid = Vapid02()
    vapid.generate_keys()
    path.parent.mkdir(parents=True, exist_ok=True)
    vapid.save_key(str(path))
    return vapid


def public_key() -> str:
    """Clave pública en el formato que pide `pushManager.subscribe` (base64url)."""
    raw = _vapid().public_key.public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _targets(conn: sqlite3.Connection, alert: dict) -> list[sqlite3.Row]:
    return conn.execute(
        """SELECT * FROM push_subscriptions
           WHERE network_id = ? AND (community_id IS NULL OR ? IS NULL OR community_id = ?)""",
        (alert["network_id"], alert.get("community_id"), alert.get("community_id")),
    ).fetchall()


def _send(alert: dict) -> None:
    affected_id = (alert.get("affected_merchant") or {}).get("id")
    conn = connect()
    try:
        for row in _targets(conn, alert):
            mine = affected_id is not None and row["merchant_id"] == affected_id
            payload = {
                "title": ("🚨 ALERTA EN SU COMERCIO: " if mine else "Alerta de la red: ") + alert["title"],
                "body": (alert.get("category_label") or "")
                + (" · Cámara del local en vivo" if (alert.get("camera") or {}).get("available") else ""),
                "alertId": alert["id"],
                "level": alert["level"],
                "urgent": mine or alert["level"] == "danger",
            }
            try:
                webpush(
                    subscription_info={"endpoint": row["endpoint"], "keys": {"p256dh": row["p256dh"], "auth": row["auth"]}},
                    data=json.dumps(payload, ensure_ascii=False),
                    vapid_private_key=_vapid(),
                    vapid_claims={"sub": settings.vapid_subject},
                    ttl=1800,
                    timeout=6,
                )
            except WebPushException as error:
                status = getattr(error.response, "status_code", None)
                if status in (404, 410):  # la suscripción ya no existe: se limpia
                    conn.execute("DELETE FROM push_subscriptions WHERE id = ?", (row["id"],))
                    conn.commit()
                else:
                    log.info("No se pudo enviar el aviso push: %s", status or error)
            except Exception as error:  # noqa: BLE001 - un fallo de red no debe romper el resto de envíos
                log.info("Fallo al enviar aviso push: %s", error)
    finally:
        conn.close()


def notify_alert(alert: dict) -> None:
    threading.Thread(target=_send, args=(alert,), daemon=True).start()
