import type { CardQuestion, Verdict } from '../../data/learning/types.ts'
import { scoreOption, type AnswerScore } from './engine.ts'

/**
 * Lógica determinista de **Anatomía de una tarjeta**.
 *
 * La evaluación no vive en el JSX: recibe la pregunta y los campos marcados y
 * devuelve un veredicto compatible con el motor común. No se guarda ni se
 * envía ningún dato de tarjeta: solo se usan identificadores de campos.
 */

/** Respuesta ya puntuada de una pregunta. */
export type CardAttempt = {
  questionId: string
  selectedFieldIds: string[]
  classificationId: string | null
  insufficientSelected: boolean
  verdict: Verdict
  points: number
}

/** Resultado de evaluar una pregunta de la tarjeta. */
export type CardEvaluation = {
  verdict: Verdict
  score: AnswerScore
  correctFieldIds: string[]
}

/** Puntúa un veredicto con las reglas del motor común. */
function scoreVerdict(question: CardQuestion, verdict: Verdict): AnswerScore {
  return scoreOption({
    id: question.id,
    label: question.prompt,
    verdict,
    explanation: question.generalExplanation,
  })
}

function evaluation(question: CardQuestion, verdict: Verdict): CardEvaluation {
  return {
    verdict,
    score: scoreVerdict(question, verdict),
    correctFieldIds: question.correctFieldIds,
  }
}

/**
 * Evalúa una respuesta.
 *
 * Reglas:
 *  · conjunto exacto de campos correctos → `correct`;
 *  · al menos un campo correcto, pero falta alguno o sobra un distractor → `partial`;
 *  · ningún acierto → `incorrect`;
 *  · «no hay información suficiente» → `insufficient` (nunca `incorrect`).
 */
export function evaluateCardQuestion(
  question: CardQuestion,
  selectedFieldIds: string[],
  classificationId: string | null = null,
  insufficientSelected = false,
): CardEvaluation {
  const selected = [...new Set(selectedFieldIds)]
  const correct = new Set(question.correctFieldIds)

  if (question.allowInsufficient && insufficientSelected) {
    return evaluation(question, question.correctVerdict ?? 'insufficient')
  }

  // Si la respuesta esperada es reconocer que falta información, marcar
  // cualquier campo de la tarjeta no responde a la pregunta.
  if (question.allowInsufficient && question.correctVerdict === 'insufficient') {
    return evaluation(question, 'incorrect')
  }

  if (question.interactionType === 'classify' && question.classify) {
    if (selected.length !== 1) {
      return evaluation(question, selected.some((id) => correct.has(id)) ? 'partial' : 'incorrect')
    }
    if (selected[0] !== question.classify.targetFieldId) {
      return evaluation(question, 'incorrect')
    }
    if (classificationId !== question.classify.correctClassificationId) {
      return evaluation(question, 'partial')
    }
    return evaluation(question, 'correct')
  }

  if (question.interactionType === 'single') {
    if (selected.length !== 1) {
      return evaluation(question, selected.some((id) => correct.has(id)) ? 'partial' : 'incorrect')
    }
    return evaluation(question, correct.has(selected[0]) ? 'correct' : 'incorrect')
  }

  if (selected.length === 0) return evaluation(question, 'incorrect')

  const hits = selected.filter((id) => correct.has(id)).length
  const wrong = selected.filter((id) => !correct.has(id)).length
  const exact = hits === correct.size && wrong === 0

  if (exact) return evaluation(question, 'correct')
  if (hits > 0) return evaluation(question, 'partial')
  return evaluation(question, 'incorrect')
}

/**
 * Registra un intento una sola vez por pregunta. Si la pregunta ya estaba
 * puntuada, devuelve el mismo mapa y `recorded: false`. Así, volver atrás o
 * pulsar de nuevo «Comprobar» no suma puntos ilimitados.
 */
export function recordCardAttempt(
  attempts: Record<string, CardAttempt>,
  attempt: CardAttempt,
): { attempts: Record<string, CardAttempt>; recorded: boolean } {
  if (attempts[attempt.questionId]) {
    return { attempts, recorded: false }
  }
  return {
    attempts: { ...attempts, [attempt.questionId]: attempt },
    recorded: true,
  }
}
