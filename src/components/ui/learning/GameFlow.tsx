import type { ReactNode } from 'react'
import type { GameIntro, Scenario, Verdict } from '../../../data/learning/types'
import { FraudScene, ScenarioVisualView, SimulatedTag } from './Visuals'
import { type FlowStep } from './useGameFlow'

/**
 * Componentes del flujo de diapositivas: introducción, situación,
 * retroalimentación, cierre e indicador de progreso.
 *
 * El estado del recorrido vive en `useGameFlow` (archivo aparte) para que este
 * módulo solo exporte componentes.
 */

export type { FlowStep }

/* ------------------------------------------------------------------ */
/* Indicador de progreso                                               */
/* ------------------------------------------------------------------ */

const STEP_LABELS: { id: FlowStep; label: string }[] = [
  { id: 'intro', label: 'Introducción' },
  { id: 'scenario', label: 'Caso' },
  { id: 'challenge', label: 'Decisión' },
  { id: 'feedback', label: 'Resultado' },
  { id: 'summary', label: 'Cierre' },
]

export function ProgressIndicator({
  step,
  labels = STEP_LABELS,
}: {
  step: FlowStep
  labels?: { id: string; label: string }[]
}) {
  const activeIndex = labels.findIndex((item) => item.id === step)

  return (
    <nav aria-label="Progreso de la actividad" className="flex flex-wrap items-center gap-1.5">
      {labels.map((item, index) => {
        const state = index < activeIndex ? 'hecho' : index === activeIndex ? 'actual' : 'pendiente'
        return (
          <span key={item.id} className="flex items-center gap-1.5">
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold transition-colors duration-300 ${
                state === 'actual'
                  ? 'bg-[#5b7cf5] text-white'
                  : state === 'hecho'
                    ? 'bg-[#eefbf3] text-[#1d7a53]'
                    : 'bg-white/70 text-[#8aa0c4]'
              }`}
              aria-current={state === 'actual' ? 'step' : undefined}
            >
              {state === 'hecho' && (
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                  <path d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7 9.5 16.2Z" />
                </svg>
              )}
              {item.label}
            </span>
            {index < labels.length - 1 && (
              <span className="h-px w-3 bg-[#c9dbf6]" aria-hidden="true" />
            )}
          </span>
        )
      })}
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/* Diapositiva 1 · Introducción educativa                              */
/* ------------------------------------------------------------------ */

export function GameIntroduction({
  intro,
  onStart,
  onExit,
}: {
  intro: GameIntro
  onStart: () => void
  onExit: () => void
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-center">
      <div className="rounded-[22px] border border-[#dbe6f7] bg-white/85 p-4">
        <FraudScene variant={intro.illustration} className="h-auto w-full" label={intro.title} />
        <p className="mt-3 text-center text-[10px] font-bold tracking-[0.1em] text-[#8aa0c4] uppercase">
          {intro.title}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-[22px] leading-tight font-extrabold text-[#1d2f57]">{intro.title}</h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#3d568e]">{intro.summary}</p>
        </div>

        <div className="rounded-2xl border border-[#dbe6f7] bg-white/80 p-4">
          <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
            Cómo suele funcionar
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#3d568e]">{intro.howItWorks}</p>
        </div>

        <div>
          <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
            Señales de alerta
          </p>
          <ul className="mt-2 space-y-1.5">
            {intro.signs.map((sign) => (
              <li key={sign} className="flex gap-2 text-[12.5px] leading-snug text-[#3d568e]">
                <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#e9a13b]" />
                {sign}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#bfe3d1] bg-[#eefbf3] p-4">
          <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#1d7a53] uppercase">
            Recomendación preventiva
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed font-medium text-[#245c44]">
            {intro.prevention}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-5 py-3 text-[13px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5"
          >
            Comenzar juego
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M13.2 5.6 11.8 7l4 4H4v2h11.8l-4 4 1.4 1.4L19.8 12l-6.6-6.4Z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-xl bg-white px-4 py-3 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
          >
            Volver al centro
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Diapositiva 2 · Presentación de la situación                         */
/* ------------------------------------------------------------------ */

export function ScenarioPresentation({
  scenario,
  onNext,
  onBack,
  nextLabel = 'Analizar la situación',
  children,
}: {
  scenario: Scenario
  onNext: () => void
  onBack: () => void
  nextLabel?: string
  /** Elementos extra (por ejemplo, las piezas seleccionables). */
  children?: ReactNode
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
        <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
          La situación
        </p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed font-medium text-[#2c4478]">
          {scenario.situation}
        </p>

        {scenario.characters.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {scenario.characters.map((character) => (
              <li
                key={character.name}
                className="flex items-center gap-1.5 rounded-full bg-[#eef4ff] px-2.5 py-1 text-[10.5px] font-bold text-[#4a628f]"
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#5b7cf5] text-[9px] font-extrabold text-white">
                  {character.name.slice(0, 1)}
                </span>
                {character.name}
                <span className="font-semibold text-[#8aa0c4]">· {character.role}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-2">
          <SimulatedTag />
          <ScenarioVisualView visual={scenario.visual} />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-[#c9dbf6] bg-[#eef4ff] p-4">
            <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#2f4b86] uppercase">
              Tu misión
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed font-semibold text-[#2c4478]">
              {scenario.instruction}
            </p>
          </div>
          {children}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_12px_26px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5"
        >
          {nextLabel}
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M13.2 5.6 11.8 7l4 4H4v2h11.8l-4 4 1.4 1.4L19.8 12l-6.6-6.4Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
        >
          Atrás
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Diapositiva 4 · Retroalimentación                                   */
/* ------------------------------------------------------------------ */

const VERDICT_STYLE: Record<Verdict, { chip: string; text: string }> = {
  correct: { chip: 'bg-[#2fb87c]', text: 'Decisión segura' },
  partial: { chip: 'bg-[#e9a13b]', text: 'Decisión a medias' },
  incorrect: { chip: 'bg-[#e23b5f]', text: 'Decisión de riesgo' },
  insufficient: { chip: 'bg-[#5b7cf5]', text: 'Faltaba información' },
}

export function FeedbackPanel({
  verdict,
  explanation,
  /** Sección secundaria desplegable: «¿Por qué?». */
  why,
  /** Qué elemento de la situación conviene mirar. */
  lookAt,
  /** Acción más segura en la vida real. */
  safeAction,
  onNext,
  nextLabel = 'Siguiente',
  onBack,
}: {
  verdict: Verdict
  explanation: string
  why?: string
  lookAt?: string
  safeAction?: string
  onNext: () => void
  nextLabel?: string
  onBack?: () => void
}) {
  const style = VERDICT_STYLE[verdict]

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.12em] text-white uppercase ${style.chip}`}
        >
          {style.text}
        </span>
        <p className="mt-2.5 text-[13.5px] leading-relaxed font-medium text-[#2c4478]">{explanation}</p>
      </div>

      {(lookAt || safeAction) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {lookAt && (
            <div className="rounded-2xl border border-[#f4d9a8] bg-[#fff8e8] p-4">
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#b06f13] uppercase">
                Qué mirar
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed font-medium text-[#6a4a12]">{lookAt}</p>
            </div>
          )}
          {safeAction && (
            <div className="rounded-2xl border border-[#bfe3d1] bg-[#eefbf3] p-4">
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#1d7a53] uppercase">
                Acción más segura
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed font-medium text-[#245c44]">{safeAction}</p>
            </div>
          )}
        </div>
      )}

      {why && (
        <details className="group rounded-2xl border border-[#dbe6f7] bg-white/80">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[12px] font-extrabold text-[#4a628f] transition-colors duration-200 hover:text-[#1d3f77]">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 transition-transform duration-200 group-open:rotate-90"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M9 6l6 6-6 6V6Z" />
            </svg>
            ¿Por qué?
          </summary>
          <p className="px-4 pb-4 text-[12.5px] leading-relaxed font-medium text-[#3d568e]">{why}</p>
        </details>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_12px_26px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5"
        >
          {nextLabel}
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M13.2 5.6 11.8 7l4 4H4v2h11.8l-4 4 1.4 1.4L19.8 12l-6.6-6.4Z" />
          </svg>
        </button>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
          >
            Atrás
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Diapositiva 5 · Cierre                                              */
/* ------------------------------------------------------------------ */

export function GameSummary({
  title,
  score,
  learning,
  signals,
  recommendation,
  onRetry,
  onExit,
  onNext,
  nextLabel,
  badges,
}: {
  title: string
  score: { correct: number; total: number; points: number; partial?: number; incorrect?: number }
  learning: string
  signals: string[]
  recommendation: string
  onRetry: () => void
  onExit: () => void
  onNext?: () => void
  nextLabel?: string
  badges?: string[]
}) {
  const percentage = score.total ? Math.round((score.correct / score.total) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-5">
        <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
          Resultado de la actividad
        </p>
        <h3 className="mt-1 text-[20px] leading-tight font-extrabold text-[#1d2f57]">{title}</h3>

        <div className="mt-3 flex items-end gap-4">
          <div>
            <p className="text-[30px] leading-none font-extrabold text-[#243d6b]">
              {score.correct}/{score.total}
            </p>
            <p className="mt-1 text-[10.5px] font-bold text-[#8aa0c4]">aciertos · {percentage}%</p>
          </div>
          <div className="flex-1">
            <span className="block h-2 overflow-hidden rounded-full bg-[#eef4ff]">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] transition-all duration-700"
                style={{ width: `${percentage}%` }}
              />
            </span>
            <p className="mt-1.5 text-[10.5px] font-bold text-[#8aa0c4]">
              {score.points} puntos
              {score.partial ? ` · ${score.partial} parciales` : ''}
              {score.incorrect ? ` · ${score.incorrect} de riesgo` : ''}
            </p>
          </div>
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

      <div className="rounded-2xl border border-[#c9dbf6] bg-[#eef4ff] p-4">
        <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#2f4b86] uppercase">
          Aprendizaje principal
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed font-medium text-[#2c4478]">{learning}</p>
      </div>

      {signals.length > 0 && (
        <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
          <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
            Señales de alerta identificadas
          </p>
          <ul className="mt-2 space-y-1.5">
            {signals.map((signal) => (
              <li key={signal} className="flex gap-2 text-[12.5px] leading-snug text-[#3d568e]">
                <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#e9a13b]" />
                {signal}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-[#bfe3d1] bg-[#eefbf3] p-4">
        <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#1d7a53] uppercase">
          Recomendación práctica
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed font-medium text-[#245c44]">{recommendation}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_12px_26px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5"
        >
          Repetir la actividad
        </button>
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
        >
          Volver al centro
        </button>
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="rounded-xl bg-[#eef4ff] px-4 py-2.5 text-[12.5px] font-bold text-[#2f4b86] ring-1 ring-[#c9dbf6] transition-colors duration-200 hover:bg-[#dce9ff]"
          >
            {nextLabel ?? 'Continuar con otra actividad'}
          </button>
        )}
      </div>
    </div>
  )
}
