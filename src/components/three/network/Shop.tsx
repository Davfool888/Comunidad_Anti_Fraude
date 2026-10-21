import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { ShopSpec } from './layout'
import { iso, type ShopStyle } from './palette'
import { SceneLabel } from './SceneLabel'
import { createTextTexture } from './textures'
import { Person } from './Person'

/**
 * Los cinco comercios de la red. Cada uno tiene **arquitectura propia**:
 * no comparten plantilla, sólo el lenguaje (bordes redondeados, marquesina
 * ondulada, rótulo de neón, props y figura).
 *
 * Orientación: el edificio NO lleva giro. Sus paredes son paralelas a los
 * ejes de la cuadrícula del suelo, de modo que la fachada (+Z) mira hacia
 * abajo-izquierda y el costadillo (+X) hacia abajo-derecha, tal y como
 * en la ilustración de referencia.
 */

const BASE_H = 0.28
/** Lado de la losa donde se apoya el comercio. */
const PLATFORM = 3.7

/* ------------------------------------------------------------------ */
/* Piezas compartidas                                                 */
/* ------------------------------------------------------------------ */

/**
 * Marquesina con festón inferior.
 *
 * Es un casquete cilíndrico abierto (sección de círculo) que arranca en la
 * pared y cae hacia fuera; el borde inferior lleva un festón de medias
 * lunas que reproduce el recorte ondulado de la referencia.
 */
