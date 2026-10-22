import L from 'leaflet'

/**
 * Proveedor de teselas.
 *
 * **Cada fuente declara hasta qué zoom entrega datos de verdad.** Es el dato
 * clave: si se pide una tesela más allá de ese nivel, el servidor devuelve
 * una imagen de aviso («Map data not yet available») en lugar del mapa, y el
 * usuario ve ese rótulo repetido por todas las pantallas.
 *
 * Con `maxNativeZoom` Leaflet deja de pedir teselas por encima del nivel real
 * y **reescala** la última disponible, así que el mapa nunca se rompe y sólo
 * se ve un poco más suave en el último tramo.
 */

/** Fuente general: mapa gris claro de Esri. Llega con datos hasta el zoom 16. */
const ESRI_LIGHT_GRAY =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'


/** Cartografía de calles de Esri: con datos hasta el zoom 19. */
const ESRI_STREETS =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'

/** Fotografía aérea de Esri: con datos hasta el zoom 19. */
const ESRI_IMAGERY =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

/** OpenStreetMap estándar: con datos hasta el zoom 19. */
const OSM_STANDARD = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'



/**
 * Fuentes del **mapa pequeño de selección** (ciudad completa).
 *
 * El gris claro encaja con la estética pastel y con los polígonos de las
 * localidades, pero sus datos llegan hasta el zoom 16: por eso el mapa se
 * limita a ese nivel y no pide teselas de más.
 */
const TILE_SOURCES = [
  {
    url: ESRI_LIGHT_GRAY,
    attribution:
      'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ',
    /** Último zoom con datos reales de este servicio. */
    maxNativeZoom: 16,
    /** Zoom hasta el que se deja llegar al mapa. */
    maxZoom: 16,
  },
  {
    url: OSM_STANDARD,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxNativeZoom: 19,
    maxZoom: 19,
  },
]

/**
 * Añade la capa de teselas con repliegue automático a OSM.
 *
 * El repliegue cambia también el zoom nativo: si Esri no responde, se pasa a
 * la fuente que sí llega más lejos, sin dejar nunca una tesela de aviso.
 */
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
      maxNativeZoom: source.maxNativeZoom,
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
   * Último zoom con datos reales. A partir de aquí Leaflet reescala la
   * última tesela: el mapa sigue visible, sin rótulos de error.
   */
  maxNativeZoom: number
  /** Fuente de reserva si el proveedor principal no responde. */
  fallback?: {
    url: string
    maxNativeZoom: number
    attribution: string
  }
}

/**
 * Estilos del **mapa principal del barrio**.
 *
 * Los tres tienen datos comprobados hasta el zoom 19-20, así que se puede
 * bajar hasta el nivel de vivienda sin que aparezca el aviso de «datos no
 * disponibles».
 */
export const MAP_STYLES: MapStyle[] = [
  {
    id: 'claro',
    label: 'Claro',
    // Estándar de OpenStreetMap: fondo claro, nombres de calle y huellas de
    // las edificaciones. Datos reales hasta el zoom 20.
    url: OSM_STANDARD,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxNativeZoom: 19,
    fallback: {
      url: ESRI_STREETS,
      maxNativeZoom: 19,
      attribution:
        'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ',
    },
  },
  {
    id: 'calles',
    label: 'Calles',
    // Cartografía de Esri: manzanas y edificaciones resaltadas. Datos hasta 19.
    url: ESRI_STREETS,
    attribution:
      'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ',
    maxNativeZoom: 19,
    fallback: {
      url: OSM_STANDARD,
      maxNativeZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  {
    id: 'satelite',
    label: 'Satélite',
    // Fotografía aérea: la que mejor muestra las cubiertas de las casas.
    url: ESRI_IMAGERY,
    attribution:
      'Imágenes &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
    maxNativeZoom: 19,
    fallback: {
      url: ESRI_STREETS,
      maxNativeZoom: 19,
      attribution:
        'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ',
    },
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
    className: 'ns-tiles',
  }).addTo(map)

  // Si el proveedor no responde, se recurre a la fuente de reserva: mejor un
  // mapa de otro proveedor que un aviso de «datos no disponibles».
  let degraded = false
  base.on('tileerror', () => {
    if (degraded || !style.fallback) return
    degraded = true
    base.setUrl(style.fallback.url)
    base.options.maxNativeZoom = style.fallback.maxNativeZoom
  })

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
      base.options.maxNativeZoom = next.maxNativeZoom
      applyLabels(next)
    },
    remove: () => {
      base.remove()
      labels?.remove()
      labels = null
    },
  }
}

/**
 * Comprobación de los niveles de zoom reales de cada fuente.
 *
 * Se usa desde las pruebas y desde la consola: descarga una tesela en cada
 * nivel y dice si es un mapa de verdad o el aviso de «datos no disponibles».
 */
export async function checkTileDepth(
  url: string,
  zoom: number,
  tile: { x: number; y: number },
): Promise<{ ok: boolean; bytes: number }> {
  const response = await fetch(url.replace('{z}', String(zoom)).replace('{x}', String(tile.x)).replace('{y}', String(tile.y)))
  if (!response.ok) return { ok: false, bytes: 0 }
  const blob = await response.blob()
  return { ok: blob.size > 3_000, bytes: blob.size }
}

export { ESRI_LIGHT_GRAY, ESRI_STREETS, ESRI_IMAGERY, OSM_STANDARD }
