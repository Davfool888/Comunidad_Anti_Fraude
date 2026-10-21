import { Suspense, lazy, useState } from 'react'
import type { Community, CommunityNetwork } from '../../data/networks'
import { NetworkHero } from './NetworkHero'

/**
 * Escena de la ventana de **Comunidades**.
 *
 * Por defecto muestra el **mapa 2**: la comunidad de barrio a vista de cerca,
 * con los comercios colocados encima de las casas reales de la zona. Desde el
 * conmutador se puede pasar a la **vista isométrica** (la escena 3D).
 *
 * Los dos mapas se cargan en diferido porque arrastran Leaflet.
 */
const NeighborhoodMap = lazy(() =>
  import('./NeighborhoodMap').then((module) => ({ default: module.NeighborhoodMap })),
)

const NetworkMiniMap = lazy(() =>
  import('./NetworkMiniMap').then((module) => ({ default: module.NetworkMiniMap })),
)

export function CommunityStage({
  network,
  community,
  chatOpen,
  onOpenChat,
}: {
  network: CommunityNetwork
  community: Community | null
  chatOpen: boolean
  onOpenChat: () => void
}) {
  const [view, setView] = useState<'mapa' | 'isometrica'>('mapa')

  return (
    <div className="relative h-[100svh] min-h-[560px] w-full overflow-hidden">
      {view === 'mapa' ? (
        community ? (
          <Suspense
            fallback={
              <div className="absolute inset-0 grid place-items-center bg-[#dfe9fb] text-[12px] font-semibold text-[#8aa0c4]">
                Cargando el mapa del barrio…
              </div>
            }
          >
            <NeighborhoodMap
              network={network}
              community={community}
              className="absolute inset-0"
            />
          </Suspense>
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[#dfe9fb] text-[12px] font-semibold text-[#8aa0c4]">
            Elige una comunidad para ver su ubicación real.
          </div>
        )
      ) : (
        <NetworkHero
          network={network}
          community={community}
          onOpenChat={onOpenChat}
          chatOpen={chatOpen}
        />
      )}

      {/* conmutador de vista */}
      <div className="pointer-events-auto absolute top-3 left-1/2 z-[600] flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/85 p-1 shadow-[0_12px_28px_-16px_rgba(30,55,130,.8)] backdrop-blur-xl">
        {(
          [
            { id: 'mapa', label: 'Mapa del barrio' },
            { id: 'isometrica', label: 'Vista isométrica' },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setView(option.id)}
            className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition-colors duration-200 ${
              view === option.id
                ? 'bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] text-white shadow-[0_8px_18px_-10px_rgba(80,90,220,.9)]'
                : 'text-[#5d76a6] hover:bg-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {view === 'mapa' && (
        <>
          {/* mini-mapa: dónde está el barrio dentro de la ciudad */}
          <div className="pointer-events-none absolute bottom-14 left-4 z-30 w-[264px] overflow-hidden rounded-[20px] border border-white/70 bg-white/50 shadow-[0_26px_54px_-22px_rgba(30,55,130,.65)] backdrop-blur-md sm:left-5">
            <div className="pointer-events-auto relative h-[164px] w-full">
              <Suspense
                fallback={
                  <div className="h-full w-full bg-[#dfe9fb]" aria-hidden="true" />
                }
              >
                <NetworkMiniMap network={network} />
              </Suspense>
              <span className="pointer-events-none absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold text-[#1d2f57] shadow-[0_4px_10px_-4px_rgba(30,55,130,.7)] backdrop-blur">
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
                  {community ? `Barrio ${community.name}` : network.neighborhood}
                </p>
                <p className="text-[9.5px] font-semibold text-[#6b81ad]">
                  {community
                    ? `${network.neighborhood} · ${community.stats.merchants} comercios`
                    : `${network.commune} · ${network.stats.merchants} comercios`}
                </p>
              </div>
              <span
                className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
                style={{ background: network.color }}
              />
            </div>
          </div>

          {/* botón que abre el chat */}
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
                <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4V5a2 2 0 0 1 2-2Z" />
              </svg>
            </span>
            <span className="text-left leading-tight">
              Abrir el chat
              <span className="block text-[10px] font-semibold text-[#6b81ad]">
                {community ? `Barrio ${community.name}` : network.neighborhood}
              </span>
            </span>
          </button>
        </>
      )}
    </div>
  )
}