function ScallopedAwning({
  width = 2.3,
  radius = 0.25,
  arc = 1.42,
  stripes = 9,
  colorA = '#ffffff',
  colorB = '#f4a2bd',
}: {
  width?: number
  radius?: number
  arc?: number
  stripes?: number
  colorA?: string
  colorB?: string
}) {
  const stripeWidth = width / stripes
  const frontY = -radius * Math.sin(arc)
  const frontZ = radius * (1 - Math.cos(arc))

  return (
    <group>
      {Array.from({ length: stripes }).map((_, index) => (
        <group key={index} position={[-width / 2 + stripeWidth * (index + 0.5), 0, 0]}>
          {/* casquete curvo: franjas alternas */}
          <mesh
            position={[0, -radius * Math.sin(arc), -radius * Math.cos(arc)]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry
              args={[radius, radius, stripeWidth * 0.99, 20, 1, true, 0, arc]}
            />
            <meshStandardMaterial
              color={index % 2 === 0 ? colorA : colorB}
              roughness={0.48}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* festón: media luna que continúa el borde ondulado */}
          <mesh position={[0, frontY, frontZ]} castShadow>
            <sphereGeometry args={[stripeWidth * 0.5, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <meshStandardMaterial
              color={index % 2 === 0 ? colorA : colorB}
              roughness={0.48}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Rótulo de neón sobre la cornisa. */
function NeonSign({
  label,
  plate,
  glow,
  width = 2.15,
}: {
  label: string
  plate: string
  glow: string
  width?: number
}) {
  const sign = useMemo(
    () =>
      createTextTexture(
        [
          {
            text: label,
            size: 34,
            color: iso.white,
            weight: 800,
            tracking: 0.4,
            glow,
            glowBlur: 15,
          },
        ],
        { padding: 18 },
      ),
    [label, glow],
  )

  const signHeight = width * 0.3

  return (
    <group>
      {/* placa del rótulo */}
      <RoundedBox args={[width, signHeight, 0.12]} radius={0.1} smoothness={5}>
        <meshStandardMaterial color={plate} roughness={0.4} emissive={plate} emissiveIntensity={0.3} />
      </RoundedBox>
      {/* borde luminoso */}
      <RoundedBox args={[width - 0.09, signHeight - 0.09, 0.14]} radius={0.07} smoothness={4}>
        <meshBasicMaterial color={plate} transparent opacity={0.3} depthWrite={false} />
      </RoundedBox>
      {/* texto */}
      <SceneLabel label={sign} worldWidth={width * 0.87} position={[0, 0, 0.08]} />
    </group>
  )
}

/** Losa base del comercio. */
function ShopBase({ size = PLATFORM, tint = iso.platform }: { size?: number; tint?: string }) {
  return (
    <group>
      <RoundedBox args={[size, BASE_H, size]} radius={0.13} smoothness={6} position={[0, BASE_H / 2, 0]}>
        <meshStandardMaterial color={tint} roughness={0.6} />
      </RoundedBox>
      <RoundedBox
        args={[size - 0.42, 0.15, size - 0.42]}
        radius={0.07}
        smoothness={4}
        position={[0, BASE_H + 0.05, 0]}
      >
        <meshStandardMaterial color={iso.platformEdge} roughness={0.62} />
      </RoundedBox>
    </group>
  )
}

/**
 * Tejado: losa blanda y gruesa con mucho vuelo, cornisa y corona clara.
 * Los radios generosos son lo que da el aspecto "soft pop" de la referencia.
 */
function ShopRoof({
  width,
  depth,
  y,
  color,
  soft,
  deep,
  overhang = 0.4,
  vent = true,
}: {
  width: number
  depth: number
  y: number
  color: string
  soft: string
  deep: string
  overhang?: number
  vent?: boolean
}) {
  return (
    <group>
      <RoundedBox
        args={[width + overhang, 0.4, depth + overhang]}
        radius={0.19}
        smoothness={10}
        position={[0, y + 0.2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={color} roughness={0.4} clearcoat={0.3} />
      </RoundedBox>
      {/* cornisa bajo el tejado */}
      <RoundedBox
        args={[width + overhang * 0.45, 0.13, depth + overhang * 0.45]}
        radius={0.06}
        smoothness={4}
        position={[0, y + 0.01, 0]}
      >
        <meshStandardMaterial color={deep} roughness={0.55} />
      </RoundedBox>
      {/* corona superior clara */}
      <RoundedBox
        args={[width + overhang + 0.18, 0.15, depth + overhang + 0.18]}
        radius={0.07}
        smoothness={8}
        position={[0, y + 0.46, 0]}
      >
        <meshPhysicalMaterial color={soft} roughness={0.46} clearcoat={0.24} />
      </RoundedBox>
      {vent && (
        <RoundedBox
          args={[0.3, 0.3, 0.3]}
          radius={0.12}
          smoothness={6}
          position={[width * 0.32, y + 0.6, -depth * 0.26]}
        >
          <meshStandardMaterial color={deep} roughness={0.55} />
        </RoundedBox>
      )}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Vegetación y props                                                 */
/* ------------------------------------------------------------------ */

/**
 * Árbol redondeado estilo "soft pop": tronco fino y copa de nubes solapadas.
 * Es la silueta que aparecen las copas de la referencia.
 */
function RoundTree({
  position,
  scale = 1,
  color = iso.leafMid,
  leaf = iso.leafLight,
  trunk = '#a9754f',
  tall = false,
}: {
  position: [number, number, number]
  scale?: number
  color?: string
  leaf?: string
  trunk?: string
  tall?: boolean
}) {
  const crownY = tall ? 1.15 : 0.78
  const crownR = tall ? 0.27 : 0.36

  return (
    <group position={position} scale={scale}>
      {/* tronco */}
      <mesh position={[0, crownY * 0.58, 0]}>
        <cylinderGeometry args={[0.055, 0.085, crownY * 1.16, 10]} />
        <meshStandardMaterial color={trunk} roughness={0.82} />
      </mesh>
      {/* copa: tres esferas solapadas */}
      <mesh position={[0, crownY, 0]} scale={[1, tall ? 1.3 : 0.95, 1]}>
        <sphereGeometry args={[crownR, 18, 14]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[crownR * 0.74, crownY - crownR * 0.36, 0.04]} scale={[0.8, 0.8, 0.8]}>
        <sphereGeometry args={[crownR, 16, 12]} />
        <meshStandardMaterial color={leaf} roughness={0.85} />
      </mesh>
      <mesh position={[-crownR * 0.68, crownY - crownR * 0.46, -0.05]} scale={[0.72, 0.72, 0.72]}>
        <sphereGeometry args={[crownR, 16, 12]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    </group>
  )
}

/** Arbusto bajo: matas de esferas pequeñas. */
function Bush({
  position,
  scale = 1,
  color = iso.leafDark,
  leaf = iso.leafMid,
}: {
  position: [number, number, number]
  scale?: number
  color?: string
  leaf?: string
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.16, 0]}>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0.14, 0.11, 0.06]} scale={[0.7, 0.7, 0.7]}>
        <sphereGeometry args={[0.2, 14, 10]} />
        <meshStandardMaterial color={leaf} roughness={0.85} />
      </mesh>
      <mesh position={[-0.13, 0.09, -0.05]} scale={[0.62, 0.62, 0.62]}>
        <sphereGeometry args={[0.2, 14, 10]} />
        <meshStandardMaterial color={leaf} roughness={0.85} />
      </mesh>
    </group>
  )
}

/** Mata de hierba:zamillas finas que rompen la superficie del suelo. */
function GrassTuft({
  position,
  scale = 1,
  color = iso.leafMid,
}: {
  position: [number, number, number]
  scale?: number
  color?: string
}) {
  const blades = [
    { x: 0, z: 0, r: 0.16, h: 0.2 },
    { x: 0.06, z: 0.04, r: -0.3, h: 0.15 },
    { x: -0.05, z: 0.05, r: 0.35, h: 0.17 },
  ]
  return (
    <group position={position} scale={scale}>
      {blades.map((blade, index) => (
        <mesh
          key={index}
          position={[blade.x, blade.h / 2, blade.z]}
          rotation={[0, 0, blade.r]}
        >
          <coneGeometry args={[0.025, blade.h, 6]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/** Maceta cilíndrica con suculenta de hojas redondeadas. */
function Succulent({
  position,
  scale = 1,
  leaf = iso.teal,
}: {
  position: [number, number, number]
  scale?: number
  leaf?: string
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.13, 0.11, 0.22, 16]} />
        <meshStandardMaterial color="#e9dccb" roughness={0.85} />
      </mesh>
      {[
        [0, 0.3, 0, 0.12],
        [0.08, 0.26, 0.03, 0.09],
        [-0.07, 0.27, -0.03, 0.095],
        [0.02, 0.38, -0.02, 0.075],
      ].map(([x, y, z, r], index) => (
        <mesh key={index} position={[x, y, z]} scale={[1, 0.85, 1]}>
          <sphereGeometry args={[r, 14, 12]} />
          <meshStandardMaterial color={index % 2 === 0 ? leaf : iso.tealDeep} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

/** Pizarra publicitaria de suelo (cartel tipo A-frame). */
function AFrameBoard({
  position,
  rotation = 0,
  color = iso.pinkDeep,
}: {
  position: [number, number, number]
  rotation?: number
  color?: string
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <group position={[0, 0.34, 0.06]} rotation={[-0.16, 0, 0]}>
        <RoundedBox args={[0.4, 0.54, 0.05]} radius={0.05} smoothness={4}>
          <meshStandardMaterial color={color} roughness={0.55} />
        </RoundedBox>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[0.31, 0.44]} />
          <meshBasicMaterial color="#fdf4e6" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.06, 0.05]}>
          <ringGeometry args={[0.07, 0.095, 20]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
      <group position={[0, 0.34, -0.06]} rotation={[0.16, 0, 0]}>
        <RoundedBox args={[0.4, 0.54, 0.05]} radius={0.05} smoothness={4}>
          <meshStandardMaterial color={color} roughness={0.55} />
        </RoundedBox>
      </group>
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} position={[x, 0.06, 0]}>
          <boxGeometry args={[0.03, 0.14, 0.26]} />
          <meshStandardMaterial color="#b98f63" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

/** Bandera sobre un poste, junto al escaparate. */
function BannerPole({
  position,
  color = iso.orange,
  rotation = 0,
}: {
  position: [number, number, number]
  color?: string
  rotation?: number
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 1.1, 8]} />
        <meshStandardMaterial color="#d8dfec" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0.12, 0.86, 0]}>
        <boxGeometry args={[0.2, 0.26, 0.02]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <mesh position={[0.12, 0.86, 0.015]}>
        <planeGeometry args={[0.12, 0.12]} />
        <meshBasicMaterial color={iso.white} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.1, 12]} />
        <meshStandardMaterial color="#c9d4ea" roughness={0.5} />
      </mesh>
    </group>
  )
}

/** Panel solar inclinado (detalle de las tiendas de electrónica). */
function SolarPanel({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={0.66}>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.64, 8]} />
        <meshStandardMaterial color="#aebbd2" roughness={0.4} metalness={0.5} />
      </mesh>
      <group position={[0, 0.68, 0]} rotation={[-0.62, 0, 0]}>
        <RoundedBox args={[0.62, 0.05, 0.46]} radius={0.03} smoothness={3}>
          <meshStandardMaterial color="#2f6fa8" roughness={0.18} metalness={0.6} />
        </RoundedBox>
        <mesh position={[0, 0.03, 0]}>
          <planeGeometry args={[0.56, 0.4]} />
          <meshBasicMaterial color="#6fc6f5" transparent opacity={0.5} />
        </mesh>
      </group>
    </group>
  )
}

/** Expositor de ropa: dos postes, barra y prendas colgadas. */
function ClothingRack({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const colors = ['#ff8fa3', '#ffd166', '#7ec8e3', '#b8a1f0', '#84d9a6']
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={0.78}>
      {[-0.72, 0.72].map((x) => (
        <mesh key={x} position={[x, 0.55, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.1, 8]} />
          <meshStandardMaterial color="#c9d4ea" roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 1.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.028, 0.028, 1.48, 8]} />
        <meshStandardMaterial color="#c9d4ea" roughness={0.4} metalness={0.4} />
      </mesh>
      {colors.map((color, index) => (
        <group key={color} position={[-0.55 + index * 0.28, 0.78, 0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.36, 6]} />
            <meshStandardMaterial color="#e6ecf7" roughness={0.6} />
          </mesh>
          <RoundedBox args={[0.2, 0.42, 0.09]} radius={0.05} smoothness={3} position={[0, -0.32, 0]}>
            <meshStandardMaterial color={color} roughness={0.62} />
          </RoundedBox>
        </group>
      ))}
    </group>
  )
}

/** Mostrador de madera con teclado y ratón (interior tecnológico). */
function TechDesk({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[1.15, 0.07, 0.62]} radius={0.03} smoothness={4} position={[0, 0.34, 0]}>
        <meshStandardMaterial color="#c9a175" roughness={0.72} />
      </RoundedBox>
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.17, 0]}>
          <boxGeometry args={[0.06, 0.34, 0.5]} />
          <meshStandardMaterial color="#b08a63" roughness={0.75} />
        </mesh>
      ))}
      {/* monitor retro */}
      <group position={[0.05, 0.38, -0.16]}>
        <RoundedBox args={[0.52, 0.38, 0.05]} radius={0.04} smoothness={4} position={[0, 0.26, 0]}>
          <meshStandardMaterial color="#2f3a55" roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, 0.26, 0.03]}>
          <planeGeometry args={[0.44, 0.3]} />
          <meshBasicMaterial color="#5cc6f2" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.035, 0.045, 0.1, 10]} />
          <meshStandardMaterial color="#2f3a55" roughness={0.4} />
        </mesh>
        <RoundedBox args={[0.26, 0.04, 0.18]} radius={0.015} smoothness={3} position={[0, 0.02, 0]}>
          <meshStandardMaterial color="#2f3a55" roughness={0.4} />
        </RoundedBox>
      </group>
      {/* teclado */}
      <RoundedBox args={[0.42, 0.035, 0.17]} radius={0.02} smoothness={3} position={[-0.08, 0.39, 0.16]}>
        <meshStandardMaterial color="#e8eef8" roughness={0.45} />
      </RoundedBox>
      {/* ratón */}
      <mesh position={[0.3, 0.4, 0.17]} scale={[1, 0.55, 1.4]}>
        <sphereGeometry args={[0.055, 14, 12]} />
        <meshStandardMaterial color="#e8eef8" roughness={0.45} />
      </mesh>
      {/* altavoces */}
      {[-0.78, 0.82].map((x) => (
        <group key={x} position={[x, 0.48, -0.05]}>
          <RoundedBox args={[0.22, 0.28, 0.22]} radius={0.05} smoothness={4}>
            <meshStandardMaterial color="#3a4763" roughness={0.45} />
          </RoundedBox>
          <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.03, 16]} />
            <meshStandardMaterial color="#6b7a9c" roughness={0.45} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** Torre de CPU vertical junto al escaparate. */
function CpuTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.22, 0.52, 0.24]} radius={0.035} smoothness={4} position={[0, 0.26, 0]}>
        <meshStandardMaterial color="#2b3448" roughness={0.35} />
      </RoundedBox>
      <mesh position={[0, 0.38, 0.125]}>
        <planeGeometry args={[0.15, 0.1]} />
        <meshBasicMaterial color="#5cc6f2" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.12, 0.125]}>
        <circleGeometry args={[0.035, 16]} />
        <meshBasicMaterial color="#7de3ff" toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Panel vertical de publicidad en la pared. */
function WallPoster({
  position,
  rotation = 0,
  color = '#2f3550',
}: {
  position: [number, number, number]
  rotation?: number
  color?: string
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[0.34, 0.56, 0.05]} radius={0.04} smoothness={4}>
        <meshStandardMaterial color={color} roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.06, 0.03]}>
        <planeGeometry args={[0.22, 0.22]} />
        <meshBasicMaterial color="#63c7f2" toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.16, 0.03]}>
        <planeGeometry args={[0.24, 0.07]} />
        <meshBasicMaterial color="#e8eef8" toneMapped={false} />
      </mesh>
    </group>
  )
}

