/**
 * Paleta de la escena isométrica "Red Segura de Comercios".
 * Tonos pastel: azul cielo, rosas, naranjas, amarillos, púrpuras y verdes.
 */
import { Color } from 'three'

export const iso = {
  /* Cielo y fondo */
  skyTop: '#8ab4ee',
  skyMid: '#b0cdf3',
  skyLow: '#d6e3f8',
  skyBottom: '#eaeffb',

  /* Suelo */
  tile: '#d3e1fb',
  tileAlt: '#b3cdf6',
  tileLine: '#7ba4e8',
  tileShadow: '#b3cdf6',
  platform: '#d9e2fb',
  platformEdge: '#b3c4ee',
  dais: '#e2e7fd',
  daisEdge: '#b9c8f2',

  /* Edificios */
  cream: '#fff6ec',
  creamShade: '#f0e0d2',
  glass: '#8fd8ff',
  glassDeep: '#4fb8f2',

  /* Rosa - Tienda de moda */
  pink: '#ff9dc0',
  pinkLight: '#ffc4d8',
  pinkDeep: '#e0648f',

  /* Naranja - Electrónica */
  orange: '#ffae52',
  orangeLight: '#ffd49a',
  orangeDeep: '#e07f24',

  /* Amarillo - Electrónica */
  yellow: '#ffd75a',
  yellowLight: '#ffeeb0',
  yellowDeep: '#e0ab1c',

  /* Turquesa - Mercado gourmet */
  teal: '#38d2c8',
  tealLight: '#a4f0e9',
  tealDeep: '#17a8a2',

  /* Púrpura - Servicios profesionales */
  purple: '#b18cff',
  purpleLight: '#dcc9ff',
  purpleDeep: '#7d55e0',

  /* Melocotón */
  peach: '#ffb3a0',
  peachLight: '#ffd8cf',
  peachDeep: '#e8846b',

  /* Azul cielo */
  sky: '#8fd6ff',
  skyLight: '#c9ecff',
  skyDeep: '#3f9fe0',

  /* Lila */
  lilac: '#cbb2ff',
  lilacLight: '#e6dbff',
  lilacDeep: '#9677e8',

  /* Coral */
  coral: '#ff9f8f',
  coralLight: '#ffc9bf',
  coralDeep: '#e8705c',

  /* Menta */
  mint: '#7fe0b8',
  mintLight: '#b6f0d8',
  mintDeep: '#43b98c',

  /* Limón */
  lemon: '#ffe98a',
  lemonLight: '#fff5c2',
  lemonDeep: '#e0bb45',

  /* Neón */
  neonCyan: '#5fe4ff',
  neonCyanDeep: '#2cbde4',
  neonOrange: '#ff9a45',
  neonOrangeDeep: '#f0601f',
  neonPurple: '#c07dff',

  /* Núcleo de seguridad */
  coreGlass: '#d6f0ff',
  coreGlow: '#ff5fce',
  coreCyan: '#7ef0ff',
  magenta: '#ff5fd2',

  /* Semáforos */
  green: '#35e3a0',
  greenDeep: '#12a06a',

  /* Vegetación */
  leafLight: '#8ce0b4',
  leafMid: '#4fbb8c',
  leafDark: '#2d8a63',
  leafMint: '#6fd4bd',

  /* Nubes */
  cloud: '#ffffff',
  cloudShade: '#d6e6fb',

  /* Texto */
  ink: '#243b6b',
  inkSoft: '#5a76a8',
  white: '#ffffff',
} as const

/**
 * Tipos de edificio: cada negocio de la red tiene su propia arquitectura.
 * La lista crece con cada nuevo tipo de comercio.
 */
export type ShopStyle =
  | 'fashion'
  | 'tech'
  | 'services'
  | 'grocery'
  | 'bakery'
  | 'pharmacy'
  | 'cafe'
  | 'florist'
  | 'bookstore'
  | 'petshop'
  | 'optics'
  | 'stationery'

/**
 * Color "fuera de rango" (HDR). Al multiplicar los canales por encima de 1
 * el material brilla por encima del blanco y el bloom lo convierte en halo.
 */
export function hot(hex: string, boost = 2) {
  return new Color(hex).multiplyScalar(boost)
}
