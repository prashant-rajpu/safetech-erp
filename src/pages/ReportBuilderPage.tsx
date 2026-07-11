import React, { useEffect, useMemo, useState } from 'react'
import { fetchRows, insertAudited } from '../lib/erp/db'
import { printSectionsDoc, exportCsv, exportExcel, type ReportSection, type PrintColumn } from '../lib/erp/printDoc'
import { MODULES } from '../lib/erp/registry'
import { useAuth } from '../lib/useAuth'
import { usePermissions } from '../lib/erp/usePermissions'
import { REPORT_TABLES } from '../lib/erp/reportTables'
import { Save, Eye, Upload, BarChart3, Printer, Trash2 } from 'lucide-react'

type Operator = 'equals' | 'contains' | 'gte' | 'lte'
type FilterRow = { field: string; op: Operator; value: string }
type SavedReport = {
  id: string
  name: string
  source_table: string
  columns: string[]
  filters: FilterRow[]
}

/** Columns for a table: prefer the matching ModuleDef's real field labels,
    fall back to the keys of one sample row when no ModuleDef exists for it. */
async function columnsFor(table: string): Promise<PrintColumn[]> {
  const module = MODULES.find(m => m.table === table)
  if (module) return module.fields.map(f => ({ key: f.key, label: f.label }))
  const sample = await fetchRows(table)
  if (sample.length === 0) return []
  return Object.keys(sample[0])
    .filter(k => !['id', 'created_at', 'updated_at', 'created_by', 'updated_by'].includes(k))
    .map(k => ({ key: k, label: k }))
}

function applyFilters(rows: any[], filters: FilterRow[]): any[] {
  return rows.filter(row => filters.every(f => {
    if (!f.field || !f.value) return true
    const cell = row[f.field]
    switch (f.op) {
      case 'equals': return String(cell ?? '').toLowerCase() === f.value.toLowerCase()
      case 'contains': return String(cell ?? '').toLowerCase().includes(f.value.toLowerCase())
      case 'gte': return String(cell ?? '') >= f.value
      case 'lte': return String(cell ?? '') <= f.value
      default: return true
    }
  }))
}

