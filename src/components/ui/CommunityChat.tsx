import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatLevel, ChatMessage, ChatParticipant } from '../../data/chat'
import { ALERT_LABEL, autoReply, buildChat } from '../../data/chat'
import { useAlerts } from '../../lib/alertsStore'
import type { Community, CommunityNetwork } from '../../data/networks'

/**
 * Chat de la comunidad.
 *
 * Reproduce la conversación del grupo de WhatsApp de la comunidad de barrio
 * seleccionada: los dueños de los comercios del barrio escriben y la red
 * difunde **avisos** que se distinguen por color (rojo = incidente, amarillo
 * = precaución, azul = comunicado). Cada mensaje indica el comercio que lo
 * escribió o reportó, el día y la hora.
 */

const LEVEL_STYLE: Record<
  ChatLevel,
  { card: string; badge: string; label: string; accent: string; icon: React.ReactNode }
> = {
  danger: {
    card: 'border-[#f4a9bb] bg-[#fff1f4]',
    badge: 'bg-[#e23b5f] text-white',
    label: 'text-[#c2274a]',
    accent: '#e23b5f',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M12 2 1.5 21h21L12 2Zm0 6.2 5.4 9.8H6.6L12 8.2ZM11 10.6v3.6h2v-3.6h-2Zm0 4.8v1.8h2v-1.8h-2Z" />
      </svg>
    ),
  },
  warning: {
    card: 'border-[#f2d38a] bg-[#fff8e8]',
    badge: 'bg-[#e9a13b] text-white',
    label: 'text-[#b06f13]',
    accent: '#e9a13b',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M12 2 3 5.4v6.1c0 4.6 3.7 9 9 10.5 5.3-1.5 9-5.9 9-10.5V5.4L12 2Zm0 4.6 5 1.9v3c0 2.9-2.1 5.8-5 7-2.9-1.2-5-4.1-5-7v-3l5-1.9Zm-1 2.2v5h2v-5h-2Zm0 6.2v1.8h2V15h-2Z" />
      </svg>
    ),
  },
  info: {
    card: 'border-[#a8cdf3] bg-[#eef6ff]',
    badge: 'bg-[#3d8ee0] text-white',
    label: 'text-[#1f6bbb]',
    accent: '#3d8ee0',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4.4a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8ZM11 11h2v6h-2v-6Z" />
      </svg>
    ),
  },
}

