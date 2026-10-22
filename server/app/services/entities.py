"""Extracción de identificadores de un mensaje: enlaces, teléfonos, cuentas y correos.

Se normalizan para poder cruzarlos con la base comunitaria de reportes y se
enmascaran para mostrarlos sin exponer el dato completo.
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass

URL_RE = re.compile(
    r"""(?xi)
    \b(
        (?:https?://|www\.)[^\s<>"'()]+            # con esquema o www
        |
        (?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+  # dominio desnudo
        (?:com|co|net|org|info|xyz|top|online|site|club|shop|live|link|click|app|me|io|ly|gl|cc|tk|ml|ga|cf|gq|zip|mov|gov\.co|com\.co)
        (?:/[^\s<>"'()]*)?
    )
    """
)
EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b")
PHONE_RE = re.compile(r"(?<![\d])(?:\+?57[\s.-]?)?(3\d{2})[\s.-]?(\d{3})[\s.-]?(\d{4})(?![\d])")
INTL_PHONE_RE = re.compile(r"(?<![\d+])\+(?!57)(\d{1,3})[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{0,4}")
ACCOUNT_RE = re.compile(r"(?<![\d])\d{4}[\s-]?\d{3,4}[\s-]?\d{3,4}[\s-]?\d{0,4}(?![\d])")


@dataclass
class Entity:
    kind: str  # telefono | cuenta | enlace | correo
    value: str  # normalizado (para el hash)
    masked: str
    domain: str | None = None

    def public(self) -> dict:
        data = asdict(self)
        data.pop("value")
        return data


def mask_phone(digits: str) -> str:
    return f"{digits[:3]} *** {digits[-4:]}" if len(digits) >= 7 else "***"


def mask_account(digits: str) -> str:
    return f"**** {digits[-4:]}"


def mask_email(email: str) -> str:
    user, _, domain = email.partition("@")
    return f"{user[:2]}***@{domain}"


def normalize_url(raw: str) -> str:
    url = raw.rstrip(".,;:!?)»”")
    if not re.match(r"^https?://", url, re.IGNORECASE):
        url = "http://" + url
    return url


def url_domain(url: str) -> str:
    host = re.sub(r"^https?://", "", url, flags=re.IGNORECASE).split("/")[0].split("?")[0]
    host = host.split("@")[-1].split(":")[0].lower()
    return host.removeprefix("www.")


def extract_entities(text: str) -> list[Entity]:
    found: dict[tuple[str, str], Entity] = {}

    for match in EMAIL_RE.finditer(text):
        email = match.group(0).lower()
        found[("correo", email)] = Entity("correo", email, mask_email(email), email.split("@")[1])

    text_no_email = EMAIL_RE.sub(" ", text)
    for match in URL_RE.finditer(text_no_email):
        url = normalize_url(match.group(1))
        domain = url_domain(url)
        if not domain or "." not in domain:
            continue
        found[("enlace", url.lower())] = Entity("enlace", url.lower(), url, domain)

    text_no_urls = URL_RE.sub(" ", text_no_email)
    phone_spans: list[tuple[int, int]] = []
    for match in PHONE_RE.finditer(text_no_urls):
        digits = "".join(match.groups())
        phone_spans.append(match.span())
        found[("telefono", digits)] = Entity("telefono", digits, mask_phone(digits))
    for match in INTL_PHONE_RE.finditer(text_no_urls):
        digits = re.sub(r"\D", "", match.group(0))
        phone_spans.append(match.span())
        found[("telefono", "+" + digits)] = Entity("telefono", "+" + digits, "+" + mask_phone(digits))

    for match in ACCOUNT_RE.finditer(text_no_urls):
        if any(start <= match.start() < end for start, end in phone_spans):
            continue
        digits = re.sub(r"\D", "", match.group(0))
        if 10 <= len(digits) <= 16 and not (len(digits) == 10 and digits.startswith("3")):
            found[("cuenta", digits)] = Entity("cuenta", digits, mask_account(digits))

    return list(found.values())
