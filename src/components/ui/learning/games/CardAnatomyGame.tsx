import { useRef, useState } from 'react'
import type { CardField, CardFieldSide, CardQuestion } from '../../../../data/learning/types'
import {
  CARD_FIELDS,
  CARD_FIELD_BY_ID,
  CARD_GAME_ID,
  CARD_GAME_LEARNING,
  CARD_GAME_OBJECTIVE,
  CARD_GAME_SIGNALS,
  CARD_QUESTIONS,
  CARD_SIMULATION_NOTE,
} from '../../../../data/learning/games/cardAnatomy'
import { GAME_INTROS } from '../../../../data/learning/games/introductions'
import { GameScorer } from '../../../../lib/learning/engine'
import {
  evaluateCardQuestion,
  recordCardAttempt,
  type CardAttempt,
} from '../../../../lib/learning/cardAnatomy'
import { useLearning } from '../learningContext'
import { FeedbackPanel, GameSummary, ProgressIndicator } from '../GameFlow'
import { useGameFlow } from '../useGameFlow'
import { GameShell, PrimaryButton, SimulatedTag } from '../GameShell'
import { CardAnatomy } from '../CardAnatomy'

/**
 * Juego 9 · **Anatomía de una tarjeta**.
 *
 * La tarjeta es el objeto de interacción: cada dato es un botón. El juego
 * recorre seis preguntas (selección, identificación, secreto, riesgo,
 * clasificación e información insuficiente) y reutiliza el motor común para
 * puntuar. No guarda datos financieros ni pide información personal.
 */

const VERDICT_LABEL: Record<CardAttempt['verdict'], string> = {
  correct: 'Correcta',
  partial: 'Parcial',
  insufficient: 'Información insuficiente',
  incorrect: 'De riesgo',
}

const VERDICT_STYLE: Record<CardAttempt['verdict'], string> = {
  correct: 'bg-[#eefbf3] text-[#1d7a53]',
  partial: 'bg-[#fff8e8] text-[#b06f13]',
  insufficient: 'bg-[#eef4ff] text-[#2f4b86]',
  incorrect: 'bg-[#fff1f4] text-[#c2274a]',
}

/** Pasos propios del juego: la tarjeta sustituye al «caso» genérico. */
const CARD_STEPS = [
  { id: 'intro', label: 'Introducción' },
  { id: 'scenario', label: 'Tarjeta' },
  { id: 'challenge', label: 'Pregunta' },
  { id: 'feedback', label: 'Resultado' },
  { id: 'summary', label: 'Cierre' },
]

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-white/85 px-3 py-1 text-[10.5px] font-extrabold text-[#2f4b86] ring-1 ring-white">
      {label}: {value}
    </span>
  )
}

function QuestionProgress({ index, total }: { index: number; total: number }) {
  const percent = Math.round(((index + 1) / total) * 100)
  return (
    <span
      className="block h-1.5 overflow-hidden rounded-full bg-[#e6eefb]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={`Pregunta ${index + 1} de ${total}`}
    >
      <span
        className="block h-full rounded-full bg-gradient-to-r from-[#2fb87c] via-[#5b7cf5] to-[#9b6ef0] transition-all duration-500 motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </span>
  )
}

