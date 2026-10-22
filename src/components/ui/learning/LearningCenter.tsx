import { Suspense, lazy, useState } from 'react'
import { GAME_BY_ID, GAMES } from '../../../data/learning'
import { ROUTES, type LearningRoute, type RouteLesson } from '../../../data/learning/routes'
import { GAME_BADGES } from '../../../lib/learning/engine'
import { BADGES as EDUCATION_BADGES } from '../../../lib/educationProgress'
import { routeStats } from '../../../lib/learning/routes'
import { EducationCenter } from '../education/EducationCenter'
import { GameErrorBoundary } from './GameErrorBoundary'
import { useLearning } from './learningContext'
import { LearningPath } from './LearningPath'
import { learningIcons } from './learningIcons'
import { useUnifiedProgress } from './useUnifiedProgress'

/**
 * Centro de aprendizaje con experiencia gamificada.
 *
 * Cinco experiencias: **Inicio** (camino de la ruta activa), **Explorar
 * rutas** (catálogo de tipos de fraude), **Actividades** (catálogo de juegos),
 * **Mi progreso** y **Lecciones** (el centro educativo de siempre). Las
 * lecciones reutilizan los juegos existentes: no se duplica contenido ni se
 * reinicia el progreso.
 *
 * Cada juego se carga en diferido para que el material educativo no entre en
 * el paquete inicial.
 */

const DetectivesGame = lazy(() =>
  import('./games/DetectivesGame').then((module) => ({ default: module.DetectivesGame })),
)
const StoryGame = lazy(() =>
  import('./games/StoryGame').then((module) => ({ default: module.StoryGame })),
)
const DifferencesGame = lazy(() =>
  import('./games/DifferencesGame').then((module) => ({ default: module.DifferencesGame })),
)
const LabGame = lazy(() =>
  import('./games/LabGame').then((module) => ({ default: module.LabGame })),
)
const QuizGame = lazy(() =>
  import('./games/QuizGame').then((module) => ({ default: module.QuizGame })),
)
const AccountGame = lazy(() =>
  import('./games/AccountGame').then((module) => ({ default: module.AccountGame })),
)
const PlanGame = lazy(() =>
  import('./games/PlanGame').then((module) => ({ default: module.PlanGame })),
)
const CardAnatomyGame = lazy(() =>
  import('./games/CardAnatomyGame').then((module) => ({ default: module.CardAnatomyGame })),
)

type Tab = 'inicio' | 'explorar' | 'actividades' | 'progreso' | 'lecciones'

type Screen =
  | { type: 'inicio' }
  | { type: 'explorar' }
  | { type: 'actividades' }
  | { type: 'ruta'; id: string }
  | { type: 'progreso' }
  | { type: 'lecciones' }
  | {
      type: 'juego'
      id: string
      routeId?: string
      lessonId?: string
    }

