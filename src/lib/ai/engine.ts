import { analyzeFraud } from '../../data/fraud'
import { api, ApiUnavailable, CATEGORIES, type AnalysisResult, type ChatTurn, type Signal } from '../api'
import { analyzeLink, extractEntities } from './links'

/**
 * Motor híbrido de análisis.
 *
 *  1. Intenta el backend (Claude + reglas + base comunitaria).
 *  2. Si el backend no tiene IA y hay capturas, hace el OCR aquí y reenvía
 *     el texto extraído para que el servidor lo cruce con la comunidad.
 *  3. Si el backend no responde, todo se resuelve en el navegador: reglas,
 *     análisis de enlaces, OCR (Tesseract) y detección de objetos (MediaPipe).
 */

export type Stage = 'enviando' | 'leyendo-imagenes' | 'analizando-imagenes' | 'analizando'

const isImage = (file: File) => file.type.startsWith('image/')

async function localOcr(images: File[], onStage?: (stage: Stage) => void) {
  if (images.length === 0) return ''
  onStage?.('leyendo-imagenes')
  try {
    const { extractText } = await import('./ocr')
    return await extractText(images)
  } catch {
    return ''
  }
}

async function localThreats(images: File[], onStage?: (stage: Stage) => void) {
  if (images.length === 0) return null
  onStage?.('analizando-imagenes')
  try {
    const { loadImage, scanImage } = await import('./vision')
    const scans = await Promise.all(images.map(async (file) => scanImage(await loadImage(file))))
    const items = scans.flatMap((scan) => scan.threats.items)
    return items.length
      ? { detected: true, items, summary: scans.map((scan) => scan.threats.summary).join(' '), engine: 'navegador' }
      : null
  } catch {
    return null
  }
}

export async function analyzeHybrid(input: {
  text: string
  source: 'voz' | 'texto' | 'evidencia'
  files: File[]
  networkId?: string
  history?: ChatTurn[]
  onStage?: (stage: Stage) => void
}): Promise<AnalysisResult> {
  const images = input.files.filter(isImage)
  input.onStage?.('enviando')
  try {
    let result = await api.analyze({
      text: input.text,
      source: input.source,
      networkId: input.networkId,
      files: input.files,
      history: input.history,
    })
    if (result.client_ocr_requested) {
      const ocrText = await localOcr(images, input.onStage)
      input.onStage?.('analizando')
      if (ocrText) {
        result = await api.analyze({
          text: input.text,
          source: input.source,
          networkId: input.networkId,
          files: input.files,
          ocrText,
        })
      }
    }
    if (!result.threats && images.length && result.engine !== 'claude') {
      const threats = await localThreats(images, input.onStage)
      if (threats) result = withThreats(result, threats)
    }
    return result
  } catch (error) {
    if (!(error instanceof ApiUnavailable)) throw error
    const chat = input.files.length === 0 ? offlineReply(input.text) : null
    if (chat) return conversation(chat)
    return analyzeLocally({ ...input, images })
  }
}

/* Respuestas básicas sin servidor (el backend tiene la versión completa). */

const OFFLINE_CAPABILITIES =
  'Soy el asistente antifraude de la red. Puedo analizar un mensaje, una llamada o una captura sospechosa y decirle si es fraude, revisar los enlaces que trae y explicarle qué hacer. Pegue el mensaje o cuénteme la situación.\n\n(Sin conexión con el servidor: las alertas de la red y las preguntas sobre modalidades no están disponibles ahora.)'

function offlineReply(text: string) {
  const clean = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/^[¿¡\s]+/, '')
    .trim()
  if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|saludos)\b[\s!.,?]*$/.test(clean)) return OFFLINE_CAPABILITIES
  if (/(que (puedes|puede|sabes|sabe) hacer|como funcionas|para que sirves|quien eres|en que (me )?(puedes|puede) ayudar|como te uso)/.test(clean)) {
    return OFFLINE_CAPABILITIES
  }
  if (/^(gracias|muchas gracias)\b/.test(clean)) return 'Con gusto. Si le llega otro mensaje raro, analícelo aquí antes de responder o pagar.'
  return null
}

