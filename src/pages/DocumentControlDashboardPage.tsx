import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchRows } from '../lib/erp/db'
import CountUpCard from '../components/CountUpCard'
import AlertsPanel from '../components/AlertsPanel'
import { SectionTitle, MiniTable } from '../components/erp/DashboardWidgets'
import type { Alert } from '../lib/analytics'

const RFI_COLORS: Record<string, string> = {
  Open: '#ef4444', Answered: '#f59e0b', Closed: '#10b981',
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

export default function DocumentControlDashboardPage() {
  const [rfis, setRfis] = useState<any[]>([])
  const [methodStatements, setMethodStatements] = useState<any[]>([])
  const [submittals, setSubmittals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [r, m, s] = await Promise.all([
        fetchRows('rfi_register'), fetchRows('method_statements'), fetchRows('submittals'),
      ])
      setRfis(r); setMethodStatements(m); setSubmittals(s)
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  const openRfis = rfis.filter(r => r.status === 'Open')
  const msUnderReview = methodStatements.filter(m => m.status === 'Under Review')
  const pendingSubmittals = submittals.filter(s => s.status !== 'Closed')
  const approvedThisMonth = submittals.filter(s => s.review_status === 'Approved' && s.submitted_date && s.submitted_date.slice(0, 7) === today.slice(0, 7))

  const rfiBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of rfis) counts[r.status] = (counts[r.status] || 0) + 1
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: RFI_COLORS[name] || '#94a3b8' }))
  }, [rfis])

  const oldestOpenRfis = useMemo(() =>
    [...openRfis].filter(r => r.raised_date).sort((a, b) => a.raised_date.localeCompare(b.raised_date)),
    [openRfis])

  const alerts: Alert[] = oldestOpenRfis
    .filter(r => daysBetween(r.raised_date, today) > 14)
    .slice(0, 5)
    .map((r, idx): Alert => ({
      id: `rfi-${idx}`, severity: daysBetween(r.raised_date, today) > 30 ? 'high' : 'medium',
      message: `RFI ${r.rfi_no || r.id} (${r.subject || 'no subject'}) raised ${r.raised_date} — open ${daysBetween(r.raised_date, today)} days.`,
    }))

  if (loading) return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading document control data…</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Document Control <span className="text-red-500 font-light">Dashboard</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">RFIs, method statements & submittals</p>
        </div>
      </div>

      <AlertsPanel alerts={alerts} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CountUpCard label="Open RFIs" value={openRfis.length} accent={openRfis.length > 0 ? 'red' : 'default'} />
        <CountUpCard label="Method Statements Under Review" value={msUnderReview.length} />
        <CountUpCard label="Pending Submittals" value={pendingSubmittals.length} />
        <CountUpCard label="Approved This Month" value={approvedThisMonth.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>RFIs by Status</SectionTitle>
          {rfiBreakdown.length === 0 ? (
            <div className="text-neutral-500 text-sm py-16 text-center">No RFIs recorded yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={rfiBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {rfiBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend iconSize={8} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>Oldest Open RFIs</SectionTitle>
          <MiniTable
            cols={[{ key: 'rfi_no', label: 'RFI' }, { key: 'subject', label: 'Subject' }, { key: 'raised_by', label: 'Raised By' }, { key: 'raised_date', label: 'Raised' }]}
            rows={oldestOpenRfis.slice(0, 8)}
            empty="No open RFIs"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-white/5">
        <SectionTitle>Recent Submittals</SectionTitle>
        <MiniTable
          cols={[{ key: 'submittal_no', label: 'No' }, { key: 'title', label: 'Title' }, { key: 'type', label: 'Type' }, { key: 'submitted_date', label: 'Submitted' }, { key: 'review_status', label: 'Review' }, { key: 'status', label: 'Status' }]}
          rows={[...submittals].sort((a, b) => (b.submitted_date || '').localeCompare(a.submitted_date || '')).slice(0, 10)}
          empty="No submittals recorded"
        />
        <Link to="/m/rfi-register" className="inline-block mt-3 text-[10px] font-black uppercase text-red-500 hover:underline">→ Open RFI Register</Link>
      </div>
    </div>
  )
}
