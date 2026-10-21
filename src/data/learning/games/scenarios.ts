import type { Scenario } from '../types'

/**
 * Escenarios visuales de las preguntas y de los primeros nodos de las
 * historias.
 *
 * Cada escenario describe una situación cotidiana y la representación visual
 * que la acompaña (un SMS, un chat, un correo, un anuncio, un comprobante, un
 * formulario o un panel de seguridad). Todas las simulaciones llevan la
 * etiqueta «Simulación educativa» y usan datos ficticios.
 */

/** Situación de las preguntas del desafío contrarreloj. */
export const QUIZ_SCENARIOS: Record<string, Scenario> = {
  'ta-1': {
    situation:
      'Eres cliente de una entidad financiera. Estás en el mostrador de una tienda y el teléfono te vibra: alguien dice ser del área de seguridad de tu banco y te pide el código que te acaba de llegar por SMS.',
    characters: [{ name: 'Voz desconocida', role: 'supuesto asesor' }],
    visual: {
      kind: 'sms',
      from: 'BANCO AURORA',
      time: '10:42',
      body: 'Su código de verificación es 482915. No lo comparta con nadie.',
    },
    instruction:
      '¿Qué haces con la llamada? Elige la acción más segura: una sola respuesta, sin más datos.',
  },
  'ta-2': {
    situation:
      'Un cliente de la tienda te manda por WhatsApp una captura de una app bancaria y te pide que le entregues el pedido. En tu cuenta no aparece ningún movimiento.',
    characters: [{ name: 'Cliente', role: 'compra en la tienda' }],
    visual: {
      kind: 'comprobante',
      status: 'Transferencia enviada',
      fields: [
        { label: 'Valor', value: '$845.000' },
        { label: 'Fecha', value: '14 de marzo, 09:41' },
        { label: 'Estado', value: 'Completada' },
        { label: 'Cuenta destino', value: '•••• 4471' },
      ],
    },
    instruction: '¿Qué haces antes de despachar?',
  },
  'ta-3': {
    situation:
      'En una red social aparece una publicación de una tienda con equipos de cocina a una cuarta parte del precio normal. Piden transferencia inmediata y dicen que es la última unidad.',
    characters: [{ name: 'Tienda online', role: 'vendedor' }],
    visual: {
      kind: 'anuncio',
      title: 'KitchenPro · liquidation total',
      bullets: [
        'Horneadoras industriales desde $380.000 (precio normal $1.450.000)',
        'Últimas unidades, se agota hoy',
        'Pago por transferencia directa (sin comisiones)',
      ],
      footer: 'No hay reseñas de otros compradores.',
    },
    instruction: '¿Qué haces con esta publicación?',
  },
  'ta-4': {
    situation:
      'Recibes un SMS que dice que tienes un paquete retenido y que debes pagar una tarifa para liberarlo. No recuerdas haber comprado nada.',
    characters: [{ name: 'Remitente', role: 'supuesta empresa de mensajería' }],
    visual: {
      kind: 'sms',
      from: 'ANDES COURIER',
      time: '08:12',
      body:
        'Su paquete está retenido. Pague $12.500 en https://rastreo-andes.courier-pendiente.invalid/pagar o se devuelve en 24 h.',
    },
    instruction: '¿Qué haces con el mensaje?',
  },
  'ta-5': {
    situation:
      'Una oferta de empleo remoto para un puesto bien pagado llega sin que hayas Applying. Para recibir el contrato pide una cuota de inscripción que hay que pagar hoy.',
    characters: [{ name: 'Reclutador', role: 'supuesta empresa' }],
    visual: {
      kind: 'email',
      from: 'Talento Global <seleccion@empleo-oportunidad.info>',
      subject: 'Selected for Remote Operations Analyst',
      body:
        'Le informamos que ha sido seleccionado. Para emitir el contrato debe transferir $180.000 de inscripción antes del cierre de la vacante, hoy mismo.',
    },
    instruction: '¿Qué haces antes de pagar nada?',
  },
  'ta-6': {
    situation:
      'En un grupo de mensajería alguien explica una «oportunidad» que duplica la inversión en una semana y pide una cuota de activación para entrar.',
    characters: [{ name: 'Participante del grupo', role: 'supuesto asesor' }],
    visual: {
      kind: 'chat',
      messages: [
        { from: 'contacto', text: 'Bienvenido al grupo de operadores. Tasa fija semanal del 100 %.', time: '19:02' },
        { from: 'contacto', text: 'Para entrar solo pagas la cuota de activación de $220.000.', time: '19:02' },
        { from: 'contacto', text: 'Esto no lo/share con nadie, es una operador privada.', time: '19:03' },
      ],
    },
    instruction: '¿Qué haces antes de transferir la cuota?',
  },
  'ta-7': {
    situation:
      'Escribes a tu hijo porque perdió el teléfono, pero no contesta. Desde un número nuevo te piden transferir dinero urgente y te dicen que no puedes llamar.',
    characters: [{ name: 'Número desconocido', role: 'supuesto hijo' }],
    visual: {
      kind: 'chat',
      messages: [
        { from: 'contacto', text: 'Mamá, soy yo, el nuevo. Perdí el celular.', time: '22:40' },
        { from: 'contacto', text: 'Necesito que me transfieras $800.000 urgente, no puedo hablar estoy en una reunión.', time: '22:40' },
        { from: 'contacto', text: '¿te acuerdas de mi colegio? Yo nací el 14 de marzo.', time: '22:41' },
      ],
    },
    instruction: '¿Qué haces antes de transferir?',
  },
  'ta-8': {
    situation:
      'Revisas la seguridad de tu cuenta de mensajería y aparece una sesión abierta desde un equipo que no es el tuyo, en otra ciudad.',
    characters: [{ name: 'Tu cuenta', role: 'sesión abierta' }],
    visual: {
      kind: 'panel',
      alerts: [
        { label: 'Acceso desde un equipo no reconocido', detail: 'Chrome en Windows, registrado hace 2 días.' },
      ],
      sessions: [
        { device: 'Chrome en Windows', place: 'Cali', current: false },
        { device: 'App en Android', place: 'Bogotá', current: true },
      ],
    },
    instruction: '¿Qué haces primero?',
  },
  'ta-9': {
    situation:
      'Escribes tu contraseña en una página que después resultó ser falsa. Ahora no sabes si quedó guardada.',
    characters: [{ name: 'Página sospechosa', role: 'formulario de acceso' }],
    visual: {
      kind: 'formulario',
      title: 'Iniciar sesión · Portal de clientes',
      fields: ['Correo electrónico', 'Contraseña', 'Verificar que no soy un robot'],
      warning: 'Este formulario es una simulación educativa: nunca escribas aquí datos reales.',
    },
    instruction: '¿Qué haces ahora?',
  },
  'ta-10': {
    situation:
      'Hiciste una transferencia a un vendedor y lleva cuatro días sin responder. Tienes la captura del anuncio y el comprobante.',
    characters: [{ name: 'Vendedor', role: 'contacto sin respuesta' }],
    visual: {
      kind: 'entorno',
      items: [
        { label: 'Transferencia', value: '$1.240.000' },
        { label: 'Última respuesta', value: 'hace 4 días' },
        { label: 'Evidencia guardada', value: 'capturas y comprobante' },
      ],
      note: 'La situación es ficticia: sirve para practicar qué se hace después de un incidente.',
    },
    instruction: '¿Cuál es el primer paso?',
  },

  /* --- Verdadero, falso o no sabemos --- */
  'vf-1': {
    situation:
      'Una página muestra el candado del navegador y una dirección que empieza por https. Quieres saber si puedes confiar en ella.',
    characters: [],
    visual: {
      kind: 'entorno',
      items: [
        { label: 'Dirección', value: 'https://banco-ejemplo.invalid' },
        { label: 'Candado', value: 'presente' },
        { label: '¿Quién está detrás?', value: 'desconocido' },
      ],
      note: 'El candado solo cifra el trayecto entre tu dispositivo y el sitio.',
    },
    instruction: '¿Qué puedes afirmar con esos datos?',
  },
  'vf-2': {
    situation:
      'Un mensaje que llega con el logo de tu banco te pide confirmar unos datos. Quieres saber si el logo prueba el origen.',
    characters: [{ name: 'Remitente', role: 'supuesto banco' }],
    visual: {
      kind: 'sms',
      from: 'BANCO AURORA (logo incluido)',
      time: '13:05',
      body: 'Estimado cliente, confirmemos sus datos en el enlace oficial: https://banco-aurora-verificar.invalid/ok',
    },
    instruction: '¿El logo y el nombre demuestran algo?',
  },
  'vf-3': {
    situation:
      'Un cliente te manda un comprobante de transferencia. Quieres saber si es prueba de que el dinero llegó.',
    characters: [{ name: 'Cliente', role: 'compra en la tienda' }],
    visual: {
      kind: 'comprobante',
      status: 'Completada',
      fields: [
        { label: 'Valor', value: '$845.000' },
        { label: 'Operación', value: 'TX-8841' },
        { label: 'Recibido por', value: 'según la imagen' },
      ],
    },
    instruction: '¿Qué demuestra el comprobante por sí solo?',
  },
  'vf-4': {
    situation:
      'Una tienda ofrece un 70 % de descuento y un tiempo límite. Quieres saber si eso ya demuestra un fraude.',
    characters: [{ name: 'Tienda online', role: 'publicación' }],
    visual: {
      kind: 'anuncio',
      title: 'Descuento del 70 % por tiempo limitado',
      bullets: [
        'Todo el catálogo al 70 % menos',
        'Solo por hoy',
        'Envío gratis a todo el país',
      ],
      footer: 'El descuento es real en algunas tiendas.',
    },
    instruction: '¿Qué se puede concluir con lo que ves?',
  },
  'vf-5': {
    situation:
      'Un atacante te pide el código que te llegó por SMS. Quieres saber qué puede lograr con ese código.',
    characters: [{ name: 'Atacante', role: 'supuesto soporte' }],
    visual: {
      kind: 'sms',
      from: 'BANCO AURORA',
      time: '11:58',
      body: 'Su código de acceso temporal es 704318. Escríbanos para confirmar la operación.',
    },
    instruction: '¿Qué puede hacer quien tenga ese código?',
  },
  'vf-6': {
    situation:
      'Un perfil con muchos seguidores vende productos a mitad de precio. Quieres saber si eso dice algo del negocio.',
    characters: [{ name: 'Perfil con 84 mil seguidores', role: 'vendedor' }],
    visual: {
      kind: 'anuncio',
      title: 'Perfil verificado · 84.000 seguidores',
      bullets: [
        'Zapatillas al 50 % · envío a todo el país',
        'Pagá por transferencia y te lo enviamos',
      ],
      footer: 'La cifra de seguidores se puede comprar en minutos.',
    },
    instruction: '¿Qué prueba el número de seguidores?',
  },
  'vf-7': {
    situation:
      'Hiciste una transferencia a un desconocido y no-has recibido el producto. Quieres saber si queda algo por hacer.',
    characters: [],
    visual: {
      kind: 'entorno',
      items: [
        { label: 'Transferencia', value: '$1.240.000' },
        { label: 'Producto', value: 'no recibido' },
        { label: 'Contacto', value: 'sin respuesta' },
      ],
      note: 'La situación es ficticia, pero los pasos de respuesta son reales.',
    },
    instruction: '¿Es cierto que ya no se puede hacer nada?',
  },
  'vf-8': {
    situation:
      'Tu teléfono muestra el número de tu banco, pero la voz del otro lado no suena institucional. Quieres saber si el número basta.',
    characters: [{ name: 'Llamada entrante', role: 'supuesto banco' }],
    visual: {
      kind: 'entorno',
      items: [
        { label: 'Número que aparece', value: '601 555 0142 (Banco Aurora)' },
        { label: 'Voz', role: 'no identificada' },
      ] as never,
      note: 'El identificador de llamada lo elige quien llama: se puede suplantar.',
    },
    instruction: '¿El número en pantalla demuestra el origen?',
  },
  'vf-9': {
    situation:
      'Un vendedor lleva cuatro días sin responder. Quieres saber si eso ya es una prueba de fraude.',
    characters: [{ name: 'Vendedor', role: 'contacto sin respuesta' }],
    visual: {
      kind: 'chat',
      messages: [
        { from: 'yo', text: 'Hola, ¿el pedido ya salió?', time: 'lunes' },
        { from: 'yo', text: 'Hola, necesito una fecha, por favor.', time: 'jueves' },
      ],
    },
    instruction: '¿El silencio por sí solo prueba algo?',
  },
  'vf-10': {
    situation:
      'Te piden verificar una solicitud. Quieres saber si volver a mirar por tu cuenta sirve de algo.',
    characters: [],
    visual: {
      kind: 'entorno',
      items: [
        { label: 'Canal del atacante', value: 'enlace que te enviaron' },
        { label: 'Canal propio', value: 'app o número de la tarjeta' },
      ],
      note: 'Verificar por un canal propio rompe el control que el atacante tiene sobre la conversación.',
    },
    instruction: '¿Qué efecto tiene verificar por un canal independiente?',
  },
}

