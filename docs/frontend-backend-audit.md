# Auditoría frontend → backend — Escudo Comunitario

**Fecha:** 2026-10-18  
**Repositorio:** `<raiz-del-repositorio>`  
**Estado del frontend:** sitio de vitrina (landing/showcase) totalmente presentacional. No existe backend previo.

---

## 1. Arquitectura actual del frontend

| Concepto | Detalle |
|----------|---------|
| Directorio raíz | `<raiz-del-repositorio>` |
| Frontend | Raíz del repositorio (no hay subdirectorio separado) |
| Backend previo | No existe. No hay carpeta `backend/`, ni código Python, ni FastAPI. |
| Framework | React 19.2.8 + TypeScript ~6.0.2 + Vite 8.3.0 |
| Estilos | Tailwind CSS 4.3.3 (`@tailwindcss/vite`), CSS en `src/index.css` |
| Gráficos / 3D | Three.js 0.186.1, `@react-three/fiber` 9.8.2, `@react-three/drei` 10.7.9. Todo el "producto" se muestra como escenas 3D decorativas (`Stage`, `Canvas`, sin `OrbitControls`, sin eventos de interacción). |
| Librería de formularios | Ninguna (no hay `react-hook-form`, `zod`, etc. ni formularios reales). |
| Data fetching | Ninguna (no hay `axios`, `fetch`, `tanstack-query`). No hay llamadas HTTP en todo el código. |
| Gestión de estado | Ninguna (no Context, Zustand, Redux). Todo el contenido es estático/hardcodeado. |
| Rutas / navegación | No hay librería de rutas (no `react-router`). `HeroNav` renderiza enlaces `<a href="#">` sin comportamiento. |
| Tipos e interfaces | No hay interfaces TypeScript de dominio (solo tipos de componentes, p. ej. `PieceProps`). Todo es estático. |
| Componentes de acceso a datos | No existen. |
| Variables de entorno | No existe `.env` ni `.env.example`. Vite no expone variables configuradas. |
| Pruebas frontend | No configuradas (sin Vitest, Jest, Playwright, Cypress). |
| Linter | `oxlint` 1.81.0 (script `lint`), sin reglas type-aware activas. |
| Build | `vite build` + `tsc -b`. `dist/` generado (gitignored). |

### Árbol de archivos relevante (código propio, sin `node_modules`/`dist`)

```
index.html
package.json
package-lock.json
vite.config.ts
tsconfig.json / tsconfig.app.json / tsconfig.node.json
.oxlintrc.json
.gitignore
README.md
public/favicon.svg
public/icons.svg
src/main.tsx
src/App.tsx
src/index.css
src/lib/palette.ts
src/components/ui/CircuitBackdrop.tsx        (decorativo)
src/components/ui/HeroPanel.tsx              (panel principal: logo, nav, 3D, copy, 2 botones, FeatureCards)
src/components/ui/EscudoInteligencia.tsx     (bloque inferior izquierdo, usa escena 3D)
src/components/ui/Sidebar.tsx                (SectionTitle, SideCard, MiniPill, MiniLink, StatCard, EduCard)
src/components/ui/SidebarSections.tsx        (StaffSection, CommunityStatsSection, EducationSection)
src/components/ui/CardItem.tsx
src/components/ui/HeroNav.tsx                (enlaces: Analizar fraude, Radar comunitario, Prevención, Mis casos — href="#")
src/components/ui/Logo.tsx
src/components/ui/PillButton.tsx
src/components/ui/FeatureCards.tsx           (4 tarjetas: WhatsApp, SMS, Llamadas, Comprobantes de pago)
src/components/ui/HalftoneDecor.tsx          (decorativo)
src/components/three/Stage.tsx               (Canvas base, puramente decorativo)
src/components/three/HeroShieldScene.tsx
src/components/three/scenes/StatsScenes.tsx  (CommunityScene, CommentersScene, DonationsScene, EduPaymentScene, PreventionScene, EscudoInteligenciaScene)
src/components/three/scenes/StaffScenes.tsx  (AiShieldScene, ReceiptScene, CheckWhatsappScene)
src/components/three/icons/CallScene.tsx
src/components/three/icons/PaymentScene.tsx
src/components/three/icons/SmsScene.tsx
src/components/three/icons/WhatsappScene.tsx
src/components/three/parts/{blocks,ClayMaterial,geometry,pieces}.tsx
```

