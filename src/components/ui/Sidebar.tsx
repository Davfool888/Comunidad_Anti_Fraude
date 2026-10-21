import type { ReactNode } from 'react'

/** Encabezado centrado de sección: título en negrita + subtítulo. */
export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 text-center">
      <h2 className="text-[15px] font-extrabold tracking-tight text-ink">{title}</h2>
      {subtitle && <p className="mt-[3px] text-[10px] font-medium text-plum-700/70">{subtitle}</p>}
    </div>
  )
}

/** Tarjeta de cristal del panel lateral. Sin acciones reales. */
export function SideCard({
  title,
  description,
  icon,
  action,
  featured = false,
}: {
  title: string
  description: string
  icon: ReactNode
  action?: ReactNode
  featured?: boolean
}) {
  return (
    <article
      className={`card-purple glass-card relative flex flex-col overflow-hidden rounded-[22px] p-4 shadow-card-float ${
        featured ? 'ring-[1.5px] ring-neon-400/60' : ''
      }`}
    >
      <div className="glow-neon pointer-events-none absolute -top-10 left-1/2 h-[160px] w-[200px] -translate-x-1/2 opacity-70 blur-2xl" />

      <div className="relative h-[122px] w-full">{icon}</div>

      <h3 className="relative mt-2 text-[13px] leading-tight font-bold text-ink">{title}</h3>
      <p className="relative mt-[6px] text-[9.5px] leading-[1.45] text-plum-700/80">{description}</p>
      {action && <div className="relative mt-3">{action}</div>}
    </article>
  )
}

/** Botón verde pequeño (uso en tarjetas laterales). */
export function MiniPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block cursor-default rounded-full bg-gradient-to-r from-lime-400 to-lime-500 px-3 py-[5px] text-[9.5px] font-bold text-plum-800 shadow-glow-lime">
      {children}
    </span>
  )
}

/** Enlace verde con flecha (uso en tarjetas laterales). */
export function MiniLink({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex cursor-default items-center gap-1 text-[9.5px] font-semibold text-lime-500">
      {children}
      <span aria-hidden="true">→</span>
    </span>
  )
}

/** Tarjeta de estadística: ilustración + cifra + etiqueta. */
export function StatCard({ value, label, icon }: { value: string; label: string; icon: ReactNode }) {
  return (
    <article className="card-purple glass-card relative flex flex-col items-center rounded-[20px] px-3 pt-4 pb-4 shadow-card-float">
      <div className="glow-neon pointer-events-none absolute h-[130px] w-[150px] opacity-70 blur-2xl" />

      <div className="relative h-[92px] w-full">{icon}</div>

      <strong className="relative mt-2 text-[17px] leading-none font-extrabold text-ink">{value}</strong>
      <span className="relative mt-[6px] text-center text-[8.5px] leading-[1.3] text-plum-700/75">{label}</span>
    </article>
  )
}

/** Tarjeta de prevención educativa: ilustración + etiqueta debajo. */
export function EduCard({ label, icon, hint }: { label: string; icon: ReactNode; hint?: string }) {
  return (
    <figure className="flex flex-col items-center">
      <div className="card-purple glass-card relative w-full overflow-hidden rounded-[20px] shadow-card-float">
        <div className="glow-neon pointer-events-none absolute inset-x-0 -top-8 h-[140px] opacity-70 blur-2xl" />
        <div className="relative h-[104px] w-full">{icon}</div>
      </div>

      <figcaption className="mt-2.5 text-center">
        <span className="block text-[10px] leading-[1.25] font-bold text-ink">{label}</span>
        {hint && <span className="mt-[3px] block text-[8.5px] font-medium text-plum-700/70">{hint}</span>}
      </figcaption>
    </figure>
  )
}
