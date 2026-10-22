"""Endpoints de análisis: mensajes (texto, voz, imágenes) y enlaces."""

from __future__ import annotations

import asyncio
import json
import sqlite3
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile

from ..config import settings
from ..db import get_db
from ..security import clean_text, limit_ai
from ..services import transcribe
from ..services.analysis import entity_reports, run_analysis
from ..services.entities import extract_entities, normalize_url, url_domain
from ..services.images import CleanImage, InvalidImage, sanitize_image
from ..services.links import analyze_link

router = APIRouter(prefix="/api", tags=["análisis"])

AUDIO_TYPES = {"audio/ogg", "audio/opus", "audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/webm", "audio/aac"}
AUDIO_EXT = (".ogg", ".opus", ".mp3", ".m4a", ".wav", ".webm", ".aac")


@router.get("/status")
def status() -> dict:
    return {
        "ai_enabled": settings.ai_enabled,
        "provider": settings.ai_provider,
        "model": settings.ai_model,
        "server_transcription": transcribe.available(),
        "alerts_auto_publish": settings.alerts_auto_publish,
    }


@router.post("/analyze", dependencies=[Depends(limit_ai)])
async def analyze(
    db: Annotated[sqlite3.Connection, Depends(get_db)],
    text: Annotated[str, Form()] = "",
    source: Annotated[str, Form()] = "texto",
    network_id: Annotated[str | None, Form()] = None,
    ocr_text: Annotated[str, Form()] = "",
    history: Annotated[str, Form(max_length=12000)] = "",
    files: Annotated[list[UploadFile] | None, File()] = None,
) -> dict:
    text = clean_text(text, settings.max_text_chars)
    ocr_text = clean_text(ocr_text, settings.max_text_chars)
    turns = parse_history(history)
    source = source if source in {"voz", "texto", "evidencia"} else "texto"
    files = files or []
    if len(files) > settings.max_files:
        raise HTTPException(413, f"Máximo {settings.max_files} archivos por análisis.")

    images: list[CleanImage] = []
    transcripts: list[str] = []
    notes: list[str] = []
    for upload in files:
        name = (upload.filename or "archivo").lower()
        content_type = (upload.content_type or "").lower()
        is_audio = content_type in AUDIO_TYPES or name.endswith(AUDIO_EXT)
        limit = settings.max_audio_bytes if is_audio else settings.max_image_bytes
        data = await upload.read(limit + 1)
        if len(data) > limit:
            raise HTTPException(413, f"«{upload.filename}» supera el tamaño permitido.")

        if is_audio:
            if transcribe.available():
                transcripts.append(await asyncio.to_thread(transcribe.transcribe, data, name))
            else:
                notes.append(
                    f"No se pudo transcribir «{upload.filename}» en el servidor: use «Pulsar para hablar» "
                    "o escriba lo que dice el audio."
                )
            continue
        if content_type.startswith("image/") or name.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".heic")):
            try:
                images.append(sanitize_image(data))
            except InvalidImage as error:
                raise HTTPException(415, f"«{upload.filename}»: {error}") from error
            continue
        if name.endswith((".txt", ".md")):
            text = (text + "\n" + clean_text(data.decode("utf-8", "ignore"), settings.max_text_chars)).strip()
            continue
        raise HTTPException(415, f"Tipo de archivo no soportado: «{upload.filename}».")

    if not text and not images and not transcripts and not ocr_text:
        raise HTTPException(422, "Envíe un mensaje, una captura o una nota de voz para analizar.")

    if transcripts:
        source = "voz"
    result = await run_analysis(
        db,
        text=text,
        images=images,
        source=source,
        network_id=clean_text(network_id, 64) or None,
        client_ocr_text=ocr_text,
        transcript="\n".join(transcripts),
        history=turns,
    )
    result["notes"] = notes
    return result


def parse_history(raw: str) -> list[dict]:
    """Últimos turnos de la conversación: `[{role, text}]`, acotados y saneados."""
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    turns = []
    for item in data[-6:]:
        if not isinstance(item, dict):
            continue
        role = "assistant" if item.get("role") == "assistant" else "user"
        text = clean_text(str(item.get("text", "")), 1200)
        if text:
            turns.append({"role": role, "text": text})
    return turns


@router.get("/links/check", dependencies=[Depends(limit_ai)])
def check_link(db: Annotated[sqlite3.Connection, Depends(get_db)], url: str = Query(..., max_length=2048)) -> dict:
    entities = [entity for entity in extract_entities(url) if entity.kind == "enlace"]
    if entities:
        entity = entities[0]
        return analyze_link(entity.masked, entity.domain or "", entity_reports(db, entity)).as_dict()
    normalized = normalize_url(url.strip())
    domain = url_domain(normalized)
    if "." not in domain:
        raise HTTPException(422, "No parece un enlace válido.")
    return analyze_link(normalized, domain).as_dict()
