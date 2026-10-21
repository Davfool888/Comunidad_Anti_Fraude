import type { Community } from '../../../data/networks'
import type { ShopSpec } from './layout'
import { iso, type ShopStyle } from './palette'

/**
 * Disposición de los comercios de una comunidad de barrio.
 *
 * Cada barrio **acomoda sus edificios de forma distinta**: otro orden, otras
 * posiciones, otros tipos de negocio y otros colores. Todo se calcula de
 * forma determinista a partir del identificador de la comunidad, así que un
 * barrio siempre se ve igual, pero dos barrios nunca se ven iguales.
 *
 * La geometría de la escena es fija (la cámara y el suelo), lo que cambia es
 * el reparto: qué edificio va en cada plaza, con qué arquitectura y con qué
 * paleta.
 */

/* ------------------------------------------------------------------ */
/* Tipos de negocio → edificio                                        */
/* ------------------------------------------------------------------ */

/** Cada tipo de negocio tiene su propia arquitectura. */
export const STYLE_BY_BUSINESS: Record<string, ShopStyle> = {
  'Loja de Roupas': 'fashion',
  Eletrônicos: 'tech',
  Consultório: 'services',
  Mercado: 'grocery',
  Panadería: 'bakery',
  Farmácia: 'pharmacy',
  Cafetería: 'cafe',
  Floricultura: 'florist',
  Livraria: 'bookstore',
  Petshop: 'petshop',
  Óptica: 'optics',
  Papelaria: 'stationery',
}

/* ------------------------------------------------------------------ */
/* Paletas de los edificios                                           */
/* ------------------------------------------------------------------ */

/** Una "piel" de color para un edificio. */
type Skin = {
  /** Color del tejado y del elemento protagonista. */
  color: string
  /** Color suave (cornisa, acentos claros). */
  soft: string
  /** Color profundo (rótulo, zócalo, sombras). */
  deep: string
  /** Color de los muros principales. */
  wall: string
  /** Franjas de la marquesina: [clara, color]. */
  awning: [string, string]
  /** Color de la placa del rótulo. */
  signPlate: string
  /** Tinte de la losa. */
  platform: string
}

/** Paletas disponibles: cada comunidad reparte las suyas entre sus edificios. */
const SKINS: Skin[] = [
  {
    color: iso.pink,
    soft: iso.pinkLight,
    deep: iso.pinkDeep,
    wall: iso.cream,
    awning: [iso.white, iso.pink],
    signPlate: iso.pinkDeep,
    platform: iso.platform,
  },
  {
    color: iso.orange,
    soft: iso.orangeLight,
    deep: iso.orangeDeep,
    wall: '#fff1d8',
    awning: [iso.white, iso.orange],
    signPlate: iso.orangeDeep,
    platform: iso.platform,
  },
  {
    color: iso.yellow,
    soft: iso.yellowLight,
    deep: iso.yellowDeep,
    wall: iso.cream,
    awning: [iso.white, iso.lemon],
    signPlate: '#2f3550',
    platform: '#f2e6e2',
  },
  {
    color: iso.teal,
    soft: iso.tealLight,
    deep: iso.tealDeep,
    wall: iso.cream,
    awning: [iso.white, '#ff9c7a'],
    signPlate: iso.tealDeep,
    platform: iso.platform,
  },
  {
    color: iso.purple,
    soft: iso.purpleLight,
    deep: iso.purpleDeep,
    wall: iso.cream,
    awning: [iso.white, iso.purple],
    signPlate: iso.purpleDeep,
    platform: iso.platform,
  },
  {
    color: iso.peach,
    soft: iso.peachLight,
    deep: iso.peachDeep,
    wall: iso.cream,
    awning: [iso.white, iso.peach],
    signPlate: iso.peachDeep,
    platform: '#f6e7e2',
  },
  {
    color: iso.sky,
    soft: iso.skyLight,
    deep: iso.skyDeep,
    wall: iso.cream,
    awning: [iso.white, iso.sky],
    signPlate: iso.skyDeep,
    platform: '#e2ecfb',
  },
  {
    color: iso.lilac,
    soft: iso.lilacLight,
    deep: iso.lilacDeep,
    wall: iso.cream,
    awning: [iso.white, iso.lilac],
    signPlate: iso.lilacDeep,
    platform: '#e9e4fb',
  },
  {
    color: iso.coral,
    soft: iso.coralLight,
    deep: iso.coralDeep,
    wall: iso.cream,
    awning: [iso.white, iso.coral],
    signPlate: iso.coralDeep,
    platform: '#f7e6e1',
  },
  {
    color: iso.mint,
    soft: iso.mintLight,
    deep: iso.mintDeep,
    wall: iso.cream,
    awning: [iso.white, iso.mint],
    signPlate: iso.mintDeep,
    platform: '#e0f2ea',
  },
  {
    color: iso.lemon,
    soft: iso.lemonLight,
    deep: iso.lemonDeep,
    wall: iso.cream,
    awning: [iso.white, iso.lemon],
    signPlate: iso.lemonDeep,
    platform: '#f5efd8',
  },
  {
    color: iso.green,
    soft: iso.leafLight,
    deep: iso.greenDeep,
    wall: iso.cream,
    awning: [iso.white, iso.mint],
    signPlate: iso.greenDeep,
    platform: '#dff0e6',
  },
]

