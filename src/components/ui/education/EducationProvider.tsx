import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  applyActivity,
  applyLesson,
  type ActivityResult,
  type EducationProgress,
  type EducationStore,
  localStorageStore,
  summarize,
} from '../../../lib/educationProgress'
import { EducationContext, type EducationContextValue } from './educationContext'

/**
 * Proveedor del progreso del Centro Educativo.
 *
 * El `store` es inyectable: hoy es `localStorage`, mañana puede ser un
 * cliente de backend sin cambiar nada de la interfaz.
 */
export function EducationProvider({
  children,
  store = localStorageStore,
}: {
  children: ReactNode
  store?: EducationStore
}) {
  const [progress, setProgress] = useState<EducationProgress>(() => store.load())

  // se guarda cada cambio
  useEffect(() => {
    store.save(progress)
  }, [progress, store])

  const resolveActivity = useCallback((result: ActivityResult) => {
    let earned: string[] = []
    setProgress((current) => {
      const { progress: next, newBadges } = applyActivity(current, result)
      earned = newBadges
      return next
    })
    return earned
  }, [])

  const completeLesson = useCallback(
    (lesson: {
      id: string
      categoryId: string
      points: number
      correct: number
      total: number
    }) => {
      let earned: string[] = []
      setProgress((current) => {
        const { progress: next, newBadges } = applyLesson(current, lesson)
        earned = newBadges
        return next
      })
      return earned
    },
    [],
  )

  const reset = useCallback(() => {
    store.clear()
    setProgress(store.load())
  }, [store])

  const value = useMemo<EducationContextValue>(
    () => ({
      progress,
      summary: summarize(progress),
      resolveActivity,
      completeLesson,
      reset,
    }),
    [progress, resolveActivity, completeLesson, reset],
  )

  return <EducationContext.Provider value={value}>{children}</EducationContext.Provider>
}
