import { useMemo } from 'react'
import * as THREE from 'three'
import { CAMERA_FACING } from './layout'
import { iso, hot } from './palette'
import { SceneLabel } from './SceneLabel'
import { createTextTexture } from './textures'

/**
 * Núcleo de seguridad: cúpula geodésica de cristal con el escudo de neón
 * en su interior, sobre un pedestal circular de dos niveles.
 */

function useShieldGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape()
    const w = 0.52
    const h = 0.62
    shape.moveTo(-w, h * 0.85)
    shape.quadraticCurveTo(0, h * 1.08, w, h * 0.85)
    shape.bezierCurveTo(w, h * 0.05, w * 0.95, -h * 0.45, 0, -h)
    shape.bezierCurveTo(-w * 0.95, -h * 0.45, -w, h * 0.05, -w, h * 0.85)
    shape.closePath()
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 6,
      curveSegments: 24,
    })
    geometry.center()
    geometry.computeVertexNormals()
    return geometry
  }, [])
}

/** Check dibujado como tubo, para estamparlo dentro del escudo. */
function useCheckGeometry() {
  return useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.2, 0.02, 0),
      new THREE.Vector3(-0.06, -0.14, 0),
      new THREE.Vector3(0.05, 0.04, 0),
      new THREE.Vector3(0.22, 0.22, 0),
    ])
    return new THREE.TubeGeometry(curve, 40, 0.055, 12, false)
  }, [])
}

