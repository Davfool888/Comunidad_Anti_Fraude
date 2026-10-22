# Red Segura de Comercios

Producto educativo de **prevención de fraudes en Colombia**: una red de
comercios verificados con un asistente que analiza intentos de fraude, un
mapa del barrio con las casas reales y un centro de aprendizaje con ocho
juegos interactivos.

Construido con **React 19 + TypeScript + Vite + Tailwind CSS v4**,
**Three.js (react-three-fiber)** para la escena isométrica y **Leaflet** para
los mapas. El backend (`server/`) es **FastAPI + SQLite** y la IA es
**Gemini** (gratis, con límites) o **Claude** (de pago), con respaldo local en el navegador
(**Tesseract.js** para leer capturas y **MediaPipe** para detectar armas y
rostros).

## Puesta en marcha

Requisitos: Node 20.19+ y Python 3.12.

```bash
# 1. Frontend (descarga también los modelos de visión a public/)
npm install

# 2. Backend
cd server
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # Windows
# .venv/bin/python -m pip install -r requirements.txt     # macOS / Linux
cp .env.example .env        # y completa GEMINI_API_KEY (o ANTHROPIC_API_KEY) y MODERATOR_TOKEN
cd ..

# 3. Arrancar (dos terminales)
npm run dev:api             # API en http://127.0.0.1:8000  (docs en /docs)
npm run dev                 # web en http://localhost:5173 (redirige /api al backend)

# Pruebas
npm test                    # tipos + lint + build del frontend
npm run test:api            # pruebas del backend
```

**Sin ninguna clave de IA todo sigue funcionando** con el motor local: reglas,
análisis de enlaces, base comunitaria, OCR y detección de objetos en el
navegador. **Sin backend**, el análisis se hace por completo en el navegador
(las alertas y el panel de la red necesitan el backend).

## Qué hay aquí

La aplicación tiene **cuatro ventanas** que se conmutan desde la cabecera:

| Ventana | Contenido |
|---|---|
| **Analizar fraude** | Asistente con IA: responde preguntas («¿qué puedes hacer?», «¿qué es el SIM swap?») y recuerda la conversación; se le habla, se le escribe o se le pasan capturas, notas de voz y comprobantes. Devuelve el veredicto, la modalidad, las señales, el análisis de cada enlace, la revisión del comprobante, las amenazas en la imagen y qué hacer. Desde la respuesta se alerta a la red o se genera la denuncia. |
| **Comunidades** | Alertas **en vivo** de la red (SSE) sobre el **mapa del barrio** y la **vista isométrica**, el panel de alertas con «a mí también me pasó», la consulta de números/enlaces reportados y el chat del barrio. |
| **Centro de aprendizaje** | Los ocho juegos de prevención y las **modalidades vigentes**: retos que se actualizan con lo que reporta la comunidad. |
| **Panel de la red** | Moderación (verificar o rechazar alertas y comercios), tendencias por modalidad y localidad, y generación de retos nuevos desde los reportes. Pide el token de moderación. |

La arquitectura de la IA, las medidas de seguridad y la API están en
[`docs/arquitectura-ia.md`](docs/arquitectura-ia.md).

## Estructura

```
src/
├─ components/
│  ├─ three/
│  │  ├─ network/          ← la escena isométrica
│  │  │  ├─ NetworkCanvas  Canvas + postprocesado (bloom + viñeta)
│  │  │  ├─ NetworkScene   cámara, luces, niebla y montaje de la escena
│  │  │  ├─ layout.ts      posiciones de tiendas, rutas de neón y nubes
│  │  │  ├─ palette.ts     paleta pastel de la escena
│  │  │  ├─ Shop.tsx       edificio parametrizado (tejado, toldo, rótulo, props)
│  │  │  ├─ arrangement.ts disposición de los comercios de cada barrio
│  │  │  ├─ Core.tsx       núcleo geodésico + rótulos
│  │  │  ├─ Pipes.tsx      tubos de neón con envoltura de cristal
│  │  │  ├─ Ground.tsx     suelo de azulejos
│  │  │  ├─ Clouds.tsx     nubes de geometría fusionada
│  │  │  ├─ Person.tsx     figura humana estilizada
│  │  │  ├─ Pedestal.tsx   pantalla elevada con insignia
│  │  │  ├─ VerifiedBadge  distintivo «Comercio verificado»
│  │  │  ├─ SceneLabel     plano de texto dibujado en canvas
│  │  │  └─ textures.ts    generador de texturas de canvas (rótulos, iconos)
│  │  ├─ parts/            piezas 3D reutilizables del diseño original
│  │  ├─ icons/            mini-ilustraciones (WhatsApp, SMS, llamadas…)
│  │  └─ scenes/           mini-escenas de las tarjetas inferiores
│  └─ ui/                  cabecera, panel de estadísticas y secciones
├─ data/
│  ├─ localidades.ts       polígonos de las 20 localidades (oficial)
│  ├─ comunidades.ts       comunidades de barrio por localidad (oficial)
│  ├─ businesses.ts        catálogo de comercios (nombre, rótulo y tipo)
│  ├─ networks.ts          redes comunitarias: comercios, estadísticas y comunidades
│  ├─ chat.ts              conversación simulada de cada comunidad de barrio
│  ├─ fraud.ts             motor de análisis de fraude (reglas y veredictos)
│  ├─ education.ts         contenido de las lecciones educativas
│  └─ learning/            contenido de los ocho juegos de prevención
├─ lib/
│  ├─ palette.ts           paleta central de la marca
│  ├─ useViewport.ts       visibilidad de los lienzos 3D (montaje y pausa)
│  ├─ educationProgress.ts progreso de las lecciones
│  └─ learning/            motor de evaluación y progreso de los juegos
└─ ...
```

## Arquitectura de los comercios

