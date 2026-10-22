import type { GameIntro } from '../types'

/**
 * Diapositivas de introducción de cada juego.
 *
 * Son breves a propósito: explican el tipo de fraude, cómo suele funcionar,
 * dos o tres señales de alerta y una recomendación preventiva. El detalle de
 * cada caso se muestra después, en la diapositiva de situación.
 */
export const GAME_INTROS: Record<string, GameIntro> = {
  detectives: {
    title: 'Phishing y mensajes fraudulentos',
    summary:
      'El phishing es un mensaje que se hace pasar por alguien de confianza para que entregues información, pagues o instales algo. Ya no se detecta por los errores de ortografía: llegan bien escritos, con el nombre y el logo de tu banco, e incluso con datos reales de tu vida. Por eso la clave no es leer mejor, sino verificar por un canal que tú elijas.',
    howItWorks:
      'El atacante te presiona con una urgencia («tu cuenta se bloquea en 15 minutos»), te pide tus credenciales y te lleva a una página que imita a la de la entidad financiera. Al escribir tus datos, el acceso queda en sus manos.',
    signs: [
      'Un plazo corto con una amenaza si no actúas.',
      'Piden tu clave, tu PIN o un código de un solo uso.',
      'El enlace no es el dominio real de la entidad.',
    ],
    prevention:
      'Nunca entregues una clave ni un código de un solo uso, y verifica siempre desde la app o escribiendo tú la dirección del sitio oficial.',
    illustration: 'phishing',
  },
  historias: {
    title: 'Decisiones que cambian el resultado',
    summary:
      'Un solo paso mal dado en un fraude puede ser la diferencia entre un susto y una pérdida. En este juego vas a recorrer situaciones reales de la red: un paquete retenido, una llamada que pide un código, un comprobante que no cuadra. Cada decisión que tomes lleva a un camino distinto, con consecuencias distintas. El objetivo no es acertar a la primera: es entender qué hiciste y por qué.',
    howItWorks:
      'Lees la situación, decides y la historia reacciona. Si te equivocas no se acaba el juego: ves la consecuencia, la explicas y sigues. Al final se resume qué decisiones fueron seguras y cuáles dejaron la puerta abierta.',
    signs: [
      'Un mensaje que combina urgencia con una petición de datos.',
      'Una explicación que encaja demasiado bien con tu miedo.',
      'La presión para actuar antes de poder verificar.',
    ],
    prevention:
      'Cuando algo te apremia, ganar tiempo es parte de la estrategia: verifica por un canal propio antes de mover dinero o datos.',
    illustration: 'whatsapp',
  },
  diferencias: {
    title: 'Comparar para decidir',
    summary:
      'Detectar un fraude no consiste en encontrar la pista que lo delata, sino en comparar la información y detectar incoherencias. Dos tiendas, dos comprobantes o dos direcciones parecidas pueden esconder diferencias pequeñas que son justamente las importantes. Este juego entrena el ojo para el contraste, no para la regla fácil.',
    howItWorks:
      'Enfrentas dos fichas y marcas los elementos que merecen atención. Al final se explica cuáles son señales de alerta, cuáles necesitan verificación y cuáles no permiten concluir nada. A veces la diferencia no prueba un fraude: solo que falta información.',
    signs: [
      'Precios, plazos o condiciones que no encajan entre sí.',
      'Datos que apuntan a un tercero en lugar del vendedor.',
      'Información publicada que no se puede comprobar.',
    ],
    prevention:
      'No busques una señal aislada: revisa si el conjunto de la información es coherente y si puedes verificar al vendedor.',
    illustration: 'receipt',
  },
  laboratorio: {
    title: 'Separar hechos de sospechas',
    summary:
      'Cuando ocurre un fraude es fácil culpar al primero que aparece, y ese error tiene consecuencias reales para la persona señalada y para quien investigó. Este juego trabaja lo contrario: organizar un expediente y separar lo que está documentado de lo que es una sospecha y de lo que todavía no se sabe. La conclusión llega al final, y es prudente.',
    howItWorks:
      'Recibes seis evidencias, las clasificas, evalúas tres hipótesis y eliges las acciones prioritarias. El informe final habla de posible fraude, indicios de riesgo y hechos pendientes de verificación.',
    signs: [
      'Una hipótesis que explica demasiado bien todos los datos.',
      'Confundir el silencio de alguien con una prueba en su contra.',
      'Actuar de forma que destruya la evidencia que falta por conseguir.',
    ],
    prevention:
      'Guarda las capturas, ordena los hechos en el tiempo y reporta lo que ocurrió, no lo que sospechas de una persona.',
    illustration: 'shop',
  },
  contrarreloj: {
    title: 'Diez decisiones rápidas',
    summary:
      'En la vida real las señales aparecen de golpe: un mensaje entre dos cosas, un comprobante mientras el cliente espera. Este juego entrena esa velocidad, pero sin castigo: el temporizador es opcional y nunca descuenta puntos. Lo que se evalúa es la seguridad de la decisión, no la rapidez.',
    howItWorks:
      'Diez situaciones de categorías distintas, elegidas al azar de un banco más grande, así que repetir la partida no repite las preguntas. Cada respuesta recibe su explicación y el resultado final muestra en qué categorías conviene reforzar.',
    signs: [
      'Un mensaje que pide una clave o un código de un solo uso.',
      'Una captura de pago sin movimiento en tu propia cuenta.',
      'Un precio o una rentabilidad que no se sostiene.',
    ],
    prevention:
      'Ten siempre presente la respuesta que sirve en casi todos los casos: verificar por un canal oficial antes de entregar datos o dinero.',
    illustration: 'job',
  },
  'vf-desafio': {
    title: 'Verdadero, falso o no sabemos',
    summary:
      'El pensamiento crítico se entrena con afirmaciones que suenan tajantes. Muchas no son falsas: son demasiado absolutas, y ese matiz cambia lo que hay que hacer. Este juego incluye una tercera respuesta, la de no saber, que a menudo es la más honesta. Saber que falta información es una decisión, no una duda.',
    howItWorks:
      'Diez afirmaciones sobre seguridad digital. Eliges entre verdadero, falso o que no tenemos información suficiente y recibes una explicación que distingue la afirmación falsa de la demasiado absoluta.',
    signs: [
      'Siempre, nunca y garantizado suelen esconder el problema.',
      'Una característica que parece una garantía pero solo describe una cosa.',
      'Confundir no ver señales con que no pasa nada.',
    ],
    prevention:
      'Cuando una afirmación te parezca demasiado segura, trátala como una hipótesis: busca el canal de verificación antes de actuar.',
    illustration: 'investment',
  },
  'protege-cuenta': {
    title: 'Proteger una cuenta que te han tomado',
    summary:
      'Cuando alguien entra en tu cuenta de mensajería puede escribirle a tus contactos con tu nombre, y eso abre un fraude nuevo dirigido a ellos. Este juego simula ese incidente en tres fases, verificar, proteger y recuperar, para que sepas qué hacer en los primeros minutos, que son los que deciden el resultado.',
    howItWorks:
      'Simulas un aviso de acceso desconocido, una sesión ajena y mensajes que salieron de tu perfil. En cada fase eliges la acción y ves el estado de la cuenta. Si ya perdiste el acceso, se explica el procedimiento oficial de recuperación.',
    signs: [
      'Una sesión activa que no reconoces en otro dispositivo.',
      'Mensajes enviados desde tu cuenta que tú no escribiste.',
      'Una solicitud de recuperación de contraseña pendiente.',
    ],
    prevention:
      'Activa la verificación en dos pasos, revisa el correo de recuperación y avisa a tus contactos si tu cuenta pudo usarse.',
    illustration: 'credentials',
  },
  'anatomia-tarjeta': {
    title: 'Anatomía de una tarjeta',
    summary:
      'Una tarjeta bancaria contiene varios datos que se usan juntos para identificar una cuenta y autorizar pagos. En este juego vas a tocar sus campos sobre una tarjeta ficticia, distinguir qué información es sensible y comprobar por qué una foto no demuestra que la tarjeta esté activa. No vas a introducir datos reales.',
    howItWorks:
      'Verás una tarjeta de demostración con anverso y reverso. Cada pregunta te pide tocar uno o varios campos; después recibes una explicación sobre el papel de cada dato y una recomendación para protegerlo. Al final se resumen las decisiones seguras y lo que conviene repasar.',
    signs: [
      'Alguien pide el número, la fecha y el CVV por el mismo canal.',
      'Una foto de tarjeta se presenta como prueba de un pago.',
      'Un supuesto banco solicita datos por teléfono o chat.',
    ],
    prevention:
      'Protege los datos de la tarjeta en conjunto, no compartas el CVV y confirma cualquier pago desde el canal oficial. Una imagen de una tarjeta no prueba que esté activa ni que tenga fondos.',
    illustration: 'card',
  },
  plan: {
    title: 'Un plan que puedas sostener',
    summary:
      'Saber no es lo mismo que hacer: la mayoría de los fraudes se resuelven con dos o tres hábitos, no con un manual. Este juego te ayuda a construir un plan de protección realista: eliges las medidas que vas a aplicar de verdad, entiendes para qué sirve cada una y te lo llevas por escrito para revisarlo.',
    howItWorks:
      'Seleccionas entre diez medidas preventivas, ves la explicación de cada una y generas un resumen descargable. No se guarda ningún dato tuyo: el plan es la lista de medidas, no tus cuentas.',
    signs: [
      'Una sola contraseña repetida en varios servicios.',
      'Códigos de un solo uso que se comparten sin pensar.',
      'Confirmaciones de pago que nunca se miran en la app.',
    ],
    prevention:
      'Empieza por tres medidas: contraseñas únicas, verificación en dos pasos y confirmar los pagos desde tu canal financiero.',
    illustration: 'link',
  },
}
