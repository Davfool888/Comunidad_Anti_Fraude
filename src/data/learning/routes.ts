/**
 * **Rutas de aprendizaje** del Centro de aprendizaje.
 *
 * Una ruta es el tipo de fraude que se quiere estudiar. Cada ruta se compone
 * de lecciones breves y cada lección reutiliza uno de los juegos que ya
 * existen. Así no se duplica contenido: el juego es el mecanismo interactivo y
 * la ruta es el recorrido educativo.
 *
 * Las rutas se apoyan en las diez categorías existentes para no perder
 * contenido ni cambiar la organización que ya conocía el usuario.
 */

/** Tipo de lección dentro de una ruta. */
export type RouteLessonKind = 'leccion' | 'practica' | 'reto'

/** Lección de una ruta. */
export type RouteLesson = {
  /** Identificador único en todo el centro (`ruta-leccion`). */
  id: string
  /** Título corto que se ve en el camino. */
  title: string
  /** Qué aprende el usuario. */
  objective: string
  /** Juego que se reutiliza para practicar. */
  gameId: string
  /** Duración estimada en minutos. */
  minutes: number
  /** Papel de la lección dentro de la ruta. */
  kind: RouteLessonKind
}

/** Ruta temática de aprendizaje. */
export type LearningRoute = {
  /** Identificador de la ruta (coincide con la categoría). */
  id: string
  /** Categoría educativa de la que toma el contenido. */
  categoryId: string
  title: string
  summary: string
  /** Clave del icono (ver `learningIcons`). */
  icon: string
  color: string
  difficulty: 'Básica' | 'Intermedia' | 'Avanzada'
  lessons: RouteLesson[]
}

/**
 * Definición de las rutas. El orden es el que se muestra en el catálogo:
 * primero las rutas más frecuentes y después las avanzadas.
 */
