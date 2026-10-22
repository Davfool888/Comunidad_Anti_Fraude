import { avoidCore, boundsOf, projectToPlane, separateOverlaps } from './geo.ts'
import type { HousePoint } from '../data/houses.ts'

/**
 * Colocación geográfica de los edificios de la escena 3D.
 *
 * Traduce las coordenadas reales de las casas del barrio a posiciones sobre
 * el suelo de la escena, conservando la orientación (el norte al fondo) y la
 * distancia relativa entre los edificios.
 *
 * Es un módulo puro: sin DOM, sin red y sin three.js, así que se puede
 * comprobar con pruebas automáticas.
 */

/** Posición sobre el suelo de la escena. */
export type ShopPosition = {
  x: number
  z: number
}

/** Opciones de la colocación. */
export type ShopPositionOptions = {
  /** Ancho (en unidades de escena) que ocupa el conjunto de comercios. */
  span?: number
  /** Distancia mínima entre dos edificios (ancho de la losa + margen). */
  minDistance?: number
  /** Radio libre alrededor del núcleo de seguridad. */
  coreClearance?: number
}

/** Valores por defecto: los de la escena isométrica. */
const DEFAULTS = {
  span: 22,
  minDistance: 6,
  coreClearance: 6,
}

/**
 * Calcula dónde plantar cada edificio a partir de las casas reales.
 *
 * Devuelve `null` cuando no hay datos suficientes: en ese caso la escena
 * usa su distribución por plazas de siempre.
 *
 * Nota: los edificios que caerían bajo la cúpula del núcleo se apartan hasta
 * su borde. Se conserva la dirección (norte, sur, este, oeste) y el orden,
 * pero su distancia al centro cambia en esos casos concretos.
 */
export function geographicShopPositions(
  anchors: HousePoint[] | undefined,
  businessCount: number,
  options: ShopPositionOptions = {},
): ShopPosition[] | null {
  const { span, minDistance, coreClearance } = { ...DEFAULTS, ...options }

  if (!anchors || anchors.length === 0 || businessCount <= 0) return null

  // Cada comercio toma una casa distinta, en el mismo orden que usa el mapa
  // geográfico: las dos vistas muestran los comercios en el mismo sitio.
  const used = anchors.slice(0, businessCount)

  // El encuadre se calcula con las casas que se van a plantar (y no con
  // todas las cercanas): así el grupo de edificios llena el suelo de la
  // escena y coincide con el encuadre del mapa.
  const bounds = boundsOf(used)
  if (!bounds) return null

  const projected = projectToPlane(used, bounds, span)
  if (projected.length === 0) return null

  // Nadie se encima con nadie y nadie queda debajo de la cúpula. Al salir
  // del núcleo dos edificios pueden coincidir, así que se separan otra vez.
  const separated = separateOverlaps(projected, minDistance)
  const fueraDelNucleo = avoidCore(separated, coreClearance)
  return separateOverlaps(fueraDelNucleo, minDistance)
}
