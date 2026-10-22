import { useEffect, useSyncExternalStore } from 'react'
import { api, type CommunityAlert } from './api'
import { onLiveEvent, onLiveStatus, onReconnect, retainLive } from './live'

/**
 * Alertas de la red en vivo.
 *
 * Un solo almacén para toda la aplicación: el mapa, la vista isométrica, el
 * chat y el panel de alertas leen de aquí. Los eventos llegan por la conexión
 * compartida de `live.ts`.
 */

type State = {
  alerts: CommunityAlert[]
  online: boolean
  loaded: boolean
}

let state: State = { alerts: [], online: false, loaded: false }
const listeners = new Set<() => void>()
let wired = false

function set(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

function upsert(alert: CommunityAlert) {
  const previous = state.alerts.find((item) => item.id === alert.id)
  // los eventos del servidor son para todos: «confirmé yo» se conserva del dato local
  const merged = {
    ...previous,
    ...alert,
    camera: alert.camera ?? previous?.camera,
    affected_merchant: alert.affected_merchant ?? previous?.affected_merchant,
    confirmed_by_me: alert.confirmed_by_me ?? previous?.confirmed_by_me ?? false,
  }
  const others = state.alerts.filter((item) => item.id !== alert.id)
  set({ alerts: [merged, ...others].sort((a, b) => b.created_at.localeCompare(a.created_at)) })
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

function wire() {
  if (wired) return
  wired = true
  onLiveEvent<CommunityAlert>('alert', upsert)
  onLiveEvent<CommunityAlert>('alert_update', upsert)
  onLiveEvent<CommunityAlert>('alert_removed', (alert) => remove(alert.id))
  onReconnect(() => void refresh())
  onLiveStatus((online) => set({ online }))
}

/** Añade o actualiza una alerta sin esperar al evento del servidor. */
export function addLocalAlert(alert: CommunityAlert) {
  upsert(alert)
}

/** «A mí también me pasó», con actualización optimista. */
export async function confirmAlert(alert: CommunityAlert) {
  if (alert.confirmed_by_me) return
  upsert({ ...alert, confirmed_by_me: true, confirmations: alert.confirmations + 1 })
  try {
    upsert(await api.confirmAlert(alert.id))
  } catch {
    upsert(alert) // se deshace si falló
  }
}

export function useAlerts(filter?: { networkId?: string; communityId?: string }) {
  useEffect(() => {
    wire()
    const release = retainLive()
    if (!state.loaded) void refresh()
    return release
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
