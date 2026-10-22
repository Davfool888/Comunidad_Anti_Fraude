import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Community, CommunityNetwork } from '../../data/networks'
import type { HousePoint } from '../../data/houses'
import { timeAgo, useAlerts } from '../../lib/alertsStore'
import { buildCommunityShops, placeShopCard } from '../../lib/communityMap'
import { STYLE_BY_BUSINESS } from '../three/network/arrangement'
import type { ShopStyle } from '../three/network/palette'
import { isoBuildingSvg, type IsoColors } from './isoBuilding'
import { SimulatedTag } from './learning/Visuals'
import {
  addStyleLayers,
  MAP_STYLES,
  type MapStyle,
  type MapStyleId,
  type StyleLayers,
} from './tileSources'

/**
 * **Mapa 2**: la comunidad de barrio vista de cerca, con los comercios de la
 * red colocados sobre construcciones reales de la zona.
 *
 * La capa visual reutiliza los comercios que ya existen en `community` y les
 * asigna construcciones del barrio con una selección determinista y repartida.
 * El anclaje viene de OpenStreetMap cuando está disponible; si el servicio no
 * responde, se usa la distribución aproximada que ya calcula el proyecto y se
 * indica en pantalla. Los comercios son registros ficticios de demostración:
 * no se presentan como establecimientos reales ni como verificados.
 *
 * El mapa puede acercarse hasta el nivel de casa. La tarjeta informativa se
 * calcula a partir de la posición proyectada del marcador, así que permanece
 * unida a su coordenada al mover, acercar o cambiar el tamaño de la ventana.
 */

/** Zoom al que se abre el mapa del barrio. */
const INITIAL_ZOOM = 19

/** Zoom mínimo de la vista de barrio: se ven las casas y las vías. */
const CLOSE_ZOOM = 18

/** Zoom máximo: nivel de casa y vías pequeñas. */
const MAX_ZOOM = 21

/** Zoom mínimo: el barrio completo dentro de la ciudad. */
const MIN_ZOOM = 15

/** Ancho máximo de la tarjeta. */
const CARD_WIDTH = 286

/** Alto de reserva mientras se mide la tarjeta real. */
const CARD_HEIGHT = 252

/** Convierte texto dinámico en HTML seguro para el `divIcon` de Leaflet. */
function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character)
}

/** Créditos del mapa en texto plano: la atribución viene en HTML para Leaflet. */
function attributionText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&copy;/g, '©')
    .replace(/&amp;/g, '&')
    .trim()
}

/** Estilo de edificio que corresponde a cada tipo de comercio. */
function shopStyle(business: string): ShopStyle {
  return STYLE_BY_BUSINESS[business] ?? 'grocery'
}

