import { useMemo, useState } from 'react'
import { findNetwork } from './data/networks'
import { AlertsPanel } from './components/ui/alerts/AlertsPanel'
import { CommunityChatDrawer } from './components/ui/CommunityChatDrawer'
import { CommunityStage } from './components/ui/CommunityStage'
import { EducationProvider } from './components/ui/education/EducationProvider'
import { EscudoInteligencia } from './components/ui/EscudoInteligencia'
import { FraudAnalyzer } from './components/ui/FraudAnalyzer'
import { LearningCenter } from './components/ui/learning/LearningCenter'
import { LearningProvider } from './components/ui/learning/LearningProvider'
import { ModerationPanel } from './components/ui/moderation/ModerationPanel'
import { NetworkHeader, type AppView } from './components/ui/NetworkHeader'
import { NetworkSwitcher } from './components/ui/NetworkSwitcher'
import { CommunityStatsSection, EducationSection, StaffSection } from './components/ui/SidebarSections'

/**
 * La aplicación se organiza en **tres ventanas**:
 *
 *  · **Analizar fraude** (la principal): el asistente de la red.
 *  · **Comunidades**: la maqueta 3D de la red de comercios. Aquí se abre el
 *    chat de la comunidad, como un panel pegado al borde izquierdo por encima
 *    del modelo, y se puede minimizar.
 *  · **Centro de aprendizaje**: los juegos de prevención de fraude, las
 *    lecciones del modulo educativo y las modalidades vigentes.
 *  · **Panel de la red**: moderación de alertas y comercios, tendencias y
 *    generación de retos (requiere el token de moderación).
 *
 * Todas comparten la red y la comunidad de barrio activas.
 */
export default function App() {
  const [view, setView] = useState<AppView>('fraude')
  const [networkId, setNetworkId] = useState('chapinero')
  const [communityId, setCommunityId] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMinimized, setChatMinimized] = useState(false)

  const network = useMemo(() => findNetwork(networkId), [networkId])
  const community = useMemo(
    () => network.communities.find((item) => item.id === communityId) ?? network.communities[0] ?? null,
    [network, communityId],
  )

  /** Entra en una red comunitaria y, opcionalmente, en una de sus comunidades. */
  const enterNetwork = (nextNetworkId: string, nextCommunityId?: string) => {
    const next = findNetwork(nextNetworkId)
    setNetworkId(nextNetworkId)
    setCommunityId(nextCommunityId ?? next.communities[0]?.id ?? null)
  }

  /** Abre el chat: siempre dentro de la ventana de comunidades. */
  const openChat = () => {
    setView('comunidades')
    setChatOpen(true)
    setChatMinimized(false)
  }

  return (
    <EducationProvider>
      <LearningProvider>
        <main className="relative min-h-screen overflow-x-hidden bg-cream-100">
          {/* cabecera global: conmuta de ventana y abre el chat */}
          <NetworkHeader
            view={view}
            onView={setView}
            onOpenChat={openChat}
            tone={view === 'comunidades' ? 'cielo' : 'claro'}
            switcher={
              <NetworkSwitcher
                activeNetwork={network}
                activeCommunity={community ?? undefined}
                onEnter={enterNetwork}
                tone={view === 'comunidades' ? 'cielo' : 'claro'}
              />
            }
          />

          {view === 'fraude' ? (
            /* -------- Ventana principal: Analizar fraude -------- */
            <div className="mx-auto w-full max-w-[1400px] px-4 pt-28 pb-16 sm:px-6 sm:pt-32">
              <FraudAnalyzer network={network} community={community} />
            </div>
          ) : view === 'educacion' ? (
            /* -------- Ventana del Centro de aprendizaje -------- */
            <div className="mx-auto w-full max-w-[1400px] px-4 pt-28 pb-16 sm:px-6 sm:pt-32">
              <LearningCenter />
            </div>
          ) : view === 'moderacion' ? (
            /* -------- Panel de la red (moderadores) -------- */
            <div className="mx-auto w-full max-w-[1400px] px-4 pt-28 pb-16 sm:px-6 sm:pt-32">
              <ModerationPanel />
            </div>
          ) : (
            /* -------- Ventana de comunidades: la maqueta 3D -------- */
            <>
              <CommunityStage
                network={network}
                community={community}
                chatOpen={chatOpen}
                onOpenChat={openChat}
              />

              <div className="relative mx-auto w-full max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20">
                <div className="mb-14">
                  <AlertsPanel network={network} community={community} />
                </div>
                <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-8">
                  {/* columna principal */}
                  <div>
                    <EscudoInteligencia />
                  </div>

                  {/* columna lateral del mockup */}
                  <aside className="flex flex-col gap-9">
                    <StaffSection />
                    <CommunityStatsSection />
                    <EducationSection />
                  </aside>
                </div>
              </div>
            </>
          )}

          {/* Chat de la comunidad: panel izquierdo sobre el modelo, minimizable */}
          {view === 'comunidades' && community && (
            <CommunityChatDrawer
              open={chatOpen}
              minimized={chatMinimized}
              network={network}
              community={community}
              onMinimize={() => setChatMinimized(true)}
              onClose={() => setChatOpen(false)}
              onRestore={() => setChatMinimized(false)}
            />
          )}

          <div aria-hidden="true" className="grain" />
        </main>
      </LearningProvider>
    </EducationProvider>
  )
}
