import { RoundedBox } from '@react-three/drei'
import { Stage } from '../Stage'
import { ClayMaterial, SoftGlow } from '../parts/ClayMaterial'
import { Handset } from '../parts/pieces'

/** Icono 3D: WhatsApp (teléfono morado + burbuja verde con auricular). */
export function WhatsappScene({ className = '' }: { className?: string }) {
  return (
    <Stage cameraPosition={[0, 0, 3.4]} fov={36} className={className}>
      <SoftGlow position={[0.1, 0.12, -0.5]} scale={1.6} color="#6ee84a" opacity={0.85} />

      <group rotation={[0.05, -0.18, 0]}>
        <RoundedBox args={[1.2, 1.5, 0.32]} radius={0.18} smoothness={6}>
          <ClayMaterial preset="purple" />
        </RoundedBox>
        <RoundedBox args={[0.9, 1.06, 0.07]} radius={0.1} position={[0, -0.06, 0.18]} smoothness={4}>
          <ClayMaterial preset="screen" />
        </RoundedBox>

        {/* pestaña verde superior */}
        <RoundedBox args={[0.48, 0.14, 0.08]} radius={0.07} position={[0, 0.7, 0.17]} smoothness={4}>
          <ClayMaterial preset="lime" />
        </RoundedBox>

        {/* burbuja de chat */}
        <mesh position={[0.12, 0.08, 0.3]} rotation={[Math.PI / 2, 0, 0]} dispose={null}>
          <cylinderGeometry args={[0.46, 0.46, 0.16, 48]} />
          <ClayMaterial preset="limeDeep" />
        </mesh>
        <Handset color="#f4fff6" scale={0.68} position={[0.12, 0.08, 0.42]} rotation={[0, 0, -0.12]} />
      </group>
    </Stage>
  )
}
