import type { CommunityAlert } from '../../../lib/api'
import { Modal } from '../Modal'
import { AlertCamera } from './AlertCamera'
import { AlertCard } from './AlertCard'

/** Detalle de una alerta: tarjeta completa y la cámara del comercio afectado. */
export function AlertDetailModal({ alert, onClose }: { alert: CommunityAlert; onClose: () => void }) {
  return (
    <Modal title="Alerta de la red" subtitle={alert.category_label} onClose={onClose} width={alert.camera?.available ? 760 : 560}>
      <AlertCard alert={alert} />
      <AlertCamera alert={alert} />
      <div className="mt-4 grid gap-2 text-[11px] leading-relaxed font-medium text-[#6b81ad]">
        {alert.level === 'danger' && (
          <p className="rounded-xl bg-[#fff1f4] px-3 py-2 font-semibold text-[#c2274a]">
            Si está en peligro llame al 123. Extorsión: 165 (GAULA). No se acerque al local si hay riesgo.
          </p>
        )}
        <p>
          {alert.status === 'verificada'
            ? 'Un moderador de la red comprobó esta alerta.'
            : 'Esta alerta aún no la revisa un moderador. Tómela como aviso y no comparta datos de personas sin pruebas.'}
        </p>
      </div>
    </Modal>
  )
}
