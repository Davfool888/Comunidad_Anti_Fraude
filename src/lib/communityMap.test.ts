import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { HousePoint } from '../data/houses.ts'
import type { Community } from '../data/networks.ts'
import {
  buildCommunityShops,
  placeShopCard,
  selectDistributedAnchors,
} from './communityMap.ts'
import { distanceMeters } from './geo.ts'

/**
 * Pruebas de la vista geográfica:
 *
 * - Se descartan coordenadas inválidas, lejanas y repetidas.
 * - La selección es determinista y reparte los anclajes.
 * - Se usan los comercios que ya existen, sin crear registros nuevos.
 * - La tarjeta se mantiene dentro del mapa.
 */

const CENTRO = { lat: 4.63325, lng: -74.05738 }

/** Crea una construcción con un desplazamiento aproximado en metros. */
function house(
  id: string,
  northMeters: number,
  eastMeters: number,
  levels = 2,
): HousePoint {
  return {
    id,
    lat: CENTRO.lat + northMeters / 111_320,
    lng: CENTRO.lng + eastMeters / (111_320 * Math.cos(CENTRO.lat * (Math.PI / 180))),
    levels,
    kind: 'yes',
  }
}

function business(id: string, kind: string): Community['businesses'][number] {
  return {
    id,
    name: `${kind} ${id}`,
    business: kind,
    label: kind.toUpperCase(),
    satisfaction: 90,
  }
}

const COMMUNITY: Pick<Community, 'id' | 'name' | 'lat' | 'lng' | 'businesses'> = {
  id: 'barrio-prueba',
  name: 'Barrio Prueba',
  lat: CENTRO.lat,
  lng: CENTRO.lng,
  businesses: [
    business('b0', 'Panadería'),
    business('b1', 'Cafetería'),
    business('b2', 'Mercado'),
    business('b3', 'Farmácia'),
    business('b4', 'Papelaria'),
    business('b5', 'Floricultura'),
  ],
}

test('descarta coordenadas inválidas, lejanas y duplicadas', () => {
  const casas: HousePoint[] = [
    house('norte', 60, 0),
    house('norte-repetida', 60.1, 0), // menos de 10 m: se deduplica
    house('este', 0, 55),
    house('sur', -65, 0),
    house('oeste', 0, -70),
    { id: 'invalida', lat: Number.NaN, lng: CENTRO.lng, levels: 1, kind: 'yes' },
    { id: 'nulo', lat: 0, lng: 0, levels: 1, kind: 'yes' },
    house('lejana', 0, 420),
  ]

  const anchors = selectDistributedAnchors(casas, CENTRO, 4, {
    radiusMeters: 260,
    minSeparationMeters: 18,
  })

  assert.equal(anchors.length, 4)
  assert.ok(anchors.every((anchor) => anchor.id !== 'invalida'))
  assert.ok(anchors.every((anchor) => anchor.id !== 'nulo'))
  assert.ok(anchors.every((anchor) => anchor.id !== 'lejana'))
  assert.ok(!anchors.some((anchor) => anchor.id === 'norte-repetida'))

  const ids = anchors.map((anchor) => anchor.id)
  assert.equal(new Set(ids).size, ids.length, 'no debe repetir anclajes')
})

test('reparte los anclajes en vez de tomar los primeros de la lista', () => {
  // La lista empieza con cinco construcciones pegadas en el mismo rincón.
  const casas = [
    house('a', 10, 10),
    house('b', 11, 10),
    house('c', 10, 11),
    house('d', 12, 12),
    house('e', 11, 12),
    house('norte', 90, 0),
    house('sur', -90, 0),
    house('este', 0, 95),
    house('oeste', 0, -95),
  ]

  const anchors = selectDistributedAnchors(casas, CENTRO, 5, {
    minSeparationMeters: 18,
  })

  assert.equal(anchors.length, 5)
  for (let index = 0; index < anchors.length; index += 1) {
    for (let other = index + 1; other < anchors.length; other += 1) {
      assert.ok(
        distanceMeters(anchors[index], anchors[other]) >= 18,
        'los modelos deben quedar separados',
      )
    }
  }

  // La primera construcción del arreglo no es suficiente para cubrir el barrio.
  assert.ok(anchors.some((anchor) => anchor.id === 'norte'))
  assert.ok(anchors.some((anchor) => anchor.id === 'sur'))
  assert.ok(anchors.some((anchor) => anchor.id === 'este'))
})

