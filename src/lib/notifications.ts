import { useSyncExternalStore } from 'react'
import { api } from './api'

/**
 * Avisos de alerta: sonido en la app y notificaciones del sistema (Web Push).
 *
 * El sonido se genera con Web Audio (sin archivos). Las notificaciones push
 * llegan aunque la página esté cerrada: el navegador pide permiso una vez y
 * la suscripción se registra en el servidor para el barrio activo.
 */

const SOUND_KEY = 'red-segura:sonido'
const listeners = new Set<() => void>()
let soundOn: boolean | null = null
let audio: AudioContext | null = null

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/* ------------------------------------------------------------------ */
/* Sonido                                                              */
/* ------------------------------------------------------------------ */

export function readSound() {
  if (soundOn !== null) return soundOn
  try {
    soundOn = localStorage.getItem(SOUND_KEY) !== 'no'
  } catch {
    soundOn = true
  }
  return soundOn
}

export function setSound(value: boolean) {
  soundOn = value
  try {
    localStorage.setItem(SOUND_KEY, value ? 'si' : 'no')
  } catch {
    /* sin almacenamiento */
  }
  if (value) unlockAudio()
  emit()
}

export function useSound() {
  return useSyncExternalStore(subscribe, readSound)
}

/** Los navegadores sólo permiten sonar tras un gesto del usuario: se prepara en el primer clic. */
export function unlockAudio() {
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    audio = null
  }
}

/**
 * Tono de aviso. `alarma` es la sirena larga para el comercio afectado;
 * `incidente` y `aviso` son más cortos.
 */
export function playAlertSound(kind: 'alarma' | 'incidente' | 'aviso') {
  if (!readSound()) return
  unlockAudio()
  if (!audio) return
  const ctx = audio
  const start = ctx.currentTime
  const gain = ctx.createGain()
  gain.connect(ctx.destination)
  const osc = ctx.createOscillator()
  osc.type = kind === 'alarma' ? 'sawtooth' : 'sine'
  osc.connect(gain)
  const length = kind === 'alarma' ? 4 : kind === 'incidente' ? 1.2 : 0.5
  if (kind === 'alarma') {
    // sirena: sube y baja
    for (let t = 0; t < length; t += 0.5) {
      osc.frequency.setValueAtTime(620, start + t)
      osc.frequency.linearRampToValueAtTime(1180, start + t + 0.25)
      osc.frequency.linearRampToValueAtTime(620, start + t + 0.5)
    }
  } else {
    osc.frequency.setValueAtTime(880, start)
    osc.frequency.setValueAtTime(660, start + 0.18)
    if (kind === 'incidente') osc.frequency.setValueAtTime(880, start + 0.5)
  }
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(kind === 'alarma' ? 0.28 : 0.18, start + 0.03)
  gain.gain.setValueAtTime(kind === 'alarma' ? 0.28 : 0.18, start + length - 0.1)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.start(start)
  osc.stop(start + length)
}

/* ------------------------------------------------------------------ */
/* Notificaciones push                                                 */
/* ------------------------------------------------------------------ */

export type PushState = 'no-soportado' | 'bloqueado' | 'inactivo' | 'activo'

let pushState: PushState = 'inactivo'

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function base64UrlToBytes(value: string) {
  const padded = (value + '='.repeat((4 - (value.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

async function registration() {
  return navigator.serviceWorker.register('/sw.js')
}

export async function refreshPushState() {
  if (!pushSupported()) pushState = 'no-soportado'
  else if (Notification.permission === 'denied') pushState = 'bloqueado'
  else {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js')
    pushState = (await reg?.pushManager.getSubscription()) ? 'activo' : 'inactivo'
  }
  emit()
  return pushState
}

/** Pide permiso y suscribe este navegador a las alertas del barrio. */
export async function enablePush(networkId: string, communityId?: string) {
  if (!pushSupported()) throw new Error('Este navegador no permite notificaciones.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    await refreshPushState()
    throw new Error('Para recibir avisos, permita las notificaciones en el navegador.')
  }
  unlockAudio()
  const reg = await registration()
  const { key } = await api.pushKey()
  const existing = await reg.pushManager.getSubscription()
  const subscription =
    existing ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(key) }))
  const json = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
  await api.pushSubscribe({ endpoint: json.endpoint, keys: json.keys, network_id: networkId, community_id: communityId })
  await refreshPushState()
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration('/sw.js')
  const subscription = await reg?.pushManager.getSubscription()
  if (subscription) {
    await api.pushUnsubscribe(subscription.endpoint).catch(() => undefined)
    await subscription.unsubscribe()
  }
  await refreshPushState()
}

export function usePushState() {
  return useSyncExternalStore(subscribe, () => pushState)
}
