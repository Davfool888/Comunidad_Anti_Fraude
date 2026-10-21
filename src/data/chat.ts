import type { Community, CommunityNetwork } from './networks'

/**
 * Chat de la comunidad.
 *
 * Cada comunidad de barrio tiene su propio grupo de chat con los dueños de
 * los comercios del barrio. La conversación mezcla mensajes normales de los
 * comerciantes con **avisos de la comunidad**, que se distinguen por color:
 *
 *   · rojo    → incidente ya ocurrido (fraude confirmado, suplantación…)
 *   · amarillo → precaución o recordatorio
 *   · azul    → comunicado de la red
 *
 * Todo es simulado, pero **determinista**: la misma comunidad muestra siempre
 * la misma conversación.
 */

/** Nivel de un aviso de la comunidad. */
export type ChatLevel = 'danger' | 'warning' | 'info'

/** Integrante de la comunidad con el que se puede hablar. */
export type ChatParticipant = {
  id: string
  /** Nombre del comercio. */
  name: string
  /** Tipo de comercio (panadería, farmacia…). */
  business: string
  /** Iniciales del avatar. */
  initials: string
  /** Color del avatar. */
  color: string
  /** Commerce verificado por la red. */
  verified: boolean
  /** En línea ahora mismo. */
  online: boolean
}

/** Mensaje del chat. */
export type ChatMessage = {
  id: string
  /** `message` = conversación; `alert` = aviso de la comunidad. */
  kind: 'message' | 'alert'
  /** Color del aviso (sólo en `alert`). */
  level?: ChatLevel
  /** Identificador del comercio que escribió o reportó. */
  participantId: string | null
  /** Nombre visible del autor. */
  author: string
  /** Texto del mensaje. */
  text: string
  /** Día legible: «Hoy», «Ayer», «Domingo 12 de mayo». */
  day: string
  /** Hora legible: «09:42». */
  time: string
  /** Marca de tiempo (para ordenar). */
  at: number
}

/** Grupo completo de una comunidad. */
export type CommunityChat = {
  participants: ChatParticipant[]
  messages: ChatMessage[]
}

/* ------------------------------------------------------------------ */
/* Colores de avatar                                                   */
/* ------------------------------------------------------------------ */

/** Colores de avatar. */
const AVATAR_COLORS = [
  '#5b7cf5',
  '#9b6ef0',
  '#2fb8a6',
  '#f08a5d',
  '#e0629b',
  '#4aa3e0',
  '#8ab63e',
  '#d9a441',
]

/* ------------------------------------------------------------------ */
/* Texto de la conversación                                            */
/* ------------------------------------------------------------------ */

/** Mensajes normales de los dueños de los comercios. */
const CHAT_LINES = [
  '¿Alguien ha revisado el comprobante que llegó por WhatsApp? Dice que es de la red, pero el monto no coincide.',
  'Ya validé el código que me pidieron y estaba mal generado. Ya lo reporté como intento de fraude.',
  'Confirmo que la app ya me muestra los comercios verificados del barrio.',
  '¿Alguien abre temprano el jueves? Tengo una entrega a las 8:00.',
  'Me llegó una transferencia de más y no sé de qué se trata.',
  'El muchacho de la carnicería avisó que le pidieron un comprobante con la clave de su comercio. Ojo con eso.',
  'Yo ya verifiqué a un cliente que no conozco de nada. Le pedí documento y todo.',
  'La semana que viene revisan las cajas en el barrio, mejor tener los comprobantes al día.',
  '¿Alguien sabe a qué hora abre la central? Necesito confirmar un envío.',
  'Viendo el movimiento de la mañana, todo tranquilo por aquí.',
  'Me llegó el aviso de que renuevan la app. Ojalá no nos cambie nada de la plataforma.',
  'Gracias al que avisó lo del falso comprobante, casi caigo en esa.',
  '¿Tienen de repuesto el lector de códigos? El mío se dañó.',
  'Estoy contando el inventario nuevo, me faltan dos referencias.',
  'Nos llega muchísima gente con dudas de la red. La mayoría sí verifica.',
  'Colectamos el pedido del barrio y entregamos en la tarde, sin recargo.',
  'Me parece que la alerta de ayer era un intento de suplantación, no un robo real.',
  '¿Alguien tiene el número del técnico que arregla las balanzas?',
  'Todo en orden por acá. La app va como reloj.',
  'Estaba pensando en hacer un pedido en conjunto para los envíos del barrio, ¿les interesa?',
  'Confirmado: el saldo que me transfirieron no era el correcto. Ya lo reporté.',
  'Saludos a todos, hoy abrimos un poco más tarde por la lluvia.',
  'El de la ferretería me escribió que le apareció un cobro doble, estamos revisando eso.',
  'Me gusta estar en contacto, seguimos en la red. Abrazo a todos.',
]

