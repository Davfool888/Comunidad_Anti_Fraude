# Pendientes y mejoras a tener en cuenta

Notas del equipo sobre lo que falta o conviene revisar antes de usar la
plataforma con comercios y vecinos reales. Ordenado por prioridad.

## Antes de la demo con celulares

- [ ] **HTTPS para usar la cámara y los avisos desde un celular.** Los navegadores
      sólo permiten la cámara (`getUserMedia`) y Web Push en `https://` o en
      `localhost`. Desde un celular en la red local (`http://192.168.x.x:5173`) el
      modo cámara no abre. Opción rápida: `@vitejs/plugin-basic-ssl` o certificados
      locales con `mkcert`, y `vite --host`.
- [ ] **Probar Web Push en un navegador real.** El envío está implementado y
      probado en el servidor, pero el navegador de pruebas automáticas no recibe
      avisos push. Probar en Chrome/Edge de escritorio y en Android con «🔔 Activar
      avisos».
- [ ] **Rotar las claves usadas en desarrollo** al terminar la hackatón: la clave de
      Gemini (https://aistudio.google.com/apikey) y el `MODERATOR_TOKEN` de
      `server/.env`.

## Seguridad y legal

- [ ] **Revisión legal de la cámara visible para toda la comunidad** (Ley 1581 de
      2012, Habeas Data). Hoy la cámara del comercio afectado se muestra a toda la
      comunidad del barrio durante la alerta y con cualquier alerta (decisión del
      equipo). Mitigaciones actuales: ventana de 30 minutos, consentimiento del
      comercio, rostros pixelados en modo dispositivo, URL de la cámara IP oculta.
      Considerar: limitar a comercios verificados o sólo a alertas de robo.
- [ ] **Los rostros no se pixelan con cámara IP** (sólo en el modo cámara del
      celular). Evaluar pixelar en el servidor antes de reenviar la imagen.
- [ ] **Inicio de sesión real** para vecinos y comercios. Hoy cualquiera puede
      publicar alertas como vecino (limitado por IP) y el código del comercio
      funciona como contraseña: si se filtra, hay que generar uno nuevo.
- [ ] **El plan gratuito de Gemini puede usar el contenido** para mejorar los
      productos de Google: no usarlo con mensajes reales de víctimas.
- [ ] Política de retención y borrado de fotos de alertas y evidencia de cámara.

## Funcionalidad

- [ ] **Cámaras RTSP:** muchas cámaras baratas sólo dan RTSP. Hace falta un
      convertidor (go2rtc o MediaMTX) que entregue MJPEG o una instantánea JPEG.
- [ ] **Mensajes privados** entre comercios en el chat (requiere inicio de sesión).
- [ ] **SMS o WhatsApp** para quien no tenga la app abierta (tiene costo por mensaje).
- [ ] Transcribir notas de voz de WhatsApp en el servidor: instalar `faster-whisper`.
- [ ] Los datos de los comercios de demostración son simulados (hay un error de
      tipeo de `master`: «Papelaria» en lugar de «Papelería»).
- [ ] Decidir si se conserva o se elimina la rama `master` ahora que todo está en `main`.

## Producción

- [ ] Redis para el límite de peticiones y la difusión en vivo con varios servidores
      (hoy son en memoria, un solo proceso).
- [ ] Copias de seguridad de la base de datos (`server/data/red_segura.db`).
- [ ] Monitoreo de errores y registro de auditoría de la moderación.
- [ ] Los archivos de maqueta `SidebarSections.tsx` y `EscudoInteligencia.tsx` ya no
      se usan en Comunidades: borrarlos o reutilizarlos.
