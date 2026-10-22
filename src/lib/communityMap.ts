import type { HousePoint } from '../data/houses.ts'
import type { Community } from '../data/networks.ts'
import {
  dedupeByDistance,
  distanceMeters,
  isValidCoordinate,
  pointsWithinRadius,
  type GeoPoint,
} from './geo.ts'

/**
 * Lógica pura del mapa geográfico de COMUNIDAD.
 *
 * El mapa reutiliza los comercios que ya existen en cada comunidad y los
 * reparte entre construcciones del barrio. La selección de construcciones es
 * determinista y busca que los modelos queden separados por toda la zona, en
 * lugar de amontonarse en las primeras filas de la lista.
 *
 * Aquí no hay Leaflet, React ni red: sólo datos y geometría, para poder
 * comprobar el filtrado, la deduplicación y la distribución con pruebas.
 */

/** De dónde salen las coordenadas de anclaje. */
export type ShopAnchorSource = 'openstreetmap' | 'aproximado'

/** Cobertura de la selección de comercios de una comunidad. */
export type ShopCoverage = 'completa' | 'parcial' | 'sin-datos'

/** Comercio ya colocado en el mapa. */
export type CommunityShop = {
  /** Identificador estable dentro de la comunidad. */
  id: string
  /** Identificador del registro original de la comunidad. */
  businessId: string
  name: string
  business: string
  label: string
  lat: number
  lng: number
  /** Construcción que sirve de anclaje. */
  anchorId: string
  /** Calidad de la ubicación: real o aproximada. */
  source: ShopAnchorSource
  /** Texto que se muestra en la tarjeta informativa. */
  locationLabel: string
}

/** Resultado de preparar los comercios de una comunidad. */
export type CommunityShopSelection = {
  shops: CommunityShop[]
  /** Comercios que existen en la comunidad y podrían mostrarse. */
  totalBusinesses: number
  /** Cobertura sobre el mínimo de cinco comercios. */
  coverage: ShopCoverage
  /** Comercios que no pudieron anclarse a una coordenada válida. */
  missing: number
}

/** Opciones de selección. */
export type CommunityShopOptions = {
  /** Máximo de comercios, acotado siempre entre 5 y 10 por la vista. */
  maxShops?: number
  /** Radio máximo alrededor del centro del barrio. */
  radiusMeters?: number
  /** Separación mínima entre dos modelos. */
  minSeparationMeters?: number
}

const DEFAULT_RADIUS = 260
const DEFAULT_SEPARATION = 18

/** Etiqueta honesta sobre el origen de la posición. */
function locationLabel(source: ShopAnchorSource): string {
  return source === 'openstreetmap'
    ? 'Construcción de OpenStreetMap · ubicación aproximada'
    : 'Ubicación aproximada de demostración'
}

/**
 * Deduplica por identificador y por distancia.
 *
 * El proveedor puede devolver dos geometrías del mismo edificio. Se conserva
 * la primera y se descartan las que caen prácticamente en el mismo punto.
 */
function cleanAnchors(
  houses: HousePoint[],
  center: GeoPoint,
  radiusMeters: number,
): HousePoint[] {
  const valid = houses.filter(
    (house) =>
      isValidCoordinate(house.lat, house.lng) &&
      typeof house.id === 'string' &&
      house.id.length > 0,
  )

  const within = pointsWithinRadius(valid, center, radiusMeters)
  const byId = new Map<string, HousePoint>()
  for (const house of within) {
    if (!byId.has(house.id)) byId.set(house.id, house)
  }

  // Orden estable: el resultado no depende del orden en que llegue la red.
  return dedupeByDistance(
    [...byId.values()].sort((a, b) => a.id.localeCompare(b.id)),
    10,
  )
}

/**
 * Elige construcciones separadas por toda la comunidad.
 *
 * Estrategia:
 *
 * 1. Se empieza por la construcción válida más cercana al centro.
 * 2. Cada siguiente se elige por **distancia al grupo ya elegido**, con una
 *    penalización suave por alejarse demasiado del centro. Así se cubren
 *    varias zonas sin llevar los modelos a construcciones del borde.
 * 3. Los empates se resuelven por identificador, de modo que la selección es
 *    idéntica en cada renderizado.
 */
