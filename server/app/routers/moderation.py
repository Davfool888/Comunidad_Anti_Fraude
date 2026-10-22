"""Panel de moderación: requiere la cabecera X-Moderator-Token.

La moderación evita falsas acusaciones: una alerta puede publicarse al
instante como «sin verificar», pero sólo un moderador la marca como
«verificada» o la rechaza (y al rechazarla se retiran sus identificadores de
la base de reportes).
"""

from __future__ import annotations

import json
import re
import sqlite3
import unicodedata
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..config import settings
from ..db import get_db, now_iso, row_to_dict
from ..security import clean_text, require_moderator
from ..seed import CATEGORIES
from ..services import ai
from ..services.events import broadcaster
from .alerts import public_alert

router = APIRouter(prefix="/api/moderation", tags=["moderación"], dependencies=[Depends(require_moderator)])


@router.get("/check")
def check() -> dict:
    return {"ok": True}


@router.get("/alerts")
def alerts(db: Annotated[sqlite3.Connection, Depends(get_db)], status: str | None = None, limit: int = 100) -> list[dict]:
    query = "SELECT * FROM alerts"
    params: list = []
    if status:
        query += " WHERE status = ?"
        params.append(status)
    query += " ORDER BY CASE status WHEN 'pendiente' THEN 0 WHEN 'sin_verificar' THEN 1 ELSE 2 END, created_at DESC LIMIT ?"
    params.append(max(1, min(limit, 500)))
    return [public_alert(row) for row in db.execute(query, params).fetchall()]


class AlertReview(BaseModel):
    status: Literal["verificada", "rechazada", "sin_verificar"]
    note: str | None = Field(default=None, max_length=300)
    level: Literal["danger", "warning", "info"] | None = None


@router.patch("/alerts/{alert_id}")
def review_alert(alert_id: int, body: AlertReview, db: Annotated[sqlite3.Connection, Depends(get_db)]) -> dict:
    row = db.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Alerta no encontrada.")
    db.execute(
        "UPDATE alerts SET status = ?, review_note = ?, reviewed_at = ?, level = COALESCE(?, level) WHERE id = ?",
        (body.status, clean_text(body.note, 300) or None, now_iso(), body.level, alert_id),
    )
    if body.status == "rechazada":
        # Una alerta falsa no debe seguir marcando a nadie como estafador
        db.execute("DELETE FROM reported_entities WHERE alert_id = ?", (alert_id,))
    alert = public_alert(db.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone())
    broadcaster.publish("alert_removed" if body.status == "rechazada" else "alert_update", alert)
    return alert


@router.get("/merchants")
def merchants(db: Annotated[sqlite3.Connection, Depends(get_db)], status: str | None = None) -> list[dict]:
    query = "SELECT * FROM merchants"
    params: list = []
    if status:
        query += " WHERE status = ?"
        params.append(status)
    return [dict(row) for row in db.execute(query + " ORDER BY created_at DESC", params).fetchall()]


class MerchantReview(BaseModel):
    status: Literal["verificado", "rechazado", "pendiente"]


