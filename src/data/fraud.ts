/**
 * Motor de análisis de fraude.
 *
 * Lee el mensaje (transcrito de la voz, escrito o pegado) y devuelve un
 * veredicto: **fraude**, **sospechoso** o **limpio**, con las señales
 * detectadas, las acciones recomendadas y una lista de comprobaciones.
 *
 * Todo ocurre en el navegador: son reglas sobre el texto, sin envío a ningún
 * servidor.
 */

/** Veredicto del análisis. */
export type FraudVerdict = 'fraude' | 'sospechoso' | 'limpio'

/** Señal detectada en el mensaje. */
export type FraudSignal = {
  id: string
  /** Etiqueta corta: «Código de verificación». */
  label: string
  /** Por qué es peligroso. */
  detail: string
  /** Peso de la señal (1 leve, 3 grave). */
  weight: number
  level: 'danger' | 'warning'
}

/** Punto de la lista de comprobaciones. */
export type FraudCheck = {
  label: string
  ok: boolean
}

/** Resultado del análisis. */
export type FraudAnalysis = {
  verdict: FraudVerdict
  /** Puntuación de riesgo de 0 a 100. */
  score: number
  /** Titular de una línea. */
  headline: string
  /** Explicación breve. */
  summary: string
  signals: FraudSignal[]
  actions: string[]
  checks: FraudCheck[]
  /** De dónde salió el mensaje. */
  source: 'voz' | 'texto' | 'evidencia'
}

/* ------------------------------------------------------------------ */
/* Reglas                                                              */
/* ------------------------------------------------------------------ */

type Rule = {
  id: string
  label: string
  detail: string
  weight: number
  level: 'danger' | 'warning'
  patterns: RegExp[]
}

const RULES: Rule[] = [
  {
    id: 'otp',
    label: 'Pide un código de verificación',
    detail:
      'Ningún comercio ni la red pide códigos de un solo uso. Es la técnica más usada para vaciar cuentas.',
    weight: 3,
    level: 'danger',
    patterns: [
      /codigo de (verificacion|seguridad|un solo uso)/i,
      /\botp\b/i,
      /clave dinamica/i,
      /codigo que le enviamos/i,
      /el codigo que le mandamos/i,
      /c(ó|o)digo (que|que le|que nos|recib)/i,
      /pasa(r|me)? (el |tu |su |un )?c(ó|o)digo/i,
    ],
  },
  {
    id: 'credenciales',
    label: 'Pide contraseñas, PIN o datos de tarjeta',
    detail: 'Las claves y los datos de tarjeta nunca se piden por mensaje ni por teléfono.',
    weight: 3,
    level: 'danger',
    patterns: [
      /(contrasena|password|clave de acceso|pin)/i,
      /(datos|tarjeta|clave) de (mi |tu |la |el |sus |los )?(tarjeta|credito|debito|datos)/i,
      /numero de tarjeta/i,
      /\bcvv\b/i,
      /(clave|pin) de (seguridad|retiro)/i,
      /(datos|informacion) (bancarios|personales|privados)/i,
    ],
  },
  {
    id: 'actualizar',
    label: 'Pide actualizar datos o credenciales',
    detail: 'Ningún comercio ni la red le pide que "actualice" sus datos por un enlace o un mensaje.',
    weight: 2,
    level: 'warning',
    patterns: [
      /actualiz(e|a|ar|ando) (mis |sus |tus |los |la |el )?(datos|informacion|contrasena|clave)/i,
      /(cambia|cambiar|restablec) (mi |la |el |sus )?(contrasena|clave|pin)/i,
      /vincular (mi |la |el )?(cuenta|tarjeta)/i,
    ],
  },
  {
    id: 'suplantacion',
    label: 'Se hace pasar por el banco o por la red',
    detail:
      'Si dice ser del banco o de la red de comercios, cuelgue: la red nunca pide datos por teléfono.',
    weight: 3,
    level: 'danger',
    patterns: [
      /(te|me) escribo de parte del (banco|red)/i,
      /soy (el|un) (empleado|asesor) (del|de la) (banco|red)/i,
      /red segura de comercios/i,
      /(banco|red) (te|le) (va a )?(contactar|lLAMar|llamará)/i,
      /no (uses|use) la (app|aplicacion) oficial/i,
    ],
  },
  {
    id: 'enlace',
    label: 'Incluye un enlace sospechoso',
    detail: 'Los enlaces acortados y los dominios raros suelen llevar a páginas falsas de cobro.',
    weight: 2,
    level: 'warning',
    patterns: [
      /(bit\.ly|tinyurl|t\.me|wa\.me|is\.gd|cutt\.ly)/i,
      /https?:\/\/\S+/i,
      /\b\w+\.(xyz|top|tk|ml|ga|cf|gq|zip|mov|click)\b/i,
    ],
  },
  {
    id: 'urgencia',
    label: 'Usa urgencia o amenazas',
    detail:
      'La prisa artificial existe para que no se piense. Un comercio verificado puede esperar.',
    weight: 2,
    level: 'warning',
    patterns: [
      /urgente/i,
      /(ultima|última) (hora|momento|oportunidad)/i,
      /(si no| Sino) (pagas|paga|haces|haces|recibes|recibir)/i,
      /(tu|cuenta) (sera|sera|será) (bloqueada|suspendida|cerrada)/i,
      /(pierdes|perdera) (el|la|tu) (dinero|pago|pedido)/i,
      /(solo|tienes) (hasta|antes de) las? \d{1,2}/i,
    ],
  },
  {
    id: 'transferencia',
    label: 'Pide una transferencia o un pago anticipado',
    detail: 'Las transferencias sin comprobante verificado son el patrón clásico del fraude.',
    weight: 2,
    level: 'warning',
    patterns: [
      /(transfer|transfier|consign|envia|envia|manda) (a |el |la )?(mi |tu |un |una )?(cuenta|banco|dinero|pago)/i,
      /pse|nequi|daviplata|western union|westernunion/i,
      /paga (primero|antes|ya)/i,
      /a nombre de (tercero|otra persona)/i,
      /(autorizar|aprobar) (un |el |la )?pago/i,
    ],
  },
  {
    id: 'premio',
    label: 'Promete un premio o unaAlejandería giveaway',
    detail: 'Premios que hay que "reclamar" pagando datos son estafas.',
    weight: 3,
    level: 'danger',
    patterns: [
      /(ganaste|ganador|premio|sorteo)/i,
      /(reclama|reclame) (tu|el) (dinero|premio)/i,
      /te (va a|van a) (llegar|regalar) (un|una) (millon|millón)/i,
    ],
  },
  {
    id: 'aplicacion',
    label: 'Pide instalar una app o dar permisos',
    detail: 'Permitir notificaciones o instalar una app desconocida es la puerta de entrada al robo de datos.',
    weight: 3,
    level: 'danger',
    patterns: [
      /(instala(r|e|ando)?|descarga(r|ando)?) (una |un |la |el )?(app|aplicacion|aplicación|programa)/i,
      /(permite|habilita|autoriza) (los |las )?(accesos|permisos|notificaciones)/i,
      /(acceso|control) (remoto|a distancia) (al|de) (telefono|celular|equipo)/i,
    ],
  },
  {
    id: 'numero',
    label: 'Remitente con prefijo internacional',
    detail: 'Los prefijos internacionales son la primera pista de un fraude internacional.',
    weight: 1,
    level: 'warning',
    patterns: [
      /\+\d{1,3}[\s-]?\d{2,4}[\s-]?\d{3,4}/,
      /(numero|n(ú|u)mero) (extranjero|internacional|de otro pais)/i,
      /prefijo internacional/i,
    ],
  },
  {
    id: 'mayusculas',
    label: 'Mensaje con mayúsculas y signos de exclamación',
    detail: 'El tono agresivo busca una respuesta inmediata por miedo.',
    weight: 1,
    level: 'warning',
    patterns: [/!{2,}/, /\b(URGENTE|ACTUALIZA|CUENTA BLOQUEADA)\b/],
  },
  {
    id: 'vacio',
    label: 'Mensaje demasiado escueto',
    detail: 'Sin contexto, sin comercio identificable y sin comprobante.',
    weight: 1,
    level: 'warning',
    patterns: [],
  },
]

