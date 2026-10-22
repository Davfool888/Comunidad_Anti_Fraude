"""Chat del barrio: mensajes reales entre comercios y vecinos, en vivo.

Los mensajes llegan a todos los conectados por el mismo flujo SSE de las
alertas (`event: chat`). Medidas propias de un canal comunitario:

- Límite de mensajes por IP y longitud máxima.
- Se ocultan cédulas, tarjetas, correos y direcciones del texto.
- Los enlaces que alguien publica se revisan: si imitan a un banco o son de
  riesgo, el mensaje se marca para que nadie caiga (los estafadores también
  escriben en los grupos del barrio).
- Sólo un comercio con código de acceso válido aparece como «verificado»;
  el resto aparece con el nombre que elija, marcado como vecino.
"""

from __future__ import annotations

import json
import sqlite3
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field

from ..db import get_db, now_iso
from ..security import clean_text, limit_writes, merchant_from_code, redact_personal_data, reporter_hash
from ..services.entities import extract_entities
from ..services.events import broadcaster
from ..services.links import analyze_link

router = APIRouter(prefix="/api", tags=["chat"])


def public_message(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "network_id": row["network_id"],
        "community_id": row["community_id"],
        "author": row["author"],
        "verified": row["merchant_id"] is not None,
        "text": row["text"],
        "risky_links": json.loads(row["risky_links"] or "[]"),
        "created_at": row["created_at"],
    }


@router.get("/chat")
def list_messages(
    db: Annotated[sqlite3.Connection, Depends(get_db)],
    community_id: str,
    limit: int = 80,
) -> list[dict]:
    rows = db.execute(
        """SELECT * FROM (
               SELECT * FROM chat_messages WHERE community_id = ? AND hidden = 0
               ORDER BY created_at DESC, id DESC LIMIT ?
           ) ORDER BY created_at, id""",
        (community_id, max(1, min(limit, 200))),
    ).fetchall()
    return [public_message(row) for row in rows]


class NewMessage(BaseModel):
    network_id: str = Field(min_length=2, max_length=64)
    community_id: str = Field(min_length=2, max_length=64)
    author: str = Field(default="Vecino", max_length=40)
    text: str = Field(min_length=1, max_length=1000)


@router.post("/chat", dependencies=[Depends(limit_writes)], status_code=201)
def post_message(
    body: NewMessage,
    request: Request,
    db: Annotated[sqlite3.Connection, Depends(get_db)],
    x_merchant_code: Annotated[str | None, Header()] = None,
) -> dict:
    text = redact_personal_data(clean_text(body.text, 1000))
    if not text:
        raise HTTPException(422, "Escriba un mensaje.")

    merchant = merchant_from_code(db, x_merchant_code)
    if merchant:
        author = merchant["name"]
    else:
        # un vecino no puede hacerse pasar por la red ni por un comercio verificado
        author = clean_text(body.author, 40) or "Vecino"
        if author.lower().startswith(("red segura", "moderador", "admin", "soporte")):
            author = "Vecino"

    risky = []
    for entity in extract_entities(text):
        if entity.kind != "enlace" or not entity.domain:
            continue
        report = analyze_link(entity.masked, entity.domain, check_age=False)
        if report.risk != "bajo":
            risky.append({"domain": report.domain, "risk": report.risk, "reason": report.reasons[0]})

    cursor = db.execute(
        """INSERT INTO chat_messages (network_id, community_id, author, merchant_id, text, risky_links, reporter_hash, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            body.network_id,
            body.community_id,
            author,
            merchant["id"] if merchant else None,
            text,
            json.dumps(risky, ensure_ascii=False),
            reporter_hash(request),
            now_iso(),
        ),
    )
    db.commit()
    message = public_message(db.execute("SELECT * FROM chat_messages WHERE id = ?", (cursor.lastrowid,)).fetchone())
    broadcaster.publish("chat", message)
    return message
