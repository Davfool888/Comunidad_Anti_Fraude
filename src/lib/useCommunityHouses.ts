import { useEffect, useMemo, useState } from 'react'
import type { Community } from '../data/networks'
import {
  approximateHouses,
  subscribeRealHouses,
  type HousePoint,
} from '../data/houses'
import { closestTo } from './geo'

/** Estado de las casas de una comunidad. */
export type CommunityHouses = {
  /** Construcciones usadas como anclaje (reales o aproximadas). */
  houses: HousePoint[]
  /** Las más cercanas al centro: donde se colocan los comercios. */
  anchors: HousePoint[]
  /** true mientras se consultan las casas reales. */
  loading: boolean
  /** De dónde vienen los anclajes. */
  source: 'openstreetmap' | 'aproximado'
}

/**
 * Carga (una sola vez por barrio) las casas de la comunidad y decide dónde
 * se colocarán los comercios.
 *
 * Las dos vistas (el mapa geográfico y la escena isométrica) consumen este
 * mismo resultado, así que un comercio aparece **en el mismo sitio** en las
 * dos: si cambia la comunidad, cambian los dos a la vez.
 */
export function useCommunityHouses(
  community: Community | null,
  count = 8,
): CommunityHouses {
  const communityId = community?.id ?? null
  const lat = community?.lat ?? 0
  const lng = community?.lng ?? 0

  const [houses, setHouses] = useState<HousePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'openstreetmap' | 'aproximado'>('aproximado')

  useEffect(() => {
    if (!communityId) {
      setHouses([])
      setLoading(false)
      return
    }

    let alive = true
    // De inmediato se colocan los comercios con una distribución aproximada;
    // cuando llegan las casas reales, saltan a su posición.
    setHouses(approximateHouses(communityId, lat, lng, count + 4))
    setSource('aproximado')
    setLoading(true)

    const unsubscribe = subscribeRealHouses(
      communityId,
      lat,
      lng,
      count + 4,
      (real) => {
        if (!alive) return
        setHouses(real)
        setSource('openstreetmap')
        setLoading(false)
      },
    )

    // Si la consulta no devuelve nada real, se queda con la aproximación.
    const timer = window.setTimeout(() => {
      if (alive) setLoading(false)
    }, 22_000)

    return () => {
      alive = false
      window.clearTimeout(timer)
      unsubscribe()
    }
  }, [communityId, lat, lng, count])

  // Los anclajes se eligen por cercanía al centro del barrio: así el
  // encuadre sale cerrado y todos los comercios quedan a la vista.
  const anchors = useMemo(() => {
    if (!community) return []
    return closestTo(houses, { lat: community.lat, lng: community.lng }, count + 4)
  }, [houses, community, count])

  // Sonda de desarrollo: permite comprobar desde la consola dónde están
  // las casas que anclan a los comercios.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const target = window as unknown as Record<string, unknown>
    target.__anchors = anchors
  }, [anchors])

  return { houses, anchors, loading, source }
}
