# Arquitectura de la IA antifraude

Documento técnico del equipo: cómo se analiza un caso, cómo funciona la red
de alertas, qué medidas de seguridad y privacidad se aplican y qué expone la
API.

## 1. Flujo de análisis de un caso

```
 Usuario ──► texto / voz (navegador) / capturas / notas de voz / .txt
               │
               ▼
 POST /api/analyze  (FastAPI)
   1. Validación de entrada (tamaño, tipo real del archivo, límite por IP)
   2. Imágenes: se verifican con Pillow, se leen pistas de edición del EXIF
      (Photoshop, PicsArt…) y se re-codifican SIN metadatos
   3. Audio: transcripción con faster-whisper (opcional)
   4. Fuentes deterministas
        · reglas (server/app/services/rules.py) – 19 reglas de modalidades colombianas
        · enlaces (links.py) – suplantación de marcas, punycode, IP, acortadores,
          TLD de riesgo, palabras de gancho, edad del dominio por RDAP
        · base comunitaria – teléfonos, cuentas y dominios ya reportados
   5. IA – Gemini o Claude (AI_PROVIDER) – una sola llamada con imágenes,
        texto e historial: primero decide si es una pregunta (conversación)
        o un caso; en un caso hace OCR, clasificación, revisión del
        comprobante y amenazas visuales (salida JSON con esquema estricto)
   6. Fusión: la IA decide, pero las reglas graves fijan un piso
        (nunca «limpio» si piden el OTP o hay un número reportado)
   7. Registro anónimo: sólo veredicto, modalidad y localidad (sin contenido)
               │
               ▼
 Respuesta: veredicto, riesgo, modalidad, señales, acciones, enlaces,
            identificadores, comprobante, amenazas, emergencia
```

**Conversación.** Si el usuario saluda o pregunta algo («¿qué puedes hacer?»,
«¿qué es el SIM swap?», «¿dónde denuncio?», «¿qué hago si ya di la clave?»), el
asistente responde en lugar de dar un veredicto, y esas preguntas no cuentan
en las estadísticas. Con IA, el modelo decide la intención y usa los últimos 6
turnos para las preguntas de seguimiento; sin IA, `server/app/services/assistant.py`
reconoce la intención y responde con las fichas del Centro de aprendizaje. Si
hay imágenes, enlaces de riesgo, números reportados o señales de fraude, siempre
se analiza como caso, aunque el modelo crea que es una pregunta.

**Motor híbrido** (`src/lib/ai/engine.ts`):

| Situación | Qué pasa |
|---|---|
| Backend con clave de Gemini o Claude | La IA hace OCR, análisis y visión; el backend cruza con la comunidad. |
| Backend sin clave | El servidor pide al navegador el OCR (`client_ocr_requested`); Tesseract.js lee la captura y se reenvía el texto. MediaPipe busca armas en las imágenes. |
| Sin backend | Todo en el navegador: reglas (`src/data/fraud.ts`), enlaces (`src/lib/ai/links.ts`), OCR y visión. |

**Proveedores** (`AI_PROVIDER=auto|gemini|claude|local`): con `auto` se usa Claude si hay
`ANTHROPIC_API_KEY`, si no Gemini si hay `GEMINI_API_KEY`, si no el motor local. Gemini
(`GEMINI_MODEL`, por defecto `gemini-3.5-flash`) tiene plan gratuito con límites. Si el modelo
está saturado (503), sin cuota (429) o retirado (404) se prueban en orden los de
`GEMINI_FALLBACK_MODELS`; si todos fallan, el backend sigue con el motor local. La IA tiene
prohibido escribir teléfonos o direcciones de bancos de memoria (podría inventarlos). En el plan gratuito Google
puede usar el contenido enviado para mejorar sus productos: para la demo está bien, no
para datos reales de víctimas.

Modelo de Claude por defecto: `claude-opus-5-5` con razonamiento adaptativo y esfuerzo
`medium` (configurable en `server/.env`). Se activa el respaldo automático de
modelo del lado del servidor (`fallbacks: "default"`) por si una petición es
rechazada; si aun así falla, se responde con el motor local.