Cada tienda tiene **arquitectura propia**: no comparten plantilla, sólo el
lenguaje (bordes redondeados, marquesina ondulada, rótulo de neón, props y
figura). Se construyen en `network/Shop.tsx` y hay **doce tipos** de edificio,
uno por cada tipo de negocio de la red:

| Comercio | Arquitectura | Rasgos distintivos |
|---|---|---|
| **Tienda de Moda** | Dos plantas | Bloque rosa retranqueado con cubierta muy volada, planta baja de estuco, escaparate abierto a la izquierda con **percha de ropa en el exterior**, macetas con suculentas, rótulo en el borde derecho |
| **Electrónica (naranja)** | Cubo con cubierta volada | Muros mantequilla, **ventanal cálido** a la izquierda, marquesina a la derecha, **banderola sobre poste**, pizarra A-frame y panel solar |
| **Servicios Profesionales** | Dos plantas, más alto | Bloque violeta, **ventanas verticales hundidas de marco blanco** en las dos caras visibles, árboles junto a la entrada |
| **Mercado Gourmet** | Volumen blando muy redondeado | Muro turquesa, **marquesina coral y blanca**, mostrador de fruta y verduras delante, árboles grandes a la izquierda, pizarra de madera en el suelo |
| **Electrónica (amarilla)** | Cubo con cubierta volada | Muros amarillos, **rótulo sobre placa de grafito** (no naranja), escaparate abierto con el expositor tecnológico a la vista, panel publicitario vertical, losa melocotón |
| **Panadería** | Dos plantas con cúpula | Bloque de ladrillo pastel, **cúpula de horno** y chimenea en el tejado, bandejas de pan en la acera, toldo a rayas |
| **Farmacia** | Bloque con banda de color | **Cruz verde** en la fachada, escaparate y puerta de cristal, banco y macetas en la entrada, pizarra |
| **Cafetería** | Volumen bajo y ancho | **Terraza con dos mesas y sombrillas**, mostrador saliente, guirnalda de luces, pizarra de menú |
| **Floristería** | Bloque con **lucernario de cristal** | Cúpula acristalada sobre el tejado, macetas de flores de colores, árbol en la esquina |
| **Librería** | Bloque alto y estrecho | Ventanal alto con **estanterías**, pila de libros en la acera, banco de lectura, puerta de color |
| **Petshop** | Bloque con casita | **Caseta de perro**, cuenco y pelota, pizarra, matorral |
| **Óptica** | Bloque con **escaparate curvo** | Media bóveda de cristal, emblema de gafas, expositor, banderola |
| **Papelería** | Quiosco pequeño | Marquesina a rayas, **expositor de cuadernos**, pila de libros, mostrador |

Piezas compartidas: `ScallopedAwning` (casquete cilíndrico con festón de
medias lunas), `NeonSign` (rótulo de neón), `ShopBase`, `ShopRoof`, y los
props (`ProductShelf`, `Counter`, `TechDesk`, `CpuTower`, `WallPoster`,
`BannerPole`, `ClothingRack`, `ProduceStand`, `RoundTree`, `Succulent`,
`AFrameBoard`, `SolarPanel`, `BreadShelf`, `FlowerPot`, `CafeTable`,
`BookStack`, `DogHouse`, `PetBowl`, `GlassesMark`, `NotebookRack`).

### Cada barrio acomoda sus edificios de forma distinta

`network/arrangement.ts` reparte los comercios de la comunidad activa:

- **Orden**: los negocios del barrio se barajan, así que la panadería puede
  salir la primera o la última.
- **Posición**: hay 8 **plazas independientes** (que nunca se solapan) más 12
  de reserva; cada barrio toma un subconjunto distinto y añade un pequeño
  desplazamiento aleatorio.
- **Tipo**: cada negocio usa su edificio (una panadería siempre es una
  panadería, un petshop siempre es un petshop).
- **Color**: cada barrio reparte entre sus edificios una paleta distinta
  entre 12 combinaciones (rosa, naranja, amarillo, turquesa, púrpura,
  melocotón, cielo, lila, coral, menta, limón y verde).

Todo es **determinista**: el mismo barrio siempre se ve igual, pero dos
barrios nunca se ven iguales (116 combinaciones distintas para las 116
comunidades de la ciudad).

Los **tubos de neón** se recalculan a partir de la posición real de cada
edificio, así que el cableado sigue a los comercios aunque se reordenen, y
las **nubes** se apartan para no tapar a los edificios.

## Vegetación y detalles

Pieza clave del estilo "soft pop" de la referencia. Tres piezas botánicas
reutilizables en `network/Shop.tsx` y `network/Ground.tsx`:

- `RoundTree` — árbol de copa esponjosa (tres esferas solapadas) con tronco
  fino; admite variante `tall` para los setos de topiario.
- `Bush` — mata baja de tres esferas.
- `GrassTuft` —zamillas cónicas; y una variante con florecillas de colores.
- `Succulent` — maceta cilíndrica con hojas redondeadas.

Colocación (siguiendo la referencia):
- **Mercado Gourmet**: arboleda de tres árboles en la esquina delantera-izquierda.
- **Servicios Profesionales**: seto alto delante-izquierda de la puerta y
  arbustos delante-derecha.
- **Tienda de Moda**: arbolito en la esquina trasera y macetas en la entrada.
- **Electrónica**: maceta junto a la pizarra (naranja) y sobre el mostrador
  (amarilla).
- **Suelo**: 16 matas, arbustos y florecillas dispersos por la rejilla.

## Red comunitaria y mapa de Bogotá (Leaflet)

La portada permite **cambiar de red comunitaria** (`NetworkSwitcher`). Cada
**localidad de Bogotá** es una red comunitaria con sus propios comercios y sus
propias estadísticas.

### Las 20 localidades con sus límites reales

