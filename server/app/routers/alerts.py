"""Alertas de la red comunitaria: publicación, consulta y difusión en vivo."""

from __future__ import annotations

import asyncio
import json
import re
import secrets
import sqlite3
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, StreamingResponse

from ..config import settings
from ..db import get_db, now_iso, row_to_dict
from ..security import clean_text, limit_writes, pseudonym, redact_personal_data, reporter_hash
from ..seed import CATEGORIES
from ..services import ai
from ..services.entities import extract_entities
from ..services.events import broadcaster
from ..services.images import InvalidImage, sanitize_image

router = APIRouter(prefix="/api", tags=["alertas"])

PUBLIC_STATUSES = ("sin_verificar", "verificada")
WEAPON_LABELS = {"cuchillo", "arma_de_fuego", "arma_blanca"}


def public_alert(row: sqlite3.Row | dict) -> dict:
    data = row_to_dict(row, ("entities", "threat")) if isinstance(row, sqlite3.Row) else dict(row)
    data.pop("reporter_hash", None)
    data["image_url"] = f"/api/uploads/{data['image_path']}" if data.get("image_path") else None
    data.pop("image_path", None)
    data["category_label"] = CATEGORIES.get(data.get("category", "otro"), CATEGORIES["otro"])
    return data


@router.get("/alerts")
def list_alerts(
    db: Annotated[sqlite3.Connection, Depends(get_db)],
    network_id: str | None = None,
    community_id: str | None = None,
    limit: int = 50,
) -> list[dict]:
    query = f"SELECT * FROM alerts WHERE status IN {PUBLIC_STATUSES}"
    params: list = []
    if network_id:
        query += " AND network_id = ?"
        params.append(network_id)
    if community_id:
        query += " AND community_id = ?"
        params.append(community_id)
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(max(1, min(limit, 200)))
    return [public_alert(row) for row in db.execute(query, params).fetchall()]


