import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CommunityAlert } from '../../../lib/api'
import { api } from '../../../lib/api'
import { onLiveEvent, retainLive } from '../../../lib/live'
import { useMerchant } from '../../../lib/merchantSession'
import { playAlertSound, unlockAudio } from '../../../lib/notifications'

/**
 * «Modo cámara» del local: un celular o tablet del comercio queda con esta
 * pantalla abierta y la cámara encendida.
 *
 *  · Envía una imagen cada 4 s (los rostros se pixelan en el propio
 *    dispositivo antes de salir).
 *  · Si llega una alerta que afecta a este comercio, suena la alarma, la
 *    pantalla se pone en rojo y la cámara pasa a una imagen por segundo
 *    mientras dura la alerta.
 *  · Mantiene la pantalla encendida (Wake Lock) cuando el navegador lo permite.
 */

const NORMAL_MS = 4000
const ALERT_MS = 1000

export function CameraStation({ onClose }: { onClose: () => void }) {
  const merchant = useMerchant()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'iniciando' | 'transmitiendo' | 'error'>('iniciando')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(0)
  const [lastSent, setLastSent] = useState<string | null>(null)
  const [alarm, setAlarm] = useState<CommunityAlert | null>(null)
  const [boostUntil, setBoostUntil] = useState(0)

  // cámara del dispositivo
  useEffect(() => {
    let stream: MediaStream | null = null
    let lock: { release: () => Promise<void> } | null = null
    ;(async () => {
      try {
        const settings = await api.myMerchant()
        if (settings.camera.mode !== 'dispositivo' || !settings.camera.enabled) {
          throw new Error('Active primero «Este dispositivo» como cámara del local en «Mi comercio».')
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setStatus('transmitiendo')
        const wakeLock = (navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
        lock = (await wakeLock?.request('screen').catch(() => null)) ?? null
      } catch (err) {
        setStatus('error')
        setError(
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'El navegador no dio permiso para usar la cámara. Permítalo en la barra de direcciones.'
            : err instanceof Error
              ? err.message
              : 'No se pudo abrir la cámara.',
        )
      }
    })()
    return () => {
      stream?.getTracks().forEach((track) => track.stop())
      void lock?.release().catch(() => undefined)
    }
  }, [])

  // envío de imágenes
  useEffect(() => {
    if (status !== 'transmitiendo') return
    let alive = true
    let timer = 0
    const loop = async () => {
      const video = videoRef.current
      if (video && video.videoWidth > 0) {
        try {
          const { captureRedactedFrame } = await import('../../../lib/ai/vision')
          const frame = await captureRedactedFrame(video)
          const response = await api.uploadFrame(frame)
          if (response.ok) {
            setSent((value) => value + 1)
            setLastSent(new Date().toLocaleTimeString('es-CO'))
            setError('')
          } else if (response.status === 401 || response.status === 409) {
            setError('La cámara del local se desactivó o el código ya no es válido.')
          }
        } catch {
          setError('Sin conexión: se reintenta en unos segundos.')
        }
      }
      if (alive) timer = window.setTimeout(loop, Date.now() < boostUntil ? ALERT_MS : NORMAL_MS)
    }
    void loop()
    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [status, boostUntil])

  // alarma cuando una alerta afecta a este comercio
  useEffect(() => {
    const release = retainLive()
    const off = onLiveEvent<CommunityAlert>('alert', (alert) => {
      if (!merchant || alert.affected_merchant?.id !== merchant.id) return
      setAlarm(alert)
      setBoostUntil(alert.camera?.live_until ? new Date(alert.camera.live_until).getTime() : Date.now() + 30 * 60000)
    })
    return () => {
      off()
      release()
    }
  }, [merchant])

  useEffect(() => {
    if (!alarm) return
    playAlertSound('alarma')
    const timer = window.setInterval(() => playAlertSound('alarma'), 6000)
    return () => window.clearInterval(timer)
  }, [alarm])

  const boosted = Date.now() < boostUntil

  return createPortal(
    <div className={`fixed inset-0 z-[3000] flex flex-col ${alarm ? 'bg-[#7a0f24]' : 'bg-[#0f1a33]'}`} onClick={unlockAudio}>
      <header className="flex items-center gap-3 px-4 py-3 text-white">
        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${status === 'transmitiendo' ? 'bg-[#e23b5f]' : 'bg-white/15'}`}>
          <span className={`h-2 w-2 rounded-full bg-white ${status === 'transmitiendo' ? 'animate-pulse' : 'opacity-50'}`} />
          {status === 'transmitiendo' ? (boosted ? 'ALERTA · 1 imagen por segundo' : 'Modo cámara activo') : status === 'error' ? 'Cámara detenida' : 'Iniciando…'}
        </span>
        <span className="min-w-0 truncate text-[13px] font-bold">{merchant?.name ?? 'Comercio'}</span>
        <button type="button" onClick={onClose} className="ml-auto rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-bold hover:bg-white/25">
          Salir del modo cámara
        </button>
      </header>

      {alarm && (
        <div className="mx-4 mb-3 rounded-2xl bg-[#e23b5f] p-4 text-white shadow-2xl">
          <p className="text-[18px] font-extrabold">🚨 Alerta en su comercio</p>
          <p className="mt-1 text-[14px] font-semibold">{alarm.title}</p>
          <p className="mt-1 text-[12px] text-white/85">
            Su cámara se está mostrando a la comunidad del barrio mientras dura la alerta. Si hay peligro, póngase a salvo y
            llame al 123.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="tel:123" className="rounded-full bg-white px-4 py-2 text-[13px] font-extrabold text-[#c2274a]">
              Llamar al 123
            </a>
            <button type="button" onClick={() => setAlarm(null)} className="rounded-full bg-white/20 px-4 py-2 text-[13px] font-bold">
              Silenciar alarma
            </button>
          </div>
        </div>
      )}

      <div className="relative mx-4 flex-1 overflow-hidden rounded-2xl bg-black">
        <video ref={videoRef} muted playsInline className="h-full w-full object-contain" />
        {status !== 'transmitiendo' && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-[14px] font-semibold text-white/85">
            {status === 'error' ? error : 'Abriendo la cámara… acepte el permiso del navegador.'}
          </div>
        )}
      </div>

      <footer className="px-4 py-3 text-[11.5px] font-medium text-white/70">
        {status === 'transmitiendo' && (
          <p>
            Imágenes enviadas: {sent}
            {lastSent ? ` · última a las ${lastSent}` : ''}. Los rostros se pixelan antes de salir del dispositivo. Deje esta
            pantalla abierta y el equipo conectado a la corriente.
          </p>
        )}
        {status === 'transmitiendo' && error && <p className="mt-1 font-bold text-[#ffb3c1]">{error}</p>}
      </footer>
    </div>,
    document.body,
  )
}
