import type {
  CardClassificationOption,
  CardField,
  CardQuestion,
} from '../types'

/**
 * Juego 9 · **Anatomía de una tarjeta**.
 *
 * Todos los datos de la tarjeta son ficticios y no operativos. El juego no
 * pide información personal ni se conecta con ninguna pasarela de pago.
 *
 * El contenido vive aquí, separado de la interfaz. La tarjeta se dibuja con
 * campos estables (`card_number`, `expiration_date`, etc.) y cada pregunta
 * declara qué campos son correctos, cuáles son distractores y qué explicación
 * corresponde a cada uno.
 */

export const CARD_GAME_ID = 'anatomia-tarjeta'

export const CARD_GAME_OBJECTIVE =
  'Aprende a identificar los datos de una tarjeta bancaria, reconocer cuáles debes proteger y comprender qué información nunca debes compartir.'

export const CARD_SIMULATION_NOTE =
  'Tarjeta ficticia de demostración. No es un medio de pago, no tiene fondos ni está asociada a ninguna entidad real.'

export const CARD_GAME_LEARNING =
  'Los datos de una tarjeta se protegen en conjunto: número, nombre, vencimiento y CVV. El código de seguridad nunca se comparte y una foto de la tarjeta no prueba que esté activa ni que tenga fondos.'

export const CARD_GAME_SIGNALS = [
  'El número, la fecha y el CVV se protegen juntos.',
  'El CVV se mantiene confidencial y no se dicta por teléfono.',
  'Una foto de tarjeta no demuestra que el pago exista.',
]

export const CARD_FIELDS: CardField[] = [
  {
    id: 'issuer',
    label: 'Entidad emisora',
    value: 'Banco Horizonte',
    side: 'front',
    kind: 'institution',
    explanation:
      'El nombre de la entidad es un dato visual. No sirve como secreto ni demuestra por sí solo que la tarjeta sea auténtica: cualquiera puede imprimir un nombre parecido.',
  },
  {
    id: 'chip',
    label: 'Chip',
    value: 'Chip EMV',
    side: 'front',
    kind: 'physical',
    explanation:
      'El chip es un elemento físico que interviene en pagos presenciales. No se dicta por teléfono ni se comparte por mensaje; se protege manteniendo la tarjeta segura.',
  },
  {
    id: 'card_number',
    label: 'Número de tarjeta',
    value: '0000 0000 0000 0000',
    side: 'front',
    kind: 'identifier',
    explanation:
      'El número identifica la tarjeta. Por sí solo no basta para un pago, pero combinado con la fecha y el código de seguridad puede facilitar un intento de fraude. No lo publiques ni lo envíes por canales no verificados.',
  },
  {
    id: 'cardholder_name',
    label: 'Nombre del titular',
    value: 'ANA DEMO',
    side: 'front',
    kind: 'identifier',
    explanation:
      'El nombre del titular es información identificativa. Ayuda a identificar o suplantar a una persona, pero por sí solo no equivale a una credencial de autenticación.',
  },
  {
    id: 'expiration_date',
    label: 'Fecha de vencimiento',
    value: '12/30',
    side: 'front',
    kind: 'expiry',
    explanation:
      'La fecha de vencimiento se usa junto con el número y el código de seguridad en compras a distancia. Protégela aunque no sea un secreto por sí sola.',
  },
  {
    id: 'magnetic_stripe',
    label: 'Banda magnética',
    value: 'Datos de la banda',
    side: 'back',
    kind: 'physical',
    explanation:
      'La banda magnética contiene datos de la tarjeta. No debe fotografiarse ni compartirse: su exposición facilita la copia y el uso fraudulento.',
  },
  {
    id: 'security_code',
    label: 'Código de seguridad (CVV)',
    value: '000',
    side: 'back',
    kind: 'secret',
    explanation:
      'El CVV es un código de seguridad. Debe mantenerse confidencial y nunca se comparte por teléfono, chat o correo ante una solicitud sospechosa. En una tarjeta física suele estar en el reverso.',
  },
]

export const CARD_FIELD_BY_ID: Record<string, CardField> = Object.fromEntries(
  CARD_FIELDS.map((field) => [field.id, field]),
)

/** Notas compartidas por las preguntas. La pregunta puede sobrescribirlas. */
export const CARD_FIELD_EXPLANATIONS: Record<string, string> = Object.fromEntries(
  CARD_FIELDS.map((field) => [field.id, field.explanation]),
)

