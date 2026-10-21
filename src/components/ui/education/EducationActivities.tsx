import { useMemo, useState } from 'react'
import type {
  Activity,
  ClassifyActivity,
  DecideActivity,
  MessagePart,
  MythActivity,
  SignalsActivity,
  SimulatorActivity,
} from '../../../data/education'
import { educationUi } from './educationIcons'

/**
 * Los cinco tipos de actividad del Centro Educativo.
 *
 * Todas devuelven el mismo contrato: `onDone(correct, points)`. El error no
 * penaliza: la retroalimentación explica el porqué y deja continuar.
 */

type Props = {
  activity: Activity
  onDone: (correct: boolean, points: number) => void
}

/* ------------------------------------------------------------------ */
/* Piezas compartidas                                                  */
/* ------------------------------------------------------------------ */

/** Aviso verde/ámbar/rojo con el resultado de la respuesta. */
function Verdict({ correct, title }: { correct: boolean; title: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border-l-4 px-3.5 py-2.5 ${
        correct
          ? 'border-[#2fb87c] bg-[#eefbf3] text-[#1d7a53]'
          : 'border-[#e9a13b] bg-[#fff8e8] text-[#b06f13]'
      }`}
    >
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/70">
        {correct ? educationUi.check : educationUi.bulb}
      </span>
      <span className="text-[12.5px] font-extrabold">{title}</span>
    </div>
  )
}

/** Lista de viñetas informativas. */
function Bullets({ title, items, tone = 'info' }: { title: string; items: string[]; tone?: 'info' | 'good' | 'warn' }) {
  if (items.length === 0) return null
  const dot = tone === 'good' ? 'bg-[#2fb87c]' : tone === 'warn' ? 'bg-[#e9a13b]' : 'bg-[#5b7cf5]'
  return (
    <div>
      <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">{title}</p>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-[12px] leading-snug font-medium text-[#3d568e]">
            <span className={`mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 1. Detecta el fraude                                                 */
/* ------------------------------------------------------------------ */

function ClassifyView({ activity, onDone }: { activity: ClassifyActivity; onDone: Props['onDone'] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const option = activity.options.find((item) => item.id === selected)
  const correct = option?.correct ?? false

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {activity.options.map((item) => {
          const active = item.id === selected
          return (
            <button
              key={item.id}
              type="button"
              disabled={sent}
              onClick={() => setSelected(item.id)}
              className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors duration-200 ${
                sent
                  ? item.correct
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
              <span className="text-[12.5px] leading-snug font-semibold text-[#2c4478]">{item.label}</span>
            </button>
          )
        })}
      </div>

      {!sent ? (
        <button
          type="button"
          disabled={!selected}
          onClick={() => {
            setSent(true)
            onDone(correct, correct ? activity.points : Math.round(activity.points * 0.4))
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_12px_26px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Comprobar mi respuesta
        </button>
      ) : (
        <div className="space-y-4">
          <Verdict
            correct={correct}
            title={
              correct
                ? '¡Correcto! Esta es la lectura esperada'
                : 'No es la respuesta esperada: mira por qué'
            }
          />

          <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
            <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
              Por qué las otras opciones no son las mejores
            </p>
            <ul className="mt-2 space-y-2">
              {activity.options.map((item) => (
                <li key={item.id} className="flex gap-2">
                  <span
                    className={`mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-black ${
                      item.correct ? 'bg-[#d9f5e6] text-[#1d7a53]' : 'bg-[#eef1f8] text-[#8aa0c4]'
                    }`}
                  >
                    {item.correct ? '✓' : '·'}
                  </span>
                  <span className="text-[11.5px] leading-snug text-[#3d568e]">
                    <strong className="font-extrabold text-[#2c4478]">{item.label}</strong>{' '}
                    {item.explanation}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Bullets title="Señales de alerta" items={activity.signals} tone="warn" />
            <Bullets title="Podrían ser legítimos" items={activity.legit} tone="good" />
          </div>

          <Bullets title="Información que falta para confirmar" items={activity.missing} />

          <div className="rounded-2xl border border-[#bfe3d1] bg-[#eefbf3] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.14em] text-[#1d7a53] uppercase">
              {educationUi.shield}
              Acción segura
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed font-medium text-[#245c44]">{activity.action}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2. ¿Qué harías en esta situación?                                    */
/* ------------------------------------------------------------------ */

function DecideView({ activity, onDone }: { activity: DecideActivity; onDone: Props['onDone'] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const option = activity.options.find((item) => item.id === selected)
  const correct = option?.correct ?? false

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {activity.options.map((item) => {
          const active = item.id === selected
          return (
            <button
              key={item.id}
              type="button"
              disabled={Boolean(selected)}
              onClick={() => {
                setSelected(item.id)
                onDone(item.correct, item.correct ? activity.points : Math.round(activity.points * 0.4))
              }}
              className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors duration-200 ${
                selected && !active
                  ? 'border-[#dbe6f7] bg-white/55 opacity-70'
                  : active
                    ? item.correct
                      ? 'border-[#2fb87c] bg-[#eefbf3]'
                      : 'border-[#e9a13b] bg-[#fff8e8]'
                    : 'border-[#dbe6f7] bg-white hover:bg-[#f6faff]'
              }`}
            >
              <span
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                  active ? (item.correct ? 'border-[#2fb87c] bg-[#2fb87c]' : 'border-[#e9a13b] bg-[#e9a13b]') : 'border-[#c9dbf6]'
                }`}
              >
                {active ? <span className="text-white">{item.correct ? '✓' : '!'}</span> : null}
              </span>
              <span className="text-[12.5px] leading-snug font-semibold text-[#2c4478]">{item.label}</span>
            </button>
          )
        })}
      </div>

      {option && (
        <div className="space-y-3">
          <Verdict
            correct={correct}
            title={correct ? '¡Decisión segura!' : 'Cuidado: esa decisión tiene consecuencias'}
          />
          <div
            className={`rounded-2xl border p-4 ${
              correct ? 'border-[#bfe3d1] bg-[#eefbf3]' : 'border-[#f4d9a8] bg-[#fff8e8]'
            }`}
          >
            <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
              Qué pasaría
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed font-medium text-[#3d568e]">{option.outcome}</p>
            <p className="mt-2.5 text-[12px] leading-relaxed font-semibold text-[#2c4478]">{option.explanation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3. Encuentra las señales de alerta                                  */
/* ------------------------------------------------------------------ */

/** Mensaje con fragmentos seleccionables. */
function SelectableMessage({
  parts,
  selected,
  revealed,
  onToggle,
}: {
  parts: MessagePart[]
  selected: string[]
  revealed: boolean
  onToggle: (id: string) => void
}) {
  return (
    <p className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4 text-[13px] leading-relaxed text-[#2c4478]">
      {parts.map((part) => {
        const isSelected = selected.includes(part.id)
        const isSignal = Boolean(part.signal)
        const showSignal = revealed && isSignal
        return (
          <button
            key={part.id}
            type="button"
            onClick={() => !revealed && onToggle(part.id)}
            className={`mr-1 inline rounded-lg px-1 py-0.5 text-left transition-colors duration-200 ${
              showSignal
                ? 'bg-[#ffe0e6] text-[#c2274a] ring-1 ring-[#f4a9bb]'
                : isSelected
                  ? 'bg-[#dce9ff] text-[#1d3f77] ring-1 ring-[#9dbdf0]'
                  : 'hover:bg-[#eef4ff]'
            } ${revealed ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {part.text}
          </button>
        )
      })}
    </p>
  )
}

function SignalsView({ activity, onDone }: { activity: SignalsActivity; onDone: Props['onDone'] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const found = activity.parts.filter((part) => part.signal && selected.includes(part.id)).length
  const total = activity.parts.filter((part) => part.signal).length
  const correct = found === total

  return (
    <div className="space-y-4">
      <p className="text-[11.5px] font-semibold text-[#8aa0c4]">
        Toca los fragmentos que te parecen señales de alerta ({selected.length} marcados).
      </p>

      <SelectableMessage parts={activity.parts} selected={selected} revealed={revealed} onToggle={toggle} />

      {!revealed ? (
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => {
            setRevealed(true)
            onDone(correct, correct ? activity.points : Math.round(activity.points * (0.4 + (found / total) * 0.4)))
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_12px_26px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Comprobar
        </button>
      ) : (
        <div className="space-y-4">
          <Verdict
            correct={correct}
            title={
              correct
                ? `¡Correcto! Encontraste las ${total} señales`
                : `Encontraste ${found} de ${total} señales`
            }
          />

          <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
            <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
              Qué significa cada señal
            </p>
            <ul className="mt-2 space-y-2.5">
              {activity.parts
                .filter((part) => part.signal)
                .map((part) => (
                  <li key={part.id} className="flex gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#e23b5f]" />
                    <span className="text-[11.5px] leading-snug text-[#3d568e]">
                      <strong className="font-extrabold text-[#2c4478]">{part.signal?.label}.</strong>{' '}
                      {part.signal?.detail}
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#f4d9a8] bg-[#fff8e8] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.14em] text-[#b06f13] uppercase">
              {educationUi.bulb}
              Ten en cuenta
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed font-medium text-[#6a4a12]">{activity.note}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4. Mitos y realidades                                               */
/* ------------------------------------------------------------------ */

function MythView({ activity, onDone }: { activity: MythActivity; onDone: Props['onDone'] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const option = activity.options.find((item) => item.id === selected)
  const correct = option?.correct ?? false

  return (
    <div className="space-y-4">
      <blockquote className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4 text-[13.5px] leading-relaxed font-semibold text-[#2c4478]">
        {activity.claim}
      </blockquote>

      <div className="grid gap-2 sm:grid-cols-2">
        {activity.options.map((item) => {
          const active = item.id === selected
          return (
            <button
              key={item.id}
              type="button"
              disabled={Boolean(selected)}
              onClick={() => {
                setSelected(item.id)
                onDone(item.correct, item.correct ? activity.points : Math.round(activity.points * 0.4))
              }}
              className={`rounded-2xl border p-3.5 text-center text-[13px] font-extrabold transition-colors duration-200 ${
                selected && !active
                  ? 'border-[#dbe6f7] bg-white/55 opacity-70'
                  : active
                    ? item.correct
                      ? 'border-[#2fb87c] bg-[#eefbf3] text-[#1d7a53]'
                      : 'border-[#e9a13b] bg-[#fff8e8] text-[#b06f13]'
                    : 'border-[#dbe6f7] bg-white text-[#4a628f] hover:bg-[#f6faff]'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {option && (
        <div className="space-y-3">
          <Verdict correct={correct} title={correct ? '¡Exacto!' : 'No es del todo correcto'} />
          <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
            <p className="text-[12.5px] leading-relaxed font-medium text-[#3d568e]">{option.explanation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 5. Simulador de mensajes                                            */
/* ------------------------------------------------------------------ */

function SimulatorView({ activity, onDone }: { activity: SimulatorActivity; onDone: Props['onDone'] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const allParts = useMemo(
    () => activity.bubbles.flatMap((bubble) => bubble.parts),
    [activity.bubbles],
  )
  const total = allParts.filter((part) => part.signal).length
  const found = allParts.filter((part) => part.signal && selected.includes(part.id)).length
  const correct = found === total

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl bg-[#fff4e2] px-3 py-2 text-[10.5px] font-extrabold tracking-[0.1em] text-[#b06f13] uppercase">
        {educationUi.bulb}
        Simulación educativa
      </div>

      <div className="space-y-3 rounded-2xl border border-[#dbe6f7] bg-[#eef2fa] p-4">
        {activity.bubbles.map((bubble, index) => (
          <div
            key={index}
            className={`flex ${bubble.from === 'yo' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed shadow-[0_8px_20px_-16px_rgba(30,55,130,.9)] ${
                bubble.from === 'yo' ? 'rounded-br-md bg-[#5b7cf5] text-white' : 'rounded-bl-md bg-white text-[#2c4478]'
              }`}
            >
              {bubble.parts.map((part) => {
                const isSelected = selected.includes(part.id)
                const showSignal = revealed && Boolean(part.signal)
                return (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => !revealed && toggle(part.id)}
                    className={`mr-1 inline rounded-lg px-1 py-0.5 text-left transition-colors duration-200 ${
                      showSignal
                        ? 'bg-[#ffe0e6] text-[#c2274a] ring-1 ring-[#f4a9bb]'
                        : isSelected
                          ? 'bg-[#dce9ff] text-[#1d3f77] ring-1 ring-[#9dbdf0]'
                          : 'hover:bg-[#eef4ff]'
                    } ${revealed ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {part.text}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!revealed ? (
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => {
            setRevealed(true)
            onDone(
              correct,
              correct ? activity.points : Math.round(activity.points * (0.4 + (found / Math.max(total, 1)) * 0.4)),
            )
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_12px_26px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          Comprobar
        </button>
      ) : (
        <div className="space-y-4">
          <Verdict
            correct={correct}
            title={
              correct
                ? `¡Correcto! Identificaste las ${total} señales`
                : `Identificaste ${found} de ${total} señales`
            }
          />

          <div className="rounded-2xl border border-[#dbe6f7] bg-white/85 p-4">
            <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
              Señales de la conversación
            </p>
            <ul className="mt-2 space-y-2.5">
              {allParts
                .filter((part) => part.signal)
                .map((part) => (
                  <li key={part.id} className="flex gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#e23b5f]" />
                    <span className="text-[11.5px] leading-snug text-[#3d568e]">
                      <strong className="font-extrabold text-[#2c4478]">{part.signal?.label}.</strong>{' '}
                      {part.signal?.detail}
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#f4d9a8] bg-[#fff8e8] p-4">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.14em] text-[#b06f13] uppercase">
              {educationUi.bulb}
              Ten en cuenta
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed font-medium text-[#6a4a12]">{activity.note}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Selector                                                            */
/* ------------------------------------------------------------------ */

export function ActivityView({ activity, onDone }: Props) {
  switch (activity.kind) {
    case 'clasificar':
      return <ClassifyView activity={activity} onDone={onDone} />
    case 'decidir':
      return <DecideView activity={activity} onDone={onDone} />
    case 'senales':
      return <SignalsView activity={activity} onDone={onDone} />
    case 'mitos':
      return <MythView activity={activity} onDone={onDone} />
    case 'simulador':
      return <SimulatorView activity={activity} onDone={onDone} />
    default:
      return null
  }
}
