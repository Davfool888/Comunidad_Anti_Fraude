import { useEffect, useMemo, useRef, useState } from 'react'
import type { FraudVerdict } from '../../data/fraud'
import { SOURCE_LABEL, VOICE_SAMPLES } from '../../data/fraud'
import type { Community, CommunityNetwork } from '../../data/networks'
import { analyzeHybrid, type Stage } from '../../lib/ai/engine'
import { api, type AnalysisResult, type ApiStatus, type ChatTurn } from '../../lib/api'
import { AlertComposer, type AlertDraft } from './alerts/AlertComposer'
import { EntityLookup } from './alerts/EntityLookup'
import { AnalysisDetails, EmergencyBanner } from './analysis/AnalysisDetails'
import { ReportModal } from './analysis/ReportModal'

const STAGE_LABEL: Record<Stage, string> = {
  enviando: 'Analizando el mensaje…',
  'leyendo-imagenes': 'Leyendo el texto de las capturas…',
  'analizando-imagenes': 'Buscando armas o amenazas en las imágenes…',
  analizando: 'Cruzando con los reportes de la comunidad…',
}

/** Frases para el titular de la alerta a partir del análisis. */
function alertDraft(analysis: AnalysisResult, original: string): AlertDraft {
  const identifiers = analysis.entities
    .filter((entity) => entity.kind === 'enlace')
    .map((entity) => entity.masked)
    .join(' ')
  return {
    title: `${analysis.category_label}: ${analysis.verdict === 'fraude' ? 'intento de fraude' : 'mensaje sospechoso'}`,
    description: `${analysis.summary}\n\nMensaje recibido: ${(original || analysis.extracted_text || '').slice(0, 900)}`,
    category: analysis.category,
    level: analysis.emergency || analysis.verdict === 'fraude' ? 'danger' : 'warning',
    identifiers,
  }
}

/**
 * Sección «Analizar fraude».
 *
 * Un chat con el asistente de la red: se puede **pulsar para hablar** (el
 * navegador transcribe la voz a texto) o **cambiar a chat de texto** para
 * escribir, adjuntar capturas o pegar mensajes sospechosos. En ambos casos el
 * mensaje se analiza y se responde si es fraude o no.
 */

/** Reconocimiento de voz del navegador (no existe en todos). */
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  source: 'voz' | 'texto' | 'evidencia'
  evidence?: File[]
  analysis?: AnalysisResult
  /** Texto original del usuario (para la alerta y la denuncia). */
  original?: string
  error?: string
  /** Respuesta conversacional (preguntas, saludos): sin veredicto. */
  reply?: string
  engine?: AnalysisResult['engine']
}

/** Últimos turnos, para que la IA entienda las preguntas de seguimiento. */
function historyOf(messages: Message[]): ChatTurn[] {
  return messages
    .map((message): ChatTurn | null => {
      if (message.role === 'user') return message.text ? { role: 'user', text: message.text } : null
      if (message.reply) return { role: 'assistant', text: message.reply }
      if (message.analysis) {
        return { role: 'assistant', text: `${message.analysis.headline}. ${message.analysis.summary}` }
      }
      return null
    })
    .filter((turn): turn is ChatTurn => turn !== null)
    .slice(-6)
}

const VERDICT_STYLE: Record<
  FraudVerdict,
  { card: string; badge: string; label: string; icon: React.ReactNode }
> = {
  fraude: {
    card: 'border-[#f4a9bb] bg-[#fff1f4]',
    badge: 'bg-[#e23b5f] text-white',
    label: 'text-[#c2274a]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M12 2 1.5 21h21L12 2Zm0 6.2 5.4 9.8H6.6L12 8.2ZM11 10.6v3.6h2v-3.6h-2Zm0 4.8v1.8h2v-1.8h-2Z" />
      </svg>
    ),
  },
  sospechoso: {
    card: 'border-[#f2d38a] bg-[#fff8e8]',
    badge: 'bg-[#e9a13b] text-white',
    label: 'text-[#b06f13]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M12 2 3 5.4v6.1c0 4.6 3.7 9 9 10.5 5.3-1.5 9-5.9 9-10.5V5.4L12 2Zm0 4.6 5 1.9v3c0 2.9-2.1 5.8-5 7-2.9-1.2-5-4.1-5-7v-3l5-1.9Zm-1 2.2v5h2v-5h-2Zm0 6.2v1.8h2V15h-2Z" />
      </svg>
    ),
  },
  limpio: {
    card: 'border-[#a8dfc0] bg-[#eefbf3]',
    badge: 'bg-[#2fb87c] text-white',
    label: 'text-[#1d7a53]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.1 14.5-4-4 1.4-1.4 2.6 2.6 5.8-5.8 1.4 1.4-7.2 7.2Z" />
      </svg>
    ),
  },
}

