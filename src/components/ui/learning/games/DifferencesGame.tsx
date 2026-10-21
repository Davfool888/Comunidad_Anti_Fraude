import { useState } from 'react'
import { COMPARE_CASES } from '../../../../data/learning/games/differences'
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
import { GameShell, OptionList, PrimaryButton } from '../GameShell'

/**
 * Juego 3 · **Encuentra las diferencias**.
 *
 * Dos fichas enfrentadas: el usuario marca lo que merece atención y después
 * responde la pregunta final. Al terminar se resalta lo marcado y se explica
 * qué es señal de alerta, qué necesita verificación y qué no prueba nada.
 */
export function DifferencesGame({ onExit }: { onExit: () => void }) {
  const flow = useGameFlow()
  const [index, setIndex] = useState(0)
  const [marked, setMarked] = useState<string[]>([])
  const [choice, setChoice] = useState<string | null>(null)
  const [scorer] = useState(() => new GameScorer('diferencias', COMPARE_CASES.length))
  const { finishGame, state } = useLearning()

  const current = COMPARE_CASES[index]
  const option = current.answer.options.find((item) => item.id === choice)
  const isLast = index === COMPARE_CASES.length - 1

  const toggle = (id: string) =>
    setMarked((value) => (value.includes(id) ? value.filter((item) => item !== id) : [...value, id]))

  const answer = () => {
    if (!choice) return
    scorer.add(current.categoryId, current.id, scoreOption(option))
    flow.go('feedback')
  }

  const nextCase = () => {
    if (isLast) {
      finishGame(scorer.finish(), 'diferencias')
      flow.go('summary')
      return
    }
    setIndex((value) => value + 1)
    setMarked([])
    setChoice(null)
    flow.go('scenario')
  }

  const restart = () => {
    setIndex(0)
    setMarked([])
    setChoice(null)
    flow.reset()
  }

  const result = scorer.finish()

  /* ------------------------- 1. Introducción ------------------------- */
  if (flow.step === 'intro') {
    return (
      <GameShell title="Encuentra las diferencias" onExit={onExit} step="intro">
        <GameIntroduction
          intro={GAME_INTROS.diferencias}
          onStart={() => flow.go('scenario')}
          onExit={onExit}
        />
      </GameShell>
    )
  }

  /* --------------------------- 2. Situación -------------------------- */
  if (flow.step === 'scenario') {
    return (
      <GameShell
        title={current.title}
        subtitle={current.prompt}
        onExit={onExit}
        step="scenario"
      >
        <ScenarioPresentation
          scenario={current.scenario}
          onNext={() => flow.go('challenge')}
          onBack={flow.back}
          nextLabel="Comparar las dos fichas"
        />
      </GameShell>
    )
  }

  /* --------------------------- 3. Interacción ------------------------ */
  if (flow.step === 'challenge' && choice === null) {
    return (
      <GameShell
        title={current.title}
        subtitle={current.prompt}
        onExit={onExit}
        step="challenge"
      >
        <div className="space-y-4">
          <p className="text-[11.5px] font-semibold text-[#8aa0c4]">
            Marca los elementos que merecen verificacion ({marked.length} marcados).
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            {(
              [
                { side: 'Izquierda', data: current.left },
                { side: 'Derecha', data: current.right },
              ] as const
            ).map((column) => (
              <div key={column.side} className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
                <p className="text-[9.5px] font-extrabold tracking-[0.12em] text-[#7a90b8] uppercase">
                  {column.side}
                </p>
                <p className="mt-1 text-[14px] font-extrabold text-[#1d2f57]">{column.data.name}</p>
                <p className="mt-0.5 text-[11px] font-medium text-[#8aa0c4]">{column.data.subtitle}</p>
                <ul className="mt-3 space-y-1.5">
                  {column.data.items.map((item) => {
                    const active = marked.includes(item.id)
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => toggle(item.id)}
                          className={`w-full rounded-xl border px-3 py-2 text-left text-[11.5px] leading-snug transition-colors duration-200 ${
                            active
                              ? 'border-[#7f9df0] bg-[#eef4ff] text-[#1d3f77]'
                              : 'border-transparent bg-[#f7faff] text-[#3d568e] hover:bg-[#eef4ff]'
                          }`}
                        >
                          {item.text}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton label="Continuar a la pregunta" onClick={() => setChoice('__preguntado__')} />
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

  /* ------------------------ 3b. Pregunta final ------------------------ */
  if (flow.step === 'challenge') {
    return (
      <GameShell
        title={current.title}
        subtitle={current.prompt}
        onExit={onExit}
        step="challenge"
      >
        <div className="space-y-4">
          <p className="text-[15px] leading-snug font-extrabold text-[#1d2f57]">{current.answer.prompt}</p>
          <OptionList
            options={current.answer.options}
            selected={choice === '__preguntado__' ? null : choice}
            answered={false}
            onSelect={setChoice}
          />
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton label="Comprobar" onClick={answer} disabled={!choice || choice === '__preguntado__'} />
            <button
              type="button"
              onClick={() => setChoice(null)}
              className="rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
            >
              Volver a comparar
            </button>
          </div>
        </div>
      </GameShell>
    )
  }

  /* ------------------------- 4. Retroalimentación --------------------- */
  if (flow.step === 'feedback') {
    const found = [...current.left.items, ...current.right.items].filter((item) => marked.includes(item.id))
    return (
      <GameShell title={current.title} onExit={onExit} step="feedback">
        <FeedbackPanel
          verdict={option?.verdict ?? 'incorrect'}
          explanation={option?.explanation ?? ''}
          why={
            found.length
              ? found
                  .map((item) => `${item.difference ? 'Diferencia relevante' : 'Para verificar'}: ${item.detail}`)
                  .join(' ')
              : 'No marcaste ningún elemento. En una comparación, lo que no se revisa también es una decisión.'
          }
          lookAt="Compara los dos lados entre sí, no cada uno por separado."
          safeAction="Antes de comprar, verifica que la información publicada coincida con la que puedes comprobar por un canal propio."
          onNext={nextCase}
          nextLabel={isLast ? 'Ver el resultado' : 'Siguiente caso'}
          onBack={() => flow.go('challenge')}
        />
      </GameShell>
    )
  }

  /* ------------------------------ 5. Cierre --------------------------- */
  return (
    <GameShell title="Encuentra las diferencias" onExit={onExit} step="summary">
      <GameSummary
        title="Comparación completada"
        score={{
          correct: result.correct,
          total: result.total,
          points: result.score,
          partial: result.partial,
          incorrect: result.incorrect,
        }}
        learning={GAME_INTROS.diferencias.prevention}
        signals={GAME_INTROS.diferencias.signs}
        recommendation={GAME_INTROS.diferencias.prevention}
        badges={state.badges}
        onRetry={restart}
        onExit={onExit}
      />
    </GameShell>
  )
}
