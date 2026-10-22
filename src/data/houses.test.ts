import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanHouses, parseOsmBuildings, type HousePoint } from './houses.ts'
import { distanceMeters } from '../lib/geo.ts'

/**
 * Pruebas de la lectura de las casas reales:
 *
 * - Se extraen sólo las edificaciones, con su centro y sus niveles.
 * - Se descartan las coordenadas inválidas y lo que cae fuera de la zona.
 * - No se repiten las ubicaciones.
 */

const CENTRO = { lat: 4.63325, lng: -74.05738 }

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="test">
  <node id="1" lat="4.63330" lon="-74.05740"/>
  <node id="2" lat="4.63340" lon="-74.05730"/>
  <node id="3" lat="4.63340" lon="-74.05720"/>
  <node id="4" lat="4.63330" lon="-74.05720"/>
  <node id="9" lat="4.64000" lon="-74.05000"/>
  <way id="10">
    <nd ref="1"/><nd ref="2"/><nd ref="3"/><nd ref="4"/>
    <tag k="building" v="yes"/>
    <tag k="building:levels" v="3"/>
  </way>
  <way id="11">
    <nd ref="1"/><nd ref="2"/>
    <tag k="building" v="apartments"/>
  </way>
  <way id="12">
    <nd ref="1"/><nd ref="9"/>
    <tag k="building" v="no"/>
  </way>
  <way id="13">
    <nd ref="1"/><nd ref="2"/>
    <tag k="highway" v="residential"/>
  </way>
</osm>`

test('parseOsmBuildings devuelve sólo las edificaciones con centro válido', () => {
  const casas = parseOsmBuildings(XML, 'barrio-1')

  // El way 12 tiene building=no y el 13 es una vía: ninguno cuenta.
  assert.equal(casas.length, 2)
  assert.ok(casas.every((casa) => casa.id.startsWith('barrio-1-')))

  const conNiveles = casas.find((casa) => casa.id.endsWith('-10'))
  assert.ok(conNiveles, 'debe encontrar la edificación con niveles')
  assert.equal(conNiveles.levels, 3)
  assert.equal(conNiveles.kind, 'yes')

  // El centro es la media de los nodos
  assert.ok(Math.abs(conNiveles.lat - 4.63335) < 0.00001)
  assert.ok(Math.abs(conNiveles.lng + 74.057275) < 0.00001)

  // La otra, sin niveles, vale 1
  const simple = casas.find((casa) => casa.id.endsWith('-11'))
  assert.equal(simple?.levels, 1)
  assert.equal(simple?.kind, 'apartments')
})

test('parseOsmBuildings aguanta un XML vacío o corrupto', () => {
  assert.deepEqual(parseOsmBuildings('', 'x'), [])
  assert.deepEqual(parseOsmBuildings('no es xml', 'x'), [])
  assert.deepEqual(parseOsmBuildings('<osm></osm>', 'x'), [])
})

test('cleanHouses descarta lo inválido, lo lejano y lo repetido', () => {
  const casas: HousePoint[] = [
    { id: 'a', lat: 4.63330, lng: -74.05740, levels: 2, kind: 'yes' },
    // el mismo edificio repetido (a menos de un metro)
    { id: 'b', lat: 4.633301, lng: -74.057401, levels: 2, kind: 'yes' },
    // coordenadas inválidas
    { id: 'c', lat: Number.NaN, lng: -74.0574, levels: 1, kind: 'yes' },
    { id: 'd', lat: 0, lng: 0, levels: 1, kind: 'yes' },
    // lejos del barrio (más de 220 m)
    { id: 'e', lat: 4.64, lng: -74.04, levels: 1, kind: 'yes' },
    // válido y dentro de la zona
    { id: 'f', lat: 4.6335, lng: -74.0572, levels: 1, kind: 'yes' },
  ]

  const limpias = cleanHouses(casas, CENTRO, 220)
  const ids = limpias.map((casa) => casa.id)

  assert.ok(ids.includes('a'))
  assert.ok(ids.includes('f'))
  assert.ok(!ids.includes('b'), 'no debe repetir el mismo edificio')
  assert.ok(!ids.includes('c'), 'no debe quedar una coordenada inválida')
  assert.ok(!ids.includes('d'), 'no debe quedar el punto nulo')
  assert.ok(!ids.includes('e'), 'no debe quedar lo que está fuera de la zona')

  // Todas las que quedan están dentro del radio
  for (const casa of limpias) {
    assert.ok(distanceMeters(casa, CENTRO) <= 220)
  }
})

test('cleanHouses no rompe con listas vacías', () => {
  assert.deepEqual(cleanHouses([], CENTRO), [])
})
