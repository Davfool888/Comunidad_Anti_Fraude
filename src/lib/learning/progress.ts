import { GAME_BADGES, type GameProgressMap, type GameResult } from './engine.ts'

/**
 * Progreso de los juegos del Centro de aprendizaje.
 *
 * Se guarda en `localStorage`, detras de la interfaz `GameStore`, para poder
 * sustituirlo por un backend sin tocar la interfaz. No se guarda ningun dato
 * sensible: solo identificadores, puntos y contadores.
 */

const STORAGE_KEY = 'escudo.centro-aprendizaje.v1'

/** Lección de una ruta ya completada. */
export type LessonRecord = {
  completedAt: number
  routeId: string
  gameId: string
}

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
  /** Lecciones de ruta completadas, por id de lección. */
  lessons: Record<string, LessonRecord>
  /** Lecciones de ruta abiertas, por id de lección (marca de tiempo). */
  startedLessons: Record<string, number>
  /** Ruta que el usuario está siguiendo. */
  activeRoute: string | null
}

export const EMPTY_STATE: LearningState = {
  version: 3,
  games: {},
  badges: [],
  plan: [],
  points: 0,
  lessons: {},
  startedLessons: {},
  activeRoute: null,
}

/**
 * Migra un estado guardado por una versión anterior.
 *
 * Conserva todo lo que ya existía (juegos, puntos, insignias, plan) y añade
 * los campos nuevos con valores vacíos. Nunca borra progreso.
 */
export function migrateLearningState(parsed: Partial<LearningState> | null | undefined): LearningState {
  if (!parsed || typeof parsed !== 'object') return EMPTY_STATE
  return {
    ...EMPTY_STATE,
    ...parsed,
    version: EMPTY_STATE.version,
    games: parsed.games ?? {},
    badges: parsed.badges ?? [],
    plan: parsed.plan ?? [],
    lessons: parsed.lessons ?? {},
    startedLessons: parsed.startedLessons ?? {},
    activeRoute: parsed.activeRoute ?? null,
  }
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
      return migrateLearningState(parsed)
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

/**
 * Marca una lección de ruta como completada.
 *
 * No reinicia nada: si la lección ya estaba completada se conserva la fecha
 * original. Se guarda la ruta y el juego para poder mostrar el historial sin
 * duplicar puntos.
 */
export function completeRouteLesson(
  state: LearningState,
  info: { lessonId: string; routeId: string; gameId: string },
  now = Date.now(),
): { state: LearningState; isNew: boolean } {
  if (state.lessons[info.lessonId]) return { state, isNew: false }
  return {
    state: {
      ...state,
      lessons: {
        ...state.lessons,
        [info.lessonId]: {
          completedAt: now,
          routeId: info.routeId,
          gameId: info.gameId,
        },
      },
    },
    isNew: true,
  }
}

/** Recuerda la ruta activa sin tocar el resto del progreso. */
export function setActiveRoute(state: LearningState, routeId: string | null) {
  if (state.activeRoute === routeId) return state
  return { ...state, activeRoute: routeId }
}

/**
 * Marca una lección como abierta. Es independiente de la ruta para no dar por
 * iniciadas lecciones de otras rutas que reutilizan el mismo juego.
 */
export function startRouteLesson(state: LearningState, lessonId: string, now = Date.now()) {
  if (state.lessons[lessonId] || state.startedLessons[lessonId]) return state
  return {
    ...state,
    startedLessons: { ...state.startedLessons, [lessonId]: now },
  }
}

/** Resumen para el panel de progreso del centro. */
export type LearningSummary = {
  gamesPlayed: number
  gamesCompleted: number
  totalGames: number
  points: number
  badges: string[]
  started: boolean
  /** Lecciones de ruta completadas. */
  lessonsCompleted: number
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
    lessonsCompleted: Object.keys(state.lessons).length,
  }
}
