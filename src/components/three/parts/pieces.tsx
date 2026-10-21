import { useMemo } from 'react'
import { Float, RoundedBox } from '@react-three/drei'
import { palette } from '../../../lib/palette'
import { ClayMaterial } from './ClayMaterial'
import {
  createCheckGeometry,
  createHandsetGeometry,
  createShieldGeometry,
  createSmileGeometry,
  createTriangleGeometry,
  handsetEndCaps,
  paintVerticalGradient,
} from './geometry'

/* ------------------------------------------------------------------ */
/* Escudo grande con cara                                              */
/* ------------------------------------------------------------------ */

export function SmilingShield({ scale = 1 }: { scale?: number }) {
  // degradado vertical pintado en los vértices: luz arriba, sombra profunda abajo
  const shield = useMemo(
    () => paintVerticalGradient(createShieldGeometry({ width: 2, height: 2.35 }), '#ab68f7', '#4c0f8e'),
    [],
  )
  const smile = useMemo(() => createSmileGeometry(1), [])

  return (
    <group scale={scale} rotation={[0.02, -0.06, -0.06]}>
      {/* cuerpo: violeta profundo pulido, con grano y brillo anisotrópico */}
      <mesh geometry={shield} position={[0, 0, 0]} dispose={null} castShadow>
        <ClayMaterial preset="purple" vertexColors anisotropy={0.6} roughness={0.34} clearcoat={0.85} />
      </mesh>

      {/* escudo interior apenas insinuado: suma profundidad sin aplanar el volumen */}
      <mesh geometry={shield} position={[0, -0.02, -0.13]} scale={[0.86, 0.88, 0.42]} dispose={null}>
        <meshPhysicalMaterial color="#c4b5fd" roughness={0.5} clearcoat={0.4} transparent opacity={0.16} />
      </mesh>

      {/* ojos */}
      <Eye x={-0.3} y={0.2} />
      <Eye x={0.3} y={0.2} />

      {/* mejillas */}
      <Blush x={-0.54} y={0.02} />
      <Blush x={0.54} y={0.02} />

      {/* boca con remates redondeados */}
      <group position={[0, -0.24, 0.2]} scale={0.82}>
        <mesh geometry={smile} dispose={null}>
          <ClayMaterial preset="ink" />
        </mesh>
        {[-0.27, 0.27].map((x) => (
          <mesh key={x} position={[x, 0.05, 0]} dispose={null}>
            <sphereGeometry args={[0.073, 16, 12]} />
            <ClayMaterial preset="ink" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Eye({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, 0.2]}>
      <mesh scale={[1, 1.08, 0.45]} dispose={null}>
        <sphereGeometry args={[0.115, 32, 24]} />
        <ClayMaterial preset="ink" roughness={0.5} />
      </mesh>
      {/* brillo especular del ojo */}
      <mesh position={[-0.038, 0.045, 0.062]} scale={0.2} dispose={null}>
        <sphereGeometry args={[0.115, 14, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

function Blush({ x, y }: { x: number; y: number }) {
  return (
    <mesh position={[x, y, 0.235]} rotation={[0, 0, 0.22]} scale={[1.25, 0.75, 0.3]} dispose={null}>
      <sphereGeometry args={[0.125, 24, 16]} />
      <meshStandardMaterial color="#ff6fa5" roughness={0.5} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/* Asterisco (campos de contraseña)                                    */
/* ------------------------------------------------------------------ */

export function Asterisk3D({
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, Math.PI / 6],
  color = '#c4b5fd',
}: {
  position?: [number, number, number]
  scale?: number
  rotation?: [number, number, number]
  color?: string
}) {
  return (
    <group position={position} scale={scale} rotation={rotation}>
      {[0, Math.PI / 3, (Math.PI * 2) / 3].map((angle) => (
        <RoundedBox key={angle} args={[0.56, 0.11, 0.09]} radius={0.055} smoothness={4} rotation={[0, 0, angle]}>
          <meshPhysicalMaterial color={color} roughness={0.32} clearcoat={1} />
        </RoundedBox>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Check 3D reutilizable                                              */
/* ------------------------------------------------------------------ */

export function Check3D({
  color = palette.lime500,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  color?: string
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
}) {
  const geometry = useMemo(() => createCheckGeometry(1, 0.16), [])
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geometry} dispose={null}>
        <meshPhysicalMaterial color={color} roughness={0.28} clearcoat={1} clearcoatRoughness={0.15} />
      </mesh>
      <mesh position={[-0.36, -0.02, 0]} dispose={null}>
        <sphereGeometry args={[0.16, 20, 16]} />
        <meshPhysicalMaterial color={color} roughness={0.28} clearcoat={1} />
      </mesh>
      <mesh position={[0.4, 0.34, 0]} dispose={null}>
        <sphereGeometry args={[0.16, 20, 16]} />
        <meshPhysicalMaterial color={color} roughness={0.28} clearcoat={1} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Auricular reutilizable                                              */
/* ------------------------------------------------------------------ */

export function Handset({
  color = '#f4fff6',
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  color?: string
  scale?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
}) {
  const geometry = useMemo(() => createHandsetGeometry(scale), [scale])
  const caps = useMemo(() => handsetEndCaps(scale), [scale])

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} dispose={null}>
        <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={1} clearcoatRoughness={0.15} />
      </mesh>
      {caps.map((cap, index) => (
        <mesh key={index} position={[cap[0], cap[1], 0]} dispose={null}>
          <sphereGeometry args={[0.122 * scale, 20, 16]} />
          <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={1} />
        </mesh>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Piezas flotantes del hero                                          */
/* ------------------------------------------------------------------ */

export function MailPiece({ position, rotation = [0, 0, 0] }: PieceProps) {
  const flap = useMemo(() => createTriangleGeometry(0.92, 0.4, 0.05), [])
  return (
    <Float speed={1.1} floatIntensity={0.35} rotationIntensity={0.25} position={position} rotation={rotation}>
      <RoundedBox args={[1.2, 0.86, 0.3]} radius={0.14} smoothness={5}>
        <ClayMaterial preset="purpleLight" />
      </RoundedBox>
      <mesh geometry={flap} position={[0, 0.14, 0.155]} rotation={[0, 0, Math.PI]} dispose={null}>
        <ClayMaterial preset="purple" />
      </mesh>
      {/* costura inferior del sobre */}
      <RoundedBox args={[0.9, 0.05, 0.04]} radius={0.025} position={[0, -0.3, 0.16]} smoothness={3}>
        <ClayMaterial preset="purple" />
      </RoundedBox>
    </Float>
  )
}

export function MessagePiece({ position, rotation = [0, 0, 0] }: PieceProps) {
  return (
    <Float speed={1.3} floatIntensity={0.4} rotationIntensity={0.3} position={position} rotation={rotation}>
      <RoundedBox args={[1.02, 0.66, 0.2]} radius={0.1} smoothness={5}>
        <ClayMaterial preset="purpleDeep" />
      </RoundedBox>
      <mesh position={[-0.18, 0.19, 0.13]} dispose={null}>
        <sphereGeometry args={[0.055, 16, 12]} />
        <meshStandardMaterial color="#f472b6" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.19, 0.13]} dispose={null}>
        <sphereGeometry args={[0.055, 16, 12]} />
        <meshStandardMaterial color="#a78bfa" roughness={0.4} />
      </mesh>
      <mesh position={[0.18, 0.19, 0.13]} dispose={null}>
        <sphereGeometry args={[0.055, 16, 12]} />
        <meshStandardMaterial color={palette.lime500} roughness={0.4} />
      </mesh>
      <RoundedBox args={[0.62, 0.075, 0.05]} radius={0.037} position={[0.08, 0, 0.13]} smoothness={3}>
        <meshStandardMaterial color={palette.lime500} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.4, 0.075, 0.05]} radius={0.037} position={[-0.08, -0.13, 0.13]} smoothness={3}>
        <meshStandardMaterial color={palette.grape400} roughness={0.4} />
      </RoundedBox>
    </Float>
  )
}

export function PersonPiece({ position, rotation = [0, 0, 0] }: PieceProps) {
  return (
    <Float speed={1.2} floatIntensity={0.32} rotationIntensity={0.22} position={position} rotation={rotation}>
      <RoundedBox args={[0.98, 0.6, 0.2]} radius={0.1} smoothness={5}>
        <ClayMaterial preset="purpleDeep" />
      </RoundedBox>
      <mesh position={[-0.25, 0.09, 0.14]} rotation={[Math.PI / 2, 0, 0]} dispose={null}>
        <cylinderGeometry args={[0.14, 0.14, 0.06, 32]} />
        <meshStandardMaterial color={palette.lime500} roughness={0.35} />
      </mesh>
      <RoundedBox args={[0.3, 0.16, 0.06]} radius={0.07} position={[-0.25, -0.13, 0.14]} smoothness={4}>
        <meshStandardMaterial color={palette.lime500} roughness={0.35} />
      </RoundedBox>
      <RoundedBox args={[0.34, 0.07, 0.05]} radius={0.035} position={[0.16, 0.06, 0.13]} smoothness={3}>
        <meshStandardMaterial color={palette.grape300} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.24, 0.07, 0.05]} radius={0.035} position={[0.07, -0.1, 0.13]} smoothness={3}>
        <meshStandardMaterial color={palette.lime500} roughness={0.4} />
      </RoundedBox>
    </Float>
  )
}

export function LockPiece({ position, rotation = [0, 0, 0] }: PieceProps) {
  return (
    <Float speed={1.4} floatIntensity={0.38} rotationIntensity={0.3} position={position} rotation={rotation}>
      <RoundedBox args={[0.66, 0.62, 0.44]} radius={0.13} smoothness={5}>
        <ClayMaterial preset="lime" />
      </RoundedBox>
      <mesh position={[0, 0.44, 0]} rotation={[0, 0, 0]} dispose={null}>
        <torusGeometry args={[0.21, 0.065, 14, 32, Math.PI]} />
        <meshStandardMaterial color="#ecfccf" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.24]} rotation={[Math.PI / 2, 0, 0]} dispose={null}>
        <cylinderGeometry args={[0.075, 0.075, 0.05, 24]} />
        <meshStandardMaterial color="#14532d" roughness={0.5} />
      </mesh>
      <RoundedBox args={[0.07, 0.16, 0.04]} radius={0.03} position={[0, -0.11, 0.24]} smoothness={3}>
        <meshStandardMaterial color="#14532d" roughness={0.5} />
      </RoundedBox>
    </Float>
  )
}

/** Ventana emergente con asteriscos de contraseña + sello de verificación. */
export function VerifiedPiece({ position, rotation = [0, 0, 0] }: PieceProps) {
  return (
    <Float speed={1.15} floatIntensity={0.3} rotationIntensity={0.24} position={position} rotation={rotation}>
      <RoundedBox args={[0.94, 0.58, 0.18]} radius={0.1} smoothness={5}>
        <ClayMaterial preset="purpleDeep" />
      </RoundedBox>

      {/* asteriscos de contraseña */}
      <Asterisk3D position={[-0.31, 0.03, 0.13]} scale={0.36} rotation={[0, 0, 0.2]} color="#f472b6" />
      <Asterisk3D position={[-0.14, 0.09, 0.13]} scale={0.32} rotation={[0, 0, -0.15]} color={palette.grape300} />
      <Asterisk3D position={[0.0, 0.02, 0.13]} scale={0.3} rotation={[0, 0, 0.35]} color={palette.lime500} />

      {/* sello verde de verificación */}
      <mesh position={[0.26, -0.09, 0.14]} rotation={[Math.PI / 2, 0, 0]} dispose={null}>
        <cylinderGeometry args={[0.2, 0.2, 0.08, 32]} />
        <ClayMaterial preset="lime" />
      </mesh>
      <Check3D position={[0.26, -0.09, 0.2]} scale={0.27} color="#1d3b16" />
    </Float>
  )
}

export function CreditCardPiece({ position, rotation = [0, 0, 0] }: PieceProps) {
  return (
    <Float speed={1.25} floatIntensity={0.3} rotationIntensity={0.28} position={position} rotation={rotation}>
      <RoundedBox args={[1.05, 0.66, 0.18]} radius={0.1} smoothness={5}>
        <ClayMaterial preset="purple" />
      </RoundedBox>
      <RoundedBox args={[0.62, 0.085, 0.04]} radius={0.04} position={[-0.1, 0.16, 0.12]} smoothness={3}>
        <meshStandardMaterial color={palette.lime500} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.62, 0.085, 0.04]} radius={0.04} position={[-0.1, 0.0, 0.12]} smoothness={3}>
        <meshStandardMaterial color={palette.grape300} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.38, 0.085, 0.04]} radius={0.04} position={[-0.23, -0.16, 0.12]} smoothness={3}>
        <meshStandardMaterial color={palette.grape200} roughness={0.4} />
      </RoundedBox>
    </Float>
  )
}

type PieceProps = {
  position: [number, number, number]
  rotation?: [number, number, number]
}
