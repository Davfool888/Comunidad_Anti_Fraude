import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GAME_BY_ID } from '../../data/learning/index.ts'
import { ROUTES } from '../../data/learning/routes.ts'
import {
  CARD_FIELDS,
  CARD_GAME_ID,
  CARD_QUESTIONS,
} from '../../data/learning/games/cardAnatomy.ts'
import { GameScorer } from './engine.ts'
import { applyResult, EMPTY_STATE } from './progress.ts'
import {
  evaluateCardQuestion,
  recordCardAttempt,
  type CardAttempt,
} from './cardAnatomy.ts'

/** Pruebas deterministas del juego «Anatomía de una tarjeta». */

const fieldIds = new Set(CARD_FIELDS.map((field) => field.id))

test('el juego está registrado en el catálogo y en la ruta de credenciales', () => {
  const game = GAME_BY_ID[CARD_GAME_ID]
  assert.ok(game)
  assert.equal(game.title, 'Anatomía de una tarjeta')
  assert.equal(game.total, CARD_QUESTIONS.length)

  const route = ROUTES.find((item) => item.id === 'credenciales')
  assert.ok(route)
  assert.ok(route.lessons.some((lesson) => lesson.gameId === CARD_GAME_ID))
})

test('los datos de las preguntas son coherentes y usan campos existentes', () => {
  const questionIds = new Set<string>()

  for (const question of CARD_QUESTIONS) {
    assert.ok(!questionIds.has(question.id), `ID repetido: ${question.id}`)
    questionIds.add(question.id)

    assert.ok(question.maxSelections >= 1)
    assert.ok(question.expectedSelections >= 0)
    assert.ok(question.expectedSelections <= question.maxSelections)

    for (const id of question.correctFieldIds) {
      assert.ok(fieldIds.has(id), `Campo correcto inexistente: ${id}`)
    }
    for (const id of question.distractorFieldIds) {
      assert.ok(fieldIds.has(id), `Distractor inexistente: ${id}`)
    }
    for (const id of Object.keys(question.fieldExplanations)) {
      assert.ok(fieldIds.has(id), `Explicación de campo inexistente: ${id}`)
    }

    assert.equal(
      question.expectedSelections,
      question.correctFieldIds.length,
      `La pregunta ${question.id} debe indicar cuántos campos espera`,
    )

    if (question.interactionType === 'classify') {
      assert.ok(question.classify)
      assert.ok(fieldIds.has(question.classify.targetFieldId))
      assert.ok(
        question.classify.options.some(
          (option) => option.id === question.classify?.correctClassificationId,
        ),
      )
    }
  }

  assert.equal(CARD_QUESTIONS.length, 6)
})

test('una selección exacta es correcta y una parcial no se confunde con un fallo', () => {
  const question = CARD_QUESTIONS[0]

  const exact = evaluateCardQuestion(question, question.correctFieldIds)
  assert.equal(exact.verdict, 'correct')
  assert.equal(exact.score.points, 100)

  const partial = evaluateCardQuestion(question, [question.correctFieldIds[0], 'issuer'])
  assert.equal(partial.verdict, 'partial')
  assert.equal(partial.score.points, 50)

  const incorrect = evaluateCardQuestion(question, ['issuer'])
  assert.equal(incorrect.verdict, 'incorrect')
  assert.equal(incorrect.score.points, 0)
})

test('identificar un dato concreto distingue el acierto del distractor', () => {
  const question = CARD_QUESTIONS[1]
  assert.equal(evaluateCardQuestion(question, ['expiration_date']).verdict, 'correct')
  assert.equal(evaluateCardQuestion(question, ['security_code']).verdict, 'incorrect')
})

test('la clasificación puntúa el campo y la categoría', () => {
  const question = CARD_QUESTIONS[4]
  assert.equal(
    evaluateCardQuestion(question, ['security_code'], 'secreto').verdict,
    'correct',
  )
  assert.equal(
    evaluateCardQuestion(question, ['security_code'], 'identificativa').verdict,
    'partial',
  )
  assert.equal(
    evaluateCardQuestion(question, ['cardholder_name'], 'secreto').verdict,
    'incorrect',
  )
})

test('reconocer información insuficiente no se cuenta como respuesta incorrecta', () => {
  const question = CARD_QUESTIONS[5]
  const insufficient = evaluateCardQuestion(question, [], null, true)
  assert.equal(insufficient.verdict, 'insufficient')
  assert.equal(insufficient.score.points, 50)

  const wrongField = evaluateCardQuestion(question, ['card_number'], null, false)
  assert.equal(wrongField.verdict, 'incorrect')

  const scorer = new GameScorer(CARD_GAME_ID, 1)
  scorer.add(question.categoryId, question.id, insufficient.score)
  const result = scorer.finish()
  assert.equal(result.incorrect, 0)
  assert.equal(result.insufficient, 1)
  assert.equal(result.partial, 1)
  assert.equal(result.score, 50)
})

test('un intento ya registrado no se vuelve a puntuar', () => {
  const attempt: CardAttempt = {
    questionId: CARD_QUESTIONS[0].id,
    selectedFieldIds: CARD_QUESTIONS[0].correctFieldIds,
    classificationId: null,
    insufficientSelected: false,
    verdict: 'correct',
    points: 100,
  }

  const first = recordCardAttempt({}, attempt)
  assert.equal(first.recorded, true)
  assert.equal(first.attempts[attempt.questionId].points, 100)

  const second = recordCardAttempt(first.attempts, { ...attempt, points: 50 })
  assert.equal(second.recorded, false)
  assert.equal(second.attempts[attempt.questionId].points, 100)
})

test('completar el juego desbloquea su insignia y repetir no duplica puntos', () => {
  const result = {
    gameId: CARD_GAME_ID,
    score: 550,
    correct: 5,
    partial: 1,
    insufficient: 1,
    incorrect: 0,
    answered: 6,
    total: 6,
    byCategory: { credenciales: { correct: 4, total: 5 } },
    review: [],
    weakest: [],
  }

  const first = applyResult(EMPTY_STATE, result, CARD_GAME_ID)
  assert.equal(first.state.points, 550)
  assert.ok(first.state.badges.includes('datos-protegidos'))
  assert.equal(first.state.games[CARD_GAME_ID].best, 550)

  const replay = applyResult(
    first.state,
    { ...result, score: 0, correct: 0, partial: 0, insufficient: 0 },
    CARD_GAME_ID,
  )
  assert.equal(replay.state.points, 550)
  assert.equal(replay.state.games[CARD_GAME_ID].best, 550)
  assert.equal(replay.state.games[CARD_GAME_ID].completed, true)
})
