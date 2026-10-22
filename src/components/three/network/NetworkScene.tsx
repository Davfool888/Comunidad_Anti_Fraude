import { memo, useEffect, useMemo, useRef } from 'react'
import { OrthographicCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Community, CommunityNetwork } from '../../../data/networks'
import type { HousePoint } from '../../../data/houses'
import { Clouds } from './Clouds'
import { SecurityCore } from './Core'
import { Ground } from './Ground'
import { CORE_POSITION, CLOUDS, PEDESTAL_POSITION, PIPE_ROUTES, SHOPS } from './layout'
import type { ShopSpec } from './layout'
import { arrangeShops, buildClouds, buildRoutes, type Route } from './arrangement'
import { iso } from './palette'
import { Pedestal } from './Pedestal'
import { PipeNetwork } from './Pipes'
import { Shop } from './Shop'
import { VerifiedBadge } from './VerifiedBadge'

/**
 * Cámara isométrica: ortográfica con azimut 45° y elevación 35,26°.
 * Es la proyección que reproduce exactamente la referencia.
 */

/** Ancho (en unidades de mundo) que debe verse en horizontal. */
const VIEW_WIDTH = 27
/** Alto mínimo para que no se corten los edificios en pantallas estrechas. */
const VIEW_HEIGHT = 15.2
/** Altura del punto que se sitúa en el centro del encuadre. */
const TARGET_Y = 3.4

function IsoCamera({ target = [0, TARGET_Y, 0] }: { target?: [number, number, number] }) {
  const size = useThree((state) => state.size)
  const zoom = Math.min(size.width / VIEW_WIDTH, size.height / VIEW_HEIGHT)

  return (
    <OrthographicCamera
      makeDefault
      position={[target[0] + 30, target[1] + 30, target[2] + 30]}
      rotation={[-Math.PI / 4, 0.61548, Math.PI / 6]}
      zoom={zoom}
      near={-120}
      far={260}
    />
  )
}

