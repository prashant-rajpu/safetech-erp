import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchRows } from '../lib/erp/db'
import CountUpCard from '../components/CountUpCard'
import AlertsPanel from '../components/AlertsPanel'
import { SectionTitle, MiniTable } from '../components/erp/DashboardWidgets'
import type { Alert } from '../lib/analytics'

const EQUIPMENT_COLORS: Record<string, string> = {
  Active: '#10b981', 'Under Maintenance': '#f59e0b', Retired: '#94a3b8',
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

export default function MaintenanceDashboardPage() {
  const [equipment, setEquipment] = useState<any[]>([])
  const [pm, setPm] = useState<any[]>([])
  const [calibrations, setCalibrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [e, p, c] = await Promise.all([
        fetchRows('equipment_register'), fetchRows('preventive_maintenance'), fetchRows('calibration_records'),
      ])
      setEquipment(e); setPm(p); setCalibrations(c)
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  const activeEquipment = equipment.filter(e => e.status === 'Active')
  const underMaintenance = equipment.filter(e => e.status === 'Under Maintenance')
  const pmScheduled = pm.filter(p => p.status === 'Scheduled')
  const calibrationsDueSoon = useMemo(() =>
    calibrations.filter(c => c.next_due_date && daysBetween(today, c.next_due_date) <= 30),
    [calibrations, today])

  const equipmentBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of equipment) counts[e.status] = (counts[e.status] || 0) + 1
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: EQUIPMENT_COLORS[name] || '#94a3b8' }))
  }, [equipment])

  const overduePm = useMemo(() =>
    pm.filter(p => p.status === 'Scheduled' && p.scheduled_date && p.scheduled_date < today),
    [pm, today])

  const alerts: Alert[] = [
    ...overduePm.slice(0, 5).map((p, idx): Alert => ({
      id: `pm-${idx}`, severity: 'high',
      message: `Preventive maintenance ${p.pm_no || p.id} (equipment ${p.equipment_id || '—'}) was due ${p.scheduled_date} — overdue.`,
    })),
    ...calibrationsDueSoon.slice(0, 5).map((c, idx): Alert => ({
      id: `cal-${idx}`, severity: daysBetween(today, c.next_due_date) <= 7 ? 'high' : 'medium',
      message: `Calibration for equipment ${c.equipment_id || '—'} due ${c.next_due_date} (cert ${c.certificate_no || '—'}).`,
    })),
  ]

  if (loading) return <div className="p-6 text-primary font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading maintenance telemetry…</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Maintenance <span className="text-primary font-light">Dashboard</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Equipment register, preventive maintenance & calibration tracking</p>
        </div>
      </div>

      <AlertsPanel alerts={alerts} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CountUpCard label="Active Equipment" value={activeEquipment.length} />
        <CountUpCard label="PM Scheduled" value={pmScheduled.length} />
        <CountUpCard label="Calibrations Due Soon" value={calibrationsDueSoon.length} accent={calibrationsDueSoon.length > 0 ? 'red' : 'default'} />
        <CountUpCard label="Under Maintenance" value={underMaintenance.length} accent={underMaintenance.length > 0 ? 'red' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>Equipment by Status</SectionTitle>
          {equipmentBreakdown.length === 0 ? (
            <div className="text-neutral-500 text-sm py-16 text-center">No equipment registered yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={equipmentBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {equipmentBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend iconSize={8} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>Calibrations Due Soon (30 days)</SectionTitle>
          <MiniTable
            cols={[{ key: 'equipment_id', label: 'Equipment' }, { key: 'next_due_date', label: 'Due' }, { key: 'certificate_no', label: 'Cert' }, { key: 'status', label: 'Status' }]}
            rows={calibrationsDueSoon.slice(0, 8)}
            empty="No calibrations due soon"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-white/5">
        <SectionTitle>Preventive Maintenance Schedule</SectionTitle>
        <MiniTable
          cols={[{ key: 'pm_no', label: 'No' }, { key: 'equipment_id', label: 'Equipment' }, { key: 'scheduled_date', label: 'Scheduled' }, { key: 'task', label: 'Task' }, { key: 'technician', label: 'Technician' }, { key: 'status', label: 'Status' }]}
          rows={[...pm].sort((a, b) => (b.scheduled_date || '').localeCompare(a.scheduled_date || '')).slice(0, 10)}
          empty="No preventive maintenance scheduled"
        />
        <Link to="/m/equipment-register" className="inline-block mt-3 text-[10px] font-black uppercase text-primary hover:underline">→ Open Equipment Register</Link>
      </div>
    </div>
  )
}
