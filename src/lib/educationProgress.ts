import { CATEGORIES, LESSONS } from '../data/education'

/**
 * Progreso del usuario en el **Centro Educativo Interactivo**.
 *
 * El proyecto no tiene backend, así que el progreso se guarda en
 * `localStorage`. Toda la persistencia vive detrás de una interfaz pequeña
 * (`EducationStore`) para que mañana se pueda sustituir por llamadas a un
 * backend sin tocar la interfaz.
 */

const STORAGE_KEY = 'escudo.centro-educativo.v1'

/** Progreso de una actividad ya resuelta. */
export type ActivityProgress = {
  /** ¿Se resolvió correctamente? */
  correct: boolean
  /** Puntos ganados. */
  points: number
  /** Veces que se respondió. */
  attempts: number
}

/** Estado completo del progreso. */
export type EducationProgress = {
  version: number
  /** Actividades resueltas, por id. */
  activities: Record<string, ActivityProgress>
  /** Lecciones completadas, por id. */
  lessons: Record<string, { completedAt: number; points: number; correct: number; total: number }>
  /** Puntos acumulados. */
  points: number
  /** Días consecutivos con actividad. */
  streak: number
  /** Última actividad registrada (para la racha). */
  lastActivity: number | null
  /** Insignias conseguidas. */
  badges: string[]
}

export const EMPTY_PROGRESS: EducationProgress = {
  version: 1,
  activities: {},
  lessons: {},
  points: 0,
  streak: 0,
  lastActivity: null,
  badges: [],
}

/* ------------------------------------------------------------------ */
/* Persistencia                                                        */
/* ------------------------------------------------------------------ */

/**
 * Interfaz de persistencia. Hoy la implementa `localStorage`; mañana puede
 * implementarse con el backend sin tocar el resto del código.
 */
export type EducationStore = {
  load: () => EducationProgress
  save: (progress: EducationProgress) => void
  clear: () => void
}

/** Implementación con `localStorage` (con respaldo en memoria si no existe). */
export const localStorageStore: EducationStore = {
  load: () => {
    if (typeof window === 'undefined') return EMPTY_PROGRESS
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return EMPTY_PROGRESS
      const parsed = JSON.parse(raw) as Partial<EducationProgress>
      if (!parsed || typeof parsed !== 'object') return EMPTY_PROGRESS
      return {
        ...EMPTY_PROGRESS,
        ...parsed,
        activities: parsed.activities ?? {},
        lessons: parsed.lessons ?? {},
        badges: parsed.badges ?? [],
      }
    } catch {
      return EMPTY_PROGRESS
    }
  },
  save: (progress) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
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

/* ------------------------------------------------------------------ */
/* Niveles, insignias y racha                                          */
/* ------------------------------------------------------------------ */

const DAY = 86_400_000

/** Calcula la racha de días consecutivos con actividad. */
export function computeStreak(lastActivity: number | null, now = Date.now()) {
  if (!lastActivity) return 1
  const startOf = (value: number) => {
    const date = new Date(value)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  }
  const days = Math.round((startOf(now) - startOf(lastActivity)) / DAY)
  if (days <= 0) return 1
  if (days === 1) return 2
  return 1
}

/** Nivel educativo según los puntos acumulados. */
export type EducationLevel = {
  name: string
  min: number
  description: string
}

export const LEVELS: EducationLevel[] = [
  { name: 'Aprendiz', min: 0, description: 'Estás empezando a reconocer las señales.' },
  { name: 'Vigilante', min: 120, description: 'Ya distingues mensajes sospechosos de los normales.' },
  { name: 'Analista', min: 300, description: 'Verificas antes de responder, casi siempre.' },
  { name: 'Experto', min: 560, description: 'Tu criterio es una referencia para el barrio.' },
  { name: 'Guardián de la red', min: 900, description: 'Proteges a tu comunidad con lo que aprendes.' },
]

/** Nivel actual según los puntos. */
export function levelFor(points: number) {
  return [...LEVELS].reverse().find((level) => points >= level.min) ?? LEVELS[0]
}

/** Siguiente nivel y cuántos puntos faltan. */
export function nextLevel(points: number) {
  const index = LEVELS.findIndex((level) => level.name === levelFor(points).name)
  const next = LEVELS[index + 1]
  if (!next) return null
  return { level: next, missing: next.min - points }
}

/** Insignia que se puede conseguir. */
export type EducationBadge = {
  id: string
  label: string
  description: string
  /** Categoría que hay que completar (si aplica). */
  categoryId?: string
  /** Regla especial. */
  rule?: 'primer-reto' | 'racha'
}

