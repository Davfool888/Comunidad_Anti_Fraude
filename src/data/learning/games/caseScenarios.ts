import type { Scenario } from '../types'

/**
 * Escenarios visuales de los casos que no son preguntas: los de Detectives
 * digitales, los de Encuentra las diferencias, el del Laboratorio de
 * evidencias y los de las fases de Protege tu cuenta.
 */
export const DETECTIVE_SCENARIOS: Record<string, Scenario> = {
  'dete-1': {
    situation:
      'Son las 11 de la noche y el teléfono vibra. El mensaje dice que es del banco y que tienes quince minutos.',
    characters: [
      { name: 'Banco (ficticio)', role: 'remitente del mensaje' },
      { name: 'Tú', role: 'cliente que recibe el aviso' },
    ],
    visual: {
      kind: 'sms',
      from: 'BANCO AURORA',
      time: '23:04',
      body:
        'Su cuenta será suspendida en 15 minutos si no verifica sus datos. Confirme su clave y el código de 6 dígitos: https://banco-aurora-verificar.acceso-total.invalid/verificacion',
    },
    instruction:
      'Toca los fragmentos del mensaje que te parecen señales de alerta. Después elegirás cómo actuar.',
  },
  'dete-2': {
    situation:
      'Eres la persona a la que escriben. El número es nuevo y no lo tienes guardado, pero el mensaje dice cosas que solo diría tu familia.',
    characters: [
      { name: 'Número desconocido', role: 'supuesto familiar' },
      { name: 'Tú', role: 'persona que recibe el mensaje' },
    ],
    visual: {
      kind: 'chat',
      messages: [
        { from: 'contacto', text: 'Mamá, soy yo, el nuevo. Perdí el celular.', time: '21:15' },
        { from: 'contacto', text: 'Necesito que me transfieras $800.000 urgente, no puedo hablar estoy en una reunión.', time: '21:15' },
        { from: 'contacto', text: '¿te acuerdas de mi colegio? Yo nací el 14 de marzo.', time: '21:16' },
      ],
    },
    instruction:
      'Marca las señales del mensaje y decide si vas a transferir o a verificar primero.',
  },
  'dete-3': {
    situation:
      'Encontraste la oferta en un portal de empleo. El salario es alto, la entrevista no hizo falta y el proceso incluye un pago.',
    characters: [
      { name: 'Reclutador', role: 'supuesto responsable de selección' },
      { name: 'Tú', role: 'persona que busca empleo' },
    ],
    visual: {
      kind: 'email',
      from: 'Selección Remota <seleccion@empleo-oportunidad.info>',
      subject: 'Selected: Remote Operations Analyst',
      body:
        'Le informamos que fue seleccionado sin entrevista por su perfil. Para activar su cuenta y emitir el contrato debe realizar un pago de inscripción de $180.000 antes del cierre de la vacante.',
    },
    instruction:
      'Clasifica cada elemento de la oferta: qué es señal de alerta y qué es solo información por verificar.',
  },
  'dete-4': {
    situation:
      'Compraste hace una semana y hoy te avisan de que el pedido salió. El mensaje no pide nada y no tiene plazo.',
    characters: [
      { name: 'Tienda Sol (ficticia)', role: 'remitente del aviso' },
      { name: 'Tú', role: 'cliente' },
    ],
    visual: {
      kind: 'email',
      from: 'Tienda Sol <pedidos@tienda-sol.invalid>',
      subject: 'Tu pedido #4521 salió hoy',
      body:
        'Hola, tu pedido #4521 salió hoy. Puedes seguirlo aquí: https://tienda-sol.invalid/pedidos/4521. Te avisamos por correo porque pediste no recibir SMS.',
    },
    instruction:
      'Este caso no tiene señales claras. Marca lo que consideres verificable y decide cómo actuar.',
  },
}

