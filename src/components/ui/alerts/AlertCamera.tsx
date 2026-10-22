import { useEffect, useState } from 'react'
import { alertFrameUrl, api, type CommunityAlert } from '../../../lib/api'

/**
 * Cámara del comercio afectado: imagen en vivo mientras dura la alerta y las
 * imágenes guardadas como evidencia al momento de reportarla.
 *
 * La imagen se pide al servidor cada 1,5 s (funciona igual con el «modo
 * cámara» de un celular y con una cámara IP); la dirección de la cámara
 * nunca llega al navegador.
 */
export function AlertCamera({ alert }: { alert: CommunityAlert }) {
  const camera = alert.camera
  const [tick, setTick] = useState(() => Date.now())
  const [failed, setFailed] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [evidence, setEvidence] = useState<{ url: string; captured_at: string }[]>([])
  const [zoom, setZoom] = useState<string | null>(null)

  const endsAt = camera ? new Date(camera.live_until).getTime() : 0
  const live = Boolean(camera?.available) && now < endsAt

  useEffect(() => {
    if (!live) return
    const timer = window.setInterval(() => {
      setTick(Date.now())
      setNow(Date.now())
    }, 1500)
    return () => window.clearInterval(timer)
  }, [live])

  useEffect(() => {
    if (!camera?.evidence) return
    let alive = true
    api
      .alertEvidence(alert.id)
      .then((items) => alive && setEvidence(items))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [alert.id, camera?.evidence])

  if (!camera || (!camera.available && !camera.evidence)) return null
  const minutes = Math.max(0, Math.ceil((endsAt - now) / 60000))

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-[#1d2f57]/10 bg-[#0f1a33]" aria-label="Cámara del comercio afectado">
      <header className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-white">
        <span className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 ${live ? 'bg-[#e23b5f]' : 'bg-white/15'}`}>
          <span className={`h-1.5 w-1.5 rounded-full bg-white ${live ? 'animate-pulse' : 'opacity-60'}`} />
          {live ? 'EN VIVO' : 'Transmisión terminada'}
        </span>
        <span className="min-w-0 truncate">
          Cámara de {alert.affected_merchant?.name ?? 'el comercio afectado'}
          {camera.mode === 'ip' ? ' · cámara IP' : camera.mode === 'dispositivo' ? ' · celular del local' : ''}
        </span>
        {live && <span className="ml-auto shrink-0 text-white/70">{minutes} min restantes</span>}
      </header>

      {live && (
        <div className="relative aspect-video w-full bg-black">
          {!failed ? (
            <img
              key={tick}
              src={alertFrameUrl(alert.id, tick)}
              alt={`Imagen en vivo de la cámara de ${alert.affected_merchant?.name ?? 'el comercio'}`}
              className="h-full w-full object-contain"
              onError={() => setFailed(true)}
              onLoad={() => setFailed(false)}
            />
          ) : null}
          {failed && (
            <div className="absolute inset-0 grid place-items-center p-4 text-center text-[12px] font-semibold text-white/80">
              La cámara del local no está enviando imagen en este momento. Se reintenta automáticamente…
              <img
                key={`retry-${tick}`}
                src={alertFrameUrl(alert.id, tick)}
                alt=""
                className="hidden"
                onLoad={() => setFailed(false)}
              />
            </div>
          )}
        </div>
      )}

      {evidence.length > 0 && (
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-bold tracking-[0.12em] text-white/60 uppercase">Evidencia al momento de la alerta</p>
          <div className="mt-1.5 flex gap-2 overflow-x-auto">
            {evidence.map((item) => (
              <button key={item.url} type="button" onClick={() => setZoom(item.url)} className="shrink-0" aria-label="Ampliar evidencia">
                <img src={item.url} alt="Evidencia de la cámara" loading="lazy" className="h-16 w-24 rounded-lg object-cover ring-1 ring-white/20" />
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="px-3 pb-2.5 text-[10px] leading-relaxed font-medium text-white/50">
        Se muestra a la comunidad sólo mientras dura la alerta. No difunda estas imágenes fuera de la red: entréguelas a
        la Policía si las necesita para la denuncia.
      </p>

      {zoom && (
        <div
          className="fixed inset-0 z-[2100] grid place-items-center bg-black/80 p-6"
          onClick={() => setZoom(null)}
          role="dialog"
          aria-label="Evidencia ampliada"
        >
          <img src={zoom} alt="Evidencia ampliada" className="max-h-[85vh] max-w-full rounded-xl" />
        </div>
      )}
    </section>
  )
}
