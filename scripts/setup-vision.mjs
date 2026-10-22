/**
 * Prepara los modelos de visión que corren en el navegador (MediaPipe):
 *
 *  · copia el runtime WebAssembly desde node_modules a public/mediapipe/wasm
 *  · descarga los modelos de detección de objetos y de rostros a public/models
 *
 * Se ejecuta en `postinstall`. Los archivos no se suben al repositorio
 * (están en .gitignore) porque pesan ~26 MB.
 */
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const wasmSource = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm')
const wasmTarget = join(root, 'public', 'mediapipe', 'wasm')
const modelsDir = join(root, 'public', 'models')

const MODELS = {
  'efficientdet_lite0.tflite':
    'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite',
  'blaze_face_short_range.tflite':
    'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
}

if (existsSync(wasmSource)) {
  mkdirSync(wasmTarget, { recursive: true })
  cpSync(wasmSource, wasmTarget, { recursive: true })
  console.log('[visión] runtime WebAssembly copiado')
}

mkdirSync(modelsDir, { recursive: true })
for (const [file, url] of Object.entries(MODELS)) {
  const target = join(modelsDir, file)
  if (existsSync(target)) continue
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    writeFileSync(target, Buffer.from(await response.arrayBuffer()))
    console.log(`[visión] modelo descargado: ${file}`)
  } catch (error) {
    // Sin red no se rompe la instalación: la detección local se desactiva
    console.warn(`[visión] no se pudo descargar ${file}: ${error.message}`)
  }
}
