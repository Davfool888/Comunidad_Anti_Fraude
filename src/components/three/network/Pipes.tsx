import { useMemo } from 'react'
import * as THREE from 'three'
import type { ShopSpec } from './layout'
import { iso, hot } from './palette'

/**
 * Conexiones de neón: cada ruta es un tubo translúcido (envoltura fría)
 * con un núcleo luminoso que recorre un degradado de color y bloques de
 * datos fluyendo por su interior.
 */

type Route = {
  id: string
  inner: string
  shell: string
  /** Grosor relativo del conducto. */
  weight?: number
  points: [number, number, number][]
}

/**
 * Textura de degradado a lo largo del tubo.
 * En `TubeGeometry` la coordenada `u` recorre la longitud del tubo, así que
 * un lienzo 1D basta para pintar el degradado de un color a otro.
 */
function useGradientTexture(from: string, to: string) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 1
    const context = canvas.getContext('2d')!

    const gradient = context.createLinearGradient(0, 0, 128, 0)
    gradient.addColorStop(0, from)
    gradient.addColorStop(0.55, to)
    gradient.addColorStop(1, from)
    context.fillStyle = gradient
    context.fillRect(0, 0, 128, 1)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.needsUpdate = true
    return texture
  }, [from, to])
}

/** Color caliente: el mismo tono pasado a blanco (núcleo incandescente). */
function paleColor(hex: string) {
  return `#${new THREE.Color(hex).lerp(new THREE.Color('#fff6e6'), 0.28).getHexString()}`
}

function buildCurve(points: [number, number, number][]) {
  const vectors = points.map((point) => new THREE.Vector3(...point))
  const curve = new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.5)
  const tubularSegments = Math.max(64, points.length * 30)
  return { curve, tubularSegments }
}

/** Anillo decorativo en los puntos de unión de los tubos. */
function Joint({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <torusGeometry args={[0.24, 0.055, 12, 28]} />
        <meshBasicMaterial color={hot(color, 1.8)} toneMapped={false} transparent opacity={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.115, 14, 12]} />
        <meshBasicMaterial color={hot('#ffffff', 1.7)} toneMapped={false} transparent opacity={0.95} />
      </mesh>
    </group>
  )
}

export function NeonPipe({ route }: { route: Route }) {
  const { curve, tubularSegments } = useMemo(() => buildCurve(route.points), [route.points])

  const weight = route.weight ?? 1
  const radius = 0.19 * weight

  const shellGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, tubularSegments, radius, 16, false),
    [curve, tubularSegments, radius],
  )
  const coreGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, tubularSegments, radius * 0.6, 14, false),
    [curve, tubularSegments, radius],
  )
  const filamentGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, tubularSegments, radius * 0.26, 10, false),
    [curve, tubularSegments, radius],
  )
  const glowGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, tubularSegments, radius * 2.3, 12, false),
    [curve, tubularSegments, radius],
  )

  const gradient = useGradientTexture(route.inner, paleColor(route.inner))

  return (
    <group>
      {/* resplandor exterior difuso */}
      <mesh geometry={glowGeometry}>
        <meshBasicMaterial
          color={hot(route.shell, 1.15)}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      {/* envoltura de cristal.
          Sin `transmission`: ese material obliga a three.js a renderizar
          toda la escena otra vez en un búfer aparte en cada fotograma
          (el pase de transmisión). Con transparencia y un brillo bajo el
          resultado es igual de vidrioso y la escena se dibuja una sola vez. */}
      <mesh geometry={shellGeometry}>
        <meshStandardMaterial
          color={route.shell}
          transparent
          opacity={0.32}
          roughness={0.08}
          metalness={0.18}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* núcleo luminoso con degradado */}
      <mesh geometry={coreGeometry}>
        <meshBasicMaterial
          map={gradient}
          color={new THREE.Color(1.35, 1.35, 1.35)}
          toneMapped={false}
        />
      </mesh>
      {/* filamento blanco incandescente en el eje del tubo */}
      <mesh geometry={filamentGeometry}>
        <meshBasicMaterial color={hot('#ffffff', 1.15)} toneMapped={false} />
      </mesh>

      {route.points.map((point, index) => (
        <Joint key={index} position={point} color={route.inner} />
      ))}
    </group>
  )
}

/** Conecta una tienda concreta con el núcleo, reutilizando rutas predefinidas. */
export function PipeNetwork({
  routes,
  shops,
}: {
  routes: Route[]
  shops: ShopSpec[]
}) {
  return (
    <group>
      {routes.map((route) => (
        <NeonPipe key={route.id} route={route} />
      ))}
      {/* pequeños nodos de enlace en la base de cada comercio */}
      {shops.map((shop) => (
        <mesh key={shop.id} position={[shop.position[0], 0.2, shop.position[2]]}>
          <cylinderGeometry args={[0.24, 0.3, 0.22, 20]} />
          <meshStandardMaterial color={iso.platformEdge} roughness={0.4} metalness={0.2} />
        </mesh>
      ))}
    </group>
  )
}
