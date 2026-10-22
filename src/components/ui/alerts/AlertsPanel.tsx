import { useState } from 'react'
import type { Community, CommunityNetwork } from '../../../data/networks'
import { useAlerts } from '../../../lib/alertsStore'
import { primaryButton } from '../Modal'
import { AlertCard } from './AlertCard'
import { AlertComposer } from './AlertComposer'
import { EntityLookup } from './EntityLookup'

/**
 * Alertas en vivo de la red: lo que están reportando los comercios y
 * vecinos del barrio y de la localidad, con el formulario para enviar una.
 */
export function AlertsPanel({ network, community }: { network: CommunityNetwork; community: Community | null }) {
  const [scope, setScope] = useState<'barrio' | 'localidad'>('barrio')
  const [composing, setComposing] = useState(false)
  const { alerts, online, loaded } = useAlerts({
    networkId: network.id,
    communityId: scope === 'barrio' ? community?.id : undefined,
  })

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
              {online ? 'conectado' : 'sin conexión'}
            </span>
          </h2>
          <p className="mt-1 text-[12.5px] font-medium text-[#6b81ad]">
            Lo que reportan los comercios de {scope === 'barrio' ? (community?.name ?? network.neighborhood) : network.neighborhood}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-white/80 p-1 ring-1 ring-[#dbe6f7]">
            {(['barrio', 'localidad'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setScope(option)}
                className={`rounded-full px-3 py-1 text-[11px] font-bold capitalize ${
                  scope === option ? 'bg-[#1d2f57] text-white' : 'text-[#5d76a6]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setComposing(true)} className={primaryButton}>
            + Enviar alerta
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid content-start gap-3 sm:grid-cols-2">
          {!loaded && <p className="text-[12px] font-semibold text-[#8aa0c4]">Cargando alertas…</p>}
          {loaded && alerts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#c9dbf6] bg-white/60 p-5 text-[12px] font-medium text-[#6b81ad] sm:col-span-2">
              {online
                ? 'No hay alertas recientes en esta zona. Si ve algo sospechoso, avise a la red.'
                : 'Inicie el servidor de la red (npm run dev:api) para ver y enviar alertas en vivo.'}
            </div>
          )}
          {alerts.slice(0, 30).map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
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
    </section>
  )
}
