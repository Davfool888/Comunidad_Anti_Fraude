import { Suspense, lazy } from 'react'
import type { Community, CommunityNetwork } from '../../data/networks'
import type { HousePoint } from '../../data/houses'
import { NetworkCanvas } from '../three/network/NetworkCanvas'
import { NetworkStatsPanel } from './NetworkStatsPanel'

/**
 * El mini-mapa usa Leaflet: se carga en diferido para no meter la librería
 * (y su CSS) en el paquete inicial de la portada.
 */
const NetworkMiniMap = lazy(() =>
  import('./NetworkMiniMap').then((module) => ({ default: module.NetworkMiniMap })),
)

/**
 * Escena principal a sangre: la red isométrica de comercios con la interfaz
 * flotante superpuesta (panel de estadísticas a la derecha).
 *
 * El conmutador de red comunitaria carga el mapa de barrios de la región; al
 * entrar en una red, la escena 3D adopta sus comercios y sus datos. Dentro de
 * cada red se puede elegir además una comunidad de barrio, que se refleja en
 * el rótulo del núcleo y en el panel de estadísticas.
 */
export function NetworkHero({
  network,
  community,
  anchors,
  onOpenChat,
  chatOpen = false,
  className = '',
}: {
  network: CommunityNetwork
  community?: Community | null
  /** Casas reales donde están los comercios (OpenStreetMap). */
  anchors?: HousePoint[]
  onOpenChat: () => void
  /** El chat está abierto: el mini-mapa se aparta para no quedar tapado. */
  chatOpen?: boolean
  className?: string
}) {
  const activeCommunity = community ?? null

  return (
    <section className={`relative w-full ${className}`}>
      <div className="relative h-[100svh] min-h-[560px] w-full overflow-hidden">
        {/* fondo de cielo detrás del canvas */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #8ab4ee 0%, #b0cdf3 38%, #d6e3f8 72%, #eaeffb 100%)',
          }}
        />

        <NetworkCanvas
          className="absolute inset-0"
          network={network}
          community={activeCommunity ?? undefined}
          anchors={anchors}
        />


        {/* mini-mapa con la red activa, abajo a la izquierda */}
        <div
          className={`pointer-events-none absolute bottom-14 left-4 z-30 w-[264px] overflow-hidden rounded-[20px] border border-white/70 bg-white/50 shadow-[0_26px_54px_-22px_rgba(30,55,130,.65)] backdrop-blur-md transition-all duration-300 sm:left-5 ${
            chatOpen ? '!left-[452px]' : ''
          }`}
        >
          <div className="pointer-events-auto relative h-[164px] w-full">
            <Suspense
              fallback={
                <div
                  className="h-full w-full"
                  style={{ background: `linear-gradient(160deg, ${network.color}55, #dfe9fb)` }}
                />
              }
            >
              <NetworkMiniMap network={network} />
            </Suspense>
            {/* chincheta sobre el punto activo */}
            <span
              className="pointer-events-none absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold text-[#1d2f57] shadow-[0_4px_10px_-4px_rgba(30,55,130,.7)] backdrop-blur"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: network.color }}
              />
              Bogotá, Colombia
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-[11px] leading-tight font-extrabold text-[#1d2f57]">
                {activeCommunity ? `Barrio ${activeCommunity.name}` : network.neighborhood}
              </p>
              <p className="text-[9.5px] font-semibold text-[#6b81ad]">
                {activeCommunity
                  ? `${network.neighborhood} · ${activeCommunity.stats.merchants} comercios`
                  : `${network.commune} · ${network.stats.merchants} comercios`}
              </p>
            </div>
            <span
              className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
              style={{ background: network.color }}
            />
          </div>
        </div>

        {/* panel de estadísticas: flotante en escritorio */}
        <div className="pointer-events-none absolute top-[76px] right-7 z-20 hidden lg:block">
          <NetworkStatsPanel network={network} community={activeCommunity ?? undefined} />
        </div>

        {/* botón que abre el chat de la comunidad (panel izquierdo) */}
        <button
          type="button"
          onClick={onOpenChat}
          className="pointer-events-auto absolute right-6 bottom-24 z-30 flex items-center gap-2.5 rounded-full border border-white/70 bg-white/85 px-4 py-3 text-[12px] font-bold text-[#1d2f57] shadow-[0_26px_54px_-22px_rgba(30,55,130,.7)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5"
        >
          <span
            className="grid h-8 w-8 place-items-center rounded-full text-white"
            style={{ background: network.color }}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2Zm2 4v2h12V8H6Zm0 4v2h8v-2H6Z" />
            </svg>
          </span>
          <span className="text-left leading-tight">
            Abrir el chat
            <span className="block text-[10px] font-semibold text-[#6b81ad]">
              {activeCommunity ? `Barrio ${activeCommunity.name}` : network.neighborhood}
            </span>
          </span>
        </button>

        {/* degradado inferior: la rejilla se disuelve con el fondo de la página */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-56"
          style={{
            background:
              'linear-gradient(180deg, rgba(238,244,253,0) 0%, rgba(238,244,253,.35) 34%, rgba(238,244,253,.8) 64%, rgba(238,244,253,.97) 86%, rgba(238,244,253,1) 100%)',
          }}
        />
      </div>

      {/* en móvil el panel baja a un bloque propio para no tapar la escena */}
      <div className="mx-auto w-full max-w-[420px] px-4 pt-8 lg:hidden">
        <NetworkStatsPanel network={network} community={activeCommunity ?? undefined} />
      </div>
    </section>
  )
}


