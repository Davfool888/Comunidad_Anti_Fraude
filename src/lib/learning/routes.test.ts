import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GAMES } from '../../data/learning/index.ts'
import { LESSON_BY_ID, ROUTES } from '../../data/learning/routes.ts'
import {
  activeRoute,
  lessonStatus,
  overallRoutes,
  pathFor,
  recommendedLesson,
  routeStats,
} from './routes.ts'
import {
  completeRouteLesson,
  EMPTY_STATE,
  migrateLearningState,
  setActiveRoute,
  startRouteLesson,
  type LearningState,
} from './progress.ts'

/**
 * Pruebas de la lógica de rutas: estados de lección, progreso por ruta,
 * recomendación de la siguiente lección y resumen global.
 *
 * Se ejecutan con `npm run test:unit` (sin dependencias).
 */

function emptyState(overrides: Partial<LearningState> = {}): LearningState {
  return {
    version: 3,
    games: {},
    badges: [],
    plan: [],
    points: 0,
    lessons: {},
    startedLessons: {},
    activeRoute: null,
    ...overrides,
  }
}

test('una ruta vacía empieza en su primera lección', () => {
  const route = ROUTES[0]
  const stats = routeStats(emptyState(), route)
  assert.equal(stats.done, 0)
  assert.equal(stats.total, route.lessons.length)
  assert.equal(stats.percent, 0)
  assert.equal(stats.next?.id, route.lessons[0].id)
  assert.equal(stats.completed, false)
})

test('las lecciones completadas avanzan el camino y la siguiente recomendación', () => {
  const route = ROUTES[0]
  const [first, second, third] = route.lessons
  const state = emptyState({
    lessons: {
      [first.id]: { completedAt: 1, routeId: route.id, gameId: first.gameId },
      [second.id]: { completedAt: 2, routeId: route.id, gameId: second.gameId },
    },
  })

  const stats = routeStats(state, route)
  assert.equal(stats.done, 2)
  assert.equal(stats.next?.id, third.id)
  assert.equal(lessonStatus(state, first), 'completada')
  assert.equal(lessonStatus(state, third), 'disponible')
})

test('un juego completado no marca por sí solo lecciones de varias rutas', () => {
  const route = ROUTES[0]
  const lesson = route.lessons[0]
  const state = emptyState({
    games: {
      [lesson.gameId]: {
        completed: true,
        score: 120,
        best: 120,
        answered: 3,
        correct: 3,
      },
    },
  })

  assert.equal(lessonStatus(state, lesson), 'disponible')
  assert.equal(routeStats(state, route).done, 0)
})

test('abrir una lección la deja en curso sólo en su propia ruta', () => {
  const route = ROUTES[0]
  const lesson = route.lessons[0]
  const otherRoute = ROUTES.find(
    (item) => item.id !== route.id && item.lessons.some((entry) => entry.gameId === lesson.gameId),
  )!
  const state = emptyState({ startedLessons: { [lesson.id]: 1 } })

  assert.equal(lessonStatus(state, lesson), 'en-progreso')
  const otherLesson = otherRoute.lessons.find((entry) => entry.gameId === lesson.gameId)!
  assert.equal(lessonStatus(state, otherLesson), 'disponible')
})

test('la ruta activa manda en la recomendación', () => {
  const whatsapp = ROUTES.find((route) => route.id === 'whatsapp')!
  const state = emptyState({ activeRoute: 'whatsapp' })
  const current = activeRoute(state)
  const next = recommendedLesson(state)

  assert.equal(current.id, 'whatsapp')
  assert.equal(next?.route.id, 'whatsapp')
  assert.equal(next?.lesson.id, whatsapp.lessons[0].id)
})

test('si la ruta activa está completa se recomienda otra ruta pendiente', () => {
  const route = ROUTES[0]
  const lessons = Object.fromEntries(
    route.lessons.map((lesson) => [
      lesson.id,
      { completedAt: 1, routeId: route.id, gameId: lesson.gameId },
    ]),
  )
  const state = emptyState({ activeRoute: route.id, lessons })
  const next = recommendedLesson(state)

  assert.notEqual(next?.route.id, route.id)
  assert.ok(next?.lesson)
})

