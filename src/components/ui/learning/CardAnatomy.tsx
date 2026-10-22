import type { CardField, CardFieldSide } from '../../../data/learning/types'
import {
  CARD_FIELDS,
  CARD_SIMULATION_NOTE,
} from '../../../data/learning/games/cardAnatomy'

/**
 * Tarjeta bancaria ficticia con **campos seleccionables**.
 *
 * La tarjeta no usa una imagen decorativa con zonas invisibles: cada dato es
 * un botón real dentro de una composición flexible. Así las regiones siguen
 * alineadas al cambiar el tamaño de pantalla y funcionan con teclado y tacto.
 *
 * No se pide ni se guarda información financiera. Los valores son estáticos y
 * de demostración.
 */

export type CardAnatomyProps = {
  fields?: CardField[]
  selectedIds: string[]
  side: CardFieldSide
  onSideChange: (side: CardFieldSide) => void
  onToggle?: (fieldId: string) => void
  disabled?: boolean
  /** Muestra los aciertos y los errores después de comprobar. */
  revealed?: boolean
  correctIds?: string[]
  className?: string
}

type FieldTone = 'dark' | 'light' | 'stripe'

function FieldStatus({
  selected,
  correct,
  revealed,
}: {
  selected: boolean
  correct: boolean
  revealed: boolean
}) {
  if (revealed) {
    return (
      <span
        className={`absolute top-1 right-1 grid h-4 w-4 place-items-center rounded-full text-[9px] font-black text-white ${
          correct ? 'bg-[#2fb87c]' : selected ? 'bg-[#e23b5f]' : 'bg-transparent'
        }`}
        aria-hidden="true"
      >
        {correct ? '✓' : selected ? '✕' : ''}
      </span>
    )
  }
  if (!selected) return null
  return (
    <span
      className="absolute top-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-[#5fe4ff] text-[9px] font-black text-[#0e1c42]"
      aria-hidden="true"
    >
      ✓
    </span>
  )
}

