import { GAME_BADGES, type GameProgressMap, type GameResult } from './engine'

/**
 * Progreso de los juegos del Centro de aprendizaje.
 *
 * Se guarda en `localStorage`, detras de la interfaz `GameStore`, para poder
 * sustituirlo por un backend sin tocar la interfaz. No se guarda ningun dato
 * sensible: solo identificadores, puntos y contadores.
 */

const STORAGE_KEY = 'escudo.centro-aprendizaje.v1'

/** Estado persistido. */
export type LearningState = {
  version: number
  /** Progreso por juego. */
  games: GameProgressMap
  /** Insignias conseguidas. */
  badges: string[]
  /** Plan de proteccion elegido por el usuario (ids de medidas). */
  plan: string[]
  /** Puntos acumulados en todos los juegos. */
  points: number
}

export const EMPTY_STATE: LearningState = {
  version: 1,
  games: {},
  badges: [],
  plan: [],
  points: 0,
}

/** Interfaz de persistencia (hoy `localStorage`). */
export type GameStore = {
  load: () => LearningState
  save: (state: LearningState) => void
  clear: () => void
}

export const localGameStore: GameStore = {
  load: () => {
    if (typeof window === 'undefined') return EMPTY_STATE
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return EMPTY_STATE
      const parsed = JSON.parse(raw) as Partial<LearningState>
      if (!parsed || typeof parsed !== 'object') return EMPTY_STATE
      return {
        ...EMPTY_STATE,
        ...parsed,
        games: parsed.games ?? {},
        badges: parsed.badges ?? [],
        plan: parsed.plan ?? [],
      }
    } catch {
      return EMPTY_STATE
    }
  },
  save: (state) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* si el navegador bloquea el almacenamiento, se sigue en memoria */
    }
  },
  clear: () => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* sin almacenamiento disponible */
    }
  },
}

/**
 * Actualiza el estado con el resultado de una partida.
 * Devuelve el estado nuevo y las insignias nuevas conseguidas.
 */
export function applyResult(
  state: LearningState,
  result: GameResult,
  gameId: string,
): { state: LearningState; newBadges: string[] } {
  const previous = state.games[gameId]
  const completed = result.answered >= result.total
  const games: GameProgressMap = {
    ...state.games,
    [gameId]: {
      completed: previous?.completed || completed,
      score: result.score,
      best: Math.max(previous?.best ?? 0, result.score),
      answered: result.answered,
      correct: result.correct,
    },
  }

  const badges = [...state.badges]
  const newBadges: string[] = []
  GAME_BADGES.forEach((badge) => {
    if (badges.includes(badge.id)) return
    if (!badge.requires(games)) return
    badges.push(badge.id)
    newBadges.push(badge.id)
  })

  return {
    state: {
      ...state,
      games,
      badges,
      points: state.points + Math.max(0, result.score - (previous?.best ?? 0)),
    },
    newBadges,
  }
}

/** Marca un juego como completado (por ejemplo, al superar todos los casos). */
export function markCompleted(state: LearningState, gameId: string) {
  return applyResult(
    state,
    {
      gameId,
      score: 0,
      correct: 0,
      partial: 0,
      incorrect: 0,
      answered: 0,
      total: 0,
      byCategory: {},
      review: [],
      weakest: [],
    },
    gameId,
  )
}

/** Guarda el plan de proteccion elegido. */
export function applyPlan(state: LearningState, plan: string[]) {
  return { ...state, plan }
}

/** Resumen para el panel de progreso del centro. */
export type LearningSummary = {
  gamesPlayed: number
  gamesCompleted: number
  totalGames: number
  points: number
  badges: string[]
  started: boolean
}

export function summarizeLearning(state: LearningState, totalGames: number): LearningSummary {
  const entries = Object.values(state.games)
  return {
    gamesPlayed: entries.filter((item) => item.answered > 0).length,
    gamesCompleted: entries.filter((item) => item.completed).length,
    totalGames,
    points: state.points,
    badges: state.badges,
    started: entries.some((item) => item.answered > 0),
  }
}
