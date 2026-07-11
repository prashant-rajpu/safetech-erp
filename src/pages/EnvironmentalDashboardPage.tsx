import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { fetchRows } from '../lib/erp/db'
import CountUpCard from '../components/CountUpCard'
import { SectionTitle, MiniTable } from '../components/erp/DashboardWidgets'

const WASTE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#94a3b8', '#8b5cf6', '#0ea5e9']

export default function EnvironmentalDashboardPage() {
  const [carbon, setCarbon] = useState<any[]>([])
  const [waste, setWaste] = useState<any[]>([])
  const [water, setWater] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [c, w, wt, r] = await Promise.all([
        fetchRows('carbon_records'), fetchRows('waste_records'),
        fetchRows('water_records'), fetchRows('environmental_reports'),
      ])
      setCarbon(c); setWaste(w); setWater(wt); setReports(r)
      setLoading(false)
    }
    load()
  }, [])

  const thisMonth = new Date().toISOString().slice(0, 7)

  const co2ThisMonth = carbon.filter(c => c.record_date && c.record_date.slice(0, 7) === thisMonth)
    .reduce((a, c) => a + (Number(c.co2_kg) || 0), 0)
  const wasteThisMonth = waste.filter(w => w.record_date && w.record_date.slice(0, 7) === thisMonth)
    .reduce((a, w) => a + (Number(w.qty_kg) || 0), 0)
  const waterThisMonth = water.filter(w => w.record_date && w.record_date.slice(0, 7) === thisMonth)
    .reduce((a, w) => a + (Number(w.usage_litres) || 0), 0)
  const reportsPending = reports.filter(r => r.status === 'Draft')

  const wasteByType = useMemo(() => {
    const map = new Map<string, number>()
    for (const w of waste) map.set(w.waste_type || 'Unspecified', Number(((map.get(w.waste_type || 'Unspecified') || 0) + (Number(w.qty_kg) || 0)).toFixed(1)))
    return Array.from(map.entries()).map(([name, value], i) => ({ name, value, color: WASTE_COLORS[i % WASTE_COLORS.length] }))
  }, [waste])

  if (loading) return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading environmental data…</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Environmental <span className="text-red-500 font-light">Dashboard</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Carbon, waste & water tracking, environmental reports</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <CountUpCard label="CO2 This Month (kg)" value={Math.round(co2ThisMonth)} />
        <CountUpCard label="Waste This Month (kg)" value={Math.round(wasteThisMonth)} />
        <CountUpCard label="Water This Month (L)" value={Math.round(waterThisMonth)} />
        <CountUpCard label="Reports Pending Approval" value={reportsPending.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>Waste by Type</SectionTitle>
          {wasteByType.length === 0 ? (
            <div className="text-neutral-500 text-sm py-16 text-center">No waste records yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={wasteByType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {wasteByType.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15, 17, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Legend iconSize={8} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <SectionTitle>Recent Environmental Reports</SectionTitle>
          <MiniTable
            cols={[{ key: 'report_no', label: 'Report' }, { key: 'report_period', label: 'Period' }, { key: 'prepared_by', label: 'Prepared By' }, { key: 'status', label: 'Status' }]}
            rows={[...reports].sort((a, b) => (b.submitted_date || '').localeCompare(a.submitted_date || '')).slice(0, 8)}
            empty="No reports recorded"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 border border-white/5">
        <SectionTitle>Recent Carbon Records</SectionTitle>
        <MiniTable
          cols={[{ key: 'record_date', label: 'Date' }, { key: 'project_no', label: 'Project' }, { key: 'activity', label: 'Activity' }, { key: 'co2_kg', label: 'CO2 (kg)' }, { key: 'source', label: 'Source' }]}
          rows={[...carbon].sort((a, b) => (b.record_date || '').localeCompare(a.record_date || '')).slice(0, 10)}
          empty="No carbon records recorded"
        />
        <Link to="/m/carbon-records" className="inline-block mt-3 text-[10px] font-black uppercase text-red-500 hover:underline">→ Open Carbon Tracking Register</Link>
      </div>
    </div>
  )
}