---

## 2. Inventario de páginas y rutas

No existe enrutamiento. Hay una **única vista** (`/`, renderizada por `App.tsx`) dividida en áreas:

| Área | Componente | Ruta/nav | Acciones del usuario | Datos que muestra | Datos que recibe | Datos que genera | Validaciones | Estados | Necesidad de backend |
|------|-----------|----------|----------------------|-------------------|------------------|------------------|--------------|---------|----------------------|
| Hero panel | `HeroPanel` | `#` (HeroNav) | Clic en "Analizar posible fraude" y "Regístrate Gratis" (`PillButton`, `type="button"`, sin `onClick`) | Escena 3D del escudo, copy ("Antes de confiar, verifica"), copy descriptivo | Ninguno | Ninguno | Ninguna | Estático, sin carga/error | No (botón sin función conectada) |
| Tarjetas de canal | `FeatureCards` → `CardItem` | Ninguna | Ninguna | Iconos 3D: WhatsApp, SMS, Llamadas, Comprobantes de pago | Ninguno | Ninguno | Ninguna | Estático | No |
| Estaforna de comunitario | `StaffSection` | Ninguna | Clic en `MiniPill` "Analizar posible fraude" / `MiniLink` "Aprender a prevenir" (sin `onClick`) | Tarjetas: IA, Comprobantes de pago | Ninguno | Ninguno | Ninguna | Estático | No |
| Estadísticas de comunidad | `CommunityStatsSection` | Ninguna | Ninguna | `StatCard`: "71k Total la comunidad", "1.200 Estadístico de comentadores", "2.000 Donación de composites" | Ninguno | Ninguno | Ninguna | Estático, valores hardcodeados | **Sí (opcional): cifras hardcodeadas** |
| Prevención educativa | `EducationSection` | Ninguna | Ninguna | `EduCard`: Check com WhatsApp, Prevención por la prevención, Comprobantes de pago (₡23639) | Ninguno | Ninguno | Ninguna | Estático | No |
| Escudo Inteligencia | `EscudoInteligencia` | Ninguna | Ninguna | Escena 3D + copy ("Ayudar la inteligente arciva") | Ninguno | Ninguno | Ninguna | Estático | No |

**Observación crítica:** ninguna acción del frontend ejecuta una operación real. Todos los botones son `type="button"` sin manejadores; los enlaces del nav apuntan a `#`.

---

## 3. Componentes funcionales relevantes

Todos presentacionales. Lista real con su nivel de funcionalidad:

| Componente | Archivo | Funcionalidad real | Clasificación |
|------------|---------|-------------------|---------------|
| `App` | `src/App.tsx` | Composición de secciones | Completamente visual |
| `HeroPanel` | `src/components/ui/HeroPanel.tsx` | Layout principal + 2 botones sin acción | Completamente visual |
| `PillButton` | `src/components/ui/PillButton.tsx` | Botón cápsula, sin `onClick` | Completamente visual |
| `HeroNav` | `src/components/ui/HeroNav.tsx` | 4 enlaces con `href="#"` | Completamente visual |
| `FeatureCards` | `src/components/ui/FeatureCards.tsx` | 4 tarjetas con escenas 3D | Completamente visual |
| `CardItem` | `src/components/ui/CardItem.tsx` | Tarjeta oscura con icono 3D | Completamente visual |
| `StatCard` | `src/components/ui/Sidebar.tsx` | Cifra + etiqueta estáticas | Completamente visual (datos hardcodeados) |
| `EduCard` | `src/components/ui/Sidebar.tsx` | Etiqueta + escena 3D | Completamente visual |
| `SideCard` | `src/components/ui/Sidebar.tsx` | Tarjeta con acción inactiva | Completamente visual |
| 3D escenas (todas) | `src/components/three/**` | Render decorativo, `frameloop="demand"` (hero `always`) | Completamente visual |
| `HalftoneDecor`, `CircuitBackdrop` | `src/components/ui/*.tsx` | SVG decorativos | Completamente visual |

