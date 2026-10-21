/**
 * Tipos del **Centro de aprendizaje** (juegos de prevención de fraude).
 *
 * El contenido, las reglas de evaluación y los componentes de presentación
 * están separados: los juegos se describen con datos y un motor genérico los
 * ejecuta. Así se pueden añadir casos, historias o preguntas nuevas sin
 * duplicar componentes.
 */

/* ------------------------------------------------------------------ */
/* Diapositivas: introducción, escenario y resumen                      */
/* ------------------------------------------------------------------ */

/**
 * Diapositiva de introducción de un juego: explica de forma breve el tipo
 * de fraude que se va a estudiar antes de pedirle ninguna decisión.
 */
export type GameIntro = {
  /** Nombre del tipo de fraude. */
  title: string
  /** Qué es: entre 40 y 80 palabras. */
  summary: string
  /** Cómo suele funcionar. */
  howItWorks: string
  /** Dos o tres señales de alerta importantes. */
  signs: string[]
  /** Una recomendación preventiva. */
  prevention: string
  /** Clave de la ilustración (ver `FraudScene`). */
  illustration: string
}

/** Representación visual de una situación. */
export type ScenarioVisual =
  | { kind: 'sms'; from: string; time: string; body: string }
  | {
      kind: 'chat'
      messages: { from: 'contacto' | 'yo'; text: string; time?: string }[]
    }
  | { kind: 'email'; from: string; subject: string; body: string }
  | { kind: 'anuncio'; title: string; bullets: string[]; footer?: string }
  | { kind: 'comprobante'; fields: { label: string; value: string }[]; status: string }
  | { kind: 'formulario'; title: string; fields: string[]; warning: string }
  | {
      kind: 'panel'
      alerts: { label: string; detail: string }[]
      sessions: { device: string; place: string; current?: boolean }[]
    }
  | { kind: 'entorno'; items: { label: string; value: string }[]; note: string }

/** Diapositiva de presentación de la situación. */
export type Scenario = {
  /** Situación cotidiana, en una frase. */
  situation: string
  /** Personajes o elementos involucrados. */
  characters: { name: string; role: string }[]
  /** Representación visual de la escena. */
  visual: ScenarioVisual
  /** Instrucción clara de lo que debe hacer el jugador. */
  instruction: string
}

/* ------------------------------------------------------------------ */
/* Veredictos y opciones                                                */
/* ------------------------------------------------------------------ */

/**
 * Resultado de evaluar una respuesta del usuario.
 *
 *  · `correct`      → la decisión era la recomendada.
 *  · `partial`      → parcialmente correcta (por ejemplo: se reconoce el
 *                      riesgo pero la acción elegida no era la más segura).
 *  · `incorrect`    → decisión insegura.
 *  · `insufficient` → la opción correcta era «no hay información suficiente».
 */
export type Verdict = 'correct' | 'partial' | 'incorrect' | 'insufficient'

/** Puntos que otorga cada veredicto. */
export const VERDICT_POINTS: Record<Verdict, number> = {
  correct: 100,
  partial: 50,
  insufficient: 50,
  incorrect: 0,
}

/** Opción de una pregunta o decisión. */
export type Option = {
  id: string
  label: string
  verdict: Verdict
  /** Explicación educativa de por qué es (o no) la mejor opción. */
  explanation: string
  /** Puntos (por defecto, los del veredicto). */
  points?: number
}

/** Categoría educativa de un juego, caso o pregunta. */
export type LearningCategory = {
  id: string
  title: string
  summary: string
  color: string
  icon: string
}

/* ------------------------------------------------------------------ */
/* Juego 1 · Detectives digitales                                        */
/* ------------------------------------------------------------------ */

/** Pista investigable dentro de un mensaje. */
export type Clue = {
  id: string
  /** Fracción del mensaje donde aparece. */
  text: string
  /** Etiqueta de la pista. */
  label: string
  /** Qué significa. */
  detail: string
  /** ¿Es una señal de alerta? */
  alert: boolean
}

/** Clasificación de un elemento en un caso de análisis. */
export type ClassificationItem = {
  id: string
  text: string
  /** Respuesta esperada. */
  answer: 'alerta' | 'verificar' | 'neutro'
  detail: string
}

/** Caso de investigación con mensaje y decisión final. */
export type DetectiveCase = {
  id: string
  categoryId: string
  title: string
  /** Situación que se presenta. */
  context: string
  /** Mensaje simulado, con sus partes. */
  message: { from: 'contacto' | 'sistema' | 'banco'; parts: { id: string; text: string; clueId?: string }[] }
  /** Pistas del caso. */
  clues: Clue[]
  /** Elementos que hay que clasificar (variante del reto). */
  classification?: ClassificationItem[]
  /** Situación que se presenta antes de investigar. */
  scenario: Scenario
  /** Decisión que hay que tomar al final. */
  decision: { prompt: string; options: Option[] }
  /** Veredicto sobre el caso: sospechoso, legítimo o ambiguo. */
  outcome: {
    kind: 'sospechoso' | 'legitimo' | 'ambiguo'
    label: string
    text: string
  }
  /** Qué se aprende. */
  learning: string
  points: number
}

/* ------------------------------------------------------------------ */
/* Juego 2 · Tú decides (historias ramificadas)                        */
/* ------------------------------------------------------------------ */

