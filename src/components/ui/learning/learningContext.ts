import { createContext, useContext } from 'react'
import type { GameResult } from '../../../lib/learning/engine'
import type { LearningState, LearningSummary } from '../../../lib/learning/progress'

/**
 * Contexto del Centro de aprendizaje.
 *
 * Vive en su propio archivo para que el proveedor (`LearningProvider.tsx`)
 * solo exporte componentes y no rompa el aviso de fast-refresh.
 */

export type LearningContextValue = {
  state: LearningState
  summary: LearningSummary
  /** Registra el resultado de una partida. */
  finishGame: (result: GameResult, gameId: string) => string[]
  /** Guarda el plan de proteccion elegido. */
  savePlan: (plan: string[]) => void
  /** Marca una lección de ruta como completada. */
  markLesson: (lessonId: string, routeId: string, gameId: string) => void
  /** Marca una lección de ruta como abierta. */
  startLesson: (lessonId: string) => void
  /** Recuerda la ruta que el usuario está siguiendo. */
  startRoute: (routeId: string | null) => void
  /** Reinicia todo el progreso. */
  reset: () => void
}

export const LearningContext = createContext<LearningContextValue | null>(null)

export function useLearning() {
  const context = useContext(LearningContext)
  if (!context) throw new Error('useLearning debe usarse dentro de LearningProvider')
  return context
}
