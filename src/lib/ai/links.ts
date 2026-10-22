import type { EntityRow, LinkReport } from '../api'

/**
 * Análisis de enlaces y extracción de identificadores en el navegador.
 *
 * Es la versión sin conexión del analizador del backend
 * (`server/app/services/links.py`): las mismas reglas, sin la consulta de
 * edad del dominio ni la base comunitaria.
 */

const OFFICIAL: Record<string, string> = {
  'bancolombia.com': 'Bancolombia',
  'grupobancolombia.com': 'Bancolombia',
  'nequi.com.co': 'Nequi',
  'daviplata.com': 'Daviplata',
  'davivienda.com': 'Davivienda',
  'bancodebogota.com': 'Banco de Bogotá',
  'bbva.com.co': 'BBVA',
  'bancodeoccidente.com.co': 'Banco de Occidente',
  'bancopopular.com.co': 'Banco Popular',
  'avvillas.com.co': 'AV Villas',
  'scotiabankcolpatria.com': 'Scotiabank Colpatria',
  'bancocajasocial.com': 'Banco Caja Social',
  'bancoagrario.gov.co': 'Banco Agrario',
  'movii.com.co': 'Movii',
  'nu.com.co': 'Nu',
  'dian.gov.co': 'DIAN',
  'fcm.org.co': 'SIMIT',
  'policia.gov.co': 'Policía Nacional',
  'gov.co': 'Gobierno de Colombia',
  'mercadolibre.com.co': 'Mercado Libre',
  'falabella.com.co': 'Falabella',
  'rappi.com.co': 'Rappi',
  'servientrega.com': 'Servientrega',
  'whatsapp.com': 'WhatsApp',
  'google.com': 'Google',
}

const BRANDS: Record<string, string> = {
  bancolombia: 'Bancolombia',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  davivienda: 'Davivienda',
  bancodebogota: 'Banco de Bogotá',
  bbva: 'BBVA',
  colpatria: 'Scotiabank Colpatria',
  avvillas: 'AV Villas',
  bancopopular: 'Banco Popular',
  bancoagrario: 'Banco Agrario',
  movii: 'Movii',
  dian: 'DIAN',
  simit: 'SIMIT',
  fotomulta: 'SIMIT',
  policia: 'Policía Nacional',
  'bre-b': 'Bre-B',
  breb: 'Bre-B',
  pse: 'PSE',
  mercadolibre: 'Mercado Libre',
  falabella: 'Falabella',
  rappi: 'Rappi',
  servientrega: 'Servientrega',
  whatsapp: 'WhatsApp',
}

const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'is.gd', 'cutt.ly', 'rb.gy', 'ow.ly', 'goo.gl', 'shorturl.at',
  'tiny.cc', 's.id', 'rebrand.ly', 't.ly', 'acortar.link', 'linktr.ee',
])
const RISKY_TLDS = new Set([
  'xyz', 'top', 'tk', 'ml', 'ga', 'cf', 'gq', 'zip', 'mov', 'click', 'link', 'live', 'online',
  'site', 'club', 'shop', 'info', 'buzz', 'icu', 'rest', 'cyou', 'lat', 'sbs', 'cfd', 'monster',
])
const LURE = /(login|ingreso|verifica|validar|actualiza|seguridad|desbloque|reactiva|premio|reclama|soporte|token|clave|pago|cobro|multa|embargo)/i

const URL_RE =
  /\b((?:https?:\/\/|www\.)[^\s<>"'()]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com\.co|gov\.co|com|co|net|org|info|xyz|top|online|site|club|shop|live|link|click|app|me|io|ly|gl|cc|tk|ml|ga|cf|gq|zip|mov)(?:\/[^\s<>"'()]*)?)/gi
const PHONE_RE = /(?<!\d)(?:\+?57[\s.-]?)?(3\d{2})[\s.-]?(\d{3})[\s.-]?(\d{4})(?!\d)/g
const EMAIL_RE = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g

function registrable(domain: string) {
  const parts = domain.split('.')
  if (parts.length >= 3 && ['com', 'gov', 'org', 'net', 'edu'].includes(parts[parts.length - 2]) && parts.at(-1) === 'co') {
    return parts.slice(-3).join('.')
  }
  return parts.slice(-2).join('.')
}

function officialBrand(domain: string) {
  for (const [official, brand] of Object.entries(OFFICIAL)) {
    if (domain === official || domain.endsWith(`.${official}`)) return brand
  }
  return null
}

function levenshtein(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= b.length; j += 1) {
      current.push(Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)))
    }
    previous = current
  }
  return previous[b.length]
}

