import { qrSvg } from '../qr'
import { getSettings, nowStamp } from './db'

export type PrintColumn = { key: string; label: string }

export type PrintDocOptions = {
  title: string
  subtitle?: string
  docNo?: string
  paper: 'A4' | 'A3'
  landscape: boolean
  columns: PrintColumn[]
  rows: any[]
  /** extra meta lines under the title (filters applied, period, etc.) */
  meta?: string[]
  /** payload encoded into the document QR (defaults to docNo + title) */
  qrPayload?: string
  /** revision line shown in the footer block */
  revision?: string
  /** open the window without triggering the print dialog */
  previewOnly?: boolean
}

const ROWS_PER_PAGE: Record<string, number> = {
  'A4-portrait': 30,
  'A4-landscape': 20,
  'A3-portrait': 52,
  'A3-landscape': 34
}

function esc(s: any): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out.length ? out : [[]]
}

/** Assemble the printable HTML document (self-contained, offline-safe). */
export async function buildPrintHtml(opts: PrintDocOptions): Promise<string> {
  const settings = await getSettings()
  const company = settings.company_name || 'Safetech Precast Building Manufacturing LLC'
  const address = settings.company_address || ''
  const phone = settings.company_phone || ''
  const email = settings.company_email || ''
  const footerNote = settings.report_footer || 'System-generated document.'

  const orientation = opts.landscape ? 'landscape' : 'portrait'
  const perPage = ROWS_PER_PAGE[`${opts.paper}-${orientation}`] || 28
  const pages = chunk(opts.rows, perPage)
  const generatedAt = nowStamp()
  const docNo = opts.docNo || `DOC-${generatedAt.replace(/[^0-9]/g, '').slice(0, 12)}`
  const qr = qrSvg(opts.qrPayload || `${docNo} | ${opts.title} | ${generatedAt}`, { size: 72, margin: 1 })

  const headCells = opts.columns.map(c => `<th>${esc(c.label)}</th>`).join('')

  const pageHtml = pages.map((pageRows, pi) => {
    const bodyRows = pageRows.map((r, ri) => {
      const cells = opts.columns.map(c => `<td>${esc(r[c.key])}</td>`).join('')
      return `<tr><td class="idx">${pi * perPage + ri + 1}</td>${cells}</tr>`
    }).join('')
    const isLast = pi === pages.length - 1

    return `
    <section class="sheet">
      <header class="doc-head">
        <div class="brand">
          <div class="brand-mark">ST</div>
          <div>
            <div class="co-name">${esc(company)}</div>
            <div class="co-sub">${esc(address)}</div>
            <div class="co-sub">${esc(phone)}${phone && email ? ' • ' : ''}${esc(email)}</div>
          </div>
        </div>
        <div class="doc-title-block">
          <div class="doc-title">${esc(opts.title)}</div>
          ${opts.subtitle ? `<div class="doc-sub">${esc(opts.subtitle)}</div>` : ''}
          ${(opts.meta || []).map(mLine => `<div class="doc-meta">${esc(mLine)}</div>`).join('')}
        </div>
        <div class="doc-qr">
          ${qr}
          <div class="doc-no">${esc(docNo)}</div>
          <div class="barcode">${esc(docNo)}</div>
        </div>
      </header>

      <table class="grid">
        <thead><tr><th class="idx">#</th>${headCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>

      ${isLast ? `
      <div class="subtotal-line">TOTAL RECORDS: ${opts.rows.length}</div>
      <div class="sig-row">
        <div class="sig"><div class="sig-line"></div>Prepared By</div>
        <div class="sig"><div class="sig-line"></div>Checked By</div>
        <div class="sig"><div class="sig-line"></div>Approved By</div>
      </div>
      <div class="rev-line">Revision: ${esc(opts.revision || 'R0 — Initial issue')} &nbsp;•&nbsp; Generated: ${generatedAt} (GMT+4)</div>
      ` : `<div class="subtotal-line">PAGE SUBTOTAL (Carried Forward): ${(pi + 1) * perPage} records</div>`}

      <footer class="doc-foot">
        <span>${esc(footerNote)}</span>
        <span>Page ${pi + 1} of ${pages.length}</span>
      </footer>
    </section>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(opts.title)} — ${esc(docNo)}</title>
<link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
<style>
  @page { size: ${opts.paper} ${orientation}; margin: 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #f1f5f9; }
  .sheet {
    background: white; margin: 12px auto; padding: 10mm;
    width: ${opts.paper === 'A3' ? (opts.landscape ? '420mm' : '297mm') : (opts.landscape ? '297mm' : '210mm')};
    min-height: ${opts.paper === 'A3' ? (opts.landscape ? '297mm' : '420mm') : (opts.landscape ? '210mm' : '297mm')};
    box-shadow: 0 2px 12px rgba(0,0,0,.18); position: relative; display: flex; flex-direction: column;
    page-break-after: always;
  }
  .sheet:last-child { page-break-after: avoid; }
  .doc-head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #b91c1c; padding-bottom: 8px; margin-bottom: 10px; gap: 12px; }
  .brand { display: flex; gap: 10px; align-items: center; }
  .brand-mark { width: 46px; height: 46px; background: #0a0a0a; color: #ef4444; font-weight: 900; font-size: 18px; display: flex; align-items: center; justify-content: center; border-radius: 8px; letter-spacing: 1px; }
  .co-name { font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: .4px; }
  .co-sub { font-size: 8.5px; color: #555; }
  .doc-title-block { text-align: center; flex: 1; }
  .doc-title { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #b91c1c; }
  .doc-sub { font-size: 9.5px; color: #444; margin-top: 2px; }
  .doc-meta { font-size: 8.5px; color: #666; margin-top: 1px; }
  .doc-qr { text-align: center; }
  .doc-no { font-size: 8px; font-weight: 700; margin-top: 2px; font-family: monospace; }
  .barcode { font-family: 'Libre Barcode 128', monospace; font-size: 26px; line-height: 1; margin-top: 1px; }
  table.grid { width: 100%; border-collapse: collapse; font-size: 8.8px; }
  table.grid th { background: #111; color: #fff; text-transform: uppercase; font-size: 7.6px; letter-spacing: .4px; padding: 4px 5px; text-align: left; border: 1px solid #333; }
  table.grid td { border: 1px solid #cbd5e1; padding: 3.5px 5px; height: 18px; }
  table.grid tr:nth-child(even) td { background: #f8fafc; }
  td.idx, th.idx { width: 26px; text-align: center; color: #777; }
  .subtotal-line { margin-top: 8px; font-size: 9px; font-weight: 800; text-align: right; text-transform: uppercase; letter-spacing: .5px; }
  .sig-row { display: flex; gap: 24px; margin-top: 26px; }
  .sig { flex: 1; text-align: center; font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #444; }
  .sig-line { border-bottom: 1.2px solid #111; height: 32px; margin-bottom: 4px; }
  .rev-line { margin-top: 10px; font-size: 8px; color: #666; border-top: 1px dashed #cbd5e1; padding-top: 5px; }
  .doc-foot { margin-top: auto; padding-top: 8px; display: flex; justify-content: space-between; font-size: 8px; color: #888; border-top: 1px solid #e2e8f0; }
  @media print {
    body { background: white; }
    .sheet { box-shadow: none; margin: 0; width: auto; min-height: auto; }
  }
</style>
</head>
<body>${pageHtml}</body>
</html>`
}

/** Open the document in a new window; optionally fire the print dialog. */
export function openPrintWindow(html: string, autoPrint: boolean) {
  const win = window.open('', '_blank', 'width=1080,height=800')
  if (!win) {
    alert('Popup blocked — allow popups for this site to print documents.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  if (autoPrint) {
    win.onload = () => setTimeout(() => win.print(), 250)
  }
}

export async function printRegister(opts: PrintDocOptions) {
  const html = await buildPrintHtml(opts)
  openPrintWindow(html, !opts.previewOnly)
}

// ── Multi-section reports (DPR, DTPP, daily/weekly/monthly, QA, yard…) ──────

export type ReportSection = { heading: string; columns: PrintColumn[]; rows: any[] }

export async function printSectionsDoc(opts: {
  title: string
  subtitle?: string
  meta?: string[]
  kpis?: { label: string; value: string | number }[]
  sections: ReportSection[]
  paper?: 'A4' | 'A3'
  landscape?: boolean
  previewOnly?: boolean
}) {
  const settings = await getSettings()
  const company = settings.company_name || 'Safetech Precast Building Manufacturing LLC'
  const address = settings.company_address || ''
  const footerNote = settings.report_footer || 'System-generated document.'
  const generatedAt = nowStamp()
  const docNo = `RPT-${generatedAt.replace(/[^0-9]/g, '').slice(0, 12)}`
  const qr = qrSvg(`${docNo} | ${opts.title} | ${generatedAt}`, { size: 68, margin: 1 })
  const orientation = opts.landscape ? 'landscape' : 'portrait'

  const kpiHtml = (opts.kpis && opts.kpis.length) ? `
    <div class="kpis">${opts.kpis.map(k => `<div class="kpi"><div class="kv">${esc(k.value)}</div><div class="kl">${esc(k.label)}</div></div>`).join('')}</div>` : ''

  const sectionsHtml = opts.sections.map(s => `
    <div class="section">
      <div class="sec-head">${esc(s.heading)} <span class="sec-count">${s.rows.length} record(s)</span></div>
      <table class="grid">
        <thead><tr><th class="idx">#</th>${s.columns.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr></thead>
        <tbody>
          ${s.rows.length === 0
            ? `<tr><td colspan="${s.columns.length + 1}" class="empty">No records for this period</td></tr>`
            : s.rows.map((r, i) => `<tr><td class="idx">${i + 1}</td>${s.columns.map(c => `<td>${esc(r[c.key])}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('')

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${esc(opts.title)} — ${esc(docNo)}</title>
<link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
<style>
  @page { size: ${opts.paper || 'A4'} ${orientation}; margin: 10mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #f1f5f9; padding: 12px; }
  .doc { background: white; max-width: ${opts.paper === 'A3' ? (opts.landscape ? '420mm' : '297mm') : (opts.landscape ? '297mm' : '210mm')}; margin: 0 auto; padding: 10mm; box-shadow: 0 2px 12px rgba(0,0,0,.18); }
  .doc-head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #b91c1c; padding-bottom: 8px; margin-bottom: 10px; gap: 12px; }
  .brand { display: flex; gap: 10px; align-items: center; }
  .brand-mark { width: 46px; height: 46px; background: #0a0a0a; color: #ef4444; font-weight: 900; font-size: 18px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
  .co-name { font-weight: 900; font-size: 13px; text-transform: uppercase; }
  .co-sub { font-size: 8.5px; color: #555; }
  .doc-title-block { text-align: center; flex: 1; }
  .doc-title { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #b91c1c; }
  .doc-sub { font-size: 9.5px; color: #444; margin-top: 2px; }
  .doc-meta { font-size: 8.5px; color: #666; margin-top: 1px; }
  .doc-qr { text-align: center; }
  .doc-no { font-size: 8px; font-weight: 700; margin-top: 2px; font-family: monospace; }
  .barcode { font-family: 'Libre Barcode 128', monospace; font-size: 24px; line-height: 1; }
  .kpis { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .kpi { flex: 1; min-width: 90px; border: 1.4px solid #111; border-radius: 8px; padding: 6px 10px; text-align: center; }
  .kv { font-size: 16px; font-weight: 900; color: #b91c1c; }
  .kl { font-size: 7px; font-weight: 800; text-transform: uppercase; color: #555; letter-spacing: .5px; }
  .section { margin-bottom: 14px; page-break-inside: avoid; }
  .sec-head { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .8px; background: #111; color: white; padding: 4px 8px; border-radius: 5px 5px 0 0; display: flex; justify-content: space-between; }
  .sec-count { color: #fca5a5; font-size: 8px; }
  table.grid { width: 100%; border-collapse: collapse; font-size: 8.4px; }
  table.grid th { background: #f1f5f9; color: #333; text-transform: uppercase; font-size: 7.2px; padding: 3.5px 5px; text-align: left; border: 1px solid #cbd5e1; }
  table.grid td { border: 1px solid #d7dee8; padding: 3px 5px; }
  table.grid tr:nth-child(even) td { background: #f8fafc; }
  td.idx, th.idx { width: 24px; text-align: center; color: #777; }
  td.empty { text-align: center; color: #999; font-style: italic; padding: 8px; }
  .sig-row { display: flex; gap: 24px; margin-top: 22px; }
  .sig { flex: 1; text-align: center; font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #444; }
  .sig-line { border-bottom: 1.2px solid #111; height: 30px; margin-bottom: 4px; }
  .doc-foot { margin-top: 12px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 8px; color: #888; border-top: 1px solid #e2e8f0; }
  @media print { body { background: white; padding: 0 } .doc { box-shadow: none; max-width: none } }
</style></head>
<body>
  <div class="doc">
    <div class="doc-head">
      <div class="brand">
        <div class="brand-mark">ST</div>
        <div><div class="co-name">${esc(company)}</div><div class="co-sub">${esc(address)}</div></div>
      </div>
      <div class="doc-title-block">
        <div class="doc-title">${esc(opts.title)}</div>
        ${opts.subtitle ? `<div class="doc-sub">${esc(opts.subtitle)}</div>` : ''}
        ${(opts.meta || []).map(l => `<div class="doc-meta">${esc(l)}</div>`).join('')}
      </div>
      <div class="doc-qr">${qr}<div class="doc-no">${esc(docNo)}</div><div class="barcode">${esc(docNo)}</div></div>
    </div>
    ${kpiHtml}
    ${sectionsHtml}
    <div class="sig-row">
      <div class="sig"><div class="sig-line"></div>Prepared By</div>
      <div class="sig"><div class="sig-line"></div>Checked By</div>
      <div class="sig"><div class="sig-line"></div>Approved By</div>
    </div>
    <div class="doc-foot"><span>${esc(footerNote)}</span><span>Generated ${generatedAt} (GMT+4) • Reporting day 06:00–06:00 GMT+4</span></div>
  </div>
</body></html>`

  openPrintWindow(html, !opts.previewOnly)
}

// ── QR element labels (A4 sheet, 2 × 4 grid) ────────────────────────────────

export type QrLabel = {
  payload: string          // scanned content
  code: string             // big element code line
  lines: [string, string][] // label detail rows: [label, value]
}

export async function printQrLabels(labels: QrLabel[], previewOnly = false) {
  const settings = await getSettings()
  const company = settings.company_name || 'Safetech Precast Building Manufacturing LLC'
  const generatedAt = nowStamp()

  const cells = labels.map(l => `
    <div class="label">
      <div class="l-head">
        <span class="l-brand">SAFETECH</span>
        <span class="l-tag">PRECAST ELEMENT</span>
      </div>
      <div class="l-body">
        <div class="l-qr">${qrSvg(l.payload, { size: 92, margin: 1 })}</div>
        <div class="l-info">
          <div class="l-code">${esc(l.code)}</div>
          ${l.lines.map(([k, v]) => `<div class="l-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}
        </div>
      </div>
      <div class="l-foot">${esc(company)} • ${generatedAt}</div>
    </div>`).join('')

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>QR Element Labels</title>
<style>
  @page { size: A4 portrait; margin: 8mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; }
  .sheet-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; padding: 6mm; max-width: 210mm; margin: 0 auto; background: white; }
  .label { border: 1.6px solid #111; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
  .l-head { display: flex; justify-content: space-between; align-items: center; background: #0a0a0a; color: white; padding: 4px 8px; }
  .l-brand { font-weight: 900; font-size: 11px; letter-spacing: 1px; color: #ef4444; }
  .l-tag { font-size: 7px; font-weight: 700; letter-spacing: 1px; color: #cbd5e1; }
  .l-body { display: flex; gap: 8px; padding: 8px; }
  .l-info { flex: 1; min-width: 0; }
  .l-code { font-family: monospace; font-weight: 900; font-size: 12.5px; border-bottom: 1.4px solid #111; padding-bottom: 3px; margin-bottom: 4px; }
  .l-row { display: flex; justify-content: space-between; font-size: 8px; padding: 1.5px 0; border-bottom: 1px dotted #cbd5e1; }
  .l-row span { color: #555; text-transform: uppercase; font-weight: 700; font-size: 7px; }
  .l-row b { font-weight: 800; text-align: right; margin-left: 6px; }
  .l-foot { font-size: 6.5px; color: #666; text-align: center; padding: 3px; border-top: 1px solid #e2e8f0; }
  @media print { body { background: white } .sheet-wrap { padding: 0 } }
</style></head>
<body><div class="sheet-wrap">${cells}</div></body></html>`

  openPrintWindow(html, !previewOnly)
}

// ── Spreadsheet exports ──────────────────────────────────────────────────────

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function exportCsv(filename: string, columns: PrintColumn[], rows: any[]) {
  const escCell = (v: any) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [
    columns.map(c => escCell(c.label)).join(','),
    ...rows.map(r => columns.map(c => escCell(r[c.key])).join(','))
  ]
  download(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }), filename)
}

/** Excel-compatible export (HTML table with .xls type — opens directly in Excel). */
export function exportExcel(filename: string, title: string, columns: PrintColumn[], rows: any[]) {
  const head = columns.map(c => `<th style="background:#111;color:#fff">${esc(c.label)}</th>`).join('')
  const body = rows.map(r => `<tr>${columns.map(c => `<td>${esc(r[c.key])}</td>`).join('')}</tr>`).join('')
  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><title>${esc(title)}</title></head>
  <body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`
  download(new Blob([html], { type: 'application/vnd.ms-excel' }), filename)
}