/** Puesto de fruta y verdura del mercado gourmet. */
function ProduceStand({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const fruits = [
    { color: '#ef5d5d', offset: [-0.4, 0.42, 0.05] },
    { color: '#f7b32b', offset: [-0.12, 0.42, -0.08] },
    { color: '#79c94a', offset: [0.16, 0.42, 0.06] },
    { color: '#ef8f3d', offset: [0.42, 0.42, -0.05] },
    { color: '#e35b8c', offset: [-0.26, 0.56, 0.02] },
    { color: '#a8d24a', offset: [0.04, 0.58, 0.04] },
    { color: '#f7c53b', offset: [0.34, 0.58, 0.0] },
  ]
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={0.82}>
      <RoundedBox args={[1.25, 0.34, 0.78]} radius={0.08} smoothness={4} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#e7c39a" roughness={0.72} />
      </RoundedBox>
      <RoundedBox args={[1.3, 0.1, 0.84]} radius={0.05} smoothness={3} position={[0, 0.38, 0]}>
        <meshStandardMaterial color="#c9a175" roughness={0.75} />
      </RoundedBox>
      {fruits.map((fruit, index) => (
        <mesh key={index} position={fruit.offset as [number, number, number]}>
          <sphereGeometry args={[0.13, 16, 14]} />
          <meshStandardMaterial color={fruit.color} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Figuras                                                            */
/* ------------------------------------------------------------------ */

/** Aspecto de la figura que acompaña a cada tipo de comercio. */
const PERSON_LOOKS: Record<
  ShopStyle,
  { shirt: string; pants: string; skin: string; hair: string; pose: 'idle' | 'saludo' | 'camina' }
> = {
  fashion: { shirt: '#f27fa4', pants: '#e6e9f2', skin: '#f2c9a4', hair: '#5a3a2a', pose: 'saludo' },
  tech: { shirt: '#5f8fd6', pants: '#33436b', skin: '#e2b58c', hair: '#3a2b20', pose: 'idle' },
  services: { shirt: '#f0a63c', pants: '#2f3c60', skin: '#d8a279', hair: '#2c2119', pose: 'idle' },
  grocery: { shirt: '#f08a5d', pants: '#7fb3dd', skin: '#f5d0ae', hair: '#6b4630', pose: 'idle' },
  bakery: { shirt: '#e8b06a', pants: '#f3e7d4', skin: '#f0c8a2', hair: '#7a4a2c', pose: 'saludo' },
  pharmacy: { shirt: '#7fd6b4', pants: '#f2f5fb', skin: '#e8bd93', hair: '#33261c', pose: 'idle' },
  cafe: { shirt: '#d98b6a', pants: '#4a3f52', skin: '#f2c9a4', hair: '#4b3122', pose: 'camina' },
  florist: { shirt: '#b18cff', pants: '#f0e6f7', skin: '#f5d0ae', hair: '#8a5a3a', pose: 'saludo' },
  bookstore: { shirt: '#7d9fd6', pants: '#3b3f5c', skin: '#e2b58c', hair: '#3a2b20', pose: 'idle' },
  petshop: { shirt: '#ffc46b', pants: '#5b6b8c', skin: '#f0c8a2', hair: '#6b4630', pose: 'saludo' },
  optics: { shirt: '#6f8cff', pants: '#2f3c60', skin: '#d8a279', hair: '#2c2119', pose: 'idle' },
  stationery: { shirt: '#ff9dc0', pants: '#e6e9f2', skin: '#f5d0ae', hair: '#5a3a2a', pose: 'camina' },
}

/* ------------------------------------------------------------------ */
/* 1. Tienda de Moda — dos plantas, escaparate abierto a la izquierda  */
/* ------------------------------------------------------------------ */

function FashionShop({ shop }: { shop: ShopSpec }) {
  const look = PERSON_LOOKS.fashion
  const lowerH = 0.95
  const upperH = 1.3
  const front = 1.05

  return (
    <group position={shop.position}>
      <ShopBase tint={shop.platform} />

      {/* planta baja de estuco blanco */}
      <RoundedBox
        args={[2.5, lowerH, 2.1]}
           radius={0.44}
        smoothness={8}
        position={[0, BASE_H + lowerH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={iso.cream} roughness={0.58} clearcoat={0.2} />
      </RoundedBox>
      {/* zócalo rosa */}
      <RoundedBox
        args={[2.55, 0.22, 2.15]}
        radius={0.07}
        smoothness={4}
        position={[0, BASE_H + 0.13, 0]}
      >
        <meshStandardMaterial color={shop.color} roughness={0.6} />
      </RoundedBox>
      {/* escaparate abierto (izquierda) */}
      <RoundedBox
        args={[1.5, lowerH - 0.44, 0.12]}
        radius={0.06}
        smoothness={4}
        position={[-0.46, BASE_H + lowerH / 2, front + 0.02]}
      >
        <meshStandardMaterial color="#3d4463" roughness={0.9} />
      </RoundedBox>
      {/* puerta rosa (derecha) */}
      <RoundedBox
        args={[0.66, 0.94, 0.08]}
        radius={0.05}
        smoothness={4}
        position={[0.82, BASE_H + 0.49, front + 0.01]}
      >
        <meshStandardMaterial color={iso.pinkLight} roughness={0.5} />
      </RoundedBox>
      <RoundedBox
        args={[0.78, 1.04, 0.05]}
        radius={0.05}
        smoothness={4}
        position={[0.82, BASE_H + 0.49, front - 0.02]}
      >
        <meshStandardMaterial color={shop.color} roughness={0.55} />
      </RoundedBox>

      {/* marquesina ondulada rosa y blanca */}
      <group position={[0, BASE_H + lowerH - 0.1, front - 0.06]}>
        <ScallopedAwning width={2.6} colorA={shop.awning[0]} colorB={shop.awning[1]} />
      </group>

      {/* planta superior rosa, retranqueada */}
      <RoundedBox
        args={[2.3, upperH, 1.9]}
           radius={0.42}
        smoothness={8}
        position={[0, BASE_H + lowerH + upperH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={shop.wall} roughness={0.56} clearcoat={0.22} />
      </RoundedBox>

      {/* rótulo, en el borde derecho de la planta superior */}
      <group position={[0.5, BASE_H + lowerH + upperH - 0.34, 0.95 + 0.14]}>
        <NeonSign label={shop.label} plate={shop.signPlate} glow={shop.color} width={1.72} />
      </group>

      <ShopRoof
        width={2.3}
        depth={1.9}
        y={BASE_H + lowerH + upperH}
        color={shop.color}
        soft={shop.soft}
        deep={shop.deep}
        overhang={0.52}
      />

      {/* percha de ropa en el exterior, a la izquierda de la losa */}
      <ClothingRack position={[-1.28, BASE_H, 0.95]} rotation={0.22} />
      <Succulent position={[1.42, BASE_H, 0.9]} leaf={iso.leafMid} />
      <Succulent position={[-1.62, BASE_H, 1.35]} scale={0.8} leaf={iso.leafMid} />
      <Succulent position={[1.15, BASE_H, -0.75]} scale={0.75} leaf={iso.leafMint} />
      {/* arbolito y mata de hierba en el rincón trasero */}
      <RoundTree
        position={[-1.72, BASE_H, 0.9]}
        scale={0.72}
        color={iso.leafMid}
        leaf={iso.leafLight}
      />
      <GrassTuft position={[1.55, BASE_H, -0.95]} scale={1.1} color={iso.leafLight} />

      <Person
        position={[1.05, BASE_H, front + 0.55]}
        rotation={-2.4}
        scale={1.05}
        shirt={look.shirt}
        pants={look.pants}
        skin={look.skin}
        hair={look.hair}
        pose={look.pose}
      />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* 2-5. Electrónica — cubo con cubierta volada                        */
/* ------------------------------------------------------------------ */

function TechShop({ shop, open }: { shop: ShopSpec; open: boolean }) {
  const look = PERSON_LOOKS.tech
  const bodyH = 2.05
  const front = 1.05
  const signColor = shop.color

  return (
    <group position={shop.position}>
      <ShopBase tint={shop.platform} />

      {/* cuerpo */}
      <RoundedBox
        args={[2.5, bodyH, 2.1]}
        radius={0.46}
        smoothness={8}
        position={[0, BASE_H + bodyH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={shop.wall} roughness={0.56} clearcoat={0.2} />
      </RoundedBox>
      {/* zócalo del color de la cubierta */}
      <RoundedBox
        args={[2.55, 0.22, 2.15]}
        radius={0.07}
        smoothness={4}
        position={[0, BASE_H + 0.13, 0]}
      >
        <meshStandardMaterial color={signColor} roughness={0.6} />
      </RoundedBox>

      {open ? (
        /* escaparate abierto: el expositor se ve desde la calle */
        <RoundedBox
          args={[2.16, 1.42, 0.12]}
          radius={0.06}
          smoothness={4}
          position={[0, BASE_H + 0.74, front + 0.02]}
        >
          <meshStandardMaterial color="#3d4463" roughness={0.9} />
        </RoundedBox>
      ) : (
        /* ventanal cálido a la izquierda */
        <>
          <RoundedBox
            args={[0.92, 0.78, 0.1]}
            radius={0.06}
            smoothness={4}
            position={[-0.68, BASE_H + 1.05, front + 0.01]}
          >
            <meshStandardMaterial
              color="#ffe9a8"
              roughness={0.2}
              emissive="#ffcf6b"
              emissiveIntensity={0.7}
            />
          </RoundedBox>
          <RoundedBox
            args={[1.04, 0.9, 0.05]}
            radius={0.06}
            smoothness={4}
            position={[-0.68, BASE_H + 1.05, front - 0.02]}
          >
            <meshStandardMaterial color={signColor} roughness={0.6} />
          </RoundedBox>
        </>
      )}

      {/* marquesina ondulada sobre la mitad derecha */}
      <group position={[0.5, BASE_H + bodyH - 0.62, front - 0.06]}>
        <ScallopedAwning width={1.55} colorA={shop.awning[0]} colorB={shop.awning[1]} />
      </group>

      {/* rótulo en el borde izquierdo de la cubierta */}
      <group position={[-0.55, BASE_H + bodyH - 0.32, front + 0.16]}>
        <NeonSign label={shop.label} plate={shop.signPlate} glow={signColor} width={1.72} />
      </group>

      <ShopRoof
        width={2.5}
        depth={2.1}
        y={BASE_H + bodyH}
        color={signColor}
        soft={shop.soft}
        deep={shop.deep}
      />

      {open ? (
        /* ------- tienda amarilla: expositor tecnológico a la vista ------- */
        <group>
          <TechDesk position={[-0.15, BASE_H, front + 0.42]} rotation={0.1} />
          <CpuTower position={[-1.35, BASE_H, front + 0.3]} />
          <WallPoster position={[FOOTPRINT_X_HALF, BASE_H + 1.15, 0.35]} rotation={Math.PI / 2} color={shop.signPlate} />
          <Succulent position={[1.1, BASE_H + 0.42, front + 0.42]} scale={0.6} leaf={iso.leafMint} />
          <Bush position={[1.85, BASE_H, 0.55]} scale={0.78} color={iso.leafDark} leaf={iso.leafMid} />
        </group>
      ) : (
        /* ------- tienda naranja: banderola y pizarra ------- */
        <group>
          <BannerPole position={[1.5, BASE_H, front + 0.15]} color={signColor} rotation={-0.3} />
          <AFrameBoard position={[-1.45, BASE_H, front + 0.2]} rotation={0.5} color={shop.signPlate} />
          <SolarPanel position={[-1.55, BASE_H, -0.5]} rotation={0.5} />
          <Succulent position={[-1.28, BASE_H, front + 0.5]} scale={0.85} leaf={iso.leafLight} />
          <GrassTuft position={[1.62, BASE_H, -0.7]} scale={1} color={iso.leafMid} />
        </group>
      )}

      <Person
        position={[0.72, BASE_H, front + 0.52]}
        rotation={-2.4}
        scale={1.05}
        shirt={look.shirt}
        pants={look.pants}
        skin={look.skin}
        hair={look.hair}
        pose={look.pose}
      />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Servicios Profesionales — dos plantas y ventanas verticales      */
/* ------------------------------------------------------------------ */

function ServicesShop({ shop }: { shop: ShopSpec }) {
  const look = PERSON_LOOKS.services
  const lowerH = 0.95
  const upperH = 1.5
  const front = 1.05
  const upperX = 2.3
  const upperZ = 1.9

  return (
    <group position={shop.position}>
      <ShopBase tint={shop.platform} />

      {/* planta baja de estuco */}
      <RoundedBox
        args={[2.5, lowerH, 2.1]}
           radius={0.44}
        smoothness={8}
        position={[0, BASE_H + lowerH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={iso.cream} roughness={0.58} clearcoat={0.2} />
      </RoundedBox>
      <RoundedBox
        args={[2.55, 0.22, 2.15]}
        radius={0.07}
        smoothness={4}
        position={[0, BASE_H + 0.13, 0]}
      >
        <meshStandardMaterial color={shop.color} roughness={0.6} />
      </RoundedBox>
      {/* puerta de cristal bajo el dintel */}
      <RoundedBox
        args={[0.68, 0.9, 0.08]}
        radius={0.05}
        smoothness={4}
        position={[0, BASE_H + 0.47, front + 0.01]}
      >
        <meshStandardMaterial color={iso.glassDeep} roughness={0.12} emissive={iso.glass} emissiveIntensity={0.4} />
      </RoundedBox>
      <RoundedBox
        args={[0.8, 1.02, 0.05]}
        radius={0.05}
        smoothness={4}
        position={[0, BASE_H + 0.47, front - 0.02]}
      >
        <meshStandardMaterial color={shop.color} roughness={0.55} />
      </RoundedBox>

      {/* marquesina ondulada violeta y blanca */}
      <group position={[0, BASE_H + lowerH - 0.1, front - 0.06]}>
        <ScallopedAwning width={2.1} colorA={shop.awning[0]} colorB={shop.awning[1]} />
      </group>

      {/* planta superior violeta, más alta */}
      <RoundedBox
        args={[upperX, upperH, upperZ]}
        radius={0.42}
        smoothness={8}
        position={[0, BASE_H + lowerH + upperH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={shop.wall} roughness={0.55} clearcoat={0.22} />
      </RoundedBox>

      {/* ventanas verticales hundidas en el costadillo derecho */}
      {[-0.45, 0.45].map((z) => (
        <group key={z}>
          <RoundedBox
            args={[0.1, 0.72, 0.32]}
            radius={0.05}
            smoothness={4}
            position={[upperX / 2 - 0.01, BASE_H + lowerH + upperH / 2, z]}
          >
            <meshStandardMaterial color={iso.glassDeep} roughness={0.12} emissive={iso.glass} emissiveIntensity={0.45} />
          </RoundedBox>
          <RoundedBox
            args={[0.06, 0.84, 0.44]}
            radius={0.05}
            smoothness={4}
            position={[upperX / 2 - 0.04, BASE_H + lowerH + upperH / 2, z]}
          >
            <meshStandardMaterial color={iso.white} roughness={0.55} />
          </RoundedBox>
        </group>
      ))}

      {/* ventanas verticales en la fachada, a los lados del rótulo */}
      {[-0.88, 0.88].map((x) => (
        <group key={x}>
          <RoundedBox
            args={[0.3, 0.7, 0.1]}
            radius={0.05}
            smoothness={4}
            position={[x, BASE_H + lowerH + upperH / 2, upperZ / 2 - 0.01]}
          >
            <meshStandardMaterial color={iso.glassDeep} roughness={0.12} emissive={iso.glass} emissiveIntensity={0.45} />
          </RoundedBox>
          <RoundedBox
            args={[0.4, 0.82, 0.05]}
            radius={0.05}
            smoothness={4}
            position={[x, BASE_H + lowerH + upperH / 2, upperZ / 2 - 0.04]}
          >
            <meshStandardMaterial color={iso.white} roughness={0.55} />
          </RoundedBox>
        </group>
      ))}

      {/* rótulo en el borde izquierdo de la planta superior */}
      <group position={[-0.44, BASE_H + lowerH + upperH - 0.34, upperZ / 2 + 0.14]}>
        <NeonSign label={shop.label} plate={shop.signPlate} glow={shop.color} width={1.6} />
      </group>

      <ShopRoof
        width={upperX}
        depth={upperZ}
        y={BASE_H + lowerH + upperH}
        color={shop.color}
        soft={shop.soft}
        deep={shop.deep}
        overhang={0.48}
      />

      {/* árboles y arbustos flanqueando la entrada */}
      <RoundTree
        position={[-1.18, BASE_H, 1.55]}
        scale={1}
        tall
        color={iso.leafDark}
        leaf={iso.leafMid}
      />
      <Bush position={[1.6, BASE_H, 1.0]} scale={1.05} color={iso.leafDark} leaf={iso.leafMid} />
      <Bush position={[1.45, BASE_H, 1.55]} scale={0.78} color={iso.leafDark} leaf={iso.leafMint} />
      <RoundTree
        position={[-1.78, BASE_H, 0.45]}
        scale={0.72}
        color={iso.leafMid}
        leaf={iso.leafLight}
      />

      <Person
        position={[0.5, BASE_H, front + 0.5]}
        rotation={-2.4}
        scale={1.05}
        shirt={look.shirt}
        pants={look.pants}
        skin={look.skin}
        hair={look.hair}
        pose={look.pose}
      />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Mercado Gourmet — volumen blando, mostrador y árboles            */
/* ------------------------------------------------------------------ */

function GroceryShop({ shop }: { shop: ShopSpec }) {
  const look = PERSON_LOOKS.grocery
  const bodyH = 1.75
  const bodyX = 2.8
  const bodyZ = 2.1
  const front = bodyZ / 2

  return (
    <group position={shop.position}>
      <ShopBase tint={shop.platform} />

      {/* volumen muy redondeado, estilo arcilla */}
      <RoundedBox
        args={[bodyX, bodyH, bodyZ]}
        radius={0.52}
        smoothness={10}
        position={[0, BASE_H + bodyH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={shop.wall} roughness={0.55} clearcoat={0.22} />
      </RoundedBox>
      <RoundedBox
        args={[bodyX + 0.05, 0.24, bodyZ + 0.05]}
        radius={0.09}
        smoothness={5}
        position={[0, BASE_H + 0.14, 0]}
      >
        <meshStandardMaterial color={shop.color} roughness={0.6} />
      </RoundedBox>
      {/* interior oscuro a la derecha */}
      <RoundedBox
        args={[1.12, 0.98, 0.12]}
        radius={0.07}
        smoothness={4}
        position={[0.78, BASE_H + 0.52, front + 0.02]}
      >
        <meshStandardMaterial color="#33405c" roughness={0.9} />
      </RoundedBox>

      {/* marquesina ondulada coral y blanca */}
      <group position={[-0.25, BASE_H + bodyH - 0.12, front - 0.06]}>
        <ScallopedAwning width={2.1} colorA={shop.awning[0]} colorB={shop.awning[1]} />
      </group>

      {/* rótulo en el borde derecho de la cubierta */}
      <group position={[0.62, BASE_H + bodyH - 0.3, front + 0.2]}>
        <NeonSign label={shop.label} plate={shop.signPlate} glow={shop.color} width={1.6} />
      </group>

      <ShopRoof
        width={bodyX}
        depth={bodyZ}
        y={BASE_H + bodyH}
        color={shop.color}
        soft={shop.soft}
        deep={shop.deep}
        overhang={0.46}
      />

      {/* mostrador de fruta y verduras en el frente-izquierda */}
      <ProduceStand position={[-0.72, BASE_H, front + 0.4]} rotation={0.06} />
      {/* arboleda grande en la esquina delantera-izquierda, como en la referencia */}
      <RoundTree
        position={[-1.78, BASE_H, 0.72]}
        scale={1.45}
        color={iso.leafMid}
        leaf={iso.leafLight}
      />
      <RoundTree
        position={[-1.5, BASE_H, 1.55]}
        scale={1.1}
        color={iso.leafMint}
        leaf={iso.leafLight}
      />
      <RoundTree
        position={[-1.9, BASE_H, 1.2]}
        scale={0.85}
        color={iso.leafDark}
        leaf={iso.leafMint}
      />
      <Bush position={[-1.05, BASE_H, front + 0.95]} scale={0.78} color={iso.leafDark} leaf={iso.leafMid} />
      {/* pizarra de madera en el suelo */}
      <AFrameBoard position={[1.45, BASE_H, front + 0.5]} rotation={-0.45} color={iso.tealDeep} />
      <GrassTuft position={[1.72, BASE_H, -0.55]} scale={1.15} color={iso.leafLight} />

      <Person
        position={[1.18, BASE_H, front + 0.62]}
        rotation={-2.4}
        scale={1.05}
        shirt={look.shirt}
        pants={look.pants}
        skin={look.skin}
        hair={look.hair}
        pose={look.pose}
      />
    </group>
  )
}

/** Lado medio de la caja, usado para colocar paneles sobre la pared. */
const FOOTPRINT_X_HALF = 1.25

/* ------------------------------------------------------------------ */
/* Piezas de los edificios nuevos                                      */
/* ------------------------------------------------------------------ */

/** Bandeja de pan: tablón con hogazas doradas. */
function BreadShelf({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const loaves = ['#e8b06a', '#d99a52', '#f0c184']
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={0.8}>
      <RoundedBox args={[1.2, 0.12, 0.62]} radius={0.05} smoothness={3} position={[0, 0.34, 0]}>
        <meshStandardMaterial color="#c9a175" roughness={0.75} />
      </RoundedBox>
      {[-0.36, 0, 0.36].map((x, index) => (
        <mesh key={x} position={[x, 0.48, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.09, 0.2, 4, 10]} />
          <meshStandardMaterial color={loaves[index]} roughness={0.8} />
        </mesh>
      ))}
      {[-0.36, 0, 0.36].map((x, index) => (
        <mesh key={`b${x}`} position={[x, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.09, 0.2, 4, 10]} />
          <meshStandardMaterial color={loaves[(index + 1) % 3]} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

/** Maceta con flores: tiesto cónico, tallo y capullo. */
function FlowerPot({
  position,
  color = '#ff8fb0',
  scale = 1,
}: {
  position: [number, number, number]
  color?: string
  scale?: number
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.15, 0.11, 0.26, 14]} />
        <meshStandardMaterial color="#e0a487" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.016, 0.02, 0.3, 6]} />
        <meshStandardMaterial color={iso.leafDark} roughness={0.9} />
      </mesh>
      {[
        [-0.07, 0.5, 0.03],
        [0.06, 0.47, -0.02],
        [0, 0.56, 0.05],
      ].map((offset, index) => (
        <mesh key={index} position={offset as [number, number, number]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[0.085, 12, 10]} />
          <meshStandardMaterial color={index === 1 ? iso.lemonLight : color} roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

/** Mesa redonda de terraza con sombrilla. */
function CafeTable({
  position,
  umbrella = iso.coral,
  rotation = 0,
}: {
  position: [number, number, number]
  umbrella?: string
  rotation?: number
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.045, 0.06, 0.64, 10]} />
        <meshStandardMaterial color="#c9d4ea" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.08, 20]} />
        <meshStandardMaterial color="#f0e2cf" roughness={0.6} />
      </mesh>
      {/* sombrilla: cono sobre un poste */}
      <mesh position={[0, 1.06, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
        <meshStandardMaterial color="#d8dfec" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.48, 0]}>
        <coneGeometry args={[0.52, 0.34, 16]} />
        <meshStandardMaterial color={umbrella} roughness={0.62} />
      </mesh>
      {/* dos sillas */}
      {[-0.55, 0.55].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <RoundedBox args={[0.34, 0.08, 0.34]} radius={0.03} smoothness={3} position={[0, 0.3, 0]}>
            <meshStandardMaterial color="#e9dccb" roughness={0.7} />
          </RoundedBox>
          <RoundedBox args={[0.34, 0.4, 0.08]} radius={0.03} smoothness={3} position={[0, 0.5, -0.13]}>
            <meshStandardMaterial color="#e9dccb" roughness={0.7} />
          </RoundedBox>
        </group>
      ))}
    </group>
  )
}

/** Pila de libros de colores. */
function BookStack({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const colors = ['#e0668f', '#f0a63c', '#4aa3e0', '#7d55e0', '#3fb98c']
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={0.8}>
      {colors.map((color, index) => (
        <RoundedBox
          key={color}
          args={[0.52 - index * 0.02, 0.1, 0.36]}
          radius={0.03}
          smoothness={3}
          position={[index * 0.015, 0.05 + index * 0.1, 0]}
        >
          <meshStandardMaterial color={color} roughness={0.68} />
        </RoundedBox>
      ))}
    </group>
  )
}

/** Caseta de perro con tejado a dos aguas. */
function DogHouse({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={0.78}>
      <RoundedBox args={[0.8, 0.52, 0.7]} radius={0.1} smoothness={5} position={[0, 0.26, 0]}>
        <meshStandardMaterial color="#e8c9a4" roughness={0.85} />
      </RoundedBox>
      {/* tejado a dos aguas */}
      <mesh position={[0, 0.6, -0.18]} rotation={[0.6, 0, 0]}>
        <boxGeometry args={[0.9, 0.06, 0.46]} />
        <meshStandardMaterial color={iso.coralDeep} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.6, 0.18]} rotation={[-0.6, 0, 0]}>
        <boxGeometry args={[0.9, 0.06, 0.46]} />
        <meshStandardMaterial color={iso.coralDeep} roughness={0.7} />
      </mesh>
      {/* hueco de la caseta */}
      <mesh position={[0, 0.2, 0.36]}>
        <sphereGeometry args={[0.19, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3a3350" roughness={0.95} />
      </mesh>
    </group>
  )
}

/** Cuenco y pelota del petshop. */
function PetBowl({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.17, 0.12, 0.14, 16]} />
        <meshStandardMaterial color={iso.skyDeep} roughness={0.45} />
      </mesh>
      <mesh position={[0.32, 0.11, 0.1]}>
        <sphereGeometry args={[0.11, 14, 12]} />
        <meshStandardMaterial color={iso.lemon} roughness={0.55} />
      </mesh>
    </group>
  )
}

/** Rótulo de gafas: dos aros unidos por un puente. */
function GlassesMark({ position, color = iso.ink }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position} rotation={[0, 0, 0]}>
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.15, 0.035, 10, 22]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.035, 0.035]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  )
}

/** expositor de cuadernos y carpetas. */
function NotebookRack({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const colors = ['#f0a63c', '#4aa3e0', '#e0668f', '#7d55e0']
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={0.78}>
      <RoundedBox args={[0.9, 0.08, 0.4]} radius={0.04} smoothness={3} position={[0, 0.34, 0]}>
        <meshStandardMaterial color="#e3d7c2" roughness={0.8} />
      </RoundedBox>
      {colors.map((color, index) => (
        <mesh key={color} position={[-0.3 + index * 0.2, 0.52, 0]} rotation={[0, 0, -0.12 + index * 0.04]}>
          <boxGeometry args={[0.12, 0.3, 0.05]} />
          <meshStandardMaterial color={color} roughness={0.62} />
        </mesh>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* 6. Panadería — dos plantas, cúpula de horno y bandejas de pan      */
/* ------------------------------------------------------------------ */

function BakeryShop({ shop }: { shop: ShopSpec }) {
  const look = PERSON_LOOKS.bakery
  const lowerH = 1.05
  const upperH = 0.95
  const front = 1.05

  return (
    <group position={shop.position}>
      <ShopBase tint={shop.platform} />

      {/* planta baja de ladrillo pastel */}
      <RoundedBox
        args={[2.6, lowerH, 2.15]}
        radius={0.46}
        smoothness={8}
        position={[0, BASE_H + lowerH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={shop.wall} roughness={0.58} clearcoat={0.2} />
      </RoundedBox>
      <RoundedBox
        args={[2.65, 0.24, 2.2]}
        radius={0.08}
        smoothness={4}
        position={[0, BASE_H + 0.14, 0]}
      >
        <meshStandardMaterial color={shop.color} roughness={0.6} />
      </RoundedBox>
      {/* escaparate acristalado */}
      <RoundedBox
        args={[1.5, lowerH - 0.42, 0.12]}
        radius={0.06}
        smoothness={4}
        position={[-0.45, BASE_H + lowerH / 2, front + 0.02]}
      >
        <meshStandardMaterial color="#3d4463" roughness={0.9} />
      </RoundedBox>
      {/* puerta de madera */}
      <RoundedBox
        args={[0.62, 0.94, 0.08]}
        radius={0.05}
        smoothness={4}
        position={[0.86, BASE_H + 0.49, front + 0.01]}
      >
        <meshStandardMaterial color="#b5794c" roughness={0.6} />
      </RoundedBox>

      {/* marquesina a rayas */}
      <group position={[0, BASE_H + lowerH - 0.1, front - 0.06]}>
        <ScallopedAwning width={2.6} colorA={shop.awning[0]} colorB={shop.awning[1]} />
      </group>

      {/* planta superior más estrecha */}
      <RoundedBox
        args={[2.2, upperH, 1.8]}
        radius={0.4}
        smoothness={8}
        position={[0, BASE_H + lowerH + upperH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={shop.color} roughness={0.55} clearcoat={0.22} />
      </RoundedBox>

      {/* cúpula del horno */}
      <mesh position={[0.35, BASE_H + lowerH + upperH + 0.34, -0.15]} castShadow>
        <sphereGeometry args={[0.62, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color={shop.soft} roughness={0.5} clearcoat={0.3} />
      </mesh>
      {/* chimenea */}
      <mesh position={[-0.5, BASE_H + lowerH + upperH + 0.45, -0.2]}>
        <cylinderGeometry args={[0.11, 0.13, 0.7, 12]} />
        <meshStandardMaterial color={shop.deep} roughness={0.6} />
      </mesh>

      <group position={[0.45, BASE_H + lowerH + upperH - 0.3, front + 0.02]}>
        <NeonSign label={shop.label} plate={shop.signPlate} glow={shop.color} width={1.5} />
      </group>

      <ShopRoof
        width={2.2}
        depth={1.8}
        y={BASE_H + lowerH + upperH}
        color={shop.color}
        soft={shop.soft}
        deep={shop.deep}
        overhang={0.44}
        vent={false}
      />

      {/* bandejas de pan en el exterior */}
      <BreadShelf position={[-1.35, BASE_H, front + 0.35]} rotation={0.18} />
      <Succulent position={[1.5, BASE_H, 0.85]} leaf={iso.leafMid} />
      <Bush position={[1.6, BASE_H, -0.6]} scale={0.85} color={iso.leafDark} leaf={iso.leafMid} />
      <GrassTuft position={[-1.6, BASE_H, -0.8]} scale={1.05} color={iso.leafLight} />

      <Person
        position={[1.15, BASE_H, front + 0.6]}
        rotation={-2.4}
        scale={1.05}
        shirt={look.shirt}
        pants={look.pants}
        skin={look.skin}
        hair={look.hair}
        pose={look.pose}
      />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* 7. Farmacia — bloque limpio con cruz verde                          */
/* ------------------------------------------------------------------ */

function PharmacyShop({ shop }: { shop: ShopSpec }) {
  const look = PERSON_LOOKS.pharmacy
  const bodyH = 1.5
  const bodyX = 2.4
  const bodyZ = 2.0
  const front = bodyZ / 2

  return (
    <group position={shop.position}>
      <ShopBase tint={shop.platform} />

      <RoundedBox
        args={[bodyX, bodyH, bodyZ]}
        radius={0.48}
        smoothness={9}
        position={[0, BASE_H + bodyH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={shop.wall} roughness={0.54} clearcoat={0.24} />
      </RoundedBox>
      {/* banda de color a media altura */}
      <RoundedBox
        args={[bodyX + 0.04, 0.3, bodyZ + 0.04]}
        radius={0.1}
        smoothness={5}
        position={[0, BASE_H + 0.92, 0]}
      >
        <meshStandardMaterial color={shop.color} roughness={0.55} />
      </RoundedBox>
      {/* escaparate */}
      <RoundedBox
        args={[1.3, 0.72, 0.12]}
        radius={0.06}
        smoothness={4}
        position={[-0.4, BASE_H + 0.52, front + 0.02]}
      >
        <meshStandardMaterial color="#33405c" roughness={0.9} />
      </RoundedBox>
      {/* puerta de cristal */}
      <RoundedBox
        args={[0.66, 1.02, 0.08]}
        radius={0.05}
        smoothness={4}
        position={[0.82, BASE_H + 0.53, front + 0.01]}
      >
        <meshStandardMaterial color="#9fd8ef" roughness={0.35} />
      </RoundedBox>

      {/* cruz verde en la fachada */}
      <group position={[-0.85, BASE_H + 1.18, front + 0.06]}>
        <mesh>
          <boxGeometry args={[0.44, 0.13, 0.05]} />
          <meshStandardMaterial color={iso.green} roughness={0.5} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.13, 0.44, 0.05]} />
          <meshStandardMaterial color={iso.green} roughness={0.5} />
        </mesh>
      </group>

      <group position={[0.6, BASE_H + bodyH - 0.26, front + 0.16]}>
        <NeonSign label={shop.label} plate={shop.signPlate} glow={shop.color} width={1.45} />
      </group>

      <ShopRoof
        width={bodyX}
        depth={bodyZ}
        y={BASE_H + bodyH}
        color={shop.color}
        soft={shop.soft}
        deep={shop.deep}
        overhang={0.42}
      />

      {/* banco y macetas de la entrada */}
      <RoundedBox args={[0.9, 0.1, 0.3]} radius={0.05} smoothness={3} position={[-1.35, BASE_H + 0.3, front + 0.2]}>
        <meshStandardMaterial color="#c9a175" roughness={0.75} />
      </RoundedBox>
      {[-1.6, -1.15].map((x) => (
        <RoundedBox key={x} args={[0.08, 0.3, 0.28]} radius={0.03} smoothness={3} position={[x, BASE_H + 0.15, front + 0.2]}>
          <meshStandardMaterial color="#9fb0cc" roughness={0.5} metalness={0.3} />
        </RoundedBox>
      ))}
      <Succulent position={[1.45, BASE_H, 0.8]} leaf={iso.leafMid} />
      <RoundTree position={[1.55, BASE_H, -0.5]} scale={0.85} color={iso.leafMid} leaf={iso.leafLight} />
      <AFrameBoard position={[1.5, BASE_H, front + 0.55]} rotation={-0.5} color={shop.deep} />

      <Person
        position={[0.35, BASE_H, front + 0.7]}
        rotation={-2.2}
        scale={1.05}
        shirt={look.shirt}
        pants={look.pants}
        skin={look.skin}
        hair={look.hair}
        pose={look.pose}
      />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* 8. Cafetería — terraza con mesas y sombrillas                      */
/* ------------------------------------------------------------------ */

function CafeShop({ shop }: { shop: ShopSpec }) {
  const look = PERSON_LOOKS.cafe
  const bodyH = 1.35
  const bodyX = 2.2
  const bodyZ = 1.8
  const front = bodyZ / 2

  return (
    <group position={shop.position}>
      <ShopBase tint={shop.platform} />

      {/* volumen bajo y ancho */}
      <RoundedBox
        args={[bodyX, bodyH, bodyZ]}
        radius={0.5}
        smoothness={10}
        position={[0, BASE_H + bodyH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={shop.wall} roughness={0.56} clearcoat={0.2} />
      </RoundedBox>
      <RoundedBox
        args={[bodyX + 0.05, 0.2, bodyZ + 0.05]}
        radius={0.08}
        smoothness={5}
        position={[0, BASE_H + 0.12, 0]}
      >
        <meshStandardMaterial color={shop.deep} roughness={0.62} />
      </RoundedBox>
      {/* ventanal de la barra */}
      <RoundedBox
        args={[1.5, 0.66, 0.12]}
        radius={0.06}
        smoothness={4}
        position={[-0.25, BASE_H + 0.62, front + 0.02]}
      >
        <meshStandardMaterial color="#3d4463" roughness={0.9} />
      </RoundedBox>
      {/* mostrador saliente */}
      <RoundedBox args={[1.5, 0.14, 0.42]} radius={0.06} smoothness={4} position={[-0.25, BASE_H + 0.44, front + 0.22]}>
        <meshStandardMaterial color="#c9a175" roughness={0.72} />
      </RoundedBox>

      {/* marquesina */}
      <group position={[0, BASE_H + bodyH - 0.12, front - 0.04]}>
        <ScallopedAwning width={2.2} colorA={shop.awning[0]} colorB={shop.awning[1]} />
      </group>

      {/* rótulo colgante */}
      <group position={[0.42, BASE_H + bodyH - 0.32, front + 0.18]}>
        <NeonSign label={shop.label} plate={shop.signPlate} glow={shop.color} width={1.3} />
      </group>

      <ShopRoof
        width={bodyX}
        depth={bodyZ}
        y={BASE_H + bodyH}
        color={shop.color}
        soft={shop.soft}
        deep={shop.deep}
        overhang={0.5}
      />

      {/* terraza: dos mesas con sombrilla */}
      <CafeTable position={[-1.55, BASE_H, front + 0.5]} umbrella={shop.color} rotation={0.2} />
      <CafeTable position={[1.5, BASE_H, front + 0.25]} umbrella={iso.lemon} rotation={-0.3} />
      {/* guirnalda de luces entre la barra y el poste */}
      {[-0.6, -0.2, 0.2, 0.6].map((x, index) => (
        <mesh key={x} position={[x, BASE_H + 1.16 + (index % 2) * 0.04, front + 0.1]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshBasicMaterial color={iso.lemonLight} toneMapped={false} />
        </mesh>
      ))}
      <AFrameBoard position={[0.1, BASE_H, front + 0.75]} rotation={0.15} color={shop.deep} />
      <Bush position={[1.75, BASE_H, -0.5]} scale={0.9} color={iso.leafDark} leaf={iso.leafMid} />

      <Person
        position={[-0.9, BASE_H, front + 0.85]}
        rotation={-2.5}
        scale={1.05}
        shirt={look.shirt}
        pants={look.pants}
        skin={look.skin}
        hair={look.hair}
        pose={look.pose}
      />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* 9. Floristería — invernadero de cristal y macetas de flores        */
/* ------------------------------------------------------------------ */

function FloristShop({ shop }: { shop: ShopSpec }) {
  const look = PERSON_LOOKS.florist
  const bodyH = 1.1
  const bodyX = 2.4
  const bodyZ = 1.9
  const front = bodyZ / 2

  return (
    <group position={shop.position}>
      <ShopBase tint={shop.platform} />

      <RoundedBox
        args={[bodyX, bodyH, bodyZ]}
        radius={0.44}
        smoothness={9}
        position={[0, BASE_H + bodyH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={shop.wall} roughness={0.56} clearcoat={0.2} />
      </RoundedBox>
      <RoundedBox
        args={[bodyX + 0.04, 0.22, bodyZ + 0.04]}
        radius={0.08}
        smoothness={5}
        position={[0, BASE_H + 0.13, 0]}
      >
        <meshStandardMaterial color={shop.color} roughness={0.6} />
      </RoundedBox>
      {/* escaparate */}
      <RoundedBox
        args={[1.4, 0.6, 0.12]}
        radius={0.06}
        smoothness={4}
        position={[-0.4, BASE_H + 0.5, front + 0.02]}
      >
        <meshStandardMaterial color="#33405c" roughness={0.9} />
      </RoundedBox>

      {/* lucernario de cristal: cúpula acristalada sobre el tejado */}
      <mesh position={[0.55, BASE_H + bodyH + 0.42, -0.1]} scale={[1, 0.62, 0.85]} castShadow>
        <sphereGeometry args={[0.62, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={iso.glass}
          transparent
          opacity={0.45}
          roughness={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* montantes de la cúpula */}
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[0.55 + x, BASE_H + bodyH + 0.36, -0.1]}>
          <boxGeometry args={[0.05, 0.4, 0.95]} />
          <meshStandardMaterial color={shop.deep} roughness={0.55} />
        </mesh>
      ))}

      <group position={[0.55, BASE_H + bodyH - 0.34, front + 0.16]}>
        <NeonSign label={shop.label} plate={shop.signPlate} glow={shop.color} width={1.35} />
      </group>

      <ShopRoof
        width={bodyX}
        depth={bodyZ}
        y={BASE_H + bodyH - 0.02}
        color={shop.color}
        soft={shop.soft}
        deep={shop.deep}
        overhang={0.3}
        vent={false}
      />

      {/* macetas de flores en la entrada */}
      <FlowerPot position={[-1.5, BASE_H, front + 0.35]} color={iso.pink} />
      <FlowerPot position={[-1.05, BASE_H, front + 0.6]} color={iso.lemon} scale={0.85} />
      <FlowerPot position={[1.5, BASE_H, front + 0.3]} color={iso.lilac} />
      <FlowerPot position={[1.15, BASE_H, front + 0.62]} color={iso.coral} scale={0.8} />
      <RoundTree position={[-1.65, BASE_H, -0.2]} scale={0.9} color={iso.leafMid} leaf={iso.leafMint} />
      <GrassTuft position={[1.7, BASE_H, -0.7]} scale={1.1} color={iso.leafLight} />

      <Person
        position={[0.55, BASE_H, front + 0.7]}
        rotation={-2.3}
        scale={1.05}
        shirt={look.shirt}
        pants={look.pants}
        skin={look.skin}
        hair={look.hair}
        pose={look.pose}
      />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* 10. Librería — bloque alto con pila de libros y banco               */
/* ------------------------------------------------------------------ */

function BookstoreShop({ shop }: { shop: ShopSpec }) {
  const look = PERSON_LOOKS.bookstore
  const bodyH = 1.85
  const bodyX = 2.0
  const bodyZ = 1.9
  const front = bodyZ / 2

  return (
    <group position={shop.position}>
      <ShopBase tint={shop.platform} />

      <RoundedBox
        args={[bodyX, bodyH, bodyZ]}
        radius={0.44}
        smoothness={9}
        position={[0, BASE_H + bodyH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={shop.wall} roughness={0.57} clearcoat={0.2} />
      </RoundedBox>
      <RoundedBox
        args={[bodyX + 0.05, 0.24, bodyZ + 0.05]}
        radius={0.08}
        smoothness={5}
        position={[0, BASE_H + 0.14, 0]}
      >
        <meshStandardMaterial color={shop.color} roughness={0.6} />
      </RoundedBox>

      {/* ventanal alto con estanterías */}
      <RoundedBox
        args={[1.42, 1.1, 0.12]}
        radius={0.06}
        smoothness={4}
        position={[-0.2, BASE_H + 0.86, front + 0.02]}
      >
        <meshStandardMaterial color="#3d4463" roughness={0.9} />
      </RoundedBox>
      {[0.5, 0.86, 1.22].map((y) => (
        <RoundedBox
          key={y}
          args={[1.3, 0.07, 0.06]}
          radius={0.02}
          smoothness={2}
          position={[-0.2, BASE_H + y, front + 0.07]}
        >
          <meshStandardMaterial color={iso.lemonLight} roughness={0.6} />
        </RoundedBox>
      ))}
      {/* puerta */}
      <RoundedBox
        args={[0.6, 1.0, 0.08]}
        radius={0.05}
        smoothness={4}
        position={[0.72, BASE_H + 0.52, front + 0.01]}
      >
        <meshStandardMaterial color={shop.deep} roughness={0.5} />
      </RoundedBox>

      <group position={[0.42, BASE_H + bodyH - 0.28, front + 0.16]}>
        <NeonSign label={shop.label} plate={shop.signPlate} glow={shop.color} width={1.3} />
      </group>

      <ShopRoof
        width={bodyX}
        depth={bodyZ}
        y={BASE_H + bodyH}
        color={shop.color}
        soft={shop.soft}
        deep={shop.deep}
        overhang={0.46}
      />

      {/* pila de libros y banco de lectura */}
      <BookStack position={[-1.4, BASE_H, front + 0.3]} rotation={0.3} />
      <RoundedBox args={[0.9, 0.1, 0.34]} radius={0.05} smoothness={3} position={[1.45, BASE_H + 0.32, front + 0.35]}>
        <meshStandardMaterial color="#b5794c" roughness={0.72} />
      </RoundedBox>
      {[-0.36, 0.36].map((x) => (
        <RoundedBox key={x} args={[0.08, 0.32, 0.3]} radius={0.03} smoothness={3} position={[1.45 + x, BASE_H + 0.16, front + 0.35]}>
          <meshStandardMaterial color="#9fb0cc" roughness={0.5} metalness={0.3} />
        </RoundedBox>
      ))}
      <Succulent position={[1.6, BASE_H, -0.4]} leaf={iso.leafMid} />
      <Bush position={[-1.7, BASE_H, -0.5]} scale={0.85} color={iso.leafDark} leaf={iso.leafMid} />

      <Person
        position={[-1.05, BASE_H, front + 0.7]}
        rotation={-2.4}
        scale={1.05}
        shirt={look.shirt}
        pants={look.pants}
        skin={look.skin}
        hair={look.hair}
        pose={look.pose}
      />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* 11. Petshop — casita, cuenco y rótulo de hueso                     */
/* ------------------------------------------------------------------ */

function PetShop({ shop }: { shop: ShopSpec }) {
  const look = PERSON_LOOKS.petshop
  const bodyH = 1.25
  const bodyX = 2.3
  const bodyZ = 2.0
  const front = bodyZ / 2

  return (
    <group position={shop.position}>
      <ShopBase tint={shop.platform} />

      <RoundedBox
        args={[bodyX, bodyH, bodyZ]}
        radius={0.52}
        smoothness={10}
        position={[0, BASE_H + bodyH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={shop.wall} roughness={0.58} clearcoat={0.2} />
      </RoundedBox>
      <RoundedBox
        args={[bodyX + 0.05, 0.26, bodyZ + 0.05]}
        radius={0.09}
        smoothness={5}
        position={[0, BASE_H + 0.15, 0]}
      >
        <meshStandardMaterial color={shop.color} roughness={0.6} />
      </RoundedBox>
      {/* escaparate */}
      <RoundedBox
        args={[1.35, 0.6, 0.12]}
        radius={0.06}
        smoothness={4}
        position={[-0.4, BASE_H + 0.52, front + 0.02]}
      >
        <meshStandardMaterial color="#33405c" roughness={0.9} />
      </RoundedBox>
      {/* puerta con forma de hueso */}
      <RoundedBox
        args={[0.62, 0.98, 0.08]}
        radius={0.05}
        smoothness={4}
        position={[0.8, BASE_H + 0.51, front + 0.01]}
      >
        <meshStandardMaterial color={shop.deep} roughness={0.5} />
      </RoundedBox>

      <group position={[0.5, BASE_H + bodyH - 0.3, front + 0.16]}>
        <NeonSign label={shop.label} plate={shop.signPlate} glow={shop.color} width={1.4} />
      </group>

      <ShopRoof
        width={bodyX}
        depth={bodyZ}
        y={BASE_H + bodyH}
        color={shop.color}
        soft={shop.soft}
        deep={shop.deep}
        overhang={0.5}
      />

      {/* caseta, cuenco y bola */}
      <DogHouse position={[-1.55, BASE_H, front + 0.2]} rotation={0.25} />
      <PetBowl position={[1.4, BASE_H, front + 0.45]} />
      <RoundTree position={[1.6, BASE_H, -0.5]} scale={0.85} color={iso.leafMid} leaf={iso.leafLight} />
      <GrassTuft position={[-1.7, BASE_H, -0.6]} scale={1.1} color={iso.leafLight} />
      <AFrameBoard position={[0.15, BASE_H, front + 0.75]} rotation={0.1} color={shop.deep} />

      <Person
        position={[-0.9, BASE_H, front + 0.75]}
        rotation={-2.5}
        scale={1.05}
        shirt={look.shirt}
        pants={look.pants}
        skin={look.skin}
        hair={look.hair}
        pose={look.pose}
      />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* 12. Óptica — escaparate curvo y rótulo de gafas                    */
/* ------------------------------------------------------------------ */

function OpticsShop({ shop }: { shop: ShopSpec }) {
  const look = PERSON_LOOKS.optics
  const bodyH = 1.45
  const bodyX = 2.2
  const bodyZ = 1.9
  const front = bodyZ / 2

  return (
    <group position={shop.position}>
      <ShopBase tint={shop.platform} />

      <RoundedBox
        args={[bodyX, bodyH, bodyZ]}
        radius={0.48}
        smoothness={9}
        position={[0, BASE_H + bodyH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={shop.wall} roughness={0.5} clearcoat={0.3} />
      </RoundedBox>
      <RoundedBox
        args={[bodyX + 0.04, 0.22, bodyZ + 0.04]}
        radius={0.08}
        smoothness={5}
        position={[0, BASE_H + 0.13, 0]}
      >
        <meshStandardMaterial color={shop.color} roughness={0.55} />
      </RoundedBox>

      {/* escaparate curvo de cristal */}
      <mesh position={[-0.3, BASE_H + 0.62, front + 0.02]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 1.1, 20, 1, true, -0.9, 1.8]} />
        <meshPhysicalMaterial
          color={iso.glass}
          transparent
          opacity={0.55}
          roughness={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* expositor de gafas dentro */}
      <RoundedBox args={[0.9, 0.1, 0.36]} radius={0.04} smoothness={3} position={[-0.3, BASE_H + 0.5, front - 0.1]}>
        <meshStandardMaterial color="#efe6d8" roughness={0.65} />
      </RoundedBox>
      {/* puerta */}
      <RoundedBox
        args={[0.6, 0.98, 0.08]}
        radius={0.05}
        smoothness={4}
        position={[0.78, BASE_H + 0.51, front + 0.01]}
      >
        <meshStandardMaterial color={iso.glass} roughness={0.3} />
      </RoundedBox>

      <group position={[0.5, BASE_H + bodyH - 0.3, front + 0.16]}>
        <NeonSign label={shop.label} plate={shop.signPlate} glow={shop.color} width={1.2} />
      </group>
      {/* emblema de gafas sobre el rótulo */}
      <group position={[-0.75, BASE_H + bodyH - 0.26, front + 0.2]}>
        <GlassesMark position={[0, 0, 0]} color={shop.deep} />
      </group>

      <ShopRoof
        width={bodyX}
        depth={bodyZ}
        y={BASE_H + bodyH}
        color={shop.color}
        soft={shop.soft}
        deep={shop.deep}
        overhang={0.44}
      />

      <Succulent position={[1.45, BASE_H, front + 0.2]} leaf={iso.leafMid} />
      <BannerPole position={[1.55, BASE_H, front + 0.6]} color={shop.color} rotation={0.2} />
      <GrassTuft position={[-1.6, BASE_H, -0.7]} scale={1.05} color={iso.leafLight} />

      <Person
        position={[-1.0, BASE_H, front + 0.7]}
        rotation={-2.4}
        scale={1.05}
        shirt={look.shirt}
        pants={look.pants}
        skin={look.skin}
        hair={look.hair}
        pose={look.pose}
      />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* 13. Papelería — quiosco pequeño con expositor de cuadernos         */
/* ------------------------------------------------------------------ */

function StationeryShop({ shop }: { shop: ShopSpec }) {
  const look = PERSON_LOOKS.stationery
  const bodyH = 1.05
  const bodyX = 1.9
  const bodyZ = 1.7
  const front = bodyZ / 2

  return (
    <group position={shop.position}>
      <ShopBase tint={shop.platform} />

      <RoundedBox
        args={[bodyX, bodyH, bodyZ]}
        radius={0.4}
        smoothness={8}
        position={[0, BASE_H + bodyH / 2, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={shop.wall} roughness={0.58} clearcoat={0.2} />
      </RoundedBox>
      <RoundedBox
        args={[bodyX + 0.05, 0.2, bodyZ + 0.05]}
        radius={0.07}
        smoothness={5}
        position={[0, BASE_H + 0.12, 0]}
      >
        <meshStandardMaterial color={shop.color} roughness={0.6} />
      </RoundedBox>
      {/* mostrador con cristal */}
      <RoundedBox
        args={[1.5, 0.5, 0.12]}
        radius={0.06}
        smoothness={4}
        position={[0, BASE_H + 0.58, front + 0.02]}
      >
        <meshStandardMaterial color="#3d4463" roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[1.6, 0.12, 0.36]} radius={0.05} smoothness={4} position={[0, BASE_H + 0.36, front + 0.18]}>
        <meshStandardMaterial color="#e3d7c2" roughness={0.75} />
      </RoundedBox>

      {/* marquesina pequeña a rayas */}
      <group position={[0, BASE_H + bodyH - 0.08, front - 0.04]}>
        <ScallopedAwning width={2} colorA={shop.awning[0]} colorB={shop.awning[1]} stripes={7} />
      </group>

      <group position={[0.35, BASE_H + bodyH - 0.3, front + 0.16]}>
        <NeonSign label={shop.label} plate={shop.signPlate} glow={shop.color} width={1.15} />
      </group>

      <ShopRoof
        width={bodyX}
        depth={bodyZ}
        y={BASE_H + bodyH}
        color={shop.color}
        soft={shop.soft}
        deep={shop.deep}
        overhang={0.46}
      />

      <NotebookRack position={[-1.35, BASE_H, front + 0.3]} rotation={0.3} />
      <BookStack position={[1.4, BASE_H, front + 0.35]} rotation={-0.2} />
      <Succulent position={[1.4, BASE_H, -0.4]} leaf={iso.leafMid} />
      <Bush position={[-1.55, BASE_H, -0.45]} scale={0.8} color={iso.leafDark} leaf={iso.leafMid} />

      <Person
        position={[0.85, BASE_H, front + 0.7]}
        rotation={-2.3}
        scale={1.05}
        shirt={look.shirt}
        pants={look.pants}
        skin={look.skin}
        hair={look.hair}
        pose={look.pose}
      />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Fachada común                                                       */
/* ------------------------------------------------------------------ */

export function Shop({ shop }: { shop: ShopSpec }) {
  switch (shop.style) {
    case 'fashion':
      return <FashionShop shop={shop} />
    case 'tech':
      return <TechShop shop={shop} open={shop.open ?? false} />
    case 'services':
      return <ServicesShop shop={shop} />
    case 'grocery':
      return <GroceryShop shop={shop} />
    case 'bakery':
      return <BakeryShop shop={shop} />
    case 'pharmacy':
      return <PharmacyShop shop={shop} />
    case 'cafe':
      return <CafeShop shop={shop} />
    case 'florist':
      return <FloristShop shop={shop} />
    case 'bookstore':
      return <BookstoreShop shop={shop} />
    case 'petshop':
      return <PetShop shop={shop} />
    case 'optics':
      return <OpticsShop shop={shop} />
    case 'stationery':
      return <StationeryShop shop={shop} />
    default:
      return null
  }
}

