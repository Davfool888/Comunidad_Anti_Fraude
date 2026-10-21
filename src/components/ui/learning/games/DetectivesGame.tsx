import { useState } from 'react'
import type { DetectiveCase } from '../../../../data/learning/types'
import { DETECTIVE_CASES } from '../../../../data/learning/games/detectives'
import { GAME_INTROS } from '../../../../data/learning/games/introductions'
import { GameScorer, scoreOption } from '../../../../lib/learning/engine'
import { useLearning } from '../learningContext'
import {
  FeedbackPanel,
  GameIntroduction,
  GameSummary,
  ScenarioPresentation,
  } from '../GameFlow'
import { useGameFlow } from '../useGameFlow'
import { GameShell, OptionList, PrimaryButton, SimulatedTag, VerdictBadge } from '../GameShell'

/**
 * Juego 1 · **Detectives digitales**.
 *
 * Recorrido: introducción → situación → marcar pistas → retroalimentación →
 * decidir → retroalimentación → cierre.
 *
 * Volver atrás no borra lo que el usuario ya marcó ni la decisión tomada.
 */
export function DetectivesGame({ onExit }: { onExit: () => void }) {
  const flow = useGameFlow()
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'pistas' | 'decision'>('pistas')
  const [marked, setMarked] = useState<string[]>([])
  const [classification, setClassification] = useState<Record<string, string>>({})
  const [choice, setChoice] = useState<string | null>(null)
  const [scorer] = useState(() => new GameScorer('detectives', DETECTIVE_CASES.length))
  const { finishGame, state } = useLearning()

  const current = DETECTIVE_CASES[index]
  const option = current.decision.options.find((item) => item.id === choice)
  const isLast = index === DETECTIVE_CASES.length - 1

  /** Puntúa las pistas marcadas y muestra su explicación. */
  const checkClues = () => {
    const total = current.clues.length
    const hits = current.clues.filter((clue) => marked.includes(clue.id)).length
    scorer.add(current.categoryId, current.id, {
      verdict: hits === total ? 'correct' : hits > 0 ? 'partial' : 'incorrect',
      points: Math.round((hits / Math.max(total, 1)) * 60),
      correct: hits === total,
    })
    flow.go('feedback')
  }

  /** Puntúa la decisión final. */
  const checkDecision = () => {
    if (!choice) return
    scorer.add(current.categoryId, `${current.id}-decision`, scoreOption(option))
    flow.go('feedback')
  }

  /** Pasa al siguiente caso o cierra la partida. */
  const nextCase = () => {
    if (isLast) {
      finishGame(scorer.finish(), 'detectives')
      flow.go('summary')
      return
    }
    setIndex((value) => value + 1)
    setPhase('pistas')
    setMarked([])
    setClassification({})
    setChoice(null)
    flow.go('scenario')
  }

  const restart = () => {
    setIndex(0)
    setPhase('pistas')
    setMarked([])
    setClassification({})
    setChoice(null)
    flow.reset()
  }

  /* ------------------------- 1. Introducción ------------------------- */
  if (flow.step === 'intro') {
    return (
      <GameShell title="Detectives digitales" onExit={onExit} step="intro">
        <GameIntroduction
          intro={GAME_INTROS.detectives}
          onStart={() => flow.go('scenario')}
          onExit={onExit}
        />
      </GameShell>
    )
  }

  /* --------------------------- 2. Situación -------------------------- */
  if (flow.step === 'scenario') {
    return (
      <GameShell title={current.title} onExit={onExit} step="scenario">
        <ScenarioPresentation
          scenario={current.scenario}
          onNext={() => flow.go('challenge')}
          onBack={flow.back}
          nextLabel="Examinar el mensaje"
        />
      </GameShell>
    )
  }

  /* --------------------------- 3. Interacción ------------------------ */
  if (flow.step === 'challenge' && phase === 'pistas') {
    return (
      <GameShell title={current.title} onExit={onExit} step="challenge">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-extrabold text-[#1d2f57]">
              {current.classification
                ? 'Clasifica cada elemento del mensaje'
                : 'Marca las señales de alerta del mensaje'}
            </p>
            <span className="text-[11px] font-bold text-[#8aa0c4]">
              Caso {index + 1} de {DETECTIVE_CASES.length}
            </span>
          </div>

          <SimulatedTag />

          {current.classification ? (
            <ClassificationTask
              items={current.classification}
              values={classification}
              onChange={(id, value) => setClassification((state2) => ({ ...state2, [id]: value }))}
            />
          ) : (
            <>
              <p className="text-[11.5px] font-semibold text-[#8aa0c4]">
                Toca los fragmentos que te parecen señales de alerta ({marked.length} marcados).
              </p>
              <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4 text-[13px] leading-relaxed text-[#2c4478]">
                {current.message.parts.map((part) => {
                  const clue = current.clues.find((item) => item.id === part.clueId)
                  const isMarked = marked.includes(part.id)
                  return (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() =>
                        setMarked((value) =>
                          value.includes(part.id)
                            ? value.filter((id) => id !== part.id)
                            : [...value, part.id],
                        )
                      }
                      className={`mr-1 inline rounded-lg px-1 py-0.5 text-left transition-colors duration-200 ${
                        isMarked
                          ? 'bg-[#dce9ff] text-[#1d3f77] ring-1 ring-[#9dbdf0]'
                          : 'hover:bg-[#eef4ff]'
                      }`}
                      title={clue?.label}
                    >
                      {part.text}
                    </button>
                  )
                })}
              </div>

              {marked.length > 0 && (
                <ul className="space-y-2">
                  {current.message.parts
                    .filter((part) => marked.includes(part.id))
                    .map((part) => {
                      const clue = current.clues.find((item) => item.id === part.clueId)
                      return (
                        <li
                          key={part.id}
                          className="rounded-xl border border-[#dbe6f7] bg-white/80 px-3.5 py-2.5 text-[11.5px] leading-snug text-[#3d568e]"
                        >
                          {clue ? (
                            <>
                              <strong className="font-extrabold text-[#2c4478]">{clue.label}.</strong>{' '}
                              {clue.detail}
                            </>
                          ) : (
                            <span className="font-semibold">
                              Este fragmento no aporta señales: puede ser normal.
                            </span>
                          )}
                        </li>
                      )
                    })}
                </ul>
              )}
            </>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton
              label={current.classification ? 'Revisar y decidir' : 'Comprobar mis pistas'}
              onClick={() => {
                if (current.classification) {
                  flow.go('challenge')
                  setPhase('decision')
                } else {
                  checkClues()
                }
              }}
              disabled={current.classification
                ? Object.keys(classification).length < current.classification.length
                : marked.length === 0}
            />
            <button
              type="button"
              onClick={flow.back}
              className="rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
            >
              Atrás
            </button>
          </div>
        </div>
      </GameShell>
    )
  }

  /* ------------------------ 3b. Decisión final ------------------------ */
  if (flow.step === 'challenge') {
    return (
      <GameShell title={current.title} onExit={onExit} step="challenge">
        <div className="space-y-4">
          <p className="text-[15px] leading-snug font-extrabold text-[#1d2f57]">
            {current.decision.prompt}
          </p>
          <OptionList
            options={current.decision.options}
            selected={choice}
            answered={false}
            onSelect={setChoice}
          />
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton label="Comprobar mi decisión" onClick={checkDecision} disabled={!choice} />
            <button
              type="button"
              onClick={() => {
                setPhase('pistas')
                flow.go('challenge')
              }}
              className="rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
            >
              Volver a las pistas
            </button>
          </div>
        </div>
      </GameShell>
    )
  }

  /* ------------------------- 4. Retroalimentación --------------------- */
  if (flow.step === 'feedback') {
    // retroalimentación de las pistas
    if (phase === 'pistas') {
      const total = current.clues.length
      const hits = current.clues.filter((clue) => marked.includes(clue.id)).length
      const hitsList = current.clues.filter((clue) => marked.includes(clue.id))
      return (
        <GameShell title={current.title} onExit={onExit} step="feedback">
          <FeedbackPanel
            verdict={hits === total ? 'correct' : hits > 0 ? 'partial' : 'incorrect'}
            explanation={
              hits === total
                ? `Has marcado las ${total} señales de alerta del mensaje. Eso es exactamente lo que había que revisar antes de decidir.`
                : `Has marcado ${hits} de las ${total} señales. Repasa el mensaje: lo que no se ve también decide.`
            }
            why={
              hitsList.length
                ? hitsList.map((clue) => `${clue.label}: ${clue.detail}`).join(' ')
                : 'No marcaste ninguna señal. Recuerda que en un mensaje sospechoso casi siempre hay más de una: el plazo, el enlace, lo que pide y quién dice enviarlo.'
            }
            lookAt="El remitente, el plazo, el enlace y lo que te piden: esas cuatro cosas se revisan juntas."
            safeAction="Verificar por un canal oficial antes de escribir nada en el enlace recibido."
            onNext={() => {
              setPhase('decision')
              flow.go('challenge')
            }}
            nextLabel="Ahora decide cómo actuar"
            onBack={() => {
              setPhase('pistas')
              flow.go('challenge')
            }}
          />
        </GameShell>
      )
    }

    // retroalimentación de la decisión
    return (
      <GameShell title={current.title} onExit={onExit} step="feedback">
        <div className="space-y-4">
          <VerdictBadge verdict={option?.verdict ?? 'incorrect'}>
            <p className="mt-2 text-[12.5px] leading-relaxed font-medium text-[#3d568e]">
              {option?.explanation}
            </p>
          </VerdictBadge>

          <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
            <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
              Sobre el caso
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed font-semibold text-[#2c4478]">
              {current.outcome.label}
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed font-medium text-[#3d568e]">
              {current.outcome.text}
            </p>
          </div>

          <div className="rounded-2xl border border-[#c9dbf6] bg-[#eef4ff] p-4">
            <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#2f4b86] uppercase">
              Que te llevas
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed font-medium text-[#2c4478]">
              {current.learning}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton
              label={isLast ? 'Ver el resultado' : 'Siguiente caso'}
              onClick={nextCase}
            />
            <button
              type="button"
              onClick={() => {
                setPhase('decision')
                flow.go('challenge')
              }}
              className="rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
            >
              Volver a la decisión
            </button>
          </div>
        </div>
      </GameShell>
    )
  }

  /* ------------------------------ 5. Cierre --------------------------- */
  const result = scorer.finish()
  return (
    <GameShell title="Detectives digitales" onExit={onExit} step="summary">
      <GameSummary
        title="Investigación completada"
        score={{
          correct: result.correct,
          total: result.total,
          points: result.score,
          partial: result.partial,
          incorrect: result.incorrect,
        }}
        learning={GAME_INTROS.detectives.prevention}
        signals={[
          'Un plazo corto con una amenaza si no actúas.',
          'Piden tu clave, tu PIN o un código de un solo uso.',
          'El enlace no es el dominio real de la entidad.',
        ]}
        recommendation={GAME_INTROS.detectives.prevention}
        badges={state.badges}
        onRetry={restart}
        onExit={onExit}
      />
    </GameShell>
  )
}

/* ------------------------------------------------------------------ */
/* Tarea de clasificación                                              */
/* ------------------------------------------------------------------ */

const CLASS_OPTIONS = [
  { id: 'alerta', label: 'Señal de alerta' },
  { id: 'verificar', label: 'Información que debe verificarse' },
  { id: 'neutro', label: 'No demuestra fraude por sí solo' },
]

function ClassificationTask({
  items,
  values,
  onChange,
}: {
  items: NonNullable<DetectiveCase['classification']>
  values: Record<string, string>
  onChange: (id: string, value: string) => void
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-3.5">
          <p className="text-[12.5px] leading-snug font-semibold text-[#2c4478]">{item.text}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CLASS_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(item.id, option.id)}
                className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold transition-colors duration-200 ${
                  values[item.id] === option.id
                    ? 'bg-[#5b7cf5] text-white'
                    : 'bg-[#eef4ff] text-[#4a628f] hover:bg-[#dce9ff]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