/* ------------------------------------------------------------------ */
/* Plazas disponibles                                                  */
/* ------------------------------------------------------------------ */

/**
 * Plazas **independientes**: ninguna se solapa con otra, así que siempre hay
 * sitio para todos los comercios de un barrio.
 */
const PRIMARY_SLOTS: [number, number, number][] = [
  [6, 0, 0],
  [2.3, 0, 5.54],
  [-5.54, 0, 2.3],
  [-3, 0, -5.2],
  [3.16, 0, -7.62],
  [-2.59, 0, 9.66],
  [-10.87, 0, -2.91],
  [10.39, 0, -4.31],
]

/**
 * Plazas de reserva: se usan cuando un barrio tiene más comercios que plazas
 * independientes (o para variar la composición).
 */
const EXTRA_SLOTS: [number, number, number][] = [
  [-9.2, 0, 3.25],
  [-8.8, 0, -2.55],
  [-4.3, 0, 7.35],
  [5.8, 0, -1.4],
  [-4.2, 0, -10.5],
  [2.2, 0, -8.6],
  [-11.5, 0, -6.0],
  [8.8, 0, -6.5],
  [-6.5, 0, -12.5],
  [-10.5, 0, 0.5],
  [-1.5, 0, 10.5],
  [4.4, 0, -12.2],
]

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

/** Generador determinista. */
function seeded(seed: number) {
  let value = seed * 9301 + 49297
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

function hash(text: string) {
  let value = 0
  for (let index = 0; index < text.length; index += 1) {
    value = (value * 31 + text.charCodeAt(index)) % 100003
  }
  return value
}

/** Posición en pantalla (proyección isométrica) de un punto del suelo. */
function screenPosition(x: number, z: number) {
  return { sx: 0.707 * (x - z), sy: 0.408 * (x + z) }
}

/**
 * Tamaño de la losa de un comercio en pantalla: 3,7 unidades de lado se
 * proyectan como 5,2 de ancho y 3 de alto.
 */
const PLATFORM_W = 5.4
const PLATFORM_H = 3.2

/** ¿Se solapan dos losas? */
function overlaps(a: [number, number, number], b: [number, number, number]) {
  const pa = screenPosition(a[0], a[2])
  const pb = screenPosition(b[0], b[2])
  return Math.abs(pa.sx - pb.sx) < PLATFORM_W && Math.abs(pa.sy - pb.sy) < PLATFORM_H
}

/* ------------------------------------------------------------------ */
/* Disposición                                                         */
/* ------------------------------------------------------------------ */

/**
 * Construye la disposición de comercios de una comunidad: qué edificio va en
 * cada plaza, con qué tipo de negocio, con qué colores y con qué rótulo.
 */
export function arrangeShops(community: Community): ShopSpec[] {
  const random = seeded(hash(`${community.id}-arrangement`))

  // --- plazas: primero las independientes, luego las de reserva ---------
  const primary = [...PRIMARY_SLOTS]
  for (let index = primary.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    const keep = primary[index]
    primary[index] = primary[swap]
    primary[swap] = keep
  }

  const extra = [...EXTRA_SLOTS]
  for (let index = extra.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    const keep = extra[index]
    extra[index] = extra[swap]
    extra[swap] = keep
  }

  const chosen: [number, number, number][] = [...primary].slice(
    0,
    Math.min(primary.length, community.businesses.length),
  )
  // Si hicieran falta más, se completa con las plazas de reserva que no
  // solapen con las ya elegidas.
  for (const slot of extra) {
    if (chosen.length >= community.businesses.length) break
    if (chosen.some((other) => overlaps(other, slot))) continue
    chosen.push(slot)
  }

  // --- paletas: cada comunidad reparte las suyas ------------------------
  const skins = [...SKINS]
  for (let index = skins.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    const keep = skins[index]
    skins[index] = skins[swap]
    skins[swap] = keep
  }

  return community.businesses.map((business, index) => {
    const slot = chosen[index] ?? PRIMARY_SLOTS[index % PRIMARY_SLOTS.length]
    const skin = skins[index % skins.length]
    const style = STYLE_BY_BUSINESS[business.business] ?? 'grocery'

    // pequeño desplazamiento: los edificios nunca caen en el mismo sitio
    const jitterX = (random() - 0.5) * 0.24
    const jitterZ = (random() - 0.5) * 0.24

    return {
      id: `${community.id}-${business.id}`,
      label: business.label,
      position: [slot[0] + jitterX, 0, slot[2] + jitterZ] as [number, number, number],
      style,
      color: skin.color,
      soft: skin.soft,
      deep: skin.deep,
      wall: skin.wall,
      awning: skin.awning,
      signPlate: skin.signPlate,
      platform: skin.platform,
      satisfaction: business.satisfaction,
      twoLevels: style === 'fashion' || style === 'services' || style === 'bakery',
      open: random() > 0.5,
    } satisfies ShopSpec
  })
}

/* ------------------------------------------------------------------ */
/* Nubes                                                               */
/* ------------------------------------------------------------------ */

/** Proyección en pantalla de un punto del espacio (con su altura). */
function screenPoint(x: number, y: number, z: number) {
  return { sx: 0.707 * (x - z), sy: 0.408 * (x + z) - 0.816 * y }
}

/**
 * Coloca las nubes evitando que tapen a los comercios. Como los edificios
 * cambian de sitio con cada barrio, las nubes se apartan cuando estorban.
 */
export function buildClouds(shops: ShopSpec[], base: CloudSpec[]): CloudSpec[] {
  return base.map((cloud) => {
    let [x, y, z] = cloud.position
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const point = screenPoint(x, y, z)
      const blocked = shops.some((shop) => {
        const other = screenPoint(shop.position[0], 1.2, shop.position[2])
        return Math.hypot(point.sx - other.sx, point.sy - other.sy) < 5
      })
      if (!blocked) break
      const length = Math.hypot(x, z) || 1
      x += (x / length) * 2.2
      z += (z / length) * 2.2
    }
    return { ...cloud, position: [x, y, z] as [number, number, number] }
  })
}

