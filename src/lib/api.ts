/**
 * Cliente del backend (FastAPI, carpeta `server/`).
 *
 * En desarrollo Vite redirige `/api` al puerto 8000. En producción se puede
 * apuntar a otro origen con `VITE_API_URL`. Si el backend no responde, cada
 * función lanza `ApiUnavailable` y la interfaz pasa al motor local.
 */

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export class ApiUnavailable extends Error {}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), init?.timeoutMs ?? 120_000)
  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, { ...init, signal: controller.signal })
  } catch {
    throw new ApiUnavailable('No hay conexión con el servidor de la red.')
  } finally {
    window.clearTimeout(timer)
  }
  // El proxy de Vite responde 502/504 cuando el backend está apagado
  if (response.status === 502 || response.status === 503 || response.status === 504) {
    throw new ApiUnavailable('El servidor de la red no está disponible.')
  }
  if (!response.ok) {
    let message = `Error ${response.status}`
    try {
      const body = (await response.json()) as { detail?: unknown }
      if (typeof body.detail === 'string') message = body.detail
    } catch {
      /* respuesta sin JSON */
    }
    throw new ApiError(response.status, message)
  }
  return (await response.json()) as T
}

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export type Verdict = 'fraude' | 'sospechoso' | 'limpio'
export type Level = 'danger' | 'warning' | 'info'

export type Signal = {
  id: string
  label: string
  detail: string
  weight: number
  level: 'danger' | 'warning'
}

export type LinkReport = {
  url: string
  domain: string
  risk: 'alto' | 'medio' | 'bajo'
  score: number
  reasons: string[]
  impersonates: string | null
  official: string | null
  reported: number
  domain_age_days: number | null
}

export type EntityRow = {
  kind: 'telefono' | 'cuenta' | 'enlace' | 'correo'
  masked: string
  domain: string | null
  reported: number
}

export type ThreatItem = {
  label: string
  description: string
  confidence: 'alta' | 'media' | 'baja'
}

export type Threats = {
  detected: boolean
  items: ThreatItem[]
  summary: string
  engine?: string
}

export type ReceiptCheck = {
  is_receipt: boolean
  verdict: 'falso' | 'dudoso' | 'sin_indicios' | 'no_aplica'
  reasons: string[]
  amount: string
  bank: string
}

export type AnalysisResult = {
  /** `conversacion`: el usuario preguntó algo; se responde con `reply` y no hay veredicto. */
  intent: 'analisis' | 'conversacion'
  reply: string | null
  verdict: Verdict
  score: number
  category: string
  category_label: string
  headline: string
  summary: string
  signals: Signal[]
  actions: string[]
  checks: { label: string; ok: boolean }[]
  source: 'voz' | 'texto' | 'evidencia'
  engine: 'claude' | 'gemini' | 'local' | 'navegador'
  engine_note: string | null
  transcript: string | null
  extracted_text: string | null
  links: LinkReport[]
  entities: EntityRow[]
  receipt: ReceiptCheck | null
  threats: Threats | null
  emergency: boolean
  channel: string
  client_ocr_requested: boolean
  notes?: string[]
}

export type ChatTurn = { role: 'user' | 'assistant'; text: string }

export type ApiStatus = {
  ai_enabled: boolean
  provider: 'claude' | 'gemini' | 'local'
  model: string | null
  server_transcription: boolean
  alerts_auto_publish: boolean
}

export type AlertStatus = 'pendiente' | 'sin_verificar' | 'verificada' | 'rechazada'

export type CommunityAlert = {
  id: number
  network_id: string
  community_id: string | null
  business_name: string | null
  lat: number | null
  lng: number | null
  level: Level
  category: string
  category_label: string
  title: string
  description: string
  entities: { kind: string; masked: string; domain: string | null }[]
  image_url: string | null
  threat: (Threats & { suspect_description?: string }) | null
  status: AlertStatus
  confirmations: number
  created_at: string
  reviewed_at: string | null
  review_note: string | null
}

export type Modality = {
  id: number
  slug: string
  title: string
  category: string
  category_label: string
  channel: string
  summary: string
  red_flags: string[]
  protect: string[]
  challenge: {
    question: string
    options: { text: string; correct: boolean; feedback: string }[]
    explanation: string
  }
  origin: 'curada' | 'comunidad-ia' | 'comunidad'
  reports: number
  recent_reports: number
  created_at: string
}

export type Trends = {
  days: number
  by_category: { category: string; label: string; total: number }[]
  by_network: { network_id: string; total: number; danger: number }[]
  by_day: { day: string; total: number }[]
  verdicts: Partial<Record<Verdict, number>>
}

export type Merchant = {
  id: number
  name: string
  business: string
  nit: string | null
  contact: string | null
  network_id: string
  community_id: string | null
  status: 'pendiente' | 'verificado' | 'rechazado'
  created_at: string
}

