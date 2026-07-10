import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchRows } from '../lib/erp/db'
import CountUpCard from '../components/CountUpCard'
import AlertsPanel from '../components/AlertsPanel'
import { SectionTitle, MiniTable } from '../components/erp/DashboardWidgets'
import type { Alert } from '../lib/analytics'

const SHIFT_COLORS: Record<string, string> = { Day: '#f59e0b', Night: '#0ea5e9' }

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

export default function WorkforceDashboardPage() {
  const [crew, setCrew] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [shifts, setShifts] = useState<any[]>([])
  const [certs, setCerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [c, a, s, ct] = await Promise.all([
        fetchRows('crew_members'), fetchRows('crew_assignments'),
        fetchRows('shift_schedules'), fetchRows('certifications'),
      ])
      setCrew(c); setAssignments(a); setShifts(s); setCerts(ct)
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  const activeCrew = crew.filter(c => c.status === 'Active')
  const todaysAssignments = assignments.filter(a => a.assignment_date === today)
  const todaysShifts = shifts.filter(s => s.shift_date === today)
  const assignedNames = new Set(todaysAssignments.map(a => a.crew_member))
  const unassignedCrew = activeCrew.filter(c => !assignedNames.has(c.name))

  const expiringCerts = useMemo(() =>
    certs.filter(c => c.status !== 'Expired' && c.expiry_date && daysBetween(today, c.expiry_date) <= 30 && daysBetween(today, c.expiry_date) >= 0)
      .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date)),
    [certs, today])

  const shiftBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of todaysAssignments) counts[a.shift] = (counts[a.shift] || 0) + 1
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: SHIFT_COLORS[name] || '#94a3b8' }))
  }, [todaysAssignments])

  const headcountShortfalls = todaysShifts.filter(s => (s.headcount_actual ?? 0) < (s.headcount_planned ?? 0))

  const alerts: Alert[] = [
    ...expiringCerts.slice(0, 5).map((c, idx): Alert => ({
      id: `cert-${idx}`, severity: daysBetween(today, c.expiry_date) <= 7 ? 'high' : 'medium',
      message: `${c.cert_type} certification for ${c.person_name} expires ${c.expiry_date}.`,
    })),
    ...headcountShortfalls.slice(0, 5).map((s, idx): Alert => ({
      id: `shortfall-${idx}`, severity: 'medium',
      message: `${s.department || 'Shift'} ${s.shift_type} shift is short-staffed: ${s.headcount_actual ?? 0}/${s.headcount_planned ?? 0} planned.`,
    })),
  ]

  if (loading) return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading workforce telemetry…</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Workforce <span className="text-red-500 font-light">Dashboard</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Crew, shifts & certification tracking</p>
        </div>
        <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 shadow-md shadow-red-500/5 mt-3 md:mt-0 max-w-fit">
          ● {today}
        </div>
      </div>

      <AlertsPanel alerts={alerts} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CountUpCard label="Active Crew" value={activeCrew.length} />
        <CountUpCard label="Today's Assignments" value={todaysAssignments.length} />
        <CountUpCard label="Certifications Expiring Soon" value={expiringCerts.length} accent={expiringCerts.length > 0 ? 'red' : 'default'} />
        <CountUpCard label="Unassigned Crew Today" value={unassignedCrew.length} accent={unassignedCrew.length > 0 ? 'red' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>Today's Assignments by Shift</SectionTitle>
          {shiftBreakdown.length === 0 ? (
            <div className="text-neutral-500 text-sm py-16 text-center">No assignments logged for today.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={shiftBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {shiftBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend iconSize={8} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>Certifications Expiring (next 30 days)</SectionTitle>
          <MiniTable
            cols={[{ key: 'person_name', label: 'Name' }, { key: 'cert_type', label: 'Certification' }, { key: 'cert_category', label: 'Category' }, { key: 'expiry_date', label: 'Expires' }]}
            rows={expiringCerts.slice(0, 8)}
            empty="No certifications expiring soon"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-white/5">
        <SectionTitle>Today's Shift Roster</SectionTitle>
        <MiniTable
          cols={[{ key: 'shift_type', label: 'Shift' }, { key: 'department', label: 'Department' }, { key: 'supervisor', label: 'Supervisor' }, { key: 'headcount_planned', label: 'Planned' }, { key: 'headcount_actual', label: 'Actual' }]}
          rows={todaysShifts}
          empty="No shift schedule logged for today"
        />
        <Link to="/m/crew-assignments" className="inline-block mt-3 text-[10px] font-black uppercase text-red-500 hover:underline">→ Open Crew Assignments</Link>
      </div>
    </div>
  )
}