function CardFieldButton({
  field,
  selected,
  correct,
  revealed,
  disabled,
  tone,
  onToggle,
  className = '',
  children,
}: {
  field: CardField
  selected: boolean
  correct: boolean
  revealed: boolean
  disabled: boolean
  tone: FieldTone
  onToggle?: (fieldId: string) => void
  className?: string
  children: React.ReactNode
}) {
  const stateLabel = revealed
    ? correct
      ? 'Correcto'
      : selected
        ? 'Incorrecto'
        : ''
    : selected
      ? 'Seleccionado'
      : ''

  const toneClass =
    tone === 'stripe'
      ? revealed
        ? correct
          ? 'bg-[#0f5132] text-white ring-2 ring-[#6ee7b7]'
          : selected
            ? 'bg-[#6b1d2f] text-white ring-2 ring-[#fda4af]'
            : 'bg-[#101828] text-white/70 ring-1 ring-transparent'
        : selected
          ? 'bg-[#101828] text-white ring-2 ring-[#5fe4ff]'
          : 'bg-[#101828] text-white ring-1 ring-transparent hover:bg-[#1b2436]'
      : tone === 'dark'
        ? revealed
          ? correct
            ? 'bg-[#0f5132]/75 text-white ring-2 ring-[#6ee7b7]'
            : selected
              ? 'bg-[#6b1d2f]/85 text-white ring-2 ring-[#fda4af]'
              : 'text-white/80 ring-1 ring-transparent'
          : selected
            ? 'bg-white/20 text-white ring-2 ring-[#5fe4ff]'
            : 'text-white ring-1 ring-transparent hover:bg-white/10'
        : revealed
          ? correct
            ? 'bg-[#eefbf3] text-[#1d7a53] ring-2 ring-[#2fb87c]'
            : selected
              ? 'bg-[#fff1f4] text-[#c2274a] ring-2 ring-[#e23b5f]'
              : 'bg-white text-[#2c4478] ring-1 ring-transparent'
          : selected
            ? 'bg-[#eef4ff] text-[#1d3f77] ring-2 ring-[#5b7cf5]'
            : 'bg-white text-[#2c4478] ring-1 ring-transparent hover:bg-[#f7faff]'

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${field.label}: ${field.value}${stateLabel ? `. ${stateLabel}` : ''}`}
      onClick={() => onToggle?.(field.id)}
      className={`relative rounded-lg p-1.5 pr-6 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd166] motion-reduce:transition-none ${toneClass} ${className}`}
    >
      {children}
      <FieldStatus selected={selected} correct={correct} revealed={revealed} />
    </button>
  )
}

function ContactlessIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-white/70" fill="none" aria-hidden="true">
      <path
        d="M7 8.5a5 5 0 0 1 0 7M10.5 5.8a9 9 0 0 1 0 12.4M14 3.2a13 13 0 0 1 0 17.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function CardAnatomy({
  fields = CARD_FIELDS,
  selectedIds,
  side,
  onSideChange,
  onToggle,
  disabled = false,
  revealed = false,
  correctIds = [],
  className = '',
}: CardAnatomyProps) {
  const fieldById = Object.fromEntries(fields.map((field) => [field.id, field])) as Record<
    string,
    CardField
  >
  const selected = new Set(selectedIds)
  const correct = new Set(correctIds)

  const field = (id: string) => fieldById[id]

  const renderField = (
    id: string,
    tone: FieldTone,
    className: string,
    content: React.ReactNode,
  ) => {
    const item = field(id)
    if (!item) return null
    return (
      <CardFieldButton
        key={id}
        field={item}
        selected={selected.has(id)}
        correct={correct.has(id)}
        revealed={revealed}
        disabled={disabled || !onToggle}
        tone={tone}
        onToggle={onToggle}
        className={className}
      >
        {content}
      </CardFieldButton>
    )
  }

  return (
    <section
      aria-label="Tarjeta bancaria ficticia de Banco Horizonte"
      className={`w-full ${className}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div
          role="group"
          aria-label="Cara de la tarjeta"
          className="inline-flex items-center gap-1 rounded-full bg-white/80 p-1 ring-1 ring-[#dbe6f7]"
        >
          {(
            [
              { id: 'front' as const, label: 'Anverso' },
              { id: 'back' as const, label: 'Reverso' },
            ]
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={side === option.id}
              onClick={() => onSideChange(option.id)}
              className={`rounded-full px-3 py-1.5 text-[10.5px] font-extrabold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5] ${
                side === option.id
                  ? 'bg-[#1d3f77] text-white'
                  : 'text-[#5d76a6] hover:bg-[#eef4ff]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="text-[9.5px] font-extrabold tracking-[0.1em] text-[#8aa0c4] uppercase">
          Simulación
        </span>
      </div>

      <div className="relative mx-auto w-full max-w-[520px]">
        {side === 'front' ? (
          <div
            role="group"
            aria-label="Anverso de la tarjeta"
            className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#243f8f] via-[#3f5fc4] to-[#7d55e0] p-[5.5%] text-white shadow-[0_24px_50px_-24px_rgba(30,55,130,.9)] ring-1 ring-white/20"
            style={{ aspectRatio: '1.586' }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-10 -right-8 h-40 w-40 rounded-full bg-[#5fe4ff]/25 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-[#ff9ec7]/25 blur-2xl"
            />

            <div className="relative flex h-full flex-col justify-between gap-1.5">
              <div className="flex items-start justify-between gap-2">
                {renderField(
                  'issuer',
                  'dark',
                  'max-w-[62%]',
                  <span className="flex items-center gap-1.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-white/20 text-[10px] font-black text-[#5fe4ff]">
                      B
                    </span>
                    <span className="truncate text-[clamp(8px,2vw,12px)] font-extrabold tracking-[0.08em]">
                      {field('issuer')?.value}
                    </span>
                  </span>,
                )}
                <span className="rounded-full bg-[#fff4e2] px-2 py-0.5 text-[7px] font-extrabold tracking-[0.08em] text-[#8a5a10] uppercase sm:text-[8.5px]">
                  Simulación educativa
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                {renderField(
                  'chip',
                  'dark',
                  'min-h-[30px]',
                  <span className="grid h-7 w-10 place-items-center rounded-md bg-gradient-to-br from-[#f6d98a] to-[#c79a3c] text-[6.5px] font-black tracking-[0.04em] text-[#5a3c0b] sm:h-8 sm:w-11 sm:text-[7.5px]">
                    CHIP
                  </span>,
                )}
                <ContactlessIcon />
              </div>

              {renderField(
                'card_number',
                'dark',
                'w-full',
                <span className="block text-[clamp(14px,4.2vw,24px)] leading-none font-extrabold tracking-[0.12em] whitespace-nowrap tabular-nums">
                  {field('card_number')?.value}
                </span>,
              )}

              <div className="flex items-end justify-between gap-2">
                {renderField(
                  'cardholder_name',
                  'dark',
                  'min-w-0 flex-1',
                  <span className="block min-w-0">
                    <span className="block text-[6.5px] font-bold tracking-[0.12em] text-white/65 uppercase sm:text-[8px]">
                      Titular
                    </span>
                    <span className="mt-0.5 block truncate text-[clamp(9px,2.4vw,14px)] leading-tight font-extrabold tracking-[0.06em]">
                      {field('cardholder_name')?.value}
                    </span>
                  </span>,
                )}
                {renderField(
                  'expiration_date',
                  'dark',
                  'shrink-0',
                  <span className="block text-right">
                    <span className="block text-[6.5px] font-bold tracking-[0.12em] text-white/65 uppercase sm:text-[8px]">
                      Vence
                    </span>
                    <span className="mt-0.5 block text-[clamp(9px,2.4vw,14px)] leading-tight font-extrabold tracking-[0.08em] tabular-nums">
                      {field('expiration_date')?.value}
                    </span>
                  </span>,
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            role="group"
            aria-label="Reverso de la tarjeta"
            className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#1f346d] via-[#243f8f] to-[#3f5fc4] p-[5.5%] text-white shadow-[0_24px_50px_-24px_rgba(30,55,130,.9)] ring-1 ring-white/20"
            style={{ aspectRatio: '1.586' }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -bottom-12 h-40 w-40 rounded-full bg-[#5fe4ff]/20 blur-2xl"
            />

            <div className="relative flex h-full flex-col justify-between gap-2.5">
              <div>
                {renderField(
                  'magnetic_stripe',
                  'stripe',
                  'min-h-[34px] w-full px-3 py-2 sm:min-h-[42px]',
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[8px] font-extrabold tracking-[0.14em] text-white/80 uppercase sm:text-[10px]">
                      {field('magnetic_stripe')?.value}
                    </span>
                    <span className="text-[7px] font-semibold text-white/55 sm:text-[9px]">
                      No compartir
                    </span>
                  </span>,
                )}
              </div>

              <div className="rounded-xl bg-white/95 p-[4%] text-[#1d2f57] shadow-inner">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[7px] font-extrabold tracking-[0.12em] text-[#8aa0c4] uppercase sm:text-[9px]">
                      Firma autorizada
                    </p>
                    <p className="mt-1 truncate text-[7px] font-semibold text-[#8aa0c4] sm:text-[9px]">
                      Documento ficticio · sin validez
                    </p>
                  </div>
                  {renderField(
                    'security_code',
                    'light',
                    'shrink-0',
                    <span className="block text-right">
                      <span className="block text-[6.5px] font-extrabold tracking-[0.12em] text-[#8aa0c4] uppercase sm:text-[8px]">
                        CVV
                      </span>
                      <span className="mt-0.5 block text-[clamp(11px,3vw,17px)] leading-none font-black tracking-[0.16em] tabular-nums">
                        {field('security_code')?.value}
                      </span>
                    </span>,
                  )}
                </div>
                <div className="mt-2 flex items-end justify-between gap-2 border-t border-dashed border-[#dbe6f7] pt-1.5">
                  <span className="text-[6.5px] font-semibold text-[#8aa0c4] sm:text-[8px]">
                    Banco Horizonte · Tarjeta de demostración
                  </span>
                  <span className="text-[6.5px] font-extrabold text-[#c2274a] sm:text-[8px]">
                    NO VÁLIDA
                  </span>
                </div>
              </div>

              <p className="text-[6.5px] leading-snug font-medium text-white/60 sm:text-[8px]">
                En una tarjeta física, el CVV suele estar en el reverso. Aquí es un valor ficticio.
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-[9.5px] leading-relaxed font-semibold text-[#8aa0c4]">
        {CARD_SIMULATION_NOTE}
      </p>
    </section>
  )
}
