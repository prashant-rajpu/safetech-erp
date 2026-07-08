import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

type DNItem = {
  sNo: number
  elementCode: string
  buildingType: string
  villaNo: string
  volume: number | ''
  weight: number | ''
  qty: number | ''
}

type TrailerRow = {
  id: string
  plate_no: string
  supplier: string
  type: string
}

type DriverRow = { name: string; mobile: string; assigned_plate: string }

const DEMO_ITEMS: DNItem[] = [
  { sNo: 1, elementCode: '00-IW01-2502M-002', buildingType: 'Type B-3RM', villaNo: 'Type B-3RM-002', volume: 3.22, weight: 8.04, qty: 1 },
  { sNo: 2, elementCode: '00-IW01-2504M-002', buildingType: 'Type B-3RM', villaNo: 'Type B-3RM-002', volume: 3.28, weight: 8.19, qty: 1 },
  { sNo: 3, elementCode: '00-IW01-2505M-002', buildingType: 'Type B-3RM', villaNo: 'Type B-3RM-002', volume: 1.82, weight: 4.54, qty: 1 },
  { sNo: 4, elementCode: '00-IW05-2503M-002', buildingType: 'Type B-3RM', villaNo: 'Type B-3RM-002', volume: 3.11, weight: 7.76, qty: 1 },
  { sNo: 5, elementCode: '00-PC01-2540M-002', buildingType: 'Type B-3RM', villaNo: 'Type B-3RM-002', volume: 0.40, weight: 0.99, qty: 1 },
  { sNo: 6, elementCode: '00-PC01-2541M-002', buildingType: 'Type B-3RM', villaNo: 'Type B-3RM-002', volume: 0.40, weight: 0.99, qty: 1 },
  { sNo: 7, elementCode: '00-PC02-2542M-013', buildingType: 'Type B-3RM', villaNo: 'Type B-3RM-013', volume: 0.23, weight: 0.59, qty: 1 },
]

