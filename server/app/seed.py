"""Taxonomía de modalidades de fraude y contenido inicial del Centro de aprendizaje.

Las categorías son las mismas que usa la IA al clasificar un análisis o una
alerta, así las tendencias de la comunidad alimentan directamente los retos.
"""

from __future__ import annotations

CATEGORIES: dict[str, str] = {
    "suplantacion_entidad": "Suplantación de banco o entidad",
    "phishing_enlace": "Enlace de phishing",
    "codigo_otp": "Robo de códigos de verificación",
    "falso_comprobante": "Comprobante de pago falso",
    "falso_familiar": "Familiar o conocido en apuros",
    "prestamo_falso": "Préstamo falso o gota a gota digital",
    "empleo_falso": "Empleo o tareas pagadas falsas",
    "compra_venta": "Compra o venta fraudulenta",
    "qr_fraudulento": "Código QR fraudulento",
    "sim_swap": "Robo de la línea (SIM swap)",
    "extorsion_amenaza": "Extorsión o amenaza",
    "inversion_falsa": "Inversión o cripto falsa",
    "voz_clonada": "Llamada con voz clonada (deepfake)",
    "cobro_falso": "Multa o cobro falso",
    "hurto_violento": "Hurto o riesgo físico",
    "otro": "Otra modalidad",
}


def _challenge(question: str, options: list[tuple[str, bool, str]], explanation: str) -> dict:
    return {
        "question": question,
        "options": [{"text": text, "correct": correct, "feedback": feedback} for text, correct, feedback in options],
        "explanation": explanation,
    }


