/**
 * Edificios reales de una comunidad de barrio.
 *
 * Para que los comercios no se coloquen al azar, consultamos **OpenStreetMap**
 * las construcciones de la zona del barrio y usamos esas coordenadas reales
 * como anclaje. Si el servicio no está disponible, se genera una distribución
 * determinista alrededor del centro del barrio para que la vista nunca quede
 * vacía (y así se indica en pantalla).
 */

import { dedupeByDistance, isValidCoordinate, pointsWithinRadius } from '../lib/geo.ts'

/** Una construcción real dentro de la zona consultada. */
export type HousePoint = {
  id: string
  lat: number
  lng: number
  /** Altura aproximada en metros (según los niveles de OSM). */
  levels: number
  /** Tipo de construcción declarado en OSM. */
  kind: string
}

/** Radio de la zona consultada alrededor del centro del barrio, en metros. */
const ZONE_RADIUS = 220

/** Cache por comunidad: no se vuelve a consultar lo mismo. */
const cache = new Map<string, HousePoint[]>()

/** Peticiones en curso, para no duplicar consultas simultáneas. */
const pending = new Map<string, Promise<HousePoint[]>>()

/** Clave del respaldo en `sessionStorage` (sobrevive a los remontajes). */
const STORAGE_KEY = 'escudo.casas.v1'

/** Guarda las casas de la sesión para no repetir la consulta. */
function persist(communityId: string, houses: HousePoint[]) {
  if (typeof window === 'undefined') return
  try {
    const store = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '{}') as Record<
      string,
      HousePoint[]
    >
    store[communityId] = houses
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* sin almacenamiento disponible */
  }
}

/** Recupera las casas guardadas en la sesión. */
function restore(communityId: string): HousePoint[] | null {
  if (typeof window === 'undefined') return null
  try {
    const store = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '{}') as Record<
      string,
      HousePoint[]
    >
    return store[communityId] ?? null
  } catch {
    return null
  }
}

/** Metros por grado de latitud (aproximado para Bogotá). */
const METERS_PER_DEGREE_LAT = 111_320

/** Convierte un radio en metros a grados de latitud. */
function radiusToDegrees(meters: number) {
  return meters / METERS_PER_DEGREE_LAT
}

/** Ordena las construcciones: primero las de más niveles (más visibles). */
function byLevels(a: HousePoint, b: HousePoint) {
  return b.levels - a.levels
}

/**
 * Limpia la respuesta del proveedor:
 *
 * 1. Descarta las coordenadas inválidas.
 * 2. Descarta lo que cae fuera de la zona consultada (el proveedor puede
 *    devolver edificaciones del otro lado de la calle o del municipio).
 * 3. Quita los duplicados: el mismo edificio puede venir repetido.
 */
export function cleanHouses(
  houses: HousePoint[],
  center: { lat: number; lng: number },
  radiusMeters = ZONE_RADIUS,
): HousePoint[] {
  const valid = houses.filter((house) => isValidCoordinate(house.lat, house.lng))
  const inside = pointsWithinRadius(valid, center, radiusMeters)
  const unique = dedupeByDistance(inside, 12)
  return unique.sort(byLevels)
}

/** Espejos de Overpass: se prueban en orden hasta que uno responda. */
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

/** Tiempo máximo por consulta, en milisegundos. */
const REQUEST_TIMEOUT = 12_000

/**
 * Descarga el recuadro desde la **API oficial de OSM** (no Overpass).
 *
 * Para un área pequeña devuelve el XML del tramo, que es mucho más rápido
 * que una consulta Overpass (no hay cola de espera) y no se cae con Areas
 * densas.
 */
async function fetchFromOsmApi(
  communityId: string,
  lat: number,
  lng: number,
): Promise<HousePoint[]> {
  const delta = radiusToDegrees(ZONE_RADIUS)
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',')
  const response = await fetch(
    `https://api.openstreetmap.org/api/0.6/map?bbox=${bbox}`,
    { headers: { Accept: 'application/xml' } },
  )
  if (!response.ok) throw new Error(`OSM respondió ${response.status}`)

  const xml = await response.text()
  return parseOsmBuildings(xml, communityId)
}

/**
 * Lee los atributos de una etiqueta XML (`<tag k="building" v="yes"/>`).
 */
function readAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  const pattern = /([\w:.-]+)="([^"]*)"/g
  let match = pattern.exec(tag)
  while (match) {
    attributes[match[1]] = match[2]
    match = pattern.exec(tag)
  }
  return attributes
}

/**
 * Extrae las construcciones de un fragmento XML de OpenStreetMap.
 *
 * Es una función ** pura**: no usa el DOM ni la red, así que se puede
 * comprobar con pruebas automáticas. Recibe el XML y devuelve sólo las
 * edificaciones con coordenadas válidas.
 */
export function parseOsmBuildings(xml: string, communityId: string): HousePoint[] {
  // Coordenadas de los nodos
  const nodes = new Map<string, [number, number]>()
  const nodePattern = /<node\b([^>]*)>/g
  let nodeMatch = nodePattern.exec(xml)
  while (nodeMatch) {
    const attributes = readAttributes(nodeMatch[1])
    const lat = Number(attributes.lat)
    const lng = Number(attributes.lon)
    if (attributes.id && isValidCoordinate(lat, lng)) {
      nodes.set(attributes.id, [lat, lng])
    }
    nodeMatch = nodePattern.exec(xml)
  }

  const houses: HousePoint[] = []
  const wayPattern = /<way\b([^>]*)>([\s\S]*?)<\/way>/g
  let wayMatch = wayPattern.exec(xml)
  while (wayMatch) {
    const wayAttributes = readAttributes(wayMatch[1])
    const body = wayMatch[2]

    // Etiquetas del trazado
    const tags: Record<string, string> = {}
    const tagPattern = /<tag\b([^>]*)\/>/g
    let tagMatch = tagPattern.exec(body)
    while (tagMatch) {
      const attributes = readAttributes(tagMatch[1])
      if (attributes.k) tags[attributes.k] = attributes.v ?? ''
      tagMatch = tagPattern.exec(body)
    }

    if (tags.building && tags.building !== 'no') {
      // Centro de la polilínea
      const points: [number, number][] = []
      const referencePattern = /<nd\b[^>]*\bref="(\d+)"[^>]*\/?>/g
      let referenceMatch = referencePattern.exec(body)
      while (referenceMatch) {
        const point = nodes.get(referenceMatch[1])
        if (point) points.push(point)
        referenceMatch = referencePattern.exec(body)
      }

      if (points.length > 0) {
        const center = points.reduce(
          (acc, point) => [
            acc[0] + point[0] / points.length,
            acc[1] + point[1] / points.length,
          ],
          [0, 0] as [number, number],
        )

        if (isValidCoordinate(center[0], center[1])) {
          const levels = Number(tags['building:levels'] ?? 0)
          houses.push({
            id: `${communityId}-${wayAttributes.id ?? houses.length}`,
            lat: center[0],
            lng: center[1],
            levels: Number.isFinite(levels) && levels > 0 ? Math.min(levels, 8) : 1,
            kind: tags.building,
          })
        }
      }
    }

    wayMatch = wayPattern.exec(xml)
  }

  return houses.sort(byLevels)
}

