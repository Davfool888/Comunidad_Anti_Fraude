/**
 * Contenido del **Centro Educativo Interactivo**.
 *
 * Todo el material es **ficticio y educativo**: las entidades que aparecen en
 * los ejemplos son genéricas ("Banco Aurora", "Tienda Sol") y no se usan
 * logotipos ni identidades reales, para que ninguna simulación pueda
 * confundirse con una comunicación auténtica.
 *
 * El contenido está separado de los componentes para poder editarlo,
 * versionarlo o sustituirlo por contenido servido desde un backend sin
 * tocar la interfaz.
 */

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

/** Categoría educativa (tarjeta de la portada del centro). */
export type EducationCategory = {
  id: string
  title: string
  /** Texto corto para la tarjeta. */
  summary: string
  description: string
  /** Clave del icono (ver `educationIcons`). */
  icon: string
  difficulty: 'Básica' | 'Intermedia' | 'Avanzada'
  /** Minutos estimados. */
  minutes: number
  /** Color de acento de la tarjeta. */
  color: string
}

/** Señal de alerta detectada en un fragmento de texto. */
export type Signal = {
  label: string
  detail: string
}

/** Opción de una actividad, con su retroalimentación. */
export type Option = {
  id: string
  label: string
  /** ¿Es la respuesta esperada? */
  correct: boolean
  /** Por qué es (o no es) la mejor respuesta. */
  explanation: string
}

/** Fragmento seleccionable dentro de un mensaje. */
export type MessagePart = {
  id: string
  text: string
  /** Señal de alerta, si el fragmento es sospechoso. */
  signal?: Signal
}

/** Burbuja de un mensaje simulado. */
export type SimulatorBubble = {
  from: 'contacto' | 'yo' | 'sistema'
  parts: MessagePart[]
}

/** Base común de toda actividad. */
type ActivityBase = {
  id: string
  /** Objetivo de aprendizaje de la actividad. */
  prompt: string
  /** Contexto que se muestra antes de la actividad. */
  context?: string
  /** Puntos por superarla. */
  points: number
}

/** Actividad 1: clasificar el mensaje. */
export type ClassifyActivity = ActivityBase & {
  kind: 'clasificar'
  options: Option[]
  /** Señales de alerta encontradas. */
  signals: string[]
  /** Elementos que podrían ser legítimos. */
  legit: string[]
  /** Información que falta para confirmar. */
  missing: string[]
  /** Acción segura recomendada. */
  action: string
}

/** Actividad 2: decidir cómo actuar. */
export type DecideActivity = ActivityBase & {
  kind: 'decidir'
  options: (Option & {
    /** Consecuencia de tomar esa decisión. */
    outcome: string
  })[]
}

/** Actividad 3: encontrar las señales de alerta. */
export type SignalsActivity = ActivityBase & {
  kind: 'senales'
  /** Mensaje con fragmentos seleccionables. */
  parts: MessagePart[]
  /** Aviso final: ninguna señal aislada prueba un fraude. */
  note: string
}

/** Actividad 4: mitos y realidades. */
export type MythActivity = ActivityBase & {
  kind: 'mitos'
  /** Afirmación que se evalúa. */
  claim: string
  options: Option[]
}

/** Actividad 5: simulador de mensajes. */
export type SimulatorActivity = ActivityBase & {
  kind: 'simulador'
  bubbles: SimulatorBubble[]
  note: string
}

export type Activity =
  | ClassifyActivity
  | DecideActivity
  | SignalsActivity
  | MythActivity
  | SimulatorActivity

/** Lección completa. */
export type EducationLesson = {
  id: string
  categoryId: string
  title: string
  /** Objetivo de aprendizaje. */
  objective: string
  /** Párrafos cortos de introducción. */
  intro: string[]
  /** Ejemplo práctico ficticio. */
  example: { title: string; text: string; note?: string }
  activities: Activity[]
  /** Recomendaciones para la vida real. */
  recommendations: string[]
  /** Resumen de lo aprendido. */
  summary: string[]
  /** Fuentes oficiales consultables. */
  sources: { label: string; url: string }[]
  /** Minutos estimados. */
  minutes: number
}

/* ------------------------------------------------------------------ */
/* Utilidades de contenido                                             */
/* ------------------------------------------------------------------ */

/**
 * Las tres respuestas posibles de la actividad «Detecta el fraude».
 * La opción esperada cambia según el caso: no siempre es la misma.
 */
