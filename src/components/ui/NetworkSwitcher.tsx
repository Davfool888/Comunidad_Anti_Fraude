import { Suspense, lazy, useMemo, useState } from 'react'
import type { Community, CommunityNetwork } from '../../data/networks'
import { NETWORKS, communes, findCommunity, findNetwork } from '../../data/networks'

/**
 * El mapa (y con él la librería de Leaflet) se carga sólo cuando se abre el
 * panel: son ~150 kB que no hacen falta para ver la portada.
 */
const CommunityMap = lazy(() =>
  import('./CommunityMap').then((module) => ({ default: module.CommunityMap })),
)

/**
 * Conmutador de red comunitaria.
 *
 * Abre un panel con el **mapa de Bogotá** (Leaflet) donde cada localidad es
 * una red comunitaria, dibujada con su propio color. Dentro de cada localidad
 * hay puntos que representan las comunidades de barrio: al pulsar uno se
 * muestra su ficha ("Comunidad del barrio X").
 */

function MapPin({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
    </svg>
  )
}

/**
 * Zoom aproximado para encuadrar una localidad entera: se calcula a partir
 * de la extensión real de su polígono, para que una localidad grande no
 * aparezca diminuta ni una pequeña se corte.
 */
function zoomForNetwork(network: CommunityNetwork) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  network.rings[0]?.forEach(([lng, lat]) => {
    minX = Math.min(minX, lng)
    maxX = Math.max(maxX, lng)
    minY = Math.min(minY, lat)
    maxY = Math.max(maxY, lat)
  })
  const span = Math.max(maxY - minY, (maxX - minX) * 0.72)
  if (!Number.isFinite(span) || span <= 0) return 12
  const zoom = Math.log2(620 / span)
  return Math.min(14, Math.max(10, Math.round(zoom)))
}

