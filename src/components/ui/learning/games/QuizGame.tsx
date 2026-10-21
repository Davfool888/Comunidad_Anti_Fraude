import { useEffect, useState } from 'react'
import type { QuizQuestion } from '../../../../data/learning/types'
import { TIME_ATTACK_QUESTIONS } from '../../../../data/learning/games/timeattack'
import { TRUE_FALSE_QUESTIONS } from '../../../../data/learning/games/truefalse'
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
 * Juegos 5 y 6 · **Desafío contrarreloj** y **Verdadero, falso o no sabemos**.
 *
 * Comparten motor: una situación visual por pantalla, una pregunta, la
 * retroalimentación y el cierre. El temporizador del contrarreloj es opcional
 * y nunca penaliza.
 */
export function QuizGame({
  gameId,
  onExit,
}: {
  gameId: 'contrarreloj' | 'vf-desafio'
  onExit: () => void
}) {
  const flow = useGameFlow()
  const bank = gameId === 'contrarreloj' ? TIME_ATTACK_QUESTIONS : TRUE_FALSE_QUESTIONS
  const [questions] = useState<QuizQuestion[]>(() => pickQuestions(bank, 10))
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [scorer] = useState(() => new GameScorer(gameId, 10))
  const [withTimer, setWithTimer] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const { finishGame, state } = useLearning()

  const current = questions[index]
  const option = current?.options.find((item) => item.id === choice)
  const intro = GAME_INTROS[gameId]
  const isLast = index === questions.length - 1

  // temporizador opcional: informa, no penaliza
  useEffect(() => {
    if (!withTimer || flow.step !== 'challenge' || answered) return
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [withTimer, flow.step, answered])

  const answer = () => {
    if (!choice) return
    scorer.add(current.categoryId, current.id, scoreOption(option))
    setAnswered(true)
    flow.go('feedback')
  }

  const next = () => {
    if (isLast) {
      finishGame(scorer.finish(), gameId)
      flow.go('summary')
      return
    }
    setIndex((value) => value + 1)
    setChoice(null)
    setAnswered(false)
    flow.go('scenario')
  }

  const restart = () => {
    setIndex(0)
    setChoice(null)
    setAnswered(false)
    setSeconds(0)
    flow.reset()
  }

  const result = scorer.finish()

  /* ------------------------- 1. Introducción ------------------------- */
  if (flow.step === 'intro') {
    return (
      <GameShell title={intro.title} onExit={onExit} step="intro">
        <GameIntroduction
          intro={intro}
          onStart={() => flow.go('scenario')}
          onExit={onExit}
        />
      </GameShell>
    )
  }

  /* --------------------------- 2. Situación -------------------------- */
  if (flow.step === 'scenario') {
    const scenario = current.scenario ?? fallbackScenario(current)
    return (
      <GameShell title={intro.title} onExit={onExit} step="scenario">
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
        title={intro.title}
        subtitle={current.prompt}
        onExit={onExit}
        step="challenge"
        footer={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setWithTimer((value) => !value)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors duration-200 ${
                withTimer ? 'bg-[#5b7cf5] text-white' : 'bg-white text-[#5d76a6] ring-1 ring-[#dbe6f7]'
              }`}
            >
              {withTimer ? 'Temporizador activo' : 'Activar temporizador (opcional)'}
            </button>
            {withTimer && (
              <span className="text-[11px] font-bold text-[#8aa0c4]">
                {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} · no penaliza
              </span>
            )}
            <span className="ml-auto text-[11px] font-semibold text-[#8aa0c4]">
              Situación {index + 1} de {questions.length} · {result.score} puntos
            </span>
          </div>
        }
      >
        <div className="space-y-4">
          {current.context && (
            <p className="rounded-xl bg-[#f4f8ff] px-3.5 py-2.5 text-[12.5px] leading-relaxed font-medium text-[#5d76a6]">
              {current.context}
            </p>
          )}
          <p className="text-[15px] leading-snug font-extrabold text-[#1d2f57]">{current.prompt}</p>
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
      <GameShell title={intro.title} onExit={onExit} step="feedback">
        <FeedbackPanel
          verdict={option?.verdict ?? 'incorrect'}
          explanation={option?.explanation ?? ''}
          why={current.learning}
          lookAt="Vuelve a la situación y fíjate en qué dato te hizo dudar: por eso existe la pregunta."
          safeAction={
            option?.verdict === 'correct'
              ? 'Esa es la decisión segura: verifícalo por un canal propio antes de actuar.'
              : 'La respuesta más segura en estos casos es siempre verificar por un canal oficial antes de entregar datos o dinero.'
          }
          onNext={next}
          nextLabel={isLast ? 'Ver el resultado' : 'Siguiente situación'}
          onBack={() => {
            setAnswered(false)
            flow.go('challenge')
          }}
        />
      </GameShell>
    )
  }

  /* ------------------------------ 5. Cierre --------------------------- */
  return (
    <GameShell title={intro.title} onExit={onExit} step="summary">
      <GameSummary
        title="Partida completada"
        score={{
          correct: result.correct,
          total: result.total,
          points: result.score,
          partial: result.partial,
          incorrect: result.incorrect,
        }}
        learning={intro.prevention}
        signals={intro.signs}
        recommendation={intro.prevention}
        badges={state.badges}
        onRetry={restart}
        onExit={onExit}
      />
    </GameShell>
  )
}

/** Escena simple para las preguntas que no tienen una propia. */
function fallbackScenario(question: QuizQuestion) {
  return {
    situation: question.context ?? question.prompt,
    characters: [],
    visual: {
      kind: 'entorno' as const,
      items: [{ label: 'Situación', value: question.prompt }],
      note: 'Simulación educativa: los datos son ficticios.',
    },
    instruction: 'Elige la respuesta más segura y lee la explicación.',
  }
}

/** Elige n preguntas al azar del banco (barajado por partida). */
function pickQuestions(bank: QuizQuestion[], count: number) {
  const pool = [...bank]
  const picked: QuizQuestion[] = []
  while (picked.length < count && pool.length) {
    const index = Math.floor(Math.random() * pool.length)
    picked.push(pool.splice(index, 1)[0])
  }
  return picked
}
