"""Análisis de enlaces: suplantación de marcas colombianas y señales técnicas de phishing.

Es determinista (no depende de la IA) para que el veredicto sobre un enlace
sea reproducible y explicable. Opcionalmente consulta la edad del dominio
por RDAP: los dominios recién creados son la señal más fuerte de phishing.
"""

from __future__ import annotations

import ipaddress
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from functools import lru_cache

import httpx

# Dominios oficiales (se aceptan también sus subdominios)
OFFICIAL_DOMAINS: dict[str, str] = {
    "bancolombia.com": "Bancolombia",
    "grupobancolombia.com": "Bancolombia",
    "nequi.com.co": "Nequi",
    "daviplata.com": "Daviplata",
    "davivienda.com": "Davivienda",
    "bancodebogota.com": "Banco de Bogotá",
    "bbva.com.co": "BBVA",
    "bancodeoccidente.com.co": "Banco de Occidente",
    "bancopopular.com.co": "Banco Popular",
    "avvillas.com.co": "AV Villas",
    "scotiabankcolpatria.com": "Scotiabank Colpatria",
    "bancocajasocial.com": "Banco Caja Social",
    "bancoagrario.gov.co": "Banco Agrario",
    "itau.co": "Itaú",
    "movii.com.co": "Movii",
    "dale.com.co": "Dale!",
    "lulobank.com": "Lulo Bank",
    "nu.com.co": "Nu",
    "bancoderepublica.gov.co": "Banco de la República",
    "banrep.gov.co": "Banco de la República",
    "dian.gov.co": "DIAN",
    "fcm.org.co": "SIMIT",
    "simit.org.co": "SIMIT",
    "policia.gov.co": "Policía Nacional",
    "fiscalia.gov.co": "Fiscalía",
    "sic.gov.co": "SIC",
    "superfinanciera.gov.co": "Superfinanciera",
    "gov.co": "Gobierno de Colombia",
    "mercadolibre.com.co": "Mercado Libre",
    "falabella.com.co": "Falabella",
    "rappi.com.co": "Rappi",
    "servientrega.com": "Servientrega",
    "interrapidisimo.com": "Interrapidísimo",
    "claro.com.co": "Claro",
    "movistar.co": "Movistar",
    "tigo.com.co": "Tigo",
    "whatsapp.com": "WhatsApp",
    "google.com": "Google",
    "facebook.com": "Facebook",
    "instagram.com": "Instagram",
}

# Palabras de marca que, si aparecen en un dominio NO oficial, indican suplantación
BRAND_KEYWORDS: dict[str, str] = {
    "bancolombia": "Bancolombia",
    "nequi": "Nequi",
    "daviplata": "Daviplata",
    "davivienda": "Davivienda",
    "bancodebogota": "Banco de Bogotá",
    "bbva": "BBVA",
    "colpatria": "Scotiabank Colpatria",
    "avvillas": "AV Villas",
    "bancopopular": "Banco Popular",
    "occidente": "Banco de Occidente",
    "cajasocial": "Banco Caja Social",
    "bancoagrario": "Banco Agrario",
    "movii": "Movii",
    "dian": "DIAN",
    "simit": "SIMIT",
    "fotomulta": "SIMIT",
    "policia": "Policía Nacional",
    "breb": "Bre-B",
    "bre-b": "Bre-B",
    "pse": "PSE",
    "mercadolibre": "Mercado Libre",
    "falabella": "Falabella",
    "rappi": "Rappi",
    "servientrega": "Servientrega",
    "interrapidisimo": "Interrapidísimo",
    "whatsapp": "WhatsApp",
}

SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy", "ow.ly", "goo.gl", "shorturl.at",
    "tiny.cc", "s.id", "rebrand.ly", "t.ly", "acortar.link", "acortaurl.com", "linktr.ee",
}
RISKY_TLDS = {
    "xyz", "top", "tk", "ml", "ga", "cf", "gq", "zip", "mov", "click", "link", "live", "online",
    "site", "club", "shop", "info", "buzz", "icu", "rest", "cyou", "lat", "sbs", "cfd", "monster",
}
LURE_WORDS = re.compile(
    r"(login|ingreso|verifica|validar|actualiza|seguridad|desbloque|reactiva|premio|reclama|soporte|token|clave|pago|cobro|multa|embargo)",
    re.IGNORECASE,
)
LEET = str.maketrans({"0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s"})


@dataclass
class LinkReport:
    url: str
    domain: str
    risk: str  # alto | medio | bajo
    score: int
    reasons: list[str] = field(default_factory=list)
    impersonates: str | None = None
    official: str | None = None
    reported: int = 0
    domain_age_days: int | None = None

    def as_dict(self) -> dict:
        return self.__dict__.copy()


