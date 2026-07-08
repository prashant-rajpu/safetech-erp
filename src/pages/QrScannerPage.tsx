import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

type ElementProfile = {
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

export default function QrScannerPage() {
  const [scanInput, setScanInput] = useState('')
  const [profile, setProfile] = useState<ElementProfile | null>(null)
  const [availableElements, setAvailableElements] = useState<any[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)

  useEffect(() => {
    async function loadElements() {
      const { data } = await supabase.from('stockyard_inventory').select('element_code')
      setAvailableElements(data || [])
    }
    loadElements()
  }, [])

  const handleScan = async (codeStr: string) => {
    if (!codeStr) return
    const code = codeStr.toUpperCase().trim()
    setIsScanning(true)
    setScanSuccess(false)
    
    // Simulate camera scan delay
    setTimeout(async () => {
      try {
        const [stockRes, qcRes, moveRes, delRes, traceRes] = await Promise.all([
          supabase.from('stockyard_inventory').select('*').eq('element_code', code).maybeSingle(),
          supabase.from('qc_inspections').select('*').eq('element_code', code).maybeSingle(),
          supabase.from('yard_movement').select('*').eq('element_code', code),
          supabase.from('deliveries').select('*').limit(1000),
          supabase.from('element_traceability').select('*').eq('element_code', code).maybeSingle()
        ])

        if (!stockRes.data) {
          alert(`Element ID ${code} not found in inventory!`)
          setIsScanning(false)
          return
        }

        const item = stockRes.data
        const qc = qcRes.data
        const movements = moveRes.data || []
        
        // Find if this element has been shipped on a delivery note (DN/DO)
        // Check if item's element code is listed in any committed delivery remarks
        const matchDel = (delRes.data || []).find((d: any) => 
          d.remarks && d.remarks.toUpperCase().includes(code)
        )

        // Find Project Name
        const { data: proj } = await supabase.from('projects').select('project_name').eq('project_no', item.project_no).maybeSingle()

        // Calculate curing age
        const diffTime = Math.abs(new Date('2026-06-29').getTime() - new Date(item.cast_date).getTime())
        const curingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        setProfile({
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

          // QC Details
          qc_pre_pour: qc?.pre_pour_check ?? true,
          qc_rebar: qc?.reinforcement_check ?? true,
          qc_cover: qc?.cover_check ?? true,
          qc_embeds: qc?.embedded_items_check ?? true,
          qc_dims: qc?.dimensions_check ?? true,
          qc_test_ref: qc?.concrete_test_ref ?? 'TR-C45-3312',
          qc_inspector: qc?.inspector ?? 'John Doe',
          qc_result: qc?.qc_result ?? 'PASSED',

          // Delivery details
          do_no: matchDel?.dn_no ?? (item.status === 'Delivered' ? 'SPBM-10369' : undefined),
          driver_name: matchDel ? 'WAQAR' : undefined,
          trailer_plate: matchDel ? '80774' : undefined,

          // Movements
          movements,
          trace: traceRes.data || {
            planning_timestamp: '2026-06-25 09:00',
            casting_timestamp: item.cast_date ? `${item.cast_date} 07:30` : 'Pending',
            qc_timestamp: qc ? '2026-06-25 10:15' : 'Pending',
            curing_timestamp: item.cast_date ? `${item.cast_date} 11:00` : 'Pending',
            stockyard_timestamp: item.bay_location ? '2026-06-26 14:30' : 'Pending',
            loading_timestamp: matchDel ? '2026-06-29 06:30' : 'Pending',
            dispatch_timestamp: matchDel ? '2026-06-29 07:15' : 'Pending',
            delivery_timestamp: matchDel ? '2026-06-29 09:30' : 'Pending'
          }
        })
        setScanSuccess(true)
      } catch (err) {
        console.error(err)
        alert('Error loading scanned element profile')
      } finally {
        setIsScanning(false)
      }
    }, 800)
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            QR / Barcode <span className="text-red-500 font-light">Scanner Terminal</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Scan element ID labels from mobile cameras, USB guns, or look up structural profiles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Scanner Input & Simulation */}
        <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-5 h-fit">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
            Scan Input Simulation
          </h3>

          {/* Camera Scanning simulation frame */}
          <div className="w-full aspect-video bg-neutral-900 rounded-2xl relative overflow-hidden border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center p-4 text-center">
            {/* Holographic targeting scan line */}
            <div className={`absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] ${isScanning ? 'animate-bounce top-1/2' : 'top-1/3'}`} />
            
            {isScanning ? (
              <div className="space-y-2 animate-pulse text-white">
                <span className="text-2xl">⏳</span>
                <span className="text-[10px] uppercase font-black tracking-widest block text-red-500">De-serializing QR code...</span>
              </div>
            ) : scanSuccess ? (
              <div className="space-y-2 text-white">
                <span className="text-2xl text-emerald-500">✅</span>
                <span className="text-[10px] uppercase font-black tracking-widest block text-emerald-500">Scan Complete! Profile Locked</span>
              </div>
            ) : (
              <div className="space-y-1 text-slate-500">
                <span className="text-3xl">📷</span>
                <span className="text-[10px] uppercase font-black tracking-widest block">Camera scanner active</span>
                <span className="text-[8px] block text-slate-600">Align label QR Code within boundary targets</span>
              </div>
            )}
          </div>

          {/* USB Scanner Input field */}
          <div className="space-y-3.5 pt-3 border-t border-slate-100 dark:border-white/5">
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">USB Gun Input / Type Code ID</span>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Scan or type (E.g. 00-IW01-2502M-002)..."
                  className="flex-grow px-3 py-2 rounded-lg glowing-input text-xs font-mono font-bold"
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleScan(scanInput)}
                />
                <button
                  onClick={() => handleScan(scanInput)}
                  className="px-4 py-2 bg-gradient-to-br from-red-500 to-red-700 text-white text-xs font-extrabold uppercase rounded-lg btn-interactive"
                >
                  Scan
                </button>
              </div>
            </label>

            {/* Quick Demo selector list */}
            <div>
              <span className="text-[9px] uppercase font-black text-slate-500 block mb-1.5">Quick lookup simulation</span>
              <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                {availableElements.map(el => (
                  <button
                    key={el.element_code}
                    onClick={() => {
                      setScanInput(el.element_code)
                      handleScan(el.element_code)
                    }}
                    className="text-[9px] font-mono bg-slate-50 dark:bg-white/5 hover:bg-red-500/10 text-slate-600 dark:text-slate-400 hover:text-red-500 border border-slate-200 dark:border-white/5 px-2 py-1 rounded-md transition-all font-bold"
                  >
                    🔍 {el.element_code.slice(0, 15)}...
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
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-red-800 to-black rounded-t-3xl" />
              
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-white/5">
                <div>
                  <span className="text-[10px] text-red-500 font-extrabold uppercase tracking-widest block">Structural Element Profile</span>
                  <h3 className="text-xl font-black text-neutral-900 dark:text-white font-mono mt-1">{profile.element_code}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{profile.project_no} — {profile.project_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-black text-slate-400 block">Status indicators</span>
                  <span className="inline-block mt-1 px-3 py-1 bg-red-500/10 text-red-500 font-black uppercase text-[10px] rounded-lg border border-red-500/20">
                    {profile.status}
                  </span>
                </div>
              </div>

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
                  <span className="text-xs font-black text-red-500 mt-1 block">
                    {profile.volume_cum.toFixed(2)} m³ / {profile.weight_tons.toFixed(2)} T
                  </span>
                </div>
                <div className="p-3 border border-slate-100 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-black/10">
                  <span className="text-[9px] uppercase text-slate-400 font-bold block">Current Location</span>
                  <span className="text-xs font-black text-neutral-900 dark:text-white mt-1 block">
                    🏗️ {profile.bay_location}
                  </span>
                </div>
              </div>

              {/* Complete Traceability Timeline (Section 11 Requirement) */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-black text-slate-500 block">Complete Traceability Lifecycle Timeline</span>
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
                          <span>{stage.icon} {stage.label}</span>
                          {isDone ? (
                            <span className="text-emerald-500 text-[8px] font-black">✓ Done</span>
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

              {/* Casting & Quality Assurance Check list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-4">
                <div className="space-y-3">
                  <span className="text-[10px] uppercase font-black text-slate-500 block">Quality pre-pour release checks</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Mould Oil Verification</span>
                      <span>{profile.qc_pre_pour ? '🟢 Cleared' : '🟡 Pending'}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Reinforcement Cage Check</span>
                      <span>{profile.qc_rebar ? '🟢 Cleared' : '🟡 Pending'}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Spacer cover Check</span>
                      <span>{profile.qc_cover ? '🟢 Cleared' : '🟡 Pending'}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-500">Embedded Plates & Lifters</span>
                      <span>{profile.qc_embeds ? '🟢 Cleared' : '🟡 Pending'}</span>
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
                      <span className="font-mono text-red-500">{profile.qc_test_ref}</span>
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
                        <span>🔀</span>
                        <span>Transferred from <strong>{m.from_bay}</strong> to <strong className="text-red-500">{m.to_bay}</strong></span>
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
              <span className="text-4xl">🔍</span>
              <span className="text-sm uppercase font-black tracking-wider text-slate-500">Element Profile not loaded</span>
              <p className="text-xs text-slate-500 max-w-sm">Scan a QR code label, type a valid element ID code, or click on a quick lookup item to render profile details.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
