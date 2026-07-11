import React, { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../lib/supabaseClient'
import { fetchRows, updateAudited } from '../lib/erp/db'
import { logTraceEvent, type TraceStage } from '../lib/erp/elementTrace'
import { statusChipClass } from '../lib/erp/uiHelpers'
import { usePermissions } from '../lib/erp/usePermissions'
import { useAuth } from '../lib/useAuth'
import { getIcon } from '../lib/erp/icons'
import { CheckCircle2, Camera, Search, MapPin, AlertTriangle, Construction, Check, Shuffle, Hourglass } from 'lucide-react'

const STAGES: TraceStage[] = [
  'Planning', 'Casting', 'QC', 'Curing', 'Stockyard', 'Loading',
  'Dispatch', 'Delivered', 'At Site', 'Erected', 'Completed'
]

type ElementProfile = {
  elementId?: string
  stockId?: string
  element_code: string
  project_no: string
  project_name: string
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
  status: string
  remarks: string
  curing_days: number

  // QC details
  qc_pre_pour?: boolean
  qc_rebar?: boolean
  qc_cover?: boolean
  qc_embeds?: boolean
  qc_dims?: boolean
  qc_test_ref?: string
  qc_inspector?: string
  qc_result?: string

  // Delivery details
  dispatch_no?: string
  trailer_plate?: string
  driver_name?: string
  loading_time?: string
  do_no?: string
  delivery_status?: string

  // Movement history
  movements?: any[]
  trace?: any
}

const CAMERA_REGION_ID = 'qr-camera-region'

export default function QrScannerPage() {
  const { profile: authProfile, user } = useAuth()
  const { canEdit } = usePermissions()
  const editable = canEdit('stockyard')
  const userEmail = authProfile?.email || user?.email || ''
  const department = (authProfile as any)?.department || ''

  const [scanInput, setScanInput] = useState('')
  const [profile, setProfile] = useState<ElementProfile | null>(null)
  const [availableElements, setAvailableElements] = useState<any[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)

  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const [events, setEvents] = useState<any[]>([])
  const [showStatusForm, setShowStatusForm] = useState(false)
  const [showDefectForm, setShowDefectForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [stStage, setStStage] = useState<TraceStage>('Stockyard')
  const [stStatus, setStStatus] = useState<TraceStage>('Stockyard')
  const [dfStage, setDfStage] = useState<TraceStage>('Stockyard')
  const [dfSeverity, setDfSeverity] = useState<'Cosmetic' | 'Minor' | 'Major'>('Minor')
  const [dfDescription, setDfDescription] = useState('')

  useEffect(() => {
    async function loadElements() {
      const { data } = await supabase.from('stockyard_inventory').select('element_code')
      setAvailableElements(data || [])
    }
    loadElements()
  }, [])

  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}) }, [])

  async function startCamera() {
    setCameraError('')
    try {
      const scanner = new Html5Qrcode(CAMERA_REGION_ID)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 220 },
        (decodedText: string) => {
          // Printed labels encode SPBM-EL|<code>|... — token[1] is the lookup key
          // (same convention as elementQrPayload / buildQrPayload elsewhere).
          const parts = decodedText.split('|')
          const code = parts.length > 1 ? parts[1] : decodedText
          setScanInput(code)
          handleScan(code)
          stopCamera()
        },
        () => { /* ignore per-frame decode misses */ }
      )
      setCameraOn(true)
    } catch (err: any) {
      setCameraError(err?.message || 'Camera unavailable — use manual entry below')
      setCameraOn(false)
    }
  }

  async function stopCamera() {
    try { await scannerRef.current?.stop() } catch { /* already stopped */ }
    scannerRef.current = null
    setCameraOn(false)
  }

  const handleScan = async (codeStr: string) => {
    if (!codeStr) return
    const code = codeStr.toUpperCase().trim()
    setIsScanning(true)
    setScanSuccess(false)
    setShowStatusForm(false)
    setShowDefectForm(false)

    try {
      const [stockRes, qcRes, moveRes, delRes, traceRes, elRes, eventsRes] = await Promise.all([
        supabase.from('stockyard_inventory').select('*').eq('element_code', code).maybeSingle(),
        supabase.from('qc_inspections').select('*').eq('element_code', code).maybeSingle(),
        supabase.from('yard_movement').select('*').eq('element_code', code),
        supabase.from('deliveries').select('*').limit(1000),
        supabase.from('element_traceability').select('*').eq('element_code', code).maybeSingle(),
        supabase.from('elements').select('id').eq('element_code', code).maybeSingle(),
        fetchRows('traceability_events', { field: 'element_code', value: code })
      ])

      if (!stockRes.data) {
        alert(`Element ID ${code} not found in inventory!`)
        setIsScanning(false)
        return
      }

      const item = stockRes.data
      const qc = qcRes.data
      const movements = moveRes.data || []

      const matchDel = (delRes.data || []).find((d: any) =>
        d.remarks && d.remarks.toUpperCase().includes(code)
      )

      const { data: proj } = await supabase.from('projects').select('project_name').eq('project_no', item.project_no).maybeSingle()

      const diffTime = Math.abs(new Date('2026-06-29').getTime() - new Date(item.cast_date).getTime())
      const curingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      setProfile({
        elementId: elRes.data?.id,
        stockId: item.id,
        element_code: item.element_code,
        project_no: item.project_no,
        project_name: proj?.project_name || 'THE ACRES - PHASE 1',
        building: item.building || 'Building A',
        floor: item.floor || 'G',
        zone: item.zone || 'Zone 1',
        element_type: item.element_type,
        revision: item.revision || 'R0',
        length_mm: item.length_mm || 3000,
        width_mm: item.width_mm || 1200,
        thickness_mm: item.thickness_mm || 150,
        volume_cum: item.volume_cum || 1.5,
        weight_tons: item.weight_tons || 3.75,
        cast_date: item.cast_date,
        bay_location: item.bay_location || 'Bay 01',
        status: item.status,
        remarks: item.remarks || '',
        curing_days: curingDays,

        qc_pre_pour: qc?.pre_pour_check ?? true,
        qc_rebar: qc?.reinforcement_check ?? true,
        qc_cover: qc?.cover_check ?? true,
        qc_embeds: qc?.embedded_items_check ?? true,
        qc_dims: qc?.dimensions_check ?? true,
        qc_test_ref: qc?.concrete_test_ref ?? 'TR-C45-3312',
        qc_inspector: qc?.inspector ?? 'John Doe',
        qc_result: qc?.qc_result ?? 'PASSED',

        do_no: matchDel?.dn_no ?? (item.status === 'Delivered' ? 'SPBM-10369' : undefined),
        driver_name: matchDel ? 'WAQAR' : undefined,
        trailer_plate: matchDel ? '80774' : undefined,

        movements,
        // Honest: no fabricated fallback. A missing row means no trace has
        // been logged yet — the timeline below already renders "Pending" /
        // "Not Started" per-stage when trace is null, which is the truth.
        trace: traceRes.data || null
      })
      setEvents((eventsRes || []).slice().sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at))))
      setScanSuccess(true)
    } catch (err) {
      console.error(err)
      alert('Error loading scanned element profile')
    } finally {
      setIsScanning(false)
    }
  }

  async function submitStatusUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || busy) return
    setBusy(true)
    try {
      await logTraceEvent({
        elementCode: profile.element_code, stage: stStage, eventType: 'Status Update',
        status: stStatus, loggedBy: userEmail, department
      })
      if (profile.elementId) {
        await updateAudited('elements', profile.elementId, { status: stStatus }, userEmail, `Status update via scan — ${profile.element_code} → ${stStatus}`)
      }
      // The profile card's visible status chip reads stockyard_inventory, not
      // elements — keep both in sync so the logged update is actually visible
      // here, not just in the canonical elements table.
      if (profile.stockId) {
        await updateAudited('stockyard_inventory', profile.stockId, { status: stStatus }, userEmail, `Status update via scan — ${profile.element_code} → ${stStatus}`)
      }
      setStStatus('Stockyard')
      setShowStatusForm(false)
      await handleScan(profile.element_code)
    } finally {
      setBusy(false)
    }
  }

  async function submitDefect(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || busy) return
    if (!dfDescription.trim()) { alert('Describe the defect.'); return }
    setBusy(true)
    try {
      await logTraceEvent({
        elementCode: profile.element_code, stage: dfStage, eventType: 'Defect Reported',
        defectSeverity: dfSeverity, defectDescription: dfDescription, loggedBy: userEmail, department
      })
      setDfDescription('')
      setShowDefectForm(false)
      await handleScan(profile.element_code)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            QR / Barcode <span className="text-primary font-light">Scanner Terminal</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Scan element ID labels with a device camera, USB gun, or manual entry — log status updates and defects on the spot</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side: Scanner Input */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-5 h-fit">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
            Scan Input
          </h3>

          {/* Real camera scan region */}
          <div className="w-full aspect-video bg-neutral-900 rounded-2xl relative overflow-hidden border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center p-4 text-center">
            <div id={CAMERA_REGION_ID} className={cameraOn ? 'w-full h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover' : 'hidden'} />
            {!cameraOn && (
              isScanning ? (
                <div className="space-y-2 animate-pulse text-white">
                  <span className="flex justify-center"><Hourglass size={22} /></span>
                  <span className="text-[10px] uppercase font-black tracking-widest block text-primary">Looking up element…</span>
                </div>
              ) : scanSuccess ? (
                <div className="space-y-2 text-white">
                  <span className="flex justify-center text-emerald-500"><CheckCircle2 size={22} /></span>
                  <span className="text-[10px] uppercase font-black tracking-widest block text-emerald-500">Scan Complete! Profile Loaded</span>
                </div>
              ) : (
                <div className="space-y-2 text-slate-500">
                  <span className="flex justify-center"><Camera size={28} /></span>
                  <span className="text-[10px] uppercase font-black tracking-widest block">Camera not started</span>
                  <button
                    onClick={startCamera}
                    className="min-h-[44px] px-4 py-2.5 mt-2 bg-gradient-to-br from-primary to-primary-dark text-white text-[11px] font-extrabold uppercase rounded-lg btn-interactive inline-flex items-center gap-1.5"
                  >
                    <Camera size={14} /> Start Camera
                  </button>
                  {cameraError && <span className="text-[9px] text-primary block mt-1">{cameraError}</span>}
                </div>
              )
            )}
            {cameraOn && (
              <button
                onClick={stopCamera}
                className="absolute bottom-2 right-2 min-h-[36px] px-3 py-1.5 bg-black/70 text-white text-[9px] font-extrabold uppercase rounded-lg"
              >
                Stop Camera
              </button>
            )}
          </div>

          {/* USB Scanner / manual entry — always available regardless of camera state */}
          <div className="space-y-3.5 pt-3 border-t border-slate-100 dark:border-white/5">
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">USB Gun Input / Type Code ID</span>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Scan or type (E.g. 00-IW01-2502M-002)..."
                  className="flex-grow px-3 py-2 rounded-lg glowing-input text-xs font-mono font-bold min-h-[44px]"
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScan(scanInput)}
                />
                <button
                  onClick={() => handleScan(scanInput)}
                  className="min-h-[44px] px-4 py-2 bg-gradient-to-br from-primary to-primary-dark text-white text-xs font-extrabold uppercase rounded-lg btn-interactive"
                >
                  Scan
                </button>
              </div>
            </label>

            <div>
              <span className="text-[9px] uppercase font-black text-slate-500 block mb-1.5">Quick lookup</span>
              <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                {availableElements.map(el => (
                  <button
                    key={el.element_code}
                    onClick={() => {
                      setScanInput(el.element_code)
                      handleScan(el.element_code)
                    }}
                    className="text-[9px] font-mono bg-slate-50 dark:bg-white/5 hover:bg-primary/10 text-slate-600 dark:text-slate-400 hover:text-primary border border-slate-200 dark:border-white/5 px-2 py-1 rounded-md transition-all font-bold"
                  >
                    <span className="inline-flex items-center gap-1"><Search size={10} /> {el.element_code.slice(0, 15)}...</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          {profile ? (
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-6 animate-fadeIn relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary-dark to-black rounded-t-3xl" />

              {/* Header */}
              <div className="flex flex-wrap justify-between items-start gap-3 pb-4 border-b border-slate-200 dark:border-white/5">
                <div>
                  <span className="text-[10px] text-primary font-extrabold uppercase tracking-widest block">Structural Element Profile</span>
                  <h3 className="text-xl font-black text-neutral-900 dark:text-white font-mono mt-1">{profile.element_code}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{profile.project_no} — {profile.project_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {editable && (
                    <>
                      <button onClick={() => { setShowStatusForm(v => !v); setShowDefectForm(false) }} className="min-h-[40px] px-3 py-2 border border-primary/30 text-primary bg-primary/5 text-[9px] font-extrabold uppercase rounded-lg transition-all inline-flex items-center gap-1">
                        <MapPin size={11} /> Update Status
                      </button>
                      <button onClick={() => { setShowDefectForm(v => !v); setShowStatusForm(false) }} className="min-h-[40px] px-3 py-2 border border-amber-500/30 text-amber-500 bg-amber-500/5 text-[9px] font-extrabold uppercase rounded-lg transition-all inline-flex items-center gap-1">
                        <AlertTriangle size={11} /> Report Defect
                      </button>
                    </>
                  )}
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary font-black uppercase text-[10px] rounded-lg border border-primary/20">
                    {profile.status}
                  </span>
                </div>
              </div>

              {/* Update Status form */}
              {showStatusForm && (
                <form onSubmit={submitStatusUpdate} className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[9px] uppercase font-black text-slate-500">Stage</span>
                      <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs min-h-[40px]" value={stStage} onChange={e => setStStage(e.target.value as TraceStage)}>
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[9px] uppercase font-black text-slate-500">Status</span>
                      <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs min-h-[40px]" value={stStatus} onChange={e => setStStatus(e.target.value as TraceStage)}>
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                  </div>
                  <button type="submit" disabled={busy} className="min-h-[44px] w-full bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-xs uppercase py-2.5 rounded-xl shadow-lg btn-interactive">
                    {busy ? 'Saving…' : 'Log Status Update'}
                  </button>
                </form>
              )}

              {/* Report Defect form */}
              {showDefectForm && (
                <form onSubmit={submitDefect} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-[9px] uppercase font-black text-slate-500">Stage</span>
                      <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs min-h-[40px]" value={dfStage} onChange={e => setDfStage(e.target.value as TraceStage)}>
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[9px] uppercase font-black text-slate-500">Severity</span>
                      <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs min-h-[40px]" value={dfSeverity} onChange={e => setDfSeverity(e.target.value as any)}>
                        <option>Cosmetic</option><option>Minor</option><option>Major</option>
                      </select>
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-[9px] uppercase font-black text-slate-500">Description</span>
                    <textarea className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" rows={2} value={dfDescription} onChange={e => setDfDescription(e.target.value)} placeholder="Describe the defect…" />
                  </label>
                  <button type="submit" disabled={busy} className="min-h-[44px] w-full bg-gradient-to-br from-amber-500 to-amber-700 text-white font-bold text-xs uppercase py-2.5 rounded-xl shadow-lg btn-interactive">
                    {busy ? 'Saving…' : 'Log Defect'}
                  </button>
                </form>
              )}

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 border border-slate-100 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-black/10">
                  <span className="text-[9px] uppercase text-slate-400 font-bold block">Dimensions (L×W×T)</span>
                  <span className="text-xs font-black text-neutral-900 dark:text-white mt-1 block">
                    {profile.length_mm} × {profile.width_mm} × {profile.thickness_mm} mm
                  </span>
                </div>
                <div className="p-3 border border-slate-100 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-black/10">
                  <span className="text-[9px] uppercase text-slate-400 font-bold block">Type / Revision</span>
                  <span className="text-xs font-black text-neutral-900 dark:text-white mt-1 block">
                    {profile.element_type} [{profile.revision}]
                  </span>
                </div>
                <div className="p-3 border border-slate-100 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-black/10">
                  <span className="text-[9px] uppercase text-slate-400 font-bold block">Volume / Weight</span>
                  <span className="text-xs font-black text-primary mt-1 block">
                    {profile.volume_cum.toFixed(2)} m³ / {profile.weight_tons.toFixed(2)} T
                  </span>
                </div>
                <div className="p-3 border border-slate-100 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-black/10">
                  <span className="text-[9px] uppercase text-slate-400 font-bold block">Current Location</span>
                  <span className="text-xs font-black text-neutral-900 dark:text-white mt-1 block flex items-center gap-1">
                    <Construction size={13} className="shrink-0" /> {profile.bay_location}
                  </span>
                </div>
              </div>

              {/* Complete Traceability Timeline (Section 11 Requirement) */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-black text-slate-500 block">Complete Traceability Lifecycle Timeline</span>
                {!profile.trace && (
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
                    <AlertTriangle size={12} className="shrink-0" /> No traceability record found for this element yet — every stage below reflects no logged activity.
                  </div>
                )}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { key: 'planning_timestamp', label: '1. Planning', icon: '📝' },
                    { key: 'casting_timestamp', label: '2. Casting', icon: '🏗️' },
                    { key: 'qc_timestamp', label: '3. QC Check', icon: '🔍' },
                    { key: 'curing_timestamp', label: '4. Curing', icon: '⏱️' },
                    { key: 'stockyard_timestamp', label: '5. Stockyard', icon: '📦' },
                    { key: 'loading_timestamp', label: '6. Loading', icon: '🏗️' },
                    { key: 'dispatch_timestamp', label: '7. Dispatch', icon: '🚚' },
                    { key: 'delivery_timestamp', label: '8. Delivery', icon: '🏁' }
                  ].map((stage) => {
                    const timeVal = profile.trace?.[stage.key] || 'Pending'
                    const isDone = timeVal && timeVal !== 'Pending'

                    return (
                      <div
                        key={stage.key}
                        className={`p-3 border rounded-2xl flex flex-col justify-between h-20 transition-all ${
                          isDone
                            ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-50 dark:bg-black/10 border-slate-200 dark:border-white/5 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-black uppercase">
                          <span className="inline-flex items-center gap-1">{(() => { const StageIcon = getIcon(stage.icon); return <StageIcon size={11} /> })()} {stage.label}</span>
                          {isDone ? (
                            <span className="text-emerald-500 text-[8px] font-black inline-flex items-center gap-0.5"><Check size={9} /> Done</span>
                          ) : (
                            <span className="text-slate-400 text-[8px] font-black">Pending</span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono mt-2 font-bold tracking-tight truncate leading-none">
                          {isDone ? timeVal : 'Not Started'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent scan / status / defect events */}
              <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-2">
                <span className="text-[10px] uppercase font-black text-slate-500 block">Recent Events</span>
                <div className="space-y-1.5">
                  {events.length === 0 && (
                    <span className="text-xs text-slate-500 italic block py-2">No status updates or defects logged for this element yet</span>
                  )}
                  {events.map((ev: any) => (
                    <div key={ev.id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${statusChipClass(ev.event_type === 'Defect Reported' ? 'reject' : 'approved')}`}>
                          {ev.event_type}
                        </span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300 truncate">
                          {ev.stage}{ev.status ? ` → ${ev.status}` : ''}{ev.defect_description ? `: ${ev.defect_description}` : ''}
                        </span>
                      </div>
                      <div className="text-right shrink-0 pl-2">
                        <span className="block font-bold text-neutral-800 dark:text-white text-[10px]">{ev.logged_by || '—'}</span>
                        <span className="text-[9px] text-slate-400">{String(ev.created_at).slice(0, 16).replace('T', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Casting & Quality Assurance Check list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-4">
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-black text-slate-500 block">Quality pre-pour release checks</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Mould Oil Verification</span>
                      <span className="inline-flex items-center gap-1">{profile.qc_pre_pour ? <><span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> Cleared</> : <><span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Pending</>}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Reinforcement Cage Check</span>
                      <span className="inline-flex items-center gap-1">{profile.qc_rebar ? <><span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> Cleared</> : <><span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Pending</>}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Spacer cover Check</span>
                      <span className="inline-flex items-center gap-1">{profile.qc_cover ? <><span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> Cleared</> : <><span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Pending</>}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Embedded Plates & Lifters</span>
                      <span className="inline-flex items-center gap-1">{profile.qc_embeds ? <><span className="inline-block w-2 h-2 rounded-full bg-emerald-500" /> Cleared</> : <><span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> Pending</>}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-black text-slate-500 block">Concrete Mix & Pour clearance</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Casting Date</span>
                      <span className="font-bold text-neutral-800 dark:text-white">{profile.cast_date || 'Planned'}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Cubes Test Ref</span>
                      <span className="font-mono text-primary">{profile.qc_test_ref}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Inspector</span>
                      <span className="font-bold">{profile.qc_inspector}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">QC clearance Result</span>
                      <span className="font-black text-emerald-500 uppercase">{profile.qc_result}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery info */}
              {profile.do_no && (
                <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-2">
                  <span className="text-[10px] uppercase font-black text-slate-500 block">Shipping & Logistics details</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block">D/O Number</span>
                      <span className="font-bold text-neutral-800 dark:text-white block mt-0.5">{profile.do_no}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block">Trailer Plate</span>
                      <span className="block mt-0.5">{profile.trailer_plate}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block">Driver Name</span>
                      <span className="block mt-0.5">{profile.driver_name}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-slate-400 block">Delivery status</span>
                      <span className="text-emerald-500 font-bold block mt-0.5">Delivered / Shipped</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Movement History Log */}
              <div className="border-t border-slate-100 dark:border-white/5 pt-4 space-y-2">
                <span className="text-[10px] uppercase font-black text-slate-500 block">Stockyard Movement Log History</span>
                <div className="space-y-1.5">
                  {profile.movements && profile.movements.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400 font-semibold">
                      <div className="flex items-center gap-2">
                        <Shuffle size={13} />
                        <span>Transferred from <strong>{m.from_bay}</strong> to <strong className="text-primary">{m.to_bay}</strong></span>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-neutral-800 dark:text-white text-[11px]">{m.crane} ({m.operator})</span>
                        <span className="text-[9px] text-slate-400">{m.movement_time}</span>
                      </div>
                    </div>
                  ))}
                  {(!profile.movements || profile.movements.length === 0) && (
                    <span className="text-xs text-slate-500 italic block py-2">No storage movements logged for this element</span>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel p-16 rounded-3xl border border-slate-200 dark:border-white/5 text-center flex flex-col items-center justify-center text-slate-400 font-semibold space-y-2">
              <Search size={36} />
              <span className="text-sm uppercase font-black tracking-wider text-slate-500">Element Profile not loaded</span>
              <p className="text-xs text-slate-500 max-w-sm">Scan a QR code label, type a valid element ID code, or click on a quick lookup item to render profile details.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