`src/data/localidades.ts` contiene los polígonos de las 20 localidades de
Bogotá con su color y su centroide. La fuente es **oficial**: la capa
"Localidad" de la Secretaría Distrital de Planeación / Catastro Distrital
(`serviciosgis.catastrobogota.gov.co`), la misma que publica el portal de
Datos Abiertos de la ciudad. Los polígonos se simplificaron (Douglas-Peucker,
~120 m) para que el módulo pese ~60 KB en vez de varios megas.

Cada localidad tiene su propio color pastel (20 tonos equiespaciados) y se
dibuja como una zona coloreada sobre el mapa.

- El botón de la cabecera abre un panel con el **mapa real de Bogotá**
  (Leaflet + teselas de Esri). Las localidades se dibujan como polígonos de
  color; la activa se resalta y el resto queda atenuado.
- Una **leyenda** sobre el mapa lista las 20 localidades con su color, y el
  lateral las agrupa por **comuna** (Suba, Chapinero, Usme, Kennedy…).
- Al elegir una localidad se muestra su ficha (comercios, verificados,
  satisfacción, fraude bloqueado) y el botón **«Entrar en la red de X»**
  activa esa red.
- Un **mini-mapa** flotante en la escena sitúa la red activa dentro de
  Bogotá, con su polígono resaltado.
- Cambiar de red **re-etiqueta la escena 3D**: los rótulos de neón de las
  tiendas pasan a ser los comercios de la localidad, el núcleo pasa a llamarse
  «NÚCLEO DE &lt;LOCALIDAD&gt;», el aro del pedestal toma el color de la
  localidad y el panel de estadísticas muestra sus datos.

Componentes Leaflet:

| Archivo | Papel |
|---|---|
| `ui/CommunityMap.tsx` | Mapa interactivo del panel (polígonos, puntos de comunidad, tooltips, zoom) |
| `ui/NetworkMiniMap.tsx` | Mini-mapa de sólo lectura en la escena |
| `ui/NetworkSwitcher.tsx` | Conmutador de red comunitaria (mapa de barrios + ficha) |
| `ui/tileSources.ts` | Proveedor de teselas con repliegue automático |

## Chat de la comunidad

El botón **«Chat»** de la cabecera (junto a *Analizar fraude*) salta a la
sección `#chat`: el grupo de conversación de la **comunidad de barrio activa**.

- **Integrantes**: cada comercio verificado del barrio tiene su propia
  conversación (avatar con iniciales, color, insignia de verificado y estado
  «en línea»). Al pulsar uno se abre un chat privado con esa persona; el
  botón «Volver al grupo» regresa a la conversación del barrio.
- **Mensajes**: burbujas blancas con el nombre del comercio que escribe, la
  hora debajo y separadores de día («Hoy», «Ayer», «Domingo 12 de mayo»).
  Los mensajes enviados por el usuario salen en violeta, a la derecha.
- **Avisos de la comunidad**: tarjetas a todo el ancho, con **color según el
  tipo** y el **nombre del comercio que lo reportó**, el día y la hora:
  - 🔴 **rojo — Incidente**: fraude confirmado, suplantación, cobro doble.
  - 🟡 **amarillo — Precaución**: no compartir códigos, revisar saldos,
    no entregar sin registrar la venta.
  - 🔵 **azul — Comunicado**: novedades de la red, reuniones, actualizaciones
    de la app.
- **Redactor**: se puede escribir y enviar (Enter o el botón). La comunidad
  responde con un mensaje simulado tras 1,4 s, con indicador de «escribiendo».

Los datos salen de `src/data/chat.ts`: la conversación es **determinista**
(misma comunidad → mismos mensajes) y se construye con los nombres de
comercio del barrio, los avisos de la red y marcas de tiempo repartidas en
los tres últimos días. El color de los avisos se alterna barajando
`danger / warning / info`, de modo que toda conversación tenga al menos un
incidente, una precaución y un comunicado.

Componentes:

| Archivo | Papel |
|---|---|
| `ui/CommunityChat.tsx` | Interfaz del chat (integrantes, mensajes, avisos, redactor) |
| `data/chat.ts` | Simulación determinista de la conversación y de los integrantes |

## Rendimiento

La página tiene una escena 3D a pantalla completa y una docena de mini
escenas 3D en las tarjetas. Sin cuidado, eso se traduce en una docena de
contextos WebGL vivos, un lienzo animándose a 60 fps aunque nadie lo esté
mirando y dos pasadas de render por fotograma. Las optimizaciones aplicadas:

### 1. Los lienzos se montan sólo cuando hacen falta

`lib/useViewport.ts` mide la posición de cada elemento respecto al viewport:

- `near` → **monta** el lienzo (margen de 700 px por delante).
- `visible` → decide si la escena **anima** o se **detiene**.
- Al alejarse (más de 1200 px) el lienzo se **desmonta** y se libera el
  contexto WebGL.

Resultado: la portada carga con **1 lienzo** en vez de 10, y al hacer scroll
sólo viven los que están cerca.

### 2. La escena grande se detiene cuando no se mira

`NetworkCanvas` pasa su `frameloop` a `'never'` cuando el hero sale de
pantalla o cuando la pestaña pasa a segundo plano (`visibilitychange`). La
GPU se queda libre mientras se lee el resto de la página.

### 3. Una sola pasada de render

El tubo de neón usaba `meshPhysicalMaterial` con `transmission`, que obliga a
three.js a **dibujar la escena entera otra vez** en un búfer de transmisión en
cada fotograma. Se sustituyó por transparencia + brillo (`meshStandardMaterial`):
el resultado sigue siendo vítreo y la escena se dibuja una sola vez.

### 4. Presupuesto de luces y resolución

- Luces puntuales: 10 → 7 (cada luz se evalúa en cada píxel iluminado).
- `dpr` máximo 1,75 → 1,5, con **calidad adaptativa** (`PerformanceMonitor`):
  si el equipo no sostiene 48 fps, la resolución baja sola a 1 (y a 0,75 si no
  basta) y vuelve a subir cuando la escena se aligera.
