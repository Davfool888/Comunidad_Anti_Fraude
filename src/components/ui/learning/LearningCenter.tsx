import { Suspense, lazy, useMemo, useState } from 'react'
import { GAMES } from '../../../data/learning'
import type { GameDefinition } from '../../../data/learning/types'
import { LEARNING_CATEGORIES } from '../../../data/learning/categories'
import { GAME_BADGES } from '../../../lib/learning/engine'
import { EducationCenter } from '../education/EducationCenter'
import { useLearning } from './learningContext'
import { learningIcons } from './learningIcons'
import { NewModalities } from './NewModalities'

/**
 * Cada juego se carga en diferido: el material educativo (casos, historias,
 * preguntas) no entra en el paquete inicial de la portada.
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
const LabGame = lazy(() => import('./games/LabGame').then((module) => ({ default: module.LabGame })))
const QuizGame = lazy(() =>
  import('./games/QuizGame').then((module) => ({ default: module.QuizGame })),
)
const AccountGame = lazy(() =>
  import('./games/AccountGame').then((module) => ({ default: module.AccountGame })),
)
const PlanGame = lazy(() =>
  import('./games/PlanGame').then((module) => ({ default: module.PlanGame })),
)

/**
 * **Centro de aprendizaje**.
 *
 * Página principal de los juegos de prevención: bienvenida, tarjetas de los
 * ocho juegos, categorías, progreso, actividades recomendadas y logros.
 * Desde aquí se entra a cada juego, que gestiona su propio flujo y resultados.
 */
export function LearningCenter() {
  const [screen, setScreen] = useState<{ type: 'inicio' } | { type: 'juego'; id: string } | { type: 'lecciones' }>(
    { type: 'inicio' },
  )
  const { state, summary } = useLearning()

  if (screen.type === 'juego') {
    return (
      <Suspense
        fallback={
          <div className="grid min-h-[320px] place-items-center rounded-[28px] border border-white/70 bg-white/60 text-[12px] font-semibold text-[#8aa0c4]">
            Cargando el juego…
          </div>
        }
      >
        <GameRouter gameId={screen.id} onExit={() => setScreen({ type: 'inicio' })} />
      </Suspense>
    )
  }

  if (screen.type === 'lecciones') {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setScreen({ type: 'inicio' })}
          className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#6b81ad] transition-colors duration-200 hover:text-[#1d3f77]"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
            <path d="M10.8 5.6 12.2 7l-4 4H20v2H8.2l4 4-1.4 1.4L4.2 12l6.6-6.4Z" />
          </svg>
          Volver al centro de aprendizaje
        </button>
        <EducationCenter />
      </div>
    )
  }

  return (
    <HomeView
      onOpenGame={(id) => setScreen({ type: 'juego', id })}
      onOpenLessons={() => setScreen({ type: 'lecciones' })}
      state={state}
      summary={summary}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Enrutador de juegos                                                 */
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
    default:
      return null
  }
}

/* ------------------------------------------------------------------ */
/* Portada                                                             */
/* ------------------------------------------------------------------ */