def _registrable(domain: str) -> str:
    parts = domain.split(".")
    if len(parts) >= 3 and parts[-2] in {"com", "gov", "org", "net", "edu"} and parts[-1] == "co":
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])


def official_brand(domain: str) -> str | None:
    for official, brand in OFFICIAL_DOMAINS.items():
        if domain == official or domain.endswith("." + official):
            return brand
    return None


def _levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        current = [i]
        for j, cb in enumerate(b, 1):
            current.append(min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (ca != cb)))
        previous = current
    return previous[-1]


def _lookalike(label: str) -> str | None:
    """Detecta dominios que imitan una marca: bancoIombia, nequl, davip1ata…"""
    normalized = label.translate(LEET).replace("-", "")
    for keyword, brand in BRAND_KEYWORDS.items():
        if len(keyword) < 5:
            continue
        if keyword in normalized:
            return brand
        if abs(len(normalized) - len(keyword)) <= 2 and _levenshtein(normalized, keyword) <= 2:
            return brand
    return None


@lru_cache(maxsize=512)
def domain_age_days(registrable: str) -> int | None:
    """Edad del dominio por RDAP (rdap.org). Devuelve None si no se puede saber."""
    try:
        response = httpx.get(f"https://rdap.org/domain/{registrable}", timeout=3.0, follow_redirects=True)
        if response.status_code != 200:
            return None
        for event in response.json().get("events", []):
            if event.get("eventAction") == "registration":
                created = datetime.fromisoformat(event["eventDate"].replace("Z", "+00:00"))
                return (datetime.now(UTC) - created).days
    except (httpx.HTTPError, ValueError, KeyError):
        return None
    return None


def analyze_link(url: str, domain: str, reported: int = 0, check_age: bool = True) -> LinkReport:
    report = LinkReport(url=url, domain=domain, risk="bajo", score=0, reported=reported)
    score = 0

    brand = official_brand(domain)
    if brand:
        report.official = brand
        report.reasons.append(f"Dominio oficial de {brand}.")

    try:
        ipaddress.ip_address(domain)
        score += 45
        report.reasons.append("El enlace apunta a una dirección IP en lugar de un dominio.")
    except ValueError:
        pass

    if "xn--" in domain:
        score += 45
        report.reasons.append("Usa caracteres internacionales (punycode) para imitar letras de otro dominio.")

    if "@" in url.split("//", 1)[-1].split("/")[0]:
        score += 40
        report.reasons.append("Contiene «@» para ocultar el destino real del enlace.")

    registrable = _registrable(domain)
    if not brand:
        label = registrable.split(".")[0]
        tokens = set(re.split(r"[.-]", domain))
        compact = domain.replace(".", "").replace("-", "")
        impersonated = next(
            (
                name
                for keyword, name in BRAND_KEYWORDS.items()
                # las marcas cortas (pse, dian, bbva) sólo cuentan como palabra completa
                if (len(keyword) >= 6 and keyword in compact)
                or keyword in tokens
                or ("-" in keyword and keyword in domain)
            ),
            None,
        ) or _lookalike(label)
        if impersonated:
            score += 55
            report.impersonates = impersonated
            report.reasons.append(f"Imita a {impersonated} pero NO es su dominio oficial.")

    if registrable in SHORTENERS or domain in SHORTENERS:
        score += 25
        report.reasons.append("Es un enlace acortado: oculta la página real de destino.")

    tld = domain.rsplit(".", 1)[-1]
    if tld in RISKY_TLDS and not brand:
        score += 20
        report.reasons.append(f"Terminación «.{tld}», muy usada en campañas de phishing.")

    if not brand and domain.count("-") >= 2:
        score += 10
        report.reasons.append("Dominio con muchos guiones, típico de páginas falsas.")

    if not brand and domain.count(".") >= 3:
        score += 10
        report.reasons.append("Demasiados subdominios: el nombre de la marca puede estar al inicio para engañar.")

    path = url.split(domain, 1)[-1]
    if not brand and LURE_WORDS.search(domain + path):
        score += 15
        report.reasons.append("La dirección incluye palabras de gancho (verificar, actualizar, premio, multa…).")

    if url.startswith("http://") and not brand and "://" in url:
        score += 5

    if reported:
        score += 50
        report.reasons.append(f"La comunidad ya reportó este dominio {reported} {'vez' if reported == 1 else 'veces'}.")

    if check_age and not brand and score > 0:
        age = domain_age_days(registrable)
        report.domain_age_days = age
        if age is not None and age < 90:
            score += 35
            report.reasons.append(f"El dominio fue creado hace sólo {age} días.")

    if brand and score < 40:
        score = 0

    report.score = min(100, score)
    report.risk = "alto" if report.score >= 45 else "medio" if report.score >= 20 else "bajo"
    if not report.reasons:
        report.reasons.append("Sin señales técnicas de riesgo. Verifique igualmente el remitente.")
    return report
