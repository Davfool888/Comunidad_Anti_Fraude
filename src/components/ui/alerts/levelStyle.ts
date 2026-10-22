import type { CommunityAlert } from '../../../lib/api'

/** Color y rótulo de cada nivel de alerta (rojo incidente, ámbar precaución, azul aviso). */
export const LEVEL_STYLE: Record<CommunityAlert['level'], { bar: string; chip: string; label: string; dot: string }> = {
  danger: { bar: 'border-l-[#e23b5f] bg-[#fff1f4]', chip: 'bg-[#e23b5f] text-white', label: 'Incidente', dot: '#e23b5f' },
  warning: { bar: 'border-l-[#e9a13b] bg-[#fff8ec]', chip: 'bg-[#e9a13b] text-white', label: 'Precaución', dot: '#e9a13b' },
  info: { bar: 'border-l-[#5b7cf5] bg-[#f1f5ff]', chip: 'bg-[#5b7cf5] text-white', label: 'Aviso', dot: '#5b7cf5' },
}