function Avatar({
  participant,
  size = 38,
  ring = true,
}: {
  participant: ChatParticipant
  size?: number
  ring?: boolean
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-extrabold text-white ${
        ring ? 'ring-2 ring-white' : ''
      }`}
      style={{
        width: size,
        height: size,
        background: participant.color,
        fontSize: size * 0.36,
      }}
      title={participant.name}
    >
      {participant.initials}
    </span>
  )
}

function VerifiedDot() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#3d8ee0]" fill="currentColor" aria-hidden="true">
      <path d="M12 1.8 14.6 4l3.3-.4.9 3.2 3 1.6-1.4 3.1 1.4 3.1-3 1.6-.9 3.2-3.3-.4L12 22.2 9.4 20l-3.3.4-.9-3.2-3-1.6L3.6 12 2.2 8.9l3-1.6.9-3.2L9.4 4 12 1.8Zm-1.1 12.4 5-5-1.4-1.4-3.6 3.6-1.7-1.7-1.4 1.4 3.1 3.1Z" />
    </svg>
  )
}

export function CommunityChat({
  network,
  community,
  panel = false,
  className = '',
}: {
  network: CommunityNetwork
  community: Community
  /** Modo panel: se dibuja dentro del cajón lateral y ocupa toda la altura. */
  panel?: boolean
  className?: string
}) {
  const chat = useMemo(() => buildChat(network, community), [network, community])
  const [messages, setMessages] = useState<ChatMessage[]>(chat.messages)
  const [draft, setDraft] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [typing, setTyping] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<number[]>([])

  useEffect(
    () => () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
    },
    [],
  )

  // Las alertas reales de la red entran al grupo como avisos, en orden cronológico
  const { alerts: liveAlerts } = useAlerts({ networkId: network.id, communityId: community.id })
  const combined = useMemo(() => {
    const live: ChatMessage[] = liveAlerts.map((alert) => {
      const date = new Date(alert.created_at)
      const today = new Date().toDateString() === date.toDateString()
      return {
        id: `red-${alert.id}`,
        kind: 'alert',
        level: alert.level,
        participantId: null,
        author: alert.business_name ?? 'Vecino de la comunidad',
        text: `${alert.title}. ${alert.description}`,
        day: today ? 'Hoy' : date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }),
        time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
        at: date.getTime(),
      }
    })
    return live.length ? [...messages, ...live].sort((a, b) => a.at - b.at) : messages
  }, [messages, liveAlerts])

  const visible = useMemo(
    () => (activeId ? combined.filter((item) => item.participantId === activeId || item.kind === 'alert') : combined),
    [combined, activeId],
  )

  // desplaza al final cuando llega un mensaje nuevo
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
  }, [visible.length, typing])

  const active = chat.participants.find((item) => item.id === activeId) ?? null
  const alerts = combined.filter((item) => item.kind === 'alert').length

  /** Envía el mensaje del usuario y simula la respuesta de un integrante. */
  const send = () => {
    const text = draft.trim()
    if (!text) return

    const now = Date.now()
    const date = new Date(now)
    setMessages((current) => [
      ...current,
      {
        id: `me-${now}`,
        kind: 'message',
        participantId: null,
        author: 'Tú',
        text,
        day: 'Hoy',
        time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
        at: now,
      },
    ])
    setDraft('')
    setTyping(true)

    // respuesta automática de un integrante del grupo
    const responder = active ?? chat.participants[chat.participants.length - 1]
    const timer = window.setTimeout(() => {
      setTyping(false)
      const reply = new Date()
      setMessages((current) => [
        ...current,
        {
          id: `r-${now}`,
          kind: 'message',
          participantId: responder?.id ?? null,
          author: responder?.name ?? 'Comunidad',
          text: autoReply(text),
          day: 'Hoy',
          time: `${String(reply.getHours()).padStart(2, '0')}:${String(reply.getMinutes()).padStart(2, '0')}`,
          at: reply.getTime(),
        },
      ])
    }, 1400)
    timersRef.current.push(timer)
  }

  return (
    <section id={panel ? undefined : 'chat'} className={`${panel ? 'h-full' : 'scroll-mt-24'} ${className}`}>
      {/* cabecera de la sección */}
      {!panel && (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">
              Canal de la comunidad
            </p>
            <h2 className="mt-1 text-[26px] leading-tight font-extrabold text-[#1d2f57]">
              Chat del barrio {community.name}
            </h2>
            <p className="mt-1 text-[13px] font-medium text-[#6b81ad]">
              Conversación entre los comercios verificados de {network.neighborhood} ·{' '}
              {chat.participants.length} integrantes · {alerts} avisos de la comunidad
            </p>
          </div>
          <span
            className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(30,55,130,.8)]"
            style={{ background: network.color }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/85" />
            Comunidad activa
          </span>
        </div>
      )}

      <div
        className={`overflow-hidden border border-white/70 bg-white/60 backdrop-blur-xl ${
          panel ? 'h-full rounded-none border-0 bg-transparent shadow-none' : 'rounded-[28px] shadow-[0_34px_70px_-32px_rgba(25,45,95,.55)]'
        }`}
      >
        <div className={`grid min-h-0 ${panel ? 'h-full' : 'lg:grid-cols-[268px_1fr]'}`}>
          {/* integrantes */}
          <aside
            className={`border-b border-[#dbe6f7] bg-[#f6f9ff]/80 p-4 ${panel ? 'hidden' : 'lg:border-r lg:border-b-0'}`}
          >
            <p className="text-[10px] font-bold tracking-[0.16em] text-[#7a90b8] uppercase">
              Integrantes
            </p>

            <ul className="mt-3 space-y-1.5">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-200 ${
                    activeId === null
                      ? 'bg-white shadow-[0_6px_16px_-10px_rgba(30,55,130,.8)] ring-1 ring-[#cfe0f7]'
                      : 'hover:bg-white/70'
                  }`}
                >
                  <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5b7cf5] to-[#9b6ef0] text-[12px] font-extrabold text-white ring-2 ring-white">
                    {chat.participants.length}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-extrabold text-[#1d2f57]">
                      Todo el barrio
                    </span>
                    <span className="block text-[10px] font-semibold text-[#8aa0c4]">
                      {chat.participants.length} en línea
                    </span>
                  </span>
                </button>
              </li>

              {chat.participants.map((participant) => (
                <li key={participant.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(participant.id === activeId ? null : participant.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-200 ${
                      participant.id === activeId
                        ? 'bg-white shadow-[0_6px_16px_-10px_rgba(30,55,130,.8)] ring-1 ring-[#cfe0f7]'
                        : 'hover:bg-white/70'
                    }`}
                  >
                    <Avatar participant={participant} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1">
                        <span className="truncate text-[12px] font-extrabold text-[#1d2f57]">
                          {participant.name}
                        </span>
                        {participant.verified && <VerifiedDot />}
                      </span>
                      <span className="block truncate text-[10px] font-semibold text-[#8aa0c4]">
                        {participant.business}
                        {participant.online ? ' · en línea' : ''}
                      </span>
                    </span>
                    {participant.online && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#38c98a]" />
                    )}
                  </button>
                </li>
              ))}
            </ul>

            {/* leyenda de los avisos */}
            <div className="mt-4 rounded-2xl border border-[#dbe6f7] bg-white/80 p-3">
              <p className="text-[9.5px] font-bold tracking-[0.14em] text-[#7a90b8] uppercase">
                Avisos de la comunidad
              </p>
              <ul className="mt-2 space-y-1.5">
                {(['danger', 'warning', 'info'] as ChatLevel[]).map((level) => (
                  <li key={level} className="flex items-center gap-2">
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-md ${LEVEL_STYLE[level].badge}`}
                    >
                      {LEVEL_STYLE[level].icon}
                    </span>
                    <span className={`text-[10.5px] font-bold ${LEVEL_STYLE[level].label}`}>
                      {ALERT_LABEL[level]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* conversación */}
          <div className="flex min-h-0 flex-col">
            {/* barra superior */}
            <header className="flex items-center gap-3 border-b border-[#dbe6f7] bg-white/70 px-4 py-3">
              {active ? (
                <Avatar participant={active} size={34} />
              ) : (
                <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5b7cf5] to-[#9b6ef0] text-[11px] font-extrabold text-white">
                  {chat.participants.length}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-extrabold text-[#1d2f57]">
                  {active ? active.name : `Comunidad del barrio ${community.name}`}
                </p>
                <p className="truncate text-[10px] font-semibold text-[#8aa0c4]">
                  {active
                    ? `Conversación privada con ${active.business.toLowerCase()}`
                    : `${network.neighborhood} · ${network.commune} · ${community.stats.merchants} comercios`}
                </p>
              </div>
              {active && (
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="rounded-full bg-[#eef4ff] px-3 py-1 text-[10.5px] font-bold text-[#5d76a6] transition-colors duration-200 hover:bg-[#dce9ff]"
                >
                  Volver al grupo
                </button>
              )}
            </header>

            {/* tira de integrantes (sólo en modo panel) */}
            {panel && (
              <div className="flex items-center gap-2 overflow-x-auto border-b border-[#dbe6f7] bg-white/55 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-extrabold text-white transition-transform duration-200 ${
                    activeId === null ? 'scale-105 ring-2 ring-[#5b7cf5] ring-offset-2' : 'opacity-70'
                  } bg-gradient-to-br from-[#5b7cf5] to-[#9b6ef0]`}
                  title="Todo el barrio"
                >
                  {chat.participants.length}
                </button>
                {chat.participants.map((participant) => (
                  <button
                    key={participant.id}
                    type="button"
                    onClick={() =>
                      setActiveId(participant.id === activeId ? null : participant.id)
                    }
                    className={`shrink-0 rounded-full transition-transform duration-200 ${
                      participant.id === activeId
                        ? 'scale-105 ring-2 ring-[#5b7cf5] ring-offset-2'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title={participant.name}
                  >
                    <Avatar participant={participant} size={36} />
                  </button>
                ))}
              </div>
            )}

            {/* mensajes */}
            <div
              ref={listRef}
              className="flex-1 space-y-3 overflow-y-auto bg-[#f4f8ff]/70 px-4 py-4"
              style={panel ? undefined : { maxHeight: 460 }}
            >
              {visible.map((message, index) => {
                const previous = visible[index - 1]
                const showDay = !previous || previous.day !== message.day

                if (message.kind === 'alert') {
                  const level = message.level ?? 'info'
                  const style = LEVEL_STYLE[level]
                  const participant = chat.participants.find((item) => item.id === message.participantId)
                  return (
                    <div key={message.id}>
                      {showDay && (
                        <div className="my-4 flex items-center gap-3">
                          <span className="h-px flex-1 bg-[#dbe6f7]" />
                          <span className="rounded-full bg-white px-3 py-0.5 text-[10px] font-bold text-[#7a90b8] shadow-sm">
                            {message.day}
                          </span>
                          <span className="h-px flex-1 bg-[#dbe6f7]" />
                        </div>
                      )}
                      <article
                        className={`rounded-2xl border-l-4 p-3.5 shadow-[0_10px_24px_-18px_rgba(30,55,130,.9)] ${style.card}`}
                        style={{ borderLeftColor: style.accent }}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`grid h-6 w-6 place-items-center rounded-lg ${style.badge}`}>
                            {style.icon}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9.5px] font-extrabold tracking-[0.1em] uppercase ${style.badge}`}
                          >
                            {ALERT_LABEL[level]}
                          </span>
                          <span className="ml-auto text-[10px] font-bold text-[#7a90b8]">
                            {message.day} · {message.time}
                          </span>
                        </div>
                        <p className="mt-2 text-[12.5px] leading-relaxed font-medium text-[#2c4478]">
                          {message.text}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          {participant && <Avatar participant={participant} size={20} ring={false} />}
                          <p className="text-[10.5px] font-bold text-[#5d76a6]">
                            Reportado por {message.author}
                            {participant?.verified ? ' · comercio verificado' : ''}
                          </p>
                        </div>
                      </article>
                    </div>
                  )
                }

                const mine = message.participantId === null && message.author === 'Tú'
                const participant = chat.participants.find((item) => item.id === message.participantId)

                return (
                  <div key={message.id}>
                    {showDay && (
                      <div className="my-4 flex items-center gap-3">
                        <span className="h-px flex-1 bg-[#dbe6f7]" />
                        <span className="rounded-full bg-white px-3 py-0.5 text-[10px] font-bold text-[#7a90b8] shadow-sm">
                          {message.day}
                        </span>
                        <span className="h-px flex-1 bg-[#dbe6f7]" />
                      </div>
                    )}
                    <div className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                      {!mine &&
                        (participant ? (
                          <Avatar participant={participant} size={32} />
                        ) : (
                          <span className="h-8 w-8 shrink-0" />
                        ))}
                      <div className={`max-w-[78%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                        {!mine && (
                          <span className="mb-1 flex items-center gap-1 px-1">
                            <span className="truncate text-[10.5px] font-extrabold text-[#5d76a6]">
                              {message.author}
                            </span>
                            {participant?.verified && <VerifiedDot />}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-3.5 py-2 text-[12.5px] leading-relaxed font-medium shadow-[0_8px_20px_-14px_rgba(30,55,130,.9)] ${
                            mine
                              ? 'rounded-br-md bg-gradient-to-br from-[#5b7cf5] to-[#9b6ef0] text-white'
                              : 'rounded-bl-md bg-white text-[#2c4478]'
                          }`}
                        >
                          {message.text}
                        </div>
                        <span className="mt-1 px-1 text-[9.5px] font-semibold text-[#a3b5d4]">
                          {message.time}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {typing && (
                <div className="flex items-end gap-2">
                  <span className="h-8 w-8 shrink-0" />
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-[0_8px_20px_-14px_rgba(30,55,130,.9)]">
                    {[0, 1, 2].map((index) => (
                      <span
                        key={index}
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#9fb4dd]"
                        style={{ animationDelay: `${index * 160}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* redactor */}
            <div className="flex items-center gap-2 border-t border-[#dbe6f7] bg-white/80 px-3 py-3">
              <button
                type="button"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#8aa0c4] transition-colors duration-200 hover:bg-[#eef4ff] hover:text-[#5d76a6]"
                aria-label="Adjuntar"
              >
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
                  <path d="M17.5 6.5v8.8a4.8 4.8 0 0 1-9.6 0V7.3a3.1 3.1 0 0 1 6.2 0v8a1.4 1.4 0 0 1-2.8 0V8.4h1.6v6.9a.4.4 0 0 0 .8 0V7.3a1.5 1.5 0 0 0-3 0v8a3.2 3.2 0 0 0 6.4 0V6.5h1.2Z" />
                </svg>
              </button>

              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') send()
                }}
                placeholder={
                  active ? `Escribir a ${active.name}…` : `Escribir en el grupo de ${community.name}…`
                }
                className="h-10 min-w-0 flex-1 rounded-full border border-[#dbe6f7] bg-[#f7faff] px-4 text-[12.5px] font-medium text-[#2c4478] outline-none transition-colors duration-200 placeholder:text-[#a3b5d4] focus:border-[#9dbdf0] focus:bg-white"
                aria-label="Mensaje"
              />

              <button
                type="button"
                onClick={send}
                disabled={!draft.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5b7cf5] to-[#9b6ef0] text-white shadow-[0_10px_20px_-10px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                aria-label="Enviar"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12 2-12 2v6.4Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
