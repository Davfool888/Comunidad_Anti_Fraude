import { useMemo } from 'react'
import { ROUTES } from '../../../data/learning/routes'
import { levelFor, nextLevel } from '../../../lib/educationProgress'
import {
  activeRoute,
  overallRoutes,
  recommendedLesson,
  routeStats,
} from '../../../lib/learning/routes'
import { useEducation } from '../education/educationContext'
import { useLearning } from './learningContext'

/**
 * Lectura **unificada** del progreso de las dos experiencias educativas.
 *
 * Los datos siguen viviendo en sus dos almacenes originales
 * (`escudo.centro-aprendizaje.v1` y `escudo.centro-educativo.v1`) para no
 * perder nada: aquí sólo se leen juntos. Así la portada puede mostrar un XP y
 * un nivel global sin reiniciar ni duplicar recompensas.
 */
export function useUnifiedProgress() {
  const learning = useLearning()
  const education = useEducation()

  const gamesXp = learning.state.points
  const lessonsXp = education.summary.points
  const xp = gamesXp + lessonsXp

  const routes = useMemo(
    () => ROUTES.map((route) => ({ route, stats: routeStats(learning.state, route) })),
    [learning.state],
  )

  return useMemo(() => {
    const currentRoute = activeRoute(learning.state)
    return {
      state: learning.state,
      learningSummary: learning.summary,
      educationSummary: education.summary,
      educationProgress: education.progress,
      xp,
      gamesXp,
      lessonsXp,
      level: levelFor(xp),
      nextLevel: nextLevel(xp),
      streak: education.summary.streak,
      routes,
      overall: overallRoutes(learning.state),
      currentRoute,
      nextLesson: recommendedLesson(learning.state),
    }
  }, [learning.state, learning.summary, education.summary, education.progress, xp, gamesXp, lessonsXp, routes])
}
