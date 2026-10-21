import { RoundedBox } from '@react-three/drei'
import { palette } from '../../../lib/palette'
import { Stage } from '../Stage'
import { ClayMaterial, SoftGlow } from '../parts/ClayMaterial'
import { Check3D } from '../parts/pieces'

/** Icono 3D: Comprobante de pago (recibo morado con sello verde). */
export function PaymentScene({ className = '' }: { className?: string }) {
  return (
    <Stage cameraPosition={[0, 0, 3.35]} fov={36} className={className}>
      <SoftGlow position={[0, 0.05, -0.5]} scale={1.6} color="#6ee84a" opacity={0.8} />

      <group rotation={[0.04, -0.16, 0]}>
        <RoundedBox args={[1.08, 1.42, 0.3]} radius={0.17} smoothness={6}>
          <ClayMaterial preset="purple" />
        </RoundedBox>

        {/* renglones del recibo */}
        <RoundedBox args={[0.58, 0.08, 0.05]} radius={0.04} position={[-0.08, 0.36, 0.17]} smoothness={3}>
          <meshStandardMaterial color={palette.grape200} roughness={0.4} />
        </RoundedBox>
        <RoundedBox args={[0.58, 0.08, 0.05]} radius={0.04} position={[-0.08, 0.16, 0.17]} smoothness={3}>
          <meshStandardMaterial color={palette.grape300} roughness={0.4} />
        </RoundedBox>
        <RoundedBox args={[0.38, 0.08, 0.05]} radius={0.04} position={[-0.18, -0.04, 0.17]} smoothness={3}>
          <meshStandardMaterial color={palette.grape200} roughness={0.4} />
        </RoundedBox>

        {/* botón verde del comprobante */}
        <RoundedBox args={[0.5, 0.19, 0.07]} radius={0.095} position={[0.04, -0.34, 0.18]} smoothness={4}>
          <ClayMaterial preset="lime" />
        </RoundedBox>

        {/* sello verde con check */}
        <mesh position={[0.44, 0.54, 0.26]} rotation={[Math.PI / 2, 0, 0]} dispose={null}>
          <cylinderGeometry args={[0.3, 0.3, 0.12, 40]} />
          <ClayMaterial preset="limeDeep" />
        </mesh>
        <Check3D position={[0.44, 0.54, 0.34]} scale={0.36} color="#f2fff4" />
      </group>
    </Stage>
  )
}
