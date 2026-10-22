import { useState } from 'react'
import { confirmAlert, timeAgo } from '../../../lib/alertsStore'
import type { CommunityAlert } from '../../../lib/api'
import { Modal } from '../Modal'
import { LEVEL_STYLE } from './levelStyle'

const STATUS_LABEL: Record<CommunityAlert['status'], string> = {
  pendiente: 'En revisión',
  sin_verificar: 'Sin verificar',
  verificada: 'Verificada por la red',
  rechazada: 'Rechazada',
}

/**
 * Tarjeta de una alerta. El contador «A mí también» viene del almacén en
 * vivo: se actualiza cuando otros vecinos lo marcan y recuerda si usted ya
 * lo marcó (el servidor cuenta un voto por persona).
 */
export function AlertCard({
  alert,
  compact = false,
  onOpen,
}: {
  alert: CommunityAlert
  compact?: boolean
  /** En modo compacto: abre el detalle completo. */
  onOpen?: () => void
}) {
  const [zoom, setZoom] = useState(false)
  const style = LEVEL_STYLE[alert.level]
  const weapon = alert.threat?.items?.some((item) => ['cuchillo', 'arma_de_fuego', 'arma_blanca'].includes(item.label))
  const confirmed = Boolean(alert.confirmed_by_me)

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
          title={
            alert.status === 'verificada'
              ? 'Un moderador de la red comprobó esta alerta.'
              : 'Aún no la revisa un moderador: tómela como aviso, no como acusación.'
          }
        >
          {alert.status === 'verificada' ? '✓ ' : ''}
          {STATUS_LABEL[alert.status]}
        </span>
        <span className="ml-auto text-[10px] font-semibold text-[#8aa0c4]" title={new Date(alert.created_at).toLocaleString('es-CO')}>
          {timeAgo(alert.created_at)}
        </span>
      </div>

      <h3 className="mt-2 text-[13px] leading-snug font-extrabold text-[#1d2f57]">
        {onOpen ? (
          <button type="button" onClick={onOpen} className="text-left hover:underline">
            {alert.title}
          </button>
        ) : (
          alert.title
        )}
      </h3>
      {!compact && (
        <p className="mt-1 text-[11.5px] leading-relaxed font-medium whitespace-pre-line text-[#3d568e]">{alert.description}</p>
      )}

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
        <ul className="mt-2 flex flex-wrap gap-1" aria-label="Números o enlaces reportados">
          {alert.entities.map((entity) => (
            <li key={`${entity.kind}-${entity.masked}`} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#c2274a] ring-1 ring-[#f4c4cf]">
              {entity.kind === 'telefono' ? '☎ ' : entity.kind === 'enlace' ? '🔗 ' : entity.kind === 'cuenta' ? '🏦 ' : '✉ '}
              {entity.kind === 'enlace' ? entity.domain : entity.masked}
            </li>
          ))}
        </ul>
      )}

      {alert.image_url && !compact && (
        <button type="button" onClick={() => setZoom(true)} className="mt-2 block w-full" aria-label="Ampliar la foto">
          <img src={alert.image_url} alt="Evidencia de la alerta" loading="lazy" className="max-h-[180px] w-full rounded-xl object-cover" />
        </button>
      )}
      {alert.camera?.available && onOpen && (
        <button
          type="button"
          onClick={onOpen}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f1a33] px-3 py-2 text-[11.5px] font-bold text-white transition-colors hover:bg-[#1d2f57]"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#e23b5f]" />
          Ver cámara en vivo de {alert.affected_merchant?.name ?? 'el comercio'}
        </button>
      )}
      {alert.image_url && compact && (
        <p className="mt-1.5 text-[10px] font-semibold text-[#8aa0c4]">📷 Incluye foto</p>
      )}

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1 truncate text-[10px] font-semibold text-[#8aa0c4]">
          {alert.merchant_verified && alert.business_name ? (
            <>
              Reportó <b className="truncate text-[#1d2f57]">{alert.business_name}</b>
              <span className="shrink-0 rounded-full bg-[#e4f7ee] px-1.5 text-[9px] font-extrabold text-[#1d7a53]">✓ verificado</span>
            </>
          ) : (
            'Reportó un vecino'
          )}
        </span>
        <button
          type="button"
          onClick={() => void confirmAlert(alert)}
          disabled={confirmed}
          aria-pressed={confirmed}
          title={confirmed ? 'Ya marcó que le pasó lo mismo' : 'Márquelo si a usted también le pasó'}
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 transition-colors ${
            confirmed ? 'bg-[#eef4ff] text-[#5b7cf5] ring-[#c9dbf6]' : 'bg-white text-[#4a628f] ring-[#dbe6f7] hover:bg-[#eef4ff]'
          }`}
        >
          {confirmed ? '✓ A mí también' : 'A mí también'}
          {alert.confirmations > 0 ? ` · ${alert.confirmations}` : ''}
        </button>
      </div>

      {zoom && alert.image_url && (
        <Modal title={alert.title} subtitle="Foto de la alerta (rostros pixelados y sin ubicación)" onClose={() => setZoom(false)} width={900}>
          <img src={alert.image_url} alt="Evidencia de la alerta" className="max-h-[75vh] w-full rounded-xl object-contain" />
        </Modal>
      )}
    </article>
  )
}
