import { RoundedBox } from '@react-three/drei'
import { useMemo } from 'react'
import { palette } from '../../../lib/palette'
import { Stage } from '../Stage'
import { ClayMaterial } from '../parts/ClayMaterial'
import { Asterisk3D, ChatBubble, DocumentCard, Handshake3D, LaptopUser, PeopleGroup, Star3D } from '../parts/blocks'
import { createShieldGeometry } from '../parts/geometry'
import { Check3D, LockPiece } from '../parts/pieces'

/** Estadísticas: 71k — comunidad con corazón. */
export function CommunityScene({ className = '' }: { className?: string }) {
  return (
    <Stage cameraPosition={[0, 0, 4.3]} fov={34} className={className}>
      <PeopleGroup />
    </Stage>
  )
}

/** Estadísticas: 1.200 — comentaristas con portátil. */
export function CommentersScene({ className = '' }: { className?: string }) {
  return (
    <Stage cameraPosition={[0, 0, 4.3]} fov={34} className={className}>
      <LaptopUser />
    </Stage>
  )
}

/** Estadísticas: 2.000 — aporte de compuestos. */
export function DonationsScene({ className = '' }: { className?: string }) {
  return (
    <Stage cameraPosition={[0, 0, 4.3]} fov={34} className={className}>
      <Handshake3D />
    </Stage>
  )
}

/** Prevención educativa: tarjeta con escudo de check. */
export function PreventionScene({ className = '' }: { className?: string }) {
  const shield = useMemo(() => createShieldGeometry({ width: 0.86, height: 1.02, depth: 0.18, bevel: 0.06 }), [])

  return (
    <Stage cameraPosition={[0, 0, 4.3]} fov={34} className={className}>
      <DocumentCard position={[0.12, 0.06, -0.1]} scale={0.98} rotation={[0.04, -0.2, 0.05]} />

      <mesh geometry={shield} position={[-0.34, 0.3, 0.28]} rotation={[0.04, -0.2, -0.1]} dispose={null}>
        <meshPhysicalMaterial color="#fb7185" roughness={0.32} clearcoat={1} />
      </mesh>
      <Check3D position={[-0.34, 0.24, 0.42]} scale={0.2} color="#fff1f2" />

      <RoundedBox args={[0.44, 0.14, 0.07]} radius={0.07} position={[-0.06, -0.44, 0.3]} smoothness={4}>
        <meshPhysicalMaterial color={palette.lime500} roughness={0.3} clearcoat={1} />
      </RoundedBox>
    </Stage>
  )
}

/** Prevención educativa: comprobante de pago con burbuja y candado. */
export function EduPaymentScene({ className = '' }: { className?: string }) {
  return (
    <Stage cameraPosition={[0, 0, 4.3]} fov={34} className={className}>
      <RoundedBox args={[0.8, 1.02, 0.16]} radius={0.13} smoothness={6} position={[0.12, 0.02, 0]}>
        <ClayMaterial preset="purple" />
      </RoundedBox>
      <RoundedBox args={[0.56, 0.06, 0.04]} radius={0.03} position={[0.06, 0.22, 0.1]} smoothness={3}>
        <meshStandardMaterial color={palette.grape200} roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.36, 0.06, 0.04]} radius={0.03} position={[0.06, 0.06, 0.1]} smoothness={3}>
        <meshStandardMaterial color={palette.grape300} roughness={0.4} />
      </RoundedBox>

      {/* burbuja de chat */}
      <ChatBubble position={[-0.34, 0.5, 0.24]} scale={0.9} rotation={[0, 0.2, -0.12]} />

      {/* asterisco y estrella */}
      <Asterisk3D position={[-0.46, -0.16, 0.26]} scale={0.78} />
      <Star3D position={[0.72, 0.34, 0.14]} scale={0.7} color="#f0abfc" />

      {/* candado */}
      <group position={[0.66, -0.2, 0.24]} scale={0.62}>
        <LockPiece position={[0, 0, 0]} rotation={[0, 0, 0.12]} />
      </group>

      {/* botón verde */}
      <RoundedBox args={[0.4, 0.14, 0.07]} radius={0.07} position={[0.04, -0.36, 0.12]} smoothness={4}>
        <meshPhysicalMaterial color={palette.lime500} roughness={0.3} clearcoat={1} />
      </RoundedBox>
    </Stage>
  )
}

/** Bloque inferior "Escudo Inteligencia". */
export function EscudoInteligenciaScene({ className = '' }: { className?: string }) {
  return (
    <Stage cameraPosition={[0, 0, 4.4]} fov={34} className={className}>
      {/* tarjeta con líneas a la izquierda */}
      <RoundedBox args={[0.86, 0.54, 0.16]} radius={0.1} position={[-0.72, -0.1, 0]} rotation={[0, 0.16, 0.04]} smoothness={5}>
        <ClayMaterial preset="purpleLight" />
      </RoundedBox>
      <RoundedBox args={[0.56, 0.07, 0.04]} radius={0.035} position={[-0.74, 0.02, 0.1]} smoothness={3}>
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </RoundedBox>
      <RoundedBox args={[0.4, 0.07, 0.04]} radius={0.035} position={[-0.82, -0.14, 0.1]} smoothness={3}>
        <meshStandardMaterial color={palette.lime500} roughness={0.4} />
      </RoundedBox>

      {/* tarjeta con persona */}
      <RoundedBox args={[1.1, 1.06, 0.22]} radius={0.14} position={[0.24, 0.02, 0.2]} smoothness={6}>
        <ClayMaterial preset="purpleLight" />
      </RoundedBox>
      <mesh position={[0.24, 0.24, 0.34]} rotation={[Math.PI / 2, 0, 0]} dispose={null}>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 32]} />
        <ClayMaterial preset="purple" />
      </mesh>
      <RoundedBox args={[0.56, 0.4, 0.1]} radius={0.18} position={[0.24, -0.16, 0.34]} smoothness={5}>
        <ClayMaterial preset="purple" />
      </RoundedBox>

      {/* candado verde flotante */}
      <group position={[0.86, 0.72, 0.3]} scale={0.82}>
        <LockPiece position={[0, 0, 0]} rotation={[0.1, 0.2, -0.2]} />
      </group>
    </Stage>
  )
}
