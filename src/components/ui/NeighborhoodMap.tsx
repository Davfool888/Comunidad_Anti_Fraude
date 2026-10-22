import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Community, CommunityNetwork } from '../../data/networks'
import type { HousePoint } from '../../data/houses'
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
 * red colocados **encima de las casas reales** de esa zona.
 *
 * Las posiciones vienen de OpenStreetMap. Si el servicio no responde, se usa
 * una distribución de respaldo alrededor del centro del barrio, de modo que
 * la vista nunca queda vacía.
 *
 * El mapa se puede acercar hasta el **nivel de casa**: las teselas nativas
 * llegan al zoom 19 y, a partir de ahí, el navegador reescala la última
 * tesela, así que se distinguen las viviendas y las vías pequeñas.
 */

/** Zoom al que se abre el mapa del barrio. */
const INITIAL_ZOOM = 19

/** Zoom mínimo de la vista de barrio: se ven las casas y las vías. */
const CLOSE_ZOOM = 18

/** Zoom máximo: nivel de casa y vías pequeñas. */
const MAX_ZOOM = 21

/** Zoom mínimo: el barrio completo dentro de la ciudad. */
const MIN_ZOOM = 15
export function NeighborhoodMap({
  network,
  community,
  anchors,
  loading,
  source,
  className = '',
}: {
  network: CommunityNetwork
  community: Community
  /** Casas donde se colocan los comercios (reales o aproximadas). */
  anchors: HousePoint[]
  /** true mientras se consultan las casas reales. */
  loading: boolean
  /** De dónde vienen los anclajes. */
  source: 'openstreetmap' | 'aproximado'
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  /** Los comercios de la comunidad, con su tipo de edificio. */
  const shops = useMemo(
    () =>
      community.businesses.map((business, index) => ({
        id: `${community.id}-shop-${index}`,
        name: business.name,
        business: business.business,
        label: business.label,
        satisfaction: business.satisfaction,
        index,
      })),
    [community.businesses, community.id],
  )

  // Crea el mapa
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

    // Sonda de desarrollo: permite inspeccionar el mapa desde la consola
    if (import.meta.env.DEV) {
      ;(window as unknown as { __nsMap?: L.Map }).__nsMap = map
    }

    // El control de zoom baja un poco para no chocar con el conmutador de
    // estilos; la escala indica los metros reales de la vista.
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current = []
    }
  }, [community.id, community.lat, community.lng])

  // Estilo de mapa: claro, calles o satélite
  const [styleId, setStyleId] = useState<MapStyleId>('claro')
  const style = MAP_STYLES.find((item) => item.id === styleId) ?? MAP_STYLES[0]
  const styleRef = useRef<MapStyle>(style)
  const layersRef = useRef<StyleLayers | null>(null)

  // Crea las capas de teselas con el estilo activo
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

  // Cambia de estilo sin rehacer las capas: el zoom y el centro se conservan
  useEffect(() => {
    if (styleRef.current.id === style.id) return
    styleRef.current = style
    layersRef.current?.setStyle(style)
  }, [style])

  // Coloca los comercios sobre las casas reales
  useEffect(() => {
    const map = mapRef.current
    if (!map || anchors.length === 0) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    shops.forEach((shop, index) => {
      const house = anchors[index % anchors.length]
      if (!house) return

      const skin = SKINS[index % SKINS.length]
      const style = (STYLE_BY_BUSINESS[shop.business] ?? 'grocery') as ShopStyle
      const icon = L.divIcon({
        className: 'ns-iso-marker',
        html: `<div class="ns-iso-marker__box">${isoBuildingSvg(style, skin)}</div>`,
        iconSize: [46, 54],
        iconAnchor: [23, 50],
      })

      const marker = L.marker([house.lat, house.lng], { icon, keyboard: true, title: shop.name })
        .addTo(map)

      marker.bindTooltip(
        `<span class="ns-iso-tooltip__name">${shop.name}</span><span class="ns-iso-tooltip__label">${shop.label} · verificado</span>`,
        { direction: 'top', offset: [0, -44], className: 'ns-iso-tooltip', sticky: true },
      )
      marker.on('click', () => {
        marker.setZIndexOffset(1000)
        window.setTimeout(() => marker.setZIndexOffset(0), 1800)
      })

      markersRef.current.push(marker)
    })

    // Ajusta el encuadre a las construcciones usadas
    const used = anchors.slice(0, shops.length)
    if (used.length) {
      // Cancela cualquier animación pendiente del mapa
      map.stop()
      map.fitBounds(
        L.latLngBounds(used.map((house) => [house.lat, house.lng] as [number, number])),
        { padding: [56, 56], maxZoom: INITIAL_ZOOM, animate: false },
      )
      // La vista siempre queda a nivel de casa: ni tan lejos que no se vean
      // las viviendas ni tan cerca que se pierdan los comercios.
      if (map.getZoom() < CLOSE_ZOOM) {
        map.setZoom(CLOSE_ZOOM, { animate: false })
      }
    }
  }, [anchors, shops])

  return (
    <div className={`relative h-full w-full ${className}`}>
      <div ref={containerRef} className="ns-map h-full w-full bg-[#dfe9fb]" />

      {/* etiqueta de la simulación */}
      <div className="pointer-events-none absolute top-3 left-3 z-[500] flex flex-col items-start gap-2">
        <SimulatedTag />
        <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold text-[#4a628f] shadow-sm">
          {loading
            ? 'Buscando las casas de la zona…'
            : source === 'openstreetmap'
              ? `Casas reales de ${community.name} (OpenStreetMap)`
              : `Ubicación aproximada de ${community.name}`}
        </span>
        <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold text-[#4a628f] shadow-sm">
          Acércate para ver las casas y las vías
        </span>
      </div>

      {/* estilos de mapa: claro, calles o satélite */}
      <div className="absolute top-3 right-3 z-[500] flex items-center gap-1 rounded-full bg-white/85 p-1 shadow-[0_12px_28px_-16px_rgba(30,55,130,.8)] backdrop-blur-xl">
        {MAP_STYLES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setStyleId(item.id)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors duration-200 ${
              styleId === item.id
                ? 'bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] text-white shadow-[0_8px_18px_-10px_rgba(80,90,220,.9)]'
                : 'text-[#5d76a6] hover:bg-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* datos de la comunidad */}
      <div className="pointer-events-none absolute right-3 bottom-3 z-[500] max-w-[260px] rounded-2xl border border-white/70 bg-white/85 p-3 shadow-[0_18px_40px_-24px_rgba(30,55,130,.8)] backdrop-blur">
        <p className="text-[9.5px] font-extrabold tracking-[0.12em] text-[#7a90b8] uppercase">
          Comunidad
        </p>
        <p className="mt-0.5 text-[13px] font-extrabold text-[#243d6b]">{community.name}</p>
        <p className="text-[10.5px] font-semibold text-[#8aa0c4]">
          {network.neighborhood} · {network.commune}
        </p>
        <p className="mt-1.5 text-[10.5px] font-semibold text-[#5d76a6]">
          {shops.length} comercios · {community.stats.merchants} verificados
        </p>
        <p className="mt-2 text-[8.5px] font-medium text-[#9db0cd]">{style.attribution}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Estilo de los marcadores                                             */
/* ------------------------------------------------------------------ */

/**
 * Paletas con las que se tiñen los edificios del mapa.
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