/** Barra de onda animada mientras se graba. */
function Waveform({ active }: { active: boolean }) {
  return (
    <span className="flex h-6 items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <span
          key={index}
          className="w-[3px] rounded-full bg-white/90"
          style={{
            height: active ? `${8 + ((index * 7) % 14)}px` : '5px',
            transition: 'height 160ms ease',
            animation: active ? `pulse ${600 + index * 90}ms ease-in-out infinite alternate` : 'none',
          }}
        />
      ))}
    </span>
  )
}

export function FraudAnalyzer({
  network,
  community,
  className = '',
}: {
  network: CommunityNetwork
  community?: Community | null
  className?: string
}) {
  const [mode, setMode] = useState<'voz' | 'texto'>('voz')
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [evidence, setEvidence] = useState<File[]>([])
  const [stage, setStage] = useState<Stage>('enviando')
  const [status, setStatus] = useState<ApiStatus | null | 'offline'>(null)
  const [alertFrom, setAlertFrom] = useState<AlertDraft | null>(null)
  const [reportFor, setReportFor] = useState<Message | null>(null)
  const [recording, setRecording] = useState(false)
  const [interim, setInterim] = useState('')
  const [supported] = useState<boolean | null>(() => getSpeechRecognition() !== null)
  const [micError, setMicError] = useState(false)
  const [thinking, setThinking] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const transcriptRef = useRef('')
  const simTimer = useRef(0)
  const usedPointer = useRef(false)
  const recordingRef = useRef(false)
  const timersRef = useRef<number[]>([])

  useEffect(
    () => () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
      window.clearTimeout(simTimer.current)
      recognitionRef.current?.stop()
    },
    [],
  )

  useEffect(() => {
    api
      .status()
      .then(setStatus)
      .catch(() => setStatus('offline'))
  }, [])

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
  }, [messages.length, thinking])

  /**
   * Analiza el mensaje y responde como el asistente de la red.
   * Usa la IA del servidor y, si no está disponible, el motor del navegador.
   */
  const send = async (text: string, source: 'voz' | 'texto', files: File[]) => {
    const clean = text.trim()
    if ((!clean && files.length === 0) || thinking) return

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: clean || 'Analiza la evidencia adjunta',
      source: clean ? source : 'evidencia',
      evidence: files,
    }
    const history = historyOf(messages)
    setMessages((current) => [...current, userMessage])
    setDraft('')
    setEvidence([])
    setThinking(true)
    setStage('enviando')

    try {
      const analysis = await analyzeHybrid({
        text: clean,
        source: clean ? source : 'evidencia',
        files,
        networkId: network.id,
        history,
        onStage: setStage,
      })
      const answer: Message =
        analysis.intent === 'conversacion'
          ? {
              id: `a-${Date.now()}`,
              role: 'assistant',
              text: analysis.reply ?? '',
              source: 'texto',
              reply: analysis.reply ?? '',
              engine: analysis.engine,
            }
          : { id: `a-${Date.now()}`, role: 'assistant', text: analysis.summary, source: 'texto', analysis, original: clean }
      setMessages((current) => [...current, answer])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: '',
          source: 'texto',
          error: error instanceof Error ? error.message : 'No se pudo analizar el mensaje.',
        },
      ])
    } finally {
      setThinking(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /* Voz                                                              */
  /* ---------------------------------------------------------------- */

  /** Simula la transcripción (sin micrófono o sin permiso). */
  const simulate = () => {
    if (simTimer.current) window.clearTimeout(simTimer.current)
    simTimer.current = window.setTimeout(() => stopRecording(), 2400)
  }

  const startRecording = () => {
    if (recordingRef.current) return
    setInterim('')
    transcriptRef.current = ''
    recordingRef.current = true
    setRecording(true)

    const recognition = getSpeechRecognition()
    if (recognition) {
      recognition.lang = 'es-CO'
      recognition.continuous = false
      recognition.interimResults = true
      recognition.onresult = (event) => {
        let text = ''
        for (let index = 0; index < event.results.length; index += 1) {
          text += event.results[index][0].transcript
        }
        transcriptRef.current = text
        setInterim(text)
      }
      recognition.onerror = () => {
        // sin permiso o sin micrófono: se simula la transcripción
        recognitionRef.current = null
        setMicError(true)
        simulate()
      }
      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return
        setRecording(false)
        const spoken = transcriptRef.current
        transcriptRef.current = ''
        setInterim('')
        if (spoken.trim()) send(spoken, 'voz', evidence)
      }
      recognitionRef.current = recognition
      try {
        recognition.start()
      } catch {
        recognitionRef.current = null
        setMicError(true)
        simulate()
      }
      return
    }

    // Sin reconocimiento de voz: se simula la transcripción para poder
    // demostrar el flujo (el aviso se muestra en la interfaz).
    setMicError(true)
    simulate()
  }

  const stopRecording = () => {
    if (!recordingRef.current) return
    recordingRef.current = false
    setRecording(false)

    if (simTimer.current) {
      window.clearTimeout(simTimer.current)
      simTimer.current = 0
    }

    if (recognitionRef.current) {
      const recognition = recognitionRef.current
      recognitionRef.current = null
      // el evento `onend` hace el envío con la transcripción
      recognition.stop()
      return
    }

    // modo simulación: se manda una frase de ejemplo
    const sample = VOICE_SAMPLES[Math.floor(Math.random() * VOICE_SAMPLES.length)]
    send(sample, 'voz', evidence)
  }

  /* ---------------------------------------------------------------- */
  /* Evidencia                                                        */
  /* ---------------------------------------------------------------- */

  const attachFiles = (files: FileList | null) => {
    if (!files) return
    // se copia ya: el FileList se vacía al limpiar el input justo después
    const added = [...files]
    setEvidence((current) => [...current, ...added].slice(0, 5))
  }

  const lastAnalysis = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].analysis) return messages[index].analysis
    }
    return null
  }, [messages])

  return (
    <section id="analizar-fraude" className={`scroll-mt-24 ${className}`}>
      {/* cabecera */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">
            Asistente de la red
          </p>
          <h2 className="mt-1 text-[26px] leading-tight font-extrabold text-[#1d2f57]">
            Analizar fraude
          </h2>
          <p className="mt-1 text-[13px] font-medium text-[#6b81ad]">
            Cuéntale la situación: el asistente de la red revisa el mensaje y te dice si es fraude.
          </p>
        </div>

        {/* conmutador de modo */}
        <div className="flex items-center gap-1 rounded-full bg-white/80 p-1 shadow-[0_10px_24px_-16px_rgba(30,55,130,.7)] ring-1 ring-[#dbe6f7]">
          {(
            [
              { id: 'voz', label: 'Pulsar para hablar' },
              { id: 'texto', label: 'Cambiar a chat de texto' },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setMode(option.id)
                stopRecording()
              }}
              className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition-colors duration-200 ${
                mode === option.id
                  ? 'bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] text-white shadow-[0_8px_18px_-10px_rgba(80,90,220,.9)]'
                  : 'text-[#5d76a6] hover:bg-[#eef4ff]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/60 shadow-[0_34px_70px_-32px_rgba(25,45,95,.55)] backdrop-blur-xl">
        <div className="grid min-h-0 lg:grid-cols-[1fr_320px]">
          {/* conversación */}
          <div className="flex min-h-0 flex-col">
            <header className="flex items-center gap-3 border-b border-[#dbe6f7] bg-white/70 px-4 py-3">
              <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5b7cf5] to-[#9b6ef0] text-[15px] text-white">
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
                  <path d="M12 2 3.5 5.4v6.1c0 4.6 3.7 9 8.5 10.5 4.8-1.5 8.5-5.9 8.5-10.5V5.4L12 2Zm0 4.6 4 1.6v3.3c0 2.5-1.7 4.9-4 5.9-2.3-1-4-3.4-4-5.9V8.2l4-1.6Z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-extrabold text-[#1d2f57]">
                  Asistente de verificación
                </p>
                <p className="truncate text-[10px] font-semibold text-[#8aa0c4]">
                  {community
                    ? `Red de ${community.name} · responde con el criterio de la comunidad`
                    : 'Responde con el criterio de la red de comercios'}
                </p>
              </div>
            </header>

            {/* mensajes */}
            <div
              ref={listRef}
              className="flex-1 space-y-3 overflow-y-auto bg-[#f4f8ff]/70 px-4 py-4"
              style={{ maxHeight: 460 }}
            >
              {messages.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#c9dbf6] bg-white/60 p-5 text-center">
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#eef4ff] text-[#5b7cf5]">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2Z" />
                    </svg>
                  </span>
                  <p className="mt-3 text-[12.5px] font-extrabold text-[#243d6b]">
                    {mode === 'voz'
                      ? 'Mantén pulsado el micrófono y cuéntale la situación'
                      : 'Escribe o pega el mensaje sospechoso'}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-[#8aa0c4]">
                    {mode === 'voz'
                      ? 'Se transcribe a texto y el asistente responde si es fraude o no.'
                      : 'También puedes adjuntar capturas o el comprobante como evidencia.'}
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {[
                      '¿Qué puedes hacer?',
                      '¿Qué es el SIM swap?',
                      'Me escribieron de Nequi pidiendo el código que me llegó',
                      '¿Qué hago si ya di mi clave?',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => send(suggestion, 'texto', [])}
                        className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#4a628f] ring-1 ring-[#dbe6f7] transition-colors hover:bg-[#eef4ff]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => {
                if (message.role === 'user') {
                  return (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[78%]">
                        <div className="mb-1 flex items-center justify-end gap-1.5 px-1">
                          <span className="text-[9.5px] font-bold text-[#8aa0c4]">
                            {SOURCE_LABEL[message.source]}
                          </span>
                        </div>
                        <div className="rounded-2xl rounded-br-md bg-gradient-to-br from-[#5b7cf5] to-[#9b6ef0] px-3.5 py-2 text-[12.5px] leading-relaxed font-medium text-white shadow-[0_8px_20px_-14px_rgba(30,55,130,.9)]">
                          {message.text}
                        </div>
                        {message.evidence && message.evidence.length > 0 && (
                          <ul className="mt-1.5 flex flex-wrap justify-end gap-1">
                            {message.evidence.map((file) => (
                              <li
                                key={file.name}
                                className="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[9.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7]"
                              >
                                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                                  <path d="M19 5v14H5V5h14m0-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" />
                                </svg>
                                {file.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )
                }

                const analysis = message.analysis
                if (!analysis && message.reply) {
                  return (
                    <div key={message.id} className="flex justify-start">
                      <div className="max-w-[86%]">
                        <p className="rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[12.5px] leading-relaxed font-medium whitespace-pre-line text-[#2c4478] shadow-[0_8px_20px_-14px_rgba(30,55,130,.9)]">
                          {message.reply}
                        </p>
                        <p className="mt-1 px-1 text-[9.5px] font-semibold text-[#a3b5d4]">
                          {message.engine === 'gemini'
                            ? 'Respondido con IA (Gemini)'
                            : message.engine === 'claude'
                              ? 'Respondido con IA (Claude)'
                              : 'Asistente de la red'}
                        </p>
                      </div>
                    </div>
                  )
                }
                if (!analysis) {
                  return message.error ? (
                    <div key={message.id} className="flex justify-start">
                      <p className="max-w-[92%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#c2274a] shadow-sm">
                        {message.error}
                      </p>
                    </div>
                  ) : null
                }
                const style = VERDICT_STYLE[analysis.verdict]

                return (
                  <div key={message.id} className="flex justify-start">
                    <div className="max-w-[92%]">
                      {analysis.emergency && <EmergencyBanner />}
                      <div className={`rounded-2xl rounded-bl-md border-l-4 p-3.5 ${style.card}`}>
                        <div className="flex items-center gap-2">
                          <span className={`grid h-6 w-6 place-items-center rounded-lg ${style.badge}`}>
                            {style.icon}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9.5px] font-extrabold tracking-[0.1em] uppercase ${style.badge}`}
                          >
                            {analysis.headline}
                          </span>
                          <span className="ml-auto text-[10px] font-extrabold text-[#5d76a6]">
                            riesgo {analysis.score}%
                          </span>
                        </div>

                        <p className="mt-2 text-[12.5px] leading-relaxed font-medium text-[#2c4478]">
                          {analysis.summary}
                        </p>

                        {analysis.signals.length > 0 && (
                          <ul className="mt-2.5 space-y-1.5">
                            {analysis.signals.map((signal) => (
                              <li key={signal.id} className="flex gap-2">
                                <span
                                  className={`mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full ${
                                    signal.level === 'danger' ? 'bg-[#e23b5f]' : 'bg-[#e9a13b]'
                                  }`}
                                />
                                <span className="text-[11.5px] leading-snug font-semibold text-[#3d568e]">
                                  {signal.label}
                                  <span className="block text-[10.5px] font-medium text-[#7d90b8]">
                                    {signal.detail}
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <div className="mt-3 border-t border-white/70 pt-2.5">
                          <p className="text-[9.5px] font-extrabold tracking-[0.12em] text-[#7a90b8] uppercase">
                            Qué hacer
                          </p>
                          <ul className="mt-1.5 space-y-1">
                            {analysis.actions.map((action) => (
                              <li
                                key={action}
                                className="flex gap-2 text-[11.5px] leading-snug font-medium text-[#2c4478]"
                              >
                                <span className="mt-[2px] text-[#2fb87c]">✓</span>
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <AnalysisDetails analysis={analysis} />

                        {analysis.verdict !== 'limpio' && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setAlertFrom(alertDraft(analysis, message.original ?? ''))}
                              className="rounded-full bg-[#1d2f57] px-3.5 py-1.5 text-[11px] font-bold text-white transition-transform hover:-translate-y-0.5"
                            >
                              Alertar a la red del barrio
                            </button>
                            <button
                              type="button"
                              onClick={() => setReportFor(message)}
                              className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-bold text-[#1d2f57] ring-1 ring-[#dbe6f7] transition-transform hover:-translate-y-0.5"
                            >
                              Generar denuncia
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {thinking && (
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
                    <span className="ml-2 text-[11px] font-semibold text-[#7a90b8]">{STAGE_LABEL[stage]}</span>
                  </div>
                </div>
              )}
            </div>

            {/* redactor */}
            <div className="border-t border-[#dbe6f7] bg-white/80 px-3 py-3">
              {evidence.length > 0 && (
                <ul className="mb-2 flex flex-wrap gap-1.5">
                  {evidence.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-1.5 rounded-full bg-[#eef4ff] px-2.5 py-1 text-[10px] font-bold text-[#5d76a6] ring-1 ring-[#d7e3f5]"
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden="true">
                        <path d="M19 5v14H5V5h14m0-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z" />
                      </svg>
                      {file.name}
                      <button
                        type="button"
                        onClick={() => setEvidence((current) => current.filter((_, i) => i !== index))}
                        className="text-[#8aa0c4] hover:text-[#e23b5f]"
                        aria-label={`Quitar ${file.name}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {mode === 'voz' && (
                <div className="mb-2 flex items-center gap-3">
                  <button
                    type="button"
                    onPointerDown={(event) => {
                      event.preventDefault()
                      usedPointer.current = true
                      startRecording()
                    }}
                    onPointerUp={stopRecording}
                    onPointerLeave={stopRecording}
                    onPointerCancel={stopRecording}
                    onClick={() => {
                      // Si el puntero no llegó (teclado o toque sintético),
                      // el botón alterna: un toque empieza, otro termina.
                      if (usedPointer.current) {
                        usedPointer.current = false
                        return
                      }
                      if (recording) stopRecording()
                      else startRecording()
                    }}
                    className={`flex flex-1 items-center justify-center gap-3 rounded-2xl px-4 py-3 text-[12.5px] font-bold text-white transition-all duration-200 ${
                      recording
                        ? 'scale-[0.99] bg-gradient-to-r from-[#e23b5f] to-[#f0885f] shadow-[0_12px_26px_-12px_rgba(226,59,95,.9)]'
                        : 'bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] shadow-[0_12px_26px_-12px_rgba(80,90,220,.9)]'
                    }`}
                  >
                    {recording ? <Waveform active /> : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                        <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2Z" />
                      </svg>
                    )}
                    <span>
                      {recording ? 'Escuchando… suelta para analizar' : 'Pulsar para hablar'}
                    </span>
                  </button>
                </div>
              )}

              {/* campo de texto: disponible en los dos modos */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[#8aa0c4] transition-colors duration-200 hover:bg-[#eef4ff] hover:text-[#5d76a6]"
                  aria-label="Subir evidencia"
                  title="Subir evidencia o mensaje"
                >
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
                    <path d="M17 8.5 12 3.5 7 8.5h3v6h4v-6h3ZM5 18v2h14v-2H5Z" />
                  </svg>
                </button>

                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      send(draft, 'texto', evidence)
                    }
                  }}
                  placeholder={
                    mode === 'voz'
                      ? '…o escribe aquí el mensaje sospechoso'
                      : 'Escribe o pega aquí el mensaje sospechoso…'
                  }
                  className="h-10 min-w-0 flex-1 rounded-full border border-[#dbe6f7] bg-[#f7faff] px-4 text-[12.5px] font-medium text-[#2c4478] outline-none transition-colors duration-200 placeholder:text-[#a3b5d4] focus:border-[#9dbdf0] focus:bg-white"
                  aria-label="Mensaje"
                />

                <button
                  type="button"
                  onClick={() => send(draft, 'texto', evidence)}
                  disabled={!draft.trim() && evidence.length === 0}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5b7cf5] to-[#9b6ef0] text-white shadow-[0_10px_20px_-10px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                  aria-label="Enviar"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12 2-12 2v6.4Z" />
                  </svg>
                </button>
              </div>

              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,audio/*,.ogg,.opus,.m4a,.txt,.md"
                className="hidden"
                onChange={(event) => {
                  attachFiles(event.target.files)
                  event.target.value = ''
                }}
              />

              {/* estado de la transcripción */}
              {(recording || interim) && (
                <p className="mt-2 text-[10.5px] font-semibold text-[#7a90b8]">
                  {recording
                    ? 'Transcribiendo tu voz…'
                    : `Transcripción: «${interim}»`}
                </p>
              )}
              {supported === false && mode === 'voz' && !micError && (
                <p className="mt-2 text-[10.5px] font-medium text-[#8aa0c4]">
                  Este navegador no reconoce la voz: se simula la transcripción para probar el flujo.
                </p>
              )}
              {micError && mode === 'voz' && (
                <p className="mt-2 text-[10.5px] font-medium text-[#8aa0c4]">
                  No se pudo acceder al micrófono: se simula la transcripción para probar el flujo.
                </p>
              )}
            </div>
          </div>

          {/* panel del análisis */}
          <aside className="border-t border-[#dbe6f7] bg-white/60 p-5 lg:border-t-0 lg:border-l">
            <p className="text-[10.5px] font-bold tracking-[0.16em] text-[#7a90b8] uppercase">
              Análisis
            </p>

            {lastAnalysis ? (
              <>
                <div
                  className={`mt-3 rounded-2xl border-l-4 p-3.5 ${VERDICT_STYLE[lastAnalysis.verdict].card}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-lg ${VERDICT_STYLE[lastAnalysis.verdict].badge}`}
                    >
                      {VERDICT_STYLE[lastAnalysis.verdict].icon}
                    </span>
                    <span
                      className={`text-[11.5px] font-extrabold ${VERDICT_STYLE[lastAnalysis.verdict].label}`}
                    >
                      {lastAnalysis.headline}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/80">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-[#5b7cf5] to-[#e23b5f]"
                        style={{ width: `${lastAnalysis.score}%` }}
                      />
                    </span>
                    <span className="text-[11px] font-extrabold text-[#3d568e]">
                      {lastAnalysis.score}%
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-[10px] font-bold tracking-[0.14em] text-[#7a90b8] uppercase">
                  Comprobaciones
                </p>
                <ul className="mt-2 space-y-1.5">
                  {lastAnalysis.checks.map((check) => (
                    <li key={check.label} className="flex items-start gap-2">
                      <span
                        className={`mt-[2px] grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-black ${
                          check.ok ? 'bg-[#d9f5e6] text-[#1d7a53]' : 'bg-[#ffe0e6] text-[#c2274a]'
                        }`}
                      >
                        {check.ok ? '✓' : '!'}
                      </span>
                      <span className="text-[11px] leading-snug font-semibold text-[#4a628f]">
                        {check.label}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-4 text-[10px] font-bold tracking-[0.14em] text-[#7a90b8] uppercase">
                  Señales ({lastAnalysis.signals.length})
                </p>
                <ul className="mt-2 space-y-1.5">
                  {lastAnalysis.signals.length === 0 && (
                    <li className="text-[11px] font-medium text-[#8aa0c4]">
                      Ninguna señal de riesgo detectada.
                    </li>
                  )}
                  {lastAnalysis.signals.map((signal) => (
                    <li key={signal.id} className="flex items-start gap-2">
                      <span
                        className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${
                          signal.level === 'danger' ? 'bg-[#e23b5f]' : 'bg-[#e9a13b]'
                        }`}
                      />
                      <span className="text-[11px] leading-snug font-semibold text-[#4a628f]">
                        {signal.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-[#c9dbf6] bg-white/60 p-4">
                <p className="text-[11.5px] leading-relaxed font-medium text-[#6b81ad]">
                  Cuando cuentes una situación, aquí verás el resultado del análisis: el veredicto, el
                  nivel de riesgo, las señales detectadas y la lista de comprobaciones.
                </p>
                <ul className="mt-3 space-y-1.5">
                  {[
                    'Verificamos remitente, enlaces y permisos que pide',
                    'Comparamos con los avisos de la comunidad',
                    'Te decimos qué hacer y a quién reportar',
                  ].map((item) => (
                    <li key={item} className="flex gap-2 text-[10.5px] font-semibold text-[#8aa0c4]">
                      <span className="text-[#2fb87c]">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <EntityLookup className="mt-5" />

            <div className="mt-3 rounded-2xl border border-[#dbe6f7] bg-white/80 p-3">
              <p className="flex items-center gap-1.5 text-[9.5px] font-bold tracking-[0.14em] text-[#7a90b8] uppercase">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    status === null ? 'bg-[#a3b5d4]' : status === 'offline' ? 'bg-[#e9a13b]' : status.ai_enabled ? 'bg-[#2fb87c]' : 'bg-[#5b7cf5]'
                  }`}
                />
                Motor de análisis
              </p>
              <p className="mt-1.5 text-[10.5px] leading-relaxed font-medium text-[#8aa0c4]">
                {status === null
                  ? 'Conectando…'
                  : status === 'offline'
                    ? 'Sin servidor: el análisis, la lectura de capturas y la detección de objetos se hacen en su navegador.'
                    : status.ai_enabled
                      ? `IA activa (${status.provider === 'gemini' ? 'Gemini' : 'Claude'}): responde preguntas, lee capturas, entiende el contexto y revisa comprobantes, cruzado con los reportes de la comunidad.`
                      : 'Motor local del servidor: reglas, análisis de enlaces y base comunitaria. Las capturas se leen en su navegador.'}
              </p>
              <p className="mt-2 text-[9.5px] font-bold tracking-[0.14em] text-[#7a90b8] uppercase">Privacidad</p>
              <p className="mt-1 text-[10.5px] leading-relaxed font-medium text-[#8aa0c4]">
                Los mensajes y capturas que analiza no se guardan: sólo se registra, de forma anónima, el tipo
                de fraude para las estadísticas del barrio. A las imágenes se les borran los metadatos.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {alertFrom && (
        <AlertComposer
          network={network}
          community={community ?? null}
          draft={alertFrom}
          onClose={() => setAlertFrom(null)}
        />
      )}
      {reportFor?.analysis && (
        <ReportModal
          analysis={reportFor.analysis}
          original={reportFor.original ?? ''}
          place={community ? `${community.name}, ${network.neighborhood} (Bogotá)` : `${network.neighborhood} (Bogotá)`}
          onClose={() => setReportFor(null)}
        />
      )}
    </section>
  )
}