/** Categorías de fraude (las mismas del backend). */
export const CATEGORIES: Record<string, string> = {
  suplantacion_entidad: 'Suplantación de banco o entidad',
  phishing_enlace: 'Enlace de phishing',
  codigo_otp: 'Robo de códigos de verificación',
  falso_comprobante: 'Comprobante de pago falso',
  falso_familiar: 'Familiar o conocido en apuros',
  prestamo_falso: 'Préstamo falso o gota a gota digital',
  empleo_falso: 'Empleo o tareas pagadas falsas',
  compra_venta: 'Compra o venta fraudulenta',
  qr_fraudulento: 'Código QR fraudulento',
  sim_swap: 'Robo de la línea (SIM swap)',
  extorsion_amenaza: 'Extorsión o amenaza',
  inversion_falsa: 'Inversión o cripto falsa',
  voz_clonada: 'Llamada con voz clonada (deepfake)',
  cobro_falso: 'Multa o cobro falso',
  hurto_violento: 'Hurto o riesgo físico',
  otro: 'Otra modalidad',
}

/* ------------------------------------------------------------------ */
/* Endpoints                                                           */
/* ------------------------------------------------------------------ */

export const api = {
  status: () => request<ApiStatus>('/api/status', { timeoutMs: 4000 }),

  analyze: (input: {
    text: string
    source: 'voz' | 'texto' | 'evidencia'
    networkId?: string
    files?: File[]
    ocrText?: string
    /** Últimos turnos de la conversación, para entender preguntas de seguimiento. */
    history?: ChatTurn[]
  }) => {
    const form = new FormData()
    form.append('text', input.text)
    form.append('source', input.source)
    if (input.networkId) form.append('network_id', input.networkId)
    if (input.ocrText) form.append('ocr_text', input.ocrText)
    if (input.history?.length) form.append('history', JSON.stringify(input.history.slice(-6)))
    input.files?.forEach((file) => form.append('files', file))
    return request<AnalysisResult>('/api/analyze', { method: 'POST', body: form })
  },

  checkLink: (url: string) => request<LinkReport>(`/api/links/check?url=${encodeURIComponent(url)}`),

  lookup: (value: string) =>
    request<{
      results: (EntityRow & { reports: number; last_report: string | null; categories: string[] })[]
    }>(`/api/reports/lookup?value=${encodeURIComponent(value)}`),

  alerts: (params: { networkId?: string; communityId?: string; limit?: number } = {}) => {
    const query = new URLSearchParams()
    if (params.networkId) query.set('network_id', params.networkId)
    if (params.communityId) query.set('community_id', params.communityId)
    if (params.limit) query.set('limit', String(params.limit))
    return request<CommunityAlert[]>(`/api/alerts?${query}`, { timeoutMs: 8000 })
  },

  createAlert: (input: {
    networkId: string
    communityId?: string
    businessName?: string
    lat?: number
    lng?: number
    level: Level
    category: string
    title: string
    description: string
    identifiers?: string
    image?: Blob | null
    clientThreats?: Threats | null
  }) => {
    const form = new FormData()
    form.append('network_id', input.networkId)
    if (input.communityId) form.append('community_id', input.communityId)
    if (input.businessName) form.append('business_name', input.businessName)
    if (input.lat != null && input.lng != null) {
      form.append('lat', String(input.lat))
      form.append('lng', String(input.lng))
    }
    form.append('level', input.level)
    form.append('category', input.category)
    form.append('title', input.title)
    form.append('description', input.description)
    if (input.identifiers) form.append('identifiers', input.identifiers)
    if (input.image) form.append('image', input.image, 'alerta.jpg')
    if (input.clientThreats) form.append('client_threats', JSON.stringify(input.clientThreats))
    return request<CommunityAlert>('/api/alerts', { method: 'POST', body: form })
  },

  confirmAlert: (id: number) => request<CommunityAlert>(`/api/alerts/${id}/confirm`, { method: 'POST' }),

  modalities: () => request<Modality[]>('/api/education/modalities', { timeoutMs: 8000 }),

  trends: (networkId?: string) =>
    request<Trends>(`/api/stats/trends${networkId ? `?network_id=${encodeURIComponent(networkId)}` : ''}`),

  requestVerification: (input: {
    name: string
    business: string
    nit?: string
    contact?: string
    network_id: string
    community_id?: string
  }) =>
    request<{ id: number; status: string }>('/api/merchants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
}

/** Endpoints del panel de moderación (requieren el token). */
export function moderationApi(token: string) {
  const headers = { 'X-Moderator-Token': token }
  const json = { ...headers, 'Content-Type': 'application/json' }
  return {
    check: () => request<{ ok: boolean }>('/api/moderation/check', { headers }),
    alerts: (status?: AlertStatus) =>
      request<CommunityAlert[]>(`/api/moderation/alerts${status ? `?status=${status}` : ''}`, { headers }),
    reviewAlert: (id: number, body: { status: 'verificada' | 'rechazada' | 'sin_verificar'; note?: string; level?: Level }) =>
      request<CommunityAlert>(`/api/moderation/alerts/${id}`, { method: 'PATCH', headers: json, body: JSON.stringify(body) }),
    merchants: () => request<Merchant[]>('/api/moderation/merchants', { headers }),
    reviewMerchant: (id: number, status: Merchant['status']) =>
      request<Merchant>(`/api/moderation/merchants/${id}`, { method: 'PATCH', headers: json, body: JSON.stringify({ status }) }),
    generateModalities: () =>
      request<{ created: Modality[]; skipped: string[] }>('/api/moderation/modalities/generate', {
        method: 'POST',
        headers,
      }),
  }
}

/** URL del flujo de alertas en vivo (SSE). */
export const ALERTS_STREAM_URL = `${BASE}/api/alerts/stream`
