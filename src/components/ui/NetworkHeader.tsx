import type { ReactNode } from 'react'

/**
 * Cabecera global de la aplicación.
 *
 * Flota sobre el contenido y hace dos cosas: conmutar de **ventana**
 * (Analizar fraude / Comunidades) y abrir el chat de la comunidad. El tono
 * se adapta al fondo: sobre el cielo de la escena 3D el texto va en blanco;
 * sobre la página clara, en azul tinta con un velo translúcido.
 */

export type AppView = 'fraude' | 'comunidades' | 'educacion' | 'moderacion'

/** Tono según el fondo sobre el que se apoya. */
export type HeaderTone = 'cielo' | 'claro'

function ShieldMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 52" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ns-logo-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff9ec7" />
          <stop offset="45%" stopColor="#a98bf5" />
          <stop offset="100%" stopColor="#5fe4ff" />
        </linearGradient>
      </defs>
      <path
        d="M24 1.5 45 8.4v16.3C45 38.8 36.3 48.2 24 52.2 11.7 48.2 3 38.8 3 24.7V8.4L24 1.5Z"
        fill="url(#ns-logo-shield)"
      />
      <path
        d="M24 6.6 40 11.8v12.9c0 11.3-7 19.1-16 22.5-9-3.4-16-11.2-16-22.5V11.8L24 6.6Z"
        fill="#ffffff"
        opacity="0.16"
      />
      <path
        d="m15.4 25.4 6 6.1 11.5-12.3"
        stroke="#ffffff"
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export function NetworkHeader({
  view,
  onView,
  onOpenChat,
  switcher,
  tone = 'cielo',
  className = '',
}: {
  view: AppView
  onView: (view: AppView) => void
  onOpenChat: () => void
  switcher?: ReactNode
  tone?: HeaderTone
  className?: string
}) {
  const light = tone === 'claro'

  const windows: { id: AppView; label: string }[] = [
    { id: 'fraude', label: 'Analizar fraude' },
    { id: 'comunidades', label: 'Comunidades' },
    { id: 'educacion', label: 'Centro de aprendizaje' },
    { id: 'moderacion', label: 'Panel de la red' },
  ]

  return (
    <header
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 flex items-start justify-between gap-6 px-5 pt-5 sm:px-8 sm:pt-7 ${className}`}
    >
      {/* logotipo */}
      <div className="pointer-events-auto flex items-center gap-3">
        <div
          className={`grid h-[46px] w-[46px] place-items-center rounded-[14px] shadow-[0_8px_24px_-8px_rgba(40,60,140,.55)] backdrop-blur-md sm:h-[54px] sm:w-[54px] ${
            light ? 'bg-white/70' : 'bg-white/25'
          }`}
        >
          <ShieldMark className="h-[30px] w-[28px] sm:h-[36px] sm:w-[33px]" />
        </div>
        <span
          className={`text-[17px] leading-[1.05] font-extrabold tracking-tight sm:text-[23px] ${
            light
              ? 'text-[#1d2f57]'
              : 'text-white drop-shadow-[0_2px_10px_rgba(30,50,120,.55)]'
          }`}
        >
          RED SEGURA
          <br />
          DE COMERCIOS
        </span>
      </div>

      {/* conmutador de ventanas */}
      <nav
        className={`pointer-events-auto absolute top-6 left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full p-1 backdrop-blur-xl lg:flex ${
          light
            ? 'bg-white/75 shadow-[0_10px_28px_-16px_rgba(30,55,130,.7)] ring-1 ring-[#dbe6f7]'
            : 'bg-white/15 shadow-[0_10px_28px_-16px_rgba(30,55,130,.7)]'
        }`}
      >
        {windows.map((item) => {
          const active = view === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onView(item.id)}
              className={`rounded-full px-4 py-1.5 text-[13.5px] font-bold transition-colors duration-200 ${
                active
                  ? 'bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] text-white shadow-[0_8px_18px_-10px_rgba(80,90,220,.9)]'
                  : light
                    ? 'text-[#4a628f] hover:bg-white/80'
                    : 'text-white/90 hover:bg-white/20'
              }`}
            >
              {item.label}
            </button>
          )
        })}

        <span className="mx-1 h-5 w-px bg-current opacity-15" />

        <button
          type="button"
          onClick={onOpenChat}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13.5px] font-bold transition-colors duration-200 ${
            light ? 'text-[#4a628f] hover:bg-white/80' : 'text-white/90 hover:bg-white/20'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2Zm2 4v2h12V8H6Zm0 4v2h8v-2H6Z" />
          </svg>
          Chat
        </button>
      </nav>

      {/* conmutador de red comunitaria */}
      {switcher && <div className="pointer-events-auto hidden sm:block">{switcher}</div>}

      {/* navegación compacta en móvil */}
      <nav className="pointer-events-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-1 lg:hidden">
        {windows.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onView(item.id)}
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
              view === item.id
                ? 'bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] text-white'
                : light
                  ? 'text-[#4a628f]'
                  : 'text-white/90'
            }`}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenChat}
          className={`rounded-full px-3 py-1 text-[11px] font-bold ${light ? 'text-[#4a628f]' : 'text-white/90'}`}
        >
          Chat
        </button>
      </nav>
    </header>
  )
}
