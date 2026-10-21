import { LAB_SCENARIO } from './caseScenarios'
import type { LabCase } from '../types'

/**
 * Juego 4 · **Laboratorio de evidencias**.
 *
 * El usuario recibe un expediente y organiza la información antes de emitir
 * una valoración: separar hechos documentados, indicios e información que
 * falta. El informe final usa lenguaje prudente: «posible fraude», «indicios
 * de riesgo», «hechos pendientes de verificación». Nunca presenta una
 * conclusión penal ni identifica públicamente a una persona.
 */
export const LAB_CASES: LabCase[] = [
  {
    id: 'lab-1',
    scenario: LAB_SCENARIO,
    categoryId: 'compras',
    title: 'La compra que nunca llegó',
    story: [
      'Una persona encuentra un producto anunciado en una tienda de redes sociales. El vendedor afirma tener disponibilidad inmediata y solicita el pago anticipado.',
      'Después de realizar la transferencia, el comprador no recibe el producto. El vendedor deja de responder durante varios días.',
      'El comprador conserva una captura del anuncio, la conversación, un comprobante de transferencia y el nombre de la cuenta receptora.',
      'Todavía no se sabe si hubo una estafa, un retraso, un problema logístico o una disputa comercial. El trabajo es investigar sin asumir la conclusión desde el principio.',
    ],
    evidences: [
      {
        id: 'ev-a',
        title: 'Evidencia A · Anuncio del producto',
        text: 'Precio, descripción, fecha de publicación y perfil que publicó el anuncio. El anuncio dice «disponibilidad inmediata» y no muestra condiciones de devolución.',
        classification: 'hecho',
        detail:
          'Es un hecho documentado dentro del expediente: el anuncio existió, decía eso y lo publicó ese perfil. Documenta lo que se dijo, no si era verdad.',
      },
      {
        id: 'ev-b',
        title: 'Evidencia B · Conversación',
        text: 'El vendedor pide el pago anticipado y promete entrega al día siguiente. No hay número de seguimiento en toda la conversación.',
        classification: 'indicio',
        detail:
          'Es un indicio: el pago anticipado y la promesa de entrega inmediata son compatibles con un fraude, pero también con un negocio informal que falla. Requiere análisis, no es una prueba.',
      },
      {
        id: 'ev-c',
        title: 'Evidencia C · Comprobante de transferencia',
        text: 'El comprobante muestra que el comprador realizó una operación por el monto indicado. El caso no confirma por sí solo si el dinero fue recibido por el vendedor anunciado.',
        classification: 'hecho',
        detail:
          'Es un hecho documentado: el comprador salió de su cuenta ese dinero. Lo que no se sabe es si llegó al destino, y eso hay que verificarlo con la entidad financiera.',
      },
      {
        id: 'ev-d',
        title: 'Evidencia D · Seguimiento',
        text: 'El comprador escribe varias veces solicitando información. No recibe respuesta durante cuatro días.',
        classification: 'indicio',
        detail:
          'El silencio prolongado es un indicio de riesgo importante, pero un retraso logístico real produce el mismo síntoma. Hay que contrastarlo con el resto de evidencias.',
      },
      {
        id: 'ev-e',
        title: 'Evidencia E · Consulta del pedido',
        text: 'No existe un número de seguimiento verificable en la información entregada por el vendedor.',
        classification: 'falta',
        detail:
          'Esto es información que falta, no una señal. Si hubiera existido un número de seguimiento, se podría haber consultado; como no lo hay, esa vía de verificación no está disponible.',
      },
      {
        id: 'ev-f',
        title: 'Evidencia F · Información adicional',
        text: 'El comprador todavía no ha contactado al proveedor de pago ni ha verificado si existe una empresa formal detrás de la tienda.',
        classification: 'falta',
        detail:
          'Es información pendiente de obtener. Sin esas dos averiguaciones no se puede sostener ninguna conclusión: las dos podrían cambiar el resultado.',
      },
    ],
    hypotheses: [
      {
        id: 'h1',
        label: 'A. El vendedor cometió fraude.',
        text: 'El vendedor se apropió del dinero y no تسليم el producto.',
        demonstrated: false,
        detail:
          'Es la hipótesis más razonable por la combinación de indicios, pero no está demostrada con la información disponible. Para sostenerla harían falta el resultado de la entidad financiera y la verificación de que no hay una operación logística real detrás.',
      },
      {
        id: 'h2',
        label: 'B. Hubo un incumplimiento o una disputa comercial cuya causa todavía no está clara.',
        text: 'El vendedor no pudo entregar por un problema propio o por un desacuerdo sobre el pedido.',
        demonstrated: false,
        detail:
          'También es compatible con la información disponible. El silencio y el pago anticipado lo hacen menos probable, pero no lo descartan.',
      },
      {
        id: 'h3',
        label: 'C. El comprador recibió el producto correctamente.',
        text: 'La entrega se hizo y el problema es otro.',
        demonstrated: false,
        detail:
          'Es la hipótesis menos compatible: no hay ningún indicio de entrega y sí hay tres indicadores de riesgo. Aun así, con la información actual no puede descartarse formalmente.',
      },
    ],
    actions: [
      {
        id: 'a1',
        label: 'Conservar la conversación y los comprobantes originales',
        recommended: true,
        detail:
          'La evidencia permite confirmar los hechos, rastrear y sostener un reporte. Guarda capturas con fecha y hora visibles.',
      },
      {
        id: 'a2',
        label: 'Contactar al proveedor de pago por un canal oficial',
        recommended: true,
        detail:
          'Ellos pueden confirmar si la operación se recibió y, en muchos casos, abrir un proceso de reversión o bloqueo.',
      },
      {
        id: 'a3',
        label: 'Consultar los canales competentes para reportar los hechos',
        recommended: true,
        detail:
          'Reportar en la Policia (CAI Virtual) abre un expediente y activa el seguimiento. El reporte describe hechos, no conclusiones..'
      },
      {
        id: 'a4',
        label: 'Organizar una cronología con fechas y comunicaciones',
        recommended: true,
        detail:
          'Ordenar los hechos en el tiempo ayuda a entender el patrón y hace mucho más fácil el reporte y la reclamación.',
      },
      {
        id: 'a5',
        label: 'Verificar la información comercial disponible',
        recommended: true,
        detail:
          'Comprobar si la tienda existe como negocio, si tiene datos públicos y si otros compradores lo han reportado.',
      },
      {
        id: 'a6',
        label: 'Publicar acusaciones como hechos comprobados',
        recommended: false,
        detail:
          'Hacer difusion de una acusacion no comprobada puede danar a la persona equivocada y tener consecuencias legales para quien la publica.',
      },
      {
        id: 'a7',
        label: 'Amenazar al vendedor',
        recommended: false,
        detail:
          'Las amenazas no recuperan el dinero, destruyen la evidencia y pueden convertirse en un problema para el comprador.',
      },
      {
        id: 'a8',
        label: 'Eliminar la conversación',
        recommended: false,
        detail:
          'Borrar el chat destruye la prueba más útil que tienes y cierra la puerta a la reclamación.',
      },
      {
        id: 'a9',
        label: 'Pagar a terceros que prometen recuperar el dinero',
        recommended: false,
        detail:
          'Es la segunda etapa del fraude. Nadie recupera dinero a cambio de una tarifa anticipada.',
      },
    ],
    expectedActions: ['a1', 'a2', 'a3', 'a4', 'a5'],
    report: {
      hechos: [
        'Se publicó un anuncio de un producto con promesa de disponibilidad inmediata y sin condiciones de devolución.',
        'El vendedor solicitó un pago anticipado y promete entrega al día siguiente.',
        'El comprador realizó una operación por el monto indicado.',
        'El vendedor no respondió en cuatro días.',
      ],
      senales: [
        'Pago anticipado sin número de seguimiento.',
        'Promesa de entrega inmediata sin respaldo verificable.',
        'Perfil sin historial ni referencias comprobables.',
        'Silencio prolongado tras el cobro.',
      ],
      hipotesis: [
        'Es posible un fraude: hay indicios de riesgo importantes, pero la causa todavía no está confirmada.',
        'También es posible un incumplimiento comercial o un problema logístico: con la información actual no se puede descartar.',
        'La hipótesis de una entrega correcta es la menos compatible con el conjunto de evidencias.',
      ],
      falta: [
        'Confirmación de la entidad financiera sobre si la operación fue recibida.',
        'Verificación de si existe una empresa formal detrás de la tienda.',
        'Cualquier referencia verificable de otros compradores.',
      ],
      acciones: [
        'Conservar la evidencia original (capturas, comprobante, conversación) sin modificarla.',
        'Contactar al proveedor de pago por su canal oficial y solicitar el estado de la operación.',
        'Presentar el reporte en la Policía Nacional (CAI Virtual) y guardar el radicado.',
        'Ordenar los hechos en una cronología con fechas y horas.',
        'Compartir la alerta en la red de comercios del barrio.',
      ],
    },
    points: 300,
  },
]
