"""Motor local de reglas: el respaldo cuando la IA no está disponible.

También corre junto a la IA como «segunda opinión» determinista: si una
regla grave se dispara (p. ej. piden el código OTP), el veredicto final nunca
baja de «sospechoso» aunque el modelo dude.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass


@dataclass(frozen=True)
class Rule:
    id: str
    label: str
    detail: str
    weight: int  # 1 leve · 2 moderada · 3 grave
    category: str
    patterns: tuple[re.Pattern[str], ...]


def _p(*patterns: str) -> tuple[re.Pattern[str], ...]:
    return tuple(re.compile(pattern, re.IGNORECASE) for pattern in patterns)


RULES: tuple[Rule, ...] = (
    Rule(
        "otp",
        "Pide un código de verificación",
        "Ningún banco, comercio ni la red pide códigos de un solo uso. Es la técnica más usada para vaciar cuentas.",
        3,
        "codigo_otp",
        _p(
            r"codigo (de )?(verificacion|seguridad|un solo uso|confirmacion|whatsapp)",
            r"\botp\b",
            r"clave dinamica",
            r"(pasa|pasame|envia|enviame|dicta|dictame|comparte|regalame|mandame)( el| tu| su| ese| un)? (codigo|clave)",
            r"(pid|solicit|exig|preguntand|pregunt)\w* (el |un |su |mi |tu |ese |los )?(codigo|clave|token)",
            r"codigo (que|q) (me|le|te|nos|les) (llego|llega|enviaron|mandaron|enviamos|mandamos|llegara|llegue)",
            r"\b\d{6}\b.{0,40}(no lo compartas|no compartas|es tu codigo)",
        ),
    ),
    Rule(
        "credenciales",
        "Pide contraseñas, PIN o datos de tarjeta",
        "Las claves y los datos de tarjeta nunca se piden por mensaje ni por teléfono.",
        3,
        "suplantacion_entidad",
        _p(
            r"\b(contrasena|password|clave de acceso|clave principal)\b",
            r"\bpin\b",
            r"numero de (la |su |tu )?tarjeta",
            r"\bcvv\b|\bcvc\b|codigo de seguridad de (la|su) tarjeta",
            r"fecha de (vencimiento|expiracion)",
            r"(datos|informacion) (bancari[ao]s|de (la|su) cuenta)",
        ),
    ),
    Rule(
        "actualizar",
        "Pide actualizar o validar datos",
        "Ninguna entidad le pide «actualizar» o «validar» sus datos por un enlace o un mensaje.",
        2,
        "phishing_enlace",
        _p(
            r"(actualiz|valid|verific|confirm)\w* (sus |tus |los |la |el |su |tu )?(datos|informacion|cuenta|identidad|llave)",
            r"(desbloque|reactiv)\w* (su |tu )?(cuenta|tarjeta|app)",
            r"(cuenta|tarjeta|llave) (sera |va a ser )?(bloquead|suspendid|desactivad|inactivad)",
        ),
    ),
    Rule(
        "suplantacion",
        "Dice ser del banco, una entidad o la red",
        "Si dice ser del banco, la DIAN, la Policía o la red, cuelgue y llame usted al número oficial.",
        3,
        "suplantacion_entidad",
        _p(
            r"(le|te) (hablamos|escribimos|llamamos) (de|del|desde) (el |la )?(banco|bancolombia|nequi|daviplata|davivienda|dian|policia|fiscalia|red)",
            r"(me|nos|le|les) (escribieron|llamaron|contactaron|hablaron|marcaron) (de|del|desde) (el |la |un |una )?(banco|bancolombia|nequi|daviplata|davivienda|bbva|dian|policia|fiscalia|operador|claro|movistar|tigo)",
            r"(soy|somos) (el |la |un |una )?(asesor|asesora|funcionari[oa]|agente|empleado|area) (de|del) ",
            r"departamento de (seguridad|fraudes)",
            r"(movimiento|transaccion|compra) (inusual|sospechos|no reconocid)",
        ),
    ),
    Rule(
        "urgencia",
        "Usa urgencia, miedo o amenazas",
        "La prisa artificial existe para que no se piense. Nada legítimo se pierde por verificar.",
        2,
        "otro",
        _p(
            r"\burgente\b|de inmediato|inmediatamente|ahora mismo",
            r"(ultimo|ultima) (aviso|dia|oportunidad|plazo)",
            r"(en|dentro de) (las proximas )?\d+ (horas|minutos)",
            r"(embargo|demanda|proceso juridico|reportado a centrales|datacredito)",
            r"(si no|de lo contrario).{0,40}(perdera|bloquea|cancela|suspend|embarg)",
        ),
    ),
    Rule(
        "transferencia",
        "Pide un pago, consignación o anticipo",
        "Las transferencias a cuentas de terceros o los anticipos sin garantía son el patrón clásico del fraude.",
        2,
        "otro",
        _p(
            r"(transfier|transfer|consign|gir|deposit|envi)\w* (a |el |la |un |una )?(esta |la siguiente |mi |otra )?(cuenta|nequi|daviplata|llave|numero)",
            r"a nombre de (un tercero|otra persona|mi (primo|hermano|socio|amigo))",
            r"(anticipo|adelanto|pago previo|costo de envio|seguro del prestamo|estudio de credito)",
            r"(paga|pague|consigne) (primero|antes|ya)",
        ),
    ),
    Rule(
        "premio",
        "Promete un premio, sorteo o dinero fácil",
        "Los premios que hay que «reclamar» pagando o dando datos son estafas.",
        3,
        "otro",
        _p(
            r"(ganaste|ha ganado|ganador|resulto favorecid|fue seleccionad)",
            r"(reclam|cobr)\w* (su |tu )?(premio|bono|subsidio|dinero)",
            r"(subsidio|bono|ingreso solidario|devolucion del iva) (aprobado|disponible|pendiente)",
        ),
    ),
    Rule(
        "app_remota",
        "Pide instalar una app o dar acceso remoto",
        "Las apps de control remoto (AnyDesk, TeamViewer) o los APK desconocidos dan el control total del celular.",
        3,
        "suplantacion_entidad",
        _p(
            r"(instal|descarg)\w* (la |una |esta )?(app|aplicacion|apk|programa)",
            r"\b(anydesk|teamviewer|rustdesk|quicksupport|airdroid)\b",
            r"\.apk\b",
            r"(comparte|compartir) (la |su |tu )?pantalla",
        ),
    ),
    Rule(
        "familiar",
        "Número nuevo que dice ser un conocido",
        "«Cambié de número» y pedir dinero es la estafa del familiar en apuros. Llame al número de siempre.",
        3,
        "falso_familiar",
        _p(
            r"(cambie|nuevo|perdi el|me robaron el) (de )?(numero|celular|telefono)",
            r"(este es mi|guarda(me)? este) (nuevo )?numero",
            r"(mami|mama|papa|tia|tio|hermano|hermana|mijo|mija).{0,60}(prestame|presta|necesito|pasame|transfiere)",
        ),
    ),
    Rule(
        "prestamo",
        "Préstamo fácil con cobro anticipado",
        "Ninguna entidad vigilada cobra por adelantado para desembolsar un crédito.",
        3,
        "prestamo_falso",
        _p(
            r"(prestamo|credito) (sin (estudio|codeudor|datacredito)|aprobado|inmediato|express)",
            r"(gota a gota|prestamos? por whatsapp)",
        ),
    ),
    Rule(
        "empleo",
        "Oferta de empleo o tareas pagadas no solicitada",
        "Si un trabajo le pide dinero para empezar o «subir de nivel», es una estafa.",
        2,
        "empleo_falso",
        _p(
            r"(gana|ganar|ganaras) (dinero|\$?\d+).{0,30}(desde casa|dando like|likes|resen|calificando)",
            r"(trabajo|empleo|vacante) (desde casa|remoto|medio tiempo).{0,40}(diario|por dia|sin experiencia)",
            r"(tarea|mision)(s|es)? (vip|pagad)",
        ),
    ),
    Rule(
        "inversion",
        "Promete rentabilidades imposibles",
        "Rentabilidades fijas y altas («duplica tu dinero») son pirámides o estafas cripto.",
        3,
        "inversion_falsa",
        _p(
            r"(duplica|triplica|multiplica) (su |tu )?(dinero|inversion)",
            r"(rentabilidad|ganancia|retorno) (garantizad|fij|diari)",
            r"\b(cripto|bitcoin|usdt|trading|forex)\b.{0,50}(gana|ganancia|invierte)",
        ),
    ),
    Rule(
        "extorsion",
        "Extorsión o amenaza contra usted o el negocio",
        "No pague ni negocie. Llame al GAULA (165) o al 123 y guarde toda la evidencia.",
        3,
        "extorsion_amenaza",
        _p(
            r"\b(vacuna|cuota de seguridad|impuesto de guerra)\b",
            r"(sabemos donde (vive|vives|queda)|tenemos (a su|a tu)|lo vamos a|te vamos a|le vamos a) ",
            r"(atentar|quemar|volar) (el |su |tu )?(negocio|local|casa)",
            r"(secuestrad|retenid)[oa]",
            r"\b(matar|plomo|bala|muerto)\b",
        ),
    ),
    Rule(
        "comprobante",
        "Comprobante de pago como única prueba",
        "Una captura no es un pago. Confirme siempre el ingreso en su propia app antes de entregar.",
        2,
        "falso_comprobante",
        _p(
            r"(comprobante|soporte|pantallazo|captura) (de|del) (pago|transferencia|consignacion)",
            r"ya (le|te) (pague|transferi|consigne|envie)",
            r"(revise|revisa|mira) (el|la) (comprobante|captura|pantallazo)",
        ),
    ),
    Rule(
        "qr",
        "Pago por QR de origen dudoso",
        "Antes de pagar por QR verifique que el nombre del destinatario sea el del comercio.",
        2,
        "qr_fraudulento",
        _p(r"(escane|lee|use)\w* (este |el )?(codigo )?qr", r"qr (nuevo|actualizado|diferente)"),
    ),
    Rule(
        "sim",
        "Indicios de robo de la línea (SIM swap)",
        "Si su celular se queda sin señal y recibe alertas del banco, llame al banco y al operador de inmediato.",
        3,
        "sim_swap",
        _p(r"(cambio|reposicion|duplicado) de (sim|simcard|chip|linea)", r"(sin senal|sin servicio).{0,60}(banco|clave|cuenta)"),
    ),
    Rule(
        "multa",
        "Multa, embargo o cobro con enlace de pago",
        "Consulte multas y deudas escribiendo usted la dirección oficial; nunca pague desde el enlace del mensaje.",
        2,
        "cobro_falso",
        _p(r"(fotomulta|comparendo|multa de transito|simit)", r"(factura|servicio) (vencid|pendiente).{0,40}(corte|suspension)"),
    ),
    Rule(
        "voz",
        "Petición inusual por nota de voz o llamada",
        "La voz puede estar clonada con IA. Cuelgue y devuelva la llamada al número que ya conocía.",
        2,
        "voz_clonada",
        _p(r"(nota de voz|audio|llamada).{0,60}(cambie de cuenta|nueva cuenta|consigna|urgente)", r"no le (digas|diga|cuentes|cuente) a nadie"),
    ),
    Rule(
        "mayusculas",
        "Tono agresivo: mayúsculas y signos de exclamación",
        "El tono alarmista busca una respuesta inmediata por miedo.",
        1,
        "otro",
        # sin IGNORECASE: lo que importa es que esté en mayúsculas
        (re.compile(r"!{2,}"), re.compile(r"\b(URGENTE|ALERTA|BLOQUEAD[OA]|[UÚ]LTIMO AVISO)\b")),
    ),
)


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    return "".join(char for char in text if unicodedata.category(char) != "Mn").lower()


def run_rules(text: str) -> list[dict]:
    """Devuelve las señales disparadas, de mayor a menor gravedad."""
    normalized = normalize(text)
    signals: list[dict] = []
    for rule in RULES:
        # «mayusculas» se evalúa sobre el texto original (sin pasar a minúsculas)
        haystack = text if rule.id == "mayusculas" else normalized
        if any(pattern.search(haystack) for pattern in rule.patterns):
            signals.append(
                {
                    "id": rule.id,
                    "label": rule.label,
                    "detail": rule.detail,
                    "weight": rule.weight,
                    "level": "danger" if rule.weight >= 3 else "warning",
                    "category": rule.category,
                }
            )
    return sorted(signals, key=lambda signal: -signal["weight"])


def score_signals(signals: list[dict]) -> int:
    factor = {3: 45, 2: 20, 1: 7}
    return min(100, sum(factor.get(signal["weight"], 7) for signal in signals))


def best_category(signals: list[dict]) -> str:
    for signal in signals:
        if signal.get("category") and signal["category"] != "otro":
            return signal["category"]
    return "otro"
