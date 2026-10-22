import { ALERTS_STREAM_URL } from './api'

/**
 * Conexión en vivo con la red (Server-Sent Events).
 *
 * Una sola conexión para toda la aplicación: las alertas y el chat se
 * suscriben a sus eventos. Cuando la conexión se cae y vuelve, se avisa a los
 * suscriptores para que recarguen lo que llegó mientras tanto (el servidor no
 * reenvía los eventos perdidos).
 */

type Handler = (data: unknown) => void

const handlers = new Map<string, Set<Handler>>()
const reconnectHandlers = new Set<() => void>()
const statusHandlers = new Set<(online: boolean) => void>()
let source: EventSource | null = null
let users = 0
let online = false
let everOpened = false

function setOnline(value: boolean) {
  if (online === value) return
  online = value
  statusHandlers.forEach((handler) => handler(value))
}

function attach(type: string) {
  source?.addEventListener(type, (event) => {
    const data = JSON.parse((event as MessageEvent).data as string) as unknown
    handlers.get(type)?.forEach((handler) => handler(data))
  })
}

function connect() {
  if (source || typeof EventSource === 'undefined') return
  source = new EventSource(ALERTS_STREAM_URL)
  source.onopen = () => {
    setOnline(true)
    // tras una caída, recuperar lo que no llegó por el flujo
    if (everOpened) reconnectHandlers.forEach((handler) => handler())
    everOpened = true
  }
  source.onerror = () => setOnline(false)
  handlers.forEach((_, type) => attach(type))
}

/** Mantiene la conexión abierta mientras haya alguien usándola. */
export function retainLive() {
  users += 1
  connect()
  return () => {
    users -= 1
    if (users === 0) {
      source?.close()
      source = null
      everOpened = false
      setOnline(false)
    }
  }
}

export function onLiveEvent<T>(type: string, handler: (data: T) => void) {
  if (!handlers.has(type)) {
    handlers.set(type, new Set())
    attach(type)
  }
  handlers.get(type)!.add(handler as Handler)
  return () => handlers.get(type)?.delete(handler as Handler)
}

export function onReconnect(handler: () => void) {
  reconnectHandlers.add(handler)
  return () => reconnectHandlers.delete(handler)
}

export function onLiveStatus(handler: (online: boolean) => void) {
  statusHandlers.add(handler)
  return () => statusHandlers.delete(handler)
}
