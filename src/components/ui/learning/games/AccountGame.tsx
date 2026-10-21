import { useState } from 'react'
import { PROTECTION_GAME } from '../../../../data/learning/games/account'
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
 * Juego 7 · **Protege tu cuenta**.
 *
 * Tres fases (verificar, proteger, recuperar). El panel de seguridad simulado
 * muestra cómo cambia el estado ficticio de la cuenta según lo que el usuario
 * decide. Nunca se piden contraseñas ni códigos reales.
 */
export function AccountGame({ onExit }: { onExit: () => void }) {
  const flow = useGameFlow()
  const [phase, setPhase] = useState(0)
  const [choice, setChoice] = useState<string | null>(null)
  const [scorer] = useState(() => new GameScorer('protege-cuenta', 3))
  const { finishGame, state } = useLearning()

  const current = PROTECTION_GAME.phases[phase]
  const option = current.options.find((item) => item.id === choice)
  const isLast = phase === PROTECTION_GAME.phases.length - 1

  const answer = () => {
    if (!choice) return
    scorer.add(current.id, current.id, scoreOption(option))
    flow.go('feedback')
  }

  const nextPhase = () => {
    if (isLast) {
      finishGame(scorer.finish(), 'protege-cuenta')
      flow.go('summary')
      return
    }
    setPhase((value) => value + 1)
    setChoice(null)
    flow.go('scenario')
  }

  const restart = () => {
    setPhase(0)
    setChoice(null)
    flow.reset()
  }

  const result = scorer.finish()

  /* ------------------------- 1. Introducción ------------------------- */
  if (flow.step === 'intro') {
    return (
      <GameShell title={PROTECTION_GAME.title} onExit={onExit} step="intro">
        <GameIntroduction
          intro={GAME_INTROS['protege-cuenta']}
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
        title={PROTECTION_GAME.title}
        subtitle={current.title}
        onExit={onExit}
        step="scenario"
      >
        <ScenarioPresentation
          scenario={current.scenario}
          onNext={() => flow.go('challenge')}
          onBack={flow.back}
          nextLabel="Ver el panel de seguridad"
        />
      </GameShell>
    )
  }

  /* --------------------------- 3. Interacción ------------------------ */
  if (flow.step === 'challenge') {
    return (
      <GameShell
        title={PROTECTION_GAME.title}
        subtitle={current.title}
        onExit={onExit}
        step="challenge"
      >
        <div className="space-y-4">
          <OptionList
            options={current.options}
            selected={choice}
            answered={false}
            onSelect={setChoice}
          />
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton label="Comprobar" onClick={answer} disabled={!choice} />
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
      <GameShell title={PROTECTION_GAME.title} onExit={onExit} step="feedback">
        <FeedbackPanel
          verdict={option?.verdict ?? 'incorrect'}
          explanation={option?.explanation ?? ''}
          why={`Medidas que aplican en esta fase: ${current.measures.map((measure) => measure.label).join('; ')}.`}
          lookAt="Fíjate en el panel: las sesiones abiertas y los avisos pendientes son los que muestran el estado real de la cuenta."
          safeAction="Entra por la app oficial, revisa las sesiones y el correo de recuperación, y avisa a tus contactos si hubo mensajes enviados sin tu autorización."
          onNext={nextPhase}
          nextLabel={isLast ? 'Ver el resultado' : `Siguiente: ${PROTECTION_GAME.phases[phase + 1].title}`}
          onBack={() => flow.go('challenge')}
        />
      </GameShell>
    )
  }

  /* ------------------------------ 5. Cierre --------------------------- */
  return (
    <GameShell title={PROTECTION_GAME.title} onExit={onExit} step="summary">
      <GameSummary
        title="Simulación completada"
        score={{
          correct: result.correct,
          total: result.total,
          points: result.score,
          partial: result.partial,
          incorrect: result.incorrect,
        }}
        learning={GAME_INTROS['protege-cuenta'].prevention}
        signals={GAME_INTROS['protege-cuenta'].signs}
        recommendation={GAME_INTROS['protege-cuenta'].prevention}
        badges={state.badges}
        onRetry={restart}
        onExit={onExit}
      />
    </GameShell>
  )
}