export function selectDistributedAnchors(
  houses: HousePoint[],
  center: GeoPoint,
  count: number,
  options: Pick<CommunityShopOptions, 'radiusMeters' | 'minSeparationMeters'> = {},
): HousePoint[] {
  const limit = Math.max(0, Math.floor(count))
  if (limit === 0 || !isValidCoordinate(center.lat, center.lng)) return []

  const radius = options.radiusMeters ?? DEFAULT_RADIUS
  const minSeparation = options.minSeparationMeters ?? DEFAULT_SEPARATION
  const candidates = cleanAnchors(houses, center, radius)
  if (candidates.length === 0) return []

  const first = [...candidates].sort((a, b) => {
    const distance = distanceMeters(a, center) - distanceMeters(b, center)
    return distance !== 0 ? distance : a.id.localeCompare(b.id)
  })[0]

  const chosen: HousePoint[] = [first]
  const chosenIds = new Set([first.id])

  while (chosen.length < Math.min(limit, candidates.length)) {
    const remaining = candidates.filter((house) => !chosenIds.has(house.id))
    if (remaining.length === 0) break

    // Primero se intenta respetar la separación; si ya no quedan puntos
    // separados, se completan los disponibles sin inventar coordenadas.
    const separated = remaining.filter((house) =>
      chosen.every(
        (selected) => distanceMeters(house, selected) >= minSeparation,
      ),
    )
    const pool = separated.length > 0 ? separated : remaining

    let best = pool[0]
    let bestScore = -Infinity

    for (const candidate of pool) {
      const nearest = chosen.reduce(
        (minimum, selected) => Math.min(minimum, distanceMeters(candidate, selected)),
        Infinity,
      )
      const fromCenter = distanceMeters(candidate, center)
      // La separación manda; el centro sólo evita escoger un extremo aislado.
      const score = nearest - fromCenter * 0.12

      if (
        score > bestScore + 0.001 ||
        (Math.abs(score - bestScore) <= 0.001 && candidate.id < best.id)
      ) {
        best = candidate
        bestScore = score
      }
    }

    chosen.push(best)
    chosenIds.add(best.id)
  }

  return chosen
}

/**
 * Convierte los comercios precargados de una comunidad en comercios situados
 * sobre construcciones válidas.
 *
 * No crea registros de comercio ni nombres nuevos: usa exactamente
 * `community.businesses`, que es la fuente que ya alimenta la escena
 * isométrica. Si no hay suficientes construcciones válidas, devuelve sólo las
 * que existen y marca la cobertura como parcial.
 */
export function buildCommunityShops(
  community: Pick<Community, 'id' | 'name' | 'lat' | 'lng' | 'businesses'>,
  houses: HousePoint[],
  source: ShopAnchorSource,
  options: CommunityShopOptions = {},
): CommunityShopSelection {
  const maxShops = Math.max(0, Math.min(options.maxShops ?? 10, 10))
  const businesses = community.businesses.slice(0, maxShops)

  if (businesses.length === 0) {
    return { shops: [], totalBusinesses: 0, coverage: 'sin-datos', missing: 0 }
  }

  const anchors = selectDistributedAnchors(
    houses,
    { lat: community.lat, lng: community.lng },
    businesses.length,
    options,
  )

  const shops = anchors.map((anchor, index) => {
    const business = businesses[index]
    return {
      id: `${community.id}:${business.id}`,
      businessId: business.id,
      name: business.name,
      business: business.business,
      label: business.label,
      lat: anchor.lat,
      lng: anchor.lng,
      anchorId: anchor.id,
      source,
      locationLabel: locationLabel(source),
    }
  })

  const minimum = Math.min(5, businesses.length)
  const coverage: ShopCoverage =
    shops.length === 0
      ? 'sin-datos'
      : shops.length >= minimum
        ? 'completa'
        : 'parcial'

  return {
    shops,
    totalBusinesses: businesses.length,
    coverage,
    missing: businesses.length - shops.length,
  }
}

/* ------------------------------------------------------------------ */
/* Tarjeta informativa                                                 */
/* ------------------------------------------------------------------ */

/** Colocación de la tarjeta respecto al marcador. */
export type ShopCardPlacement = {
  left: number
  top: number
  /** Posición horizontal de la flecha, relativa a la tarjeta. */
  arrowX: number
  side: 'above' | 'below'
}

export type ShopCardPlacementOptions = {
  anchorX: number
  anchorY: number
  viewportWidth: number
  viewportHeight: number
  cardWidth: number
  cardHeight: number
  margin?: number
  gap?: number
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum))
}

/**
 * Calcula dónde poner la tarjeta para que no se salga del mapa.
 *
 * Prefiere la parte superior del marcador; si no hay espacio, la pone debajo.
 * En pantallas estrechas la tarjeta se centra y se mantiene dentro del ancho,
 * pero la flecha sigue apuntando al modelo.
 */
export function placeShopCard({
  anchorX,
  anchorY,
  viewportWidth,
  viewportHeight,
  cardWidth,
  cardHeight,
  margin = 12,
  gap = 16,
}: ShopCardPlacementOptions): ShopCardPlacement {
  const width = Math.min(cardWidth, Math.max(160, viewportWidth - margin * 2))
  const half = width / 2
  const left = clamp(
    anchorX,
    margin + half,
    viewportWidth - margin - half,
  )
  const arrowX = clamp(anchorX - (left - half), 18, width - 18)

  const roomAbove = anchorY - gap - cardHeight >= margin
  const roomBelow = anchorY + gap + cardHeight <= viewportHeight - margin
  const side: ShopCardPlacement['side'] =
    roomAbove || !roomBelow
      ? anchorY > viewportHeight / 2
        ? 'above'
        : 'below'
      : 'below'

  const desiredTop =
    side === 'above' ? anchorY - gap - cardHeight : anchorY + gap
  const top = clamp(
    desiredTop,
    margin,
    viewportHeight - margin - cardHeight,
  )

  return { left, top, arrowX, side }
}