function lookalike(label: string) {
  const normalized = label
    .replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/-/g, '')
  for (const [keyword, brand] of Object.entries(BRANDS)) {
    if (keyword.length < 5) continue
    if (normalized.includes(keyword)) return brand
    if (Math.abs(normalized.length - keyword.length) <= 2 && levenshtein(normalized, keyword) <= 2) return brand
  }
  return null
}

export function domainOf(url: string) {
  return url
    .replace(/^https?:\/\//i, '')
    .split(/[/?#]/)[0]
    .split('@')
    .at(-1)!
    .split(':')[0]
    .toLowerCase()
    .replace(/^www\./, '')
}

export function analyzeLink(rawUrl: string): LinkReport {
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `http://${rawUrl}`
  const domain = domainOf(url)
  const reasons: string[] = []
  let score = 0
  const official = officialBrand(domain)
  let impersonates: string | null = null
  if (official) reasons.push(`Dominio oficial de ${official}.`)

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) {
    score += 45
    reasons.push('El enlace apunta a una dirección IP en lugar de un dominio.')
  }
  if (domain.includes('xn--')) {
    score += 45
    reasons.push('Usa caracteres internacionales (punycode) para imitar letras de otro dominio.')
  }
  if (url.split('//')[1]?.split('/')[0].includes('@')) {
    score += 40
    reasons.push('Contiene «@» para ocultar el destino real del enlace.')
  }
  const reg = registrable(domain)
  if (!official) {
    const tokens = new Set(domain.split(/[.-]/))
    const compact = domain.replace(/[.-]/g, '')
    impersonates =
      Object.entries(BRANDS).find(
        ([keyword]) =>
          (keyword.length >= 6 && compact.includes(keyword)) || tokens.has(keyword) || (keyword.includes('-') && domain.includes(keyword)),
      )?.[1] ?? lookalike(reg.split('.')[0])
    if (impersonates) {
      score += 55
      reasons.push(`Imita a ${impersonates} pero NO es su dominio oficial.`)
    }
  }
  if (SHORTENERS.has(reg) || SHORTENERS.has(domain)) {
    score += 25
    reasons.push('Es un enlace acortado: oculta la página real de destino.')
  }
  const tld = domain.split('.').at(-1) ?? ''
  if (RISKY_TLDS.has(tld) && !official) {
    score += 20
    reasons.push(`Terminación «.${tld}», muy usada en campañas de phishing.`)
  }
  if (!official && (domain.match(/-/g)?.length ?? 0) >= 2) {
    score += 10
    reasons.push('Dominio con muchos guiones, típico de páginas falsas.')
  }
  if (!official && LURE.test(url)) {
    score += 15
    reasons.push('La dirección incluye palabras de gancho (verificar, actualizar, premio, multa…).')
  }
  if (official && score < 40) score = 0
  score = Math.min(100, score)
  if (reasons.length === 0) reasons.push('Sin señales técnicas de riesgo. Verifique igualmente el remitente.')
  return {
    url,
    domain,
    risk: score >= 45 ? 'alto' : score >= 20 ? 'medio' : 'bajo',
    score,
    reasons,
    impersonates,
    official,
    reported: 0,
    domain_age_days: null,
  }
}

/** Extrae enlaces, teléfonos y correos de un texto. */
export function extractEntities(text: string): { links: string[]; entities: EntityRow[] } {
  const entities: EntityRow[] = []
  const emails = [...text.matchAll(EMAIL_RE)].map((match) => match[0])
  const withoutEmails = text.replace(EMAIL_RE, ' ')
  emails.forEach((email) => {
    const [user, domain] = email.split('@')
    entities.push({ kind: 'correo', masked: `${user.slice(0, 2)}***@${domain}`, domain, reported: 0 })
  })
  const links = [...new Set([...withoutEmails.matchAll(URL_RE)].map((match) => match[1].replace(/[.,;:!?)»”]+$/, '')))]
  links.forEach((link) => entities.push({ kind: 'enlace', masked: link, domain: domainOf(link), reported: 0 }))
  const withoutLinks = withoutEmails.replace(URL_RE, ' ')
  const phones = new Set([...withoutLinks.matchAll(PHONE_RE)].map((match) => match.slice(1, 4).join('')))
  phones.forEach((digits) =>
    entities.push({ kind: 'telefono', masked: `${digits.slice(0, 3)} *** ${digits.slice(-4)}`, domain: null, reported: 0 }),
  )
  return { links, entities }
}
