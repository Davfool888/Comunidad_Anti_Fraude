import { Component } from 'react'
import type { ReactNode } from 'react'

/**
 * Red de seguridad para los juegos cargados en diferido.
 *
 * Si un chunk no se descarga o una actividad falla al renderizar, el centro
 * conserva su navegación y muestra una salida clara en vez de una pantalla en
 * blanco. No oculta el error: React lo sigue registrando en la consola.
 */
export class GameErrorBoundary extends Component<
  { children: ReactNode; onExit: () => void },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  private retry = () => this.setState({ hasError: false })

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-[28px] border border-[#f4a9bb] bg-[#fff1f4] p-6 shadow-[0_24px_50px_-32px_rgba(25,45,95,.45)]"
        >
          <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#c2274a] uppercase">
            Actividad no disponible
          </p>
          <h3 className="mt-1 text-[19px] leading-tight font-extrabold text-[#7a1d31]">
            No pudimos cargar esta actividad
          </h3>
          <p className="mt-2 max-w-[620px] text-[12.5px] leading-relaxed font-medium text-[#8a4052]">
            Puede ser un problema temporal de carga. Tu progreso guardado no se
            ha perdido. Intenta abrirla de nuevo o vuelve al centro de
            aprendizaje.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={this.retry}
              className="rounded-xl bg-[#c2274a] px-4 py-2.5 text-[12px] font-bold text-white transition-colors duration-200 hover:bg-[#a91d3d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2274a]"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={this.props.onExit}
              className="rounded-xl bg-white px-4 py-2.5 text-[12px] font-bold text-[#7a4050] ring-1 ring-[#f4c6d1] transition-colors duration-200 hover:bg-[#fff7f9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2274a]"
            >
              Volver al centro
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
