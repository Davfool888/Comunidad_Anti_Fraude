import { memo, type ReactNode } from 'react'
import { Environment, Lightformer } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { palette } from '../../lib/palette'
import { useViewport } from '../../lib/useViewport'

/**
 * Base de iluminación común para todas las escenas 3D.
 * Sin OrbitControls ni eventos: es puramente decorativo.
 * El entorno es claro para que las piezas encajen con la interfaz pastel.
 *
 * El lienzo **no se monta hasta que la tarjeta está cerca del viewport**:
 * así la página no crea una docena de contextos WebGL al cargar, que es lo
 * que la convertía en una página pesada.
 */
export const Stage = memo(function Stage({
  children,
  cameraPosition = [0, 0, 6],
  fov = 35,
  className = '',
  frameloop = 'demand',
}: {
  children: ReactNode
  cameraPosition?: [number, number, number]
  fov?: number
  className?: string
  frameloop?: 'always' | 'demand'
}) {
  const { ref, near } = useViewport<HTMLDivElement>()

  return (
    <div ref={ref} className={className} style={{ width: '100%', height: '100%' }}>
      {near && (
        <Canvas
          className="h-full w-full"
          dpr={[1, 1.5]}
          frameloop={frameloop}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          camera={{ position: cameraPosition, fov }}
        >
          {/* Iluminación de estudio: key frontal, fill frío, rim trasero y rebote verde */}
          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 6, 7]} intensity={2.1} color="#ffffff" />
          <directionalLight position={[-6, 2, 5]} intensity={0.8} color={palette.grape300} />
          <directionalLight position={[-3, 4, -7]} intensity={1.6} color={palette.grape400} />
          <directionalLight position={[2, -5, -2]} intensity={0.9} color={palette.lime400} />
          <pointLight position={[-1.6, 2.4, 4]} intensity={2.6} distance={16} color="#ffffff" />

          {/* Entorno claro: marca los reflejos sobre las superficies pulidas */}
          <Environment resolution={128} frames={1}>
            <color attach="background" args={['#dfe9fb']} />
            <Lightformer form="rect" intensity={2.6} position={[0, 4.5, 5]} scale={[7, 2.4, 1]} color="#ffffff" />
            <Lightformer form="rect" intensity={2.2} position={[-4, 3, 4]} scale={[3, 3, 1]} color="#ffffff" />
            <Lightformer form="rect" intensity={1.1} position={[-5, 1, 3]} scale={[5, 5, 1]} color={palette.grape300} />
            <Lightformer form="rect" intensity={1} position={[5, -2, 3]} scale={[4, 3, 1]} color={palette.lime400} />
            <Lightformer form="circle" intensity={1.4} position={[0, -3.5, 4]} scale={[5, 5, 1]} color={palette.neon400} />
          </Environment>

          {children}
        </Canvas>
      )}
    </div>
  )
})
