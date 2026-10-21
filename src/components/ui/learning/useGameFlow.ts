import { useState } from 'react'

/**
 * Flujo de diapositivas compartido por todos los juegos.
 *
 * La secuencia es siempre la misma:
 * **introducción → escenario → interacción → retroalimentación → cierre**.
 *
 * Volver a una diapositiva anterior **no reinicia la partida**: las respuestas
 * viven en el estado del juego, así que el usuario puede revisar el
 * escenario sin perder lo que ya respondió.
 */

export type FlowStep = 'intro' | 'scenario' | 'challenge' | 'feedback' | 'summary'

/** A dónde lleva el botón «Atrás» en cada diapositiva. */
const PREVIOUS: Record<FlowStep, FlowStep> = {
  intro: 'intro',
  scenario: 'intro',
  challenge: 'scenario',
  feedback: 'challenge',
  summary: 'summary',
}

/** Estado del recorrido. */
export function useGameFlow() {
  const [step, setStep] = useState<FlowStep>('intro')

  return {
    step,
    go: (next: FlowStep) => setStep(next),
    back: () => setStep((current) => PREVIOUS[current]),
    reset: () => setStep('intro'),
  }
}
