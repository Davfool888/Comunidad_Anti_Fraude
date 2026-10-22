import type { EvidenceClass, ScenarioVisual } from '../../../data/learning/types'

/**
 * Recursos visuales del Centro de aprendizaje.
 *
 * Todo es SVG y CSS: no hay fotografías ni enlaces externos, así que el módulo
 * funciona sin conexión y el texto siempre es real (traducible y
 * seleccionable). Cada simulación lleva la etiqueta «Simulación educativa».
 */

/* ------------------------------------------------------------------ */
/* Etiqueta de simulación                                              */
/* ------------------------------------------------------------------ */

export function SimulatedTag({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-[#fff4e2] px-2.5 py-1 text-[9.5px] font-extrabold tracking-[0.12em] text-[#b06f13] uppercase ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z" />
      </svg>
      Simulación educativa
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Escenas ilustradas                                                  */
/* ------------------------------------------------------------------ */

/**
 * Ilustración de una situación. Es una composición de formas (dispositivo,
 * mensaje, alerta) que representa el tipo de fraude sin depender de
 * fotografías genéricas.
 */
export function FraudScene({
  variant,
  className = '',
  label,
}: {
  /** Tipo de escena. */
  variant: string
  className?: string
  /** Texto alternativo (la escena es decorativa, la explicación va al lado). */
  label?: string
}) {
  const shapes: Record<string, { device: 'phone' | 'laptop' | 'card'; accent: string; badge: string }> = {
    phishing: { device: 'phone', accent: '#5b7cf5', badge: '!' },
    whatsapp: { device: 'phone', accent: '#2fb87c', badge: '!' },
    bank: { device: 'laptop', accent: '#9b6ef0', badge: '!' },
    receipt: { device: 'card', accent: '#e9a13b', badge: '?' },
    card: { device: 'card', accent: '#5b7cf5', badge: '?' },
    shop: { device: 'laptop', accent: '#e0629b', badge: '!' },
    job: { device: 'laptop', accent: '#3d8ee0', badge: '!' },
    investment: { device: 'card', accent: '#f0601f', badge: '!' },
    credentials: { device: 'phone', accent: '#43b98c', badge: '!' },
    link: { device: 'laptop', accent: '#7d55e0', badge: '!' },
    incident: { device: 'phone', accent: '#e23b5f', badge: '!' },
  }
  const shape = shapes[variant] ?? shapes.phishing

  return (
    <svg
      viewBox="0 0 240 170"
      className={className}
      role="img"
      aria-label={label ?? `Ilustración de ${variant}`}
    >
      <defs>
        <linearGradient id={`esc-${variant}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={shape.accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={shape.accent} stopOpacity="0.04" />
        </linearGradient>
      </defs>

      <rect x="8" y="10" width="224" height="150" rx="28" fill={`url(#esc-${variant}-bg)`} />

      {/* dispositivo */}
      {shape.device === 'phone' && (
        <g>
          <rect x="92" y="24" width="56" height="104" rx="12" fill="#ffffff" stroke={shape.accent} strokeWidth="2.5" />
          <rect x="99" y="34" width="42" height="20" rx="5" fill={shape.accent} opacity="0.35" />
          <rect x="99" y="60" width="42" height="8" rx="4" fill="#c7d3ea" />
          <rect x="99" y="74" width="30" height="8" rx="4" fill="#c7d3ea" />
          <circle cx="120" cy="116" r="4" fill="#c7d3ea" />
        </g>
      )}
      {shape.device === 'laptop' && (
        <g>
          <rect x="66" y="34" width="108" height="70" rx="8" fill="#ffffff" stroke={shape.accent} strokeWidth="2.5" />
          <rect x="76" y="44" width="88" height="14" rx="4" fill={shape.accent} opacity="0.35" />
          <rect x="76" y="64" width="60" height="7" rx="3.5" fill="#c7d3ea" />
          <rect x="76" y="78" width="72" height="7" rx="3.5" fill="#c7d3ea" />
          <path d="M58 110h124l-8 10H66l-8-10Z" fill={shape.accent} opacity="0.55" />
        </g>
      )}
      {shape.device === 'card' && (
        <g>
          <rect x="70" y="34" width="100" height="76" rx="10" fill="#ffffff" stroke={shape.accent} strokeWidth="2.5" />
          <rect x="82" y="48" width="56" height="9" rx="4.5" fill={shape.accent} opacity="0.35" />
          <rect x="82" y="66" width="40" height="7" rx="3.5" fill="#c7d3ea" />
          <rect x="82" y="80" width="64" height="7" rx="3.5" fill="#c7d3ea" />
          <rect x="82" y="94" width="30" height="7" rx="3.5" fill="#c7d3ea" />
        </g>
      )}

      {/* alerta */}
      <g>
        <circle cx="176" cy="42" r="19" fill="#e23b5f" />
        <text
          x="176"
          y="50"
          textAnchor="middle"
          fontSize="24"
          fontWeight="800"
          fill="#ffffff"
          fontFamily="inherit"
        >
          {shape.badge}
        </text>
      </g>

      {/* figura que mira la pantalla */}
      <g>
        <circle cx="52" cy="118" r="13" fill={shape.accent} opacity="0.65" />
        <path d="M32 152a20 20 0 0 1 40 0Z" fill={shape.accent} opacity="0.45" />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Simulaciones de interfaz                                            */
/* ------------------------------------------------------------------ */

/** Marco de teléfono: barra de estado, cabecera y pantalla. */
function PhoneFrame({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[28px] border border-[#c9dbf6] bg-white p-3 shadow-[0_18px_40px_-24px_rgba(30,55,130,.75)]">
      <div className="rounded-[20px] bg-[#f2f6fd] p-3">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-5 w-8 rounded-full bg-[#d5e0f2]" />
          <span className="text-[9px] font-bold text-[#8aa0c4]">9:41</span>
        </div>
        <div className="mb-2">
          <p className="text-[12px] font-extrabold text-[#243d6b]">{title}</p>
          {subtitle && <p className="text-[10px] font-semibold text-[#8aa0c4]">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

/** Simulación de un SMS sospechoso. */
function SimulatedSms({ from, time, body }: { from: string; time: string; body: string }) {
  return (
    <PhoneFrame title="Mensajes" subtitle={from}>
      <div className="rounded-2xl rounded-tl-sm bg-white p-3 shadow-sm">
        <p className="text-[9.5px] font-bold text-[#8aa0c4]">{from} · {time}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#2c4478]">{body}</p>
      </div>
    </PhoneFrame>
  )
}

/** Simulación de una conversación de mensajería. */
function SimulatedChat({
  messages,
}: {
  messages: { from: 'contacto' | 'yo'; text: string; time?: string }[]
}) {
  return (
    <PhoneFrame title="Conversación">
      <div className="space-y-2">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.from === 'yo' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
                message.from === 'yo'
                  ? 'rounded-br-sm bg-[#5b7cf5] text-white'
                  : 'rounded-bl-sm bg-white text-[#2c4478] shadow-sm'
              }`}
            >
              {message.text}
              {message.time && (
                <span
                  className={`mt-1 block text-[8.5px] font-semibold ${
                    message.from === 'yo' ? 'text-white/70' : 'text-[#a3b5d4]'
                  }`}
                >
                  {message.time}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </PhoneFrame>
  )
}

/** Simulación de un correo electrónico. */
function SimulatedEmail({ from, subject, body }: { from: string; subject: string; body: string }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#c9dbf6] bg-white shadow-[0_18px_40px_-24px_rgba(30,55,130,.7)]">
      <div className="flex items-center gap-2 border-b border-[#e4ecf9] bg-[#f2f6fd] px-4 py-2.5">
        <span className="h-7 w-7 rounded-lg bg-[#d5e0f2]" />
        <div className="min-w-0">
          <p className="truncate text-[11.5px] font-extrabold text-[#243d6b]">{from}</p>
          <p className="text-[9.5px] font-semibold text-[#8aa0c4]">para mi</p>
        </div>
      </div>
      <div className="border-b border-[#eef3fb] px-4 py-2.5">
        <p className="text-[12.5px] font-extrabold text-[#243d6b]">{subject}</p>
      </div>
      <div className="px-4 py-4">
        <p className="text-[12.5px] leading-relaxed whitespace-pre-line text-[#3d568e]">{body}</p>
      </div>
    </div>
  )
}

/** Simulación de una publicación comercial. */
function SimulatedAd({ title, bullets, footer }: { title: string; bullets: string[]; footer?: string }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#c9dbf6] bg-white shadow-[0_18px_40px_-24px_rgba(30,55,130,.7)]">
      <div className="h-24 bg-gradient-to-r from-[#ffd8e8] via-[#e2e9ff] to-[#d6f6ef]" />
      <div className="px-4 py-3.5">
        <p className="text-[13.5px] font-extrabold text-[#243d6b]">{title}</p>
        <ul className="mt-2 space-y-1.5">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2 text-[11.5px] leading-snug text-[#3d568e]">
              <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#9dbdf0]" />
              {bullet}
            </li>
          ))}
        </ul>
        {footer && (
          <p className="mt-3 border-t border-[#eef3fb] pt-2.5 text-[10.5px] font-bold text-[#8aa0c4]">{footer}</p>
        )}
      </div>
    </div>
  )
}

/** Simulación de un comprobante de pago educativo. */
function SimulatedReceipt({
  fields,
  status,
}: {
  fields: { label: string; value: string }[]
  status: string
}) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#c9dbf6] bg-white p-4 shadow-[0_18px_40px_-24px_rgba(30,55,130,.7)]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[12.5px] font-extrabold text-[#243d6b]">Comprobante</p>
        <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9.5px] font-extrabold text-[#4a628f]">
          {status}
        </span>
      </div>
      <dl className="space-y-1.5">
        {fields.map((field) => (
          <div key={field.label} className="flex items-baseline justify-between gap-3 border-b border-dashed border-[#e4ecf9] pb-1.5">
            <dt className="text-[10.5px] font-semibold text-[#8aa0c4]">{field.label}</dt>
            <dd className="text-[11.5px] font-extrabold text-[#2c4478]">{field.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Simulación de un formulario sospechoso. */
function SimulatedForm({ title, fields, warning }: { title: string; fields: string[]; warning: string }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#f0c2ce] bg-white p-4 shadow-[0_18px_40px_-24px_rgba(30,55,130,.7)]">
      <p className="text-[13px] font-extrabold text-[#243d6b]">{title}</p>
      <div className="mt-3 space-y-2">
        {fields.map((field) => (
          <div key={field}>
            <p className="text-[10px] font-bold text-[#8aa0c4]">{field}</p>
            <div className="mt-1 h-8 rounded-lg border border-[#e4ecf9] bg-[#f7faff]" />
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-xl bg-[#fff1f4] px-3 py-2 text-[10.5px] leading-relaxed font-semibold text-[#c2274a]">
        {warning}
      </p>
    </div>
  )
}

/** Simulación del panel de seguridad de una cuenta. */
function SimulatedSecurityPanel({
  alerts,
  sessions,
}: {
  alerts: { label: string; detail: string }[]
  sessions: { device: string; place: string; current?: boolean }[]
}) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#c9dbf6] bg-white shadow-[0_18px_40px_-24px_rgba(30,55,130,.7)]">
      <div className="flex items-center gap-2 border-b border-[#e4ecf9] bg-[#f2f6fd] px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#5b7cf5] text-white">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M12 2 3.5 5.4v6.1c0 4.6 3.7 9 8.5 10.5 4.8-1.5 8.5-5.9 8.5-10.5V5.4L12 2Z" />
          </svg>
        </span>
        <div>
          <p className="text-[12px] font-extrabold text-[#243d6b]">Seguridad de la cuenta</p>
          <p className="text-[9.5px] font-semibold text-[#8aa0c4]">Panel de actividad</p>
        </div>
      </div>

      <div className="space-y-2 px-4 py-3">
        {alerts.map((alert) => (
          <div key={alert.label} className="rounded-xl bg-[#fff8e8] px-3 py-2">
            <p className="text-[11px] font-extrabold text-[#b06f13]">{alert.label}</p>
            <p className="mt-0.5 text-[10.5px] leading-snug text-[#8a6a2c]">{alert.detail}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-[#eef3fb] px-4 py-3">
        <p className="text-[10px] font-extrabold tracking-[0.1em] text-[#8aa0c4] uppercase">
          Sesiones activas
        </p>
        <ul className="mt-2 space-y-1.5">
          {sessions.map((session) => (
            <li
              key={session.device}
              className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${
                session.current ? 'bg-[#eefbf3]' : 'bg-[#fff1f4]'
              }`}
            >
              <span className="text-[11px] font-bold text-[#2c4478]">{session.device}</span>
              <span className="text-[10px] font-semibold text-[#8aa0c4]">{session.place}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Vista de un entorno con datos sueltos (anuncio, caso, formulario). */
function SimulatedEnvironment({ items, note }: { items: { label: string; value: string }[]; note: string }) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[#c9dbf6] bg-white p-4 shadow-[0_18px_40px_-24px_rgba(30,55,130,.7)]">
      <dl className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl bg-[#f7faff] px-3 py-2">
            <dt className="text-[10px] font-bold text-[#8aa0c4]">{item.label}</dt>
            <dd className="mt-0.5 text-[11.5px] font-extrabold text-[#2c4478]">{item.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 rounded-xl bg-[#eef4ff] px-3 py-2 text-[10.5px] leading-relaxed font-semibold text-[#2f4b86]">
        {note}
      </p>
    </div>
  )
}

/** Renderiza la representación visual de una situación. */
export function ScenarioVisualView({ visual }: { visual: ScenarioVisual }) {
  switch (visual.kind) {
    case 'sms':
      return <SimulatedSms {...visual} />
    case 'chat':
      return <SimulatedChat {...visual} />
    case 'email':
      return <SimulatedEmail {...visual} />
    case 'anuncio':
      return <SimulatedAd {...visual} />
    case 'comprobante':
      return <SimulatedReceipt {...visual} />
    case 'formulario':
      return <SimulatedForm {...visual} />
    case 'panel':
      return <SimulatedSecurityPanel {...visual} />
    case 'entorno':
      return <SimulatedEnvironment {...visual} />
    default:
      return null
  }
}

/* ------------------------------------------------------------------ */
/* Tarjeta de evidencia                                                */
/* ------------------------------------------------------------------ */

const EVIDENCE_STYLE: Record<EvidenceClass, { chip: string; ring: string }> = {
  hecho: { chip: 'bg-[#eef4ff] text-[#2f4b86] ring-[#c9dbf6]', ring: 'border-[#c9dbf6]' },
  indicio: { chip: 'bg-[#fff8e8] text-[#b06f13] ring-[#f4d9a8]', ring: 'border-[#f4d9a8]' },
  falta: { chip: 'bg-[#fff1f4] text-[#c2274a] ring-[#f4a9bb]', ring: 'border-[#f4a9bb]' },
}

/** Etiqueta de la clasificación de una evidencia. */
export function EvidenceChip({ kind }: { kind: EvidenceClass }) {
  const labels: Record<EvidenceClass, string> = {
    hecho: 'Hecho documentado',
    indicio: 'Indicio',
    falta: 'Información que falta',
  }
  const style = EVIDENCE_STYLE[kind]
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[9.5px] font-extrabold ring-1 ${style.chip}`}
    >
      {labels[kind]}
    </span>
  )
}
