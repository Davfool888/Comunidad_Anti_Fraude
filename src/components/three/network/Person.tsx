import { RoundedBox } from '@react-three/drei'

/**
 * Figura humana estilizada (tipo "clay"): cabeza, cuerpo, brazos y piernas.
 * Altura total ≈ 1.2 unidades, que es la proporción de la referencia.
 */

export type PersonProps = {
  position?: [number, number, number]
  rotation?: number
  scale?: number
  /** Color de la camiseta. */
  shirt: string
  /** Color del pantalón. */
  pants?: string
  /** Tono de piel. */
  skin?: string
  /** Color del pelo. */
  hair?: string
  /** Gesto: 'saludo' levanta un brazo. */
  pose?: 'idle' | 'saludo' | 'camina'
}

export function Person({
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  shirt,
  pants = '#4a5a86',
  skin = '#f0c49b',
  hair = '#4a3728',
  pose = 'idle',
}: PersonProps) {
  const legColor = pants
  const headRadius = 0.135

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* piernas */}
      <RoundedBox args={[0.075, 0.42, 0.09]} radius={0.035} smoothness={3} position={[-0.06, 0.21, 0]}>
        <meshStandardMaterial color={legColor} roughness={0.62} />
      </RoundedBox>
      <RoundedBox args={[0.075, 0.42, 0.09]} radius={0.035} smoothness={3} position={[0.06, 0.21, 0]}>
        <meshStandardMaterial color={legColor} roughness={0.62} />
      </RoundedBox>

      {/* zapatos */}
      <RoundedBox args={[0.11, 0.07, 0.16]} radius={0.03} smoothness={3} position={[-0.06, 0.035, 0.03]}>
        <meshStandardMaterial color="#33405f" roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.11, 0.07, 0.16]} radius={0.03} smoothness={3} position={[0.06, 0.035, 0.03]}>
        <meshStandardMaterial color="#33405f" roughness={0.7} />
      </RoundedBox>

      {/* torso */}
      <RoundedBox args={[0.24, 0.38, 0.17]} radius={0.08} smoothness={4} position={[0, 0.61, 0]}>
        <meshStandardMaterial color={shirt} roughness={0.55} />
      </RoundedBox>

      {/* brazos */}
      <RoundedBox
        args={[0.065, 0.3, 0.07]}
        radius={0.03}
        smoothness={3}
        position={[-0.155, pose === 'saludo' ? 0.76 : 0.6, pose === 'saludo' ? 0.02 : 0]}
        rotation={[0, 0, pose === 'saludo' ? -0.55 : 0.12]}
      >
        <meshStandardMaterial color={shirt} roughness={0.55} />
      </RoundedBox>
      <RoundedBox
        args={[0.065, 0.3, 0.07]}
        radius={0.03}
        smoothness={3}
        position={[0.155, 0.6, 0]}
        rotation={[0, 0, -0.12]}
      >
        <meshStandardMaterial color={shirt} roughness={0.55} />
      </RoundedBox>

      {/* manos */}
      <mesh position={[-0.185, pose === 'saludo' ? 0.94 : 0.45, pose === 'saludo' ? 0.02 : 0]}>
        <sphereGeometry args={[0.048, 14, 12]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>
      <mesh position={[0.185, 0.45, 0]}>
        <sphereGeometry args={[0.048, 14, 12]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>

      {/* cuello + cabeza */}
      <mesh position={[0, 0.81, 0]}>
        <cylinderGeometry args={[0.045, 0.05, 0.07, 12]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.955, 0]} scale={[1, 1.06, 0.95]}>
        <sphereGeometry args={[headRadius, 22, 18]} />
        <meshStandardMaterial color={skin} roughness={0.55} />
      </mesh>

      {/* pelo: casquete superior */}
      <mesh position={[0, 0.985, -0.012]} scale={[1.03, 0.85, 1.02]}>
        <sphereGeometry args={[headRadius, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshStandardMaterial color={hair} roughness={0.7} />
      </mesh>
      {/* flequillo */}
      <mesh position={[0, 1.02, 0.055]} scale={[0.85, 0.4, 0.45]}>
        <sphereGeometry args={[headRadius, 18, 14]} />
        <meshStandardMaterial color={hair} roughness={0.7} />
      </mesh>

      {/* ojitos */}
      {[-0.05, 0.05].map((x) => (
        <mesh key={x} position={[x, 0.965, 0.118]}>
          <sphereGeometry args={[0.019, 10, 8]} />
          <meshStandardMaterial color="#2c3a5c" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}
