import { useEffect, useSyncExternalStore } from 'react'
import { ALERTS_STREAM_URL, api, type CommunityAlert } from './api'

/**
 * Alertas de la red en vivo.
 *
 * Una sola conexión SSE para toda la aplicación: el mapa, la vista
 * isométrica, el chat y el panel de alertas leen del mismo almacén.
 */

type State = {
  alerts: CommunityAlert[]
  online: boolean
  loaded: boolean
}

let state: State = { alerts: [], online: false, loaded: false }
const listeners = new Set<() => void>()
let source: EventSource | null = null
let users = 0

function set(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

function upsert(alert: CommunityAlert) {
  const others = state.alerts.filter((item) => item.id !== alert.id)
  set({ alerts: [alert, ...others].sort((a, b) => b.created_at.localeCompare(a.created_at)) })
}

function remove(id: number) {
  set({ alerts: state.alerts.filter((item) => item.id !== id) })
}

async function refresh() {
  try {
    set({ alerts: await api.alerts({ limit: 200 }), online: true, loaded: true })
  } catch {
    set({ online: false, loaded: true })
  }
}

function connect() {
  if (source || typeof EventSource === 'undefined') return
  void refresh()
  source = new EventSource(ALERTS_STREAM_URL)
  source.onopen = () => set({ online: true })
  source.onerror = () => set({ online: false })
  const parse = (event: MessageEvent) => JSON.parse(event.data as string) as CommunityAlert
  source.addEventListener('alert', (event) => upsert(parse(event as MessageEvent)))
  source.addEventListener('alert_update', (event) => upsert(parse(event as MessageEvent)))
  source.addEventListener('alert_removed', (event) => remove(parse(event as MessageEvent).id))
}

function disconnect() {
  source?.close()
  source = null
}

/** Añade una alerta recién creada sin esperar al evento del servidor. */
export function addLocalAlert(alert: CommunityAlert) {
  upsert(alert)
}

export function useAlerts(filter?: { networkId?: string; communityId?: string }) {
  useEffect(() => {
    users += 1
    connect()
    return () => {
      users -= 1
      if (users === 0) disconnect()
    }
  }, [])

  const snapshot = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
  )

  const alerts = snapshot.alerts.filter(
    (alert) =>
      (!filter?.networkId || alert.network_id === filter.networkId) &&
      (!filter?.communityId || !alert.community_id || alert.community_id === filter.communityId),
  )
  return { alerts, online: snapshot.online, loaded: snapshot.loaded, refresh }
}

/** «Hace 5 min», «hace 2 h», «ayer». */
export function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'ayer'
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}
