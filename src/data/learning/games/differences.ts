import { COMPARE_SCENARIOS } from './caseScenarios'
import type { CompareCase } from '../types'

/**
 * Juego 3 · **Encuentra las diferencias**.
 *
 * Dos fichas que parecen del mismo tipo (dos tiendas, dos comprobantes, dos
 * dominios) y hay que señalar que elementos merecen verificacion. Los casos
 * incluyen ejemplos ambiguos a propósito: no todas las diferencias son
 * señales de fraude.
 */
export const COMPARE_CASES: CompareCase[] = [
  /* ---------------------------------------------------------------- */
  /* Caso 1 · Dos tiendas virtuales                                       */
  /* ---------------------------------------------------------------- */
  {
    id: 'cmp-1',
    scenario: COMPARE_SCENARIOS['cmp-1'],
    categoryId: 'compras',
    title: 'Dos tiendas virtuales',
    prompt:
      'Compara las dos fichas y señala qué elementos merecen verificación. Ninguna de las dos tiendas está verificada dentro de la simulación: el ejercicio consiste en ver qué información es coherente y cuál no.',
    left: {
      name: 'Tienda Aurora',
      subtitle: 'Vende equipos de cocina usados, publicados hace seis meses.',
      items: [
        {
          id: 'l1',
          text: 'Condiciones de venta: los equipos se venden «tal cual», con garantía de 30 días por defectos de fábrica.',
          detail:
            'Las condiciones están escritas y son razonables. Se pueden pedir y comparar. No es una señal de alerta.',
          difference: false,
        },
        {
          id: 'l2',
          text: 'Medios de contacto: correo con dominio propio y teléfono fijo publicado.',
          detail:
            'El contacto es un canal verificable: se puede llamar. Un correo con dominio propio y un teléfono fijo dan dos formas de comprobar que hay alguien detrás.',
          difference: false,
        },
        {
          id: 'l3',
          text: 'Cada producto muestra fotos reales, con el número de serie y la fecha de fabricación.',
          detail:
            'Las fotos con datos de trazabilidad son difíciles de fabricar y permiten contrastar. Es información que juega a favor de la tienda.',
          difference: false,
        },
        {
          id: 'l4',
          text: 'Pago por la plataforma de la marketplace, con protección al comprador.',
          detail:
            'Pagar dentro de la plataforma conserva la mediación y el reembolso. Es la opción más segura para el comprador.',
          difference: false,
        },
      ],
    },
    right: {
      name: 'Electro Barato S.A.',
      subtitle: 'Publicación creada hace dos días.',
      items: [
        {
          id: 'r1',
          text: 'Descuento del 70 % por tiempo limitado: 24 horas.',
          detail:
            'El descuento enorme y el límite de tiempo son presión para decidir rápido. Un descuento tan grande merece explicación, y aquí no la hay.',
          difference: true,
        },
        {
          id: 'r2',
          text: 'Transferencia anticipada a la cuenta 200-XXX-YYY de «Andrés M.».',
          detail:
            'La cuenta no está a nombre de la tienda que vende, sino de un tercero, y además se pide fuera de la plataforma. Eso elimina la protección del comprador y la trazabilidad.',
          difference: true,
        },
        {
          id: 'r3',
          text: 'No se publica ninguna política de devolución ni de garantía.',
          detail:
            'La ausencia de condiciones de venta y devolución es información que falta. En una compra de ese valor, su ausencia es una señal de alerta.',
          difference: true,
        },
        {
          id: 'r4',
          text: 'No hay reseñas ni referencias verificables de otros compradores.',
          detail:
            'La falta de reseñas NO demuestra fraude por sí sola: una tienda nueva y legítima también las tiene. Es información que falta, no una señal en sí misma.',
          difference: false,
        },
        {
          id: 'r5',
          text: 'Perfil con publicaciones densas de productos a precios distintos en la misma semana.',
          detail:
            'Un perfil que publica muchas ofertas con precios distintos y sinhistoria es un patrón: el mismo medio se usa para muchas personas.',
          difference: true,
        },
      ],
    },
    answerSide: 'right',
    answer: {
      prompt: '¿Cuál de las dos tiendas presenta más señales de alerta?',
      options: [
        {
          id: 'a',
          label: 'La tienda de la izquierda, porque no tiene reseñas.',
          verdict: 'incorrect',
          explanation:
            'La tienda de la izquierda no tiene reseñas, pero publica condiciones de venta, contacto verificable, fotos con número de serie y pago por la plataforma. La falta de reseñas no la convierte en fraudulenta.',
        },
        {
          id: 'b',
          label: 'La tienda de la derecha.',
          verdict: 'correct',
          explanation:
            'La derecha combina cuatro cosas: descuento extraordinario con límite de tiempo, transferencia anticipada a un tercero, ausencia de condiciones de devolución y un perfil sin historial. La combinación es lo que hace la diferencia, no un solo punto.',
        },
        {
          id: 'c',
          label: 'Las dos: ninguna tiene reseñas verificables.',
          verdict: 'incorrect',
          explanation:
            'Ninguna de las dos tiene reseñas, así que eso no las diferencia. Y una señal aislada nunca define un caso: lo que define es el conjunto.',
        },
      ],
    },
    learning:
      'Evalúa la combinación de señales, la coherencia de la información y si puedes verificar la identidad del vendedor. La falta de reseñas no prueba fraude; el conjunto de incoherencias sí.',
    points: 200,
  },

  /* ---------------------------------------------------------------- */
  /* Caso 2 · Dos comprobantes de pago                                    */
  /* ---------------------------------------------------------------- */
  {
    id: 'cmp-2',
    scenario: COMPARE_SCENARIOS['cmp-2'],
    categoryId: 'comprobantes',
    title: 'Dos comprobantes de pago',
    prompt:
      'Dos comprobantes con diseños distintos. Compara la información que muestran y señala las incoherencias. Ninguno de los dos es una prueba por sí solo.',
    left: {
      name: 'Comprobante A',
      subtitle: 'Simulación de una operación aprobada en una app bancaria.',
      items: [
        {
          id: 'l1',
          text: 'Operación APROBADA, con identificador interno, fecha, monto y hora de liquidación.',
          detail:
            'Una operación con identificador y estado es un dato de sistema. Aun así, es una imagen: sirve para contrastar, no para demostrar.',
          difference: false,
        },
        {
          id: 'l2',
          text: 'El monto coincide con el acordado y la fecha es la de hoy.',
          detail:
            'La coherencia con lo pactado es un indicio favorable, no una prueba. Un atacante también puede conocer el monto.',
          difference: false,
        },
        {
          id: 'l3',
          text: 'La captura no muestra ningún número de cuenta de origen.',
          detail:
            'Falta el dato que permitiría comparar con el estado de cuenta del emisor. Es información que falta, no una incoherencia.',
          difference: false,
        },
      ],
    },
    right: {
      name: 'Comprobante B',
      subtitle: 'Captura enviada por chat, con un diseño distinto.',
      items: [
        {
          id: 'r1',
          text: 'La fecha del comprobante es de ayer, pero la conversación donde se envía es de hoy.',
          detail:
            'Incoherencia clara de fechas: el documento dice algo que no encaja con el contexto. Es una de las señales más útiles y más ignoradas.',
          difference: true,
        },
        {
          id: 'r2',
          text: 'El monto indicado es $845.000 y en el chat se kalió de $845.500.',
          detail:
            'El monto no coincide con el acordado. Un diferencia de quinientos pesos es pequeña, pero significa que el documento no se generó desde la operación real.',
          difference: true,
        },
        {
          id: 'r3',
          text: 'El estado que muestra es «pendiente de liquidación».',
          detail:
            'El propio documento dice que el dinero todavía no se ha movido. Es la inconsistencia más clara de las tres.',
          difference: true,
        },
        {
          id: 'r4',
          text: 'El diseño es más simple que el de una app bancaria real.',
          detail:
            'El diseno es un indicio, pero los disenos los copia cualquiera. No lo uses como prueba principal.',
          difference: false,
        },
      ],
    },
    answerSide: 'right',
    answer: {
      prompt: '¿Cuál demuestra que el vendedor recibió el dinero?',
      options: [
        {
          id: 'a',
          label: 'El comprobante A, porque muestra la operación como aprobada.',
          verdict: 'incorrect',
          explanation:
            'El comprobante A es una simulación coherente, pero sigue siendo una imagen. Lo que demuestra la recepción del dinero es el movimiento en la cuenta del receptor, visto en su propia entidad financiera.',
        },
        {
          id: 'b',
          label: 'El comprobante B, porque es el más reciente.',
          verdict: 'incorrect',
          explanation:
            'La fecha no convierte una imagen en una prueba, y en este caso el comprobante B es el que tiene tres incoherencias: fecha, monto y estado.',
        },
        {
          id: 'c',
          label: 'Ninguno de los dos, por sí solo.',
          verdict: 'correct',
          explanation:
            'Correcto. Hay que distinguir tres cosas: una imagen que parece un comprobante, un estado de operación que aparece en una simulación y una confirmación independiente de la recepción de los fondos en la cuenta del destinatario. Sólo la tercera es concluyente.',
        },
      ],
    },
    learning:
      'Una imagen que parece un comprobante no es un comprobante. Las señales más útiles suelen ser las incoherencias internas: fecha, monto y estado.',
    points: 200,
  },

  /* ---------------------------------------------------------------- */
  /* Caso 3 · Enlaces similares                                           */
  /* ---------------------------------------------------------------- */
  {
    id: 'cmp-3',
    scenario: COMPARE_SCENARIOS['cmp-3'],
    categoryId: 'enlaces',
    title: 'Enlaces similares',
    prompt:
      'Cuatro direcciones con nombres parecidos. Todas usan el sufijo reservado `.invalid`, que por definición no existe: son material de simulación y no llevan a ninguna parte.',
    left: {
      name: 'Dominios del caso',
      subtitle: 'Todos son ficticios y no resuelven.',
      items: [
        {
          id: 'l1',
          text: 'banco-ejemplo.invalid',
          detail:
            'El nombre más simple. No demuestra que sea auténtico: cualquiera puede registrar un dominio parecido.',
          difference: false,
        },
        {
          id: 'l2',
          text: 'banco-ejemplo-seguro.invalid',
          detail:
            'Añade una palabra que suena tranquilizadora. Esa palabra no prueba nada y se usa justamente para dar confianza.',
          difference: true,
        },
        {
          id: 'l3',
          text: 'portal-banco-ejemplo.invalid',
          detail:
            'Antepone «portal». Es la misma técnica: una palabra sugerente antes del nombre real.',
          difference: true,
        },
        {
          id: 'l4',
          text: 'acceso.verificacion-cuenta.invalid',
          detail:
            'No menciona la marca en absoluto: intenta parecer un servicio genérico de verificación. Es la variante más discreta.',
          difference: true,
        },
      ],
    },
    right: {
      name: 'Cómo se leen los dominios',
      subtitle: 'La parte que importa es la de la derecha.',
      items: [
        {
          id: 'r1',
          text: 'El dominio real es el texto que va después de la última barra.',
          detail:
            'En «banco-ejemplo-seguro.acceso-total.invalid/verificar», el dominio es «acceso-total.invalid». Todo lo anterior es una carpeta que el atacante creó en su sitio.',
          difference: false,
        },
        {
          id: 'r2',
          text: 'Un candado HTTPS sólo dice que el trayecto está cifrado.',
          detail:
            'El candado no dice quién está detrás del sitio. Hoy los sitios de phishing también lo usan porque es gratis.',
          difference: false,
        },
        {
          id: 'r3',
          text: 'Un acortador esconde el destino real detrás de una dirección corta.',
          detail:
            'Si un enlace viene acortado, no puedes saber a dónde lleva sin expandarlo. La forma más segura es no usarlo y entrar por la app.',
          difference: false,
        },
        {
          id: 'r4',
          text: 'La forma más segura de llegar al servicio es la app o una dirección que ya tenías guardada.',
          detail:
            'Este es el criterio que resuelve el caso: no se trata de adivinar qué dominio es el bueno, sino de no depender del enlace recibido.',
          difference: false,
        },
      ],
    },
    answerSide: 'ninguno',
    answer: {
      prompt: '¿Puedes determinar cuál de los dominios pertenece al banco sólo por el nombre?',
      options: [
        {
          id: 'a',
          label: 'Sí: «banco-ejemplo.invalid» es el original y los otros son imitaciones.',
          verdict: 'incorrect',
          explanation:
            'No se puede saber por el nombre. Los cuatro son ficticios, pero en la vida real cualquiera puede registrar un dominio parecido, y el atacante elige que el suyo se parezca al legítimo.',
        },
        {
          id: 'b',
          label: 'No se puede determinar por el nombre; hay que entrar por la app o por una dirección ya verificada.',
          verdict: 'correct',
          explanation:
            'Correcto. El nombre de un dominio no es una prueba de autenticidad. La estrategia segura no es tratar de distinguir los nombres, sino no depender nunca del enlace recibido: se entra por la app o por una dirección guardada de antemano.',
        },
        {
          id: 'c',
          label: 'Sí, mirando cuál tiene el candado de seguridad.',
          verdict: 'incorrect',
          explanation:
            'El candado HTTPS sólo cifra el trayecto entre tu dispositivo y el sitio. No dice quién está detrás, y los sitios de phishing también lo obtienen sin coste.',
        },
      ],
    },
    learning:
      'Un nombre familiar o una variación aparentemente pequeña no demuestra autenticidad. La estrategia segura es entrar por la app o por una dirección previamente verificada.',
    points: 200,
  },
]