import { RoundedBox } from '@react-three/drei'
import { palette } from '../../../lib/palette'
import { Stage } from '../Stage'
import { ClayMaterial, SoftGlow } from '../parts/ClayMaterial'

/**
 * Icono 3D: SMS. La pastilla con el texto es HTML superpuesto al canvas
 * para que la tipografía quede nítida y alineada con el teléfono.
 */
export function SmsScene({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-full w-full ${className}`}>
      <Stage cameraPosition={[0, 0, 3.4]} fov={36}>
        <SoftGlow position={[0, 0.12, -0.5]} scale={1.55} color="#6ee84a" opacity={0.8} />

        <group rotation={[0.05, -0.16, 0]}>
          <RoundedBox args={[1.18, 1.5, 0.32]} radius={0.18} smoothness={6}>
            <ClayMaterial preset="purple" />
          </RoundedBox>
          <RoundedBox args={[0.88, 1.04, 0.07]} radius={0.1} position={[0, -0.08, 0.18]} smoothness={4}>
            <ClayMaterial preset="screen" />
          </RoundedBox>

          {/* botón inferior */}
          <mesh position={[0, -0.56, 0.18]} rotation={[Math.PI / 2, 0, 0]} dispose={null}>
            <cylinderGeometry args={[0.11, 0.11, 0.05, 28]} />
            <meshStandardMaterial color={palette.grape400} roughness={0.4} />
          </mesh>
        </group>
      </Stage>

      {/* pastilla flotante con degradado 3D simulado */}
      <span className="pointer-events-none absolute left-[54%] top-[28%] -translate-x-1/2 -translate-y-1/2 rounded-[13px] bg-gradient-to-b from-grape-400 to-grape-700 px-[15px] py-[5px] text-[13px] font-extrabold tracking-wide text-white shadow-[0_10px_20px_-6px_rgba(29,7,51,0.85)] ring-1 ring-white/15">
        SMS
      </span>
    </div>
  )
}
