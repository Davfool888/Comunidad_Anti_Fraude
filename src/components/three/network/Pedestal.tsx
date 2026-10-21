import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { iso } from './palette'
import { createCanvasTexture, drawShield, roundRectPath } from './textures'
import { VerifiedBadge } from './VerifiedBadge'

/**
 * Pedestal elevado con una pantalla gigante: es el "cartel de la red"
 * que corona la escena en la referencia.
 */

function buildScreenTexture() {
  return createCanvasTexture(512, 320, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, w, h)
    gradient.addColorStop(0, '#7fd0ff')
    gradient.addColorStop(0.55, '#8fa9ff')
    gradient.addColorStop(1, '#c79dff')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    // marco interior
    roundRectPath(ctx, 18, 18, w - 36, h - 36, 24)
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'
    ctx.lineWidth = 3
    ctx.stroke()

    // escudo grande
    ctx.save()
    ctx.shadowColor = 'rgba(255,255,255,0.8)'
    ctx.shadowBlur = 22
    drawShield(ctx, w / 2, h / 2 - 6, 150, { gradient: ['#ffffff', '#e2ecff'], check: '#4c7dff', checkWidth: 20 })
    ctx.restore()

    // barra de estado
    roundRectPath(ctx, 70, h - 74, w - 140, 26, 13)
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fill()
    roundRectPath(ctx, 78, h - 66, (w - 156) * 0.78, 10, 5)
    ctx.fillStyle = '#5f8cff'
    ctx.fill()
  })
}

export function Pedestal({
  position,
  accent,
}: {
  position: [number, number, number]
  accent?: string
}) {
  const { texture } = useMemo(() => buildScreenTexture(), [])

  return (
    <group position={position}>
      {/* escalones */}
      <RoundedBox args={[3.4, 0.24, 2.3]} radius={0.14} smoothness={5} position={[0, 0.12, 0]}>
        <meshStandardMaterial color={iso.platform} roughness={0.55} />
      </RoundedBox>
      <RoundedBox args={[2.85, 0.22, 1.8]} radius={0.12} smoothness={5} position={[0, 0.35, 0]}>
        <meshStandardMaterial color={iso.platformEdge} roughness={0.5} />
      </RoundedBox>
      <RoundedBox args={[2.3, 0.2, 1.4]} radius={0.1} smoothness={5} position={[0, 0.56, 0]}>
        <meshStandardMaterial color={iso.platform} roughness={0.45} />
      </RoundedBox>

      {/* aro luminoso */}
      <mesh position={[0, 0.68, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.72, 48]} />
        <meshBasicMaterial
          color={accent ?? iso.coreCyan}
          transparent
          opacity={0.85}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* soporte de la pantalla */}
      <mesh position={[0, 0.98, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.52, 16]} />
        <meshStandardMaterial color="#cbd7ee" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* pantalla inclinada hacia la cámara */}
      <group position={[0, 1.9, 0.34]} rotation={[-0.2, Math.PI / 4, 0]}>
        <RoundedBox args={[2.5, 1.6, 0.1]} radius={0.14} smoothness={5}>
          <meshStandardMaterial color="#eef4ff" roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[2.3, 1.42]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.07]}>
          <planeGeometry args={[2.5, 1.6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} />
        </mesh>
      </group>

      {/* insignia de verificado junto a la pantalla */}
      <group position={[3.4, 3.15, 0.25]}>
        <VerifiedBadge position={[0, 0, 0]} satisfaction={98} width={1.9} />
      </group>
    </group>
  )
}