SEED_MODALITIES: list[dict] = [
    {
        "slug": "llaves-bre-b-falsas",
        "title": "Cobros con llaves Bre-B falsas",
        "category": "suplantacion_entidad",
        "channel": "WhatsApp y SMS",
        "summary": (
            "Con la llegada de los pagos inmediatos Bre-B, los estafadores envían mensajes para "
            "«registrar» o «validar» la llave del comercio en un enlace falso que roba el acceso a la banca."
        ),
        "red_flags": [
            "Le piden registrar la llave por un enlace recibido en un mensaje",
            "El dominio no es el de su banco",
            "Le apuran con que «la llave vence hoy»",
        ],
        "protect": [
            "Registre su llave sólo desde la app oficial de su banco o billetera",
            "Ningún banco pide la clave o el código por WhatsApp",
            "Verifique cada pago recibido en su app antes de entregar el producto",
        ],
        "challenge": _challenge(
            "Llega un SMS: «Su llave Bre-B será desactivada hoy. Valídela en bre-b-colombia.co». ¿Qué hace?",
            [
                ("Entro al enlace y valido la llave", False, "El enlace es de un dominio que no es su banco: es phishing."),
                ("Abro la app oficial de mi banco y reviso mis llaves", True, "Correcto: las llaves sólo se gestionan en la app oficial."),
                ("Respondo el SMS pidiendo más información", False, "Responder confirma que el número está activo."),
            ],
            "Las llaves Bre-B se registran y administran únicamente dentro de la app de su entidad.",
        ),
    },
    {
        "slug": "comprobante-nequi-editado",
        "title": "Comprobante de Nequi o Daviplata editado",
        "category": "falso_comprobante",
        "channel": "En el local y por WhatsApp",
        "summary": (
            "El «cliente» muestra o envía una captura de una transferencia que nunca ocurrió, hecha con "
            "apps que generan comprobantes falsos, y se lleva el producto."
        ),
        "red_flags": [
            "Muestra el pago en su celular pero el dinero no aparece en el suyo",
            "Tipografía, espaciado o logotipo distintos al original",
            "Hora o fecha que no cuadra con la compra",
            "Prisa por llevarse el producto",
        ],
        "protect": [
            "Confirme siempre el ingreso en SU app antes de entregar",
            "Active las notificaciones de pagos recibidos",
            "No acepte capturas de pantalla como prueba de pago",
        ],
        "challenge": _challenge(
            "Un cliente le muestra un comprobante de Nequi por $480.000 y dice que tiene afán. ¿Qué hace?",
            [
                ("Entrego el producto, el comprobante se ve real", False, "Los comprobantes falsos son idénticos a simple vista."),
                ("Reviso en mi app que el dinero llegó antes de entregar", True, "Correcto: la única prueba es el saldo en su cuenta."),
                ("Le pido que me reenvíe la captura por WhatsApp", False, "Una captura reenviada sigue sin ser prueba de pago."),
            ],
            "El comprobante no es el pago: sólo cuenta el dinero acreditado en su cuenta.",
        ),
    },
    {
        "slug": "mama-cambie-de-numero",
        "title": "«Mamá, cambié de número»",
        "category": "falso_familiar",
        "channel": "WhatsApp",
        "summary": (
            "Un número desconocido se presenta como su hijo, sobrino o socio que «perdió el celular» y "
            "pide una transferencia urgente a una cuenta de un tercero."
        ),
        "red_flags": [
            "Número nuevo que dice ser un familiar",
            "Evita llamadas o notas de voz",
            "Pide transferir a una cuenta a nombre de otra persona",
        ],
        "protect": [
            "Llame al número antiguo de su familiar",
            "Haga una pregunta que sólo la persona real sabría",
            "Acuerde una palabra clave familiar",
        ],
        "challenge": _challenge(
            "«Hola tía, este es mi número nuevo, necesito que me pase $300.000 a esta cuenta, es urgente». ¿Qué hace?",
            [
                ("Llamo al número de siempre de mi sobrino", True, "Correcto: verificar por otro canal desarma la estafa."),
                ("Transfiero, es familia", False, "Es exactamente lo que buscan: urgencia y confianza."),
                ("Le pido una foto", False, "Pueden usar fotos tomadas de las redes sociales."),
            ],
            "Ante un número nuevo que pide dinero, verifique siempre por el canal que ya conocía.",
        ),
    },
    {
        "slug": "prestamo-app-extorsiva",
        "title": "Apps de préstamo exprés que extorsionan",
        "category": "prestamo_falso",
        "channel": "Redes sociales y tiendas de apps",
        "summary": (
            "Prometen crédito sin estudio. Piden acceso a contactos y fotos y, tras un pequeño préstamo, "
            "cobran intereses abusivos y amenazan con difundir datos a sus contactos."
        ),
        "red_flags": [
            "Préstamo «sin estudio» y aprobado en minutos",
            "La app pide permiso a contactos, fotos o SMS",
            "Cobran un «seguro» o «estudio» antes del desembolso",
        ],
        "protect": [
            "Verifique que la entidad esté vigilada por la Superintendencia Financiera",
            "No conceda permisos de contactos ni de galería a apps de crédito",
            "Si lo amenazan, denuncie: es extorsión",
        ],
        "challenge": _challenge(
            "Una app le aprueba $1.000.000 en 5 minutos, pero antes debe pagar $90.000 de «seguro». ¿Qué hace?",
            [
                ("Pago el seguro, es poco", False, "El cobro anticipado es la estafa: el préstamo nunca llega."),
                ("Consulto si la entidad está vigilada por la Superfinanciera", True, "Correcto: las entidades legales se pueden verificar."),
                ("Doy acceso a mis contactos para que me aprueben más", False, "Usarán los contactos para presionarlo."),
            ],
            "Ninguna entidad legal cobra por adelantado para desembolsar un crédito.",
        ),
    },
    {
        "slug": "tareas-de-likes",
        "title": "Trabajo de «dar likes» pagado",
        "category": "empleo_falso",
        "channel": "WhatsApp y Telegram",
        "summary": (
            "Ofrecen dinero por dar «me gusta» o reseñas. Pagan pequeñas sumas al inicio y luego piden "
            "«invertir» para desbloquear tareas mejor pagadas que nunca se devuelven."
        ),
        "red_flags": [
            "Oferta de empleo que no solicitó",
            "Pagos pequeños al inicio para ganar confianza",
            "Le piden depositar para «subir de nivel»",
        ],
        "protect": [
            "Un empleo real nunca le pide dinero",
            "Desconfíe de grupos de Telegram con «mentores»",
            "Reporte y bloquee el número",
        ],
        "challenge": _challenge(
            "Ya le pagaron $20.000 por dar likes. Ahora le piden $200.000 para tareas «VIP». ¿Qué hace?",
            [
                ("Deposito, ya me pagaron antes", False, "El primer pago es el anzuelo para que deposite más."),
                ("Salgo del grupo y reporto el número", True, "Correcto: es una estafa piramidal de tareas."),
                ("Deposito la mitad para probar", False, "Cualquier depósito se pierde."),
            ],
            "Si un trabajo le pide dinero para seguir trabajando, no es un trabajo.",
        ),
    },
    {
        "slug": "qr-pegado-encima",
        "title": "Código QR pegado encima del original",
        "category": "qr_fraudulento",
        "channel": "En el local",
        "summary": (
            "Pegan un QR falso sobre el del comercio para que los pagos de los clientes lleguen a la "
            "cuenta del estafador."
        ),
        "red_flags": [
            "El adhesivo del QR está despegado o superpuesto",
            "El nombre del destinatario al escanear no es el del comercio",
            "Clientes dicen haber pagado y el dinero no llega",
        ],
        "protect": [
            "Revise su QR cada mañana y protéjalo con una lámina",
            "Pida al cliente confirmar el nombre del comercio antes de pagar",
            "Concilie pagos durante el día",
        ],
        "challenge": _challenge(
            "Dos clientes dicen que pagaron por QR pero no ve el dinero. ¿Qué revisa primero?",
            [
                ("Que el QR del mostrador sea el original", True, "Correcto: es la señal típica de un QR superpuesto."),
                ("Reinicio el celular", False, "El problema no está en su teléfono."),
                ("Les pido que paguen otra vez", False, "Primero revise el QR o el segundo pago también se pierde."),
            ],
            "Cuando varios pagos «no llegan», sospeche de un QR adulterado en el local.",
        ),
    },
    {
        "slug": "sim-swap-portabilidad",
        "title": "Robo de la línea celular (SIM swap)",
        "category": "sim_swap",
        "channel": "Operador móvil",
        "summary": (
            "Con datos suyos, el estafador duplica su SIM en el operador y recibe sus códigos de "
            "verificación para vaciar las cuentas."
        ),
        "red_flags": [
            "Su celular se queda sin señal de repente",
            "Le llega un aviso de cambio de SIM que no pidió",
            "Le llaman «del operador» pidiendo datos",
        ],
        "protect": [
            "Pida a su operador un PIN o clave para cambios de SIM",
            "Use apps de autenticación en lugar de SMS cuando pueda",
            "Si pierde señal sin razón, llame a su banco y operador",
        ],
        "challenge": _challenge(
            "Su celular quedó «sin servicio» de la nada y llega un correo de cambio de clave del banco. ¿Qué hace?",
            [
                ("Espero a que vuelva la señal", False, "Cada minuto cuenta: pueden estar recibiendo sus códigos."),
                ("Llamo de inmediato al banco y al operador desde otro teléfono", True, "Correcto: bloquee cuentas y la línea."),
                ("Reinicio el teléfono varias veces", False, "No resuelve un duplicado de SIM."),
            ],
            "Pérdida de señal + alertas del banco = posible SIM swap. Actúe de inmediato.",
        ),
    },
    {
        "slug": "voz-clonada-gerente",
        "title": "Llamada con voz clonada",
        "category": "voz_clonada",
        "channel": "Llamada y nota de voz",
        "summary": (
            "Con unos segundos de audio de redes sociales, clonan la voz de un familiar, jefe o "
            "proveedor para pedir pagos urgentes."
        ),
        "red_flags": [
            "La voz suena conocida pero la petición es rara",
            "Pide no contarle a nadie",
            "La llamada se corta si hace preguntas",
        ],
        "protect": [
            "Cuelgue y devuelva la llamada al número que ya tiene",
            "Use una palabra clave con familiares y socios",
            "No haga pagos sólo por una nota de voz",
        ],
        "challenge": _challenge(
            "Su proveedor le manda una nota de voz: «Cambié de cuenta, consígneme hoy a esta». ¿Qué hace?",
            [
                ("Consigno, reconozco su voz", False, "La voz puede ser clonada con IA."),
                ("Llamo al número de siempre del proveedor para confirmar", True, "Correcto: confirme por un canal conocido."),
                ("Le pido otra nota de voz", False, "Otra nota de voz también puede ser falsa."),
            ],
            "Un cambio de cuenta bancaria siempre se confirma por un canal que usted ya conocía.",
        ),
    },
    {
        "slug": "fotomulta-simit-falsa",
        "title": "Fotomulta o cobro del SIMIT falso",
        "category": "cobro_falso",
        "channel": "SMS y correo",
        "summary": (
            "Mensajes que avisan de una fotomulta, un embargo o un cobro de servicios con un enlace de "
            "pago que roba los datos de la tarjeta."
        ),
        "red_flags": [
            "Enlace acortado o dominio distinto a fcm.org.co / simit",
            "Amenaza de embargo inmediato",
            "Pide datos completos de la tarjeta",
        ],
        "protect": [
            "Consulte multas sólo en el sitio oficial del SIMIT escribiéndolo usted",
            "No pague desde enlaces recibidos por SMS",
            "Revise el dominio antes de escribir datos",
        ],
        "challenge": _challenge(
            "SMS: «Tiene una fotomulta pendiente. Evite embargo pagando en simit-pagos.top». ¿Es confiable?",
            [
                ("Sí, el SIMIT existe", False, "El SIMIT existe, pero ese dominio .top no es el oficial."),
                ("No, consulto escribiendo yo la dirección oficial", True, "Correcto: nunca pague desde el enlace del mensaje."),
                ("Pago para evitar el embargo", False, "La urgencia por embargo es una táctica de presión."),
            ],
            "Las entidades oficiales usan dominios oficiales; los .top, .xyz o acortados son señal de phishing.",
        ),
    },
    {
        "slug": "extorsion-falso-grupo",
        "title": "Extorsión a comercios por «cuota de seguridad»",
        "category": "extorsion_amenaza",
        "channel": "Llamada, WhatsApp y en persona",
        "summary": (
            "Se presentan como un grupo armado o una banda y exigen una «vacuna» para no atentar contra "
            "el negocio. A veces envían fotos del local o de armas para intimidar."
        ),
        "red_flags": [
            "Mencionan datos de su negocio o familia para asustar",
            "Envían fotos de armas o del local",
            "Exigen pagos por Nequi o a cuentas de terceros",
        ],
        "protect": [
            "No pague ni negocie: llame al 165 (GAULA) o al 123",
            "Guarde audios, números y capturas como evidencia",
            "Avise a la red del barrio para que nadie más ceda",
        ],
        "challenge": _challenge(
            "Le escriben con una foto de su local y de un arma exigiendo $500.000 semanales. ¿Qué hace?",
            [
                ("Pago para evitar problemas", False, "Pagar alimenta la extorsión y casi siempre aumenta el cobro."),
                ("Guardo la evidencia y llamo al GAULA (165)", True, "Correcto: el GAULA atiende la extorsión de forma gratuita."),
                ("Respondo con amenazas", False, "Lo expone a un riesgo mayor."),
            ],
            "La extorsión se denuncia en la línea 165 del GAULA. La red le ayuda a no estar solo.",
        ),
    },
]
