import type { ShopStyle } from './palette'
import { iso } from './palette'

/**
 * Distribución de la escena isométrica.
 *
 * Sistema de coordenadas: X hacia el este, Z hacia el sur, Y hacia arriba.
 * Con la cámara isométrica (azimut 45°, elevación 35,26°) la posición en
 * pantalla es:
 *   screenX = 0.707 * (x - z)
 *   screenY = 0.408 * (x + z) - 0.816 * y
 * Por eso los valores de abajo ya están "cocinados" para que cada tienda
 * caiga en el lugar de la ilustración de referencia.
 */

export type ShopSpec = {
  id: string
  label: string
  position: [number, number, number]
  style: ShopStyle
  /** Color del tejado / elemento protagonista. */
  color: string
  /** Color suave (cornisa, acentos claros). */
  soft: string
  /** Color profundo (rótulo, zócalo, sombras). */
  deep: string
  /** Color de los muros principales. */
  wall: string
  /** Color de las franjas de la marquesina: [clara, color]. */
  awning: [string, string]
  /** Color de la placa del rótulo (cada edificio usa uno distinto). */
  signPlate: string
  /** Tinte de la losa donde se apoya. */
  platform: string
  satisfaction: number
  /** ¿El bloque superior se retranquea respecto a la planta baja? */
  twoLevels?: boolean
  /** Variante de fachada (escaparate abierto o cerrado). */
  open?: boolean
}

/**
 * Rotación con la que un plano mira de frente a la cámara isométrica
 * (misma orientación que la cámara: texto vertical y sin deformar).
 */
export const CAMERA_FACING: [number, number, number] = [-Math.PI / 4, 0.61548, Math.PI / 6]

/** Las cinco tiendas + el mercado, colocados según la referencia. */
export const SHOPS: ShopSpec[] = [
  {
    id: 'moda',
    label: 'TIENDA DE MODA',
    position: [-9.2, 0, 3.25],
    style: 'fashion',
    color: iso.pinkDeep,
    soft: iso.pinkLight,
    deep: iso.pinkDeep,
    wall: iso.pink,
    awning: [iso.white, iso.pink],
    signPlate: iso.pinkDeep,
    platform: iso.platform,
    satisfaction: 90,
    twoLevels: true,
  },
  {
    id: 'electronica-naranja',
    label: 'ELECTRÓNICA INNOVADORA',
    position: [-8.8, 0, -2.55],
    style: 'tech',
    color: iso.orange,
    soft: iso.orangeLight,
    deep: iso.orangeDeep,
    wall: '#fff1d8',
    awning: [iso.white, iso.orange],
    signPlate: iso.orangeDeep,
    platform: iso.platform,
    satisfaction: 96,
  },
  {
    id: 'servicios',
    label: 'SERVICIOS PROFESIONALES',
    position: [-4.2, 0, -10.5],
    style: 'services',
    color: iso.purpleDeep,
    soft: iso.purpleLight,
    deep: iso.purpleDeep,
    wall: iso.purple,
    awning: [iso.white, iso.purple],
    signPlate: iso.purpleDeep,
    platform: iso.platform,
    satisfaction: 96,
    twoLevels: true,
  },
  {
    id: 'gourmet',
    label: 'MERCADO GOURMET',
    position: [-4.3, 0, 7.35],
    style: 'grocery',
    color: iso.tealDeep,
    soft: iso.tealLight,
    deep: iso.tealDeep,
    wall: iso.teal,
    awning: [iso.white, '#ff9c7a'],
    signPlate: iso.tealDeep,
    platform: iso.platform,
    satisfaction: 90,
  },
  {
    id: 'electronica-amarilla',
    label: 'ELECTRÓNICA INNOVADORA',
    position: [5.8, 0, -1.4],
    style: 'tech',
    color: iso.yellowDeep,
    soft: iso.yellowLight,
    deep: iso.yellowDeep,
    wall: iso.yellow,
    awning: [iso.white, '#f7e3a8'],
    signPlate: '#2f3550',
    platform: '#f2e6e2',
    satisfaction: 96,
  },
]

/** Núcleo de seguridad: centro de la red. */
export const CORE_POSITION: [number, number, number] = [0, 0, 0]

/** Pedestal elevado con la pantalla (parte superior del encuadre). */
export const PEDESTAL_POSITION: [number, number, number] = [-7.4, 0, -6.6]

