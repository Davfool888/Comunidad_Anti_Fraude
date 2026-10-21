import { useMemo, useState } from 'react'
import type { EducationLesson } from '../../../data/education'
import { useEducation } from './educationContext'
import { ActivityView } from './EducationActivities'
import { educationUi } from './educationIcons'

/**
 * Flujo de una lección:
 * objetivo → explicación → ejemplo → actividades → recomendaciones → resumen.
 */
export function EducationLessonView({
  lesson,
  onExit,
  onNextLesson,
}: {
  lesson: EducationLesson
  onExit: () => void
  onNextLesson?: () => void
}) {
  const { resolveActivity, completeLesson } = useEducation()
  const [step, setStep] = useState(0)
  const [points, setPoints] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [badges, setBadges] = useState<string[]>([])

  const total = lesson.activities.length
  const isIntro = step === 0
  const isSummary = step > total
  const activity = isIntro || isSummary ? null : lesson.activities[step - 1]

  const progress = useMemo(() => {
    if (isIntro) return 0
    if (isSummary) return 100
    return Math.round(((step - 1) / total) * 100)
  }, [step, total, isIntro, isSummary])

  /** Termina la lección y guarda el progreso. */
  const finish = () => {
    const earned = completeLesson({
      id: lesson.id,
      categoryId: lesson.categoryId,
      points,
      correct,
      total,
    })
    setBadges(earned)
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/70 shadow-[0_34px_70px_-32px_rgba(25,45,95,.55)] backdrop-blur-xl">
      {/* cabecera de la lección */}
      <header className="border-b border-[#dbe6f7] bg-gradient-to-r from-[#eef4ff] to-[#f7f0ff] px-5 py-4 sm:px-7">
        <button
          type="button"
          onClick={onExit}
          className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6b81ad] transition-colors duration-200 hover:text-[#1d3f77]"
        >
          {educationUi.back}
          Volver al centro
        </button>

        <h3 className="text-[20px] leading-tight font-extrabold text-[#1d2f57]">{lesson.title}</h3>

        {/* progreso de la lección */}
        <div className="mt-3 flex items-center gap-3">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/80">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </span>
          <span className="text-[10.5px] font-bold text-[#6b81ad]">
            {isIntro ? 'Introducción' : isSummary ? 'Resumen' : `Actividad ${step} de ${total}`}
          </span>
        </div>
      </header>

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        {isIntro && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#dbe6f7] bg-[#f7faff] p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.14em] text-[#5b7cf5] uppercase">
                {educationUi.target}
                Objetivo de aprendizaje
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed font-medium text-[#2c4478]">
                {lesson.objective}
              </p>
            </div>

            <div className="space-y-3">
              {lesson.intro.map((paragraph) => (
                <p key={paragraph} className="text-[13.5px] leading-relaxed text-[#3d568e]">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* ejemplo práctico */}
            <div className="rounded-2xl border border-[#f4d9a8] bg-[#fffaf0] p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.14em] text-[#b06f13] uppercase">
                {educationUi.bulb}
                {lesson.example.title}
              </p>
              <p className="mt-2 rounded-xl bg-white/80 p-3.5 text-[12.5px] leading-relaxed text-[#3d568e]">
                {lesson.example.text}
              </p>
              {lesson.example.note && (
                <p className="mt-2 text-[11px] leading-relaxed font-semibold text-[#a4762c]">
                  {lesson.example.note}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-5 py-3 text-[13px] font-bold text-white shadow-[0_12px_26px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5"
            >
              Comenzar las actividades
              {educationUi.arrow}
            </button>
          </div>
        )}

        {activity && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
                Actividad
              </p>
              <h4 className="mt-1 text-[16px] leading-tight font-extrabold text-[#1d2f57]">
                {activity.prompt}
              </h4>
              {activity.context && (
                <p className="mt-1.5 rounded-xl bg-[#f4f8ff] px-3.5 py-2.5 text-[12.5px] leading-relaxed font-medium text-[#5d76a6]">
                  {activity.context}
                </p>
              )}
            </div>

            <ActivityView
              key={activity.id}
              activity={activity}
              onDone={(isCorrect, earned) => {
                setPoints((current) => current + earned)
                if (isCorrect) setCorrect((current) => current + 1)
                const earnedBadges = resolveActivity({
                  activityId: activity.id,
                  correct: isCorrect,
                  points: earned,
                })
                if (earnedBadges.length) setBadges((current) => [...new Set([...current, ...earnedBadges])])
              }}
            />

            <div className="flex flex-wrap items-center gap-3 border-t border-[#dbe6f7] pt-4">
              <button
                type="button"
                onClick={() => {
                  if (step === total) {
                    finish()
                    setStep(total + 1)
                  } else {
                    setStep((current) => current + 1)
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_12px_26px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5"
              >
                {step === total ? 'Ver el resumen' : 'Siguiente actividad'}
                {educationUi.arrow}
              </button>
              <span className="text-[11px] font-semibold text-[#8aa0c4]">
                {points} puntos · {correct} de {step - 1} correctas
              </span>
            </div>
          </div>
        )}

        {isSummary && (
          <div className="space-y-5">
            {/* resultado del reto */}
            <div className="rounded-2xl border border-[#bfe3d1] bg-[#eefbf3] p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.14em] text-[#1d7a53] uppercase">
                {educationUi.check}
                Resultado del reto
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed font-semibold text-[#245c44]">
                {correct} de {total} actividades correctas · {points} puntos en esta lección.
              </p>
              {badges.length > 0 && (
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {badges.map((badge) => (
                    <li
                      key={badge}
                      className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#1d7a53] ring-1 ring-[#bfe3d1]"
                    >
                      {badge}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* recomendaciones */}
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
                {educationUi.shield}
                Recomendaciones para la vida real
              </p>
              <ul className="mt-2 space-y-2">
                {lesson.recommendations.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 rounded-xl border border-[#dbe6f7] bg-white/80 px-3.5 py-2.5 text-[12.5px] leading-relaxed font-medium text-[#3d568e]"
                  >
                    <span className="mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#e8f7ef] text-[9px] font-black text-[#1d7a53]">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* resumen */}
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
                {educationUi.book}
                Resumen de lo aprendido
              </p>
              <ul className="mt-2 space-y-1.5">
                {lesson.summary.map((item) => (
                  <li key={item} className="flex gap-2 text-[12.5px] leading-relaxed text-[#3d568e]">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#5b7cf5]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* fuentes */}
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#7a90b8] uppercase">
                Fuentes para verificar
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {lesson.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#4a628f] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
                    >
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-[#dbe6f7] pt-4">
              <button
                type="button"
                onClick={onExit}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
              >
                Volver al centro
              </button>
              {onNextLesson && (
                <button
                  type="button"
                  onClick={onNextLesson}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_12px_26px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5"
                >
                  Siguiente lección
                  {educationUi.arrow}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
