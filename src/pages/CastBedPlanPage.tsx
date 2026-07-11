import React, { useEffect, useMemo, useState } from 'react'
import { Construction, FileEdit, Check, X, Calendar, CheckSquare, Square, QrCode } from 'lucide-react'
import {
  DndContext, useDraggable, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import { supabase } from '../lib/supabaseClient'
import { fetchRows, insertAudited, updateAudited, nowStamp, todayGulf } from '../lib/erp/db'
import { statusChipClass } from '../lib/erp/uiHelpers'
import { usePermissions } from '../lib/erp/usePermissions'
import { useAuth } from '../lib/useAuth'
import { generateElementCodes } from '../lib/erp/elementCodes'

const SHIFTS: Array<'Day' | 'Night'> = ['Day', 'Night']

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function cellId(bed: string, date: string, shift: string): string {
  return `${bed}|${date}|${shift}`
}

function elementsOf(row: any, elements: any[]): any[] {
  const codes = String(row.element_codes || '').split(',').map((c: string) => c.trim()).filter(Boolean)
  return elements.filter(e => codes.includes(e.element_code))
}

// ── Draggable schedule card ──────────────────────────────────────────────────
function ScheduleCard({ row, locked, onClick }: { row: any; locked: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: row.id, disabled: locked
  })
  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: isDragging ? 50 : undefined }
    : {}
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(locked ? {} : listeners)}
      {...(locked ? {} : attributes)}
      onClick={onClick}
      className={`rounded-lg border px-2 py-1.5 text-left w-full ${statusChipClass(row.status)} ${locked ? 'opacity-70 cursor-pointer' : 'cursor-grab active:cursor-grabbing'} ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="text-[9px] font-black uppercase truncate">{row.project_no || '—'}</div>
      <div className="text-[8px] font-mono truncate opacity-80">{row.drawing_no}</div>
      <div className="text-[8px] font-bold mt-0.5">{row.qty} pc · {row.status}</div>
    </div>
  )
}

// ── Droppable grid cell ──────────────────────────────────────────────────────
function GridCell({ id, cards, onEmptyClick }: { id: string; cards: any[]; onEmptyClick: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      onClick={() => { if (cards.length === 0) onEmptyClick() }}
      className={`min-h-[52px] rounded-lg border p-1 space-y-1 transition-colors ${isOver ? 'border-primary/50 bg-primary/5' : 'border-slate-100 dark:border-white/5'} ${cards.length === 0 ? 'cursor-pointer hover:border-primary/30' : ''}`}
    >
      {cards.length === 0 && <div className="h-full min-h-[44px] flex items-center justify-center text-[8px] text-slate-400 uppercase font-bold">+</div>}
      {cards.map(c => c.node)}
    </div>
  )
}

export default function CastBedPlanPage() {
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
  const [weekStart, setWeekStart] = useState(todayGulf())
  const [detailRow, setDetailRow] = useState<any | null>(null)
  const [quickPlan, setQuickPlan] = useState<{ bed: string; date: string; shift: string } | null>(null)
  const [busy, setBusy] = useState(false)

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
    setSchedule(cs)
    setElements(els)
    setProjects(prj)
    setDrawings(dwg)
    setBeds(pb)
    setMoulds(md)
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  const bedNames = useMemo(() => [...beds.map(b => b.bed_name), ...moulds.map(m => m.mould_name)], [beds, moulds])
  const dateCols = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const kpis = useMemo(() => {
    const weekEnd = addDays(weekStart, 6)
    const inWeek = schedule.filter(s => s.schedule_date >= weekStart && s.schedule_date <= weekEnd && s.status !== 'Cancelled')
    const bedsInUseToday = new Set(schedule.filter(s => s.schedule_date === todayGulf() && s.status !== 'Cancelled').map(s => s.bed)).size
    const bedsInUseWeek = new Set(inWeek.map(s => s.bed)).size
    return {
      scheduledWeek: inWeek.length,
      bedsInUseToday,
      completedWeek: inWeek.filter(s => s.status === 'Completed').length,
      utilization: bedNames.length ? Math.round((bedsInUseWeek / bedNames.length) * 100) : 0
    }
  }, [schedule, weekStart, bedNames])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over) return
    const row = schedule.find(s => s.id === active.id)
    if (!row) return
    const [bed, date, shift] = String(over.id).split('|')
    if (row.bed === bed && row.schedule_date === date && row.shift === shift) return
    setSchedule(prev => prev.map(s => s.id === row.id ? { ...s, bed, schedule_date: date, shift } : s))
    updateAudited('casting_schedule', row.id, { bed, schedule_date: date, shift }, userEmail,
      `Rescheduled ${row.drawing_no} → ${bed} on ${date} (${shift})`
    ).then(reload)
  }

  async function generateQr(row: any) {
    setBusy(true)
    try {
      const els = elementsOf(row, elements)
      const stamp = nowStamp()
      for (const el of els) {
        await updateAudited('elements', el.id, { qr_generated: true, qr_generated_at: stamp, status: 'QR Generated' }, userEmail, `QR generated for ${el.element_code}`)
      }
      await updateAudited('casting_schedule', row.id, { status: 'QR Generated' }, userEmail, `QR labels generated — ${row.drawing_no} (${els.length} pcs)`)
      await reload()
      setDetailRow(null)
    } finally {
      setBusy(false)
    }
  }

  async function setRowStatus(row: any, status: 'In Progress' | 'Completed' | 'Cancelled') {
    setBusy(true)
    try {
      await updateAudited('casting_schedule', row.id, { status }, userEmail, `Casting schedule ${row.drawing_no} → ${status}`)
      if (status === 'Completed') {
        const els = elementsOf(row, elements)
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
      setDetailRow(null)
    } finally {
      setBusy(false)
    }
  }

  // ── Quick Plan modal state ─────────────────────────────────────────────────
  const [qpProject, setQpProject] = useState('')
  const [qpDrawing, setQpDrawing] = useState('')
  const [qpQty, setQpQty] = useState(1)
  const [qpRemarks, setQpRemarks] = useState('')
  const [qpSaving, setQpSaving] = useState(false)
  const qpDrawings = useMemo(() => drawings.filter(d => !qpProject || d.project_no === qpProject), [drawings, qpProject])

  function openQuickPlan(bed: string, date: string, shift: string) {
    if (!editable) return
    setQpProject(''); setQpDrawing(''); setQpQty(1); setQpRemarks('')
    setQuickPlan({ bed, date, shift })
  }

  async function submitQuickPlan(e: React.FormEvent) {
    e.preventDefault()
    if (!quickPlan || qpSaving) return
    if (!qpProject || !qpDrawing || qpQty < 1) { alert('Select project, drawing and a quantity of at least 1.'); return }
    setQpSaving(true)
    try {
      const drawing = drawings.find(d => d.drawing_no === qpDrawing)
      const template = elements.find(el => el.drawing_no === qpDrawing)
      const codes = generateElementCodes(drawing, qpQty, new Set(elements.map(e => e.element_code)), drawings)

      const newElements = codes.map(code => ({
        element_code: code,
        project_no: qpProject,
        drawing_no: qpDrawing,
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
        planned_cast_date: quickPlan.date,
        bed: quickPlan.bed,
        mould: quickPlan.bed.startsWith('Mould') ? quickPlan.bed : (template?.mould || '—'),
        qr_generated: false,
        qr_generated_at: '',
        status: 'Planned',
        cast_date: '',
        remarks: qpRemarks
      }))

      await insertAudited('elements', newElements, userEmail, `Casting plan: ${codes.length} element(s) for ${qpDrawing}`)
      await insertAudited('casting_schedule', [{
        schedule_date: quickPlan.date,
        shift: quickPlan.shift,
        bed: quickPlan.bed,
        project_no: qpProject,
        drawing_no: qpDrawing,
        element_codes: codes.join(', '),
        qty: codes.length,
        status: 'Scheduled',
        remarks: qpRemarks
      }], userEmail, `Casting scheduled — ${qpDrawing} × ${codes.length} on ${quickPlan.date} (${quickPlan.bed})`)

      setQuickPlan(null)
      await reload()
    } finally {
      setQpSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5 gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Cast Bed <span className="text-primary font-light">Plan</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Drag a casting to a different bed, date or shift — click an empty cell to plan a new one</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="px-3 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-primary/30 hover:text-primary text-[10px] font-extrabold uppercase rounded-xl transition-all">← Prev</button>
          <button onClick={() => setWeekStart(todayGulf())} className="px-3 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-primary/30 hover:text-primary text-[10px] font-extrabold uppercase rounded-xl transition-all">Today</button>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="px-3 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-primary/30 hover:text-primary text-[10px] font-extrabold uppercase rounded-xl transition-all">Next →</button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Scheduled This Week', value: kpis.scheduledWeek, cls: 'text-slate-500' },
          { label: 'Beds In Use Today', value: kpis.bedsInUseToday, cls: 'text-amber-500' },
          { label: 'Completed This Week', value: kpis.completedWeek, cls: 'text-emerald-500' },
          { label: 'Utilization %', value: `${kpis.utilization}%`, cls: 'text-primary' }
        ].map(k => (
          <div key={k.label} className="glass-card-3d rounded-2xl p-4">
            <div className={`text-3xl font-black ${k.cls}`}>{k.value}</div>
            <div className="text-[9px] uppercase font-black text-slate-500 mt-1 tracking-wider">{k.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold animate-pulse">Loading cast bed plan…</div>
      ) : bedNames.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold uppercase">No beds or moulds registered</div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={editable ? handleDragEnd : () => {}}>
          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 p-4 overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header row: dates */}
              <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: `140px repeat(${dateCols.length}, 1fr)` }}>
                <div />
                {dateCols.map(d => (
                  <div key={d} className={`text-center text-[9px] font-black uppercase tracking-wider py-1 rounded-lg ${d === todayGulf() ? 'text-primary bg-primary/5' : 'text-slate-500'}`}>
                    {new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                  </div>
                ))}
              </div>

              {/* Bed rows */}
              {bedNames.map(bed => (
                <div key={bed} className="grid gap-2 mb-2 items-start" style={{ gridTemplateColumns: `140px repeat(${dateCols.length}, 1fr)` }}>
                  <div className="text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-300 py-2 truncate flex items-center gap-1" title={bed}><Construction size={12} className="shrink-0" /> {bed}</div>
                  {dateCols.map(date => (
                    <div key={date} className="space-y-1">
                      {SHIFTS.map(shift => {
                        const rows = schedule.filter(s => s.bed === bed && s.schedule_date === date && s.shift === shift)
                        const cards = rows.map(row => ({
                          node: (
                            <ScheduleCard
                              key={row.id}
                              row={row}
                              locked={!editable || row.status === 'Completed' || row.status === 'Cancelled'}
                              onClick={() => setDetailRow(row)}
                            />
                          )
                        }))
                        return (
                          <GridCell
                            key={shift}
                            id={cellId(bed, date, shift)}
                            cards={cards}
                            onEmptyClick={() => openQuickPlan(bed, date, shift)}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </DndContext>
      )}

      {/* ── Detail popover ────────────────────────────────────────────────── */}
      {detailRow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailRow(null)}>
          <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 p-5 max-w-md w-full space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-sm text-neutral-900 dark:text-white">{detailRow.schedule_date}</span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500">{detailRow.shift} Shift</span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 inline-flex items-center gap-1"><Construction size={11} /> {detailRow.bed}</span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${statusChipClass(detailRow.status)}`}>{detailRow.status}</span>
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {detailRow.project_no} • {detailRow.drawing_no} • <span className="text-primary">{detailRow.qty} element(s)</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 break-all">{detailRow.element_codes}</div>
            {detailRow.remarks && <div className="text-[10px] text-slate-500 italic flex items-center gap-1"><FileEdit size={11} className="shrink-0" /> {detailRow.remarks}</div>}

            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
              {elementsOf(detailRow, elements).map(el => (
                <span key={el.id} className={`text-[8.5px] font-mono font-bold px-2 py-1 rounded-md border inline-flex items-center gap-1 ${el.qr_generated ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}>
                  {el.qr_generated ? <CheckSquare size={10} /> : <Square size={10} />} {el.element_code} — {el.status}
                </span>
              ))}
            </div>

            {editable && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {detailRow.status === 'Scheduled' && (
                  <button disabled={busy} onClick={() => generateQr(detailRow)} className="px-3 py-1.5 bg-gradient-to-br from-primary to-primary-dark text-white text-[9px] font-extrabold uppercase rounded-lg btn-interactive">
                    {busy ? '…' : <span className="inline-flex items-center gap-1"><QrCode size={12} /> Generate QR Labels</span>}
                  </button>
                )}
                {detailRow.status === 'QR Generated' && (
                  <button disabled={busy} onClick={() => setRowStatus(detailRow, 'In Progress')} className="px-3 py-1.5 border border-orange-500/30 text-orange-500 bg-orange-500/5 text-[9px] font-extrabold uppercase rounded-lg transition-all">
                    ▶ Start Casting
                  </button>
                )}
                {detailRow.status === 'In Progress' && (
                  <button disabled={busy} onClick={() => setRowStatus(detailRow, 'Completed')} className="px-3 py-1.5 border border-emerald-500/30 text-emerald-500 bg-emerald-500/5 text-[9px] font-extrabold uppercase rounded-lg transition-all inline-flex items-center gap-1">
                    <Check size={11} /> Complete → Stockyard
                  </button>
                )}
                {(detailRow.status === 'Scheduled' || detailRow.status === 'QR Generated') && (
                  <button disabled={busy} onClick={() => setRowStatus(detailRow, 'Cancelled')} className="px-3 py-1.5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-primary text-[9px] font-extrabold uppercase rounded-lg transition-all inline-flex items-center gap-1">
                    <X size={11} /> Cancel
                  </button>
                )}
              </div>
            )}
            <button onClick={() => setDetailRow(null)} className="w-full mt-1 px-3 py-2 text-[9px] font-extrabold uppercase text-slate-500 hover:text-primary transition-all">Close</button>
          </div>
        </div>
      )}

      {/* ── Quick Plan modal ──────────────────────────────────────────────── */}
      {quickPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setQuickPlan(null)}>
          <form onSubmit={submitQuickPlan} className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 p-5 max-w-md w-full space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2 flex items-center gap-1.5">
              <Calendar size={13} className="shrink-0" /> Plan Casting — {quickPlan.bed}, {quickPlan.date} ({quickPlan.shift})
            </h3>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Project</span>
              <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={qpProject} onChange={e => { setQpProject(e.target.value); setQpDrawing('') }}>
                <option value="">Select…</option>
                {projects.map(p => <option key={p.id} value={p.project_no}>{p.project_no} — {p.project_name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Drawing (approved / IFC)</span>
              <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={qpDrawing} onChange={e => setQpDrawing(e.target.value)}>
                <option value="">Select…</option>
                {qpDrawings.map(d => (
                  <option key={d.id} value={d.drawing_no} disabled={d.status === 'Superseded'}>
                    {d.drawing_no} [{d.revision}] — {d.element_type} {d.status === 'Superseded' ? '(SUPERSEDED)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Quantity (elements)</span>
              <input type="number" min={1} max={60} className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={qpQty} onChange={e => setQpQty(Number(e.target.value))} />
            </label>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Remarks</span>
              <input type="text" className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={qpRemarks} onChange={e => setQpRemarks(e.target.value)} placeholder="Cage readiness, priorities…" />
            </label>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setQuickPlan(null)} className="flex-1 px-3 py-2.5 border border-slate-200 dark:border-white/10 text-slate-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">Cancel</button>
              <button type="submit" disabled={qpSaving} className="flex-1 bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-[10px] uppercase py-2.5 rounded-xl shadow-lg btn-interactive">
                {qpSaving ? 'Planning…' : 'Schedule Casting'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