@router.patch("/merchants/{merchant_id}")
def review_merchant(merchant_id: int, body: MerchantReview, db: Annotated[sqlite3.Connection, Depends(get_db)]) -> dict:
    updated = db.execute(
        "UPDATE merchants SET status = ?, reviewed_at = ? WHERE id = ?", (body.status, now_iso(), merchant_id)
    ).rowcount
    if not updated:
        raise HTTPException(404, "Comercio no encontrado.")
    return dict(db.execute("SELECT * FROM merchants WHERE id = ?", (merchant_id,)).fetchone())


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = "".join(char for char in text if unicodedata.category(char) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")[:60]


@router.post("/modalities/generate")
async def generate_modalities(db: Annotated[sqlite3.Connection, Depends(get_db)], min_reports: int = 2) -> dict:
    """Crea retos nuevos a partir de las modalidades que más reporta la comunidad.

    Toma las categorías con al menos `min_reports` alertas no rechazadas en
    los últimos 30 días que aún no tienen una ficha generada este mes.
    """
    rows = db.execute(
        """SELECT category, COUNT(*) AS total FROM alerts
           WHERE status != 'rechazada' AND created_at >= datetime('now', '-30 days') AND category != 'otro'
           GROUP BY category HAVING total >= ? ORDER BY total DESC LIMIT 3""",
        (max(1, min_reports),),
    ).fetchall()

    created: list[dict] = []
    skipped: list[str] = []
    for row in rows:
        category = row["category"]
        recent_generated = db.execute(
            "SELECT 1 FROM modalities WHERE category = ? AND origin != 'curada' AND created_at >= datetime('now', '-30 days')",
            (category,),
        ).fetchone()
        if recent_generated:
            skipped.append(f"{CATEGORIES[category]}: ya tiene una ficha reciente")
            continue

        samples = [
            f"{alert['title']}: {alert['description']}"
            for alert in db.execute(
                "SELECT title, description FROM alerts WHERE category = ? AND status != 'rechazada' ORDER BY created_at DESC LIMIT 12",
                (category,),
            ).fetchall()
        ]
        if settings.ai_enabled:
            try:
                fiche = await ai.generate_modality(category, samples)
                origin = "comunidad-ia"
            except ai.AIUnavailable as error:
                skipped.append(f"{CATEGORIES[category]}: {error}")
                continue
        else:
            fiche = _template_modality(category, samples)
            origin = "comunidad"

        options = fiche["challenge"]["options"]
        if not options or sum(1 for option in options if option["correct"]) != 1:
            skipped.append(f"{CATEGORIES[category]}: el reto generado no era válido")
            continue

        slug = f"{_slugify(fiche['title'])}-{now_iso()[:10]}"
        db.execute(
            """INSERT OR IGNORE INTO modalities
               (slug, title, category, channel, summary, red_flags, protect, challenge, origin, reports, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                slug,
                fiche["title"][:140],
                category,
                fiche["channel"][:80],
                fiche["summary"][:1200],
                json.dumps(fiche["red_flags"][:6], ensure_ascii=False),
                json.dumps(fiche["protect"][:6], ensure_ascii=False),
                json.dumps(fiche["challenge"], ensure_ascii=False),
                origin,
                row["total"],
                now_iso(),
            ),
        )
        created.append(row_to_dict(db.execute("SELECT * FROM modalities WHERE slug = ?", (slug,)).fetchone(), ("red_flags", "protect", "challenge")))

    return {"created": created, "skipped": skipped}


def _template_modality(category: str, samples: list[str]) -> dict:
    """Ficha básica sin IA, construida con los reportes recientes."""
    label = CATEGORIES[category]
    example = samples[0] if samples else "Un caso reportado por la comunidad."
    return {
        "title": f"Alerta de la comunidad: {label.lower()}",
        "channel": "Reportado por comercios de la red",
        "summary": f"Varios comercios han reportado esta modalidad en los últimos días. Ejemplo: {example[:300]}",
        "red_flags": [
            "Le piden dinero, códigos o datos por un canal no oficial",
            "Hay prisa o presión para actuar",
            "El remitente no se puede verificar",
        ],
        "protect": [
            "Verifique por un canal oficial que usted conozca",
            "No entregue mercancía sin ver el pago en su propia app",
            "Reporte el caso a la red",
        ],
        "challenge": {
            "question": f"Un caso de «{label.lower()}» le llega a su comercio. ¿Qué es lo primero que hace?",
            "options": [
                {"text": "Actúo rápido para no perder la venta", "correct": False, "feedback": "La prisa es justo lo que buscan los estafadores."},
                {"text": "Verifico por un canal oficial y consulto la red", "correct": True, "feedback": "Correcto: verificar y avisar protege a todo el barrio."},
                {"text": "Respondo pidiendo más datos", "correct": False, "feedback": "Responder les confirma que usted es un objetivo activo."},
            ],
            "explanation": "Ante cualquier modalidad: pare, verifique por un canal oficial y avise a la red.",
        },
    }
