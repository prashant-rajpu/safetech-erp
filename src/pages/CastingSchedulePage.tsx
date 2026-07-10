import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fetchRows, insertAudited, updateAudited, nowStamp, todayGulf } from '../lib/erp/db'
import { printRegister, exportCsv, printQrLabels, type QrLabel } from '../lib/erp/printDoc'
import { statusChipClass } from '../lib/erp/uiHelpers'
import { usePermissions } from '../lib/erp/usePermissions'
import { useAuth } from '../lib/useAuth'
import { generateElementCodes } from '../lib/erp/elementCodes'

/** Full-detail QR payload for one element — token[1] is the scanner lookup key. */
export function elementQrPayload(el: any): string {
  return [
    'SPBM-EL',
    el.element_code,
    `Proj:${el.project_no}`,
    `Dwg:${el.drawing_no} ${el.revision || ''}`.trim(),
    `Type:${el.element_type}`,
    `Dims:${el.length_mm || 0}x${el.width_mm || 0}x${el.thickness_mm || 0}mm`,
    `Vol:${el.volume_cum || 0}m3`,
    `Wt:${el.weight_tons || 0}T`,
    `Bed:${el.bed || '-'}`,
    `Cast:${el.planned_cast_date || '-'}`
  ].join('|')
}

export function elementQrLabel(el: any): QrLabel {
  return {
    payload: elementQrPayload(el),
    code: el.element_code,
    lines: [
      ['Project', el.project_no],
      ['Drawing', `${el.drawing_no} ${el.revision || ''}`.trim()],
      ['Type', el.element_type],
      ['Dims (mm)', `${el.length_mm || 0} × ${el.width_mm || 0} × ${el.thickness_mm || 0}`],
      ['Vol / Wt', `${el.volume_cum || 0} m³ / ${el.weight_tons || 0} T`],
      ['Bed / Cast', `${el.bed || '—'} / ${el.planned_cast_date || '—'}`]
    ]
  }
}

