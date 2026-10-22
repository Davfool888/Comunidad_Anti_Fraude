import { useEffect, useMemo, useRef, useState } from 'react'
import { ALERT_LABEL, type ChatLevel } from '../../data/chat'
import type { Community, CommunityNetwork } from '../../data/networks'
import { useAlerts } from '../../lib/alertsStore'
import { ApiError } from '../../lib/api'
import { useCommunityChat } from '../../lib/chatStore'
import { useAlias, useMerchant, writeAlias } from '../../lib/merchantSession'

/**
 * Chat del barrio: mensajes reales entre comercios y vecinos.
 *
 * Los mensajes se guardan en el servidor y llegan en vivo a todos los
 * conectados del barrio. Las alertas de la red aparecen en la conversación
 * como tarjetas de color. Si alguien publica un enlace que imita a un banco
 * o es de riesgo, el mensaje lo advierte.
 */

const LEVEL_STYLE: Record<ChatLevel, { card: string; badge: string; accent: string }> = {
  danger: { card: 'bg-[#fff1f4]', badge: 'bg-[#e23b5f] text-white', accent: '#e23b5f' },
  warning: { card: 'bg-[#fff8e8]', badge: 'bg-[#e9a13b] text-white', accent: '#e9a13b' },
  info: { card: 'bg-[#eef6ff]', badge: 'bg-[#3d8ee0] text-white', accent: '#3d8ee0' },
}

const COLORS = ['#5b7cf5', '#9b6ef0', '#2fb8a6', '#f08a5d', '#e0629b', '#4aa3e0', '#8ab63e', '#d9a441']

function colorFor(name: string) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return COLORS[hash % COLORS.length]
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}

function dayLabel(date: Date) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Hoy'
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer'
  return date.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
}

