import { useState } from 'react'
import { api, ApiUnavailable } from '../../../lib/api'

type Result = Awaited<ReturnType<typeof api.lookup>>['results'][number]

/** «¿Este número o enlace ya fue reportado en la red?» */
export function EntityLookup({ className = '' }: { className?: string }) {
  const [value, setValue] = useState('')
  const [results, setResults] = useState<Result[] | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const search = async () => {
    if (value.trim().length < 3) return
    setLoading(true)
    setError('')
    try {
      setResults((await api.lookup(value.trim())).results)
    } catch (err) {
      setResults(null)
      setError(err instanceof ApiUnavailable ? 'Sin conexión con la red.' : err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`rounded-2xl border border-[#dbe6f7] bg-white/80 p-3 ${className}`}>
      <p className="text-[9.5px] font-bold tracking-[0.14em] text-[#7a90b8] uppercase">Consultar en la red</p>
      <p className="mt-1 text-[10.5px] font-medium text-[#8aa0c4]">¿Un número, cuenta o enlace ya fue reportado?</p>
      <div className="mt-2 flex gap-1.5">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && search()}
          placeholder="300 123 4567 o enlace"
          className="h-9 min-w-0 flex-1 rounded-full border border-[#dbe6f7] bg-[#f7faff] px-3 text-[11.5px] font-medium text-[#2c4478] outline-none focus:border-[#9dbdf0]"
          aria-label="Número, cuenta o enlace a consultar"
        />
        <button
          type="button"
          onClick={search}
          disabled={loading}
          className="h-9 shrink-0 rounded-full bg-[#1d2f57] px-3 text-[11px] font-bold text-white disabled:opacity-50"
        >
          {loading ? '…' : 'Buscar'}
        </button>
      </div>
      {error && <p className="mt-2 text-[10.5px] font-semibold text-[#c2274a]">{error}</p>}
      {results?.map((result) => (
        <div
          key={`${result.kind}-${result.masked}`}
          className={`mt-2 rounded-xl px-3 py-2 text-[11px] font-semibold ${
            result.reports ? 'bg-[#ffe0e6] text-[#c2274a]' : 'bg-[#e4f7ee] text-[#1d7a53]'
          }`}
        >
          {result.kind === 'enlace' ? result.domain : result.masked}:{' '}
          {result.reports
            ? `${result.reports} reporte(s) en la red${result.categories.length ? ` · ${result.categories.join(', ')}` : ''}`
            : 'sin reportes en la red (no significa que sea seguro)'}
        </div>
      ))}
    </div>
  )
}
