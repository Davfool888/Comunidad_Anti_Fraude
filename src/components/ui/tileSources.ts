import L from 'leaflet'

/**
 * Proveedor de teselas.
 *
 * CARTO exige API key desde 2024, así que se usa **Esri Light Gray Canvas**,
 * que encaja con la estética pastel y no necesita credenciales. Si sus teselas
 * fallan (sin red, bloqueadas…), se cae automáticamente a OpenStreetMap.
 */

const TILE_SOURCES = [
  {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 18,
  },
  {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
]

/** Añade la capa de teselas con repliegue automático a OSM. */
export function addTileLayer(map: L.Map, options: { showAttribution?: boolean } = {}) {
  const { showAttribution = true } = options
  let current = 0
  let layer: L.TileLayer | null = null

  const attach = (index: number) => {
    const source = TILE_SOURCES[index]
    if (!source) return

    layer = L.tileLayer(source.url, {
      attribution: showAttribution ? source.attribution : '',
      maxZoom: source.maxZoom,
      crossOrigin: 'anonymous',
      className: 'ns-tiles',
    }).addTo(map)

    layer.on('tileerror', () => {
      // la fuente actual no responde: probamos la siguiente
      if (current >= TILE_SOURCES.length - 1) return
      current += 1
      layer?.remove()
      layer = null
      attach(current)
    })
  }

  attach(0)

  return () => {
    layer?.remove()
    layer = null
  }
}

/* ------------------------------------------------------------------ */
/* Estilos de la vista de barrio                                        */
/* ------------------------------------------------------------------ */

/** Estilo de mapa disponible en la vista de barrio. */
export type MapStyleId = 'claro' | 'calles' | 'satelite'

/** Descripción de un estilo de mapa. */
export type MapStyle = {
  id: MapStyleId
  /** Etiqueta corta del conmutador. */
  label: string
  /** Plantilla de URL de las teselas base. */
  url: string
  /** Plantilla de URL de las etiquetas (nombres de calle), si la hay. */
  labels?: string
  attribution: string
  /**
   * Último zoom con tesela nativa. Más allá el navegador reescala la última
   * tesela, de modo que se puede llegar a nivel de casa sin huecos.
   */
  maxNativeZoom: number
}

/** Zoom nativo de los servicios de Esri (a partir de ahí se reescala). */
const NATIVE_ZOOM = 19

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services'

/** Estilos de mapa para la vista de barrio, de más claro a más detallado. */
export const MAP_STYLES: MapStyle[] = [
  {
    id: 'claro',
    label: 'Claro',
    url: `${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    labels: `${ESRI}/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
    attribution: 'Tiles &copy; Esri — Esri, DeLorme, NAVTEQ',
    maxNativeZoom: NATIVE_ZOOM,
  },
  {
    id: 'calles',
    label: 'Calles',
    url: `${ESRI}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`,
    attribution: 'Tiles &copy; Esri — Esri, DeLorme, NAVTEQ',
    maxNativeZoom: NATIVE_ZOOM,
  },
  {
    id: 'satelite',
    label: 'Satélite',
    url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
    attribution: 'Imágenes &copy; Esri, Maxar, Earthstar Geographics',
    maxNativeZoom: NATIVE_ZOOM,
  },
]

/**
 * Control de las teselas de un estilo.
 *
 * Permite cambiar de estilo **sin quitar y poner las capas**: así el mapa no
 * pierde el zoom ni la posición en la que estaba el usuario.
 */
export type StyleLayers = {
  /** Cambia de estilo en el sitio. */
  setStyle: (style: MapStyle) => void
  /** Retira las capas. */
  remove: () => void
}

/**
 * Añade las teselas de un estilo al mapa.
 *
 * La capa de etiquetas va en su propio panel (`labels`), por encima de las
 * teselas pero por debajo de los marcadores, y no intercepta el ratón.
 */
export function addStyleLayers(map: L.Map, style: MapStyle, maxZoom: number): StyleLayers {
  map.createPane('labels')
  const pane = map.getPane('labels')
  if (pane) {
    pane.style.zIndex = '250'
    pane.style.pointerEvents = 'none'
  }

  const base = L.tileLayer(style.url, {
    attribution: '',
    maxZoom,
    maxNativeZoom: style.maxNativeZoom,
    crossOrigin: 'anonymous',
    className: 'ns-tiles',
  }).addTo(map)

  let labels: L.TileLayer | null = null

  const applyLabels = (next: MapStyle) => {
    if (next.labels) {
      if (labels) {
        labels.setUrl(next.labels)
      } else {
        labels = L.tileLayer(next.labels, {
          attribution: '',
          maxZoom,
          maxNativeZoom: next.maxNativeZoom,
          crossOrigin: 'anonymous',
          className: 'ns-tiles ns-tiles--labels',
          pane: 'labels',
        }).addTo(map)
      }
      return
    }
    if (labels) {
      labels.remove()
      labels = null
    }
  }

  applyLabels(style)

  return {
    setStyle: (next: MapStyle) => {
      base.setUrl(next.url)
      applyLabels(next)
    },
    remove: () => {
      base.remove()
      labels?.remove()
      labels = null
    },
  }
}