- `EffectComposer`: MSAA ×4 → ×2; N8AO: calidad *medium* → *low* (ya iba a
  media resolución).
- Mapa de sombras 2048² → 1024² (las sombras son estáticas: se calculan una
  sola vez).

### 5. CSS barato

- El grano de la página ya no usa `mix-blend-mode: overlay`: forzaba al
  compositor a reprocesar la pantalla entera en cada fotograma del lienzo.
- Los `backdrop-blur` que flotan sobre el lienzo animado (panel de
  estadísticas, mini-mapa, conmutador) bajan de radio: desenfocar es
  proporcional al radio y el lienzo cambia en cada fotograma.

### 6. React no toca el árbol 3D en cada render

`NetworkCanvas`, `NetworkScene` y `Stage` van envueltos en `memo`, así que un
cambio de estado en la interfaz no reconcilia las ~200 mallas de la escena.

### 7. Código en diferido

Leaflet (149 kB) sólo se usa en los tres mapas (mini-mapa, mapa del
conmutador y **mapa 2** del barrio): los tres componentes se cargan con
`lazy()` + `Suspense`, así que la librería queda fuera del paquete inicial
(de 524 kB a 480 kB comprimidos).

## Las dos ventanas de la aplicación

La aplicación está dividida en **tres ventanas** que se conmutan desde la
cabecera global:

| Ventana | Contenido |
|---|---|
| **Analizar fraude** (principal) | El asistente de la red: voz, texto, evidencia y análisis. Es la vista de arranque. |
| **Comunidades** | La **maqueta 3D** de la red de comercios (a sangre, con el panel de estadísticas y el mini-mapa) y, debajo, las secciones de la portada. |
| **Centro de aprendizaje** | Los ocho juegos de prevención de fraude y las lecciones del módulo educativo. |

La cabecera global (`ui/NetworkHeader.tsx`) lleva el logotipo, el conmutador de
red, los botones de ventana y el acceso al chat. Se adapta al fondo: sobre el
cielo de la escena 3D el texto va en blanco; sobre la página clara, en azul
tinta con velo translúcido.

### El chat de la comunidad

Dentro de la ventana de **Comunidades**:

- El botón **«Abrir el chat»** (abajo a la derecha de la escena) y el botón
  **«Chat»** de la cabecera abren el panel.
- El panel se dibuja **encima del modelo 3D, pegado al borde izquierdo**
  (`ui/CommunityChatDrawer.tsx`), con el conversations, los integrantes y el
  redactor.
- Se puede **minimizar** (botón «–»): el panel se recoge y queda un botón
  flotante abajo a la izquierda con el nombre del barrio, que lo vuelve a
  abrir.
- En modo panel los integrantes se eligen con una **tira horizontal de
  avatares** y el chat se adapta a la altura disponible.

Al cambiar de ventana la escena 3D se **desmonta** (no se queda pidiendo GPU
en segundo plano).

### El mapa 2: el barrio visto de cerca

La ventana de **Comunidades** ya no muestra una cuadrilla de edificios: muestra
el **mapa real de la comunidad** (`ui/NeighborhoodMap.tsx`), con los comercios
de la red colocados **encima de las casas reales** de esa zona.

- **Centrado en el barrio elegido**: el mapa 2 se abre siempre en la
  comunidad seleccionada desde el mapa 1 (el conmutador de red), con el
  encuadre ajustado a las construcciones usadas.
- **Se puede llegar al nivel de casa**: el mapa va del **zoom 15 al 21**, así
  que desde el barrio completo (300 m de escala) se baja hasta una vivienda
  suelta (5 m de escala). Las teselas nativas de Esri llegan al zoom 19; a
  partir de ahí el navegador reescala la última tesela, de modo que no
  aparecen huecos y se distinguen las casas y las vías pequeñas. Abajo a la
  izquierda hay una **escala en metros** para saber el tamaño real de lo que
  se ve.
- **Tres estilos de mapa** (conmutador arriba a la derecha): **Claro** (mapa
  pastel con los nombres de las calles en una capa aparte), **Calles** (cartografía
  de Esri con manzanas y edificaciones) y **Satélite** (fotografía aérea, la
  que mejor muestra las cubiertas de las casas). Al cambiar de estilo se
  reutilizan las capas: el zoom y el centro donde estaba el usuario no se
  pierden.
- **Las casas son reales**: las posiciones se sacan de **OpenStreetMap** para
  un radio de 220 m alrededor del centro del barrio (`data/houses.ts`). Se
  usa la **API oficial de OSM** (`api/0.6/map`, que devuelve el XML del
  tramo y no tiene cola de espera) y, si falla, Overpass como respaldo. Se
  cachean por barrio en memoria y en `sessionStorage`, así que volver a entrar
  no vuelve a preguntar. Mientras la consulta responde, los comercios se
  colocan con una distribución aproximada y se ajustan a las posiciones reales
  cuando llegan; si el servicio no está disponible, la interfaz lo avisa
  («Ubicación aproximada de X»).
- **Los edificios son los mismos que en 3D**: cada marcador es el edificio
  isométrico en SVG (`ui/isoBuilding.ts`), con la silueta y la paleta del
  tipo de comercio (panadería con cúpula, farmacia con la cruz, papelería con
  el lápiz…), y su tooltip trae el nombre y el tipo.
- **Conmutador de vista**: «Mapa del barrio» / «Vista isométrica». La escena
  3D sigue viva, ahora como segunda vista de la misma ventana.

Componentes:

