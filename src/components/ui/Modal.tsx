import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Ventana modal con fondo velado. Se cierra con Escape o pulsando fuera.
 * Se dibuja en <body> (portal) para quedar siempre por encima del mapa y la cabecera.
 */
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  width = 640,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  width?: number
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-[#1d2f57]/40 px-4 py-10 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full overflow-hidden rounded-[26px] border border-white/70 bg-white shadow-[0_40px_90px_-30px_rgba(25,45,95,.7)]"
        style={{ maxWidth: width }}
      >
        <header className="flex items-start gap-3 border-b border-[#dbe6f7] bg-[#f7faff] px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-extrabold text-[#1d2f57]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[11.5px] font-medium text-[#6b81ad]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[18px] text-[#8aa0c4] transition-colors hover:bg-[#eef4ff] hover:text-[#1d2f57]"
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/** Estilos de campo compartidos por los formularios. */
export const fieldClass =
  'w-full rounded-xl border border-[#dbe6f7] bg-[#f7faff] px-3.5 py-2.5 text-[12.5px] font-medium text-[#2c4478] outline-none transition-colors placeholder:text-[#a3b5d4] focus:border-[#9dbdf0] focus:bg-white'

export const labelClass = 'mb-1 block text-[10px] font-extrabold tracking-[0.12em] text-[#7a90b8] uppercase'

export const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-5 py-2.5 text-[12.5px] font-bold text-white shadow-[0_12px_26px_-12px_rgba(80,90,220,.9)] transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50'

export const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#dbe6f7] bg-white px-4 py-2 text-[12px] font-bold text-[#4a628f] transition-colors hover:bg-[#eef4ff]'
