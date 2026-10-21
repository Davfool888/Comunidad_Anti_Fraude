import { QUIZ_SCENARIOS } from './scenarios'
import type { QuizQuestion } from '../types'

/**
 * Juego 5 · **Desafío contrarreloj**.
 *
 * Diez situaciones breves. El banco es mayor que la partida: cada vez se
 * eligen al azar, de modo que repetir la partida no repite las mismas
 * preguntas. La posición de la respuesta recomendada está repartida a lo largo
 * de las opciones para no crear una regla automática.
 */
export const TIME_ATTACK_QUESTIONS: QuizQuestion[] = [
  {
    id: 'ta-1',
    scenario: QUIZ_SCENARIOS['ta-1'],
    categoryId: 'credenciales',
    prompt: 'Recibes un código de acceso que no solicitaste y alguien te pide que se lo leas por teléfono.',
    context: 'La voz dice ser del área de seguridad de tu entidad financiera.',
    options: [
      {
        id: 'a',
        label: 'Leerle el código, pero taparlo con la mano mientras hablo.',
        verdict: 'incorrect',
        explanation:
          'El código no depende de cómo lo leas: en cuanto lo dices, quien lo escucha puede usarlo. Ninguna entidad financiera te lo pide por teléfono.',
      },
      {
        id: 'b',
        label: 'Colgar y llamar por mi cuenta a la entidad financiera, usando el número de la app o de la tarjeta.',
        verdict: 'correct',
        explanation:
          'El canal de verificación lo eliges tú. Colgar y marcar el número que ya tienes es la forma más segura de confirmar si hay una operación real.',
      },
      {
        id: 'c',
        label: 'Preguntar por qué me necesitan a mí y no a la oficina.',
        verdict: 'partial',
        explanation:
          'La pregunta es razonable, pero seguir en la línea con alguien que ya te pidió el código deja la puerta abierta. Lo que decide es terminar la llamada y verificar por un canal propio.',
      },
      {
        id: 'd',
        label: 'Decir que no estoy en casa y colgar sin más.',
        verdict: 'partial',
        explanation:
          'Colgar está bien, pero sin verificar no queda claro si había una operación real en curso. Falta el paso de confirmar por tu propio canal.',
      },
    ],
    learning:
      'El código de un solo uso es la llave de tu cuenta. Si te lo piden, la respuesta es la misma: terminar la comunicación y verificar por un canal oficial.',
  },
  {
    id: 'ta-2',
    scenario: QUIZ_SCENARIOS['ta-2'],
    categoryId: 'comprobantes',
    prompt: 'Un comprador te envía una captura de pago, pero el dinero no aparece en tu cuenta.',
    options: [
      {
        id: 'a',
        label: 'Despachar igual: la captura es una captura y el monto coincide.',
        verdict: 'incorrect',
        explanation:
          'Una captura es una imagen y puede estar editada. Además, tu propia cuenta dice que no hay dinero: despachar es perder mercancía y dinero.',
      },
      {
        id: 'b',
        label: 'Revisar el movimiento en mi app y no despachar hasta que aparezca.',
        verdict: 'correct',
        explanation:
          'El estado de cuenta de tu entidad financiera es la fuente de verdad. Si el movimiento no aparece, el pago no se ha recibido.',
      },
      {
        id: 'c',
        label: 'Esperar unas horas por si la transferencia se demora.',
        verdict: 'partial',
        explanation:
          'Esperar un rato razonable tiene sentido para transferencias interbancarias. El error es despachar sin comprobar: la verificación, no la espera, es lo que protege.',
      },
      {
        id: 'd',
        label: 'Pedir que el comprador pague otra vez a la cuenta correcta.',
        verdict: 'incorrect',
        explanation:
          'Pedir un segundo pago antes de verificar es cobrar dos veces. Primero se comprueba si el primer pago existe.',
      },
    ],
    learning: 'El comprobante nunca sustituye al movimiento real en tu cuenta.',
  },
  {
    id: 'ta-3',
    scenario: QUIZ_SCENARIOS['ta-3'],
    categoryId: 'compras',
    prompt: 'Una tienda ofrece un producto muy barato y exige una transferencia inmediata.',
    options: [
      {
        id: 'a',
        label: 'Pagar ya: el precio es una oportunidad real y no va a durar.',
        verdict: 'incorrect',
        explanation:
          'Un precio muy por debajo del mercado, con exigencia de pago inmediato, es el patrón clásico del fraude de venta. Lo que se está vendiendo es tu confianza.',
      },
      {
        id: 'b',
        label: 'Pagar por la plataforma, con protección al comprador, si aceptan.',
        verdict: 'correct',
        explanation:
          'Si aceptan pagar dentro de la plataforma, conservas la mediación y el reembolso. Si se niegan, esa negativa ya es información suficiente para no comprar.',
      },
      {
        id: 'c',
        label: 'Preguntar por la política de devoluciones antes de decidir.',
        verdict: 'partial',
        explanation:
          'Preguntar es una de las comprobaciones básicas y está bien. El problema es que la pregunta no compensa pagar por adelantado: la verificación tiene que ser sobre la existencia del vendedor, no sólo sobre su política.',
      },
      {
        id: 'd',
        label: 'Comprar y, si no llega, reclamar por la plataforma.',
        verdict: 'incorrect',
        explanation:
          'Comprar primero y reclamar después invierte el orden de la protección. La reclamación sólo funciona si el pago está dentro de la plataforma.',
      },
    ],
    learning: 'El precio inverosímil es el anzuelo; el pago fuera de la plataforma elimina tu protección.',
  },
  {
    id: 'ta-4',
    scenario: QUIZ_SCENARIOS['ta-4'],
    categoryId: 'enlaces',
    prompt: 'Una supuesta empresa de mensajería solicita una tarifa mediante un enlace desconocido.',
    options: [
      {
        id: 'a',
        label: 'Abrir el enlace para ver si la tarifa es real.',
        verdict: 'incorrect',
        explanation:
          'Abrir un enlace desconocido entrega tu navegador al atacante. No hace falta abrirlo para saber que es sospechoso: la URL misma ya es la senalñal.',
      },
      {
        id: 'b',
        label: 'Escribir a la empresa de mensajería por su canal oficial y comprobar si tengo un envío pendiente.',
        verdict: 'correct',
        explanation:
          'Verificar por un canal propio resuelve el caso sin exponerte. Si no hay ningún envío a tu nombre, el mensaje era falso.',
      },
      {
        id: 'c',
        label: 'Comprobar si el aviso aparece en la app de la empresa.',
        verdict: 'correct',
        explanation:
          'Es una de las dos comprobaciones correctas: la app es un canal oficial. Si en la app no aparece ningún paquete retenido, no hay nada que pagar.',
      },
      {
        id: 'd',
        label: 'Reenviar el aviso al número de atención al cliente que aparece en el mensaje.',
        verdict: 'incorrect',
        explanation:
          'Ese número también lo eligió el atacante. Reenviar el mensaje a un contacto del propio mensaje convierte el aviso en un canal de comunicación con el atacante.',
      },
    ],
    learning: 'Para investigar un aviso no hace falta abrir el enlace: basta con mirar tu app o escribir por tu cuenta.',
  },
  {
    id: 'ta-5',
    scenario: QUIZ_SCENARIOS['ta-5'],
    categoryId: 'laboral',
    prompt: 'Una oferta laboral exige un pago para activar el contrato.',
    options: [
      {
        id: 'a',
        label: 'Pagar la cuota: son unos pocos miles y el puesto es bueno.',
        verdict: 'incorrect',
        explanation:
          'Ningún trabajo legítimo cobra por emitirse. El pago es el objetivo de la oferta, no un requisito de la contratación.',
      },
      {
        id: 'b',
        label: 'Verificar la vacante en los canales oficiales de la empresa y no pagar nada mientras tanto.',
        verdict: 'correct',
        explanation:
          'Si la empresa existe de verdad, su sitio web, su correo corporativo y sus vacantes publicadas la confirman. Todo lo que te envíen por mensaje queda en segundo plano.',
      },
      {
        id: 'c',
        label: 'Pedirles el número de registro mercantil de la empresa para comprobarla.',
        verdict: 'partial',
        explanation:
          'Pedir el registro es un paso razonable, pero un número de registro se puede inventar o robar. La comprobación tiene que hacerse en el registro oficial, no en lo que te envíen.',
      },
      {
        id: 'd',
        label: 'Negociar que la cuota se pague al final, cuando empiece a trabajar.',
        verdict: 'incorrect',
        explanation:
          'Negociar el momento del pago no cambia la naturaleza de la petición: si hay que pagar, es un fraude. La respuesta es no pagar.',
      },
    ],
    learning: 'Ningún empleo legítimo te cobra por empezar. Verifica la vacante por los canales oficiales de la empresa.',
  },
  {
    id: 'ta-6',
    scenario: QUIZ_SCENARIOS['ta-6'],
    categoryId: 'inversiones',
    prompt: 'Una persona promete duplicar tu dinero y muestra testimonios de ganancias.',
    options: [
      {
        id: 'a',
        label: 'Invertir una cantidad pequeña para ver cómo responde.',
        verdict: 'incorrect',
        explanation:
          'Las Rentabilidades garantizadas no existen y «una cantidad pequeña» es exactamente el cebo: es la primera quitar un hurdle. Lo que se pierde es dinero real.',
      },
      {
        id: 'b',
        label: 'Comprobar si la entidad está autorizada en el registro oficial.',
        verdict: 'correct',
        explanation:
          'Es la comprobación que separa una entidad real de una inventada. Si no aparece, no inviertas. Los testimonios no sustituyen al registro.',
      },
      {
        id: 'c',
        label: 'Pedirles el balance o los resultados auditados del último año.',
        verdict: 'partial',
        explanation:
          'Pedir documentación financiera es razonable, pero un balance falso se falsifica igual que un certificado. La verificación tiene que hacerse en una fuente independiente.',
      },
      {
        id: 'd',
        label: 'Pedirles a otros participantes referencias y contacting directamente.',
        verdict: 'partial',
        explanation:
          'Buscar referencias por tu cuenta es buena idea, pero las referencias de un grupo de whatsApp pueden ser las mismas personas del mismo grupo. Combínalo con el registro oficial.',
      },
    ],
    learning: 'Verifica en el registro oficial de entidades autorizadas. Los testimonios no son evidencia.',
  },
  {
    id: 'ta-7',
    scenario: QUIZ_SCENARIOS['ta-7'],
    categoryId: 'suplantacion',
    prompt: 'Recibes un mensaje de un familiar desde un número nuevo solicitando ayuda económica.',
    options: [
      {
        id: 'a',
        label: 'Transferir lo que pide, pero pedirle que me confirme con un mensaje más tarde.',
        verdict: 'incorrect',
        explanation:
          'La transferencia es irreversible y la «confirmación posterior» no la deshace. El dinero ya salió cuando el atacante lo ordena.',
      },
      {
        id: 'b',
        label: 'No transferir y llamar al familiar por su número habitual o por otro canal que ya conozca.',
        verdict: 'correct',
        explanation:
          'La verificación va por un canal independiente, no por el número del mensaje. Si logras confirmar que es quien dice ser, la historia cambia; si no, no envías nada.',
      },
      {
        id: 'c',
        label: 'No transferir y preguntarle algo que sólo él sabría, por ejemplo el nombre de su mascota.',
        verdict: 'partial',
        explanation:
          'Entiendes que la información del mensaje no basta, y por eso preguntas. Pero muchos datos personales están publicados: la pregunta no es concluyente y el canal sigue siendo el del atacante.',
      },
      {
        id: 'd',
        label: 'No transferir y avisar al familiar por el mismo número, pidiéndole que no heed.',
        verdict: 'partial',
        explanation:
          'Avisar está bien, pero si escribes al mismo número, el atacante recibe el mensaje y puede acelerar la presión. Mejor usa el canal habitual de siempre.',
      },
    ],
     learning: 'Verifica por un canal independiente. Los datos personales correctos no prueban la identidad.',
  },
  {
    id: 'ta-8',
    scenario: QUIZ_SCENARIOS['ta-8'],
    categoryId: 'incidentes',
    prompt: 'Descubres que tu cuenta tiene una sesión iniciada que no reconoces.',
    options: [
      {
        id: 'a',
        label: 'Cerrar la sesión desconocida y continuar usando la cuenta con normalidad.',
        verdict: 'partial',
        explanation:
          'Cerrar la sesión es correcto, pero si la entrada fue real, la contraseña está comprometida. Quedarte dentro con la misma clave deja la puerta abierta.',
      },
      {
        id: 'b',
        label: 'Cambiar la contraseña, revisar el correo de recuperación y activar la verificación en dos pasos.',
        verdict: 'correct',
        explanation:
          'Con una sesión ajena, la contraseña puede estar filtrada. Cambiarla, comprobar que el correo de recuperación sigue siendo tuyo y activar el segundo factor cierra el riesgo.',
      },
      {
        id: 'c',
        label: 'Cerrar sesión, cambiar la contraseña y revisar las otras cuentas donde use la misma clave.',
        verdict: 'correct',
        explanation:
          'Es la respuesta completa: cambiar la clave en todos los sitios donde se usaba, porque si la robaron una vez, la robaron en todas.',
      },
      {
        id: 'd',
        label: 'Cambiar la contraseña y pedirle al soporte que elimine el historial de sesiones.',
        verdict: 'partial',
        explanation:
          'Cambiar la contraseña es lo principal, pero el historial de sesiones no es lo que hay que atacar: hay que cerrar la sesión activa y revisar el correo de recuperación.',
      },
    ],
    learning:
      'Una sesión desconocida significa que la contraseña puede estar comprometida: cámbiala en todas partes y activa el segundo factor.',
  },
  {
    id: 'ta-9',
    scenario: QUIZ_SCENARIOS['ta-9'],
    categoryId: 'phishing',
    prompt: 'Introdujiste tu contraseña en una página sospechosa.',
    options: [
      {
        id: 'a',
        label: 'Cerrar la página y esperar a que se agote la sesión.',
        verdict: 'incorrect',
        explanation:
          'La sesión no se agota sola si el atacante ha guardado la contraseña: puede usarla cuando quiera. Cerrar la página no protege nada.',
      },
      {
        id: 'b',
        label: 'Cambiar la contraseña de esa cuenta y de todas las que compartían esa misma clave.',
        verdict: 'correct',
        explanation:
          'Es lo que hay que hacer: cambiar la clave en todos los servicios donde se usaba y activar la verificación en dos pasos.',
      },
      {
        id: 'c',
        label: 'Cambiar la contraseña y revisar las cuentas donde ese correo sirve de recuperación.',
        verdict: 'correct',
        explanation:
          'Correcto: el correo de recuperación es la puerta trasera de todas las cuentas. Si alguien entra en tu correo, puede resetear las demás contraseñas.',
      },
      {
        id: 'd',
        label: 'Reportar la página y cambiar la contraseña cuando me acuerde.',
        verdict: 'partial',
        explanation:
          'Reportar está bien, pero «cuando me acuerde» es el problema: mientras la contraseña siga activa, alguien más puede entrar. Cambiarla es lo urgente.',
      },
    ],
    learning:
      'Si tu contraseña pudo quedar expuesta, cámbiala ya y revisa las cuentas que dependan de ese correo.',
  },
  {
    id: 'ta-10',
    scenario: QUIZ_SCENARIOS['ta-10'],
    categoryId: 'comprobantes',
    prompt: 'Ya realizaste una transferencia y el vendedor desapareció.',
    options: [
      {
        id: 'a',
        label: 'Conservar toda la evidencia y contactar al proveedor de pago y a las autoridades.',
        verdict: 'correct',
        explanation:
          'Es lo que puede funcionar: la evidencia permite rastrear y el proveedor de pago puede abrir un proceso de reversión o bloqueo. Cuanto antes, más opciones.',
      },
      {
        id: 'b',
        label: 'Conservar la evidencia, contactar al proveedor de pago y compartir la alerta en la red de comercios.',
        verdict: 'correct',
        explanation:
          'Correcto: las tres acciones se refuerzan. La evidencia para el reporte, el proveedor para el dinero y la red para que no caiga otro barrio.',
      },
      {
        id: 'c',
        label: 'Pagar a alguien que promete recuperar el dinero a cambio de una tarifa.',
        verdict: 'incorrect',
        explanation:
          'Es la segunda etapa del fraude. Nadie recupera dinero a cambio de un pago previo, y ese intermediario se queda con tu tarifa.',
      },
      {
        id: 'd',
        label: 'Publicar la historia en redes para que se note y el vendedor se espante.',
        verdict: 'incorrect',
        explanation:
          'Publicar una acusación sin comprobar puede perjudicar a la persona equivocada, no garantiza la devolución y destruye la trazabilidad de la evidencia.',
      },
    ],
    learning:
      'Después de un incidente: evidencia, proveedor de pago, autoridades y red. Nunca un «recuperador» que cobre por adelantado.',
  },
]