/** Avisos rojos: incidentes yarockoccurred. */
const ALERT_DANGER = [
  'Incidente confirmado: un cliente presentó un comprobante falso por $2.400.000. Se bloqueó la operación y el caso ya está en la central de la red.',
  'Alerta roja: dos personas con cédulas clonadas intentaron hacer retiros en tres comercios del barrio esta mañana. Todos verificamos antes de entregar.',
  'Intento de suplantación: llamaron desde un número falso haciéndose pasar por la central de la red. Ningún comercio entrega datos por teléfono.',
  'Incidente: una compra de electrónica por $8.900.000 se cobró dos veces. Devolución en proceso y aviso enviado a todos los comercios.',
  'Alerta roja: varios intentos de robo con tarjeta clonada en la misma hora. Se pide máximo cuidado con los pagos con datáfono.',
]

/** Avisos amarillos: precauciones y recordatorios. */
const ALERT_WARNING = [
  'Precaución: están circulando mensajes que piden el código de verificación por SMS. No lo compartan, ni siquiera con quien se identifique como la red.',
  'Atención: el pago con tarjeta está demorando varios minutos. Verifiquen el saldo antes de despachar el pedido.',
  'Recordatorio: no entreguen productos sin registrar la venta en la app. Esta semana detectamos tres ventas sin comprobante.',
  'Precaución con los envíos de última hora: hay dos transportadores cobrando el doble del valor pactado.',
  'Recordatorio: los comprobantes de los envíos de hoy deben quedar adjuntos en la app antes de medianoche.',
]

/** Avisos azules: comunicados de la red. */
const ALERT_INFO = [
  'Comunicado: desde hoy la red exige verificación en dos pasos para todos los comercios del barrio.',
  'Actualización: cada comunidad ya tiene su propio panel de incidentes y puede revisar los avisos del barrio.',
  'Reunión de red el jueves a las 7:00 p. m. en la panadería del barrio. Traer agendas.',
  'Nuevo módulo en la app: los avisos de la comunidad llegan también por WhatsApp, con el nombre del comercio que lo reportó.',
  'Comunicado: los comercios verificados de la comunidad aparecerán con insignia azul en el buscador de la red.',
  'Calendario: la próxima jornada de prevención de fraude es el próximo martes en el salón de la comunidad.',
]

