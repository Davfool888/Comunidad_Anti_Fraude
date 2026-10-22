import { useSyncExternalStore } from 'react'
import { api } from './api'
import { readMerchant, writeMerchant, type StoredMerchant } from './merchantCode'

/**
 * Sesión del comercio verificado: quién publica desde este navegador.
 *
 * Sin código, la persona participa como vecino (con el nombre que elija).
 * Con un código válido, sus alertas y mensajes salen como «comercio
 * verificado». El servidor revalida el código en cada publicación.
 */

const listeners = new Set<() => void>()
const ALIAS_KEY = 'red-segura:alias'
let alias: string | null = null

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export async function signInMerchant(code: string): Promise<StoredMerchant> {
  const profile = await api.merchantSession(code.trim())
  const stored = { ...profile, code: code.trim() }
  writeMerchant(stored)
  emit()
  return stored
}

export function signOutMerchant() {
  writeMerchant(null)
  emit()
}

export function useMerchant() {
  return useSyncExternalStore(subscribe, readMerchant)
}

/** Nombre con el que un vecino aparece en el chat. */
export function readAlias() {
  if (alias !== null) return alias
  try {
    alias = localStorage.getItem(ALIAS_KEY) ?? ''
  } catch {
    alias = ''
  }
  return alias
}

export function writeAlias(value: string) {
  alias = value.trim().slice(0, 40)
  try {
    localStorage.setItem(ALIAS_KEY, alias)
  } catch {
    /* sin almacenamiento: dura la sesión */
  }
  emit()
}

export function useAlias() {
  return useSyncExternalStore(subscribe, readAlias)
}
