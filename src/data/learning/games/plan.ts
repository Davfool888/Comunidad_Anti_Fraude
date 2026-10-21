import type { PlanMeasure } from '../types'

/**
 * Juego 8 · **Arma tu plan de proteccion**.
 *
 * El usuario elige las medidas que quiere incluir en su plan personal. Cada
 * medida explica para que sirve. El resumen se puede descargar como texto.
 *
 * No se guarda ningun dato sensible: el plan son las medidas que eliges, no
 * tus cuentas ni tus credenciales.
 */
export const PLAN_MEASURES: PlanMeasure[] = [
  {
    id: 'pm-1',
    label: 'Usar contrasenas unicas para cada servicio',
    detail:
      'Si una contrasena se filtra en un sitio, con contrasenas unicas la다른a no se compromete. Un gestor de contrasenas hace el trabajo por ti.',
    group: 'Cuentas',
    essential: true,
  },
  {
    id: 'pm-2',
    label: 'Activar la verificacion en dos pasos',
    detail:
      'Anade un segundo factor: aunque roben la contrasena, no basta para entrar. Es la medida que mas reduce el riesgo por fuerza bruta.',
    group: 'Cuentas',
    essential: true,
  },
  {
    id: 'pm-3',
    label: 'Mantener actualizados los dispositivos',
    detail:
      'Las actualizaciones corrigen fallos de seguridad ya conocidos. Un telefono sin actualizar es una puerta abierta.',
    group: 'Dispositivos',
    essential: false,
  },
  {
    id: 'pm-4',
    label: 'Revisar los permisos de las aplicaciones',
    detail:
      'Una app de linterna no necesita acceso a tus contactos ni a tu ubicacion. Revisa y retira lo que noJustifiques.',
    group: 'Dispositivos',
    essential: false,
  },
  {
    id: 'pm-5',
    label: 'Verificar enlaces y remitentes antes de hacer clic',
    detail:
      'Mira el dominio real (lo que va despues de la ultima barra) y desconfia de la urgencia. Si tienes duda, entra por la aplicacion.',
    group: 'Verificacion',
    essential: true,
  },
  {
    id: 'pm-6',
    label: 'Confirmar los pagos desde tu canal financiero',
    detail:
      'Un comprobante no demuestra que el dinero llegue. Confirma el movimiento en tu propia app o en el portal de tu entidad.',
    group: 'Pagos',
    essential: true,
  },
  {
    id: 'pm-7',
    label: 'Desconfiar de las solicitudes de codigos de seguridad',
    detail:
      'El codigo de un solo uso es para ti. Nadie legitimo te lo pide, ni por mensaje, ni por llamada, ni por chat.',
    group: 'Verificacion',
    essential: true,
  },
  {
    id: 'pm-8',
    label: 'Hacer copias de seguridad de lo importante',
    detail:
      'Fotos, documentos y correos que no podrias reponer son los mas valiosos. Una copia guardada en otro sitio reduce el dano de un incidente.',
    group: 'Respuesta',
    essential: false,
  },
  {
    id: 'pm-9',
    label: 'Conservar evidencias cuando sospeche de un fraude',
    detail:
      'Capturas con fecha y hora, el numero del remitente y los montos. Son las que permiten reclamar y las que delatan el patron.',
    group: 'Respuesta',
    essential: true,
  },
  {
    id: 'pm-10',
    label: 'Conocer los canales oficiales de ayuda',
    detail:
      'El numero de tu entidad financiera, el del banco central, la linea de atencion y la direccion web de la institucion. Guardalos antes de necesitarlos.',
    group: 'Respuesta',
    essential: false,
  },
]