## 2. Red comunitaria de alertas

- `POST /api/alerts` publica una alerta (nivel, modalidad, descripción,
  identificadores del estafador y foto opcional).
- La **foto** se analiza primero en el navegador (MediaPipe): detecta
  cuchillos u objetos cortantes y **pixela los rostros** antes de subirla. En
  el servidor se le borra el EXIF (GPS) y, con IA activa, Claude la revisa
  en busca de armas, violencia o amenazas escritas. Un arma detectada sube la
  alerta a nivel «Incidente» y muestra el aviso de llamar al 123.
- Las alertas se difunden **en vivo** por Server-Sent Events
  (`GET /api/alerts/stream`) al mapa del barrio, a la vista isométrica, al
  panel de alertas y al chat de la comunidad.
- «A mí también me pasó» suma confirmaciones (una por persona).
- **Moderación**: con `ALERTS_AUTO_PUBLISH=true` se publican al instante como
  «sin verificar»; un moderador las verifica o las rechaza. Rechazar una
  alerta **retira sus identificadores** de la base de reportes, para no
  señalar a nadie sin pruebas.

## 3. Centro de aprendizaje que se actualiza

- `GET /api/education/modalities` devuelve las fichas (señales, cómo
  protegerse y un reto de opción múltiple), ordenadas por los reportes de los
  últimos 30 días.
- Se parte de 10 modalidades vigentes en Colombia (llaves Bre-B falsas,
  comprobantes editados, «mamá cambié de número», préstamos extorsivos,
  tareas de likes, QR superpuesto, SIM swap, voz clonada, fotomultas falsas,
  extorsión a comercios).
- Desde el panel de la red, `POST /api/moderation/modalities/generate` toma
  las modalidades con al menos 2 alertas en 30 días y crea una ficha nueva
  (con Claude si está activo; con una plantilla si no). El reto se valida
  (exactamente una opción correcta) antes de publicarse.

## 4. Seguridad y privacidad

| Riesgo | Medida |
|---|---|
| Inyección de instrucciones en el mensaje analizado | El contenido va dentro de `<contenido_no_confiable>`; el sistema ordena tratarlo como datos y la respuesta se fuerza a un esquema JSON. Las reglas deterministas fijan un piso que la IA no puede bajar (prueba `test_ai_cannot_clear_hard_rule_signals`). |
| Abuso / costo de la IA | Límite de peticiones por IP (`RATE_LIMIT_PER_MINUTE`), tamaño máximo de texto e imágenes, máximo 5 archivos. |
| Archivos maliciosos | Se verifica que la imagen sea real (Pillow) y se re-codifica; los nombres en disco son aleatorios y la ruta de descarga sólo acepta `[0-9a-f]{24}.jpg` (sin `../`). |
| Fuga de ubicación | Se eliminan los metadatos EXIF de todas las imágenes (navegador y servidor). |
| Datos personales (Ley 1581 de 2012) | Cédulas, tarjetas, correos y direcciones se ocultan en el texto de las alertas; los rostros se pixelan; los identificadores reportados se guardan como HMAC con sal y se muestran enmascarados (`300 *** 4567`); las IPs se guardan seudonimizadas; los análisis no guardan contenido. |
| Falsas acusaciones | Estado «sin verificar» visible, moderación y retiro de identificadores al rechazar. |
| Acceso al panel | Token de moderación en cabecera, comparado en tiempo constante; en el navegador sólo vive en `sessionStorage`. |
| XSS | El texto de usuarios se pinta con React o `textContent` (tooltips del mapa, documento de denuncia). |
| Cabeceras | `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store` en la API, CORS restringido. |
| Secretos | Claves en `server/.env` (en `.gitignore`); nunca en el frontend. |

**Pendiente para producción**: autenticación real de comercios (hoy cualquiera
puede publicar una alerta, limitada por IP), HTTPS, Redis para el límite de
peticiones y la difusión con varios procesos, copia de seguridad de la base y
política de retención de las fotos.

