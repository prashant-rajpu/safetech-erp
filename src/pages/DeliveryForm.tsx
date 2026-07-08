import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Typeahead from '../components/Typeahead'

export default function DeliveryForm(){
  const [projectNo, setProjectNo] = useState('')
  const [projectName, setProjectName] = useState('')
  const [plate, setPlate] = useState('')
  const [elementType, setElementType] = useState('')
  const [elementCount, setElementCount] = useState<number | ''>('')
  const [dnNo, setDnNo] = useState('')
  const [volume, setVolume] = useState<number | ''>('')
  const [weight, setWeight] = useState<number | ''>('')
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) =>{
    e.preventDefault()
    setSaving(true)
    try{
      const t = await supabase.from('trailers').select('id').eq('plate_no', plate).maybeSingle()
      const trailer_id = t.data?.id ?? null
      await supabase.from('deliveries').insert([{ project_no: projectNo, project_name: projectName, location: projectName, trailer_id, element_type: elementType, element_count: elementCount === '' ? null : elementCount, dn_no: dnNo, volume_cum: volume === '' ? null : volume, weight_tons: weight === '' ? null : weight, remarks, delivery_date: new Date().toISOString().slice(0,10) }])
      setElementType('')
      setElementCount('')
      setDnNo('')
      setVolume('')
      setWeight('')
      setRemarks('')
    }catch(e){
      console.error(e)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-wide uppercase">
          Delivery Receipt <span className="text-red-500 font-light">Form</span>
        </h3>
        <p className="text-xs text-slate-400">Log finished precast units and delivery notes at site dropoffs</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Project Number</span>
            <Typeahead value={projectNo} onChange={setProjectNo} table="projects" column="project_no" placeholder="Enter Project No" />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Project Name</span>
            <input className="w-full px-4 py-3 rounded-xl glowing-input focus:outline-none placeholder-slate-500 font-medium" placeholder="E.g. Khalifa University" value={projectName} onChange={e=>setProjectName(e.target.value)} />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Trailer Plate</span>
            <Typeahead value={plate} onChange={setPlate} table="trailers" column="plate_no" placeholder="Enter Plate Number" />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Delivery Order (D/O) No</span>
            <input className="w-full px-4 py-3 rounded-xl glowing-input focus:outline-none placeholder-slate-500 font-medium" placeholder="Enter DO No" value={dnNo} onChange={e=>setDnNo(e.target.value)} />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Element Type</span>
            <input className="w-full px-4 py-3 rounded-xl glowing-input focus:outline-none placeholder-slate-500 font-medium" placeholder="HCS / Wall / Column" value={elementType} onChange={e=>setElementType(e.target.value)} />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Quantity (Units)</span>
            <input className="w-full px-4 py-3 rounded-xl glowing-input focus:outline-none placeholder-slate-500 font-medium" type="number" placeholder="Count" value={elementCount as any} onChange={e=>setElementCount(e.target.value === '' ? '' : parseInt(e.target.value))} />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Volume (m³)</span>
              <input className="w-full px-2.5 py-3 rounded-xl glowing-input focus:outline-none placeholder-slate-500 font-medium text-xs" type="number" step="0.01" placeholder="Vol" value={volume as any} onChange={e=>setVolume(e.target.value === '' ? '' : parseFloat(e.target.value))} />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Weight (Tons)</span>
              <input className="w-full px-2.5 py-3 rounded-xl glowing-input focus:outline-none placeholder-slate-500 font-medium text-xs" type="number" step="0.01" placeholder="Wt" value={weight as any} onChange={e=>setWeight(e.target.value === '' ? '' : parseFloat(e.target.value))} />
            </label>
          </div>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5">Remarks / Details</span>
          <textarea className="w-full px-4 py-3 rounded-xl glowing-input focus:outline-none placeholder-slate-500 font-medium" rows={2} placeholder="Offloading notes, issues..." value={remarks} onChange={e=>setRemarks(e.target.value)} />
        </label>

        {/* Action Panel */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <button className="bg-gradient-to-br from-red-500 to-red-700 text-white px-6 py-3 rounded-xl font-extrabold tracking-wider uppercase btn-interactive shadow-lg shadow-red-500/30">
            Submit Delivery Receipt
          </button>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${saving ? 'bg-red-500 animate-ping' : 'bg-green-400'}`} />
            <span className="text-xs font-bold text-slate-400 tracking-wide uppercase">
              {saving ? 'Saving Telemetry…' : 'System Ready'}
            </span>
          </div>
        </div>
      </form>
    </div>
  )
}
