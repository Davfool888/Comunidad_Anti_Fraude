import { useState } from 'react'
import { PLAN_MEASURES } from '../../../../data/learning/games/plan'
import { GAME_INTROS } from '../../../../data/learning/games/introductions'
import { useLearning } from '../learningContext'
import { GameIntroduction, GameSummary, ProgressIndicator } from '../GameFlow'
import { useGameFlow } from '../useGameFlow'
import { GameShell, PrimaryButton } from '../GameShell'

/**
 * Juego 8 · **Arma tu plan de protección**.
 *
 * Las medidas son elementos seleccionables: el usuario construye su lista
 * personal, revisa la explicación de cada una y genera un resumen
 * descargable. No se guarda ningún dato sensible.
 */
export function PlanGame({ onExit }: { onExit: () => void }) {
  const flow = useGameFlow()
  const { state, savePlan } = useLearning()
  const [selected, setSelected] = useState<string[]>(state.plan)
  const [saved, setSaved] = useState(false)

  const groups = [...new Set(PLAN_MEASURES.map((measure) => measure.group))]
  const plan = PLAN_MEASURES.filter((measure) => selected.includes(measure.id))
  const essentials = plan.filter((measure) => measure.essential).length

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )

  /** Genera el resumen en texto plano para descargar. */
  const download = () => {
    const lines = [
      'MI PLAN DE PROTECCIÓN',
      'Centro de aprendizaje · Escudo Comunitario',
      '',
      ...plan.map(
        (measure) =>
          `- ${measure.label}${measure.essential ? ' (prioritaria)' : ''}\n  ${measure.detail}`,
      ),
      '',
      `Medidas incluidas: ${plan.length} de ${PLAN_MEASURES.length}.`,
      'Este plan es una guía de prevención: no sustituye el criterio propio ni las acciones',
      'oficiales de cada entidad.',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mi-plan-de-proteccion.txt'
    link.click()
    URL.revokeObjectURL(url)
    setSaved(true)
  }

  const save = () => {
    savePlan(selected)
    setSaved(true)
  }

  /* ------------------------- 1. Introducción ------------------------- */
  if (flow.step === 'intro') {
    return (
      <GameShell title="Arma tu plan de protección" onExit={onExit} step="intro">
        <GameIntroduction
          intro={GAME_INTROS.plan}
          onStart={() => flow.go('challenge')}
          onExit={onExit}
        />
      </GameShell>
    )
  }

  /* --------------------------- 2. Construcción ----------------------- */
  if (flow.step === 'challenge') {
    return (
      <GameShell
        title="Arma tu plan de protección"
        subtitle="Elige las medidas que vas a aplicar de verdad"
        onExit={onExit}
        step="challenge"
        indicator={
          <ProgressIndicator
            step="challenge"
            labels={[
              { id: 'intro', label: 'Introducción' },
              { id: 'challenge', label: 'Mi plan' },
              { id: 'summary', label: 'Resumen' },
            ]}
          />
        }
        footer={
          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton label="Guardar mi plan" onClick={save} />
            <button
              type="button"
              onClick={download}
              disabled={plan.length === 0}
              className="rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Descargar el resumen
            </button>
            {saved && (
              <span className="text-[11.5px] font-bold text-[#1d7a53]">
                {plan.length} medidas guardadas en este navegador.
              </span>
            )}
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#c9dbf6] bg-[#eef4ff] p-4">
            <p className="text-[12.5px] leading-relaxed font-medium text-[#2c4478]">
              Estas son las medidas que la red recomienda para la mayoría de las personas. No hace falta
              tenerlas todas: elige las que vas a aplicar de verdad.{' '}
              <strong className="font-extrabold">
                {essentials} de tus {plan.length} medidas son prioritarias.
              </strong>
            </p>
          </div>

          {groups.map((group) => (
            <div key={group}>
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
                {group}
              </p>
              <div className="mt-2 space-y-2">
                {PLAN_MEASURES.filter((measure) => measure.group === group).map((measure) => {
                  const active = selected.includes(measure.id)
                  return (
                    <div
                      key={measure.id}
                      className={`rounded-2xl border p-3.5 transition-colors duration-200 ${
                        active ? 'border-[#7f9df0] bg-[#eef4ff]' : 'border-[#dbe6f7] bg-white/85'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(measure.id)}
                        className="flex w-full items-start gap-3 text-left"
                      >
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[10px] font-black ${
                            active ? 'border-[#5b7cf5] bg-[#5b7cf5] text-white' : 'border-[#c9dbf6]'
                          }`}
                        >
                          {active ? '✓' : ''}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[12.5px] leading-snug font-bold text-[#2c4478]">
                              {measure.label}
                            </span>
                            {measure.essential && (
                              <span className="rounded-full bg-[#eefbf3] px-1.5 py-0.5 text-[9px] font-extrabold text-[#1d7a53]">
                                prioritaria
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-[11.5px] leading-relaxed font-medium text-[#8aa0c4]">
                            {measure.detail}
                          </span>
                        </span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <p className="text-center text-[10.5px] leading-relaxed font-medium text-[#8aa0c4]">
            El plan se guarda solo en este navegador y no incluye datos personales ni credenciales.
          </p>
        </div>
      </GameShell>
    )
  }

  /* ------------------------------ 2. Cierre --------------------------- */
  return (
    <GameShell title="Arma tu plan de protección" onExit={onExit} step="summary">
      <GameSummary
        title="Tu plan está listo"
        score={{
          correct: plan.length,
          total: PLAN_MEASURES.length,
          points: essentials,
        }}
        learning={GAME_INTROS.plan.prevention}
        signals={GAME_INTROS.plan.signs}
        recommendation={GAME_INTROS.plan.prevention}
        onRetry={() => {
          setSelected([])
          setSaved(false)
          flow.go('challenge')
        }}
        onExit={onExit}
        nextLabel="Volver a construir el plan"
        onNext={() => {
          setSelected([])
          setSaved(false)
          flow.go('challenge')
        }}
      />
    </GameShell>
  )
}
