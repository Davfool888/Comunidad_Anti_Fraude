import * as THREE from 'three'

/**
 * Geometrías compartidas del sistema de diseño 3D.
 * Se crean a nivel de módulo y se reutilizan: nunca se liberan en runtime,
 * por eso los <mesh> que las usan van con dispose={null}.
 */

/** Silueta de escudo: hombros rectos redondeados y punta inferior. */
export function createShieldShape(width: number, height: number) {
  const w = width / 2
  const h = height / 2
  const shape = new THREE.Shape()

  shape.moveTo(-w, h * 0.84)
  shape.quadraticCurveTo(0, h * 1.1, w, h * 0.84)
  shape.bezierCurveTo(w, h * 0.05, w * 0.95, -h * 0.45, 0, -h)
  shape.bezierCurveTo(-w * 0.95, -h * 0.45, -w, h * 0.05, -w, h * 0.84)
  shape.closePath()

  return shape
}

/** Escudo extruido con bisel ancho: el volumen "clay" de las ilustraciones. */
export function createShieldGeometry({
  width = 2,
  height = 2.35,
  depth = 0.28,
  bevel = 0.09,
}: {
  width?: number
  height?: number
  depth?: number
  bevel?: number
} = {}) {
  const geometry = new THREE.ExtrudeGeometry(createShieldShape(width, height), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 10,
    curveSegments: 32,
  })
  geometry.center()
  geometry.computeVertexNormals()
  return geometry
}

/** Checkmark dibujado como tubo con extremos redondeados. */
export function createCheckGeometry(scale = 1, thickness = 0.15) {
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-0.36, -0.02, 0),
      new THREE.Vector3(-0.13, -0.26, 0),
      new THREE.Vector3(0.11, 0.04, 0),
      new THREE.Vector3(0.4, 0.34, 0),
    ].map((point) => point.multiplyScalar(scale)),
  )
  return new THREE.TubeGeometry(curve, 56, thickness * scale, 16, false)
}

/** Arco de señal (ondas de llamada). */
export function createArcGeometry(
  radius: number,
  thickness: number,
  arc = Math.PI * 0.62,
) {
  return new THREE.TorusGeometry(radius, thickness, 12, 56, arc)
}

/** Auricular tipo WhatsApp: torus abierto con el hueco hacia arriba-derecha. */
export function createHandsetGeometry(scale = 1) {
  const geometry = new THREE.TorusGeometry(0.3 * scale, 0.12 * scale, 16, 48, Math.PI * 1.05)
  geometry.rotateZ(Math.PI * 0.725)
  return geometry
}

/** Posiciones de los extremos del auricular para rematar con esferas. */
export function handsetEndCaps(scale = 1): [number, number][] {
  const r = 0.3 * scale
  const start = Math.PI * 0.725
  const end = start + Math.PI * 1.05
  return [
    [Math.cos(start) * r, Math.sin(start) * r],
    [Math.cos(end) * r, Math.sin(end) * r],
  ]
}

/** Triángulo extruido: solapa de sobre y detalles puntiagudos. */
export function createTriangleGeometry(width: number, height: number, depth: number) {
  const shape = new THREE.Shape()
  shape.moveTo(-width / 2, height / 2)
  shape.lineTo(width / 2, height / 2)
  shape.lineTo(0, -height / 2)
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.25,
    bevelSize: width * 0.04,
    bevelSegments: 4,
    curveSegments: 12,
  })
  geometry.center()
  geometry.computeVertexNormals()
  return geometry
}

/** Cara sonriente: boca hecha con tubo. */
export function createSmileGeometry(scale = 1) {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.27 * scale, 0.05 * scale, 0),
    new THREE.Vector3(0, -0.32 * scale, 0),
    new THREE.Vector3(0.27 * scale, 0.05 * scale, 0),
  )
  return new THREE.TubeGeometry(curve, 44, 0.06 * scale, 14, false)
}

/** Ojo: esfera achatada que se pega a la superficie del escudo. */
export function createEyeGeometry(radius = 0.1) {
  const geometry = new THREE.SphereGeometry(radius, 32, 24)
  geometry.scale(1, 1.15, 0.55)
  return geometry
}

/** Estrella de 5 puntas extruida (insignias y detalles decorativos). */
export function createStarGeometry(outer = 0.5, inner = 0.24, depth = 0.16) {
  const shape = new THREE.Shape()
  const points = 10

  for (let i = 0; i < points; i++) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.3,
    bevelSize: 0.03,
    bevelSegments: 3,
    curveSegments: 12,
  })
  geometry.center()
  geometry.computeVertexNormals()
  return geometry
}

/** Corazón extruido (icono de la tarjeta de comunidad). */
export function createHeartGeometry(size = 1, depth = 0.26) {
  const points: THREE.Vector2[] = []

  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2
    const x = 16 * Math.sin(a) ** 3
    const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)
    points.push(new THREE.Vector2((x * size) / 34, (-y * size) / 34))
  }

  const geometry = new THREE.ExtrudeGeometry(new THREE.Shape(points), {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.28,
    bevelSize: size * 0.045,
    bevelSegments: 4,
    curveSegments: 12,
  })
  geometry.center()
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Pinta un degradado vertical en los vértices (luz arriba, sombra abajo).
 * Es lo que da el volumen interno del estilo clay sobre superficies grandes.
 */
export function paintVerticalGradient(
  geometry: THREE.BufferGeometry,
  top: string,
  bottom: string,
) {
  const position = geometry.attributes.position
  const colors = new Float32Array(position.count * 3)
  geometry.computeBoundingBox()

  const { min, max } = geometry.boundingBox!
  const range = max.y - min.y || 1
  const high = new THREE.Color(top)
  const low = new THREE.Color(bottom)
  const mixed = new THREE.Color()

  for (let index = 0; index < position.count; index++) {
    const t = (position.getY(index) - min.y) / range
    const eased = t * t * (3 - 2 * t)
    mixed.copy(low).lerp(high, eased)
    colors[index * 3] = mixed.r
    colors[index * 3 + 1] = mixed.g
    colors[index * 3 + 2] = mixed.b
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geometry
}

/** Mejilla: esfera muy achatada, Rosa suave. */
export function createBlushGeometry(radius = 0.1) {
  const geometry = new THREE.SphereGeometry(radius, 28, 20)
  geometry.scale(1.35, 0.75, 0.3)
  return geometry
}
