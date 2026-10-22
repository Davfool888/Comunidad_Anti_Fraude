import { NETWORKS } from '../../../data/networks'
import type { Trends } from '../../../lib/api'

/**
 * Gráficos del panel de tendencias: barras horizontales de una sola serie
 * (sin leyenda, el título la nombra) y una línea diaria de análisis.
 * El valor va en tinta de texto junto a la barra, no en el color de la serie.
 */

function HBars({ rows, max }: { rows: { label: string; value: number; danger?: number }[]; max: number }) {
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.label} className="grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-2" title={`${row.label}: ${row.value}`}>
          <span className="truncate text-[11px] font-semibold text-[#4a628f]">{row.label}</span>
          <span className="flex h-3 overflow-hidden" aria-hidden="true">
            {row.danger ? (
              <span className="h-full rounded-l-[4px] bg-[#e23b5f]" style={{ width: `${(row.danger / max) * 100}%` }} />
            ) : null}
            <span
              className={`h-full rounded-r-[4px] bg-[#5b7cf5] ${row.danger ? 'ml-[2px]' : 'rounded-l-[4px]'}`}
              style={{ width: `${((row.value - (row.danger ?? 0)) / max) * 100}%` }}
            />
          </span>
          <span className="text-[11px] font-extrabold text-[#1d2f57] tabular-nums">{row.value}</span>
        </li>
      ))}
    </ul>
  )
}

function DailyLine({ points }: { points: { day: string; total: number }[] }) {
  if (points.length < 2) {
    return <p className="text-[11px] font-medium text-[#8aa0c4]">Aún no hay suficientes días con análisis.</p>
  }
  const width = 320
  const height = 80
  const max = Math.max(...points.map((point) => point.total), 1)
  const x = (index: number) => (index / (points.length - 1)) * (width - 8) + 4
  const y = (value: number) => height - 6 - (value / max) * (height - 14)
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${x(index)},${y(point.total)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[80px] w-full" role="img" aria-label="Análisis por día">
      <line x1="0" x2={width} y1={height - 6} y2={height - 6} stroke="#dbe6f7" strokeWidth="1" />
      <path d={path} fill="none" stroke="#5b7cf5" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((point, index) => (
        <circle key={point.day} cx={x(index)} cy={y(point.total)} r="5" fill="transparent">
          <title>{`${point.day}: ${point.total} análisis`}</title>
        </circle>
      ))}
    </svg>
  )
}

export function TrendCharts({ trends }: { trends: Trends }) {
  const byCategory = trends.by_category.slice(0, 8)
  const categoryMax = Math.max(...byCategory.map((row) => row.total), 1)
  const byNetwork = trends.by_network.slice(0, 8).map((row) => ({
    label: NETWORKS.find((network) => network.id === row.network_id)?.neighborhood ?? row.network_id,
    value: row.total,
    danger: row.danger,
  }))
  const networkMax = Math.max(...byNetwork.map((row) => row.value), 1)
  const verdicts = trends.verdicts
  const total = (verdicts.fraude ?? 0) + (verdicts.sospechoso ?? 0) + (verdicts.limpio ?? 0)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="grid grid-cols-3 gap-2 lg:col-span-2">
        {(
          [
            ['Análisis', total, 'text-[#1d2f57]'],
            ['Fraudes detectados', verdicts.fraude ?? 0, 'text-[#c2274a]'],
            ['Sospechosos', verdicts.sospechoso ?? 0, 'text-[#b06f13]'],
          ] as const
        ).map(([label, value, color]) => (
          <div key={label} className="rounded-2xl border border-[#dbe6f7] bg-white p-3">
            <p className="text-[10px] font-bold tracking-[0.12em] text-[#7a90b8] uppercase">{label}</p>
            <p className={`mt-1 text-[24px] font-extrabold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#dbe6f7] bg-white p-4">
        <p className="mb-3 text-[12px] font-extrabold text-[#1d2f57]">Modalidades más reportadas · {trends.days} días</p>
        {byCategory.length ? (
          <HBars rows={byCategory.map((row) => ({ label: row.label, value: row.total }))} max={categoryMax} />
        ) : (
          <p className="text-[11px] font-medium text-[#8aa0c4]">Sin reportes en el periodo.</p>
        )}
      </div>

      <div className="rounded-2xl border border-[#dbe6f7] bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[12px] font-extrabold text-[#1d2f57]">Alertas por localidad</p>
          <span className="flex items-center gap-3 text-[10px] font-semibold text-[#6b81ad]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[#e23b5f]" /> Incidentes
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-[#5b7cf5]" /> Otras alertas
            </span>
          </span>
        </div>
        {byNetwork.length ? (
          <HBars rows={byNetwork} max={networkMax} />
        ) : (
          <p className="text-[11px] font-medium text-[#8aa0c4]">Sin alertas en el periodo.</p>
        )}
      </div>

      <div className="rounded-2xl border border-[#dbe6f7] bg-white p-4 lg:col-span-2">
        <p className="mb-2 text-[12px] font-extrabold text-[#1d2f57]">Análisis por día</p>
        <DailyLine points={trends.by_day} />
      </div>
    </div>
  )
}
