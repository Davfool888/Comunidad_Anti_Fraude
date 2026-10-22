/**
 * Código de acceso del comercio verificado en este navegador.
 *
 * Lo entrega un moderador al aprobar el comercio. Se envía en la cabecera
 * `X-Merchant-Code` al publicar alertas y mensajes, y el servidor decide si
 * es válido: el navegador sólo lo guarda. Si el almacenamiento no está
 * disponible (modo privado), vale para la sesión actual.
 */

const KEY = 'red-segura:comercio'

export type StoredMerchant = {
  code: string
  id: number
  name: string
  business: string
  network_id: string
  community_id: string | null
}

let memory: StoredMerchant | null = null

export function readMerchant(): StoredMerchant | null {
  if (memory) return memory
  try {
    const raw = localStorage.getItem(KEY)
    memory = raw ? (JSON.parse(raw) as StoredMerchant) : null
  } catch {
    memory = null
  }
  return memory
}

export function writeMerchant(value: StoredMerchant | null) {
  memory = value
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value))
    else localStorage.removeItem(KEY)
  } catch {
    /* sin almacenamiento: queda sólo en memoria */
  }
}

/** Cabecera para las peticiones que publican en nombre del comercio. */
export function merchantHeaders(): Record<string, string> {
  const merchant = readMerchant()
  return merchant ? { 'X-Merchant-Code': merchant.code } : {}
}
