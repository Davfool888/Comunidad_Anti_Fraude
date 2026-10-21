import { RoundedBox } from '@react-three/drei'
import { palette } from '../../../lib/palette'
import { Stage } from '../Stage'
import { ClayMaterial } from '../parts/ClayMaterial'
import { CoinStack, DocumentCard, Star3D } from '../parts/blocks'
import { createShieldGeometry, createTriangleGeometry, paintVerticalGradient } from '../parts/geometry'
import { Check3D, LockPiece, PersonPiece, SmilingShield } from '../parts/pieces'
import { useMemo } from 'react'

/** "Inteligencia artificial": escudo con candado verde e insignias. */
export function AiShieldScene({ className = '' }: { className?: string }) {
  const shield = useMemo(
    () =>
      paintVerticalGradient(
        createShieldGeometry({ width: 1.5, height: 1.76, depth: 0.26, bevel: 0.08 }),
        '#6b3fd6',
        '#1f0738',
      ),
    [],
  )
  const alert = useMemo(() => createTriangleGeometry(0.34, 0.34, 0.16), [])

  return (
    <Stage cameraPosition={[0, 0, 4.1]} fov={34} className={className}>
      <mesh geometry={shield} position={[-0.12, 0.06, -0.34]} rotation={[0.04, -0.2, -0.08]} dispose={null}>
        <ClayMaterial preset="purpleDeep" vertexColors />
      </mesh>

      {/* candado verde al frente */}
      <group position={[-0.05, -0.12, 0.3]} scale={0.78}>
        <LockPiece position={[0, 0, 0]} rotation={[0, 0, -0.06]} />
      </group>

      {/* insignia de check */}
      <mesh position={[-0.72, 0.02, 0.26]} rotation={[Math.PI / 2, 0, 0]} dispose={null}>
        <cylinderGeometry args={[0.22, 0.22, 0.1, 32]} />
        <ClayMaterial preset="limeDeep" />
      </mesh>
      <Check3D position={[-0.72, 0.02, 0.33]} scale={0.26} color="#f2fff4" />

      {/* alerta verde */}
      <mesh geometry={alert} position={[0.44, 0.56, 0.24]} rotation={[0, 0, 0.2]} dispose={null}>
        <meshPhysicalMaterial color={palette.lime500} roughness={0.3} clearcoat={1} />
      </mesh>

      {/* tarjeta de persona */}
      <group position={[0.78, -0.24, 0.06]} scale={0.72}>
        <PersonPiece position={[0, 0, 0]} rotation={[0, -0.4, 0.2]} />
      </group>

      {/* esferas y estrella de acento */}
      <mesh position={[0.3, -0.62, 0.2]} dispose={null}>
        <sphereGeometry args={[0.09, 16, 12]} />
        <meshStandardMaterial color="#f472b6" roughness={0.4} />
      </mesh>
      <mesh position={[0.96, 0.34, 0.1]} dispose={null}>
        <sphereGeometry args={[0.07, 14, 12]} />
        <meshStandardMaterial color={palette.lime500} roughness={0.4} />
      </mesh>
      <Star3D position={[-0.34, 0.72, 0.22]} scale={0.56} rotation={[0, 0, 0.3]} color={palette.gold400} />
    </Stage>
  )
}

/** "Comprobantes de pago": documento con check y monedas. */
export function ReceiptScene({ className = '' }: { className?: string }) {
  return (
    <Stage cameraPosition={[0, 0, 4.1]} fov={34} className={className}>
      <DocumentCard position={[-0.16, 0.1, 0]} rotation={[0.06, -0.22, 0.06]} withCheck />
      <CoinStack position={[0.56, -0.42, 0.24]} scale={0.86} />

      <RoundedBox args={[0.3, 0.12, 0.06]} radius={0.06} position={[-0.6, -0.5, 0.16]} smoothness={4}>
        <meshPhysicalMaterial color={palette.grape300} roughness={0.35} clearcoat={1} />
      </RoundedBox>
    </Stage>
  )
}

/** "Prevención educativa": escudo sonriente rodeado de piezas. */
export function CheckWhatsappScene({ className = '' }: { className?: string }) {
  return (
    <Stage cameraPosition={[0, 0, 4.2]} fov={34} className={className}>
      <group scale={0.72}>
        <SmilingShield />
      </group>

      {/* tarjeta roja arriba a la izquierda */}
      <RoundedBox args={[0.44, 0.3, 0.09]} radius={0.06} position={[-0.6, 0.56, 0.3]} rotation={[0, 0.3, 0.2]} smoothness={4}>
        <meshPhysicalMaterial color="#ef4444" roughness={0.35} clearcoat={1} />
      </RoundedBox>

      {/* tarjeta morada con línea verde */}
      <RoundedBox args={[0.42, 0.52, 0.1]} radius={0.07} position={[0.68, 0.22, 0.16]} rotation={[0, -0.3, 0.12]} smoothness={4}>
        <ClayMaterial preset="purpleLight" />
      </RoundedBox>
      <RoundedBox args={[0.26, 0.055, 0.04]} radius={0.027} position={[0.68, 0.32, 0.23]} smoothness={3}>
        <meshStandardMaterial color={palette.lime500} roughness={0.4} />
      </RoundedBox>

      {/* check verde */}
      <mesh position={[-0.62, -0.3, 0.28]} rotation={[Math.PI / 2, 0, 0]} dispose={null}>
        <cylinderGeometry args={[0.19, 0.19, 0.09, 28]} />
        <ClayMaterial preset="limeDeep" />
      </mesh>
      <Check3D position={[-0.62, -0.3, 0.35]} scale={0.22} color="#f2fff4" />

      {/* candado */}
      <group position={[0.56, -0.5, 0.3]} scale={0.6}>
        <LockPiece position={[0, 0, 0]} rotation={[0, 0, 0.1]} />
      </group>
    </Stage>
  )
}