| Archivo | Papel |
|---|---|
| `ui/CommunityStage.tsx` | Ventana de comunidades: mapa o escena 3D, conmutador de vista y capas |
| `ui/NeighborhoodMap.tsx` | **Mapa 2**: barrio a vista de cerca con los comercios colocados |
| `ui/tileSources.ts` | Estilos de mapa (claro, calles, satélite) y capas de etiquetas |
| `ui/isoBuilding.ts` | Edificio isométrico en SVG (mismo lenguaje visual que el 3D) |
| `data/houses.ts` | Consulta de las construcciones reales (OSM) con cache y respaldo |

## Analizar fraude (asistente de la red)

El botón **«Analizar fraude»** de la cabecera lleva a la sección `#analizar-fraude`:
un chat con el asistente de la red que decide si una situación es fraude.

### Pulsar para hablar (voz)

- Botón grande de micrófono: **se mantiene pulsado** mientras hablas (con
  onda animada) y se suelta para analizar.
- La voz se **transcribe a texto** con el reconocimiento de voz del navegador
  (`SpeechRecognition`, en español de Colombia) y la transcripción aparece
  como tu mensaje.
- Si el navegador no tiene reconocimiento de voz —o si el usuario deniega el
  permiso del micrófono— la transcripción se **simula** para poder demostrar
  el flujo, y la interfaz lo avisa.
- **Debajo del micrófono está siempre el campo de texto**: en modo voz se
  puede escribir igual («…o escribe aquí el mensaje sospechoso»), así que
  nunca está obligatorio hablar.

### Cambiar a chat de texto

- Conmutador en la cabecera de la sección: si no quieres hablar, escribes el
  mensaje (o lo pegas tal cual lo recibiste).
- Botón de **clip** para **subir evidencia**: capturas, comprobantes,
  documentos o archivos de texto. Se ven como etiquetas y se adjuntan al
  análisis.
- `Enter` envía el mensaje.

### El análisis

`src/data/fraud.ts` es un motor de reglas que corre **en el navegador** (no se
envía nada a ningún servidor). Devuelve:

- **Veredicto**: `ESTO ES UN FRAUDE` (rojo), `ES SOSPECHOSO, VERIFIQUE` (ámbar)
  o `NO PARECE FRAUDE` (verde), con una **puntuación de riesgo de 0 a 100**.
- **Señales detectadas** con su explicación: código de verificación, claves o
  datos de tarjeta, suplantación del banco o de la red, enlaces sospechosos,
  urgencia y amenazas, transferencias anticipadas, premios, instalación de
  apps, prefijos internacionales, mensajes escuetos…
- **Qué hacer**: no responder, no transferir, denunciar desde la app, cambiar
  claves si ya se compartieron datos, guardar capturas…
- **Comprobaciones**: una lista de cinco puntos con ✓/! según lo detectado.

El panel lateral repite el resultado: veredicto, barra de riesgo,
comprobaciones y señales.

Comprobado con las frases de ejemplo del modo voz:

| Mensaje | Veredicto |
|---|---|
| «…me pide el código de verificación de un supuesto empleado del banco» | **Fraude** (45 %) |
| «…dice que es de la red segura de comercios y que transfiera a otra cuenta» | **Fraude** (45 %) |
| «Un enlace para actualizar mis datos de la tarjeta» | **Fraude** (65 %) |
| «Llamando de un número con prefijo internacional para autorizar un pago» | **Sospechoso** (27 %) |
| «Un tipo me dice que gané un premio» | **Fraude** (45 %) |
| «Me piden instalar una aplicación en el celular» | **Fraude** (45 %) |
| «Un comercio me mandó un comprobante, ¿cómo lo verifico?» | **Limpio** (0 %) |
| «¿Me confirmas que el pago de hoy ya fue recibido?» | **Limpio** (0 %) |

Componentes:

| Archivo | Papel |
|---|---|
| `ui/CommunityChat.tsx` | Conversación de la comunidad (integrantes, mensajes, avisos, redactor) |
| `ui/CommunityChatDrawer.tsx` | Panel lateral izquierdo sobre el modelo 3D, con minimizar |
| `ui/NetworkHeader.tsx` | Cabecera global: conmutador de ventana y acceso al chat |
| `ui/FraudAnalyzer.tsx` | Interfaz del asistente (voz, texto, evidencia, panel) |
| `data/fraud.ts` | Motor de reglas, veredictos y frases de ejemplo |

## Centro Educativo Interactivo

Tercera ventana de la aplicación: un módulo de **prevención** con lecciones y
retos interactivos para aprender a reconocer fraudes digitales en Colombia.

Se entra desde el botón **«Centro educativo»** de la cabecera global.

### Contenido (`src/data/education.ts`)

- **8 categorías**: phishing, estafas por WhatsApp, suplantación de bancos,
  comprobantes falsos, vendedores fraudulentos, ofertas de empleo falsas, robo
  de códigos y enlaces maliciosos. Cada una con icono, descripción, dificultad
  y duración estimada.
- **5 lecciones completas** con la estructura pedida: objetivo de aprendizaje →
  explicación → ejemplo ficticio → actividades → recomendaciones → resumen →
  fuentes.
  1. Cómo reconocer un mensaje de phishing
  2. Cómo proteger los códigos de verificación y las cuentas
  3. Cómo verificar un supuesto comprobante de pago
  4. Cómo reconocer una tienda o un vendedor potencialmente fraudulento
  5. Qué hacer después de compartir datos o hacer una transferencia sospechosa

### Los cinco tipos de actividad

| Actividad | En qué consiste |
|---|---|
| **Detecta el fraude** | Clasificar el mensaje: «parece legítimo», «señales sospechosas» o «no tengo información». La respuesta esperada cambia según el caso (hay casos donde lo correcto es «no tengo suficiente información»). |
| **¿Qué harías?** | Escenarios con 4 decisiones y la **consecuencia** education de cada una. |
| **Encuentra las señales** | Marcar los fragmentos sospechosos de un mensaje. Se explica qué significa cada señal y se advierte que una señal aislada no prueba un fraude. |
| **Mitos y realidades** | Afirmaciones frecuentes (candado HTTPS, logo del banco, comprobante de pago, ganancias garantizadas) con explicación fundamentada. |
| **Simulador** | Conversación o mensaje ficticio con etiqueta visible **«SIMULACIÓN EDUCATIVA»**; el usuario marca las señales dentro de las burbujas. |

