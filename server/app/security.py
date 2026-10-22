"""Controles de seguridad transversales.

- Límite de peticiones por IP (ventana deslizante en memoria).
- Autenticación de moderadores por token (comparación en tiempo constante).
- Seudonimización: las IPs y los identificadores reportados se guardan como
  hash con sal, nunca en claro.
- Redacción de datos personales en el texto libre de las alertas
  (Ley 1581 de 2012, Habeas Data).
"""

from __future__ import annotations

import hashlib
import hmac
import re
import secrets
import sqlite3
import time
from collections import defaultdict, deque

from fastapi import Header, HTTPException, Request, status

from .config import settings

# ---------------------------------------------------------------------------
# Límite de peticiones
# ---------------------------------------------------------------------------


class RateLimiter:
    def __init__(self, per_minute: int) -> None:
        self.per_minute = per_minute
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > 60:
            hits.popleft()
        if len(hits) >= self.per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiadas solicitudes. Espere un minuto e intente de nuevo.",
                headers={"Retry-After": "60"},
            )
        hits.append(now)


ai_limiter = RateLimiter(settings.rate_limit_per_minute)
write_limiter = RateLimiter(max(10, settings.rate_limit_per_minute // 2))


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "desconocido"


def limit_ai(request: Request) -> None:
    ai_limiter.check(client_ip(request))


def limit_writes(request: Request) -> None:
    write_limiter.check(client_ip(request))


# ---------------------------------------------------------------------------
# Moderadores
# ---------------------------------------------------------------------------


def require_moderator(x_moderator_token: str | None = Header(default=None)) -> None:
    if not x_moderator_token or not hmac.compare_digest(x_moderator_token, settings.moderator_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de moderación inválido.")


# ---------------------------------------------------------------------------
# Seudonimización
# ---------------------------------------------------------------------------


def pseudonym(value: str) -> str:
    return hmac.new(settings.hash_salt.encode(), value.encode(), hashlib.sha256).hexdigest()


def reporter_hash(request: Request) -> str:
    return pseudonym(f"ip:{client_ip(request)}")


# ---------------------------------------------------------------------------
# Comercios verificados (código de acceso)
# ---------------------------------------------------------------------------

# Sin letras ni números que se confundan al dictarlo (0/O, 1/I/L)
_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"


def generate_access_code() -> str:
    """Código que el moderador entrega al comercio: RS-XXXX-XXXX (≈ 40 bits)."""
    chars = "".join(secrets.choice(_CODE_ALPHABET) for _ in range(8))
    return f"RS-{chars[:4]}-{chars[4:]}"


def normalize_code(code: str) -> str:
    return re.sub(r"[^0-9A-Z]", "", code.upper())


def code_hash(code: str) -> str:
    return pseudonym(f"merchant:{normalize_code(code)}")


def merchant_from_code(conn: sqlite3.Connection, code: str | None) -> sqlite3.Row | None:
    """Comercio verificado al que pertenece el código, o None."""
    if not code or len(code) > 40:
        return None
    return conn.execute(
        "SELECT * FROM merchants WHERE access_code_hash = ? AND status = 'verificado'", (code_hash(code),)
    ).fetchone()


# ---------------------------------------------------------------------------
# Redacción de datos personales
# ---------------------------------------------------------------------------

_CARD = re.compile(r"\b(?:\d[ -]?){13,19}\b")
_CEDULA = re.compile(r"\b(?:c\.?\s?c\.?|c[eé]dula|documento)\s*(?:n[o°º.]?\s*)?[:#]?\s*\d[\d.\s]{5,13}\d\b", re.IGNORECASE)
_EMAIL = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")
_ADDRESS = re.compile(
    r"\b(?:calle|cl|carrera|cra|kr|avenida|av|diagonal|dg|transversal|tv)\.?\s*\d+[a-z]?\s*(?:bis)?\s*(?:#|n[o°º]\.?)\s*\d+[a-z]?\s*-\s*\d+\b",
    re.IGNORECASE,
)


def redact_personal_data(text: str) -> str:
    """Oculta datos de la víctima o de terceros en el texto libre.

    Los identificadores del estafador (teléfono, enlace, cuenta) se reportan
    aparte, como entidades, y se muestran enmascarados.
    """
    text = _CARD.sub("[tarjeta oculta]", text)
    text = _CEDULA.sub("[documento oculto]", text)
    text = _EMAIL.sub("[correo oculto]", text)
    text = _ADDRESS.sub("[dirección oculta]", text)
    return text


def clean_text(value: str | None, limit: int) -> str:
    """Normaliza texto de entrada: recorta, quita caracteres de control."""
    if not value:
        return ""
    value = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", value)
    return value.strip()[:limit]
