import {
  ROUTES,
  type LearningRoute,
  type RouteLesson,
} from '../../data/learning/routes.ts'
import type { LearningState } from './progress.ts'

/**
 * Lógica determinista de las rutas de aprendizaje.
 *
 * No toca React ni el almacenamiento: recibe el progreso y devuelve estados
 * y recomendaciones. Así se puede comprobar con pruebas automáticas.
 *
 * Una lección se considera completada cuando el usuario la termina y se
 * registra en su ruta. No se da por aprendida sólo porque el juego asociado
 * esté completado: el mismo juego puede aparecer en varias rutas y cada una
 * debe reflejar su propio avance.
 *
 * Aun así, si el usuario abre una lección cuyo juego ya había completado, al
 * salir se registra como completada: el progreso anterior no se pierde.
 */

export type LessonStatus = 'completada' | 'en-progreso' | 'disponible'

export type RouteStats = {
  done: number
  total: number
  /** 0 – 1 */
  percent: number
  started: boolean
  completed: boolean
  /** Siguiente lección pendiente, si queda alguna. */
  next: RouteLesson | null
}

export type LessonProgressView = {
  lesson: RouteLesson
  status: LessonStatus
  /** ¿Es la siguiente lección que conviene hacer? */
  recommended: boolean
}

/** ¿La lección ya está completada? */
export function isLessonCompleted(state: LearningState, lesson: RouteLesson) {
  return Boolean(state.lessons?.[lesson.id])
}

/** ¿El usuario ya abrió esta lección concreta? */
export function isLessonStarted(state: LearningState, lesson: RouteLesson) {
  return Boolean(state.startedLessons?.[lesson.id])
}

/** Estado de una lección. */
export function lessonStatus(state: LearningState, lesson: RouteLesson): LessonStatus {
  if (isLessonCompleted(state, lesson)) return 'completada'
  if (isLessonStarted(state, lesson)) return 'en-progreso'
  return 'disponible'
}

/** Progreso de una ruta. */
export function routeStats(state: LearningState, route: LearningRoute): RouteStats {
  const statuses = route.lessons.map((lesson) => lessonStatus(state, lesson))
  const done = statuses.filter((status) => status === 'completada').length
  const total = route.lessons.length
  const started = done > 0 || statuses.some((status) => status === 'en-progreso')

  return {
    done,
    total,
    percent: total === 0 ? 0 : done / total,
    started,
    completed: total > 0 && done === total,
    next: route.lessons.find((lesson) => lessonStatus(state, lesson) !== 'completada') ?? null,
  }
}

/** Ruta que el usuario está siguiendo. */
export function activeRoute(state: LearningState, routes: LearningRoute[] = ROUTES): LearningRoute {
  const explicit = routes.find((route) => route.id === state.activeRoute)
  if (explicit) return explicit

  const started = routes.find((route) => routeStats(state, route).started)
  return started ?? routes[0]
}

/** Lección que conviene hacer a continuación. */
export function recommendedLesson(
  state: LearningState,
  routes: LearningRoute[] = ROUTES,
): { route: LearningRoute; lesson: RouteLesson } | null {
  const current = activeRoute(state, routes)
  const currentNext = routeStats(state, current).next
  if (currentNext) return { route: current, lesson: currentNext }

  for (const route of routes) {
    const next = routeStats(state, route).next
    if (next) return { route, lesson: next }
  }
  return null
}

/** Camino visual de una ruta, con estados y recomendación. */
export function pathFor(
  state: LearningState,
  route: LearningRoute,
  recommendedId?: string,
): LessonProgressView[] {
  return route.lessons.map((lesson) => ({
    lesson,
    status: lessonStatus(state, lesson),
    recommended: lesson.id === recommendedId,
  }))
}

/** Resumen global de rutas y lecciones. */
export type OverallRoutes = {
  lessonsDone: number
  totalLessons: number
  routesStarted: number
  routesDone: number
  totalRoutes: number
  percent: number
}

export function overallRoutes(
  state: LearningState,
  routes: LearningRoute[] = ROUTES,
): OverallRoutes {
  const stats = routes.map((route) => routeStats(state, route))
  const lessonsDone = stats.reduce((total, item) => total + item.done, 0)
  const totalLessons = stats.reduce((total, item) => total + item.total, 0)

  return {
    lessonsDone,
    totalLessons,
    routesStarted: stats.filter((item) => item.started).length,
    routesDone: stats.filter((item) => item.completed).length,
    totalRoutes: routes.length,
    percent: totalLessons === 0 ? 0 : Math.round((lessonsDone / totalLessons) * 100),
  }
}

/**
 * XP estimados de una lección. Se calculan a partir del juego asociado para
 * que la cifra sea coherente con la puntuación real del motor.
 */
export function lessonXp(lesson: RouteLesson) {
  if (lesson.kind === 'reto') return 15
  if (lesson.kind === 'practica') return 20
  return 25
}
