import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { palette } from '../../../lib/palette'
import { Stage } from '../Stage'
import { ClayMaterial, SoftGlow } from '../parts/ClayMaterial'
import { createArcGeometry } from '../parts/geometry'
import { Handset } from '../parts/pieces'

/** Icono 3D: Llamadas (auricular verde con ondas salientes). */
export function CallScene({ className = '' }: { className?: string }) {
  const waves = useMemo(
    () => [createArcGeometry(0.5, 0.05), createArcGeometry(0.7, 0.046), createArcGeometry(0.9, 0.042)],
    [],
  )

  return (
    <Stage cameraPosition={[0, 0, 3.5]} fov={36} className={className}>
      <SoftGlow position={[-0.1, -0.05, -0.6]} scale={1.7} color="#86ef5c" opacity={0.8} />

      <group rotation={[0.02, -0.14, 0]}>
        <RoundedBox args={[1.42, 1.42, 0.28]} radius={0.22} smoothness={6}>
          <ClayMaterial preset="purple" />
        </RoundedBox>

        <Handset color="#7ce83f" scale={1.25} position={[-0.26, -0.16, 0.24]} />

        {waves.map((geometry, index) => (
          <mesh
            key={index}
            geometry={geometry}
            position={[0.44, 0.36, 0.2 + index * 0.012]}
            rotation={[0, 0, -Math.PI * 0.28]}
            dispose={null}
          >
            <meshStandardMaterial color={palette.plum700} roughness={0.45} />
          </mesh>
        ))}
      </group>
    </Stage>
  )
}
