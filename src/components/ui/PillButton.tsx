import type { ReactNode } from 'react'

/** Botón cápsula verde con sombra difusa, tal como en el diseño. */
export function PillButton({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      className={`cursor-default rounded-full bg-gradient-to-r from-lime-400 to-lime-500 px-6 py-[11px] text-[14px] font-bold text-plum-800 shadow-glow-lime ring-1 ring-white/30 transition-transform duration-200 hover:scale-[1.02] ${className}`}
    >
      {children}
    </button>
  )
}
