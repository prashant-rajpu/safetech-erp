import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend
} from 'recharts'
import {
  computeTrailerCycleTimes, dailyThroughput, detectIdleBottlenecks,
  currentFleetStatus, siteCongestionScore, generateAlerts,
  type FleetStatusEvent
} from '../lib/analytics'
import { supabase } from '../lib/supabaseClient'
import { fetchRows } from '../lib/erp/db'
import CountUpCard from '../components/CountUpCard'
import AlertsPanel from '../components/AlertsPanel'
import { SectionTitle, MiniTable } from '../components/erp/DashboardWidgets'
import { statusChipClass } from '../lib/erp/uiHelpers'

const KANBAN_COLUMNS = [
  { key: 'empty', label: 'Empty', statuses: ['IN FACTORY EMPTY'], color: '#94a3b8' },
  { key: 'loading', label: 'Loading', statuses: ['UNDER LOADING AT SY'], color: '#f59e0b' },
  { key: 'dispatched', label: 'Dispatched', statuses: ['SHIFTING AT SITE', 'INTERNAL SHIFTING'], color: '#ef4444' },
  { key: 'not_offload', label: 'Not Offloaded', statuses: ['NOT OFFLOAD'], color: '#991b1b' },
  { key: 'returning', label: 'Returning', statuses: ['EMPTY/BACK TO FACTORY'], color: '#10b981' },
]

function columnFor(statusText: string){
  return KANBAN_COLUMNS.find(c => c.statuses.includes(statusText)) ?? KANBAN_COLUMNS[0]
}

const TABS = [
  { key: 'executive', label: 'Executive Overview', icon: '👔' },
  { key: 'production', label: 'Production', icon: '⚙️' },
  { key: 'planning', label: 'Planning', icon: '📅' },
  { key: 'dispatch', label: 'Dispatch', icon: '🚚' },
  { key: 'yard', label: 'Yard', icon: '🏗️' },
  { key: 'quality', label: 'Quality', icon: '🛡️' },
] as const

type TabKey = typeof TABS[number]['key']
type Db = Record<string, any[]>

const EXTRA_TABLES = [
  'elements', 'casting_schedule', 'concrete_batches', 'production_casting',
  'stockyard_inventory', 'storage_zones', 'ncr_register', 'punch_list',
  'qc_inspections', 'post_casting_inspections', 'approvals', 'projects',
  'delivery_schedule', 'allocations', 'gate_passes', 'boq_items',
  'production_beds', 'audit_logs', 'drawings'
]

const PIE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#94a3b8', '#8b5cf6', '#0ea5e9', '#991b1b', '#f97316', '#14b8a6']

