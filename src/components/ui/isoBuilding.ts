import type { ShopStyle } from '../three/network/palette'

/**
 * Edificio isométrico en SVG: la versión plana de los modelos 3D, con la
 * misma silueta y la misma paleta, para que las casas del mapa se reconozcan
 * como los comercios de la red.
 *
 * El markup se genera como cadena porque el `divIcon` de Leaflet necesita
 * HTML. El SVG no lleva texto: todo el texto es HTML, traducible y
 * seleccionable.
 */

/** Colores de un edificio. */
export type IsoColors = {
  /** Color del tejado. */
  color: string
  /** Color claro de la corona. */
  soft: string
  /** Color profundo (zócalo y acentos). */
  deep: string
  /** Color de los muros. */
  wall: string
  /** Franjas de la marquesina. */
  awning: [string, string]
}

/** Genera el SVG del edificio isométrico. */
export function isoBuildingSvg(style: ShopStyle, colors: IsoColors): string {
  const { color, soft, deep, wall, awning } = colors

  const A = [30, 12]
  const B = [44, 26]
  const C = [37, 33]
  const D = [23, 19]
  const A0 = [30, 36]
  const B0 = [44, 50]
  const C0 = [37, 57]
  const D0 = [23, 43]

  const hasAwning = style !== 'tech' && style !== 'stationery'

  const parts: string[] = []

  // sombra en el suelo
  parts.push('<ellipse cx="33" cy="57" rx="15" ry="5" fill="#1d2f57" opacity="0.12"/>')

  // losa
  parts.push(
    `<polygon points="${B0[0]},${B0[1]} ${C0[0]},${C0[1]} ${D0[0]},${D0[1]} ${A0[0]},${A0[1]}" fill="${soft}" opacity="0.9"/>`,
  )

  // muro izquierdo (fachada)
  parts.push(
    `<polygon points="${A[0]},${A[1]} ${B[0]},${B[1]} ${B0[0]},${B0[1]} ${A0[0]},${A0[1]}" fill="${wall}"/>`,
  )
  parts.push(
    `<polygon points="${A[0]},${A[1]} ${A[0]},${A[1] + 5} ${A[0] + 2},${A[1] + 4} ${A[0]},${A[1] + 4}" fill="${deep}" opacity="0.25"/>`,
  )

  // muro derecho (costadillo)
  parts.push(
    `<polygon points="${B[0]},${B[1]} ${C[0]},${C[1]} ${C0[0]},${C0[1]} ${B0[0]},${B0[1]}" fill="${color}" opacity="0.92"/>`,
  )

  // zócalo
  parts.push(
    `<polygon points="${A[0]},${A[1] + 3} ${B[0]},${B[1] + 3} ${B0[0]},${B0[1] - 4} ${A0[0]},${A0[1] - 4}" fill="${deep}" opacity="0.55"/>`,
  )

  // marquesina a rayas
  if (hasAwning) {
    parts.push(
      `<polygon points="${B[0]},${B[1] + 2} ${C[0]},${C[1] + 1} ${C[0] + 1},${C[1] - 2} ${B[0] + 1},${B[1] - 1}" fill="${awning[1]}"/>`,
      `<polygon points="${B[0] + 1},${B[1] - 1} ${C[0] - 1},${C[1] - 3} ${C[0] - 3},${C[1] - 6} ${B[0] - 1},${B[1] - 4}" fill="${awning[0]}"/>`,
    )
  }

  // tejado
  parts.push(`<polygon points="${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]} ${D[0]},${D[1]}" fill="${color}"/>`)
  parts.push(
    `<polygon points="${A[0]},${A[1]} ${D[0]},${D[1]} ${D[0] + 3},${D[1] + 2} ${A[0] + 3},${A[1] + 2}" fill="${soft}" opacity="0.85"/>`,
  )

  // detalle característico de cada tipo de comercio
  parts.push(isoDetail(style, colors))

  return `<svg viewBox="0 0 64 66" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`
}

/* ------------------------------------------------------------------ */
/* Detalles por tipo de comercio                                        */
/* ------------------------------------------------------------------ */

function isoDetail(style: ShopStyle, colors: IsoColors): string {
  const { color, soft, deep, wall } = colors

  switch (style) {
    case 'bakery':
      return (
        `<g><path d="M24 21a9 9 0 0 1 18 0Z" fill="${soft}"/>` +
        `<rect x="30" y="4" width="5" height="9" rx="1.5" fill="${deep}"/></g>`
      )
    case 'pharmacy':
      return (
        `<g><rect x="31" y="28" width="3.4" height="11" rx="1" fill="#2fb87c"/>` +
        `<rect x="27.4" y="31.6" width="11" height="3.4" rx="1" fill="#2fb87c"/></g>`
      )
    case 'cafe':
      return (
        `<g><path d="M17 36a9 6 0 0 1 18 0Z" fill="${color}"/>` +
        `<rect x="25" y="36" width="1.6" height="7" fill="${deep}"/></g>`
      )
    case 'florist':
      return (
        `<g><circle cx="29" cy="20" r="2.6" fill="#ff8fb0"/>` +
        `<circle cx="35" cy="23" r="2.2" fill="#ffd75a"/>` +
        `<circle cx="40" cy="19" r="2" fill="#b18cff"/></g>`
      )
    case 'bookstore':
      return (
        `<g><rect x="33" y="30" width="8" height="3" rx="1" fill="${deep}"/>` +
        `<rect x="32" y="33.6" width="7" height="3" rx="1" fill="${color}"/></g>`
      )
    case 'petshop':
      return (
        `<g><path d="M14 38l6-6 6 6Z" fill="${color}"/>` +
        `<rect x="17" y="38" width="6" height="6" rx="1" fill="${wall}"/>` +
        `<circle cx="44" cy="44" r="3" fill="#ffd75a"/></g>`
      )
    case 'optics':
      return (
        `<g stroke="${deep}" stroke-width="1.6" fill="none">` +
        `<circle cx="32" cy="31" r="3.4"/><circle cx="41" cy="34" r="3.4"/>` +
        `<path d="M35.4 32.4 37.6 32.9"/></g>`
      )
    case 'stationery':
      return (
        `<g><rect x="38" y="6" width="4" height="17" rx="1.5" fill="#ffd75a" transform="rotate(12 40 14)"/>` +
        `<path d="M36 23l4-1 1 4Z" fill="${deep}"/></g>`
      )
    case 'tech':
      return (
        `<g><rect x="32" y="2" width="1.8" height="12" rx="0.9" fill="${deep}"/>` +
        `<circle cx="33" cy="2" r="2.4" fill="${color}"/></g>`
      )
    case 'fashion':
      return (
        `<g><circle cx="35" cy="26" r="3" fill="${wall}"/>` +
        `<path d="M31 34h8l1 10h-3l-1-7-1 7h-3Z" fill="${color}"/></g>`
      )
    case 'grocery':
      return (
        `<g><rect x="27" y="32" width="7" height="5" rx="1" fill="${deep}"/>` +
        `<circle cx="29.5" cy="31" r="1.8" fill="#ff8f6b"/>` +
        `<circle cx="32" cy="30.4" r="1.6" fill="#ffd75a"/></g>`
      )
    default:
      return (
        `<g><rect x="30" y="27" width="9" height="6" rx="1.4" fill="${color}"/>` +
        `<rect x="31.5" y="29" width="6" height="1.6" rx="0.8" fill="${soft}"/></g>`
      )
  }
}
