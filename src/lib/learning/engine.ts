import { LEARNING_CATEGORIES } from '../../data/learning/categories'
import type { Option, Verdict } from '../../data/learning/types'
import { VERDICT_POINTS } from '../../data/learning/types'

/**
 * Motor de evaluación común a todos los juegos.
 *
 * Distingue cuatro situaciones: respuesta correcta, parcialmente correcta,
 * incorrecta e **información insuficiente** (que no es lo mismo que fallar).
 * Los puntos se adaptan a cada juego, pero la regla de base es la misma:
 * premiar la decision segura, no la rapidez.
 */

/** Resultado de evaluar una respuesta. */
export type AnswerScore = {
  verdict: Verdict
  points: number
  correct: boolean
}

/** Evalúa una opción elegida. */
export function scoreOption(option: Option | undefined, basePoints = 100): AnswerScore {
  if (!option) {
    return { verdict: 'incorrect', points: 0, correct: false }
  }
  const points = option.points ?? VERDICT_POINTS[option.verdict]
  return {
    verdict: option.verdict,
    points: option.verdict === 'correct' ? Math.max(points, basePoints) : points,
    correct: option.verdict === 'correct',
  }
}

/** Resumen de una partida. */
export type GameResult = {
  gameId: string
  score: number
  correct: number
  partial: number
  incorrect: number
  answered: number
  total: number
  /** Aciertos por categoría. */
  byCategory: Record<string, { correct: number; total: number }>
  /** Identificadores de los elementos que conviene repasar. */
  review: string[]
  /** Categorías donde más falló el usuario. */
  weakest: string[]
}

/** Acumula respuestas durante una partida. */
export class GameScorer {
  gameId: string
  total: number
  private correct = 0
  private partial = 0
  private incorrect = 0
  private score = 0
  private byCategory: Record<string, { correct: number; total: number }> = {}
  private review: string[] = []

  constructor(gameId: string, total: number) {
    this.gameId = gameId
    this.total = total
  }

  /** Registra una respuesta. */
  add(categoryId: string, itemId: string, answer: AnswerScore) {
    const bucket = (this.byCategory[categoryId] ??= { correct: 0, total: 0 })
    bucket.total += 1
    this.score += answer.points
    if (answer.verdict === 'correct') {
      this.correct += 1
      bucket.correct += 1
      return
    }
    if (answer.verdict === 'partial') {
      this.partial += 1
      this.review.push(itemId)
      return
    }
    this.incorrect += 1
    this.review.push(itemId)
  }

  /** Cierra la partida y devuelve el resumen. */
  finish(): GameResult {
    const weakest = Object.entries(this.byCategory)
      .filter(([, value]) => value.correct < value.total)
      .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
      .map(([id]) => id)

    return {
      gameId: this.gameId,
      score: this.score,
      correct: this.correct,
      partial: this.partial,
      incorrect: this.incorrect,
      answered: this.correct + this.partial + this.incorrect,
      total: this.total,
      byCategory: this.byCategory,
      review: [...new Set(this.review)],
      weakest,
    }
  }
}

/* ------------------------------------------------------------------ */
/* Insignias                                                            */
/* ------------------------------------------------------------------ */

/** Insignia del sistema de juegos. */
export type GameBadge = {
  id: string
  label: string
  description: string
  /** Condición para obtenerla. */
  requires: (progress: GameProgressMap) => boolean
}

/** Mapa de progreso por juego. */
export type GameProgressMap = Record<
  string,
  { completed: boolean; score: number; best: number; answered: number; correct: number }
>

/**
 * Insignias: premian actividades completadas y conocimientos practicados.
 * Ninguna afirma que el usuario sea inmune a los fraudes.
 */
export const GAME_BADGES: GameBadge[] = [
  {
    id: 'detective-digital',
    label: 'Detective digital',
    description: 'Completaste los primeros tres casos de investigación.',
    requires: (progress) =>
      ['dete-1', 'dete-2', 'dete-3'].every((id) => progress[id]?.completed),
  },
  {
    id: 'guardian-cuentas',
    label: 'Guardian de cuentas',
    description: 'Terminaste el juego de proteccion de cuentas.',
    requires: (progress) => progress['protege-cuenta']?.completed === true,
  },
  {
    id: 'investigador-responsable',
    label: 'Investigador responsable',
    description: 'Completaste el laboratorio de evidencias.',
    requires: (progress) => progress['lab-1']?.completed === true,
  },
  {
    id: 'comprador-prevenido',
    label: 'Comprador prevenido',
    description: 'Resolviste los casos de compras y comprobantes.',
    requires: (progress) =>
      ['cmp-1', 'cmp-2', 'ven-1', 'ven-2'].some((id) => progress[id]?.completed),
  },
  {
    id: 'experto-verificacion',
    label: 'Experto en verificacion',
    description: 'Completaste el desafio de pensamiento critico.',
    requires: (progress) => progress['vf-desafio']?.completed === true,
  },
]

/** Categorías donde el usuario más falló, con su nombre legible. */
export function weakestCategories(result: GameResult) {
  return result.weakest
    .map((id) => LEARNING_CATEGORIES.find((category) => category.id === id))
    .filter(Boolean)
    .map((category) => category!.title)
}
