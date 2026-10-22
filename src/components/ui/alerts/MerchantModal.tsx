import { useState } from 'react'
import type { Community, CommunityNetwork } from '../../../data/networks'
import { api, ApiError, ApiUnavailable } from '../../../lib/api'
import { signInMerchant, signOutMerchant, useMerchant } from '../../../lib/merchantSession'
import { fieldClass, labelClass, Modal, primaryButton, secondaryButton } from '../Modal'
import { CameraSettingsPanel, openCameraStation } from './CameraSettingsPanel'

/**
 * «Mi comercio»: solicitar la verificación o entrar con el código de acceso.
 *
 * Flujo: el comercio pide la verificación → un moderador revisa sus datos y
 * la aprueba → el panel genera un código único que el moderador le entrega
 * por un canal de confianza → el comercio lo escribe aquí una vez.
 */
export function MerchantModal({
  network,
  community,
  onClose,
}: {
  network: CommunityNetwork
  community: Community | null
  onClose: () => void
}) {
  const merchant = useMerchant()
  const [tab, setTab] = useState<'codigo' | 'solicitud'>(merchant ? 'codigo' : 'solicitud')

  return (
    <Modal
      title="Mi comercio en la red"
      subtitle="Los comercios verificados publican alertas y mensajes con su nombre y la insignia de verificado."
      onClose={onClose}
      width={560}
    >
      {merchant ? (
        <SignedIn onClose={onClose} />
      ) : (
        <>
          <div className="mb-4 flex gap-1 rounded-full bg-[#eef4ff] p-1">
            {(
              [
                ['solicitud', 'Solicitar verificación'],
                ['codigo', 'Ya tengo mi código'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 rounded-full px-3 py-1.5 text-[12px] font-bold ${
                  tab === id ? 'bg-white text-[#1d2f57] shadow-sm' : 'text-[#5d76a6]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === 'solicitud' ? (
            <RequestForm network={network} community={community} onDone={() => setTab('codigo')} />
          ) : (
            <CodeForm />
          )}
        </>
      )}
    </Modal>
  )
}

function SignedIn({ onClose }: { onClose: () => void }) {
  const merchant = useMerchant()!
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-[#e4f7ee] p-4">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#2fb87c] text-[18px] text-white">✓</span>
        <div>
          <p className="text-[14px] font-extrabold text-[#1d2f57]">{merchant.name}</p>
          <p className="text-[11.5px] font-semibold text-[#1d7a53]">{merchant.business} · comercio verificado</p>
        </div>
      </div>
      <p className="text-[11.5px] leading-relaxed font-medium text-[#6b81ad]">
        Sus alertas y mensajes salen con su nombre. No comparta su código: quien lo tenga puede publicar a nombre
        de su comercio. Si lo perdió o cree que alguien más lo tiene, pida uno nuevo a los moderadores.
      </p>
      <CameraSettingsPanel
        onOpenStation={() => {
          onClose()
          openCameraStation()
        }}
      />
      <div className="flex justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            signOutMerchant()
            onClose()
          }}
          className={secondaryButton}
        >
          Cerrar sesión en este equipo
        </button>
        <button type="button" onClick={onClose} className={primaryButton}>
          Listo
        </button>
      </div>
    </div>
  )
}

function CodeForm() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    setSending(true)
    setError('')
    try {
      await signInMerchant(code)
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'El código no es válido o su comercio aún no fue aprobado.'
          : err instanceof ApiError && err.status === 429
            ? 'Demasiados intentos. Espere un minuto.'
            : err instanceof Error
              ? err.message
              : 'No se pudo comprobar el código.',
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className={labelClass}>Código de acceso</span>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onKeyDown={(event) => event.key === 'Enter' && code.trim().length >= 6 && submit()}
          placeholder="RS-XXXX-XXXX"
          autoComplete="off"
          className={`${fieldClass} font-mono tracking-[0.12em]`}
        />
      </label>
      <p className="text-[10.5px] font-medium text-[#8aa0c4]">
        Se lo entrega un moderador de la red cuando aprueba su comercio. Nunca se lo pedirán por mensaje ni por
        llamada.
      </p>
      {error && <p className="rounded-xl bg-[#fff1f4] px-3 py-2 text-[11.5px] font-semibold text-[#c2274a]">{error}</p>}
      <div className="flex justify-end">
        <button type="button" onClick={submit} disabled={sending || code.trim().length < 6} className={primaryButton}>
          {sending ? 'Comprobando…' : 'Entrar como comercio'}
        </button>
      </div>
    </div>
  )
}

function RequestForm({
  network,
  community,
  onDone,
}: {
  network: CommunityNetwork
  community: Community | null
  onDone: () => void
}) {
  const shops = community?.businesses ?? []
  const [shopId, setShopId] = useState(shops[0]?.id ?? 'otro')
  const [name, setName] = useState('')
  const [business, setBusiness] = useState('')
  const [nit, setNit] = useState('')
  const [contact, setContact] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const shop = shops.find((item) => item.id === shopId)
  const finalName = shop ? shop.name : name.trim()
  const finalBusiness = shop ? shop.business : business.trim()

  const submit = async () => {
    setSending(true)
    setError('')
    try {
      await api.requestVerification({
        name: finalName,
        business: finalBusiness,
        nit: nit.trim() || undefined,
        contact: contact.trim() || undefined,
        network_id: network.id,
        community_id: community?.id,
      })
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiUnavailable || err instanceof Error ? err.message : 'No se pudo enviar la solicitud.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-3">
        <p className="rounded-2xl bg-[#e4f7ee] p-4 text-[12.5px] font-semibold text-[#1d7a53]">
          ✓ Solicitud enviada para «{finalName}». Un moderador de la red revisará sus datos y le entregará su código de
          acceso por un canal de confianza.
        </p>
        <div className="flex justify-end">
          <button type="button" onClick={onDone} className={primaryButton}>
            Ya tengo mi código
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className={labelClass}>Su comercio en {community?.name ?? network.neighborhood}</span>
        <select value={shopId} onChange={(event) => setShopId(event.target.value)} className={fieldClass}>
          {shops.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.business}
            </option>
          ))}
          <option value="otro">Otro comercio (escribir el nombre)</option>
        </select>
      </label>
      {!shop && (
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={fieldClass} placeholder="Nombre del comercio" value={name} onChange={(event) => setName(event.target.value)} />
          <input className={fieldClass} placeholder="Tipo (Panadería, Farmacia…)" value={business} onChange={(event) => setBusiness(event.target.value)} />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>NIT o RUT (opcional)</span>
          <input className={fieldClass} value={nit} maxLength={20} onChange={(event) => setNit(event.target.value)} />
        </label>
        <label className="block">
          <span className={labelClass}>Contacto para verificarlo</span>
          <input
            className={fieldClass}
            value={contact}
            maxLength={120}
            placeholder="Teléfono o correo"
            onChange={(event) => setContact(event.target.value)}
          />
        </label>
      </div>
      <p className="text-[10.5px] font-medium text-[#8aa0c4]">
        Estos datos sólo los ven los moderadores, para comprobar que el comercio existe. No se publican.
      </p>
      {error && <p className="rounded-xl bg-[#fff1f4] px-3 py-2 text-[11.5px] font-semibold text-[#c2274a]">{error}</p>}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={sending || finalName.length < 3 || finalBusiness.length < 3}
          className={primaryButton}
        >
          {sending ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </div>
    </div>
  )
}
