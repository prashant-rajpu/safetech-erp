import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/useAuth'
import { updateAudited } from '../lib/erp/db'
import safetechLogo from '../assets/safetech_logo.png'
import { Construction, Shuffle, Timer, Pencil, Printer, Save, X } from 'lucide-react'

type StockyardItem = {
  id: string
  element_code: string
  project_no: string
  building: string
  floor: string
  zone: string
  element_type: string
  revision: string
  length_mm: number
  width_mm: number
  thickness_mm: number
  volume_cum: number
  weight_tons: number
  cast_date: string
  bay_location: string
  status: 'Planned' | 'Casting' | 'Curing' | 'Stockyard' | 'Loading' | 'Delivered' | 'Rejected'
  remarks: string
  curing_days?: number
}

type YardMovement = {
  id: string
  element_code: string
  from_bay: string
  to_bay: string
  crane: string
  operator: string
  movement_time: string
  remarks: string
}

export default function StockyardPage() {
  const { profile, user } = useAuth()
  const userEmail = profile?.email || user?.email || ''
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'inventory'

  // DB States
  const [items, setItems] = useState<StockyardItem[]>([])
  const [movements, setMovements] = useState<YardMovement[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [bays, setBays] = useState<any[]>([])
  const [operators, setOperators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters State
  const [searchCode, setSearchCode] = useState('')
  const [filterProject, setFilterProject] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')

  // Label Modal State
  const [labelItem, setLabelItem] = useState<StockyardItem | null>(null)
  const [labelSize, setLabelSize] = useState<'A5' | 'A6' | 'Thermal'>('A6')

  // Yard Movement Form State
  const [moveCode, setMoveCode] = useState('')
  const [fromBay, setFromBay] = useState('Bed 1')
  const [toBay, setToBay] = useState('Bay 01')
  const [crane, setCrane] = useState('Gantry Crane 1')
  const [moveOperator, setMoveOperator] = useState('Ramesh Kumar')
  const [moveRemarks, setMoveRemarks] = useState('')

  // Edit Stock State
  const [editingItem, setEditingItem] = useState<StockyardItem | null>(null)
  const [editBay, setEditBay] = useState('')
  const [editStatus, setEditStatus] = useState<StockyardItem['status']>('Curing')
  const [editRemarks, setEditRemarks] = useState('')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      const [stockRes, moveRes, projRes, bayRes, opRes] = await Promise.all([
        supabase.from('stockyard_inventory').select('*').order('cast_date', { ascending: false }),
        supabase.from('yard_movement').select('*').order('movement_time', { ascending: false }),
        supabase.from('projects').select('*'),
        supabase.from('yard_bays').select('*'),
        supabase.from('crane_operators').select('*')
      ])

      // Re-calculate curing days dynamically since casting date
      const castItems = (stockRes.data || []).map((item: any) => {
        if (!item.cast_date) return { ...item, curing_days: 0 }
        const diffTime = Math.abs(new Date('2026-06-29').getTime() - new Date(item.cast_date).getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return { ...item, curing_days: diffDays }
      })

      setItems(castItems)
      setMovements(moveRes.data || [])
      setProjects(projRes.data || [])
      setBays(bayRes.data || [])
      setOperators(opRes.data || [])

      if (bayRes.data && bayRes.data.length > 0) {
        setFromBay(bayRes.data[0].bay_name)
        setToBay(bayRes.data[0].bay_name)
      }
      if (opRes.data && opRes.data.length > 0) {
        setMoveOperator(opRes.data[0].name)
      }

      setLoading(false)
    }
    loadData()
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchSearch = !searchCode || i.element_code.toLowerCase().includes(searchCode.toLowerCase().trim())
      const matchProj = filterProject === 'ALL' || i.project_no === filterProject
      const matchStatus = filterStatus === 'ALL' || i.status === filterStatus
      return matchSearch && matchProj && matchStatus
    })
  }, [items, searchCode, filterProject, filterStatus])

  // Save Movement Log
  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!moveCode) {
      alert('Element Code is required!')
      return
    }
    setSaving(true)

    const payload = {
      element_code: moveCode.toUpperCase().trim(),
      from_bay: fromBay,
      to_bay: toBay,
      crane,
      operator: moveOperator,
      movement_time: new Date().toISOString().slice(0, 16).replace('T', ' '),
      remarks: moveRemarks
    }

    try {
      await supabase.from('yard_movement').insert([payload])

      // Auto-update bay location of element in stockyard
      const { data: stockRow } = await supabase.from('stockyard_inventory').select('id').eq('element_code', moveCode.toUpperCase().trim()).maybeSingle()
      if (stockRow) {
        await updateAudited('stockyard_inventory', stockRow.id, {
          bay_location: toBay,
          remarks: `Moved to ${toBay} via ${crane}`
        }, userEmail, 'bay location updated via crane move')
      }

      // Refresh states
      const sRes = await supabase.from('stockyard_inventory').select('*').order('cast_date', { ascending: false })
      const mRes = await supabase.from('yard_movement').select('*').order('movement_time', { ascending: false })
      setItems(sRes.data || [])
      setMovements(mRes.data || [])
      setMoveCode('')
      setMoveRemarks('')
      alert('Element movement logged and bay location updated!')
    } catch (err) {
      console.error(err)
      alert('Error logging movement')
    } finally {
      setSaving(false)
    }
  }

  // Open the edit modal pre-filled with the selected row
  const startEdit = (item: StockyardItem) => {
    setEditingItem(item)
    setEditBay(item.bay_location || '')
    setEditStatus(item.status)
    setEditRemarks((item as any).remarks || '')
  }

  // Update Inventory details CRUD
  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setSaving(true)

    try {
      await supabase.from('stockyard_inventory').update({
        bay_location: editBay,
        status: editStatus,
        remarks: editRemarks
      }).eq('id', editingItem.id)

      // Refresh items list
      const { data } = await supabase.from('stockyard_inventory').select('*').order('cast_date', { ascending: false })
      setItems(data || [])
      setEditingItem(null)
      alert('Stockyard element inventory updated!')
    } catch (err) {
      console.error(err)
      alert('Error updating stockyard row')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-primary font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading stockyard inventory...</div>
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Stockyard & Inventory <span className="text-primary font-light">Control</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track structural element bay placement, concrete curing cycles, and crane movements</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="glass-panel p-2.5 rounded-2xl flex gap-2 border border-slate-200 dark:border-white/5 shadow-md no-print">
        {['inventory', 'movement', 'curing'].map(t => (
          <button
            key={t}
            onClick={() => setSearchParams({ tab: t })}
            className={`flex-1 py-2.5 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all btn-interactive ${
              activeTab === t 
                ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/25' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            } inline-flex items-center justify-center gap-1.5`}
          >
            {t === 'inventory' ? <><Construction size={13} /> Element Inventory</> : t === 'movement' ? <><Shuffle size={13} /> Yard Movement</> : <><Timer size={13} /> Curing Tracker</>}
          </button>
        ))}
      </div>

      {/* A. ELEMENT INVENTORY TAB */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Search toolbar */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <span className="text-[9px] uppercase font-black text-slate-500 block mb-1">Search Element Code</span>
              <input type="text" placeholder="Search by ID code..." className="w-full px-3 py-1.5 rounded-lg glowing-input text-xs" value={searchCode} onChange={e=>setSearchCode(e.target.value)} />
            </div>
            <div className="w-48">
              <span className="text-[9px] uppercase font-black text-slate-500 block mb-1">Project</span>
              <select className="w-full px-3 py-1.5 rounded-lg glowing-input text-xs" value={filterProject} onChange={e=>setFilterProject(e.target.value)}>
                <option value="ALL">ALL PROJECTS</option>
                {projects.map(p => (
                  <option key={p.project_no} value={p.project_no}>{p.project_no}</option>
                ))}
              </select>
            </div>
            <div className="w-48">
              <span className="text-[9px] uppercase font-black text-slate-500 block mb-1">Status</span>
              <select className="w-full px-3 py-1.5 rounded-lg glowing-input text-xs" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
                <option value="ALL">ALL STATUSES</option>
                {['Planned', 'Casting', 'Curing', 'Stockyard', 'Loading', 'Delivered', 'Rejected'].map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid table */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[10px] uppercase">
                    <th className="py-2.5">Element ID</th>
                    <th className="py-2.5">Project</th>
                    <th className="py-2.5">Bldg / Flr / Zone</th>
                    <th className="py-2.5">Type / Rev</th>
                    <th className="py-2.5 text-right">Dimensions (L×W×T mm)</th>
                    <th className="py-2.5 text-right">Vol / Wt</th>
                    <th className="py-2.5 text-center">Cast Date</th>
                    <th className="py-2.5 text-center">Current Bay</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2 font-mono font-bold text-neutral-900 dark:text-white">{item.element_code}</td>
                      <td className="py-2">{item.project_no}</td>
                      <td className="py-2 text-slate-500 font-medium">
                        {item.building} / {item.floor} / {item.zone}
                      </td>
                      <td className="py-2">
                        {item.element_type} <span className="text-[10px] text-primary font-bold">[{item.revision || 'R0'}]</span>
                      </td>
                      <td className="py-2 text-right font-mono text-slate-500">
                        {item.length_mm || 0}×{item.width_mm || 0}×{item.thickness_mm || 0}
                      </td>
                      <td className="py-2 text-right font-semibold">
                        {(item.volume_cum || 0).toFixed(2)}m³ / {(item.weight_tons || 0).toFixed(2)}T
                      </td>
                      <td className="py-2 text-center text-slate-400">{item.cast_date || '—'}</td>
                      <td className="py-2 text-center font-bold text-primary">{item.bay_location || '—'}</td>
                      <td className="py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          item.status === 'Stockyard' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          item.status === 'Curing' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                          item.status === 'Delivered' ? 'bg-slate-100 dark:bg-white/5 text-slate-400' :
                          item.status === 'Rejected' ? 'bg-primary/10 text-primary border border-primary/20 animate-pulse' :
                          'bg-primary/15 text-primary'
                        }`}>{item.status}</span>
                      </td>
                      <td className="py-2 text-center space-x-1.5">
                        <button onClick={() => startEdit(item)} className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 hover:bg-primary/10 text-slate-600 dark:text-slate-300 hover:text-primary text-[10px] font-bold rounded-md transition-all inline-flex items-center gap-1">
                          <Pencil size={10} /> Edit
                        </button>
                        <button onClick={() => setLabelItem(item)} className="px-2 py-0.5 bg-primary/15 hover:bg-primary/20 text-primary text-[10px] font-bold rounded-md transition-all inline-flex items-center gap-1">
                          <Printer size={10} /> Label
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* B. YARD MOVEMENT TAB */}
      {activeTab === 'movement' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Movement log form */}
          <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
              Log Bay-to-Bay Transfer
            </h3>
            <form onSubmit={handleSaveMovement} className="space-y-3.5">
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Element Code ID</span>
                <input type="text" placeholder="E.g. 00-IW01-2502M-003" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={moveCode} onChange={e=>setMoveCode(e.target.value)} />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">From Bay</span>
                  <select className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs" value={fromBay} onChange={e=>setFromBay(e.target.value)}>
                    {bays.map(b => (
                      <option key={b.id} value={b.bay_name}>{b.bay_name}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">To Bay</span>
                  <select className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs" value={toBay} onChange={e=>setToBay(e.target.value)}>
                    {bays.map(b => (
                      <option key={b.id} value={b.bay_name}>{b.bay_name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Crane Assigned</span>
                  <input type="text" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={crane} onChange={e=>setCrane(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Crane Operator</span>
                  <select className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs" value={moveOperator} onChange={e=>setMoveOperator(e.target.value)}>
                    {operators.map(o => (
                      <option key={o.id} value={o.name}>{o.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Remarks</span>
                <input type="text" placeholder="Relocated for curing curing access..." className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={moveRemarks} onChange={e=>setMoveRemarks(e.target.value)} />
              </label>

              <button type="submit" disabled={saving} className="w-full bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-xs uppercase py-2.5 rounded-xl shadow-lg mt-2 btn-interactive inline-flex items-center justify-center gap-1.5">
                <Shuffle size={14} /> Log Yard Movement
              </button>
            </form>
          </div>

          {/* Movement history */}
          <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">
              Yard Transfer Movement history
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[10px] uppercase">
                    <th className="py-2">Element Code</th>
                    <th className="py-2 text-center">From Bay</th>
                    <th className="py-2 text-center">To Bay</th>
                    <th className="py-2">Crane</th>
                    <th className="py-2">Operator</th>
                    <th className="py-2 text-center">Time</th>
                    <th className="py-2">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {movements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-neutral-800 dark:text-white">{m.element_code}</td>
                      <td className="py-2.5 text-center font-semibold text-slate-500">{m.from_bay}</td>
                      <td className="py-2.5 text-center font-bold text-primary">{m.to_bay}</td>
                      <td className="py-2.5">{m.crane}</td>
                      <td className="py-2.5 text-slate-500 font-semibold">{m.operator}</td>
                      <td className="py-2.5 text-center text-slate-400">{m.movement_time}</td>
                      <td className="py-2.5 text-slate-500 font-medium">{m.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* C. CURING TRACKER TAB */}
      {activeTab === 'curing' && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4 animate-fadeIn">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
            Concrete Curing Ageing & Strength Tracker
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[10px] uppercase">
                  <th className="py-2.5">Element Code</th>
                  <th className="py-2.5 text-center">Casting Date</th>
                  <th className="py-2.5 text-center">Days Completed</th>
                  <th className="py-2.5 text-center">Target Strength</th>
                  <th className="py-2.5 text-center">Estimated Current Strength</th>
                  <th className="py-2.5 text-center">Dispatch Status</th>
                  <th className="py-2">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {items.filter(i => i.status === 'Curing' || i.status === 'Stockyard').map(item => {
                  const days = item.curing_days || 0
                  // Estimate strength curve: 0d=15%, 1d=40%, 2d=65%, 3d=75%, 7d=90%, 28d=100%
                  const targetStr = item.element_code.includes('HC') ? 60 : 45
                  let pct = 0
                  if (days === 0) pct = 15
                  else if (days === 1) pct = 40
                  else if (days === 2) pct = 65
                  else if (days >= 3 && days < 7) pct = 78
                  else if (days >= 7 && days < 28) pct = 92
                  else pct = 100

                  const currentStrength = ((pct / 100) * targetStr).toFixed(1)

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 font-mono font-bold text-neutral-800 dark:text-white">{item.element_code}</td>
                      <td className="py-3 text-center">{item.cast_date}</td>
                      <td className="py-3 text-center font-bold text-primary">{days} Days</td>
                      <td className="py-3 text-center font-semibold text-slate-400">{targetStr} MPa</td>
                      <td className="py-3 text-center font-bold text-neutral-800 dark:text-white">
                        {currentStrength} MPa ({pct}%)
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          days >= 3
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                        } inline-flex items-center gap-1`}>
                          {days >= 3 ? <><span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> Ready for Dispatch</> : <><span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Active Curing</>}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 font-medium">{item.remarks}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT ELEMENT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-sm w-full rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-2xl relative space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
              Edit Element details
            </h3>
            
            <form onSubmit={handleUpdateItem} className="space-y-3.5">
              <div>
                <span className="text-[9px] uppercase font-black text-slate-500 block">Element ID</span>
                <span className="text-xs font-mono font-bold text-neutral-800 dark:text-white">{editingItem.element_code}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Bay Location</span>
                  <input type="text" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={editBay} onChange={e=>setEditBay(e.target.value.toUpperCase())} />
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Status</span>
                  <select className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={editStatus} onChange={e=>setEditStatus(e.target.value as any)}>
                    {['Planned', 'Casting', 'Curing', 'Stockyard', 'Loading', 'Delivered', 'Rejected'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Remarks</span>
                <input type="text" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={editRemarks} onChange={e=>setEditRemarks(e.target.value)} />
              </label>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingItem(null)} className="flex-1 py-2 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase rounded-xl transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-xs uppercase rounded-xl transition-all btn-interactive inline-flex items-center justify-center gap-1.5">
                  <Save size={13} /> Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ELEMENT LABEL GENERATOR MODAL */}
      {labelItem && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="glass-panel max-w-xl w-full rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-2xl relative space-y-4">
            
            {/* Modal Controls */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-2">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                Print Element barcode Label
              </h3>
              <div className="flex gap-2">
                {['A5', 'A6', 'Thermal'].map(size => (
                  <button
                    key={size}
                    onClick={() => setLabelSize(size as any)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      labelSize === size 
                        ? 'bg-primary/25 text-primary border border-primary/30' 
                        : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                    }`}
                  >
                    {size}
                  </button>
                ))}
                <button onClick={() => window.print()} className="px-2.5 py-1 bg-primary-dark text-white text-[10px] font-bold uppercase rounded-lg">
                  Print
                </button>
                <button onClick={() => setLabelItem(null)} className="text-slate-400 hover:text-white font-extrabold text-xs">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* PRINT AREA CONTAINER */}
            <div className="flex justify-center bg-neutral-200 p-6 rounded-2xl overflow-hidden shadow-inner">
              <div 
                className={`bg-white text-black p-5 border border-neutral-400 font-sans shadow-lg flex flex-col justify-between box-border ${
                  labelSize === 'A5' ? 'w-[148mm] h-[210mm]' : 
                  labelSize === 'A6' ? 'w-[105mm] h-[148mm]' : 
                  'w-[100mm] h-[100mm]' // Thermal label dimensions
                }`}
                style={{ contentVisibility: 'auto' }}
              >
                {/* Brand Header */}
                <div className="flex justify-between items-center border-b border-black pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black flex items-center justify-center p-1 rounded-lg">
                      <img src={safetechLogo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="font-black text-[12px] tracking-tight">SAFETECH PRECAST</span>
                      <span className="text-[7.5px] text-neutral-500 uppercase font-black">Building Manufacturing LLC</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-1.5 py-0.5 bg-black text-white text-[8px] font-bold uppercase rounded">
                      {labelItem.status}
                    </span>
                  </div>
                </div>

                {/* Main Label Data Grid */}
                <div className="grid grid-cols-2 gap-2 text-[9px] py-3 flex-grow font-semibold">
                  <div className="space-y-1">
                    <div>Project: <strong className="text-[10px] block">{labelItem.project_no}</strong></div>
                    <div>Drawing Ref: <strong className="block">{labelItem.element_code.slice(0, 15)}</strong></div>
                    <div>Building: <strong className="block">{labelItem.building}</strong></div>
                    <div>Floor / Zone: <strong className="block">{labelItem.floor} / {labelItem.zone}</strong></div>
                    <div>Mould/Bed: <strong className="block">{labelItem.bay_location}</strong></div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div>Element ID: <strong className="text-[10.5px] block font-mono text-primary-dark">{labelItem.element_code}</strong></div>
                    <div>Type: <strong className="block">{labelItem.element_type} [Rev {labelItem.revision}]</strong></div>
                    <div>Dimensions: <strong className="block">{labelItem.length_mm}×{labelItem.width_mm}×{labelItem.thickness_mm} mm</strong></div>
                    <div>Volume: <strong className="block">{labelItem.volume_cum.toFixed(2)} m³</strong></div>
                    <div>Weight: <strong className="block">{labelItem.weight_tons.toFixed(2)} Tons</strong></div>
                  </div>
                </div>

                {/* QR and Barcode code section */}
                <div className="flex justify-between items-end border-t border-dashed border-neutral-400 pt-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[7px] text-neutral-400 font-bold uppercase">Barcode 128 scan</span>
                    {/* Render industrial barcode using Libre Barcode 128 font */}
                    <span className="text-4xl text-black font-normal leading-none" style={{ fontFamily: "'Libre Barcode 128', sans-serif" }}>
                      {labelItem.element_code}
                    </span>
                    <span className="text-[8px] font-mono tracking-wider">{labelItem.element_code}</span>
                  </div>
                  <div className="w-16 h-16 shrink-0 border border-neutral-300 p-0.5 rounded-lg flex items-center justify-center bg-white">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                        JSON.stringify({
                          id: labelItem.element_code,
                          project: labelItem.project_no,
                          type: labelItem.element_type,
                          status: labelItem.status
                        })
                      )}`} 
                      alt="QR Code" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                </div>

                {/* Footer notes */}
                <div className="text-center text-[7.5px] text-neutral-500 font-bold uppercase pt-2 border-t border-neutral-200">
                  Casting Date: {labelItem.cast_date} | Quality Passed Clearance
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