/** Etiqueta de cada tipo de aviso. */
export const ALERT_LABEL: Record<ChatLevel, string> = {
  danger: 'Incidente',
  warning: 'Precaución',
  info: 'Comunicado',
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

/** Generador determinista: la misma comunidad siempre da los mismos datos. */
function seeded(seed: number) {
  let value = seed * 9301 + 49297
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

function hash(text: string) {
  let value = 0
  for (let index = 0; index < text.length; index += 1) {
    value = (value * 31 + text.charCodeAt(index)) % 100003
  }
  return value
}

const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/** Etiqueta del día: «Hoy», «Ayer» o «Domingo 12 de mayo». */
function dayLabel(date: Date, now: Date) {
  const startOf = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
  const days = Math.round((startOf(now) - startOf(date)) / 86_400_000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`
}

/** Hora en formato 24 h: «09:42». */
function timeLabel(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function initialsOf(name: string) {
  const words = name
    .split(' ')
    .filter((word) => word.length > 2 && !['El', 'La', 'Los', 'Las', 'De', 'Y'].includes(word))
  if (words.length === 0) return name.slice(0, 2).toUpperCase()
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

/* ------------------------------------------------------------------ */
/* Construcción del chat                                               */
/* ------------------------------------------------------------------ */

/**
 * Construye el grupo de chat de una comunidad: sus integrantes y la
 * conversación (mensajes de los comercios y avisos de la comunidad).
 */
export function buildChat(network: CommunityNetwork, community: Community): CommunityChat {
  const random = seeded(hash(`${network.id}-${community.id}-chat`))

  // --- integrantes: los comercios del barrio ------------------------------
  // Son los mismos que aparecen como edificios en la escena 3D.
  const participants: ChatParticipant[] = community.businesses.map((business, index) => ({
    id: business.id,
    name: business.name,
    business: business.business,
    initials: initialsOf(business.name),
    color: AVATAR_COLORS[(index + hash(community.id)) % AVATAR_COLORS.length],
    verified: business.satisfaction > 88,
    online: random() > 0.45,
  }))

  // --- conversación ------------------------------------------------------
  const now = Date.now()
  // antiquity in minutes: the conversation is spread over the last 3 days
  const offsets = [
    2_940, 2_880, 2_760, 1_650, 1_620, 1_180, 900, 860, 640, 430, 395, 250, 190, 120, 96, 42, 26,
    11, 4,
  ]

  const messages: ChatMessage[] = []
  let lineIndex = Math.floor(random() * CHAT_LINES.length)
  let dangerIndex = Math.floor(random() * ALERT_DANGER.length)
  let warningIndex = Math.floor(random() * ALERT_WARNING.length)
  let infoIndex = Math.floor(random() * ALERT_INFO.length)

  // El color de los avisos se alterna en barajar el orden, de modo que toda
  // conversación tenga al menos un incidente, una precaución y un comunicado.
  const levels: ChatLevel[] = ['danger', 'warning', 'info']
  for (let index = levels.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    const keep = levels[index]
    levels[index] = levels[swap]
    levels[swap] = keep
  }
  let levelIndex = 0

  offsets.forEach((minutes, index) => {
    const at = now - minutes * 60_000
    const date = new Date(at)
    const participant = participants[index % participants.length]

    // every 4 messages an alert is interleaved
    const isAlert = index % 4 === 3

    if (isAlert) {
      const level = levels[levelIndex++ % levels.length]
      const text =
        level === 'danger'
          ? ALERT_DANGER[dangerIndex++ % ALERT_DANGER.length]
          : level === 'warning'
            ? ALERT_WARNING[warningIndex++ % ALERT_WARNING.length]
            : ALERT_INFO[infoIndex++ % ALERT_INFO.length]

      messages.push({
        id: `${community.id}-a${index}`,
        kind: 'alert',
        level,
        participantId: participant.id,
        author: participant.name,
        text,
        day: dayLabel(date, new Date(now)),
        time: timeLabel(date),
        at,
      })
      return
    }

    messages.push({
      id: `${community.id}-m${index}`,
      kind: 'message',
      participantId: participant.id,
      author: participant.name,
      text: CHAT_LINES[lineIndex++ % CHAT_LINES.length],
      day: dayLabel(date, new Date(now)),
      time: timeLabel(date),
      at,
    })
  })

  messages.sort((a, b) => a.at - b.at)

  return { participants, messages }
}

/**
 * Respuesta automática de un integrante del grupo (para cuando el usuario
 * escribe un mensaje). Se elige de forma determinista según el texto.
 */
export function autoReply(text: string): string {
  const lower = text.toLowerCase()
  if (lower.includes('gracias')) return '¡Con gusto! Aquí estamos para lo que haga falta.'
  if (lower.includes('fraud') || lower.includes('fraude'))
    return 'Lo reviso y si es cierto lo reporto desde la app en un minuto.'
  if (lower.includes('reunión') || lower.includes('reunion'))
    return 'Ahí estaré. Yo llevo la lista de los que han confirmado.'
  if (lower.includes('?') || lower.includes('¿'))
    return 'Buena pregunta, lo confirmo con el resto del grupo y te aviso.'
  if (lower.includes('hola') || lower.includes('buenos'))
    return '¡Hola! ¿En qué te echo una mano?'
  return 'Anotado, gracias por avisar. Lo dejamos registrado en el grupo.'
}
