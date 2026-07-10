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
  const { can } = usePermissions()

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
  const [refOptions, setRefOptions] = useState<Record<string, string[]>>({})
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)

  const userEmail = profile?.email || user?.email || ''
  // Per-action gates: create / edit / delete each check their own grant;
  // modules flagged requiresApprove (e.g. Pending Approvals) additionally
  // need the 'approve' permission for every write.
  const approveOk = !module?.requiresApprove || can(module.section, 'approve')
  const allowCreate = !!module && !module.readOnly && can(module.section, 'create') && approveOk
  const allowEdit = !!module && !module.readOnly && can(module.section, 'edit') && approveOk
  const allowDelete = !!module && !module.readOnly && can(module.section, 'delete') && approveOk
  const isLockedRow = (row: any) =>
    !!module?.lockedRows && module.lockedRows.values.includes(String(row[module.lockedRows.field]))

  async function reload() {
    if (!module) return
    setLoading(true)
    const data = await fetchRows(module.table, module.filter)
    setRows(data)
    setSnapshotAt((await hasSnapshot(module.table)) ? await snapshotInfo(module.table) : null)
    setLoading(false)
  }

  // Options for 'ref' fields — distinct values pulled from the referenced table
  async function loadRefOptions() {
    if (!module) return
    const refs = module.fields.filter(f => f.type === 'ref' && f.ref)
    if (!refs.length) { setRefOptions({}); return }
    const out: Record<string, string[]> = {}
    await Promise.all(refs.map(async f => {
      const rows = await fetchRows(f.ref!.table)
      out[f.key] = [...new Set(rows.map((r: any) => String(r[f.ref!.valueField] ?? '')).filter(Boolean))].sort()
    }))
    setRefOptions(out)
  }

  useEffect(() => {
    setSearch(''); setSortKey(null); setPage(0); setEditing(null)
    setColumnFilters({}); setSelected(new Set()); setInlineEditId(null)
    if (module) {
      setPrintPaper(module.paper || 'A4')
      setPrintLandscape(!!module.landscape)
    }
    reload()
    loadRefOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId])

  const filtered = useMemo(() => {
    let out = rows
    if (search.trim()) {
      const q = search.toLowerCase()
      out = out.filter(r => module!.fields.some(f => String(r[f.key] ?? '').toLowerCase().includes(q)))
    }
    for (const [key, val] of Object.entries(columnFilters)) {
      if (!val.trim()) continue
      const q = val.toLowerCase()
      out = out.filter(r => String(r[key] ?? '').toLowerCase().includes(q))
    }
    if (sortKey) {
      out = [...out].sort((a, b) => {
        const va = a[sortKey], vb = b[sortKey]
        if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va
        return sortAsc ? String(va ?? '').localeCompare(String(vb ?? '')) : String(vb ?? '').localeCompare(String(va ?? ''))
      })
    }
    return out
  }, [rows, search, columnFilters, sortKey, sortAsc, module])

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

  // View guard: this screen is reached via the generic /m/:moduleId route (which
  // is only auth-gated), so enforce the section's view grant here.
  if (!can(module.section, 'view')) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center space-y-3">
        <div className="text-4xl">🔒</div>
        <div className="font-black uppercase text-yellow-500">Access restricted</div>
        <p className="text-xs text-slate-500 dark:text-slate-400">You do not have permission to view {module.title}.</p>
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
    // permission re-check at the mutation itself, not just hidden buttons
    if (editing === 'new' ? !allowCreate : !allowEdit) { alert('You do not have permission for this action.'); return }
    if (editing !== 'new' && isLockedRow(editing)) { alert('This built-in record is locked.'); return }
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
        if (f.type === 'date' && v === '') v = null
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
    if (!allowDelete) { alert('You do not have permission to delete records here.'); return }
    if (isLockedRow(row)) { alert('This built-in record is locked.'); return }
    if (!confirm(`Delete this ${module!.title} record?`)) return
    await deleteAudited(module!.table, row.id, userEmail, `${module!.title}: record deleted`)
    await reload()
  }

  function toggleSelectAll() {
    if (selected.size === pageRows.length) setSelected(new Set())
    else setSelected(new Set(pageRows.map(r => r.id)))
  }

  function toggleSelectRow(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function bulkDelete() {
    if (!allowDelete) { alert('You do not have permission to delete records here.'); return }
    if (!confirm(`Delete ${selected.size} selected ${module!.title} record(s)?`)) return
    const targets = rows.filter(r => selected.has(r.id) && !isLockedRow(r))
    await Promise.all(targets.map(r => deleteAudited(module!.table, r.id, userEmail, `${module!.title}: bulk deleted`)))
    setSelected(new Set())
    await reload()
  }

  async function bulkApplyStatus() {
    if (!allowEdit || !bulkStatus) return
    const targets = rows.filter(r => selected.has(r.id) && !isLockedRow(r))
    await Promise.all(targets.map(r => updateAudited(module!.table, r.id, { [module!.statusField!]: bulkStatus }, userEmail, `${module!.title}: bulk status → ${bulkStatus}`)))
    setSelected(new Set()); setBulkStatus('')
    await reload()
  }

  async function inlineSetStatus(row: any, value: string) {
    if (!allowEdit || isLockedRow(row) || !module!.statusField) return
    setInlineEditId(null)
    await updateAudited(module!.table, row.id, { [module!.statusField]: value }, userEmail, `${module!.title}: status → ${value}`)
    await reload()
  }

  async function undoImport() {
    if (!confirm(`Restore ${module!.title} to the state before the last CSV import (${snapshotAt})?`)) return
    await restoreSnapshot(module!.table)
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
    if (f.type === 'ref' && f.ref) {
      const opts = refOptions[f.key] || []
      return (
        <select className={common} value={v ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}>
          <option value="">Select…</option>
          {/* keep a stored value visible even if its master row was removed */}
          {v && !opts.includes(v) && <option value={v}>{v}</option>}
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    }
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
          {allowCreate && (
            <button onClick={openAdd} className="px-4 py-2 bg-gradient-to-br from-red-500 to-red-700 text-white text-[10px] font-extrabold uppercase rounded-xl btn-interactive">＋ Add Record</button>
          )}
          {allowCreate && (
            <button onClick={() => setShowImport(true)} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">📥 Import CSV</button>
          )}
          {allowEdit && snapshotAt && (
            <button onClick={undoImport} className="px-3.5 py-2 border border-amber-500/30 text-amber-500 text-[10px] font-extrabold uppercase rounded-xl bg-amber-500/5 hover:bg-amber-500/10 transition-all">↩ Undo Import</button>
          )}
          <button onClick={() => exportCsv(`${module.id}.csv`, printCols, filtered)} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">📤 CSV</button>
          <button onClick={() => exportExcel(`${module.id}.xls`, module.title, printCols, filtered)} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">📊 Excel</button>
          <button onClick={downloadSample} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">📄 Sample</button>
          <button onClick={() => setShowPrint(true)} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">🖨 Print</button>
        </div>
      </div>

      {/* Bulk action bar — appears once ≥1 row is selected */}
      {selected.size > 0 && (allowEdit || allowDelete) && (
        <div className="glass-panel rounded-2xl p-3 border border-red-500/20 bg-red-500/5 flex flex-wrap items-center gap-2 no-print">
          <span className="text-[10px] font-black uppercase text-red-500 px-2">{selected.size} selected</span>
          {allowEdit && module.statusField && (
            <>
              <select
                className="glowing-input px-3 py-1.5 rounded-lg text-[11px]"
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value)}
              >
                <option value="">Set status…</option>
                {(module.fields.find(f => f.key === module.statusField)?.options || []).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <button
                onClick={bulkApplyStatus}
                disabled={!bulkStatus}
                className="px-3.5 py-1.5 bg-gradient-to-br from-red-500 to-red-700 text-white text-[10px] font-extrabold uppercase rounded-lg btn-interactive disabled:opacity-40"
              >Apply</button>
            </>
          )}
          {allowDelete && (
            <button onClick={bulkDelete} className="px-3.5 py-1.5 border border-red-500/30 text-red-500 text-[10px] font-extrabold uppercase rounded-lg hover:bg-red-500/10 transition-all">🗑 Delete Selected</button>
          )}
          <button onClick={() => setSelected(new Set())} className="ml-auto text-[10px] font-bold uppercase text-slate-500 hover:text-red-500 px-2">Clear</button>
        </div>
      )}

      {/* Data table */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-500 font-semibold animate-pulse">Loading {module.title.toLowerCase()}…</div>
        ) : (
          <>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-[11.5px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[10px] uppercase bg-slate-50/60 dark:bg-black/20">
                  {(allowEdit || allowDelete) && (
                    <th className="py-2.5 px-3 w-8">
                      <input type="checkbox" className="accent-red-500" checked={pageRows.length > 0 && selected.size === pageRows.length} onChange={toggleSelectAll} />
                    </th>
                  )}
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
                <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/30 dark:bg-black/10 no-print">
                  {(allowEdit || allowDelete) && <th className="py-1.5 px-3" />}
                  {module.fields.map(f => (
                    <th key={f.key} className="py-1.5 px-3">
                      <input
                        type="text"
                        value={columnFilters[f.key] || ''}
                        onChange={e => { setColumnFilters(p => ({ ...p, [f.key]: e.target.value })); setPage(0) }}
                        placeholder="Filter…"
                        className="w-full px-2 py-1 rounded-md glowing-input text-[10px] font-normal"
                      />
                    </th>
                  ))}
                  <th className="py-1.5 px-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {pageRows.length === 0 ? (
                  <tr><td colSpan={module.fields.length + 2} className="py-12 text-center text-slate-500 uppercase font-semibold">No records found</td></tr>
                ) : pageRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    {(allowEdit || allowDelete) && (
                      <td className="py-2.5 px-3">
                        <input type="checkbox" className="accent-red-500" checked={selected.has(row.id)} onChange={() => toggleSelectRow(row.id)} />
                      </td>
                    )}
                    {module.fields.map(f => (
                      <td key={f.key} className="py-2.5 px-3 max-w-[160px] truncate font-semibold">
                        {f.key === module.statusField ? (
                          allowEdit && !isLockedRow(row) && inlineEditId === row.id ? (
                            <select
                              autoFocus
                              defaultValue={row[f.key] || ''}
                              onChange={e => inlineSetStatus(row, e.target.value)}
                              onBlur={() => setInlineEditId(null)}
                              className="px-2 py-1 rounded-md glowing-input text-[10px]"
                            >
                              {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <span
                              onClick={() => allowEdit && !isLockedRow(row) && setInlineEditId(row.id)}
                              className={`inline-block px-2 py-0.5 rounded-md border text-[9px] font-black uppercase ${statusChipClass(row[f.key])} ${allowEdit && !isLockedRow(row) ? 'cursor-pointer hover:opacity-75' : ''}`}
                              title={allowEdit && !isLockedRow(row) ? 'Click to change status' : undefined}
                            >{row[f.key] || '—'}</span>
                          )
                        ) : f.type === 'boolean' ? (
                          <span>{row[f.key] ? '✅' : '—'}</span>
                        ) : (
                          String(row[f.key] ?? '') || '—'
                        )}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {module.qrField && (
                        <button onClick={() => setQrRow(row)} className="text-slate-500 hover:text-red-500 font-bold text-[9px] uppercase px-1.5" title="QR label">QR</button>
                      )}
                      {isLockedRow(row) ? (
                        <span className="text-slate-400 text-[9px] font-bold uppercase px-1.5" title="Built-in record — locked">🔒</span>
                      ) : (
                        <>
                          {allowEdit && (
                            <button onClick={() => openEdit(row)} className="text-blue-500 font-bold text-[9px] uppercase px-1.5 hover:underline">Edit</button>
                          )}
                          {allowDelete && (
                            <button onClick={() => removeRow(row)} className="text-red-500 font-bold text-[9px] uppercase px-1.5 hover:underline">Del</button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Responsive card view — narrow/tablet screens get stacked cards instead
              of a horizontally-scrolling table. */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
            {pageRows.length === 0 ? (
              <div className="py-12 text-center text-slate-500 uppercase font-semibold text-xs">No records found</div>
            ) : pageRows.map((row, idx) => {
              const primary = module.fields[0]
              const secondary = module.fields.slice(1, 4)
              return (
                <div key={row.id || idx} className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {(allowEdit || allowDelete) && (
                        <input type="checkbox" className="accent-red-500 mt-0.5 shrink-0" checked={selected.has(row.id)} onChange={() => toggleSelectRow(row.id)} />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">{String(row[primary.key] ?? '—')}</div>
                        {module.statusField && (
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase ${statusChipClass(row[module.statusField])}`}>{row[module.statusField] || '—'}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {module.qrField && (
                        <button onClick={() => setQrRow(row)} className="text-slate-500 hover:text-red-500 font-bold text-[9px] uppercase px-1">QR</button>
                      )}
                      {isLockedRow(row) ? (
                        <span className="text-slate-400 text-[9px]" title="Locked">🔒</span>
                      ) : (
                        <>
                          {allowEdit && <button onClick={() => openEdit(row)} className="text-blue-500 font-bold text-[9px] uppercase px-1">Edit</button>}
                          {allowDelete && <button onClick={() => removeRow(row)} className="text-red-500 font-bold text-[9px] uppercase px-1">Del</button>}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pl-0">
                    {secondary.map(f => (
                      <div key={f.key} className="min-w-0">
                        <span className="text-slate-400 text-[9px] uppercase font-bold block">{f.label}</span>
                        <span className="font-semibold truncate block">{f.type === 'boolean' ? (row[f.key] ? '✅' : '—') : (String(row[f.key] ?? '') || '—')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          </>
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
