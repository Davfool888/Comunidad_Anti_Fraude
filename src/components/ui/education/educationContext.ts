import { createContext, useContext } from 'react'
import type {
  ActivityResult,
  EducationProgress,
  ProgressSummary,
} from '../../../lib/educationProgress'

/**
 * Contexto compartido del Centro Educativo.
 *
 * Vive en su propio archivo para que el proveedor (`EducationProvider.tsx`)
 * sólo exporte componentes y el aviso de fast-refresh no aparezca.
 */

export type EducationContextValue = {
  progress: EducationProgress
  summary: ProgressSummary
  /** Registra el resultado de una actividad y devuelve las insignias nuevas. */
  resolveActivity: (result: ActivityResult) => string[]
  /** Marca una lección como completada y devuelve las insignias nuevas. */
  completeLesson: (lesson: {
    id: string
    categoryId: string
    points: number
    correct: number
    total: number
  }) => string[]
  /** Reinicia el progreso del usuario. */
  reset: () => void
}

export const EducationContext = createContext<EducationContextValue | null>(null)

/** Acceso al progreso del centro educativo. */
export function useEducation() {
  const context = useContext(EducationContext)
  if (!context) throw new Error('useEducation debe usarse dentro de EducationProvider')
  return context
}
