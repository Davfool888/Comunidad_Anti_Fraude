import { memo, useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer, N8AO, Vignette } from '@react-three/postprocessing'
import type { EffectComposer as EffectComposerImpl } from 'postprocessing'
import * as THREE from 'three'
import type { Community, CommunityNetwork } from '../../../data/networks'
import { useDocumentVisible, useViewport } from '../../../lib/useViewport'
import { NetworkScene } from './NetworkScene'
import { iso } from './palette'
import { createCanvas2D, toTexture } from './textures'

/** Fondo de cielo: degradado vertical suave (azul pastel → lavanda). */
function useSkyTexture() {
  return useMemo(() => {
    const { canvas, ctx } = createCanvas2D(16, 512)
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, iso.skyTop)
    gradient.addColorStop(0.38, iso.skyMid)
    gradient.addColorStop(0.72, iso.skyLow)
    gradient.addColorStop(1, iso.skyBottom)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 16, 512)
    return toTexture(canvas)
  }, [])
}

/**
 * Sonda de desarrollo: expone el estado de R3F en `window.__scene` para poder
 * renderizar y capturar fotogramas desde la consola.
 */
function SceneProbe({ composerRef }: { composerRef: React.RefObject<EffectComposerImpl | null> }) {
  const state = useThree()

  useEffect(() => {
    if (!import.meta.env.DEV) return
    const target = window as unknown as Record<string, unknown>
    target.__scene = state
    target.__composer = composerRef
  }, [state, composerRef])

  return null
}

/**
 * La escena es estática: el mapa de sombras sólo se calcula una vez.
 * Ahorra una pasada completa de render en cada fotograma.
 */
function StaticShadows() {
  const state = useThree()

  useEffect(() => {
    // La escena es estática: las sombras se calculan una sola vez.
    // oxlint-disable-next-line react/immutability
    state.gl.shadowMap.autoUpdate = false
    // oxlint-disable-next-line react/immutability
    state.gl.shadowMap.needsUpdate = true
  }, [state])

  return null
}

/**
 * Calidad adaptativa: si el equipo no mantiene el ritmo de fotogramas, baja
 * la resolución del lienzo (y si no basta, la baja del todo). En pantallas
 * con GPU potente se queda en la resolución máxima.
 */
function AdaptiveQuality() {
  const setDpr = useThree((state) => state.setDpr)

  return (
    <PerformanceMonitor
      bounds={() => [48, 58]}
      flipflops={4}
      onDecline={() => setDpr(1)}
      onIncline={() => setDpr([1, 1.5])}
      onFallback={() => setDpr(0.75)}
    />
  )
}

export const NetworkCanvas = memo(function NetworkCanvas({
  className = '',
  network,
  community,
}: {
  className?: string
  network?: CommunityNetwork
  community?: Community
}) {
  const sky = useSkyTexture()
  const composerRef = useRef<EffectComposerImpl | null>(null)
  // El bucle de render se detiene cuando la escena no está en pantalla o la
  // pestaña está en segundo plano: es la diferencia entre una página fluida
  // y una que calienta el portátil al hacer scroll.
  const { ref, visible } = useViewport<HTMLDivElement>()
  const pageVisible = useDocumentVisible()
  const active = visible && pageVisible

  return (
    <div ref={ref} className={className}>
      <Canvas
        className="h-full w-full"
        dpr={[1, 1.5]}
        shadows={{ type: THREE.PCFShadowMap }}
        frameloop={active ? 'always' : 'never'}
        performance={{ min: 0.75, max: 1.5, debounce: 300 }}
        gl={{
          antialias: false,
          alpha: false,
          toneMapping: THREE.NoToneMapping,
          powerPreference: 'high-performance',
          // sólo en desarrollo: permite capturar fotogramas del lienzo
          preserveDrawingBuffer: import.meta.env.DEV,
        }}
        camera={{ position: [30, 30, 30], near: -120, far: 260 }}
      >
        <primitive attach="background" object={sky} />

        <NetworkScene network={network} community={community} />

        <EffectComposer ref={composerRef} multisampling={2}>
          {/* oclusión ambiental: micro-sombras donde los objetos se tocan */}
          <N8AO
            aoRadius={1.1}
            intensity={1.4}
            distanceFalloff={0.6}
            quality="low"
            halfRes
            color="#2c3f7a"
          />
          <Bloom
            intensity={0.7}
            luminanceThreshold={0.92}
            luminanceSmoothing={0.16}
            mipmapBlur
            radius={0.7}
          />
          <Vignette offset={0.34} darkness={0.26} eskil={false} />
        </EffectComposer>

        <SceneProbe composerRef={composerRef} />
        <StaticShadows />
        <AdaptiveQuality />
      </Canvas>
    </div>
  )
})
