import { useState } from 'react'
import type { AnalysisResult } from '../../../lib/api'

/**
 * Detalle del análisis bajo la respuesta del asistente: texto extraído de
 * las capturas, enlaces, comprobante, amenazas e identificadores reportados.
 */

const RISK_STYLE = {
  alto: 'bg-[#ffe0e6] text-[#c2274a] ring-[#f4c4cf]',
  medio: 'bg-[#fff1d8] text-[#b06f13] ring-[#f2d38a]',
  bajo: 'bg-[#e4f7ee] text-[#1d7a53] ring-[#bfe8d2]',
} as const

const RECEIPT_COPY = {
  falso: { label: 'Comprobante con señales de falsificación', className: 'bg-[#ffe0e6] text-[#c2274a]' },
  dudoso: { label: 'Comprobante dudoso: verifique en su app', className: 'bg-[#fff1d8] text-[#b06f13]' },
  sin_indicios: { label: 'Sin indicios de edición (no prueba el pago)', className: 'bg-[#eef4ff] text-[#3d568e]' },
  no_aplica: { label: '', className: '' },
} as const

const ENGINE_LABEL = {
  claude: 'Analizado con IA (Claude)',
  gemini: 'Analizado con IA (Gemini)',
  local: 'Analizado con el motor local',
  navegador: 'Analizado en su navegador (sin conexión)',
} as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 border-t border-white/70 pt-2.5">
      <p className="text-[9.5px] font-extrabold tracking-[0.12em] text-[#7a90b8] uppercase">{title}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

export function EmergencyBanner() {
  return (
    <div className="mb-2 rounded-xl bg-[#e23b5f] px-3 py-2 text-[11.5px] font-bold text-white">
      ⚠ Posible riesgo para la vida. Si está en peligro, llame ya al 123 (Policía). Extorsión: 165 (GAULA).
    </div>
  )
}

export function AnalysisDetails({ analysis }: { analysis: AnalysisResult }) {
  const [showText, setShowText] = useState(false)
  const reported = analysis.entities.filter((entity) => entity.reported > 0)
  const extracted = analysis.transcript || analysis.extracted_text

  return (
    <>
      {analysis.threats?.detected && (
        <Section title="Amenazas detectadas en la imagen">
          <p className="text-[11.5px] font-bold text-[#c2274a]">{analysis.threats.summary}</p>
          <ul className="mt-1 space-y-0.5">
            {analysis.threats.items.map((item, index) => (
              <li key={index} className="text-[11px] font-medium text-[#3d568e]">
                · <b className="capitalize">{item.label.replace(/_/g, ' ')}</b> — {item.description} (confianza {item.confidence})
              </li>
            ))}
          </ul>
        </Section>
      )}

      {analysis.receipt?.is_receipt && analysis.receipt.verdict !== 'no_aplica' && (
        <Section title="Comprobante de pago">
          <p className={`rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold ${RECEIPT_COPY[analysis.receipt.verdict].className}`}>
            {RECEIPT_COPY[analysis.receipt.verdict].label}
            {analysis.receipt.amount && ` · ${analysis.receipt.amount}`}
            {analysis.receipt.bank && ` · ${analysis.receipt.bank}`}
          </p>
          <ul className="mt-1 space-y-0.5">
            {analysis.receipt.reasons.map((reason) => (
              <li key={reason} className="text-[11px] font-medium text-[#3d568e]">
                · {reason}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {analysis.links.length > 0 && (
        <Section title={`Enlaces (${analysis.links.length})`}>
          <ul className="space-y-1.5">
            {analysis.links.map((link) => (
              <li key={link.url} className={`rounded-lg px-2.5 py-1.5 ring-1 ${RISK_STYLE[link.risk]}`}>
                <span className="block truncate text-[11px] font-extrabold">
                  {link.domain} · riesgo {link.risk}
                </span>
                <span className="block text-[10.5px] font-medium opacity-90">{link.reasons.slice(0, 3).join(' ')}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[10px] font-medium text-[#8aa0c4]">No abra los enlaces de riesgo. Escriba usted la dirección oficial.</p>
        </Section>
      )}

      {reported.length > 0 && (
        <Section title="Ya reportado en la red">
          <ul className="flex flex-wrap gap-1">
            {reported.map((entity) => (
              <li key={entity.masked} className="rounded-full bg-[#ffe0e6] px-2 py-0.5 text-[10.5px] font-bold text-[#c2274a]">
                {entity.kind === 'enlace' ? entity.domain : entity.masked} · {entity.reported} reporte(s)
              </li>
            ))}
          </ul>
        </Section>
      )}

      {extracted && (
        <Section title={analysis.transcript ? 'Transcripción del audio' : 'Texto leído de la captura'}>
          <button type="button" onClick={() => setShowText((value) => !value)} className="text-[11px] font-bold text-[#5b7cf5]">
            {showText ? 'Ocultar texto' : 'Ver texto extraído'}
          </button>
          {showText && (
            <pre className="mt-1.5 max-h-[180px] overflow-auto rounded-lg bg-white/80 p-2 text-[10.5px] leading-relaxed whitespace-pre-wrap text-[#3d568e]">
              {extracted}
            </pre>
          )}
        </Section>
      )}

      {analysis.notes?.map((note) => (
        <p key={note} className="mt-2 text-[10.5px] font-medium text-[#b06f13]">
          {note}
        </p>
      ))}

      <p className="mt-2.5 text-[9.5px] font-semibold text-[#8aa0c4]">
        {ENGINE_LABEL[analysis.engine]} · {analysis.category_label}
        {analysis.engine_note && analysis.engine !== 'claude' ? ` · ${analysis.engine_note}` : ''}
      </p>
    </>
  )
}