@router.post("/alerts", dependencies=[Depends(limit_writes)], status_code=201)
async def create_alert(
    request: Request,
    db: Annotated[sqlite3.Connection, Depends(get_db)],
    network_id: Annotated[str, Form(max_length=64)],
    title: Annotated[str, Form(max_length=140)],
    description: Annotated[str, Form(max_length=2000)],
    level: Annotated[str, Form()] = "warning",
    category: Annotated[str, Form()] = "otro",
    community_id: Annotated[str | None, Form(max_length=64)] = None,
    business_name: Annotated[str | None, Form(max_length=120)] = None,
    lat: Annotated[float | None, Form()] = None,
    lng: Annotated[float | None, Form()] = None,
    identifiers: Annotated[str, Form(max_length=1000)] = "",
    client_threats: Annotated[str, Form(max_length=4000)] = "",
    image: Annotated[UploadFile | None, File()] = None,
) -> dict:
    level = level if level in {"danger", "warning", "info"} else "warning"
    category = category if category in CATEGORIES else "otro"
    title = redact_personal_data(clean_text(title, 140))
    description = redact_personal_data(clean_text(description, 2000))
    if len(title) < 4 or len(description) < 10:
        raise HTTPException(422, "Escriba un título y una descripción que expliquen lo ocurrido.")
    in_colombia = lat is not None and lng is not None and -5 <= lat <= 14 and -82 <= lng <= -66
    if not in_colombia:
        lat = lng = None  # sin coordenadas o fuera de Colombia: se ubica en el barrio

    # Imagen: se limpia el EXIF y se revisa en busca de armas o violencia
    image_path = None
    threat: dict | None = None
    if image is not None and image.filename:
        data = await image.read(settings.max_image_bytes + 1)
        if len(data) > settings.max_image_bytes:
            raise HTTPException(413, "La imagen supera el tamaño permitido.")
        try:
            clean = sanitize_image(data)
        except InvalidImage as error:
            raise HTTPException(415, str(error)) from error
        image_path = f"{secrets.token_hex(12)}.jpg"
        (settings.uploads_dir / image_path).write_bytes(clean.data)

        if settings.ai_enabled:
            try:
                scan = await ai.scan_alert_image(clean, description)
                threat = {**scan["threats"], "engine": settings.ai_provider, "suspect_description": scan["suspect_description"]}
                if scan["recommended_level"] == "danger":
                    level = "danger"
            except ai.AIUnavailable:
                threat = None
        if threat is None and client_threats:
            # Resultado del detector del navegador (MediaPipe), si la IA no respondió
            try:
                parsed = json.loads(client_threats)
                items = [
                    {"label": str(item.get("label", "otro"))[:40], "description": str(item.get("description", ""))[:200], "confidence": str(item.get("confidence", "media"))[:10]}
                    for item in parsed.get("items", [])[:10]
                ]
                threat = {"detected": bool(items), "items": items, "summary": str(parsed.get("summary", ""))[:300], "engine": "navegador"}
            except (json.JSONDecodeError, AttributeError):
                threat = None
        if threat and any(item["label"] in WEAPON_LABELS for item in threat.get("items", [])):
            level = "danger"

    # Identificadores del estafador: se guardan con hash y se muestran enmascarados
    entities = extract_entities(f"{identifiers}\n{description}")
    status = "sin_verificar" if settings.alerts_auto_publish else "pendiente"
    created = now_iso()
    cursor = db.execute(
        """INSERT INTO alerts (network_id, community_id, business_name, lat, lng, level, category, title,
                               description, entities, image_path, threat, status, reporter_hash, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            clean_text(network_id, 64),
            clean_text(community_id, 64) or None,
            clean_text(business_name, 120) or None,
            lat,
            lng,
            level,
            category,
            title,
            description,
            json.dumps([entity.public() for entity in entities], ensure_ascii=False),
            image_path,
            json.dumps(threat, ensure_ascii=False) if threat else None,
            status,
            reporter_hash(request),
            created,
        ),
    )
    alert_id = cursor.lastrowid
    for entity in entities:
        db.execute(
            """INSERT INTO reported_entities (kind, value_hash, masked, domain, category, alert_id, network_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (entity.kind, pseudonym(entity.value), entity.masked, entity.domain, category, alert_id, network_id, created),
        )
    db.commit()

    alert = public_alert(db.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone())
    if status in PUBLIC_STATUSES:
        broadcaster.publish("alert", alert)
    return alert


@router.post("/alerts/{alert_id}/confirm", dependencies=[Depends(limit_writes)])
def confirm_alert(alert_id: int, request: Request, db: Annotated[sqlite3.Connection, Depends(get_db)]) -> dict:
    """«A mí también me pasó»: un voto por persona (seudónimo de IP)."""
    row = db.execute(f"SELECT id FROM alerts WHERE id = ? AND status IN {PUBLIC_STATUSES}", (alert_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Alerta no encontrada.")
    inserted = db.execute(
        "INSERT OR IGNORE INTO alert_confirmations (alert_id, reporter_hash) VALUES (?, ?)",
        (alert_id, reporter_hash(request)),
    ).rowcount
    if inserted:
        db.execute("UPDATE alerts SET confirmations = confirmations + 1 WHERE id = ?", (alert_id,))
    alert = public_alert(db.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone())
    broadcaster.publish("alert_update", alert)
    return alert


@router.get("/alerts/stream")
async def stream_alerts(request: Request) -> StreamingResponse:
    queue = broadcaster.subscribe()

    async def events():
        try:
            yield "retry: 5000\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=20)
                    yield message
                except TimeoutError:
                    yield ": ping\n\n"  # mantiene viva la conexión a través de proxies
        finally:
            broadcaster.unsubscribe(queue)

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


_UPLOAD_NAME = re.compile(r"^[0-9a-f]{24}\.jpg$")


@router.get("/uploads/{name}")
def get_upload(name: str, db: Annotated[sqlite3.Connection, Depends(get_db)]) -> FileResponse:
    # Nombre estricto: impide recorrer directorios (../)
    if not _UPLOAD_NAME.match(name):
        raise HTTPException(404, "No encontrado.")
    row = db.execute("SELECT status FROM alerts WHERE image_path = ?", (name,)).fetchone()
    if not row or row["status"] == "rechazada":
        raise HTTPException(404, "No encontrado.")
    path = settings.uploads_dir / name
    if not path.is_file():
        raise HTTPException(404, "No encontrado.")
    return FileResponse(path, media_type="image/jpeg", headers={"Cache-Control": "private, max-age=3600"})
