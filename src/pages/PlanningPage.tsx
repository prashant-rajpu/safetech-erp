import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Project = {
  id: string
  project_no: string
  project_name: string
  client: string
  consultant: string
  location: string
  status: string
}

type ElementPlan = {
  id: string
  project_no: string
  drawing_number: string
  revision: string
  element_type: string
  quantity: number
  planned_casting_date: string
  priority: 'High' | 'Medium' | 'Low'
  assigned_bed: string
  assigned_mould: string
  status: string
}

export default function PlanningPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'projects'

  const [projects, setProjects] = useState<Project[]>([])
  const [elements, setElements] = useState<ElementPlan[]>([])
  const [loading, setLoading] = useState(true)

  // Project Master Form State
  const [projNo, setProjNo] = useState('')
  const [projName, setProjName] = useState('')
  const [projClient, setProjClient] = useState('')
  const [projConsultant, setProjConsultant] = useState('')
  const [projLoc, setProjLoc] = useState('')
  const [projStatus, setProjStatus] = useState('Active')

  // Element Planning Form State
  const [planProjNo, setPlanProjNo] = useState('')
  const [dwgNo, setDwgNo] = useState('')
  const [revision, setRevision] = useState('R0')
  const [elementType, setElementType] = useState('WL/PC')
  const [qty, setQty] = useState(10)
  const [castDate, setCastDate] = useState('2026-06-29')
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')
  const [bed, setBed] = useState('Bed 1')
  const [mould, setMould] = useState('Mould A')

  useEffect(() => {
    async function loadData() {
      const [pRes, eRes] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('element_planning').select('*')
      ])
      setProjects(pRes.data || [])
      setElements(eRes.data || [])
      if (pRes.data && pRes.data.length > 0) {
        setPlanProjNo(pRes.data[0].project_no)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  // Create Project CRUD
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projNo || !projName) {
      alert('Project Code and Name are required!')
      return
    }
    try {
      const payload = {
        project_no: projNo.toUpperCase().trim(),
        project_name: projName.trim(),
        client: projClient.trim() || 'Internal Client',
        consultant: projConsultant.trim() || 'Internal Consultant',
        location: projLoc.trim() || 'Dubai',
        status: projStatus
      }
      await supabase.from('projects').insert([payload])
      const { data } = await supabase.from('projects').select('*')
      setProjects(data || [])
      setProjNo('')
      setProjName('')
      setProjClient('')
      setProjConsultant('')
      setProjLoc('')
      alert('Project registered successfully!')
    } catch (err) {
      console.error(err)
      alert('Error saving project')
    }
  }

  // Create Element Plan CRUD
  const handleSaveElementPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dwgNo) {
      alert('Drawing number is required!')
      return
    }
    try {
      const payload = {
        project_no: planProjNo,
        drawing_number: dwgNo.toUpperCase().trim(),
        revision,
        element_type: elementType,
        quantity: Number(qty) || 1,
        planned_casting_date: castDate,
        priority,
        assigned_bed: bed,
        assigned_mould: mould,
        status: 'Planned'
      }
      await supabase.from('element_planning').insert([payload])

      // Auto-register traceability codes for each element quantity planned
      for (let i = 1; i <= qty; i++) {
        const serialStr = String(i).padStart(3, '0')
        const elementCode = `00-${elementType}-${planProjNo}-${serialStr}`
        
        await supabase.from('element_traceability').insert([{
          element_code: elementCode,
          planning_timestamp: `${new Date().toISOString().slice(0, 10)} 09:00`,
          casting_timestamp: 'Pending',
          qc_timestamp: 'Pending',
          curing_timestamp: 'Pending',
          stockyard_timestamp: 'Pending',
          loading_timestamp: 'Pending',
          dispatch_timestamp: 'Pending',
          delivery_timestamp: 'Pending'
        }])
      }

      const { data } = await supabase.from('element_planning').select('*')
      setElements(data || [])
      setDwgNo('')
      setQty(10)
      alert('Element planning row generated and elements registered to Traceability successfully!')
    } catch (err) {
      console.error(err)
      alert('Error saving element plan')
    }
  }

  // Visual Bed Utilization layout
  const bedsList = ['Bed 1', 'Bed 2', 'HCS Bed A', 'HCS Bed B']
  const bedAllocations = useMemo(() => {
    const map: Record<string, ElementPlan[]> = {}
    bedsList.forEach(b => {
      map[b] = elements.filter(e => e.assigned_bed === b && e.planned_casting_date === castDate)
    })
    return map
  }, [elements, castDate])

  if (loading) {
    return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading planning manager...</div>
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Planning & Scheduling <span className="text-red-500 font-light">Control</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage project structural design parameters, element specifications, and cast beds</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="glass-panel p-2.5 rounded-2xl flex gap-2 border border-slate-200 dark:border-white/5 shadow-md no-print">
        {['projects', 'elements', 'calendar', 'beds'].map(t => (
          <button
            key={t}
            onClick={() => setSearchParams({ tab: t })}
            className={`flex-1 py-2.5 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all btn-interactive ${
              activeTab === t 
                ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md shadow-red-500/25' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            {t === 'projects' ? '📁 Project Master' : t === 'elements' ? '✏️ Element Planning' : t === 'calendar' ? '📅 Casting Calendar' : '🏗️ Bed Utilization'}
          </button>
        ))}
      </div>

      {/* 1. PROJECT MASTER TAB */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Add form */}
          <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
              Register New Project
            </h3>
            <form onSubmit={handleSaveProject} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Project Code</span>
                  <input type="text" placeholder="E.g. P26005" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={projNo} onChange={e=>setProjNo(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Status</span>
                  <select className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={projStatus} onChange={e=>setProjStatus(e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Project Name</span>
                <input type="text" placeholder="E.g. Jumeirah Mansions" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={projName} onChange={e=>setProjName(e.target.value)} />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Client</span>
                  <input type="text" placeholder="E.g. Nakheel" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={projClient} onChange={e=>setProjClient(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Consultant</span>
                  <input type="text" placeholder="E.g. Atkins" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={projConsultant} onChange={e=>setProjConsultant(e.target.value)} />
                </label>
              </div>

              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Location</span>
                <input type="text" placeholder="E.g. DUBAI MARINA" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={projLoc} onChange={e=>setProjLoc(e.target.value)} />
              </label>

              <button type="submit" className="w-full bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-xs uppercase py-2.5 rounded-xl shadow-lg mt-2 btn-interactive">
                💾 Register Project
              </button>
            </form>
          </div>

          {/* Project List */}
          <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">
              Active Project Database
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[10px] uppercase">
                    <th className="py-2">Project No</th>
                    <th className="py-2">Project Name</th>
                    <th className="py-2">Client</th>
                    <th className="py-2">Consultant</th>
                    <th className="py-2">Location</th>
                    <th className="py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {projects.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 font-bold text-neutral-800 dark:text-white">{p.project_no}</td>
                      <td className="py-2.5 font-semibold">{p.project_name}</td>
                      <td className="py-2.5">{p.client}</td>
                      <td className="py-2.5 text-slate-500">{p.consultant}</td>
                      <td className="py-2.5">{p.location}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. ELEMENT PLANNING TAB */}
      {activeTab === 'elements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Add Form */}
          <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
              Add Element Plan Schedule
            </h3>
            <form onSubmit={handleSaveElementPlan} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Project</span>
                  <select className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs" value={planProjNo} onChange={e=>setPlanProjNo(e.target.value)}>
                    {projects.map(p => (
                      <option key={p.project_no} value={p.project_no}>{p.project_no}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Casting Date</span>
                  <input type="date" className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={castDate} onChange={e=>setCastDate(e.target.value)} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Drawing No.</span>
                  <input type="text" placeholder="DWG-ACERS-WL" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={dwgNo} onChange={e=>setDwgNo(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Revision</span>
                  <input type="text" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={revision} onChange={e=>setRevision(e.target.value)} />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Type</span>
                  <select className="w-full mt-1 px-1 py-1.5 rounded-lg glowing-input text-xs" value={elementType} onChange={e=>setElementType(e.target.value)}>
                    <option value="WL/PC">WL/PC</option>
                    <option value="HCS">HCS</option>
                    <option value="BW">BW</option>
                    <option value="BM">Beam</option>
                    <option value="CL">Column</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Qty</span>
                  <input type="number" className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={qty} onChange={e=>setQty(Number(e.target.value))} />
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Priority</span>
                  <select className="w-full mt-1 px-1 py-1.5 rounded-lg glowing-input text-xs" value={priority} onChange={e=>setPriority(e.target.value as any)}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Assigned Bed</span>
                  <select className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs" value={bed} onChange={e=>setBed(e.target.value)}>
                    {bedsList.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Assigned Mould</span>
                  <select className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs" value={mould} onChange={e=>setMould(e.target.value)}>
                    <option value="Mould A">Mould A</option>
                    <option value="Mould B">Mould B</option>
                    <option value="Mould C">Mould C</option>
                  </select>
                </label>
              </div>

              <button type="submit" className="w-full bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-xs uppercase py-2.5 rounded-xl shadow-lg mt-2 btn-interactive">
                📅 Add Schedule Plan
              </button>
            </form>
          </div>

          {/* Element plans list */}
          <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">
              Element casting Schedule Grid
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[10px] uppercase">
                    <th className="py-2">Project No</th>
                    <th className="py-2">Drawing Number</th>
                    <th className="py-2 text-center">Rev</th>
                    <th className="py-2">Type</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-center">Plan Date</th>
                    <th className="py-2 text-center">Priority</th>
                    <th className="py-2 text-center">Bed</th>
                    <th className="py-2 text-center">QC Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {elements.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5">{e.project_no}</td>
                      <td className="py-2.5 font-mono text-neutral-800 dark:text-white font-bold">{e.drawing_number}</td>
                      <td className="py-2.5 text-center text-slate-500">{e.revision}</td>
                      <td className="py-2.5">{e.element_type}</td>
                      <td className="py-2.5 text-center font-bold">{e.quantity}</td>
                      <td className="py-2.5 text-center">{e.planned_casting_date}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                          e.priority === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : e.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                        }`}>{e.priority}</span>
                      </td>
                      <td className="py-2.5 text-center font-semibold">{e.assigned_bed}</td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[9px] font-bold uppercase">{e.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. CASTING SCHEDULE CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                Weekly Casting Schedule Calendar
              </h3>
              <p className="text-[11px] text-slate-400">Showing element scheduling from June 29, 2026</p>
            </div>
            <input type="date" className="px-3 py-1.5 rounded-lg glowing-input text-xs w-40" value={castDate} onChange={e=>setCastDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-7 gap-3 h-[300px]">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => {
              // Mapped dates starting from Monday June 29, 2026
              const daysOffset = idx
              const dateStr = `2026-06-${29 + daysOffset}`
              const scheduledForDay = elements.filter(e => e.planned_casting_date === dateStr)

              return (
                <div key={day} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-3 flex flex-col justify-between h-full">
                  <div className="border-b border-slate-200 dark:border-white/5 pb-1">
                    <span className="text-[10px] uppercase font-black text-red-500 block leading-none">{day}</span>
                    <span className="text-[9px] text-slate-400 font-semibold">{dateStr}</span>
                  </div>
                  <div className="flex-grow py-2 overflow-y-auto space-y-1.5 max-h-[180px]">
                    {scheduledForDay.map(s => (
                      <div key={s.id} className="p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-lg text-[9px] leading-tight">
                        <span className="font-extrabold block truncate text-neutral-800 dark:text-white">{s.drawing_number}</span>
                        <span className="text-slate-400 font-medium">Qty: {s.quantity} | {s.assigned_bed}</span>
                      </div>
                    ))}
                    {scheduledForDay.length === 0 && (
                      <span className="text-[9px] text-slate-500 italic block py-4 text-center">No casting</span>
                    )}
                  </div>
                  <div className="text-[8px] bg-slate-100 dark:bg-white/5 py-1 text-center font-bold rounded uppercase">
                    {scheduledForDay.length} Items Scheduled
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. BED UTILIZATION VIEW */}
      {activeTab === 'beds' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                Precast Long Casting Beds Occupancy Monitor
              </h3>
              <p className="text-[11px] text-slate-400">Real-time mould bed casting length allocation tracking</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Target Date:</span>
              <input type="date" className="px-3 py-1.5 rounded-lg glowing-input text-xs w-40" value={castDate} onChange={e=>setCastDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-6">
            {bedsList.map(bedName => {
              const bedLog = bedAllocations[bedName] || []
              const totalElementsPlanned = bedLog.reduce((acc, curr) => acc + curr.quantity, 0)
              // Calculate width / occupancy limit (e.g. max 120m bed)
              const maxBedLength = bedName.includes('HCS') ? 150 : 120
              const lengthUsed = bedLog.reduce((acc, curr) => acc + (curr.quantity * 2.5), 0) // Assume 2.5m per element average
              const percentUsed = Math.min(100, Math.round((lengthUsed / maxBedLength) * 100))

              return (
                <div key={bedName} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-sm font-extrabold text-neutral-800 dark:text-white uppercase flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${percentUsed > 85 ? 'bg-red-500 animate-pulse' : percentUsed > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {bedName}
                    </span>
                    <span className="text-slate-500">
                      Casting Length: <strong className="text-red-500">{lengthUsed}m</strong> / {maxBedLength}m ({percentUsed}% capacity allocated)
                    </span>
                  </div>

                  {/* Bed track representation */}
                  <div className="w-full h-10 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden relative flex shadow-inner">
                    {bedLog.map((item, idx) => {
                      const itemWidth = Math.max(10, Math.round(((item.quantity * 2.5) / maxBedLength) * 100))
                      return (
                        <div
                          key={item.id}
                          className="h-full border-r border-slate-200 dark:border-black/50 p-2 flex flex-col justify-center text-[8.5px] leading-tight relative cursor-pointer hover:opacity-90 transition-opacity"
                          style={{
                            width: `${itemWidth}%`,
                            background: idx % 2 === 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.08)'
                          }}
                          title={`Project: ${item.project_no} | DWG: ${item.drawing_number} | Qty: ${item.quantity}`}
                        >
                          <span className="font-extrabold text-neutral-900 dark:text-white truncate block">{item.drawing_number}</span>
                          <span className="text-slate-500 font-bold truncate block">{item.project_no} ({item.quantity} pcs)</span>
                        </div>
                      )
                    })}
                    {bedLog.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500 font-semibold uppercase tracking-wider italic">
                        Empty bed - No casting scheduled for {castDate}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
