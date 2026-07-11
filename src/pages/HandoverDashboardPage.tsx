import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchRows } from '../lib/erp/db'
import CountUpCard from '../components/CountUpCard'
import AlertsPanel from '../components/AlertsPanel'
import { SectionTitle, MiniTable } from '../components/erp/DashboardWidgets'
import type { Alert } from '../lib/analytics'

const DEFECT_COLORS: Record<string, string> = {
  Open: '#ef4444', 'In Progress': '#f59e0b', Closed: '#10b981',
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

export default function HandoverDashboardPage() {
  const [packages, setPackages] = useState<any[]>([])
  const [dlps, setDlps] = useState<any[]>([])
  const [defects, setDefects] = useState<any[]>([])
  const [acceptances, setAcceptances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [p, d, f, a] = await Promise.all([
        fetchRows('handover_packages'), fetchRows('dlp_records'),
        fetchRows('handover_defects'), fetchRows('customer_acceptance'),
      ])
      setPackages(p); setDlps(d); setDefects(f); setAcceptances(a)
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  const packagesInPrep = packages.filter(p => p.status === 'In Preparation')
  const activeDlps = dlps.filter(d => d.status === 'Active')
  const openDefects = defects.filter(d => d.status !== 'Closed')
  const pendingAcceptances = acceptances.filter(a => a.status === 'Pending')

  const defectBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const d of defects) counts[d.status] = (counts[d.status] || 0) + 1
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: DEFECT_COLORS[name] || '#94a3b8' }))
  }, [defects])

  const dlpsEndingSoon = useMemo(() =>
    activeDlps.filter(d => d.dlp_end_date && daysBetween(today, d.dlp_end_date) <= 30 && daysBetween(today, d.dlp_end_date) >= 0),
    [activeDlps, today])

  const overdueDefects = useMemo(() =>
    openDefects.filter(d => d.due_date && d.due_date < today),
    [openDefects, today])

  const alerts: Alert[] = [
    ...dlpsEndingSoon.slice(0, 5).map((d, idx): Alert => ({
      id: `dlp-${idx}`, severity: daysBetween(today, d.dlp_end_date) <= 7 ? 'high' : 'medium',
      message: `DLP for project ${d.project_no || '—'} ends ${d.dlp_end_date} (${d.defects_count || 0} defects logged).`,
    })),
    ...overdueDefects.slice(0, 5).map((d, idx): Alert => ({
      id: `defect-${idx}`, severity: 'high',
      message: `Defect ${d.defect_no || d.id} (element ${d.element_code || '—'}) was due ${d.due_date} — overdue.`,
    })),
  ]

  if (loading) return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading customer handover data…</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Customer Handover <span className="text-red-500 font-light">Dashboard</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Handover packages, DLP tracking & defect resolution</p>
        </div>
      </div>

      <AlertsPanel alerts={alerts} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CountUpCard label="Packages In Preparation" value={packagesInPrep.length} />
        <CountUpCard label="Active DLPs" value={activeDlps.length} />
        <CountUpCard label="Open Defects" value={openDefects.length} accent={openDefects.length > 0 ? 'red' : 'default'} />
        <CountUpCard label="Pending Acceptances" value={pendingAcceptances.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>Defects by Status</SectionTitle>
          {defectBreakdown.length === 0 ? (
            <div className="text-neutral-500 text-sm py-16 text-center">No defects recorded yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={defectBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {defectBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend iconSize={8} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>DLPs Ending Soon (30 days)</SectionTitle>
          <MiniTable
            cols={[{ key: 'project_no', label: 'Project' }, { key: 'dlp_start_date', label: 'Start' }, { key: 'dlp_end_date', label: 'Ends' }, { key: 'defects_count', label: 'Defects' }]}
            rows={dlpsEndingSoon.slice(0, 8)}
            empty="No DLPs ending soon"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-white/5">
        <SectionTitle>Open Defects</SectionTitle>
        <MiniTable
          cols={[{ key: 'defect_no', label: 'No' }, { key: 'project_no', label: 'Project' }, { key: 'element_code', label: 'Element' }, { key: 'description', label: 'Description' }, { key: 'due_date', label: 'Due' }, { key: 'status', label: 'Status' }]}
          rows={[...openDefects].sort((a, b) => (a.due_date || '').localeCompare(b.due_date || '')).slice(0, 10)}
          empty="No open defects"
        />
        <Link to="/m/handover-defects" className="inline-block mt-3 text-[10px] font-black uppercase text-red-500 hover:underline">→ Open Defects Register</Link>
      </div>
    </div>
  )
}
