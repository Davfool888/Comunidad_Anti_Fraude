import { test } from 'node:test'
import assert from 'node:assert/strict'
import { geographicShopPositions } from '../lib/shopPositions.ts'
import type { HousePoint } from '../data/houses.ts'

/**
 * Pruebas de la colocación geográfica de los edificios de la escena 3D:
 *
 * - Cada edificio se planta sobre la casa que le toca.
 * - Se conserva la orientación (norte al fondo) y la distancia relativa.
 * - Ningún edificio se encima con otro ni queda bajo el núcleo.
 * - Sin datos suficientes se devuelve null (la escena usa las plazas).
 */

/** Casas reales alrededor del centro del barrio. */
const CASAS: HousePoint[] = [
  { id: 'c1', lat: 4.63340, lng: -74.05738, levels: 3, kind: 'yes' }, // norte
  { id: 'c2', lat: 4.63310, lng: -74.05738, levels: 2, kind: 'yes' }, // sur
  { id: 'c3', lat: 4.63325, lng: -74.05710, levels: 1, kind: 'yes' }, // este
]

/**
 * Cuatro casas en cruz, todas a la misma distancia del centro: sirven para
 * comprobar que la proyección conserva la forma.
 */
const CRUZ: HousePoint[] = [
  { id: 'n', lat: 4.63340, lng: -74.05738, levels: 1, kind: 'yes' },
  { id: 's', lat: 4.63310, lng: -74.05738, levels: 1, kind: 'yes' },
  { id: 'e', lat: 4.63325, lng: -74.05708, levels: 1, kind: 'yes' },
  { id: 'o', lat: 4.63325, lng: -74.05768, levels: 1, kind: 'yes' },
]

test('coloca un edificio por casa y en el orden de las casas', () => {
  const posiciones = geographicShopPositions(CASAS, 3)
  assert.ok(posiciones)
  assert.equal(posiciones.length, 3)

  // El primer comercio toma la casa del norte: en la escena el norte es el
  // fondo, así que su Z es negativo.
  assert.ok(posiciones[0].z < 0, 'la casa del norte debe quedar al fondo')
  // El segundo, la del sur: al frente.
  assert.ok(posiciones[1].z > 0, 'la casa del sur debe quedar al frente')
  // El tercero, la del este: a la derecha.
  assert.ok(posiciones[2].x > 0, 'la casa del este debe quedar a la derecha')
})

test('conserva la distancia relativa entre las casas', () => {
  const posiciones = geographicShopPositions(CRUZ, 4)
  assert.ok(posiciones)
  assert.equal(posiciones.length, 4)

  // Las cuatro casas están a la misma distancia del centro, así que en la
  // escena los cuatro edificios quedan a la misma distancia del origen,
  // salvo los que hay que apartar del núcleo de seguridad (esos quedan
  // justo en su borde, que es lo que se busca).
  const magnitudes = posiciones.map((p) => Math.hypot(p.x, p.z))
  const unicas = [...new Set(magnitudes.map((m) => m.toFixed(2)))]
  assert.ok(unicas.length <= 2, `sólo hay dos radios distintos: ${unicas.join(', ')}`)

  for (const magnitud of magnitudes) {
    assert.ok(
      magnitud >= 5.99,
      `ningún edificio puede quedar dentro del núcleo: ${magnitud}`,
    )
  }

  // Y cada uno en su dirección: norte al fondo, sur al frente, este a la
  // derecha y oeste a la izquierda.
  assert.ok(posiciones[0].z < 0, 'el norte al fondo')
  assert.ok(posiciones[1].z > 0, 'el sur al frente')
  assert.ok(posiciones[2].x > 0, 'el este a la derecha')
  assert.ok(posiciones[3].x < 0, 'el oeste a la izquierda')
})

test('no encima edificios ni los deja bajo el núcleo', () => {
  const posiciones = geographicShopPositions(CASAS, 3)
  assert.ok(posiciones)

  for (const posicion of posiciones) {
    const distancia = Math.hypot(posicion.x, posicion.z)
    assert.ok(distancia >= 6, `ningún edificio puede quedar bajo el núcleo: ${distancia}`)
  }

  for (let i = 0; i < posiciones.length; i += 1) {
    for (let j = i + 1; j < posiciones.length; j += 1) {
      const distancia = Math.hypot(
        posiciones[i].x - posiciones[j].x,
        posiciones[i].z - posiciones[j].z,
      )
      assert.ok(distancia > 4, `dos edificios encima: ${distancia}`)
    }
  }
})

test('separa los edificios cuando las casas están muy juntas', () => {
  // Tres casas a menos de dos metros una de otra.
  const juntas: HousePoint[] = [
    { id: 'j1', lat: 4.633251, lng: -74.057381, levels: 1, kind: 'yes' },
    { id: 'j2', lat: 4.633252, lng: -74.057382, levels: 1, kind: 'yes' },
    { id: 'j3', lat: 4.633253, lng: -74.057383, levels: 1, kind: 'yes' },
  ]

  const posiciones = geographicShopPositions(juntas, 3)
  assert.ok(posiciones)
  assert.equal(posiciones.length, 3)

  for (let i = 0; i < posiciones.length; i += 1) {
    for (let j = i + 1; j < posiciones.length; j += 1) {
      const distancia = Math.hypot(
        posiciones[i].x - posiciones[j].x,
        posiciones[i].z - posiciones[j].z,
      )
      assert.ok(distancia > 4, `dos edificios encima: ${distancia}`)
    }
  }
})

test('sin datos suficientes devuelve null (la escena usa las plazas)', () => {
  assert.equal(geographicShopPositions([], 3), null)
  assert.equal(geographicShopPositions(undefined, 3), null)
  assert.equal(geographicShopPositions(CASAS, 0), null)
})

test('es determinista: los mismos datos dan la misma posición', () => {
  const a = geographicShopPositions(CASAS, 3)
  const b = geographicShopPositions(CASAS, 3)
  assert.deepEqual(a, b)
})

test('usa sólo las casas necesarias para los comercios', () => {
  const posiciones = geographicShopPositions(CASAS, 2)
  assert.ok(posiciones)
  assert.equal(posiciones.length, 2)
})
