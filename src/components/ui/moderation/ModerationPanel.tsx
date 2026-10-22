import { useCallback, useEffect, useMemo, useState } from 'react'
import { NETWORKS } from '../../../data/networks'
import {
  api,
  ApiError,
  ApiUnavailable,
  moderationApi,
  type CommunityAlert,
  type Merchant,
  type Modality,
  type Trends,
} from '../../../lib/api'
import { AlertCard } from '../alerts/AlertCard'
import { fieldClass, primaryButton, secondaryButton } from '../Modal'
import { TrendCharts } from './TrendCharts'

/**
 * Panel de la red (moderadores).
 *
 *  · Alertas: verificar o rechazar. Rechazar retira los números y enlaces
 *    asociados de la base de reportes, para no acusar a nadie sin pruebas.
 *  · Comercios: aprobar las solicitudes de verificación.
 *  · Tendencias: qué modalidades golpean más y dónde.
 *  · Retos: genera fichas nuevas del Centro de aprendizaje a partir de los
 *    reportes de la comunidad.
 *
 * El token se guarda sólo en la sesión del navegador (sessionStorage).
 */

const TOKEN_KEY = 'red-segura:moderator-token'
type Tab = 'alertas' | 'comercios' | 'tendencias' | 'retos'

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

function errorText(error: unknown) {
  if (error instanceof ApiUnavailable) return 'El servidor de la red no está disponible (npm run dev:api).'
  return error instanceof Error ? error.message : 'Error inesperado.'
}

