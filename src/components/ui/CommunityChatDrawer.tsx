import type { Community, CommunityNetwork } from '../../data/networks'
import { CommunityChat } from './CommunityChat'

/**
 * Panel lateral del chat de la comunidad.
 *
 * Se abre **encima del modelo 3D**, pegado al borde izquierdo de la
 * ventana, y se puede **minimizar** para dejar sólo un botón flotante.
 */
export function CommunityChatDrawer({
  open,
  minimized,
  network,
  community,
  onMinimize,
  onClose,
  onRestore,
}: {
  open: boolean
  minimized: boolean
  network: CommunityNetwork
  community: Community
  onMinimize: () => void
  onClose: () => void
  onRestore: () => void
}) {
  if (!open) return null

  // minimizado: sólo queda el botón para volver a abrirlo
  if (minimized) {
    return (
      <button
        type="button"
        onClick={onRestore}
        className="pointer-events-auto fixed bottom-6 left-5 z-40 flex items-center gap-2.5 rounded-full border border-white/70 bg-white/85 px-4 py-3 text-[12px] font-bold text-[#1d2f57] shadow-[0_26px_54px_-22px_rgba(30,55,130,.7)] backdrop-blur-xl transition-transform duration-200 hover:-translate-y-0.5"
      >
        <span
          className="grid h-8 w-8 place-items-center rounded-full text-white"
          style={{ background: network.color }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2Zm2 4v2h12V8H6Zm0 4v2h8v-2H6Z" />
          </svg>
        </span>
        <span className="text-left leading-tight">
          Chat del barrio
          <span className="block text-[10px] font-semibold text-[#6b81ad]">{community.name}</span>
        </span>
      </button>
    )
  }

  return (
    <aside
      className="pointer-events-auto fixed top-[68px] bottom-0 left-0 z-40 flex w-full max-w-[430px] flex-col overflow-hidden border-r border-white/60 bg-[#f7faff]/92 shadow-[0_30px_70px_-28px_rgba(25,45,95,.6)] backdrop-blur-xl sm:top-[76px]"
      role="dialog"
      aria-label="Chat de la comunidad"
    >
      {/* barra superior con los controles */}
      <header className="flex items-center gap-3 border-b border-[#dbe6f7] bg-white/80 px-4 py-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white"
          style={{ background: network.color }}
        >
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
            <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2Zm2 4v2h12V8H6Zm0 4v2h8v-2H6Z" />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-extrabold text-[#1d2f57]">
            Chat del barrio {community.name}
          </p>
          <p className="truncate text-[10px] font-semibold text-[#8aa0c4]">
            {network.neighborhood} · {network.commune} · {community.stats.merchants} comercios
          </p>
        </div>

        <button
          type="button"
          onClick={onMinimize}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#8aa0c4] transition-colors duration-200 hover:bg-[#eef4ff] hover:text-[#5d76a6]"
          aria-label="Minimizar el chat"
          title="Minimizar"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M5 11h14v2H5v-2Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#8aa0c4] transition-colors duration-200 hover:bg-[#fff0f3] hover:text-[#e23b5f]"
          aria-label="Cerrar el chat"
          title="Cerrar"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6Z" />
          </svg>
        </button>
      </header>

      {/* conversación */}
      <div className="min-h-0 flex-1">
        <CommunityChat network={network} community={community} panel />
      </div>
    </aside>
  )
}