## 5. API

Documentación interactiva en `http://127.0.0.1:8000/docs`.

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/status` | IA activa, modelo, transcripción disponible |
| POST | `/api/analyze` | Analiza texto, capturas, notas de voz (`multipart/form-data`) |
| GET | `/api/links/check?url=` | Análisis técnico de un enlace |
| GET | `/api/reports/lookup?value=` | ¿Este número, cuenta o enlace fue reportado? |
| GET | `/api/alerts` | Alertas públicas (filtros `network_id`, `community_id`) |
| POST | `/api/alerts` | Publica una alerta |
| POST | `/api/alerts/{id}/confirm` | «A mí también me pasó» |
| GET | `/api/alerts/stream` | Alertas en vivo (SSE) |
| GET | `/api/education/modalities` | Fichas y retos vigentes |
| GET | `/api/stats/trends` | Tendencias por modalidad, localidad y día |
| POST | `/api/merchants` | Solicitud de verificación de un comercio |
| GET/PATCH | `/api/moderation/alerts[/{id}]` | Moderación de alertas (token) |
| GET/PATCH | `/api/moderation/merchants[/{id}]` | Verificación de comercios (token) |
| POST | `/api/moderation/modalities/generate` | Genera retos desde los reportes (token) |

## 6. Transcripción de notas de voz

En vivo, la voz se transcribe con el reconocimiento del navegador (Chrome y
Edge). Para analizar **notas de voz de WhatsApp** (`.ogg`, `.opus`, `.m4a`)
en el servidor, instale `faster-whisper` en el entorno del backend:

```bash
cd server && .venv/Scripts/python -m pip install faster-whisper
```

El modelo (`WHISPER_MODEL`, por defecto `base`) se descarga la primera vez.

## 7. Cámara del comercio afectado y avisos

Cuando se publica una alerta, el **comercio afectado** (el comercio verificado que
la reporta, o el que elige quien la reporta) muestra su cámara a la comunidad del
barrio durante `CAMERA_WINDOW_MINUTES` (30 por defecto) y se notifica a todos.

| Pieza | Cómo funciona |
|---|---|
| **Modo cámara** (celular o tablet del local) | Pantalla «Modo cámara» con `getUserMedia`: sube una imagen cada 4 s y una por segundo mientras hay una alerta del comercio. Los **rostros se pixelan en el propio dispositivo** (MediaPipe) antes de salir. Si llega una alerta del comercio: alarma sonora, pantalla roja y botón «Llamar al 123». |
| **Cámara IP** | El comercio registra la URL de una instantánea JPEG o un flujo MJPEG; **un moderador la aprueba**. El servidor consulta la cámara y reenvía la imagen: la URL nunca llega al navegador. Se bloquean loopback, link-local y URLs con credenciales (SSRF). RTSP necesita un convertidor (p. ej. go2rtc o MediaMTX). |
| **Evidencia** | Al crear la alerta se guardan las imágenes recientes de la cámara (`alert_evidence`), servidas sólo mientras la alerta no sea rechazada. |
| **Aviso en la app** | Aviso flotante con sonido (Web Audio) en cualquier ventana; alarma prioritaria si la alerta es del comercio de este navegador. |
| **Web Push** | `public/sw.js` + claves VAPID (`server/data/vapid_private.pem`, se generan solas). Llega aunque la página esté cerrada; al pulsarla abre la alerta con la cámara. |

Requisitos: la cámara del navegador y Web Push sólo funcionan en un **contexto
seguro** (`https://` o `localhost`). Para usar un celular de la red local hay que
servir la web con HTTPS.

Riesgos aceptados por decisión del equipo: la cámara es visible para **toda la
comunidad** durante la alerta y se activa con **cualquier alerta**. Mitigaciones:
ventana de tiempo, consentimiento del comercio (aviso de videovigilancia, Ley 1581),
rostros pixelados en modo dispositivo, URL de la cámara IP oculta y aprobada por un
moderador, y alertas rechazadas que dejan de mostrar cámara y evidencia.
