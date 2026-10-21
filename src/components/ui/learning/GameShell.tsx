import type { ReactNode } from 'react'
import type { Option, Verdict } from '../../../data/learning/types'
import { LEARNING_CATEGORIES } from '../../../data/learning/categories'
import type { GameResult } from '../../../lib/learning/engine'
import { weakestCategories } from '../../../lib/learning/engine'
import { ProgressIndicator, type FlowStep } from './GameFlow'

/**
 * Piezas compartidas por los juegos: el marco, la etiqueta de simulación, el
 * aviso de resultado y la lista de opciones.
 */

/* ------------------------------------------------------------------ */
/* Etiqueta de simulación                                              */
/* ------------------------------------------------------------------ */

export function SimulatedTag({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-[#fff4e2] px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.12em] text-[#b06f13] uppercase ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z" />
      </svg>
      Simulación educativa
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Aviso de veredicto                                                  */
/* ------------------------------------------------------------------ */

const VERDICT_STYLE: Record<Verdict, { card: string; badge: string; label: string; text: string }> = {
  correct: {
    card: 'border-[#bfe3d1] bg-[#eefbf3]',
    badge: 'bg-[#2fb87c] text-white',
    label: 'text-[#1d7a53]',
    text: 'Decisión segura',
  },
  partial: {
    card: 'border-[#f4d9a8] bg-[#fff8e8]',
    badge: 'bg-[#e9a13b] text-white',
    label: 'text-[#b06f13]',
    text: 'A medias',
  },
  incorrect: {
    card: 'border-[#f4a9bb] bg-[#fff1f4]',
    badge: 'bg-[#e23b5f] text-white',
    label: 'text-[#c2274a]',
    text: 'Decisión de riesgo',
  },
  insufficient: {
    card: 'border-[#c9dbf6] bg-[#eef4ff]',
    badge: 'bg-[#5b7cf5] text-white',
    label: 'text-[#2f4b86]',
    text: 'Faltaba información',
  },
}

export function VerdictBadge({ verdict, children }: { verdict: Verdict; children?: ReactNode }) {
  const style = VERDICT_STYLE[verdict]
  return (
    <div className={`rounded-2xl border-l-4 p-3.5 ${style.card}`}>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9.5px] font-extrabold tracking-[0.12em] uppercase ${style.badge}`}
      >
        {style.text}
      </span>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Lista de opciones                                                    */
/* ------------------------------------------------------------------ */

export function OptionList({
  options,
  selected,
  answered,
  onSelect,
}: {
  options: Option[]
  selected: string | null
  answered: boolean
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      {options.map((option) => {
        const active = option.id === selected
        return (
          <button
            key={option.id}
            type="button"
            disabled={answered}
            onClick={() => onSelect(option.id)}
            className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors duration-200 ${
              answered
                ? option.verdict === 'correct'
                  ? 'border-[#2fb87c] bg-[#eefbf3]'
                  : active
                    ? 'border-[#e9a13b] bg-[#fff8e8]'
                    : 'border-[#dbe6f7] bg-white/60'
                : active
                  ? 'border-[#7f9df0] bg-[#eef4ff]'
                  : 'border-[#dbe6f7] bg-white hover:bg-[#f6faff]'
            }`}
          >
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[10px] font-black ${
                active ? 'border-[#5b7cf5] bg-[#5b7cf5] text-white' : 'border-[#c9dbf6]'
              }`}
            >
              {active ? '✓' : ''}
            </span>
            <span className="text-[12.5px] leading-snug font-semibold text-[#2c4478]">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Marco del juego                                                      */
/* ------------------------------------------------------------------ */

export function GameShell({
  title,
  subtitle,
  step,
  onExit,
  children,
  footer,
  indicator,
}: {
  title: string
  subtitle?: string
  /** Paso actual del recorrido (para el indicador de progreso). */
  step?: FlowStep
  onExit: () => void
  children: ReactNode
  footer?: ReactNode
  /** Indicador de progreso personalizado. */
  indicator?: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/70 shadow-[0_34px_70px_-32px_rgba(25,45,95,.55)] backdrop-blur-xl">
      <header className="border-b border-[#dbe6f7] bg-gradient-to-r from-[#eef4ff] to-[#f7f0ff] px-5 py-4 sm:px-7">
        <button
          type="button"
          onClick={onExit}
          className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6b81ad] transition-colors duration-200 hover:text-[#1d3f77]"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
            <path d="M10.8 5.6 12.2 7l-4 4H20v2H8.2l4 4-1.4 1.4L4.2 12l6.6-6.4Z" />
          </svg>
          Volver al centro de aprendizaje
        </button>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-[20px] leading-tight font-extrabold text-[#1d2f57]">{title}</h3>
            {subtitle && (
              <p className="mt-1 max-w-[620px] text-[12.5px] leading-relaxed font-medium text-[#6b81ad]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {indicator ?? (step ? <div className="mt-3">{<ProgressIndicator step={step} />}</div> : null)}
      </header>

      <div className="px-5 py-5 sm:px-7 sm:py-6">{children}</div>

      {footer && (
        <div className="flex flex-wrap items-center gap-3 border-t border-[#dbe6f7] px-5 py-4 sm:px-7">{footer}</div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Resultado final                                                      */
/* ------------------------------------------------------------------ */

export function GameResultPanel({
  result,
  title,
  review,
  onRetry,
  onExit,
  badges,
}: {
  result: GameResult
  title: string
  /** Explicaciones de los elementos a repasar. */
  review: { id: string; text: string }[]
  onRetry: () => void
  onExit: () => void
  badges?: string[]
}) {
  const weak = weakestCategories(result)
  const percentage = result.total ? Math.round((result.correct / result.total) * 100) : 0

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-5">
        <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
          Resultado
        </p>
        <h4 className="mt-1 text-[19px] leading-tight font-extrabold text-[#1d2f57]">{title}</h4>
        <p className="mt-2 text-[13px] leading-relaxed font-medium text-[#4a628f]">
          {result.correct} de {result.total} aciertos · {result.partial} parciales ·{' '}
          {result.incorrect} decisiones de riesgo · {result.score} puntos.
        </p>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eef4ff]">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0]"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {badges && badges.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <li
                key={badge}
                className="rounded-full bg-[#eefbf3] px-2.5 py-1 text-[10px] font-extrabold text-[#1d7a53] ring-1 ring-[#bfe3d1]"
              >
                {badge}
              </li>
            ))}
          </ul>
        )}
      </div>

      {weak.length > 0 && (
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
            Categorías donde conviene reforzar
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {weak.map((id) => (
              <li
                key={id}
                className="rounded-full bg-[#fff8e8] px-2.5 py-1 text-[10.5px] font-bold text-[#b06f13] ring-1 ring-[#f4d9a8]"
              >
                {LEARNING_CATEGORIES.find((category) => category.id === id)?.title ?? id}
              </li>
            ))}
          </ul>
        </div>
      )}

      {review.length > 0 && (
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
            Para repasar
          </p>
          <ul className="mt-2 space-y-2">
            {review.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-[#dbe6f7] bg-white/80 px-3.5 py-2.5 text-[12px] leading-relaxed font-medium text-[#3d568e]"
              >
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_12px_26px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5"
        >
          Repetir el juego
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
        >
          Volver al centro
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Botones                                                             */
/* ------------------------------------------------------------------ */

export function PrimaryButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_12px_26px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
    >
      {label}
    </button>
  )
}
