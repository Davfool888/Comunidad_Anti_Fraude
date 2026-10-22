import { useMemo, useState } from 'react'
import type { Community, CommunityNetwork } from '../../../data/networks'
import { useAlerts } from '../../../lib/alertsStore'
import type { Level } from '../../../lib/api'
import { useMerchant } from '../../../lib/merchantSession'
import { disablePush, enablePush, setSound, usePushState, useSound } from '../../../lib/notifications'
import { AlertDetailModal } from './AlertDetailModal'
import { primaryButton, secondaryButton } from '../Modal'
import { AlertCard } from './AlertCard'
import { AlertComposer } from './AlertComposer'
import { EntityLookup } from './EntityLookup'
import { LEVEL_STYLE } from './levelStyle'
import { MerchantModal } from './MerchantModal'

const PAGE = 12

/**
 * Alertas en vivo de la red: lo que están reportando los comercios y
 * vecinos del barrio y de la localidad, con filtros y el formulario para
 * enviar una.
 */
export function AlertsPanel({ network, community }: { network: CommunityNetwork; community: Community | null }) {
  const [scope, setScope] = useState<'barrio' | 'localidad'>('barrio')
  const [level, setLevel] = useState<Level | 'todas'>('todas')
  const [category, setCategory] = useState('todas')
  const [shown, setShown] = useState(PAGE)
  const [composing, setComposing] = useState(false)
  const [merchantOpen, setMerchantOpen] = useState(false)
  const merchant = useMerchant()
  const sound = useSound()
  const pushState = usePushState()
  const [pushError, setPushError] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)
  const { alerts, online, loaded, refresh } = useAlerts({
    networkId: network.id,
    communityId: scope === 'barrio' ? community?.id : undefined,
  })

  const categories = useMemo(() => {
    const seen = new Map<string, string>()
    alerts.forEach((alert) => seen.set(alert.category, alert.category_label))
    return [...seen.entries()]
  }, [alerts])

  const counts = useMemo(
    () => ({
      danger: alerts.filter((alert) => alert.level === 'danger').length,
      warning: alerts.filter((alert) => alert.level === 'warning').length,
      info: alerts.filter((alert) => alert.level === 'info').length,
    }),
    [alerts],
  )

  const filtered = alerts.filter(
    (alert) => (level === 'todas' || alert.level === level) && (category === 'todas' || alert.category === category),
  )
  const place = scope === 'barrio' ? (community?.name ?? network.neighborhood) : network.neighborhood
  const opened = alerts.find((alert) => alert.id === openId) ?? null

  const togglePush = async () => {
    setPushError('')
    try {
      if (pushState === 'activo') await disablePush()
      else await enablePush(network.id, community?.id)
    } catch (error) {
      setPushError(error instanceof Error ? error.message : 'No se pudieron activar los avisos.')
    }
  }

  return (
    <section id="alertas" className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">Red comunitaria</p>
          <h2 className="mt-1 flex items-center gap-2 text-[24px] leading-tight font-extrabold text-[#1d2f57]">
            Alertas en vivo
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                online ? 'bg-[#d9f5e6] text-[#1d7a53]' : 'bg-[#eef1f6] text-[#8aa0c4]'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${online ? 'animate-pulse bg-[#2fb87c]' : 'bg-[#a3b5d4]'}`} />
              {online ? 'en vivo' : 'sin conexión'}
            </span>
          </h2>
          <p className="mt-1 text-[12.5px] font-medium text-[#6b81ad]">Lo que reportan comercios y vecinos de {place}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-white/80 p-1 ring-1 ring-[#dbe6f7]" role="group" aria-label="Alcance">
            {(['barrio', 'localidad'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={scope === option}
                onClick={() => {
                  setScope(option)
                  setShown(PAGE)
                }}
                className={`rounded-full px-3 py-1 text-[11px] font-bold capitalize ${
                  scope === option ? 'bg-[#1d2f57] text-white' : 'text-[#5d76a6]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSound(!sound)}
            aria-pressed={sound}
            title={sound ? 'Silenciar el sonido de las alertas' : 'Activar el sonido de las alertas'}
            className={secondaryButton}
          >
            {sound ? '🔊' : '🔇'}
          </button>
          {pushState !== 'no-soportado' && (
            <button
              type="button"
              onClick={() => void togglePush()}
              aria-pressed={pushState === 'activo'}
              disabled={pushState === 'bloqueado'}
              title={
                pushState === 'bloqueado'
                  ? 'Las notificaciones están bloqueadas en el navegador'
                  : 'Recibir las alertas del barrio aunque la página esté cerrada'
              }
              className={secondaryButton}
            >
              {pushState === 'activo' ? '🔔 Avisos activos' : pushState === 'bloqueado' ? '🔕 Avisos bloqueados' : '🔔 Activar avisos'}
            </button>
          )}
          <button type="button" onClick={() => setMerchantOpen(true)} className={secondaryButton}>
            {merchant ? (
              <>
                <span className="text-[#2fb87c]">✓</span> {merchant.name}
              </>
            ) : (
              'Registrar mi comercio'
            )}
          </button>
          <button type="button" onClick={() => setComposing(true)} className={primaryButton}>
            + Enviar alerta
          </button>
        </div>
      </div>

      {pushError && (
        <p className="mb-3 rounded-xl bg-[#fff1f4] px-3 py-2 text-[11.5px] font-semibold text-[#c2274a]">{pushError}</p>
      )}

      {/* filtros */}
      {alerts.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={level === 'todas'}
            onClick={() => setLevel('todas')}
            className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${
              level === 'todas' ? 'bg-[#1d2f57] text-white ring-[#1d2f57]' : 'bg-white text-[#4a628f] ring-[#dbe6f7]'
            }`}
          >
            Todas · {alerts.length}
          </button>
          {(['danger', 'warning', 'info'] as const).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={level === id}
              onClick={() => setLevel(level === id ? 'todas' : id)}
              disabled={counts[id] === 0}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ring-1 disabled:opacity-40 ${
                level === id ? `${LEVEL_STYLE[id].chip} ring-transparent` : 'bg-white text-[#4a628f] ring-[#dbe6f7]'
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: level === id ? '#fff' : LEVEL_STYLE[id].dot }} />
              {LEVEL_STYLE[id].label} · {counts[id]}
            </button>
          ))}
          {categories.length > 1 && (
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-8 rounded-full border border-[#dbe6f7] bg-white px-3 text-[11px] font-bold text-[#4a628f] outline-none"
              aria-label="Filtrar por modalidad"
            >
              <option value="todas">Todas las modalidades</option>
              {categories.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid content-start gap-3 sm:grid-cols-2">
          {!loaded && <p className="text-[12px] font-semibold text-[#8aa0c4]">Cargando alertas…</p>}
          {loaded && !online && alerts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#c9dbf6] bg-white/60 p-5 text-[12px] font-medium text-[#6b81ad] sm:col-span-2">
              No pudimos conectarnos con la red. Revise su conexión a internet.{' '}
              <button type="button" onClick={() => void refresh()} className="font-bold text-[#5b7cf5]">
                Reintentar
              </button>
            </div>
          )}
          {loaded && online && alerts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#c9dbf6] bg-white/60 p-5 text-[12px] font-medium text-[#6b81ad] sm:col-span-2">
              No hay alertas recientes en {place}. Si ve algo sospechoso, avise a la red: puede evitar que otro comercio caiga.
            </div>
          )}
          {alerts.length > 0 && filtered.length === 0 && (
            <p className="text-[12px] font-medium text-[#8aa0c4] sm:col-span-2">Ninguna alerta coincide con el filtro.</p>
          )}
          {filtered.slice(0, shown).map((alert) => (
            <AlertCard key={alert.id} alert={alert} onOpen={() => setOpenId(alert.id)} />
          ))}
          {filtered.length > shown && (
            <button type="button" onClick={() => setShown((value) => value + PAGE)} className={`${secondaryButton} sm:col-span-2`}>
              Ver más alertas ({filtered.length - shown})
            </button>
          )}
        </div>
        <aside className="space-y-3">
          <EntityLookup />
          <div className="rounded-2xl border border-[#dbe6f7] bg-white/80 p-3 text-[10.5px] leading-relaxed font-medium text-[#6b81ad]">
            <p className="text-[9.5px] font-bold tracking-[0.14em] text-[#7a90b8] uppercase">Líneas de emergencia</p>
            <ul className="mt-1.5 space-y-0.5">
              <li><b className="text-[#1d2f57]">123</b> · Policía (emergencias)</li>
              <li><b className="text-[#1d2f57]">165</b> · GAULA (extorsión y secuestro)</li>
              <li><b className="text-[#1d2f57]">CAI Virtual</b> · caivirtual.policia.gov.co</li>
              <li><b className="text-[#1d2f57]">122</b> · Fiscalía (denuncias)</li>
            </ul>
          </div>
        </aside>
      </div>

      {composing && <AlertComposer network={network} community={community} onClose={() => setComposing(false)} />}
      {opened && <AlertDetailModal alert={opened} onClose={() => setOpenId(null)} />}
      {merchantOpen && <MerchantModal network={network} community={community} onClose={() => setMerchantOpen(false)} />}
    </section>
  )
}