---

## 4. Formularios y datos que recopilan

**No existen formularios.** No hay inputs, selects, textarea, file inputs ni `onSubmit` en el proyecto. Los datos que el producto dice manejar (mensajes sospechosos, WhatsApp, SMS, llamadas, comprobantes de pago) solo aparecen como **ilustraciones 3D y etiquetas estáticas**, nunca como campos de entrada.

---

## 5. Fuentes de datos actuales

Toda la información es estática, escrita directamente en componentes TypeScript/TSX:

- `SidebarSections.tsx`: valores "71k", "1.200", "2.000" hardcodeados en `StatCard`.
- `FeatureCards.tsx`: array `cards` con etiquetas "WhatsApp", "SMS", "Llamadas", "Comprobantes de pago".
- `HeroNav.tsx`: array `links` con textos de navegación.
- Copy del hero y secciones: texto plano en JSX.

No hay archivos JSON de ejemplo, ni respuestas simuladas, ni contadores calculados desde una fuente. No hay datos "recuperados de alguna fuente".

---

## 6. Funcionalidades simuladas (clasificación)

| Funcionalidad (anunciada en copy/UI) | Dónde aparece | Implementación actual | Clasificación |
|--------------------------------------|---------------|----------------------|---------------|
| Analizar posible fraude | `HeroPanel` (botón), `StaffSection` (MiniPill) | Botón sin `onClick` | Pendiente de integración (no hay formulario de entrada) |
| Chatbot antifraude | No existe interfaz conversacional | No existe | No verificable / pendiente |
| Evidencias digitales (adjuntar archivos) | No existe input file | No existe | No verificable / pendiente |
| Expedientes y trazabilidad | No existe listado de casos | No existe | No verificable / pendiente |
| Inteligencia comunitaria (estadísticas) | `CommunityStatsSection` | Cifras hardcodeadas | Completamente visual / simulación |
| Educación preventiva | `EducationSection` | Tarjetas estáticas sin contenido | Completamente visual |
| Reportes ciudadanos, radar, mis casos, perfil | `HeroNav` menciona "Radar comunitario", "Mis casos" | Enlaces `#` sin destino | Pendiente (no existen páginas) |
| Autenticación | No existe | No existe | No aplica (sin mecanismo) |

**Conclusión:** el frontend es un mockup visual. El 100 % de las funciones de negocio del producto están sin implementar; no hay nada que "romper" al integrar un backend, pero tampoco hay contratos HTTP existentes a los que adaptarse.

---

## 7. Funcionalidades que requieren persistencia (según el copy del producto)

Basado en el texto visible de la interfaz (hero: "analizar mensajes sospechosos"; `StaffSection`: IA, comprobantes de pago; `EducationSection`: check WhatsApp, prevención, comprobantes):

1. Análisis de posible fraude (resultado estructurado, nivel de riesgo, indicadores, recomendaciones).
2. Evidencias digitales (archivos adjuntos: imágenes, PDF, texto).
3. Expedientes/casos y trazabilidad (eventos, cambios de estado).
4. Estadísticas comunitarias agregadas (anónimas, sin datos personales ni coordenadas exactas).
5. Recursos educativos (contenido estático, puede vivir en archivos o BD).
6. Sesión de chatbot (contexto de conversación).

---

## 8. Operaciones que deben ejecutarse en el servidor