Cada respuesta produce **retroalimentación individual**: la esperada, las
señales encontradas, lo que podría ser legítimo, la información que falta, la
acción segura y **por qué las otras opciones no son las mejores**.

### Progreso y gamificación (`src/lib/educationProgress.ts`)

- Puntos por actividad, **niveles** (Aprendiz → Guardián de la red) e
  **insignias** (Primer paso, Tres días seguidos y una por categoría dominada).
- Panel con lecciones completadas, retos resueltos, precisión, racha de días y
  nivel, con un **estado inicial motivador** cuando no hay actividad.
- El error **no penaliza**: se dan puntos parciales y la explicación.
- Sin clasificación pública: el progreso es sólo del usuario.

### Persistencia

No hay backend en el proyecto, así que el progreso se guarda en `localStorage`
(bajo la clave `escudo.centro-educativo.v1`). Toda la persistencia está
detrás de la interfaz `EducationStore`, así que sustituirla por un backend es
cambiar una implementación, no tocar la interfaz. El `EducationProvider` acepta
el `store` como propiedad.

### Seguridad y calidad del contenido

- Todos los ejemplos son **ficticios** y las entidades usan nombres genéricos
  («Banco Aurora», «Tienda Sol»): no se reproducen logotipos ni identidades
  reales, y las simulaciones llevan etiqueta visible.
- El contenido **no enseña a ejecutar fraudes** ni a evadir controles: enseña a
  verificar, a decir que no y a reportar.
- Se diferencia entre **señales de alerta**, **sospechas** y **hechos
  verificados** (de ahí que la opción «no tengo suficiente información» sea
  válida en varios casos).
- Las fuentes citadas son institucionales y verificables: Policía Nacional
  (CAI Virtual), Superintendencia Financiera de Colombia, Defensoría del Usuario
  Financiero, SIC y Ministerio de TIC.

Componentes:

| Archivo | Papel |
|---|---|
| `ui/education/EducationCenter.tsx` | Portada (encabezado, progreso, categorías) y navegación interna |
| `ui/education/EducationLesson.tsx` | Flujo de la lección |
| `ui/education/EducationActivities.tsx` | Los cinco tipos de actividad |
| `ui/education/EducationProvider.tsx` | Progreso compartido y persistencia |
| `ui/education/educationContext.ts` | Contexto y hook `useEducation` |
| `ui/education/educationIcons.tsx` | Iconos del módulo |
| `data/education.ts` | Contenido educativo |
| `lib/educationProgress.ts` | Modelo de progreso, niveles, insignias y persistencia |

## Centro de aprendizaje (juegos de prevención)

Tercera ventana de la aplicación: un módulo de **prevención** con ocho juegos
interactivos y un motor de evaluación común. Se entra desde el botón
**«Centro de aprendizaje»** de la cabecera global.

### Los ocho juegos

| Juego | Qué se practica |
|---|---|
| **Detectives digitales** | Investigar un caso: marcar las señales dentro del mensaje simulado (o clasificar cada elemento) y decidir la acción final. Incluye casos legítimos, sospechosos y ambiguos. |
| **Tu decides** | Historias **ramificadas**: cada decisión lleva a un nodo distinto, con consecuencias educativas y un cierre con lo que decidiste seguro, lo que arriesgaste y lo que faltó por verificar. |
| **Encuentra las diferencias** | Comparar dos fichas (tiendas, comprobantes, dominios) y señalar qué merece verificación, con la explicación de cada incoherencia. |
| **Laboratorio de evidencias** | Separar **hechos documentados**, **indicios** e **información que falta**; evaluar tres hipótesis; elegir tres acciones prioritarias. El informe final usa lenguaje prudente. |
| **Desafío contrarreloj** | Diez situaciones breves elegidas al azar de un banco mayor, con avance, retroalimentación inmediata y resultado por categoría. El temporizador es opcional y no penaliza. |
| **Verdadero, falso o no sabemos** | Diez afirmaciones para entrenar el criterio y distinguir «falso» de «demasiado absoluto» de «falta información». |
| **Protege tu cuenta** | Simular un incidente en tres fases (verificar, proteger, recuperar) y priorizar las medidas que aplican de verdad en cada caso. |
| **Arma tu plan de protección** | Elegir las medidas del plan personal, leer su explicación y descargar el resumen en texto. |

### Arquitectura

| Capa | Archivo | Papel |
|---|---|---|
| Contenido | `src/data/learning/types.ts` | Tipos: categorías, casos, pistas, nodos, evidencias, preguntas, opciones, escenas |
| Contenido | `src/data/learning/categories.ts` | Las 10 categorías educativas |
| Contenido | `src/data/learning/games/*.ts` | Los datos de cada juego (casos, historias, preguntas, medidas) |
| Contenido | `src/data/learning/games/introductions.ts` | La diapositiva de introducción de cada juego |
| Contenido | `src/data/learning/games/scenarios.ts` | Escenarios de las preguntas y de las historias |
| Contenido | `src/data/learning/games/caseScenarios.ts` | Escenarios de los casos, del laboratorio y de las fases |
| Contenido | `src/data/learning/index.ts` | Registro de los 8 juegos |
| Reglas | `src/lib/learning/engine.ts` | Motor de evaluación (veredicto, puntos, resultados, insignias) |
| Reglas | `src/lib/learning/progress.ts` | Progreso y persistencia |
| Vista | `src/components/ui/learning/GameFlow.tsx` | Diapositivas: introducción, situación, retroalimentación, cierre |
| Vista | `src/components/ui/learning/Visuals.tsx` | Escenas ilustradas y simulaciones de interfaz |
| Vista | `src/components/ui/learning/useGameFlow.ts` | Estado del recorrido (compartido por todos los juegos) |
| Vista | `src/components/ui/learning/GameShell.tsx` | Marco común, lista de opciones y panel de resultado |
| Vista | `src/components/ui/learning/games/*.tsx` | Un componente por juego |