export default function Dashboard(){
  const [tab, setTab] = useState<TabKey>('executive')
  const [kpis, setKpis] = useState({ trips: 0, avgCycleHours: 0, idleCount: 0, volume: 0 })
  const [fleetEvents, setFleetEvents] = useState<FleetStatusEvent[]>([])
  const [dailyTrend, setDailyTrend] = useState<{ date: string, trips: number, volume: number }[]>([])
  const [trailerPlates, setTrailerPlates] = useState<Record<string, string>>({})
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [db, setDb] = useState<Db>({})
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    async function load(){
      const [{ data: fleet }, { data: dels }, { data: trailers }] = await Promise.all([
        supabase.from('fleet_status').select('*').limit(1000),
        supabase.from('deliveries').select('*').limit(1000),
        supabase.from('trailers').select('id,plate_no').limit(500),
      ])
      const extra = await Promise.all(EXTRA_TABLES.map(t => fetchRows(t)))
      const map: Db = {}
      EXTRA_TABLES.forEach((t, i) => { map[t] = extra[i] })
      setDb(map)
      setDeliveries(dels || [])

      const events = (fleet || []).map((f: any) => ({
        trailer_id: f.trailer_id, status_text: f.status_text,
        status_timestamp: f.status_timestamp, site_location: f.site_location
      })) as FleetStatusEvent[]

      const cycles = computeTrailerCycleTimes(events)
      const all = Object.values(cycles).flat()
      const avgMins = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0

      const daily = dailyThroughput(dels || [])
      const trips = daily.reduce((a, b: any) => a + b.trips, 0)
      const volume = daily.reduce((a, b: any) => a + b.volume, 0)
      const idle = detectIdleBottlenecks(events, 24)

      const plateMap: Record<string, string> = {}
      for (const t of trailers || []) plateMap[t.id] = t.plate_no

      setKpis({ trips, avgCycleHours: Number((avgMins / 60).toFixed(1)), idleCount: idle.length, volume: Number(volume.toFixed(1)) })
      setFleetEvents(events)
      setDailyTrend(daily.map((d: any) => ({ date: d.date.slice(5), trips: d.trips, volume: Number(d.volume.toFixed(1)) })))
      setTrailerPlates(plateMap)
      setLoading(false)
    }
    load()
  }, [])

  const current = useMemo(()=> currentFleetStatus(fleetEvents), [fleetEvents])

  const donutData = useMemo(()=>{
    const counts: Record<string, number> = {}
    for (const e of current){
      const col = columnFor(e.status_text)
      counts[col.label] = (counts[col.label] || 0) + 1
    }
    return KANBAN_COLUMNS.map(c => ({ name: c.label, value: counts[c.label] || 0, color: c.color })).filter(d => d.value > 0)
  }, [current])

  const congestion = useMemo(()=> siteCongestionScore(fleetEvents, 24).slice(0, 6), [fleetEvents])
  const alerts = useMemo(()=> generateAlerts(siteCongestionScore(fleetEvents, 24), 24), [fleetEvents])

  // operational "today" = latest data day so seeded demo data stays meaningful
  const today = useMemo(() => {
    const dates = deliveries.map(d => d.delivery_date).filter(Boolean).sort()
    return dates[dates.length - 1] || new Date().toISOString().slice(0, 10)
  }, [deliveries])

  const sum = (rows: any[], k: string) => Number(rows.reduce((a, r) => a + (Number(r[k]) || 0), 0).toFixed(1))

  // ── derived widget data ────────────────────────────────────────────────────
  const elements = db.elements || []
  const castingSchedule = db.casting_schedule || []
  const ncrs = db.ncr_register || []
  const approvalsPending = (db.approvals || []).filter(a => a.status === 'Pending')
  const todaysDeliveries = deliveries.filter(d => d.delivery_date === today)
  const upcomingCastings = castingSchedule.filter(c => c.schedule_date >= today && !['Completed', 'Cancelled'].includes(c.status)).slice(0, 6)
  const upcomingDispatches = (db.delivery_schedule || []).filter(s => s.schedule_date >= today && s.status !== 'Completed').slice(0, 6)
  const delayedElements = elements.filter(e => e.planned_cast_date && e.planned_cast_date < today && ['Planned', 'QR Generated'].includes(e.status))
  const openNcrs = ncrs.filter(n => n.status !== 'Closed')

  const elementFunnel = useMemo(() => {
    const stages = ['Planned', 'QR Generated', 'Cast', 'Curing', 'Ready', 'Loaded', 'Dispatched', 'Delivered', 'Rejected']
    return stages.map(s => ({ name: s, value: elements.filter(e => e.status === s).length })).filter(d => d.value > 0)
  }, [elements])

  const bedUtilization = useMemo(() => {
    const beds = (db.production_beds || []).map(b => b.bed_name)
    const active = castingSchedule.filter(c => !['Completed', 'Cancelled'].includes(c.status))
    return beds.map(bed => ({ bed, planned: active.filter(c => c.bed === bed).reduce((a, c) => a + (Number(c.qty) || 0), 0) }))
  }, [db.production_beds, castingSchedule])

  const concreteByGrade = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of db.concrete_batches || []) map.set(b.grade, Number(((map.get(b.grade) || 0) + (Number(b.volume_cum) || 0)).toFixed(1)))
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [db.concrete_batches])

  const projectProgress = useMemo(() => (db.projects || []).filter(p => p.active !== false && p.status !== 'Completed').map(p => {
    const pe = elements.filter(e => e.project_no === p.project_no)
    const done = pe.filter(e => ['Cast', 'Curing', 'Ready', 'Loaded', 'Dispatched', 'Delivered'].includes(e.status)).length
    return { project: p.project_no, name: p.project_name, planned: pe.length, done, pct: pe.length ? Math.round(done / pe.length * 100) : 0 }
  }).filter(p => p.planned > 0), [db.projects, elements])

  const recentActivities = (db.audit_logs || []).slice(-8).reverse()
  const yardInv = db.stockyard_inventory || []
  const qcPre = db.qc_inspections || []
  const qcPost = db.post_casting_inspections || []

  if(loading) return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading control center telemetry…</div>

  return (
    <div className="space-y-6">
      {/* Page Title Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Operations <span className="text-red-500 font-light">Control Center</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Precast manufacturing, yard & logistics — live from all departments</p>
        </div>
        <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 shadow-md shadow-red-500/5 mt-3 md:mt-0 max-w-fit">
          ● OPERATIONAL DAY {today}
        </div>
      </div>

      {/* Tab bar */}
      <div className="glass-panel rounded-2xl p-2 border border-slate-200 dark:border-white/5 flex flex-wrap gap-1.5 no-print">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 rounded-xl text-[10.5px] font-extrabold uppercase tracking-wider transition-all ${tab === t.key
              ? 'bg-red-500/15 text-red-500 border border-red-500/20 shadow-sm shadow-red-500/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/5 border border-transparent'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══ EXECUTIVE OVERVIEW ═══ */}
      {tab === 'executive' && (
        <div className="space-y-6">
          <AlertsPanel alerts={alerts} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CountUpCard label="Today's Trips" value={todaysDeliveries.length} />
            <CountUpCard label="Today's Volume (m³)" value={sum(todaysDeliveries, 'volume_cum')} />
            <CountUpCard label="Elements Tracked" value={elements.length} />
            <CountUpCard label="Open NCRs" value={openNcrs.length} accent="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>Element Lifecycle Status</SectionTitle>
              {elementFunnel.length === 0 ? <div className="text-neutral-500 text-sm py-16 text-center">No elements registered.</div> : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={elementFunnel} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                      {elementFunnel.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Legend iconSize={8} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>Projects Progress (elements cast)</SectionTitle>
              <div className="space-y-3 py-2">
                {projectProgress.length === 0 ? <div className="text-neutral-500 text-sm py-16 text-center">No active project elements.</div> :
                  projectProgress.map(p => (
                    <div key={p.project} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span className="truncate">{p.project} — {p.name}</span>
                        <span className="text-red-500">{p.done}/{p.planned} ({p.pct}%)</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-700 transition-all" style={{ width: `${p.pct}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>Pending Approvals ({approvalsPending.length})</SectionTitle>
              <div className="space-y-2">
                {approvalsPending.length === 0 ? <div className="text-neutral-500 text-xs py-8 text-center">Nothing awaiting approval.</div> :
                  approvalsPending.map(a => (
                    <div key={a.id} className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs">
                      <div className="font-black text-amber-500 text-[10px] uppercase">{a.type} — {a.reference}</div>
                      <div className="text-slate-600 dark:text-slate-300 font-semibold mt-0.5 text-[11px]">{a.description}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">→ {a.approver}</div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>Upcoming Castings</SectionTitle>
              <MiniTable cols={[{ key: 'schedule_date', label: 'Date' }, { key: 'bed', label: 'Bed' }, { key: 'qty', label: 'Qty' }, { key: 'status', label: 'Status' }]} rows={upcomingCastings} empty="No upcoming castings" />
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>Upcoming Dispatches</SectionTitle>
              <MiniTable cols={[{ key: 'schedule_date', label: 'Date' }, { key: 'project_no', label: 'Project' }, { key: 'qty', label: 'Qty' }, { key: 'status', label: 'Status' }]} rows={upcomingDispatches} empty="No planned dispatches" />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5">
            <SectionTitle>Recent Activities (Audit Trail)</SectionTitle>
            <div className="space-y-1.5">
              {recentActivities.length === 0 ? <div className="text-neutral-500 text-xs py-6 text-center">No recorded activity yet.</div> :
                recentActivities.map(a => (
                  <div key={a.id} className="flex items-center justify-between text-[11px] py-1.5 border-b border-slate-100 dark:border-white/5 font-semibold text-slate-600 dark:text-slate-400">
                    <span className="truncate">🕘 {a.details}</span>
                    <span className="text-[9px] text-slate-400 shrink-0 ml-3">{a.ts} • {a.user_email}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ PRODUCTION ═══ */}
      {tab === 'production' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CountUpCard label="Castings Logged" value={(db.production_casting || []).length} />
            <CountUpCard label="Concrete Batches" value={(db.concrete_batches || []).length} />
            <CountUpCard label="Volume Batched (m³)" value={sum(db.concrete_batches || [], 'volume_cum')} />
            <CountUpCard label="Delayed Elements" value={delayedElements.length} accent="red" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>Concrete Consumption by Grade (m³)</SectionTitle>
              {concreteByGrade.length === 0 ? <div className="text-neutral-500 text-sm py-16 text-center">No batches logged.</div> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={concreteByGrade}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>Bed Utilization (open planned elements)</SectionTitle>
              <div className="space-y-3 py-2">
                {bedUtilization.map(b => (
                  <div key={b.bed} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>{b.bed}</span><span className="text-red-500">{b.planned} pcs</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${b.planned > 6 ? 'bg-red-500' : b.planned > 3 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, b.planned * 12)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-white/5">
            <SectionTitle>Casting Progress — Schedule Status</SectionTitle>
            <MiniTable
              cols={[{ key: 'schedule_date', label: 'Date' }, { key: 'shift', label: 'Shift' }, { key: 'bed', label: 'Bed' }, { key: 'project_no', label: 'Project' }, { key: 'drawing_no', label: 'Drawing' }, { key: 'qty', label: 'Qty' }, { key: 'status', label: 'Status' }]}
              rows={castingSchedule.slice(0, 10)}
              empty="No casting schedule entries"
            />
            {delayedElements.length > 0 && (
              <div className="mt-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-[11px] font-bold text-red-500">
                ⚠ {delayedElements.length} element(s) past planned casting date: {delayedElements.slice(0, 4).map(e => e.element_code).join(', ')}{delayedElements.length > 4 ? '…' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ PLANNING ═══ */}
      {tab === 'planning' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CountUpCard label="Elements Planned" value={elements.filter(e => e.status === 'Planned').length} />
            <CountUpCard label="QR Generated" value={elements.filter(e => e.status === 'QR Generated').length} />
            <CountUpCard label="Open Schedules" value={castingSchedule.filter(c => !['Completed', 'Cancelled'].includes(c.status)).length} />
            <CountUpCard label="Approved Drawings" value={(db.drawings || []).filter(d => ['Approved', 'IFC'].includes(d.status)).length} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>Upcoming Castings (next in plan)</SectionTitle>
              <MiniTable cols={[{ key: 'schedule_date', label: 'Date' }, { key: 'shift', label: 'Shift' }, { key: 'bed', label: 'Bed' }, { key: 'element_codes', label: 'Elements' }, { key: 'status', label: 'Status' }]} rows={upcomingCastings} empty="Nothing scheduled ahead" />
              <Link to="/casting-schedule" className="inline-block mt-3 text-[10px] font-black uppercase text-red-500 hover:underline">→ Open Casting Schedule</Link>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>Elements Awaiting QR Generation</SectionTitle>
              <MiniTable cols={[{ key: 'element_code', label: 'Element' }, { key: 'project_no', label: 'Project' }, { key: 'planned_cast_date', label: 'Planned' }, { key: 'status', label: 'Status' }]} rows={elements.filter(e => e.status === 'Planned').slice(0, 10)} empty="All planned elements have QR labels" />
              <Link to="/project-import" className="inline-block mt-3 text-[10px] font-black uppercase text-red-500 hover:underline">→ Project Auto-Import</Link>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DISPATCH (original fleet telemetry preserved) ═══ */}
      {tab === 'dispatch' && (
        <div className="space-y-6">
          <AlertsPanel alerts={alerts} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CountUpCard label="Total Trips" value={kpis.trips} />
            <CountUpCard label="Avg Cycle (Hrs)" value={kpis.avgCycleHours} />
            <CountUpCard label="Idle Trailers (>24h)" value={kpis.idleCount} accent="red" />
            <CountUpCard label="Total Shipped (m³)" value={kpis.volume} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>Current Fleet Status</SectionTitle>
              {donutData.length === 0 ? (
                <div className="text-neutral-500 text-sm py-16 text-center">No active fleet status logged.</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                      {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Legend iconSize={8} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>Bottleneck Leaderboard (Trailers per Site)</SectionTitle>
              {congestion.every(c => c.count === 0) ? (
                <div className="text-neutral-500 text-sm py-16 text-center">No bottleneck congestion detected.</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={congestion} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="#94a3b8" allowDecimals={false} fontSize={11} />
                    <YAxis type="category" dataKey="site" stroke="#94a3b8" width={90} fontSize={11} />
                    <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {congestion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#ff5500' : '#ffaa00'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel rounded-2xl p-5 border border-white/5">
            <SectionTitle>Daily Precast Delivery Trends</SectionTitle>
            {dailyTrend.length === 0 ? (
              <div className="text-neutral-500 text-sm py-16 text-center">No deliveries logged in system database.</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Legend iconSize={8} iconType="circle" />
                  <Line type="monotone" dataKey="trips" stroke="#ffaa00" strokeWidth={3} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="volume" name="Volume (m³)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Kanban Status Board (Live Vehicles) */}
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Live Vehicles — Trailer Dispatch & Logistics Board
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {KANBAN_COLUMNS.map(col => {
                const items = current.filter(e => columnFor(e.status_text).key === col.key)
                return (
                  <div key={col.key} className="glass-panel border border-white/5 rounded-2xl p-3 min-h-[160px] flex flex-col">
                    <div className="text-[11px] uppercase tracking-wider font-extrabold pb-2 border-b border-white/5 flex items-center justify-between mb-3" style={{ color: col.color }}>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: col.color, boxShadow: `0 0 8px ${col.color}` }} />
                        {col.label}
                      </span>
                      <span className="bg-white/5 text-slate-300 px-2 py-0.5 rounded text-[10px]">{items.length}</span>
                    </div>
                    <div className="space-y-2 flex-grow">
                      {items.map(e => (
                        <motion.div
                          key={e.trailer_id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-xs bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 flex flex-col gap-1 shadow-md shadow-black/5 dark:shadow-black/30 hover:border-red-500/20 transition-all duration-200"
                        >
                          <span className="font-extrabold text-neutral-800 dark:text-white">{trailerPlates[e.trailer_id] || e.trailer_id.slice(0, 8)}</span>
                          {e.site_location && (
                            <span className="text-[10px] text-slate-400 tracking-wide truncate">📍 {e.site_location}</span>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>Today's Deliveries ({todaysDeliveries.length})</SectionTitle>
              <MiniTable cols={[{ key: 'dn_no', label: 'DN' }, { key: 'project_no', label: 'Project' }, { key: 'element_type', label: 'Type' }, { key: 'element_count', label: 'Pcs' }, { key: 'volume_cum', label: 'm³' }]} rows={todaysDeliveries.slice(0, 10)} empty="No deliveries today" />
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>Gate Passes ({(db.gate_passes || []).length})</SectionTitle>
              <MiniTable cols={[{ key: 'gp_no', label: 'GP' }, { key: 'trailer_plate', label: 'Trailer' }, { key: 'project_no', label: 'Project' }, { key: 'status', label: 'Status' }]} rows={(db.gate_passes || []).slice(0, 10)} empty="No gate passes" />
            </div>
          </div>
        </div>
      )}

      {/* ═══ YARD ═══ */}
      {tab === 'yard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CountUpCard label="Elements in Yard" value={yardInv.length} />
            <CountUpCard label="Ready for Dispatch" value={yardInv.filter(i => i.status === 'Ready').length} />
            <CountUpCard label="Curing" value={yardInv.filter(i => i.status === 'Curing').length} />
            <CountUpCard label="Rejected / QC Hold" value={yardInv.filter(i => i.status === 'Rejected').length} accent="red" />
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-white/5">
            <SectionTitle>Storage Zone Utilization</SectionTitle>
            <div className="space-y-3 py-2">
              {(db.storage_zones || []).map(z => {
                const pct = z.capacity_pcs ? Math.round((z.current_pcs / z.capacity_pcs) * 100) : 0
                return (
                  <div key={z.id} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>{z.zone_name} <span className="text-slate-400">({z.bays})</span></span>
                      <span className={pct > 85 ? 'text-red-500' : pct > 60 ? 'text-amber-500' : 'text-emerald-500'}>{z.current_pcs}/{z.capacity_pcs} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${pct > 85 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-5 border border-white/5">
            <SectionTitle>Element Inventory Snapshot</SectionTitle>
            <MiniTable
              cols={[{ key: 'element_code', label: 'Element' }, { key: 'project_no', label: 'Project' }, { key: 'element_type', label: 'Type' }, { key: 'bay_location', label: 'Bay' }, { key: 'curing_days', label: 'Curing d' }, { key: 'status', label: 'Status' }]}
              rows={yardInv.slice(0, 12)}
              empty="Yard is empty"
            />
          </div>
        </div>
      )}

      {/* ═══ QUALITY ═══ */}
      {tab === 'quality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CountUpCard label="Pre-Pour Inspections" value={qcPre.length} />
            <CountUpCard label="Post-Cast Inspections" value={qcPost.length} />
            <CountUpCard label="Open NCRs" value={openNcrs.length} accent="red" />
            <CountUpCard label="Open Punch Items" value={(db.punch_list || []).filter(p => p.status !== 'Closed').length} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>NCR Register — Open & Recent</SectionTitle>
              <div className="space-y-2">
                {ncrs.length === 0 ? <div className="text-neutral-500 text-xs py-8 text-center">No NCRs recorded.</div> :
                  ncrs.slice(0, 6).map(n => (
                    <div key={n.id} className={`p-3 rounded-xl border text-xs ${n.status === 'Closed' ? 'border-slate-200 dark:border-white/5' : 'border-red-500/20 bg-red-500/5'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[10px] uppercase text-red-500">{n.ncr_no} • {n.severity}</span>
                        <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase ${statusChipClass(n.status)}`}>{n.status}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 font-semibold mt-1 text-[11px]">{n.description}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{n.project_no} {n.element_code && n.element_code !== '—' ? `• ${n.element_code}` : ''} • {n.ncr_date}</div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-white/5">
              <SectionTitle>Pre-Pour Release Checks</SectionTitle>
              <MiniTable
                cols={[{ key: 'element_code', label: 'Element' }, { key: 'inspector', label: 'Inspector' }, { key: 'concrete_test_ref', label: 'Test Ref' }, { key: 'qc_result', label: 'Result' }]}
                rows={qcPre.slice(0, 10)}
                empty="No inspections logged"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