export function SecurityCore({
  position = [0, 0, 0],
  title = 'NÚCLEO DE\nSEGURIDAD',
  accent,
}: {
  position?: [number, number, number]
  title?: string
  accent?: string
}) {
  const shield = useShieldGeometry()
  const check = useCheckGeometry()

  const titleTexture = useMemo(
    () =>
      createTextTexture(
        title.split('\n').map((line) => ({
          text: line,
          size: 40,
          color: iso.white,
          weight: 700,
          tracking: 0.5,
          stroke: '#2f4487',
          strokeWidth: 6,
          glow: iso.coreCyan,
          glowBlur: 10,
        })),
        { padding: 16, lineGap: 2 },
      ),
    [title],
  )


  const badge = useMemo(
    () =>
      createTextTexture(
        [{ text: 'VERIFICADO', size: 30, color: iso.white, weight: 800, tracking: 1.2 }],
        { padding: 16, background: iso.green, radius: 16 },
      ),
    [],
  )

  const subtitle = useMemo(
    () =>
      createTextTexture(
        [
          {
            text: 'MONITOR DE FRAUDE',
            size: 26,
            color: iso.white,
            weight: 800,
            tracking: 0.6,
            stroke: '#2b4c9a',
            strokeWidth: 6,
          },
          {
            text: 'EN TIEMPO REAL',
            size: 26,
            color: iso.white,
            weight: 800,
            tracking: 0.6,
            stroke: '#2b4c9a',
            strokeWidth: 6,
          },
        ],
        { padding: 12, lineGap: 0 },
      ),
    [],
  )

  return (
    <group position={position}>
      {/* ---------- pedestal multinivel con reborde tecnológico ---------- */}
      {/* plataforma inferior amplia */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[3.0, 3.25, 0.24, 72]} />
        <meshPhysicalMaterial color={iso.daisEdge} roughness={0.5} clearcoat={0.3} />
      </mesh>
      {/* dientes técnicos del reborde */}
      {Array.from({ length: 16 }).map((_, index) => {
        const angle = (index / 16) * Math.PI * 2
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * 3.02, 0.2, Math.sin(angle) * 3.02]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.22, 0.1, 0.34]} />
            <meshStandardMaterial color={iso.platformEdge} roughness={0.45} />
          </mesh>
        )
      })}
      {/* reborde luminoso exterior (toma el color de la red) */}
      <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.02, 0.045, 10, 96]} />
        <meshBasicMaterial color={hot(accent ?? iso.coreCyan, 1.8)} toneMapped={false} />
      </mesh>
      {/* segundo nivel */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[2.5, 2.7, 0.26, 64]} />
        <meshPhysicalMaterial color={iso.dais} roughness={0.45} clearcoat={0.35} />
      </mesh>
      <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.48, 0.05, 12, 72]} />
        <meshBasicMaterial color={hot(iso.magenta, 1.8)} toneMapped={false} transparent opacity={0.9} />
      </mesh>
      {/* tercer nivel */}
      <mesh position={[0, 0.66, 0]}>
        <cylinderGeometry args={[2.05, 2.2, 0.2, 64]} />
        <meshPhysicalMaterial color={iso.daisEdge} roughness={0.42} clearcoat={0.4} />
      </mesh>
      {/* aro interior luminoso */}
      <mesh position={[0, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.88, 0.06, 12, 72]} />
        <meshBasicMaterial color={hot(iso.coreCyan, 2.2)} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.82, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.62, 0.035, 10, 72]} />
        <meshBasicMaterial color={hot(iso.magenta, 1.9)} toneMapped={false} transparent opacity={0.85} />
      </mesh>

      {/* resplandor magenta sobre el pedestal */}
      <mesh position={[0, 0.85, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.9, 48]} />
        <meshBasicMaterial
          color={hot(iso.coreGlow, 1.1)}
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ---------- cúpula geodésica ---------- */}
      <group position={[0, 2.15, 0]}>
        {/* cristal */}
        <mesh>
          <icosahedronGeometry args={[2.0, 1]} />
          <meshPhysicalMaterial
            color={iso.coreGlass}
            transparent
            opacity={0.14}
            roughness={0.34}
            metalness={0}
            clearcoat={0.25}
            clearcoatRoughness={0.4}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* aristas de la geodésica */}
        <mesh>
          <icosahedronGeometry args={[2.01, 1]} />
          <meshBasicMaterial
            color={hot(iso.coreCyan, 1.4)}
            wireframe
            transparent
            opacity={0.6}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>

        {/* segunda malla más fina, para dar profundidad */}
        <mesh scale={0.86}>
          <icosahedronGeometry args={[2.01, 0]} />
          <meshBasicMaterial
            color={hot(iso.magenta, 1.35)}
            wireframe
            transparent
            opacity={0.45}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>

        {/* halo interior */}
        <mesh scale={0.42}>
          <sphereGeometry args={[2.0, 24, 18]} />
          <meshBasicMaterial
            color={hot(iso.coreGlow, 1.1)}
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.BackSide}
          />
        </mesh>

        {/* escudo de neón: cristal tintado con borde incandescente */}
        <group position={[0, 0.34, 0]} rotation={[0, 0.42, 0]}>
          <mesh geometry={shield} scale={1.65}>
            <meshPhysicalMaterial
              color="#2fa8d6"
              emissive={hot(iso.coreCyan, 0.8)}
              emissiveIntensity={0.3}
              roughness={0.2}
              metalness={0}
              transparent
              opacity={0.6}
              clearcoat={0.6}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* borde brillante del escudo */}
          <mesh geometry={shield} scale={1.76}>
            <meshBasicMaterial
              color={hot(iso.coreCyan, 1.5)}
              transparent
              opacity={0.32}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.BackSide}
            />
          </mesh>
          {/* check blanco en el centro del escudo */}
          <mesh geometry={check} position={[0, 0.02, 0.12]} scale={1.5}>
            <meshBasicMaterial color={hot('#ffffff', 1)} toneMapped={false} />
          </mesh>
        </group>

        {/* distintivo VERIFICADO: dentro de la cúpula, se ve a través del cristal
            y el escudo translúcido */}
        <group position={[0, -0.7, 0.55]}>
          <SceneLabel label={badge} worldWidth={2.3} />
        </group>
      </group>

      {/* ---------- rótulos flotantes (miran de frente a la cámara) ---------- */}
      <group rotation={CAMERA_FACING}>
        <SceneLabel label={titleTexture} worldWidth={4.1} position={[0, 4.55, 0]} />
      </group>

      <group rotation={CAMERA_FACING} position={[0, 0.12, 0]}>
        <SceneLabel label={subtitle} worldWidth={4.0} position={[0, 0, 2.0]} />
      </group>
    </group>
  )
}
