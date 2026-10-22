import { useEffect, useState } from 'react'
import { api, type Modality } from '../../../lib/api'

/**
 * «Modalidades vigentes»: retos rápidos que se actualizan con lo que está
 * reportando la comunidad. Las fichas nuevas las crea el panel de la red a
 * partir de las alertas (con IA cuando está activa).
 */

const ORIGIN_LABEL: Record<Modality['origin'], { text: string; className: string }> = {
  curada: { text: 'Modalidad vigente', className: 'bg-[#eef4ff] text-[#3d568e]' },
  'comunidad-ia': { text: 'Nueva · creada con IA desde reportes', className: 'bg-[#f1e9ff] text-[#6a3fd0]' },
  comunidad: { text: 'Nueva · reportada por la comunidad', className: 'bg-[#e4f7ee] text-[#1d7a53]' },
}

function ModalityCard({ modality }: { modality: Modality }) {
  const [open, setOpen] = useState(false)
  const [answer, setAnswer] = useState<number | null>(null)
  const origin = ORIGIN_LABEL[modality.origin]
  const chosen = answer === null ? null : modality.challenge.options[answer]

  return (
    <article className="flex flex-col rounded-[22px] border border-white/70 bg-white/75 p-4 shadow-[0_24px_50px_-30px_rgba(25,45,95,.6)]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-extrabold ${origin.className}`}>{origin.text}</span>
        {modality.recent_reports > 0 && (
          <span className="rounded-full bg-[#ffe0e6] px-2 py-0.5 text-[9.5px] font-extrabold text-[#c2274a]">
            {modality.recent_reports} reporte(s) este mes
          </span>
        )}
      </div>
      <h3 className="mt-2 text-[14px] leading-snug font-extrabold text-[#1d2f57]">{modality.title}</h3>
      <p className="text-[10.5px] font-semibold text-[#8aa0c4]">
        {modality.category_label} · {modality.channel}
      </p>
      <p className="mt-2 text-[11.5px] leading-relaxed font-medium text-[#3d568e]">{modality.summary}</p>

      {open ? (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[9.5px] font-extrabold tracking-[0.12em] text-[#c2274a] uppercase">Señales de alerta</p>
            <ul className="mt-1 space-y-0.5">
              {modality.red_flags.map((flag) => (
                <li key={flag} className="text-[11px] font-medium text-[#3d568e]">
                  · {flag}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[9.5px] font-extrabold tracking-[0.12em] text-[#1d7a53] uppercase">Cómo protegerse</p>
            <ul className="mt-1 space-y-0.5">
              {modality.protect.map((item) => (
                <li key={item} className="text-[11px] font-medium text-[#3d568e]">
                  ✓ {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-[#f4f8ff] p-3">
            <p className="text-[9.5px] font-extrabold tracking-[0.12em] text-[#7a90b8] uppercase">Reto</p>
            <p className="mt-1 text-[12px] font-bold text-[#1d2f57]">{modality.challenge.question}</p>
            <div className="mt-2 grid gap-1.5">
              {modality.challenge.options.map((option, index) => {
                const picked = answer === index
                const reveal = answer !== null
                return (
                  <button
                    key={option.text}
                    type="button"
                    disabled={reveal}
                    onClick={() => setAnswer(index)}
                    className={`rounded-xl px-3 py-2 text-left text-[11.5px] font-semibold ring-1 transition-colors ${
                      reveal && option.correct
                        ? 'bg-[#d9f5e6] text-[#1d7a53] ring-[#a8dfc0]'
                        : picked
                          ? 'bg-[#ffe0e6] text-[#c2274a] ring-[#f4c4cf]'
                          : 'bg-white text-[#3d568e] ring-[#dbe6f7] hover:bg-[#eef4ff]'
                    }`}
                  >
                    {option.text}
                  </button>
                )
              })}
            </div>
            {chosen && (
              <p className={`mt-2 text-[11px] font-semibold ${chosen.correct ? 'text-[#1d7a53]' : 'text-[#c2274a]'}`}>
                {chosen.correct ? '¡Bien! ' : 'Cuidado: '}
                {chosen.feedback} <span className="font-medium text-[#4a628f]">{modality.challenge.explanation}</span>
              </p>
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-auto pt-3 text-left text-[11.5px] font-bold text-[#5b7cf5]"
      >
        {open ? 'Cerrar' : 'Aprender y hacer el reto →'}
      </button>
    </article>
  )
}

export function NewModalities() {
  const [items, setItems] = useState<Modality[] | null>(null)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    api
      .modalities()
      .then(setItems)
      .catch(() => setOffline(true))
  }, [])

  return (
    <section aria-labelledby="centro-modalidades">
      <div className="mb-3">
        <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">Se actualiza con la comunidad</p>
        <h2 id="centro-modalidades" className="mt-1 text-[20px] font-extrabold text-[#1d2f57]">
          Modalidades de fraude vigentes
        </h2>
        <p className="mt-1 text-[12px] font-medium text-[#6b81ad]">
          Retos cortos sobre lo que está pasando ahora en Bogotá. Primero, lo más reportado por la red este mes.
        </p>
      </div>
      {offline && (
        <p className="rounded-2xl border border-dashed border-[#c9dbf6] bg-white/60 p-4 text-[12px] font-medium text-[#6b81ad]">
          Inicie el servidor de la red (npm run dev:api) para ver las modalidades vigentes.
        </p>
      )}
      {!items && !offline && <p className="text-[12px] font-medium text-[#8aa0c4]">Cargando modalidades…</p>}
      {items && (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.slice(0, 9).map((modality) => (
            <ModalityCard key={modality.slug} modality={modality} />
          ))}
        </div>
      )}
    </section>
  )
}
