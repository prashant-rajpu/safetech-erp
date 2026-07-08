import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

// Reads/writes the shared `allocations` table (merged with the former
// dispatch_planning) — same data as the Truck/Trailer/Driver Allocation module.
type DispatchPlan = {
  id: string
  alloc_date?: string
  dispatch_no: string
  trailer_plate: string
  driver_name: string
  loading_time: string
  departure_time: string
  destination: string
  status: 'Planned' | 'Allocated' | 'Standby' | 'Loading' | 'In Transit' | 'Delivered' | 'Returning' | 'Released'
}

export default function LogisticsPlanningPage() {
  const [plans, setPlans] = useState<DispatchPlan[]>([])
  const [trailers, setTrailers] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [dispNo, setDispNo] = useState('')
  const [trailerPlate, setTrailerPlate] = useState('')
  const [driverName, setDriverName] = useState('')
  const [loadingTime, setLoadingTime] = useState('2026-06-29 08:00')
  const [departureTime, setDepartureTime] = useState('2026-06-29 08:45')
  const [destination, setDestination] = useState('THE ACRES - PHASE 1')
  const [dispStatus, setDispStatus] = useState<DispatchPlan['status']>('Loading')
  
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      const [planRes, trailRes, driverRes] = await Promise.all([
        supabase.from('allocations').select('*'),
        supabase.from('trailers').select('*'),
        supabase.from('drivers').select('*')
      ])
      setPlans(planRes.data || [])
      setTrailers(trailRes.data || [])
      setDrivers(driverRes.data || [])
      if (trailRes.data && trailRes.data.length > 0) {
        const first = trailRes.data[0]
        setTrailerPlate(first.plate_no)
        const d = (driverRes.data || []).find((x: any) => x.assigned_plate === first.plate_no)
        setDriverName(d?.name || '')
      }
      setLoading(false)
    }
    loadData()
  }, [])

  // Sync driver name when trailer is selected — driver assignment lives on
  // the Drivers master (assigned_plate), not on the trailer row
  const handleTrailerChange = (plate: string) => {
    setTrailerPlate(plate)
    const d = drivers.find(x => x.assigned_plate === plate)
    setDriverName(d?.name || '')
  }

  // Calculate fleet status counters
  const fleetCounters = useMemo(() => {
    const counts: Record<string, number> = { Available: 0, Loading: 0, 'In Transit': 0, Delivered: 0, Returning: 0, Maintenance: 0 }
    plans.forEach(p => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++
      }
    })
    // Add rest of trailers as Available if they are not in dispatch plans
    const plannedPlates = plans.map(p => p.trailer_plate)
    const availableTrailers = trailers.filter(t => !plannedPlates.includes(t.plate_no)).length
    counts.Available += availableTrailers

    return counts
  }, [plans, trailers])

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const newDispNo = dispNo.toUpperCase().trim() || `DISP-${Math.floor(1000 + Math.random() * 9000)}`

    const payload = {
      alloc_date: (loadingTime || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
      dispatch_no: newDispNo,
      trailer_plate: trailerPlate,
      trailer_type: trailers.find(t => t.plate_no === trailerPlate)?.type || '',
      driver_name: driverName,
      shift: 'Day',
      loading_time: loadingTime,
      departure_time: departureTime,
      destination,
      status: dispStatus
    }

    try {
      await supabase.from('allocations').insert([payload])

      // Auto update status in Kanban fleet status
      await supabase.from('fleet_status').insert([{
        trailer_id: trailers.find(t => t.plate_no === trailerPlate)?.id || 't1',
        status_text: dispStatus === 'In Transit' ? 'SHIFTING AT SITE' : dispStatus === 'Loading' ? 'UNDER LOADING AT SY' : 'IN FACTORY EMPTY',
        site_location: destination,
        driver_name: driverName,
        status_timestamp: new Date().toISOString()
      }])

      // Refresh list
      const { data } = await supabase.from('allocations').select('*')
      setPlans(data || [])
      setDispNo('')
      alert('Dispatch Plan saved and fleet status updated!')
    } catch (err) {
      console.error(err)
      alert('Error saving plan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading dispatch planning logs...</div>
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Dispatch & Fleet <span className="text-red-500 font-light">Planning</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Schedule trailer loadings, departure timelines, and monitor vehicle availability status</p>
        </div>
      </div>

      {/* Fleet Status Counters Grid */}
      <div className="grid grid-cols-6 gap-4">
        {Object.entries(fleetCounters).map(([status, count]) => (
          <div key={status} className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{status}</span>
            <span className="text-2xl font-black text-red-500 mt-1">{count} Vehicles</span>
          </div>
        ))}
      </div>

      {/* Form and list grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dispatch Plan Form */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
            Add Dispatch Trip Plan
          </h3>
          <form onSubmit={handleSavePlan} className="space-y-3.5">
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Dispatch Trip No.</span>
              <input type="text" placeholder="Auto-gen if empty" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={dispNo} onChange={e=>setDispNo(e.target.value)} />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Trailer Plate</span>
                <select className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs" value={trailerPlate} onChange={e=>handleTrailerChange(e.target.value)}>
                  {trailers.map(t => (
                    <option key={t.id} value={t.plate_no}>{t.plate_no} - {t.supplier.slice(0, 10)}...</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Assigned Driver</span>
                <input type="text" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs bg-slate-100 dark:bg-slate-900 cursor-not-allowed" value={driverName} readOnly />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Loading Time</span>
                <input type="text" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={loadingTime} onChange={e=>setLoadingTime(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Departure Time</span>
                <input type="text" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={departureTime} onChange={e=>setDepartureTime(e.target.value)} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Destination Site</span>
                <input type="text" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={destination} onChange={e=>setDestination(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Trip Status</span>
                <select className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs" value={dispStatus} onChange={e=>setDispStatus(e.target.value as any)}>
                  <option value="Planned">Planned</option>
                  <option value="Allocated">Allocated</option>
                  <option value="Standby">Standby</option>
                  <option value="Loading">Loading</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Returning">Returning</option>
                  <option value="Released">Released</option>
                </select>
              </label>
            </div>

            <button type="submit" disabled={saving} className="w-full bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-xs uppercase py-2.5 rounded-xl shadow-lg mt-2 btn-interactive">
              🚚 Schedule Dispatch Trip
            </button>
          </form>
        </div>

        {/* Dispatch Grid List */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">
            Active Dispatch Schedules
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[10px] uppercase">
                  <th className="py-2.5">Dispatch No</th>
                  <th className="py-2.5">Trailer Plate</th>
                  <th className="py-2.5">Driver</th>
                  <th className="py-2 text-center">Loading Time</th>
                  <th className="py-2 text-center">Departure</th>
                  <th className="py-2">Destination</th>
                  <th className="py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                {plans.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 font-mono font-bold text-red-500">{p.dispatch_no}</td>
                    <td className="py-3 font-bold text-neutral-800 dark:text-white">{p.trailer_plate}</td>
                    <td className="py-3 text-slate-500 font-semibold">{p.driver_name}</td>
                    <td className="py-3 text-center text-slate-400">{p.loading_time}</td>
                    <td className="py-3 text-center text-slate-400">{p.departure_time}</td>
                    <td className="py-3 font-semibold">{p.destination}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        p.status === 'In Transit' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        p.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        p.status === 'Loading' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-slate-100 dark:bg-white/5 text-slate-400'
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