function timeLabel(date: Date) {
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

type Item =
  | { kind: 'message'; id: string; at: number; author: string; verified: boolean; text: string; risky: { domain: string; reason: string }[]; mine: boolean }
  | { kind: 'alert'; id: string; at: number; author: string; verified: boolean; text: string; level: ChatLevel }

export function CommunityChat({
  network,
  community,
  className = '',
}: {
  network: CommunityNetwork
  community: Community
  /** Se mantiene por compatibilidad: el chat siempre se dibuja como panel. */
  panel?: boolean
  className?: string
}) {
  const merchant = useMerchant()
  const alias = useAlias()
  const { messages, status, send, reload } = useCommunityChat(network.id, community.id)
  const { alerts } = useAlerts({ networkId: network.id, communityId: community.id })
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [mine, setMine] = useState<Set<number>>(() => new Set())
  const listRef = useRef<HTMLDivElement>(null)
  const myName = merchant?.name ?? (alias || 'Vecino')

  const items = useMemo<Item[]>(() => {
    const chat: Item[] = messages.map((message) => ({
      kind: 'message',
      id: `m-${message.id}`,
      at: new Date(message.created_at).getTime(),
      author: message.author,
      verified: message.verified,
      text: message.text,
      risky: message.risky_links,
      mine: mine.has(message.id),
    }))
    const live: Item[] = alerts.slice(0, 30).map((alert) => ({
      kind: 'alert',
      id: `a-${alert.id}`,
      at: new Date(alert.created_at).getTime(),
      author: alert.merchant_verified && alert.business_name ? alert.business_name : 'Vecino de la comunidad',
      verified: alert.merchant_verified,
      text: `${alert.title}. ${alert.description}`,
      level: alert.level,
    }))
    return [...chat, ...live].sort((a, b) => a.at - b.at)
  }, [messages, alerts, mine])

  // desplaza al final cuando llega algo nuevo
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [items.length])

  const submit = async () => {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setError('')
    try {
      const message = await send(myName, text)
      setMine((current) => new Set(current).add(message.id))
      setDraft('')
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? 'Está enviando mensajes muy rápido. Espere un momento.'
          : 'No se pudo enviar. Revise su conexión e intente de nuevo.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <section className={`flex h-full flex-col ${className}`}>
      {/* identidad de quien escribe */}
      <div className="flex items-center gap-2 border-b border-[#dbe6f7] bg-white/55 px-4 py-2.5 text-[11px] font-semibold text-[#6b81ad]">
        {merchant ? (
          <span className="flex min-w-0 items-center gap-1.5">
            Escribe como <b className="truncate text-[#1d2f57]">{merchant.name}</b>
            <span className="shrink-0 rounded-full bg-[#e4f7ee] px-1.5 text-[9.5px] font-extrabold text-[#1d7a53]">✓ verificado</span>
          </span>
        ) : editingName ? (
          <form
            className="flex flex-1 items-center gap-1.5"
            onSubmit={(event) => {
              event.preventDefault()
              const value = new FormData(event.currentTarget).get('alias')
              writeAlias(String(value ?? ''))
              setEditingName(false)
            }}
          >
            <input
              name="alias"
              defaultValue={alias}
              maxLength={40}
              autoFocus
              placeholder="Su nombre o apodo"
              className="h-7 min-w-0 flex-1 rounded-full border border-[#dbe6f7] bg-white px-3 text-[11px] text-[#2c4478] outline-none focus:border-[#9dbdf0]"
              aria-label="Nombre en el chat"
            />
            <button type="submit" className="rounded-full bg-[#1d2f57] px-2.5 py-1 text-[10.5px] font-bold text-white">
              Guardar
            </button>
          </form>
        ) : (
          <>
            <span className="min-w-0 truncate">
              Escribe como <b className="text-[#1d2f57]">{alias || 'Vecino'}</b> (vecino)
            </span>
            <button type="button" onClick={() => setEditingName(true)} className="shrink-0 font-bold text-[#5b7cf5]">
              Cambiar nombre
            </button>
          </>
        )}
      </div>

      {/* conversación */}
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-[#f4f8ff]/70 px-4 py-4" aria-live="polite">
        {status === 'cargando' && <p className="text-center text-[11.5px] font-semibold text-[#8aa0c4]">Cargando la conversación…</p>}
        {status === 'sin-conexion' && (
          <div className="rounded-2xl border border-dashed border-[#f2d38a] bg-[#fff8e8] p-3 text-center text-[11.5px] font-semibold text-[#8b6417]">
            Sin conexión con la red: los mensajes nuevos no llegarán hasta que vuelva.{' '}
            <button type="button" onClick={() => void reload()} className="font-bold underline">
              Reintentar
            </button>
          </div>
        )}
        {status === 'listo' && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#c9dbf6] bg-white/70 p-5 text-center">
            <p className="text-[12.5px] font-extrabold text-[#243d6b]">Todavía no hay mensajes en {community.name}</p>
            <p className="mt-1 text-[11px] font-medium text-[#8aa0c4]">
              Salude a los comercios del barrio o cuente si le llegó algo sospechoso. Todos los conectados lo verán al instante.
            </p>
          </div>
        )}

        {items.map((item, index) => {
          const date = new Date(item.at)
          const previous = items[index - 1]
          const showDay = !previous || new Date(previous.at).toDateString() !== date.toDateString()
          const separator = showDay && (
            <div className="my-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-[#dbe6f7]" />
              <span className="rounded-full bg-white px-3 py-0.5 text-[10px] font-bold text-[#7a90b8] capitalize shadow-sm">
                {dayLabel(date)}
              </span>
              <span className="h-px flex-1 bg-[#dbe6f7]" />
            </div>
          )

          if (item.kind === 'alert') {
            const style = LEVEL_STYLE[item.level]
            return (
              <div key={item.id}>
                {separator}
                <article className={`rounded-2xl border-l-4 p-3 shadow-[0_10px_24px_-18px_rgba(30,55,130,.9)] ${style.card}`} style={{ borderLeftColor: style.accent }}>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-extrabold tracking-[0.1em] uppercase ${style.badge}`}>
                      {ALERT_LABEL[item.level]}
                    </span>
                    <span className="ml-auto text-[10px] font-bold text-[#7a90b8]">{timeLabel(date)}</span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed font-medium whitespace-pre-line text-[#2c4478]">{item.text}</p>
                  <p className="mt-1.5 text-[10.5px] font-bold text-[#5d76a6]">
                    Reportado por {item.author}
                    {item.verified ? ' · ✓ verificado' : ''}
                  </p>
                </article>
              </div>
            )
          }

          return (
            <div key={item.id}>
              {separator}
              <div className={`flex items-end gap-2 ${item.mine ? 'flex-row-reverse' : ''}`}>
                {!item.mine && (
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-extrabold text-white ring-2 ring-white"
                    style={{ background: colorFor(item.author) }}
                    aria-hidden="true"
                  >
                    {initials(item.author)}
                  </span>
                )}
                <div className={`flex max-w-[80%] flex-col ${item.mine ? 'items-end' : 'items-start'}`}>
                  {!item.mine && (
                    <span className="mb-1 flex items-center gap-1 px-1 text-[10.5px] font-extrabold text-[#5d76a6]">
                      {item.author}
                      {item.verified ? (
                        <span className="rounded-full bg-[#e4f7ee] px-1.5 text-[9px] font-extrabold text-[#1d7a53]">✓ comercio</span>
                      ) : (
                        <span className="text-[9px] font-semibold text-[#a3b5d4]">vecino</span>
                      )}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-[12.5px] leading-relaxed font-medium break-words whitespace-pre-line shadow-[0_8px_20px_-14px_rgba(30,55,130,.9)] ${
                      item.mine ? 'rounded-br-md bg-gradient-to-br from-[#5b7cf5] to-[#9b6ef0] text-white' : 'rounded-bl-md bg-white text-[#2c4478]'
                    }`}
                  >
                    {item.text}
                  </div>
                  {item.risky.map((link) => (
                    <p key={link.domain} className="mt-1 max-w-full rounded-xl bg-[#ffe0e6] px-2.5 py-1 text-[10.5px] font-bold text-[#c2274a]">
                      ⚠ No abra «{link.domain}»: {link.reason}
                    </p>
                  ))}
                  <span className="mt-1 px-1 text-[9.5px] font-semibold text-[#a3b5d4]">{timeLabel(date)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* redactor */}
      <div className="border-t border-[#dbe6f7] bg-white/80 px-3 py-3">
        {error && <p className="mb-2 text-[11px] font-semibold text-[#c2274a]">{error}</p>}
        <div className="flex items-center gap-2">
          <input
            value={draft}
            maxLength={1000}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) void submit()
            }}
            placeholder={`Escribir al barrio ${community.name}…`}
            className="h-10 min-w-0 flex-1 rounded-full border border-[#dbe6f7] bg-[#f7faff] px-4 text-[12.5px] font-medium text-[#2c4478] outline-none transition-colors duration-200 placeholder:text-[#a3b5d4] focus:border-[#9dbdf0] focus:bg-white"
            aria-label="Mensaje para el barrio"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!draft.trim() || sending}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5b7cf5] to-[#9b6ef0] text-white shadow-[0_10px_20px_-10px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            aria-label="Enviar"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12 2-12 2v6.4Z" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[9.5px] font-medium text-[#a3b5d4]">
          Lo ven todos los conectados del barrio. No comparta claves, códigos ni datos de clientes.
        </p>
      </div>
    </section>
  )
}