function conversation(reply: string): AnalysisResult {
  return {
    intent: 'conversacion',
    reply,
    verdict: 'limpio',
    score: 0,
    category: 'otro',
    category_label: CATEGORIES.otro,
    headline: '',
    summary: reply,
    signals: [],
    actions: [],
    checks: [],
    source: 'texto',
    engine: 'navegador',
    engine_note: null,
    transcript: null,
    extracted_text: null,
    links: [],
    entities: [],
    receipt: null,
    threats: null,
    emergency: false,
    channel: 'desconocido',
    client_ocr_requested: false,
  }
}

function withThreats(result: AnalysisResult, threats: NonNullable<AnalysisResult['threats']>): AnalysisResult {
  const weapon = threats.items.some((item) => ['cuchillo', 'arma_de_fuego', 'arma_blanca'].includes(item.label))
  return {
    ...result,
    threats,
    emergency: result.emergency || weapon,
    actions: weapon
      ? ['Si hay riesgo para su vida o la de otros, llame ya a la línea 123 de la Policía.', ...result.actions]
      : result.actions,
  }
}

async function analyzeLocally(input: {
  text: string
  source: 'voz' | 'texto' | 'evidencia'
  files: File[]
  images: File[]
  onStage?: (stage: Stage) => void
}): Promise<AnalysisResult> {
  const ocrText = await localOcr(input.images, input.onStage)
  input.onStage?.('analizando')
  const combined = [input.text, ocrText].filter(Boolean).join('\n')
  const base = analyzeFraud({
    text: combined,
    source: input.source,
    evidence: input.files.map((file) => ({
      name: file.name,
      kind: isImage(file) ? 'imagen' : 'documento',
      size: file.size,
    })),
  })

  const { links, entities } = extractEntities(combined)
  const linkReports = links.slice(0, 6).map(analyzeLink)
  const signals: Signal[] = base.signals
    .filter((signal) => !signal.id.startsWith('evidencia-'))
    .map(({ id, label, detail, weight, level }) => ({ id, label, detail, weight, level }))
  let score = base.score
  for (const link of linkReports) {
    if (link.risk === 'bajo') continue
    signals.unshift({
      id: `enlace-${link.domain}`,
      label: `Enlace de riesgo ${link.risk}: ${link.domain}`,
      detail: link.reasons.find((reason) => reason.includes('Imita')) ?? link.reasons[0],
      weight: link.risk === 'alto' ? 3 : 2,
      level: link.risk === 'alto' ? 'danger' : 'warning',
    })
    score = Math.min(100, score + (link.risk === 'alto' ? 45 : 20))
  }
  const verdict = score >= 45 ? 'fraude' : score >= 18 ? 'sospechoso' : 'limpio'
  const headline =
    verdict === base.verdict ? base.headline : verdict === 'fraude' ? 'Esto es un fraude' : 'Es sospechoso: verifique antes de actuar'
  const category = signals.some((signal) => signal.id === 'otp')
    ? 'codigo_otp'
    : linkReports.some((link) => link.risk !== 'bajo')
      ? 'phishing_enlace'
      : signals.some((signal) => signal.id === 'suplantacion' || signal.id === 'credenciales')
        ? 'suplantacion_entidad'
        : 'otro'

  let result: AnalysisResult = {
    ...base,
    intent: 'analisis',
    reply: null,
    verdict,
    score,
    headline,
    signals,
    category,
    category_label: CATEGORIES[category],
    engine: 'navegador',
    engine_note: 'Sin conexión con el servidor: análisis hecho en su navegador.',
    transcript: null,
    extracted_text: ocrText || null,
    links: linkReports,
    entities,
    receipt: null,
    threats: null,
    emergency: false,
    channel: 'desconocido',
    client_ocr_requested: false,
    checks: base.checks.map((check) =>
      check.label.startsWith('Los enlaces') ? { ...check, ok: linkReports.every((link) => link.risk === 'bajo') } : check,
    ),
  }
  const threats = await localThreats(input.images, input.onStage)
  if (threats) result = withThreats(result, threats)
  return result
}
