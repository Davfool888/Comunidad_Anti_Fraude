import * as THREE from 'three'

/**
 * Texturas procedurales (sin archivos externos) para dar el acabado pulido
 * del estilo Claymorphism: micro-grano en las superficies y halos radiales
 * para los resplandores dentro de la escena 3D.
 */

let grainTexture: THREE.CanvasTexture | null = null

/** Micro-grano: rompe la superficie plana y genera reflejos sutiles. */
export function getGrainTexture(): THREE.CanvasTexture {
  if (grainTexture) return grainTexture

  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')!
  const image = context.createImageData(size, size)

  for (let index = 0; index < image.data.length; index += 4) {
    // base clara (≈0.78): el mapa se multiplica por roughness, así que
    // se deja margen para que la superficie no quede demasiado pulida
    const value = 200 + (Math.random() - 0.5) * 70
    image.data[index] = value
    image.data[index + 1] = value
    image.data[index + 2] = value
    image.data[index + 3] = 255
  }

  context.putImageData(image, 0, 0)

  grainTexture = new THREE.CanvasTexture(canvas)
  grainTexture.wrapS = THREE.RepeatWrapping
  grainTexture.wrapT = THREE.RepeatWrapping
  grainTexture.repeat.set(4, 4)
  return grainTexture
}

let radialTexture: THREE.CanvasTexture | null = null

/** Degradado radial blanco → transparente: se usa como mapa de un halo. */
export function getRadialTexture(): THREE.CanvasTexture {
  if (radialTexture) return radialTexture

  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.6)')
  gradient.addColorStop(0.65, 'rgba(255,255,255,0.18)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')

  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)

  radialTexture = new THREE.CanvasTexture(canvas)
  return radialTexture
}
