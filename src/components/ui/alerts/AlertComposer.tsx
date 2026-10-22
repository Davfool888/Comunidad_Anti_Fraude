import { useEffect, useRef, useState } from 'react'
import type { Community, CommunityNetwork } from '../../../data/networks'
import { addLocalAlert } from '../../../lib/alertsStore'
import { api, ApiUnavailable, CATEGORIES, type CommunityAlert, type Level, type Threats } from '../../../lib/api'
import type { VisionScan } from '../../../lib/ai/vision'
import { fieldClass, labelClass, Modal, primaryButton, secondaryButton } from '../Modal'

/**
 * Formulario para enviar una alerta a la red del barrio.
 *
 * Privacidad por diseño: la foto se analiza en el navegador, los rostros se
 * pixelan y los metadatos (GPS) se eliminan antes de subirla. El servidor
 * vuelve a revisar la imagen con IA y oculta cédulas, tarjetas y correos del
 * texto.
 */

export type AlertDraft = {
  title?: string
  description?: string
  category?: string
  level?: Level
  identifiers?: string
}

const LEVELS: { id: Level; label: string; hint: string; className: string }[] = [
  { id: 'danger', label: 'Incidente', hint: 'Fraude o hecho confirmado', className: 'bg-[#e23b5f] text-white' },
  { id: 'warning', label: 'Precaución', hint: 'Intento o situación sospechosa', className: 'bg-[#e9a13b] text-white' },
  { id: 'info', label: 'Aviso', hint: 'Información para el barrio', className: 'bg-[#5b7cf5] text-white' },
]