export default function DeliveryNotePage() {
  // Metadata States
  const [doNo, setDoNo] = useState('SP2544P00002')
  const [date, setDate] = useState('2026-06-29')
  const [projectNo, setProjectNo] = useState('SP2544P')
  const [station, setStation] = useState('81 - PRECAST')
  const [projectName, setProjectName] = useState('THE ACRES - PHASE 1')
  const [location, setLocation] = useState('DUBAI LAND')
  const [requesting, setRequesting] = useState('')
  const [mobile, setMobile] = useState('')
  const [driverName, setDriverName] = useState('WAQAR')
  const [driverMobile, setDriverMobile] = useState('')
  const [trailerHead, setTrailerHead] = useState('80774')
  const [trailerTail, setTrailerTail] = useState('80774')
  const [trailerType, setTrailerType] = useState('Trailer - A-Frame')
  const [foreman, setForeman] = useState('PRASHANT MANO')
  const [qcInspector, setQcInspector] = useState('')
  const [dnGeneratedBy, setDnGeneratedBy] = useState('PRASHANT MANO')
  const [dnType, setDnType] = useState('Ex Factory - Transporter: HIL TRANSPORT')
  const [securityName, setSecurityName] = useState('')
  const [securityDateTime, setSecurityDateTime] = useState('')
  const [remarks, setRemarks] = useState('')

  const formattedDate = useMemo(() => {
    if (!date || date.includes('_')) return date
    const parts = date.split('-')
    if (parts.length !== 3) return date
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
    const day = parseInt(parts[2], 10)
    const monthIdx = parseInt(parts[1], 10) - 1
    const year = parts[0]
    return `${day} - ${months[monthIdx] || 'JUNE'} - ${year}`
  }, [date])

  // Table Items State
  const [items, setItems] = useState<DNItem[]>(DEMO_ITEMS)

  // Master Trailers list for searchable select
  const [trailers, setTrailers] = useState<TrailerRow[]>([])
  const [driversList, setDriversList] = useState<DriverRow[]>([])
  const [trailerSearch, setTrailerSearch] = useState('')
  const [showTrailerDropdown, setShowTrailerDropdown] = useState(false)

  // System Save Status
  const [saving, setSaving] = useState(false)

  // Fetch trailers + drivers on mount (driver assignment lives on the Drivers master)
  useEffect(() => {
    async function loadTrailers() {
      const [{ data }, { data: drv }] = await Promise.all([
        supabase.from('trailers').select('*').limit(200),
        supabase.from('drivers').select('*').limit(200)
      ])
      if (data) setTrailers(data as TrailerRow[])
      if (drv) setDriversList(drv as DriverRow[])
    }
    loadTrailers()
  }, [])

  // Filter trailers list dynamically by search query
  const filteredTrailers = useMemo(() => {
    if (!trailerSearch) return trailers
    const q = trailerSearch.toLowerCase()
    return trailers.filter(t => 
      t.plate_no.toLowerCase().includes(q) ||
      t.supplier.toLowerCase().includes(q)
    )
  }, [trailers, trailerSearch])

  // Chunking items into subsets of exactly 20
  const chunks = useMemo(() => {
    const res: DNItem[][] = []
    const itemsPerPage = 20
    for (let i = 0; i < items.length; i += itemsPerPage) {
      res.push(items.slice(i, i + itemsPerPage))
    }
    if (res.length === 0) {
      res.push([])
    }
    return res
  }, [items])

  // Grand totals calculations
  const grandTotals = useMemo(() => {
    let vol = 0
    let wt = 0
    let q = 0
    items.forEach(i => {
      if (typeof i.volume === 'number') vol += i.volume
      if (typeof i.weight === 'number') wt += i.weight
      if (typeof i.qty === 'number') q += i.qty
    })
    return {
      volume: Number(vol.toFixed(2)),
      weight: Number(wt.toFixed(2)),
      qty: q
    }
  }, [items])

  // Clear data to empty template (blank placeholders)
  const handleClearTemplate = () => {
    setDoNo('____________________')
    setDate('____________________')
    setProjectNo('____________________')
    setStation('____________________')
    setProjectName('____________________')
    setLocation('____________________')
    setRequesting('____________________')
    setMobile('____________________')
    setDriverName('____________________')
    setDriverMobile('____________________')
    setTrailerHead('____________________')
    setTrailerTail('____________________')
    setTrailerType('____________________')
    setForeman('____________________')
    setQcInspector('____________________')
    setDnGeneratedBy('____________________')
    setDnType('____________________')
    setSecurityName('____________________')
    setSecurityDateTime('____________________')
    setRemarks('')

    // Seed 20 empty rows (exactly 1 page)
    const emptyRows: DNItem[] = Array.from({ length: 20 }, (_, i) => ({
      sNo: i + 1,
      elementCode: '',
      buildingType: '',
      villaNo: '',
      volume: '',
      weight: '',
      qty: ''
    }))
    setItems(emptyRows)
  }

  // Reset to original demo log sample
  const handleResetDemo = () => {
    setDoNo('SP2544P00002')
    setDate('2026-06-29')
    setProjectNo('SP2544P')
    setStation('81 - PRECAST')
    setProjectName('THE ACRES - PHASE 1')
    setLocation('DUBAI LAND')
    setRequesting('')
    setMobile('')
    setDriverName('WAQAR')
    setDriverMobile('')
    setTrailerHead('80774')
    setTrailerTail('80774')
    setTrailerType('Trailer - A-Frame')
    setForeman('PRASHANT MANO')
    setQcInspector('')
    setDnGeneratedBy('PRASHANT MANO')
    setDnType('Ex Factory - Transporter: HIL TRANSPORT')
    setSecurityName('')
    setSecurityDateTime('')
    setRemarks('')
    setItems(DEMO_ITEMS)
  }

  // Add empty row to form list
  const addRow = () => {
    setItems(prev => [
      ...prev,
      {
        sNo: prev.length + 1,
        elementCode: '',
        buildingType: '',
        villaNo: '',
        volume: '',
        weight: '',
        qty: 1
      }
    ])
  }

  // Handle cell edit
  const handleItemChange = (index: number, field: keyof DNItem, val: any) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item
      let parsed = val
      if (field === 'volume' || field === 'weight') {
        parsed = val === '' ? '' : parseFloat(val)
      } else if (field === 'qty') {
        parsed = val === '' ? '' : parseInt(val, 10)
      }
      return { ...item, [field]: parsed }
    }))
  }

  // Save the filled data as deliveries back to the database, and link dispatch logs
  const handleSaveToLogs = async () => {
    setSaving(true)
    try {
      const validItems = items.filter(i => i.elementCode && i.qty)
      if (validItems.length === 0) {
        alert('Please add at least one precast element with code and quantity!')
        setSaving(false)
        return
      }

      // Find trailer ID by head number if possible, or leave null
      const t = await supabase.from('trailers').select('id, supplier').eq('plate_no', trailerHead).maybeSingle()
      const trailer_id = t.data?.id ?? null

      // Determine combined element type
      const hasHcs = validItems.some(item => (item.buildingType || '').toUpperCase().includes('HCS') || (item.elementCode || '').toUpperCase().includes('HCS'))
      const elementType = hasHcs ? 'HCS' : 'WL/PC'

      // Combine element codes for remarks
      const codes = validItems.map(item => item.elementCode).join(', ')
      const combinedRemarks = `Codes: [${codes}] | Foreman: ${foreman}`

      await supabase.from('deliveries').insert([{
        project_no: projectNo.includes('___') ? 'SP2544P' : projectNo,
        project_name: projectName.includes('___') ? 'THE ACRES - PHASE 1' : projectName,
        location: location.includes('___') ? 'DUBAI LAND' : location,
        trailer_id,
        element_type: elementType,
        element_count: grandTotals.qty,
        dn_no: doNo.includes('___') ? 'SP2544P-TEMP' : doNo,
        volume_cum: grandTotals.volume,
        weight_tons: grandTotals.weight,
        remarks: remarks || '',
        delivery_date: date,
        delivery_timestamp: `${date}T10:00:00+04:00`
      }])

      // --- AUTO-DISPATCH ELEMENTS FROM STOCKYARD INVENTORY ---
      for (const item of validItems) {
        const code = (item.elementCode || '').toUpperCase().trim()
        const localKey = 'mock_db_stockyard_inventory'
        const localData = localStorage.getItem(localKey)
        if (localData) {
          try {
            const stockItems = JSON.parse(localData)
            const matchIndex = stockItems.findIndex((s: any) => s.element_code === code)
            if (matchIndex !== -1) {
              stockItems[matchIndex].status = 'DISPATCHED'
              stockItems[matchIndex].remarks = `Shipped on DN: ${doNo.includes('___') ? 'SP2544P-TEMP' : doNo}`
              localStorage.setItem(localKey, JSON.stringify(stockItems))
            }
          } catch (err) {
            console.error('Error auto-dispatching stockyard item:', err)
          }
        }

        // Update traceability timestamps
        const traceKey = 'mock_db_element_traceability'
        const traceData = localStorage.getItem(traceKey)
        if (traceData) {
          try {
            const traces = JSON.parse(traceData)
            const matchIdx = traces.findIndex((t: any) => t.element_code === code)
            const currentTimestamp = `${date} 10:00`
            if (matchIdx !== -1) {
              traces[matchIdx].loading_timestamp = `${date} 06:30`
              traces[matchIdx].dispatch_timestamp = `${date} 07:15`
              traces[matchIdx].delivery_timestamp = currentTimestamp
              localStorage.setItem(traceKey, JSON.stringify(traces))
            }
          } catch (err) {
            console.error('Error updating traceability:', err)
          }
        }
      }

      // --- EXCHANGING WITH TRAILER DISPATCH LOG & FLEET STATUS ---
      // Look up and update matching row in dispatch_log for this trailer plate
      // CRITICAL: DOES NOT touch diesel_status, driver_status, or leaving_status!
      const { data: dispatchRows } = await supabase.from('dispatch_log').select('*').eq('plate_no', trailerHead).limit(1)
      if (dispatchRows && dispatchRows.length > 0) {
        const row = dispatchRows[0]
        await supabase.from('dispatch_log').update({
          project_no: projectNo,
          do_no: doNo,
          remarks: `Loaded via Delivery Note on ${new Date().toLocaleDateString('en-GB')}`
        }).eq('id', row.id)
      }

      // Sync loading state to fleet status
      if (trailer_id) {
        const { data: fsData } = await supabase.from('fleet_status').select('id').eq('trailer_id', trailer_id).maybeSingle()
        const fsPayload = {
          trailer_id,
          status_text: 'UNDER LOADING AT SY',
          site_location: 'Precast Yard SY',
          driver_name: driverName.includes('___') ? 'WAQAR' : driverName,
          status_timestamp: new Date().toISOString()
        }

        if (fsData?.id) {
          await supabase.from('fleet_status').update(fsPayload).eq('id', fsData.id)
        } else {
          await supabase.from('fleet_status').insert([fsPayload])
        }
      }

      alert('Delivery note entries successfully committed to logistics database, and dispatch logs linked!');
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Page Title Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/5 no-print">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white uppercase">
            Delivery Note <span className="text-red-500 font-light">Generator</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Design, edit, print, or download official Safetech delivery templates</p>
        </div>
        <div className="flex gap-2 mt-3 md:mt-0">
          <button 
            onClick={handleClearTemplate}
            className="text-xs bg-slate-900 border border-white/5 hover:border-red-500/20 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl btn-interactive transition-all"
          >
            Clear Data (Blank Template)
          </button>
          <button 
            onClick={handleResetDemo}
            className="text-xs bg-slate-900 border border-white/5 hover:border-red-500/20 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl btn-interactive transition-all"
          >
            Reset to Sample
          </button>
          <button 
            onClick={() => window.print()}
            className="text-xs bg-gradient-to-br from-red-500 to-red-700 text-white font-extrabold uppercase px-5 py-2.5 rounded-xl btn-interactive shadow-lg shadow-red-500/25 transition-all"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        {/* LEFT COLUMN: Data Form (Inputs) */}
        <div className="xl:col-span-2 space-y-4 no-print">
          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-xl space-y-4">
            <div className="text-xs uppercase tracking-widest font-extrabold text-slate-400 pb-2 border-b border-white/5">
              Document Metadata
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] uppercase font-bold text-slate-500">D/O. Number</span>
                <input className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={doNo} onChange={e=>setDoNo(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase font-bold text-slate-500">Date</span>
                <input type="date" className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={date} onChange={e=>setDate(e.target.value)} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] uppercase font-bold text-slate-500">Project No.</span>
                <input className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={projectNo} onChange={e=>setProjectNo(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase font-bold text-slate-500">Station</span>
                <input className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={station} onChange={e=>setStation(e.target.value)} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] uppercase font-bold text-slate-500">Project Name</span>
                <input className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={projectName} onChange={e=>setProjectName(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase font-bold text-slate-500">Location</span>
                <input className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={location} onChange={e=>setLocation(e.target.value)} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] uppercase font-bold text-slate-500">Requesting</span>
                <input className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" placeholder="Requesting contact" value={requesting} onChange={e=>setRequesting(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase font-bold text-slate-500">Mobile</span>
                <input className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" placeholder="Contact phone" value={mobile} onChange={e=>setMobile(e.target.value)} />
              </label>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-xl space-y-4">
            <div className="text-xs uppercase tracking-widest font-extrabold text-slate-400 pb-2 border-b border-white/5">
              Transport Logistics
            </div>

            {/* Searchable Select Combobox for Active Trailers */}
            <div className="relative">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Search & Select Trailer (Link Dispatch Log)</span>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg glowing-input text-xs"
                placeholder={trailerHead ? `Plate: ${trailerHead} - Selected` : "Type plate number / subcontractor name..."}
                value={trailerSearch}
                onFocus={() => setShowTrailerDropdown(true)}
                onChange={e => {
                  setTrailerSearch(e.target.value)
                  setShowTrailerDropdown(true)
                }}
              />
              {trailerHead && !trailerHead.includes('_') && (
                <button
                  type="button"
                  onClick={() => {
                    setTrailerHead('')
                    setTrailerTail('')
                    setTrailerType('')
                    setTrailerSearch('')
                    setDnType('Ex Factory - Transporter')
                  }}
                  className="absolute right-3 top-6 text-xs text-red-500 hover:text-red-400 font-extrabold"
                >
                  Clear
                </button>
              )}

              {showTrailerDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-white/5">
                  {filteredTrailers.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 text-center">No matching plate numbers</div>
                  ) : (
                    filteredTrailers.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setTrailerHead(t.plate_no)
                          setTrailerTail(t.plate_no)
                          setTrailerType(t.type)
                          setTrailerSearch(`${t.plate_no} - ${t.supplier}`)
                          setDnType(`Ex Factory - Transporter: ${t.supplier}`)
                          const drv = driversList.find(d => d.assigned_plate === t.plate_no)
                          setDriverName(drv?.name || 'WAQAR')
                          setDriverMobile(drv?.mobile || '')
                          setShowTrailerDropdown(false)
                        }}
                        className="p-2.5 text-xs text-slate-300 hover:bg-red-500/10 hover:text-white cursor-pointer transition-colors duration-150 flex flex-col gap-0.5"
                      >
                        <span className="font-extrabold text-red-400">{t.plate_no}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{t.supplier} ({t.type})</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] uppercase font-bold text-slate-500">Driver Name</span>
                <input className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={driverName} onChange={e=>setDriverName(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase font-bold text-slate-500">Driver Mobile</span>
                <input className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" placeholder="Driver phone number" value={driverMobile} onChange={e=>setDriverMobile(e.target.value)} />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="text-[9px] uppercase font-bold text-slate-500">Head No.</span>
                <input className="w-full mt-1 px-2 py-2 rounded-lg glowing-input text-xs" value={trailerHead} onChange={e=>setTrailerHead(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase font-bold text-slate-500">Tail No.</span>
                <input className="w-full mt-1 px-2 py-2 rounded-lg glowing-input text-xs" value={trailerTail} onChange={e=>setTrailerTail(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[9px] uppercase font-bold text-slate-500">Trailer Type</span>
                <input className="w-full mt-1 px-2 py-2 rounded-lg glowing-input text-xs" placeholder="Flat / Low" value={trailerType} onChange={e=>setTrailerType(e.target.value)} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] uppercase font-bold text-slate-500">Foreman</span>
                <input className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={foreman} onChange={e=>setForeman(e.target.value)} />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase font-bold text-slate-500">QC Inspector</span>
                <input className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" placeholder="Inspector Name" value={qcInspector} onChange={e=>setQcInspector(e.target.value)} />
              </label>
            </div>
            <label className="block mt-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Remarks</span>
              <input className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" placeholder="E.g. Loaded via crane #2" value={remarks} onChange={e=>setRemarks(e.target.value)} />
            </label>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 shadow-xl space-y-3">
            <div className="text-xs uppercase tracking-widest font-extrabold text-slate-400 pb-2 border-b border-white/5 flex items-center justify-between">
              <span>Elements List ({items.length} Elements)</span>
              <button 
                type="button" 
                onClick={addRow}
                className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 px-2 py-1 rounded-md tracking-wider uppercase font-bold transition-all"
              >
                + Add Row
              </button>
            </div>
            
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="bg-slate-950/50 p-2.5 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>ELEMENT #{idx + 1}</span>
                    <button 
                      type="button" 
                      onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                  <input 
                    className="w-full px-2 py-1 text-xs glowing-input rounded" 
                    placeholder="Element ID Code" 
                    value={item.elementCode} 
                    onChange={e=>handleItemChange(idx, 'elementCode', e.target.value)} 
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input className="w-full px-2 py-1 text-xs glowing-input rounded" placeholder="Building Type" value={item.buildingType} onChange={e=>handleItemChange(idx, 'buildingType', e.target.value)} />
                    <input className="w-full px-2 py-1 text-xs glowing-input rounded" placeholder="Villa No." value={item.villaNo} onChange={e=>handleItemChange(idx, 'villaNo', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input className="w-full px-2 py-1 text-[11px] glowing-input rounded" type="number" step="0.01" placeholder="Vol (m³)" value={item.volume} onChange={e=>handleItemChange(idx, 'volume', e.target.value)} />
                    <input className="w-full px-2 py-1 text-[11px] glowing-input rounded" type="number" step="0.01" placeholder="Wt (Ton)" value={item.weight} onChange={e=>handleItemChange(idx, 'weight', e.target.value)} />
                    <input className="w-full px-2 py-1 text-[11px] glowing-input rounded" type="number" placeholder="Qty" value={item.qty} onChange={e=>handleItemChange(idx, 'qty', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleSaveToLogs}
              disabled={saving}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-red-500/20 text-red-400 font-extrabold uppercase py-3 rounded-xl tracking-wider text-xs btn-interactive"
            >
              {saving ? 'Saving Entries…' : 'Commit Deliveries to DB'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Realistic Live Paper Print Preview (Paginating every 20 items, perfectly balanced A4 page layout) */}
        <div className="xl:col-span-3 flex flex-col items-center gap-6 print-area">
          {chunks.map((chunk, pageIdx) => {
            // Compute Page Subtotals
            let pageVolume = 0
            let pageWeight = 0
            let pageQty = 0

            chunk.forEach(item => {
              if (typeof item.volume === 'number') pageVolume += item.volume
              if (typeof item.weight === 'number') pageWeight += item.weight
              if (typeof item.qty === 'number') pageQty += item.qty
            })

            const isLastPage = pageIdx === chunks.length - 1

            return (
              <div 
                key={pageIdx} 
                className="w-[210mm] min-h-[297mm] bg-white text-black p-6 font-sans border border-neutral-300 shadow-2xl relative flex flex-col justify-between text-xs leading-normal page-break mb-8 print:mb-0 print:border-none print:shadow-none overflow-hidden"
              >
                {/* Header Block */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center border-b border-black pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-black p-1 bg-black shrink-0 flex items-center justify-center">
                        <img src="/safetech_logo.png" alt="Logo" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="font-extrabold text-[12.5px] tracking-tight">SAFETECH PRECAST BUILDING MANUFACTURING LLC</span>
                        <span className="text-[8.5px] text-neutral-600 font-semibold">National Industrial Park, Dubai - UAE | PO Box: 18337 - Jebel Ali</span>
                        <span className="text-[8.5px] text-neutral-600 font-semibold">Tel: 04-8813195 Fax: 04-2829929 Email: info@safe-tech.ae</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-xs tracking-widest border border-black px-4 py-1 bg-neutral-100">
                        DELIVERY NOTE
                      </div>
                    </div>
                  </div>

                  {/* Metadata Grid Table - Spacious and clean */}
                  <div className="grid grid-cols-2 border border-black divide-x divide-black text-[10px]">
                    <div className="divide-y divide-black">
                      <div className="p-2 flex justify-between">
                        <span className="font-extrabold">D/O. No:</span>
                        <span className="font-semibold">{doNo || '____________________'}</span>
                      </div>
                      <div className="p-2 flex justify-between">
                        <span className="font-extrabold">Job / Project No.:</span>
                        <span className="font-semibold">{projectNo || '____________________'}</span>
                      </div>
                      <div className="p-2 flex justify-between">
                        <span className="font-extrabold">Project Name:</span>
                        <span className="font-semibold uppercase truncate max-w-[170px]">{projectName || '____________________'}</span>
                      </div>
                      <div className="p-2 flex justify-between">
                        <span className="font-extrabold">Requesting:</span>
                        <span className="font-semibold">{requesting || '____________________'}</span>
                      </div>
                    </div>
                    <div className="divide-y divide-black">
                      <div className="p-2 flex justify-between">
                        <span className="font-extrabold">Date:</span>
                        <span className="font-semibold">{formattedDate || '____________________'}</span>
                      </div>
                      <div className="p-2 flex justify-between">
                        <span className="font-extrabold">Station:</span>
                        <span className="font-semibold uppercase">{station || '____________________'}</span>
                      </div>
                      <div className="p-2 flex justify-between">
                        <span className="font-extrabold">Location:</span>
                        <span className="font-semibold uppercase">{location || '____________________'}</span>
                      </div>
                      <div className="p-2 flex justify-between">
                        <span className="font-extrabold">Mobile:</span>
                        <span className="font-semibold">{mobile || '____________________'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Elements Table - Capped at exactly 20 items. Spacious 22px rows and 9.5px readable text */}
                <div className="my-4 flex-grow">
                  <table className="w-full border-collapse border border-black text-[9.5px]">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-black text-center font-extrabold text-[9.5px]">
                        <th className="border-r border-black p-1.5 w-[6%]">S/No</th>
                        <th className="border-r border-black p-1.5 w-[35%]">Element ID / Code</th>
                        <th className="border-r border-black p-1.5 w-[22%]">Building Type</th>
                        <th className="border-r border-black p-1.5 w-[20%]">Villa No.</th>
                        <th className="border-r border-black p-1.5 w-[8%]">Volume</th>
                        <th className="border-r border-black p-1.5 w-[9%]">Weight (T)</th>
                        <th className="p-1.5 w-[5%]">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Render exactly 20 rows */}
                      {Array.from({ length: 20 }).map((_, idx) => {
                        const item = chunk[idx]
                        const globalSNo = pageIdx * 20 + idx + 1
                        
                        return (
                          <tr key={idx} className="border-b border-black last:border-b-2 text-center h-[22px]">
                            <td className="border-r border-black p-1 font-bold">{globalSNo}</td>
                            <td className="border-r border-black p-1 text-left font-mono font-medium truncate max-w-[190px]">{item?.elementCode || ''}</td>
                            <td className="border-r border-black p-1 text-left truncate max-w-[120px]">{item?.buildingType || ''}</td>
                            <td className="border-r border-black p-1 text-left truncate max-w-[110px]">{item?.villaNo || ''}</td>
                            <td className="border-r border-black p-1 font-semibold">{item?.volume || ''}</td>
                            <td className="border-r border-black p-1 font-semibold">{item?.weight || ''}</td>
                            <td className="p-1 font-extrabold">{item?.qty || ''}</td>
                          </tr>
                        )
                      })}
                      
                      {/* Total / Subtotal Row */}
                      {isLastPage ? (
                        <tr className="bg-neutral-50 font-extrabold border-t border-black text-center text-[10px] h-[26px]">
                          <td className="border-r border-black p-1.5 text-red-600 uppercase" colSpan={4}>GRAND TOTAL:</td>
                          <td className="border-r border-black p-1.5 text-red-600">{grandTotals.volume > 0 ? grandTotals.volume : ''}</td>
                          <td className="border-r border-black p-1.5 text-red-600">{grandTotals.weight > 0 ? grandTotals.weight : ''}</td>
                          <td className="p-1.5 text-red-600">{grandTotals.qty > 0 ? grandTotals.qty : ''}</td>
                        </tr>
                      ) : (
                        <tr className="bg-neutral-50 font-extrabold border-t border-black text-center text-[10px] h-[26px]">
                          <td className="border-r border-black p-1.5 uppercase" colSpan={4}>PAGE SUBTOTAL (Carried Forward):</td>
                          <td className="border-r border-black p-1.5">{pageVolume > 0 ? Number(pageVolume.toFixed(2)) : ''}</td>
                          <td className="border-r border-black p-1.5">{pageWeight > 0 ? Number(pageWeight.toFixed(2)) : ''}</td>
                          <td className="p-1.5">{pageQty > 0 ? pageQty : ''}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Logistics, Driver details, and Signatures Row */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 border border-black divide-x divide-black p-2.5 bg-neutral-50/50 text-[10px] space-y-0">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-extrabold">Driver's Name:</span>
                        <span className="font-semibold">{driverName || '____________________'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-extrabold">Driver Mobile:</span>
                        <span className="font-semibold">{driverMobile || '____________________'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-extrabold">Type Trailer:</span>
                        <span className="font-semibold">{trailerType || '____________________'}</span>
                      </div>
                    </div>
                    <div className="pl-3 space-y-1">
                      <div className="flex justify-between">
                        <span className="font-extrabold">Trailer Head No:</span>
                        <span className="font-semibold">{trailerHead || '____________________'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-extrabold">Trailer Tail No:</span>
                        <span className="font-semibold">{trailerTail || '____________________'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Signatures Row */}
                  <div className="grid grid-cols-5 gap-2 border-t border-black pt-3 text-center text-[9px] font-bold">
                    <div className="space-y-5">
                      <span>QC Inspector</span>
                      <div className="border-t border-dashed border-black/40 pt-1 text-[8px] font-normal">Signature / Date</div>
                    </div>
                    <div className="space-y-5">
                      <span>Foreman</span>
                      <div className="font-semibold text-neutral-800 text-[10px] truncate max-w-[70px]">{foreman}</div>
                      <div className="border-t border-dashed border-black/40 pt-1 text-[8px] font-normal">Signature / Date</div>
                    </div>
                    <div className="space-y-5">
                      <span>Safety Officer</span>
                      <div className="border-t border-dashed border-black/40 pt-1 text-[8px] font-normal">Signature / Date</div>
                    </div>
                    <div className="space-y-5">
                      <span>Logistics Incharge</span>
                      <div className="border-t border-dashed border-black/40 pt-1 text-[8px] font-normal">Signature / Date</div>
                    </div>
                    <div className="space-y-5">
                      <span>D/N Generated By</span>
                      <div className="font-semibold text-neutral-800 text-[10px] truncate max-w-[70px]">{dnGeneratedBy}</div>
                      <div className="border-t border-dashed border-black/40 pt-1 text-[8px] font-normal">Signature / Date</div>
                    </div>
                  </div>

                  {/* Security Checked block - 38px height */}
                  <div className="grid grid-cols-3 border border-black divide-x divide-black text-[9.5px] text-center bg-neutral-50/50">
                    <div className="p-1 flex flex-col justify-between h-[38px]">
                      <span className="font-extrabold uppercase text-[8px]">DN Type</span>
                      <span className="font-semibold text-red-600">{dnType || '____________________'}</span>
                    </div>
                    <div className="p-1 flex flex-col justify-between h-[38px]">
                      <span className="font-extrabold uppercase text-[8px]">Security Checker</span>
                      <span className="font-semibold">{securityName || '____________________'}</span>
                    </div>
                    <div className="p-1 flex flex-col justify-between h-[38px]">
                      <span className="font-extrabold uppercase text-[8px]">Security Checked Date / Time</span>
                      <span className="font-semibold">{securityDateTime || '____________________'}</span>
                    </div>
                  </div>

                  {/* Site Delivery & Receipt Verification (Mandatory Logistics Enhancement) */}
                  <div className="grid grid-cols-4 border border-black divide-x divide-black text-[9.5px] bg-neutral-50/50">
                    <div className="p-1.5 flex flex-col justify-between h-[52px]">
                      <span className="font-extrabold uppercase text-[7.5px] block font-black">Driver Signature</span>
                      <div className="border-t border-dashed border-black/40 pt-1 text-[7.5px] font-normal text-center mt-auto">Acknowledged by Driver</div>
                    </div>
                    <div className="p-1.5 flex flex-col justify-between h-[52px]">
                      <span className="font-extrabold uppercase text-[7.5px] block font-black">Customer Signature & Stamp</span>
                      <div className="border-t border-dashed border-black/40 pt-1 text-[7.5px] font-normal text-center mt-auto">Site Representative</div>
                    </div>
                    <div className="p-1.5 flex flex-col justify-between h-[52px] col-span-2">
                      <span className="font-extrabold uppercase text-[7.5px] block font-black">Delivery Photos & Remarks</span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-12 h-7 border border-neutral-300 rounded flex items-center justify-center text-[7px] text-neutral-400 font-bold bg-white leading-none">Photo 1</div>
                        <div className="w-12 h-7 border border-neutral-300 rounded flex items-center justify-center text-[7px] text-neutral-400 font-bold bg-white leading-none">Photo 2</div>
                        <span className="text-[8px] text-neutral-500 italic max-w-[120px] truncate leading-tight">Remarks: {remarks || 'None'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Watermark Stamps / Footer */}
                  <div className="flex justify-between items-center text-[8.5px] text-neutral-500 border-t border-neutral-200 pt-2">
                    <span>System Generated Document</span>
                    <span className="font-bold text-red-600 uppercase tracking-widest border border-red-500/25 px-2 py-0.5 rounded text-[8px]">
                      SECURITY APPROVED
                    </span>
                    <span>Page {pageIdx + 1} of {chunks.length}</span>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
