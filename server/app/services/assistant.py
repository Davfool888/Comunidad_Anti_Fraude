"""Conversación sin IA: detecta preguntas y responde con el conocimiento de la red.

Cuando no hay motor de IA, el asistente no debe «analizar» un «¿qué puedes
hacer?» como si fuera un mensaje sospechoso. Aquí se reconoce la intención
(saludo, capacidades, pregunta sobre una modalidad, qué hacer, dónde
denunciar) y se arma la respuesta con las fichas del Centro de aprendizaje.
"""

from __future__ import annotations

import json
import re
import sqlite3

from .rules import normalize

CAPABILITIES = (
    "Soy el asistente antifraude de la Red Segura de Comercios. Puedo ayudarle a:\n"
    "• Analizar un mensaje, llamada o situación sospechosa: péguelo, escríbalo o cuéntemelo por voz.\n"
    "• Leer capturas de WhatsApp o SMS y revisar los enlaces que traen.\n"
    "• Revisar si un comprobante de pago parece editado.\n"
    "• Consultar si un número, cuenta o enlace ya fue reportado por la comunidad.\n"
    "• Explicarle modalidades de fraude (SIM swap, QR falsos, «mamá cambié de número»…) y cómo protegerse.\n"
    "• Ayudarle a alertar al barrio y a preparar la denuncia."
)

GREETING = (
    "¡Hola! Soy el asistente antifraude de la red. Cuénteme qué le pasó o pegue el mensaje que le llegó "
    "y le digo si es fraude. También puede preguntarme cómo protegerse de una modalidad."
)

THANKS = "Con gusto. Si le llega otro mensaje raro, analícelo aquí antes de responder o pagar."

ALREADY_FELL = (
    "Si ya compartió datos o hizo un pago, actúe ahora:\n"
    "1. Llame a la línea oficial de su banco o billetera (el número que aparece en su tarjeta o en la app) y pida bloquear.\n"
    "2. Cambie sus claves y active la verificación en dos pasos (en WhatsApp también).\n"
    "3. Si perdió la señal del celular, llame a su operador: puede ser un SIM swap.\n"
    "4. Guarde capturas, números y comprobantes.\n"
    "5. Denuncie en A Denunciar (adenunciar.policia.gov.co) o el CAI Virtual, y avise a la red del barrio."
)

REPORT = (
    "Puede denunciar en:\n"
    "• A Denunciar (Policía y Fiscalía): adenunciar.policia.gov.co\n"
    "• CAI Virtual de la Policía: caivirtual.policia.gov.co\n"
    "• Extorsión o secuestro: línea 165 (GAULA). Emergencias: 123.\n"
    "Después de analizar un caso, el botón «Generar denuncia» le prepara el resumen para adjuntar."
)

OUT_OF_SCOPE = (
    "Si es un mensaje que usted recibió, no encuentro en él señales de fraude (no pide dinero, códigos, "
    "datos ni trae enlaces). Si es una pregunta para mí: sólo puedo ayudarle con fraudes, estafas y "
    "seguridad de su comercio. Cuénteme una situación sospechosa o pregúnteme por una modalidad, por "
    "ejemplo «¿qué es el SIM swap?»."
)

PHISHING = (
    "El phishing es un mensaje (SMS, correo o WhatsApp) que se hace pasar por su banco o una entidad para "
    "que entre a un enlace falso y escriba sus claves.\n"
    "Señales: urgencia («su cuenta será bloqueada»), enlaces acortados o con dominios raros (.xyz, .top), "
    "y peticiones de datos o códigos.\n"
    "Protéjase: nunca entre desde el enlace; escriba usted la dirección oficial o use la app. Si tiene "
    "dudas, pegue aquí el mensaje y reviso el enlace."
)

