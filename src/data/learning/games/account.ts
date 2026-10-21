import { PROTECTION_SCENARIOS } from './caseScenarios'
import type { ProtectionGame } from '../types'

/**
 * Juego 7 · **Protege tu cuenta**.
 *
 * Simula un incidente de seguridad en una cuenta de mensajería. Las medidas
 * de proteccion se adaptan a lo que el usuario decidio y a lo que ocurrio: no
 * todas son obligatorias en todos los escenarios.
 *
 * El juego **nunca pide contrasenas, codigos OTP ni datos bancarios**: todo
 * ocurre dentro de la simulacion.
 */
export const PROTECTION_GAME: ProtectionGame = {
  id: 'protege-cuenta',
  categoryId: 'incidentes',
  title: 'Protege tu cuenta',
  intro:
    'Recibes una notificacion de acceso desconocido a tu cuenta de mensajeria. Poco despues, un contacto te informa que ha recibido mensajes extraños desde tu perfil. Todavia no sabes si perdiste el control de la cuenta, si alguien intento acceder o si la notificacion es falsa.',
  points: 300,
  phases: [
    {
      id: 'verificacion',
    scenario: PROTECTION_SCENARIOS['verificacion'],
      title: 'Fase 1 · Verificacion',
      context:
        'La notificacion dice: «Se ha iniciado sesion en su cuenta desde un navegador que no reconocemos. Si no fue usted, verifique su sesion aqui». El enlace lleva a un dominio que no es el del servicio.',
      options: [
        {
          id: 'abrir',
          label: 'Abrir el enlace de la notificacion para comprobar que sesion es.',
          verdict: 'incorrect',
          explanation:
            'La notificacion puede ser real o falsa: ese es justamente el problema. Si haces clic en su enlace, puedes escribir tu contrasena en el sitio que el atacante controla.',
        },
        {
          id: 'app',
          label: 'Abrir la aplicacion del servicio por mi cuenta y revisar las sesiones activas.',
          verdict: 'correct',
          explanation:
            'Entrar por el canal propio resuelve el caso sin exponerte. Desde ahi ves las sesiones reales, la informacion de la cuenta y las opciones de seguridad.',
        },
        {
          id: 'esperar',
          label: 'Esperar unas horas por si la notificacion es un error del servicio.',
          verdict: 'partial',
          explanation:
            'Esperar un poco esta bien si el aviso es dudoso, pero si la sesion ajena es real, cada hora es tiempo para el atacante. Lo que no se puede es dejar la cuenta sin revisar.',
        },
      ],
      measures: [
        {
          id: 'm-1',
          label: 'Revisa las sesiones activas desde la aplicacion oficial',
          detail:
            'La aplicacion muestra los dispositivos y lugares con sesion abierta. Es la unica forma fiable de saber si hay un acceso ajeno.',
          required: true,
        },
        {
          id: 'm-2',
          label: 'Cierra las sesiones que no reconozcas',
          detail:
            'Cerrar la sesion expulsa al tercero, pero no evita que vuelva: por eso hay que cambiar tambien la contrasena.',
          required: true,
        },
        {
          id: 'm-3',
          label: 'Revisa el correo y el telefono de recuperacion',
          detail:
            'Si el atacante cambio el correo de recuperacion, puede recuperar el acceso aunque cambies la contrasena. Es un paso que mucha gente se salta.',
          required: true,
        },
        {
          id: 'm-4',
          label: 'Activa o revisa la verificacion en dos pasos',
          detail:
            'Con segundo factor, un codigo robado deja de ser suficiente para entrar. Es la medida que mas reduce el riesgo a futuro.',
          required: false,
        },
      ],
    },
    {
      id: 'proteccion',
    scenario: PROTECTION_SCENARIOS['proteccion'],
      title: 'Fase 2 · Proteccion',
      context:
        'Desde la aplicacion ves una sesion abierta desde un equipo que no es tuyo, y un contacto te cuenta que le escribieron desde tu perfil pidiéndole un codigo de transferencia. La sesion esta ahi, y hay mensajes enviados que tu no has hecho.',
      options: [
        {
          id: 'solo-sesion',
          label: 'Cerrar la sesion desconocida y terminar ahi.',
          verdict: 'partial',
          explanation:
            'Cerrar la sesion es el primer paso y es correcto, pero no basta: si la contrasena quedo expuesta, pueden volver a entrar. Y quedan mensajes enviados a tus contactos que hay que gestionar.',
        },
        {
          id: 'completo',
          label: 'Cerrar la sesion, cambiar la contrasena, revisar el correo de recuperacion y avisar a mis contactos.',
          verdict: 'correct',
          explanation:
            'Es la respuesta completa: cortas el acceso, cambias la credencial comprometida, te aseguras de que el correo de recuperacion siga siendo tuyo y reduces el dano avisando a tus contactos, que son quienes pueden caer en el mensaje que salio desde tu cuenta.',
        },
        {
          id: 'ignorar',
          label: 'Cerrar la sesion y no avisar a nadie: mis contactos sabran que no fui yo.',
          verdict: 'incorrect',
          explanation:
            'Tus contactos no distinguen un mensaje falso de uno autentico si viene desde tu perfil con tu nombre. Avisarles es parte de la proteccion.',
        },
      ],
      measures: [
        {
          id: 'm-5',
          label: 'Avisa a tus contactos si se enviaron mensajes sospechosos desde tu cuenta',
          detail:
            'Un aviso breve evita que un contacto obedezca una peticion de dinero que «sale» de tu perfil, que es el patron tipico del fraude encadenado.',
          required: true,
        },
        {
          id: 'm-6',
          label: 'Denuncia los mensajes enviados desde tu cuenta',
          detail:
            'El servicio puede bloquear la cuenta usada para el fraude y frenar el patron para otros usuarios. Es una accion de un minuto con efecto colectivo.',
          required: false,
        },
        {
          id: 'm-7',
          label: 'Cambia tambien la contrasena de las cuentas donde usabas la misma clave',
          detail:
            'Si la clave se filtro, se filtro en todas partes. La del correo es la mas urgente: es la puerta de recuperacion de las demas.',
          required: false,
        },
      ],
    },
    {
      id: 'recuperacion',
    scenario: PROTECTION_SCENARIOS['recuperacion'],
      title: 'Fase 3 · Recuperacion',
      context:
        'La contrasena ha cambiado y el acceso esta limpio, pero tu contacto te dice que le mandaste un mensaje pidiéndole un codigo. Y hay otra cosa: una persona que ya no reconoce la cuenta afirma que le llego un correo de recuperacion con tu nombre.',
      options: [
        {
          id: 'nada',
          label: 'Ya esta: la contrasena nueva y la sesion cerrada resuelven el problema.',
          verdict: 'partial',
          explanation:
            'La parte tecnica esta resuelta, pero queda el lado humano: los mensajes que salieron de tu cuenta siguen siendo un riesgo para tus contactos y hay un intento de recuperacion en marcha que hay que invalidar.',
        },
        {
          id: 'completo',
          label: 'Invalidar las solicitudes de recuperacion pendientes, avisar a mis contactos y revisar el resto de cuentas.',
          verdict: 'correct',
          explanation:
            'Invalidar las solicitudes pendientes cierra la via por la que alguien podria quedarse con el control, y avisar a tus contactos corta el dano en cascada.',
        },
        {
          id: 'peor',
          label: 'Responder a quien dice no reconocerme pidiéndole que me diga quien es.',
          verdict: 'incorrect',
          explanation:
            'Negociar la identidad por mensaje no sirve: quien responde puede ser el atacante o alguien con informacion robada. Los tramites de recuperacion se hacen por los canales oficiales del servicio.',
        },
      ],
      measures: [
        {
          id: 'm-8',
          label: 'Invalida las solicitudes de recuperacion pendientes',
          detail:
            'Si alguien pidio restablecer tu contrasena, esa solicitud debe anularse. Es un paso corto que evita que el acceso regrese solo.',
          required: true,
        },
        {
          id: 'm-9',
          label: 'Usa el procedimiento oficial de recuperacion del servicio',
          detail:
            'Si ya perdiste el acceso, la via es el procedimiento oficial del servicio, con verificacion de identidad. No hay atajos por mensajes de «soporte».',
          required: true,
        },
        {
          id: 'm-10',
          label: 'Protege las cuentas que compartian la contrasena del correo',
          detail:
            'El correo es la puerta maestra. Si una cuenta depende de el, perderlo significa perder tambien el acceso a las demas.',
          required: true,
        },
      ],
    },
  ],
  recovery: {
    title: 'Si ya perdiste el acceso',
    text:
      'El unico camino es el procedimiento oficial de recuperacion del servicio, con verificacion de identidad (documento, datos de la cuenta, hechos que solo tu sabes). No existe un atajo por mensaje de «soporte» ni por llamada de un numero desconocido. Mientras esperas, protege el resto de cuentas: cambia la contrasena del correo si tienes acceso a el y revisa las cuentas donde usabas la misma clave.',
  },
}
