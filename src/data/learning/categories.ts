import type { LearningCategory } from './types'

/**
 * Categorías educativas del Centro de aprendizaje.
 *
 * Cada juego, caso y pregunta apunta a una de ellas, y el panel de progreso
 * muestra en cuál se ha concentrado más el usuario.
 */
export const LEARNING_CATEGORIES: LearningCategory[] = [
  {
    id: 'phishing',
    title: 'Phishing y mensajes fraudulentos',
    summary: 'Correos y SMS que se hacen pasar por una entidad de confianza.',
    color: '#5b7cf5',
    icon: 'mail',
  },
  {
    id: 'suplantacion',
    title: 'Suplantación de identidad',
    summary: 'Alguien que se hace pasar por ti o por alguien que conoces.',
    color: '#9b6ef0',
    icon: 'user',
  },
  {
    id: 'whatsapp',
    title: 'Fraudes por WhatsApp y redes sociales',
    summary: 'Conversaciones donde te piden dinero, datos o un enlace.',
    color: '#2fb87c',
    icon: 'chat',
  },
  {
    id: 'compras',
    title: 'Compras y ventas por internet',
    summary: 'Tiendas y vendedores que no son quien dicen ser.',
    color: '#e0629b',
    icon: 'cart',
  },
  {
    id: 'comprobantes',
    title: 'Comprobantes de pago',
    summary: 'Capturas que parecen una transferencia confirmada.',
    color: '#e9a13b',
    icon: 'receipt',
  },
  {
    id: 'laboral',
    title: 'Fraudes laborales',
    summary: 'Ofertas de empleo que empiezan pidiendo un pago.',
    color: '#3d8ee0',
    icon: 'briefcase',
  },
  {
    id: 'inversiones',
    title: 'Inversiones sospechosas',
    summary: 'Ganancias garantizadas y duplicar el dinero.',
    color: '#f0601f',
    icon: 'chart',
  },
  {
    id: 'credenciales',
    title: 'Robo de cuentas y credenciales',
    summary: 'El código de un solo uso es la llave de tu cuenta.',
    color: '#43b98c',
    icon: 'key',
  },
  {
    id: 'enlaces',
    title: 'Enlaces y sitios web maliciosos',
    summary: 'Direcciones que imitan marcas conocidas.',
    color: '#7d55e0',
    icon: 'link',
  },
  {
    id: 'incidentes',
    title: 'Respuesta ante incidentes',
    summary: 'Qué hacer en los primeros minutos después de un incidente.',
    color: '#e23b5f',
    icon: 'shield',
  },
]
