import React, { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'
import { supabase } from '../lib/supabaseClient'
import Typeahead from '../components/Typeahead'

type TrailerRow = {
  id: string
  plate_no: string
  supplier: string
  type: string
}

// Driver identity comes from the Drivers master (assigned_plate linkage);
// dispatch_log keeps its own point-in-time driver columns as the gate record.
type DriverRow = { name: string; mobile: string; assigned_plate: string }

type DispatchLogRow = {
  id: string
  trailer_id: string
  plate_no: string
  supplier_name: string
  trailer_type: string
  driver_name: string
  driver_mobile: string
  project_no: string
  do_no: string
  shift: 'Day' | 'Night'
  diesel_status: boolean
  driver_status: boolean
  dn_status: boolean
  leaving_status: boolean // true = Exited, false = At Yard
  remarks: string
  log_date: string
}

export default function DispatchForm() {
  const [mode, setMode] = useState<'dropdown' | 'csv'>('dropdown')
  const [trailers, setTrailers] = useState<TrailerRow[]>([])
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [logs, setLogs] = useState<DispatchLogRow[]>([])
  const [loading, setLoading] = useState(true)

  // Searchable Trailer Dropdown State
  const [trailerSearch, setTrailerSearch] = useState('')
  const [showTrailerDropdown, setShowTrailerDropdown] = useState(false)
  const [selectedTrailerId, setSelectedTrailerId] = useState('')

  // One-by-one dropdown form state
  const [driverName, setDriverName] = useState('')
  const [driverMobile, setDriverMobile] = useState('')
  const [projectNo, setProjectNo] = useState('')
  const [doNo, setDoNo] = useState('')
  const [shift, setShift] = useState<'Day' | 'Night'>('Day')
  const [diesel, setDiesel] = useState(false)
  const [driverStatus, setDriverStatus] = useState(false)
  const [dnStatus, setDnStatus] = useState(false)
  const [leavingStatus, setLeavingStatus] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [updating, setUpdating] = useState(false)

  // CSV Import State
  const [csvStatus, setCsvStatus] = useState<'idle' | 'parsing' | 'saving' | 'done' | 'error'>('idle')
  const [csvFileName, setCsvFileName] = useState('')
  const [csvCount, setCsvCount] = useState(0)

  // Search filter for grid
  const [searchQuery, setSearchQuery] = useState('')

  // Load master trailers list and active logs
  async function loadData() {
    setLoading(true)
    const { data: trData } = await supabase.from('trailers').select('*').limit(200)
    const { data: logData } = await supabase.from('dispatch_log').select('*').limit(200)
    const { data: drData } = await supabase.from('drivers').select('*').limit(200)

    const trList = (trData || []) as TrailerRow[]
    const drList = (drData || []) as DriverRow[]
    const driverFor = (plate: string) => drList.find(d => d.assigned_plate === plate)
    setDrivers(drList)
    let activeLogs = (logData || []) as DispatchLogRow[]

    // Auto-seed dispatch logs with the trailers from master list if empty
    if (activeLogs.length === 0 && trList.length > 0) {
      const initialLogs: Partial<DispatchLogRow>[] = trList.map(t => ({
        trailer_id: t.id,
        plate_no: t.plate_no,
        supplier_name: t.supplier,
        trailer_type: t.type,
        driver_name: driverFor(t.plate_no)?.name || '',
        driver_mobile: driverFor(t.plate_no)?.mobile || '',
        project_no: '',
        do_no: '',
        shift: 'Day',
        diesel_status: false,
        driver_status: false,
        dn_status: false,
        leaving_status: false,
        remarks: '',
        log_date: new Date().toISOString().slice(0, 10)
      }))
      
      const { data: seededData } = await supabase.from('dispatch_log').insert(initialLogs).select('*')
      if (seededData) {
        activeLogs = seededData as DispatchLogRow[]
      }
    } else if (activeLogs.length > 0 && trList.length > 0) {
      // Self-healing migration check: Auto-populate driver names & mobiles for existing logs
      let logsNeedUpdate = false
      const updatedActiveLogs = activeLogs.map(l => {
        if (!l.driver_name || !l.driver_mobile) {
          const drv = driverFor(l.plate_no)
          if (drv) {
            logsNeedUpdate = true
            return {
              ...l,
              driver_name: l.driver_name || drv.name || '',
              driver_mobile: l.driver_mobile || drv.mobile || ''
            }
          }
        }
        return l
      })

      if (logsNeedUpdate) {
        localStorage.setItem('mock_db_dispatch_log', JSON.stringify(updatedActiveLogs))
        activeLogs = updatedActiveLogs
      }
    }

    setTrailers(trList)
    setLogs(activeLogs)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Find info of currently selected trailer in dropdown form
  const selectedTrailer = useMemo(() => {
    return trailers.find(t => t.id === selectedTrailerId)
  }, [selectedTrailerId, trailers])

  // Filter trailers list for the searchable dropdown select
  const filteredTrailersForSelect = useMemo(() => {
    if (!trailerSearch || selectedTrailerId) return trailers
    const q = trailerSearch.toLowerCase()
    return trailers.filter(t => 
      t.plate_no.toLowerCase().includes(q) ||
      t.supplier.toLowerCase().includes(q) ||
      (drivers.find(d => d.assigned_plate === t.plate_no)?.name || '').toLowerCase().includes(q)
    )
  }, [trailers, drivers, trailerSearch, selectedTrailerId])

  // Real-time metrics calculations
  const summary = useMemo(() => {
    let total = logs.length
    let exited = 0
    let atYard = 0
    let dieselProvided = 0
    let driverOK = 0
    let dnPrinted = 0
    let nightShift = 0

    logs.forEach(l => {
      if (l.leaving_status) exited++
      else atYard++
      if (l.diesel_status) dieselProvided++
      if (l.driver_status) driverOK++
      if (l.dn_status) dnPrinted++
      if (l.shift === 'Night') nightShift++
    })

    return { total, exited, atYard, dieselProvided, driverOK, dnPrinted, nightShift }
  }, [logs])

  // Filter logs for real-time grid display
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs
    const q = searchQuery.toLowerCase()
    return logs.filter(l => 
      l.plate_no.toLowerCase().includes(q) ||
      l.supplier_name.toLowerCase().includes(q) ||
      l.driver_name.toLowerCase().includes(q) ||
      l.project_no.toLowerCase().includes(q) ||
      l.do_no.toLowerCase().includes(q)
    )
  }, [logs, searchQuery])

  // Sync dispatcher status to Kanban board
  async function syncFleetKanbanStatus(trailerId: string, leaving: boolean, activeJob: boolean, drName: string) {
    let statusText = 'IN FACTORY EMPTY'
    if (leaving) {
      statusText = 'SHIFTING AT SITE'
    } else if (activeJob) {
      statusText = 'UNDER LOADING AT SY'
    }

    const { data } = await supabase.from('fleet_status').select('id').eq('trailer_id', trailerId).maybeSingle()
    
    const payload = {
      trailer_id: trailerId,
      status_text: statusText,
      site_location: leaving ? 'Transit Route' : 'Precast Yard SY',
      driver_name: drName,
      status_timestamp: new Date().toISOString()
    }

    if (data?.id) {
      await supabase.from('fleet_status').update(payload).eq('id', data.id)
    } else {
      await supabase.from('fleet_status').insert([payload])
    }
  }

  // Update a single dispatch log row (Inline or via Form)
  async function saveLogRow(updatedRow: Partial<DispatchLogRow> & { id: string }) {
    await supabase.from('dispatch_log').update(updatedRow).eq('id', updatedRow.id)
    
    // Update local state reactively
    setLogs(prev => prev.map(l => l.id === updatedRow.id ? { ...l, ...updatedRow } : l))

    // Sync to Kanban
    const fullRow = logs.find(l => l.id === updatedRow.id)
    if (fullRow) {
      const mergedLeaving = updatedRow.leaving_status !== undefined ? updatedRow.leaving_status : fullRow.leaving_status
      const mergedProject = updatedRow.project_no !== undefined ? updatedRow.project_no : fullRow.project_no
      const mergedDo = updatedRow.do_no !== undefined ? updatedRow.do_no : fullRow.do_no
      const mergedDriver = updatedRow.driver_name !== undefined ? updatedRow.driver_name : fullRow.driver_name
      const hasJob = !!(mergedProject || mergedDo)
      
      await syncFleetKanbanStatus(fullRow.trailer_id, mergedLeaving, hasJob, mergedDriver)
    }
  }

  // Handle single dropdown submission
  const handleSubmitOneByOne = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrailerId) return
    setUpdating(true)

    // Find the log row for this trailer
    const existingLog = logs.find(l => l.trailer_id === selectedTrailerId)
    if (existingLog) {
      await saveLogRow({
        id: existingLog.id,
        driver_name: driverName,
        driver_mobile: driverMobile,
        project_no: projectNo,
        do_no: doNo,
        shift,
        diesel_status: diesel,
        driver_status: driverStatus,
        dn_status: dnStatus,
        leaving_status: leavingStatus,
        remarks,
        log_date: new Date().toISOString().slice(0, 10)
      })
      alert(`Log for trailer ${existingLog.plate_no} updated successfully!`)
      // Clear inputs
      setSelectedTrailerId('')
      setTrailerSearch('')
      setDriverName('')
      setDriverMobile('')
      setProjectNo('')
      setDoNo('')
      setDiesel(false)
      setDriverStatus(false)
      setDnStatus(false)
      setLeavingStatus(false)
      setRemarks('')
    }
    setUpdating(false)
  }

  // Handle CSV Bulk File Parse
  const handleCSVUpload = (file: File) => {
    setCsvFileName(file.name)
    setCsvStatus('parsing')

    Papa.parse<any>(file, {
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const lines = results.data
          if (lines.length < 5) {
            setCsvStatus('error')
            return
          }
          const rows = lines.slice(4)

          setCsvStatus('saving')
          let currSupplier = ''
          let processedCount = 0

          for (const r of rows) {
            if (r.length < 6) continue
            const sup = r[1]?.trim() || ''
            const plate = r[3]?.trim() || ''
            const drName = r[4]?.trim() || ''
            const drMobile = r[5]?.trim() || ''
            if (!plate) continue

            if (sup) currSupplier = sup

            // Correct new column offsets:
            // 6: DO No., 7: Shift, 8: Diesel Status, 9: Driver Status, 10: DN Status, 11: Leaving Status, 12: Remarks
            const project = '' // Not in new master list CSV
            const doNoVal = r[6]?.trim() || ''
            const shiftVal = (r[7]?.trim()?.toLowerCase() === 'night' ? 'Night' : 'Day') as 'Day' | 'Night'
            
            const checkTrue = (val: string) => {
              const clean = (val || '').toLowerCase().trim()
              return ['yes', 'true', 'done', 'passed', 'filled', 'exited', '1'].includes(clean)
            }

            const dieselVal = checkTrue(r[8])
            const driverVal = checkTrue(r[9])
            const dnVal = checkTrue(r[10])
            const leavingVal = checkTrue(r[11])
            const remarksVal = r[12]?.trim() || ''

            const matchLog = logs.find(l => l.plate_no === plate)
            if (matchLog) {
              await saveLogRow({
                id: matchLog.id,
                driver_name: drName,
                driver_mobile: drMobile,
                project_no: project,
                do_no: doNoVal,
                shift: shiftVal,
                diesel_status: dieselVal,
                driver_status: driverVal,
                dn_status: dnVal,
                leaving_status: leavingVal,
                remarks: remarksVal
              })
              processedCount++
            }
          }

          setCsvCount(processedCount)
          setCsvStatus('done')
          await loadData()
        } catch (err) {
          console.error(err)
          setCsvStatus('error')
        }
      },
      error: () => setCsvStatus('error')
    })
  }

  // --- TEMPLATE DOWNLOAD AND PRINT FUNCTIONS ---
  const downloadBlankCSV = () => {
    let csv = 'TRAILER MOVEMENT & DISPATCH LOG,,,,,,,,,,,,\n';
    csv += 'Gate / Yard Daily Vehicle Dispatch Record,,,,,,,,,,,,\n\n';
    csv += 'Sl No,Supplier Name,Trailer Type,Plate No,Driver Name,Driver Mobile No.,Project No,DO No.,Shift,Diesel Status,Driver Status,DN Status,Leaving Status,Remarks\n';
    trailers.forEach((t, idx) => {
      const drv = drivers.find(d => d.assigned_plate === t.plate_no)
      csv += `${idx + 1},"${t.supplier}","${t.type}","${t.plate_no}","${drv?.name || ''}","${drv?.mobile || ''}",,,,,,,,\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'FLEET_DISPATCH_TEMPLATE.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadBlankExcel = () => {
    let csv = 'TRAILER MOVEMENT & DISPATCH LOG,,,,,,,,,,,,\n';
    csv += 'Gate / Yard Daily Vehicle Dispatch Record,,,,,,,,,,,,\n\n';
    csv += 'Sl No,Supplier Name,Trailer Type,Plate No,Driver Name,Driver Mobile No.,Project No,DO No.,Shift,Diesel Status,Driver Status,DN Status,Leaving Status,Remarks\n';
    trailers.forEach((t, idx) => {
      const drv = drivers.find(d => d.assigned_plate === t.plate_no)
      csv += `${idx + 1},"${t.supplier}","${t.type}","${t.plate_no}","${drv?.name || ''}","${drv?.mobile || ''}",,,,,,,,\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'FLEET_DISPATCH_TEMPLATE.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printBlankPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    let html = `
      <html>
        <head>
          <title>Print Blank Dispatch Sheet</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: black; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid black; padding: 6px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; font-size: 8px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid black; padding-bottom: 10px; }
            .title { font-size: 14px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">SAFETECH PRECAST - DAILY VEHICLE DISPATCH RECORD</div>
              <div style="font-size: 8px; color: gray;">Gate / Yard Daily Vehicle Dispatch Record</div>
            </div>
            <div style="text-align: right;">
              <strong>Date:</strong> ____________________<br/>
              <strong>Shift:</strong> Day / Night
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Sl No</th>
                <th>Supplier Name</th>
                <th>Trailer Type</th>
                <th>Plate No</th>
                <th>Driver Name</th>
                <th>Driver Mobile</th>
                <th style="width: 10%;">Project No</th>
                <th style="width: 10%;">DO No.</th>
                <th>Shift</th>
                <th>Diesel Status</th>
                <th>Driver Status</th>
                <th>DN Status</th>
                <th>Leaving Status</th>
                <th style="width: 15%;">Remarks</th>
              </tr>
            </thead>
            <tbody>
    `;
    trailers.forEach((t, idx) => {
      html += `
        <tr>
          <td>${idx + 1}</td>
          <td>${t.supplier}</td>
          <td>${t.type}</td>
          <td><strong>${t.plate_no}</strong></td>
          <td>${drivers.find(d => d.assigned_plate === t.plate_no)?.name || ''}</td>
          <td>${drivers.find(d => d.assigned_plate === t.plate_no)?.mobile || ''}</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      `;
    });
    html += `
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const exportActiveLogsCSV = () => {
    let csv = 'TRAILER MOVEMENT & DISPATCH LOG - ACTIVE LOGS\n';
    csv += 'Generated Date,' + new Date().toLocaleDateString('en-GB') + '\n\n';
    csv += 'Sl No,Supplier Name,Trailer Type,Plate No,Driver Name,Driver Mobile No.,Project No,DO No.,Shift,Diesel Status,Driver Status,DN Status,Leaving Status,Remarks\n';
    logs.forEach((l, idx) => {
      csv += `${idx + 1},"${l.supplier_name}","${l.trailer_type}","${l.plate_no}","${l.driver_name}","${l.driver_mobile}","${l.project_no}","${l.do_no}","${l.shift}",${l.diesel_status ? 'Filled' : 'Pending'},${l.driver_status ? 'Passed' : 'Pending'},${l.dn_status ? 'Done' : 'Pending'},${l.leaving_status ? 'Exited' : 'Yard'},"${l.remarks || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Active_Dispatch_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[250px] animate-pulse">Loading logistics update panels...</div>

  return (
    <div className="space-y-6">
      
      {/* Templates & Export Section (No-Print) */}
      <div className="flex flex-wrap gap-2 pb-3 border-b border-white/5 no-print">
        <button
          onClick={downloadBlankCSV}
          className="text-[10px] uppercase font-bold tracking-wider bg-slate-950 hover:bg-slate-900 border border-white/5 hover:border-red-500/20 text-slate-300 px-3 py-2 rounded-lg transition-all"
        >
          📥 CSV Template
        </button>
        <button
          onClick={downloadBlankExcel}
          className="text-[10px] uppercase font-bold tracking-wider bg-slate-950 hover:bg-slate-900 border border-white/5 hover:border-red-500/20 text-slate-300 px-3 py-2 rounded-lg transition-all"
        >
          📥 Excel Template
        </button>
        <button
          onClick={printBlankPDF}
          className="text-[10px] uppercase font-bold tracking-wider bg-slate-950 hover:bg-slate-900 border border-white/5 hover:border-red-500/20 text-slate-300 px-3 py-2 rounded-lg transition-all"
        >
          🖨️ PDF Template
        </button>
        <button
          onClick={exportActiveLogsCSV}
          className="text-[10px] uppercase font-bold tracking-wider bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg transition-all sm:ml-auto"
        >
          📊 Export Current Logs
        </button>
      </div>

      {/* Tab Selectors for modes */}
      <div className="flex justify-between items-center pb-2 border-b border-white/5">
        <div>
          <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-wide uppercase">
            Logistics & Dispatch <span className="text-red-500 font-light">Controls</span>
          </h3>
          <p className="text-xs text-slate-400">Update yard exit status, fuel logs, and load clearances</p>
        </div>
        <div className="flex gap-2 bg-slate-950/80 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setMode('dropdown')}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all duration-200 ${
              mode === 'dropdown'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Search Dropdown
          </button>
          <button
            onClick={() => setMode('csv')}
            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider transition-all duration-200 ${
              mode === 'csv'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bulk CSV Upload
          </button>
        </div>
      </div>

      {/* Mode 1: Searchable Dropdown One-by-One update */}
      {mode === 'dropdown' && (
        <form onSubmit={handleSubmitOneByOne} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Searchable Combobox Select */}
            <div className="block md:col-span-1 relative">
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1">Search & Select Trailer</span>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-3 py-2.5 rounded-xl glowing-input text-xs"
                  placeholder={selectedTrailerId ? `${selectedTrailer?.plate_no} - Selected` : "Type plate, supplier, driver..."}
                  value={trailerSearch}
                  onFocus={() => setShowTrailerDropdown(true)}
                  onChange={e => {
                    setTrailerSearch(e.target.value)
                    setShowTrailerDropdown(true)
                  }}
                />
                {selectedTrailerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrailerId('')
                      setTrailerSearch('')
                    }}
                    className="absolute right-3 top-2.5 text-xs text-red-500 hover:text-red-400 font-extrabold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {showTrailerDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto divide-y divide-white/5">
                  {filteredTrailersForSelect.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 text-center">No matching plate numbers</div>
                  ) : (
                    filteredTrailersForSelect.map(t => (
                      <div
                        key={t.id}
                        onClick={async () => {
                          setSelectedTrailerId(t.id)
                          setTrailerSearch(`${t.plate_no} - ${t.supplier}`)
                          const drv = drivers.find(d => d.assigned_plate === t.plate_no)
                          setDriverName(drv?.name || '')
                          setDriverMobile(drv?.mobile || '')
                          setShowTrailerDropdown(false)
                          
                          // Load current values if they exist
                          const existing = logs.find(l => l.trailer_id === t.id)
                          if (existing) {
                            setProjectNo(existing.project_no)
                            setDoNo(existing.do_no)
                            setShift(existing.shift)
                            setDiesel(existing.diesel_status)
                            setDriverStatus(existing.driver_status)
                            setDnStatus(existing.dn_status)
                            setLeavingStatus(existing.leaving_status)
                            setRemarks(existing.remarks)
                            if (existing.driver_name) setDriverName(existing.driver_name)
                            if (existing.driver_mobile) setDriverMobile(existing.driver_mobile)
                          }
                        }}
                        className="p-2.5 text-xs text-slate-300 hover:bg-red-500/10 hover:text-white cursor-pointer transition-colors duration-150 flex flex-col gap-0.5"
                      >
                        <span className="font-extrabold text-red-400">{t.plate_no}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{t.supplier} ({t.type})</span>
                        {drivers.find(d => d.assigned_plate === t.plate_no)?.name && <span className="text-[9px] text-slate-500">Driver: {drivers.find(d => d.assigned_plate === t.plate_no)?.name}</span>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <label className="block md:col-span-1">
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1">Destination Project</span>
              <Typeahead value={projectNo} onChange={setProjectNo} table="projects" column="project_no" placeholder="E.g. P25044" />
            </label>

            <label className="block md:col-span-1">
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1">DO Number</span>
              <input 
                className="w-full px-4 py-2.5 rounded-xl glowing-input text-xs" 
                placeholder="DO-10368" 
                value={doNo} 
                onChange={e=>setDoNo(e.target.value)} 
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1">Driver Name</span>
              <input 
                className="w-full px-4 py-2.5 rounded-xl glowing-input text-xs font-semibold" 
                placeholder="Driver Name" 
                value={driverName} 
                onChange={e=>setDriverName(e.target.value)} 
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1">Driver Mobile No.</span>
              <input 
                className="w-full px-4 py-2.5 rounded-xl glowing-input text-xs font-semibold" 
                placeholder="Driver Mobile" 
                value={driverMobile} 
                onChange={e=>setDriverMobile(e.target.value)} 
              />
            </label>
          </div>

          {selectedTrailer && (
            <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 grid grid-cols-2 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase">Logistics Supplier:</span>
                <span className="text-neutral-800 dark:text-white font-extrabold ml-2">{selectedTrailer.supplier}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase">Trailer Frame Type:</span>
                <span className="text-neutral-800 dark:text-white font-extrabold ml-2">{selectedTrailer.type}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <label className="block p-2.5 rounded-xl bg-slate-950/40 border border-white/5 text-center flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Shift Type</span>
              <select 
                className="mt-1.5 w-full bg-slate-900 border border-white/10 px-2 py-1 rounded text-xs text-white"
                value={shift}
                onChange={e=>setShift(e.target.value as any)}
              >
                <option value="Day">Day</option>
                <option value="Night">Night</option>
              </select>
            </label>

            <label className="block p-2.5 rounded-xl bg-slate-950/40 border border-white/5 text-center flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Diesel status</span>
              <button 
                type="button" 
                onClick={()=>setDiesel(s=>!s)}
                className={`mt-1.5 w-full py-1.5 rounded-lg text-[10px] font-extrabold tracking-wide uppercase btn-interactive transition-all ${
                  diesel ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' : 'bg-white/5 text-slate-400 border border-white/5'
                }`}
              >
                {diesel ? 'Filled' : 'Pending'}
              </button>
            </label>

            <label className="block p-2.5 rounded-xl bg-slate-950/40 border border-white/5 text-center flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Driver Check</span>
              <button 
                type="button" 
                onClick={()=>setDriverStatus(s=>!s)}
                className={`mt-1.5 w-full py-1.5 rounded-lg text-[10px] font-extrabold tracking-wide uppercase btn-interactive transition-all ${
                  driverStatus ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' : 'bg-white/5 text-slate-400 border border-white/5'
                }`}
              >
                {driverStatus ? 'Passed' : 'Pending'}
              </button>
            </label>

            <label className="block p-2.5 rounded-xl bg-slate-950/40 border border-white/5 text-center flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">DO printed</span>
              <button 
                type="button" 
                onClick={()=>setDnStatus(s=>!s)}
                className={`mt-1.5 w-full py-1.5 rounded-lg text-[10px] font-extrabold tracking-wide uppercase btn-interactive transition-all ${
                  dnStatus ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' : 'bg-white/5 text-slate-400 border border-white/5'
                }`}
              >
                {dnStatus ? 'Done' : 'Pending'}
              </button>
            </label>

            <label className="block p-2.5 rounded-xl bg-slate-950/40 border border-white/5 text-center flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Leaving Gate</span>
              <button 
                type="button" 
                onClick={()=>setLeavingStatus(s=>!s)}
                className={`mt-1.5 w-full py-1.5 rounded-lg text-[10px] font-extrabold tracking-wide uppercase btn-interactive transition-all ${
                  leavingStatus ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' : 'bg-white/5 text-slate-400 border border-white/5'
                }`}
              >
                {leavingStatus ? 'Exited' : 'At Yard'}
              </button>
            </label>
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-1">Remarks</span>
            <input 
              className="w-full px-4 py-2.5 rounded-xl glowing-input text-xs" 
              placeholder="E.g. Loaded Night shift by foreman" 
              value={remarks} 
              onChange={e=>setRemarks(e.target.value)} 
            />
          </label>

          <button 
            type="submit" 
            disabled={updating || !selectedTrailerId} 
            className="w-full bg-gradient-to-br from-red-500 to-red-700 disabled:from-slate-800 disabled:to-slate-900 text-white font-extrabold text-xs tracking-wider uppercase py-3 rounded-xl btn-interactive shadow-lg shadow-red-500/20"
          >
            {updating ? 'Updating Log...' : 'Update Trailer Dispatch Log'}
          </button>
        </form>
      )}

      {/* Mode 2: Bulk CSV Upload */}
      {mode === 'csv' && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-white/10 hover:border-red-500/30 rounded-2xl p-8 text-center bg-slate-950/40 relative group transition-all duration-300">
            <input
              type="file"
              accept=".csv"
              onChange={e => e.target.files?.[0] && handleCSVUpload(e.target.files[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 group-hover:scale-110 transition-transform duration-300">
                📁
              </div>
              <div className="text-sm font-bold text-slate-300">
                {csvFileName ? csvFileName : 'Upload FLEET LOGS Master CSV'}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                Updates plate numbers matching the standard sheet format
              </div>
            </div>
          </div>

          {csvStatus === 'parsing' && <div className="text-center text-xs font-bold text-red-500 uppercase animate-pulse">Reading master file log...</div>}
          {csvStatus === 'saving' && <div className="text-center text-xs font-bold text-red-500 uppercase animate-pulse">Updating trailer records in database...</div>}
          {csvStatus === 'done' && (
            <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl text-center text-xs font-extrabold text-green-400 uppercase">
              ✔️ Success: Bulk Dispatch Log updated. {csvCount} Trailer entries merged!
            </div>
          )}
          {csvStatus === 'error' && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-xs font-extrabold text-red-400 uppercase">
              ❌ File parsing failed. Verify the CSV format matches the master layout template.
            </div>
          )}
        </div>
      )}

      {/* Real-time processing summary Dashboard */}
      <div className="space-y-3.5">
        <div className="text-xs uppercase tracking-widest font-extrabold text-slate-400 pb-1.5 border-b border-white/5">
          Real-Time Operations Dispatch Summary
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex flex-col justify-between shadow-md">
            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Total Fleet</span>
            <span className="text-lg font-extrabold text-slate-200 mt-1">{summary.total}</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex flex-col justify-between shadow-md">
            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">At Yard empty</span>
            <span className="text-lg font-extrabold text-slate-200 mt-1">{summary.atYard}</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex flex-col justify-between shadow-md">
            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Dispatched (Exited)</span>
            <span className="text-lg font-extrabold text-red-500 mt-1">{summary.exited}</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex flex-col justify-between shadow-md">
            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Diesel Provided</span>
            <span className="text-lg font-extrabold text-slate-200 mt-1">{summary.dieselProvided}</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex flex-col justify-between shadow-md">
            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Driver OK</span>
            <span className="text-lg font-extrabold text-slate-200 mt-1">{summary.driverOK}</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex flex-col justify-between shadow-md">
            <span className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">Night Shift runs</span>
            <span className="text-lg font-extrabold text-slate-200 mt-1">{summary.nightShift}</span>
          </div>
        </div>
      </div>

      {/* Searchable grid list of active logs */}
      <div className="space-y-3.5 pt-2">
        <div className="flex justify-between items-center">
          <span className="text-xs uppercase tracking-widest font-extrabold text-slate-400">Active Logistics Grid</span>
          <input
            className="px-3 py-1.5 rounded-lg glowing-input text-xs w-48 placeholder-slate-600 focus:outline-none"
            placeholder="Search Plate / Driver..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="overflow-hidden border border-white/5 rounded-xl bg-slate-950/40 max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-400 border-b border-white/5 bg-white/5 text-[10px] uppercase font-extrabold tracking-wider">
                <th className="p-3">Plate No</th>
                <th className="p-3">Driver Details</th>
                <th className="p-3">Supplier Name</th>
                <th className="p-3">Project No</th>
                <th className="p-3">DO No</th>
                <th className="p-3 text-center">Diesel</th>
                <th className="p-3 text-center">Driver Check</th>
                <th className="p-3 text-center">DO DN</th>
                <th className="p-3 text-center">Leaving</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(l => (
                <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors duration-150">
                  <td className="p-3 font-extrabold text-red-500">{l.plate_no}</td>
                  <td className="p-3 text-slate-300">
                    <div className="font-bold">{l.driver_name || '--'}</div>
                    <div className="text-[10px] text-slate-500">{l.driver_mobile}</div>
                  </td>
                  <td className="p-3 font-semibold text-slate-300 truncate max-w-[130px]">{l.supplier_name}</td>
                  <td className="p-3">
                    <input 
                      className="bg-transparent border border-transparent hover:border-white/10 focus:border-red-500/50 px-1 py-0.5 rounded text-neutral-800 dark:text-white font-bold w-16 text-center text-xs"
                      value={l.project_no} 
                      placeholder="--"
                      onChange={e => saveLogRow({ id: l.id, project_no: e.target.value })}
                    />
                  </td>
                  <td className="p-3">
                    <input 
                      className="bg-transparent border border-transparent hover:border-white/10 focus:border-red-500/50 px-1 py-0.5 rounded text-neutral-800 dark:text-white font-bold w-16 text-center text-xs"
                      value={l.do_no} 
                      placeholder="--"
                      onChange={e => saveLogRow({ id: l.id, do_no: e.target.value })}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => saveLogRow({ id: l.id, diesel_status: !l.diesel_status })}
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${l.diesel_status ? 'bg-red-500/20 text-red-400' : 'bg-slate-900 text-slate-500'}`}
                    >
                      {l.diesel_status ? 'FILLED' : 'PENDING'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => saveLogRow({ id: l.id, driver_status: !l.driver_status })}
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${l.driver_status ? 'bg-red-500/20 text-red-400' : 'bg-slate-900 text-slate-500'}`}
                    >
                      {l.driver_status ? 'OK' : 'PENDING'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => saveLogRow({ id: l.id, dn_status: !l.dn_status })}
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${l.dn_status ? 'bg-red-500/20 text-red-400' : 'bg-slate-900 text-slate-500'}`}
                    >
                      {l.dn_status ? 'DONE' : 'PENDING'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button 
                      onClick={() => saveLogRow({ id: l.id, leaving_status: !l.leaving_status })}
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${l.leaving_status ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}
                    >
                      {l.leaving_status ? 'EXITED' : 'YARD'}
                    </button>
                  </td>
                  <td className="p-3">
                    <input 
                      className="bg-transparent border border-transparent hover:border-white/10 focus:border-red-500/50 px-2 py-0.5 rounded text-slate-300 w-full text-xs font-semibold"
                      value={l.remarks} 
                      placeholder="Click to add remarks..."
                      onChange={e => saveLogRow({ id: l.id, remarks: e.target.value })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
