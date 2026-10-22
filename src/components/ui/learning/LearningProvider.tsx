import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  applyPlan,
  applyResult,
  completeRouteLesson,
  EMPTY_STATE,
  type GameStore,
  localGameStore,
  type LearningState,
  setActiveRoute,
  startRouteLesson,
  summarizeLearning,
} from '../../../lib/learning/progress'
import type { GameResult } from '../../../lib/learning/engine'
import { GAMES } from '../../../data/learning'
import { LearningContext, type LearningContextValue } from './learningContext'

/**
 * Proveedor del progreso del Centro de aprendizaje: comparte el progreso de
 * los juegos y lo persiste. El `store` es inyectable para poder sustituirlo
 * por un backend.
 */
export function LearningProvider({
  children,
  store = localGameStore,
}: {
  children: ReactNode
  store?: GameStore
}) {
  const [state, setState] = useState<LearningState>(() => store.load())

  useEffect(() => {
    store.save(state)
  }, [state, store])

  const finishGame = useCallback((result: GameResult, gameId: string) => {
    let earned: string[] = []
    setState((current) => {
      const { state: next, newBadges } = applyResult(current, result, gameId)
      earned = newBadges
      return next
    })
    return earned
  }, [])

  const savePlan = useCallback((plan: string[]) => {
    setState((current) => applyPlan(current, plan))
  }, [])

  const markLesson = useCallback((lessonId: string, routeId: string, gameId: string) => {
    setState((current) => completeRouteLesson(current, { lessonId, routeId, gameId }).state)
  }, [])

  const startLesson = useCallback((lessonId: string) => {
    setState((current) => startRouteLesson(current, lessonId))
  }, [])

  const startRoute = useCallback((routeId: string | null) => {
    setState((current) => setActiveRoute(current, routeId))
  }, [])

  const reset = useCallback(() => {
    store.clear()
    setState(EMPTY_STATE)
  }, [store])

  const value = useMemo<LearningContextValue>(
    () => ({
      state,
      summary: summarizeLearning(state, GAMES.length),
      finishGame,
      savePlan,
      markLesson,
      startLesson,
      startRoute,
      reset,
    }),
    [state, finishGame, savePlan, markLesson, startLesson, startRoute, reset],
  )

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>
}