/** Nodo de una historia ramificada. */
export type StoryNode = {
  id: string
  /** Mensaje simulado que se muestra en el nodo. */
  message: { from: 'contacto' | 'yo' | 'sistema'; text: string; simulated?: boolean }
  /** Situación visual de la etapa. */
  scenario?: Scenario
  /** Pregunta del nodo. */
  prompt: string
  /** Decisiones: cada una lleva al siguiente nodo. */
  options: (Option & {
    /** Nodo al que lleva. */
    next: string
    /** Consecuencia educativa de esa decisión. */
    consequence: string
  })[]
  /** Nodo final: cierra la historia. */
  end?: { title: string; text: string }
}

/** Historia con recorrido ramificado. */
export type Story = {
  id: string
  categoryId: string
  title: string
  intro: string
  /** Nodo inicial. */
  start: string
  nodes: StoryNode[]
  /** Cierre de la historia. */
  closing: {
    /** Decisiones seguras que tomó el usuario. */
    safe: string
    /** Decisiones que aumentan el riesgo. */
    risky: string
    /** Información que debió verificar. */
    pending: string
    /** Lección aprendida. */
    lesson: string
  }
  points: number
}

/* ------------------------------------------------------------------ */
/* Juego 3 · Encuentra las diferencias                                  */
/* ------------------------------------------------------------------ */

/** Elemento seleccionable de una ficha comparada. */
export type CompareItem = {
  id: string
  /** Texto visible. */
  text: string
  /** Detalle que explica la diferencia. */
  detail: string
  /** ¿Es una diferencia relevante? */
  difference: boolean
}

/** Caso de comparación. */
export type CompareCase = {
  id: string
  categoryId: string
  title: string
  /** Presentación de los dos lados. */
  prompt: string
  /** Situación que se presenta antes de comparar. */
  scenario: Scenario
  left: { name: string; subtitle: string; items: CompareItem[] }
  right: { name: string; subtitle: string; items: CompareItem[] }
  /** Qué lado es el problemático. */
  answerSide: 'left' | 'right' | 'ninguno'
  /** Respuesta esperada sobre la pregunta del caso. */
  answer: { prompt: string; options: Option[] }
  learning: string
  points: number
}

/* ------------------------------------------------------------------ */
/* Juego 4 · Laboratorio de evidencias                                  */
/* ------------------------------------------------------------------ */

/** Clasificación de una evidencia. */
export type EvidenceClass = 'hecho' | 'indicio' | 'falta'

/** Evidencia del expediente. */
export type LabEvidence = {
  id: string
  title: string
  /** Texto de la evidencia. */
  text: string
  /** Clasificación esperada. */
  classification: EvidenceClass
  /** Explicación de por qué. */
  detail: string
}

/** Hipótesis sobre el caso. */
export type LabHypothesis = {
  id: string
  label: string
  text: string
  /** ¿Está demostrada con la información disponible? */
  demonstrated: boolean
  detail: string
}

/** Acción posible. */
export type LabAction = {
  id: string
  label: string
  /** ¿Es una acción recomendada? */
  recommended: boolean
  detail: string
}

/** Caso del laboratorio. */
export type LabCase = {
  id: string
  categoryId: string
  title: string
  story: string[]
  /** Situación que se presenta antes de abrir el expediente. */
  scenario: Scenario
  evidences: LabEvidence[]
  hypotheses: LabHypothesis[]
  actions: LabAction[]
  /** Ids de las acciones recomendadas que hay que elegir. */
  expectedActions: string[]
  /** Informe final. */
  report: {
    hechos: string[]
    senales: string[]
    hipotesis: string[]
    falta: string[]
    acciones: string[]
  }
  points: number
}

/* ------------------------------------------------------------------ */
/* Juegos de preguntas (contrarreloj y verdadero/falso/no sabemos)       */
/* ------------------------------------------------------------------ */

/** Pregunta de opción múltiple. */
export type QuizQuestion = {
  id: string
  categoryId: string
  prompt: string
  /** Contexto opcional. */
  context?: string
  /** Situación visual de la pregunta. */
  scenario?: Scenario
  options: Option[]
  /** Explicación ampliada que se muestra tras responder. */
  learning?: string
}

/* ------------------------------------------------------------------ */
/* Juego 7 · Protege tu cuenta                                          */
/* ------------------------------------------------------------------ */

/** Fase del juego de protección. */
export type ProtectionPhase = {
  id: string
  title: string
  context: string
  /** Situación de la fase. */
  scenario: Scenario
  /** Opciones de la fase. */
  options: Option[]
  /** Medidas de protección que aplica esta fase. */
  measures: { id: string; label: string; detail: string; required: boolean }[]
}

/** Juego de protección de cuenta. */
export type ProtectionGame = {
  id: string
  categoryId: string
  title: string
  intro: string
  phases: ProtectionPhase[]
  /** Explicación de la recuperación cuando ya se perdió el acceso. */
  recovery: { title: string; text: string }
  points: number
}

/* ------------------------------------------------------------------ */
/* Juego 8 · Arma tu plan de protección                                 */
/* ------------------------------------------------------------------ */

/** Medida de protección. */
export type PlanMeasure = {
  id: string
  label: string
  detail: string
  group: string
  /** ¿Es esencial para un plan básico? */
  essential: boolean
}

/* ------------------------------------------------------------------ */
/* Registro de juegos                                                    */
/* ------------------------------------------------------------------ */

/** Definición de un juego. */
export type GameDefinition = {
  id: string
  title: string
  description: string
  /** Frase corta para la tarjeta. */
  summary: string
  icon: string
  difficulty: 'Básica' | 'Intermedia' | 'Avanzada'
  minutes: number
  /** Número de casos, preguntas o etapas. */
  total: number
  color: string
  /** Texto de la etiqueta de simulación. */
  simulated?: boolean
  /** Diapositiva de introducción del juego. */
  intro: GameIntro
}