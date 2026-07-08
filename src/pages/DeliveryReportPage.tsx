import React, { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { supabase } from '../lib/supabaseClient'

type DeliveryRow = {
  id: string
  project_no: string
  project_name: string
  location: string
  trailer_id: string
  trailer_plate?: string
  element_type: string
  element_count: number
  dn_no: string
  volume_cum: number
  weight_tons: number
  delivery_date: string
  delivery_timestamp?: string
  remarks: string
}

type TrailerRow = {
  id: string
  plate_no: string
  supplier: string
}

type ReportMode = 'daily' | 'weekly' | 'monthly' | 'custom'

export default function DeliveryReportPage() {
  const [mode, setMode] = useState<ReportMode>('daily')
  const [reportView, setReportView] = useState<'a3' | 'traceability'>('a3')
  const [traces, setTraces] = useState<any[]>([])
  const [searchTraceCode, setSearchTraceCode] = useState('')
  
  // Input fields for range filtering
  const [targetDate, setTargetDate] = useState('2026-06-29')
  const [targetWeekStart, setTargetWeekStart] = useState('2026-06-29')
  const [targetMonth, setTargetMonth] = useState('2026-06')
  const [customStartStr, setCustomStartStr] = useState('2026-06-29')
  const [customStartTime, setCustomStartTime] = useState('06:00')
  const [customEndStr, setCustomEndStr] = useState('2026-06-30')
  const [customEndTime, setCustomEndTime] = useState('06:00')

  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([])
  const [trailers, setTrailers] = useState<TrailerRow[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all logs from mock database
  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: delData }, { data: trData }, { data: traceData }] = await Promise.all([
        supabase.from('deliveries').select('*').limit(1000),
        supabase.from('trailers').select('*').limit(500),
        supabase.from('element_traceability').select('*').limit(1000)
      ])

      const trailerMap: Record<string, string> = {}
      ;(trData || []).forEach((t: any) => {
        trailerMap[t.id] = t.plate_no
      })

      const mappedDeliveries = (delData || []).map((d: any) => ({
        ...d,
        trailer_plate: trailerMap[d.trailer_id] || 'N/A'
      }))

      setDeliveries(mappedDeliveries)
      setTrailers(trData || [])
      setTraces(traceData || [])
      if (traceData && traceData.length > 0) {
        setSearchTraceCode(traceData[0].element_code)
      }
      setLoading(false)
    }
    load()
  }, [])

  // Calculate GMT+4 local filter timeline range
  const timelineRange = useMemo(() => {
    let startStr = ''
    let endStr = ''

    if (mode === 'daily') {
      startStr = `${targetDate}T06:00:00+04:00`
      const nextDay = new Date(new Date(targetDate).getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      endStr = `${nextDay}T06:00:00+04:00`
    } else if (mode === 'weekly') {
      startStr = `${targetWeekStart}T06:00:00+04:00`
      const nextWeek = new Date(new Date(targetWeekStart).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      endStr = `${nextWeek}T06:00:00+04:00`
    } else if (mode === 'monthly') {
      const year = parseInt(targetMonth.split('-')[0])
      const month = parseInt(targetMonth.split('-')[1])
      startStr = `${targetMonth}-01T06:00:00+04:00`
      const nextMonthDate = new Date(year, month, 1)
      const nextMonthStr = nextMonthDate.toISOString().slice(0, 10)
      endStr = `${nextMonthStr}T06:00:00+04:00`
    } else if (mode === 'custom') {
      startStr = `${customStartStr}T${customStartTime}:00+04:00`
      endStr = `${customEndStr}T${customEndTime}:00+04:00`
    }

    return { startStr, endStr }
  }, [mode, targetDate, targetWeekStart, targetMonth, customStartStr, customStartTime, customEndStr, customEndTime])

  // Filter deliveries based on date range
  const filteredDeliveries = useMemo(() => {
    const start = new Date(timelineRange.startStr).getTime()
    const end = new Date(timelineRange.endStr).getTime()

    return deliveries.filter(d => {
      const deliveryTime = d.delivery_timestamp ? new Date(d.delivery_timestamp).getTime() : new Date(d.delivery_date).getTime()
      return deliveryTime >= start && deliveryTime < end
    })
  }, [deliveries, timelineRange])

  // Sub-totals calculations
  const summary = useMemo(() => {
    let trips = filteredDeliveries.length
    let elements = 0
    let volume = 0
    let weight = 0
    const projects = new Set<string>()

    filteredDeliveries.forEach(d => {
      elements += d.element_count || 0
      volume += d.volume_cum || 0
      weight += d.weight_tons || 0
      if (d.project_no) projects.add(d.project_no)
    })

    return {
      trips,
      elements,
      volume: Number(volume.toFixed(2)),
      weight: Number(weight.toFixed(2)),
      activeProjects: projects.size,
      avgElements: trips > 0 ? Number((elements / trips).toFixed(1)) : 0
    }
  }, [filteredDeliveries])

  // Split calculations into PRECAST and HCS
  const splitCategories = useMemo(() => {
    const precastList = filteredDeliveries.filter(d => (d.element_type || '').toUpperCase() !== 'HCS')
    const hcsList = filteredDeliveries.filter(d => (d.element_type || '').toUpperCase() === 'HCS')

    const compileCategorySummary = (list: DeliveryRow[]) => {
      const projMap: Record<string, { no: string, name: string, trips: number, qty: number, vol: number, wt: number }> = {}
      
      list.forEach(d => {
        if (!projMap[d.project_no]) {
          projMap[d.project_no] = { no: d.project_no, name: d.project_name, trips: 0, qty: 0, vol: 0, wt: 0 }
        }
        const p = projMap[d.project_no]
        p.trips += 1
        p.qty += d.element_count || 0
        p.vol += d.volume_cum || 0
        p.wt += d.weight_tons || 0
      })

      const rows = Object.values(projMap).map(p => ({
        no: p.no,
        name: p.name,
        trips: p.trips,
        qty: p.qty,
        vol: Number(p.vol.toFixed(2)),
        wt: Number(p.wt.toFixed(2))
      }))

      const subtotal = {
        trips: list.length,
        qty: list.reduce((acc, c) => acc + (c.element_count || 0), 0),
        vol: Number(list.reduce((acc, c) => acc + (c.volume_cum || 0), 0).toFixed(2)),
        wt: Number(list.reduce((acc, c) => acc + (c.weight_tons || 0), 0).toFixed(2))
      }

      return { rows, subtotal }
    }

    return {
      precast: compileCategorySummary(precastList),
      hcs: compileCategorySummary(hcsList)
    }
  }, [filteredDeliveries])

  // Recharts graphics payload calculations
  const chartData = useMemo(() => {
    const projectStatsMap: Record<string, { project: string, trips: number, volume: number }> = {}
    let flatbedTrips = 0
    let lowbedTrips = 0

    filteredDeliveries.forEach(d => {
      if (!projectStatsMap[d.project_no]) {
        projectStatsMap[d.project_no] = { project: d.project_no, trips: 0, volume: 0 }
      }
      projectStatsMap[d.project_no].trips++
      projectStatsMap[d.project_no].volume += d.volume_cum || 0

      if ((d.element_type || '').toUpperCase() === 'HCS') {
        flatbedTrips++
      } else {
        lowbedTrips++
      }
    })

    const projects = Object.values(projectStatsMap).map(p => ({
      ...p,
      volume: Number(p.volume.toFixed(1))
    }))

    const trailerTypes = [
      { name: 'HCS Flatbeds', value: flatbedTrips },
      { name: 'Lowbeds / Precast', value: lowbedTrips }
    ].filter(t => t.value > 0)

    return { projects, trailerTypes }
  }, [filteredDeliveries])

  // Shift efficiency KPIs calculation
  const metrics = useMemo(() => {
    const totalTrips = filteredDeliveries.length
    if (totalTrips === 0) return { avgWeight: 0, avgVol: 0, precastPct: 0, hcsPct: 0, topProject: 'N/A' }

    const totalWeight = filteredDeliveries.reduce((acc, c) => acc + (c.weight_tons || 0), 0)
    const totalVolume = filteredDeliveries.reduce((acc, c) => acc + (c.volume_cum || 0), 0)
    const precastQty = filteredDeliveries.filter(d => (d.element_type || '').toUpperCase() !== 'HCS').reduce((acc, c) => acc + (c.element_count || 0), 0)
    const hcsQty = filteredDeliveries.filter(d => (d.element_type || '').toUpperCase() === 'HCS').reduce((acc, c) => acc + (c.element_count || 0), 0)
    const totalQty = precastQty + hcsQty

    // Find project with highest trip volume
    const projTrips: Record<string, number> = {}
    filteredDeliveries.forEach(d => {
      projTrips[d.project_no] = (projTrips[d.project_no] || 0) + 1
    })
    let topProj = 'N/A'
    let maxTrips = 0
    Object.entries(projTrips).forEach(([k, v]) => {
      if (v > maxTrips) {
        maxTrips = v
        topProj = k
      }
    })

    return {
      avgWeight: Number((totalWeight / totalTrips).toFixed(1)),
      avgVol: Number((totalVolume / totalTrips).toFixed(1)),
      precastPct: totalQty > 0 ? Math.round((precastQty / totalQty) * 100) : 0,
      hcsPct: totalQty > 0 ? Math.round((hcsQty / totalQty) * 100) : 0,
      topProject: topProj
    }
  }, [filteredDeliveries])

  // CSV Export utility
  const exportToExcel = () => {
    let csvContent = 'data:text/csv;charset=utf-8,' 
      + 'S.No,Project No,Project Name,Location,Trailer Plate,Element Type,Total Qty,DN No,Volume (m³),Weight (Tons),Remarks\n'

    filteredDeliveries.forEach((d, index) => {
      const row = [
        index + 1,
        d.project_no,
        `"${d.project_name}"`,
        `"${d.location}"`,
        d.trailer_plate,
        d.element_type,
        d.element_count,
        d.dn_no,
        d.volume_cum,
        d.weight_tons,
        `"${d.remarks || ''}"`
      ].join(',')
      csvContent += row + '\n'
    })

    const encodedUri = encodeURI(csvContent);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Delivery_Report_${timelineRange.startStr.slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading operations data...</div>

  return (
    <div className="space-y-6">
      {/* Top Selector Menu (No-Print) */}
      <div className="glass-panel p-2 rounded-2xl flex gap-2 border border-slate-200 dark:border-white/5 shadow-md no-print">
        <button
          onClick={() => setReportView('a3')}
          className={`flex-1 py-2.5 rounded-xl text-xs uppercase font-extrabold transition-all duration-150 ${
            reportView === 'a3'
              ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md shadow-red-500/25'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          📋 A3 Daily Operations Report
        </button>
        <button
          onClick={() => setReportView('traceability')}
          className={`flex-1 py-2.5 rounded-xl text-xs uppercase font-extrabold transition-all duration-150 ${
            reportView === 'traceability'
              ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md shadow-red-500/25'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          🏁 Element Traceability Audit Lookup
        </button>
      </div>

      {reportView === 'a3' ? (
        <>
          {/* FILTER HEADER (No-Print) */}
          <div className="glass-panel p-5 rounded-2xl border border-red-500/10 shadow-xl space-y-4 no-print">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/5">
              <div>
                <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white tracking-wide uppercase">
                  Operations <span className="text-red-500 font-light">Reports</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Filter deliveries by daily 24h work timelines (06:00 to 06:00) or custom periods</p>
              </div>
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly', 'custom'] as ReportMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-4 py-2 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all duration-200 btn-interactive ${
                      mode === m 
                        ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md shadow-red-500/25' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Panel depending on selector */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {mode === 'daily' && (
                <label className="block md:col-span-2">
                  <span className="text-xs uppercase font-bold text-slate-400">Target Operations Date</span>
                  <input type="date" className="w-full mt-1.5 px-4 py-2.5 rounded-xl glowing-input text-xs" value={targetDate} onChange={e=>setTargetDate(e.target.value)} />
                </label>
              )}

              {mode === 'weekly' && (
                <label className="block md:col-span-2">
                  <span className="text-xs uppercase font-bold text-slate-400">Week Start Date (from 06:00)</span>
                  <input type="date" className="w-full mt-1.5 px-4 py-2.5 rounded-xl glowing-input text-xs" value={targetWeekStart} onChange={e=>setTargetWeekStart(e.target.value)} />
                </label>
              )}

              {mode === 'monthly' && (
                <label className="block md:col-span-2">
                  <span className="text-xs uppercase font-bold text-slate-400">Target Month</span>
                  <input type="month" className="w-full mt-1.5 px-4 py-2.5 rounded-xl glowing-input text-xs" value={targetMonth} onChange={e=>setTargetMonth(e.target.value)} />
                </label>
              )}

              {mode === 'custom' && (
                <>
                  <div className="grid grid-cols-2 gap-2 md:col-span-2">
                    <label className="block">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Start Date</span>
                      <input type="date" className="w-full mt-1.5 px-4 py-2 rounded-xl glowing-input text-xs" value={customStartStr} onChange={e=>setCustomStartStr(e.target.value)} />
                    </label>
                    <label className="block">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Start Time (GMT+4)</span>
                      <input type="time" className="w-full mt-1.5 px-4 py-2 rounded-xl glowing-input text-xs" value={customStartTime} onChange={e=>setCustomStartTime(e.target.value)} />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:col-span-2">
                    <label className="block">
                      <span className="text-[10px] uppercase font-bold text-slate-400">End Date</span>
                      <input type="date" className="w-full mt-1.5 px-4 py-2 rounded-xl glowing-input text-xs" value={customEndStr} onChange={e=>setCustomEndStr(e.target.value)} />
                    </label>
                    <label className="block">
                      <span className="text-[10px] uppercase font-bold text-slate-400">End Time (GMT+4)</span>
                      <input type="time" className="w-full mt-1.5 px-4 py-2 rounded-xl glowing-input text-xs" value={customEndTime} onChange={e=>setCustomEndTime(e.target.value)} />
                    </label>
                  </div>
                </>
              )}

              <div className="md:col-span-1 flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-gradient-to-br from-red-500 to-red-700 text-white font-extrabold uppercase py-3 rounded-xl btn-interactive shadow-lg shadow-red-500/25 transition-all text-xs tracking-wider text-center"
                >
                  PDF
                </button>
                <button 
                  onClick={exportToExcel}
                  className="flex-1 bg-slate-900 border border-white/5 hover:border-red-500/20 text-slate-300 hover:text-white font-extrabold uppercase py-3 rounded-xl btn-interactive transition-all text-xs tracking-wider text-center"
                >
                  EXCEL
                </button>
              </div>
            </div>
          </div>

          {/* REPORT SHEET CONTAINER (A3 styled layout: 297mm x 420mm) */}
          <div className="w-full overflow-x-auto print:overflow-visible print-area">
            <div className="flex justify-center min-w-[1122px] print:min-w-0">
              <div className="w-[1122px] print:w-[297mm] print:h-[420mm] bg-white text-black p-6 md:p-8 font-sans border border-neutral-300 shadow-2xl relative flex flex-col text-xs leading-normal box-border mb-8 print:mb-0 print:border-none print:shadow-none print:overflow-hidden print:justify-between overflow-visible">
              
              <div className="space-y-4">
                {/* Header branding with Bold Black and Red accent line */}
                <div className="flex justify-between items-center border-b-4 border-black pb-2.5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 border-2 border-black p-1 bg-black shrink-0 flex items-center justify-center">
                      <img src="/safetech_logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="font-black text-[15px] tracking-tight">SAFETECH PRECAST BUILDING MANUFACTURING LLC</span>
                      <span className="text-[9.5px] text-neutral-600 font-semibold">National Industrial Park, Dubai - UAE | PO Box: 18337 - Jebel Ali</span>
                      <span className="text-[9.5px] text-neutral-600 font-semibold">Tel: 04-8813195 Fax: 04-2829929 Email: info@safe-tech.ae | Web: www.safe-tech.ae</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm uppercase tracking-widest bg-red-600 text-white px-5 py-2 block shadow">
                      DAILY OPERATIONS DELIVERY REPORT
                    </span>
                  </div>
                </div>

                {/* Info row */}
                <div className="flex justify-between text-[10px] font-bold pb-2 border-b border-neutral-200">
                  <span>Target Date/Period: <strong className="text-red-600">{timelineRange.startStr.slice(0, 10)}</strong></span>
                  <span>Timeline Limit: <strong>Shift 24 Hours (06:00 - 06:00)</strong></span>
                  <span>Document State: <strong className="text-emerald-600">AUDITED & COMPILED</strong></span>
                </div>

                {/* Sub totals telemetry widgets */}
                <div className="grid grid-cols-5 border border-black divide-x divide-black text-center bg-neutral-50 font-semibold text-[10.5px]">
                  <div className="p-2 flex flex-col justify-between">
                    <span className="text-[8px] text-neutral-500 uppercase font-black">TOTAL COMPLETED TRIPS</span>
                    <strong className="text-lg font-black text-red-600 mt-1">{summary.trips}</strong>
                  </div>
                  <div className="p-2 flex flex-col justify-between">
                    <span className="text-[8px] text-neutral-500 uppercase font-black">TOTAL QUANTITY LOADED</span>
                    <strong className="text-lg font-black mt-1">{summary.elements}</strong>
                  </div>
                  <div className="p-2 flex flex-col justify-between">
                    <span className="text-[8px] text-neutral-500 uppercase font-black">TOTAL VOLUME DISPATCHED</span>
                    <strong className="text-lg font-black mt-1">{summary.volume} m³</strong>
                  </div>
                  <div className="p-2 flex flex-col justify-between">
                    <span className="text-[8px] text-neutral-500 uppercase font-black">TOTAL WEIGHT LOADED</span>
                    <strong className="text-lg font-black mt-1">{summary.weight} Tons</strong>
                  </div>
                  <div className="p-2 flex flex-col justify-between">
                    <span className="text-[8px] text-neutral-500 uppercase font-black">ACTIVE PROJECT SITES</span>
                    <strong className="text-lg font-black text-red-600 mt-1">{summary.activeProjects}</strong>
                  </div>
                </div>

                {/* Elements split breakdown list */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* PRECAST WALL PANELS */}
                  <div className="border border-black p-3 space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-red-600 border-b border-black pb-1">
                      A. PRECAST ELEMENTS DISPATCH BREAKDOWN
                    </h4>
                    <table className="w-full text-[9px]">
                      <thead>
                        <tr className="border-b border-neutral-300 font-bold text-[8.5px] uppercase">
                          <th className="py-1 text-left">Project</th>
                          <th className="py-1 text-center">Trips</th>
                          <th className="py-1 text-center">Total Qty</th>
                          <th className="py-1 text-right">Volume (m³)</th>
                          <th className="py-1 text-right">Weight (Tons)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {splitCategories.precast.rows.map((row, idx) => (
                          <tr key={idx} className="h-6">
                            <td className="font-bold">{row.no} - {row.name.slice(0, 15)}...</td>
                            <td className="text-center">{row.trips}</td>
                            <td className="text-center font-bold">{row.qty}</td>
                            <td className="text-right">{row.vol}</td>
                            <td className="text-right">{row.wt}</td>
                          </tr>
                        ))}
                        <tr className="font-bold bg-neutral-50 border-t border-black text-[9.5px]">
                          <td>TOTAL PRECAST</td>
                          <td className="text-center">{splitCategories.precast.subtotal.trips}</td>
                          <td className="text-center">{splitCategories.precast.subtotal.qty}</td>
                          <td className="text-right">{splitCategories.precast.subtotal.vol}</td>
                          <td className="text-right">{splitCategories.precast.subtotal.wt}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* HOLLOWCORE SLABS */}
                  <div className="border border-black p-3 space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-red-600 border-b border-black pb-1">
                      B. HOLLOWCORE DISPATCH BREAKDOWN
                    </h4>
                    <table className="w-full text-[9px]">
                      <thead>
                        <tr className="border-b border-neutral-300 font-bold text-[8.5px] uppercase">
                          <th className="py-1 text-left">Project</th>
                          <th className="py-1 text-center">Trips</th>
                          <th className="py-1 text-center">Total Qty</th>
                          <th className="py-1 text-right">Volume (m³)</th>
                          <th className="py-1 text-right">Weight (Tons)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {splitCategories.hcs.rows.map((row, idx) => (
                          <tr key={idx} className="h-6">
                            <td className="font-bold">{row.no} - {row.name.slice(0, 15)}...</td>
                            <td className="text-center">{row.trips}</td>
                            <td className="text-center font-bold">{row.qty}</td>
                            <td className="text-right">{row.vol}</td>
                            <td className="text-right">{row.wt}</td>
                          </tr>
                        ))}
                        <tr className="font-bold bg-neutral-50 border-t border-black text-[9.5px]">
                          <td>TOTAL HCS</td>
                          <td className="text-center">{splitCategories.hcs.subtotal.trips}</td>
                          <td className="text-center">{splitCategories.hcs.subtotal.qty}</td>
                          <td className="text-right">{splitCategories.hcs.subtotal.vol}</td>
                          <td className="text-right">{splitCategories.hcs.subtotal.wt}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* Visual Analytics charts row */}
                <div className="grid grid-cols-3 gap-4 border border-black p-3 rounded-lg bg-neutral-50">
                  <div className="h-[120px] flex flex-col justify-between">
                    <span className="text-[9px] font-black uppercase text-center tracking-wider block">Trailer Share (Trips)</span>
                    {chartData.trailerTypes.length === 0 ? (
                      <div className="text-center py-8 text-[9px] text-neutral-400">No logs</div>
                    ) : (
                      <div className="w-full h-[95px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={chartData.trailerTypes} cx="50%" cy="50%" innerRadius={22} outerRadius={38} paddingAngle={3} dataKey="value">
                              <Cell fill="#ef4444" />
                              <Cell fill="#18181b" />
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: 8, padding: 3 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="h-[120px] flex flex-col justify-between border-x border-neutral-300 px-2">
                    <span className="text-[9px] font-black uppercase text-center tracking-wider block">Project wise Trips</span>
                    {chartData.projects.length === 0 ? (
                      <div className="text-center py-8 text-[9px] text-neutral-400">No logs</div>
                    ) : (
                      <div className="w-full h-[95px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.projects} margin={{ top: 5, bottom: 5 }}>
                            <XAxis dataKey="project" tick={{ fontSize: 7 }} interval={0} />
                            <YAxis tick={{ fontSize: 7 }} width={15} />
                            <Tooltip contentStyle={{ fontSize: 8, padding: 3 }} />
                            <Bar dataKey="trips" fill="#ef4444" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="h-[120px] flex flex-col justify-between">
                    <span className="text-[9px] font-black uppercase text-center tracking-wider block">Project wise Volume (m³)</span>
                    {chartData.projects.length === 0 ? (
                      <div className="text-center py-8 text-[9px] text-neutral-400">No logs</div>
                    ) : (
                      <div className="w-full h-[95px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.projects} margin={{ top: 5, bottom: 5 }}>
                            <XAxis dataKey="project" tick={{ fontSize: 7 }} interval={0} />
                            <YAxis tick={{ fontSize: 7 }} width={20} />
                            <Tooltip contentStyle={{ fontSize: 8, padding: 3 }} />
                            <Bar dataKey="volume" fill="#18181b" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>

                {/* Efficiency KPIs */}
                <div className="border border-black bg-neutral-900 text-white p-2.5 grid grid-cols-5 text-center text-[9px] uppercase font-bold">
                  <div>Avg Weight/Trip: <span className="text-red-500 font-extrabold">{metrics.avgWeight} T</span></div>
                  <div>Avg Volume/Trip: <span className="font-extrabold">{metrics.avgVol} m³</span></div>
                  <div>Precast elements: <span className="font-extrabold">{metrics.precastPct}%</span></div>
                  <div>HCS slabs: <span className="font-extrabold">{metrics.hcsPct}%</span></div>
                  <div>Top Project: <span className="text-red-500 font-black">{metrics.topProject}</span></div>
                </div>

                {/* Complete detailed logs sheet table */}
                <div className="border border-black overflow-hidden">
                  <table className="w-full border-collapse text-[8px] text-center">
                    <thead>
                      <tr className="bg-neutral-900 text-white font-black uppercase text-[8px] border-b border-black h-[22px]">
                        <th className="border-r border-neutral-700 w-8">SR</th>
                        <th className="border-r border-neutral-700">Project No</th>
                        <th className="border-r border-neutral-700 text-left px-1.5">Project Name</th>
                        <th className="border-r border-neutral-700">Location</th>
                        <th className="border-r border-neutral-700">Trailer No</th>
                        <th className="border-r border-neutral-700">Element Type</th>
                        <th className="border-r border-neutral-700">Total Qty</th>
                        <th className="border-r border-neutral-700 font-mono">D.N. No</th>
                        <th className="border-r border-neutral-700">Volume</th>
                        <th className="border-r border-neutral-700">Weight</th>
                        <th className="text-left px-1.5">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-300">
                      {filteredDeliveries.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-12 text-center text-slate-500 uppercase font-semibold italic text-[9px]">No delivery note records mapped for this timeline</td>
                        </tr>
                      ) : (
                        filteredDeliveries.map((d, idx) => (
                          <tr key={d.id} className="hover:bg-neutral-50 font-semibold h-[20px]">
                            <td className="border-r border-neutral-300 p-0.5 font-bold">{idx + 1}</td>
                            <td className="border-r border-neutral-300 p-0.5 font-extrabold text-red-600">{d.project_no}</td>
                            <td className="border-r border-neutral-300 p-0.5 text-left truncate max-w-[130px]">{d.project_name}</td>
                            <td className="border-r border-neutral-300 p-0.5">{d.location}</td>
                            <td className="border-r border-neutral-300 p-0.5 font-bold">{d.trailer_plate}</td>
                            <td className="border-r border-neutral-300 p-0.5">{d.element_type}</td>
                            <td className="border-r border-neutral-300 p-0.5 font-extrabold">{d.element_count}</td>
                            <td className="border-r border-neutral-300 p-0.5 font-mono font-medium">{d.dn_no}</td>
                            <td className="border-r border-neutral-300 p-0.5">{d.volume_cum}</td>
                            <td className="border-r border-neutral-300 p-0.5">{d.weight_tons}</td>
                            <td className="p-0.5 text-left truncate max-w-[100px]">{d.remarks}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Page Footer block */}
              <div className="flex justify-between items-center text-[8px] text-neutral-500 border-t border-neutral-300 pt-1 mt-4">
                <span>Report Target Timeline: Logistics Shift (06:00 - 06:00 GMT+4)</span>
                <span className="font-extrabold uppercase tracking-widest text-red-600">
                  Safetech Operations Dashboard Confidential
                </span>
                <span>Generated: {new Date().toLocaleDateString('en-GB')} | Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      </>
      ) : (
        /* ELEMENT TRACEABILITY AUDIT SEARCH & TIMELINE PAGE */
        <div className="space-y-6 animate-fadeIn">
          {/* Audit Lookup Searchbar */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4 no-print">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-white/5">
              Traceability Search Directory
            </h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search element trace codes (E.g. 00-WL-P2544P-002)..."
                  className="w-full px-4 py-2.5 rounded-xl glowing-input text-xs font-mono font-bold"
                  value={searchTraceCode}
                  onChange={e => setSearchTraceCode(e.target.value)}
                />
              </div>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-gradient-to-br from-red-500 to-red-700 text-white font-extrabold text-xs uppercase rounded-xl btn-interactive shadow-lg"
              >
                🖨️ Print Audit Log Sheet
              </button>
            </div>
          </div>

          {/* Trace Results list */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Side: Audit Index list */}
            <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4 no-print max-h-[500px] overflow-y-auto">
              <span className="text-[10px] uppercase font-black text-slate-500 block">Registered audit traces</span>
              <div className="space-y-2">
                {traces
                  .filter(t => !searchTraceCode || t.element_code.toLowerCase().includes(searchTraceCode.toLowerCase().trim()))
                  .map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSearchTraceCode(t.element_code)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex justify-between items-center ${
                        searchTraceCode === t.element_code
                          ? 'bg-red-500/10 text-red-500 border-red-500/30'
                          : 'bg-slate-50 dark:bg-black/10 border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span className="font-mono font-bold">{t.element_code}</span>
                      <span className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-slate-200 dark:bg-white/5 rounded text-slate-500">
                        {t.delivery_timestamp !== 'Pending' ? 'Delivered' : 'In Progress'}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Right Side: Visual printable Audit Timeline Certificate */}
            <div className="lg:col-span-2 flex justify-center print-area">
              {(() => {
                const activeTrace = traces.find(t => t.element_code === searchTraceCode) || traces[0]
                if (!activeTrace) return (
                  <div className="glass-panel p-16 rounded-2xl border border-slate-200 dark:border-white/5 text-center text-slate-500">
                    No active traceability audits found.
                  </div>
                )

                return (
                  <div className="w-[210mm] h-[297mm] bg-white text-black p-10 font-sans border border-neutral-300 shadow-2xl relative flex flex-col justify-between text-xs box-border overflow-hidden print:border-none print:shadow-none">
                    
                    <div className="space-y-6">
                      {/* Logo header */}
                      <div className="flex justify-between items-center border-b-2 border-black pb-3">
                        <div className="flex items-center gap-3">
                          <img src="/safetech_logo.png" alt="Logo" className="w-9 h-9 object-contain" />
                          <div className="flex flex-col leading-none">
                            <span className="font-black text-sm tracking-tight">SAFETECH PRECAST</span>
                            <span className="text-[8px] text-neutral-500 uppercase font-black">Quality Assurance Audit</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-1 bg-black text-white text-[9px] font-black uppercase rounded">
                            TRACEABILITY AUDIT CERTIFICATE
                          </span>
                        </div>
                      </div>

                      {/* Element Code Banner */}
                      <div className="bg-neutral-100 p-4 text-center border border-neutral-300 space-y-1">
                        <span className="text-[8.5px] uppercase font-black text-neutral-500 block">Unique ID Tracking Code</span>
                        <strong className="text-xl font-mono tracking-widest text-red-600 block">{activeTrace.element_code}</strong>
                        <span className="text-[9px] text-neutral-600 font-bold block">Status: verified factory lifecycle checklist</span>
                      </div>

                      {/* Timeline flow */}
                      <div className="space-y-4">
                        <span className="text-[10.5px] uppercase font-black text-neutral-900 border-b border-black pb-1 block">
                          Traceability chronological log logs
                        </span>

                        <div className="relative border-l border-neutral-300 pl-6 ml-3 space-y-6 text-xs">
                          {[
                            { key: 'planning_timestamp', label: 'Stage 1: Design & Planning Scheduled', desc: 'Element specifications, quantity counts, assigned casting bed registered in planning schedule.', icon: '📝' },
                            { key: 'casting_timestamp', label: 'Stage 2: Production Casting & Pouring', desc: 'Concrete slump verification, volumetric pour casting, batch card logged by bed supervisor.', icon: '🏗️' },
                            { key: 'qc_timestamp', label: 'Stage 3: QC pre-pour inspection release', desc: 'Cover spacers checkout, embedded details alignment, dimensions checklist verified by QA inspector.', icon: '🔍' },
                            { key: 'curing_timestamp', label: 'Stage 4: Curing & strength development', desc: 'Active water curing starts. estimated strength exceeds 70% design target before lifting.', icon: '⏱️' },
                            { key: 'stockyard_timestamp', label: 'Stage 5: Yard movement & bay coordinate storage', desc: 'Element moved via gantry crane to target bay coordinate storage block.', icon: '📦' },
                            { key: 'loading_timestamp', label: 'Stage 6: Logistics Loading clearance', desc: 'Committed to trailer plate head, securing pins, load-carrying capacity check completed.', icon: '🏗️' },
                            { key: 'dispatch_timestamp', label: 'Stage 7: Logistics departure Gate Out', desc: 'Trip dispatched, driver delivery note assigned, security gate pass compiled.', icon: '🚚' },
                            { key: 'delivery_timestamp', label: 'Stage 8: Customer Site receipt verification', desc: 'Truck arrived at site location, signatures captured, delivery remarks registered.', icon: '🏁' }
                          ].map((s, idx) => {
                            const val = activeTrace[s.key] || 'Pending'
                            const done = val && val !== 'Pending'

                            return (
                              <div key={s.key} className="relative">
                                {/* Dot indicator */}
                                <span className={`absolute -left-[30px] top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center text-[8px] font-bold ${
                                  done ? 'border-emerald-600 text-emerald-600' : 'border-neutral-300 text-neutral-400'
                                }`}>
                                  {done ? '✓' : idx + 1}
                                </span>
                                
                                <div className="flex justify-between font-bold text-[11px]">
                                  <span className={done ? 'text-neutral-900 font-extrabold' : 'text-neutral-400'}>
                                    {s.icon} {s.label}
                                  </span>
                                  <span className={done ? 'text-emerald-600 font-mono' : 'text-neutral-400 italic'}>
                                    {done ? val : 'Pending'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">{s.desc}</p>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                    </div>

                    {/* Footer signoff stamps */}
                    <div className="border-t border-neutral-300 pt-4 flex justify-between items-end text-[8.5px] text-neutral-500 mt-6">
                      <div className="space-y-4">
                        <span>Lead QA Inspector Certification</span>
                        <div className="border-t border-dashed border-neutral-400 w-36 pt-1">Signature & Date Stamp</div>
                      </div>
                      <div className="text-center font-bold text-red-600 uppercase tracking-wider">
                        Safetech Operations Trace system
                      </div>
                      <div className="space-y-4 text-right">
                        <span>Plant Manager Endorsement</span>
                        <div className="border-t border-dashed border-neutral-400 w-36 pt-1">Signature & Date Stamp</div>
                      </div>
                    </div>

                  </div>
                )
              })()}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