/**
 * Caminos de neón que conectan cada tienda con el núcleo.
 * Cada ruta arranca en la plataforma del comercio y termina en el borde
 * del pedestal central, con un par de codos para el aire "cableado".
 */
export const PIPE_ROUTES: {
  id: string
  /** Color del tubo interior (cálido) y del revestimiento (frío). */
  inner: string
  shell: string
  /** Grosor relativo del conducto. */
  weight?: number
  points: [number, number, number][]
}[] = [
  {
    id: 'moda',
    inner: iso.neonOrange,
    shell: iso.neonCyan,
    weight: 1.15,
    points: [
      [-7.4, 0.18, 4.5],
      [-5.9, 0.18, 5.0],
      [-5.0, 0.18, 4.0],
      [-3.9, 0.18, 3.8],
      [-3.0, 0.18, 2.5],
      [-2.2, 0.18, 1.9],
      [-2.0, 0.18, 1.3],
    ],
  },
  {
    id: 'electronica-naranja',
    inner: iso.neonOrange,
    shell: iso.neonCyan,
    weight: 1.15,
    points: [
      [-6.9, 0.18, -1.4],
      [-5.6, 0.18, -0.7],
      [-4.9, 0.18, -1.2],
      [-3.9, 0.18, -0.3],
      [-3.1, 0.18, 0.5],
      [-2.1, 0.18, 0.9],
    ],
  },
  {
    id: 'servicios',
    inner: iso.neonPurple,
    shell: iso.neonCyan,
    points: [
      [-2.4, 0.18, -8.9],
      [-1.3, 0.18, -8.0],
      [-1.9, 0.18, -6.9],
      [-0.8, 0.18, -6.2],
      [-1.4, 0.18, -5.1],
      [-0.7, 0.18, -4.2],
      [-0.2, 0.18, -3.4],
      [0.6, 0.18, -2.6],
    ],
  },
  {
    id: 'gourmet',
    inner: iso.neonOrange,
    shell: iso.neonCyan,
    weight: 1.15,
    points: [
      [-5.6, 0.18, 6.3],
      [-6.5, 0.18, 5.4],
      [-5.8, 0.18, 4.3],
      [-6.4, 0.18, 3.4],
      [-5.2, 0.18, 2.5],
      [-4.3, 0.18, 1.6],
      [-3.1, 0.18, 0.9],
      [-2.1, 0.18, 0.6],
    ],
  },
  {
    id: 'electronica-amarilla',
    inner: iso.neonCyan,
    shell: iso.neonCyan,
    weight: 0.78,
    points: [
      [3.9, 0.18, -1.6],
      [3.2, 0.18, -2.6],
      [3.8, 0.18, -3.7],
      [2.9, 0.18, -4.4],
      [2.4, 0.18, -3.4],
      [2.2, 0.18, -2.2],
      [2.0, 0.18, -1.1],
    ],
  },
  {
    id: 'enlace-frontal',
    inner: iso.neonCyan,
    shell: iso.neonCyan,
    weight: 0.78,
    points: [
      [0.9, 0.18, 1.7],
      [1.8, 0.18, 2.6],
      [1.2, 0.18, 3.8],
      [2.1, 0.18, 4.8],
      [3.1, 0.18, 5.6],
    ],
  },
]

/** Nubes flotantes: cada una con su posición, escala y "semilla" de forma. */
export const CLOUDS: {
  position: [number, number, number]
  scale: number
  seed: number
}[] = [
  { position: [-15.5, 3.6, 2.0], scale: 1.6, seed: 3 },
  { position: [-6.0, 8.2, -17.0], scale: 1.8, seed: 7 },
  { position: [11.0, 6.4, -14.0], scale: 1.6, seed: 11 },
  { position: [-12.0, 4.8, 13.0], scale: 1.5, seed: 17 },
  { position: [15.5, 4.2, 14.5], scale: 1.6, seed: 23 },
  { position: [18.5, 8.0, 6.5], scale: 1.3, seed: 29 },
  { position: [-9.0, 10.0, 11.0], scale: 1.2, seed: 31 },
  { position: [3.0, 11.0, -15.0], scale: 1.4, seed: 37 },
  { position: [-18.0, 9.0, -6.0], scale: 1.3, seed: 41 },
]
