/**
 * Panel flotante derecho "RED DE COMERCIOS INTERCONECTADOS".
 * Es una capa de interfaz (HTML/SVG) superpuesta a la escena 3D, igual que
 * en la ilustración de referencia. Refleja la red y el barrio activos.
 */
import type { Community, CommunityNetwork } from '../../data/networks'

const categories = [
  {
    label: 'Fashion',
    bg: 'linear-gradient(160deg,#ffb3cd 0%,#ff8fb4 100%)',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#ffffff" aria-hidden="true">
        <path d="M9 2 4 5.2 6.6 11 9 9.7V22h6V9.7l2.4 1.3L20 5.2 15 2l-3 2.4L9 2Z" />
      </svg>
    ),
  },
  {
    label: 'Tech',
    bg: 'linear-gradient(160deg,#8fd6ff 0%,#5fa8f0 100%)',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#ffffff" aria-hidden="true">
        <path d="M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-7v2h3v2H8v-2h3v-2H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v9h16V6H4Z" />
      </svg>
    ),
  },
  {
    label: 'Home',
    bg: 'linear-gradient(160deg,#c9b6ff 0%,#9d7ef0 100%)',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="#ffffff" aria-hidden="true">
        <path d="m12 3 9 7.2-1.4 1.8-1.1-.9V21h-4.2v-5.4h-4.6V21H5.5v-9.9l-1.1.9L3 10.2 12 3Z" />
      </svg>
    ),
  },
]

/** Anillo de datos: laportion coloreada representa el porcentaje. */
function Donut({ percent }: { percent: number }) {
  const radius = 78
  const circumference = 2 * Math.PI * radius
  const dash = (percent / 100) * circumference

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
      <defs>
        <linearGradient id="ns-donut" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6f8cff" />
          <stop offset="50%" stopColor="#a98bf5" />
          <stop offset="100%" stopColor="#5fe4ff" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r={radius} fill="none" stroke="#e6eefc" strokeWidth="26" />
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke="url(#ns-donut)"
        strokeWidth="26"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
      />
    </svg>
  )
}

/** Iconos de las apps de comunicación de la red. */
const apps = [
  {
    label: 'WhatsApp',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="#ffffff" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 0 1 12 4Zm-3.3 4c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.2.2 1.8 2.9 4.5 4 .6.2 1 .3 1.4.3.6 0 1.1-.2 1.5-.5.4-.3.6-.7.7-1.1 0-.3-.1-.5-.3-.6l-1.7-.8c-.3-.1-.5-.1-.7.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.2-2.8c-.1-.2 0-.4.1-.5l.5-.6c.1-.2.2-.3.2-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4Z" />
      </svg>
    ),
  },
  {
    label: 'SMS',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="#ffffff" aria-hidden="true">
        <path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-7l-4 3v-3H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 5v2h10V8H7Zm0 4v2h7v-2H7Z" />
      </svg>
    ),
  },
  {
    label: 'Llamadas',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="#ffffff" aria-hidden="true">
        <path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.2c1.1.4 2.3.6 3.6.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.4.6 3.5a1 1 0 0 1-.3 1l-2.2 2.3Z" />
      </svg>
    ),
  },
  {
    label: 'Comprobantes',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="#ffffff" aria-hidden="true">
        <path d="M6 2h9l5 5v15H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm8 1.5V8h4.5L14 3.5ZM8 11v2h8v-2H8Zm0 4v2h5v-2H8Z" />
      </svg>
    ),
  },
]

