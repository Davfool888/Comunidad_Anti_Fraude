"""Orquestador del análisis de fraude.

Combina cuatro fuentes y explica de dónde sale cada señal:
  · reglas locales (deterministas)
  · análisis técnico de enlaces
  · base comunitaria de números, cuentas y dominios reportados
  · Claude (visión + razonamiento), cuando está disponible

Si la IA falla o no está configurada, el resultado se construye sólo con las
fuentes locales y se marca `engine = "local"`.
"""

from __future__ import annotations

import asyncio
import logging
import sqlite3
from typing import Any

from ..config import settings
from ..db import now_iso
from ..security import pseudonym
from ..seed import CATEGORIES
from . import ai, assistant
from .entities import Entity, extract_entities
from .images import CleanImage
from .links import analyze_link
from .rules import best_category, run_rules, score_signals

log = logging.getLogger("red_segura.analysis")

SEVERITY_WEIGHT = {"alta": 3, "media": 2, "baja": 1}

VERDICT_COPY = {
    "fraude": (
        "Esto es un fraude",
        "El mensaje encaja con un patrón de fraude conocido. No responda, no transfiera y repórtelo a la red.",
    ),
    "sospechoso": (
        "Es sospechoso: verifique antes de actuar",
        "Hay señales de alerta. Confirme por un canal oficial que usted conozca antes de pagar o compartir datos.",
    ),
    "limpio": (
        "No se detectan señales de fraude",
        "No encontramos señales de riesgo. Aun así, confirme siempre los pagos en su propia app.",
    ),
}


def entity_reports(conn: sqlite3.Connection, entity: Entity) -> int:
    if entity.kind == "enlace" and entity.domain:
        row = conn.execute(
            "SELECT COUNT(*) FROM reported_entities WHERE kind = 'enlace' AND domain = ?", (entity.domain,)
        ).fetchone()
    else:
        row = conn.execute(
            "SELECT COUNT(*) FROM reported_entities WHERE value_hash = ?", (pseudonym(entity.value),)
        ).fetchone()
    return int(row[0])


def _verdict(score: int) -> str:
    return "fraude" if score >= 45 else "sospechoso" if score >= 18 else "limpio"


def _default_actions(verdict: str, signal_ids: set[str], emergency: bool) -> list[str]:
    actions: list[str] = []
    if emergency:
        actions.append("Si hay riesgo para su vida o la de otros, llame ya a la línea 123 de la Policía.")
    if "extorsion" in signal_ids:
        actions.append("No pague ni negocie. Llame al GAULA en la línea 165 (gratuita) y guarde audios y capturas.")
    if verdict == "fraude":
        actions += [
            "No responda, no devuelva la llamada y no abra los enlaces.",
            "No transfiera dinero ni comparta códigos, claves o datos de tarjeta.",
            "Repórtelo a la red para alertar a los comercios del barrio.",
        ]
        if signal_ids & {"otp", "credenciales", "app_remota", "sim"}:
            actions.append("Si ya compartió datos, llame a la línea oficial de su banco y cambie sus claves ahora.")
        actions.append("Denuncie en el CAI Virtual de la Policía (caivirtual.policia.gov.co) con las capturas.")
    elif verdict == "sospechoso":
        actions += [
            "Verifique por otro canal: llame usted al número oficial o al número de siempre de la persona.",
            "No pague ni entregue mercancía hasta confirmar el ingreso en su propia app.",
            "Si se confirma, repórtelo a la red del barrio.",
        ]
    else:
        actions += [
            "Confirme igualmente los pagos en su app antes de entregar.",
            "Si el mensaje cambia o pide algo raro, analícelo de nuevo o repórtelo.",
        ]
    return actions


def _checks(signal_ids: set[str], links: list[dict], entities_reported: bool) -> list[dict]:
    return [
        {"label": "No pide códigos, contraseñas ni datos de tarjeta", "ok": not signal_ids & {"otp", "credenciales"}},
        {
            "label": "No se hace pasar por un banco, entidad o familiar",
            "ok": not signal_ids & {"suplantacion", "familiar"} and not any(link["impersonates"] for link in links),
        },
        {"label": "No usa urgencia, miedo ni amenazas", "ok": not signal_ids & {"urgencia", "extorsion"}},
        {"label": "Los enlaces apuntan a dominios de confianza", "ok": all(link["risk"] == "bajo" for link in links)},
        {"label": "No pide pagos, anticipos ni transferencias a terceros", "ok": "transferencia" not in signal_ids},
        {"label": "Los números y cuentas no han sido reportados por la comunidad", "ok": not entities_reported},
    ]


