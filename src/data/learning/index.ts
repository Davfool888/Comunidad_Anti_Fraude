import type { GameDefinition } from './types'
import { GAME_INTROS } from './games/introductions.ts'

/**
 * Registro de los **nueve juegos** del Centro de aprendizaje.
 *
 * Cada entrada describe el juego y sus contenidos. Los componentes de la
 * interfaz son genéricos: añadir un caso o una pregunta es añadir datos.
 *
 * Ojo: este archivo **no** importa los contenidos de los juegos. Así cada
 * juego viaja en su propio trozo de código y el bundle inicial no carga el
 * material educativo que el usuario todavía no ha abierto.
 */
export const GAMES: GameDefinition[] = [
  {
    id: 'detectives',
    intro: GAME_INTROS['detectives'],
    title: 'Detectives digitales',
    summary: 'Investiga mensajes, anuncios y conversaciones para encontrar las senales de alerta.',
    description:
      'Recibes un caso, examinas el mensaje simulado, marcas las señales que encuentras y decides qué hacer. Hay casos legítimos, sospechosos y ambiguos.',
    icon: 'detective',
    difficulty: 'Intermedia',
    minutes: 20,
    total: 4,
    color: '#5b7cf5',
    simulated: true,
  },
  {
    id: 'historias',
    intro: GAME_INTROS['historias'],
    title: 'Tu decides',
    summary: 'Historias ramificadas: cada decision te lleva a un camino distinto.',
    description:
      'Vive un escenario completo y toma las decisiones tu. Cada rama tiene consecuencias educativas y un cierre con lo que aprendiste.',
    icon: 'branch',
    difficulty: 'Intermedia',
    minutes: 25,
    total: 6,
    color: '#9b6ef0',
    simulated: true,
  },
  {
    id: 'diferencias',
    intro: GAME_INTROS['diferencias'],
    title: 'Encuentra las diferencias',
    summary: 'Compara dos fichas y detecta las incoherencias.',
    description:
      'Dos tiendas, dos comprobantes, dos dominios. Marca las diferencias y descubre cuales son senales de alerta y cuales solo informacion que falta.',
    icon: 'compare',
    difficulty: 'Intermedia',
    minutes: 15,
    total: 3,
    color: '#e9a13b',
    simulated: true,
  },
  {
    id: 'laboratorio',
    intro: GAME_INTROS['laboratorio'],
    title: 'Laboratorio de evidencias',
    summary: 'Ordena un expediente antes de emitir una valoracion.',
    description:
      'Separa hechos documentados, indicios e informacion que falta, evalua las hipotesis y elige las acciones prioritarias. El informe final usa lenguaje prudente.',
    icon: 'lab',
    difficulty: 'Avanzada',
    minutes: 25,
    total: 1,
    color: '#3d8ee0',
    simulated: true,
  },
  {
    id: 'contrarreloj',
    intro: GAME_INTROS['contrarreloj'],
    title: 'Desafio contrarreloj',
    summary: 'Diez situaciones breves para elegir la accion segura.',
    description:
      'Una partida rapida con preguntas de categorias variadas. El banco es mayor que la partida, asi que cada vez las situaciones son distintas.',
    icon: 'clock',
    difficulty: 'Intermedia',
    minutes: 12,
    total: 10,
    color: '#e0629b',
  },
  {
    id: 'vf-desafio',
    intro: GAME_INTROS['vf-desafio'],
    title: 'Verdadero, falso o no sabemos',
    summary: 'Diez afirmaciones para entrenar el criterio.',
    description:
      'No todo es verdadero ni falso: hay afirmaciones demasiado absolutas y situaciones que necesitan mas informacion. Practica esa diferencia.',
    icon: 'scale',
    difficulty: 'Básica',
    minutes: 10,
    total: 10,
    color: '#43b98c',
  },
  {
    id: 'protege-cuenta',
    intro: GAME_INTROS['protege-cuenta'],
    title: 'Protege tu cuenta',
    summary: 'Simula un incidente de seguridad y prioriza tus acciones.',
    description:
      'Un acceso desconocido, una sesion ajena y mensajes que salieron de tu perfil. Decide en tres fases y descubre que medidas aplican de verdad.',
    icon: 'shield',
    difficulty: 'Avanzada',
    minutes: 15,
    total: 3,
    color: '#e23b5f',
    simulated: true,
  },
  {
    id: 'plan',
    intro: GAME_INTROS['plan'],
    title: 'Arma tu plan de proteccion',
    summary: 'Construye tu plan de medidas y descargalo.',
    description:
      'Elige las medidas que quieres aplicar, lee por que sirve cada una y llévate tu plan en un resumen descargable.',
    icon: 'plan',
    difficulty: 'Básica',
    minutes: 10,
    total: 10,
    color: '#7d55e0',
  },
  {
    id: 'anatomia-tarjeta',
    intro: GAME_INTROS['anatomia-tarjeta'],
    title: 'Anatomía de una tarjeta',
    summary: 'Toca los campos de una tarjeta ficticia y aprende qué datos proteger.',
    description:
      'Explora el anverso y el reverso de una tarjeta de demostración, selecciona sus campos y descubre por qué el número, la fecha y el CVV se protegen en conjunto.',
    icon: 'card',
    difficulty: 'Básica',
    minutes: 8,
    total: 6,
    color: '#3d8ee0',
    simulated: true,
  },
]

/** Juego por id. */
export const GAME_BY_ID = Object.fromEntries(GAMES.map((game) => [game.id, game]))
