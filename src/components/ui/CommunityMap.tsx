import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { CommunityNetwork } from '../../data/networks'
import { BOGOTA_CENTER, BOGOTA_ZOOM } from '../../data/networks'
import { addTileLayer } from './tileSources'

/**
 * Mapa de la red comunitaria sobre Leaflet.
 *
 * Cada localidad de Bogotá se dibuja como un polígono con su propio color;
 * la localidad activa se resalta y el resto queda atenuado. Dentro de cada
 * localidad hay un punto por comunidad de barrio, con tamaño proporcional a
 * la superficie del barrio; al pulsarlo se muestra su ficha.
 */
export function CommunityMap({
  networks,
  activeId,
  selectedId,
  selectedCommunityId,
  focus,
  onSelect,
  onSelectCommunity,
  className = '',
}: {
  networks: CommunityNetwork[]
  activeId: string
  selectedId: string
  selectedCommunityId?: string | null
  /** Vista a la que debe desplazarse el mapa (null = no moverse). */
  focus?: { lat: number; lng: number; zoom: number } | null
  onSelect: (networkId: string) => void
  onSelectCommunity?: (communityId: string) => void
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layersRef = useRef<Map<string, L.GeoJSON>>(new Map())
  const pointsRef = useRef<Map<string, L.CircleMarker>>(new Map())
  const onSelectRef = useRef(onSelect)
  const onCommunityRef = useRef(onSelectCommunity)
  const networksRef = useRef(networks)

  useEffect(() => {
    onSelectRef.current = onSelect
    onCommunityRef.current = onSelectCommunity
  }, [onSelect, onSelectCommunity])

  // Creación del mapa (una sola vez)
  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return

    const map = L.map(container, {
      center: BOGOTA_CENTER,
      zoom: BOGOTA_ZOOM,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: true,
    })

    addTileLayer(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // pane propio: los puntos de comunidad quedan por encima de los
    // polígonos de las localidades y siempre se pueden pulsar
    map.createPane('communities')
    const pane = map.getPane('communities')
    if (pane) pane.style.zIndex = '450'

    // vista inicial: el núcleo urbano de la ciudad. La localidad rural
    // (Sumapaz) abarca medio departamento, así que se deja fuera del encuadre
    // inicial para que el resto de la ciudad se vea con detalle. El encuadre
    // se calcula sobre los puntos de comunidad, que es donde está la vida.
    const boxes = networksRef.current.map((network) => {
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      network.rings.forEach((ring) => {
        ring.forEach(([lng, lat]) => {
          minX = Math.min(minX, lng)
          maxX = Math.max(maxX, lng)
          minY = Math.min(minY, lat)
          maxY = Math.max(maxY, lat)
        })
      })
      return { network, box: { minX, minY, maxX, maxY } }
    })
    const rural = boxes.reduce((largest, item) =>
      (item.box.maxX - item.box.minX) * (item.box.maxY - item.box.minY) >
      (largest.box.maxX - largest.box.minX) * (largest.box.maxY - largest.box.minY)
        ? item
        : largest,
    )
    const bounds = L.latLngBounds([])
    boxes
      .filter((item) => item !== rural)
      .forEach((item) => {
        item.network.communities.forEach((community) => {
          bounds.extend([community.lat, community.lng])
        })
      })
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [26, 26], animate: false })
    }

    mapRef.current = map
    const layers = layersRef.current
    const points = pointsRef.current

    if (import.meta.env.DEV) {
      ;(window as unknown as Record<string, unknown>).__map = map
    }

    return () => {
      map.remove()
      mapRef.current = null
      layers.clear()
      points.clear()
    }
  }, [])

  // Polígonos de las localidades
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const layers = layersRef.current
    layers.forEach((layer) => layer.remove())
    layers.clear()

    networks.forEach((network) => {
      const geoJson: GeoJSON.Feature = {
        type: 'Feature',
        properties: { name: network.neighborhood },
        geometry: {
          type: 'Polygon',
          coordinates: network.rings.map((ring) => ring.map(([lng, lat]) => [lng, lat])),
        },
      }

      const layer = L.geoJSON(geoJson, {
        style: () => ({
          color: '#ffffff',
          weight: 1.5,
          fillColor: network.color,
          fillOpacity: 0.72,
        }),
        onEachFeature: (feature, featureLayer) => {
          const value = (feature.properties as { name?: string }).name ?? network.neighborhood
          featureLayer.bindTooltip(value, {
            direction: 'top',
            className: 'ns-map-tooltip',
            sticky: true,
          })
          featureLayer.on('click', () => onSelectRef.current(network.id))
        },
      }).addTo(map)

      layers.set(network.id, layer)
    })
  }, [networks])

  // Puntos de comunidad de barrio
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const points = pointsRef.current
    points.forEach((marker) => marker.remove())
    points.clear()

    networks.forEach((network) => {
      // de menor a mayor: los puntos pequeños quedan encima y son los que
      // se pueden pulsar cuando dos barrios se solapan
      const ordered = [...network.communities].sort((a, b) => a.radius - b.radius)
      ordered.forEach((community) => {
        const marker = L.circleMarker([community.lat, community.lng], {
          // el radio sigue la superficie del barrio
          radius: 3.5 + community.radius * 6,
          pane: 'communities',
          color: '#ffffff',
          weight: 1.6,
          fillColor: network.color,
          fillOpacity: 0.95,
        })
          .addTo(map)
          .bindTooltip(`Comunidad del barrio ${community.name}`, {
            direction: 'top',
            offset: [0, -8],
            className: 'ns-map-tooltip',
            sticky: true,
          })
          .on('click', () => onCommunityRef.current?.(community.id))

        points.set(community.id, marker)
      })
    })
  }, [networks])

  // Resalta la localidad activa y atenúa el resto
  useEffect(() => {
    const layers = layersRef.current
    networks.forEach((network) => {
      const layer = layers.get(network.id)
      if (!layer) return
      const isActive = network.id === activeId
      const isSelected = network.id === selectedId
      layer.setStyle({
        color: isSelected ? '#1d3f77' : '#ffffff',
        weight: isSelected ? 2.6 : 1.5,
        fillColor: network.color,
        fillOpacity: isActive ? 0.9 : isSelected ? 0.82 : 0.55,
      })
    })
  }, [networks, activeId, selectedId])

  // Resalta el punto de comunidad elegido
  useEffect(() => {
    const points = pointsRef.current
    networks.forEach((network) => {
      const isNetwork = network.id === selectedId
      network.communities.forEach((community) => {
        const marker = points.get(community.id)
        if (!marker) return
        const isSelected = community.id === selectedCommunityId
        const base = 3.5 + community.radius * 6
        marker.setStyle({
          radius: isSelected ? base + 8 : base,
          color: isSelected ? '#1d3f77' : '#ffffff',
          weight: isSelected ? 3.4 : 1.6,
          fillColor: network.color,
          fillOpacity: isSelected ? 1 : isNetwork ? 0.95 : 0.42,
          opacity: isSelected ? 1 : isNetwork ? 1 : 0.5,
        })
        if (isSelected) marker.bringToFront()
      })
    })
  }, [networks, selectedCommunityId, selectedId])

  // Desplaza la vista al punto pedido (localidad o comunidad)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !focus) return
    map.flyTo([focus.lat, focus.lng], focus.zoom, { duration: 0.7 })
  }, [focus])

  return (
    <div
      ref={containerRef}
      className={`h-full w-full bg-[#dfe9fb] ${className}`}
      role="application"
      aria-label="Mapa de las localidades de Bogotá"
    />
  )
}
