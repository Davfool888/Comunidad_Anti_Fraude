import { QUIZ_SCENARIOS } from './scenarios'
import type { QuizQuestion } from '../types'

/**
 * Juego 6 · **Verdadero, falso o no sabemos**.
 *
 * Tres respuestas posibles. La clave no es sólo acertar: es aprender a
 * distinguir una afirmación falsa de una demasiado absoluta y de una
 * situación que simplemente requiere más información.
 */
export const TRUE_FALSE_QUESTIONS: QuizQuestion[] = [
  {
    id: 'vf-1',
    scenario: QUIZ_SCENARIOS['vf-1'],
    categoryId: 'enlaces',
    prompt: 'Una página con HTTPS siempre es segura.',
    options: [
      {
        id: 'a',
        label: 'Verdadero',
        verdict: 'incorrect',
        explanation:
          'Es una afirmación demasiado absoluta, y por eso es falsa. HTTPS sólo cifra el trayecto entre tu dispositivo y el sitio: no dice quién está detrás. Los sitios de phishing también lo usan porque el certificado es gratuito.',
      },
      {
        id: 'b',
        label: 'Falso',
        verdict: 'correct',
        explanation:
          'Correcto. El candado es una condición necesaria para casi todo, pero no suficiente: cualquiera puede obtener un certificado y escribir cualquier cosa detrás.',
      },
      {
        id: 'c',
        label: 'No tenemos información suficiente',
        verdict: 'partial',
        explanation:
          'Hay información de sobra: sabemos exactamente qué garantiza el candado y qué no. En este caso la afirmación es falsa, no incierta.',
      },
    ],
    learning:
      'HTTPS cifra el trayecto, no garantiza quién está detrás. La forma segura de llegar a un servicio sigue siendo la app o una dirección guardada.',
  },
  {
    id: 'vf-2',
    scenario: QUIZ_SCENARIOS['vf-2'],
    categoryId: 'phishing',
    prompt: 'Un mensaje con el logo de un banco demuestra que el banco lo envió.',
    options: [
      {
        id: 'a',
        label: 'Verdadero',
        verdict: 'incorrect',
        explanation:
          'El logo se copia en segundos y no tiene ningún valor como prueba. Un mensaje puede usar el nombre, el color y hasta la tipografía de tu entidad financiera.',
      },
      {
        id: 'b',
        label: 'Falso',
        verdict: 'correct',
        explanation:
          'Correcto. Lo que da authenticity a una comunicación es el canal por el que llega, no la imagen que lleva.',
      },
      {
        id: 'c',
        label: 'No tenemos información suficiente',
        verdict: 'partial',
        explanation:
          'La afirmación es falsa de forma general: el logo nunca prueba el origen. En un caso concreto sí haría falta más información, pero la afirmación tal como está escrita es falsa.',
      },
    ],
    learning: 'El logo, el nombre y el diseño son decorado: el canal es lo que prueba.',
  },
  {
    id: 'vf-3',
    scenario: QUIZ_SCENARIOS['vf-3'],
    categoryId: 'comprobantes',
    prompt: 'Un comprobante de transferencia garantiza que el dinero llegó al destinatario.',
    options: [
      {
        id: 'a',
        label: 'Verdadero',
        verdict: 'incorrect',
        explanation:
          'Un comprobante es una imagen que te entrega la otra parte: demuestra, en el mejor de los casos, que alguien tomó una captura. La recepción se confirma en la cuenta del destinatario.',
      },
      {
        id: 'b',
        label: 'Falso',
        verdict: 'correct',
        explanation:
          'Correcto. Lo que garantiza la recepción es el movimiento en la cuenta del receptor, visto en su propia entidad financiera.',
      },
      {
        id: 'c',
        label: 'No tenemos información suficiente',
        verdict: 'partial',
        explanation:
          'La afirmación es falsa tal como está escrita: el comprobante por sí solo nunca garantiza la recepción.',
      },
    ],
    learning: 'Comprobante es una imagen; la prueba es el movimiento en la cuenta del receptor.',
  },
  {
    id: 'vf-4',
    scenario: QUIZ_SCENARIOS['vf-4'],
    categoryId: 'compras',
    prompt: 'Un descuento extraordinario demuestra que una tienda es fraudulenta.',
    options: [
      {
        id: 'a',
        label: 'Verdadero',
        verdict: 'incorrect',
        explanation:
          'No lo demuestra. Hay descuentos reales, liquidaciones y productos con precio especial. Un descuento es un indicio que se combina con otros, no una prueba.',
      },
      {
        id: 'b',
        label: 'Falso',
        verdict: 'correct',
        explanation:
          'Correcto. Un descuento aislado no dice nada; lo que scream es la combinación con señales como el pago anticipado, la falta de contacto verificable o la urgencia.',
      },
      {
        id: 'c',
        label: 'No tenemos información suficiente',
        verdict: 'partial',
        explanation:
          'Sin el resto de los datos no se puede juzgar la tienda, pero la afirmación general es falsa: el descuento por sí solo no demuestra fraude.',
      },
    ],
    learning:
      'Ninguna señal aislada demuestra un fraude. Lo que permite valorarlo es el conjunto y la posibilidad de verificar.',
  },
  {
    id: 'vf-5',
    scenario: QUIZ_SCENARIOS['vf-5'],
    categoryId: 'credenciales',
    prompt: 'Un código de verificación puede dar acceso a una cuenta.',
    options: [
      {
        id: 'a',
        label: 'Verdadero',
        verdict: 'correct',
        explanation:
          'Correcto, y es la razón por la que nunca se comparte. El código de un solo uso confirma que eres tú en ese momento: quien lo obtiene puede iniciar sesión.',
      },
      {
        id: 'b',
        label: 'Falso',
        verdict: 'incorrect',
        explanation:
          'Es al revés de lo que dice. El código da acceso mientras esté vigente: por eso es el recurso más usado por los defraudadores.',
      },
      {
        id: 'c',
        label: 'No tenemos información suficiente',
        verdict: 'partial',
        explanation:
          'Sí sabemos suficiente: el funcionamiento del código de un solo uso está documentado y es el mismo en todas las entidades.',
      },
    ],
    learning: 'El código de un solo uso es una contraseña temporal: por eso nunca se comparte.',
  },
  {
    id: 'vf-6',
    scenario: QUIZ_SCENARIOS['vf-6'],
    categoryId: 'whatsapp',
    prompt: 'Una cuenta con muchos seguidores es necesariamente auténtica.',
    options: [
      {
        id: 'a',
        label: 'Verdadero',
        verdict: 'incorrect',
        explanation:
          'Los seguidores se compran en minutos. La cifra dice algo del perfil, no del negocio que hay detrás.',
      },
      {
        id: 'b',
        label: 'Falso',
        verdict: 'correct',
        explanation:
          'Correcto, y el caso 1 del juego de detectives lo muestra: un perfil nuevo y con muchos seguidores puede ser una trampa.',
      },
      {
        id: 'c',
        label: 'No tenemos información suficiente',
        verdict: 'partial',
        explanation:
          'La afirmación es falsa en términos generales: el número de seguidores nunca es una garantía. En un caso concreto, la followers sí habría que contrastarlo con otros datos.',
      },
    ],
    learning:
      'Las metricas de audiencia son muy faciles de comprar. Contrasta siempre con datos que si se puedan verificar.',
  },
  {
    id: 'vf-7',
    scenario: QUIZ_SCENARIOS['vf-7'],
    categoryId: 'incidentes',
    prompt: 'Si una persona ya transfirió dinero, no hay nada más que pueda hacer.',
    options: [
      {
        id: 'a',
        label: 'Verdadero',
        verdict: 'incorrect',
        explanation:
          'Falso y peligroso. Se puede contactar al proveedor de pago, presentar un reporte, avisar a la comunidad y, si se compartieron credenciales, proteger las cuentas afectadas.',
      },
      {
        id: 'b',
        label: 'Falso',
        verdict: 'correct',
        explanation:
          'Correcto. Cuanto antes se reporte, más opciones hay: el bloqueo de fondos, la investigación y la alerta a la comunidad siguen abiertas.',
      },
      {
        id: 'c',
        label: 'No tenemos información suficiente',
        verdict: 'partial',
        explanation:
          'La afirmación es falsa: siempre quedan acciones, aunque su resultado no esté garantizado. Que no se prometa la recuperación del dinero no significa que no haya nada que hacer.',
      },
    ],
    learning:
      'Después de un incidente siempre quedan acciones. Ninguna garantiza recuperar el dinero, pero abandonarse no es una de ellas.',
  },
  {
    id: 'vf-8',
    scenario: QUIZ_SCENARIOS['vf-8'],
    categoryId: 'suplantacion',
    prompt: 'Una llamada que muestra el número de una entidad garantiza que procede de ella.',
    options: [
      {
        id: 'a',
        label: 'Verdadero',
        verdict: 'incorrect',
        explanation:
          'El número que aparece en pantalla lo elige quien llama: se puede suplantar sin dificultad. Que coincida con el de la entidad no demuestra nada.',
      },
      {
        id: 'b',
        label: 'Falso',
        verdict: 'correct',
        explanation:
          'Correcto. Por eso la única verificación fiable es devolver la llamada por un número que tú consigas en la app o en la tarjeta.',
      },
      {
        id: 'c',
        label: 'No tenemos información suficiente',
        verdict: 'partial',
        explanation:
          'La afirmación es falsa: la suplantación del identificador de llamada es posible y habitual. En un caso concreto habría que comprobar el canal de vuelta.',
      },
    ],
    learning: 'El identificador de llamada no prueba el origen. Verifica por un canal que tú consigas.',
  },
  {
    id: 'vf-9',
    scenario: QUIZ_SCENARIOS['vf-9'],
    categoryId: 'incidentes',
    prompt: 'La falta de respuesta de un vendedor constituye por sí sola una prueba definitiva de fraude.',
    options: [
      {
        id: 'a',
        label: 'Verdadero',
        verdict: 'incorrect',
        explanation:
          'No es una prueba definitiva. Un retraso logístico, un problema de transporte o una disputa real producen el mismo síntoma. Es un indicio importante, no una conclusión.',
      },
      {
        id: 'b',
        label: 'Falso',
        verdict: 'correct',
        explanation:
          'Correcto. El silencio prolongado es un indicio de riesgo que justifica investigar y protegerse, pero no permite calificar a nadie.',
      },
      {
        id: 'c',
        label: 'No tenemos información suficiente',
        verdict: 'partial',
        explanation:
          'La afirmación es falsa en su forma absoluta: el silencio nunca es una prueba definitiva. Para valorar un caso concreto sí haría falta más información, pero la afirmación tal como está escrita es falsa.',
      },
    ],
    learning:
      'Distingue entre indicios, sospechas y hechos comprobados. La prudencia no exige acusar: exige verificar.',
  },
  {
    id: 'vf-10',
    scenario: QUIZ_SCENARIOS['vf-10'],
    categoryId: 'phishing',
    prompt: 'Verificar por un canal independiente puede reducir el riesgo de suplantación.',
    options: [
      {
        id: 'a',
        label: 'Verdadero',
        verdict: 'correct',
        explanation:
          'Correcto. Es la recomendación central de todo el módulo: si el canal lo eliges tú (la app, la tarjeta, el número del sitio oficial), el atacante deja de controlar la conversación.',
      },
      {
        id: 'b',
        label: 'Falso',
        verdict: 'incorrect',
        explanation:
          'Es al revés. Verificar por un canal independiente es justo lo que reduce el riesgo de que te suplanten a ti o a una entidad.',
      },
      {
        id: 'c',
        label: 'No tenemos información suficiente',
        verdict: 'partial',
        explanation:
          'Sí sabemos suficiente: es una recomendación sostenida por la forma en que funcionan los ataques de suplantación. La palabra «puede» la hace correcta sin exaggerated.',
      },
    ],
    learning:
      'Verificar por un canal independiente reduce el riesgo. No lo elimina: por eso se combina con el resto de medidas.',
  },
]
