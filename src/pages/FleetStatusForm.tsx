import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Typeahead from '../components/Typeahead'

export default function FleetStatusForm(){
  const [plate, setPlate] = useState('')
  const [status, setStatus] = useState('UNDER LOADING AT SY')
  const [site, setSite] = useState('')
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const statuses = [
    'IN FACTORY EMPTY',
    'NOT OFFLOAD',
    'UNDER LOADING AT SY',
    'SHIFTING AT SITE',
    'INTERNAL SHIFTING',
    'EMPTY/BACK TO FACTORY'
  ]

  const handleSubmit = async (e: React.FormEvent) =>{
    e.preventDefault()
    setSaving(true)
    try{
      const t = await supabase.from('trailers').select('id').eq('plate_no', plate).maybeSingle()
      const trailer_id = t.data?.id ?? null
      await supabase.from('fleet_status').insert([{ trailer_id, status_text: status, site_location: site, driver_name: driverName, driver_phone: driverPhone, status_timestamp: new Date().toISOString() }])
      setSite('')
    }catch(e){
      console.error(e)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-wide uppercase">
          Fleet Status <span className="text-primary font-light">Update</span>
        </h3>
        <p className="text-xs text-slate-400">Update current coordinates and load status of active fleet trailers</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Trailer Plate</span>
            <Typeahead value={plate} onChange={setPlate} table="trailers" column="plate_no" placeholder="Enter Plate Number" />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Current Status</span>
            <select 
              className="w-full px-4 py-3 rounded-xl glowing-input focus:outline-none font-medium appearance-none" 
              value={status} 
              onChange={e=>setStatus(e.target.value)}
            >
              {statuses.map(s=> <option key={s} value={s} className="bg-neutral-900 text-white">{s}</option>)}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Location / Site Project</span>
            <Typeahead value={site} onChange={setSite} table="projects" column="project_no" placeholder="Enter Site or Project No" />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Driver Name</span>
            <input className="w-full px-4 py-3 rounded-xl glowing-input focus:outline-none placeholder-slate-500 font-medium" placeholder="Driver Full Name" value={driverName} onChange={e=>setDriverName(e.target.value)} />
          </label>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Driver Phone Contact</span>
          <input className="w-full px-4 py-3 rounded-xl glowing-input focus:outline-none placeholder-slate-500 font-medium" placeholder="+971 5X XXX XXXX" value={driverPhone} onChange={e=>setDriverPhone(e.target.value)} />
        </label>

        {/* Action Panel */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <button className="bg-gradient-to-br from-primary to-primary-dark text-white px-6 py-3 rounded-xl font-extrabold tracking-wider uppercase btn-interactive shadow-lg shadow-primary/30">
            Submit Fleet Update
          </button>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${saving ? 'bg-primary animate-ping' : 'bg-green-400'}`} />
            <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">
              {saving ? 'Saving Telemetry…' : 'System Ready'}
            </span>
          </div>
        </div>
      </form>
    </div>
  )
}
