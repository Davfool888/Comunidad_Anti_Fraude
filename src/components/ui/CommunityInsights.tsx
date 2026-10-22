import { useEffect, useState } from 'react'
import type { Community, CommunityNetwork } from '../../data/networks'
import { timeAgo, useAlerts } from '../../lib/alertsStore'
import { api, type CommunityStats } from '../../lib/api'
import { useMerchant } from '../../lib/merchantSession'
import { AiShieldScene, CheckWhatsappScene, ReceiptScene } from '../three/scenes/StaffScenes'
import { CommentersScene, CommunityScene, PreventionScene } from '../three/scenes/StatsScenes'
import { MerchantModal } from './alerts/MerchantModal'
import { SectionTitle, SideCard, StatCard } from './Sidebar'

/**
 * Parte baja de la ventana Comunidades: el barrio en cifras reales (últimos
 * 30 días, desde el backend) y accesos directos que sí hacen algo.
 *
 * Las cifras se recalculan cuando llega una alerta nueva por el flujo en vivo.
 */
export function CommunityInsights({
  network,
  community,
  onAnalyze,
  onLearn,
}: {
  network: CommunityNetwork
  community: Community | null
  onAnalyze: () => void
  onLearn: () => void
}) {
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [failed, setFailed] = useState(false)
  const [merchantOpen, setMerchantOpen] = useState(false)
  const merchant = useMerchant()
  const { alerts } = useAlerts({ networkId: network.id, communityId: community?.id })
  const place = community?.name ?? network.neighborhood

  // se recalcula al entrar en otro barrio y cada vez que cambian las alertas
  const alertsKey = alerts.map((alert) => `${alert.id}:${alert.confirmations}`).join(',')
  useEffect(() => {
    let alive = true
    api
      .communityStats(network.id, community?.id)
      .then((data) => {
        if (!alive) return
        setStats(data)
        setFailed(false)
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [network.id, community?.id, alertsKey])

  const value = (n: number | undefined) => (stats ? new Intl.NumberFormat('es-CO').format(n ?? 0) : '—')
  const scrollToLookup = () => document.getElementById('alertas')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-8">
      {/* el barrio en cifras */}
      <section aria-labelledby="barrio-cifras">
        <div className="mb-4">
          <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">Últimos 30 días</p>
          <h2 id="barrio-cifras" className="mt-1 text-[22px] leading-tight font-extrabold text-[#1d2f57]">
            {place} en cifras
          </h2>
          <p className="mt-1 text-[12px] font-medium text-[#6b81ad]">
            Datos reales de la red: se actualizan cuando llega una alerta.
            {stats?.last_alert_at ? ` Última alerta ${timeAgo(stats.last_alert_at)}.` : ''}
          </p>
        </div>
        {failed && !stats && (
          <p className="mb-4 rounded-2xl border border-dashed border-[#c9dbf6] bg-white/60 p-4 text-[12px] font-medium text-[#6b81ad]">
            No pudimos cargar las cifras del barrio. Revise su conexión.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard value={value(stats?.alerts)} label="Alertas del barrio" icon={<CommunityScene />} />
          <StatCard value={value(stats?.incidents)} label="Incidentes confirmados" icon={<PreventionScene />} />
          <StatCard value={value(stats?.confirmations)} label="«A mí también»" icon={<CommentersScene />} />
          <StatCard value={value(stats?.verified_merchants)} label="Comercios verificados" icon={<AiShieldScene />} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur">
            <p className="text-[10px] font-bold tracking-[0.14em] text-[#7a90b8] uppercase">Modalidad más reportada</p>
            {stats?.top_category ? (
              <>
                <p className="mt-1 text-[15px] font-extrabold text-[#1d2f57]">{stats.top_category.label}</p>
                <p className="text-[11px] font-semibold text-[#6b81ad]">{stats.top_category.total} alerta(s) en el barrio</p>
                <button type="button" onClick={onLearn} className="mt-2 text-[11.5px] font-bold text-[#5b7cf5]">
                  Aprender a prevenirla →
                </button>
              </>
            ) : (
              <p className="mt-1 text-[12px] font-medium text-[#8aa0c4]">Aún no hay suficientes reportes este mes.</p>
            )}
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur">
            <p className="text-[10px] font-bold tracking-[0.14em] text-[#7a90b8] uppercase">Asistente en {network.neighborhood}</p>
            <p className="mt-1 text-[15px] font-extrabold text-[#1d2f57]">
              {value(stats?.frauds_detected)} fraude(s) detectados
            </p>
            <p className="text-[11px] font-semibold text-[#6b81ad]">de {value(stats?.analyses)} mensajes analizados</p>
            <button type="button" onClick={onAnalyze} className="mt-2 text-[11.5px] font-bold text-[#5b7cf5]">
              Analizar un mensaje →
            </button>
          </div>
        </div>
      </section>

      {/* accesos directos */}
      <aside className="flex flex-col gap-4">
        <SectionTitle title="¿Qué necesita hacer?" subtitle="Herramientas de la red para su comercio" />
        <SideCard
          title="Analizar un mensaje o captura"
          description="El asistente le dice si es fraude y qué hacer."
          icon={<AiShieldScene />}
          action={<ActionButton onClick={onAnalyze}>Analizar ahora</ActionButton>}
          featured
        />
        <SideCard
          title="¿Este número ya fue reportado?"
          description="Consulte un teléfono, una cuenta o un enlace en la red."
          icon={<CheckWhatsappScene />}
          action={<ActionButton onClick={scrollToLookup}>Consultar</ActionButton>}
        />
        <SideCard
          title={merchant ? `${merchant.name} ✓` : 'Registrar mi comercio'}
          description={
            merchant
              ? 'Su comercio está verificado: sus alertas salen con su nombre.'
              : 'Pida la verificación para publicar con el nombre de su comercio.'
          }
          icon={<ReceiptScene />}
          action={<ActionButton onClick={() => setMerchantOpen(true)}>{merchant ? 'Ver mi comercio' : 'Solicitar'}</ActionButton>}
        />
      </aside>

      {merchantOpen && <MerchantModal network={network} community={community} onClose={() => setMerchantOpen(false)} />}
    </div>
  )
}

function ActionButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-block rounded-full bg-gradient-to-r from-lime-400 to-lime-500 px-3 py-[5px] text-[9.5px] font-bold text-plum-800 shadow-glow-lime transition-transform hover:-translate-y-0.5"
    >
      {children}
    </button>
  )
}