### El recorrido de diapositivas

Todos los juegos siguen la misma secuencia, gestionada por `useGameFlow`:

```
Introducción → Caso → Decisión → Resultado → Cierre
```

1. **Introducción**: qué es ese tipo de fraude, cómo suele funcionar, dos o
   tres señales de alerta, una recomendación preventiva y una ilustración.
2. **Caso**: la situación con sus personajes, la representación visual
   (SMS, chat, correo, anuncio, comprobante, formulario o panel de
   seguridad) y la misión del jugador.
3. **Decisión**: la interacción real (marcar señales, elegir una acción,
   clasificar, comparar, ordenar).
4. **Resultado**: veredicto, explicación breve, «qué mirar», «acción más
   segura» y un desplegable **«¿Por qué?»** con el detalle.
5. **Cierre**: puntuación, aprendizaje principal, señales identificadas,
   recomendación y botones de repetir, volver o continuar.

El botón **«Atrás»** devuelve a la diapositiva anterior **sin borrar lo
respondido**: las respuestas viven en el estado del juego, no en la
diapositiva. Cada juego tiene su propio botón para abandonar y volver al
centro.

### Recursos visuales

No hay fotografías: todo son **SVG y CSS**, así que el módulo funciona sin
conexión, pesa poco y el texto siempre es real (traducible y seleccionable).

- `FraudScene`: ilustración de la introducción (dispositivo + alerta + figura).
- `ScenarioVisualView`: simulaciones de interfaz — SMS en marco de teléfono,
  conversación de mensajería, correo, publicación comercial, comprobante de
  pago, formulario sospechoso y panel de seguridad con sesiones.
- `EvidenceChip`: etiqueta de la clasificación de una evidencia.

Todas las simulaciones llevan la etiqueta visible **«Simulación
educativa»** y usan entidades y dominios ficticios (`.invalid` para los
dominios de ejemplo).

### Motor de evaluación

- El motor de evaluación distingue cuatro situaciones: `correct`,
  `partial`, `incorrect` e `insufficient` (información insuficiente, que no es
  lo mismo que fallar). Los puntos se adaptan a cada juego.
- Las **historias ramificadas** se describen con nodos y transiciones
  (`nodes` + `next`), no con componentes duplicados: añadir una historia es
  añadir datos.
- Las **insignias** (Detective digital, Guardián de cuentas, Investigador
  responsable, Comprador prevenido, Experto en verificación) premian
  actividades completadas, nunca afirman que el usuario sea inmune a los
  fraudes.
- Los **resultados** muestran puntuación, aciertos, qué conviene repasar, las
  categorías donde más falló y botones de repetir o volver. No hay
  clasificaciones públicas.

### Persistencia

`localStorage` con la clave `escudo.centro-aprendizaje.v1`, detrás de la
interfaz `GameStore` (inyectable en el `LearningProvider`). Solo se guardan
identificadores, puntos y contadores: **ningún dato sensible**. El plan de
protección es la lista de medidas elegidas, nunca tus cuentas.

### Seguridad y rigor del contenido

- Todos los mensajes, entidades, tiendas y comprobantes son **ficticios**; los
  dominios de ejemplo usan el sufijo reservado `.invalid`, que no existe.
- Cada simulación lleva la etiqueta visible **«Simulación educativa»**.
- El contenido **no enseña a ejecutar fraudes, falsificar comprobantes ni
  eludir controles**: enseña a verificar, decir que no y reportar.
- Se diferencia entre señales de alerta, sospechas, hechos documentados,
  información pendiente y hechos verificados.
- Después de un incidente no se promete recuperar el dinero: se explican las
  acciones y sus límites.

## Proveedor de teselas

CARTO exige **API key** desde 2024 (sus teselas devuelven un PNG con el
texto «API KEY REQUIRED»), así que el proyecto usa **Esri Light Gray Canvas**,
que no necesita credenciales y además encaja con la paleta pastel. Si sus
teselas fallan —sin red o bloqueadas por un proxy— `addTileLayer` cambia
automáticamente a **OpenStreetMap**. Ambas se piden con `crossOrigin`, de modo
que el mapa puede exportarse a canvas.

Modelo de datos en `src/data/networks.ts`: 20 localidades de Bogotá con sus
coordenadas reales, agrupadas por **comuna**. Los datos de cada red y de cada
comunidad se generan de forma **determinista** a partir del id (generador con
semilla), así que una localidad siempre muestra las mismas cifras.

### Comunidades de barrio (los puntos del mapa)

Dentro de cada localidad hay **varios puntos de distinto tamaño** que
representan las **comunidades de barrio**. Cada punto:

- está situado en un barrio real de la localidad;
- tiene un **tamaño proporcional a la superficie del barrio** (radio 5,5–10,7 px
  en el mapa);
- muestra al pasar el cursor **«Comunidad del barrio &lt;nombre&gt;»** y, al
  pulsarlo, su ficha (comercios, verificados y satisfacción de esa comunidad).

De cada localidad se eligen **entre 4 y 10 barrios** según lo grande que sea
(las más extensas, como Suba o Usme, tienen 10; las pequeñas, 4), repartidos con
muestreo por **punto más alejado** para que queden bien distribuidos y ninguno
amontonado en el centro.

`src/data/comunidades.ts` guarda esos puntos. La fuente también es oficial:

- capa **«Barrio legalizado»** de la Secretaría Distrital de Planeación
  (1 709 barrios con su localidad y su superficie);
