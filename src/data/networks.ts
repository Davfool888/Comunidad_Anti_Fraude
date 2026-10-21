import { BUSINESS_CATALOG } from './businesses'
import { COMUNIDADES } from './comunidades'
import { LOCALIDADES } from './localidades'

/**
 * Redes comunitarias de Bogotá.
 *
 * Cada **localidad** es una red comunitaria y dentro de ella hay varias
 * **comunidades de barrio**, señaladas en el mapa con puntos de distinto
 * tamaño según la superficie del barrio.
 */

/** Comercio de un barrio: el rótulo que aparece en la tienda 3D. */
export type Commerce = {
  id: string
  /** Rótulo grande del cartel de neón. */
  label: string
  /** Nombre corto del comercio, para las listas de la interfaz. */
  name: string
  satisfaction: number
}

/**
 * Comercio que pertenece a una **comunidad de barrio** concreta. Es el que
 * se construye en la escena 3D y el que conversa en el chat del barrio.
 */
export type CommunityBusiness = {
  id: string
  /** Nombre del comercio: "Panadería La Espiga". */
  name: string
  /** Tipo de negocio: "Panadería", "Farmácia"… */
  business: string
  /** Rótulo grande del cartel de neón. */
  label: string
  satisfaction: number
}

/** Comunidad de barrio dentro de una localidad. */
export type Community = {
  id: string
  /** Nombre del barrio. */
  name: string
  lat: number
  lng: number
  /** Radio del punto en el mapa (0.5 – 1.2). */
  radius: number
  /** Peso de la comunidad dentro de la red (0 – 1). */
  weight: number
  /** Superficie del barrio en hectáreas. */
  area: number
  /** Comercios del barrio: son los edificios de la escena 3D. */
  businesses: CommunityBusiness[]
  stats: {
    merchants: number
    verified: number
    satisfaction: number
  }
}

export type NetworkStats = {
  merchants: number
  verified: number
  satisfaction: number
  fraudBlocked: number
  transactions: string
}

/** Red comunitaria de una localidad. */
export type CommunityNetwork = {
  id: string
  /** "Rede Segura de Usaquén" */
  name: string
  /** Nombre de la localidad. */
  neighborhood: string
  /** Comuna a la que pertenece. */
  commune: string
  city: string
  /** Centroide de la localidad (para el marcador). */
  lat: number
  lng: number
  /** Color propio de la localidad en el mapa. */
  color: string
  /** Anillos del polígono: el primero es el exterior, el resto son huecos. */
  rings: [number, number][][]
  /** Comunidades de barrio dentro de la localidad. */
  communities: Community[]
  commerce: Commerce[]
  stats: NetworkStats
}

/** Centro de Bogotá (Plaza de Bolívar). */
export const BOGOTA_CENTER: [number, number] = [4.62, -74.08]
export const BOGOTA_ZOOM = 11

/* ------------------------------------------------------------------ */
/* Contenido de cada barrio                                            */
/* ------------------------------------------------------------------ */

/** Tipos de comercio habituales en una localidad, con su rótulo 3D. */
const COMMERCE_POOL = [
  { label: 'PANIFICADORA', name: 'Padaria' },
  { label: 'FARMÁCIA', name: 'Farmácia' },
  { label: 'MERCADO', name: 'Mercado' },
  { label: 'ELETRÔNICOS', name: 'Eletrônicos' },
  { label: 'MODA', name: 'Loja de Roupas' },
  { label: 'SERVIÇOS', name: 'Consultório' },
  { label: 'FLORICULTURA', name: 'Floricultura' },
  { label: 'LIBRERÍA', name: 'Livraria' },
  { label: 'CAFETERÍA', name: 'Cafetería' },
  { label: 'MASCOTAS', name: 'Petshop' },
  { label: 'ÓPTICA', name: 'Óptica' },
  { label: 'PAPELERÍA', name: 'Papelaria' },
]

/** Generador determinista: la misma localidad siempre da los mismos datos. */
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

/** Comunas de Bogotá (para agrupar en la interfaz). */
const COMMUNES: Record<string, string> = {
  usaquen: 'Suba',
  suba: 'Suba',
  'la-cristalina': 'Suba',
  'san-blas': 'Suba',
  'gustavo-madero': 'Suba',
  'los-andes': 'Suba',
  chapinero: 'Chapinero',
  'santa-fe': 'Chapinero',
  'san-cristobal': 'Chapinero',
  teusaquillo: 'Chapinero',
  candelaria: 'La Candelaria',
  'los-martires': 'La Candelaria',
  'santa-maria': 'La Candelaria',
  'la-majada': 'La Candelaria',
  'antonio-narino': 'Usme',
  usme: 'Usme',
  'ciudad-bolivar': 'Usme',
  tunjuelito: 'Tunjuelo',
  kennedy: 'Kennedy',
  bosa: 'Kennedy',
  'barrios-unidos': 'Kennedy',
  fontibon: 'Fontibón',
  'puente-aranda': 'Fontibón',
  engativa: 'Engativá',
  'rafael-uribe-uribe': 'Rafael Uribe Uribe',
  sumapaz: 'Sumapaz',
}

