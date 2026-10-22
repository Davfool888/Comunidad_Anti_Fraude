import { useMemo, useState } from 'react'
import type { AnalysisResult } from '../../../lib/api'
import { Modal, primaryButton, secondaryButton } from '../Modal'

/**
 * Genera el resumen del caso para denunciar ante las autoridades.
 *
 * El documento se arma en el navegador: no se envía a ningún servidor. La
 * persona lo copia o lo imprime (Guardar como PDF) y lo adjunta a la
 * denuncia junto con las capturas originales.
 */

const CHANNELS = [
  {
    name: 'A Denunciar (Policía y Fiscalía)',
    detail: 'Denuncia virtual de delitos informáticos, estafa y extorsión.',
    url: 'https://adenunciar.policia.gov.co',
  },
  {
    name: 'CAI Virtual de la Policía',
    detail: 'Orientación y reporte de incidentes cibernéticos.',
    url: 'https://caivirtual.policia.gov.co',
  },
  {
    name: 'Superintendencia de Industria y Comercio',
    detail: 'Uso indebido de datos personales y fraudes al consumidor.',
    url: 'https://www.sic.gov.co',
  },
]

function buildReport(analysis: AnalysisResult, original: string, place: string) {
  const date = new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })
  const lines = [
    'RESUMEN DEL CASO PARA DENUNCIA',
    `Generado por la Red Segura de Comercios · ${date}`,
    place ? `Lugar: ${place}` : '',
    '',
    `Modalidad identificada: ${analysis.category_label}`,
    `Resultado del análisis: ${analysis.headline} (riesgo ${analysis.score}%)`,
    analysis.channel !== 'desconocido' ? `Canal: ${analysis.channel}` : '',
    '',
    'DESCRIPCIÓN',
    analysis.summary,
    '',
    'SEÑALES DETECTADAS',
    ...analysis.signals.map((signal) => `- ${signal.label}: ${signal.detail}`),
  ]
  if (analysis.links.length) {
    lines.push('', 'ENLACES INVOLUCRADOS', ...analysis.links.map((link) => `- ${link.url} (riesgo ${link.risk})`))
  }
  const ids = analysis.entities.filter((entity) => entity.kind !== 'enlace')
  if (ids.length) {
    lines.push(
      '',
      'IDENTIFICADORES (enmascarados; aporte los datos completos de sus capturas)',
      ...ids.map((entity) => `- ${entity.kind}: ${entity.masked}`),
    )
  }
  if (analysis.receipt?.is_receipt) {
    lines.push('', `COMPROBANTE: ${analysis.receipt.verdict}`, ...analysis.receipt.reasons.map((reason) => `- ${reason}`))
  }
  if (analysis.threats?.detected) {
    lines.push('', 'AMENAZAS EN LA IMAGEN', ...analysis.threats.items.map((item) => `- ${item.label}: ${item.description}`))
  }
  const message = analysis.transcript || original || analysis.extracted_text
  if (message) lines.push('', 'MENSAJE RECIBIDO (texto literal)', message)
  lines.push(
    '',
    'EVIDENCIA QUE DEBE ADJUNTAR',
    '- Capturas originales del chat o SMS, mostrando el número y la fecha',
    '- Comprobantes y movimientos bancarios relacionados',
    '- Grabaciones o notas de voz, si las hay',
  )
  return lines.filter((line, index, all) => !(line === '' && all[index - 1] === '')).join('\n')
}

export function ReportModal({
  analysis,
  original,
  place,
  onClose,
}: {
  analysis: AnalysisResult
  original: string
  place: string
  onClose: () => void
}) {
  const report = useMemo(() => buildReport(analysis, original, place), [analysis, original, place])
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const print = () => {
    const win = window.open('', '_blank', 'width=800,height=900')
    if (!win) return
    const doc = win.document
    doc.title = 'Resumen del caso'
    const pre = doc.createElement('pre')
    pre.textContent = report // textContent: el contenido del mensaje nunca se interpreta como HTML
    pre.style.cssText = 'font: 13px/1.55 system-ui, sans-serif; white-space: pre-wrap; margin: 40px;'
    doc.body.appendChild(pre)
    win.print()
  }

  return (
    <Modal title="Denunciar el caso" subtitle="Resumen listo para adjuntar a la denuncia" onClose={onClose} width={760}>
      <div className="grid gap-4 md:grid-cols-[1fr_250px]">
        <pre className="max-h-[440px] overflow-auto rounded-2xl bg-[#f7faff] p-4 text-[11.5px] leading-relaxed whitespace-pre-wrap text-[#2c4478] ring-1 ring-[#dbe6f7]">
          {report}
        </pre>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className={primaryButton}>
              {copied ? '✓ Copiado' : 'Copiar texto'}
            </button>
            <button type="button" onClick={print} className={secondaryButton}>
              Imprimir / PDF
            </button>
          </div>
          <p className="text-[9.5px] font-bold tracking-[0.14em] text-[#7a90b8] uppercase">Dónde denunciar</p>
          {CHANNELS.map((channel) => (
            <a
              key={channel.url}
              href={channel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-[#dbe6f7] bg-white px-3 py-2 transition-colors hover:bg-[#eef4ff]"
            >
              <span className="block text-[11.5px] font-extrabold text-[#1d2f57]">{channel.name} ↗</span>
              <span className="block text-[10px] font-medium text-[#8aa0c4]">{channel.detail}</span>
            </a>
          ))}
          <div className="rounded-xl bg-[#fff1f4] px-3 py-2 text-[10.5px] font-semibold text-[#c2274a]">
            Emergencia: 123 · Extorsión: 165 (GAULA). Si compartió claves, llame ya a la línea oficial de su banco.
          </div>
        </div>
      </div>
    </Modal>
  )
}