export default function ReportBuilderPage() {
  const { profile, user } = useAuth()
  const { can } = usePermissions()
  const editable = can('reports', 'create')
  const userEmail = profile?.email || user?.email || ''

  const [sourceTable, setSourceTable] = useState(REPORT_TABLES[0])
  const [availableColumns, setAvailableColumns] = useState<PrintColumn[]>([])
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FilterRow[]>([])
  const [reportName, setReportName] = useState('')
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<SavedReport[]>([])

  useEffect(() => {
    async function loadColumns() {
      const cols = await columnsFor(sourceTable)
      setAvailableColumns(cols)
      setSelectedColumns(new Set(cols.slice(0, 6).map(c => c.key)))
      setRows([])
    }
    loadColumns()
  }, [sourceTable])

  useEffect(() => {
    async function loadSaved() {
      const data = await fetchRows('custom_reports')
      setSaved(data.map((r: any) => ({
        id: r.id, name: r.name, source_table: r.source_table,
        columns: r.columns || [], filters: r.filters || []
      })))
    }
    loadSaved()
  }, [])

  async function runReport() {
    setLoading(true)
    try {
      const data = await fetchRows(sourceTable)
      setRows(applyFilters(data, filters))
    } finally {
      setLoading(false)
    }
  }

  function toggleColumn(key: string) {
    setSelectedColumns(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function addFilter() {
    setFilters(prev => [...prev, { field: availableColumns[0]?.key || '', op: 'contains', value: '' }])
  }
  function updateFilter(idx: number, patch: Partial<FilterRow>) {
    setFilters(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f))
  }
  function removeFilter(idx: number) {
    setFilters(prev => prev.filter((_, i) => i !== idx))
  }

  const activeColumns = useMemo(
    () => availableColumns.filter(c => selectedColumns.has(c.key)),
    [availableColumns, selectedColumns])

  const section: ReportSection = { heading: reportName || sourceTable, columns: activeColumns, rows }

  async function saveReport() {
    if (!reportName.trim()) { alert('Name the report before saving.'); return }
    setSaving(true)
    try {
      await insertAudited('custom_reports', [{
        name: reportName, source_table: sourceTable,
        columns: Array.from(selectedColumns), filters
      }], userEmail, `Custom report saved: ${reportName}`)
      const data = await fetchRows('custom_reports')
      setSaved(data.map((r: any) => ({
        id: r.id, name: r.name, source_table: r.source_table,
        columns: r.columns || [], filters: r.filters || []
      })))
    } finally {
      setSaving(false)
    }
  }

  async function loadSaved(r: SavedReport) {
    setReportName(r.name)
    setSourceTable(r.source_table)
    // columns load happens via the sourceTable effect; select after columns arrive
    setTimeout(() => setSelectedColumns(new Set(r.columns)), 0)
    setFilters(r.filters)
  }

  if (!editable) {
    return <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 font-semibold uppercase">Reports create permission required</div>
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-white/5">
        <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
          Report <span className="text-primary font-light">Builder</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Compose a custom report from any operational table — pick columns, filter, save and reuse</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3">
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Report Name</span>
              <input type="text" className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={reportName} onChange={e => setReportName(e.target.value)} placeholder="e.g. Open NCRs by Project" />
            </label>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Source Table</span>
              <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={sourceTable} onChange={e => setSourceTable(e.target.value)}>
                {REPORT_TABLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <div>
              <span className="text-[9px] uppercase font-black text-slate-500 block mb-1.5">Columns</span>
              <div className="flex flex-wrap gap-1.5">
                {availableColumns.map(c => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggleColumn(c.key)}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                      selectedColumns.has(c.key)
                        ? 'bg-primary/15 text-primary border border-primary/20'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-500 border border-transparent'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] uppercase font-black text-slate-500 block">Filters</span>
              {filters.map((f, idx) => (
                <div key={idx} className="flex gap-1.5 items-center">
                  <select className="flex-1 px-2 py-1.5 rounded-lg glowing-input text-[10px]" value={f.field} onChange={e => updateFilter(idx, { field: e.target.value })}>
                    {availableColumns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                  <select className="px-2 py-1.5 rounded-lg glowing-input text-[10px]" value={f.op} onChange={e => updateFilter(idx, { op: e.target.value as Operator })}>
                    <option value="equals">=</option>
                    <option value="contains">contains</option>
                    <option value="gte">&gt;=</option>
                    <option value="lte">&lt;=</option>
                  </select>
                  <input type="text" className="flex-1 px-2 py-1.5 rounded-lg glowing-input text-[10px]" value={f.value} onChange={e => updateFilter(idx, { value: e.target.value })} />
                  <button type="button" onClick={() => removeFilter(idx)} className="text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              ))}
              <button type="button" onClick={addFilter} className="text-[10px] font-bold uppercase text-primary hover:underline">+ Add Filter</button>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={runReport} disabled={loading || activeColumns.length === 0} className="flex-1 px-4 py-2.5 bg-gradient-to-br from-primary to-primary-dark text-white text-xs font-extrabold uppercase rounded-xl btn-interactive disabled:opacity-40 inline-flex items-center justify-center gap-1.5">
                <Eye size={13} /> {loading ? 'Running…' : 'Run Preview'}
              </button>
              <button type="button" onClick={saveReport} disabled={saving} className="px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-primary/30 hover:text-primary text-xs font-extrabold uppercase rounded-xl transition-all inline-flex items-center gap-1.5">
                <Save size={13} /> Save
              </button>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5">
            <span className="text-[9px] uppercase font-black text-slate-500 block mb-2">My Reports</span>
            {saved.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">No saved reports yet</div>
            ) : (
              <div className="space-y-1.5">
                {saved.map(r => (
                  <button key={r.id} type="button" onClick={() => loadSaved(r)} className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-primary/5 hover:text-primary transition-all">
                    {r.name} <span className="text-slate-400 font-normal">— {r.source_table}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-black text-slate-500">Preview ({rows.length} rows)</span>
            <div className="flex gap-2">
              <button type="button" disabled={rows.length === 0} onClick={() => exportCsv(`${reportName || sourceTable}.csv`, activeColumns, rows)} className="px-3 py-1.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-primary/30 hover:text-primary text-[10px] font-extrabold uppercase rounded-lg transition-all inline-flex items-center gap-1 disabled:opacity-30"><Upload size={11} /> CSV</button>
              <button type="button" disabled={rows.length === 0} onClick={() => exportExcel(`${reportName || sourceTable}.xls`, reportName || sourceTable, activeColumns, rows)} className="px-3 py-1.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-primary/30 hover:text-primary text-[10px] font-extrabold uppercase rounded-lg transition-all inline-flex items-center gap-1 disabled:opacity-30"><BarChart3 size={11} /> Excel</button>
              <button type="button" disabled={rows.length === 0} onClick={() => printSectionsDoc({ title: reportName || sourceTable, sections: [section], paper: 'A4', landscape: activeColumns.length > 6 })} className="px-3 py-1.5 bg-gradient-to-br from-primary to-primary-dark text-white text-[10px] font-extrabold uppercase rounded-lg btn-interactive inline-flex items-center gap-1 disabled:opacity-30"><Printer size={11} /> Print</button>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="text-slate-500 text-sm py-16 text-center">Run the preview to see results.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[10px] uppercase">
                    {activeColumns.map(c => <th key={c.key} className="py-2 pr-4">{c.label}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {rows.slice(0, 200).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      {activeColumns.map(c => <td key={c.key} className="py-2 pr-4">{String(r[c.key] ?? '—')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 200 && <div className="text-[10px] text-slate-400 text-center py-2">Showing first 200 of {rows.length} rows — export for the full set.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