export function AlertComposer({
  network,
  community,
  draft,
  onClose,
  onCreated,
}: {
  network: CommunityNetwork
  community: Community | null
  draft?: AlertDraft
  onClose: () => void
  onCreated?: (alert: CommunityAlert) => void
}) {
  const [level, setLevel] = useState<Level>(draft?.level ?? 'warning')
  const [category, setCategory] = useState(draft?.category ?? 'otro')
  const [title, setTitle] = useState(draft?.title ?? '')
  const [description, setDescription] = useState(draft?.description ?? '')
  const [identifiers, setIdentifiers] = useState(draft?.identifiers ?? '')
  const [business, setBusiness] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [image, setImage] = useState<File | null>(null)
  const [scan, setScan] = useState<VisionScan | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [blurFaces, setBlurFaces] = useState(true)
  const [preview, setPreview] = useState<{ url: string; blob: Blob } | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const imageElement = useRef<HTMLImageElement | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Analiza la foto en el navegador al elegirla
  useEffect(() => {
    if (!image) return
    let alive = true
    setScanning(true)
    setScan(null)
    setScanError('')
    ;(async () => {
      try {
        const vision = await import('../../../lib/ai/vision')
        const element = await vision.loadImage(image)
        imageElement.current = element
        const result = await vision.scanImage(element)
        if (!alive) return
        setScan(result)
        if (result.threats.items.some((item) => ['cuchillo', 'arma_de_fuego', 'arma_blanca'].includes(item.label))) {
          setLevel('danger')
          setCategory((current) => (current === 'otro' ? 'hurto_violento' : current))
        }
      } catch {
        if (alive) setScanError('No se pudo analizar la foto en este navegador; el servidor la revisará.')
      } finally {
        if (alive) setScanning(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [image])

  // Vista previa con los rostros pixelados (y sin EXIF)
  useEffect(() => {
    const element = imageElement.current
    if (!image || !element || scanning) return
    let alive = true
    ;(async () => {
      const { redactImage } = await import('../../../lib/ai/vision')
      const blob = await redactImage(element, blurFaces && scan ? scan.faces : [])
      if (!alive) return
      setPreview((current) => {
        if (current) URL.revokeObjectURL(current.url)
        return { url: URL.createObjectURL(blob), blob }
      })
    })()
    return () => {
      alive = false
    }
  }, [image, scan, blurFaces, scanning])

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url)
    },
    [preview],
  )

  const locate = () => {
    navigator.geolocation?.getCurrentPosition(
      (position) => setCoords({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => setError('No se pudo obtener la ubicación. La alerta se ubicará en el barrio.'),
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }

  const submit = async () => {
    setError('')
    if (title.trim().length < 4 || description.trim().length < 10) {
      setError('Escriba un título y una descripción que expliquen lo ocurrido.')
      return
    }
    setSending(true)
    try {
      const threats: Threats | null = scan?.threats.detected ? scan.threats : null
      const alert = await api.createAlert({
        networkId: network.id,
        communityId: community?.id,
        businessName: business || undefined,
        lat: coords?.lat ?? community?.lat,
        lng: coords?.lng ?? community?.lng,
        level,
        category,
        title: title.trim(),
        description: description.trim(),
        identifiers: identifiers.trim(),
        // si el navegador no pudo procesarla, el servidor igual elimina el EXIF
        image: image ? (preview?.blob ?? image) : null,
        clientThreats: threats,
      })
      addLocalAlert(alert)
      onCreated?.(alert)
      onClose()
    } catch (err) {
      setError(
        err instanceof ApiUnavailable
          ? 'El servidor de la red no está disponible. Inicie el backend para publicar alertas.'
          : err instanceof Error
            ? err.message
            : 'No se pudo publicar la alerta.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      title="Enviar alerta a la red"
      subtitle={`Comunidad ${community?.name ?? network.neighborhood} · ${network.neighborhood}`}
      onClose={onClose}
      width={720}
    >
      <div className="grid gap-4">
        <div>
          <span className={labelClass}>Tipo de alerta</span>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setLevel(option.id)}
                className={`rounded-2xl border px-3 py-2 text-left transition-all ${
                  level === option.id ? `${option.className} border-transparent shadow-md` : 'border-[#dbe6f7] bg-white text-[#4a628f]'
                }`}
              >
                <span className="block text-[12px] font-extrabold">{option.label}</span>
                <span className={`block text-[10px] font-medium ${level === option.id ? 'text-white/85' : 'text-[#8aa0c4]'}`}>
                  {option.hint}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Modalidad</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className={fieldClass}>
              {Object.entries(CATEGORIES).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className={labelClass}>Reporta</span>
            <select value={business} onChange={(event) => setBusiness(event.target.value)} className={fieldClass}>
              <option value="">Vecino de la comunidad</option>
              {community?.businesses.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          <span className={labelClass}>Título</span>
          <input
            value={title}
            maxLength={140}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej.: Llamadas pidiendo el código de Nequi"
            className={fieldClass}
          />
        </label>

        <label>
          <span className={labelClass}>Qué pasó</span>
          <textarea
            value={description}
            maxLength={2000}
            rows={4}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describa la situación: cómo lo contactaron, qué pidieron, cómo identificarlo. No escriba datos de víctimas."
            className={`${fieldClass} resize-y`}
          />
        </label>

        <label>
          <span className={labelClass}>Número, cuenta o enlace del estafador (opcional)</span>
          <input
            value={identifiers}
            maxLength={1000}
            onChange={(event) => setIdentifiers(event.target.value)}
            placeholder="300 123 4567 · nequi-validacion.xyz"
            className={fieldClass}
          />
          <span className="mt-1 block text-[10px] font-medium text-[#8aa0c4]">
            Se guardan cifrados y se muestran enmascarados. Otros comercios podrán saber si ya fue reportado.
          </span>
        </label>

        {/* foto */}
        <div className="rounded-2xl border border-dashed border-[#c9dbf6] bg-[#f7faff] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className={secondaryButton}>
              {image ? 'Cambiar foto' : 'Adjuntar foto o captura'}
            </button>
            {image && (
              <button
                type="button"
                onClick={() => {
                  setImage(null)
                  setScan(null)
                  setPreview(null)
                }}
                className="text-[11px] font-bold text-[#c2274a]"
              >
                Quitar
              </button>
            )}
            <span className="text-[10.5px] font-medium text-[#8aa0c4]">
              La IA busca armas o violencia y pixela los rostros antes de publicar.
            </span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) setImage(file)
              event.target.value = ''
            }}
          />

          {image && (
            <div className="mt-3 grid gap-3 sm:grid-cols-[200px_1fr]">
              <div className="overflow-hidden rounded-xl bg-[#e8eefb]">
                {preview ? (
                  <img src={preview.url} alt="Vista previa de la foto" className="h-full max-h-[200px] w-full object-cover" />
                ) : (
                  <div className="grid h-[140px] place-items-center text-[11px] font-semibold text-[#8aa0c4]">Procesando…</div>
                )}
              </div>
              <div className="space-y-2 text-[11.5px]">
                {scanning && <p className="font-semibold text-[#6b81ad]">Analizando la imagen en su navegador…</p>}
                {scanError && <p className="font-semibold text-[#b7791f]">{scanError}</p>}
                {scan && (
                  <>
                    <p
                      className={`rounded-xl px-3 py-2 font-bold ${
                        scan.threats.detected ? 'bg-[#ffe0e6] text-[#c2274a]' : 'bg-[#e4f7ee] text-[#1d7a53]'
                      }`}
                    >
                      {scan.threats.detected ? '⚠ ' : '✓ '}
                      {scan.threats.summary}
                    </p>
                    {scan.threats.items.map((item, index) => (
                      <p key={index} className="font-medium text-[#4a628f]">
                        · {item.description}
                      </p>
                    ))}
                    <label className="flex items-center gap-2 font-semibold text-[#4a628f]">
                      <input type="checkbox" checked={blurFaces} onChange={(event) => setBlurFaces(event.target.checked)} />
                      Pixelar rostros ({scan.faces.length} detectado{scan.faces.length === 1 ? '' : 's'})
                    </label>
                    {!blurFaces && scan.faces.length > 0 && (
                      <p className="text-[10.5px] font-medium text-[#b7791f]">
                        Publicar rostros puede exponer a personas inocentes. Hágalo sólo si es indispensable para
                        identificar a un agresor y lo autoriza la ley.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={locate} className={secondaryButton}>
            {coords ? '✓ Ubicación añadida' : 'Usar mi ubicación'}
          </button>
          <span className="text-[10.5px] font-medium text-[#8aa0c4]">
            Si no la añade, la alerta se ubica en el centro del barrio.
          </span>
        </div>

        {level === 'danger' && scan?.threats.detected && (
          <p className="rounded-2xl bg-[#e23b5f] px-4 py-3 text-[12px] font-bold text-white">
            Si hay riesgo para la vida, llame primero a la línea 123. La alerta no reemplaza a la Policía.
          </p>
        )}

        {error && <p className="rounded-xl bg-[#fff1f4] px-3 py-2 text-[11.5px] font-semibold text-[#c2274a]">{error}</p>}

        <div className="flex items-center justify-between gap-3 border-t border-[#eef3fb] pt-4">
          <p className="text-[10px] font-medium text-[#8aa0c4]">
            No acuse sin pruebas: las alertas falsas se retiran y los moderadores pueden verificarlas.
          </p>
          <button type="button" onClick={submit} disabled={sending || scanning} className={primaryButton}>
            {sending ? 'Publicando…' : 'Publicar alerta'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
