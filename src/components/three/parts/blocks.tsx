import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { palette } from '../../../lib/palette'
import { ClayMaterial } from './ClayMaterial'
import { createHeartGeometry, createStarGeometry } from './geometry'
import { Check3D } from './pieces'

/**
 * Piezas 3D pequeñas compartidas por las secciones laterales.
 * Todas son estáticas: se dibujan una sola vez (frameloop="demand").
 */

/* ------------------------------------------------------------------ */
/* Personas                                                            */
/* ------------------------------------------------------------------ */

export function Person3D({
  position,
  scale = 1,
  height = 1,
  color = palette.grape700,
  skin = '#f2c9a0',
  rotation = [0, 0, 0],
}: {
  position: [number, number, number]
  scale?: number
  height?: number
  color?: string
  skin?: string
  rotation?: [number, number, number]
}) {
  const bodyHeight = 0.52 * height

  return (
    <group position={position} scale={scale} rotation={rotation}>
      <RoundedBox args={[0.46, bodyHeight, 0.32]} radius={0.15} smoothness={5} position={[0, -bodyHeight / 2, 0]}>
        <meshPhysicalMaterial color={color} roughness={0.4} clearcoat={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.2, 0]} dispose={null}>
        <sphereGeometry args={[0.17, 24, 18]} />
        <meshPhysicalMaterial color={skin} roughness={0.5} clearcoat={0.45} />
      </mesh>
    </group>
  )
}

/** Barra suelta del gráfico (sin cabeza). */
export function ChartBar({
  position,
  height = 1,
  color = '#8b5cf6',
}: {
  position: [number, number, number]
  height?: number
  color?: string
}) {
  const bodyHeight = 0.52 * height
  return (
    <RoundedBox
      args={[0.44, bodyHeight, 0.3]}
      radius={0.14}
      smoothness={5}
      position={[position[0], position[1] - bodyHeight / 2, position[2]]}
    >
      <meshPhysicalMaterial color={color} roughness={0.42} clearcoat={0.55} />
    </RoundedBox>
  )
}