test('es determinista aunque cambie el orden de entrada', () => {
  const casas = [
    house('c', 0, 80),
    house('a', 80, 0),
    house('b', -80, 0),
    house('d', 0, -80),
  ]

  const primero = selectDistributedAnchors(casas, CENTRO, 3)
  const segundo = selectDistributedAnchors([...casas].reverse(), CENTRO, 3)

  assert.deepEqual(
    primero.map((anchor) => anchor.id),
    segundo.map((anchor) => anchor.id),
  )
})

test('usa los comercios existentes y respeta el máximo de diez', () => {
  const casas = Array.from({ length: 14 }, (_, index) =>
    house(`casa-${index}`, Math.cos(index) * 100, Math.sin(index) * 100),
  )

  const seleccion = buildCommunityShops(COMMUNITY, casas, 'openstreetmap', {
    maxShops: 10,
  })

  assert.equal(seleccion.totalBusinesses, 6)
  assert.equal(seleccion.shops.length, 6)
  assert.equal(seleccion.missing, 0)
  assert.equal(seleccion.coverage, 'completa')
  assert.deepEqual(
    seleccion.shops.map((shop) => shop.businessId),
    ['b0', 'b1', 'b2', 'b3', 'b4', 'b5'],
  )
  assert.ok(seleccion.shops.every((shop) => shop.source === 'openstreetmap'))
  assert.ok(
    seleccion.shops.every((shop) =>
      shop.locationLabel.includes('OpenStreetMap'),
    ),
  )
})

test('marca cobertura parcial cuando no hay cinco coordenadas válidas', () => {
  const casas = [house('uno', 20, 0), house('dos', 0, 20), house('tres', -20, 0)]
  const seleccion = buildCommunityShops(COMMUNITY, casas, 'aproximado')

  assert.equal(seleccion.shops.length, 3)
  assert.equal(seleccion.coverage, 'parcial')
  assert.equal(seleccion.missing, 3)
  assert.ok(
    seleccion.shops.every((shop) => shop.locationLabel.includes('demostración')),
  )
})

test('sin construcciones no inventa comercios', () => {
  const seleccion = buildCommunityShops(COMMUNITY, [], 'aproximado')
  assert.deepEqual(seleccion.shops, [])
  assert.equal(seleccion.coverage, 'sin-datos')
  assert.equal(seleccion.missing, 6)
})

test('cada comercio tiene un anclaje distinto', () => {
  const casas = Array.from({ length: 8 }, (_, index) =>
    house(`casa-${index}`, index * 25 - 80, index % 2 === 0 ? 35 : -35),
  )
  const seleccion = buildCommunityShops(COMMUNITY, casas, 'openstreetmap')

  const anchors = seleccion.shops.map((shop) => shop.anchorId)
  assert.equal(new Set(anchors).size, anchors.length)
})

test('la tarjeta se coloca encima cuando hay espacio', () => {
  const placement = placeShopCard({
    anchorX: 300,
    anchorY: 500,
    viewportWidth: 800,
    viewportHeight: 700,
    cardWidth: 280,
    cardHeight: 240,
  })

  assert.equal(placement.side, 'above')
  assert.equal(placement.left, 300)
  assert.equal(placement.top, 244)
  assert.equal(placement.arrowX, 140)
})

test('la tarjeta pasa debajo y se mantiene dentro del mapa cerca del borde', () => {
  const placement = placeShopCard({
    anchorX: 790,
    anchorY: 80,
    viewportWidth: 800,
    viewportHeight: 700,
    cardWidth: 280,
    cardHeight: 240,
  })

  assert.equal(placement.side, 'below')
  assert.equal(placement.left, 648)
  assert.equal(placement.top, 96)
  assert.ok(placement.arrowX <= 262)
  assert.ok(placement.arrowX >= 18)
})

test('la tarjeta cabe en una pantalla estrecha', () => {
  const placement = placeShopCard({
    anchorX: 20,
    anchorY: 300,
    viewportWidth: 320,
    viewportHeight: 640,
    cardWidth: 280,
    cardHeight: 240,
  })

  assert.equal(placement.left, 152)
  assert.ok(placement.top >= 12)
  assert.ok(placement.top + 240 <= 640 - 12)
})
