import { useEffect, useState, useSyncExternalStore } from 'react'
import { api, ApiError, type CameraSettings } from '../../../lib/api'
import { fieldClass, labelClass, primaryButton, secondaryButton } from '../Modal'
import { CameraStation } from './CameraStation'

/* ------------------------------------------------------------------ */
/* Ventana del modo cámara (se abre desde cualquier parte)            */
/* ------------------------------------------------------------------ */

let stationOpen = false
const stationListeners = new Set<() => void>()
const setStation = (value: boolean) => {
  stationOpen = value
  stationListeners.forEach((listener) => listener())
}

export const openCameraStation = () => setStation(true)

/** Se monta una vez en la app: muestra el modo cámara cuando se abre. */
export function CameraStationHost() {
  const open = useSyncExternalStore(
    (listener) => {
      stationListeners.add(listener)
      return () => stationListeners.delete(listener)
    },
    () => stationOpen,
  )
  return open ? <CameraStation onClose={() => setStation(false)} /> : null
}

/* ------------------------------------------------------------------ */
/* Configuración                                                      */
/* ------------------------------------------------------------------ */

const IP_STATUS = {
  pendiente: { text: 'Pendiente: un moderador debe aprobar la dirección', className: 'bg-[#fff1d8] text-[#b06f13]' },
  aprobada: { text: '✓ Aprobada por la red', className: 'bg-[#e4f7ee] text-[#1d7a53]' },
  rechazada: { text: 'Rechazada: revise la dirección o contacte a la red', className: 'bg-[#ffe0e6] text-[#c2274a]' },
} as const

/**
 * Cámara del local: qué se muestra a la comunidad cuando hay una alerta que
 * afecta a este comercio.
 */
export function CameraSettingsPanel({ onOpenStation }: { onOpenStation?: () => void }) {
  const [settings, setSettings] = useState<CameraSettings | null>(null)
  const [mode, setMode] = useState<CameraSettings['mode']>('ninguna')
  const [url, setUrl] = useState('')
  const [consent, setConsent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // una respuesta vieja no debe pisar lo que el comercio ya eligió
    let alive = true
    api
      .myMerchant()
      .then(({ camera }) => {
        if (!alive) return
        setSettings(camera)
        setMode(camera.mode)
        setConsent(Boolean(camera.consent_at))
      })
      .catch(() => alive && setError('No se pudo cargar la configuración de la cámara.'))
    return () => {
      alive = false
    }
  }, [])

  const save = async (enabled: boolean) => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const updated = await api.configureCamera({
        mode: enabled ? mode : 'ninguna',
        enabled,
        consent,
        url: mode === 'ip' && url.trim() ? url.trim() : undefined,
      })
      setSettings(updated)
      setMode(updated.mode)
      setUrl('')
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar. Revise su conexión.')
    } finally {
      setSaving(false)
    }
  }

  if (!settings) {
    return <p className="text-[11.5px] font-semibold text-[#8aa0c4]">{error || 'Cargando la cámara del local…'}</p>
  }

  const active = settings.enabled && settings.mode !== 'ninguna'

  return (
    <div className="space-y-3 rounded-2xl border border-[#dbe6f7] bg-[#f7faff] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-extrabold text-[#1d2f57]">📹 Cámara del local</p>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${active ? 'bg-[#e4f7ee] text-[#1d7a53]' : 'bg-[#eef1f6] text-[#8aa0c4]'}`}>
          {active ? 'Activa' : 'Apagada'}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed font-medium text-[#6b81ad]">
        Cuando una alerta afecta a su comercio, la imagen de su cámara se muestra a la comunidad del barrio durante{' '}
        {settings.window_minutes} minutos y se guardan las imágenes de ese momento como evidencia.
      </p>

      <div>
        <span className={labelClass}>Fuente de la cámara</span>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              ['dispositivo', 'Este celular o tablet'],
              ['ip', 'Cámara IP'],
              ['ninguna', 'Sin cámara'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
              className={`rounded-xl px-2 py-2 text-[11px] font-bold ring-1 ${mode === id ? 'bg-[#1d2f57] text-white ring-[#1d2f57]' : 'bg-white text-[#4a628f] ring-[#dbe6f7]'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'dispositivo' && (
        <p className="text-[10.5px] leading-relaxed font-medium text-[#6b81ad]">
          Deje un celular o tablet del local con el «modo cámara» abierto, apuntando a la caja o la entrada. Los rostros se
          pixelan en el propio equipo antes de enviar la imagen.
        </p>
      )}

      {mode === 'ip' && (
        <div className="space-y-1.5">
          <label className="block">
            <span className={labelClass}>Dirección de la imagen de la cámara</span>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={settings.ip_configured ? 'Configurada (escriba otra para cambiarla)' : 'http://192.168.1.20/snapshot.jpg'}
              className={fieldClass}
              autoComplete="off"
            />
          </label>
          <p className="text-[10px] font-medium text-[#8aa0c4]">
            Debe entregar una imagen JPEG o un video MJPEG (las cámaras que sólo dan RTSP necesitan un convertidor). No incluya
            usuario ni contraseña. La dirección nunca se muestra a la comunidad: el servidor reenvía la imagen. Los rostros no se
            pixelan con cámara IP.
          </p>
          {settings.ip_status && (
            <p className={`rounded-lg px-2.5 py-1.5 text-[10.5px] font-bold ${IP_STATUS[settings.ip_status].className}`}>
              {IP_STATUS[settings.ip_status].text}
            </p>
          )}
        </div>
      )}

      {mode !== 'ninguna' && !settings.consent_at && (
        <label className="flex items-start gap-2 text-[11px] leading-relaxed font-semibold text-[#4a628f]">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5" />
          El local tiene aviso visible de videovigilancia y acepto que la imagen de la cámara se muestre a la comunidad del
          barrio mientras dura una alerta que afecte a mi comercio (Ley 1581 de 2012).
        </label>
      )}

      {error && <p className="rounded-xl bg-[#fff1f4] px-3 py-2 text-[11px] font-semibold text-[#c2274a]">{error}</p>}
      {saved && !error && <p className="text-[11px] font-bold text-[#1d7a53]">✓ Cámara guardada</p>}

      <div className="flex flex-wrap justify-between gap-2">
        {active ? (
          <button type="button" onClick={() => save(false)} disabled={saving} className={secondaryButton}>
            Apagar cámara
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          {mode !== 'ninguna' && (
            <button
              type="button"
              onClick={() => save(true)}
              disabled={saving || (!consent && !settings.consent_at) || (mode === 'ip' && !url.trim() && !settings.ip_configured)}
              className={primaryButton}
            >
              {saving ? 'Guardando…' : active ? 'Guardar cambios' : 'Activar cámara'}
            </button>
          )}
          {settings.mode === 'dispositivo' && settings.enabled && onOpenStation && (
            <button type="button" onClick={onOpenStation} className={primaryButton}>
              Abrir modo cámara
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