/** Puntos de luz que recorren los tubos: representan el flujo de datos. */
function DataPulses({ routes }: { routes: Route[] }) {
  const group = useRef<THREE.Group>(null)
  const pulses = useMemo(
    () =>
      routes.map((route, index) => {
        const curve = new THREE.CatmullRomCurve3(
          route.points.map((point) => new THREE.Vector3(...point)),
          false,
          'catmullrom',
          0.35,
        )
        return { curve, offset: index * 0.19, color: route.inner }
      }),
    [routes],
  )

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()
    group.current?.children.forEach((child, index) => {
      const pulse = pulses[index]
      const t = (time * 0.16 + pulse.offset) % 1
      const point = pulse.curve.getPointAt(t)
      child.position.copy(point)
      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
      material.opacity = Math.sin(t * Math.PI) * 0.9
    })
  })

  return (
    <group ref={group}>
      {pulses.map((pulse, index) => (
        <mesh key={index}>
          <sphereGeometry args={[0.11, 12, 10]} />
          <meshBasicMaterial color={pulse.color} toneMapped={false} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/** Luces de acento del neón y del núcleo. */
function NeonLights() {
  return (
    <group>
      <pointLight position={[0, 3.2, 0]} intensity={22} distance={13} decay={2} color={iso.coreGlow} />
      <pointLight position={[0, 1.0, 0]} intensity={8} distance={9} decay={2} color={iso.coreCyan} />
      {/* sólo dos luces de acento: cada luz puntual se evalúa en cada píxel
          iluminado, y con muchas la escena se encarece mucho */}
      <pointLight position={[-9.1, 6.4, 4.6]} intensity={5} distance={7} decay={2} color={iso.neonOrange} />
      <pointLight position={[6.2, 6.0, -0.9]} intensity={5} distance={7} decay={2} color={iso.neonCyan} />
    </group>
  )
}

export const NetworkScene = memo(function NetworkScene({
  network,
  community,
  anchors,
}: {
  network?: CommunityNetwork
  community?: Community
  /** Casas reales donde están los comercios (OpenStreetMap). */
  anchors?: HousePoint[]
}) {
  // Los rótulos de las tiendas y el título del núcleo los aporta la red
  // comunitaria activa: al cambiar de barrio la escena se reetiqueta sola.
  // Además, cada comunidad **acomoda sus edificios de forma distinta**:
  // otro orden, otras posiciones, otros tipos de comercio y otros colores.
  // Cuando hay casas reales, cada edificio se planta sobre la vivienda
  // donde está el comercio, en su posición geográfica.
  const shops = useMemo(() => {
    if (!community) return SHOPS
    return arrangeShops(community, anchors)
  }, [community, anchors])

  // Sonda de desarrollo: permite comprobar desde la consola dónde se ha
  // plantado cada edificio y si usa su posición geográfica.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const target = window as unknown as Record<string, unknown>
    target.__shops = shops
  }, [shops])

  // rótulos heredados de la red (cuando no hay comunidad seleccionada)
  const labelled = useMemo(() => {
    if (community || !network) return shops
    return shops.map((shop, index) => {
      const commerce = network.commerce[index % network.commerce.length]
      return {
        ...shop,
        label: commerce?.label ?? shop.label,
        satisfaction: commerce?.satisfaction ?? shop.satisfaction,
      }
    })
  }, [shops, network, community])

  // los tubos de neón se calculan a partir de la posición real de cada edificio
  const routes = useMemo(
    () => (community ? buildRoutes(labelled, community.id) : PIPE_ROUTES),
    [labelled, community],
  )

  // las nubes se apartan para no tapar a los comercios del barrio
  const clouds = useMemo(() => buildClouds(labelled, CLOUDS), [labelled])

  const coreTitle = useMemo(() => {
    if (community) return `NÚCLEO DE\n${community.name.toUpperCase()}`
    if (!network) return 'NÚCLEO DE\nSEGURIDAD'
    return `NÚCLEO DE\n${network.neighborhood.toUpperCase()}`
  }, [network, community])

  const accent = network?.color

  return (
    <>
      <IsoCamera />

      {/* bruma suave: disuelve el borde lejano del suelo para que la rejilla
          parezca infinita y se funda con el cielo */}
      <fog attach="fog" args={['#c2d6f7', 66, 118]} />

      {/* Iluminación suave de estudio, acorde al look pastel */}
      <ambientLight intensity={0.38} color="#eef4ff" />
      <hemisphereLight args={['#dbe9ff', '#a8bfe2', 0.5]} />
      <directionalLight
        position={[12, 20, 10]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-far={80}
        shadow-bias={-0.0012}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-14, 12, -12]} intensity={0.42} color="#cddcff" />
      {/* relleno azul suave para toda la escena */}
      <directionalLight position={[-8, 6, 16]} intensity={0.5} color="#9fc6ff" />
      {/* rebote cálido: evita que los muros de estuco se vean grises */}
      <directionalLight position={[4, -6, 12]} intensity={0.32} color="#ffe9d4" />
      <NeonLights />

      {/* luces cálidas que emanan de los propios comercios */}
      {labelled.map((shop) => (
        <pointLight
          key={shop.id}
          position={[shop.position[0], 0.45, shop.position[2] + 1.9]}
          intensity={2.2}
          distance={4.6}
          decay={2}
          color={shop.color}
        />
      ))}

      <Ground />
      <Clouds items={clouds} />

      <PipeNetwork routes={routes} shops={labelled} />
      <DataPulses routes={routes} />

      {labelled.map((shop) => (
        // El grupo lleva el identificador del comercio: sirve para
        // inspeccionar la escena desde la consola y comprobar que cada
        // edificio está sobre su coordenada. La posición la aplica el
        // propio edificio.
        <group key={shop.id} name={shop.id}>
          <Shop shop={shop} />
        </group>
      ))}

      <Pedestal position={PEDESTAL_POSITION} accent={accent} />
      <SecurityCoreWithBadges
        position={CORE_POSITION}
        title={coreTitle}
        shops={labelled}
        accent={accent}
      />
    </>
  )
})

/** Núcleo + los distintivos "COMERCIO VERIFICADO" flotando sobre cada tienda. */
function SecurityCoreWithBadges({
  position,
  title,
  shops,
  accent,
}: {
  position: [number, number, number]
  title: string
  shops: ShopSpec[]
  accent?: string
}) {
  // Cada distintivo flota por encima y a la izquierda de su comercio,
  // orientado hacia la cámara.
  const badges = shops.map((shop) => {
    const roofTop = shop.twoLevels ? 2.9 : 2.6
    return {
      id: shop.id,
      position: [
        shop.position[0] - 0.55,
        shop.position[1] + roofTop + 0.85,
        shop.position[2] + 1.15,
      ] as [number, number, number],
      satisfaction: shop.satisfaction,
    }
  })

  return (
    <group>
      <SecurityCore position={position} title={title} accent={accent} />
      {badges.map((badge) => (
        <VerifiedBadge
          key={badge.id}
          position={badge.position}
          satisfaction={badge.satisfaction}
        />
      ))}
    </group>
  )
}
