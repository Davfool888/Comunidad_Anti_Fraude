import { GAME_BY_ID } from '../../../data/learning'
import type { LearningRoute, RouteLesson } from '../../../data/learning/routes'
import type { LearningState } from '../../../lib/learning/progress'
import { lessonXp, pathFor, type LessonStatus } from '../../../lib/learning/routes'
import { learningIcons } from './learningIcons'

/**
 * Camino visual de una ruta.
 *
 * Cada nodo es una lección con estado reconocible (completada, en curso,
 * disponible) y una alternativa textual accesible: el estado nunca depende
 * sólo del color. Los nodos no se bloquean artificialmente entre sí.
 */

const STATUS_LABEL: Record<LessonStatus, string> = {
  completada: 'Completada',
  'en-progreso': 'En curso',
  disponible: 'Disponible',
}

function StatusGlyph({ status }: { status: LessonStatus }) {
  if (status === 'completada') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="m9.2 16.6-4.3-4.3 1.4-1.4 2.9 2.9 8.5-8.5 1.4 1.4-9.9 9.9Z" />
      </svg>
    )
  }
  if (status === 'en-progreso') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M8 5v14l11-7L8 5Z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 4a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6V4Zm1 3v6h5v-2h-3V7h-2Z" />
    </svg>
  )
}

const NODE_STYLE: Record<LessonStatus, string> = {
  completada: 'bg-[#2fb87c] text-white ring-[#bfe3d1]',
  'en-progreso': 'bg-[#e9a13b] text-white ring-[#f4d9a8]',
  disponible: 'bg-white text-[#5b7cf5] ring-[#dbe6f7]',
}

export function LearningPath({
  route,
  state,
  recommendedId,
  onOpenLesson,
}: {
  route: LearningRoute
  state: LearningState
  recommendedId?: string
  onOpenLesson: (lesson: RouteLesson) => void
}) {
  const nodes = pathFor(state, route, recommendedId)

  return (
    <div className="relative mx-auto w-full max-w-[680px]">
      <span
        aria-hidden="true"
        className="absolute top-5 bottom-5 left-[25px] w-[3px] rounded-full bg-gradient-to-b from-[#c9dbf6] via-[#dbe6f7] to-[#eef4ff] sm:left-[29px]"
      />

      <ol className="space-y-3.5">
        {nodes.map((node, index) => {
          const game = GAME_BY_ID[node.lesson.gameId]
          const status = node.status
          return (
            <li key={node.lesson.id} className="relative pl-[58px] sm:pl-[70px]">
              <span
                className={`absolute top-4 left-0 grid h-[52px] w-[52px] place-items-center rounded-2xl ring-4 shadow-[0_10px_24px_-16px_rgba(30,55,130,.9)] sm:h-[60px] sm:w-[60px] ${NODE_STYLE[status]} ${
                  node.recommended ? 'ring-[#9b6ef0]/35' : ''
                }`}
                aria-hidden="true"
              >
                <StatusGlyph status={status} />
              </span>

              <button
                type="button"
                onClick={() => onOpenLesson(node.lesson)}
                aria-label={`${node.lesson.title}. ${STATUS_LABEL[status]}. ${node.lesson.objective}`}
                className={`group w-full rounded-[22px] border bg-white/75 p-4 text-left backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_22px_44px_-28px_rgba(25,45,95,.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b7cf5] motion-reduce:transition-none ${
                  node.recommended
                    ? 'border-[#c9b8f7] shadow-[0_20px_40px_-30px_rgba(120,85,220,.9)]'
                    : 'border-white ring-1 ring-[#e8eefb]'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9.5px] font-extrabold tracking-[0.16em] text-[#8aa0c4] uppercase">
                    Lección {index + 1} · {game?.title ?? 'Actividad'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold tracking-[0.08em] uppercase ${
                      status === 'completada'
                        ? 'bg-[#eefbf3] text-[#1d7a53]'
                        : status === 'en-progreso'
                          ? 'bg-[#fff8e8] text-[#b06f13]'
                          : 'bg-[#eef4ff] text-[#4a628f]'
                    }`}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                  {node.recommended && (
                    <span className="rounded-full bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] px-2 py-0.5 text-[9px] font-extrabold tracking-[0.08em] text-white uppercase">
                      Siguiente
                    </span>
                  )}
                </div>

                <p className="mt-1.5 text-[14.5px] leading-snug font-extrabold text-[#243d6b]">
                  {node.lesson.title}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed font-medium text-[#7b90b8]">
                  {node.lesson.objective}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="flex items-center gap-1 rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9.5px] font-extrabold text-[#4a628f]">
                    {learningIcons.clock}
                    {node.lesson.minutes} min
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-[#eef4ff] px-2 py-0.5 text-[9.5px] font-extrabold text-[#4a628f]">
                    {learningIcons.target}hasta +{lessonXp(node.lesson)} XP
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] font-extrabold text-[#5b7cf5] transition-transform duration-200 group-hover:translate-x-0.5">
                    {status === 'completada' ? 'Repasar' : status === 'en-progreso' ? 'Continuar' : 'Empezar'}
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                      <path d="M13.2 5.6 11.8 7l4 4H4v2h11.8l-4 4 1.4 1.4L19.8 12l-6.6-6.4Z" />
                    </svg>
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