| Operación | Origen en UI | Requiere backend | Notas |
|-----------|--------------|------------------|-------|
| Health check de la API | — | Sí | Nuevo endpoint |
| Análisis de mensaje/enlace/llamada/comprobante | Botón "Analizar posible fraude" (sin formulario aún) | Sí | Analizador basado en reglas (declarado como demo) mientras no haya proveedor real |
| Carga y almacenamiento seguro de evidencias | No existe UI de subida | Sí | Validar tamaño/extensión/contenido, SHA-256, almacenamiento privado |
| Consulta de evidencia y verificación de integridad | — | Sí | Descarga controlada + comprobación de hash |
| Creación y consulta de expedientes | "Mis casos" (enlace sin destino) | Sí | Relación análisis ↔ expediente, eventos de trazabilidad |
| Estadísticas comunitarias | `StatCard` hardcodeadas | Sí | Agregadas, anónimas, sin datos personales |
| Recursos educativos | `EduCard` sin contenido | Sí (opcional) | Contenido estático con fuente documentada |
| Respuestas de chatbot demo | No existe UI | Sí | Interfaz desacoplada, proveedor simulado declarado |

---

## 9. Dependencias externas

- Frontend: solo librerías ya declaradas en `package.json` (React, Three.js, Tailwind). No se agregan dependencias nuevas al frontend salvo que sea estrictamente necesario (se usará `fetch` nativo; no se añade `axios`).
- Backend (a implementar): Python 3.11+, FastAPI, Pydantic, SQLAlchemy, Alembic, SQLite (dev), Uvicorn, pytest, httpx, pydantic-settings, python-multipart.
- IA: ninguno real identificado. Se usará un proveedor simulado basado en reglas, declarado explícitamente.

---

## 10. Riesgos de incompatibilidad

1. **No hay contratos frontend–backend:** el frontend no hace peticiones HTTP. Cualquier endpoint debe ir acompañado de cambios mínimos en el frontend para ser consumido.
2. **No hay formularios ni estado:** conectar "Analizar posible fraude" requiere añadir UI de entrada (formulario/modal) que hoy no existe; está fuera del alcance de "no rediseñar la interfaz", por lo que se documenta como pendiente y se conecta primero un flujo sin UI nueva (estadísticas).
3. **No hay autenticación:** exponer recursos sin mecanismo de usuario es un riesgo; se documenta como control de seguridad pendiente y no se afirma protección por usuario.
4. **Datos hardcodeados en `CommunityStatsSection`:** sustituirlos por la API requiere que el backend esté disponible o usar valores de fallback para no romper la página standalone.

---

## 11. Prioridades de integración

1. **Base del backend** (health check, configuración, CORS, errores, DB, migraciones, seed demo).
2. **Análisis de fraude** (endpoint + analizador regla-demo declarado) — núcleo del producto según el copy del hero.
3. **Evidencias digitales** (subida, hash SHA-256, descarga, validación).
4. **Expedientes y trazabilidad** (relación análisis-evidencia, eventos).
5. **Estadísticas comunitarias** (endpoint + consumo en `CommunityStatsSection` con fallback — primer flujo integrado real al frontend).
6. **Chatbot demo** (interfaz desacoplada, respuestas basadas en reglas).
7. **Educación preventiva** (recursos estáticos).
8. Pruebas automatizadas y README.

---

## 12. Dudas técnicas no resueltas por inspección

- ¿Existe requisito de autenticación de usuarios en versiones futuras? (Afecta control de acceso a expedientes/evidencias.)
- ¿El equipo quiere conectar los botones "Analizar posible fraude" / enlaces del nav con nuevos formularios/modales, o dejar la UI intacta y solo exponer la API?
- ¿Proveedor de IA externo a integrar después del analizador demo? (Ninguno identificado en el repositorio.)
- ¿Origen exacto del frontend en producción para CORS (dominio real vs `localhost:5173`)?

---