/** Escenario del primer nodo de cada historia. */
export const STORY_SCENARIOS: Record<string, Scenario> = {
  'hist-paquete': {
    situation:
      'Son las 10 de la mañana y te llega un mensaje sobre un paquete retenido. No has comprado nada hace meses.',
    characters: [{ name: 'Remitente', role: 'supuesta mensajería' }],
    visual: {
      kind: 'sms',
      from: 'ANDES COURIER',
      time: '10:04',
      body:
        'Su paquete está retenido. Pague $12.500 en https://rastreo-andes.courier-pendiente.invalid/pagar o se devuelve en 24 h.',
    },
    instruction: '¿Qué haces con el mensaje?',
  },
  'hist-llamada': {
    situation:
      'Estás en el mostrador de la tienda y el teléfono te vibra. La voz dice ser del área de seguridad de tu banco.',
    characters: [{ name: 'Voz desconocida', role: 'supuesto asesor' }],
    visual: {
      kind: 'sms',
      from: 'BANCO AURORA',
      time: '15:31',
      body: 'Su código de verificación es 593204. No lo comparta con nadie.',
    },
    instruction: '¿Qué haces con la llamada?',
  },
  'hist-comprobante': {
    situation:
      'Un cliente te escribe por WhatsApp: ya transfirió el dinero y quiere que le entregues la mercancía de inmediato.',
    characters: [{ name: 'Cliente', role: 'compra en la tienda' }],
    visual: {
      kind: 'chat',
      messages: [
        { from: 'contacto', text: 'Listo, ya transferí. Te dejo la captura del comprobante.', time: '11:02' },
        { from: 'contacto', text: '¿Me despachas ya? Estoy saliendo de camino.', time: '11:02' },
      ],
    },
    instruction: '¿Qué haces antes de despachar?',
  },
  'hist-anticipo': {
    situation:
      'Encuentras un producto anunciado en redes sociales a un precio muy por debajo del mercado. El vendedor pide una seña para reservarlo.',
    characters: [{ name: 'Vendedor', role: 'publicación' }],
    visual: {
      kind: 'anuncio',
      title: 'Laptop reacondicionada · $1.200.000',
      bullets: [
        'Última unidad, la sepaco con una seña de $150.000',
        'Pago por transferencia a la cuenta de mi socio',
        'No respondemos teléfono, solo por aquí',
      ],
      footer: 'Publicación creada hace dos días.',
    },
    instruction: '¿Qué haces con la publicación?',
  },
  'hist-inversion': {
    situation:
      'En un grupo de mensajería te invitan a un «programa de inversión» que promete devolver el doble en una semana.',
    characters: [{ name: 'Participante', role: 'supuesto asesor' }],
    visual: {
      kind: 'chat',
      messages: [
        { from: 'contacto', text: 'Estamos moviendo capital con tasa fija semanal del 100 %.', time: '08:44' },
        { from: 'contacto', text: 'Para entrar, paga la cuota de activación de $220.000.', time: '08:44' },
      ],
    },
    instruction: '¿Qué haces con la propuesta?',
  },
  'hist-acceso': {
    situation:
      'Al revisar el correo encuentras un aviso: alguien inició sesión en tu cuenta de mensajería desde un equipo que no reconoces.',
    characters: [{ name: 'Tu cuenta', role: 'sesión desconocida' }],
    visual: {
      kind: 'panel',
      alerts: [
        { label: 'Acceso desde un equipo no reconocido', detail: 'Chrome en Windows, registrado hace 2 días.' },
      ],
      sessions: [
        { device: 'Chrome en Windows', place: 'Cali', current: false },
        { device: 'App en Android', place: 'Bogotá', current: true },
      ],
    },
    instruction: '¿Qué haces primero?',
  },
}
