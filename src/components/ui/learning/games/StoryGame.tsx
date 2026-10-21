import { useState } from 'react'
import { STORIES } from '../../../../data/learning/games/stories'
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
import { GameShell, OptionList, PrimaryButton, VerdictBadge } from '../GameShell'

/**
 * Juego 2 · **Tú decides**.
 *
 * Historias ramificadas: cada decisión lleva a un nodo distinto. El recorrido
 * conserva el camino recorrido y, al terminar, resume qué decisiones fueron
 * seguras y cuáles dejaron la puerta abierta.
 */
export function StoryGame({ onExit }: { onExit: () => void }) {
  const flow = useGameFlow()
  const [storyIndex, setStoryIndex] = useState(0)
  const [nodeId, setNodeId] = useState(STORIES[0].start)
  const [choice, setChoice] = useState<string | null>(null)
  const [path, setPath] = useState<{ safe: string[]; risky: string[] }>({ safe: [], risky: [] })
  const [scorer] = useState(() => new GameScorer('historias', STORIES.length))
  const { finishGame, state } = useLearning()

  const story = STORIES[storyIndex]
  const node = story.nodes.find((item) => item.id === nodeId) ?? story.nodes[0]
  const option = node.options.find((item) => item.id === choice)
  const isLastStory = storyIndex === STORIES.length - 1

  /** Aplica la decisión y avanza por la historia. */
  const decide = () => {
    if (!option) return
    const scored = scoreOption(option)
    scorer.add(story.categoryId, `${story.id}-${node.id}`, scored)
    setPath((current) => ({
      safe: scored.verdict === 'correct' ? [...current.safe, option.label] : current.safe,
      risky: scored.verdict === 'incorrect' ? [...current.risky, option.label] : current.risky,
    }))
    flow.go('feedback')
  }

  /** Continúa por el nodo que corresponde a la decisión tomada. */
  const continueStory = () => {
    if (!option) return
    if (option.next === 'fin' || node.end) {
      if (isLastStory) {
        finishGame(scorer.finish(), 'historias')
        flow.go('summary')
        return
      }
      setStoryIndex((value) => value + 1)
      setNodeId(STORIES[storyIndex + 1].start)
      setChoice(null)
      setPath({ safe: [], risky: [] })
      flow.go('scenario')
      return
    }
    setNodeId(option.next)
    setChoice(null)
    flow.go('scenario')
  }

  const restart = () => {
    setStoryIndex(0)
    setNodeId(STORIES[0].start)
    setChoice(null)
    setPath({ safe: [], risky: [] })
    flow.reset()
  }

  const result = scorer.finish()

  /* ------------------------- 1. Introducción ------------------------- */
  if (flow.step === 'intro') {
    return (
      <GameShell title="Tú decides" onExit={onExit} step="intro">
        <GameIntroduction
          intro={GAME_INTROS.historias}
          onStart={() => flow.go('scenario')}
          onExit={onExit}
        />
      </GameShell>
    )
  }

  /* --------------------------- 2. Situación -------------------------- */
  if (flow.step === 'scenario') {
    const scenario = node.scenario ?? {
      situation: story.intro,
      characters: [],
      visual: {
        kind: 'entorno' as const,
        items: [{ label: 'Historia', value: story.title }],
        note: 'Simulación educativa: la historia es ficticia.',
      },
      instruction: node.prompt,
    }
    return (
      <GameShell
        title={story.title}
        subtitle={`Historia ${storyIndex + 1} de ${STORIES.length}`}
        onExit={onExit}
        step="scenario"
      >
        <ScenarioPresentation
          scenario={scenario}
          onNext={() => flow.go('challenge')}
          onBack={flow.back}
          nextLabel="Ver las opciones"
        />
      </GameShell>
    )
  }

  /* --------------------------- 3. Interacción ------------------------ */
  if (flow.step === 'challenge') {
    return (
      <GameShell
        title={story.title}
        subtitle={node.prompt}
        onExit={onExit}
        step="challenge"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4 text-[13px] leading-relaxed text-[#2c4478]">
            {node.message.text}
          </div>
          <OptionList
            options={node.options}
            selected={choice}
            answered={false}
            onSelect={setChoice}
          />
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton label="Decidir" onClick={decide} disabled={!choice} />
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

  /* ------------------------- 4. Retroalimentación --------------------- */
  if (flow.step === 'feedback') {
    return (
      <GameShell title={story.title} onExit={onExit} step="feedback">
        <div className="space-y-4">
          <VerdictBadge verdict={option?.verdict ?? 'incorrect'}>
            <p className="mt-2 text-[12.5px] leading-relaxed font-medium text-[#3d568e]">
              {option?.consequence}
            </p>
          </VerdictBadge>

          <FeedbackPanel
            verdict={option?.verdict ?? 'incorrect'}
            explanation={option?.explanation ?? ''}
            why={`La regla que resume este caso: ${story.closing.lesson}`}
            lookAt="Fíjate en a quién controlaba el canal por el que te llegó la petición."
            safeAction="Verificar por un canal que tú elijas antes de entregar datos o mover dinero."
            onNext={continueStory}
            nextLabel={node.end || option?.next === 'fin' ? (isLastStory ? 'Ver el resultado' : 'Siguiente historia') : 'Continuar la historia'}
            onBack={() => flow.go('challenge')}
          />

          {node.end && (
            <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
                Tu recorrido
              </p>
              <div className="mt-2 space-y-2">
                {[
                  { label: 'Decisiones seguras', items: path.safe, tone: 'text-[#1d7a53]' },
                  { label: 'Decisiones de riesgo', items: path.risky, tone: 'text-[#c2274a]' },
                ].map((group) => (
                  <div key={group.label}>
                    <p className="text-[10.5px] font-extrabold text-[#7a90b8] uppercase">
                      {group.label}
                    </p>
                    <ul className="mt-1 space-y-1">
                      {group.items.length === 0 && (
                        <li className="text-[11.5px] font-medium text-[#8aa0c4]">Ninguna en este tramo.</li>
                      )}
                      {group.items.map((item) => (
                        <li key={item} className={`text-[12px] font-semibold ${group.tone}`}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </GameShell>
    )
  }

  /* ------------------------------ 5. Cierre --------------------------- */
  return (
    <GameShell title="Tú decides" onExit={onExit} step="summary">
      <GameSummary
        title="Historias completadas"
        score={{
          correct: result.correct,
          total: result.total,
          points: result.score,
          partial: result.partial,
          incorrect: result.incorrect,
        }}
        learning={GAME_INTROS.historias.prevention}
        signals={GAME_INTROS.historias.signs}
        recommendation={GAME_INTROS.historias.prevention}
        badges={state.badges}
        onRetry={restart}
        onExit={onExit}
      />
    </GameShell>
  )
}
