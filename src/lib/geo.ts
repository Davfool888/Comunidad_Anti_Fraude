/**
 * Utilidades geográficas puras.
 *
 * Todo lo que decide **dónde** va un comercio vive aquí: validar
 * coordenadas, filtrar por área, quitar duplicados y proyectar un conjunto
 * de puntos geográficos sobre el suelo de la escena 3D conservando la
 * distancia real entre ellos.
 *
 * El módulo no toca el DOM ni la red, así que se puede comprobar con
 * pruebas automáticas (`npm run test:unit`).
 */

/** Punto geográfico. */
export type GeoPoint = {
  lat: number
  lng: number
}

/** Caja que envuelve a un conjunto de puntos. */
export type GeoBounds = {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

/** Metros por grado de latitud (valor medio, suficiente a escala de barrio). */
const METERS_PER_DEGREE_LAT = 111_320

/**
 * Comprueba que unas coordenadas sean utilizables.
 *
 * Descarta los valores no numéricos, los que están fuera del planeta y el
 * punto nulo (0, 0), que es el que aparece cuando el proveedor no manda
 * datos y no se debe tomar como una ubicación real.
 */
export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false
  if (lat === 0 && lng === 0) return false
  return true
}

/** Distancia en metros entre dos puntos (plano, exacto a escala de barrio). */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const lat = ((a.lat + b.lat) / 2) * (Math.PI / 180)
  const dx = (a.lng - b.lng) * METERS_PER_DEGREE_LAT * Math.cos(lat)
  const dy = (a.lat - b.lat) * METERS_PER_DEGREE_LAT
  return Math.hypot(dx, dy)
}

/** Caja que envuelve a un conjunto de puntos (null si no hay ninguno válido). */
export function boundsOf(points: GeoPoint[]): GeoBounds | null {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLng = Infinity
  let maxLng = -Infinity
  let found = false

  for (const point of points) {
    if (!isValidCoordinate(point.lat, point.lng)) continue
    found = true
    minLat = Math.min(minLat, point.lat)
    maxLat = Math.max(maxLat, point.lat)
    minLng = Math.min(minLng, point.lng)
    maxLng = Math.max(maxLng, point.lng)
  }

  return found ? { minLat, maxLat, minLng, maxLng } : null
}

/**
 * Descarta los puntos con coordenadas inválidas y los que caen fuera del
 * radio indicado alrededor del centro.
 */
export function pointsWithinRadius<T extends GeoPoint>(
  points: T[],
  center: GeoPoint,
  radiusMeters: number,
): T[] {
  return points.filter(
    (point) =>
      isValidCoordinate(point.lat, point.lng) &&
      distanceMeters(point, center) <= radiusMeters,
  )
}

/**
 * Elimina los puntos que están demasiado cerca unos de otros.
 *
 * El mismo edificio puede venir repetido (dos ways que comparten el mismo
 * centro, o dos consultas que se solapan): sin esta limpieza los
 * marcadores se amontonarían unos encima de otros.
 */
export function dedupeByDistance<T extends GeoPoint>(points: T[], minMeters: number): T[] {
  const kept: T[] = []
  for (const point of points) {
    if (!isValidCoordinate(point.lat, point.lng)) continue
    const tooClose = kept.some((other) => distanceMeters(point, other) < minMeters)
    if (!tooClose) kept.push(point)
  }
  return kept
}

/** Ordena los puntos por cercanía al centro y devuelve los primeros. */
export function closestTo<T extends GeoPoint>(points: T[], center: GeoPoint, count: number): T[] {
  return [...points]
    .filter((point) => isValidCoordinate(point.lat, point.lng))
    .sort((a, b) => distanceMeters(a, center) - distanceMeters(b, center))
    .slice(0, Math.max(count, 0))
}

/** Punto en el plano de la escena (X a lo ancho, Z al fondo; norte arriba). */
export type PlanePoint = {
  x: number
  z: number
}

