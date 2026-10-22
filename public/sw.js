/**
 * Service worker de la Red Segura de Comercios: avisos Web Push.
 *
 * Muestra la notificación de una alerta aunque la página esté cerrada y,
 * al pulsarla, abre la alerta (con la cámara del comercio afectado).
 */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Alerta de la red', body: event.data ? event.data.text() : '' }
  }
  const urgent = Boolean(data.urgent)
  event.waitUntil(
    self.registration.showNotification(data.title || 'Alerta de la red', {
      body: data.body || 'Hay una alerta nueva en su barrio.',
      tag: data.alertId ? `alerta-${data.alertId}` : undefined,
      renotify: true,
      requireInteraction: urgent,
      vibrate: urgent ? [300, 120, 300, 120, 600] : [200],
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { alertId: data.alertId },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const alertId = event.notification.data && event.notification.data.alertId
  const url = alertId ? `/?alerta=${alertId}` : '/'
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus()
          client.postMessage({ type: 'abrir-alerta', alertId })
          return
        }
      }
      await self.clients.openWindow(url)
    })(),
  )
})
