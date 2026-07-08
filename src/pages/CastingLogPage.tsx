import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

type CastingLog = {
  id: string
  cast_date: string
  project_no: string
  element_code: string
  element_type: string
  volume_cum: number
  weight_tons: number
  concrete_grade: string
  bed_mould_id: string
  qc_status: 'PENDING' | 'PASSED'
}

export default function CastingLogPage() {
  const [logs, setLogs] = useState<CastingLog[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [castDate, setCastDate] = useState('2026-06-29')
  const [projectNo, setProjectNo] = useState('')
  const [elementCode, setElementCode] = useState('')
  const [elementType, setElementType] = useState('WL/PC')
  const [volume, setVolume] = useState('')
  const [weight, setWeight] = useState('')
  const [concreteGrade, setConcreteGrade] = useState('C45')
  const [bedMould, setBedMould] = useState('Bed 1')
  const [qcStatus, setQcStatus] = useState<'PENDING' | 'PASSED'>('PENDING')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      const [castRes, projRes] = await Promise.all([
        supabase.from('production_casting').select('*').order('cast_date', { ascending: false }),
        supabase.from('projects').select('*')
      ])
      setLogs(castRes.data || [])
      setProjects(projRes.data || [])
      if (projRes.data && projRes.data.length > 0) {
        setProjectNo(projRes.data[0].project_no)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const stats = useMemo(() => {
    const todayLogs = logs.filter(l => l.cast_date === castDate)
    const totalQty = todayLogs.length
    const totalVol = todayLogs.reduce((acc, curr) => acc + (curr.volume_cum || 0), 0)
    const totalWt = todayLogs.reduce((acc, curr) => acc + (curr.weight_tons || 0), 0)
    return { totalQty, totalVol: totalVol.toFixed(2), totalWt: totalWt.toFixed(2) }
  }, [logs, castDate])

  const handleSaveCasting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!elementCode) {
      alert('Please fill in the Element Code!')
      return
    }

    setSaving(true)
    const volNum = parseFloat(volume) || 0
    const wtNum = parseFloat(weight) || 0
    const newLog = {
      cast_date: castDate,
      project_no: projectNo,
      element_code: elementCode.toUpperCase().trim(),
      element_type: elementType,
      volume_cum: volNum,
      weight_tons: wtNum,
      concrete_grade: concreteGrade,
      bed_mould_id: bedMould,
      qc_status: qcStatus
    }

    try {
      // 1. Insert into production casting
      await supabase.from('production_casting').insert([newLog])

      // 2. Automatically insert corresponding entry into stockyard inventory
      const newStockyardItem = {
        element_code: elementCode.toUpperCase().trim(),
        cast_date: castDate,
        project_no: projectNo,
        element_type: elementType,
        volume_cum: volNum,
        weight_tons: wtNum,
        status: 'IN STOCK',
        bay_location: bedMould.includes('HCS') ? 'HCS Zone 1' : 'Bay 01',
        curing_days: 0,
        remarks: qcStatus === 'PASSED' ? 'Curing (Critical)' : 'Awaiting QC release'
      }
      await supabase.from('stockyard_inventory').insert([newStockyardItem])

      // Refresh log grid
      const { data } = await supabase.from('production_casting').select('*').order('cast_date', { ascending: false })
      setLogs(data || [])

      // Clear input
      setElementCode('')
      setVolume('')
      setWeight('')
      alert('Element casting logged & registered to Stockyard successfully!')
    } catch (err) {
      console.error(err)
      alert('Error saving casting log.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading casting logs...</div>
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Concrete Casting <span className="text-red-500 font-light">Log</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Record daily factory concrete pours and mould casting allocations</p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Casted Today (Qty)</span>
          <span className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{stats.totalQty} pcs</span>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Volume Casted</span>
          <span className="text-2xl font-black text-red-500 mt-1">{stats.totalVol} m³</span>
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Weight Casted</span>
          <span className="text-2xl font-black text-neutral-900 dark:text-white mt-1">{stats.totalWt} Tons</span>
        </div>
      </div>

      {/* Main Form and Grid Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Casting Entry Form */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 h-fit space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
            Log New Casting Pour
          </h3>
          
          <form onSubmit={handleSaveCasting} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2.5">
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Casting Date</span>
                <input 
                  type="date" 
                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs" 
                  value={castDate} 
                  onChange={e => setCastDate(e.target.value)} 
                />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Project No.</span>
                <select 
                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs"
                  value={projectNo}
                  onChange={e => setProjectNo(e.target.value)}
                >
                  {projects.map(p => (
                    <option key={p.project_no} value={p.project_no}>{p.project_no} - {p.project_name.slice(0, 15)}...</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Element Code</span>
              <input 
                type="text" 
                placeholder="E.g. 00-IW01-2502M-003"
                className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs" 
                value={elementCode} 
                onChange={e => setElementCode(e.target.value)} 
              />
            </label>

            <div className="grid grid-cols-3 gap-2.5">
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Type</span>
                <select 
                  className="w-full mt-1 px-1.5 py-1.5 rounded-lg glowing-input text-xs"
                  value={elementType}
                  onChange={e => setElementType(e.target.value)}
                >
                  <option value="WL/PC">WL/PC</option>
                  <option value="HCS">HCS</option>
                  <option value="BW">BW</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Vol (m³)</span>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="3.12"
                  className="w-full mt-1 px-1.5 py-1.5 rounded-lg glowing-input text-xs" 
                  value={volume} 
                  onChange={e => setVolume(e.target.value)} 
                />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Weight (T)</span>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="7.8"
                  className="w-full mt-1 px-1.5 py-1.5 rounded-lg glowing-input text-xs" 
                  value={weight} 
                  onChange={e => setWeight(e.target.value)} 
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Mix Grade</span>
                <select 
                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs"
                  value={concreteGrade}
                  onChange={e => setConcreteGrade(e.target.value)}
                >
                  <option value="C45">C45</option>
                  <option value="C50">C50</option>
                  <option value="C60">C60</option>
                  <option value="C70">C70</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Bed / Mould</span>
                <select 
                  className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs"
                  value={bedMould}
                  onChange={e => setBedMould(e.target.value)}
                >
                  <option value="Bed 1">Bed 1</option>
                  <option value="Bed 2">Bed 2</option>
                  <option value="Mould A">Mould A</option>
                  <option value="Mould B">Mould B</option>
                  <option value="HCS Bed A">HCS Bed A</option>
                  <option value="HCS Bed B">HCS Bed B</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">QC Status</span>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setQcStatus('PENDING')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    qcStatus === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🟡 PENDING
                </button>
                <button
                  type="button"
                  onClick={() => setQcStatus('PASSED')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    qcStatus === 'PASSED'
                      ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  🟢 PASSED
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-extrabold text-xs tracking-wider uppercase py-3 rounded-xl btn-interactive shadow-lg shadow-red-500/25 mt-4"
            >
              {saving ? 'Logging Pour...' : '💾 Log Casted Element'}
            </button>
          </form>
        </div>

        {/* Casting Logs Grid Table */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 h-fit space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">
              Casting History log
            </h3>
            <span className="text-[10px] bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded">
              {logs.length} Total Logs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[10px] uppercase">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Project</th>
                  <th className="py-2.5">Element Code</th>
                  <th className="py-2.5">Type</th>
                  <th className="py-2.5 text-right">Vol (m³)</th>
                  <th className="py-2.5 text-right">Weight (T)</th>
                  <th className="py-2.5 text-center">Grade</th>
                  <th className="py-2.5 text-center">Bed</th>
                  <th className="py-2.5 text-center">QC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 uppercase font-semibold">No elements casted yet</td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2">{log.cast_date}</td>
                      <td className="py-2 font-bold">{log.project_no}</td>
                      <td className="py-2 font-mono text-neutral-800 dark:text-white font-bold">{log.element_code}</td>
                      <td className="py-2">{log.element_type}</td>
                      <td className="py-2 text-right">{log.volume_cum.toFixed(2)}</td>
                      <td className="py-2 text-right">{log.weight_tons.toFixed(2)}</td>
                      <td className="py-2 text-center">{log.concrete_grade}</td>
                      <td className="py-2 text-center text-slate-500">{log.bed_mould_id}</td>
                      <td className="py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          log.qc_status === 'PASSED'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {log.qc_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
