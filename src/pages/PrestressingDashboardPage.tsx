import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchRows } from '../lib/erp/db'
import CountUpCard from '../components/CountUpCard'
import AlertsPanel from '../components/AlertsPanel'
import { SectionTitle, MiniTable } from '../components/erp/DashboardWidgets'
import type { Alert } from '../lib/analytics'

const STRAND_COLORS: Record<string, string> = {
  'In Stock': '#10b981', Issued: '#f59e0b', Consumed: '#94a3b8',
}

export default function PrestressingDashboardPage() {
  const [strands, setStrands] = useState<any[]>([])
  const [tensioning, setTensioning] = useState<any[]>([])
  const [release, setRelease] = useState<any[]>([])
  const [longLine, setLongLine] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [s, t, r, l] = await Promise.all([
        fetchRows('pt_strands'), fetchRows('pt_tensioning'),
        fetchRows('pt_release'), fetchRows('pt_long_line_plans'),
      ])
      setStrands(s); setTensioning(t); setRelease(r); setLongLine(l)
      setLoading(false)
    }
    load()
  }, [])

  const tensionedNotReleased = tensioning.filter(t => t.status === 'Tensioned')
  const pendingReleases = release.filter(r => r.status === 'Pending')
  const activeLongLinePlans = longLine.filter(l => l.status !== 'Completed')
  const inStockStrands = strands.filter(s => s.status === 'In Stock')

  const strandBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of strands) counts[s.status] = (counts[s.status] || 0) + 1
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: STRAND_COLORS[name] || '#94a3b8' }))
  }, [strands])

  const alerts: Alert[] = pendingReleases.slice(0, 5).map((r, idx): Alert => ({
    id: `release-${idx}`, severity: 'medium',
    message: `Release ${r.release_no || r.id} (element ${r.element_code || '—'}) awaiting strength check — tensioning ${r.tensioning_no || '—'}.`,
  }))

  if (loading) return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading prestressing data…</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Prestressing <span className="text-red-500 font-light">Dashboard</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Strand inventory, tensioning, release & long-line planning</p>
        </div>
      </div>

      <AlertsPanel alerts={alerts} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CountUpCard label="Strands In Stock" value={inStockStrands.length} />
        <CountUpCard label="Tensioned (Not Released)" value={tensionedNotReleased.length} />
        <CountUpCard label="Pending Release" value={pendingReleases.length} accent={pendingReleases.length > 0 ? 'red' : 'default'} />
        <CountUpCard label="Active Long-Line Plans" value={activeLongLinePlans.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>Strand Inventory by Status</SectionTitle>
          {strandBreakdown.length === 0 ? (
            <div className="text-neutral-500 text-sm py-16 text-center">No strand records yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={strandBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {strandBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend iconSize={8} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>Pending Releases</SectionTitle>
          <MiniTable
            cols={[{ key: 'release_no', label: 'Release' }, { key: 'element_code', label: 'Element' }, { key: 'tensioning_no', label: 'Tensioning' }, { key: 'release_date', label: 'Date' }]}
            rows={pendingReleases.slice(0, 8)}
            empty="No pending releases"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-white/5">
        <SectionTitle>Recent Tensioning Events</SectionTitle>
        <MiniTable
          cols={[{ key: 'tensioning_no', label: 'No' }, { key: 'tensioning_date', label: 'Date' }, { key: 'bed', label: 'Bed' }, { key: 'element_code', label: 'Element' }, { key: 'strand_count', label: 'Strands' }, { key: 'status', label: 'Status' }]}
          rows={[...tensioning].sort((a, b) => (b.tensioning_date || '').localeCompare(a.tensioning_date || '')).slice(0, 10)}
          empty="No tensioning events recorded"
        />
        <Link to="/m/pt-tensioning" className="inline-block mt-3 text-[10px] font-black uppercase text-red-500 hover:underline">→ Open Tensioning Register</Link>
      </div>
    </div>
  )
}