/* ------------------------------------------------------------------ */
/* Análisis                                                            */
/* ------------------------------------------------------------------ */

/** Quita acentos y pasa a minúsculas para comparar. */
function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Evidencia adjunta. */
export type Evidence = {
  name: string
  kind: 'imagen' | 'documento' | 'mensaje'
  size?: number
}

const VERDICT_COPY: Record<
  FraudVerdict,
  { headline: string; summary: string; tone: 'danger' | 'warning' | 'ok' }
> = {
  fraude: {
    headline: 'Esto es un fraude',
    summary:
      'El mensaje encaja con un patrón de fraude conocido. No responda, no transfiera y repórtelo a la red.',
    tone: 'danger',
  },
  sospechoso: {
    headline: 'Es sospechoso, verifique antes de actuar',
    summary:
      'Hay señales de alerta, pero no son concluyentes. Confirme con el comercio por otro canal antes de pagar.',
    tone: 'warning',
  },
  limpio: {
    headline: 'No parece fraude',
    summary:
      'No se detectaron señales de riesgo en el mensaje. Aun así, verifique siempre contra la red de comercios.',
    tone: 'ok',
  },
}

/**
 * Analiza un mensaje (y sus evidencias) y devuelve el veredicto.
 */
export function analyzeFraud(input: {
  text: string
  evidence?: Evidence[]
  source?: 'voz' | 'texto' | 'evidencia'
}): FraudAnalysis {
  const text = input.text ?? ''
  const normalized = normalize(text)
  const evidence = input.evidence ?? []
  const source = input.source ?? 'texto'

  const signals: FraudSignal[] = []

  RULES.forEach((rule) => {
    if (rule.patterns.length === 0) return
    const found = rule.patterns.some((pattern) => pattern.test(normalized))
    if (!found) return
    signals.push({
      id: rule.id,
      label: rule.label,
      detail: rule.detail,
      weight: rule.weight,
      level: rule.level,
    })
  })

  // Un mensaje escueto sin contexto también es una señal
  if (text.trim().length < 24 && signals.length === 0) {
    signals.push({
      id: 'vacio',
      label: 'Mensaje demasiado escueto',
      detail: 'Sin contexto, sin comercio identificable y sin comprobante.',
      weight: 1,
      level: 'warning',
    })
  }

  // Las evidencias aportan señales según su tipo
  evidence.forEach((file) => {
    if (file.kind === 'documento') {
      signals.push({
        id: 'evidencia-comprobante',
        label: 'Se adjuntó un comprobante o documento',
        detail:
          'Los comprobantes se validan en la app de la red: contraste el monto, el remitente y la hora.',
        weight: 1,
        level: 'warning',
      })
    }
    if (file.kind === 'imagen') {
      signals.push({
        id: 'evidencia-imagen',
        label: 'Se adjuntó una captura como evidencia',
        detail:
          'Las capturas se conservan como respaldo del reporte a la red comunitaria.',
        weight: 1,
        level: 'warning',
      })
    }
  })

  const score = Math.min(
    100,
    signals.reduce((total, signal) => {
      const factor = signal.weight === 3 ? 45 : signal.weight === 2 ? 20 : 7
      return total + factor
    }, 0),
  )

  const verdict: FraudVerdict = score >= 45 ? 'fraude' : score >= 18 ? 'sospechoso' : 'limpio'
  const copy = VERDICT_COPY[verdict]

  const actions: string[] = []
  if (verdict === 'fraude') {
    actions.push('No responda al mensaje ni devuelva la llamada.')
    actions.push('No transfiera dinero ni envíe códigos de un solo uso.')
    actions.push('Denuncie el caso desde la app: queda registrado en la red del barrio.')
    if (signals.some((signal) => signal.id === 'otp' || signal.id === 'credenciales')) {
      actions.push('Si ya compartió datos, cambie sus claves y avise al banco ahora mismo.')
    }
    actions.push('Guarde capturas del mensaje y del número remitente.')
  } else if (verdict === 'sospechoso') {
    actions.push('Verifique con el comercio por otro canal: llamada del número oficial o chat de la app.')
    actions.push('No pagues ni entregues datos hasta confirmar la operación.')
    actions.push('Reporte el mensaje a la red para que el barrio lo tenga en cuenta.')
  } else {
    actions.push('Confirme igualmente la operación en la app de la red de comercios.')
    actions.push('Guarde el comprobante del pago junto con la conversación.')
    actions.push('Si el mensaje cambia o pide algo raro, repórtelo de inmediato.')
  }

  const has = (id: string) => signals.some((signal) => signal.id === id)
  const checks: FraudCheck[] = [
    {
      label: 'No pide códigos, contraseñas ni datos de tarjeta',
      ok: !has('otp') && !has('credenciales'),
    },
    { label: 'El remitente es un número o correo desconocido', ok: !has('numero') },
    { label: 'No usa urgencia ni amenazas', ok: !has('urgencia') },
    { label: 'Los enlaces apuntan a dominios de confianza', ok: !has('enlace') },
    { label: 'No se hace pasar por el banco ni por la red', ok: !has('suplantacion') },
  ]

  return {
    verdict,
    score,
    headline: copy.headline,
    summary: copy.summary,
    signals: signals.sort((a, b) => b.weight - a.weight),
    actions,
    checks,
    source,
  }
}

