import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  avoidCore,
  boundsOf,
  closestTo,
  dedupeByDistance,
  distanceMeters,
  isValidCoordinate,
  pointsWithinRadius,
  projectToPlane,
  separateOverlaps,
} from './geo.ts'

/**
 * Pruebas de la lógica geográfica: validación de coordenadas, filtrado por
 * área, eliminación de duplicados y proyección al plano de la escena 3D.
 *
 * Se ejecutan con `npm run test:unit` (sin dependencias: `node --test`).
 */

const CENTRO = { lat: 4.63325, lng: -74.05738 }

test('isValidCoordinate acepta coordenadas reales y rechaza las inválidas', () => {
  assert.equal(isValidCoordinate(4.63, -74.05), true)
  assert.equal(isValidCoordinate(-33.4, -70.6), true)

  assert.equal(isValidCoordinate(0, 0), false, 'el punto nulo no es una ubicación')
  assert.equal(isValidCoordinate(Number.NaN, -74.05), false)
  assert.equal(isValidCoordinate(4.63, Number.POSITIVE_INFINITY), false)
  assert.equal(isValidCoordinate(91, 0), false, 'latitud fuera del planeta')
  assert.equal(isValidCoordinate(0, 181), false, 'longitud fuera del planeta')
  assert.equal(isValidCoordinate('4.63' as unknown as number, -74.05), false)
  assert.equal(isValidCoordinate(undefined, undefined), false)
})

test('distanceMeters mide en metros reales', () => {
  // Un grado de latitud son unos 111 km
  const unGrado = distanceMeters({ lat: 4, lng: 0 }, { lat: 5, lng: 0 })
  assert.ok(unGrado > 110_000 && unGrado < 112_000, `distancia inesperada: ${unGrado}`)

  // Un grado de longitud en Bogotá son algo menos de 111 km
  const longitud = distanceMeters({ lat: 4.63, lng: -74 }, { lat: 4.63, lng: -73 })
  assert.ok(longitud > 107_000 && longitud < 112_000, `distancia inesperada: ${longitud}`)

  assert.equal(distanceMeters(CENTRO, CENTRO), 0)
})

test('boundsOf envuelve los puntos y descarta los inválidos', () => {
  const bounds = boundsOf([
    { lat: 4.6, lng: -74.1 },
    { lat: 4.7, lng: -74.0 },
    { lat: Number.NaN, lng: -74.0 },
  ])
  assert.ok(bounds)
  assert.equal(bounds.minLat, 4.6)
  assert.equal(bounds.maxLat, 4.7)
  assert.equal(bounds.minLng, -74.1)
  assert.equal(bounds.maxLng, -74.0)

  assert.equal(boundsOf([]), null)
  assert.equal(boundsOf([{ lat: Number.NaN, lng: 0 }]), null)
})

test('pointsWithinRadius descarta lo que cae fuera de la zona', () => {
  const dentro = pointsWithinRadius(
    [
      { lat: 4.6333, lng: -74.0574 }, // ~6 m del centro
      { lat: 4.6333, lng: -74.04 }, // ~1900 m: fuera
      { lat: Number.NaN, lng: -74.0574 }, // inválido
    ],
    CENTRO,
    220,
  )

  assert.equal(dentro.length, 1)
  assert.ok(Math.abs(dentro[0].lat - 4.6333) < 0.0001)
})

test('dedupeByDistance quita el mismo edificio repetido', () => {
  const puntos = [
    { lat: 4.63325, lng: -74.05738 },
    { lat: 4.633251, lng: -74.057381 }, // a menos de un metro
    { lat: 4.64, lng: -74.05738 }, // lejos
  ]

  const limpio = dedupeByDistance(puntos, 12)
  assert.equal(limpio.length, 2)
  assert.equal(limpio[0].lat, 4.63325)
  assert.equal(limpio[1].lat, 4.64)
})

