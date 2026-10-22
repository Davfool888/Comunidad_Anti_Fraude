import type { FaceDetector, ObjectDetector } from '@mediapipe/tasks-vision'
import type { Threats } from '../api'

/**
 * Visión por computador en el navegador (MediaPipe Tasks, WebAssembly).
 *
 *  · Detección de objetos (EfficientDet-Lite0, clases COCO): señala
 *    cuchillos, tijeras, bates y personas en la foto de una alerta.
 *  · Detección de rostros (BlazeFace): los rostros se pixelan antes de
 *    publicar la alerta, para proteger a terceros (Ley 1581 de 2012).
 *
 * Los modelos se sirven desde /public (ver scripts/setup-vision.mjs), así
 * funciona sin enviar la foto a ningún servidor.
 */

export type Box = { x: number; y: number; width: number; height: number }

let detectorsPromise: Promise<{ objects: ObjectDetector; faces: FaceDetector }> | null = null

function loadDetectors() {
  detectorsPromise ??= (async () => {
    const vision = await import('@mediapipe/tasks-vision')
    const fileset = await vision.FilesetResolver.forVisionTasks('/mediapipe/wasm')
    const [objects, faces] = await Promise.all([
      vision.ObjectDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: '/models/efficientdet_lite0.tflite' },
        runningMode: 'IMAGE',
        scoreThreshold: 0.3,
        maxResults: 25,
      }),
      vision.FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: '/models/blaze_face_short_range.tflite' },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.45,
      }),
    ])
    return { objects, faces }
  })()
  // si falla (sin modelos), se permite reintentar más tarde
  detectorsPromise.catch(() => {
    detectorsPromise = null
  })
  return detectorsPromise
}

/** Clases COCO que se consideran amenaza o que conviene señalar. */
const THREAT_CLASSES: Record<string, { label: string; description: string }> = {
  knife: { label: 'cuchillo', description: 'Posible cuchillo o arma blanca visible' },
  scissors: { label: 'arma_blanca', description: 'Objeto cortante visible (tijeras)' },
  'baseball bat': { label: 'arma_blanca', description: 'Posible objeto contundente (bate)' },
}

export async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    await image.decode()
    return image
  } finally {
    // se libera cuando la imagen ya está decodificada
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

export type VisionScan = {
  threats: Threats
  faces: Box[]
  people: number
}

function confidence(score: number): 'alta' | 'media' | 'baja' {
  return score >= 0.6 ? 'alta' : score >= 0.4 ? 'media' : 'baja'
}

export async function scanImage(image: HTMLImageElement): Promise<VisionScan> {
  const { objects, faces } = await loadDetectors()
  const objectResult = objects.detect(image)
  const faceResult = faces.detect(image)

  const items: Threats['items'] = []
  let people = 0
  for (const detection of objectResult.detections) {
    const category = detection.categories[0]
    if (!category) continue
    if (category.categoryName === 'person') people += 1
    const threat = THREAT_CLASSES[category.categoryName]
    if (threat) {
      items.push({
        label: threat.label,
        description: `${threat.description} (${Math.round(category.score * 100)}%)`,
        confidence: confidence(category.score),
      })
    }
  }

  const faceBoxes: Box[] = faceResult.detections
    .map((detection) => detection.boundingBox)
    .filter((box): box is NonNullable<typeof box> => Boolean(box))
    .map((box) => ({ x: box.originX, y: box.originY, width: box.width, height: box.height }))

  return {
    threats: {
      detected: items.length > 0,
      items,
      summary: items.length
        ? `Se detectó: ${items.map((item) => item.label.replace('_', ' ')).join(', ')}.`
        : people
          ? `Se ven ${people} persona(s); no se detectaron armas.`
          : 'No se detectaron armas en la imagen.',
      engine: 'navegador',
    },
    faces: faceBoxes,
    people,
  }
}

/**
 * Cuadro de la cámara del local listo para subir: se dibuja el video en un
 * lienzo, se pixelan los rostros en el propio dispositivo y se codifica como
 * JPEG (sin metadatos). Si el detector no carga, el cuadro se envía con todo
 * pixelado salvo una franja central, para no exponer rostros por error.
 */
export async function captureRedactedFrame(video: HTMLVideoElement, maxSide = 960): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(video.videoWidth, video.videoHeight))
  const width = Math.round(video.videoWidth * scale)
  const height = Math.round(video.videoHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(video, 0, 0, width, height)

  let boxes: Box[]
  try {
    const { faces } = await loadDetectors()
    boxes = faces
      .detect(canvas)
      .detections.map((detection) => detection.boundingBox)
      .filter((box): box is NonNullable<typeof box> => Boolean(box))
      .map((box) => ({ x: box.originX, y: box.originY, width: box.width, height: box.height }))
  } catch {
    boxes = [{ x: 0, y: 0, width, height: height * 0.6 }]
  }
  pixelate(ctx, canvas, boxes, 1)

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo capturar la imagen.'))), 'image/jpeg', 0.8),
  )
}

function pixelate(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, boxes: Box[], scale: number) {
  for (const box of boxes) {
    const pad = 0.25
    const x = Math.max(0, (box.x - box.width * pad) * scale)
    const y = Math.max(0, (box.y - box.height * pad) * scale)
    const w = Math.min(canvas.width - x, box.width * (1 + pad * 2) * scale)
    const h = Math.min(canvas.height - y, box.height * (1 + pad * 2) * scale)
    if (w <= 0 || h <= 0) continue
    const block = Math.max(6, Math.round(Math.min(w, h) / 8))
    const tiny = document.createElement('canvas')
    tiny.width = Math.max(1, Math.round(w / block))
    tiny.height = Math.max(1, Math.round(h / block))
    tiny.getContext('2d')!.drawImage(canvas, x, y, w, h, 0, 0, tiny.width, tiny.height)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(tiny, 0, 0, tiny.width, tiny.height, x, y, w, h)
    ctx.imageSmoothingEnabled = true
  }
}

/**
 * Pixela las zonas indicadas y devuelve una imagen JPEG nueva.
 * Al pasar por un canvas se descartan también los metadatos EXIF (GPS).
 */
export async function redactImage(image: HTMLImageElement, boxes: Box[], maxSide = 1600): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.round(image.naturalWidth * scale)
  const height = Math.round(image.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0, width, height)

  for (const box of boxes) {
    // margen extra para cubrir pelo y orejas
    const pad = 0.25
    const x = Math.max(0, (box.x - box.width * pad) * scale)
    const y = Math.max(0, (box.y - box.height * pad) * scale)
    const w = Math.min(width - x, box.width * (1 + pad * 2) * scale)
    const h = Math.min(height - y, box.height * (1 + pad * 2) * scale)
    if (w <= 0 || h <= 0) continue
    const block = Math.max(6, Math.round(Math.min(w, h) / 8))
    const tiny = document.createElement('canvas')
    tiny.width = Math.max(1, Math.round(w / block))
    tiny.height = Math.max(1, Math.round(h / block))
    tiny.getContext('2d')!.drawImage(canvas, x, y, w, h, 0, 0, tiny.width, tiny.height)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(tiny, 0, 0, tiny.width, tiny.height, x, y, w, h)
    ctx.imageSmoothingEnabled = true
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen.'))), 'image/jpeg', 0.88),
  )
}