/* ------------------------------------------------------------------ */
/* Tubos de neón                                                       */
/* ------------------------------------------------------------------ */

export type Route = {
  id: string
  inner: string
  shell: string
  weight?: number
  points: [number, number, number][]
}

/** Nube: posición, escala y semilla de forma. */
export type CloudSpec = {
  position: [number, number, number]
  scale: number
  seed: number
}

/**
 * Genera los tubos de neón que conectan cada comercio con el núcleo. Se
 * calculan a partir de la posición real de cada edificio, así que el
 * cableado sigue a los comercios aunque se reordenen.
 */
export function buildRoutes(shops: ShopSpec[], seed: string): Route[] {
  const random = seeded(hash(`${seed}-routes`))
  const routes: Route[] = []

  shops.forEach((shop, index) => {
    const [x, , z] = shop.position
    const points: [number, number, number][] = []

    // salida: al borde de la losa, en dirección al núcleo
    const distance = Math.hypot(x, z) || 1
    points.push([x - (x / distance) * 1.9, 0.18, z - (z / distance) * 1.9])

    // codos: se avanza hacia el núcleo con un desvío lateral
    const lateral = (index % 2 === 0 ? 1 : -1) * (0.55 + random() * 0.55)
    const steps = 3 + (index % 2)
    for (let step = 1; step <= steps; step += 1) {
      const t = step / (steps + 1)
      const baseX = x * (1 - t)
      const baseZ = z * (1 - t)
      const length = Math.hypot(baseX, baseZ) || 1
      const offset = Math.sin(t * Math.PI * 1.6 + index) * lateral * (1 - t * 0.5)
      points.push([
        baseX + (-baseZ / length) * offset,
        0.18,
        baseZ + (baseX / length) * offset,
      ])
    }

    // entrada al núcleo
    points.push([x * 0.2, 0.18, z * 0.2])

    const warm = index % 3 === 0
    routes.push({
      id: shop.id,
      inner: warm ? iso.neonOrange : index % 3 === 1 ? iso.neonCyan : iso.neonPurple,
      shell: iso.neonCyan,
      weight: distance > 8 ? 0.8 : 1.12,
      points,
    })
  })

  // enlace decorativo frontal, siempre presente
  routes.push({
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
  })

  return routes
}
