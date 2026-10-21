import { useState } from 'react'
import { LAB_CASES } from '../../../../data/learning/games/lab'
import { GAME_INTROS } from '../../../../data/learning/games/introductions'
import { GameScorer } from '../../../../lib/learning/engine'
import { useLearning } from '../learningContext'
import {
  FeedbackPanel,
  GameIntroduction,
  GameSummary,
  ScenarioPresentation,
  } from '../GameFlow'
import { useGameFlow } from '../useGameFlow'
import { EvidenceChip } from '../Visuals'
import { GameShell, PrimaryButton } from '../GameShell'

/**
 * Juego 4 · **Laboratorio de evidencias**.
 *
 * Tres retos encadenados: clasificar las evidencias, evaluar las hipótesis y
 * elegir las acciones prioritarias. El informe final distingue hechos,
 * señales, hipótesis pendientes e información que falta.
 */
export function LabGame({ onExit }: { onExit: () => void }) {
  const flow = useGameFlow()
  const current = LAB_CASES[0]
  const [phase, setPhase] = useState<'clasificar' | 'hipotesis' | 'acciones'>('clasificar')
  const [openEvidence, setOpenEvidence] = useState<string | null>(null)
  const [classified, setClassified] = useState<Record<string, string>>({})
  const [hypothesis, setHypothesis] = useState<string | null>(null)
  const [actions, setActions] = useState<string[]>([])
  const [scorer] = useState(() => new GameScorer('laboratorio', 3))
  const { finishGame, state } = useLearning()

  const CLASS_OPTIONS = [
    { id: 'hecho', label: 'Hecho documentado' },
    { id: 'indicio', label: 'Indicio que requiere analisis' },
    { id: 'falta', label: 'Informacion que falta' },
  ]

  /** Puntúa la clasificación de las evidencias. */
  const scoreClassification = () => {
    const correct = current.evidences.filter(
      (item) => classified[item.id] === item.classification,
    ).length
    const partial = current.evidences.filter(
      (item) => classified[item.id] && classified[item.id] !== item.classification,
    ).length
    scorer.add(current.categoryId, `${current.id}-clasificar`, {
      verdict:
        correct === current.evidences.length ? 'correct' : partial > 0 ? 'partial' : 'incorrect',
      points: Math.round((correct / current.evidences.length) * 100),
      correct: correct === current.evidences.length,
    })
    setPhase('hipotesis')
    flow.go('feedback')
  }

  const scoreHypothesis = () => {
    const chosen = current.hypotheses.find((item) => item.id === hypothesis)
    const ok = chosen ? !chosen.demonstrated : false
    scorer.add(current.categoryId, `${current.id}-hipotesis`, {
      verdict: ok ? 'correct' : 'incorrect',
      points: ok ? 100 : 0,
      correct: ok,
    })
    setPhase('acciones')
    flow.go('feedback')
  }

  const scoreActions = () => {
    const expected = current.expectedActions
    const chosen = actions.filter((id) => expected.includes(id)).length
    const wrong = actions.filter((id) => !expected.includes(id)).length
    const good = wrong === 0 && chosen === expected.length
    scorer.add(current.categoryId, `${current.id}-acciones`, {
      verdict: good ? 'correct' : wrong > 0 ? 'incorrect' : 'partial',
      points: Math.round((chosen / expected.length) * 100),
      correct: good,
    })
    finishGame(scorer.finish(), 'laboratorio')
    flow.go('summary')
  }

  const restart = () => {
    setClassified({})
    setHypothesis(null)
    setActions([])
    setOpenEvidence(null)
    setPhase('clasificar')
    flow.reset()
  }

  const result = scorer.finish()

  /* ------------------------- 1. Introducción ------------------------- */
  if (flow.step === 'intro') {
    return (
      <GameShell title="Laboratorio de evidencias" onExit={onExit} step="intro">
        <GameIntroduction
          intro={GAME_INTROS.laboratorio}
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
        subtitle={current.story[0]}
        onExit={onExit}
        step="scenario"
      >
        <ScenarioPresentation
          scenario={current.scenario}
          onNext={() => flow.go('challenge')}
          onBack={flow.back}
          nextLabel="Abrir el expediente"
        />
      </GameShell>
    )
  }

  /* --------------------------- 3. Interacción ------------------------ */
  if (flow.step === 'challenge') {
    return (
      <GameShell
        title={current.title}
        subtitle="Investiga antes de concluir"
        onExit={onExit}
        step="challenge"
      >
        {phase === 'clasificar' && (
          <div className="space-y-4">
            <div>
              <p className="text-[13px] font-extrabold text-[#1d2f57]">
                Reto 1 · Clasifica cada evidencia
              </p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-[#8aa0c4]">
                Abre cada tarjeta y decide qué es. Puedes corregir tu respuesta antes de continuar.
              </p>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {current.evidences.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-3.5">
                  <button
                    type="button"
                    onClick={() => setOpenEvidence(openEvidence === item.id ? null : item.id)}
                    className="w-full text-left"
                  >
                    <p className="text-[12.5px] font-extrabold text-[#243d6b]">{item.title}</p>
                    <p
                      className={`mt-1 text-[11.5px] leading-snug font-medium ${
                        openEvidence === item.id ? 'text-[#3d568e]' : 'text-[#8aa0c4]'
                      }`}
                    >
                      {openEvidence === item.id ? item.text : `${item.text.slice(0, 74)}…`}
                    </p>
                  </button>

                  {openEvidence === item.id && (
                    <p className="mt-2 rounded-xl bg-[#f4f8ff] px-3 py-2 text-[11px] leading-relaxed text-[#3d568e]">
                      {item.detail}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {CLASS_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setClassified((current2) => ({ ...current2, [item.id]: option.id }))
                        }
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors duration-200 ${
                          classified[item.id] === option.id
                            ? 'bg-[#5b7cf5] text-white'
                            : 'bg-[#eef4ff] text-[#4a628f] hover:bg-[#dce9ff]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {classified[item.id] && (
                    <div className="mt-2">
                      <EvidenceChip kind={classified[item.id] as 'hecho' | 'indicio' | 'falta'} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton
                label="Revisar y continuar"
                onClick={scoreClassification}
                disabled={Object.keys(classified).length < current.evidences.length}
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
        )}

        {phase === 'hipotesis' && (
          <div className="space-y-4">
            <div>
              <p className="text-[13px] font-extrabold text-[#1d2f57]">
                Reto 2 · Evalúa las hipótesis
              </p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-[#8aa0c4]">
                ¿Cuál de estas hipótesis está demostrada con la información disponible?
              </p>
            </div>

            <div className="space-y-2">
              {current.hypotheses.map((item) => {
                const active = hypothesis === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setHypothesis(item.id)}
                    className={`w-full rounded-2xl border p-3.5 text-left transition-colors duration-200 ${
                      active
                        ? 'border-[#7f9df0] bg-[#eef4ff]'
                        : 'border-[#dbe6f7] bg-white hover:bg-[#f6faff]'
                    }`}
                  >
                    <p className="text-[12.5px] leading-snug font-extrabold text-[#2c4478]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-snug font-medium text-[#8aa0c4]">{item.text}</p>
                  </button>
                )
              })}
            </div>

            {hypothesis && (
              <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
                <p className="text-[12.5px] leading-relaxed font-medium text-[#3d568e]">
                  {current.hypotheses.find((item) => item.id === hypothesis)?.detail}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton label="Continuar" onClick={scoreHypothesis} disabled={!hypothesis} />
              <button
                type="button"
                onClick={() => {
                  setPhase('clasificar')
                  flow.go('challenge')
                }}
                className="rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
              >
                Volver a las evidencias
              </button>
            </div>
          </div>
        )}

        {phase === 'acciones' && (
          <div className="space-y-4">
            <div>
              <p className="text-[13px] font-extrabold text-[#1d2f57]">Reto 3 · Prioriza las acciones</p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-[#8aa0c4]">
                Elige las tres acciones que conviene hacer ahora ({actions.length} de 3).
              </p>
            </div>

            <div className="space-y-2">
              {current.actions.map((item) => {
                const active = actions.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setActions((current2) =>
                        current2.includes(item.id)
                          ? current2.filter((id) => id !== item.id)
                          : [...current2, item.id],
                      )
                    }
                    className={`w-full rounded-2xl border p-3.5 text-left transition-colors duration-200 ${
                      active
                        ? 'border-[#7f9df0] bg-[#eef4ff]'
                        : 'border-[#dbe6f7] bg-white hover:bg-[#f6faff]'
                    }`}
                  >
                    <p className="text-[12.5px] leading-snug font-semibold text-[#2c4478]">{item.label}</p>
                  </button>
                )
              })}
            </div>

            {actions.length > 0 && (
              <ul className="space-y-2">
                {actions.map((id) => {
                  const item = current.actions.find((entry) => entry.id === id)
                  if (!item) return null
                  return (
                    <li
                      key={id}
                      className="rounded-xl border border-[#dbe6f7] bg-white/80 px-3.5 py-2.5 text-[11.5px] leading-snug text-[#3d568e]"
                    >
                      <strong className="font-extrabold text-[#2c4478]">{item.label}.</strong> {item.detail}
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton label="Generar el informe" onClick={scoreActions} disabled={actions.length !== 3} />
              <button
                type="button"
                onClick={() => {
                  setPhase('hipotesis')
                  flow.go('challenge')
                }}
                className="rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
              >
                Volver a las hipótesis
              </button>
            </div>
          </div>
        )}
      </GameShell>
    )
  }

  /* ------------------------- 4. Retroalimentación --------------------- */
  if (flow.step === 'feedback') {
    const correct = current.evidences.filter(
      (item) => classified[item.id] === item.classification,
    ).length
    const chosen = current.hypotheses.find((item) => item.id === hypothesis)
    const goodActions = actions.filter((id) => current.expectedActions.includes(id)).length
    const wrongActions = actions.filter((id) => !current.expectedActions.includes(id)).length

    const content: {
      verdict: 'correct' | 'partial' | 'incorrect'
      explanation: string
      why: string
      lookAt: string
      safeAction: string
    } = {
      verdict: (
        phase === 'clasificar'
          ? correct === current.evidences.length
          : phase === 'hipotesis'
            ? Boolean(chosen && !chosen.demonstrated)
            : goodActions === current.expectedActions.length && wrongActions === 0
      )
        ? 'correct'
        : phase === 'clasificar' && correct > 0
          ? 'partial'
          : 'incorrect',
      explanation:
        phase === 'clasificar'
          ? correct === current.evidences.length
            ? `Has separado correctamente las ${current.evidences.length} evidencias.`
            : `Has clasificado bien ${correct} de ${current.evidences.length}. Lo que más cuesta es distinguir un indicio de un hecho.`
          : phase === 'hipotesis'
            ? 'Ninguna de las tres hipótesis está demostrada con la información disponible. Eso no significa que no haya un fraude: significa que todavía falta comprobarlo.'
            : `Has elegido ${goodActions} de las ${current.expectedActions.length} acciones recomendadas.`,
      why:
        phase === 'clasificar'
          ? current.evidences.map((item) => `${item.title}: ${item.detail}`).join(' ')
          : phase === 'hipotesis'
            ? (chosen?.detail ?? current.hypotheses[0].detail)
            : current.actions
                .filter((item) => current.expectedActions.includes(item.id))
                .map((item) => `${item.label}: ${item.detail}`)
                .join(' '),
      lookAt:
        phase === 'clasificar'
          ? 'Un hecho documentado es lo que puedes señalar en el expediente. Un indicio apunta, pero no demuestra.'
          : phase === 'hipotesis'
            ? 'Falta la confirmación del proveedor de pago y la verificación de si existe una empresa detrás.'
            : 'Las acciones que no elegiste pueden dañar el caso: por eso no se recomiendan.',
      safeAction:
        'Guarda la evidencia, ordena los hechos en el tiempo y reporta lo ocurrido por los canales oficiales.',
    }

    return (
      <GameShell title={current.title} onExit={onExit} step="feedback">
        <FeedbackPanel
          verdict={content.verdict}
          explanation={content.explanation}
          why={content.why}
          lookAt={content.lookAt}
          safeAction={content.safeAction}
          onNext={() => {
            if (phase === 'clasificar') {
              setPhase('hipotesis')
              flow.go('challenge')
              return
            }
            if (phase === 'hipotesis') {
              setPhase('acciones')
              flow.go('challenge')
              return
            }
            finishGame(scorer.finish(), 'laboratorio')
            flow.go('summary')
          }}
          nextLabel={
            phase === 'clasificar'
              ? 'Evaluar las hipótesis'
              : phase === 'hipotesis'
                ? 'Elegir las acciones'
                : 'Generar el informe'
          }
          onBack={() => flow.go('challenge')}
        />
      </GameShell>
    )
  }

  /* ------------------------------ 5. Cierre --------------------------- */
  return (
    <GameShell title="Laboratorio de evidencias" onExit={onExit} step="summary">
      <GameSummary
        title="Investigación completada"
        score={{
          correct: result.correct,
          total: result.total,
          points: result.score,
          partial: result.partial,
          incorrect: result.incorrect,
        }}
        learning={GAME_INTROS.laboratorio.prevention}
        signals={GAME_INTROS.laboratorio.signs}
        recommendation={GAME_INTROS.laboratorio.prevention}
        badges={state.badges}
        onRetry={restart}
        onExit={onExit}
      />
    </GameShell>
  )
}
