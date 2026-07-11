import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchRows } from '../lib/erp/db'
import CountUpCard from '../components/CountUpCard'
import AlertsPanel from '../components/AlertsPanel'
import { SectionTitle, MiniTable } from '../components/erp/DashboardWidgets'
import type { Alert } from '../lib/analytics'

const SEVERITY_COLORS: Record<string, string> = {
  Minor: '#10b981', Moderate: '#f59e0b', Major: '#f97316', Critical: '#ef4444',
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

export default function HSEDashboardPage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [talks, setTalks] = useState<any[]>([])
  const [risks, setRisks] = useState<any[]>([])
  const [permits, setPermits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [i, t, r, p] = await Promise.all([
        fetchRows('hse_incidents'), fetchRows('toolbox_talks'),
        fetchRows('risk_assessments'), fetchRows('hse_permits'),
      ])
      setIncidents(i); setTalks(t); setRisks(r); setPermits(p)
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  const openIncidents = incidents.filter(i => i.status !== 'Closed')
  const activePermits = permits.filter(p => p.status === 'Active')
  const activeHighRisks = risks.filter(r => r.risk_level === 'High' && r.status === 'Active')
  const talksThisMonth = talks.filter(t => t.talk_date && t.talk_date.slice(0, 7) === today.slice(0, 7))

  const daysSinceLastIncident = useMemo(() => {
    const dates = incidents.map(i => i.incident_date).filter(Boolean).sort()
    return dates.length ? daysBetween(dates[dates.length - 1], today) : null
  }, [incidents, today])

  const severityBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const i of openIncidents) counts[i.severity] = (counts[i.severity] || 0) + 1
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: SEVERITY_COLORS[name] || '#94a3b8' }))
  }, [openIncidents])

  const expiringPermits = useMemo(() =>
    permits.filter(p => p.status === 'Active' && p.valid_to && daysBetween(today, p.valid_to) <= 30 && daysBetween(today, p.valid_to) >= 0)
      .sort((a, b) => a.valid_to.localeCompare(b.valid_to)),
    [permits, today])

  const overdueReviews = useMemo(() =>
    risks.filter(r => r.status === 'Active' && r.review_date && r.review_date < today),
    [risks, today])

  const alerts: Alert[] = [
    ...expiringPermits.slice(0, 5).map((p, idx): Alert => ({
      id: `permit-${idx}`, severity: daysBetween(today, p.valid_to) <= 7 ? 'high' : 'medium',
      message: `Permit ${p.permit_no} (${p.permit_type}) expires ${p.valid_to} — issued to ${p.issued_to || 'unassigned'}.`,
    })),
    ...overdueReviews.slice(0, 5).map((r, idx): Alert => ({
      id: `review-${idx}`, severity: 'high',
      message: `Risk assessment ${r.ra_no} (${r.activity}) review was due ${r.review_date} — overdue.`,
    })),
  ]

  if (loading) return <div className="p-6 text-primary font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading HSE telemetry…</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            HSE <span className="text-primary font-light">Dashboard</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Health, safety & environment — incidents, permits, risk assessments</p>
        </div>
        <div className={`text-xs font-bold px-3 py-1.5 rounded-full border shadow-md mt-3 md:mt-0 max-w-fit ${
          daysSinceLastIncident === null ? 'bg-slate-500/10 border-slate-500/30 text-slate-400'
          : daysSinceLastIncident >= 30 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-emerald-500/5'
          : 'bg-primary/10 border-primary/30 text-primary shadow-primary/5'
        }`}>
          ● {daysSinceLastIncident === null ? 'NO INCIDENTS LOGGED' : `${daysSinceLastIncident} DAYS SINCE LAST INCIDENT`}
        </div>
      </div>

      <AlertsPanel alerts={alerts} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CountUpCard label="Open Incidents" value={openIncidents.length} accent={openIncidents.length > 0 ? 'red' : 'default'} />
        <CountUpCard label="Active Permits" value={activePermits.length} />
        <CountUpCard label="High-Risk Assessments" value={activeHighRisks.length} accent={activeHighRisks.length > 0 ? 'red' : 'default'} />
        <CountUpCard label="Toolbox Talks (This Month)" value={talksThisMonth.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>Open Incidents by Severity</SectionTitle>
          {severityBreakdown.length === 0 ? (
            <div className="text-neutral-500 text-sm py-16 text-center">No open incidents — clean sheet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={severityBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {severityBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend iconSize={8} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>Permits Expiring (next 30 days)</SectionTitle>
          <MiniTable
            cols={[{ key: 'permit_no', label: 'Permit' }, { key: 'permit_type', label: 'Type' }, { key: 'issued_to', label: 'Issued To' }, { key: 'valid_to', label: 'Expires' }]}
            rows={expiringPermits.slice(0, 8)}
            empty="No permits expiring soon"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-white/5">
        <SectionTitle>Recent Incidents</SectionTitle>
        <MiniTable
          cols={[{ key: 'incident_no', label: 'No' }, { key: 'incident_date', label: 'Date' }, { key: 'incident_type', label: 'Type' }, { key: 'severity', label: 'Severity' }, { key: 'location', label: 'Location' }, { key: 'status', label: 'Status' }]}
          rows={[...incidents].sort((a, b) => (b.incident_date || '').localeCompare(a.incident_date || '')).slice(0, 10)}
          empty="No incidents recorded"
        />
        <Link to="/m/hse-incidents" className="inline-block mt-3 text-[10px] font-black uppercase text-primary hover:underline">→ Open Incident Register</Link>
      </div>
    </div>
  )
}