test('closestTo ordena por cercanía al centro del barrio', () => {
  const puntos = [
    { lat: 4.65, lng: -74.05738, id: 'lejos' },
    { lat: 4.6333, lng: -74.0574, id: 'cerca' },
    { lat: 4.64, lng: -74.05738, id: 'medio' },
  ]

  const cercanos = closestTo(puntos, CENTRO, 2)
  assert.equal(cercanos.length, 2)
  assert.equal(cercanos[0].id, 'cerca')
  assert.equal(cercanos[1].id, 'medio')
})

test('projectToPlane conserva la orientación y la escala', () => {
  const puntos = [
    { lat: 4.64, lng: -74.05738 }, // norte
    { lat: 4.63325, lng: -74.05 }, // este
  ]
  const bounds = boundsOf(puntos)!
  const plano = projectToPlane(puntos, bounds, 20)

  assert.equal(plano.length, 2)
  // El norte (mayor latitud) va hacia el fondo de la escena: Z negativo.
  assert.ok(plano[0].z < 0, 'el norte debe quedar al fondo')
  // El este (mayor longitud) va a la derecha: X positivo.
  assert.ok(plano[1].x > 0, 'el este debe quedar a la derecha')
  // El conjunto cabe en el ancho pedido.
  assert.ok(Math.max(...plano.map((p) => Math.abs(p.x))) <= 20)
})

test('projectToPlane mantiene la forma (misma escala en X que en Z)', () => {
  // Dos puntos a la **misma distancia en metros**: uno al norte y otro al
  // este. A esta latitud un grado de longitud es más corto que uno de
  // latitud, así que se compensa para que la distancia sea la misma.
  const lat = 4.63325
  const lng = -74.05738
  const metrosPorGradoLongitud = 111_320 * Math.cos((lat * Math.PI) / 180)
  const deltaLat = 0.01
  const deltaLng = (deltaLat * 111_320) / metrosPorGradoLongitud

  const puntos = [
    { lat: lat + deltaLat, lng }, // norte
    { lat, lng: lng + deltaLng }, // este
  ]
  const bounds = boundsOf(puntos)!
  const plano = projectToPlane(puntos, bounds, 20)

  const norte = Math.abs(plano[0].z)
  const este = Math.abs(plano[1].x)
  assert.ok(
    Math.abs(norte - este) < 0.001,
    `la proyección debe ser isométrica (norte ${norte}, este ${este})`,
  )
})

test('separateOverlaps aparta los edificios que se enciman', () => {
  const plano = [
    { x: 0, z: 0 },
    { x: 0.5, z: 0.2 }, // casi encima
    { x: 10, z: 10 }, // lejos
  ]

  const separado = separateOverlaps(plano, 6)
  assert.equal(separado.length, 3)

  const distancia = Math.hypot(separado[1].x - separado[0].x, separado[1].z - separado[0].z)
  assert.ok(distancia >= 5.9, `los edificios deben quedar separados: ${distancia}`)

  // El tercero, que ya estaba solo, no se mueve
  assert.deepEqual(separado[2], { x: 10, z: 10 })
})

test('separateOverlaps separa también dos puntos exactamente iguales', () => {
  const separado = separateOverlaps(
    [
      { x: 3, z: 3 },
      { x: 3, z: 3 },
    ],
    6,
  )
  const distancia = Math.hypot(separado[1].x - separado[0].x, separado[1].z - separado[0].z)
  assert.ok(distancia >= 5.9, `dos puntos idénticos deben separarse: ${distancia}`)
})

test('avoidCore aparta los edificios del núcleo de seguridad', () => {
  const plano = [
    { x: 1, z: 0 }, // dentro del núcleo
    { x: 12, z: 0 }, // fuera
  ]

  const resultado = avoidCore(plano, 6)
  assert.ok(Math.hypot(resultado[0].x, resultado[0].z) >= 6, 'debe salir del núcleo')
  assert.deepEqual(resultado[1], { x: 12, z: 0 }, 'fuera del núcleo no se mueve')
})
