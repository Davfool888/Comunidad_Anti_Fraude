import { useState } from 'react'
import { CATEGORIES, LESSONS, type EducationCategory } from '../../../data/education'
import { BADGES, lessonsOfCategory } from '../../../lib/educationProgress'
import { useEducation } from './educationContext'
import { EducationLessonView } from './EducationLesson'
import { educationIcons, educationUi } from './educationIcons'

/**
 * **Centro Educativo Interactivo**.
 *
 * Portada con el encabezado, el panel de progreso y las tarjetas de
 * categoría; desde ahí se entra al detalle de una categoría y a la lección.
 */

type Screen = { type: 'inicio' } | { type: 'categoria'; id: string } | { type: 'leccion'; id: string }

export function EducationCenter() {
  const [screen, setScreen] = useState<Screen>({ type: 'inicio' })
  const { summary, reset } = useEducation()

  const lesson = screen.type === 'leccion' ? LESSONS.find((item) => item.id === screen.id) : undefined
  const category = screen.type === 'categoria' ? CATEGORIES.find((item) => item.id === screen.id) : undefined

  if (lesson) {
    const index = LESSONS.findIndex((item) => item.id === lesson.id)
    const next = LESSONS[index + 1]
    return (
      <EducationLessonView
        lesson={lesson}
        onExit={() => setScreen({ type: 'inicio' })}
        onNextLesson={next ? () => setScreen({ type: 'leccion', id: next.id }) : undefined}
      />
    )
  }

  if (category) {
    const lessons = lessonsOfCategory(category.id)
    return (
      <CategoryView
        category={category}
        lessons={lessons}
        onBack={() => setScreen({ type: 'inicio' })}
        onOpenLesson={(id) => setScreen({ type: 'leccion', id })}
      />
    )
  }

  return (
    <HomeView
      onOpenCategory={(id) => setScreen({ type: 'categoria', id })}
      onOpenLesson={(id) => setScreen({ type: 'leccion', id })}
      onReset={reset}
      summary={summary}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Portada                                                             */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'info',
}: {
  label: string
  value: string
  hint?: string
  icon: React.ReactNode
  tone?: 'info' | 'good' | 'warn'
}) {
  const toneClass =
    tone === 'good'
      ? 'text-[#1d7a53] bg-[#eefbf3] ring-[#bfe3d1]'
      : tone === 'warn'
        ? 'text-[#b06f13] bg-[#fff8e8] ring-[#f4d9a8]'
        : 'text-[#2f4b86] bg-[#eef4ff] ring-[#dbe6f7]'

  return (
    <div className={`rounded-2xl p-3.5 ring-1 ${toneClass}`}>
      <span className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.12em] uppercase">
        {icon}
        {label}
      </span>
      <p className="mt-1.5 text-[22px] leading-none font-extrabold">{value}</p>
      {hint && <p className="mt-1 text-[10px] font-semibold opacity-80">{hint}</p>}
    </div>
  )
}