/** Grupo de comunidad: barras + cabezas + corazón. Tarjeta "71k". */
export function PeopleGroup() {
  const heart = useMemo(() => createHeartGeometry(0.52, 0.2), [])

  return (
    <group>
      <mesh geometry={heart} position={[0.02, 0.74, 0.34]} dispose={null}>
        <meshPhysicalMaterial color="#f43f5e" roughness={0.3} clearcoat={0.8} />
      </mesh>

      <ChartBar position={[-0.62, -0.06, -0.12]} height={1.05} color={palette.grape700} />
      <Person3D position={[-0.38, -0.06, 0.12]} height={1.35} color={palette.grape700} skin="#e8b98f" scale={0.9} />
      <Person3D position={[-0.08, -0.06, 0.3]} height={1.15} color={palette.grape500} skin="#f2c9a0" scale={0.92} />
      <Person3D position={[0.24, -0.06, 0.2]} height={0.9} color={palette.grape400} skin="#e0a878" scale={0.88} />
      <Person3D position={[0.54, -0.06, 0.02]} height={1.25} color="#f0abfc" skin="#f2c9a0" scale={0.88} />
      <ChartBar position={[0.78, -0.06, -0.16]} height={0.8} color={palette.grape500} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Persona con portátil e insignias: tarjeta "1.200"                   */
/* ------------------------------------------------------------------ */

export function BadgeDisc({
  position,
  color = '#f59e0b',
  ring = false,
  scale = 1,
}: {
  position: [number, number, number]
  color?: string
  ring?: boolean
  scale?: number
}) {
  return (
    <group position={position} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} dispose={null}>
        <cylinderGeometry args={[0.21, 0.21, 0.08, 32]} />
        <meshPhysicalMaterial color={color} roughness={0.32} clearcoat={1} />
      </mesh>
      {ring ? (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.06]} dispose={null}>
          <torusGeometry args={[0.1, 0.032, 12, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
      ) : (
        <mesh position={[0, 0.03, 0.06]} dispose={null}>
          <sphereGeometry args={[0.07, 16, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
      )}
    </group>
  )
}

export function LaptopUser() {
  return (
    <group>
      <Person3D position={[0, 0.2, -0.28]} color="#7c3aed" skin="#e0a878" scale={0.92} />

      {/* pantalla y base del portátil */}
      <RoundedBox args={[0.92, 0.56, 0.07]} radius={0.05} position={[0, -0.02, -0.06]} rotation={[-0.12, 0, 0]}>
        <meshPhysicalMaterial color={palette.plum700} roughness={0.3} clearcoat={1} />
      </RoundedBox>
      <RoundedBox args={[1.06, 0.09, 0.5]} radius={0.04} position={[0, -0.32, 0.2]} smoothness={4}>
        <meshPhysicalMaterial color="#a78bfa" roughness={0.3} clearcoat={1} />
      </RoundedBox>

      <BadgeDisc position={[-0.58, 0.24, 0.24]} color="#f59e0b" ring />
      <BadgeDisc position={[0.56, 0.34, 0.16]} color="#fbbf24" />
      <BadgeDisc position={[0.58, -0.14, 0.3]} color="#a78bfa" ring scale={0.85} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Apretón de manos: tarjeta "2.000"                                  */
/* ------------------------------------------------------------------ */

/** Apretón de manos detallado: brazos, puños y dedos. Tarjeta "2.000". */
export function Handshake3D() {
  return (
    <group>
      {/* antebrazos */}
      <RoundedBox args={[0.62, 0.3, 0.3]} radius={0.13} position={[-0.5, -0.12, 0]} rotation={[0, 0, 0.28]}>
        <ClayMaterial preset="purpleLight" />
      </RoundedBox>
      <RoundedBox args={[0.62, 0.3, 0.3]} radius={0.13} position={[0.5, -0.12, 0]} rotation={[0, 0, -0.28]}>
        <ClayMaterial preset="purpleLight" />
      </RoundedBox>

      {/* puños */}
      <RoundedBox args={[0.2, 0.26, 0.3]} radius={0.1} position={[-0.79, -0.26, 0]} rotation={[0, 0, 0.28]} smoothness={4}>
        <meshPhysicalMaterial color={palette.grape300} roughness={0.35} clearcoat={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.2, 0.26, 0.3]} radius={0.1} position={[0.79, -0.26, 0]} rotation={[0, 0, -0.28]} smoothness={4}>
        <meshPhysicalMaterial color={palette.grape300} roughness={0.35} clearcoat={0.7} />
      </RoundedBox>

      {/* manos entrelazadas */}
      <RoundedBox args={[0.58, 0.34, 0.38]} radius={0.16} position={[-0.04, -0.02, 0.06]} rotation={[0, 0, 0.34]}>
        <ClayMaterial preset="purple" />
      </RoundedBox>
      <RoundedBox args={[0.56, 0.32, 0.36]} radius={0.15} position={[0.06, 0.02, 0.1]} rotation={[0, 0, -0.4]}>
        <ClayMaterial preset="purpleDeep" />
      </RoundedBox>

      {/* dedos envolviendo el agarre */}
      {[-0.12, 0, 0.12].map((offset) => (
        <RoundedBox
          key={offset}
          args={[0.12, 0.3, 0.42]}
          radius={0.055}
          smoothness={4}
          position={[0.02 + offset * 0.4, 0.04, 0.16]}
          rotation={[0, 0, 0.3]}
        >
          <meshPhysicalMaterial color={palette.grape400} roughness={0.35} clearcoat={0.7} />
        </RoundedBox>
      ))}

      <Check3D position={[0, 0.72, 0.24]} scale={0.5} color={palette.lime500} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Documentos, monedas y burbujas                                      */
/* ------------------------------------------------------------------ */

/** Monedas apiladas (iconos de "Comprobantes de pago"). */
export function CoinStack({ position = [0, 0, 0], scale = 1 }: { position?: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          position={[index * 0.03, -0.16 + index * 0.15, index * 0.02]}
          rotation={[Math.PI / 2, 0, 0]}
          dispose={null}
        >
          <cylinderGeometry args={[0.29, 0.29, 0.13, 36]} />
          <meshPhysicalMaterial color={palette.lime500} roughness={0.28} clearcoat={1} />
        </mesh>
      ))}
      <mesh position={[0.06, 0.34, 0.04]} rotation={[Math.PI / 2, 0, 0]} dispose={null}>
        <cylinderGeometry args={[0.29, 0.29, 0.13, 36]} />
        <meshPhysicalMaterial color={palette.lime300} roughness={0.28} clearcoat={1} />
      </mesh>
    </group>
  )
}

/** Documento morado con renglones y sello verde opcional. */
export function DocumentCard({
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
  withCheck = false,
}: {
  position?: [number, number, number]
  scale?: number
  rotation?: [number, number, number]
  withCheck?: boolean
}) {
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <RoundedBox args={[0.86, 1.06, 0.14]} radius={0.12} smoothness={6}>
        <ClayMaterial preset="purple" />
      </RoundedBox>
      <RoundedBox args={[0.6, 0.07, 0.04]} radius={0.035} position={[-0.06, 0.24, 0.09]} smoothness={3}>
        <meshStandardMaterial color={palette.grape200} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.6, 0.07, 0.04]} radius={0.035} position={[-0.06, 0.06, 0.09]} smoothness={3}>
        <meshStandardMaterial color={palette.grape300} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.36, 0.07, 0.04]} radius={0.035} position={[-0.18, -0.12, 0.09]} smoothness={3}>
        <meshStandardMaterial color={palette.grape200} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.36, 0.12, 0.05]} radius={0.06} position={[0.1, -0.3, 0.09]} smoothness={4}>
        <meshStandardMaterial color={palette.lime500} roughness={0.35} />
      </RoundedBox>

      {withCheck && (
        <>
          <mesh position={[0.3, 0.42, 0.12]} rotation={[Math.PI / 2, 0, 0]} dispose={null}>
            <cylinderGeometry args={[0.2, 0.2, 0.1, 32]} />
            <ClayMaterial preset="limeDeep" />
          </mesh>
          <Check3D position={[0.3, 0.42, 0.19]} scale={0.24} color="#f2fff4" />
        </>
      )}
    </group>
  )
}