export function NetworkSwitcher({
  activeNetwork,
  activeCommunity,
  onEnter,
  tone = 'cielo',
  className = '',
}: {
  activeNetwork: CommunityNetwork
  activeCommunity?: Community | null
  onEnter: (networkId: string, communityId?: string) => void
  /** Tono según el fondo sobre el que se apoya. */
  tone?: 'cielo' | 'claro'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(activeNetwork.id)
  const [communityId, setCommunityId] = useState<string | null>(
    activeNetwork.communities[0]?.id ?? null,
  )
  const [expanded, setExpanded] = useState<string | null>(activeNetwork.commune)
  /** Vista a la que se desplaza el mapa. */
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom: number } | null>(null)

  const selected = useMemo(() => findNetwork(selectedId), [selectedId])
  const community = useMemo(
    () => selected.communities.find((item) => item.id === communityId) ?? null,
    [selected, communityId],
  )
  const groups = useMemo(() => communes(), [])

  /** Al cambiar de localidad se selecciona su primera comunidad. */
  const selectLocalidad = (id: string) => {
    const network = findNetwork(id)
    setSelectedId(id)
    setCommunityId(network.communities[0]?.id ?? null)
    setFocus({ lat: network.lat, lng: network.lng, zoom: zoomForNetwork(network) })
  }

  /**
   * Al pulsar un punto del mapa se elige su comunidad y, si el punto pertenece
   * a otra localidad, se cambia también a esa red.
   */
  const selectCommunity = (id: string) => {
    const found = findCommunity(id)
    if (!found) return
    setSelectedId(found.network.id)
    setCommunityId(found.community.id)
    setFocus({ lat: found.community.lat, lng: found.community.lng, zoom: 13 })
  }

  return (
    <>
      {/* disparador */}
      <button
        type="button"
        onClick={() => {
          setSelectedId(activeNetwork.id)
          setCommunityId(activeNetwork.communities[0]?.id ?? null)
          setExpanded(activeNetwork.commune)
          setFocus(null)
          setOpen(true)
        }}
        className={`pointer-events-auto flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold shadow-[0_10px_26px_-14px_rgba(30,55,130,.7)] backdrop-blur-md transition-colors duration-200 ${
          tone === 'claro'
            ? 'border-[#dbe6f7] bg-white/80 text-[#1d2f57] hover:bg-white'
            : 'border-white/55 bg-white/30 text-white hover:bg-white/45'
        } ${className}`}
      >
        <MapPin className="h-3.5 w-3.5" />
        <span className="max-w-[160px] truncate">
          {activeCommunity
            ? `${activeNetwork.neighborhood} · ${activeCommunity.name}`
            : activeNetwork.neighborhood}
        </span>
        <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-80" fill="currentColor" aria-hidden="true">
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {/* panel */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Cambiar de red comunitaria"
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-[#16264a]/45 backdrop-blur-[3px]"
          />

          <div className="relative flex max-h-[90vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-[28px] border border-white/60 bg-[#f4f8ff]/95 shadow-[0_40px_90px_-30px_rgba(15,35,80,.65)] backdrop-blur-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[#dbe6f7] px-6 py-5">
              <div>
                <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">
                  Cambiar de red comunitaria
                </p>
                <h2 className="mt-1 text-[20px] leading-tight font-extrabold text-[#1d2f57]">
                  Mapa de Bogotá
                </h2>
                <p className="mt-0.5 text-[12px] font-medium text-[#6b81ad]">
                  {NETWORKS.length} localidades · elige una para entrar en su red
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/80 text-[#5b73a0] ring-1 ring-[#d7e3f5] transition-colors duration-200 hover:bg-white"
                aria-label="Cerrar"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z" />
                </svg>
              </button>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[1fr_330px]">
              {/* mapa Leaflet */}
              <div className="relative min-h-[320px] lg:min-h-[500px]">
                <Suspense
                  fallback={
                    <div className="grid h-full place-items-center bg-[#dfe9fb] text-[11px] font-semibold text-[#7a90b8]">
                      Cargando el mapa de Bogotá…
                    </div>
                  }
                >
                  <CommunityMap
                    networks={NETWORKS}
                    activeId={activeNetwork.id}
                    selectedId={selectedId}
                    selectedCommunityId={communityId}
                    focus={focus}
                    onSelect={selectLocalidad}
                    onSelectCommunity={selectCommunity}
                  />
                </Suspense>

                {/* leyenda de las 20 localidades */}
                <div className="pointer-events-auto absolute top-3 left-3 z-[500] w-[196px] rounded-2xl bg-white/88 p-2.5 shadow-[0_10px_24px_-12px_rgba(30,55,130,.7)] backdrop-blur">
                  <p className="text-[9.5px] font-bold tracking-[0.14em] text-[#7a90b8] uppercase">
                    Localidades
                  </p>
                  <ul className="mt-1.5 grid max-h-[168px] grid-cols-2 gap-x-2 gap-y-1 overflow-y-auto pr-1">
                    {NETWORKS.map((network) => (
                      <li key={network.id}>
                        <button
                          type="button"
                          onClick={() => selectLocalidad(network.id)}
                          className="flex w-full items-center gap-1.5 text-left text-[10px] font-semibold text-[#4a628f] transition-opacity duration-200 hover:opacity-100"
                          style={{ opacity: network.id === selectedId ? 1 : 0.7 }}
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-[3px]"
                            style={{ background: network.color }}
                          />
                          <span className="truncate">{network.neighborhood}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* lateral */}
              <aside className="flex flex-col gap-4 border-t border-[#dbe6f7] bg-white/60 p-5 lg:border-t-0 lg:border-l">
                <div>
                  <p className="text-[10.5px] font-bold tracking-[0.16em] text-[#7a90b8] uppercase">
                    Comunas
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {groups.map((group) => {
                      const isCurrent = group.name === expanded
                      return (
                        <li key={group.name}>
                          <button
                            type="button"
                            onClick={() => setExpanded(isCurrent ? null : group.name)}
                            className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold transition-colors duration-200 ${
                              isCurrent
                                ? 'bg-[#1d3f77] text-white shadow-[0_6px_16px_-8px_rgba(30,55,130,.8)]'
                                : 'bg-white/85 text-[#4a628f] hover:bg-white'
                            }`}
                          >
                            {group.name}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                <div>
                  <p className="text-[10.5px] font-bold tracking-[0.16em] text-[#7a90b8] uppercase">
                    Localidades
                  </p>
                  <ul className="mt-2 grid max-h-[190px] grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                    {NETWORKS.filter(
                      (network) => !expanded || network.commune === expanded,
                    ).map((network) => {
                      const isCurrent = network.id === selectedId
                      return (
                        <li key={network.id}>
                          <button
                            type="button"
                            onClick={() => selectLocalidad(network.id)}
                            className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold transition-colors duration-200 ${
                              isCurrent
                                ? 'bg-[#dce9ff] text-[#1d3f77] ring-1 ring-[#b9d2f5]'
                                : 'text-[#5d76a6] hover:bg-white/75'
                            }`}
                          >
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                              style={{ background: network.color }}
                            />
                            {network.neighborhood}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                <div>
                  <p className="text-[10.5px] font-bold tracking-[0.16em] text-[#7a90b8] uppercase">
                    Comunidades de {selected.neighborhood}
                  </p>
                  <ul className="mt-2 grid max-h-[168px] grid-cols-1 gap-1.5 overflow-y-auto pr-1">
                    {selected.communities.map((item) => {
                      const isCurrent = item.id === communityId
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => selectCommunity(item.id)}
                            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold transition-colors duration-200 ${
                              isCurrent
                                ? 'bg-[#dce9ff] text-[#1d3f77] ring-1 ring-[#b9d2f5]'
                                : 'text-[#5d76a6] hover:bg-white/75'
                            }`}
                          >
                            <span
                              className="shrink-0 rounded-full border-2 border-white"
                              style={{
                                background: selected.color,
                                width: 8 + item.radius * 5,
                                height: 8 + item.radius * 5,
                              }}
                            />
                            <span className="min-w-0 flex-1 truncate">{item.name}</span>
                            <span className="shrink-0 text-[9.5px] font-semibold text-[#8aa0c4]">
                              {item.stats.merchants}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {community && (
                  <div className="rounded-2xl border border-[#d7e3f5] bg-white/85 p-4">
                    <p className="text-[10px] font-bold tracking-[0.16em] text-[#8aa0c4] uppercase">
                      Comunidad
                    </p>
                    <h3 className="text-[16px] leading-tight font-extrabold text-[#1d2f57]">
                      Comunidad del barrio {community.name}
                    </h3>
                    <p className="mt-0.5 text-[10.5px] font-semibold text-[#8aa0c4]">
                      {selected.neighborhood} · {selected.commune}
                    </p>

                    <dl className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2">
                      {[
                        { label: 'Comercios', value: community.stats.merchants },
                        { label: 'Verificados', value: community.stats.verified },
                        { label: 'Satisfacción', value: `${community.stats.satisfaction}%` },
                      ].map((stat) => (
                        <div key={stat.label}>
                          <dt className="text-[9.5px] font-semibold text-[#8aa0c4]">{stat.label}</dt>
                          <dd className="text-[15px] font-extrabold text-[#243d6b]">{stat.value}</dd>
                        </div>
                      ))}
                    </dl>

                    <ul className="mt-3 flex flex-wrap gap-1">
                      {selected.commerce.slice(0, 4).map((item) => (
                        <li
                          key={item.id}
                          className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9.5px] font-semibold text-[#5d76a6]"
                        >
                          {item.name}
                        </li>
                      ))}
                    </ul>

                    <p className="mt-4 text-center text-[9.5px] font-semibold text-[#8aa0c4]">
                      Entrarás en la red de {selected.neighborhood}, en la comunidad de{' '}
                      {community.name}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        onEnter(selected.id, community.id)
                        setOpen(false)
                      }}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-3 py-2.5 text-[12px] font-bold text-white shadow-[0_10px_22px_-10px_rgba(80,90,220,.9)] transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Entrar en la red de {selected.neighborhood}
                    </button>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