export function NetworkStatsPanel({
  network,
  community,
  className = '',
}: {
  network?: CommunityNetwork
  community?: Community
  className?: string
}) {
  const stats = network?.stats
  const transactions = stats?.transactions ?? '1.2M'
  const blocked = stats?.fraudBlocked ?? 98.7
  const confidence = stats?.satisfaction ?? 95

  return (
    <aside
      className={`pointer-events-auto w-[268px] shrink-0 overflow-hidden rounded-[26px] border border-white/45 bg-white/32 shadow-[0_28px_60px_-24px_rgba(30,55,130,.45)] backdrop-blur-lg backdrop-saturate-150 sm:w-[300px] ${className}`}
    >
      {/* cabecera con degradado */}
      <div
        className="bg-gradient-to-r from-[#63b0ff]/85 via-[#8399ff]/85 to-[#b184f0]/85 px-5 py-4 backdrop-blur-md"
        style={network ? { backgroundImage: `linear-gradient(100deg, ${network.color}dd, #8399ffdd, #b184f0dd)` } : undefined}
      >
        <h2 className="text-[15px] leading-[1.15] font-extrabold tracking-tight text-white drop-shadow-[0_1px_6px_rgba(40,60,140,.45)] sm:text-[17px]">
          RED DE COMERCIOS
          <br />
          INTERCONECTADOS
        </h2>
        {network && (
          <p className="mt-1.5 text-[10px] font-semibold text-white/85">
            {network.commune} · {network.neighborhood}
          </p>
        )}
      </div>

      {/* comunidad de barrio activa */}
      {community && (
        <div className="flex items-center gap-2 border-b border-[#d5e2f7] bg-white/45 px-4 py-2.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white"
            style={{ background: network?.color ?? '#6f8cff' }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10.5px] leading-tight font-extrabold text-[#233a6b]">
              Comunidad del barrio {community.name}
            </p>
            <p className="text-[9px] font-semibold text-[#6b81ad]">
              {community.stats.merchants} comercios · {community.stats.verified} verificados
            </p>
          </div>
        </div>
      )}

      <div className="px-4 pt-4 pb-3">
        <h3 className="text-center text-[13px] leading-tight font-extrabold text-[#2c4478]">
          EXPLORAR
          <br />
          MERCADO SEGURO
        </h3>

        {/* categorías */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {categories.map((category) => (
            <button
              key={category.label}
              type="button"
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/55 p-2.5 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-[14px] shadow-[0_8px_18px_-8px_rgba(40,70,160,.7)]"
                style={{ background: category.bg }}
              >
                {category.icon}
              </span>
              <span className="text-[10.5px] font-bold text-[#3d568e]">{category.label}</span>
            </button>
          ))}
        </div>

        {/* gráfico circular + estadísticas */}
        <div className="relative mt-4 flex justify-center">
          <div className="relative h-[168px] w-[168px]">
            <Donut percent={blocked} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[8.5px] leading-[1.15] font-extrabold tracking-wide text-[#3b5488] uppercase">
                Transacciones
                <br />
                seguras:
              </span>
              <strong className="text-[26px] leading-none font-extrabold text-[#233a6b]">
                {transactions}
              </strong>
              <span className="mt-1.5 text-[8.5px] leading-[1.15] font-extrabold tracking-wide text-[#3b5488] uppercase">
                Alertas de fraude
                <br />
                bloqueadas:
              </span>
              <strong className="text-[24px] leading-none font-extrabold text-[#233a6b]">
                {blocked}%
              </strong>
              <span className="mt-1.5 text-[8.5px] leading-[1.15] font-extrabold tracking-wide text-[#3b5488] uppercase">
                Confianza de la red:
              </span>
              <strong className="text-[17px] leading-none font-extrabold text-[#2f8f6a]">
                Alta ({confidence}%)
              </strong>
            </div>
          </div>
        </div>

        {/* apps de comunicación de la red */}
        <div className="mt-4 grid grid-cols-4 gap-2 border-t border-[#d5e2f7] pt-3">
          {apps.map((app) => (
            <div key={app.label} className="flex flex-col items-center gap-1">
              <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-gradient-to-br from-[#7fd6ff] to-[#5fa8f0] shadow-[0_6px_14px_-6px_rgba(40,90,170,.75)]">
                {app.icon}
              </span>
              <span className="text-center text-[7.5px] leading-[1.15] font-semibold text-[#5a76a8]">
                {app.label}
              </span>
            </div>
          ))}
        </div>

        {/* indicadores del carrusel */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#9fb4dd]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#6f8cff]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#9fb4dd]" />
        </div>
      </div>
    </aside>
  )
}
