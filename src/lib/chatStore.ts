import { useCallback, useEffect, useState } from 'react'
import { api, type ChatMessage } from './api'
import { onLiveEvent, onLiveStatus, onReconnect, retainLive } from './live'

/**
 * Chat real del barrio: historial del servidor + mensajes nuevos en vivo.
 */
export function useCommunityChat(networkId: string, communityId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<'cargando' | 'listo' | 'sin-conexion'>('cargando')

  const load = useCallback(async () => {
    try {
      setMessages(await api.chat(communityId))
      setStatus('listo')
    } catch {
      setStatus('sin-conexion')
    }
  }, [communityId])

  useEffect(() => {
    const release = retainLive()
    void load()
    const add = onLiveEvent<ChatMessage>('chat', (message) => {
      if (message.community_id !== communityId) return
      setMessages((current) =>
        current.some((item) => item.id === message.id) ? current : [...current, message],
      )
    })
    const removed = onLiveEvent<ChatMessage>('chat_removed', (message) =>
      setMessages((current) => current.filter((item) => item.id !== message.id)),
    )
    const reconnect = onReconnect(() => void load())
    const live = onLiveStatus((online) => setStatus((current) => (online ? (current === 'sin-conexion' ? 'listo' : current) : 'sin-conexion')))
    return () => {
      release()
      add()
      removed()
      reconnect()
      live()
    }
  }, [communityId, load])

  const send = useCallback(
    async (author: string, text: string) => {
      const message = await api.sendChat({ networkId, communityId, author, text })
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]))
      return message
    },
    [networkId, communityId],
  )

  return { messages, status, send, reload: load }
}
