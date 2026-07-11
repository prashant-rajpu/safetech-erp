import React, { useEffect, useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import { fetchRows, insertAudited, snapshotTable, restoreSnapshot, hasSnapshot, nowStamp } from '../lib/erp/db'
import { exportCsv } from '../lib/erp/printDoc'
import { useAuth } from '../lib/useAuth'
import { usePermissions } from '../lib/erp/usePermissions'
import { getIcon } from '../lib/erp/icons'
import { FileText, CheckCircle2, Construction, Download, X, Zap, Folder } from 'lucide-react'

// One CSV → the whole operational chain, automatically linked:
// Project → BOQ → Drawing Register → BOM → Element Planning →
// Production (Casting) Schedule → Delivery Plan. Reports pick everything up
// immediately because they derive from these tables.

const PIPE_TABLES = ['projects', 'boq_items', 'drawings', 'drawing_revisions', 'bom_items', 'elements', 'casting_schedule', 'delivery_schedule']

const SAMPLE_HEADERS = [
  'project_no', 'project_name', 'location', 'client', 'drawing_no', 'drawing_title',
  'element_type', 'qty', 'length_mm', 'width_mm', 'thickness_mm', 'volume_cum',
  'weight_tons', 'concrete_grade', 'planned_cast_date', 'delivery_date'
]

const SAMPLE_ROWS = [
  { project_no: 'P26010', project_name: 'MARINA GATE TOWERS', location: 'DUBAI', client: 'Emaar Properties', drawing_no: 'DWG-MGT-WL-101', drawing_title: 'Wall Panels — Tower A L1', element_type: 'WL/PC', qty: '6', length_mm: '3200', width_mm: '2400', thickness_mm: '200', volume_cum: '3.12', weight_tons: '7.8', concrete_grade: 'C45', planned_cast_date: '2026-07-12', delivery_date: '2026-07-22' },
  { project_no: 'P26010', project_name: 'MARINA GATE TOWERS', location: 'DUBAI', client: 'Emaar Properties', drawing_no: 'DWG-MGT-HCS-201', drawing_title: 'Hollow Core — Tower A L2', element_type: 'HCS', qty: '12', length_mm: '6000', width_mm: '1200', thickness_mm: '150', volume_cum: '1.5', weight_tons: '3.75', concrete_grade: 'C60', planned_cast_date: '2026-07-14', delivery_date: '2026-07-25' },
  { project_no: 'P26011', project_name: 'AL QUDRA VILLAS', location: 'DUBAI', client: 'Modon Properties', drawing_no: 'DWG-AQV-BW-301', drawing_title: 'Boundary Walls — Zone 1', element_type: 'BW', qty: '8', length_mm: '3500', width_mm: '1200', thickness_mm: '100', volume_cum: '2.1', weight_tons: '5.25', concrete_grade: 'C45', planned_cast_date: '2026-07-13', delivery_date: '2026-07-24' }
]

const TYPE_MARK: Record<string, string> = { 'WL/PC': 'IW', 'WL': 'IW', 'HCS': 'HC', 'BW': 'BW', 'CL': 'CL', 'BM': 'BM' }
const GRADE_MIX: Record<string, string> = { C45: 'MIX-C45-OPC', C50: 'MIX-C50-MS', C60: 'MIX-C60-SRC' }

type ParsedRow = Record<string, string>
type StageResult = { stage: string; icon: string; created: number; note: string }

export default function ProjectAutoImportPage() {
  const { profile, user } = useAuth()
  const { canEdit } = usePermissions()
  const editable = canEdit('planning')
  const userEmail = profile?.email || user?.email || ''

  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<StageResult[] | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([hasSnapshot('elements'), hasSnapshot('projects')]).then(([a, b]) => {
      if (mounted) setCanUndo(a && b)
    })
    return () => { mounted = false }
  }, [])

  function handleFile(file: File) {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: res => {
        const data = (res.data as ParsedRow[]).filter(r => (r.project_no || '').trim() && (r.drawing_no || '').trim())
        if (!data.length) {
          alert('No valid rows — project_no and drawing_no are required on every row.')
          return
        }
        setRows(data)
        setFileName(file.name)
        setResults(null)
      },
      error: () => alert('Could not parse the CSV file.')
    })
  }

  const grouped = useMemo(() => {
    const projects = new Map<string, { name: string; rows: ParsedRow[] }>()
    for (const r of rows) {
      const key = r.project_no.trim()
      if (!projects.has(key)) projects.set(key, { name: r.project_name || key, rows: [] })
      projects.get(key)!.rows.push(r)
    }
    return projects
  }, [rows])

  const totalElements = useMemo(() => rows.reduce((a, r) => a + (Number(r.qty) || 0), 0), [rows])

  async function runPipeline() {
    if (running || !rows.length) return
    setRunning(true)
    try {
      // rollback point across the whole chain
      for (const t of PIPE_TABLES) await snapshotTable(t, userEmail)

      const [existingProjects, existingDrawings, existingElements] = await Promise.all([
        fetchRows('projects'), fetchRows('drawings'), fetchRows('elements')
      ])
      const projectNos = new Set(existingProjects.map(p => p.project_no))
      const drawingNos = new Set(existingDrawings.map(d => d.drawing_no))
      const elementCodes = new Set(existingElements.map(e => e.element_code))

      const out: StageResult[] = []
      const stamp = nowStamp()
      const yymm = `${stamp.slice(2, 4)}${stamp.slice(5, 7)}`

      // 1 ─ Projects
      const newProjects: any[] = []
      for (const [pno, info] of grouped) {
        if (!projectNos.has(pno)) {
          const first = info.rows[0]
          newProjects.push({ project_no: pno, project_name: info.name, location: first.location || '', client: first.client || '', status: 'Active', active: true })
          projectNos.add(pno)
        }
      }
      if (newProjects.length) await insertAudited('projects', newProjects, userEmail, `Auto-import: ${newProjects.length} project(s)`)
      out.push({ stage: 'Project', icon: '📁', created: newProjects.length, note: newProjects.length ? newProjects.map(p => p.project_no).join(', ') : 'already registered' })

      // 2 ─ BOQ (aggregate per project + element type)
      const boqAgg = new Map<string, any>()
      for (const r of rows) {
        const key = `${r.project_no}|${r.element_type}`
        const qty = Number(r.qty) || 0
        const cur = boqAgg.get(key) || { project_no: r.project_no, item_code: `BOQ-${(TYPE_MARK[r.element_type] || 'EL')}-${r.project_no.slice(-2)}`, description: `${r.element_type} precast elements (auto-generated)`, element_type: r.element_type, unit: 'pcs', qty: 0, volume_cum: 0, weight_tons: 0 }
        cur.qty += qty
        cur.volume_cum = Number((cur.volume_cum + qty * (Number(r.volume_cum) || 0)).toFixed(2))
        cur.weight_tons = Number((cur.weight_tons + qty * (Number(r.weight_tons) || 0)).toFixed(2))
        boqAgg.set(key, cur)
      }
      const boqRows = Array.from(boqAgg.values())
      if (boqRows.length) await insertAudited('boq_items', boqRows, userEmail, `Auto-import: ${boqRows.length} BOQ line(s)`)
      out.push({ stage: 'BOQ', icon: '🧾', created: boqRows.length, note: 'aggregated by element type' })

      // 3 ─ Drawing Register (+ R0 revision entries)
      const newDrawings: any[] = []
      const newRevs: any[] = []
      for (const r of rows) {
        const dno = r.drawing_no.trim()
        if (drawingNos.has(dno)) continue
        drawingNos.add(dno)
        newDrawings.push({ drawing_no: dno, project_no: r.project_no, title: r.drawing_title || dno, type: 'Shop Drawing', element_type: r.element_type, revision: 'R0', status: 'Approved', issued_date: stamp.slice(0, 10), received_date: stamp.slice(0, 10) })
        newRevs.push({ drawing_no: dno, revision: 'R0', rev_date: stamp.slice(0, 10), description: 'Auto-registered from project import', status: 'Current', issued_by: 'Project Auto-Import' })
      }
      if (newDrawings.length) {
        await insertAudited('drawings', newDrawings, userEmail, `Auto-import: ${newDrawings.length} drawing(s)`)
        await insertAudited('drawing_revisions', newRevs, userEmail, `Auto-import: ${newRevs.length} revision record(s)`)
      }
      out.push({ stage: 'Drawing Register', icon: '🗂️', created: newDrawings.length, note: `+ ${newRevs.length} R0 revisions` })

      // 4 ─ BOM (concrete + reinforcement stub per drawing)
      const bomRows: any[] = []
      for (const r of rows) {
        const qty = Number(r.qty) || 0
        const vol = Number(r.volume_cum) || 0
        bomRows.push({ project_no: r.project_no, drawing_no: r.drawing_no, material: `Concrete ${r.concrete_grade || 'C45'}`, spec: GRADE_MIX[r.concrete_grade] || 'MIX-C45-OPC', unit: 'm3', qty_per_element: vol, elements: qty, total_qty: Number((vol * qty).toFixed(2)) })
        bomRows.push({ project_no: r.project_no, drawing_no: r.drawing_no, material: 'Reinforcement (per cage schedule)', spec: 'B500B-12', unit: 'kg', qty_per_element: Math.round(vol * 78), elements: qty, total_qty: Math.round(vol * 78 * qty) })
      }
      if (bomRows.length) await insertAudited('bom_items', bomRows, userEmail, `Auto-import: ${bomRows.length} BOM line(s)`)
      out.push({ stage: 'BOM', icon: '🧮', created: bomRows.length, note: 'concrete + reinforcement per drawing' })

      // 5 ─ Element Planning (unique coded elements)
      const newElements: any[] = []
      let serial = existingElements.length + 1
      const codesByRow = new Map<ParsedRow, string[]>()
      for (const r of rows) {
        const qty = Number(r.qty) || 0
        const mark = TYPE_MARK[r.element_type] || 'EL'
        const group = String((newDrawings.findIndex(d => d.drawing_no === r.drawing_no) + 1) || 1).padStart(2, '0')
        const codes: string[] = []
        for (let i = 0; i < qty; i++) {
          let code = `00-${mark}${group}-${yymm}M-${String(serial).padStart(3, '0')}`
          while (elementCodes.has(code)) { serial++; code = `00-${mark}${group}-${yymm}M-${String(serial).padStart(3, '0')}` }
          elementCodes.add(code)
          serial++
          codes.push(code)
          newElements.push({
            element_code: code, project_no: r.project_no, drawing_no: r.drawing_no, revision: 'R0',
            element_type: r.element_type, building: '', floor: '', zone: '',
            length_mm: Number(r.length_mm) || 0, width_mm: Number(r.width_mm) || 0, thickness_mm: Number(r.thickness_mm) || 0,
            volume_cum: Number(r.volume_cum) || 0, weight_tons: Number(r.weight_tons) || 0,
            concrete_grade: r.concrete_grade || 'C45', mix_design: GRADE_MIX[r.concrete_grade] || 'MIX-C45-OPC',
            planned_cast_date: r.planned_cast_date || '', bed: '', mould: '',
            qr_generated: false, qr_generated_at: '', status: 'Planned', cast_date: '', remarks: 'Created by project auto-import'
          })
        }
        codesByRow.set(r, codes)
      }
      if (newElements.length) await insertAudited('elements', newElements, userEmail, `Auto-import: ${newElements.length} element(s) planned`)
      out.push({ stage: 'Element Planning', icon: '🧱', created: newElements.length, note: 'unique plant codes generated' })

      // 6 ─ Production Schedule (casting)
      const scheduleRows: any[] = rows.map(r => ({
        schedule_date: r.planned_cast_date || stamp.slice(0, 10), shift: 'Day', bed: '',
        project_no: r.project_no, drawing_no: r.drawing_no,
        element_codes: (codesByRow.get(r) || []).join(', '), qty: Number(r.qty) || 0,
        status: 'Scheduled', remarks: 'Auto-import — assign bed in Casting Schedule, then generate QR labels'
      }))
      if (scheduleRows.length) await insertAudited('casting_schedule', scheduleRows, userEmail, `Auto-import: ${scheduleRows.length} casting schedule row(s)`)
      out.push({ stage: 'Production Schedule', icon: '📅', created: scheduleRows.length, note: 'assign beds + generate QR in Casting Schedule' })

      // 7 ─ Delivery Plan
      const delAgg = new Map<string, any>()
      for (const r of rows) {
        const key = `${r.project_no}|${r.element_type}|${r.delivery_date || ''}`
        const qty = Number(r.qty) || 0
        const cur = delAgg.get(key) || { schedule_date: r.delivery_date || '', project_no: r.project_no, project_name: r.project_name || r.project_no, element_type: r.element_type, qty: 0, trailer_type_req: r.element_type === 'HCS' ? 'Flatbed' : 'A-Frame', trips_est: 0, priority: 'Medium', status: 'Tentative' }
        cur.qty += qty
        cur.trips_est = Math.max(1, Math.ceil(cur.qty / 12))
        delAgg.set(key, cur)
      }
      const delRows = Array.from(delAgg.values())
      if (delRows.length) await insertAudited('delivery_schedule', delRows, userEmail, `Auto-import: ${delRows.length} delivery plan slot(s)`)
      out.push({ stage: 'Delivery Plan', icon: '🚚', created: delRows.length, note: 'trailer types + trip estimates set' })

      out.push({ stage: 'Reports', icon: '📊', created: 0, note: 'DPR / DTPP / registers now include this project automatically' })

      setResults(out)
      setCanUndo(true)
      setRows([]); setFileName('')
    } finally {
      setRunning(false)
    }
  }

  async function undoAll() {
    if (!confirm('Restore ALL pipeline tables to their state before the last auto-import?')) return
    for (const t of PIPE_TABLES) await restoreSnapshot(t)
    setCanUndo(false)
    setResults(null)
    alert('Auto-import rolled back across all pipeline tables.')
  }

  const pipelineStages = ['Project', 'BOQ', 'Drawing Register', 'BOM', 'Element Planning', 'Production Schedule', 'Delivery Plan', 'Reports']

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5 gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Project <span className="text-primary font-light">Auto-Import</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">One CSV creates the entire chain — no manual linking required</p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={() => exportCsv('project-import-sample.csv', SAMPLE_HEADERS.map(h => ({ key: h, label: h })), SAMPLE_ROWS)} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-primary/30 hover:text-primary text-[10px] font-extrabold uppercase rounded-xl transition-all inline-flex items-center gap-1"><FileText size={12} /> Sample CSV</button>
          {canUndo && (
            <button onClick={undoAll} className="px-3.5 py-2 border border-amber-500/30 text-amber-500 bg-amber-500/5 text-[10px] font-extrabold uppercase rounded-xl transition-all">↩ Undo Last Auto-Import</button>
          )}
        </div>
      </div>

      {/* Pipeline visual */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-white/5 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {pipelineStages.map((s, i) => (
            <React.Fragment key={s}>
              <span className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg border whitespace-nowrap ${results?.some(r => r.stage === s && (r.created > 0 || s === 'Reports')) ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}>{s}</span>
              {i < pipelineStages.length - 1 && <span className="text-primary font-black text-xs">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {!editable ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 font-semibold uppercase">Planning edit permission required</div>
      ) : results ? (
        /* Results summary */
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/5 space-y-4">
          <div className="text-center space-y-1 pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex justify-center"><CheckCircle2 size={36} className="text-success" /></div>
            <div className="font-black uppercase text-lg text-neutral-900 dark:text-white">Auto-organization complete</div>
            <p className="text-xs text-slate-500">Everything is linked — open Casting Schedule to assign beds and generate QR labels.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {results.map(r => {
              const StageIcon = getIcon(r.icon)
              return (
              <div key={r.stage} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/10">
                <div className="flex items-center gap-2.5">
                  <StageIcon size={20} />
                  <div>
                    <div className="text-xs font-black uppercase text-neutral-800 dark:text-white">{r.stage}</div>
                    <div className="text-[9px] text-slate-500 font-semibold">{r.note}</div>
                  </div>
                </div>
                <span className={`text-xl font-black ${r.created > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>{r.stage === 'Reports' ? '∞' : `+${r.created}`}</span>
              </div>
              )
            })}
          </div>
        </div>
      ) : rows.length === 0 ? (
        /* Drop zone */
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all cursor-pointer ${dragOver ? 'border-primary bg-primary/5' : 'border-slate-300 dark:border-white/10 hover:border-primary/40'}`}
        >
          <div className="mb-3 flex justify-center"><Construction size={44} /></div>
          <div className="font-black uppercase text-sm text-neutral-800 dark:text-white">Drop the Project CSV here</div>
          <div className="text-xs text-slate-500 mt-1 max-w-md mx-auto">Each row = one drawing with its element quantity. Projects, BOQ, drawing register, BOM, element codes, casting schedule and delivery plan are generated and linked automatically.</div>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      ) : (
        /* Preview + run */
        <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
            <div>
              <div className="text-xs font-black uppercase text-neutral-800 dark:text-white flex items-center gap-1.5"><Download size={13} className="shrink-0" /> {fileName}</div>
              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {grouped.size} project(s) • {rows.length} drawing row(s) • {totalElements} elements will be planned
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setRows([]); setFileName('') }} className="px-3.5 py-2 text-slate-500 hover:text-primary text-[10px] font-extrabold uppercase inline-flex items-center gap-1"><X size={12} /> Discard</button>
              <button disabled={running} onClick={runPipeline} className="px-5 py-2.5 bg-gradient-to-br from-primary to-primary-dark text-white text-xs font-extrabold uppercase rounded-xl btn-interactive">
                {running ? 'Organizing…' : <span className="inline-flex items-center gap-1.5"><Zap size={14} /> Run Auto-Organization</span>}
              </button>
            </div>
          </div>

          {Array.from(grouped.entries()).map(([pno, info]) => (
            <div key={pno} className="border border-slate-100 dark:border-white/5 rounded-2xl p-3.5 space-y-2">
              <div className="text-xs font-black text-primary uppercase flex items-center gap-1.5"><Folder size={13} className="shrink-0" /> {pno} — {info.name}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase text-[8px] border-b border-slate-100 dark:border-white/10">
                      <th className="py-1.5 pr-3">Drawing</th><th className="py-1.5 pr-3">Type</th><th className="py-1.5 pr-3">Qty</th>
                      <th className="py-1.5 pr-3">Dims (mm)</th><th className="py-1.5 pr-3">Grade</th><th className="py-1.5 pr-3">Cast</th><th className="py-1.5">Delivery</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5 font-semibold text-slate-600 dark:text-slate-300">
                    {info.rows.map((r, i) => (
                      <tr key={i}>
                        <td className="py-1.5 pr-3 font-mono">{r.drawing_no}</td>
                        <td className="py-1.5 pr-3">{r.element_type}</td>
                        <td className="py-1.5 pr-3 text-primary font-black">{r.qty}</td>
                        <td className="py-1.5 pr-3">{r.length_mm}×{r.width_mm}×{r.thickness_mm}</td>
                        <td className="py-1.5 pr-3">{r.concrete_grade}</td>
                        <td className="py-1.5 pr-3">{r.planned_cast_date}</td>
                        <td className="py-1.5">{r.delivery_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