export const CARD_CLASSIFICATIONS: CardClassificationOption[] = [
  {
    id: 'proteccion',
    label: 'Dato que requiere protección',
    description:
      'Información que conviene mantener privada, aunque por sí sola no autentique una operación.',
  },
  {
    id: 'identificativa',
    label: 'Información identificativa',
    description:
      'Dato que ayuda a identificar a una persona o una cuenta, como el nombre del titular.',
  },
  {
    id: 'fisica',
    label: 'Elemento visual o físico',
    description:
      'Parte de la tarjeta que se ve o se toca, como el chip, la banda o el nombre de la entidad.',
  },
  {
    id: 'secreto',
    label: 'Secreto de autenticación',
    description:
      'Código que se usa como secreto para validar una operación y que nunca debe compartirse.',
  },
]

/**
 * Banco de preguntas. La primera partida usa todas, en este orden:
 * A → B → C → D → E → información insuficiente.
 */
export const CARD_QUESTIONS: CardQuestion[] = [
  {
    id: 'anatomia-q1',
    kind: 'A',
    categoryId: 'credenciales',
    prompt: 'Selecciona los tres datos que debes proteger con especial cuidado.',
    instruction:
      'Toca los campos de la tarjeta. Puedes elegir hasta tres; si necesitas ver el reverso, usa la pestaña «Reverso».',
    interactionType: 'multiple',
    correctFieldIds: ['card_number', 'expiration_date', 'security_code'],
    distractorFieldIds: ['issuer', 'chip', 'cardholder_name', 'magnetic_stripe'],
    maxSelections: 3,
    expectedSelections: 3,
    initialSide: 'front',
    fieldExplanations: CARD_FIELD_EXPLANATIONS,
    generalExplanation:
      'Los tres datos que más conviene proteger son el número, la fecha de vencimiento y el código de seguridad. El nombre también es información personal, pero no funciona como una credencial de pago por sí solo.',
    safetyRecommendation:
      'No compartas los datos de tu tarjeta por mensajes, llamadas ni formularios que no controles. Si te los piden, verifica por el canal oficial de tu entidad.',
  },
  {
    id: 'anatomia-q2',
    kind: 'B',
    categoryId: 'credenciales',
    prompt: '¿Dónde aparece la fecha de vencimiento?',
    instruction: 'Toca el campo que responde a la pregunta.',
    interactionType: 'single',
    correctFieldIds: ['expiration_date'],
    distractorFieldIds: [
      'issuer',
      'chip',
      'card_number',
      'cardholder_name',
      'magnetic_stripe',
      'security_code',
    ],
    maxSelections: 1,
    expectedSelections: 1,
    initialSide: 'front',
    fieldExplanations: CARD_FIELD_EXPLANATIONS,
    generalExplanation:
      'La fecha de vencimiento aparece en el anverso, junto al nombre del titular. Se escribe como mes y año, por ejemplo 12/30.',
    safetyRecommendation:
      'Si alguien te pide la fecha de vencimiento junto con otros datos de la tarjeta, desconfía: no es información que deba circular por chat o teléfono.',
  },
  {
    id: 'anatomia-q3',
    kind: 'C',
    categoryId: 'credenciales',
    prompt:
      '¿Qué elemento de la tarjeta funciona como un código secreto que nunca debes compartir?',
    instruction:
      'Si no ves el código, gira la tarjeta con la pestaña «Reverso» y toca el campo correspondiente.',
    interactionType: 'single',
    correctFieldIds: ['security_code'],
    distractorFieldIds: [
      'issuer',
      'chip',
      'card_number',
      'cardholder_name',
      'expiration_date',
      'magnetic_stripe',
    ],
    maxSelections: 1,
    expectedSelections: 1,
    initialSide: 'back',
    fieldExplanations: CARD_FIELD_EXPLANATIONS,
    generalExplanation:
      'El CVV es un código de seguridad de la tarjeta. No sustituye la contraseña de tu cuenta, pero se trata como un secreto: se mantiene confidencial y no se comparte ante una petición sospechosa.',
    safetyRecommendation:
      'Nunca dictes el CVV por teléfono ni lo escribas en un chat. Si una persona dice ser del banco y te lo pide, corta la comunicación y llama tú al número oficial.',
  },
  {
    id: 'anatomia-q4',
    kind: 'D',
    categoryId: 'suplantacion',
    prompt:
      'Si alguien publicara una foto de esta tarjeta, ¿qué datos quedarían expuestos y podrían facilitar un pago o una suplantación?',
    instruction:
      'Selecciona los cuatro datos sensibles. La banda, el chip y la entidad también forman parte de la tarjeta, pero no son los datos que se escriben en una compra a distancia.',
    interactionType: 'multiple',
    correctFieldIds: [
      'card_number',
      'cardholder_name',
      'expiration_date',
      'security_code',
    ],
    distractorFieldIds: ['issuer', 'chip', 'magnetic_stripe'],
    maxSelections: 4,
    expectedSelections: 4,
    initialSide: 'front',
    fieldExplanations: CARD_FIELD_EXPLANATIONS,
    generalExplanation:
      'El riesgo no depende de un único dato: la combinación de número, nombre, vencimiento y CVV es la que puede facilitar un intento de pago o una suplantación. Una foto pública expone mucho más que un dato aislado, y el contexto cambia el nivel de riesgo.',
    safetyRecommendation:
      'No publiques fotos de tu tarjeta ni la dejes a la vista en lugares públicos. Si necesitas mostrar que tienes una tarjeta, tapa el número, la fecha y el CVV.',
  },
  {
    id: 'anatomia-q5',
    kind: 'E',
    categoryId: 'credenciales',
    prompt: 'Clasifica el código de seguridad (CVV).',
    instruction:
      'Primero toca el campo del CVV en el reverso y después elige la categoría que mejor lo describe.',
    interactionType: 'classify',
    correctFieldIds: ['security_code'],
    distractorFieldIds: [
      'issuer',
      'chip',
      'card_number',
      'cardholder_name',
      'expiration_date',
      'magnetic_stripe',
    ],
    maxSelections: 1,
    expectedSelections: 1,
    initialSide: 'back',
    classify: {
      targetFieldId: 'security_code',
      correctClassificationId: 'secreto',
      options: CARD_CLASSIFICATIONS,
    },
    fieldExplanations: CARD_FIELD_EXPLANATIONS,
    generalExplanation:
      'El CVV es un código de seguridad de la tarjeta. No identifica por sí solo al titular ni sustituye una contraseña, pero se trata como un secreto: se mantiene confidencial y no se comparte. Las categorías pueden solaparse en la vida real; aquí lo importante es reconocer su función principal.',
    safetyRecommendation:
      'Trata el CVV como una llave más de la tarjeta. Si alguien lo tiene, puede intentar usarlo junto con el número y la fecha; por eso nunca se comparte.',
  },
  {
    id: 'anatomia-q6',
    kind: 'insufficient',
    categoryId: 'compras',
    prompt:
      'Con solo mirar esta tarjeta, ¿puedes confirmar que está activa y tiene fondos?',
    instruction:
      'Revisa los campos. Si la tarjeta no contiene esa información, elige «No hay información suficiente».',
    interactionType: 'single',
    correctFieldIds: [],
    distractorFieldIds: CARD_FIELDS.map((field) => field.id),
    maxSelections: 1,
    expectedSelections: 0,
    initialSide: 'front',
    allowInsufficient: true,
    correctVerdict: 'insufficient',
    insufficientLabel: 'No hay información suficiente',
    fieldExplanations: {
      ...CARD_FIELD_EXPLANATIONS,
      card_number:
        'El número no dice si la tarjeta está activa, si tiene fondos o si pertenece a una persona real. Solo identifica la tarjeta.',
      cardholder_name:
        'El nombre no confirma que la tarjeta esté activa. Cualquiera puede imprimir un nombre en una tarjeta ficticia.',
      expiration_date:
        'La fecha de vencimiento no indica si la tarjeta está activa ni si tiene saldo disponible.',
      security_code:
        'El CVV es un dato de seguridad, no una prueba de que la tarjeta esté activa o tenga fondos.',
      chip:
        'El chip es un elemento físico. Su presencia no confirma que la tarjeta funcione ni que tenga fondos.',
      magnetic_stripe:
        'La banda magnética puede estar dañada o bloqueada. Su presencia no prueba que la tarjeta esté activa.',
      issuer:
        'El nombre de la entidad es solo un dato visual. No confirma la validez ni el estado de la tarjeta.',
    },
    generalExplanation:
      'Una tarjeta puede parecer completa y aun así estar bloqueada, vencida o no tener fondos. La imagen no prueba que esté activa ni que pertenezca a una persona real. En seguridad, reconocer que falta información evita conclusiones falsas.',
    safetyRecommendation:
      'No aceptes una foto de tarjeta como prueba de pago. Confirma el movimiento en tu aplicación o en el canal oficial antes de entregar dinero o productos.',
  },
]