export const ROUTES: LearningRoute[] = [
  {
    id: 'phishing',
    categoryId: 'phishing',
    title: 'Phishing y enlaces sospechosos',
    summary: 'Mensajes que imitan a tu banco o a una tienda para robarte datos.',
    icon: 'mail',
    color: '#5b7cf5',
    difficulty: 'Básica',
    lessons: [
      {
        id: 'phishing-1',
        title: 'Reconoce el engaño',
        objective: 'Distinguir un mensaje legítimo de uno que busca tus credenciales.',
        gameId: 'detectives',
        minutes: 7,
        kind: 'leccion',
      },
      {
        id: 'phishing-2',
        title: 'Detecta las señales',
        objective: 'Comparar dos mensajes y encontrar las incoherencias reales.',
        gameId: 'diferencias',
        minutes: 6,
        kind: 'practica',
      },
      {
        id: 'phishing-3',
        title: 'Pon a prueba tu criterio',
        objective: 'Decidir la acción segura ante mensajes urgentes y ambiguos.',
        gameId: 'contrarreloj',
        minutes: 5,
        kind: 'reto',
      },
    ],
  },
  {
    id: 'whatsapp',
    categoryId: 'whatsapp',
    title: 'Estafas por WhatsApp y mensajería',
    summary: 'Un falso familiar, un contacto suplantado o una solicitud de dinero.',
    icon: 'chat',
    color: '#2fb87c',
    difficulty: 'Básica',
    lessons: [
      {
        id: 'whatsapp-1',
        title: 'El mensaje del falso conocido',
        objective: 'Reconocer cuándo un chat no es de quien dice ser.',
        gameId: 'historias',
        minutes: 8,
        kind: 'leccion',
      },
      {
        id: 'whatsapp-2',
        title: 'Verifica antes de responder',
        objective: 'Practicar la verificación por un canal distinto al del mensaje.',
        gameId: 'detectives',
        minutes: 7,
        kind: 'practica',
      },
      {
        id: 'whatsapp-3',
        title: 'Decisiones bajo presión',
        objective: 'Elegir la acción segura cuando piden dinero o un código.',
        gameId: 'contrarreloj',
        minutes: 5,
        kind: 'reto',
      },
    ],
  },
  {
    id: 'suplantacion',
    categoryId: 'suplantacion',
    title: 'Suplantación de identidad',
    summary: 'Alguien se hace pasar por una persona o una entidad de confianza.',
    icon: 'user',
    color: '#9b6ef0',
    difficulty: 'Intermedia',
    lessons: [
      {
        id: 'suplantacion-1',
        title: 'Quién está al otro lado',
        objective: 'Separar la apariencia del mensaje de su origen real.',
        gameId: 'historias',
        minutes: 8,
        kind: 'leccion',
      },
      {
        id: 'suplantacion-2',
        title: 'Rastrea las pistas',
        objective: 'Investigar remitentes, enlaces y peticiones fuera de lugar.',
        gameId: 'detectives',
        minutes: 7,
        kind: 'practica',
      },
      {
        id: 'suplantacion-3',
        title: 'Separa hechos de sospechas',
        objective: 'Evitar dar por probado lo que todavía es solo un indicio.',
        gameId: 'vf-desafio',
        minutes: 5,
        kind: 'reto',
      },
    ],
  },
  {
    id: 'compras',
    categoryId: 'compras',
    title: 'Compras y vendedores fraudulentos',
    summary: 'Tiendas falsas, anticipos y productos que nunca llegan.',
    icon: 'cart',
    color: '#e0629b',
    difficulty: 'Intermedia',
    lessons: [
      {
        id: 'compras-1',
        title: 'La venta demasiado buena',
        objective: 'Detectar precios imposibles y pagos por fuera de la plataforma.',
        gameId: 'historias',
        minutes: 8,
        kind: 'leccion',
      },
      {
        id: 'compras-2',
        title: 'Revisa el expediente',
        objective: 'Ordenar pruebas antes de acusar o de pagar.',
        gameId: 'laboratorio',
        minutes: 9,
        kind: 'practica',
      },
      {
        id: 'compras-3',
        title: 'Decide con prudencia',
        objective: 'Elegir la acción más segura cuando falta información.',
        gameId: 'detectives',
        minutes: 7,
        kind: 'reto',
      },
    ],
  },
  {
    id: 'comprobantes',
    categoryId: 'comprobantes',
    title: 'Comprobantes y pagos falsos',
    summary: 'Capturas que parecen una transferencia confirmada pero no lo son.',
    icon: 'receipt',
    color: '#e9a13b',
    difficulty: 'Intermedia',
    lessons: [
      {
        id: 'comprobantes-1',
        title: 'Una captura no es un pago',
        objective: 'Comparar comprobantes y detectar datos incoherentes.',
        gameId: 'diferencias',
        minutes: 6,
        kind: 'leccion',
      },
      {
        id: 'comprobantes-2',
        title: 'Verifica en tu app',
        objective: 'Comprobar el movimiento en el canal oficial antes de entregar.',
        gameId: 'laboratorio',
        minutes: 9,
        kind: 'practica',
      },
      {
        id: 'comprobantes-3',
        title: 'Lo que se puede afirmar',
        objective: 'Distinguir un pago confirmado de una simple promesa.',
        gameId: 'vf-desafio',
        minutes: 5,
        kind: 'reto',
      },
    ],
  },
  {
    id: 'laboral',
    categoryId: 'laboral',
    title: 'Ofertas de empleo falsas',
    summary: 'Trabajos que empiezan pidiendo un pago o tus datos bancarios.',
    icon: 'briefcase',
    color: '#3d8ee0',
    difficulty: 'Intermedia',
    lessons: [
      {
        id: 'laboral-1',
        title: 'Ningún trabajo te cobra',
        objective: 'Reconocer las ofertas que dependen de tu dinero.',
        gameId: 'vf-desafio',
        minutes: 5,
        kind: 'leccion',
      },
      {
        id: 'laboral-2',
        title: 'La entrevista sospechosa',
        objective: 'Decidir qué hacer cuando piden pagos o datos antes de contratar.',
        gameId: 'historias',
        minutes: 8,
        kind: 'practica',
      },
      {
        id: 'laboral-3',
        title: 'Reacciona a tiempo',
        objective: 'Elegir la acción segura en situaciones breves de presión.',
        gameId: 'contrarreloj',
        minutes: 5,
        kind: 'reto',
      },
    ],
  },
  {
    id: 'inversiones',
    categoryId: 'inversiones',
    title: 'Inversiones sospechosas',
    summary: 'Ganancias garantizadas y promesas de duplicar el dinero.',
    icon: 'chart',
    color: '#f0601f',
    difficulty: 'Avanzada',
    lessons: [
      {
        id: 'inversiones-1',
        title: 'Rendimiento garantizado, alerta',
        objective: 'Evaluar afirmaciones absolutas con pensamiento crítico.',
        gameId: 'vf-desafio',
        minutes: 5,
        kind: 'leccion',
      },
      {
        id: 'inversiones-2',
        title: 'Investiga la promesa',
        objective: 'Buscar señales en mensajes y anuncios de inversión.',
        gameId: 'detectives',
        minutes: 7,
        kind: 'practica',
      },
      {
        id: 'inversiones-3',
        title: 'No actúes con prisa',
        objective: 'Resolver situaciones de presión con la opción más segura.',
        gameId: 'contrarreloj',
        minutes: 5,
        kind: 'reto',
      },
    ],
  },
  {
    id: 'credenciales',
    categoryId: 'credenciales',
    title: 'Robo de cuentas y códigos',
    summary: 'El código de un solo uso es la llave de tu cuenta.',
    icon: 'key',
    color: '#43b98c',
    difficulty: 'Básica',
    lessons: [
      {
        id: 'credenciales-1',
        title: 'Protege tu cuenta',
        objective: 'Verificar, proteger y recuperar una cuenta comprometida.',
        gameId: 'protege-cuenta',
        minutes: 8,
        kind: 'leccion',
      },
      {
        id: 'credenciales-2',
        title: 'Tu plan de protección',
        objective: 'Elegir medidas preventivas reales y sostenibles.',
        gameId: 'plan',
        minutes: 6,
        kind: 'practica',
      },
      {
        id: 'credenciales-3',
        title: 'Un código no se comparte',
        objective: 'Reconocer cuándo una petición de código es un fraude.',
        gameId: 'vf-desafio',
        minutes: 5,
        kind: 'reto',
      },
      {
        id: 'credenciales-4',
        title: 'Anatomía de una tarjeta',
        objective: 'Identificar qué datos de una tarjeta deben protegerse y por qué.',
        gameId: 'anatomia-tarjeta',
        minutes: 8,
        kind: 'practica',
      },
    ],
  },
  {
    id: 'enlaces',
    categoryId: 'enlaces',
    title: 'Enlaces y sitios web falsos',
    summary: 'Direcciones que imitan marcas conocidas y acortadores engañosos.',
    icon: 'link',
    color: '#7d55e0',
    difficulty: 'Avanzada',
    lessons: [
      {
        id: 'enlaces-1',
        title: 'Lee el dominio completo',
        objective: 'Identificar el dominio real detrás de un enlace disfrazado.',
        gameId: 'detectives',
        minutes: 7,
        kind: 'leccion',
      },
      {
        id: 'enlaces-2',
        title: 'Compara dos direcciones',
        objective: 'Encontrar las diferencias entre un sitio real y su imitación.',
        gameId: 'diferencias',
        minutes: 6,
        kind: 'practica',
      },
      {
        id: 'enlaces-3',
        title: 'El candado no lo es todo',
        objective: 'Decidir si conviene abrir un enlace y por qué.',
        gameId: 'contrarreloj',
        minutes: 5,
        kind: 'reto',
      },
    ],
  },
  {
    id: 'incidentes',
    categoryId: 'incidentes',
    title: 'Respuesta ante incidentes',
    summary: 'Qué hacer en los primeros minutos después de un fraude.',
    icon: 'shield',
    color: '#e23b5f',
    difficulty: 'Avanzada',
    lessons: [
      {
        id: 'incidentes-1',
        title: 'Los primeros minutos',
        objective: 'Priorizar acciones cuando ya diste un código o hiciste un pago.',
        gameId: 'protege-cuenta',
        minutes: 8,
        kind: 'leccion',
      },
      {
        id: 'incidentes-2',
        title: 'Documenta lo ocurrido',
        objective: 'Ordenar hechos, pruebas y lo que falta antes de reportar.',
        gameId: 'laboratorio',
        minutes: 9,
        kind: 'practica',
      },
      {
        id: 'incidentes-3',
        title: 'Un plan para la próxima vez',
        objective: 'Convertir lo aprendido en medidas concretas de protección.',
        gameId: 'plan',
        minutes: 6,
        kind: 'reto',
      },
    ],
  },
]

/** Ruta por identificador. */
export const ROUTE_BY_ID = Object.fromEntries(ROUTES.map((route) => [route.id, route]))

/** Lección por identificador. */
export const LESSON_BY_ID = Object.fromEntries(
  ROUTES.flatMap((route) =>
    route.lessons.map((lesson) => [lesson.id, { route, lesson }] as const),
  ),
)
