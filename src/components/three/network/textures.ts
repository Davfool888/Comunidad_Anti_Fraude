import * as THREE from 'three'

/**
 * Fábrica de texturas de canvas para la escena isométrica.
 * Todo el texto 3D (rótulos de neón, paneles, gráficas) se dibuja en canvas y
 * se aplica como mapa: así se mantiene el acabado "ilustración" sin
 * depender de fuentes 3D externas.
 */

export const FONT_STACK = '"Poppins", "Segoe UI", system-ui, -apple-system, sans-serif'

/** Factor de supermuestreo: evita que el texto se vea borroso. */
const SS = 2

export function createCanvas2D(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * SS))
  canvas.height = Math.max(1, Math.round(height * SS))
  const ctx = canvas.getContext('2d')!
  ctx.scale(SS, SS)
  return { canvas, ctx }
}

export function toTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/** Ancho de un texto contando el tracking (letter-spacing) manual. */
export function measureTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  tracking: number,
): number {
  let width = 0
  for (const char of text) width += ctx.measureText(char).width + tracking
  return text.length > 0 ? width - tracking : 0
}

/** Escribe un texto respetando el tracking, sin depender de ctx.letterSpacing. */
export function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
) {
  if (tracking === 0) {
    ctx.fillText(text, x, y)
    return
  }
  let cursor = x
  for (const char of text) {
    ctx.fillText(char, cursor, y)
    cursor += ctx.measureText(char).width + tracking
  }
}

export type TextLine = {
  text: string
  size: number
  color: string
  weight?: number
  tracking?: number
  /** Color del halo de neón alrededor del texto. */
  glow?: string
  glowBlur?: number
  stroke?: string
  strokeWidth?: number
}

export type TextTextureOptions = {
  padding?: number
  align?: 'left' | 'center' | 'right'
  lineGap?: number
  /** Fondo redondeado (opcional). */
  background?: string
  radius?: number
  /** Borde exterior del panel de fondo. */
  border?: string
  borderWidth?: number
  /** Sombra proyectada bajo el texto. */
  shadow?: string
}

export type TextTexture = {
  texture: THREE.CanvasTexture
  /** Ancho y alto en unidades de textura (canvas lógico). */
  width: number
  height: number
}

/**
 * Crea una textura de canvas a partir de una o varias líneas de texto.
 * Devuelve además el tamaño lógico para poder escalar el plano 1:1.
 */
export function createTextTexture(
  lines: TextLine[],
  options: TextTextureOptions = {},
): TextTexture {
  const {
    padding = 12,
    align = 'center',
    lineGap = 4,
    background,
    radius = 0,
    border,
    borderWidth = 0,
    shadow,
  } = options

  const measure = createCanvas2D(4, 4).ctx
  let contentWidth = 0
  let contentHeight = 0

  const metrics = lines.map((line) => {
    measure.font = `${line.weight ?? 800} ${line.size}px ${FONT_STACK}`
    const width = measureTracked(measure, line.text, line.tracking ?? 0)
    const height = line.size * 1.18
    contentWidth = Math.max(contentWidth, width)
    contentHeight += height
    return { width, height }
  })
  contentHeight += lineGap * Math.max(0, lines.length - 1)

  const width = contentWidth + padding * 2
  const height = contentHeight + padding * 2
  const { canvas, ctx } = createCanvas2D(width, height)

  if (background) {
    ctx.save()
    roundRectPath(ctx, 1, 1, width - 2, height - 2, radius)
    ctx.fillStyle = background
    ctx.fill()
    if (border && borderWidth > 0) {
      ctx.strokeStyle = border
      ctx.lineWidth = borderWidth
      ctx.stroke()
    }
    ctx.restore()
  }

  let cursorY = padding
  lines.forEach((line, index) => {
    const metric = metrics[index]
    const tracking = line.tracking ?? 0
    ctx.font = `${line.weight ?? 800} ${line.size}px ${FONT_STACK}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'

    const lineWidth = metric.width
    let x = padding
    if (align === 'center') x = (width - lineWidth) / 2
    else if (align === 'right') x = width - padding - lineWidth

    const y = cursorY + metric.height / 2

    if (shadow) {
      ctx.save()
      ctx.shadowColor = shadow
      ctx.shadowBlur = line.size * 0.35
      ctx.shadowOffsetY = line.size * 0.06
      ctx.fillStyle = line.color
      drawTracked(ctx, line.text, x, y, tracking)
      ctx.restore()
    }

    if (line.glow) {
      ctx.save()
      ctx.shadowColor = line.glow
      ctx.shadowBlur = line.glowBlur ?? line.size * 0.5
      ctx.fillStyle = line.color
      drawTracked(ctx, line.text, x, y, tracking)
      ctx.fillStyle = line.color
      ctx.shadowBlur = line.glowBlur ?? line.size * 0.35
      drawTracked(ctx, line.text, x, y, tracking)
      ctx.restore()
    }

    if (line.stroke && line.strokeWidth) {
      ctx.save()
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.strokeStyle = line.stroke
      ctx.lineWidth = line.strokeWidth
      ctx.strokeText(line.text, x, y)
      ctx.restore()
    }

    ctx.fillStyle = line.color
    drawTracked(ctx, line.text, x, y, tracking)

    cursorY += metric.height + lineGap
  })

  return { texture: toTexture(canvas), width, height }
}

/** Dibuja un escudo con check dentro del contexto. */
export function drawShield(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  options: { fill?: string; gradient?: [string, string]; check?: string; checkWidth?: number } = {},
) {
  const { fill = '#ffffff', gradient, check = '#ffffff', checkWidth = 0 } = options
  const halfWidth = size / 2
  const halfHeight = size / 2

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cx, cy - halfHeight)
  ctx.lineTo(cx + halfWidth, cy - halfHeight * 0.62)
  ctx.lineTo(cx + halfWidth, cy + halfHeight * 0.05)
  ctx.quadraticCurveTo(cx + halfWidth, cy + halfHeight * 0.72, cx, cy + halfHeight)
  ctx.quadraticCurveTo(cx - halfWidth, cy + halfHeight * 0.72, cx - halfWidth, cy + halfHeight * 0.05)
  ctx.lineTo(cx - halfWidth, cy - halfHeight * 0.62)
  ctx.closePath()

  if (gradient) {
    const grad = ctx.createLinearGradient(cx, cy - halfHeight, cx, cy + halfHeight)
    grad.addColorStop(0, gradient[0])
    grad.addColorStop(1, gradient[1])
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = fill
  }
  ctx.fill()
  ctx.restore()

  if (check) {
    ctx.save()
    ctx.strokeStyle = check
    ctx.lineWidth = checkWidth || size * 0.14
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(cx - size * 0.19, cy + size * 0.02)
    ctx.lineTo(cx - size * 0.05, cy + size * 0.17)
    ctx.lineTo(cx + size * 0.21, cy - size * 0.17)
    ctx.stroke()
    ctx.restore()
  }
}

/** Textura genérica: dibuja libremente sobre un canvas del tamaño pedido. */
export function createCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): TextTexture {
  const { canvas, ctx } = createCanvas2D(width, height)
  draw(ctx, width, height)
  return { texture: toTexture(canvas), width, height }
}
