/**
 * OCR en el navegador con Tesseract.js (español + inglés).
 *
 * Se usa cuando la IA del servidor no está disponible: saca el texto de las
 * capturas de WhatsApp o SMS para que el motor local pueda analizarlo. La
 * librería y los datos de idioma se cargan sólo la primera vez que se usa.
 */

type Worker = Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>>

let workerPromise: Promise<Worker> | null = null

function getWorker() {
  workerPromise ??= import('tesseract.js').then(({ createWorker }) => createWorker(['spa', 'eng']))
  return workerPromise
}

export async function extractText(images: File[], onProgress?: (done: number, total: number) => void) {
  const worker = await getWorker()
  const parts: string[] = []
  for (const [index, image] of images.entries()) {
    const { data } = await worker.recognize(image)
    const text = data.text.replace(/\n{3,}/g, '\n\n').trim()
    if (text) parts.push(text)
    onProgress?.(index + 1, images.length)
  }
  return parts.join('\n\n')
}