/** Consulta Overpass las construcciones de la zona (respaldo). */
async function fetchFromOverpass(
  communityId: string,
  lat: number,
  lng: number,
): Promise<HousePoint[]> {
  const delta = radiusToDegrees(ZONE_RADIUS)
  const bbox = [lat - delta, lng - delta, lat + delta, lng + delta].join(',')
  // El límite evita respuestas enormes en zonas densas.
  const query = `[out:json][timeout:15];way["building"](${bbox});out center tags 150;`

  let lastError: unknown = null

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const response = await fetch(`${mirror}?data=${encodeURIComponent(query)}`, {
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) {
        lastError = new Error(`Overpass respondió ${response.status}`)
        continue
      }

      const payload = (await response.json()) as {
        elements?: {
          id: number
          center?: { lat: number; lon: number }
          tags?: Record<string, string>
        }[]
      }

      const houses: HousePoint[] = []
      for (const element of payload.elements ?? []) {
        const center = element.center
        if (!center) continue
        const levels = Number(element.tags?.['building:levels'] ?? 0)
        houses.push({
          id: `${communityId}-${element.id}`,
          lat: center.lat,
          lng: center.lon,
          levels: Number.isFinite(levels) && levels > 0 ? Math.min(levels, 8) : 1,
          kind: element.tags?.building ?? 'yes',
        })
      }
      if (houses.length) return houses.sort(byLevels)
      lastError = new Error('Overpass no devolvió construcciones')
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Overpass no respondió')
}

/** Consulta las construcciones reales, probando las fuentes disponibles. */
async function fetchRealHouses(
  communityId: string,
  lat: number,
  lng: number,
): Promise<HousePoint[]> {
  const sources = [fetchFromOsmApi, fetchFromOverpass]
  let lastError: unknown = null

  for (const source of sources) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
    try {
      const houses = await source(communityId, lat, lng)
      if (houses.length) return houses
      lastError = new Error('La fuente no devolvió construcciones')
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('No se pudieron consultar las casas')
}

/**
 * Distribución de respaldo: puntos deterministas alrededor del centro del
 * barrio, con forma de manzana.
 */
function fallbackHouses(communityId: string, lat: number, lng: number, count: number): HousePoint[] {
  const houses: HousePoint[] = []
  const rings = 3
  for (let ring = 0; ring < rings; ring += 1) {
    const perRing = 6 + ring * 2
    const radius = (0.16 + ring * 0.13) * radiusToDegrees(ZONE_RADIUS)
    for (let index = 0; index < perRing; index += 1) {
      const angle = (index / perRing) * Math.PI * 2 + ring * 0.4
      houses.push({
        id: `${communityId}-sim-${ring}-${index}`,
        lat: lat + Math.sin(angle) * radius,
        lng: lng + Math.cos(angle) * radius,
        levels: 1 + ((index + ring) % 3),
        kind: 'yes',
      })
    }
    if (houses.length >= count + 8) break
  }
  return houses
}

/**
 * Devuelve las construcciones **reales** de la zona de una comunidad.
 *
 * Se consulta en segundo plano y se cachea (memoria y `sessionStorage`), de
 * modo que volver al barrio no vuelve a preguntar. Si el servicio no
 * responde, se resuelve con la distribución de respaldo.
 */
export function getHouses(
  communityId: string,
  lat: number,
  lng: number,
  count = 8,
): Promise<HousePoint[]> {
  const cached = cache.get(communityId)
  if (cached) return Promise.resolve(cached)
  const stored = restore(communityId)
  if (stored) {
    cache.set(communityId, stored)
    return Promise.resolve(stored)
  }
  const inFlight = pending.get(communityId)
  if (inFlight) return inFlight

  const request = fetchRealHouses(communityId, lat, lng)
    .then((houses) => {
      const clean = cleanHouses(houses, { lat, lng })
      const result = clean.length ? clean : fallbackHouses(communityId, lat, lng, count)
      cache.set(communityId, result)
      persist(communityId, result)
      pending.delete(communityId)
      return result
    })
    .catch(() => {
      const result = fallbackHouses(communityId, lat, lng, count)
      cache.set(communityId, result)
      pending.delete(communityId)
      return result
    })

  pending.set(communityId, request)
  return request
}

/**
 * Las casas **reales** de la zona, o `null` si todavía no se han podido
 * consultar. Se usa para colocar los marcadores de inmediato y ajustarlos
 * después a las posiciones reales.
 */
export function subscribeRealHouses(
  communityId: string,
  lat: number,
  lng: number,
  count: number,
  onReal: (houses: HousePoint[]) => void,
): () => void {
  const cached = cache.get(communityId) ?? restore(communityId)
  if (cached) {
    // puede ser el respaldo ya guardado: se distingue por el sufijo
    if (!cached.some((house) => house.id.includes('-sim-'))) {
      onReal(cached)
      return () => {}
    }
  }

  let alive = true
  getHouses(communityId, lat, lng, count).then((houses) => {
    if (!alive) return
    if (houses.some((house) => house.id.includes('-sim-'))) return
    onReal(houses)
  })
  return () => {
    alive = false
  }
}

/** Distribución de respaldo inmediata (sin esperar la consulta). */
export function approximateHouses(
  communityId: string,
  lat: number,
  lng: number,
  count = 8,
): HousePoint[] {
  return fallbackHouses(communityId, lat, lng, count)
}

/** Vacía la cache (útil para probar). */
export function clearHousesCache() {
  cache.clear()
  pending.clear()
}