# Palabras clave → categoría de la ficha a explicar
TOPICS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\b(otp|codigo|codigos|clave dinamica|verificacion)\b"), "codigo_otp"),
    (re.compile(r"\b(sim ?swap|sim|chip|linea|senal|portabilidad)\b"), "sim_swap"),
    (re.compile(r"\b(qr)\b"), "qr_fraudulento"),
    (re.compile(r"\b(comprobante|comprobantes|pantallazo|soporte de pago)\b"), "falso_comprobante"),
    (re.compile(r"\b(prestamo|prestamos|credito|gota a gota)\b"), "prestamo_falso"),
    (re.compile(r"\b(likes|empleo|trabajo|tareas)\b"), "empleo_falso"),
    (re.compile(r"\b(voz clonada|deepfake|nota de voz|audio)\b"), "voz_clonada"),
    (re.compile(r"\b(multa|fotomulta|simit|comparendo|embargo)\b"), "cobro_falso"),
    (re.compile(r"\b(extorsion|vacuna|amenaza|amenazas|gaula)\b"), "extorsion_amenaza"),
    (re.compile(r"\b(familiar|cambie de numero|numero nuevo|mama|mami)\b"), "falso_familiar"),
    (re.compile(r"\b(bre-?b|llave|llaves)\b"), "suplantacion_entidad"),
    (re.compile(r"\b(cripto|bitcoin|inversion|inversiones|piramide)\b"), "inversion_falsa"),
]

_GREETING = re.compile(r"^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|saludos|que tal)\b[\s!.,?]*$")
_THANKS = re.compile(r"^(gracias|muchas gracias|mil gracias|ok gracias|listo gracias|perfecto)\b")
_CAPABILITIES = re.compile(
    r"(que (puedes|puede|sabes|sabe) hacer|como funcionas|como funciona (esto|la app|el asistente)|para que sirves|"
    r"para que sirve (esto|la app|el asistente)|quien eres|que eres|en que (me )?(puedes|puede) ayudar|ayuda\b|como te uso|como lo uso)"
)
_ALREADY = re.compile(r"(ya (le |les )?(di|dio|di el|pase|pague|transferi|consigne|comparti|entregue)|me robaron|me estafaron|cai en)")
_REPORT = re.compile(r"(donde|como|a quien) (denuncio|denunciar|reporto|reportar|aviso)")
_QUESTION = re.compile(r"^(que|como|cual|cuales|donde|cuando|por que|porque|quien|es (seguro|normal|verdad)|puedo|debo|se puede)\b")
_PHISHING = re.compile(r"\b(phishing|smishing|vishing|enlace falso|link falso|correo falso)\b")


def detect(text: str) -> str | None:
    """Tipo de conversación, o None si parece un caso para analizar."""
    clean = normalize(text).strip().lstrip("¿¡").strip()
    if not clean:
        return None
    if _GREETING.match(clean):
        return "saludo"
    if _THANKS.match(clean) and len(clean) < 60:
        return "gracias"
    if _CAPABILITIES.search(clean):
        return "capacidades"
    if _ALREADY.search(clean):
        return "ya_cai"
    if _REPORT.search(clean):
        return "denuncia"
    if _QUESTION.match(clean) or clean.endswith("?"):
        return "pregunta"
    return None


def _modality_reply(conn: sqlite3.Connection, category: str) -> str | None:
    row = conn.execute(
        "SELECT title, summary, red_flags, protect FROM modalities WHERE category = ? AND published = 1 ORDER BY created_at DESC LIMIT 1",
        (category,),
    ).fetchone()
    if not row:
        return None
    flags = json.loads(row["red_flags"])[:3]
    protect = json.loads(row["protect"])[:3]
    return (
        f"{row['title']}: {row['summary']}\n"
        f"Señales de alerta: {'; '.join(flags)}.\n"
        f"Cómo protegerse: {'; '.join(protect)}.\n"
        "En el Centro de aprendizaje tiene un reto sobre esta modalidad."
    )


def reply(conn: sqlite3.Connection, kind: str, text: str) -> str:
    clean = normalize(text)
    if kind == "saludo":
        return GREETING
    if kind == "gracias":
        return THANKS
    if kind == "capacidades":
        return CAPABILITIES
    if kind == "ya_cai":
        return ALREADY_FELL
    if kind == "denuncia":
        return REPORT
    if _PHISHING.search(clean):
        return PHISHING
    for pattern, category in TOPICS:
        if pattern.search(clean):
            answer = _modality_reply(conn, category)
            if answer:
                return answer
    if re.search(r"\b(fraude|estafa|robo|seguridad|banco|nequi|daviplata|bancolombia|enlace|link|mensaje)\b", clean):
        return (
            "Para responderle con precisión, péguelo o cuénteme la situación concreta: qué le dijeron, por "
            "qué canal y qué le pidieron. Si trae un enlace o un número, inclúyalo y lo reviso."
        )
    return OUT_OF_SCOPE
