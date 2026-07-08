import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getModule, type ModuleDef, type FieldDef } from '../../lib/erp/registry'
import { fetchRows, insertAudited, updateAudited, deleteAudited, hasSnapshot, snapshotInfo, restoreSnapshot } from '../../lib/erp/db'
import { printRegister, exportCsv, exportExcel, printQrLabels } from '../../lib/erp/printDoc'
import { usePermissions } from '../../lib/erp/usePermissions'
import { useAuth } from '../../lib/useAuth'
import { qrSvg } from '../../lib/qr'
import ImportWizard from './ImportWizard'
import { statusChipClass, buildQrPayload } from '../../lib/erp/uiHelpers'

const PAGE_SIZE = 12

export default function ModuleWorkspace() {
  const { moduleId } = useParams()
  const module = getModule(moduleId || '')
  const { profile, user } = useAuth()
  const { canEdit } = usePermissions()

  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<any | 'new' | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})
  const [showImport, setShowImport] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [printPaper, setPrintPaper] = useState<'A4' | 'A3'>('A4')
  const [printLandscape, setPrintLandscape] = useState(false)
  const [qrRow, setQrRow] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [snapshotAt, setSnapshotAt] = useState<string | null>(null)

  const userEmail = profile?.email || user?.email || ''
  const editable = !!module && !module.readOnly && canEdit(module.section)

  async function reload() {
    if (!module) return
    setLoading(true)
    const data = await fetchRows(module.table, module.filter)
    setRows(data)
    setSnapshotAt(hasSnapshot(module.table) ? snapshotInfo(module.table) : null)
    setLoading(false)
  }

  useEffect(() => {
    setSearch(''); setSortKey(null); setPage(0); setEditing(null)
    if (module) {
      setPrintPaper(module.paper || 'A4')
      setPrintLandscape(!!module.landscape)
    }
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId])

  const filtered = useMemo(() => {
    let out = rows
    if (search.trim()) {
      const q = search.toLowerCase()
      out = out.filter(r => module!.fields.some(f => String(r[f.key] ?? '').toLowerCase().includes(q)))
    }
    if (sortKey) {
      out = [...out].sort((a, b) => {
        const va = a[sortKey], vb = b[sortKey]
        if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va
        return sortAsc ? String(va ?? '').localeCompare(String(vb ?? '')) : String(vb ?? '').localeCompare(String(va ?? ''))
      })
    }
    return out
  }, [rows, search, sortKey, sortAsc, module])

  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const statusCounts = useMemo(() => {
    if (!module?.statusField) return []
    const counts: Record<string, number> = {}
    for (const r of rows) {
      const v = String(r[module.statusField] ?? '—')
      counts[v] = (counts[v] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4)
  }, [rows, module])

  if (!module) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
        <div className="text-4xl">🧭</div>
        <div className="font-black uppercase text-slate-600 dark:text-slate-300">Unknown module</div>
        <Link to="/dashboard" className="text-red-500 text-xs font-bold uppercase">← Back to dashboard</Link>
      </div>
    )
  }

  function openAdd() {
    const init: Record<string, any> = {}
    for (const f of module!.fields) init[f.key] = f.type === 'boolean' ? false : ''
    if (module!.filter) init[module!.filter.field] = module!.filter.value
    setForm(init)
    setEditing('new')
  }

  function openEdit(row: any) {
    setForm({ ...row })
    setEditing(row)
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    const missing = module!.fields.filter(f => f.required && String(form[f.key] ?? '').trim() === '')
    if (missing.length) {
      alert(`Required: ${missing.map(f => f.label).join(', ')}`)
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, any> = {}
      for (const f of module!.fields) {
        let v = form[f.key]
        if (f.type === 'number' && v !== '' && v !== null) v = Number(v)
        payload[f.key] = v
      }
      if (module!.filter) payload[module!.filter.field] = module!.filter.value
      if (editing === 'new') {
        await insertAudited(module!.table, [payload], userEmail, `${module!.title}: record added`)
      } else {
        await updateAudited(module!.table, (editing as any).id, payload, userEmail, `${module!.title}: record updated`)
      }
      setEditing(null)
      await reload()
    } finally {
      setSaving(false)
    }
  }

  async function removeRow(row: any) {
    if (!confirm(`Delete this ${module!.title} record?`)) return
    await deleteAudited(module!.table, row.id, userEmail, `${module!.title}: record deleted`)
    await reload()
  }

  async function undoImport() {
    if (!confirm(`Restore ${module!.title} to the state before the last CSV import (${snapshotAt})?`)) return
    restoreSnapshot(module!.table)
    await reload()
  }

  const printCols = module.fields.map(f => ({ key: f.key, label: f.label }))

  function downloadSample() {
    const sample: Record<string, string> = {}
    for (const f of module!.fields) {
      sample[f.key] = f.type === 'number' ? '0'
        : f.type === 'date' ? '2026-07-08'
        : f.type === 'time' ? '08:00'
        : f.type === 'boolean' ? 'yes'
        : f.options?.[0] || `Sample ${f.label}`
    }
    exportCsv(`${module!.id}-sample.csv`, printCols, [sample])
  }

  const inputFor = (f: FieldDef) => {
    const common = 'w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs'
    const v = form[f.key]
    if (f.type === 'select') return (
      <select className={common} value={v ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}>
        <option value="">Select…</option>
        {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
    if (f.type === 'boolean') return (
      <label className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-600 dark:text-slate-300">
        <input type="checkbox" className="accent-red-500" checked={!!v} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.checked }))} />
        Yes / Cleared
      </label>
    )
    if (f.type === 'textarea') return (
      <textarea rows={2} className={common} value={v ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
    )
    return (
      <input
        type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : 'text'}
        step={f.type === 'number' ? 'any' : undefined}
        className={common}
        value={v ?? ''}
        placeholder={f.placeholder}
        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5 gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            {module.icon} {module.title} <span className="text-red-500 font-light">Module</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{module.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase">
          <span className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">{rows.length} Records</span>
          {statusCounts.map(([k, n]) => (
            <span key={k} className={`px-3 py-1.5 rounded-full border ${statusChipClass(k)}`}>{k}: {n}</span>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-panel rounded-2xl p-3.5 border border-slate-200 dark:border-white/5 flex flex-wrap items-center gap-2 no-print">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder={`Search ${module.title.toLowerCase()}…`}
          className="glowing-input px-3.5 py-2 rounded-xl text-xs flex-grow min-w-[160px] max-w-xs"
        />
        <div className="flex flex-wrap gap-2 ml-auto">
          {editable && (
            <button onClick={openAdd} className="px-4 py-2 bg-gradient-to-br from-red-500 to-red-700 text-white text-[10px] font-extrabold uppercase rounded-xl btn-interactive">＋ Add Record</button>
          )}
          {editable && (
            <button onClick={() => setShowImport(true)} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">📥 Import CSV</button>
          )}
          {editable && snapshotAt && (
            <button onClick={undoImport} className="px-3.5 py-2 border border-amber-500/30 text-amber-500 text-[10px] font-extrabold uppercase rounded-xl bg-amber-500/5 hover:bg-amber-500/10 transition-all">↩ Undo Import</button>
          )}
          <button onClick={() => exportCsv(`${module.id}.csv`, printCols, filtered)} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">📤 CSV</button>
          <button onClick={() => exportExcel(`${module.id}.xls`, module.title, printCols, filtered)} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">📊 Excel</button>
          <button onClick={downloadSample} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">📄 Sample</button>
          <button onClick={() => setShowPrint(true)} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">🖨 Print</button>
        </div>
      </div>

      {/* Data table */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-500 font-semibold animate-pulse">Loading {module.title.toLowerCase()}…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[9px] uppercase bg-slate-50/60 dark:bg-black/20">
                  {module.fields.map(f => (
                    <th
                      key={f.key}
                      onClick={() => { setSortKey(f.key); setSortAsc(sortKey === f.key ? !sortAsc : true) }}
                      className="py-2.5 px-3 cursor-pointer select-none hover:text-red-500 whitespace-nowrap"
                    >
                      {f.label}{sortKey === f.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {pageRows.length === 0 ? (
                  <tr><td colSpan={module.fields.length + 1} className="py-12 text-center text-slate-500 uppercase font-semibold">No records found</td></tr>
                ) : pageRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    {module.fields.map(f => (
                      <td key={f.key} className="py-2 px-3 max-w-[160px] truncate font-semibold">
                        {f.key === module.statusField ? (
                          <span className={`inline-block px-2 py-0.5 rounded-md border text-[9px] font-black uppercase ${statusChipClass(row[f.key])}`}>{row[f.key] || '—'}</span>
                        ) : f.type === 'boolean' ? (
                          <span>{row[f.key] ? '✅' : '—'}</span>
                        ) : (
                          String(row[f.key] ?? '') || '—'
                        )}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      {module.qrField && (
                        <button onClick={() => setQrRow(row)} className="text-slate-500 hover:text-red-500 font-bold text-[9px] uppercase px-1.5" title="QR label">QR</button>
                      )}
                      {editable && (
                        <>
                          <button onClick={() => openEdit(row)} className="text-blue-500 font-bold text-[9px] uppercase px-1.5 hover:underline">Edit</button>
                          <button onClick={() => removeRow(row)} className="text-red-500 font-bold text-[9px] uppercase px-1.5 hover:underline">Del</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-white/5 text-[10px] font-bold text-slate-500 no-print">
            <span>{filtered.length} records — page {page + 1} / {pageCount}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-30 hover:text-red-500">← Prev</button>
              <button disabled={page >= pageCount - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-30 hover:text-red-500">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print" onClick={() => setEditing(null)}>
          <form onSubmit={saveForm} className="glass-panel rounded-3xl w-full max-w-xl max-h-[88vh] overflow-y-auto p-6 space-y-4 bg-white dark:bg-[#0e0e12]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
              <h3 className="text-base font-black uppercase text-neutral-900 dark:text-white">
                {editing === 'new' ? '＋ Add' : '✏️ Edit'} <span className="text-red-500 font-light">{module.title}</span>
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-red-500 font-black text-lg px-2">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {module.fields.map(f => (
                <label key={f.key} className={`block ${f.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                  <span className="text-[9px] uppercase font-black text-slate-500">{f.label}{f.required && <span className="text-red-500"> *</span>}</span>
                  {inputFor(f)}
                </label>
              ))}
            </div>
            <button type="submit" disabled={saving} className="w-full bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-xs uppercase py-3 rounded-xl shadow-lg btn-interactive">
              {saving ? 'Saving…' : '💾 Save Record'}
            </button>
          </form>
        </div>
      )}

      {/* Print dialog */}
      {showPrint && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print" onClick={() => setShowPrint(false)}>
          <div className="glass-panel rounded-3xl w-full max-w-md p-6 space-y-4 bg-white dark:bg-[#0e0e12]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
              <h3 className="text-base font-black uppercase text-neutral-900 dark:text-white">🖨 Print <span className="text-red-500 font-light">{module.title}</span></h3>
              <button onClick={() => setShowPrint(false)} className="text-slate-400 hover:text-red-500 font-black text-lg px-2">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Paper Size</span>
                <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={printPaper} onChange={e => setPrintPaper(e.target.value as 'A4' | 'A3')}>
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Orientation</span>
                <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={printLandscape ? 'landscape' : 'portrait'} onChange={e => setPrintLandscape(e.target.value === 'landscape')}>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </label>
            </div>
            <p className="text-[10px] text-slate-500">Document includes company header, QR + barcode, auto pagination with page numbers, signature blocks, and revision line. Use the browser dialog to save as PDF.</p>
            <div className="flex gap-2">
              <button
                onClick={() => { printRegister({ title: module.title, subtitle: module.subtitle, paper: printPaper, landscape: printLandscape, columns: printCols, rows: filtered, meta: [search ? `Filter: "${search}"` : `All records`, `Records: ${filtered.length}`], previewOnly: true }); }}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-xs font-extrabold uppercase rounded-xl transition-all"
              >👁 Preview</button>
              <button
                onClick={() => { printRegister({ title: module.title, subtitle: module.subtitle, paper: printPaper, landscape: printLandscape, columns: printCols, rows: filtered, meta: [search ? `Filter: "${search}"` : `All records`, `Records: ${filtered.length}`] }); setShowPrint(false) }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-extrabold uppercase rounded-xl btn-interactive"
              >🖨 Print / PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* QR label modal */}
      {qrRow && module.qrField && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print" onClick={() => setQrRow(null)}>
          <div className="glass-panel rounded-3xl w-full max-w-sm p-6 space-y-4 text-center bg-white dark:bg-[#0e0e12]" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black uppercase text-neutral-900 dark:text-white">Element QR <span className="text-red-500 font-light">Label</span></h3>
            <div className="bg-white rounded-2xl p-4 inline-block mx-auto border border-slate-200" dangerouslySetInnerHTML={{ __html: qrSvg(buildQrPayload(module, qrRow), { size: 168, margin: 2 }) }} />
            <div className="font-mono font-black text-sm text-neutral-900 dark:text-white">{String(qrRow[module.qrField] ?? '')}</div>
            <p className="text-[9px] text-slate-500 break-all px-2">{buildQrPayload(module, qrRow)}</p>
            <button
              onClick={() => printQrLabels([{
                payload: buildQrPayload(module, qrRow),
                code: String(qrRow[module.qrField!] ?? ''),
                lines: module.fields.filter(f => f.key !== module.qrField).slice(0, 6).map(f => [f.label, String(qrRow[f.key] ?? '—')] as [string, string])
              }])}
              className="w-full px-4 py-2.5 bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-extrabold uppercase rounded-xl btn-interactive"
            >🖨 Print Label</button>
          </div>
        </div>
      )}

      {/* CSV Import wizard */}
      {showImport && (
        <ImportWizard
          module={module}
          existingRows={rows}
          onClose={() => setShowImport(false)}
          onImported={() => reload()}
        />
      )}
    </div>
  )
}
