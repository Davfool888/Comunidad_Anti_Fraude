"""Base comunitaria de reportes, comercios verificados, modalidades y tendencias."""

from __future__ import annotations

import sqlite3
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..db import get_db, now_iso, row_to_dict
from ..security import clean_text, limit_ai, limit_writes, merchant_from_code, pseudonym
from ..seed import CATEGORIES
from ..services.entities import extract_entities

router = APIRouter(prefix="/api", tags=["comunidad"])


# ---------------------------------------------------------------------------
# Números, cuentas y enlaces reportados
# ---------------------------------------------------------------------------


@router.get("/reports/lookup")
def lookup(db: Annotated[sqlite3.Connection, Depends(get_db)], value: str = Query(..., min_length=3, max_length=300)) -> dict:
    """¿Este número, cuenta o enlace ya fue reportado? No revela quién lo reportó."""
    entities = extract_entities(value)
    if not entities:
        raise HTTPException(422, "Escriba un teléfono, una cuenta, un correo o un enlace.")
    results = []
    for entity in entities:
        if entity.kind == "enlace" and entity.domain:
            rows = db.execute(
                "SELECT category, created_at FROM reported_entities WHERE kind = 'enlace' AND domain = ? ORDER BY created_at DESC",
                (entity.domain,),
            ).fetchall()
        else:
            rows = db.execute(
                "SELECT category, created_at FROM reported_entities WHERE value_hash = ? ORDER BY created_at DESC",
                (pseudonym(entity.value),),
            ).fetchall()
        categories = sorted({row["category"] for row in rows if row["category"]})
        results.append(
            {
                **entity.public(),
                "reports": len(rows),
                "last_report": rows[0]["created_at"] if rows else None,
                "categories": [CATEGORIES.get(category, category) for category in categories],
            }
        )
    return {"results": results}


# ---------------------------------------------------------------------------
# Comercios: solicitud de verificación
# ---------------------------------------------------------------------------