/** Burbuja de chat verde con puntitos. */
export function ChatBubble({
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number]
  scale?: number
  rotation?: [number, number, number]
}) {
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <RoundedBox args={[0.5, 0.34, 0.12]} radius={0.12} smoothness={6}>
        <meshPhysicalMaterial color={palette.lime500} roughness={0.3} clearcoat={1} />
      </RoundedBox>
      {[-0.13, 0, 0.13].map((x) => (
        <mesh key={x} position={[x, 0, 0.08]} dispose={null}>
          <sphereGeometry args={[0.035, 12, 10]} />
          <meshStandardMaterial color={palette.plum800} roughness={0.4} />
        </mesh>
      ))}
    </group>
  )
}

/** Estrella decorativa. */
export function Star3D({
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
  color = '#f472b6',
}: {
  position?: [number, number, number]
  scale?: number
  rotation?: [number, number, number]
  color?: string
}) {
  const geometry = useMemo(() => createStarGeometry(0.4, 0.19, 0.14), [])
  return (
    <mesh geometry={geometry} position={position} scale={scale} rotation={rotation} dispose={null}>
      <meshPhysicalMaterial color={color} roughness={0.32} clearcoat={1} />
    </mesh>
  )
}

/** Asterisco decorativo (re-exportado desde pieces para evitar importaciones circulares). */
export { Asterisk3D } from './pieces'