function HomeView({
  onOpenCategory,
  onOpenLesson,
  onReset,
  summary,
}: {
  onOpenCategory: (id: string) => void
  onOpenLesson: (id: string) => void
  onReset: () => void
  summary: ReturnType<typeof useEducation>['summary']
}) {
  const { progress } = useEducation()
  const firstLesson = LESSONS[0]

  return (
    <div className="space-y-8">
      {/* encabezado */}
      <header className="overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[#eaf2ff] via-[#f2eeff] to-[#e9fbf5] p-6 shadow-[0_30px_64px_-34px_rgba(25,45,95,.55)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[560px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[10px] font-extrabold tracking-[0.14em] text-[#4a628f] uppercase ring-1 ring-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2fb87c]" />
              Centro Educativo Interactivo
            </span>
            <h2 className="mt-3 text-[30px] leading-[1.1] font-extrabold tracking-tight text-[#1d2f57] sm:text-[36px]">
              Aprende a protegerte
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed font-medium text-[#4a628f]">
              Reconoce las señales de alerta, aprende cómo operan los fraudes digitales y descubre cómo
              proteger tu información y tu dinero.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenLesson(firstLesson.id)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-5 py-3 text-[13px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5"
              >
                {summary.started ? 'Continuar donde lo dejaste' : 'Comenzar el primer reto'}
                {educationUi.arrow}
              </button>
              <p className="text-[11px] font-semibold text-[#6b81ad]">
                {LESSONS.length} lecciones · {CATEGORIES.length} categorías · sin registro
              </p>
            </div>
          </div>

          {/* ilustración */}
          <div className="hidden shrink-0 lg:block">
            <div className="relative grid h-[168px] w-[220px] place-items-center">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#5b7cf5]/25 to-[#9b6ef0]/25 blur-xl" />
              <div className="relative grid h-[124px] w-[124px] place-items-center rounded-[30px] bg-white/80 shadow-[0_18px_40px_-20px_rgba(30,55,130,.8)] ring-1 ring-white">
                <span className="text-[#5b7cf5]">{educationIcons.shield}</span>
              </div>
              <div className="absolute top-2 right-3 grid h-11 w-11 place-items-center rounded-2xl bg-white/90 text-[#e9a13b] shadow-[0_10px_24px_-14px_rgba(30,55,130,.9)]">
                {educationIcons.bulb}
              </div>
              <div className="absolute bottom-1 left-1 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[#2fb87c] shadow-[0_10px_24px_-14px_rgba(30,55,130,.9)]">
                {educationIcons.check}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* panel de progreso */}
      <section aria-labelledby="centro-progreso">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">
              Tu progreso
            </p>
            <h3 id="centro-progreso" className="mt-1 text-[20px] leading-tight font-extrabold text-[#1d2f57]">
              {summary.started ? `Nivel ${summary.level.name}` : 'Empieza tu primer reto'}
            </h3>
            <p className="mt-0.5 text-[12px] font-medium text-[#6b81ad]">
              {summary.started
                ? summary.level.description
                : 'Aquí verás las lecciones completadas, los retos resueltos y tu nivel.'}
            </p>
          </div>
          {summary.started && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-full bg-white px-3 py-1.5 text-[10.5px] font-bold text-[#8aa0c4] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#fff0f3] hover:text-[#e23b5f]"
            >
              Reiniciar mi progreso
            </button>
          )}
        </div>

        {summary.started ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Lecciones completadas"
              value={`${summary.lessons}/${summary.totalLessons}`}
              icon={educationIcons.book}
              tone="info"
            />
            <StatCard
              label="Retos resueltos"
              value={`${summary.answered}`}
              hint={`${summary.correct} correctos`}
              icon={educationIcons.target}
              tone="good"
            />
            <StatCard
              label="Precisión"
              value={`${summary.accuracy}%`}
              icon={educationUi.check}
              tone={summary.accuracy >= 70 ? 'good' : 'warn'}
            />
            <StatCard
              label="Racha de aprendizaje"
              value={`${summary.streak} ${summary.streak === 1 ? 'día' : 'días'}`}
              icon={educationUi.flame}
              tone="warn"
            />
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#c9dbf6] bg-white/60 p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#eef4ff] text-[#5b7cf5]">
              {educationUi.target}
            </span>
            <p className="mt-3 text-[13px] font-extrabold text-[#243d6b]">
              Todavía no hay progreso guardado
            </p>
            <p className="mx-auto mt-1.5 max-w-[440px] text-[12px] leading-relaxed font-medium text-[#8aa0c4]">
              Resuelve tu primera actividad y aquí verás tus lessons completadas, tu precisión y tu nivel.
              Puedes usar el centro como invitado: el progreso se guarda en este navegador.
            </p>
            <button
              type="button"
              onClick={() => onOpenLesson(firstLesson.id)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-4 py-2.5 text-[12.5px] font-bold text-white shadow-[0_12px_26px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5"
            >
              Empezar
              {educationUi.arrow}
            </button>
          </div>
        )}

        {/* nivel y puntos */}
        {summary.started && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-[#dbe6f7] bg-white/70 p-4">
            <div className="min-w-[180px] flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-extrabold text-[#3d568e]">
                  {summary.points} puntos · {summary.level.name}
                </p>
                {summary.next && (
                  <p className="text-[10.5px] font-semibold text-[#8aa0c4]">
                    faltan {summary.next.missing} para {summary.next.level.name}
                  </p>
                )}
              </div>
              <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#eef4ff]">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] transition-all duration-500"
                  style={{
                    width: `${summary.next ? Math.min(100, (summary.points / summary.next.level.min) * 100) : 100}%`,
                  }}
                />
              </span>
            </div>

            {progress.badges.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {progress.badges.map((id) => {
                  const badge = BADGES.find((item) => item.id === id)
                  if (!badge) return null
                  return (
                    <li
                      key={id}
                      title={badge.description}
                      className="rounded-full bg-[#eefbf3] px-2.5 py-1 text-[10px] font-extrabold text-[#1d7a53] ring-1 ring-[#bfe3d1]"
                    >
                      {badge.label}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* categorías */}
      <section aria-labelledby="centro-categorias">
        <div className="mb-3">
          <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">
            Explora las categorías
          </p>
          <h3 id="centro-categorias" className="mt-1 text-[20px] leading-tight font-extrabold text-[#1d2f57]">
            Ocho formas de fraude digital
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              progress={summary.byCategory[category.id] ?? 0}
              onOpen={() => onOpenCategory(category.id)}
            />
          ))}
        </div>
      </section>

      {/* lecciones iniciales */}
      <section aria-labelledby="centro-lecciones">
        <div className="mb-3">
          <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">
            Lecciones
          </p>
          <h3 id="centro-lecciones" className="mt-1 text-[20px] leading-tight font-extrabold text-[#1d2f57]">
            Empieza por aquí
          </h3>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {LESSONS.map((item) => {
            const done = progress.lessons[item.id]
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onOpenLesson(item.id)}
                  className="flex h-full w-full flex-col rounded-2xl border border-[#dbe6f7] bg-white/70 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_36px_-24px_rgba(30,55,130,.9)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9.5px] font-extrabold tracking-[0.12em] text-[#8aa0c4] uppercase">
                        {CATEGORIES.find((item2) => item2.id === item.categoryId)?.title}
                      </p>
                      <p className="mt-1 text-[13.5px] leading-snug font-extrabold text-[#243d6b]">
                        {item.title}
                      </p>
                    </div>
                    {done && (
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e8f7ef] text-[#1d7a53]">
                        {educationUi.check}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed font-medium text-[#8aa0c4]">
                    {item.objective}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-[10.5px] font-bold text-[#8aa0c4]">
                    <span className="flex items-center gap-1">
                      {educationUi.clock}
                      {item.minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      {educationUi.target}
                      {item.activities.length} actividades
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <p className="text-center text-[11px] leading-relaxed font-medium text-[#8aa0c4]">
        Todo el material es ficticio y está pensado para entrenar. Ninguna actividad sustituye el
        criterio propio ni el reporte oficial ante las autoridades.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tarjeta de categoría                                                */
/* ------------------------------------------------------------------ */

function CategoryCard({
  category,
  progress,
  onOpen,
}: {
  category: EducationCategory
  progress: number
  onOpen: () => void
}) {
  const done = progress >= 1
  const lessons = lessonsOfCategory(category.id)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col rounded-[22px] border border-white/70 bg-white/70 p-4 text-left shadow-[0_18px_40px_-28px_rgba(25,45,95,.6)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_26px_50px_-26px_rgba(25,45,95,.7)]"
    >
      <span
        className="grid h-11 w-11 place-items-center rounded-[14px] text-white shadow-[0_8px_18px_-10px_rgba(30,55,130,.9)]"
        style={{ background: category.color }}
      >
        {educationIcons[category.icon] ?? educationIcons.book}
      </span>

      <h4 className="mt-3 text-[13px] leading-snug font-extrabold text-[#243d6b]">{category.title}</h4>
      <p className="mt-1.5 line-clamp-3 flex-1 text-[11px] leading-relaxed font-medium text-[#8aa0c4]">
        {category.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9.5px] font-extrabold text-[#4a628f]">
          {category.difficulty}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9.5px] font-extrabold text-[#4a628f]">
          {educationUi.clock}
          {category.minutes} min
        </span>
        {done && (
          <span className="rounded-full bg-[#eefbf3] px-2 py-0.5 text-[9.5px] font-extrabold text-[#1d7a53]">
            Completada
          </span>
        )}
      </div>

      {lessons.length > 0 ? (
        <div className="mt-3">
          <span className="block h-1 overflow-hidden rounded-full bg-[#eef4ff]">
            <span
              className="block h-full rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%`, background: category.color }}
            />
          </span>
          <p className="mt-1.5 text-[10px] font-semibold text-[#8aa0c4]">
            {lessons.length} {lessons.length === 1 ? 'lección' : 'lecciones'} ·{' '}
            {Math.round(progress * 100)}% completado
          </p>
        </div>
      ) : (
        <p className="mt-3 text-[10px] font-semibold text-[#8aa0c4]">
          Próximamente · puedes explorar las demás categorías
        </p>
      )}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Detalle de una categoría                                            */
/* ------------------------------------------------------------------ */

function CategoryView({
  category,
  lessons,
  onBack,
  onOpenLesson,
}: {
  category: EducationCategory
  lessons: ReturnType<typeof lessonsOfCategory>
  onBack: () => void
  onOpenLesson: (id: string) => void
}) {
  const { progress } = useEducation()

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#6b81ad] transition-colors duration-200 hover:text-[#1d3f77]"
      >
        {educationUi.back}
        Volver al centro
      </button>

      <header className="flex flex-col gap-4 rounded-[26px] border border-white/70 bg-white/70 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] text-white shadow-[0_10px_22px_-12px_rgba(30,55,130,.9)]"
            style={{ background: category.color }}
          >
            {educationIcons[category.icon] ?? educationIcons.book}
          </span>
          <div>
            <h3 className="text-[21px] leading-tight font-extrabold text-[#1d2f57]">{category.title}</h3>
            <p className="mt-1 max-w-[520px] text-[12.5px] leading-relaxed font-medium text-[#6b81ad]">
              {category.description}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[10px] font-extrabold text-[#4a628f]">
                {category.difficulty}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-[#eef4ff] px-2.5 py-1 text-[10px] font-extrabold text-[#4a628f]">
                {educationUi.clock}
                {category.minutes} min
              </span>
            </div>
          </div>
        </div>
      </header>

      {lessons.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#c9dbf6] bg-white/60 p-8 text-center">
          <p className="text-[13px] font-extrabold text-[#243d6b]">
            Estamos preparando las lecciones de esta categoría
          </p>
          <p className="mx-auto mt-1.5 max-w-[440px] text-[12px] leading-relaxed font-medium text-[#8aa0c4]">
            Mientras tanto puedes explores las otras categorías: todas tienen actividades listas para
            practicar.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {lessons.map((lesson) => {
            const done = progress.lessons[lesson.id]
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => onOpenLesson(lesson.id)}
                  className="flex h-full w-full flex-col rounded-2xl border border-[#dbe6f7] bg-white/70 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13.5px] leading-snug font-extrabold text-[#243d6b]">
                      {lesson.title}
                    </p>
                    {done && (
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e8f7ef] text-[#1d7a53]">
                        {educationUi.check}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 flex-1 text-[11.5px] leading-relaxed font-medium text-[#8aa0c4]">
                    {lesson.objective}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-[10.5px] font-bold text-[#8aa0c4]">
                    <span className="flex items-center gap-1">
                      {educationUi.clock}
                      {lesson.minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      {educationUi.target}
                      {lesson.activities.length} actividades
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
