import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Construction, Link2, CheckCircle2, XCircle, FileEdit } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/useAuth'
import { updateAudited, insertAudited } from '../lib/erp/db'

type CastingLog = {
  id: string
  casting_id: string
  cast_date: string
  shift: string
  bed_mould_id: string
  supervisor: string
  concrete_grade: string
  batch_number: string
  mix_design: string
  volume_cum: number
  weight_tons: number
  start_time: string
  finish_time: string
  qc_status: 'PENDING' | 'PASSED'
  remarks: string
  element_code: string
}

type RebarTracking = {
  id: string
  cage_id: string
  element_code: string
  steel_weight_kg: number
  fabricator: string
  inspection_status: string
  status: string
}

type QcInspection = {
  id: string
  element_code: string
  pre_pour_check: boolean
  reinforcement_check: boolean
  cover_check: boolean
  embedded_items_check: boolean
  dimensions_check: boolean
  concrete_test_ref: string
  inspector: string
  qc_result: 'PASSED' | 'FAILED'
}

export default function ProductionPage() {
  const { profile, user } = useAuth()
  const userEmail = profile?.email || user?.email || ''
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'casting'

  // General databases
  const [castLogs, setCastLogs] = useState<CastingLog[]>([])
  const [rebarLogs, setRebarLogs] = useState<RebarTracking[]>([])
  const [qcLogs, setQcLogs] = useState<QcInspection[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [concreteGrades, setConcreteGrades] = useState<any[]>([])
  const [mixDesigns, setMixDesigns] = useState<any[]>([])
  const [beds, setBeds] = useState<any[]>([])
  const [moulds, setMoulds] = useState<any[]>([])
  const [inspectors, setInspectors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 1. Casting Form State
  const [castDate, setCastDate] = useState('2026-06-29')
  const [castShift, setCastShift] = useState('Day Shift')
  const [castBed, setCastBed] = useState('Bed 1')
  const [castMould, setCastMould] = useState('Mould A')
  const [supervisor, setSupervisor] = useState('Prashant Singh')
  const [concreteGrade, setConcreteGrade] = useState('C45')
  const [batchNo, setBatchNo] = useState('')
  const [mixDesign, setMixDesign] = useState('MIX-C45-OPC')
  const [volume, setVolume] = useState('')
  const [weight, setWeight] = useState('')
  const [startTime, setStartTime] = useState('07:30')
  const [finishTime, setFinishTime] = useState('08:45')
  const [elementCode, setElementCode] = useState('')
  const [castRemarks, setCastRemarks] = useState('')
  const [projectNo, setProjectNo] = useState('')

  // 2. Rebar Form State
  const [cageId, setCageId] = useState('')
  const [rebarCode, setRebarCode] = useState('')
  const [steelWt, setSteelWt] = useState('150')
  const [fabricator, setFabricator] = useState('Steel Fabricator Team A')
  const [rebarInspection, setRebarInspection] = useState('Pending')
  const [rebarStatus, setRebarStatus] = useState('Ready')

  // 3. QC Form State
  const [qcCode, setQcCode] = useState('')
  const [prePour, setPrePour] = useState(true)
  const [qcRebar, setQcRebar] = useState(true)
  const [coverCheck, setCoverCheck] = useState(true)
  const [embedCheck, setEmbedCheck] = useState(true)
  const [dimCheck, setDimCheck] = useState(true)
  const [testRef, setTestRef] = useState('')
  const [qcInspectorName, setQcInspectorName] = useState('John Doe')
  const [qcResult, setQcResult] = useState<'PASSED' | 'FAILED'>('PASSED')

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      const [castRes, rebarRes, qcRes, pRes, cgRes, mdRes, bRes, mRes, iRes] = await Promise.all([
        supabase.from('production_casting').select('*').order('cast_date', { ascending: false }),
        supabase.from('reinforcement_tracking').select('*'),
        supabase.from('qc_inspections').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('concrete_grades').select('*'),
        supabase.from('mix_designs').select('*'),
        supabase.from('production_beds').select('*'),
        supabase.from('moulds').select('*'),
        supabase.from('qc_inspectors').select('*')
      ])

      setCastLogs(castRes.data || [])
      setRebarLogs(rebarRes.data || [])
      setQcLogs(qcRes.data || [])
      setProjects(pRes.data || [])
      setConcreteGrades(cgRes.data || [])
      setMixDesigns(mdRes.data || [])
      setBeds(bRes.data || [])
      setMoulds(mRes.data || [])
      setInspectors(iRes.data || [])

      if (pRes.data && pRes.data.length > 0) setProjectNo(pRes.data[0].project_no)
      if (cgRes.data && cgRes.data.length > 0) setConcreteGrade(cgRes.data[0].grade)
      if (mdRes.data && mdRes.data.length > 0) setMixDesign(mdRes.data[0].mix_code)
      if (bRes.data && bRes.data.length > 0) setCastBed(bRes.data[0].bed_name)
      if (mRes.data && mRes.data.length > 0) setCastMould(mRes.data[0].mould_name)
      if (iRes.data && iRes.data.length > 0) setQcInspectorName(iRes.data[0].name)

      setLoading(false)
    }
    loadData()
  }, [])

  // Save Casting Log
  const handleSaveCasting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!elementCode) {
      alert('Please enter the Element Code!')
      return
    }
    setSaving(true)
    const volNum = parseFloat(volume) || 0
    const wtNum = parseFloat(weight) || 0
    const castingId = `CAST-${castDate.replace(/-/g, '').slice(2)}-${Math.floor(10 + Math.random() * 90)}`

    const payload = {
      casting_id: castingId,
      cast_date: castDate,
      shift: castShift,
      bed_mould_id: `${castBed} / ${castMould}`,
      supervisor,
      concrete_grade: concreteGrade,
      batch_number: batchNo || `BATCH-${Math.floor(10000 + Math.random() * 90000)}`,
      mix_design: mixDesign,
      volume_cum: volNum,
      weight_tons: wtNum,
      start_time: startTime,
      finish_time: finishTime,
      qc_status: 'PENDING',
      remarks: castRemarks,
      element_code: elementCode.toUpperCase().trim()
    }

    try {
      await supabase.from('production_casting').insert([payload])

      // Auto-insert element to Stockyard as CASTING status
      const newStockyardElement = {
        element_code: elementCode.toUpperCase().trim(),
        project_no: projectNo,
        building: 'Building A',
        floor: 'G',
        zone: 'Zone 1',
        element_type: elementCode.includes('HC') ? 'HCS' : 'WL/PC',
        revision: 'R0',
        length_mm: 3000,
        width_mm: 1200,
        thickness_mm: 150,
        volume_cum: volNum,
        weight_tons: wtNum,
        cast_date: castDate,
        bay_location: castBed,
        status: 'Casting',
        curing_days: 0,
        remarks: 'Fresh concrete casted'
      }
      await supabase.from('stockyard_inventory').insert([newStockyardElement])

      // Update Element Traceability with Casting and Curing timestamps
      const code = elementCode.toUpperCase().trim()
      const currentTimestamp = `${castDate} ${startTime}`
      const { data: traceRow } = await supabase.from('element_traceability').select('id').eq('element_code', code).maybeSingle()
      if (traceRow) {
        await updateAudited('element_traceability', traceRow.id, {
          casting_timestamp: currentTimestamp,
          curing_timestamp: currentTimestamp
        }, userEmail, 'casting/curing timestamps stamped')
      } else {
        await insertAudited('element_traceability', [{
          element_code: code,
          planning_timestamp: `${castDate} 09:00`,
          casting_timestamp: currentTimestamp,
          qc_timestamp: 'Pending',
          curing_timestamp: currentTimestamp,
          stockyard_timestamp: 'Pending',
          loading_timestamp: 'Pending',
          dispatch_timestamp: 'Pending',
          delivery_timestamp: 'Pending'
        }], userEmail, 'traceability record created on casting')
      }

      // Refresh list
      const { data } = await supabase.from('production_casting').select('*').order('cast_date', { ascending: false })
      setCastLogs(data || [])
      setElementCode('')
      setVolume('')
      setWeight('')
      setCastRemarks('')
      alert('Casting Log saved and registered to Stockyard!')
    } catch (err) {
      console.error(err)
      alert('Error saving casting log')
    } finally {
      setSaving(false)
    }
  }

  // Save Rebar Tracking
  const handleSaveRebar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cageId || !rebarCode) {
      alert('Cage ID and Element Code are required!')
      return
    }
    setSaving(true)
    const payload = {
      cage_id: cageId.toUpperCase().trim(),
      element_code: rebarCode.toUpperCase().trim(),
      steel_weight_kg: parseFloat(steelWt) || 0,
      fabricator,
      inspection_status: rebarInspection,
      status: rebarStatus
    }
    try {
      await supabase.from('reinforcement_tracking').insert([payload])
      const { data } = await supabase.from('reinforcement_tracking').select('*')
      setRebarLogs(data || [])
      setCageId('')
      setRebarCode('')
      alert('Rebar Cage tracking log registered!')
    } catch (err) {
      console.error(err)
      alert('Error saving rebar tracking log')
    } finally {
      setSaving(false)
    }
  }

  // Save QC Inspection
  const handleSaveQc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qcCode) {
      alert('Please select or type an Element Code!')
      return
    }
    setSaving(true)
    const payload = {
      element_code: qcCode.toUpperCase().trim(),
      pre_pour_check: prePour,
      reinforcement_check: qcRebar,
      cover_check: coverCheck,
      embedded_items_check: embedCheck,
      dimensions_check: dimCheck,
      concrete_test_ref: testRef || `TR-${Math.floor(1000 + Math.random() * 9000)}`,
      inspector: qcInspectorName,
      qc_result: qcResult
    }
    try {
      await supabase.from('qc_inspections').insert([payload])

      // Update Element Traceability with QC and Stockyard timestamps
      const code = qcCode.toUpperCase().trim()
      const currentTimestamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
      const { data: traceRow } = await supabase.from('element_traceability').select('id').eq('element_code', code).maybeSingle()
      if (traceRow) {
        const tracePatch: Record<string, string> = { qc_timestamp: currentTimestamp }
        if (qcResult === 'PASSED') tracePatch.stockyard_timestamp = currentTimestamp
        await updateAudited('element_traceability', traceRow.id, tracePatch, userEmail, 'QC timestamp stamped')
      }

      // If QC result is PASSED, update production_casting and stockyard status!
      if (qcResult === 'PASSED') {
        // Update casting log state
        const { data: castRow } = await supabase.from('production_casting').select('id').eq('element_code', code).maybeSingle()
        if (castRow) {
          await updateAudited('production_casting', castRow.id, { qc_status: 'PASSED' }, userEmail, 'QC passed')
        }
        // Update stockyard state to CURING
        const { data: stockRow } = await supabase.from('stockyard_inventory').select('id').eq('element_code', code).maybeSingle()
        if (stockRow) {
          await updateAudited('stockyard_inventory', stockRow.id, {
            status: 'Curing',
            remarks: 'QC Passed - Curing in progress'
          }, userEmail, 'QC passed, moved to curing')
        }
      } else {
        // Update stockyard state to REJECTED
        const { data: stockRow } = await supabase.from('stockyard_inventory').select('id').eq('element_code', code).maybeSingle()
        if (stockRow) {
          await updateAudited('stockyard_inventory', stockRow.id, {
            status: 'Rejected',
            remarks: 'QC Check FAILED'
          }, userEmail, 'QC failed')
        }
      }

      // Refresh QC List
      const qRes = await supabase.from('qc_inspections').select('*')
      const cRes = await supabase.from('production_casting').select('*').order('cast_date', { ascending: false })
      setQcLogs(qRes.data || [])
      setCastLogs(cRes.data || [])
      setQcCode('')
      setTestRef('')
      alert('QC Pour Clearance registered successfully!')
    } catch (err) {
      console.error(err)
      alert('Error logging QC inspection')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-primary font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading production telemetry...</div>
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Manufacturing & Production <span className="text-primary font-light">Control</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor daily concrete pour casting logs, reinforcement steel fabrications, and QC inspection checkouts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel p-2.5 rounded-2xl flex gap-2 border border-slate-200 dark:border-white/5 shadow-md no-print">
        {['casting', 'rebar', 'qc'].map(t => (
          <button
            key={t}
            onClick={() => setSearchParams({ tab: t })}
            className={`flex-1 py-2.5 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all btn-interactive ${
              activeTab === t
                ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/25'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
            } inline-flex items-center justify-center gap-1.5`}
          >
            {t === 'casting' ? <><Construction size={13} /> Casting Log</> : t === 'rebar' ? <><Link2 size={13} /> Reinforcement Tracking</> : <><CheckCircle2 size={13} /> QC Inspections check</>}
          </button>
        ))}
      </div>

      {/* A. CASTING LOG TAB */}
      {activeTab === 'casting' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Casting Form */}
          <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
              Log Concrete Casting
            </h3>
            <form onSubmit={handleSaveCasting} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Date</span>
                  <input type="date" className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs" value={castDate} onChange={e=>setCastDate(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Shift</span>
                  <select className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={castShift} onChange={e=>setCastShift(e.target.value)}>
                    <option value="Day Shift">Day Shift</option>
                    <option value="Night Shift">Night Shift</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Project</span>
                  <select className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={projectNo} onChange={e=>setProjectNo(e.target.value)}>
                    {projects.map(p => (
                      <option key={p.project_no} value={p.project_no}>{p.project_no}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Element Code</span>
                  <input type="text" placeholder="00-IW01-2502M" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={elementCode} onChange={e=>setElementCode(e.target.value)} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Assigned Bed</span>
                  <select className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={castBed} onChange={e=>setCastBed(e.target.value)}>
                    {beds.map(b => (
                      <option key={b.id} value={b.bed_name}>{b.bed_name}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Assigned Mould</span>
                  <select className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={castMould} onChange={e=>setCastMould(e.target.value)}>
                    {moulds.map(m => (
                      <option key={m.id} value={m.mould_name}>{m.mould_name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Supervisor</span>
                  <input type="text" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={supervisor} onChange={e=>setSupervisor(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Concrete Grade</span>
                  <select className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={concreteGrade} onChange={e=>setConcreteGrade(e.target.value)}>
                    {concreteGrades.map(cg => (
                      <option key={cg.id} value={cg.grade}>{cg.grade}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Mix Design</span>
                  <select className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={mixDesign} onChange={e=>setMixDesign(e.target.value)}>
                    {mixDesigns.map(md => (
                      <option key={md.id} value={md.mix_code}>{md.mix_code}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Batch Card No.</span>
                  <input type="text" placeholder="Auto-gen if empty" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={batchNo} onChange={e=>setBatchNo(e.target.value)} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Volume (m³)</span>
                  <input type="number" step="0.01" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={volume} onChange={e=>setVolume(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Weight (Tons)</span>
                  <input type="number" step="0.01" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={weight} onChange={e=>setWeight(e.target.value)} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Start Time</span>
                  <input type="time" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={startTime} onChange={e=>setStartTime(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Finish Time</span>
                  <input type="time" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={finishTime} onChange={e=>setFinishTime(e.target.value)} />
                </label>
              </div>

              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Remarks</span>
                <input type="text" placeholder="Concrete slump OK..." className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={castRemarks} onChange={e=>setCastRemarks(e.target.value)} />
              </label>

              <button type="submit" disabled={saving} className="w-full bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-xs uppercase py-2.5 rounded-xl shadow-lg mt-2 btn-interactive inline-flex items-center justify-center gap-1.5">
                <Construction size={14} /> Log Casting Pour
              </button>
            </form>
          </div>

          {/* Casting list */}
          <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">
              Structural Casting log registry
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[10px] uppercase">
                    <th className="py-2">Casting ID</th>
                    <th className="py-2">Date</th>
                    <th className="py-2">Element</th>
                    <th className="py-2">Bed / Mould</th>
                    <th className="py-2">Shift</th>
                    <th className="py-2 text-right">Vol (m³)</th>
                    <th className="py-2 text-center">Grade</th>
                    <th className="py-2">Batch No</th>
                    <th className="py-2 text-center">QC Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {castLogs.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-primary">{c.casting_id}</td>
                      <td className="py-2.5">{c.cast_date}</td>
                      <td className="py-2.5 font-mono text-neutral-800 dark:text-white font-bold">{c.element_code}</td>
                      <td className="py-2.5 text-slate-500">{c.bed_mould_id}</td>
                      <td className="py-2.5 text-slate-500">{c.shift}</td>
                      <td className="py-2.5 text-right">{c.volume_cum.toFixed(2)}</td>
                      <td className="py-2.5 text-center font-bold">{c.concrete_grade}</td>
                      <td className="py-2.5 text-slate-400 font-mono">{c.batch_number}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          c.qc_status === 'PASSED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500'
                        }`}>{c.qc_status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* B. REINFORCEMENT TRACKING TAB */}
      {activeTab === 'rebar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Add form */}
          <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
              Log Cage Fabrication
            </h3>
            <form onSubmit={handleSaveRebar} className="space-y-3.5">
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Cage ID</span>
                <input type="text" placeholder="E.g. CAGE-WL-101-04" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={cageId} onChange={e=>setCageId(e.target.value)} />
              </label>

              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">For Element Code</span>
                <input type="text" placeholder="E.g. 00-IW01-2502M-003" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={rebarCode} onChange={e=>setRebarCode(e.target.value)} />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Steel Weight (kg)</span>
                  <input type="number" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={steelWt} onChange={e=>setSteelWt(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Fabricator Team</span>
                  <select className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={fabricator} onChange={e=>setFabricator(e.target.value)}>
                    <option value="Steel Fabricator Team A">Fabricator Team A</option>
                    <option value="Steel Fabricator Team B">Fabricator Team B</option>
                    <option value="Steel Fabricator Team C">Fabricator Team C</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">QC Inspection</span>
                  <select className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={rebarInspection} onChange={e=>setRebarInspection(e.target.value)}>
                    <option value="Passed">Passed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Status</span>
                  <select className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={rebarStatus} onChange={e=>setRebarStatus(e.target.value)}>
                    <option value="Ready">Ready</option>
                    <option value="Casting">Casting</option>
                    <option value="Planned">Planned</option>
                  </select>
                </label>
              </div>

              <button type="submit" disabled={saving} className="w-full bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-xs uppercase py-2.5 rounded-xl shadow-lg mt-2 btn-interactive inline-flex items-center justify-center gap-1.5">
                <Link2 size={14} /> Register Steel Cage
              </button>
            </form>
          </div>

          {/* Rebar list */}
          <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">
              Reinforcement Steel Fabrication registry
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[10px] uppercase">
                    <th className="py-2">Cage ID</th>
                    <th className="py-2">Element Code</th>
                    <th className="py-2 text-right">Steel Weight (kg)</th>
                    <th className="py-2">Fabricator</th>
                    <th className="py-2 text-center">QC Check</th>
                    <th className="py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {rebarLogs.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-primary">{r.cage_id}</td>
                      <td className="py-2.5 font-mono text-neutral-800 dark:text-white font-bold">{r.element_code}</td>
                      <td className="py-2.5 text-right font-semibold">{r.steel_weight_kg} kg</td>
                      <td className="py-2.5 text-slate-500">{r.fabricator}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          r.inspection_status === 'Passed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                        }`}>{r.inspection_status}</span>
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-slate-400 rounded text-[9px] font-bold uppercase">{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* C. QC INSPECTION TAB */}
      {activeTab === 'qc' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Add form */}
          <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
              Submit QC Pre-Pour Clearance
            </h3>
            <form onSubmit={handleSaveQc} className="space-y-4">
              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Target Element Code</span>
                <input type="text" placeholder="E.g. 00-IW01-2502M-003" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={qcCode} onChange={e=>setQcCode(e.target.value)} />
              </label>

              <div className="space-y-2 border border-slate-200 dark:border-white/5 p-3 rounded-xl bg-slate-50 dark:bg-black/10">
                <span className="text-[9px] uppercase font-black text-slate-400 block mb-1">Pre-Pour Checklist checks</span>
                
                <label className="flex items-center gap-2 text-xs font-bold select-none cursor-pointer">
                  <input type="checkbox" checked={prePour} onChange={e=>setPrePour(e.target.checked)} className="rounded border-slate-300 dark:border-white/10 text-primary-dark" />
                  Mould Cleared & Oiled
                </label>
                <label className="flex items-center gap-2 text-xs font-bold select-none cursor-pointer">
                  <input type="checkbox" checked={qcRebar} onChange={e=>setQcRebar(e.target.checked)} className="rounded border-slate-300 dark:border-white/10 text-primary-dark" />
                  Reinforcement / Cage Secured
                </label>
                <label className="flex items-center gap-2 text-xs font-bold select-none cursor-pointer">
                  <input type="checkbox" checked={coverCheck} onChange={e=>setCoverCheck(e.target.checked)} className="rounded border-slate-300 dark:border-white/10 text-primary-dark" />
                  Spacer Concrete Cover Checked
                </label>
                <label className="flex items-center gap-2 text-xs font-bold select-none cursor-pointer">
                  <input type="checkbox" checked={embedCheck} onChange={e=>setEmbedCheck(e.target.checked)} className="rounded border-slate-300 dark:border-white/10 text-primary-dark" />
                  Embedded Plates / Sleeves Checked
                </label>
                <label className="flex items-center gap-2 text-xs font-bold select-none cursor-pointer">
                  <input type="checkbox" checked={dimCheck} onChange={e=>setDimCheck(e.target.checked)} className="rounded border-slate-300 dark:border-white/10 text-primary-dark" />
                  Dimensions Verification Completed
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">Concrete Test Ref</span>
                  <input type="text" placeholder="TR-C45-001" className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs" value={testRef} onChange={e=>setTestRef(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-[9px] uppercase font-black text-slate-500">QC Inspector</span>
                  <select className="w-full mt-1 px-2 py-1.5 rounded-lg glowing-input text-xs" value={qcInspectorName} onChange={e=>setQcInspectorName(e.target.value)}>
                    {inspectors.map(i => (
                      <option key={i.id} value={i.name}>{i.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-[9px] uppercase font-black text-slate-500">Clearance Result</span>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setQcResult('FAILED')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      qcResult === 'FAILED'
                        ? 'bg-primary/20 text-primary border border-primary/30 shadow-md shadow-primary/10'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5"><XCircle size={13} /> REJECTED / FAILED</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQcResult('PASSED')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      qcResult === 'PASSED'
                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} /> PASSED / CLEARED</span>
                  </button>
                </div>
              </label>

              <button type="submit" disabled={saving} className="w-full bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-xs uppercase py-2.5 rounded-xl shadow-lg mt-2 btn-interactive inline-flex items-center justify-center gap-1.5">
                <FileEdit size={14} /> Log QC clearance
              </button>
            </form>
          </div>

          {/* QC list */}
          <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">
              Structural pre-pour QC inspection clearance registry
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[10px] uppercase">
                    <th className="py-2">Element Code</th>
                    <th className="py-2 text-center">Pre-Pour</th>
                    <th className="py-2 text-center">Steel Check</th>
                    <th className="py-2 text-center">Cover</th>
                    <th className="py-2 text-center">Embeds</th>
                    <th className="py-2 text-center">Dims</th>
                    <th className="py-2">Test Ref</th>
                    <th className="py-2">Inspector</th>
                    <th className="py-2 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                  {qcLogs.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-neutral-800 dark:text-white">{q.element_code}</td>
                      <td className="py-2.5 text-center">{q.pre_pour_check ? <CheckCircle2 size={14} className="text-success inline" /> : <XCircle size={14} className="text-primary inline" />}</td>
                      <td className="py-2.5 text-center">{q.reinforcement_check ? <CheckCircle2 size={14} className="text-success inline" /> : <XCircle size={14} className="text-primary inline" />}</td>
                      <td className="py-2.5 text-center">{q.cover_check ? <CheckCircle2 size={14} className="text-success inline" /> : <XCircle size={14} className="text-primary inline" />}</td>
                      <td className="py-2.5 text-center">{q.embedded_items_check ? <CheckCircle2 size={14} className="text-success inline" /> : <XCircle size={14} className="text-primary inline" />}</td>
                      <td className="py-2.5 text-center">{q.dimensions_check ? <CheckCircle2 size={14} className="text-success inline" /> : <XCircle size={14} className="text-primary inline" />}</td>
                      <td className="py-2.5 font-mono text-slate-500">{q.concrete_test_ref}</td>
                      <td className="py-2.5 text-slate-500 font-semibold">{q.inspector}</td>
                      <td className="py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          q.qc_result === 'PASSED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>{q.qc_result}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
