import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

type MaintenanceLog = {
  id: string
  equipment_type: 'Trailer' | 'Crane' | 'Mould'
  equipment_id: string
  maintenance_date: string
  description: string
  technician: string
  status: 'Completed' | 'Scheduled' | 'Under Repair'
}

export default function MaintenancePage() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSubTab, setActiveSubTab] = useState<'calendar' | 'breakdowns'>('calendar')

  // Form State
  const [eqType, setEqType] = useState<'Trailer' | 'Crane' | 'Mould'>('Trailer')
  const [eqId, setEqId] = useState('')
  const [maintDate, setMaintDate] = useState('2026-06-29')
  const [description, setDescription] = useState('')
  const [technician, setTechnician] = useState('')
  const [maintStatus, setMaintStatus] = useState<MaintenanceLog['status']>('Completed')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadLogs() {
      const { data } = await supabase.from('maintenance_logs').select('*')
      setLogs(data || [])
      setLoading(false)
    }
    loadLogs()
  }, [])

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eqId || !description) {
      alert('Equipment ID and Description are required!')
      return
    }
    setSaving(true)

    const payload = {
      equipment_type: eqType,
      equipment_id: eqId.toUpperCase().trim(),
      maintenance_date: maintDate,
      description,
      technician,
      status: maintStatus
    }

    try {
      await supabase.from('maintenance_logs').insert([payload])
      const { data } = await supabase.from('maintenance_logs').select('*')
      setLogs(data || [])
      setEqId('')
      setDescription('')
      setTechnician('')
      alert('Maintenance event registered successfully!')
    } catch (err) {
      console.error(err)
      alert('Error saving maintenance details')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading maintenance logs...</div>
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Equipment Maintenance <span className="text-red-500 font-light">Control</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Schedule vehicle services, crane certification inspections, and mould calibration breakdown logs</p>
        </div>
      </div>

      {/* Sub Tabs Toggle */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-white/5 pb-2">
        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
            activeSubTab === 'calendar' 
              ? 'border-red-500 text-red-500' 
              : 'border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          📅 Preventive Maintenance Calendar
        </button>
        <button
          onClick={() => setActiveSubTab('breakdowns')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
            activeSubTab === 'breakdowns' 
              ? 'border-red-500 text-red-500' 
              : 'border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          🔧 Breakdown & Service History
        </button>
      </div>

      {/* Form and list grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Maintenance event form */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4 h-fit">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
            Log Maintenance Event
          </h3>
          <form onSubmit={handleSaveLog} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Equipment Type</span>
                <select className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={eqType} onChange={e=>setEqType(e.target.value as any)}>
                  <option value="Trailer">Trailer</option>
                  <option value="Crane">Crane</option>
                  <option value="Mould">Mould</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Equipment ID / Plate</span>
                <input type="text" placeholder="E.g. 80774" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={eqId} onChange={e=>setEqId(e.target.value)} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Event Date</span>
                <input type="date" className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs" value={maintDate} onChange={e=>setMaintDate(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Service Status</span>
                <select className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={maintStatus} onChange={e=>setMaintStatus(e.target.value as any)}>
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Under Repair">Under Repair</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Maintenance Description</span>
              <textarea placeholder="Write fault descriptions or preventative actions..." className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs h-16 resize-none" value={description} onChange={e=>setDescription(e.target.value)} />
            </label>

            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Technician / Workshop</span>
              <input type="text" placeholder="E.g. Factory Maintenance Team" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={technician} onChange={e=>setTechnician(e.target.value)} />
            </label>

            <button type="submit" disabled={saving} className="w-full bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-xs uppercase py-2.5 rounded-xl shadow-lg mt-2 btn-interactive">
              🔧 Register Maintenance Event
            </button>
          </form>
        </div>

        {/* List Content */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Sub-Tab 1: Calendar View */}
          {activeSubTab === 'calendar' && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4 animate-fadeIn">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                Scheduled Preventive Maintenance Events
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {logs.filter(l => l.status === 'Scheduled').map(l => (
                  <div key={l.id} className="p-4 border border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-black/10 relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded font-black uppercase">
                          {l.equipment_type} ID: {l.equipment_id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{l.maintenance_date}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2.5">{l.description}</p>
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold border-t border-slate-200 dark:border-white/5 pt-2 mt-3 uppercase">
                      Technician: {l.technician || 'Factory Maintenance Team'}
                    </div>
                  </div>
                ))}
                {logs.filter(l => l.status === 'Scheduled').length === 0 && (
                  <span className="text-xs text-slate-500 py-12 text-center col-span-2 uppercase font-semibold">No scheduled maintenance events logged</span>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Breakdown & Service History Grid */}
          {activeSubTab === 'breakdowns' && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4 animate-fadeIn">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                Breakdown & Service History logs
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[9px] uppercase">
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5">Equipment ID</th>
                      <th className="py-2.5 text-center">Service Date</th>
                      <th className="py-2">Description</th>
                      <th className="py-2">Technician</th>
                      <th className="py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                    {logs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 font-semibold text-red-500">{l.equipment_type}</td>
                        <td className="py-3 font-bold text-neutral-800 dark:text-white">{l.equipment_id}</td>
                        <td className="py-3 text-center text-slate-400">{l.maintenance_date}</td>
                        <td className="py-3 truncate max-w-[200px]" title={l.description}>{l.description}</td>
                        <td className="py-3 text-slate-500 font-semibold">{l.technician}</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            l.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                            l.status === 'Under Repair' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                            'bg-slate-100 dark:bg-white/5 text-slate-400'
                          }`}>{l.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}