test('el resumen global suma lecciones, rutas iniciadas y completadas', () => {
  const [first, second] = ROUTES
  const lessons = Object.fromEntries(
    first.lessons.map((lesson) => [
      lesson.id,
      { completedAt: 1, routeId: first.id, gameId: lesson.gameId },
    ]),
  )
  const state = emptyState({
    activeRoute: second.id,
    lessons,
    startedLessons: { [second.lessons[0].id]: 1 },
  })

  const overall = overallRoutes(state)
  assert.equal(overall.lessonsDone, first.lessons.length)
  assert.equal(overall.totalLessons, ROUTES.reduce((total, route) => total + route.lessons.length, 0))
  assert.equal(overall.routesDone, 1)
  assert.ok(overall.routesStarted >= 2)
  assert.ok(overall.percent > 0 && overall.percent < 100)
})

test('el camino marca una sola lección como recomendada', () => {
  const route = ROUTES[0]
  const recommended = route.lessons[1]
  const path = pathFor(emptyState(), route, recommended.id)

  assert.equal(path.filter((node) => node.recommended).length, 1)
  assert.equal(path.find((node) => node.recommended)?.lesson.id, recommended.id)
})

test('todas las lecciones apuntan a un juego existente y tienen id único', () => {
  const seen = new Set<string>()
  const gameIds = new Set(GAMES.map((game) => game.id))

  ROUTES.forEach((route) => {
    assert.ok(route.lessons.length >= 3, `${route.id} debe tener al menos tres lecciones`)
    route.lessons.forEach((lesson) => {
      assert.equal(seen.has(lesson.id), false, `lección duplicada: ${lesson.id}`)
      seen.add(lesson.id)
      assert.ok(gameIds.has(lesson.gameId), `${lesson.id} apunta a un juego inexistente`)
      assert.equal(LESSON_BY_ID[lesson.id]?.route.id, route.id)
    })
  })
})

test('migrar un progreso antiguo conserva juegos, puntos e insignias', () => {
  const previous = {
    version: 1,
    games: {
      detectives: { completed: true, score: 90, best: 90, answered: 3, correct: 2 },
    },
    badges: ['detective-digital'],
    plan: ['clave-unica'],
    points: 90,
  }
  const migrated = migrateLearningState(previous)

  assert.equal(migrated.version, 3)
  assert.equal(migrated.points, 90)
  assert.deepEqual(migrated.badges, ['detective-digital'])
  assert.deepEqual(migrated.plan, ['clave-unica'])
  assert.equal(migrated.games.detectives?.completed, true)
  assert.deepEqual(migrated.lessons, {})
  assert.deepEqual(migrated.startedLessons, {})
  assert.equal(migrated.activeRoute, null)
})

test('migrar un estado corrupto devuelve el estado vacío sin romper', () => {
  assert.deepEqual(migrateLearningState(null), EMPTY_STATE)
  assert.deepEqual(migrateLearningState(undefined), EMPTY_STATE)
})

test('abrir y completar una lección no duplica el registro', () => {
  const [route] = ROUTES
  const lesson = route.lessons[0]

  const started = startRouteLesson(EMPTY_STATE, lesson.id, 100)
  assert.equal(started.startedLessons[lesson.id], 100)
  assert.equal(lessonStatus(started, lesson), 'en-progreso')

  const first = completeRouteLesson(started, {
    lessonId: lesson.id,
    routeId: route.id,
    gameId: lesson.gameId,
  }, 200)
  assert.equal(first.isNew, true)
  assert.equal(first.state.lessons[lesson.id]?.completedAt, 200)
  assert.equal(lessonStatus(first.state, lesson), 'completada')

  const second = completeRouteLesson(first.state, {
    lessonId: lesson.id,
    routeId: route.id,
    gameId: lesson.gameId,
  }, 300)
  assert.equal(second.isNew, false)
  assert.equal(second.state.lessons[lesson.id]?.completedAt, 200)
})

test('cambiar de ruta activa no borra el progreso', () => {
  const state = setActiveRoute(EMPTY_STATE, 'whatsapp')
  assert.equal(state.activeRoute, 'whatsapp')
  assert.equal(activeRoute(state).id, 'whatsapp')
  assert.equal(state.games.detectives, undefined)
})
