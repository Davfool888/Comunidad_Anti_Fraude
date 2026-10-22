import { useState } from 'react'
import { timeAgo } from '../../../lib/alertsStore'
import { api, type CommunityAlert } from '../../../lib/api'
import { LEVEL_STYLE } from './levelStyle'


const STATUS_LABEL: Record<CommunityAlert['status'], string> = {
  pendiente: 'En revisión',
  sin_verificar: 'Sin verificar',
  verificada: 'Verificada',
  rechazada: 'Rechazada',
}

export function AlertCard({ alert, compact = false }: { alert: CommunityAlert; compact?: boolean }) {
  const [confirmed, setConfirmed] = useState(false)
  const [count, setCount] = useState(alert.confirmations)
  const style = LEVEL_STYLE[alert.level]
  const weapon = alert.threat?.items?.some((item) => ['cuchillo', 'arma_de_fuego', 'arma_blanca'].includes(item.label))

  const confirm = async () => {
    setConfirmed(true)
    try {
      const updated = await api.confirmAlert(alert.id)
      setCount(updated.confirmations)
    } catch {
      setConfirmed(false)
    }
  }

  return (
    <article className={`rounded-2xl border-l-4 p-3.5 ${style.bar}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-extrabold tracking-[0.08em] uppercase ${style.chip}`}>
          {style.label}
        </span>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[9.5px] font-bold text-[#4a628f]">{alert.category_label}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
            alert.status === 'verificada' ? 'bg-[#d9f5e6] text-[#1d7a53]' : 'bg-white/80 text-[#8aa0c4]'
          }`}
        >
          {alert.status === 'verificada' ? '✓ ' : ''}
          {STATUS_LABEL[alert.status]}
        </span>
        <span className="ml-auto text-[10px] font-semibold text-[#8aa0c4]">{timeAgo(alert.created_at)}</span>
      </div>

      <h3 className="mt-2 text-[13px] leading-snug font-extrabold text-[#1d2f57]">{alert.title}</h3>
      {!compact && <p className="mt-1 text-[11.5px] leading-relaxed font-medium text-[#3d568e]">{alert.description}</p>}

      {weapon && (
        <p className="mt-2 rounded-xl bg-[#e23b5f] px-3 py-1.5 text-[11px] font-bold text-white">
          ⚠ La IA detectó un arma en la foto. Ante peligro llame al 123.
        </p>
      )}
      {alert.threat?.suspect_description && !compact && (
        <p className="mt-1.5 text-[11px] font-medium text-[#4a628f]">
          <span className="font-bold">Descripción:</span> {alert.threat.suspect_description}
        </p>
      )}

      {alert.entities.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1">
          {alert.entities.map((entity) => (
            <li key={`${entity.kind}-${entity.masked}`} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#c2274a] ring-1 ring-[#f4c4cf]">
              {entity.kind === 'telefono' ? '☎ ' : entity.kind === 'enlace' ? '🔗 ' : entity.kind === 'cuenta' ? '🏦 ' : '✉ '}
              {entity.kind === 'enlace' ? entity.domain : entity.masked}
            </li>
          ))}
        </ul>
      )}

      {alert.image_url && !compact && (
        <img src={alert.image_url} alt="Evidencia de la alerta" loading="lazy" className="mt-2 max-h-[180px] w-full rounded-xl object-cover" />
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-semibold text-[#8aa0c4]">
          {alert.business_name ? `Reportó ${alert.business_name}` : 'Reportó un vecino'}
        </span>
        <button
          type="button"
          onClick={confirm}
          disabled={confirmed}
          className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#4a628f] ring-1 ring-[#dbe6f7] transition-colors hover:bg-[#eef4ff] disabled:opacity-60"
        >
          {confirmed ? '✓ ' : ''}A mí también {count > 0 ? `· ${count}` : ''}
        </button>
      </div>
    </article>
  )
}