function HomeView({
  onOpenGame,
  onOpenLessons,
  state,
  summary,
}: {
  onOpenGame: (id: string) => void
  onOpenLessons: () => void
  state: { games: Record<string, { completed: boolean; score: number; best: number; answered: number; correct: number }> }
  summary: { gamesPlayed: number; gamesCompleted: number; totalGames: number; points: number; badges: string[]; started: boolean }
}) {
  const recommended = useMemo(
    () => GAMES.filter((game) => !state.games[game.id]?.completed).slice(0, 3),
    [state.games],
  )

  return (
    <div className="space-y-8">
      {/* bienvenida */}
      <header className="overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-[#eaf2ff] via-[#f2eeff] to-[#e9fbf5] p-6 shadow-[0_30px_64px_-34px_rgba(25,45,95,.55)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[580px]">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[10px] font-extrabold tracking-[0.14em] text-[#4a628f] uppercase ring-1 ring-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2fb87c]" />
              Centro de aprendizaje
            </span>
            <h2 className="mt-3 text-[30px] leading-[1.1] font-extrabold tracking-tight text-[#1d2f57] sm:text-[36px]">
              Centro de aprendizaje
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed font-medium text-[#4a628f]">
              Aprende a reconocer las señales de alerta, investiga situaciones sospechosas y descubre cómo
              protegerte de los fraudes digitales.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenGame(recommended[0]?.id ?? GAMES[0].id)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-5 py-3 text-[13px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(80,90,220,.9)] transition-all duration-200 hover:-translate-y-0.5"
              >
                {summary.started ? 'Continuar jugando' : 'Comenzar a jugar'}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M13.2 5.6 11.8 7l4 4H4v2h11.8l-4 4 1.4 1.4L19.8 12l-6.6-6.4Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onOpenLessons}
                className="rounded-xl bg-white/80 px-4 py-3 text-[12.5px] font-bold text-[#4a628f] ring-1 ring-white transition-colors duration-200 hover:bg-white"
              >
                Ver las lecciones
              </button>
            </div>
          </div>

          <div className="hidden shrink-0 lg:block">
            <div className="relative grid h-[168px] w-[220px] place-items-center">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#5b7cf5]/25 to-[#9b6ef0]/25 blur-xl" />
              <div className="relative grid h-[124px] w-[124px] place-items-center rounded-[30px] bg-white/80 shadow-[0_18px_40px_-20px_rgba(30,55,130,.8)] ring-1 ring-white text-[#5b7cf5]">
                {learningIcons.detective}
              </div>
              <div className="absolute top-2 right-3 grid h-11 w-11 place-items-center rounded-2xl bg-white/90 text-[#e9a13b] shadow-[0_10px_24px_-14px_rgba(30,55,130,.9)]">
                {learningIcons.bulb}
              </div>
              <div className="absolute bottom-1 left-1 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[#2fb87c] shadow-[0_10px_24px_-14px_rgba(30,55,130,.9)]">
                {learningIcons.shield}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* progreso */}
      <section aria-labelledby="centro-progreso">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">
              Indicadores de progreso
            </p>
            <h3 id="centro-progreso" className="mt-1 text-[20px] leading-tight font-extrabold text-[#1d2f57]">
              {summary.started ? 'Tu avance en los juegos' : 'Todavía no has empezado'}
            </h3>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ProgressStat
            label="Juegos completados"
            value={`${summary.gamesCompleted}/${summary.totalGames}`}
            tone="info"
          />
          <ProgressStat
            label="Juegos jugados"
            value={`${summary.gamesPlayed}`}
            tone="good"
          />
          <ProgressStat label="Puntos" value={`${summary.points}`} tone="warn" />
          <ProgressStat
            label="Insignias"
            value={`${summary.badges.length}/${GAME_BADGES.length}`}
            tone="info"
          />
        </div>
      </section>

      {/* juegos */}
      <section aria-labelledby="centro-juegos">
        <div className="mb-3">
          <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">Juegos</p>
          <h3 id="centro-juegos" className="mt-1 text-[20px] leading-tight font-extrabold text-[#1d2f57]">
            Ocho juegos para practicar
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GAMES.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              progress={state.games[game.id]}
              onOpen={() => onOpenGame(game.id)}
            />
          ))}
        </div>
      </section>

      {/* modalidades vigentes: se actualizan con los reportes de la red */}
      <NewModalities />

      {/* recomendados */}
      <section aria-labelledby="centro-recomendados">
        <div className="mb-3">
          <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">
            Actividades recomendadas
          </p>
          <h3 id="centro-recomendados" className="mt-1 text-[20px] leading-tight font-extrabold text-[#1d2f57]">
            Por dónde seguir
          </h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {recommended.map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => onOpenGame(game.id)}
              className="rounded-2xl border border-[#dbe6f7] bg-white/70 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-white"
            >
              <span
                className="grid h-9 w-9 place-items-center rounded-xl text-white"
                style={{ background: game.color }}
              >
                {learningIcons[game.icon] ?? learningIcons.book}
              </span>
              <p className="mt-2.5 text-[13px] font-extrabold text-[#243d6b]">{game.title}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed font-medium text-[#8aa0c4]">{game.summary}</p>
            </button>
          ))}
        </div>
      </section>

      {/* categorías */}
      <section aria-labelledby="centro-categorias">
        <div className="mb-3">
          <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">
            Categorías educativas
          </p>
          <h3 id="centro-categorias" className="mt-1 text-[20px] leading-tight font-extrabold text-[#1d2f57]">
            Diez temas de fraude digital
          </h3>
        </div>

        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LEARNING_CATEGORIES.map((category) => (
            <li
              key={category.id}
              className="flex items-start gap-3 rounded-2xl border border-[#dbe6f7] bg-white/70 p-3.5"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white"
                style={{ background: category.color }}
              >
                {learningIcons[category.icon] ?? learningIcons.book}
              </span>
              <span className="min-w-0">
                <span className="block text-[12.5px] leading-snug font-extrabold text-[#243d6b]">
                  {category.title}
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed font-medium text-[#8aa0c4]">
                  {category.summary}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* logros */}
      <section aria-labelledby="centro-logros">
        <div className="mb-3">
          <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">Logros</p>
          <h3 id="centro-logros" className="mt-1 text-[20px] leading-tight font-extrabold text-[#1d2f57]">
            Insignias
          </h3>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GAME_BADGES.map((badge) => {
            const earned = summary.badges.includes(badge.id)
            return (
              <li
                key={badge.id}
                className={`rounded-2xl border p-4 ${
                  earned ? 'border-[#bfe3d1] bg-[#eefbf3]' : 'border-[#dbe6f7] bg-white/60'
                }`}
              >
                <p
                  className={`text-[12.5px] font-extrabold ${earned ? 'text-[#1d7a53]' : 'text-[#4a628f]'}`}
                >
                  {badge.label}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed font-medium text-[#8aa0c4]">
                  {badge.description}
                </p>
                {earned && (
                  <span className="mt-2 inline-block rounded-full bg-white px-2 py-0.5 text-[9.5px] font-extrabold text-[#1d7a53]">
                    conseguida
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <p className="text-center text-[11px] leading-relaxed font-medium text-[#8aa0c4]">
        Todo el material es ficticio y educativo. Las insignias premian la práctica, no garantizan que
       Puedes identificar todos los fraudes.
      </p>
    </div>
  )
}

function ProgressStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
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
      <p className="mt-1.5 text-[22px] leading-none font-extrabold">{value}</p>
    </div>
  )
}

function GameCard({
  game,
  progress,
  onOpen,
}: {
  game: GameDefinition
  progress?: { completed: boolean; best: number; answered: number }
  onOpen: () => void
}) {
  const status = progress?.completed ? 'completado' : progress?.answered ? 'en progreso' : 'disponible'

  return (
    <article className="flex h-full flex-col rounded-[22px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_40px_-28px_rgba(25,45,95,.6)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_26px_50px_-26px_rgba(25,45,95,.7)]">
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid h-11 w-11 place-items-center rounded-[14px] text-white shadow-[0_8px_18px_-10px_rgba(30,55,130,.9)]"
          style={{ background: game.color }}
        >
          {learningIcons[game.icon] ?? learningIcons.book}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-[0.1em] uppercase ${
            status === 'completado'
              ? 'bg-[#eefbf3] text-[#1d7a53]'
              : status === 'en progreso'
                ? 'bg-[#fff8e8] text-[#b06f13]'
                : 'bg-[#eef4ff] text-[#4a628f]'
          }`}
        >
          {status}
        </span>
      </div>

      <h4 className="mt-3 text-[13.5px] leading-snug font-extrabold text-[#243d6b]">{game.title}</h4>
      <p className="mt-1.5 flex-1 text-[11px] leading-relaxed font-medium text-[#8aa0c4]">
        {game.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9.5px] font-extrabold text-[#4a628f]">
          {game.difficulty}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9.5px] font-extrabold text-[#4a628f]">
          {learningIcons.clock}
          {game.minutes} min
        </span>
        <span className="flex items-center gap-1 rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9.5px] font-extrabold text-[#4a628f]">
          {learningIcons.target}
          {game.total} {game.id === 'plan' ? 'medidas' : 'casos'}
        </span>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#eef4ff] px-3 py-2.5 text-[12px] font-bold text-[#2f4b86] transition-colors duration-200 hover:bg-[#5b7cf5] hover:text-white"
      >
        {status === 'completado' ? 'Repetir' : status === 'en progreso' ? 'Continuar' : 'Comenzar'}
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
          <path d="M13.2 5.6 11.8 7l4 4H4v2h11.8l-4 4 1.4 1.4L19.8 12l-6.6-6.4Z" />
        </svg>
      </button>
    </article>
  )
}
