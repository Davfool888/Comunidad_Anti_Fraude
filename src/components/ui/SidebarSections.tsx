import { AiShieldScene, CheckWhatsappScene, ReceiptScene } from '../three/scenes/StaffScenes'
import {
  CommentersScene,
  CommunityScene,
  DonationsScene,
  EduPaymentScene,
  PreventionScene,
} from '../three/scenes/StatsScenes'
import { EduCard, MiniLink, MiniPill, SectionTitle, SideCard, StatCard } from './Sidebar'

/** Sección "Estaforna de comunitario". */
export function StaffSection() {
  return (
    <section>
      <SectionTitle title="Estaforna de comunitario" />

      <div className="grid grid-cols-2 gap-3">
        <SideCard
          featured
          title="Inteligencia artificial"
          description="Detecta señales de fraude digital en mensajes, enlaces y operaciones sospechosas."
          icon={<AiShieldScene />}
          action={<MiniPill>Analizar posible fraude</MiniPill>}
        />
        <SideCard
          title="Comprobantes de pago"
          description="Valida el comprobante, el remitente y el monto antes de completar una transferencia."
          icon={<ReceiptScene />}
          action={<MiniLink>Aprender a prevenir</MiniLink>}
        />
      </div>
    </section>
  )
}

/** Sección "Estadísticas de comunidad". */
export function CommunityStatsSection() {
  return (
    <section>
      <div className="relative mb-4">
        {/* emblema circular de la sección */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white ring-2 ring-neon-400/60">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-grape-700" fill="currentColor" aria-hidden="true">
              <path d="M4 20h16v-2H4v2ZM6 16h12v-2H6v2Zm2-4h8V6l-4-3-4 3v6Z" />
            </svg>
          </span>
        </div>

        <SectionTitle title="Estadísticas de comunidad" subtitle="Estadísticas de información a la comunidad" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard value="71k" label="Total la comunidad" icon={<CommunityScene />} />
        <StatCard value="1.200" label="Estadístico de comentadores" icon={<CommentersScene />} />
        <StatCard value="2.000" label="Donación de composites" icon={<DonationsScene />} />
      </div>
    </section>
  )
}

/** Sección "Prevención educativa". */
export function EducationSection() {
  return (
    <section>
      <SectionTitle title="Prevención educativa" subtitle="Aprende a reconocer una conexión sospechosa antes de pagar" />

      <div className="grid grid-cols-3 gap-3">
        <EduCard label="Check com WhatsApp" icon={<CheckWhatsappScene />} />
        <EduCard label="Prevención por la prevención" icon={<PreventionScene />} />
        <EduCard label="Comprobantes de pago" hint="₡23639" icon={<EduPaymentScene />} />
      </div>
    </section>
  )
}
