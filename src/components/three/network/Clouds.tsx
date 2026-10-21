import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { iso } from './palette'

/**
 * Nubes esponjosas: racimos de esferas fusionadas en una única geometría
 * para no disparar el número de draw calls.
 */

/** Generador pseudoaleatorio determinista (evita que la escena "salte" al recargar). */
function seeded(seed: number) {
  let value = seed * 9301 + 49297
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

function buildCloudGeometry(seed: number) {
  const random = seeded(seed)
  const parts: THREE.BufferGeometry[] = []

  const blobs = 7 + Math.floor(random() * 4)
  for (let index = 0; index < blobs; index++) {
    const radius = 0.55 + random() * 0.55
    const geometry = new THREE.SphereGeometry(radius, 18, 14)
    const spread = 1.5
    geometry.translate((random() - 0.5) * spread * 2.2, random() * 0.5, (random() - 0.5) * spread * 0.9)
    parts.push(geometry)
  }

  // base plana: un stretched box redondeado que asienta la nube
  const base = new THREE.SphereGeometry(1.15, 18, 12)
  base.scale(1.25, 0.42, 0.72)
  base.translate(0, -0.22, 0)
  parts.push(base)

  const merged = mergeGeometries(parts, false)
  parts.forEach((part) => part.dispose())
  merged!.computeVertexNormals()
  return merged!
}

export function Clouds({ items }: { items: { position: [number, number, number]; scale: number; seed: number }[] }) {
  const geometries = useMemo(() => items.map((item) => buildCloudGeometry(item.seed)), [items])

  return (
    <group>
      {items.map((item, index) => (
        <mesh
          key={item.seed}
          geometry={geometries[index]}
          position={item.position}
          scale={item.scale}
        >
          <meshStandardMaterial color={iso.cloud} roughness={1} metalness={0} flatShading={false} />
        </mesh>
      ))}
    </group>
  )
}