def conversation(reply: str, *, engine: str, source: str, note: str | None = None) -> dict[str, Any]:
    """Respuesta a una pregunta o saludo: no hay veredicto ni se registra en las estadísticas."""
    return {
        "intent": "conversacion",
        "reply": reply,
        "engine": engine,
        "engine_note": note,
        "source": source,
        "transcript": None,
        "extracted_text": None,
        "links": [],
        "entities": [],
        "receipt": None,
        "threats": None,
        "emergency": False,
        "channel": "desconocido",
        "client_ocr_requested": False,
        "verdict": "limpio",
        "score": 0,
        "category": "otro",
        "category_label": CATEGORIES["otro"],
        "headline": "",
        "summary": reply,
        "signals": [],
        "actions": [],
        "checks": [],
    }


async def run_analysis(
    conn: sqlite3.Connection,
    *,
    text: str,
    images: list[CleanImage],
    source: str,
    network_id: str | None,
    client_ocr_text: str = "",
    transcript: str = "",
    history: list[dict] | None = None,
) -> dict[str, Any]:
    combined = "\n".join(part for part in (transcript, text, client_ocr_text) if part)

    # 1. Fuentes deterministas
    signals = run_rules(combined)
    entities = extract_entities(combined)
    entity_rows: list[dict] = []
    for entity in entities:
        count = entity_reports(conn, entity)
        entity_rows.append({**entity.public(), "reported": count})

    link_entities = [entity for entity in entities if entity.kind == "enlace"]
    link_reports = await asyncio.gather(
        *[
            asyncio.to_thread(analyze_link, entity.masked, entity.domain or "", entity_reports(conn, entity))
            for entity in link_entities[:6]
        ]
    )
    links = [report.as_dict() for report in link_reports]

    for link in links:
        if link["risk"] != "bajo":
            reason = next((r for r in link["reasons"] if "Imita" in r or "reportó" in r), link["reasons"][0])
            signals.append(
                {
                    "id": f"enlace-{link['domain']}",
                    "label": f"Enlace de riesgo {link['risk']}: {link['domain']}",
                    "detail": reason,
                    "weight": 3 if link["risk"] == "alto" else 2,
                    "level": "danger" if link["risk"] == "alto" else "warning",
                    "category": "phishing_enlace",
                }
            )

    reported_entities = [row for row in entity_rows if row["reported"] and row["kind"] != "enlace"]
    for row in reported_entities:
        signals.append(
            {
                "id": f"reportado-{row['masked']}",
                "label": f"{row['kind'].capitalize()} reportado por la comunidad ({row['masked']})",
                "detail": f"Este {row['kind']} aparece en {row['reported']} reporte(s) de la red.",
                "weight": 3,
                "level": "danger",
                "category": "otro",
            }
        )

    editing_hints = [hint for image in images for hint in image.editing_hints]
    for index, hint in enumerate(editing_hints):
        signals.append(
            {
                "id": f"edicion-{index}",
                "label": "La imagen muestra rastros de edición",
                "detail": hint,
                "weight": 2,
                "level": "warning",
                "category": "falso_comprobante",
            }
        )

    rules_score = score_signals(signals)
    category = best_category(signals)
    signal_ids = {signal["id"] for signal in signals}

    # ¿Es una pregunta o un caso? Hay caso si hay evidencia o señales de riesgo.
    is_case = (
        bool(images)
        or bool(client_ocr_text)
        or rules_score >= 20
        or any(link["risk"] != "bajo" for link in links)
        or bool(reported_entities)
    )
    local_kind = None if is_case else assistant.detect(text or transcript)

    result: dict[str, Any] = {
        "intent": "analisis",
        "reply": None,
        "engine": "local",
        "engine_note": None,
        "source": source,
        "transcript": transcript or None,
        "extracted_text": client_ocr_text or None,
        "links": links,
        "entities": entity_rows,
        "receipt": None,
        "threats": None,
        "emergency": False,
        "channel": "desconocido",
        "client_ocr_requested": bool(images) and not client_ocr_text,
    }

    # 2. IA
    ai_result: dict[str, Any] | None = None
    if settings.ai_enabled:
        context_lines = [f"- Señal de regla: {signal['label']}" for signal in signals]
        context_lines += [f"- Enlace {link['domain']}: riesgo {link['risk']} ({'; '.join(link['reasons'])})" for link in links]
        try:
            ai_result = await ai.analyze_message(combined, images, source, "\n".join(context_lines), history)
        except ai.AIUnavailable as error:
            result["engine_note"] = str(error)
            log.info("IA no disponible, se usa el motor local: %s", error)

    if ai_result and ai_result.get("intent") == "conversacion" and not is_case and ai_result.get("reply"):
        return conversation(ai_result["reply"], engine=settings.ai_provider, source=source)
    if not ai_result and local_kind:
        return conversation(
            assistant.reply(conn, local_kind, text or transcript),
            engine="local",
            source=source,
            note=result["engine_note"],
        )

    if ai_result:
        result["engine"] = settings.ai_provider
        result["client_ocr_requested"] = False
        for index, signal in enumerate(ai_result.get("signals", [])):
            weight = SEVERITY_WEIGHT.get(signal.get("severity", "media"), 2)
            signals.append(
                {
                    "id": f"ia-{index}",
                    "label": signal["label"],
                    "detail": signal["detail"],
                    "weight": weight,
                    "level": "danger" if weight >= 3 else "warning",
                    "category": ai_result.get("category", "otro"),
                }
            )
        score = max(int(ai_result.get("score", 0)), min(rules_score, 60))
        score = max(0, min(100, score))
        verdict = ai_result.get("verdict") or _verdict(score)
        # Las fuentes deterministas fijan un piso: no se declara «limpio» con señales graves
        if verdict == "limpio" and rules_score >= 45:
            verdict = "sospechoso"
        category = ai_result.get("category") or category
        headline = ai_result.get("headline") or VERDICT_COPY[verdict][0]
        summary = ai_result.get("summary") or VERDICT_COPY[verdict][1]
        actions = ai_result.get("actions") or _default_actions(verdict, signal_ids, False)
        result["extracted_text"] = ai_result.get("extracted_text") or result["extracted_text"]
        receipt = ai_result.get("receipt") or {}
        if receipt.get("is_receipt"):
            receipt["reasons"] = list(receipt.get("reasons", [])) + editing_hints
            result["receipt"] = receipt
        threats = ai_result.get("threats") or {}
        if threats.get("detected"):
            result["threats"] = threats
        result["emergency"] = bool(ai_result.get("emergency"))
        result["channel"] = ai_result.get("channel", "desconocido")
        # Si la IA extrajo texto nuevo de las imágenes, se pasan también las reglas y enlaces sobre él
        if result["extracted_text"] and not client_ocr_text:
            extra = extract_entities(result["extracted_text"])
            known = {(row["kind"], row["masked"]) for row in entity_rows}
            for entity in extra:
                if (entity.kind, entity.masked) not in known:
                    entity_rows.append({**entity.public(), "reported": entity_reports(conn, entity)})
                    if entity.kind == "enlace":
                        report = await asyncio.to_thread(
                            analyze_link, entity.masked, entity.domain or "", entity_reports(conn, entity)
                        )
                        links.append(report.as_dict())
    else:
        score = rules_score
        if len(combined.strip()) < 24 and not signals and not images:
            signals.append(
                {
                    "id": "vacio",
                    "label": "Mensaje demasiado corto para analizar",
                    "detail": "Pegue el mensaje completo o adjunte la captura para un análisis más preciso.",
                    "weight": 1,
                    "level": "warning",
                    "category": "otro",
                }
            )
        verdict = _verdict(score)
        headline, summary = VERDICT_COPY[verdict]
        if editing_hints:
            result["receipt"] = {
                "is_receipt": True,
                "verdict": "dudoso",
                "reasons": editing_hints,
                "amount": "",
                "bank": "",
            }
        actions = _default_actions(verdict, signal_ids, False)

    if result["emergency"] and not any("123" in action for action in actions):
        actions.insert(0, "Si hay riesgo para su vida o la de otros, llame ya a la línea 123 de la Policía.")

    signals.sort(key=lambda signal: -signal["weight"])
    result.update(
        {
            "verdict": verdict,
            "score": score,
            "category": category,
            "category_label": CATEGORIES.get(category, CATEGORIES["otro"]),
            "headline": headline,
            "summary": summary,
            "signals": [{key: value for key, value in signal.items() if key != "category"} for signal in signals],
            "actions": actions,
            "checks": _checks(signal_ids | {s["id"] for s in signals}, links, bool(reported_entities)),
        }
    )

    # 3. Registro anónimo (sin contenido) para las tendencias
    conn.execute(
        "INSERT INTO analyses (verdict, score, category, source, engine, network_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (verdict, score, category, source, result["engine"], network_id, now_iso()),
    )
    return result