/**
 * Comercios de una comunidad de barrio.
 *
 * Cada barrio tiene entre 5 y 6 comercios de **tipos distintos**, elegidos
 * de forma determinista: son los edificios que se construyen en la escena
 * 3D y los participantes del chat de la comunidad.
 */
function buildBusinesses(
  community: { id: string; name: string },
  random: () => number,
): CommunityBusiness[] {
  // baraja del catálogo para elegir tipos distintos
  const pool = [...BUSINESS_CATALOG]
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    const keep = pool[index]
    pool[index] = pool[swap]
    pool[swap] = keep
  }

  const count = 5 + Math.floor(random() * 2)

  return pool.slice(0, count).map((template, index) => {
    const name = template.names[Math.floor(random() * template.names.length)]
    return {
      id: `${community.id}-b${index}`,
      name,
      business: template.kind,
      label: template.label,
      satisfaction: 86 + Math.floor(random() * 14),
    }
  })
}

function buildNetwork(localidad: (typeof LOCALIDADES)[number], index: number): CommunityNetwork {
  const random = seeded(hash(localidad.id))
  const count = 4 + Math.floor(random() * 2)

  const commerce: Commerce[] = []
  for (let i = 0; i < count; i += 1) {
    const template = COMMERCE_POOL[(index * 3 + i) % COMMERCE_POOL.length]
    commerce.push({
      id: `${localidad.id}-${i}`,
      label: template.label,
      name: template.name,
      satisfaction: 88 + Math.floor(random() * 12),
    })
  }

  const merchants = 40 + Math.floor(random() * 120)

  // comunidades de barrio de la localidad
  const communities: Community[] = (COMUNIDADES.find((item) => item.code === localidad.code)?.communities ?? []).map(
    (community) => {
      const communityRandom = seeded(hash(`${localidad.id}-${community.name}`))
      const communityMerchants = 6 + Math.floor(communityRandom() * 46)
      return {
        id: community.id,
        name: community.name,
        lat: community.lat,
        lng: community.lng,
        radius: community.radius,
        weight: community.weight,
        area: community.area,
        businesses: buildBusinesses(community, communityRandom),
        stats: {
          merchants: communityMerchants,
          verified: Math.round(communityMerchants * (0.68 + communityRandom() * 0.28)),
          satisfaction: 86 + Math.floor(communityRandom() * 14),
        },
      }
    },
  )

  return {
    id: localidad.id,
    name: `Rede Segura de ${localidad.label}`,
    neighborhood: localidad.label,
    commune: COMMUNES[localidad.id] ?? 'Bogotá',
    city: 'Bogotá',
    lat: localidad.center[1],
    lng: localidad.center[0],
    color: localidad.color,
    rings: localidad.rings,
    communities,
    commerce,
    stats: {
      merchants,
      verified: Math.round(merchants * (0.72 + random() * 0.24)),
      satisfaction: 88 + Math.floor(random() * 11),
      fraudBlocked: Number((96 + random() * 3.6).toFixed(1)),
      transactions: `${(0.6 + random() * 1.6).toFixed(1)}M`,
    },
  }
}

/* ------------------------------------------------------------------ */
/* Catálogo                                                           */
/* ------------------------------------------------------------------ */

export const NETWORKS: CommunityNetwork[] = LOCALIDADES.map(buildNetwork)

export function findNetwork(id: string) {
  return NETWORKS.find((network) => network.id === id) ?? NETWORKS[0]
}

/**
 * Busca una comunidad de barrio y la red a la que pertenece.
 * Sirve para que al pulsar un punto del mapa se cambie también de localidad.
 */
export function findCommunity(id: string) {
  for (const network of NETWORKS) {
    const community = network.communities.find((item) => item.id === id)
    if (community) return { network, community }
  }
  return null
}

/** Localidades agrupadas por comuna. */
export function communes() {
  const groups = new Map<string, CommunityNetwork[]>()
  NETWORKS.forEach((network) => {
    const list = groups.get(network.commune) ?? []
    list.push(network)
    groups.set(network.commune, list)
  })
  return [...groups.entries()].map(([name, networks]) => ({ name, networks }))
}
