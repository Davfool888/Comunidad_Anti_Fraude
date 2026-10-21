import type { TextTexture } from './textures'

/**
 * Plano con un texto dibujado en canvas.
 * El ancho se indica en unidades de mundo: la altura se calcula a partir de
 * la proporción real del canvas, así el texto nunca se deforma.
 */
export function SceneLabel({
  label,
  worldWidth,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  opacity = 1,
}: {
  label: TextTexture
  worldWidth: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  opacity?: number
}) {
  const worldHeight = worldWidth * (label.height / label.width)

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[worldWidth, worldHeight]} />
      <meshBasicMaterial
        map={label.texture}
        transparent
        opacity={opacity}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  )
}