function classifyOptions(
  expected: 'sospechoso' | 'legitimo' | 'insuficiente',
  extra: Record<string, string> = {},
): Option[] {
  return [
    {
      id: 'legitimo',
      label: 'Parece legítimo, pero debo verificarlo.',
      correct: expected === 'legitimo',
      explanation:
        extra.legitimo ??
        'Es una respuesta prudente, pero no la más adecuada: hay señales que vale la pena tratar como sospechosas mientras verificas por un canal oficial.',
    },
    {
      id: 'sospechoso',
      label: 'Presenta señales sospechosas.',
      correct: expected === 'sospechoso',
      explanation:
        extra.sospechoso ??
        'Tratarlo como sospechoso es correcto: hay que verificar por un canal oficial antes de hacer nada.',
    },
    {
      id: 'insuficiente',
      label: 'No tengo suficiente información para decidir.',
      correct: expected === 'insuficiente',
      explanation:
        extra.insuficiente ??
        'Aquí sí falta información: con lo que hay no se puede afirmar que sea fraude, así que toca verificar.',
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Categorías                                                          */
/* ------------------------------------------------------------------ */

export const CATEGORIES: EducationCategory[] = [
  {
    id: 'phishing',
    title: 'Phishing y mensajes fraudulentos',
    summary: 'Mensajes que se hacen pasar por alguien de confianza.',
    description:
      'Aprende a leer un mensaje sospechoso más allá de los errores de ortografía: quién te escribe, qué te pide y por dónde te manda.',
    icon: 'mail',
    difficulty: 'Básica',
    minutes: 12,
    color: '#5b7cf5',
  },
  {
    id: 'whatsapp',
    title: 'Estafas por WhatsApp y redes sociales',
    summary: 'Conversaciones en las que te piden datos, dinero o un enlace.',
    description:
      'En la mensajería los desconocidos llegan más rápido: así reconoces a un contacto que no es quien dice ser.',
    icon: 'chat',
    difficulty: 'Básica',
    minutes: 10,
    color: '#2fb87c',
  },
  {
    id: 'bancos',
    title: 'Suplantación de bancos y entidades financieras',
    summary: 'Falsos soportes que usan el nombre y el logo de tu entidad financiera.',
    description:
      'Aprende qué puede pedir un banco de verdad, qué no, y cómo comprobar una llamada o un mensaje sin entrar en pánico.',
    icon: 'bank',
    difficulty: 'Intermedia',
    minutes: 15,
    color: '#9b6ef0',
  },
  {
    id: 'comprobantes',
    title: 'Falsos comprobantes de pago',
    summary: 'Capturas y PDF que parecen una transferencia confirmada.',
    description:
      'Un comprobante no demuestra que el dinero llegó: aprende a verificar en la app y qué preguntar antes de despachar.',
    icon: 'receipt',
    difficulty: 'Intermedia',
    minutes: 12,
    color: '#e9a13b',
  },
  {
    id: 'compras',
    title: 'Estafas en compras y ventas por internet',
    summary: 'Tiendas, vendedores y anuncios que no son quien dicen ser.',
    description:
      'Precios imposibles, pagos a terceros y ventas por fuera de la plataforma: las señales de un vendedor fraudulento.',
    icon: 'cart',
    difficulty: 'Intermedia',
    minutes: 14,
    color: '#e0629b',
  },
  {
    id: 'trabajo',
    title: 'Ofertas de empleo e inversión falsas',
    summary: 'Ganancias garantizadas, tareas de prueba y pagos por adelantado.',
    description:
      'Ningún trabajo ni ninguna inversión legítima te cobra por empezar. Reconoce las ofertas que dependen de tu dinero.',
    icon: 'briefcase',
    difficulty: 'Avanzada',
    minutes: 13,
    color: '#3d8ee0',
  },
  {
    id: 'codigos',
    title: 'Robo de cuentas y códigos de verificación',
    summary: 'El código de un solo uso es la llave de tu cuenta.',
    description:
      'Entiende por qué el código nunca se comparte y qué hacer si ya lo hiciste: los primeros minutos cuentan.',
    icon: 'key',
    difficulty: 'Básica',
    minutes: 11,
    color: '#f0601f',
  },
  {
    id: 'enlaces',
    title: 'Enlaces maliciosos y páginas web falsas',
    summary: 'Direcciones que imitan marcas conocidas.',
    description:
      'Un dominio se lee de izquierda a derecha, el candado solo cifra el trayecto y los acortadores esconden el destino real.',
    icon: 'link',
    difficulty: 'Avanzada',
    minutes: 15,
    color: '#7d55e0',
  },
]

/* ------------------------------------------------------------------ */
/* Lecciones                                                           */
/* ------------------------------------------------------------------ */

export const LESSONS: EducationLesson[] = [
  /* ---------------------------------------------------------------- */
  /* 1. Phishing                                                        */
  /* ---------------------------------------------------------------- */
  {
    id: 'leccion-phishing',
    categoryId: 'phishing',
    title: 'Cómo reconocer un mensaje de phishing',
    objective:
      'Reconocer un mensaje de phishing aunque esté bien escrito, cite datos reales de tu vida y use el nombre de una entidad que conoces.',
    minutes: 12,
    intro: [
      'El phishing es un mensaje que se hace pasar por alguien de confianza —tu banco, una tienda, un servicio de envío— para que entregues información, pagues o instales algo.',
      'La idea clásica era buscar errores de ortografía en textos como «le avisa su clave está bloqueada». Ese tipo de mensajes ya casi no se usa.',
      'Hoy los mensajes fraudulentos están bien escritos, usan el nombre y el logo de entidades reales, citan el monto de una compra que hiciste y a veces llaman en vez de escribir. Por eso la regla ya no es «busca el error», sino «verifica el canal».',
    ],
    example: {
      title: 'Mensaje ficticio (SIMULACIÓN EDUCATIVA)',
      text: 'Hola Valentina, detectamos un intento de acceso no autorizado a tu cuenta de Banco Aurora. Por tu seguridad, confirma tu clave y el código que te enviamos por SMS en el siguiente enlace: https://banco-aurora-verificar.actualiza-cuenta.com/confirmar. Si no lo haces en 30 minutos, la cuenta será bloqueada.',
      note:
        'Ejemplo inventado para entrenar. Ningún banco pide tu clave y un código de un solo uso por un enlace enviado por mensaje.',
    },
    activities: [
      {
        id: 'ph-1',
        kind: 'clasificar',
        prompt: '¿Cómo interpretarías este mensaje?',
        context: 'Te llega por WhatsApp, a las 11 de la noche, desde un número que no reconoces.',
        points: 30,
        options: classifyOptions('sospechoso', {
          legitimo:
            'Reconocer algo sospechoso no significa que el mensaje sea de un atacante: un aviso real puede llegar de noche. El problema no es el horario, es que pide tu clave y un código por un enlace.',
          sospechoso:
            'Correcto: el mensaje pide credenciales y un código de un solo uso, y lo hace a través de un enlace. Eso ya es motivo suficiente para verificar por un canal oficial.',
          insuficiente:
            'La información es suficiente: un mensaje que pide tu clave y tu código de un solo uso por un enlace es una señal clara, sin importar que el texto esté bien escrito.',
        }),
        signals: [
          'Pide la clave y un código de un solo uso: ninguna entidad financiera lo hace.',
          'El enlace no es el dominio de la entidad: el dominio real está después de la última barra.',
          'Presiona con un tiempo límite («30 minutos») y una amenaza de bloqueo.',
          'No da un teléfono ni una referencia: no hay forma de devolver la llamada por un canal oficial.',
        ],
        legit: [
          'El mensaje está bien escrito y no tiene errores.',
          'Usa tu nombre y menciona una entidad que reconoces.',
          'El formato (saludo, tono, estructura) es el de una comunicación comercial real.',
        ],
        missing: [
          'Desde qué número o canal exacto llegó el mensaje.',
          'Si tu app o la página oficial muestran algún aviso equivalente.',
          'Una referencia o un número de contacto oficial de la entidad.',
        ],
        action:
          'No hagas clic ni respondas. Abre la app del banco (o escribe tú la dirección en el navegador) y revisa si hay un aviso. Si te piden clave o código, termina la comunicación: por teléfono nadie de tu banco te va a pedir eso.',
      },
      {
        id: 'ph-2',
        kind: 'senales',
        prompt: 'Marca los fragmentos que son señales de alerta.',
        points: 35,
        parts: [
          { id: 'a', text: 'Hola Valentina, ' },
          {
            id: 'b',
            text: 'detectamos un intento de acceso no autorizado a tu cuenta de Banco Aurora.',
            signal: {
              label: 'Alarma genérica',
              detail:
                '«Acceso no autorizado» es un anzuelo clásico: aprovechan el miedo a perder el dinero para que actúes sin pensar.',
            },
          },
          { id: 'c', text: 'Por tu seguridad, ' },
          {
            id: 'd',
            text: 'confirma tu clave y el código que te enviamos por SMS',
            signal: {
              label: 'Pide credenciales y código',
              detail:
                'La clave y el código de un solo uso nunca se piden por mensaje. Quien tenga el código puede entrar a tu cuenta.',
            },
          },
          {
            id: 'e',
            text: ' en el siguiente enlace: https://banco-aurora-verificar.actualiza-cuenta.com/confirmar',
            signal: {
              label: 'Dominio que imita una marca',
              detail:
                'El dominio real es «actualiza-cuenta.com». «banco-aurora-verificar» es solo el nombre de una carpeta dentro de ese sitio.',
            },
          },
          {
            id: 'f',
            text: 'Si no lo haces en 30 minutos, la cuenta será bloqueada.',
            signal: {
              label: 'Urgencia y amenaza',
              detail:
                'El tiempo límite existe para quitarte la calma. Ningún banco bloquea una cuenta por no responder un mensaje.',
            },
          },
        ],
        note:
          'Una señal de alerta aislada no prueba un fraude: un banco real también puede escribirte para avisarte. Lo que convierte esto en un intento malicioso es la combinación de pedirte credenciales y llevarte a un enlace.',
      },
      {
        id: 'ph-3',
        kind: 'mitos',
        prompt: '¿Esta afirmación es cierta?',
        claim:
          '«Si el mensaje está bien escrito y usa el nombre de mi banco, es auténtico y puedo responderle con mi clave».',
        points: 20,
        options: [
          {
            id: 'verdadero',
            label: 'Verdadero',
            correct: false,
            explanation:
              'Falso. La calidad de la redacción no dice nada sobre la intención. Los mensajes fraudulentos se escriben de forma impecable y usan nombres reales; lo que hay que verificar es el canal y qué te piden.',
          },
          {
            id: 'falso',
            label: 'Falso',
            correct: true,
            explanation:
              'Correcto. Un mensaje bien escrito con nombres reales puede ser un fraude. La regla es: nunca entregues claves ni códigos, y verifica siempre por un canal oficial que tú elijas.',
          },
        ],
      },
      {
        id: 'ph-4',
        kind: 'simulador',
        prompt: 'Examina la conversación y marca las señales de alerta.',
        points: 45,
        note:
          'Conversación totalmente ficticia, creada para entrenar. Ninguna de estas personas existe.',
        bubbles: [
          {
            from: 'contacto',
            parts: [
              { id: 'm1', text: 'Hola, soy del equipo de ' },
              { id: 'm2', text: 'Seguridad Bancaria de Banco Aurora' },
              {
                id: 'm3',
                text: '. Estamos validando una transacción inusual de $480.000 en su cuenta.',
                signal: {
                  label: 'Palabra pegada de otro idioma',
                  detail:
                    'Un mensaje de una entidad real en Colombia está redactado en español, sin palabras pegadas de otro idioma.',
                },
              },
            ],
          },
          {
            from: 'contacto',
            parts: [
              { id: 'm4', text: 'Por protocolo debo pedirle ' },
              {
                id: 'm5',
                text: 'su clave y el código de 6 dígitos que le llegó por SMS',
                signal: {
                  label: 'Pide clave y código de un solo uso',
                  detail:
                    'Con ese código alguien puede iniciar sesión en su cuenta y transferir el dinero. Es la petición que nunca tiene un motivo legítimo.',
                },
              },
            ],
          },
          {
            from: 'contacto',
            parts: [
              { id: 'm6', text: 'Puede hacerme clic aquí: ' },
              {
                id: 'm7',
                text: 'https://seguridad-aurora.confirmar-cuenta.net/valida',
                signal: {
                  label: 'Enlace con dominio ajeno',
                  detail:
                    'El dominio verdadero es «confirmar-cuenta.net». Todo lo que va antes de la barra es decorado.',
                },
              },
            ],
          },
        ],
      },
    ],
    recommendations: [
      'Si te piden tu clave, tu PIN o un código de un solo uso: se termina la comunicación. Sin excepción.',
      'Nunca uses un enlace recibido por mensaje, correo o llamada: escribe tú la dirección del sitio oficial o abre la app.',
      'Si crees que tu cuenta está en riesgo, entra por la app y revisa los movimientos. La app nunca te pide la clave para mostrarte movimientos.',
      'Denuncia el mensaje: ayuda a que la comunidad se proteja y evita que el mismo fraude llegue a otros comercios.',
    ],
    summary: [
      'El fraude ya no se delata por la ortografía: hay que mirar el canal, lo que pide y a dónde te manda.',
      'Un mensaje que pide clave o código de un solo uso ya es motivo suficiente para detenerse.',
      'El dominio real de un enlace es el que va después de la última barra.',
      'Verificar por un canal oficial que tú eliges siempre es más seguro que responder al mensaje.',
    ],
    sources: [
      { label: 'Policía Nacional — CAI Virtual', url: 'https://caivirtual.policia.gov.co/' },
      { label: 'Superintendencia Financiera de Colombia', url: 'https://www.superfinanciera.gov.co/' },
      { label: 'Ministerio de TIC — Ciberseguridad', url: 'https://www.mintic.gov.co/' },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* 2. Códigos de verificación                                          */
  /* ---------------------------------------------------------------- */
  {
    id: 'leccion-codigos',
    categoryId: 'codigos',
    title: 'Cómo proteger los códigos de verificación y las cuentas',
    objective:
      'Entender qué es un código de un solo uso, por qué nunca se comparte y qué hacer si ya lo hiciste.',
    minutes: 11,
    intro: [
      'Un código de verificación es una contraseña temporal. Sirve para confirmar que eres tú, y por eso mismo sirve para que alguien entre como tú.',
      'Si otra persona conoce ese código, puede iniciar sesión en tu cuenta, cambiar tu clave y hacer transferencias. Por eso es la petición que más usan los defraudadores.',
      'La regla es fácil de recordar: el código es para ti, no para quien te lo pide.',
    ],
    example: {
      title: 'Llamada ficticia (SIMULACIÓN EDUCATIVA)',
      text: '«Buenos días, le habla el señor Andrés Restrepo del área de seguridad de Banco Aurora. Estamos procesando un retiro inusual de $1.240.000 desde un cajero en Medellín. Para autorizar la reversión necesito que me lea el código de 6 dígitos que le acabamos de enviar al celular. Es solo para confirmar que usted es el titular.»',
      note:
        'Llamada inventada. Ningún banco pide un código de un solo uso por teléfono, ni para «revertir» una operación.',
    },
    activities: [
      {
        id: 'cod-1',
        kind: 'decidir',
        prompt: '¿Qué harías en esta situación?',
        context: 'Te llaman y te piden el código que te llegó al celular.',
        points: 40,
        options: [
          {
            id: 'compartir',
            label: 'Compartir el código para que resuelvan el problema cuanto antes.',
            correct: false,
            outcome:
              'Con el código, la persona inicia sesión en tu cuenta mientras tú sigues en la línea. En los minutos siguientes puede cambiar tu clave y transferir el dinero. El dinero a veces se recupera, pero no siempre: los retiros en efectivo y las transferencias internacionales son casi imposibles de revertir.',
            explanation:
              'Dar el código equivale a entregar las llaves de tu cuenta. Ningún motivo justifica compartirlo, y menos por teléfono.',
          },
          {
            id: 'canal-oficial',
            label: 'Colgar y llamar al banco por el número que aparece en la app o en la tarjeta.',
            correct: true,
            outcome:
              'Esta es la respuesta segura. El número oficial no lo da quien te llamó: lo sacas de la app, de la tarjeta o del sitio web que tú escribes. Si de verdad había un problema, el banco te lo explicará por ese canal.',
            explanation:
              'Correcto: cortas la comunicación y verificas por un canal que tú controlas. El tiempo en cola no importa; tu cuenta sí.',
          },
          {
            id: 'devolver-llamada',
            label: 'Buscar el número del supuesto asesor y devolverle la llamada.',
            correct: false,
            outcome:
              'El número que te aparece en la pantalla del teléfono es el que te llaman, no el del banco. Si devuelves la llamada, le confirmas a alguien que estás disponible y probablemente te pida el código «para verificar que eres tú».',
            explanation:
              'Devolver la llamada al número que te contactaron no verifica nada: le dices al atacante que estás al teléfono.',
          },
          {
            id: 'mas-info',
            label: 'Pedir más información sin entregar datos: nombre completo, oficina, número de radicado.',
            correct: false,
            outcome:
              'Seguir en la llamada tiene un riesgo: los dos datos que pides (nombre y oficina) son públicos y no le impiden darte la clave y el código. Además, mientras estás en la línea, el atacante gana tiempo o le pasa el teléfono a otra persona.',
            explanation:
              'Pedir datos que no son sensibles no cambia nada. Lo que define la llamada es que termine cuando tú decidas, no cuando te convenzan.',
          },
        ],
      },
      {
        id: 'cod-2',
        kind: 'clasificar',
        prompt: '¿Cómo interpretarías este mensaje?',
        context: 'Llega por SMS, justo después de que iniciaste una operación en la app.',
        points: 30,
        options: classifyOptions('sospechoso', {
          legitimo:
            'La legitimidad no se decide por el momento del mensaje: puede ser real. Pero el contenido (pedir clave y código) ya es una señal suficiente para tratarlo como sospechoso.',
          sospechoso:
            'Correcto: te pide un código de un solo uso y una clave. Da igual que el mensaje sea coherente con la operación que acabas de hacer: eso es justo la táctica.',
          insuficiente:
            'No: hay información de sobra. Pedir un código de un solo uso por SMS es la señal más clara que existe en este tema.',
        }),
        signals: [
          'Pide el código de un solo uso que te enviaron por SMS: eso da acceso inmediato a tu cuenta.',
          'También pide la clave: con clave y código, el atacante queda dentro.',
          'Llega justo después de una operación real: aprovechan que tú ya estás pendiente de tu cuenta.',
        ],
        legit: [
          'El mensaje llega a tu celular, no a un número desconocido.',
          'El formato imita el de un SMS legítimo de tu entidad financiera.',
        ],
        missing: [
          'Si en la app o en el canal oficial hay un movimiento o una operación equivalente.',
          'Si tú acababas de iniciar una operación en ese momento.',
        ],
        action:
          'No respondas. Revisa tu app: si la operación existe, el banco ya tiene el registro. Si no existe, cambia tu clave y avisa a tu entidad financiera de inmediato.',
      },
      {
        id: 'cod-3',
        kind: 'mitos',
        prompt: '¿Esta afirmación es cierta?',
        claim:
          '«Si ya compartí un código de verificación, lo más importante es no hacer ruido y esperar a que se caduque».',
        points: 20,
        options: [
          {
            id: 'verdadero',
            label: 'Verdadero',
            correct: false,
            explanation:
              'Falso y peligroso. El código caduca en minutos, pero mientras esté vigente alcanza para iniciar sesión. Lo que hay que hacer es actuar de inmediato: cambiar la clave, cerrar sesión en todos los dispositivos y avisar a la entidad financiera.',
          },
          {
            id: 'falso',
            label: 'Falso',
            correct: true,
            explanation:
              'Correcto. La ventana de tiempo es corta, pero justamente por eso hay que actuar ya: cambiar la clave y reportar en los primeros minutos es lo que evita el retiro.',
          },
        ],
      },
      {
        id: 'cod-4',
        kind: 'decidir',
        prompt: '¿Qué harías en esta situación?',
        context:
          'Un cliente te pide por WhatsApp que le digas el código que le llegó al celular porque «ya hice la transferencia».',
        points: 40,
        options: [
          {
            id: 'dar-codigo',
            label: 'Decirle el código: si es un cliente de verdad, con eso se demuestra que la compra es suya.',
            correct: false,
            outcome:
              'El código va a un tercero, no a un banco. No demuestra que la transferencia sea real: quien te lo pide puede ser el mismo atacante que te está robando la cuenta, o alguien que ya usó el código para entrar.',
            explanation:
              'El código de un solo uso nunca verifica la identidad de un comprador. Por eso las entidades piden códigos a ti, nunca a nombre de un tercero.',
          },
          {
            id: 'verificar-app',
            label: 'No decir nada del código: pedir que la transferencia se vea en la app o en el estado de cuenta de origen.',
            correct: true,
            outcome:
              'Esto es: la app y el estado de cuenta de origen son la fuente de verdad, y no dependen de lo que te envíe el cliente por chat. Si la transferencia no aparece, no despachas.',
            explanation:
              'Correcto: verificas contra el movimiento real de la cuenta, nunca contra una captura que te manda un desconocido.',
          },
          {
            id: 'pedir-comprobante',
            label: 'Pedir un comprobante y, si parece auténtico, entregar la mercancía.',
            correct: false,
            outcome:
              'Un comprobante se puede falsificar en minutos. Si te basas en la captura, estás entregando mercancía contra un comprobante que puede ser falso.',
            explanation:
              'Un comprobante es un indicio, no una prueba. La verificación se hace en el sistema de la entidad financiera.',
          },
          {
            id: 'esperar',
            label: 'Esperar a que el cliente se calme y volver a preguntarle mañana.',
            correct: false,
            outcome:
              'Dejar pasar el tiempo no cambia nada: si la operación es fraudulenta, mientras esperas el atacante ya usó tus datos o los del cliente.',
            explanation:
              'El tiempo no es una estrategia de seguridad. Verifica de una vez y, si algo no cuadra, no despaches.',
          },
        ],
      },
    ],
    recommendations: [
      'El código de un solo uso es para ti. Ni a tu familia, ni a un «asesor», ni a un agente que se identifique.',
      'Activa la verificación en dos pasos en tus cuentas y el aviso por cada movimiento nuevo.',
      'Si ya lo compartiste: cambia la clave desde la app, cierra sesión en todos los dispositivos y avisa a tu entidad financiera en los primeros minutos.',
      'Aprende a denegar: una llamada sobre seguridad que no tú iniciaste se corta y se devuelve por el canal oficial.',
    ],
    summary: [
      'El código de un solo uso abre tu cuenta: por eso no se comparte nunca.',
      'Un «asesor» que te lo pide es un atacante, aunque se sepa tu nombre y tu banco.',
      'El canal de verificación lo eliges tú: la app, la tarjeta o el número del sitio oficial.',
      'Si ya lo compartiste, el tiempo corre: cambiar la clave y reportar es la prioridad.',
    ],
    sources: [
      { label: 'Policía Nacional — CAI Virtual', url: 'https://caivirtual.policia.gov.co/' },
      { label: 'Superintendencia Financiera de Colombia', url: 'https://www.superfinanciera.gov.co/' },
      {
        label: 'Banco de la República — Defensoría del Usuario Financiero',
        url: 'https://www.defensordelusuariofinanciero.org.co/',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* 3. Comprobantes de pago                                            */
  /* ---------------------------------------------------------------- */
  {
    id: 'leccion-comprobantes',
    categoryId: 'comprobantes',
    title: 'Cómo verificar un supuesto comprobante de pago',
    objective:
      'Entender por qué una imagen de una transferencia no demuestra que el dinero llegó, y qué hacer en su lugar.',
    minutes: 12,
    intro: [
      'El comprobante falso es el principal riesgo del comercio: una imagen que parece una app bancaria, con el logo, el monto y la hora correctos.',
      'La razón es técnica y simple: una captura de pantalla es una imagen. Se puede editar, y hoy se edita en segundos.',
      'Por eso el comprobante no es la prueba. La prueba es el movimiento real, visto en el sistema de la entidad financiera o en el estado de cuenta del remitente.',
    ],
    example: {
      title: 'Comprobante ficticio (SIMULACIÓN EDUCATIVA)',
      text: 'Comprobante de transferencia — Banco Aurora. Fecha: 14 de marzo, 09:41. Valor enviado: $845.000. Beneficiario: Tienda Sol N°. 2. Estado: transacción realizada. [Captura de pantalla]',
      note:
        'Ejemplo inventado. Los comprobantes reales muestran identificadores internos que puedes contrastar, y su estado se verifica en la app o en el portal de la entidad.',
    },
    activities: [
      {
        id: 'com-1',
        kind: 'clasificar',
        prompt: '¿Cómo interpretarías este comprobante?',
        context:
          'Un cliente te envía la imagen por WhatsApp y te pide despachar la mercancía de inmediato.',
        points: 30,
        options: classifyOptions('insuficiente', {
          legitimo:
            'El comprobante no es claramente falso, pero eso no significa que sea válido. Un comprobante auténtico también puede estar cancelado o ser de otro monto: por eso no se decide solo con la imagen.',
          sospechoso:
            'Tratarlo como sospechoso es prudente, pero aquí la clave es otra: con una imagen no se puede afirmar que sea un fraude. La respuesta más precisa es que falta información y hay que verificarla en el sistema.',
          insuficiente:
            'Correcto: con una imagen no se puede confirmar ni descartar el fraude. Lo que hay que hacer es verificar el movimiento en el sistema de la entidad financiera antes de despachar.',
        }),
        signals: [
          'Es una imagen enviada por chat: una captura se puede editar, no es un comprobante verificable.',
          'No se ve un identificador de transacción que puedas contrastar.',
        ],
        legit: [
          'El formato imita el de una app bancaria real.',
          'El monto, la hora y el beneficiario pueden ser correctos: el atacante también los sabe.',
        ],
        missing: [
          'El estado real de la operación en el sistema de la entidad financiera.',
          'Si el monto coincide exactamente con el de la compra que estás esperando.',
          'Si quien paga coincide con quien recoge la mercancía.',
        ],
        action:
          'Verifica en tu app o en el portal de tu entidad financiera que el movimiento entró y está en estado «realizado». Si tienes dudas, espera el tiempo razonable de la transferencia y vuelve a revisar. Nunca despaches solo con una imagen.',
      },
      {
        id: 'com-2',
        kind: 'decidir',
        prompt: '¿Qué harías en esta situación?',
        context:
          'El comprobante llegó bien hecho, con el monto exacto, y el cliente insiste en que ya pagó.',
        points: 40,
        options: [
          {
            id: 'despachar',
            label: 'Despachar: el comprobante coincide en monto, hora y beneficiario.',
            correct: false,
            outcome:
              'Coincidir en los datos no convierte la imagen en una prueba: cualquiera que conozca los datos de la compra (o los adivine) puede armar una imagen así. Si despachas contra una imagen falsa, la pérdida es doble: la mercancía y el dinero.',
            explanation:
              'La apariencia no es verificación. Un comprobante se confirma en el sistema, no en la pantalla.',
          },
          {
            id: 'verificar-sistema',
            label: 'Revisar el movimiento en mi app o en el portal de la entidad financiera antes de despachar.',
            correct: true,
            outcome:
              'Esto es: el estado de cuenta de tu propia entidad financiera es la fuente de verdad. Si el movimiento aparece con el monto y el estado correctos, puedes despachar con tranquilidad.',
            explanation:
              'Correcto: verificas contra la fuente que tú controlas, no contra la imagen que te envían.',
          },
          {
            id: 'devolver-dinero',
            label: 'Pedir que devuelva el dinero y le devuelvo la mercancía, para no perder nada.',
            correct: false,
            outcome:
              'Esto te mete en una devolución que casi nunca termina bien: devuelves mercancía que puede no ser la que se llevó, por un dinero que puede no llegar nunca, y quedas con dos problemas en vez de uno.',
            explanation:
              'Las devoluciones «para no perder nada» suelen ser una segunda forma de perder. Es mejor verificar y, si algo no cuadra, no despachar.',
          },
          {
            id: 'preguntar',
            label: 'Preguntarle al cliente si puede hacer la transferencia desde su propia cuenta a la mía.',
            correct: false,
            outcome:
              'La pregunta no aporta: el identificador de la cuenta de destino suele estar en la publicación o en la conversación, así que cualquiera puede «hacer la transferencia a la tuya». La verificación tiene que hacerse de tu lado.',
            explanation:
              'Que el pagador «sepa» tu cuenta no prueba que él haya pagado. La verificación va del lado de quien recibe.',
          },
        ],
      },
      {
        id: 'com-3',
        kind: 'senales',
        prompt: 'Marca los fragmentos sospechosos del comprobante.',
        points: 35,
        note:
          'Ninguna de estas señales prueba por sí sola un fraude, pero juntas describen un comprobante que no sirve como prueba de pago.',
        parts: [
          { id: 'c1', text: 'Comprobante de transferencia — ' },
          {
            id: 'c2',
            text: 'Banco Aurora',
            signal: {
              label: 'Entidad citada sin evidencia',
              detail:
                'Poner el nombre de un banco no demuestra nada: el logo se copia en segundos. No hay referencia interna que puedas contrastar.',
            },
          },
          { id: 'c3', text: ' Fecha: 14 de marzo, 09:41. Valor enviado: $845.000. Beneficiario: Tienda Sol N°. 2. ' },
          {
            id: 'c4',
            text: 'Estado: transacción realizada',
            signal: {
              label: 'El estado lo declara el propio archivo',
              detail:
                '«Estado: realizada» escrito en la imagen no es el estado real de la operación: es un texto que escribe el atacante. El estado real se ve en el sistema de la entidad.',
            },
          },
          {
            id: 'c5',
            text: ' [Captura de pantalla]',
            signal: {
              label: 'Es una imagen',
              detail:
                'Una captura es un archivo editable. Por eso nunca es la prueba de que un pago se hizo.',
            },
          },
        ],
      },
      {
        id: 'com-4',
        kind: 'mitos',
        prompt: '¿Esta afirmación es cierta?',
        claim: '«Un comprobante de transferencia demuestra que el dinero llegó a mi cuenta».',
        points: 20,
        options: [
          {
            id: 'verdadero',
            label: 'Verdadero',
            correct: false,
            explanation:
              'Falso. Un comprobante es una imagen que alguien te entrega: demuestra, en el mejor de los casos, que alguien tomó una captura. El dinero llega cuando el movimiento aparece en tu propio estado de cuenta.',
          },
          {
            id: 'falso',
            label: 'Falso',
            correct: true,
            explanation:
              'Correcto. La prueba de que el dinero llegó es el movimiento en tu app o en el estado de cuenta, con el estado y el monto correctos.',
          },
        ],
      },
    ],
    recommendations: [
      'Verifica siempre en tu app o en el portal de tu entidad financiera: el estado real del movimiento.',
      'Ten un monto esperado por escrito (en la cotización o en el chat) y compáralo: si no coincide, no despaches.',
      'Desconfía de comprobantes con estado «realizada» pero sin referencia interna verificable.',
      'En compras grandes, pide el pago contra entrega o un anticipo máximo, no el total por adelantado.',
    ],
    summary: [
      'Una imagen de una app bancaria no es una prueba: es un archivo que se puede editar.',
      'La prueba es el movimiento real en tu estado de cuenta, con monto y estado correctos.',
      'Compara el monto esperado antes de despachar; si no cuadra, no cuadra.',
      'Ante la duda, no despachar es la decisión que te protege.',
    ],
    sources: [
      { label: 'Superintendencia Financiera de Colombia', url: 'https://www.superfinanciera.gov.co/' },
      {
        label: 'Banco de la República — Defensoría del Usuario Financiero',
        url: 'https://www.defensordelusuariofinanciero.org.co/',
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* 4. Vendedores y tiendas                                            */
  /* ---------------------------------------------------------------- */
  {
    id: 'leccion-vendedores',
    categoryId: 'compras',
    title: 'Cómo reconocer una tienda o un vendedor potencialmente fraudulento',
    objective:
      'Detectar las señales de un vendedor no confiable antes de pagar, y saber qué hacer con la información que te pide.',
    minutes: 14,
    intro: [
      'En los marketplaces y en las redes sociales hay dos vendedores: el que vende de verdad y el que se hace pasar por una tienda que no existe.',
      'El patrón del fraudulento es estable: precio demasiado bajo, presión para pagar ya, pagos que no pasan por la plataforma y un contacto que se corta apenas le preguntas algo.',
      'Cuando el precio es una fracción de lo normal, no estás viendo una oportunidad: estás viendo el incentivo para que bajes la guardia.',
    ],
    example: {
      title: 'Anuncio ficticio (SIMULACIÓN EDUCATIVA)',
      text: 'LAPTOPS REACONDICIONADOS DESDE $1.200.000 (precio normal $4.800.000). Unidades limitadas. Envío gratis a todo el país. Paga por transferencia directa para evitar comisiones. Escríbenos por chat, no por WhatsApp. No respondemos teléfono.',
      note: 'Anuncio inventado para entrenar. No corresponde a ninguna tienda real.',
    },
    activities: [
      {
        id: 'ven-1',
        kind: 'clasificar',
        prompt: '¿Cómo interpretarías este anuncio?',
        context: 'Aparece en una publicación de redes sociales con miles de reacciones.',
        points: 30,
        options: classifyOptions('sospechoso', {
          legitimo:
            'Las reacciones y los seguidores no dicen nada: ese es justamente el recurso que usan los anuncios fraudulentos para parecer conocidos.',
          sospechoso:
            'Correcto: precio muy por debajo del mercado, pago fuera de la plataforma, presión y contacto restringido. Ninguna de esas cosas la cumple una tienda seria.',
          insuficiente:
            'Hay información suficiente: la combinación de precio inverosímil, pago por transferencia directa y «no respondemos teléfono» es suficiente para tratarlo como sospechoso y verificar antes de pagar.',
        }),
        signals: [
          'Precio muy por debajo del valor de mercado: el producto es el anzuelo.',
          'Piden pagar por transferencia directa «para evitar comisiones»: así la plataforma no puede mediar ni protegerte.',
          '«No respondemos teléfono» y solo chat: quien vende de verdad no huye de una llamada.',
          '«Unidades limitadas» y urgencia artificial.',
        ],
        legit: [
          'El anuncio está bien producido y tiene muchas reacciones.',
          'El precio podría ser real si el equipo está muy usado o si hay una avería que no se menciona.',
        ],
        missing: [
          'Si la tienda tiene historial y ventas verificables dentro de la plataforma.',
          'Si la política de devolución está escrita y es razonable.',
          'Si aceptan el pago a través de la plataforma, que ofrece protección al comprador.',
        ],
        action:
          'No pagues por transferencia a un desconocido. Haz las preguntas básicas (garantía, devoluciones, factura) y observa si las responde. Si el precio o el contacto no cuadran, no compres: a ese precio nadie va a perder el negocio en una venta.',
      },
      {
        id: 'ven-2',
        kind: 'senales',
        prompt: 'Marca los fragmentos sospechosos del anuncio.',
        points: 35,
        parts: [
          { id: 'v1', text: 'LAPTOPS REACONDICIONADOS ' },
          {
            id: 'v2',
            text: 'DESDE $1.200.000 (precio normal $4.800.000)',
            signal: {
              label: 'Precio inverosímil',
              detail:
                'Una diferencia de cuatro veces no es una oferta: es el gancho. Nadie vende un equipo así de barato y sigue en el negocio.',
            },
          },
          { id: 'v3', text: 'Unidades limitadas. Envío gratis a todo el país. ' },
          {
            id: 'v4',
            text: 'Paga por transferencia directa para evitar comisiones.',
            signal: {
              label: 'Pago fuera de la plataforma',
              detail:
                'Al salir de la plataforma pierdes la protección del comprador y la mediación si algo sale mal.',
            },
          },
          {
            id: 'v5',
            text: 'Escríbenos por chat, no por WhatsApp. ',
            signal: {
              label: 'Evita los canales con registro',
              detail:
                'El chat interno de la plataforma deja rastro y la plataforma puede intervenir. Fuera de ella no hay respaldo.',
            },
          },
          {
            id: 'v6',
            text: 'No respondemos teléfono.',
            signal: {
              label: 'Se niega a dar un canal de contacto',
              detail:
                'Un vendedor legítimo no tiene por qué esconderse de una llamada. Rechazar la verificación es la señal más clara.',
            },
          },
        ],
        note:
          'Estas señales son un patrón, no una sentencia: hay tiendas informales que no cumplen todo. Por eso la decisión se toma verificando, no descartando de una.',
      },
      {
        id: 'ven-3',
        kind: 'decidir',
        prompt: '¿Qué harías en esta situación?',
        context:
          'El vendedor pide que pagues a «un familiar que está fuera del país», porque «él no tiene cuenta a su nombre».',
        points: 40,
        options: [
          {
            id: 'pagar',
            label: 'Pagar, si el nombre del beneficiario coincide con lo que me dice por chat.',
            correct: false,
            outcome:
              'Pagar a un tercero hace imposible reclamar y, en muchos casos, recuperar: el dinero sale de tu cuenta a nombre de otra persona y queda fuera de tu trazabilidad. La explicación («no tiene cuenta») es justamente el patrón clásico.',
            explanation:
              'Pagar a un tercero nunca es un trámite inocente: elimina la trazabilidad y la posibilidad de reclamo.',
          },
          {
            id: 'rechazar',
            label: 'Rechazar la compra: un vendedor que no puede recibir en su cuenta no es un vendedor.',
            correct: true,
            outcome:
              'Exacto. Si la persona que vende no puede recibir en su nombre, la explicación no se sostiene. Perder esa venta no cuesta nada; perder el dinero, sí.',
            explanation:
              'Correcto: el vendedor que se oculta detrás de terceros está ocultando algo. No hay un motivo legítimo para aceptar ese riesgo.',
          },
          {
            id: 'pedir-video',
            label: 'Pedir un video del producto y de la factura antes de pagar.',
            correct: false,
            outcome:
              'El video y la factura son materiales que también se falsean: el objeto puede no ser el anunciado, el local puede no existir y la factura puede tener los datos de otro. Reduce un poco el riesgo, pero no lo elimina.',
            explanation:
              'Pedir más pruebas ayuda un poco, pero no sustituye la verificación de la identidad del vendedor ni el pago protegido.',
          },
          {
            id: 'plataforma',
            label: 'Ofrecer pagar por la plataforma, con protección al comprador.',
            correct: true,
            outcome:
              'Es la mejor salida: si el vendedor se niega a usar la plataforma, eso mismo es información valiosa. Si acepta, la mediación cubre parte del problema.',
            explanation:
              'Correcto: mover la conversación al canal con protección es la forma más simple de decidir si la persona es de fiar.',
          },
        ],
      },
      {
        id: 'ven-4',
        kind: 'mitos',
        prompt: '¿Esta afirmación es cierta?',
        claim: '«Si el precio es muy bajo, es una oportunidad y no hay que verificar».',
        points: 20,
        options: [
          {
            id: 'verdadero',
            label: 'Verdadero',
            correct: false,
            explanation:
              'Falso. Un precio anormalmente bajo no es un regalo: es el mecanismo de persuasión más usado en fraudes de venta. El descuento no se descuenta de un margen, se descuenta de tu cuenta.',
          },
          {
            id: 'falso',
            label: 'Falso',
            correct: true,
            explanation:
              'Correcto. Si el precio no tiene explicación, casi siempre la explicación es el fraude. Antes de comprar, pregúntate por qué es tan barato.',
          },
        ],
      },
    ],
    recommendations: [
      'Paga por la plataforma mientras puedas: la protección al comprador no es un detalle menor.',
      'Si te piden transferencia a un tercero, no compres.',
      'Haz preguntas concretas (garantía, devoluciones, factura) y fíjate en si las responden o cambian de tema.',
      'Un vendedor que evita el teléfono, el chat de la plataforma o la factura no es un vendedor que necesitas.',
    ],
    summary: [
      'El precio inverosímil es el anzuelo, no la oportunidad.',
      'Pagar fuera de la plataforma elimina tu protección.',
      'Un tercero que cobra y un cuarto que vende: se renegocia o se retira.',
      'Las preguntas básicas (garantía, devoluciones, factura) son también una prueba de confianza.',
    ],
    sources: [
      { label: 'Policía Nacional — CAI Virtual', url: 'https://caivirtual.policia.gov.co/' },
      { label: 'Superintendencia de Industria y Comercio', url: 'https://www.sic.gov.co/' },
    ],
  },

  /* ---------------------------------------------------------------- */
  /* 5. Qué hacer después de un incidente                                 */
  /* ---------------------------------------------------------------- */
  {
    id: 'leccion-incidente',
    categoryId: 'bancos',
    title: 'Qué hacer después de compartir datos o hacer una transferencia sospechosa',
    objective:
      'Tener un plan para los primeros minutos: qué hacer, en qué orden y a quién reportar.',
    minutes: 13,
    intro: [
      'Los minutos después de un incidente valen más que cualquier prevención. Un código compartido o una transferencia hecha a un desconocido se puede detener si se actúa rápido.',
      'El orden importa: primero se corta el acceso (cambiar claves, cerrar sesión), después se documenta y por último se denuncia.',
      'Y hay una regla de salud mental que también es una regla de seguridad: no te dé vergüenza pedir ayuda. Las víctimas de fraude son la fuente más importante de información para la comunidad.',
    ],
    example: {
      title: 'Situación ficticia (SIMULACIÓN EDUCATIVA)',
      text: 'Le diste el código de 6 dígitos a alguien que dijo ser del banco. Diez minutos después te aparece un movimiento de $1.900.000 y recibes una llamada de «soporte» ofreciéndote devolverte el dinero si le das la clave.',
      note:
        'Situación inventada para entrenar. La segunda llamada es un intento nuevo de robarte lo que queda.',
    },
    activities: [
      {
        id: 'inc-1',
        kind: 'decidir',
        prompt: '¿Qué harías en esta situación?',
        context: 'Acabas de compartir el código y ves un movimiento que no reconoces.',
        points: 40,
        options: [
          {
            id: 'llamar-soporte',
            label: 'Contestar la llamada que me ofrecen para devolverme el dinero.',
            correct: false,
            outcome:
              'Es una segunda etapa del fraude: la primera te sacaron el acceso, ahora quieren la clave. Quien te «devuelve» el dinero no es el banco: es el mismo atacante. Perderías también la clave y la cuenta completa.',
            explanation:
              'Un reembolso por teléfono no existe. Quien te ofrece recuperar tu dinero es el mismo que te quitó el acceso.',
          },
          {
            id: 'cambiar-clave',
            label: 'Entrar a mi app, cambiar la clave y la del correo, y cerrar sesión en todos los dispositivos.',
            correct: true,
            outcome:
              'Esto es: cambiar la clave de la cuenta financiera y la del correo (que es la puerta de entrada a todo lo demás) le cierra el acceso al atacante. Después revisa los movimientos y avisa a tu entidad para que revierta lo que se pueda.',
            explanation:
              'Correcto: cortar el acceso es el primer paso y el más urgente. El correo es tan importante como la cuenta bancaria.',
          },
          {
            id: 'esperar',
            label: 'Esperar a ver si el movimiento se revierte solo.',
            correct: false,
            outcome:
              'Mientras esperas, la sesión sigue abierta. Los retiros en efectivo y las transferencias internacionales son muy difíciles de revertir, y mientras el atacante tenga el código puede iniciar más operaciones.',
            explanation:
              'La reversión automática no existe. Esperar solo le da tiempo al atacante.',
          },
          {
            id: 'borrar-chat',
            label: 'Borrar el chat y el mensaje para que no quede registro, y ya está.',
            correct: false,
            outcome:
              'Borrar el chat destruye la evidencia que sirve para el reporte y para avisar a otros comercios de la red. La evidencia (capturas, número de teléfono, hora, monto) es lo que permite congelar y rastrear.',
            explanation:
              'No borres nada: guarda capturas. Son la evidencia del reporte y ayudan a que otros no caigan.',
          },
        ],
      },
      {
        id: 'inc-2',
        kind: 'decidir',
        prompt: '¿A quién y cómo reporto?',
        context: 'Ya cambiaste tus claves y quieres reportar lo ocurrido.',
        points: 40,
        options: [
          {
            id: 'nadie',
            label: 'No reportar a nadie: no perdí mucho y no quiero líos.',
            correct: false,
            outcome:
              'El costo no es solo el dinero: el acceso puede seguir abierto y la misma técnica ya se está usando contra otras personas de tu barrio. Reportar es lo que activa la alerta colectiva.',
            explanation:
              'Reportar no es «dar lata»: es la parte que hace que el resto de la comunidad no caiga en lo mismo.',
          },
          {
            id: 'policia',
            label: 'Poner la denuncia en la Policía Nacional (CAI Virtual) y guardar el radicado.',
            correct: true,
            outcome:
              'Es el camino para la investigación: la Policía puede rastrear cuentas y redes. Guarda el número de radicado: te sirve para reclamar y para dar seguimiento.',
            explanation:
              'Correcto: denuncia ante la Policía y conserva el radicado. Es la vía formal para que el caso se investigue.',
          },
          {
            id: 'banco',
            label: 'Avisarle solo a mi entidad financiera.',
            correct: false,
            outcome:
              'A tu entidad financiera hay que avisarle igual, pero por sí sola no queda registro oficial del intento de fraude: no hay expediente. Tu entidad puede bloquear y revertir, pero no investigar.',
            explanation:
              'Avisa a tu entidad financiera sí, pero eso no sustituye la denuncia: son caminos complementarios.',
          },
          {
            id: 'red',
            label: 'Reportarlo en la red de comercios del barrio y pedir que lo compartan con los demás.',
            correct: true,
            outcome:
              'Muy valioso: la red difunde la alerta y evita que el mismo truco llegue a otro comercio de la calle. La información de los incidents es lo que más protege a la comunidad.',
            explanation:
              'Correcto: compartir la alerta con la red es una de las formas más simples de proteger a tus vecinos.',
          },
        ],
      },
      {
        id: 'inc-3',
        kind: 'mitos',
        prompt: '¿Esta afirmación es cierta?',
        claim: '«Si hice una transferencia engañosa y perdí la plata, no hay nada que hacer».',
        points: 20,
        options: [
          {
            id: 'verdadero',
            label: 'Verdadero',
            correct: false,
            explanation:
              'Falso. Entre más rápido se reporte, más opciones hay: algunas entidades pueden intentar la reversión, y la denuncia abre la investigación. Además, avisar a la red evita que otros repitan la misma situación.',
          },
          {
            id: 'falso',
            label: 'Falso',
            correct: true,
            explanation:
              'Correcto. Reportar rápido es lo que puede recuperar parte del dinero y, sobre todo, lo que protege a los demás.',
          },
        ],
      },
    ],
    recommendations: [
      'Los primeros minutos: cambiar la clave de la cuenta y la del correo, y cerrar sesión en todos los dispositivos.',
      'Guarda la evidencia antes de borrar nada: capturas, número de teléfono, hora, monto y nombre que usaron.',
      'Denuncia ante la Policía Nacional (CAI Virtual) y guarda el radicado; avisa también a tu entidad financiera.',
      'Comparte la alerta en la red de comercios del barrio: el aviso colectivo es la mejor protección de la comunidad.',
      'No te avergüences: las víctimas son la fuente de información más útil para detectar estas redes.',
    ],
    summary: [
      'El orden es: cortar el acceso, documentar, denunciar.',
      'Cambiar la clave del correo es tan importante como la de la cuenta bancaria.',
      'La evidencia (capturas, número, hora, monto) es lo que permite investigar.',
      'Reportar protege a todo el barrio, no solo a ti.',
    ],
    sources: [
      { label: 'Policía Nacional — CAI Virtual', url: 'https://caivirtual.policia.gov.co/' },
      { label: 'Superintendencia Financiera de Colombia', url: 'https://www.superfinanciera.gov.co/' },
      {
        label: 'Banco de la República — Defensoría del Usuario Financiero',
        url: 'https://www.defensordelusuariofinanciero.org.co/',
      },
    ],
  },
]
