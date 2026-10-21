import { DETECTIVE_SCENARIOS } from './caseScenarios'
import type { DetectiveCase } from '../types'

/**
 * Juego 1 · **Detectives digitales**.
 *
 * El usuario investiga un caso: examina un mensaje simulado, marca las señales
 * de alerta que encuentra y toma una decisión. Los casos incluyen situaciones
 * legítimas, sospechosas y ambiguas: no todo lo raro es un fraude.
 *
 * Todos los mensajes, dominios y entidades son ficticios. Los dominios usan
 * el sufijo reservado `.invalid`, que por definicion no existe.
 */
export const DETECTIVE_CASES: DetectiveCase[] = [
  /* ---------------------------------------------------------------- */
  /* Caso 1 · El supuesto bloqueo bancario                               */
  /* ---------------------------------------------------------------- */
  {
    id: 'dete-1',
    scenario: DETECTIVE_SCENARIOS['dete-1'],
    categoryId: 'phishing',
    title: 'El supuesto bloqueo bancario',
    context:
      'Recibes un SMS que afirma que tu cuenta bancaria será suspendida en quince minutos si no verificas tus datos. El mensaje incluye un enlace con un dominio que no reconoces. Al abrirlo, aparece una página que imita visualmente el acceso de una entidad bancaria y te pide usuario, contraseña y código de verificación.',
    message: {
      from: 'banco',
      parts: [
        { id: 'a', text: 'BANCO AURORA — ' },
        {
          id: 'b',
          text: 'su cuenta será suspendida en 15 minutos ',
          clueId: 'plazo',
        },
        { id: 'c', text: 'si no verifica sus datos. ', clueId: 'amenaza' },
        { id: 'd', text: 'Verifique ahora: ' },
        {
          id: 'e',
          text: 'https://banco-aurora-verificar.acceso-total.invalid/verificacion',
          clueId: 'enlace',
        },
        {
          id: 'f',
          text: 'Ingrese su usuario, su contraseña y el código de 6 dígitos enviado a su celular. ',
          clueId: 'credenciales',
        },
        { id: 'g', text: 'Enviado desde el número 320 555 0142.', clueId: 'remitente' },
      ],
    },
    clues: [
      {
        id: 'plazo',
        text: 'su cuenta será suspendida en 15 minutos ',
        label: 'Plazo imposed',
        detail:
          'El tiempo límite no tiene ningún motivo real: existe para que actúes antes de pensar. Ninguna entidad financiera te da quince minutos para verificarte.',
        alert: true,
      },
      {
        id: 'amenaza',
        text: 'si no verifica sus datos. ',
        label: 'Amenaza con bloquear la cuenta',
        detail:
          'El miedo a quedar sin acceso es la forma mas comun de engañar. Un bloqueo real se comunica por la app o en la sucursal, no por SMS con enlace.',
        alert: true,
      },
      {
        id: 'enlace',
        text: 'https://banco-aurora-verificar.acceso-total.invalid/verificacion',
        label: 'Enlace con dominio desconocido',
        detail:
          'El dominio real es «acceso-total.invalid». Todo lo que va antes de la última barra es decorado y se puede registrar a nombre de cualquiera.',
        alert: true,
      },
      {
        id: 'credenciales',
        text: 'Ingrese su usuario, su contraseña y el código de 6 dígitos enviado a su celular. ',
        label: 'Pide credenciales y un código de seguridad',
        detail:
          'Ningún banco pide tu clave ni el código de un solo uso por un enlace. Con ese código alguien puede entrar a tu cuenta.',
        alert: true,
      },
      {
        id: 'remitente',
        text: 'Enviado desde el número 320 555 0142.',
        label: 'Remitente sin verificar',
        detail:
          'El número que aparece en pantalla lo elige quien envía el mensaje. No es una prueba de que venga de tu banco.',
        alert: true,
      },
    ],
    decision: {
      prompt: '¿Qué haces?',
      options: [
        {
          id: 'a',
          label: 'Ingresar los datos antes de que termine el plazo.',
          verdict: 'incorrect',
          explanation:
            'Es la decisión que hace funcionar el fraude: entregas las credenciales de tu cuenta y el código de un solo uso. El plazo de quince minutos existe justamente para que no te dé tiempo a pensarlo.',
        },
        {
          id: 'b',
          label: 'Responder al SMS para confirmar que el banco lo envió.',
          verdict: 'incorrect',
          explanation:
            'Responder confirma que el número es real y le da un canal de contacto. además, desde ahí pueden pedirte más datos. Nada de lo que te respondan por SMS es una verificación.',
        },
        {
          id: 'c',
          label: 'No utilizar el enlace y verificar desde la app oficial o un canal bancario conocido.',
          verdict: 'correct',
          explanation:
            'Es la única opción que no depende del atacante. Abres la app (o escribes tú la dirección del banco) y compruebas si hay algún aviso. Si no hay nada, el mensaje era falso.',
        },
        {
          id: 'd',
          label: 'Compartir el mensaje con otra persona para que pruebe el enlace.',
          verdict: 'incorrect',
          explanation:
            'No hace falta abrir el enlace para investigar el caso, y el enlace de la simulacion no lleva a ninguna parte real. Ademas, compartirlo reparte el intento de fraude.',
        },
      ],
    },
    outcome: {
      kind: 'sospechoso',
      label: 'Caso con señales de alerta',
      text:
        'La combinación de urgencia, amenaza, enlace desconocido y solicitud de credenciales es un conjunto importante de señales de alerta. No hizo falta abrir el enlace: la situación se puede verificar de manera independiente.',
    },
    learning:
      'Una apariencia visual profesional o el nombre de una entidad no demuestra que una comunicación sea auténtica. La verificación se hace siempre por un canal que tú eliges.',
    points: 200,
  },

  /* ---------------------------------------------------------------- */
  /* Caso 2 · El mensaje del supuesto familiar                            */
  /* ---------------------------------------------------------------- */
  {
    id: 'dete-2',
    scenario: DETECTIVE_SCENARIOS['dete-2'],
    categoryId: 'suplantacion',
    title: 'El mensaje del supuesto familiar',
    context:
      'Recibes un mensaje desde un número desconocido. El remitente afirma ser tu hijo, dice que perdió su teléfono y solicita una transferencia urgente. También pide que no le llames porque está en una reunión. La conversación incluye el nombre del familiar y algunos datos personales que podrían estar publicados en redes sociales.',
    message: {
      from: 'contacto',
      parts: [
        { id: 'a', text: 'Mamá, soy yo, el nuevo. ' },
        {
          id: 'b',
          text: 'Perdí el celular y necesito que me transfieras $800.000 urgente, ',
          clueId: 'urgencia',
        },
        {
          id: 'c',
          text: 'no puedo hablar, estoy en una reunión. ',
          clueId: 'excusa',
        },
        {
          id: 'd',
          text: '¿te acuerdas de mi colegio? Yo nací el 14 de marzo. ',
          clueId: 'datos',
        },
        {
          id: 'e',
          text: 'Escríbeme a este número, es mi número nuevo. ',
          clueId: 'numero',
        },
        {
          id: 'f',
          text: 'Si no me lo mandas ya, me echan del apartamento. ', clueId: 'presion' },
      ],
    },
    clues: [
      {
        id: 'urgencia',
        text: 'Perdí el celular y necesito que me transfieras $800.000 urgente, ',
        label: 'Solicitud urgente de dinero',
        detail:
          'La urgencia combina dos tacticas: un problema (perdi el celular) y un plazo. Es la forma mas rapida de evitar que verifiques.',
        alert: true,
      },
      {
        id: 'excusa',
        text: 'no puedo hablar, estoy en una reunión. ',
        label: 'Excusa para impedir la llamada',
        detail:
          'Una llamada es el canal más fácil de verificar. Pedirte que no llames elimina precisamente la única forma de comprobar la identidad.',
        alert: true,
      },
      {
        id: 'datos',
        text: '¿te acuerdas de mi colegio? Yo nací el 14 de marzo. ',
        label: 'Usa información personal como prueba',
        detail:
          'Los datos correctos no demuestran quién escribe. Si están publicados en redes sociales, cualquiera puede leerlos y usarlos.',
        alert: true,
      },
      {
        id: 'numero',
        text: 'Escríbeme a este número, es mi número nuevo. ',
        label: 'Número nuevo sin verificar',
        detail:
          'Cambiar de número es lo primero que hace un atacante para que no loişters reconozcas al contacto.',
        alert: true,
      },
      {
        id: 'presion',
        text: 'Si no me lo mandas ya, me echan del apartamento. ',
        label: 'Presión emocional',
        detail:
          'Amenazar con una consecuencia grave busca que actues por miedo. El objetivo no es solo el dinero: es que actues de inmediato.',
        alert: true,
      },
    ],
    decision: {
      prompt: '¿Cuál es la secuencia correcta de acciones?',
      options: [
        {
          id: 'a',
          label:
            'Transferir el dinero, avisar después y, si no contesta, pedirle el número del nuevo celular.',
          verdict: 'incorrect',
          explanation:
            'El dinero se envía una sola vez y no vuelve: para entonces la única respuesta posible es la de alguien que ya no existe. La verificación va antes, no después.',
        },
        {
          id: 'b',
          label:
            'Detener la transferencia, contactar al familiar por su número habitual o un canal independiente, no enviar nada si no puedes verificarlo y conservar la conversación por si es un intento de fraude.',
          verdict: 'correct',
          explanation:
            'Es la secuencia segura: primero se detiene, después se verifica por un canal que no controlé el atacante y sólo después se decide. Guardar la conversación sirve como evidencia y para avisar a la comunidad.',
        },
        {
          id: 'c',
          label:
            'Responder preguntando un dato personal que no esté publicado, por ejemplo el nombre de la primera mascota, y transferir si la respuesta es correcta.',
          verdict: 'partial',
          explanation:
            'Entender que la información personal no sirve como prueba es acertar a medias, pero la pregunta no es suficiente: muchos datos se adivinan o se filtran. La verificación tiene que ser por un canal independiente, y el dinero se envía después de verificar, no antes.',
        },
      ],
    },
    outcome: {
      kind: 'sospechoso',
      label: 'Caso con señales de alerta',
      text:
        'Los datos personales correctos no demuestran quién controla una cuenta de mensajería. El objetivo del atacante es aprovechar la confianza y la presión emocional, no tanto el dinero.',
    },
    learning:
      'No confíes únicamente en preguntas personales cuya respuesta pueda encontrarse en redes sociales. Verifica por un canal independiente y mantén el dinero quieto mientras tanto.',
    points: 200,
  },

  /* ---------------------------------------------------------------- */
  /* Caso 3 · La oferta laboral extraordinaria                           */
  /* ---------------------------------------------------------------- */
  {
    id: 'dete-3',
    scenario: DETECTIVE_SCENARIOS['dete-3'],
    categoryId: 'laboral',
    title: 'La oferta laboral extraordinaria',
    context:
      'Encuentras una oferta de empleo remoto con un salario muy por encima de lo habitual para el cargo. El supuesto reclutador dice que fuiste seleccionado sin una entrevista detallada y que, para recibir el contrato, debes pagar una inscripción o activar una cuenta ese mismo día. El perfil usa una imagen corporativa y publica testimonios de personas que supuestamente consiguió empleo.',
    message: {
      from: 'contacto',
      parts: [
        { id: 'a', text: 'Estimado candidato, hemos revisado su perfil. ' },
        { id: 'b', text: 'Le informamos que fue seleccionado para el cargo de ANALYSIS. ' },
        {
          id: 'c',
          text: 'Para emitir el contrato debe realizar un pago de inscripción de $180.000 ',
          clueId: 'pago',
        },
        {
          id: 'd',
          text: 'antes del cierre de la vacante, hoy mismo. ',
          clueId: 'presion',
        },
        { id: 'e', text: 'Adjuntamos el perfil corporativo de la empresa y los testimonios del equipo. ' },
      ],
    },
    clues: [
      {
        id: 'pago',
        text: 'Para emitir el contrato debe realizar un pago de inscripción de $180.000 ',
        label: 'Pago anticipado',
        detail:
          'Ningún empleo legítimo cobra por emitir un contrato. El pago es el objetivo, no un trámite.',
        alert: true,
      },
      {
        id: 'presion',
        text: 'antes del cierre de la vacante, hoy mismo. ',
        label: 'Presión para decidir en el momento',
        detail:
          'La prisa artificial busca que no verifiques la empresa ni consultes otras ofertas del mismo cargo.',
        alert: true,
      },
    ],
    classification: [
      {
        id: 'pago',
        text: 'Pago de inscripción de $180.000 para activar el contrato',
        answer: 'alerta',
        detail:
          'Es la señal de alerta principal: el dinero fluye de ti hacia el atacante. Ningún proceso de contratación real cobra por delante.',
      },
      {
        id: 'presion',
        text: 'Decisión para el mismo día, antes del cierre de la vacante',
        answer: 'alerta',
        detail:
          'La urgencia artificial impide verificar. Un proceso real de contratación toma días o semanas.',
      },
      {
        id: 'perfil',
        text: 'Perfil corporativo con imagen, cargo y sede',
        answer: 'verificar',
        detail:
          'Un perfil bien armado no demuestra nada: se puede copiar en minutos. Lo que hay que verificar es si la empresa existe de verdad, con sus canales oficiales.',
      },
      {
        id: 'testimonios',
        text: 'Testimonios de personas que dicen haber conseguido el empleo',
        answer: 'neutro',
        detail:
          'Los testimonios, por sí solos, no prueban ni que la oferta sea real ni que sea falsa. Son un elemento de máreting, no una evidencia. Falta verificación independiente.',
      },
      {
        id: 'seleccion',
        text: 'Selección sin entrevista detallada para un cargo remoto',
        answer: 'alerta',
        detail:
          'Seleccionar a alguien sin entrevista, sin entrevista técnica y sin verificar referencias, para un puesto bien pagado, es una señal de alerta en sí misma.',
      },
    ],
    decision: {
      prompt: '¿Cuál es la acción recomendada?',
      options: [
        {
          id: 'a',
          label: 'Pagar la inscripción: son $180.000 y el puesto es muy bueno.',
          verdict: 'incorrect',
          explanation:
            'El salario alto y el pago bajo son la misma estrategia: te convencen de que el negocio es bueno. El pago es el único objetivo real de la oferta.',
        },
        {
          id: 'b',
          label:
            'Verificar la vacante en los canales oficiales de la empresa y no pagar ni entregar información sensible hasta confirmar que la oferta es legítima.',
          verdict: 'correct',
          explanation:
            'Verificar por el canal oficial de la empresa (su sitio web, su correo corporativo, su.linkedin verificable) es lo que separa una oferta real de un fraude. Mientras tanto, no se paga nada.',
        },
        {
          id: 'c',
          label: 'Pagar la inscripción pero exigir que el reclutador muestre su cédula y un documento de la empresa.',
          verdict: 'partial',
          explanation:
            'Exigir documentos es un paso razonable, pero un documento se puede falsificar y no se verifica en el canal oficial. La idea de no enviar datos sensibles sin verificar es correcta; el riesgo queda si aceptas pagar primero.',
        },
      ],
    },
    outcome: {
      kind: 'sospechoso',
      label: 'Caso con señales de alerta',
      text:
        'El pago anticipado y la presión para decidir en el momento son señales de alerta. El perfil corporativo y los testimonios no prueban que la oferta sea auténtica: no son evidencia, son publicidad.',
    },
    learning:
      'Verifica la vacante por los canales oficiales de la empresa. Ningún trabajo legítimo te cobra por empezar, y un perfil profesional no es una garantía.',
    points: 200,
  },

  /* ---------------------------------------------------------------- */
  /* Caso 4 · Un caso legítimo (para contrastar)                         */
  /* ---------------------------------------------------------------- */
  {
    id: 'dete-4',
    scenario: DETECTIVE_SCENARIOS['dete-4'],
    categoryId: 'compras',
    title: 'El aviso de entrega que sí conviene revisar',
    context:
      'Recibes un correo de la tienda donde compraste: te avisan de que el pedido salió hoy y te dejan el enlace para seguirlo. El mensaje no pide datos, no tiene plazo y el dominio corresponde a la tienda. Aun así, hay que decidir si se abre el enlace o se revisa la app.',
    message: {
      from: 'contacto',
      parts: [
        { id: 'a', text: 'Tienda Sol — Tu pedido #4521 salió hoy. ' },
        { id: 'b', text: 'Puedes seguirlo aquí: ' },
        { id: 'c', text: 'https://tienda-sol.invalid/pedidos/4521', clueId: 'enlace' },
        { id: 'd', text: 'Te avisamos por correo porque pediste no recibir SMS.' },
      ],
    },
    clues: [
      {
        id: 'enlace',
        text: 'https://tienda-sol.invalid/pedidos/4521',
        label: 'Enlace a un dominio de la tienda',
        detail:
          'El enlace lleva al mismo dominio que ya usabas para comprar. Aun así, la costumbre más segura es abrir la tienda desde la app o escribiendo tú la dirección, para no depender del enlace recibido.',
        alert: false,
      },
    ],
    decision: {
      prompt: '¿Qué haces?',
      options: [
        {
          id: 'a',
          label: 'Abrir el enlace: el mensaje no pide datos ni tiene urgencia.',
          verdict: 'partial',
          explanation:
            'El mensaje no tiene señales de alerta claras, así que no hay motivo para tratarlo como fraude. Aun así, la costumbre más segura es entrar por la app o escribiendo la dirección: abrir enlaces recibidos nunca es necesario.',
        },
        {
          id: 'b',
          label: 'Abrir la tienda desde la app o escribiendo la dirección, y revisar el pedido allí.',
          verdict: 'correct',
          explanation:
            'Es lo que funciona en todos los casos,idor legítimos o no: entras por un canal que tú controlas. Así confirmas el envío sin depender del enlace recibido y sin exponerte a un dominio copiado.',
        },
        {
          id: 'c',
          label: 'Reenviar el correo a un contacto para que compruebe el enlace.',
          verdict: 'incorrect',
          explanation:
            'Un correo de aviso de pedido no necesita revisión de terceros, y reenviar enlaces innecesariamente sólo amplía el riesgo para otras personas.',
        },
      ],
    },
    outcome: {
      kind: 'legitimo',
      label: 'Caso sin señales de alerta claras',
      text:
        'Este mensaje no combina urgencia, amenazas ni solicitudes de datos, y el dominio corresponde a la tienda. Aun así, la verificación por canal propio sigue siendo la costumbre más segura: lo que no tiene señales no es una garantía, es sólo la ausencia de pistas.',
    },
    learning:
      'No todos los mensajes sospechosos son fraude, y no todos los frases benignos son auténticas. Aprende a evaluar combinaciones, no señales aisladas.',
    points: 200,
  },
]