function ClassificationPicker({
  question,
  selectedFieldIds,
  value,
  onChange,
  disabled,
}: {
  question: CardQuestion
  selectedFieldIds: string[]
  value: string | null
  onChange: (id: string) => void
  disabled: boolean
}) {
  if (!question.classify) return null
  const hasField = selectedFieldIds.length === 1

  return (
    <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
      <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
        Clasificación
      </p>
      <p className="mt-1 text-[11.5px] leading-relaxed font-medium text-[#6b81ad]">
        {hasField
          ? 'Elige la categoría que mejor describe el campo marcado.'
          : 'Primero toca el campo del código de seguridad en la tarjeta.'}
      </p>
      <div className="mt-3 space-y-2">
        {question.classify.options.map((option) => {
          const active = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              disabled={disabled || !hasField}
              onClick={() => onChange(option.id)}
              className={`w-full rounded-xl border p-3 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5] disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none ${
                active
                  ? 'border-[#7f9df0] bg-[#eef4ff]'
                  : 'border-[#e8eefb] bg-white hover:bg-[#f7faff]'
              }`}
            >
              <span className="flex items-start gap-2">
                <span
                  className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 text-[9px] font-black ${
                    active
                      ? 'border-[#5b7cf5] bg-[#5b7cf5] text-white'
                      : 'border-[#c9dbf6]'
                  }`}
                  aria-hidden="true"
                >
                  {active ? '✓' : ''}
                </span>
                <span>
                  <span className="block text-[11.5px] leading-snug font-extrabold text-[#2c4478]">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] leading-relaxed font-medium text-[#8aa0c4]">
                    {option.description}
                  </span>
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SelectedSummary({
  selected,
  insufficient,
  insufficientLabel,
  onRemove,
  onRemoveInsufficient,
  disabled,
}: {
  selected: CardField[]
  insufficient: boolean
  insufficientLabel?: string
  onRemove: (id: string) => void
  onRemoveInsufficient: () => void
  disabled: boolean
}) {
  if (selected.length === 0 && !insufficient) return null

  return (
    <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
      <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
        Tu selección
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {selected.map((field) => (
          <li key={field.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRemove(field.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4ff] px-2.5 py-1 text-[10.5px] font-bold text-[#2f4b86] ring-1 ring-[#c9dbf6] transition-colors duration-200 hover:bg-[#dce9ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {field.label}
              <span className="text-[10px] text-[#8aa0c4]" aria-hidden="true">
                ✕
              </span>
            </button>
          </li>
        ))}
        {insufficient && (
          <li>
            <button
              type="button"
              disabled={disabled}
              onClick={onRemoveInsufficient}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4ff] px-2.5 py-1 text-[10.5px] font-bold text-[#2f4b86] ring-1 ring-[#c9dbf6] transition-colors duration-200 hover:bg-[#dce9ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {insufficientLabel ?? 'No hay información suficiente'}
              <span className="text-[10px] text-[#8aa0c4]" aria-hidden="true">
                ✕
              </span>
            </button>
          </li>
        )}
      </ul>
    </div>
  )
}

function CardReview({ question, attempt }: { question: CardQuestion; attempt: CardAttempt }) {
  const selected = attempt.selectedFieldIds
    .map((id) => CARD_FIELD_BY_ID[id])
    .filter((field): field is CardField => Boolean(field))
  const missing = question.correctFieldIds
    .filter((id) => !attempt.selectedFieldIds.includes(id))
    .map((id) => CARD_FIELD_BY_ID[id])
    .filter((field): field is CardField => Boolean(field))

  const chosenClassification = question.classify?.options.find(
    (option) => option.id === attempt.classificationId,
  )
  const correctClassification = question.classify?.options.find(
    (option) => option.id === question.classify?.correctClassificationId,
  )

  return (
    <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
          Revisión de tu respuesta
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[9.5px] font-extrabold ${VERDICT_STYLE[attempt.verdict]}`}
        >
          {VERDICT_LABEL[attempt.verdict]}
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {selected.map((field) => {
          const isCorrect = question.correctFieldIds.includes(field.id)
          return (
            <li
              key={field.id}
              className={`rounded-xl border px-3 py-2.5 ${
                isCorrect
                  ? 'border-[#bfe3d1] bg-[#eefbf3]'
                  : 'border-[#f4a9bb] bg-[#fff1f4]'
              }`}
            >
              <p className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-[#2c4478]">
                <span
                  className={`grid h-4 w-4 place-items-center rounded-full text-[9px] font-black text-white ${
                    isCorrect ? 'bg-[#2fb87c]' : 'bg-[#e23b5f]'
                  }`}
                  aria-hidden="true"
                >
                  {isCorrect ? '✓' : '✕'}
                </span>
                {field.label}: {field.value}
              </p>
              <p className="mt-1 text-[10.5px] leading-relaxed font-medium text-[#5d76a6]">
                {question.fieldExplanations[field.id] ?? field.explanation}
              </p>
            </li>
          )
        })}

        {attempt.insufficientSelected && (
          <li className="rounded-xl border border-[#c9dbf6] bg-[#eef4ff] px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[11.5px] font-extrabold text-[#2f4b86]">
              <span
                className="grid h-4 w-4 place-items-center rounded-full bg-[#5b7cf5] text-[9px] font-black text-white"
                aria-hidden="true"
              >
                i
              </span>
              No hay información suficiente
            </p>
            <p className="mt-1 text-[10.5px] leading-relaxed font-medium text-[#5d76a6]">
              Reconocer que un dato no está en la tarjeta es una respuesta válida. La imagen no
              demuestra que esté activa ni que tenga fondos.
            </p>
          </li>
        )}

        {selected.length === 0 && !attempt.insufficientSelected && (
          <li className="rounded-xl border border-dashed border-[#c9dbf6] bg-white/60 px-3 py-2.5 text-[11px] font-semibold text-[#8aa0c4]">
            No marcaste ningún campo.
          </li>
        )}
      </ul>

      {missing.length > 0 && (
        <div className="mt-3 rounded-xl bg-[#f7faff] px-3 py-2.5">
          <p className="text-[9.5px] font-extrabold tracking-[0.1em] text-[#7a90b8] uppercase">
            También era correcto
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {missing.map((field) => (
              <li key={field.id} className="text-[10.5px] leading-relaxed font-medium text-[#5d76a6]">
                <strong className="font-extrabold text-[#2c4478]">{field.label}:</strong>{' '}
                {question.fieldExplanations[field.id] ?? field.explanation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {question.classify && (
        <div className="mt-3 rounded-xl border border-[#e8eefb] bg-white px-3 py-2.5 text-[10.5px] leading-relaxed font-medium text-[#5d76a6]">
          <p>
            <strong className="font-extrabold text-[#2c4478]">Tu clasificación:</strong>{' '}
            {chosenClassification?.label ?? 'Sin clasificar'}
          </p>
          <p className="mt-1">
            <strong className="font-extrabold text-[#2c4478]">Clasificación esperada:</strong>{' '}
            {correctClassification?.label ?? '—'}
          </p>
        </div>
      )}
    </div>
  )
}

function SummaryDetails({ attempts }: { attempts: Record<string, CardAttempt> }) {
  return (
    <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-5">
      <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
        Respuesta por pregunta
      </p>
      <ul className="mt-3 space-y-2">
        {CARD_QUESTIONS.map((question, index) => {
          const attempt = attempts[question.id]
          if (!attempt) return null
          return (
            <li
              key={question.id}
              className="flex flex-wrap items-start justify-between gap-2 border-b border-[#eef3fb] pb-2 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-[11.5px] font-extrabold text-[#2c4478]">
                  {index + 1}. {question.prompt}
                </p>
                <p className="mt-0.5 text-[10px] font-medium text-[#8aa0c4]">
                  {attempt.points} puntos
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold ${VERDICT_STYLE[attempt.verdict]}`}
              >
                {VERDICT_LABEL[attempt.verdict]}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function CardAnatomyGame({ onExit }: { onExit: () => void }) {
  const flow = useGameFlow()
  const [index, setIndex] = useState(0)
  const [side, setSide] = useState<CardFieldSide>('front')
  const [selected, setSelected] = useState<string[]>([])
  const [classification, setClassification] = useState<string | null>(null)
  const [insufficientSelected, setInsufficientSelected] = useState(false)
  const [orientationFieldId, setOrientationFieldId] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<Record<string, CardAttempt>>({})
  const [limitMessage, setLimitMessage] = useState('')
  const [scorer, setScorer] = useState(
    () => new GameScorer(CARD_GAME_ID, CARD_QUESTIONS.length),
  )
  const scoredRef = useRef(new Set<string>())
  const finishedRef = useRef(false)
  const { finishGame, state } = useLearning()

  const current = CARD_QUESTIONS[index]
  const attempt = attempts[current.id]
  const isLast = index === CARD_QUESTIONS.length - 1
  const intro = GAME_INTROS[CARD_GAME_ID]
  const selectedFields = selected
    .map((id) => CARD_FIELD_BY_ID[id])
    .filter((field): field is CardField => Boolean(field))
  const orientationField = orientationFieldId
    ? CARD_FIELD_BY_ID[orientationFieldId]
    : undefined
  const cardIndicator = <ProgressIndicator step={flow.step} labels={CARD_STEPS} />

  const loadQuestion = (nextIndex: number) => {
    const question = CARD_QUESTIONS[nextIndex]
    const saved = attempts[question.id]
    setIndex(nextIndex)
    setSelected(saved?.selectedFieldIds ?? [])
    setClassification(saved?.classificationId ?? null)
    setInsufficientSelected(saved?.insufficientSelected ?? false)
    setSide(question.initialSide ?? 'front')
    setLimitMessage('')
    flow.go('challenge')
  }

  const startQuestions = () => {
    setOrientationFieldId(null)
    loadQuestion(0)
  }

  const toggleField = (fieldId: string) => {
    if (attempt) return
    const question = current
    if (insufficientSelected) setInsufficientSelected(false)

    if (selected.includes(fieldId)) {
      setSelected((value) => value.filter((id) => id !== fieldId))
      if (question.interactionType === 'classify') setClassification(null)
      setLimitMessage('')
      return
    }

    if (question.interactionType === 'classify') setClassification(null)

    if (question.maxSelections === 1) {
      setSelected([fieldId])
      setLimitMessage('')
      return
    }

    if (selected.length >= question.maxSelections) {
      setLimitMessage(
        `Ya seleccionaste ${question.maxSelections}. Quita uno para poder elegir otro.`,
      )
      return
    }

    setSelected((value) => [...value, fieldId])
    setLimitMessage('')
  }

  const selectInsufficient = () => {
    if (attempt) return
    if (insufficientSelected) {
      setInsufficientSelected(false)
      return
    }
    setSelected([])
    setClassification(null)
    setInsufficientSelected(true)
    setLimitMessage('')
  }

  const canConfirm =
    Boolean(attempt) ||
    (insufficientSelected ||
      (selected.length > 0 &&
        (current.interactionType !== 'classify' || Boolean(classification))))

  const answer = () => {
    if (attempt) {
      flow.go('feedback')
      return
    }
    if (!canConfirm || scoredRef.current.has(current.id)) {
      if (scoredRef.current.has(current.id)) flow.go('feedback')
      return
    }

    const evaluation = evaluateCardQuestion(
      current,
      selected,
      classification,
      insufficientSelected,
    )
    const nextAttempt: CardAttempt = {
      questionId: current.id,
      selectedFieldIds: [...selected],
      classificationId: classification,
      insufficientSelected,
      verdict: evaluation.verdict,
      points: evaluation.score.points,
    }
    scoredRef.current.add(current.id)
    const recorded = recordCardAttempt(attempts, nextAttempt)
    if (!recorded.recorded) {
      flow.go('feedback')
      return
    }
    setAttempts(recorded.attempts)
    scorer.add(current.categoryId, current.id, evaluation.score)
    flow.go('feedback')
  }

  const goPrevious = () => {
    if (index === 0) {
      flow.go('scenario')
      return
    }
    loadQuestion(index - 1)
  }

  const nextQuestion = () => {
    if (isLast) {
      if (!finishedRef.current) {
        finishedRef.current = true
        finishGame(scorer.finish(), CARD_GAME_ID)
      }
      flow.go('summary')
      return
    }
    loadQuestion(index + 1)
  }

  const restart = () => {
    setIndex(0)
    setSide('front')
    setSelected([])
    setClassification(null)
    setInsufficientSelected(false)
    setOrientationFieldId(null)
    setAttempts({})
    setLimitMessage('')
    setScorer(new GameScorer(CARD_GAME_ID, CARD_QUESTIONS.length))
    scoredRef.current.clear()
    finishedRef.current = false
    flow.reset()
  }

  /* ------------------------- 1. Introducción ------------------------- */
  if (flow.step === 'intro') {
    return (
      <GameShell title={intro.title} onExit={onExit} indicator={cardIndicator}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <div className="space-y-2">
            <SimulatedTag />
            <CardAnatomy
              selectedIds={[]}
              side={side}
              onSideChange={setSide}
              disabled
            />
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-[22px] leading-tight font-extrabold text-[#1d2f57]">
                {intro.title}
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[#3d568e]">
                {intro.summary}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <InfoPill label="Duración" value={`${CARD_QUESTIONS.length} preguntas · 8 min`} />
              <InfoPill label="Nivel" value="Básica" />
            </div>

            <div className="rounded-2xl border border-[#c9dbf6] bg-[#eef4ff] p-4">
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#2f4b86] uppercase">
                Objetivo
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed font-medium text-[#2c4478]">
                {CARD_GAME_OBJECTIVE}
              </p>
            </div>

            <div className="rounded-2xl border border-[#f4d9a8] bg-[#fff8e8] p-4">
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#b06f13] uppercase">
                Datos sensibles
              </p>
              <ul className="mt-2 space-y-1.5">
                {CARD_GAME_SIGNALS.map((signal) => (
                  <li key={signal} className="flex gap-2 text-[12px] leading-snug text-[#6a4a12]">
                    <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#e9a13b]" />
                    {signal}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#bfe3d1] bg-[#eefbf3] p-4">
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#1d7a53] uppercase">
                Recomendación
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed font-medium text-[#245c44]">
                {intro.prevention}
              </p>
            </div>

            <p className="rounded-xl bg-white/70 px-3 py-2 text-[10.5px] leading-relaxed font-semibold text-[#8aa0c4]">
              {CARD_SIMULATION_NOTE} No escribas datos reales en ningún momento.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSide('front')
                  setOrientationFieldId(null)
                  flow.go('scenario')
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-5 py-3 text-[13px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                Comenzar
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M13.2 5.6 11.8 7l4 4H4v2h11.8l-4 4 1.4 1.4L19.8 12l-6.6-6.4Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onExit}
                className="rounded-xl bg-white px-4 py-3 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5]"
              >
                Volver al centro
              </button>
            </div>
          </div>
        </div>
      </GameShell>
    )
  }

  /* ------------------- 2. Presentación de la tarjeta ------------------ */
  if (flow.step === 'scenario') {
    return (
      <GameShell
        title={intro.title}
        subtitle="Conoce la tarjeta antes de responder"
        onExit={onExit}
        indicator={cardIndicator}
      >
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
            <div className="space-y-2">
              <SimulatedTag />
              <CardAnatomy
                selectedIds={orientationFieldId ? [orientationFieldId] : []}
                side={side}
                onSideChange={setSide}
                onToggle={(fieldId) => {
                  setOrientationFieldId((value) => (value === fieldId ? null : fieldId))
                  const field = CARD_FIELD_BY_ID[fieldId]
                  if (field) setSide(field.side)
                }}
              />
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-[#c9dbf6] bg-[#eef4ff] p-4">
                <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#2f4b86] uppercase">
                  Explora la tarjeta
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed font-semibold text-[#2c4478]">
                  Toca un campo del anverso o del reverso. Verás qué representa y por qué conviene
                  protegerlo. No hay una respuesta que memorizar todavía.
                </p>
              </div>

              <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                {CARD_FIELDS.map((field) => {
                  const active = orientationFieldId === field.id
                  return (
                    <li key={field.id}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setOrientationFieldId((value) => (value === field.id ? null : field.id))
                          setSide(field.side)
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5] ${
                          active
                            ? 'border-[#7f9df0] bg-[#eef4ff]'
                            : 'border-[#e8eefb] bg-white/80 hover:bg-[#f7faff]'
                        }`}
                      >
                        <span className="text-[10.5px] font-extrabold text-[#2c4478]">
                          {field.label}
                        </span>
                        <span className="truncate text-[10px] font-semibold text-[#8aa0c4]">
                          {field.value}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              <div className="min-h-[88px] rounded-2xl border border-[#e8eefb] bg-white/85 p-4">
                {orientationField ? (
                  <>
                    <p className="text-[10px] font-extrabold tracking-[0.12em] text-[#7a90b8] uppercase">
                      {orientationField.label}
                    </p>
                    <p className="mt-1 text-[13px] font-extrabold text-[#2c4478]">
                      {orientationField.value}
                    </p>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed font-medium text-[#5d76a6]">
                      {orientationField.explanation}
                    </p>
                  </>
                ) : (
                  <p className="text-[11.5px] leading-relaxed font-medium text-[#8aa0c4]">
                    Toca un campo de la tarjeta o de esta lista para ver su explicación.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton label="Empezar las preguntas" onClick={startQuestions} />
            <button
              type="button"
              onClick={() => flow.go('intro')}
              className="rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5]"
            >
              Atrás
            </button>
          </div>
        </div>
      </GameShell>
    )
  }

  /* --------------------------- 3. Pregunta --------------------------- */
  if (flow.step === 'challenge') {
    return (
      <GameShell
        title={intro.title}
        subtitle={`Pregunta ${index + 1} de ${CARD_QUESTIONS.length}`}
        onExit={onExit}
        indicator={cardIndicator}
        footer={
          <div className="flex w-full flex-wrap items-center gap-3">
            <span className="text-[11px] font-semibold text-[#8aa0c4]">
              {attempt
                ? 'Esta pregunta ya está registrada. Puedes revisar la explicación.'
                : 'Cada pregunta se puntúa una sola vez.'}
            </span>
            <span className="ml-auto text-[11px] font-bold text-[#8aa0c4]">
              {Object.keys(attempts).length} de {CARD_QUESTIONS.length} comprobadas
            </span>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[9.5px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
                Pregunta {index + 1}
              </span>
              <span className="rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-[9.5px] font-extrabold text-[#4a628f]">
                {current.kind === 'insufficient'
                  ? 'Información insuficiente'
                  : `Tipo ${current.kind}`}
              </span>
            </div>
            <h4 className="mt-1.5 text-[16px] leading-snug font-extrabold text-[#1d2f57]">
              {current.prompt}
            </h4>
            <p className="mt-1.5 text-[11.5px] leading-relaxed font-medium text-[#6b81ad]">
              {current.instruction}
            </p>
            <div className="mt-3">
              <QuestionProgress index={index} total={CARD_QUESTIONS.length} />
            </div>
            <p className="mt-2 text-[10.5px] font-semibold text-[#8aa0c4]">
              {current.interactionType === 'classify'
                ? 'Selecciona 1 campo y una categoría.'
                : current.allowInsufficient
                  ? 'Puedes marcar un campo o elegir que falta información.'
                  : current.expectedSelections > 1
                    ? `Selecciona ${current.expectedSelections} campos. Llevas ${selected.length} de ${current.maxSelections}.`
                    : 'Selecciona 1 campo.'}
            </p>

            {current.allowInsufficient && (
              <button
                type="button"
                aria-pressed={insufficientSelected}
                disabled={Boolean(attempt)}
                onClick={selectInsufficient}
                className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-[11.5px] font-extrabold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5] disabled:cursor-not-allowed disabled:opacity-60 ${
                  insufficientSelected
                    ? 'border-[#7f9df0] bg-[#eef4ff] text-[#2f4b86]'
                    : 'border-[#dbe6f7] bg-white text-[#5d76a6] hover:bg-[#f7faff]'
                }`}
              >
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 text-[9px] font-black ${
                    insufficientSelected
                      ? 'border-[#5b7cf5] bg-[#5b7cf5] text-white'
                      : 'border-[#c9dbf6]'
                  }`}
                  aria-hidden="true"
                >
                  {insufficientSelected ? '✓' : ''}
                </span>
                {current.insufficientLabel ?? 'No hay información suficiente'}
              </button>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
            <div className="space-y-2">
              <SimulatedTag />
              <CardAnatomy
                selectedIds={selected}
                side={side}
                onSideChange={setSide}
                onToggle={toggleField}
                disabled={Boolean(attempt)}
                revealed={false}
              />
            </div>

            <div className="space-y-3">
              {current.interactionType === 'classify' && (
                <ClassificationPicker
                  question={current}
                  selectedFieldIds={selected}
                  value={classification}
                  onChange={(id) =>
                    setClassification((value) => (value === id ? null : id))
                  }
                  disabled={Boolean(attempt)}
                />
              )}

              <SelectedSummary
                selected={selectedFields}
                insufficient={insufficientSelected}
                insufficientLabel={current.insufficientLabel}
                onRemove={toggleField}
                onRemoveInsufficient={selectInsufficient}
                disabled={Boolean(attempt)}
              />

              {limitMessage && (
                <p
                  role="status"
                  className="rounded-xl border border-[#f4d9a8] bg-[#fff8e8] px-3 py-2 text-[11px] leading-relaxed font-semibold text-[#8a5a10]"
                >
                  {limitMessage}
                </p>
              )}

              {attempt && (
                <div className="rounded-2xl border border-[#c9dbf6] bg-[#eef4ff] p-4">
                  <p className="text-[11px] leading-relaxed font-semibold text-[#2f4b86]">
                    Ya comprobaste esta pregunta. Puedes volver a la tarjeta para revisar los
                    campos o continuar para leer la explicación.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton
              label={attempt ? 'Ver resultado' : 'Comprobar respuesta'}
              onClick={answer}
              disabled={!canConfirm}
            />
            <button
              type="button"
              onClick={goPrevious}
              className="rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5]"
            >
              Atrás
            </button>
          </div>
        </div>
      </GameShell>
    )
  }

  /* ------------------------- 4. Retroalimentación -------------------- */
  if (flow.step === 'feedback') {
    if (!attempt) {
      return (
        <GameShell title={intro.title} onExit={onExit} indicator={cardIndicator}>
          <p className="text-[12.5px] font-semibold text-[#8aa0c4]">
            No hay una respuesta registrada. Vuelve a la pregunta para comprobarla.
          </p>
          <button
            type="button"
            onClick={() => flow.go('challenge')}
            className="mt-3 rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7]"
          >
            Volver a la pregunta
          </button>
        </GameShell>
      )
    }

    const picked = attempt.selectedFieldIds
      .map((id) => CARD_FIELD_BY_ID[id])
      .filter((field): field is CardField => Boolean(field))
    const missed = current.correctFieldIds
      .filter((id) => !attempt.selectedFieldIds.includes(id))
      .map((id) => CARD_FIELD_BY_ID[id])
      .filter((field): field is CardField => Boolean(field))
    const why = [
      ...picked.map(
        (field) =>
          `${field.label}: ${current.fieldExplanations[field.id] ?? field.explanation}`,
      ),
      ...missed.map(
        (field) =>
          `También debía tenerse en cuenta ${field.label}: ${
            current.fieldExplanations[field.id] ?? field.explanation
          }`,
      ),
      attempt.insufficientSelected
        ? 'Elegiste reconocer que falta información. Eso es una respuesta válida: la tarjeta no muestra si está activa o tiene fondos.'
        : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <GameShell title={intro.title} onExit={onExit} indicator={cardIndicator}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
          <div className="space-y-3">
            <SimulatedTag />
            <CardAnatomy
              selectedIds={attempt.selectedFieldIds}
              side={side}
              onSideChange={setSide}
              disabled
              revealed
              correctIds={current.correctFieldIds}
            />
            <CardReview question={current} attempt={attempt} />
          </div>

          <FeedbackPanel
            verdict={attempt.verdict}
            explanation={current.generalExplanation}
            why={why}
            lookAt={
              current.kind === 'insufficient'
                ? 'Fíjate en lo que la tarjeta muestra y, sobre todo, en lo que no muestra: estado de la cuenta, fondos y titularidad real.'
                : 'Vuelve a la tarjeta y fíjate en los campos que marcaste y en los que faltaban. No importa solo el dato aislado: importa el conjunto.'
            }
            safeAction={current.safetyRecommendation}
            onNext={nextQuestion}
            nextLabel={isLast ? 'Ver el resultado' : 'Siguiente pregunta'}
            onBack={() => flow.go('challenge')}
          />
        </div>
      </GameShell>
    )
  }

  /* ------------------------------ 5. Cierre --------------------------- */
  const result = scorer.finish()
  const insufficientCount = Object.values(attempts).filter(
    (item) => item.verdict === 'insufficient',
  ).length

  return (
    <GameShell title={intro.title} onExit={onExit} indicator={cardIndicator}>
      <div className="space-y-4">
        <SummaryDetails attempts={attempts} />
        <GameSummary
          title="Anatomía de la tarjeta completada"
          score={{
            correct: result.correct,
            total: result.total,
            points: result.score,
            partial: Math.max(0, result.partial - insufficientCount),
            insufficient: insufficientCount,
            incorrect: result.incorrect,
          }}
          learning={CARD_GAME_LEARNING}
          signals={CARD_GAME_SIGNALS}
          recommendation={intro.prevention}
          badges={state.badges}
          onRetry={restart}
          onExit={onExit}
          onNext={onExit}
          nextLabel="Continuar aprendiendo"
        />
      </div>
    </GameShell>
  )
}