class MerchantRequest(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    business: str = Field(min_length=3, max_length=60)
    nit: str | None = Field(default=None, max_length=20)
    contact: str | None = Field(default=None, max_length=120)
    network_id: str = Field(min_length=2, max_length=64)
    community_id: str | None = Field(default=None, max_length=64)


@router.post("/merchants", dependencies=[Depends(limit_writes)], status_code=201)
def request_verification(body: MerchantRequest, db: Annotated[sqlite3.Connection, Depends(get_db)]) -> dict:
    cursor = db.execute(
        """INSERT INTO merchants (name, business, nit, contact, network_id, community_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            clean_text(body.name, 120),
            clean_text(body.business, 60),
            clean_text(body.nit, 20) or None,
            clean_text(body.contact, 120) or None,
            body.network_id,
            body.community_id,
            now_iso(),
        ),
    )
    return {"id": cursor.lastrowid, "status": "pendiente"}


class MerchantSession(BaseModel):
    code: str = Field(min_length=6, max_length=40)


@router.post("/merchants/session", dependencies=[Depends(limit_ai)])
def merchant_session(body: MerchantSession, db: Annotated[sqlite3.Connection, Depends(get_db)]) -> dict:
    """Comprueba el código de acceso de un comercio verificado.

    El límite por IP frena los intentos de adivinar códigos.
    """
    merchant = merchant_from_code(db, body.code)
    if not merchant:
        raise HTTPException(401, "El código no es válido o el comercio aún no está verificado.")
    return {
        "id": merchant["id"],
        "name": merchant["name"],
        "business": merchant["business"],
        "network_id": merchant["network_id"],
        "community_id": merchant["community_id"],
    }


@router.get("/merchants")
def verified_merchants(db: Annotated[sqlite3.Connection, Depends(get_db)], network_id: str | None = None) -> list[dict]:
    query = """SELECT id, name, business, network_id, community_id, reviewed_at,
                      (camera_enabled = 1 AND (camera_mode = 'dispositivo'
                        OR (camera_mode = 'ip' AND camera_url_status = 'aprobada'))) AS has_camera
               FROM merchants WHERE status = 'verificado'"""
    params: list = []
    if network_id:
        query += " AND network_id = ?"
        params.append(network_id)
    return [{**dict(row), "has_camera": bool(row["has_camera"])} for row in db.execute(query + " ORDER BY name", params).fetchall()]


# ---------------------------------------------------------------------------
# Centro de aprendizaje: modalidades vigentes
# ---------------------------------------------------------------------------


@router.get("/education/modalities")
def modalities(db: Annotated[sqlite3.Connection, Depends(get_db)]) -> list[dict]:
    rows = db.execute("SELECT * FROM modalities WHERE published = 1 ORDER BY created_at DESC, id DESC").fetchall()
    items = []
    for row in rows:
        data = row_to_dict(row, ("red_flags", "protect", "challenge"))
        recent = db.execute(
            "SELECT COUNT(*) FROM alerts WHERE category = ? AND status != 'rechazada' AND created_at >= datetime('now', '-30 days')",
            (data["category"],),
        ).fetchone()[0]
        data["recent_reports"] = int(recent)
        data["category_label"] = CATEGORIES.get(data["category"], CATEGORIES["otro"])
        items.append(data)
    # primero lo que más está golpeando a la comunidad
    return sorted(items, key=lambda item: (-item["recent_reports"], item["origin"] == "curada"))


# ---------------------------------------------------------------------------
# Tendencias
# ---------------------------------------------------------------------------


@router.get("/stats/community")
def community_stats(
    db: Annotated[sqlite3.Connection, Depends(get_db)],
    network_id: str,
    community_id: str | None = None,
) -> dict:
    """Cifras reales del barrio para la ventana de Comunidades (últimos 30 días)."""
    since = "-30 days"
    scope = "network_id = ?" + (" AND (community_id = ? OR community_id IS NULL)" if community_id else "")
    params = [network_id] + ([community_id] if community_id else [])
    alerts = db.execute(
        f"""SELECT COUNT(*) AS total,
                   SUM(CASE WHEN level = 'danger' THEN 1 ELSE 0 END) AS danger,
                   SUM(CASE WHEN status = 'verificada' THEN 1 ELSE 0 END) AS verified,
                   COALESCE(SUM(confirmations), 0) AS confirmations,
                   MAX(created_at) AS last_alert
            FROM alerts WHERE status != 'rechazada' AND created_at >= datetime('now', ?) AND {scope}""",
        [since, *params],
    ).fetchone()
    top = db.execute(
        f"""SELECT category, COUNT(*) AS total FROM alerts
            WHERE status != 'rechazada' AND created_at >= datetime('now', ?) AND category != 'otro' AND {scope}
            GROUP BY category ORDER BY total DESC LIMIT 1""",
        [since, *params],
    ).fetchone()
    analyses = db.execute(
        """SELECT COUNT(*) AS total, SUM(CASE WHEN verdict = 'fraude' THEN 1 ELSE 0 END) AS fraud
           FROM analyses WHERE network_id = ? AND created_at >= datetime('now', ?)""",
        (network_id, since),
    ).fetchone()
    merchants = db.execute(
        "SELECT COUNT(*) FROM merchants WHERE status = 'verificado' AND network_id = ?"
        + (" AND (community_id = ? OR community_id IS NULL)" if community_id else ""),
        params,
    ).fetchone()[0]
    return {
        "days": 30,
        "alerts": int(alerts["total"] or 0),
        "incidents": int(alerts["danger"] or 0),
        "verified_alerts": int(alerts["verified"] or 0),
        "confirmations": int(alerts["confirmations"] or 0),
        "last_alert_at": alerts["last_alert"],
        "top_category": (
            {"category": top["category"], "label": CATEGORIES.get(top["category"], top["category"]), "total": top["total"]}
            if top
            else None
        ),
        "analyses": int(analyses["total"] or 0),
        "frauds_detected": int(analyses["fraud"] or 0),
        "verified_merchants": int(merchants),
    }


@router.get("/stats/trends")
def trends(db: Annotated[sqlite3.Connection, Depends(get_db)], network_id: str | None = None, days: int = 30) -> dict:
    days = max(1, min(days, 365))
    since = f"-{days} days"
    network_clause = " AND network_id = ?" if network_id else ""
    params = [since] + ([network_id] if network_id else [])

    by_category = db.execute(
        f"""SELECT category, COUNT(*) AS total FROM (
                SELECT category, network_id, created_at FROM alerts WHERE status != 'rechazada'
                UNION ALL
                SELECT category, network_id, created_at FROM analyses WHERE verdict != 'limpio'
            ) WHERE created_at >= datetime('now', ?){network_clause}
            GROUP BY category ORDER BY total DESC""",
        params,
    ).fetchall()
    by_network = db.execute(
        """SELECT network_id, COUNT(*) AS total,
                  SUM(CASE WHEN level = 'danger' THEN 1 ELSE 0 END) AS danger
           FROM alerts WHERE status != 'rechazada' AND created_at >= datetime('now', ?)
           GROUP BY network_id ORDER BY total DESC LIMIT 20""",
        (since,),
    ).fetchall()
    by_day = db.execute(
        f"""SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS total FROM analyses
            WHERE created_at >= datetime('now', ?){network_clause} GROUP BY day ORDER BY day""",
        params,
    ).fetchall()
    verdicts = db.execute(
        f"""SELECT verdict, COUNT(*) AS total FROM analyses
            WHERE created_at >= datetime('now', ?){network_clause} GROUP BY verdict""",
        params,
    ).fetchall()
    return {
        "days": days,
        "by_category": [
            {"category": row["category"], "label": CATEGORIES.get(row["category"], row["category"]), "total": row["total"]}
            for row in by_category
        ],
        "by_network": [dict(row) for row in by_network],
        "by_day": [dict(row) for row in by_day],
        "verdicts": {row["verdict"]: row["total"] for row in verdicts},
    }
