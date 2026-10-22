import { useEffect, useState } from 'react'
import type { Community, CommunityNetwork } from '../../../data/networks'
import { useAlerts } from '../../../lib/alertsStore'
import type { CommunityAlert } from '../../../lib/api'
import { onLiveEvent, retainLive } from '../../../lib/live'
import { readMerchant } from '../../../lib/merchantCode'
import { playAlertSound, refreshPushState, usePushState } from '../../../lib/notifications'
import { AlertDetailModal } from './AlertDetailModal'
import { LEVEL_STYLE } from './levelStyle'

type Toast = { alert: CommunityAlert; mine: boolean }

/**
 * Avisos de alertas nuevas en cualquier ventana de la app.
 *
 *  · Muestra un aviso flotante con sonido cuando llega una alerta del barrio
 *    (o de la localidad, si no tiene barrio).
 *  · Si la alerta afecta al comercio de este navegador, el aviso es una
 *    alarma prioritaria que no se cierra sola.
 *  · Con la página en segundo plano y sin push activo, usa la notificación
 *    del navegador.
 *  · Abre la alerta (con la cámara del comercio afectado) al pulsar el aviso,
 *    al pulsar una notificación push o al entrar con ?alerta=ID.
 */
export function AlertNotifier({ network, community }: { network: CommunityNetwork; community: Community | null }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [openId, setOpenId] = useState<number | null>(() => {
    const id = Number(new URLSearchParams(window.location.search).get('alerta'))
    return Number.isFinite(id) && id > 0 ? id : null
  })
  const { alerts } = useAlerts()
  const pushState = usePushState()
  const open = alerts.find((alert) => alert.id === openId) ?? null

  useEffect(() => {
    void refreshPushState()
    // al pulsar una notificación push con la app ya abierta
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; alertId?: number }
      if (data?.type === 'abrir-alerta' && data.alertId) setOpenId(data.alertId)
    }
    navigator.serviceWorker?.addEventListener('message', onMessage)
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage)
  }, [])

  // se limpia ?alerta=ID de la dirección cuando ya se abrió
  useEffect(() => {
    if (!open || !window.location.search.includes('alerta=')) return
    const url = new URL(window.location.href)
    url.searchParams.delete('alerta')
    window.history.replaceState(null, '', url)
  }, [open])

  useEffect(() => {
    const release = retainLive()
    const off = onLiveEvent<CommunityAlert>('alert', (alert) => {
      const merchant = readMerchant()
      const mine = Boolean(merchant && alert.affected_merchant?.id === merchant.id)
      const nearby =
        alert.network_id === network.id && (!community || !alert.community_id || alert.community_id === community.id)
      if (!mine && !nearby) return

      setToasts((current) => [{ alert, mine }, ...current.filter((toast) => toast.alert.id !== alert.id)].slice(0, 3))
      playAlertSound(mine ? 'alarma' : alert.level === 'danger' ? 'incidente' : 'aviso')

      if (document.hidden && pushState !== 'activo' && 'Notification' in window && Notification.permission === 'granted') {
        const notice = new Notification(mine ? `🚨 ALERTA EN SU COMERCIO: ${alert.title}` : `Alerta de la red: ${alert.title}`, {
          body: `${alert.category_label}${alert.camera?.available ? ' · Cámara del local en vivo' : ''}`,
          tag: `alerta-${alert.id}`,
          requireInteraction: mine,
        })
        notice.onclick = () => {
          window.focus()
          setOpenId(alert.id)
        }
      }
      if (!mine) {
        window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.alert.id !== alert.id)), 15000)
      }
    })
    return () => {
      off()
      release()
    }
  }, [network.id, community, pushState])

  const dismiss = (id: number) => setToasts((current) => current.filter((toast) => toast.alert.id !== id))

  return (
    <>
      <div className="pointer-events-none fixed right-4 bottom-4 z-[1500] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2" aria-live="assertive">
        {toasts.map(({ alert, mine }) => {
          const style = LEVEL_STYLE[alert.level]
          return (
            <div
              key={alert.id}
              role="alert"
              className={`pointer-events-auto overflow-hidden rounded-2xl border-l-4 bg-white shadow-[0_24px_50px_-20px_rgba(25,45,95,.7)] ${
                mine ? 'animate-pulse border-l-[#e23b5f] ring-2 ring-[#e23b5f]' : ''
              }`}
              style={mine ? undefined : { borderLeftColor: style.dot }}
            >
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-extrabold tracking-[0.08em] uppercase ${style.chip}`}>
                    {mine ? '🚨 Su comercio' : style.label}
                  </span>
                  {alert.camera?.available && (
                    <span className="rounded-full bg-[#0f1a33] px-2 py-0.5 text-[9.5px] font-extrabold text-white">📹 Cámara en vivo</span>
                  )}
                  <button
                    type="button"
                    onClick={() => dismiss(alert.id)}
                    className="ml-auto text-[16px] leading-none text-[#8aa0c4] hover:text-[#1d2f57]"
                    aria-label="Cerrar aviso"
                  >
                    ×
                  </button>
                </div>
                <p className="mt-1.5 text-[13px] leading-snug font-extrabold text-[#1d2f57]">
                  {mine ? `Alerta en su comercio: ${alert.title}` : alert.title}
                </p>
                <p className="text-[11px] font-semibold text-[#6b81ad]">
                  {alert.affected_merchant ? `Comercio afectado: ${alert.affected_merchant.name} · ` : ''}
                  {alert.category_label}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(alert.id)
                      dismiss(alert.id)
                    }}
                    className="rounded-full bg-[#1d2f57] px-3 py-1.5 text-[11px] font-bold text-white"
                  >
                    {alert.camera?.available ? 'Ver alerta y cámara' : 'Ver alerta'}
                  </button>
                  {mine && (
                    <a href="tel:123" className="rounded-full bg-[#e23b5f] px-3 py-1.5 text-[11px] font-bold text-white">
                      Llamar al 123
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {open && <AlertDetailModal alert={open} onClose={() => setOpenId(null)} />}
    </>
  )
}