/* ------------------------------------------------------------------ */
/* Modo voz                                                            */
/* ------------------------------------------------------------------ */

/** Frases de ejemplo para la transcripción simulada (sin reconocimiento de voz). */
export const VOICE_SAMPLES = [
  'Buenas, me llegó un mensaje de un supuesto empleado del banco que me pide el código de verificación que me enviaron por WhatsApp, ¿eso es normal?',
  'Hola, un cliente me está pidiendo que le transfiera a otra cuenta y dice que es de la red segura de comercios, ¿qué hago?',
  'Recibí un correo con un enlace para actualizar mis datos de la tarjeta, ¿es legítimo?',
  'Me están llamando de un número con prefijo internacional para autorizar un pago, ¿puedo colgar?',
  'Un tipo me dice que gané un premio y que debo reclamar el dinero, ¿es falso?',
  'Me piden instalar una aplicación en el celular para ver el estado de mi cuenta, ¿es seguro?',
  'Un comercio me mandó un comprobante de pago por dos millones, ¿cómo lo verifico?',
  'Estoy en el local y el dueño me está presionando para que le pase el código que le llegó al celular, ¿qué hago?',
]

/** Etiqueta corta de la fuente del mensaje. */
export const SOURCE_LABEL: Record<'voz' | 'texto' | 'evidencia', string> = {
  voz: 'Mensaje transcrito por voz',
  texto: 'Mensaje escrito',
  evidencia: 'Evidencia adjunta',
}