export function LearningCenter() {
  const [screen, setScreen] = useState<Screen>({ type: 'inicio' })
  const { state, startRoute, startLesson, markLesson } = useLearning()
  const unified = useUnifiedProgress()

  const openTab = (tab: Tab) => setScreen({ type: tab })

  const openRoute = (route: LearningRoute) => {
    startRoute(route.id)
    setScreen({ type: 'ruta', id: route.id })
  }

  const openLesson = (route: LearningRoute, lesson: RouteLesson) => {
    startRoute(route.id)
    startLesson(lesson.id)
    setScreen({ type: 'juego', id: lesson.gameId, routeId: route.id, lessonId: lesson.id })
  }

  const openGame = (gameId: string) => setScreen({ type: 'juego', id: gameId })

  if (screen.type === 'juego') {
    const exit = () => {
      // Si el juego quedó completado, la lección de la ruta queda aprendida.
      if (screen.lessonId && screen.routeId && state.games[screen.id]?.completed) {
        markLesson(screen.lessonId, screen.routeId, screen.id)
      }
      setScreen(screen.routeId ? { type: 'ruta', id: screen.routeId } : { type: 'inicio' })
    }

    return (
      <GameErrorBoundary onExit={exit}>
        <Suspense
          fallback={
            <div
              role="status"
              aria-live="polite"
              className="grid min-h-[320px] place-items-center rounded-[28px] border border-white/70 bg-white/60 text-[12px] font-semibold text-[#8aa0c4]"
            >
              Cargando la lección…
            </div>
          }
        >
          <GameRouter gameId={screen.id} onExit={exit} />
        </Suspense>
      </GameErrorBoundary>
    )
  }

  const activeTab: Tab =
    screen.type === 'inicio'
      ? 'inicio'
      : screen.type === 'explorar' || screen.type === 'ruta'
        ? 'explorar'
        : screen.type === 'actividades'
          ? 'actividades'
          : screen.type === 'progreso'
            ? 'progreso'
            : 'lecciones'

  return (
    <div className="space-y-7">
      <TabBar active={activeTab} onTab={openTab} />

      {screen.type === 'inicio' && (
        <HomeView
          unified={unified}
          onOpenLesson={openLesson}
          onOpenRoute={openRoute}
          onOpenGame={openGame}
          onExplore={() => setScreen({ type: 'explorar' })}
          onActivities={() => setScreen({ type: 'actividades' })}
          onProgress={() => setScreen({ type: 'progreso' })}
        />
      )}

      {screen.type === 'explorar' && (
        <ExploreView
          unified={unified}
          onOpenRoute={openRoute}
        />
      )}

      {screen.type === 'actividades' && (
        <ActivitiesView unified={unified} onOpenGame={openGame} />
      )}

      {screen.type === 'ruta' && (
        <RouteView
          route={ROUTES.find((route) => route.id === screen.id) ?? ROUTES[0]}
          unified={unified}
          onBack={() => setScreen({ type: 'explorar' })}
          onOpenLesson={openLesson}
        />
      )}

      {screen.type === 'progreso' && (
        <ProgressView
          unified={unified}
          onOpenLesson={openLesson}
          onOpenGame={openGame}
          onExplore={() => setScreen({ type: 'explorar' })}
          onLessons={() => setScreen({ type: 'lecciones' })}
        />
      )}

      {screen.type === 'lecciones' && (
        <div className="space-y-5">
          <header className="rounded-[26px] border border-white/70 bg-white/70 p-5 backdrop-blur-xl sm:p-6">
            <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">
              Lecciones del centro educativo
            </p>
            <h2 className="mt-1 text-[24px] leading-tight font-extrabold text-[#1d2f57]">
              Aprende el detalle, paso a paso
            </h2>
            <p className="mt-1.5 max-w-[680px] text-[12.5px] leading-relaxed font-medium text-[#6b81ad]">
              Estas lecciones explican cómo funciona cada fraude y proponen retos
              breves. Comparten el mismo centro, pero guardan su propio progreso
              para no mezclar puntos de actividades distintas.
            </p>
          </header>
          <EducationCenter />
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Navegación                                                          */
/* ------------------------------------------------------------------ */

function TabBar({ active, onTab }: { active: Tab; onTab: (tab: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'explorar', label: 'Explorar rutas' },
    { id: 'actividades', label: 'Actividades' },
    { id: 'progreso', label: 'Mi progreso' },
    { id: 'lecciones', label: 'Lecciones' },
  ]

  return (
    <nav
      aria-label="Secciones del centro de aprendizaje"
      className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/70 bg-white/60 p-1.5 backdrop-blur-xl"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTab(tab.id)}
          aria-current={active === tab.id ? 'page' : undefined}
          className={`rounded-xl px-3.5 py-2 text-[12px] font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5] ${
            active === tab.id
              ? 'bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] text-white shadow-[0_10px_22px_-14px_rgba(80,90,220,.95)]'
              : 'text-[#5d76a6] hover:bg-white hover:text-[#1d3f77]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/* Inicio                                                              */
/* ------------------------------------------------------------------ */

function HomeView({
  unified,
  onOpenLesson,
  onOpenRoute,
  onOpenGame,
  onExplore,
  onActivities,
  onProgress,
}: {
  unified: ReturnType<typeof useUnifiedProgress>
  onOpenLesson: (route: LearningRoute, lesson: RouteLesson) => void
  onOpenRoute: (route: LearningRoute) => void
  onOpenGame: (gameId: string) => void
  onExplore: () => void
  onActivities: () => void
  onProgress: () => void
}) {
  const { state, currentRoute, nextLesson, overall, xp, gamesXp, lessonsXp, level, nextLevel, streak } =
    unified
  const pathRoute = nextLesson?.route ?? currentRoute
  const pathStats = routeStats(state, pathRoute)
  const recommendedId =
    nextLesson?.route.id === pathRoute.id ? nextLesson.lesson.id : undefined
  const otherRoutes = unified.routes.filter((item) => item.route.id !== pathRoute.id).slice(0, 4)

  return (
    <div className="space-y-7">
      {/* bienvenida */}
      <header className="relative overflow-hidden rounded-[30px] border border-white/70 bg-gradient-to-br from-[#eaf2ff] via-[#f2eeff] to-[#e9fbf5] p-6 shadow-[0_30px_64px_-34px_rgba(25,45,95,.55)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 max-w-[640px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[10px] font-extrabold tracking-[0.14em] text-[#4a628f] uppercase ring-1 ring-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2fb87c]" />
              Tu ruta para aprender a detectar fraudes
            </span>

            <h2 className="mt-3 text-[30px] leading-[1.08] font-extrabold tracking-tight text-[#1d2f57] sm:text-[38px]">
              ¡Continúa aprendiendo!
            </h2>
            <p className="mt-2.5 max-w-[520px] text-[13.5px] leading-relaxed font-medium text-[#4a628f]">
              {nextLesson
                ? 'Vas por buen camino. Completa otra lección breve para fortalecer tu criterio.'
                : 'Ya recorriste todas las rutas. Puedes repasar cualquier lección cuando quieras.'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-extrabold text-[#2f4b86] ring-1 ring-white">
                {xp} XP
              </span>
              <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-extrabold text-[#2f4b86] ring-1 ring-white">
                Nivel · {level.name}
              </span>
              <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-extrabold text-[#2f4b86] ring-1 ring-white">
                Racha de lecciones · {streak} {streak === 1 ? 'día' : 'días'}
              </span>
              <span className="rounded-full bg-white/85 px-3 py-1 text-[11px] font-extrabold text-[#2f4b86] ring-1 ring-white">
                {overall.lessonsDone}/{overall.totalLessons} lecciones
              </span>
            </div>

            {/* progreso de la ruta activa */}
            <div className="mt-5 max-w-[520px] rounded-2xl bg-white/75 p-3.5 ring-1 ring-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-extrabold text-[#3d568e]">
                  {pathRoute.title}
                </p>
                <p className="text-[10.5px] font-bold text-[#8aa0c4]">
                  {pathStats.done} de {pathStats.total} lecciones
                </p>
              </div>
              <ProgressBar value={pathStats.percent} className="mt-2" />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() =>
                  nextLesson
                    ? onOpenLesson(nextLesson.route, nextLesson.lesson)
                    : onOpenRoute(pathRoute)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-4 py-3 text-[12.5px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5] motion-reduce:transition-none"
              >
                {nextLesson ? `Continuar: ${nextLesson.lesson.title}` : 'Repasar mi ruta'}
                <ArrowIcon />
              </button>
              <button
                type="button"
                onClick={onExplore}
                className="rounded-xl bg-white/85 px-4 py-3 text-[12px] font-bold text-[#4a628f] ring-1 ring-white transition-colors duration-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5]"
              >
                Explorar rutas
              </button>
            </div>
          </div>

          {/* mascota / ilustración */}
          <div className="hidden shrink-0 lg:block" aria-hidden="true">
            <div className="relative grid h-[196px] w-[248px] place-items-center">
              <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-[#5b7cf5]/25 to-[#9b6ef0]/25 blur-xl" />
              <div className="relative grid h-[148px] w-[148px] place-items-center rounded-[36px] bg-white/85 text-[#5b7cf5] shadow-[0_22px_46px_-22px_rgba(30,55,130,.85)] ring-1 ring-white [&_svg]:h-16 [&_svg]:w-16">
                {learningIcons.shield}
              </div>
              <div className="absolute top-2 right-2 grid h-12 w-12 place-items-center rounded-2xl bg-white/95 text-[#e9a13b] shadow-[0_10px_24px_-14px_rgba(30,55,130,.9)] [&_svg]:h-6 [&_svg]:w-6">
                {learningIcons.bulb}
              </div>
              <div className="absolute bottom-2 left-1 grid h-12 w-12 place-items-center rounded-2xl bg-white/95 text-[#2fb87c] shadow-[0_10px_24px_-14px_rgba(30,55,130,.9)] [&_svg]:h-6 [&_svg]:w-6">
                {learningIcons.target}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* indicadores */}
      <section aria-label="Indicadores de tu progreso" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="XP total"
          value={`${xp}`}
          hint={`${gamesXp} de juegos · ${lessonsXp} de lecciones`}
          tone="warn"
        />
        <StatTile
          label="Nivel"
          value={level.name}
          hint={nextLevel ? `${nextLevel.missing} XP para ${nextLevel.level.name}` : 'Nivel máximo'}
          tone="info"
        />
        <StatTile
          label="Lecciones de ruta"
          value={`${overall.lessonsDone}/${overall.totalLessons}`}
          hint={`${overall.percent}% del camino`}
          tone="good"
        />
        <StatTile
          label="Rutas completadas"
          value={`${overall.routesDone}/${overall.totalRoutes}`}
          hint={`${overall.routesStarted} iniciadas`}
          tone="info"
        />
      </section>

      {/* camino */}
      <section aria-labelledby="centro-camino">
        <SectionHeading
          id="centro-camino"
          eyebrow="Tu camino de aprendizaje"
          title={pathRoute.title}
          description={pathRoute.summary}
          action={
            <button
              type="button"
              onClick={() => onOpenRoute(pathRoute)}
              className="rounded-full bg-white px-3.5 py-1.5 text-[10.5px] font-extrabold text-[#5b7cf5] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
            >
              Ver ruta completa
            </button>
          }
        />
        <LearningPath
          route={pathRoute}
          state={state}
          recommendedId={recommendedId}
          onOpenLesson={(lesson) => onOpenLesson(pathRoute, lesson)}
        />
      </section>

      {/* otras rutas */}
      <section aria-labelledby="centro-otras-rutas">
        <SectionHeading
          id="centro-otras-rutas"
          eyebrow="Explora otras rutas"
          title="Elige el fraude que quieres estudiar"
          description="Puedes cambiar de ruta cuando quieras: el progreso de cada una se conserva."
          action={
            <button
              type="button"
              onClick={onExplore}
              className="rounded-full bg-white px-3.5 py-1.5 text-[10.5px] font-extrabold text-[#5b7cf5] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
            >
              Ver las diez rutas
            </button>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {otherRoutes.map(({ route, stats }) => (
            <MiniRouteCard key={route.id} route={route} stats={stats} onOpen={() => onOpenRoute(route)} />
          ))}
        </div>
      </section>

      {/* acceso a progreso e insignias */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef4ff] text-[#5b7cf5]">
            {learningIcons.target}
          </span>
          <div>
            <p className="text-[12.5px] font-extrabold text-[#243d6b]">
              Insignias y estadísticas
            </p>
            <p className="text-[11px] font-medium text-[#8aa0c4]">
              Revisa lo que ya practicaste y qué conviene repasar.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onProgress}
            className="rounded-xl bg-[#eef4ff] px-3.5 py-2 text-[11.5px] font-bold text-[#2f4b86] transition-colors duration-200 hover:bg-[#5b7cf5] hover:text-white"
          >
            Ver mi progreso
          </button>
          <button
            type="button"
            onClick={() => onOpenGame('anatomia-tarjeta')}
            className="rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
          >
            Anatomía de una tarjeta
          </button>
          <button
            type="button"
            onClick={onActivities}
            className="rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-[#5d76a6] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#eef4ff]"
          >
            Ver todas las actividades
          </button>
        </div>
      </section>

      <p className="text-center text-[11px] leading-relaxed font-medium text-[#8aa0c4]">
        Todo el material es ficticio y educativo. Las insignias premian la práctica y no
        garantizan que puedas identificar todos los fraudes.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Explorar rutas                                                      */
/* ------------------------------------------------------------------ */

function ExploreView({
  unified,
  onOpenRoute,
}: {
  unified: ReturnType<typeof useUnifiedProgress>
  onOpenRoute: (route: LearningRoute) => void
}) {
  return (
    <div className="space-y-6">
      <header className="rounded-[28px] border border-white/70 bg-gradient-to-br from-[#eef4ff] via-[#f6f1ff] to-[#eefbf3] p-6 shadow-[0_26px_56px_-36px_rgba(25,45,95,.55)] sm:p-7">
        <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">
          Explorar rutas
        </p>
        <h2 className="mt-1 text-[27px] leading-tight font-extrabold text-[#1d2f57]">
          ¿Qué tipo de fraude quieres aprender?
        </h2>
        <p className="mt-2 max-w-[700px] text-[13px] leading-relaxed font-medium text-[#5d76a6]">
          Cada ruta dura entre 15 y 25 minutos y combina explicaciones breves con
          los juegos de siempre. No hay rutas bloqueadas: empieza por la que más
          te preocupe.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/85 px-3 py-1 text-[10.5px] font-extrabold text-[#2f4b86] ring-1 ring-white">
            {unified.overall.routesDone}/{unified.overall.totalRoutes} rutas completadas
          </span>
          <span className="rounded-full bg-white/85 px-3 py-1 text-[10.5px] font-extrabold text-[#2f4b86] ring-1 ring-white">
            {unified.overall.lessonsDone}/{unified.overall.totalLessons} lecciones
          </span>
          <span className="rounded-full bg-white/85 px-3 py-1 text-[10.5px] font-extrabold text-[#2f4b86] ring-1 ring-white">
            {unified.educationSummary.totalLessons} lecciones del centro educativo
          </span>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {unified.routes.map(({ route, stats }) => (
          <RouteCard key={route.id} route={route} stats={stats} onOpen={() => onOpenRoute(route)} />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Catálogo de actividades                                             */
/* ------------------------------------------------------------------ */

function ActivitiesView({
  unified,
  onOpenGame,
}: {
  unified: ReturnType<typeof useUnifiedProgress>
  onOpenGame: (gameId: string) => void
}) {
  const { state } = unified
  const completed = GAMES.filter((game) => state.games[game.id]?.completed).length

  return (
    <div className="space-y-6">
      <header className="rounded-[28px] border border-white/70 bg-gradient-to-br from-[#eef4ff] via-[#f6f1ff] to-[#eefbf3] p-6 shadow-[0_26px_56px_-36px_rgba(25,45,95,.55)] sm:p-7">
        <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">
          Catálogo de actividades
        </p>
        <h2 className="mt-1 text-[27px] leading-tight font-extrabold text-[#1d2f57]">
          Practica una habilidad concreta
        </h2>
        <p className="mt-2 max-w-[720px] text-[13px] leading-relaxed font-medium text-[#5d76a6]">
          Las actividades son independientes de las rutas: puedes abrirlas en el
          orden que quieras. Cada una guarda su mejor puntuación y no vuelve a
          sumar los mismos puntos al repetirla.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/85 px-3 py-1 text-[10.5px] font-extrabold text-[#2f4b86] ring-1 ring-white">
            {completed}/{GAMES.length} completadas
          </span>
          <span className="rounded-full bg-white/85 px-3 py-1 text-[10.5px] font-extrabold text-[#2f4b86] ring-1 ring-white">
            {GAMES.length} actividades disponibles
          </span>
        </div>
      </header>

      <section aria-labelledby="catalogo-actividades">
        <SectionHeading
          id="catalogo-actividades"
          eyebrow="Todas las actividades"
          title="Elige por dónde seguir"
          description="Incluye la nueva actividad «Anatomía de una tarjeta», con una tarjeta ficticia que se explora campo a campo."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => {
            const progress = state.games[game.id]
            const answered = Math.min(progress?.answered ?? 0, game.total)
            const percent = game.total ? answered / game.total : 0
            const status = progress?.completed
              ? 'Completada'
              : answered > 0
                ? 'En curso'
                : 'Disponible'

            return (
              <article
                key={game.id}
                className="flex flex-col rounded-[24px] border border-white/70 bg-white/75 p-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-28px_rgba(25,45,95,.55)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-[0_12px_24px_-16px_rgba(30,55,130,.9)] [&_svg]:h-5 [&_svg]:w-5"
                    style={{ background: game.color }}
                  >
                    {learningIcons[game.icon] ?? learningIcons.book}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase ${
                      status === 'Completada'
                        ? 'bg-[#eefbf3] text-[#1d7a53]'
                        : status === 'En curso'
                          ? 'bg-[#fff8e8] text-[#b06f13]'
                          : 'bg-[#eef4ff] text-[#4a628f]'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <h3 className="mt-3 text-[14.5px] leading-snug font-extrabold text-[#243d6b]">
                  {game.title}
                </h3>
                <p className="mt-1 flex-1 text-[11px] leading-relaxed font-medium text-[#7b90b8]">
                  {game.summary}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9px] font-extrabold text-[#4a628f]">
                    {game.difficulty}
                  </span>
                  <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9px] font-extrabold text-[#4a628f]">
                    {game.minutes} min
                  </span>
                  <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9px] font-extrabold text-[#4a628f]">
                    {game.total} pasos
                  </span>
                  {game.simulated && (
                    <span className="rounded-full bg-[#fff4e2] px-2 py-0.5 text-[9px] font-extrabold text-[#b06f13]">
                      Simulación
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between gap-2 text-[9.5px] font-bold text-[#8aa0c4]">
                    <span>{answered} de {game.total}</span>
                    <span>{progress?.completed ? 'Completada' : 'Progreso'}</span>
                  </div>
                  <ProgressBar value={percent} className="mt-1.5" />
                </div>

                <button
                  type="button"
                  onClick={() => onOpenGame(game.id)}
                  className="mt-3 rounded-xl bg-[#eef4ff] px-3 py-2 text-[11px] font-extrabold text-[#2f4b86] transition-colors duration-200 hover:bg-[#5b7cf5] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5]"
                >
                  {progress?.completed ? 'Repasar actividad' : answered > 0 ? 'Continuar' : 'Abrir actividad'}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <p className="rounded-2xl border border-[#dbe6f7] bg-white/60 p-4 text-[11.5px] leading-relaxed font-medium text-[#7b90b8]">
        Las actividades no piden información personal ni datos de pago reales. El
        progreso guarda identificadores, puntos y contadores; nunca el contenido
        de la tarjeta.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Detalle de una ruta                                                 */
/* ------------------------------------------------------------------ */

function RouteView({
  route,
  unified,
  onBack,
  onOpenLesson,
}: {
  route: LearningRoute
  unified: ReturnType<typeof useUnifiedProgress>
  onBack: () => void
  onOpenLesson: (route: LearningRoute, lesson: RouteLesson) => void
}) {
  const stats = routeStats(unified.state, route)
  const nextLesson = stats.next
  const totalMinutes = route.lessons.reduce((total, lesson) => total + lesson.minutes, 0)

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#6b81ad] transition-colors duration-200 hover:text-[#1d3f77]"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path d="M10.8 5.6 12.2 7l-4 4H20v2H8.2l4 4-1.4 1.4L4.2 12l6.6-6.4Z" />
        </svg>
        Volver a explorar rutas
      </button>

      <header className="overflow-hidden rounded-[28px] border border-white/70 bg-white/75 p-6 backdrop-blur-xl sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-[0_14px_28px_-16px_rgba(30,55,130,.9)] [&_svg]:h-7 [&_svg]:w-7"
            style={{ background: route.color }}
          >
            {learningIcons[route.icon] ?? learningIcons.book}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-[9.5px] font-extrabold text-[#4a628f]">
                {route.difficulty}
              </span>
              <span className="rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-[9.5px] font-extrabold text-[#4a628f]">
                {route.lessons.length} lecciones
              </span>
              <span className="rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-[9.5px] font-extrabold text-[#4a628f]">
                {totalMinutes} min
              </span>
              <StatusPill stats={stats} />
            </div>
            <h2 className="mt-2 text-[25px] leading-tight font-extrabold text-[#1d2f57]">
              {route.title}
            </h2>
            <p className="mt-1.5 max-w-[680px] text-[12.5px] leading-relaxed font-medium text-[#6b81ad]">
              {route.summary}
            </p>

            <div className="mt-4 max-w-[520px]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10.5px] font-extrabold text-[#3d568e]">
                  {stats.done} de {stats.total} lecciones completadas
                </p>
                <p className="text-[10px] font-bold text-[#8aa0c4]">
                  {Math.round(stats.percent * 100)}%
                </p>
              </div>
              <ProgressBar value={stats.percent} className="mt-1.5" />
            </div>

            {nextLesson && (
              <button
                type="button"
                onClick={() => onOpenLesson(route, nextLesson)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5 motion-reduce:transition-none"
              >
                {stats.started ? 'Continuar la ruta' : 'Empezar la ruta'}
                <ArrowIcon />
              </button>
            )}
          </div>
        </div>
      </header>

      {stats.completed && (
        <div className="rounded-2xl border border-[#bfe3d1] bg-[#eefbf3] p-4">
          <p className="text-[12.5px] font-extrabold text-[#1d7a53]">Ruta completada</p>
          <p className="mt-1 text-[11.5px] font-medium text-[#3f7a62]">
            Puedes repasar cualquier lección. Repetirla no vuelve a sumar los mismos
            puntos: el progreso se conserva.
          </p>
        </div>
      )}

      <section aria-labelledby="ruta-camino">
        <SectionHeading
          id="ruta-camino"
          eyebrow="Camino de la ruta"
          title="Lecciones, una por una"
          description="Puedes recorrerlas en orden o abrir directamente la que necesites."
        />
        <LearningPath
          route={route}
          state={unified.state}
          recommendedId={nextLesson?.id}
          onOpenLesson={(lesson) => onOpenLesson(route, lesson)}
        />
      </section>

      <p className="rounded-2xl border border-[#dbe6f7] bg-white/60 p-4 text-[11.5px] leading-relaxed font-medium text-[#7b90b8]">
        Las lecciones reutilizan los juegos del centro. Una misma actividad puede
        aparecer en varias rutas porque practica la misma habilidad; no se duplica el
        contenido ni se reinician los puntos.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Mi progreso                                                         */
/* ------------------------------------------------------------------ */

function ProgressView({
  unified,
  onOpenLesson,
  onOpenGame,
  onExplore,
  onLessons,
}: {
  unified: ReturnType<typeof useUnifiedProgress>
  onOpenLesson: (route: LearningRoute, lesson: RouteLesson) => void
  onOpenGame: (gameId: string) => void
  onExplore: () => void
  onLessons: () => void
}) {
  const {
    state,
    learningSummary,
    educationSummary,
    educationProgress,
    xp,
    gamesXp,
    lessonsXp,
    level,
    nextLevel,
    streak,
    overall,
    currentRoute,
    nextLesson,
  } = unified

  const gamesPlayed = Object.entries(state.games)
    .filter(([, game]) => game.answered > 0)
    .sort((a, b) => Number(b[1].completed) - Number(a[1].completed) || b[1].best - a[1].best)
    .slice(0, 5)

  const inProgressGames = Object.entries(state.games)
    .filter(([, game]) => game.answered > 0 && !game.completed)
    .slice(0, 3)

  const badges = [
    ...GAME_BADGES.map((badge) => ({
      id: badge.id,
      label: badge.label,
      description: badge.description,
      source: 'Juegos',
      earned: learningSummary.badges.includes(badge.id),
    })),
    ...EDUCATION_BADGES.map((badge) => ({
      id: badge.id,
      label: badge.label,
      description: badge.description,
      source: 'Lecciones',
      earned: educationProgress.badges.includes(badge.id),
    })),
  ]
  const earnedBadges = badges.filter((badge) => badge.earned).length
  const percentToNext = nextLevel
    ? Math.min(100, Math.round((xp / Math.max(1, nextLevel.level.min)) * 100))
    : 100

  return (
    <div className="space-y-6">
      <header className="rounded-[28px] border border-white/70 bg-gradient-to-br from-[#eef4ff] via-[#f6f1ff] to-[#eefbf3] p-6 shadow-[0_26px_56px_-36px_rgba(25,45,95,.55)] sm:p-7">
        <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">
          Mi progreso
        </p>
        <div className="mt-1 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-[28px] leading-tight font-extrabold text-[#1d2f57]">
              Nivel {level.name} · {xp} XP
            </h2>
            <p className="mt-1.5 max-w-[620px] text-[12.5px] leading-relaxed font-medium text-[#5d76a6]">
              {level.description}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/85 px-3 py-1 text-[10.5px] font-extrabold text-[#2f4b86] ring-1 ring-white">
                {gamesXp} XP de juegos
              </span>
              <span className="rounded-full bg-white/85 px-3 py-1 text-[10.5px] font-extrabold text-[#2f4b86] ring-1 ring-white">
                {lessonsXp} XP de lecciones
              </span>
              <span className="rounded-full bg-white/85 px-3 py-1 text-[10.5px] font-extrabold text-[#2f4b86] ring-1 ring-white">
                Racha de lecciones: {streak} {streak === 1 ? 'día' : 'días'}
              </span>
            </div>
          </div>

          <div className="w-full max-w-[360px] rounded-2xl bg-white/80 p-3.5 ring-1 ring-white">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10.5px] font-extrabold text-[#3d568e]">
                {nextLevel ? `Siguiente: ${nextLevel.level.name}` : 'Nivel máximo alcanzado'}
              </p>
              <p className="text-[10px] font-bold text-[#8aa0c4]">
                {nextLevel ? `faltan ${nextLevel.missing} XP` : `${xp} XP`}
              </p>
            </div>
            <ProgressBar value={percentToNext / 100} className="mt-2" />
          </div>
        </div>
      </header>

      <section aria-label="Resumen de progreso" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Lecciones de ruta"
          value={`${overall.lessonsDone}/${overall.totalLessons}`}
          hint={`${overall.percent}% del camino`}
          tone="good"
        />
        <StatTile
          label="Rutas completadas"
          value={`${overall.routesDone}/${overall.totalRoutes}`}
          hint={`${overall.routesStarted} iniciadas`}
          tone="info"
        />
        <StatTile
          label="Juegos completados"
          value={`${learningSummary.gamesCompleted}/${learningSummary.totalGames}`}
          hint={`${learningSummary.gamesPlayed} jugados`}
          tone="info"
        />
        <StatTile
          label="Insignias"
          value={`${earnedBadges}/${badges.length}`}
          hint="Juegos y lecciones"
          tone="warn"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* avance por ruta */}
        <section
          aria-labelledby="progreso-rutas"
          className="rounded-[24px] border border-white/70 bg-white/70 p-5 backdrop-blur-xl"
        >
          <SectionHeading
            id="progreso-rutas"
            eyebrow="Avance por ruta"
            title="Tu recorrido temático"
            description="Cada barra muestra las lecciones completadas de esa ruta."
          />
          <ul className="mt-4 space-y-3">
            {unified.routes.map(({ route, stats }) => (
              <li key={route.id}>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[11.5px] font-extrabold text-[#243d6b]">
                    {route.title}
                  </p>
                  <p className="shrink-0 text-[10px] font-bold text-[#8aa0c4]">
                    {stats.done}/{stats.total}
                  </p>
                </div>
                <ProgressBar value={stats.percent} className="mt-1.5" />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onExplore}
            className="mt-4 rounded-xl bg-[#eef4ff] px-3.5 py-2 text-[11.5px] font-bold text-[#2f4b86] transition-colors duration-200 hover:bg-[#5b7cf5] hover:text-white"
          >
            Explorar todas las rutas
          </button>
        </section>

        {/* recomendaciones */}
        <section
          aria-labelledby="progreso-recomendaciones"
          className="rounded-[24px] border border-white/70 bg-white/70 p-5 backdrop-blur-xl"
        >
          <SectionHeading
            id="progreso-recomendaciones"
            eyebrow="Para continuar"
            title="Recomendaciones"
            description="Basadas en lo que ya practicaste, no en una nota pública."
          />

          <div className="mt-4 space-y-2.5">
            {nextLesson ? (
              <button
                type="button"
                onClick={() => onOpenLesson(nextLesson.route, nextLesson.lesson)}
                className="w-full rounded-2xl border border-[#c9b8f7] bg-white p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5"
              >
                <p className="text-[9.5px] font-extrabold tracking-[0.12em] text-[#7d55e0] uppercase">
                  Siguiente lección
                </p>
                <p className="mt-1 text-[12.5px] font-extrabold text-[#243d6b]">
                  {nextLesson.lesson.title}
                </p>
                <p className="mt-0.5 text-[10.5px] font-medium text-[#8aa0c4]">
                  {nextLesson.route.title}
                </p>
              </button>
            ) : (
              <p className="rounded-2xl bg-[#eefbf3] p-3.5 text-[11.5px] font-semibold text-[#1d7a53]">
                Completaste todas las lecciones de ruta. Puedes repasar la que quieras.
              </p>
            )}

            {inProgressGames.map(([gameId, game]) => (
              <button
                key={gameId}
                type="button"
                onClick={() => onOpenGame(gameId)}
                className="w-full rounded-2xl bg-[#fff8e8] p-3.5 text-left transition-colors duration-200 hover:bg-[#fff3d6]"
              >
                <p className="text-[9.5px] font-extrabold tracking-[0.12em] text-[#b06f13] uppercase">
                  Actividad en curso
                </p>
                <p className="mt-1 text-[12px] font-extrabold text-[#243d6b]">
                  {GAME_BY_ID[gameId]?.title ?? gameId}
                </p>
                <p className="mt-0.5 text-[10.5px] font-medium text-[#8aa0c4]">
                  {game.correct}/{game.answered} respuestas correctas
                </p>
              </button>
            ))}

            {educationSummary.lessons < educationSummary.totalLessons && (
              <button
                type="button"
                onClick={onLessons}
                className="w-full rounded-2xl bg-[#eef4ff] p-3.5 text-left transition-colors duration-200 hover:bg-[#e2e9ff]"
              >
                <p className="text-[9.5px] font-extrabold tracking-[0.12em] text-[#2f4b86] uppercase">
                  Centro educativo
                </p>
                <p className="mt-1 text-[12px] font-extrabold text-[#243d6b]">
                  {educationSummary.lessons} de {educationSummary.totalLessons} lecciones
                </p>
                <p className="mt-0.5 text-[10.5px] font-medium text-[#8aa0c4]">
                  Precisión {educationSummary.accuracy}% · abre las lecciones para continuar
                </p>
              </button>
            )}
          </div>
        </section>
      </div>

      {/* insignias */}
      <section aria-labelledby="progreso-insignias">
        <SectionHeading
          id="progreso-insignias"
          eyebrow="Logros"
          title="Insignias"
          description="Premian la práctica completada. No certifican que estés a salvo de todos los fraudes."
        />
        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <li
              key={`${badge.source}-${badge.id}`}
              className={`rounded-2xl border p-3.5 ${
                badge.earned ? 'border-[#bfe3d1] bg-[#eefbf3]' : 'border-[#dbe6f7] bg-white/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`text-[12px] font-extrabold ${
                    badge.earned ? 'text-[#1d7a53]' : 'text-[#4a628f]'
                  }`}
                >
                  {badge.label}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[8.5px] font-extrabold tracking-[0.08em] uppercase ${
                    badge.earned
                      ? 'bg-white text-[#1d7a53]'
                      : 'bg-[#eef4ff] text-[#8aa0c4]'
                  }`}
                >
                  {badge.earned ? 'Conseguida' : 'Pendiente'}
                </span>
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed font-medium text-[#8aa0c4]">
                {badge.description}
              </p>
              <p className="mt-1.5 text-[9px] font-extrabold tracking-[0.1em] text-[#a7b8d4] uppercase">
                {badge.source}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* práctica por actividad */}
      <section
        aria-labelledby="progreso-actividad"
        className="rounded-[24px] border border-white/70 bg-white/70 p-5 backdrop-blur-xl"
      >
        <SectionHeading
          id="progreso-actividad"
          eyebrow="Tu práctica"
          title="Actividad por juego"
          description="El centro guarda identificadores, puntos y contadores; no guarda datos personales."
        />
        {gamesPlayed.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-[#c9dbf6] bg-white/60 p-4 text-center text-[11.5px] font-semibold text-[#8aa0c4]">
            Todavía no has completado ninguna actividad. Empieza por la ruta que más te interese.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#e8eefb]">
            {gamesPlayed.map(([gameId, game]) => (
              <li key={gameId} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className="text-[12px] font-extrabold text-[#243d6b]">
                    {GAME_BY_ID[gameId]?.title ?? gameId}
                  </p>
                  <p className="text-[10.5px] font-medium text-[#8aa0c4]">
                    {game.correct}/{game.answered} correctas · mejor puntuación {game.best}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                      game.completed
                        ? 'bg-[#eefbf3] text-[#1d7a53]'
                        : 'bg-[#fff8e8] text-[#b06f13]'
                    }`}
                  >
                    {game.completed ? 'Completado' : 'En curso'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenGame(gameId)}
                    className="rounded-lg bg-[#eef4ff] px-2.5 py-1.5 text-[10.5px] font-bold text-[#2f4b86] transition-colors duration-200 hover:bg-[#5b7cf5] hover:text-white"
                  >
                    {game.completed ? 'Repasar' : 'Continuar'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#eef4ff] p-3.5">
          <div>
            <p className="text-[11.5px] font-extrabold text-[#243d6b]">
              Ruta activa: {currentRoute.title}
            </p>
            <p className="text-[10.5px] font-medium text-[#7b90b8]">
              Cambiar de ruta no borra el avance de la anterior.
            </p>
          </div>
          <button
            type="button"
            onClick={onExplore}
            className="rounded-xl bg-white px-3 py-2 text-[10.5px] font-bold text-[#2f4b86] ring-1 ring-[#dbe6f7] transition-colors duration-200 hover:bg-[#5b7cf5] hover:text-white"
          >
            Cambiar de ruta
          </button>
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Piezas reutilizables                                                */
/* ------------------------------------------------------------------ */

function GameRouter({ gameId, onExit }: { gameId: string; onExit: () => void }) {
  switch (gameId) {
    case 'detectives':
      return <DetectivesGame onExit={onExit} />
    case 'historias':
      return <StoryGame onExit={onExit} />
    case 'diferencias':
      return <DifferencesGame onExit={onExit} />
    case 'laboratorio':
      return <LabGame onExit={onExit} />
    case 'contrarreloj':
      return <QuizGame gameId="contrarreloj" onExit={onExit} />
    case 'vf-desafio':
      return <QuizGame gameId="vf-desafio" onExit={onExit} />
    case 'protege-cuenta':
      return <AccountGame onExit={onExit} />
    case 'plan':
      return <PlanGame onExit={onExit} />
    case 'anatomia-tarjeta':
      return <CardAnatomyGame onExit={onExit} />
    default:
      return null
  }
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M13.2 5.6 11.8 7l4 4H4v2h11.8l-4 4 1.4 1.4L19.8 12l-6.6-6.4Z" />
    </svg>
  )
}

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  action,
}: {
  id: string
  eyebrow: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">
          {eyebrow}
        </p>
        <h3 id={id} className="mt-1 text-[20px] leading-tight font-extrabold text-[#1d2f57]">
          {title}
        </h3>
        {description && (
          <p className="mt-1 max-w-[620px] text-[11.5px] leading-relaxed font-medium text-[#7b90b8]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)))
  return (
    <span
      className={`block h-1.5 overflow-hidden rounded-full bg-[#e6eefb] ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <span
        className="block h-full rounded-full bg-gradient-to-r from-[#2fb87c] via-[#5b7cf5] to-[#9b6ef0] transition-all duration-500 motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </span>
  )
}

function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone: 'info' | 'good' | 'warn'
}) {
  const toneClass =
    tone === 'good'
      ? 'text-[#1d7a53] bg-[#eefbf3] ring-[#bfe3d1]'
      : tone === 'warn'
        ? 'text-[#b06f13] bg-[#fff8e8] ring-[#f4d9a8]'
        : 'text-[#2f4b86] bg-[#eef4ff] ring-[#dbe6f7]'

  return (
    <div className={`rounded-2xl p-3.5 ring-1 ${toneClass}`}>
      <p className="text-[10px] font-extrabold tracking-[0.12em] uppercase">{label}</p>
      <p className="mt-1.5 text-[21px] leading-none font-extrabold">{value}</p>
      {hint && <p className="mt-1 text-[9.5px] font-semibold opacity-80">{hint}</p>}
    </div>
  )
}

function StatusPill({ stats }: { stats: ReturnType<typeof routeStats> }) {
  const label = stats.completed ? 'Completada' : stats.started ? 'En curso' : 'Sin empezar'
  const style = stats.completed
    ? 'bg-[#eefbf3] text-[#1d7a53]'
    : stats.started
      ? 'bg-[#fff8e8] text-[#b06f13]'
      : 'bg-[#eef4ff] text-[#4a628f]'
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[9.5px] font-extrabold ${style}`}>
      {label}
    </span>
  )
}

function MiniRouteCard({
  route,
  stats,
  onOpen,
}: {
  route: LearningRoute
  stats: ReturnType<typeof routeStats>
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full flex-col rounded-[22px] border border-white/70 bg-white/70 p-4 text-left backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5] motion-reduce:transition-none"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl text-white"
          style={{ background: route.color }}
        >
          {learningIcons[route.icon] ?? learningIcons.book}
        </span>
        <StatusPill stats={stats} />
      </div>
      <p className="mt-2.5 text-[12.5px] leading-snug font-extrabold text-[#243d6b]">
        {route.title}
      </p>
      <p className="mt-1 flex-1 text-[10.5px] leading-relaxed font-medium text-[#8aa0c4]">
        {route.summary}
      </p>
      <ProgressBar value={stats.percent} className="mt-2.5" />
      <span className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-extrabold text-[#5b7cf5]">
        Explorar ruta
        <ArrowIcon />
      </span>
    </button>
  )
}

function RouteCard({
  route,
  stats,
  onOpen,
}: {
  route: LearningRoute
  stats: ReturnType<typeof routeStats>
  onOpen: () => void
}) {
  const totalMinutes = route.lessons.reduce((total, lesson) => total + lesson.minutes, 0)
  return (
    <article className="flex h-full flex-col rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_40px_-28px_rgba(25,45,95,.6)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:bg-white focus-within:ring-2 focus-within:ring-[#5b7cf5]/40 motion-reduce:transition-none">
      <div className="flex items-start justify-between gap-2">
        <span
          className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-[0_10px_22px_-14px_rgba(30,55,130,.9)] [&_svg]:h-6 [&_svg]:w-6"
          style={{ background: route.color }}
        >
          {learningIcons[route.icon] ?? learningIcons.book}
        </span>
        <StatusPill stats={stats} />
      </div>

      <h3 className="mt-3 text-[14px] leading-snug font-extrabold text-[#243d6b]">
        {route.title}
      </h3>
      <p className="mt-1.5 flex-1 text-[11px] leading-relaxed font-medium text-[#8aa0c4]">
        {route.summary}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9px] font-extrabold text-[#4a628f]">
          {route.difficulty}
        </span>
        <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9px] font-extrabold text-[#4a628f]">
          {route.lessons.length} lecciones
        </span>
        <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9px] font-extrabold text-[#4a628f]">
          {totalMinutes} min
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9.5px] font-extrabold text-[#3d568e]">
            {stats.done}/{stats.total} completadas
          </p>
          <p className="text-[9.5px] font-bold text-[#8aa0c4]">{Math.round(stats.percent * 100)}%</p>
        </div>
        <ProgressBar value={stats.percent} className="mt-1" />
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#eef4ff] px-3 py-2.5 text-[11.5px] font-bold text-[#2f4b86] transition-colors duration-200 hover:bg-[#5b7cf5] hover:text-white"
      >
        {stats.completed ? 'Repasar ruta' : stats.started ? 'Continuar ruta' : 'Empezar ruta'}
        <ArrowIcon />
      </button>
    </article>
  )
}