/** Catálogo de insignias. */
export const BADGES: EducationBadge[] = [
  {
    id: 'primer-reto',
    label: 'Primer paso',
    description: 'Resolviste tu primera actividad del centro.',
    rule: 'primer-reto',
  },
  {
    id: 'racha-3',
    label: 'Tres días seguidos',
    description: 'Practicaste durante tres días consecutivos.',
    rule: 'racha',
  },
  ...CATEGORIES.map((category) => ({
    id: `dominio-${category.id}`,
    label: `Dominio: ${category.title}`,
    description: `Completaste todas las lecciones de ${category.title}.`,
    categoryId: category.id,
  })),
]

/* ------------------------------------------------------------------ */
/* Operaciones                                                         */
/* ------------------------------------------------------------------ */

/** Resultado de resolver una actividad. */
export type ActivityResult = {
  activityId: string
  correct: boolean
  points: number
}

/**
 * Calcula el progreso nuevo a partir del actual y el resultado de una
 * actividad. Devuelve el progreso y las insignias nuevas conseguidas.
 */
export function applyActivity(
  progress: EducationProgress,
  result: ActivityResult,
  now = Date.now(),
): { progress: EducationProgress; newBadges: string[] } {
  const previous = progress.activities[result.activityId]
  const attempts = (previous?.attempts ?? 0) + 1
  // Los puntos no se suman dos veces: una actividad ya resuelta conserva lo
  // ganado y sólo improves si el resultado es mejor.
  const points = previous ? Math.max(previous.points, result.points) : result.points
  const correct = previous?.correct ? true : result.correct

  const streak = previous ? progress.streak : computeStreak(progress.lastActivity, now)
  const badges = [...progress.badges]
  const newBadges: string[] = []

  const grant = (id: string) => {
    if (badges.includes(id)) return
    badges.push(id)
    newBadges.push(id)
  }

  if (!previous) {
    grant('primer-reto')
    if (streak >= 3) grant('racha-3')
  }

  return {
    progress: {
      ...progress,
      activities: {
        ...progress.activities,
        [result.activityId]: { correct, points, attempts },
      },
      points: progress.points + (previous ? Math.max(0, points - previous.points) : points),
      streak,
      lastActivity: now,
      badges,
    },
    newBadges,
  }
}

/** Marca una lección como completada. */
export function applyLesson(
  progress: EducationProgress,
  lesson: { id: string; categoryId: string; points: number; correct: number; total: number },
  now = Date.now(),
) {
  const done = progress.lessons[lesson.id]
  const lessons = {
    ...progress.lessons,
    [lesson.id]: {
      completedAt: done?.completedAt ?? now,
      points: Math.max(done?.points ?? 0, lesson.points),
      correct: Math.max(done?.correct ?? 0, lesson.correct),
      total: lesson.total,
    },
  }

  const badges = [...progress.badges]
  const newBadges: string[] = []
  const categoryLessons = LESSONS.filter((item) => item.categoryId === lesson.categoryId)
  if (categoryLessons.every((item) => lessons[item.id])) {
    const id = `dominio-${lesson.categoryId}`
    if (!badges.includes(id)) {
      badges.push(id)
      newBadges.push(id)
    }
  }

  return { progress: { ...progress, lessons, badges }, newBadges }
}

/** Lecciones de una categoría. */
export function lessonsOfCategory(categoryId: string) {
  return LESSONS.filter((lesson) => lesson.categoryId === categoryId)
}

/* ------------------------------------------------------------------ */
/* Estadísticas de la interfaz                                         */
/* ------------------------------------------------------------------ */

/** Resumen del progreso para el panel de la portada. */
export type ProgressSummary = {
  /** Lecciones completadas. */
  lessons: number
  /** Total de lecciones disponibles. */
  totalLessons: number
  /** Actividades resueltas correctamente. */
  correct: number
  /** Actividades intentadas. */
  answered: number
  /** Precisión en porcentaje (0 si no hay respuestas). */
  accuracy: number
  /** Días consecutivos con actividad. */
  streak: number
  /** Puntos acumulados. */
  points: number
  /** Nivel actual. */
  level: EducationLevel
  /** Siguiente nivel, si existe. */
  next: { level: EducationLevel; missing: number } | null
  /** ¿Ha iniciado alguna actividad? */
  started: boolean
  /** Progreso por categoría (0 – 1). */
  byCategory: Record<string, number>
}

export function summarize(progress: EducationProgress): ProgressSummary {
  const activities = Object.values(progress.activities)
  const correct = activities.filter((item) => item.correct).length
  const answered = activities.length
  const level = levelFor(progress.points)

  const byCategory: Record<string, number> = {}
  CATEGORIES.forEach((category) => {
    const lessons = lessonsOfCategory(category.id)
    const done = lessons.filter((lesson) => progress.lessons[lesson.id]).length
    byCategory[category.id] = lessons.length ? done / lessons.length : 0
  })

  return {
    lessons: Object.keys(progress.lessons).length,
    totalLessons: LESSONS.length,
    correct,
    answered,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    streak: progress.streak,
    points: progress.points,
    level,
    next: nextLevel(progress.points),
    started: answered > 0,
    byCategory,
  }
}
