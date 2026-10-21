import { STORY_SCENARIOS } from './scenarios'
import type { Story } from '../types'

/**
 * Juego 2 · **Tú decides**.
 *
 * Historias ramificadas: cada decisión lleva a un nodo distinto y cada rama
 * tiene consecuencias educativas propias. Los nodos se describen con datos
 * (`nodes` + `next`), de modo que añadir una historia es añadir datos, no
 * componentes.
 *
 * Los mensajes, los sitios y las entidades son ficticios. La «página simulada»
 * se representa dentro de la conversación, sin abrir ningún sitio externo.
 */
export const STORIES: Story[] = [
  /* ---------------------------------------------------------------- */
  /* Historia principal · El paquete retenido                            */
  /* ---------------------------------------------------------------- */
  {
    id: 'hist-paquete',
    categoryId: 'enlaces',
    title: 'El paquete retenido',
    intro:
      'Recibes un mensaje que dice que un paquete está retenido y que debes pagar una pequeña tarifa para recibirlo. No recuerdas haber hecho una compra reciente. El mensaje trae un enlace y advierte que el paquete será devuelto si no pagas hoy mismo.',
    start: 'n1',
    points: 300,
    nodes: [
      {
        id: 'n1',
    scenario: STORY_SCENARIOS['hist-paquete'],
        message: {
          from: 'contacto',
          text: 'Empresa de mensajería Andes: su paquete está retenido en la oficina de Medellín. Pague la tarifa de $12.500 para liberarlo: https://rastreo-andes.courier-pendiente.invalid/pagar. El paquete se devuelve en 24 horas.',
        },
        prompt: '¿Qué haces con el mensaje?',
        options: [
          {
            id: 'a',
            label: 'Abrir inmediatamente el enlace para ver de qué se trata.',
            verdict: 'incorrect',
            next: 'n2a',
            points: 0,
            explanation:
              'Abrir el enlace entrega tu navegador a un sitio controlado por el atacante. En este caso concreto el sitio es una simulación educativa: no te lleva a ninguna parte real, pero en la vida real sí.',
            consequence:
              'La página que se abre imita el formulario de una empresa de mensajería y te pide nombre, documento, dirección y datos de pago.',
          },
          {
            id: 'b',
            label: 'Verificar si existe un pedido real y consultar el estado del envío por un canal oficial.',
            verdict: 'correct',
            next: 'n2b',
            points: 100,
            explanation:
              'Verificar por un canal que tu eliges es siempre la accion mas segura: la app de la empresa de mensaje o el correo con el que pediste.',
            consequence:
              'En la app no hay ningún pedido pendiente ni ningún envío retenido a tu nombre. El mensaje no tenía nada que ver contigo.',
          },
          {
            id: 'c',
            label: 'Reenviar el mensaje a varios contactos para que ellos sí lo revisen.',
            verdict: 'incorrect',
            next: 'n2c',
            points: 0,
            explanation:
              'Reenviar mensajes sospechosos reparte el intento de fraude y además pone a otras personas en riesgo.',
            consequence:
              'Dos contactos te contestan: uno ya habia recibido el mismo mensaje y el otro se lo habia reenviado a alguien que si estaba a punto de pagar.',
          },
        ],
      },
      {
        id: 'n2a',
        message: {
          from: 'sistema',
          text: 'SIMULACIÓN EDUCATIVA · Página de «cobro de tarifa»: solicita nombre completo, número de documento, dirección de entrega y datos de una tarjeta para «verificar el receptor».',
          simulated: true,
        },
        prompt: '¿Qué deberías hacer?',
        options: [
          {
            id: 'a',
            label: 'Completar el formulario: si la tarifa es pequeña, el riesgo también lo es.',
            verdict: 'incorrect',
            next: 'n3a',
            points: 0,
            explanation:
              'El monto pequeño es la trampa. El daño no depende de cuánto pagues, sino de los datos que entregues: con tu documento y los datos de una tarjeta se pueden abrir fraudulentamente operaciones a tu nombre.',
            consequence:
              'Completas el formulario. En la siguiente pantalla te piden confirmar con un código que te llega al celular.',
          },
          {
            id: 'b',
            label: 'Detener el proceso y verificar la solicitud con la empresa de mensajería por un canal independiente.',
            verdict: 'correct',
            next: 'n2b',
            points: 100,
            explanation:
              'Para investigar una situación no hace falta completar ningún formulario. Puedes revisar el envío sin entregar nada.',
            consequence:
              'Escribes tú a la empresa de mensajería desde su número oficial. Confirman que no tienen ningún envío tuyo retenido.',
          },
          {
            id: 'c',
            label: 'Introducir datos inventados para comprobar si la página funciona.',
            verdict: 'partial',
            next: 'n2c',
            points: 50,
            explanation:
              'Entender que no hay que entregar datos reales es correcto, pero introducir datos falsos en un sitio sospechoso sigue dejando tu dispositivo y tu dirección IP expuestos. No hay nada que comprobar con un sitio fraudulento.',
            consequence:
              'El sitio registra la visita. En el mejor de los casos sólo se queda con los datos falsos; en el peor, con la huella de tu navegador.',
          },
        ],
      },
      {
        id: 'n2b',
        message: {
          from: 'sistema',
          text: 'Verificación completada: en la app no hay ningún pedido a tu nombre y la empresa de mensajería confirma que no te ha enviado ese mensaje.',
        },
        prompt: '¿Qué haces con el mensaje recibido?',
        options: [
          {
            id: 'a',
            label: 'Reportar el mensaje en la red de comercios del barrio y borrarlo después.',
            verdict: 'correct',
            next: 'fin',
            points: 100,
            explanation:
              'Reportar difunde la alerta y ayuda a que otras personas no caigan. Lo ideal es reportar primero y borrar después: el reporte necesita capturas.',
            consequence:
              'Guardas capturas del mensaje, lo reportas en la red y lo borras. La alerta llega a otros comercios del barrio.',
          },
          {
            id: 'b',
            label: 'Borrarlo inmediatamente para no volver a caer en la cuenta.',
            verdict: 'partial',
            next: 'fin',
            points: 50,
            explanation:
              'Borrarlo tiene sentido, pero si borras antes de reportar pierdes la evidencia (remitente, hora, texto) que sirve para avisar a otros y para el reporte formal.',
            consequence:
              'Borras el mensaje. La próxima vez que llegue uno parecido, no tendrás una forma de comparar.',
          },
        ],
      },
      {
        id: 'n2c',
        message: {
          from: 'sistema',
          text: 'Has compartido el mensaje con dos contactos. Uno ya había recibido el mismo mensaje; el otro lo wasala con alguien que estaba a punto de pagar la tarifa.',
        },
        prompt: '¿Cómo completas el caso?',
        options: [
          {
            id: 'a',
            label: 'Verificar igualmente el envío por la app y avisar a los contactos a los que reenvié el mensaje.',
            verdict: 'correct',
            next: 'fin',
            points: 100,
            explanation:
              'Avisar a quienes recibieron el mensaje es la forma de reducir el daño de haberlo reenviado. Y la verificación se hace igual en la app.',
            consequence:
              'Verificas el envío en la app (no hay pedido) y avisas a los dos contactos para que no paguen.',
          },
          {
            id: 'b',
            label: 'Dejarlo así: ya lo reenvié y no hay nada más que hacer.',
            verdict: 'incorrect',
            next: 'fin',
            points: 0,
            explanation:
              'Las personas que recibieron el mensaje siguen viendo una amenaza de tiempo limitado. Avisarlas es parte del trabajo.',
            consequence:
              'Uno de tus contactos paga la tarifa y pierde $12.500.',
          },
        ],
      },
      {
        id: 'n3a',
        message: {
          from: 'sistema',
          text: 'Antes de cerrar la página recuerdas que ya introdujiste tu información personal y los datos de una tarjeta.',
        },
        prompt: '¿Qué debes hacer ahora?',
        options: [
          {
            id: 'a',
            label: 'Esperar a que ocurra algo, por si el sitio era real.',
            verdict: 'incorrect',
            next: 'fin',
            points: 0,
            explanation:
              'Cada minuto con el acceso abierto es tiempo para que alguien lo use. La reacción útil es inmediata.',
            consequence:
              'Dos días después aparece un cobro de $640.000 en tu tarjeta que no hiciste.',
          },
          {
            id: 'b',
            label:
              'Contactar al emisor de la tarjeta mediante un canal oficial, explicar lo ocurrido y seguir sus instrucciones de protección.',
            verdict: 'correct',
            next: 'fin',
            points: 100,
            explanation:
              'La respuesta depende de qué compartiste. Si entregaste credenciales, hay que proteger esa cuenta; si entregaste datos de pago, hay que contactar al proveedor financiero; si descargaste un archivo, no lo ejecutes y protege el dispositivo. Contactar al emisor por su canal oficial cubre los tres casos.',
            consequence:
              'El banco bloquea la tarjeta, revierte el cargo y te guía en el resto de medidas. La pérdida se queda en cero.',
          },
          {
            id: 'c',
            label: 'Pagar una segunda tarifa para «cancelar» la primera operación.',
            verdict: 'incorrect',
            next: 'fin',
            points: 0,
            explanation:
              'Es la continuacion del mismo fraude: nadie te devuelve dinero pidiendote mas dinero. Ninguna entidad legitima cobra para cancelar un cobro.',
            consequence:
              'Pagas dos tarifas más. El atacante recibe los tres pagos y desaparece.',
          },
        ],
      },
      {
        id: 'fin',
        message: {
          from: 'sistema',
          text: 'Fin del escenario.',
        },
        prompt: 'Resumen de tu recorrido.',
        options: [],
        end: {
          title: 'Escenario cerrado',
          text:
            'Puedes volver a intentarlo las veces que quieras: equivocarse aquí forma parte del aprendizaje. Lo importante es qué haces después de cada error.',
        },
      },
    ],
    closing: {
      safe: 'Verificar por un canal oficial y reportar el mensaje a la red.',
      risky: 'Abrir el enlace, completar el formulario, reenviar el mensaje o pagar una segunda tarifa.',
      pending: 'Comprobar si existía un pedido real y avisar a quienes recibió el mensaje reenviado.',
      lesson:
        'Para investigar una situación sospechosa no hace falta completar ningún formulario, y después de un incidente lo que cuenta es la rapidez con la que cortas el acceso y avisas.',
    },
  },

  /* ---------------------------------------------------------------- */
  /* Historia 2 · La llamada del banco                                    */
  /* ---------------------------------------------------------------- */
  {
    id: 'hist-llamada',
    categoryId: 'credenciales',
    title: 'La llamada que pide un código',
    intro:
      'Te llama alguien que se presenta como el área de seguridad de tu banco. Dice que están procesando un retiro inusual y que necesita el código que te llegó al celular para «autorizar la reversión».',
    start: 'n1',
    points: 250,
    nodes: [
      {
        id: 'n1',
        message: {
          from: 'contacto',
          text: '«Buenos días, le habla Andrés Restrepo, seguridad de Banco Aurora. Estamos procesando un retiro inusual de $1.240.000 en un cajero de Medellín. Para autorizar la reversión necesito que me lea el código de 6 dígitos que le acabamos de enviar al celular.»',
        },
        prompt: '¿Qué haces?',
        options: [
          {
            id: 'a',
            label: 'Compartir el código para que resuelvan el problema cuanto antes.',
            verdict: 'incorrect',
            next: 'fin',
            points: 0,
            explanation:
              'El código de un solo uso sirve justo para iniciar sesión en tu cuenta. Dárselo a quien llama equivale a darle las llaves.',
            consequence:
              'En los minutos siguientes cambian la clave de acceso de tu cuenta yinitis una transferencia.',
          },
          {
            id: 'b',
            label: 'Colgar y llamar al banco por el número que aparece en la app o en la tarjeta.',
            verdict: 'correct',
            next: 'n2',
            points: 100,
            explanation:
              'El canal de verificación lo eliges tú. El número que te.calls aparece en pantalla es el del atacante, no el del banco.',
            consequence:
              'Marcas el número que aparece en tu tarjeta y en la app. La entidad financiera te confirma que no hay ningún retiro en curso.',
          },
          {
            id: 'c',
            label: 'Pedir más información sin entregar datos: nombre completo, oficina y radicado.',
            verdict: 'partial',
            next: 'n2',
            points: 50,
            explanation:
              'Pedir datos que no son sensibles no cambia nada: el nombre y la oficina son públicos. La llamada no termina hasta que tú decidas.',
            consequence:
              'El supuesto asesor te da un nombre y un número de radicado que no significa nada, y vuelve a pedirte el código.',
          },
        ],
      },
      {
        id: 'n2',
        message: {
          from: 'sistema',
          text: 'Al marcar el número de tu tarjeta, la entidad financiera te confirma que no hay ningún retiro pendiente y que nunca llaman para pedir códigos.',
        },
        prompt: '¿Qué haces con el intento de fraude?',
        options: [
          {
            id: 'a',
            label: 'Reportarlo en la red y guardar el número y la hora de la llamada.',
            verdict: 'correct',
            next: 'fin',
            points: 100,
            explanation:
              'El número, la hora y el nombre que se dieron son evidencia útil. La red puede avisar al resto del barrio de la misma technique.',
            consequence:
              'Guardas los datos y compartes la alerta. Otro comercio recibe la misma llamada esa tarde y la detecta.',
          },
          {
            id: 'b',
            label: 'No hacer nada: no pasó nada, no perdí nada.',
            verdict: 'incorrect',
            next: 'fin',
            points: 0,
            explanation:
              'La técnica no falló por suerte: falló porque verificaste. La próxima vez puede que no tengas tiempo de colgar.',
            consequence:
              'Dos semanas después la misma llamada, con un guion másconvincente, la haces con más confianza y acabas compartiendo el código.',
          },
        ],
      },
      {
        id: 'fin',
        message: { from: 'sistema', text: 'Fin del escenario.' },
        prompt: 'Resumen de tu recorrido.',
        options: [],
        end: {
          title: 'Escenario cerrado',
          text:
            'Puedes repetir este escenario. Ninguna entidad financiera te pide un código de un solo uso, por teléfono ni por ningún otro medio.',
        },
      },
    ],
    closing: {
      safe: 'Colgar, marcar el número oficial y reportar el intento con la evidencia guardada.',
      risky: 'Compartir el código o seguir en la línea con el supuesto asesor.',
      pending: 'Confirmar con la entidad financiera que no había ninguna operación en curso.',
      lesson:
        'El canal de verificación lo eliges tú. Un código de un solo uso nunca se comparte, pase lo que pase.',
    },
  },

  /* ---------------------------------------------------------------- */
  /* Historia 3 · El comprobante del comprador                            */
  /* ---------------------------------------------------------------- */
  {
    id: 'hist-comprobante',
    categoryId: 'comprobantes',
    title: 'El comprador con comprobante',
    intro:
      'Un cliente te envía por chat una captura que parece el comprobante de una transferencia por el monto exacto de la compra. Te pide que le entregues la mercancía de inmediato y avisa que viene de camino.',
    start: 'n1',
    points: 250,
    nodes: [
      {
        id: 'n1',
        message: {
          from: 'contacto',
          text: 'Listo, ya transferí. Te dejo la captura del comprobante para que veas que sí se hizo. ¿Me despachas ya? Estoy saliendo de camino, en 20 minutos llego.',
        },
        prompt: '¿Qué haces?',
        options: [
          {
            id: 'a',
            label: 'Despachar: el monto coincide y el comprobante parece auténtico.',
            verdict: 'incorrect',
            next: 'n2a',
            points: 0,
            explanation:
              'Una captura es una imagen: se puede editar. Que el monto coincida no convierte la imagen en una prueba de que el dinero llegó.',
            consequence:
              'Entregas la mercancía. Una hora después el dinero nunca aparece en tu cuenta.',
          },
          {
            id: 'b',
            label: 'Revisar el movimiento en mi app o en el portal de la entidad financiera antes de despachar.',
            verdict: 'correct',
            next: 'n2',
            points: 100,
            explanation:
              'El estado de cuenta de tu propia entidad financiera es la fuente de verdad. No depende de lo que te envíe el cliente.',
            consequence:
              'El movimiento no aparece en tu cuenta. Entras en contacto con el cliente y compruebas que la transferencia nunca se hizo.',
          },
          {
            id: 'c',
            label: 'Pedir que te la envíe por correo para tenerla registrada.',
            verdict: 'partial',
            next: 'n2a',
            points: 50,
            explanation:
              'Pedir otro canal tiene sentido, pero un correo con un PDF falso sigue siendo un archivo falso. Lo que sirve es verificar contra el sistema de tu entidad financiera.',
            consequence:
              'El cliente te envía un PDF con el logo de la entidad y un número de operación que no existe en ningún sistema.',
          },
        ],
      },
      {
        id: 'n2',
        message: {
          from: 'sistema',
          text: 'En tu app no aparece ningún movimiento por ese valor. El estado de cuenta de tu entidad financiera confirma que la transferencia no se ha recibido.',
        },
        prompt: '¿Qué haces ahora?',
        options: [
          {
            id: 'a',
            label: 'Contarle al cliente lo que encontré, pedirle que revise y no despachar mientras tanto.',
            verdict: 'correct',
            next: 'fin',
            points: 100,
            explanation:
              'Explicar el resultado de la verificación y mantener la mercancía retenida es la conducta correcta ante un comprobante que no cuadra.',
            consequence:
              'El cliente revisa y reconoce que la captura era de otra operación. Se descarta el pedido sin pérdidas.',
          },
          {
            id: 'b',
            label: 'Despachar igual y exigir el pago por adelantado si vuelve a insistir.',
            verdict: 'incorrect',
            next: 'fin',
            points: 0,
            explanation:
              'Si una comprobación dice que no hay dinero, despachar es perder la mercancía y el dinero.',
            consequence:
              'Despachas. El cliente desaparece y la pérdida es doble.',
          },
        ],
      },
      {
        id: 'n2a',
        message: {
          from: 'sistema',
          text: 'El cliente insiste en que sí pagó y pide que le mandes el número de la cuenta para «hacer una transferencia más rápida».',
        },
        prompt: '¿Qué haces?',
        options: [
          {
            id: 'a',
            label: 'Mantener la mercancía retenida y verificar el pago en mi propia app.',
            verdict: 'correct',
            next: 'fin',
            points: 100,
            explanation:
              'La insistencia y el cambio de interlocutor son señales de que algo no cuadra. La verificación la haces tú, en tu canal.',
            consequence:
              'Verificas: no hay movimiento. Conservas la mercancía y la evidencia del chat.',
          },
          {
            id: 'b',
            label: 'Enviarle el número de cuenta para que la transferencia «llegue más rápido».',
            verdict: 'incorrect',
            next: 'fin',
            points: 0,
            explanation:
              'Dar el número de tu cuenta no acelera ningún pago real: sólo facilita que te retiren más dinero después.',
            consequence:
              'El cliente hace un cargo additional con tu número de cuenta.',
          },
        ],
      },
      {
        id: 'fin',
        message: { from: 'sistema', text: 'Fin del escenario.' },
        prompt: 'Resumen de tu recorrido.',
        options: [],
        end: {
          title: 'Escenario cerrado',
          text: 'El comprobante nunca es la prueba: el movimiento en tu cuenta, sí.',
        },
      },
    ],
    closing: {
      safe: 'Verificar el movimiento en tu propia entidad financiera y no despachar mientras no cuadre.',
      risky: 'Despachar con una imagen, entregar el número de cuenta o ceder a la insistencia.',
      pending: 'Comprobar el estado real de la operación y conservar la evidencia del chat.',
      lesson:
        'Un comprobante es una imagen que te entrega un desconocido. La prueba es el movimiento en tu propio estado de cuenta.',
    },
  },

  /* ---------------------------------------------------------------- */
  /* Historia 4 · El vendedor que pide anticipo                          */
  /* ---------------------------------------------------------------- */
  {
    id: 'hist-anticipo',
    categoryId: 'compras',
    title: 'El vendedor que pide anticipo',
    intro:
      'En una red social encuentras un producto a un precio muy inferior al de mercado. El vendedor pide una seña por transferencia para «reservarlo» y dice que es la última unidad.',
    start: 'n1',
    points: 250,
    nodes: [
      {
        id: 'n1',
        message: {
          from: 'contacto',
          text: 'Hola, es el laptop de .200.000. Es la ultima unidad, me lo separo con una seña de .000 por transferencia a la cuenta de mi socio. Apenas me confirmes te lo despacho hoy mismo.',
        },
        prompt: '¿Qué haces?',
        options: [
          {
            id: 'a',
            label: 'Pagar la seña para asegurar la unidad antes de que se la lleven.',
            verdict: 'incorrect',
            next: 'n2',
            points: 0,
            explanation:
              'El precio bajo y la escasez son el gancho. Pagar por adelantado a un desconocido, y más a nombre de un tercero, elimina cualquier trazabilidad.',
            consequence:
              'Pagas la seña. El vendedor desaparece y el producto nunca existió.',
          },
          {
            id: 'b',
            label: 'Pagar por la plataforma, con protección al comprador, o no comprar.',
            verdict: 'correct',
            next: 'n2',
            points: 100,
            explanation:
              'Si el vendedor se niega a usar la plataforma, eso mismo es información valiosa. Y si acepta, la mediación cubre parte del problema.',
            consequence:
              'El vendedor dice que la plataforma no tiene ese producto. Ese hecho ya te dice que la publicación no era de una tienda real.',
          },
          {
            id: 'c',
            label: 'Pedir fotos del producto y el número de la cuenta a nombre del vendedor, no de un tercero.',
            verdict: 'partial',
            next: 'n2',
            points: 50,
            explanation:
              'Pedir que la cuenta esté a su nombre es un criterio razonable, pero las fotos y un nombre no sustituyen la verificación. Sigue sin haber una operación real detrás.',
            consequence:
              'Te manda fotos hechas en otro sitio y una cuenta a nombre de un familiar. No es una tienda.',
          },
        ],
      },
      {
        id: 'n2',
        message: {
          from: 'sistema',
          text: 'La publicacion no tiene datos comerciales verificables, no hay historial de ventas y el perfil se creo hace dos dias.',
        },
        prompt: '¿Cómo cierras el caso?',
        options: [
          {
            id: 'a',
            label: 'Renunciar, guardar capturas y reportar la publicación en la red.',
            verdict: 'correct',
            next: 'fin',
            points: 100,
            explanation:
              'Un perfil nuevo, sin historial y sin datos de contacto verificables, no es una tienda. Reportarlo evita que otro barrio caiga.',
            consequence:
              'Guardas las capturas y avisas a la red. Otro barrio reconoce la publicación y no paga.',
          },
          {
            id: 'b',
            label: 'Esperar un par de días a ver si el vendedor responde y entonces decidir.',
            verdict: 'incorrect',
            next: 'fin',
            points: 0,
            explanation:
              'Esperar sólo deja que el mensaje se enfríe y que la publicación se borre. Las evidencias se pierden.',
            consequence:
              'Una semana después la publicación desaparece y no queda registro de nada.',
          },
        ],
      },
      {
        id: 'fin',
        message: { from: 'sistema', text: 'Fin del escenario.' },
        prompt: 'Resumen de tu recorrido.',
        options: [],
        end: {
          title: 'Escenario cerrado',
          text: 'Un precio inverosímil con un vendedor nuevo es el patrón clásico del fraude de venta.',
        },
      },
    ],
    closing: {
      safe: 'Pagar por la plataforma o no comprar, y reportar la publicación.',
      risky: 'Pagar una seña por adelantado, aunque sea a nombre de un familiar.',
      pending: 'Comprobar si existe una empresa detrás y si la publicación tiene histórico.',
      lesson:
        'El precio inverosímil es el anzuelo. Pagar por adelantado a un desconocido elimina la única protección que te quedaba.',
    },
  },

  /* ---------------------------------------------------------------- */
  /* Historia 5 · Las ganancias garantizadas                              */
  /* ---------------------------------------------------------------- */
  {
    id: 'hist-inversion',
    categoryId: 'inversiones',
    title: 'Las ganancias garantizadas',
    intro:
      'En un grupo de mensajería alguien te escribe con una «oportunidad de inversión» que promete devolver el doble en una semana. Te muestran capturas de ganancias y te piden una pequeña cuota de ingreso para «activar tu cuenta».',
    start: 'n1',
    points: 250,
    nodes: [
      {
        id: 'n1',
        message: {
          from: 'contacto',
          text: 'Hola, bienvenido al grupo de operadores. Estamos moviendo capital con una tasa fija semanal del 100 %. Para entrar sólo pagas la cuota de activación de $220.000. Adjunto las ganancias de los últimos asociados.',
        },
        prompt: '¿Qué haces?',
        options: [
          {
            id: 'a',
            label: 'Pagar la cuota de activación para empezar a participar.',
            verdict: 'incorrect',
            next: 'n2',
            points: 0,
            explanation:
              'Una rentabilidad garantizada del 100 % semanal no existe. La cuota de activación es el objetivo: es dinero que entra a un desconocido.',
            consequence:
              'Pagas la cuota. Te piden «impuestos» para retirar tus ganancias y sigues pagando hasta que dejas de tener contactos.',
          },
          {
            id: 'b',
            label: 'Salir del grupo, no pagar nada y buscar la oferta por canales verificables.',
            verdict: 'correct',
            next: 'n2',
            points: 100,
            explanation:
              'Toda oferta de inversión real pasa por una entidad autorizada y verificable. Si no la puedes comprobar por un canal independiente, no es una oportunidad.',
            consequence:
              'Consultas el registro de entidades autorizadas: la propuesta no aparece. Y buscas por tu cuenta, sin el enlace del grupo.',
          },
          {
            id: 'c',
            label: 'Pedirles el registro o la autorización de la entidad que opera la inversión.',
            verdict: 'partial',
            next: 'n2',
            points: 50,
            explanation:
              'Pedir la autorización es el camino correcto, pero en estos grupos suelen inventar un registro falso. La comprobación tiene que hacerse por tu cuenta, en el registro oficial.',
            consequence:
              'Te mandan un certificado con un logo que no corresponde a ninguna entidad. Sólo se comprueba en el registro oficial.',
          },
        ],
      },
      {
        id: 'n2',
        message: {
          from: 'sistema',
          text: 'En el registro oficial de entidades autorizadas no aparece ninguna empresa con ese nombre. Las capturas de «ganancias» muestran los mismos nombres una y otra vez.',
        },
        prompt: '¿Qué haces?',
        options: [
          {
            id: 'a',
            label: 'Avisar en la red de comercios y no volver a entrar en ese grupo.',
            verdict: 'correct',
            next: 'fin',
            points: 100,
            explanation:
              'Las capturas repetidas son una señal clásica: las ganancias de los demás no existen. Avisar a la red es lo que evita que otro barrio caiga.',
            consequence:
              'Denuncias el grupo en la aplicación de mensajería y avisas a la red de tu barrio.',
          },
          {
            id: 'b',
            label: 'Invertir un poco más de lo que ya pusiste para «recuperar» la cuota.',
            verdict: 'incorrect',
            next: 'fin',
            points: 0,
            explanation:
              'Es la continuacion del mismo fraude. Nadie recupera una inversion porque ponga mas dinero.',
            consequence:
              'Inviertes $800.000 más. El dinero no vuelve a aparecer.',
          },
        ],
      },
      {
        id: 'fin',
        message: { from: 'sistema', text: 'Fin del escenario.' },
        prompt: 'Resumen de tu recorrido.',
        options: [],
        end: {
          title: 'Escenario cerrado',
          text: 'Si una oportunidad promete un retorno fijo y altísimo, no es una oportunidad: es un señuelo.',
        },
      },
    ],
    closing: {
      safe: 'Verificar en el registro oficial de entidades autorizadas y no transferir.',
      risky: 'Pagar la cuota de activación o intentar recuperar lo invertido poniendo más dinero.',
      pending: 'Confirmar si la entidad existe y está autorizada.',
      lesson:
        'La rentabilidad garantizada no existe. Y una entidad financiera real se puede comprobar en el registro oficial, sin que te lo pidan por mensaje.',
    },
  },

  /* ---------------------------------------------------------------- */
  /* Historia 6 · El acceso desconocido                                   */
  /* ---------------------------------------------------------------- */
  {
    id: 'hist-acceso',
    categoryId: 'incidentes',
    title: 'El acceso desconocido',
    intro:
      'Al revisar el correo encuentras que hace dos días alguien inició sesión en tu cuenta de correo desde un navegador que no reconoces, en otra ciudad. Tu correo es también la recuperación de otras cuentas.',
    start: 'n1',
    points: 250,
    nodes: [
      {
        id: 'n1',
        message: {
          from: 'sistema',
          text: 'Aviso de seguridad: se inició sesión en tu cuenta desde Chrome, Windows, en una ciudad a 400 km. Si no fuiste tú, cambia la contraseña.',
        },
        prompt: '¿Qué haces?',
        options: [
          {
            id: 'a',
            label: 'Hacer clic en el enlace del aviso para cambiar la contraseña ahí mismo.',
            verdict: 'incorrect',
            next: 'n2',
            points: 0,
            explanation:
              'El aviso puede ser real o falso. Si haces clic en su enlace, acabas de escribir tu contraseña antigua en el sitio que el atacante controla.',
            consequence:
              'El enlace del aviso lleva a una copia del inicio de sesión. Sin embargo, el atacante ya tenía acceso: la clave que acabas de escribir le sirve.',
          },
          {
            id: 'b',
            label: 'Entrar a mi correo escribiendo yo la dirección, revisar las sesiones activas y cambiar la contraseña.',
            verdict: 'correct',
            next: 'n2',
            points: 100,
            explanation:
              'Entrar por el canal propio y revisar la lista de sesiones activas es la forma de saber qué está pasando de verdad.',
            consequence:
              'Encuentras una sesión abierta desde un equipo que no es tuyo, la cierras y cambias la contraseña desde el propio servicio.',
          },
          {
            id: 'c',
            label: 'Ignorarlo: los avisos de seguridad se activan por errores.',
            verdict: 'incorrect',
            next: 'n2',
            points: 0,
            explanation:
              'Un aviso de acceso real es una de las pocas señales de que alguien ya entró. Ignorarlo deja la puerta abierta.',
            consequence:
              'Semanas después aparece un cobro con tus datos en otro servicio.',
          },
        ],
      },
      {
        id: 'n2',
        message: {
          from: 'sistema',
          text: 'Has cerrado la sesión desconocida y cambiado la contraseña del correo. Recuerdas que usabas esa misma contraseña en el portal de la entidad financiera y en el de tus compras.',
        },
        prompt: '¿Qué haces?',
        options: [
          {
            id: 'a',
            label: 'Cambiar la contraseña también en esos otros servicios y activar la verificación en dos pasos.',
            verdict: 'correct',
            next: 'fin',
            points: 100,
            explanation:
              'Si una contraseña está comprometida, hay que cambiarla en todas partes donde se usó, no sólo donde te avisaron. Y la verificación en dos pasos evita que el código vuelva a ser una puerta de entrada.',
            consequence:
              'Cambias las contraseñas de los servicios que compartían la clave y activas la verificación en dos pasos en cada uno.',
          },
          {
            id: 'b',
            label: 'Cambiar sólo la del correo, que es la que te [$] avisó.',
            verdict: 'partial',
            next: 'fin',
            points: 50,
            explanation:
              'Entender que el correo es la puerta maestra está bien, pero las otras cuentas que usaban la misma clave siguen vulnerables con la contraseña vieja.',
            consequence:
              'El atacante entra con la misma contraseña en el portal de la entidad financiera y solicita un crédito a tu nombre.',
          },
        ],
      },
      {
        id: 'fin',
        message: { from: 'sistema', text: 'Fin del escenario.' },
        prompt: 'Resumen de tu recorrido.',
        options: [],
        end: {
          title: 'Escenario cerrado',
          text:
            'Un aviso de acceso puede ser real o falso: por eso se verifica entrando por el canal propio, nunca por el enlace del aviso.',
        },
      },
    ],
    closing: {
      safe: 'Entrar por el canal propio, cerrar la sesión desconocida y cambiar la contraseña en todos los servicios que la compartían.',
      risky: 'Usar el enlace del aviso, ignorar el aviso o cambiar la contraseña sólo en un servicio.',
      pending: 'Revisar las otras cuentas que usaban la misma clave y activar la verificación en dos pasos.',
      lesson:
        'El correo es la puerta maestra: si cae, caen todas las cuentas que dependan de él. Cambia la contraseña en todas partes, no sólo donde te avisaron.',
    },
  },
]