- capa **«Sector catastral»** del mapa de referencia, que completa las
  localidades más pequeñas con pocos barrios legalizados.

Para generarla se usa el script `generate-comunidades.mjs` (temporal, fuera del
repositorio) que consulta ambos servicios, calcula el centroide de cada
polígono y reparte los barrios por localidad.

En la interfaz:

- Al pulsar un punto, el panel lateral cambia a esa localidad y muestra la
  ficha de **«Comunidad del barrio X»**.
- La lista **«Comunidades de &lt;localidad&gt;»** permite elegir la comunidad
  sin tocar el mapa.
- El botón **«Entrar en la red de X»** activa esa red **y** deja como comunidad
  activa la elegida: el rótulo del núcleo 3D pasa a «NÚCLEO DE &lt;BARRIO&gt;»,
  la cabecera muestra «localidad · barrio» y el panel de estadísticas añade la
  franja de la comunidad.
- Los puntos viven en un **pane propio de Leaflet** (`communities`, z-index
  450) para que queden por encima de los polígonos y siempre se puedan pulsar;
  se ordenan de menor a mayor para que, cuando dos barrios se solapan, gane el
  punto más pequeño (el que está encima).

## Estética soft pop

- **Volúmenes redondeados**: los cuerpos usan `RoundedBox` con radios muy
  generosos (0.42–0.52 sobre cajas de 2.1–2.5 u) y las cubiertas son losas
  gruesas con mucho vuelo. Ese es el salto de "caja" a "arcilla moldeada".
- **Paleta viva**: los tonos del negocio (rosa `#ff9dc0`, naranja `#ffae52`,
  turquesa `#38d2c8`, púrpura `#b18cff`, amarillo `#ffd75a`) van por encima
  de los pasteles apagados.
- **Suelo con lavado direccional**: el fragment shader mezcla un azul
  (`#a9c8f4`) arriba-izquierda con una lavanda (`#c7b2f0`) abajo-derecha;
  cada azulejo va partido en diagonal entre blanco y azul, con juntas azules
  finas que se desvanecen hacia el borde.
- **Tubos de neón**: cada conducto tiene cuatro capas — halo aditivo,
  envoltura de cristal, núcleo con degradado a blanco caliente y un
  **filamento blanco incandescente** en el eje. Los tramos cálidos van un
  15 % más gruesos que los cian, como en la referencia.

## Suelo, neón y núcleo

- **Rejilla por shader**: el suelo no usa textura, sino un `MeshStandardMaterial`
  con `onBeforeCompile` que inyecta el patrón de la rejilla en el fragment
  shader. Así el suelo **sigue recibiendo sombras** y además gana un gradiente
  radial que desvanece el azul a blanco y juntas finas (no un marco grueso).
- **Neón con degradado**: el núcleo de cada tubo usa un `CanvasTexture` 1D como
  mapa. En `TubeGeometry` la coordenada `u` recorre la longitud, así que el
  degradado naranja → cian se aplica a lo largo del conducto. Por dentro
  viajan bloques de datos animados.
- **Núcleo translúcido**: el escudo central es cristal tintado con el borde
  incandescente, y la píldora verde `VERIFICADO` va **dentro** de la cúpula,
  de forma que se ve a través del cristal y del escudo.
- **Post-procesado**: `N8AO` (oclusión ambiental en espacio de pantalla) +
  `Bloom` + `Vignette` en un `EffectComposer`.

## Decisiones técnicas

- **Cámara ortográfica isométrica**: azimut 45° y elevación 35,26°
  (`rotation = [-π/4, 0.61548, π/6]`). Es la proyección exacta de la referencia.
- **Edificios alineados con la rejilla**: el grupo de cada tienda **no lleva
  giro**, así que sus muros son paralelos a los ejes del suelo. La fachada (+Z)
  mira hacia abajo-izquierda y el costadillo (+X) hacia abajo-derecha, tal
  como en la ilustración original.
- **Rejilla aparentemente infinita**: el suelo es una losa de 25 × 25
  azulejas (120 unidades) centrada en el origen, mucho mayor que el encuadre.
  La bruma (`fog`) disuelve el borde lejano y un degradado CSS en el pie del
  hero disuelve el lado cercano, de modo que la retícula se funde con el
  fondo de la página sin que se vea dónde termina.
- **Todo el texto 3D se dibuja en canvas** (`network/textures.ts`) y se aplica
  como mapa: así los rótulos quedan nítidos y escalables sin fuentes 3D.
- **Etiquetas orientadas a cámara** (`CAMERA_FACING` en `layout.ts`) para que
  los rótulos del núcleo se lean verticales y sin deformar.
- **Neón HDR**: los tubos usan colores por encima de 1 (`hot()` en `palette.ts`)
  para que el bloom los convierta en halos sin perder saturación.
- **Sombras estáticas**: el mapa de sombras se calcula una sola vez
  (`StaticShadows` en `NetworkCanvas.tsx`).

## Scripts

```bash
npm ci            # instala exactamente lo que dice package-lock.json
npm run dev       # servidor de desarrollo
npm run build     # comprobación de tipos + build de producción
npm run typecheck # solo la comprobación de tipos (tsc -b)
npm run lint      # oxlint
npm test          # typecheck + lint + build (lo que corre la CI)
npm run preview   # previsualiza el build
```

## Poner en marcha el proyecto

```bash
git clone <url-del-repositorio>
cd <repositorio>
npm ci
npm run dev
```

Requiere **Node.js 22 o superior**. No hay backend, ni base de datos, ni
claves de entorno: todo el estado se guarda en el navegador (`localStorage` y
`sessionStorage`).

La CI de GitHub Actions (`.github/workflows/ci.yml`) ejecuta `npm test` en
cada push y en cada pull request, y sube la carpeta `dist` como artefacto.