export const COMPARE_SCENARIOS: Record<string, Scenario> = {
  'cmp-1': {
    situation:
      'Comparas dos publicaciones de equipos de cocina usados. Una tiene página propia y datos; la otra es un anuncio suelto con un descuento enorme.',
    characters: [{ name: 'Tú', role: 'comprador que compara' }],
    visual: {
      kind: 'entorno',
      items: [
        { label: 'Publicación 1', value: 'Tienda Aurora · página con condiciones' },
        { label: 'Publicación 2', value: 'Electro Barato · anuncio en redes' },
        { label: 'Lo que buscas', value: 'comparar antes de pagar' },
      ],
      note: 'Ambas publicaciones son ficticias y sirven para comparar.',
    },
    instruction:
      'Enfrenta las dos fichas y marca los elementos que merecen verificación.',
  },
  'cmp-2': {
    situation:
      'Dos clientes te envían un comprobante de pago. Uno se ve pulcro y con estado completado; el otro tiene tres cosas que no cuadran.',
    characters: [
      { name: 'Cliente A', role: 'primer comprobante' },
      { name: 'Cliente B', role: 'segundo comprobante' },
    ],
    visual: {
      kind: 'entorno',
      items: [
        { label: 'Comprobante A', value: 'operación aprobada, con referencia' },
        { label: 'Comprobante B', value: 'captura sin referencia verificable' },
        { label: 'Tu cuenta', value: 'sin movimientos todavía' },
      ],
      note: 'Los dos comprobantes son simulaciones educativas.',
    },
    instruction: 'Marca las incoherencias del comprobante B y responde la pregunta final.',
  },
  'cmp-3': {
    situation:
      'Te llegan por correo cuatro direcciones parecidas. Ninguna es real: todas usan el sufijo reservado para simulaciones.',
    characters: [{ name: 'Tú', role: 'persona que recibe los enlaces' }],
    visual: {
      kind: 'entorno',
      items: [
        { label: 'Enlace 1', value: 'banco-ejemplo.invalid' },
        { label: 'Enlace 2', value: 'banco-ejemplo-seguro.invalid' },
        { label: 'Enlace 3', value: 'portal-banco-ejemplo.invalid' },
        { label: 'Enlace 4', value: 'acceso.verificacion-cuenta.invalid' },
      ],
      note: 'El dominio real de un enlace es el texto que va después de la última barra.',
    },
    instruction:
      'Marca las diferencias entre las direcciones y decide si puedes identificar la auténtica por el nombre.',
  },
}

export const LAB_SCENARIO: Scenario = {
  situation:
    'Compraste un producto anunciado en redes sociales, transferiste el dinero y el vendedor dejó de responder. Guardas capturas, el comprobante y el nombre de la cuenta receptora.',
  characters: [
    { name: 'Tú', role: 'comprador' },
    { name: 'Vendedor', role: 'contacto sin respuesta' },
  ],
  visual: {
    kind: 'entorno',
    items: [
      { label: 'Anuncio', value: 'captura guardada' },
      { label: 'Conversación', value: 'captura guardada' },
      { label: 'Transferencia', value: '$845.000 · comprobante' },
      { label: 'Seguimiento', value: '4 días sin respuesta' },
    ],
    note: 'El expediente es ficticio: sirve para practicar el orden de la investigación.',
  },
  instruction:
    'Abre cada evidencia del expediente y clasifícala antes de sacar conclusiones.',
}

export const PROTECTION_SCENARIOS: Record<string, Scenario> = {
  verificacion: {
    situation:
      'Recibes un aviso de acceso a tu cuenta de mensajería desde un navegador que no reconoces. El enlace del aviso lleva a un dominio que no es el del servicio.',
    characters: [
      { name: 'Tu cuenta', role: 'cuenta de mensajería' },
      { name: 'Aviso', role: 'notificación de acceso' },
    ],
    visual: {
      kind: 'panel',
      alerts: [
        {
          label: 'Acceso desde un equipo no reconocido',
          detail: 'Chrome en Windows, registrado hace 2 días.',
        },
      ],
      sessions: [
        { device: 'Chrome en Windows', place: 'Cali', current: false },
        { device: 'App en Android', place: 'Bogotá', current: true },
      ],
    },
    instruction:
      'El aviso puede ser real o falso. ¿Cómo compruebas si hay alguien dentro?',
  },
  proteccion: {
    situation:
      'Desde la aplicación ves una sesión abierta que no reconoces. Además, un contacto te cuenta que le escribieron desde tu perfil pidiéndole un código de transferencia.',
    characters: [
      { name: 'Tu cuenta', role: 'cuenta comprometida' },
      { name: 'Contacto', role: 'recibió un mensaje tuyo que no enviaste' },
    ],
    visual: {
      kind: 'panel',
      alerts: [
        { label: 'Sesión activa desconocida', detail: 'Chrome en Windows, hace 2 días.' },
        { label: 'Mensajes enviados sin autorización', detail: '3 mensajes a contactos, ayer.' },
      ],
      sessions: [
        { device: 'Chrome en Windows', place: 'Cali', current: false },
        { device: 'App en Android', place: 'Bogotá', current: true },
      ],
    },
    instruction:
      'Ya sabes que hay una sesión ajena. ¿Qué haces para proteger la cuenta y a tus contactos?',
  },
  recuperacion: {
    situation:
      'Cambiaste la contraseña y cerraste la sesión. Quedan dos asuntos: los mensajes que salieron de tu cuenta y una solicitud de recuperación de contraseña que no hiciste.',
    characters: [
      { name: 'Cuenta ajena', role: 'intento de recuperar el acceso' },
      { name: 'Tus contactos', role: 'recibieron mensajes tuyos' },
    ],
    visual: {
      kind: 'panel',
      alerts: [
        { label: 'Solicitud de recuperación pendiente', detail: 'Enviada hace 40 minutos desde otra ciudad.' },
        { label: 'Mensajes enviados sin autorización', detail: '3 mensajes a contactos.' },
      ],
      sessions: [{ device: 'App en Android', place: 'Bogotá', current: true }],
    },
    instruction: '¿Qué te queda por hacer para cerrar el incidente?',
  },
}
