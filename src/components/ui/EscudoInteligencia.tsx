import { EscudoInteligenciaScene } from '../three/scenes/StatsScenes'

/** Bloque principal bajo la escena: "Escudo Inteligencia". */
export function EscudoInteligencia() {
  return (
    <section className="card-purple glass-card grid grid-cols-1 items-center gap-8 overflow-hidden rounded-[28px] p-6 shadow-panel sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="relative h-[220px] w-full sm:h-[250px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 h-[190px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-45 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(95,228,255,.55) 0%, transparent 70%)' }}
        />
        <EscudoInteligenciaScene />
      </div>

      <div className="max-w-[460px]">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold tracking-wide text-plum-700 uppercase ring-1 ring-white">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
          Monitoreo en tiempo real
        </span>

        <h2 className="mt-3 text-[15px] font-extrabold tracking-tight text-ink">Escudo Inteligencia</h2>
        <p className="mt-1 text-[22px] leading-tight font-extrabold text-ink">
          Verifica antes de confiar
        </p>
        <p className="mt-3 text-[12.5px] leading-[1.6] font-medium text-plum-700/80">
          Analiza mensajes sospechosos, valida comprobantes de pago y contrasta cada comercio de la red
          contra el historial de la comunidad. Las alertas de fraude se bloquean en tiempo real, antes de
          que lleguen a tu bolsillo.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {['1.2M transacciones', '98.7% bloqueadas', 'Red 95% fiable'].map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-white/75 px-3 py-1.5 text-[11px] font-semibold text-plum-700 ring-1 ring-white"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
