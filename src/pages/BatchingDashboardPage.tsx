import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchRows } from '../lib/erp/db'
import CountUpCard from '../components/CountUpCard'
import { SectionTitle, MiniTable } from '../components/erp/DashboardWidgets'

const GRADE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#94a3b8', '#8b5cf6', '#0ea5e9', '#991b1b']

export default function BatchingDashboardPage() {
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const b = await fetchRows('concrete_batches')
      setBatches(b)
      setLoading(false)
    }
    load()
  }, [])

  // operational "today" = latest data day, same convention as Dashboard.tsx
  const today = useMemo(() => {
    const dates = batches.map(b => b.batch_date).filter(Boolean).sort()
    return dates[dates.length - 1] || new Date().toISOString().slice(0, 10)
  }, [batches])

  const batchesToday = batches.filter(b => b.batch_date === today)
  const volumeToday = batchesToday.reduce((a, b) => a + (Number(b.volume_cum) || 0), 0)
  const avgSlumpToday = batchesToday.length
    ? Math.round(batchesToday.reduce((a, b) => a + (Number(b.slump_mm) || 0), 0) / batchesToday.length)
    : 0

  const volumeByGrade = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of batches) map.set(b.grade || 'Unspecified', Number(((map.get(b.grade || 'Unspecified') || 0) + (Number(b.volume_cum) || 0)).toFixed(1)))
    return Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: GRADE_COLORS[i % GRADE_COLORS.length] }))
  }, [batches])

  if (loading) return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading batching data…</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Batching <span className="text-red-500 font-light">Dashboard</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Concrete batch log, mix grades & pour volumes</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CountUpCard label="Batches Today" value={batchesToday.length} />
        <CountUpCard label="Volume Today (m³)" value={volumeToday} />
        <CountUpCard label="Avg Slump Today (mm)" value={avgSlumpToday} />
        <CountUpCard label="Batches (All-Time)" value={batches.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>Volume by Grade</SectionTitle>
          {volumeByGrade.length === 0 ? (
            <div className="text-neutral-500 text-sm py-16 text-center">No batches recorded yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={volumeByGrade} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {volumeByGrade.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend iconSize={8} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>Today's Batches</SectionTitle>
          <MiniTable
            cols={[{ key: 'batch_no', label: 'Batch' }, { key: 'mix_code', label: 'Mix' }, { key: 'grade', label: 'Grade' }, { key: 'volume_cum', label: 'm³' }, { key: 'status', label: 'Status' }]}
            rows={batchesToday.slice(0, 8)}
            empty="No batches today"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-white/5">
        <SectionTitle>Recent Batches</SectionTitle>
        <MiniTable
          cols={[{ key: 'batch_no', label: 'Batch' }, { key: 'batch_date', label: 'Date' }, { key: 'mix_code', label: 'Mix' }, { key: 'grade', label: 'Grade' }, { key: 'volume_cum', label: 'm³' }, { key: 'plant', label: 'Plant' }, { key: 'status', label: 'Status' }]}
          rows={[...batches].sort((a, b) => (b.batch_date || '').localeCompare(a.batch_date || '')).slice(0, 10)}
          empty="No batches recorded"
        />
        <Link to="/m/concrete" className="inline-block mt-3 text-[10px] font-black uppercase text-red-500 hover:underline">→ Open Concrete / Batch Register</Link>
      </div>
    </div>
  )
}
