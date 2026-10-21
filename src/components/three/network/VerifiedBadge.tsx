import { useMemo } from 'react'
import { CAMERA_FACING } from './layout'
import { iso } from './palette'
import { createCanvasTexture, drawShield, roundRectPath } from './textures'

/**
 * Panel flotante "COMERCIO VERIFICADO" con el escudo de la marca,
 * las estrellas de puntuación y el porcentaje de satisfacción.
 */

const LOGICAL_WIDTH = 330
const LOGICAL_HEIGHT = 104

/** Dibuja una estrella de cinco puntas centrada en (cx, cy). */
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.beginPath()
  for (let index = 0; index < 10; index++) {
    const r = index % 2 === 0 ? radius : radius * 0.45
    const angle = (index / 10) * Math.PI * 2 - Math.PI / 2
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}

function buildBadgeTexture(satisfaction: number) {
  return createCanvasTexture(LOGICAL_WIDTH, LOGICAL_HEIGHT, (ctx, w, h) => {
    // tarjeta con sombra suave
    ctx.save()
    ctx.shadowColor = 'rgba(37, 66, 130, 0.28)'
    ctx.shadowBlur = 14
    ctx.shadowOffsetY = 4
    roundRectPath(ctx, 4, 4, w - 8, h - 8, 20)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.restore()

    // borde
    roundRectPath(ctx, 4, 4, w - 8, h - 8, 20)
    ctx.strokeStyle = 'rgba(120, 160, 220, 0.4)'
    ctx.lineWidth = 2
    ctx.stroke()

    // escudo con degradado
    const cx = 46
    const cy = h / 2
    ctx.save()
    ctx.shadowColor = 'rgba(90, 130, 220, 0.4)'
    ctx.shadowBlur = 10
    drawShield(ctx, cx, cy, 52, { gradient: ['#7fd8ff', '#8b6ef0'], check: '#ffffff', checkWidth: 7 })
    ctx.restore()

    // textos
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.font = '800 22px "Poppins", system-ui, sans-serif'
    ctx.fillStyle = '#28406f'
    ctx.fillText('COMERCIO', 82, 34)
    ctx.fillText('VERIFICADO', 82, 58)

    // porcentaje de satisfacción
    ctx.font = '600 17px "Poppins", system-ui, sans-serif'
    ctx.fillStyle = '#6a83b4'
    ctx.fillText(`Satisfacción: ${satisfaction}%`, 82, 82)

    // estrellas de puntuación
    const stars = 4
    for (let index = 0; index < stars; index++) {
      const filled = satisfaction >= 50 + index * 12
      ctx.fillStyle = filled ? '#ffc65c' : '#d7e2f4'
      drawStar(ctx, 240 + index * 17, 84, 7.5)
    }
  })
}

export function VerifiedBadge({
  position,
  satisfaction,
  width = 2.05,
}: {
  position: [number, number, number]
  satisfaction: number
  width?: number
}) {
  const { texture } = useMemo(() => buildBadgeTexture(satisfaction), [satisfaction])
  const height = width * (LOGICAL_HEIGHT / LOGICAL_WIDTH)

  return (
    <group position={position} rotation={CAMERA_FACING}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      {/* halo sutil detrás */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={iso.neonCyan} transparent opacity={0.1} depthWrite={false} />
      </mesh>
    </group>
  )
}
