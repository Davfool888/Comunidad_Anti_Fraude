import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { CommunityNetwork } from '../../data/networks'
import { addTileLayer } from './tileSources'

/**
 * Mini-mapa de la red activa: sitúa la localidad dentro de Bogotá y
 * sombrea el resto del territorio.
 */
export function NetworkMiniMap({
  network,
  className = '',
}: {
  network: CommunityNetwork
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.CircleMarker | null>(null)
  const shapeRef = useRef<L.GeoJSON | null>(null)
  const initial = useRef(network)

  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return

    const map = L.map(container, {
      center: [initial.current.lat, initial.current.lng],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    })

    addTileLayer(map, { showAttribution: false })

    markerRef.current = L.circleMarker([initial.current.lat, initial.current.lng], {
      radius: 12,
      color: '#ffffff',
      weight: 4,
      fillColor: initial.current.color,
      fillOpacity: 1,
    }).addTo(map)

    L.circleMarker([initial.current.lat, initial.current.lng], {
      radius: 22,
      color: initial.current.color,
      weight: 2,
      fillColor: initial.current.color,
      fillOpacity: 0.2,
      interactive: false,
    }).addTo(map)

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      shapeRef.current = null
    }
  }, [])

  // Recoloca el marcador y sombrea la localidad activa
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return

    marker.setLatLng([network.lat, network.lng])
    marker.setStyle({ fillColor: network.color })
    map.setView([network.lat, network.lng], 11, { animate: true })

    // polígono de la localidad activa
    shapeRef.current?.remove()
    shapeRef.current = null
    if (network.rings.length) {
      shapeRef.current = L.geoJSON(
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: network.rings.map((ring) => ring.map(([lng, lat]) => [lng, lat])),
          },
        } as GeoJSON.Feature,
        {
          style: {
            color: '#1d3f77',
            weight: 1.6,
            fillColor: network.color,
            fillOpacity: 0.35,
          },
          interactive: false,
        },
      ).addTo(map)
    }
  }, [network])

  return (
    <div
      ref={containerRef}
      className={`h-full w-full bg-[#dfe9fb] ${className}`}
      role="img"
      aria-label={`Ubicación de ${network.neighborhood} en Bogotá`}
    />
  )
}
