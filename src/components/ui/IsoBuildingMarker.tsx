import { isoBuildingSvg, type IsoColors } from './isoBuilding'
import type { ShopStyle } from '../three/network/palette'

/**
 * Componente React del edificio isométrico. El SVG lo genera `isoBuilding.ts`
 * (mismo código que usan los marcadores del mapa).
 */
export function IsoBuilding(props: { style: ShopStyle } & IsoColors) {
  return (
    <span
      className="block h-full w-full"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: isoBuildingSvg(props.style, props) }}
    />
  )
}