export function ModerationPanel() {
  const [token, setToken] = useState(readToken)
  const [input, setInput] = useState('')
  const [authError, setAuthError] = useState('')
  const [tab, setTab] = useState<Tab>('alertas')

  const login = async () => {
    setAuthError('')
    try {
      await moderationApi(input.trim()).check()
      try {
        sessionStorage.setItem(TOKEN_KEY, input.trim())
      } catch {
        /* sin almacenamiento: vale para esta vista */
      }
      setToken(input.trim())
    } catch (error) {
      setAuthError(error instanceof ApiError && error.status === 401 ? 'Token incorrecto.' : errorText(error))
    }
  }

  const logout = () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      /* nada que borrar */
    }
    setToken('')
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-[420px] rounded-[26px] border border-white/70 bg-white/80 p-6 shadow-[0_34px_70px_-32px_rgba(25,45,95,.55)]">
        <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">Panel de la red</p>
        <h2 className="mt-1 text-[22px] font-extrabold text-[#1d2f57]">Acceso de moderadores</h2>
        <p className="mt-1 text-[12px] font-medium text-[#6b81ad]">
          Escriba el token de moderación (variable MODERATOR_TOKEN del servidor).
        </p>
        <input
          type="password"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && login()}
          className={`${fieldClass} mt-4`}
          placeholder="Token"
          autoComplete="off"
          aria-label="Token de moderación"
        />
        {authError && <p className="mt-2 text-[11.5px] font-semibold text-[#c2274a]">{authError}</p>}
        <button type="button" onClick={login} disabled={!input.trim()} className={`${primaryButton} mt-4 w-full`}>
          Entrar
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-bold tracking-[0.18em] text-[#7a90b8] uppercase">Panel de la red</p>
          <h2 className="mt-1 text-[26px] leading-tight font-extrabold text-[#1d2f57]">Moderación y tendencias</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-white/80 p-1 ring-1 ring-[#dbe6f7]">
            {(['alertas', 'comercios', 'tendencias', 'retos'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTab(option)}
                className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-bold capitalize ${
                  tab === option ? 'bg-gradient-to-r from-[#5b7cf5] to-[#9b6ef0] text-white' : 'text-[#5d76a6]'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <button type="button" onClick={logout} className={secondaryButton}>
            Salir
          </button>
        </div>
      </div>

      {tab === 'alertas' && <AlertsTab token={token} />}
      {tab === 'comercios' && <MerchantsTab token={token} />}
      {tab === 'tendencias' && <TrendsTab />}
      {tab === 'retos' && <ChallengesTab token={token} />}
    </div>
  )
}

function AlertsTab({ token }: { token: string }) {
  const client = useMemo(() => moderationApi(token), [token])
  const [alerts, setAlerts] = useState<CommunityAlert[]>([])
  const [filter, setFilter] = useState<'' | CommunityAlert['status']>('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setAlerts(await client.alerts(filter || undefined))
      setError('')
    } catch (err) {
      setError(errorText(err))
    }
  }, [client, filter])

  useEffect(() => {
    void load()
  }, [load])

  const review = async (alert: CommunityAlert, status: 'verificada' | 'rechazada') => {
    try {
      const updated = await client.reviewAlert(alert.id, { status })
      setAlerts((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      setError(errorText(err))
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(
          [
            ['', 'Todas'],
            ['pendiente', 'En revisión'],
            ['sin_verificar', 'Sin verificar'],
            ['verificada', 'Verificadas'],
            ['rechazada', 'Rechazadas'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
              filter === value ? 'bg-[#1d2f57] text-white' : 'bg-white text-[#5d76a6] ring-1 ring-[#dbe6f7]'
            }`}
          >
            {label}
          </button>
        ))}
        <button type="button" onClick={load} className="ml-auto text-[11px] font-bold text-[#5b7cf5]">
          Actualizar
        </button>
      </div>
      {error && <p className="mb-3 text-[12px] font-semibold text-[#c2274a]">{error}</p>}
      {alerts.length === 0 && !error && <p className="text-[12px] font-medium text-[#8aa0c4]">No hay alertas con este filtro.</p>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-2xl bg-white/70 p-2 ring-1 ring-[#dbe6f7]">
            <AlertCard alert={alert} />
            <div className="mt-2 flex items-center gap-2 px-1 pb-1">
              <span className="text-[10px] font-semibold text-[#8aa0c4]">
                {NETWORKS.find((network) => network.id === alert.network_id)?.neighborhood ?? alert.network_id}
              </span>
              <button
                type="button"
                onClick={() => review(alert, 'verificada')}
                disabled={alert.status === 'verificada'}
                className="ml-auto rounded-full bg-[#2fb87c] px-3 py-1 text-[11px] font-bold text-white disabled:opacity-40"
              >
                Verificar
              </button>
              <button
                type="button"
                onClick={() => review(alert, 'rechazada')}
                disabled={alert.status === 'rechazada'}
                className="rounded-full bg-[#e23b5f] px-3 py-1 text-[11px] font-bold text-white disabled:opacity-40"
              >
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MerchantsTab({ token }: { token: string }) {
  const client = useMemo(() => moderationApi(token), [token])
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', business: '', nit: '', network_id: NETWORKS[0]?.id ?? '' })
  const [sent, setSent] = useState('')

  const load = useCallback(async () => {
    try {
      setMerchants(await client.merchants())
    } catch (err) {
      setError(errorText(err))
    }
  }, [client])

  useEffect(() => {
    void load()
  }, [load])

  const review = async (merchant: Merchant, status: Merchant['status']) => {
    try {
      const updated = await client.reviewMerchant(merchant.id, status)
      setMerchants((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      setError(errorText(err))
    }
  }

  const register = async () => {
    try {
      await api.requestVerification({ ...form, nit: form.nit || undefined })
      setSent(`Solicitud de «${form.name}» registrada.`)
      setForm((current) => ({ ...current, name: '', business: '', nit: '' }))
      void load()
    } catch (err) {
      setError(errorText(err))
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-2xl border border-[#dbe6f7] bg-white">
        <table className="w-full text-left text-[11.5px]">
          <thead className="bg-[#f7faff] text-[10px] font-extrabold tracking-[0.1em] text-[#7a90b8] uppercase">
            <tr>
              <th className="px-3 py-2">Comercio</th>
              <th className="px-3 py-2">Localidad</th>
              <th className="px-3 py-2">NIT</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {merchants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-[#8aa0c4]">
                  No hay solicitudes de verificación.
                </td>
              </tr>
            )}
            {merchants.map((merchant) => (
              <tr key={merchant.id} className="border-t border-[#eef3fb] font-medium text-[#2c4478]">
                <td className="px-3 py-2">
                  <b>{merchant.name}</b>
                  <span className="block text-[10px] text-[#8aa0c4]">{merchant.business}</span>
                </td>
                <td className="px-3 py-2">
                  {NETWORKS.find((network) => network.id === merchant.network_id)?.neighborhood ?? merchant.network_id}
                </td>
                <td className="px-3 py-2">{merchant.nit ?? '—'}</td>
                <td className="px-3 py-2 capitalize">{merchant.status}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <button type="button" onClick={() => review(merchant, 'verificado')} className="mr-1 font-bold text-[#1d7a53]">
                    Aprobar
                  </button>
                  <button type="button" onClick={() => review(merchant, 'rechazado')} className="font-bold text-[#c2274a]">
                    Rechazar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {error && <p className="px-3 py-2 text-[11.5px] font-semibold text-[#c2274a]">{error}</p>}
      </div>

      <div className="space-y-2 rounded-2xl border border-[#dbe6f7] bg-white p-4">
        <p className="text-[12px] font-extrabold text-[#1d2f57]">Registrar comercio para verificación</p>
        <input className={fieldClass} placeholder="Nombre del comercio" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className={fieldClass} placeholder="Tipo (Panadería, Farmacia…)" value={form.business} onChange={(event) => setForm({ ...form, business: event.target.value })} />
        <input className={fieldClass} placeholder="NIT (opcional)" value={form.nit} onChange={(event) => setForm({ ...form, nit: event.target.value })} />
        <select className={fieldClass} value={form.network_id} onChange={(event) => setForm({ ...form, network_id: event.target.value })}>
          {NETWORKS.map((network) => (
            <option key={network.id} value={network.id}>
              {network.neighborhood}
            </option>
          ))}
        </select>
        <button type="button" onClick={register} disabled={form.name.length < 3 || form.business.length < 3} className={`${primaryButton} w-full`}>
          Registrar
        </button>
        {sent && <p className="text-[11px] font-semibold text-[#1d7a53]">{sent}</p>}
      </div>
    </div>
  )
}

function TrendsTab() {
  const [trends, setTrends] = useState<Trends | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    api
      .trends()
      .then(setTrends)
      .catch((err: unknown) => setError(errorText(err)))
  }, [])
  if (error) return <p className="text-[12px] font-semibold text-[#c2274a]">{error}</p>
  if (!trends) return <p className="text-[12px] font-medium text-[#8aa0c4]">Cargando tendencias…</p>
  return <TrendCharts trends={trends} />
}

function ChallengesTab({ token }: { token: string }) {
  const client = useMemo(() => moderationApi(token), [token])
  const [result, setResult] = useState<{ created: Modality[]; skipped: string[] } | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setRunning(true)
    setError('')
    try {
      setResult(await client.generateModalities())
    } catch (err) {
      setError(errorText(err))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="max-w-[760px] rounded-2xl border border-[#dbe6f7] bg-white p-5">
      <p className="text-[13px] font-extrabold text-[#1d2f57]">Actualizar el Centro de aprendizaje</p>
      <p className="mt-1 text-[12px] font-medium text-[#6b81ad]">
        Revisa las modalidades más reportadas por la comunidad en los últimos 30 días y crea una ficha con su
        reto para las que aún no tienen una. Con la IA activa, la ficha la redacta Claude a partir de los
        reportes (sin datos personales).
      </p>
      <button type="button" onClick={generate} disabled={running} className={`${primaryButton} mt-4`}>
        {running ? 'Generando…' : 'Generar retos desde los reportes'}
      </button>
      {error && <p className="mt-3 text-[12px] font-semibold text-[#c2274a]">{error}</p>}
      {result && (
        <div className="mt-4 space-y-2 text-[12px]">
          {result.created.map((item) => (
            <p key={item.slug} className="rounded-xl bg-[#e4f7ee] px-3 py-2 font-semibold text-[#1d7a53]">
              ✓ Nuevo reto: {item.title}
            </p>
          ))}
          {result.skipped.map((reason) => (
            <p key={reason} className="rounded-xl bg-[#f7faff] px-3 py-2 font-medium text-[#6b81ad]">
              {reason}
            </p>
          ))}
          {result.created.length === 0 && result.skipped.length === 0 && (
            <p className="font-medium text-[#8aa0c4]">
              Aún no hay modalidades con suficientes reportes (mínimo 2 alertas en 30 días).
            </p>
          )}
        </div>
      )}
    </div>
  )
}