/**
 * Proyecta puntos geográficos sobre el plano de la escena 3D.
 *
 * - Conserva la **orientación**: el norte queda hacia el fondo (-Z).
 * - Conserva la **forma**: la escala es la misma en X que en Z, así que dos
 *   edificios que en la realidad están en línea recta siguen estándolo.
 * - La nube de puntos se centra en el origen y se ajusta al tamaño pedido.
 */
export function projectToPlane(
  points: GeoPoint[],
  bounds: GeoBounds,
  size: number,
): PlanePoint[] {
  const valid = points.filter((point) => isValidCoordinate(point.lat, point.lng))
  if (valid.length === 0) return []

  const centerLat = (bounds.minLat + bounds.maxLat) / 2
  const metersPerLng = METERS_PER_DEGREE_LAT * Math.cos(centerLat * (Math.PI / 180))

  // Desplazamiento de cada punto respecto al centro de la caja, en metros.
  const offsets = valid.map((point) => ({
    east: (point.lng - (bounds.minLng + bounds.maxLng) / 2) * metersPerLng,
    north: (point.lat - centerLat) * METERS_PER_DEGREE_LAT,
  }))

  const spanEast = Math.max(bounds.maxLng - bounds.minLng, 0) * metersPerLng
  const spanNorth = Math.max(bounds.maxLat - bounds.minLat, 0) * METERS_PER_DEGREE_LAT
  const span = Math.max(spanEast, spanNorth, 1)

  // Escala para que el conjunto quepa en el ancho pedido.
  const scale = size / span

  return offsets.map((offset) => ({
    // el norte (eje Y geográfico) va hacia el fondo de la escena
    x: offset.east * scale,
    z: -offset.north * scale,
  }))
}

/**
 * Separa puntos que se solapan en el plano.
 *
 * Los edificios miden unos 5,4 unidades de lado, así que dos puntos más
 * cerca que eso se verían encimados. Se aparta cada punto del centro del
 * grupo, sin perder la orientación general, y en unas pocas pasadas.
 */
export function separateOverlaps(
  points: PlanePoint[],
  minDistance: number,
  passes = 12,
): PlanePoint[] {
  const result = points.map((point) => ({ ...point }))
  if (result.length < 2) return result

  for (let pass = 0; pass < passes; pass += 1) {
    let moved = false
    for (let i = 0; i < result.length; i += 1) {
      for (let j = i + 1; j < result.length; j += 1) {
        const dx = result[j].x - result[i].x
        const dz = result[j].z - result[i].z
        const distance = Math.hypot(dx, dz)
        if (distance >= minDistance) continue

        // Si están en el mismo punto, se separan con un desplazamiento fijo
        // (determinista) para que no queden encimados.
        const push = distance === 0 ? minDistance / 2 : (minDistance - distance) / 2
        const angle = distance === 0 ? (i * 2.399) : Math.atan2(dz, dx)
        const offsetX = Math.cos(angle) * push
        const offsetZ = Math.sin(angle) * push

        result[i] = { x: result[i].x - offsetX, z: result[i].z - offsetZ }
        result[j] = { x: result[j].x + offsetX, z: result[j].z + offsetZ }
        moved = true
      }
    }
    if (!moved) break
  }

  return result
}

/**
 * Aparta del centro los puntos que caen dentro del núcleo de seguridad,
 * para que ningún edificio quede debajo de la cúpula.
 *
 * Un punto prácticamente en el centro no tiene dirección propia: se reparte
 * en un ángulo fijo (determinista) para que no coincida con ningún otro.
 */
export function avoidCore(points: PlanePoint[], coreRadius: number): PlanePoint[] {
  return points.map((point, index) => {
    const distance = Math.hypot(point.x, point.z)
    if (distance >= coreRadius) return point
    if (distance < 0.01) {
      const angle = index * 2.399963
      return { x: Math.cos(angle) * coreRadius, z: Math.sin(angle) * coreRadius }
    }
    const factor = coreRadius / distance
    return { x: point.x * factor, z: point.z * factor }
  })
}