export default function CastingSchedulePage() {
  const { profile, user } = useAuth()
  const { canEdit } = usePermissions()
  const editable = canEdit('planning')
  const userEmail = profile?.email || user?.email || ''

  const [schedule, setSchedule] = useState<any[]>([])
  const [elements, setElements] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [drawings, setDrawings] = useState<any[]>([])
  const [beds, setBeds] = useState<any[]>([])
  const [moulds, setMoulds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyRow, setBusyRow] = useState<string | null>(null)

  // Plan form
  const [fDate, setFDate] = useState(todayGulf())
  const [fShift, setFShift] = useState<'Day' | 'Night'>('Day')
  const [fBed, setFBed] = useState('')
  const [fProject, setFProject] = useState('')
  const [fDrawing, setFDrawing] = useState('')
  const [fQty, setFQty] = useState(1)
  const [fRemarks, setFRemarks] = useState('')
  const [saving, setSaving] = useState(false)

  async function reload() {
    setLoading(true)
    const [cs, els, prj, dwg, pb, md] = await Promise.all([
      fetchRows('casting_schedule'),
      fetchRows('elements'),
      fetchRows('projects'),
      fetchRows('drawings'),
      fetchRows('production_beds'),
      fetchRows('moulds')
    ])
    setSchedule(cs.sort((a, b) => String(a.schedule_date).localeCompare(String(b.schedule_date))))
    setElements(els)
    setProjects(prj)
    setDrawings(dwg)
    setBeds(pb)
    setMoulds(md)
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  const projectDrawings = useMemo(
    () => drawings.filter(d => !fProject || d.project_no === fProject),
    [drawings, fProject]
  )

  const kpis = useMemo(() => ({
    scheduled: schedule.filter(s => s.status === 'Scheduled').length,
    qrGenerated: schedule.filter(s => s.status === 'QR Generated').length,
    inProgress: schedule.filter(s => s.status === 'In Progress').length,
    completed: schedule.filter(s => s.status === 'Completed').length
  }), [schedule])

  // Bed load for the form's selected date
  const bedLoad = useMemo(() => {
    const load: Record<string, number> = {}
    for (const s of schedule) {
      if (s.schedule_date === fDate && s.status !== 'Cancelled') {
        load[s.bed] = (load[s.bed] || 0) + Number(s.qty || 0)
      }
    }
    return load
  }, [schedule, fDate])

  function elementsOf(row: any): any[] {
    const codes = String(row.element_codes || '').split(',').map(c => c.trim()).filter(Boolean)
    return elements.filter(e => codes.includes(e.element_code))
  }

  async function planCasting(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    if (!fBed || !fProject || !fDrawing || fQty < 1) {
      alert('Select bed, project, drawing and a quantity of at least 1.')
      return
    }
    setSaving(true)
    try {
      const drawing = drawings.find(d => d.drawing_no === fDrawing)
      const template = elements.find(el => el.drawing_no === fDrawing) // reuse dims from sibling elements
      const codes = generateElementCodes(drawing, fQty, new Set(elements.map(e => e.element_code)), drawings)

      const newElements = codes.map(code => ({
        element_code: code,
        project_no: fProject,
        drawing_no: fDrawing,
        revision: drawing?.revision || 'R0',
        element_type: drawing?.element_type || 'EL',
        building: template?.building || '',
        floor: template?.floor || '',
        zone: template?.zone || '',
        length_mm: template?.length_mm || 0,
        width_mm: template?.width_mm || 0,
        thickness_mm: template?.thickness_mm || 0,
        volume_cum: template?.volume_cum || 0,
        weight_tons: template?.weight_tons || 0,
        concrete_grade: template?.concrete_grade || '',
        mix_design: template?.mix_design || '',
        planned_cast_date: fDate,
        bed: fBed,
        mould: fBed.startsWith('Mould') ? fBed : (template?.mould || '—'),
        qr_generated: false,
        qr_generated_at: '',
        status: 'Planned',
        cast_date: '',
        remarks: fRemarks
      }))

      await insertAudited('elements', newElements, userEmail, `Casting plan: ${codes.length} element(s) for ${fDrawing}`)
      await insertAudited('casting_schedule', [{
        schedule_date: fDate,
        shift: fShift,
        bed: fBed,
        project_no: fProject,
        drawing_no: fDrawing,
        element_codes: codes.join(', '),
        qty: codes.length,
        status: 'Scheduled',
        remarks: fRemarks
      }], userEmail, `Casting scheduled — ${fDrawing} × ${codes.length} on ${fDate} (${fBed})`)

      setFQty(1); setFRemarks('')
      await reload()
    } finally {
      setSaving(false)
    }
  }

  /** THE key workflow: QR labels are generated once elements are planned to cast. */
  async function generateQr(row: any, reprint = false) {
    setBusyRow(row.id)
    try {
      const els = elementsOf(row)
      if (!els.length) {
        alert('No element records found for this schedule row.')
        return
      }
      if (!reprint) {
        const stamp = nowStamp()
        for (const el of els) {
          await updateAudited('elements', el.id, { qr_generated: true, qr_generated_at: stamp, status: 'QR Generated' }, userEmail, `QR generated for ${el.element_code}`)
        }
        await updateAudited('casting_schedule', row.id, { status: 'QR Generated' }, userEmail, `QR labels generated — ${row.drawing_no} (${els.length} pcs)`)
      }
      await printQrLabels(els.map(el => elementQrLabel({ ...el, qr_generated: true })))
      if (!reprint) await reload()
    } finally {
      setBusyRow(null)
    }
  }

  async function setRowStatus(row: any, status: 'In Progress' | 'Completed' | 'Cancelled') {
    setBusyRow(row.id)
    try {
      await updateAudited('casting_schedule', row.id, { status }, userEmail, `Casting schedule ${row.drawing_no} → ${status}`)
      const els = elementsOf(row)
      if (status === 'Completed') {
        // flow elements into the downstream departments automatically
        for (const el of els) {
          await updateAudited('elements', el.id, { status: 'Cast', cast_date: row.schedule_date }, userEmail, `Element cast — ${el.element_code}`)
          await supabase.from('stockyard_inventory').insert([{
            element_code: el.element_code, project_no: el.project_no, building: el.building, floor: el.floor, zone: el.zone,
            element_type: el.element_type, revision: el.revision, length_mm: el.length_mm, width_mm: el.width_mm, thickness_mm: el.thickness_mm,
            volume_cum: el.volume_cum, weight_tons: el.weight_tons, cast_date: row.schedule_date, bay_location: 'Curing Area',
            status: 'Curing', curing_days: 0, remarks: `Cast on ${row.bed} (${row.shift} shift)`
          }])
          await supabase.from('element_traceability').upsert([{
            element_code: el.element_code,
            planning_timestamp: el.qr_generated_at || nowStamp(),
            casting_timestamp: `${row.schedule_date} —`,
            qc_timestamp: 'Pending', curing_timestamp: nowStamp(), stockyard_timestamp: nowStamp(),
            loading_timestamp: 'Pending', dispatch_timestamp: 'Pending', delivery_timestamp: 'Pending'
          }], { onConflict: 'element_code' })
        }
      }
      await reload()
    } finally {
      setBusyRow(null)
    }
  }

  const printCols = [
    { key: 'schedule_date', label: 'Date' }, { key: 'shift', label: 'Shift' }, { key: 'bed', label: 'Bed / Mould' },
    { key: 'project_no', label: 'Project' }, { key: 'drawing_no', label: 'Drawing' }, { key: 'element_codes', label: 'Element Codes' },
    { key: 'qty', label: 'Qty' }, { key: 'status', label: 'Status' }, { key: 'remarks', label: 'Remarks' }
  ]

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5 gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Casting <span className="text-red-500 font-light">Schedule</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Plan elements to beds — QR labels generate at planning and carry full details for every downstream department</p>
        </div>
        <div className="flex gap-2 no-print">
          <button onClick={() => exportCsv('casting-schedule.csv', printCols, schedule)} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">📤 CSV</button>
          <button onClick={() => printRegister({ title: 'Casting Schedule', subtitle: 'Bed & mould production plan', paper: 'A4', landscape: true, columns: printCols, rows: schedule, meta: [`Records: ${schedule.length}`] })} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">🖨 Print</button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Scheduled', value: kpis.scheduled, cls: 'text-slate-500' },
          { label: 'QR Generated', value: kpis.qrGenerated, cls: 'text-amber-500' },
          { label: 'In Progress', value: kpis.inProgress, cls: 'text-orange-500' },
          { label: 'Completed', value: kpis.completed, cls: 'text-emerald-500' }
        ].map(k => (
          <div key={k.label} className="glass-card-3d rounded-2xl p-4">
            <div className={`text-3xl font-black ${k.cls}`}>{k.value}</div>
            <div className="text-[9px] uppercase font-black text-slate-500 mt-1 tracking-wider">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan form */}
        {editable && (
          <form onSubmit={planCasting} className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3 h-fit">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
              🏗️ Plan Elements to Cast
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Casting Date</span>
                <input type="date" className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={fDate} onChange={e => setFDate(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Shift</span>
                <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={fShift} onChange={e => setFShift(e.target.value as 'Day' | 'Night')}>
                  <option>Day</option><option>Night</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Bed / Mould</span>
              <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={fBed} onChange={e => setFBed(e.target.value)}>
                <option value="">Select…</option>
                <optgroup label="Production Beds">
                  {beds.map(b => <option key={b.id} value={b.bed_name}>{b.bed_name} ({b.type})</option>)}
                </optgroup>
                <optgroup label="Moulds">
                  {moulds.map(mo => <option key={mo.id} value={mo.mould_name}>{mo.mould_name} ({mo.type})</option>)}
                </optgroup>
              </select>
            </label>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Project</span>
              <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={fProject} onChange={e => { setFProject(e.target.value); setFDrawing('') }}>
                <option value="">Select…</option>
                {projects.map(p => <option key={p.id} value={p.project_no}>{p.project_no} — {p.project_name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Drawing (approved / IFC)</span>
              <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={fDrawing} onChange={e => setFDrawing(e.target.value)}>
                <option value="">Select…</option>
                {projectDrawings.map(d => (
                  <option key={d.id} value={d.drawing_no} disabled={d.status === 'Superseded'}>
                    {d.drawing_no} [{d.revision}] — {d.element_type} {d.status === 'Superseded' ? '(SUPERSEDED)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Quantity (elements)</span>
              <input type="number" min={1} max={60} className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={fQty} onChange={e => setFQty(Number(e.target.value))} />
            </label>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Remarks</span>
              <input type="text" className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={fRemarks} onChange={e => setFRemarks(e.target.value)} placeholder="Cage readiness, priorities…" />
            </label>
            <button type="submit" disabled={saving} className="w-full bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-xs uppercase py-3 rounded-xl shadow-lg btn-interactive">
              {saving ? 'Planning…' : '📅 Schedule Casting'}
            </button>
            <p className="text-[9px] text-slate-500 leading-relaxed">Unique element codes are auto-generated in plant format. Generate QR labels from the schedule list — labels carry project, drawing, dimensions, bed and casting details for Production, QA/QC, Stockyard, Dispatch and Delivery.</p>

            {/* Bed load for selected date */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-1.5">
              <span className="text-[9px] uppercase font-black text-slate-500 block">Bed Load — {fDate}</span>
              {[...beds.map(b => b.bed_name), ...moulds.map(mo => mo.mould_name)].map(name => {
                const n = bedLoad[name] || 0
                return (
                  <div key={name} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                    <span className="w-20 truncate">{name}</span>
                    <div className="flex-grow h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${n > 6 ? 'bg-red-500' : n > 3 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, n * 12)}%` }} />
                    </div>
                    <span className="w-6 text-right">{n}</span>
                  </div>
                )
              })}
            </div>
          </form>
        )}

        {/* Schedule list */}
        <div className={`${editable ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-3`}>
          {loading ? (
            <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold animate-pulse">Loading casting schedule…</div>
          ) : schedule.length === 0 ? (
            <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold uppercase">No castings scheduled</div>
          ) : (
            schedule.map(row => {
              const els = elementsOf(row)
              const busy = busyRow === row.id
              return (
                <div key={row.id} className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-neutral-900 dark:text-white">{row.schedule_date}</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500">{row.shift} Shift</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/20">🏗 {row.bed}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${statusChipClass(row.status)}`}>{row.status}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1.5">
                        {row.project_no} • {row.drawing_no} • <span className="text-red-500">{row.qty} element(s)</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-1 break-all">{row.element_codes}</div>
                      {row.remarks && <div className="text-[10px] text-slate-500 italic mt-1">📝 {row.remarks}</div>}
                    </div>

                    {editable && (
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        {row.status === 'Scheduled' && (
                          <button disabled={busy} onClick={() => generateQr(row)} className="px-3 py-1.5 bg-gradient-to-br from-red-500 to-red-700 text-white text-[9px] font-extrabold uppercase rounded-lg btn-interactive">
                            {busy ? '…' : '⬛ Generate QR Labels'}
                          </button>
                        )}
                        {(row.status === 'QR Generated' || row.status === 'In Progress' || row.status === 'Completed') && (
                          <button disabled={busy} onClick={() => generateQr(row, true)} className="px-3 py-1.5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-red-500 text-[9px] font-extrabold uppercase rounded-lg transition-all">
                            🖨 Reprint Labels
                          </button>
                        )}
                        {row.status === 'QR Generated' && (
                          <button disabled={busy} onClick={() => setRowStatus(row, 'In Progress')} className="px-3 py-1.5 border border-orange-500/30 text-orange-500 bg-orange-500/5 text-[9px] font-extrabold uppercase rounded-lg transition-all">
                            ▶ Start Casting
                          </button>
                        )}
                        {row.status === 'In Progress' && (
                          <button disabled={busy} onClick={() => setRowStatus(row, 'Completed')} className="px-3 py-1.5 border border-emerald-500/30 text-emerald-500 bg-emerald-500/5 text-[9px] font-extrabold uppercase rounded-lg transition-all">
                            ✓ Complete → Stockyard
                          </button>
                        )}
                        {(row.status === 'Scheduled' || row.status === 'QR Generated') && (
                          <button disabled={busy} onClick={() => setRowStatus(row, 'Cancelled')} className="px-3 py-1.5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-red-500 text-[9px] font-extrabold uppercase rounded-lg transition-all">
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Per-element QR state strip */}
                  {els.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
                      {els.map(el => (
                        <span key={el.id} className={`text-[8.5px] font-mono font-bold px-2 py-1 rounded-md border ${el.qr_generated ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}>
                          {el.qr_generated ? '⬛' : '⬜'} {el.element_code} — {el.status}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