export function NeighborhoodMap({
  network,
  community,
  houses,
  loading,
  source,
  className = '',
  onSelectAlert,
}: {
  network: CommunityNetwork
  community: Community
  /** Construcciones válidas del barrio (reales o aproximadas). */
  houses: HousePoint[]
  /** true mientras se consultan las construcciones reales. */
  loading: boolean
  /** De dónde vienen los anclajes. */
  source: 'openstreetmap' | 'aproximado'
  className?: string
  /** Abre el detalle de una alerta al pulsar su marcador. */
  onSelectAlert?: (alertId: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const hoverTimerRef = useRef<number | null>(null)

  const [styleId, setStyleId] = useState<MapStyleId>('claro')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null)
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 })
  const [cardSize, setCardSize] = useState({ width: CARD_WIDTH, height: CARD_HEIGHT })

  /**
   * Los comercios visibles salen de la fuente que ya existe en la comunidad.
   * No se crean establecimientos nuevos: sólo se elige un anclaje distinto
   * para cada uno dentro de las construcciones del barrio.
   */
  const selection = useMemo(
    () => buildCommunityShops(community, houses, source),
    [community, houses, source],
  )
  const shops = selection.shops

  const displayId = hoveredId ?? selectedId
  const activeShop = useMemo(
    () => shops.find((shop) => shop.id === displayId) ?? null,
    [shops, displayId],
  )

  const cancelHoverClose = useCallback(() => {
    if (hoverTimerRef.current === null) return
    window.clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = null
  }, [])

  const scheduleHoverClose = useCallback(() => {
    cancelHoverClose()
    hoverTimerRef.current = window.setTimeout(() => {
      hoverTimerRef.current = null
      setHoveredId(null)
    }, 180)
  }, [cancelHoverClose])

  const closeCard = useCallback(() => {
    cancelHoverClose()
    setHoveredId(null)
    setSelectedId(null)
  }, [cancelHoverClose])

  useEffect(() => cancelHoverClose, [cancelHoverClose])

  // Crea el mapa una sola vez por barrio.
  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return

    const map = L.map(container, {
      center: [community.lat, community.lng],
      zoom: INITIAL_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      dragging: true,
    })

    mapRef.current = map
    const markerStore = markersRef.current

    // Escala visual de los edificios según el zoom. Tiene límites para que
    // sigan siendo reconocibles sin tapar las calles ni crecer sin fin.
    const updateScale = () => {
      const zoom = map.getZoom()
      const scale = Math.max(0.6, Math.min(1.16, 0.6 + (zoom - MIN_ZOOM) * 0.14))
      container.style.setProperty('--ns-zoom-scale', scale.toFixed(3))
    }
    updateScale()
    map.on('zoomend', updateScale)

    // La escena ocupa todo el panel: al cambiar el tamaño se recalcula el
    // tamaño interno de Leaflet sin perder el centro ni el zoom.
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ animate: false })
    })
    resizeObserver.observe(container)

    // Sonda de desarrollo: permite inspeccionar el mapa desde la consola
    if (import.meta.env.DEV) {
      ;(window as unknown as { __nsMap?: L.Map }).__nsMap = map
    }

    // El control de zoom baja un poco para no chocar con el conmutador de
    // estilos; la escala indica los metros reales de la vista.
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map)

    return () => {
      map.off('zoomend', updateScale)
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
      markerStore.clear()
    }
  }, [community.id, community.lat, community.lng])

  // Estilo de mapa: claro, calles o satélite.
  const style = MAP_STYLES.find((item) => item.id === styleId) ?? MAP_STYLES[0]
  const styleRef = useRef<MapStyle>(style)
  const layersRef = useRef<StyleLayers | null>(null)

  // Crea las capas de teselas con el estilo activo.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const layers = addStyleLayers(map, styleRef.current, MAX_ZOOM)
    layersRef.current = layers

    return () => {
      layers.remove()
      layersRef.current = null
    }
  }, [community.id])

  // Cambia de estilo sin rehacer las capas: el zoom y el centro se conservan.
  useEffect(() => {
    if (styleRef.current.id === style.id) return
    styleRef.current = style
    layersRef.current?.setStyle(style)
  }, [style])

  // Coloca los modelos sobre sus anclajes y libera los marcadores anteriores.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const clearMarkers = () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current.clear()
    }

    clearMarkers()

    if (shops.length === 0) {
      return clearMarkers
    }

    shops.forEach((shop, index) => {
      const skin = SKINS[index % SKINS.length]
      const style = shopStyle(shop.business)
      const html = `
        <button
          type="button"
          class="ns-shop-marker__button"
          aria-label="Ver información de ${escapeHtml(shop.name)}, ${escapeHtml(shop.business)}"
          aria-controls="ns-shop-card"
          aria-expanded="false"
        >
          <span class="ns-shop-marker__box">
            ${isoBuildingSvg(style, skin)}
            <span class="ns-shop-marker__base" aria-hidden="true"></span>
          </span>
        </button>
      `

      const icon = L.divIcon({
        className: 'ns-shop-marker',
        html,
        iconSize: [56, 66],
        iconAnchor: [28, 60],
      })

      const marker = L.marker([shop.lat, shop.lng], {
        icon,
        // El botón interior es el elemento accesible; el marcador de Leaflet
        // no añade un segundo tabulador.
        keyboard: false,
        title: shop.name,
        bubblingMouseEvents: false,
        riseOnHover: true,
      }).addTo(map)

      const show = () => {
        cancelHoverClose()
        setHoveredId(shop.id)
      }

      marker.on('mouseover', show)
      marker.on('mouseout', scheduleHoverClose)
      marker.on('click', (event) => {
        if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent)
        cancelHoverClose()
        setHoveredId(null)
        setSelectedId((current) => (current === shop.id ? null : shop.id))
      })

      // El foco del botón también abre la ficha, igual que el hover.
      const button = marker.getElement()?.querySelector('button')
      button?.addEventListener('focus', show)
      button?.addEventListener('blur', scheduleHoverClose)

      markersRef.current.set(shop.id, marker)
    })

    // Ajusta el encuadre a los modelos usados, no a todas las casas.
    const points = shops.map(
      (shop) => [shop.lat, shop.lng] as [number, number],
    )
    if (points.length > 0) {
      map.stop()
      map.fitBounds(L.latLngBounds(points), {
        padding: [64, 64],
        maxZoom: INITIAL_ZOOM,
        animate: false,
      })
      if (map.getZoom() < CLOSE_ZOOM) {
        map.setZoom(CLOSE_ZOOM, { animate: false })
      }
    }

    return clearMarkers
  }, [shops, cancelHoverClose, scheduleHoverClose])

  // Refleja la selección y el hover en los marcadores ya creados.
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const element = marker.getElement()
      if (!element) return

      element.classList.toggle('ns-shop-marker--selected', id === selectedId)
      element.classList.toggle('ns-shop-marker--hovered', id === hoveredId)
      marker.setZIndexOffset(id === selectedId ? 1200 : id === hoveredId ? 600 : 0)
      const button = element.querySelector('button')
      button?.setAttribute('aria-expanded', String(id === selectedId))
    })
  }, [selectedId, hoveredId, shops])

  // Tamaño del marco: se usa para colocar la tarjeta sin salirse del mapa.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return

    const measure = () => {
      setFrameSize({ width: frame.clientWidth, height: frame.clientHeight })
    }
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  // Proyecta la coordenada del comercio activo sobre el contenedor del mapa.
  // Se actualiza con el desplazamiento y el zoom, con un frame de margen para
  // no renderizar más de lo necesario.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !activeShop) {
      setAnchorPoint(null)
      return
    }

    let frame = 0
    const update = () => {
      const point = map.latLngToContainerPoint([activeShop.lat, activeShop.lng])
      setAnchorPoint({ x: point.x, y: point.y })
    }
    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        update()
      })
    }

    update()
    map.on('move zoom resize viewreset', schedule)
    window.addEventListener('resize', schedule)

    return () => {
      map.off('move zoom resize viewreset', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [activeShop])

  // Mide la ficha real: el alto cambia con el contenido y con el ancho móvil.
  useEffect(() => {
    if (!activeShop) return
    const card = cardRef.current
    if (!card) return

    const measure = () => {
      setCardSize({ width: card.offsetWidth, height: card.offsetHeight })
    }
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(card)
    return () => observer.disconnect()
  }, [activeShop])

  const cardWidth = Math.min(CARD_WIDTH, Math.max(180, frameSize.width - 24))
  const placement =
    activeShop && anchorPoint && frameSize.width > 0
      ? placeShopCard({
          anchorX: anchorPoint.x,
          anchorY: anchorPoint.y,
          viewportWidth: frameSize.width,
          viewportHeight: frameSize.height,
          cardWidth,
          cardHeight: cardSize.height || CARD_HEIGHT,
        })
      : null

  // Alertas de la red en vivo: sobre el comercio que reportó o en su ubicación
  const { alerts } = useAlerts({ networkId: network.id, communityId: community.id })
  const alertMarkersRef = useRef<L.Marker[]>([])
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    alertMarkersRef.current.forEach((marker) => marker.remove())
    alertMarkersRef.current = []

    const colors = { danger: '#e23b5f', warning: '#e9a13b', info: '#5b7cf5' } as const
    // centro del grupo de comercios: ahí se reparten las alertas sin ubicación propia
    const hub = shops.length
      ? {
          lat: shops.reduce((sum, shop) => sum + shop.lat, 0) / shops.length,
          lng: shops.reduce((sum, shop) => sum + shop.lng, 0) / shops.length,
        }
      : { lat: community.lat, lng: community.lng }

    alerts.slice(0, 25).forEach((alert, index) => {
      // el comercio que reportó, ya ubicado sobre su construcción
      const shop = shops.find((item) => item.name === alert.business_name)
      // sin comercio ni coordenadas: alrededor del centro del barrio, sin solaparse
      const angle = index * 2.4
      const position: [number, number] = shop
        ? [shop.lat + 0.00012, shop.lng]
        : alert.lat != null && alert.lng != null && (alert.lat !== community.lat || alert.lng !== community.lng)
          ? [alert.lat, alert.lng]
          : [hub.lat + Math.sin(angle) * 0.00028, hub.lng + Math.cos(angle) * 0.00036]

      const color = colors[alert.level]
      const icon = L.divIcon({
        className: 'ns-alert-marker',
        html: `<span class="ns-alert-marker__dot" style="background:${color};border-color:${color}">!</span>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      })
      const marker = L.marker(position, { icon, zIndexOffset: 2000, title: alert.title, keyboard: true }).addTo(map)
      marker.on('click', () => onSelectAlert?.(alert.id))
      marker.on('keypress', (event) => {
        const key = (event.originalEvent as KeyboardEvent).key
        if (key === 'Enter' || key === ' ') onSelectAlert?.(alert.id)
      })
      const tooltip = document.createElement('span')
      const name = document.createElement('span')
      name.className = 'ns-alert-tooltip__name'
      name.textContent = alert.title // textContent: el texto del usuario nunca se interpreta como HTML
      const detail = document.createElement('span')
      detail.className = 'ns-alert-tooltip__label'
      detail.textContent = `${alert.category_label} · ${timeAgo(alert.created_at)}`
      tooltip.append(name, detail)
      marker.bindTooltip(tooltip, { direction: 'top', offset: [0, -14], className: 'ns-alert-tooltip' })
      alertMarkersRef.current.push(marker)
    })
  }, [alerts, shops, community, onSelectAlert])

  return (
    <div
      ref={frameRef}
      // isolate: las capas de Leaflet (z-index 400+) no tapan la cabecera ni los botones flotantes
      className={`relative isolate h-full w-full ${className}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') closeCard()
      }}
    >
      <div ref={containerRef} className="ns-map h-full w-full bg-[#dfe9fb]" />

      {/* etiqueta de la simulación y estado de los datos */}
      <div className="pointer-events-none absolute top-[104px] left-4 z-[500] flex max-w-[280px] flex-col items-start gap-2 sm:left-5">
        <SimulatedTag />
        <span
          role="status"
          className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#4a628f] shadow-sm backdrop-blur"
        >
          {loading
            ? 'Buscando las construcciones del barrio…'
            : source === 'openstreetmap'
              ? 'Comercios de demostración sobre construcciones de OpenStreetMap'
              : 'Comercios de demostración con ubicación aproximada'}
        </span>
        <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold text-[#4a628f] shadow-sm backdrop-blur">
          {loading
            ? `${shops.length} comercios visibles mientras llegan los datos`
            : `${shops.length} de ${selection.totalBusinesses} comercios con ubicación`}
        </span>
        {!loading && selection.coverage === 'parcial' && shops.length > 0 && (
          <span className="rounded-xl border border-[#f1d49a] bg-[#fff8e8]/95 px-2.5 py-1.5 text-[9.5px] leading-snug font-semibold text-[#8b6417] shadow-sm backdrop-blur">
            Cobertura parcial: sólo {shops.length} de {selection.totalBusinesses}{' '}
            comercios tienen una coordenada válida. No se inventan ubicaciones.
          </span>
        )}
      </div>

      {/* estilos de mapa: claro, calles o satélite */}
      <div className="absolute top-[172px] right-4 z-[500] flex items-center gap-1 rounded-full sm:top-[124px] sm:right-6 lg:right-7 bg-white/85 p-1 shadow-[0_12px_28px_-16px_rgba(30,55,130,.8)] backdrop-blur-xl">
        {MAP_STYLES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStyleId(item.id)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5] ${
              styleId === item.id
                ? 'bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] text-white shadow-[0_8px_18px_-10px_rgba(80,90,220,.9)]'
                : 'text-[#5d76a6] hover:bg-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* estado vacío: no hay coordenadas válidas para esta comunidad */}
      {!loading && shops.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-[450] grid place-items-center">
          <div className="max-w-[320px] rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-center shadow-[0_18px_40px_-24px_rgba(30,55,130,.8)] backdrop-blur">
            <p className="text-[12px] font-extrabold text-[#243d6b]">Sin datos para esta zona</p>
            <p className="mt-1 text-[10.5px] font-semibold text-[#5d76a6]">
              No se identificaron construcciones con coordenadas válidas. Los
              datos dependen de la cobertura de OpenStreetMap.
            </p>
          </div>
        </div>
      )}

      {/* tarjeta informativa: una sola a la vez, anclada a su marcador */}
      {activeShop && placement && frameSize.width > 0 && (
        <article
          id="ns-shop-card"
          ref={cardRef}
          role="group"
          aria-label={`Información de ${activeShop.name}`}
          className="ns-shop-card pointer-events-auto absolute z-[650] rounded-2xl border border-[#dbe7f8] bg-white/97 p-3 shadow-[0_22px_48px_-20px_rgba(22,45,95,.7)] backdrop-blur-xl"
          style={{
            left: placement.left,
            top: placement.top,
            width: cardWidth,
            transform: 'translateX(-50%)',
          }}
          onPointerEnter={cancelHoverClose}
          onPointerLeave={scheduleHoverClose}
          onFocus={cancelHoverClose}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              scheduleHoverClose()
            }
          }}
        >
          <span
            aria-hidden="true"
            className={`absolute h-3 w-3 rotate-45 bg-white ${
              placement.side === 'above'
                ? '-bottom-1.5 border-r border-b border-[#dbe7f8]'
                : '-top-1.5 border-t border-l border-[#dbe7f8]'
            }`}
            style={{ left: placement.arrowX - 6 }}
          />

          <div className="flex items-start gap-2.5">
            <span
              className="ns-shop-card__icon grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#eef4fd]"
              aria-hidden="true"
              dangerouslySetInnerHTML={{
                __html: isoBuildingSvg(
                  shopStyle(activeShop.business),
                  SKINS[Math.max(0, shops.findIndex((shop) => shop.id === activeShop.id)) % SKINS.length],
                ),
              }}
            />

            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-full bg-[#fff4e2] px-2 py-0.5 text-[8.5px] font-extrabold tracking-[0.09em] text-[#a86a12] uppercase">
                Comercio de demostración
              </span>
              <h3 className="mt-1 text-[13px] leading-tight font-extrabold text-[#243d6b]">
                {activeShop.name}
              </h3>
              <p className="mt-0.5 text-[10px] font-bold text-[#7b90b5]">
                {activeShop.business}
              </p>
            </div>

            <button
              type="button"
              onClick={closeCard}
              aria-label="Cerrar la información del comercio"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[#7b90b5] transition-colors hover:bg-[#eef4fd] hover:text-[#243d6b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5]"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <dl className="mt-2.5 space-y-1.5 border-t border-[#e8eef9] pt-2.5">
            <div className="grid grid-cols-[64px_1fr] gap-2">
              <dt className="text-[9px] font-extrabold tracking-[0.08em] text-[#8da1c2] uppercase">Comunidad</dt>
              <dd className="text-[10.5px] leading-snug font-semibold text-[#3b527e]">{community.name}</dd>
            </div>
            <div className="grid grid-cols-[64px_1fr] gap-2">
              <dt className="text-[9px] font-extrabold tracking-[0.08em] text-[#8da1c2] uppercase">Ubicación</dt>
              <dd className="text-[10.5px] leading-snug font-semibold text-[#3b527e]">
                {activeShop.locationLabel}
              </dd>
            </div>
            <div className="grid grid-cols-[64px_1fr] gap-2">
              <dt className="text-[9px] font-extrabold tracking-[0.08em] text-[#8da1c2] uppercase">Red</dt>
              <dd className="text-[10.5px] leading-snug font-semibold text-[#8b6417]">
                No verificado en la red comunitaria
              </dd>
            </div>
          </dl>

          <p className="mt-2 text-[8.5px] leading-snug font-medium text-[#9aabc7]">
            Nombre y datos ficticios. No corresponden a un establecimiento real;
            la ubicación es aproximada.
          </p>
        </article>
      )}

      {/* datos de la comunidad */}
      <div className="pointer-events-none absolute right-3 bottom-3 z-[500] max-w-[260px] rounded-2xl border border-white/70 bg-white/90 p-3 shadow-[0_18px_40px_-24px_rgba(30,55,130,.8)] backdrop-blur">
        <p className="text-[9.5px] font-extrabold tracking-[0.12em] text-[#7a90b8] uppercase">
          Comunidad
        </p>
        <p className="mt-0.5 text-[13px] font-extrabold text-[#243d6b]">{community.name}</p>
        <p className="text-[10.5px] font-semibold text-[#8aa0c4]">
          {network.neighborhood} · {network.commune}
        </p>
        <p className="mt-1.5 text-[10.5px] font-semibold text-[#5d76a6]">
          {shops.length} de {selection.totalBusinesses} comercios en el mapa
        </p>
        <p className="text-[9.5px] font-semibold text-[#8aa0c4]">
          {source === 'openstreetmap'
            ? 'Anclaje sobre construcciones de OpenStreetMap'
            : 'Anclaje aproximado de demostración'}
        </p>
        {alerts.length > 0 && (
          <p className="mt-1 text-[10.5px] font-bold text-[#c2274a]">
            {alerts.length} alerta{alerts.length === 1 ? '' : 's'} activa{alerts.length === 1 ? '' : 's'} en el barrio
          </p>
        )}
        <p className="mt-2 text-[8.5px] font-medium text-[#9db0cd]">{attributionText(style.attribution)}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Estilo de los marcadores                                             */
/* ------------------------------------------------------------------ */

/**
 * Paletas con las que se tiñen los edificios del mapa.
 * Se reutilizan los tonos de la escena isométrica.
 */
const SKINS: IsoColors[] = [
  { color: '#ff9dc0', soft: '#ffc4d8', deep: '#e0648f', wall: '#fff6ec', awning: ['#ffffff', '#ff9dc0'] },
  { color: '#ffae52', soft: '#ffd49a', deep: '#e07f24', wall: '#fff1d8', awning: ['#ffffff', '#ffae52'] },
  { color: '#38d2c8', soft: '#a4f0e9', deep: '#17a8a2', wall: '#fff6ec', awning: ['#ffffff', '#ff9c7a'] },
  { color: '#b18cff', soft: '#dcc9ff', deep: '#7d55e0', wall: '#fff6ec', awning: ['#ffffff', '#b18cff'] },
  { color: '#ffd75a', soft: '#ffeeb0', deep: '#e0ab1c', wall: '#fff6ec', awning: ['#ffffff', '#f7e3a8'] },
  { color: '#8fd6ff', soft: '#c9ecff', deep: '#3f9fe0', wall: '#f7fbff', awning: ['#ffffff', '#8fd6ff'] },
  { color: '#7fe0b8', soft: '#b6f0d8', deep: '#43b98c', wall: '#fff6ec', awning: ['#ffffff', '#7fe0b8'] },
  { color: '#ff9f8f', soft: '#ffc9bf', deep: '#e8705c', wall: '#fff6ec', awning: ['#ffffff', '#ff9f8f'] },
]
