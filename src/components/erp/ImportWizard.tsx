import React, { useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import type { ModuleDef } from '../../lib/erp/registry'
import { insertAudited, snapshotTable } from '../../lib/erp/db'
import { exportCsv } from '../../lib/erp/printDoc'
import { useAuth } from '../../lib/useAuth'

type Step = 'file' | 'map' | 'preview' | 'done'

type Parsed = { headers: string[]; rows: Record<string, string>[] }
type RowIssue = { row: Record<string, string>; reason: string }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

export default function ImportWizard({ module, existingRows, onClose, onImported }: {
  module: ModuleDef
  existingRows: any[]
  onClose: () => void
  onImported: () => void
}) {
  const { profile, user } = useAuth()
  const [step, setStep] = useState<Step>('file')
  const [parsed, setParsed] = useState<Parsed | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({}) // field.key -> csv header
  const [skipDupes, setSkipDupes] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const keyField = module.keyField || module.fields[0].key

  function handleFile(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const headers = (res.meta.fields || []).filter(Boolean) as string[]
        const rows = (res.data as Record<string, string>[]).filter(r => Object.values(r).some(v => String(v ?? '').trim() !== ''))
        if (!headers.length || !rows.length) {
          alert('CSV appears to be empty or has no header row.')
          return
        }
        // auto-map columns by fuzzy header match
        const auto: Record<string, string> = {}
        for (const f of module.fields) {
          const hit = headers.find(h => norm(h) === norm(f.key) || norm(h) === norm(f.label))
            || headers.find(h => norm(h).includes(norm(f.key)) || norm(f.key).includes(norm(h)))
          if (hit) auto[f.key] = hit
        }
        setMapping(auto)
        setParsed({ headers, rows })
        setStep('map')
      },
      error: () => alert('Could not parse the CSV file.')
    })
  }

  // Validation + duplicate detection over the mapped rows
  const analysis = useMemo(() => {
    if (!parsed) return null
    const valid: any[] = []
    const errors: RowIssue[] = []
    const dupes: RowIssue[] = []
    const existingKeys = new Set(existingRows.map(r => norm(String(r[keyField] ?? ''))))
    const seenInFile = new Set<string>()

    for (const src of parsed.rows) {
      const mappedRow: any = {}
      for (const f of module.fields) {
        const h = mapping[f.key]
        let v: any = h ? (src[h] ?? '').toString().trim() : ''
        if (f.type === 'number' && v !== '') {
          const n = Number(String(v).replace(/,/g, ''))
          if (Number.isNaN(n)) { v = null } else v = n
        }
        if (f.type === 'boolean') v = ['true', 'yes', '1', 'y', 'ok'].includes(String(v).toLowerCase())
        mappedRow[f.key] = v
      }

      const missing = module.fields.filter(f => f.required && (mappedRow[f.key] === '' || mappedRow[f.key] === null || mappedRow[f.key] === undefined))
      if (missing.length) {
        errors.push({ row: src, reason: `Missing required: ${missing.map(f => f.label).join(', ')}` })
        continue
      }
      const badNum = module.fields.filter(f => f.type === 'number' && mappedRow[f.key] === null)
      if (badNum.length) {
        errors.push({ row: src, reason: `Invalid number in: ${badNum.map(f => f.label).join(', ')}` })
        continue
      }

      const k = norm(String(mappedRow[keyField] ?? ''))
      if (k && (existingKeys.has(k) || seenInFile.has(k))) {
        dupes.push({ row: src, reason: `Duplicate ${keyField}: ${mappedRow[keyField]}` })
        if (!skipDupes) valid.push(mappedRow)
        continue
      }
      if (k) seenInFile.add(k)
      valid.push(mappedRow)
    }
    return { valid, errors, dupes }
  }, [parsed, mapping, skipDupes, existingRows, module.fields, keyField])

  const requiredUnmapped = module.fields.filter(f => f.required && !mapping[f.key])

  async function doImport() {
    if (!analysis || busy) return
    setBusy(true)
    try {
      snapshotTable(module.table)
      await insertAudited(module.table, analysis.valid, profile?.email || user?.email || '', `CSV import — ${analysis.valid.length} rows into ${module.title}`)
      setImportedCount(analysis.valid.length)
      setStep('done')
      onImported()
    } finally {
      setBusy(false)
    }
  }

  function downloadErrorReport() {
    if (!analysis || !parsed) return
    const cols = [...parsed.headers.map(h => ({ key: h, label: h })), { key: '__reason', label: 'Rejection Reason' }]
    const rows = [...analysis.errors, ...analysis.dupes].map(e => ({ ...e.row, __reason: e.reason }))
    exportCsv(`${module.id}-import-errors.csv`, cols, rows)
  }

  const stepBadge = (n: number, label: string, active: boolean, done: boolean) => (
    <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${active ? 'text-red-500' : done ? 'text-emerald-500' : 'text-slate-400'}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[9px] ${active ? 'border-red-500 bg-red-500/10' : done ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-300 dark:border-white/10'}`}>
        {done ? '✓' : n}
      </span>
      {label}
    </div>
  )

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print" onClick={onClose}>
      <div className="glass-panel rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-5 bg-white dark:bg-[#0e0e12]" onClick={e => e.stopPropagation()}>

        {/* Header + steps */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
          <div>
            <h3 className="text-lg font-black uppercase text-neutral-900 dark:text-white">CSV Import <span className="text-red-500 font-light">— {module.title}</span></h3>
            <div className="flex gap-4 mt-2">
              {stepBadge(1, 'File', step === 'file', step !== 'file')}
              {stepBadge(2, 'Column Mapping', step === 'map', step === 'preview' || step === 'done')}
              {stepBadge(3, 'Validate & Preview', step === 'preview', step === 'done')}
              {stepBadge(4, 'Import', step === 'done', false)}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 font-black text-lg px-2" aria-label="Close">✕</button>
        </div>

        {/* STEP 1 — file drop */}
        {step === 'file' && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
            className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${dragOver ? 'border-red-500 bg-red-500/5' : 'border-slate-300 dark:border-white/10 hover:border-red-500/40'}`}
            onClick={() => fileRef.current?.click()}
          >
            <div className="text-4xl mb-3">📥</div>
            <div className="font-black uppercase text-sm text-neutral-800 dark:text-white">Drag & drop a CSV file here</div>
            <div className="text-xs text-slate-500 mt-1">or click to browse — first row must contain column headers</div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>
        )}

        {/* STEP 2 — column mapping */}
        {step === 'map' && parsed && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">Match each {module.title} field to a column from your file. Auto-matched columns are pre-selected — adjust as needed.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {module.fields.map(f => (
                <label key={f.key} className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">
                    {f.label}{f.required && <span className="text-red-500"> *</span>}
                  </span>
                  <select
                    className="w-full mt-1 px-2.5 py-2 rounded-lg glowing-input text-xs"
                    value={mapping[f.key] || ''}
                    onChange={e => setMapping(prev => ({ ...prev, [f.key]: e.target.value }))}
                  >
                    <option value="">— not mapped —</option>
                    {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </label>
              ))}
            </div>
            {requiredUnmapped.length > 0 && (
              <div className="text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                ⚠ Required fields not mapped: {requiredUnmapped.map(f => f.label).join(', ')}
              </div>
            )}
            <div className="flex justify-between pt-2">
              <button onClick={() => { setParsed(null); setStep('file') }} className="text-xs font-bold uppercase text-slate-500 hover:text-red-500 px-3 py-2">← Different File</button>
              <button
                disabled={requiredUnmapped.length > 0}
                onClick={() => setStep('preview')}
                className="px-5 py-2.5 bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-extrabold uppercase rounded-xl btn-interactive disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Validate {parsed.rows.length} Rows →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — validation + preview */}
        {step === 'preview' && analysis && parsed && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                <div className="text-2xl font-black text-emerald-500">{analysis.valid.length}</div>
                <div className="text-[9px] uppercase font-black text-slate-500">Ready to import</div>
              </div>
              <div className="p-3 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                <div className="text-2xl font-black text-amber-500">{analysis.dupes.length}</div>
                <div className="text-[9px] uppercase font-black text-slate-500">Duplicates ({keyField})</div>
              </div>
              <div className="p-3 rounded-2xl border border-red-500/20 bg-red-500/5">
                <div className="text-2xl font-black text-red-500">{analysis.errors.length}</div>
                <div className="text-[9px] uppercase font-black text-slate-500">Validation errors</div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={skipDupes} onChange={e => setSkipDupes(e.target.checked)} className="accent-red-500" />
              Skip duplicate records (recommended)
            </label>

            {/* Preview of first valid rows */}
            <div className="overflow-x-auto border border-slate-200 dark:border-white/5 rounded-2xl">
              <table className="w-full text-left text-[10px]">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase text-[8px] border-b border-slate-200 dark:border-white/10">
                    {module.fields.slice(0, 6).map(f => <th key={f.key} className="px-2 py-1.5">{f.label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {analysis.valid.slice(0, 8).map((r, i) => (
                    <tr key={i}>
                      {module.fields.slice(0, 6).map(f => <td key={f.key} className="px-2 py-1.5 max-w-[110px] truncate font-semibold text-slate-700 dark:text-slate-300">{String(r[f.key] ?? '—')}</td>)}
                    </tr>
                  ))}
                  {analysis.valid.length === 0 && (
                    <tr><td colSpan={6} className="px-2 py-6 text-center text-slate-500 font-semibold uppercase">No importable rows</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex gap-2">
                <button onClick={() => setStep('map')} className="text-xs font-bold uppercase text-slate-500 hover:text-red-500 px-3 py-2">← Mapping</button>
                {(analysis.errors.length > 0 || analysis.dupes.length > 0) && (
                  <button onClick={downloadErrorReport} className="text-xs font-bold uppercase text-amber-500 hover:text-amber-400 px-3 py-2 border border-amber-500/20 rounded-xl bg-amber-500/5">
                    ⬇ Error Report CSV
                  </button>
                )}
              </div>
              <button
                disabled={analysis.valid.length === 0 || busy}
                onClick={doImport}
                className="px-6 py-2.5 bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-extrabold uppercase rounded-xl btn-interactive disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? 'Importing…' : `✓ Import ${analysis.valid.length} Records`}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">A rollback snapshot is taken automatically before the import — you can undo it from the module toolbar.</p>
          </div>
        )}

        {/* STEP 4 — done */}
        {step === 'done' && (
          <div className="text-center py-10 space-y-3">
            <div className="text-5xl">✅</div>
            <div className="font-black uppercase text-lg text-neutral-900 dark:text-white">{importedCount} records imported</div>
            <p className="text-xs text-slate-500">If something looks wrong, use <strong>Undo Import</strong> in the toolbar to restore the previous state.</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-extrabold uppercase rounded-xl btn-interactive mt-2">
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
