import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchRows } from '../lib/erp/db'
import { printSectionsDoc, exportCsv, exportExcel, type ReportSection } from '../lib/erp/printDoc'
import { statusChipClass } from '../lib/erp/uiHelpers'

// All operational reports derive live from the module tables and respect the
// 06:00 GMT+4 reporting-day boundary for timestamped records.

type ReportKey =
  | 'daily' | 'weekly' | 'monthly' | 'dpr' | 'dtpp' | 'production' | 'daily-production'
  | 'productivity' | 'yard' | 'qa' | 'management' | 'drawings' | 'planning'
  | 'weekly-planning' | 'monthly-planning'

const REPORTS: { key: ReportKey; title: string; icon: string; desc: string }[] = [
  { key: 'daily', title: 'Daily Report', icon: '📆', desc: 'Full operations day (06:00–06:00 GMT+4)' },
  { key: 'weekly', title: 'Weekly Report', icon: '🗓️', desc: '7-day operations summary' },
  { key: 'monthly', title: 'Monthly Report', icon: '📅', desc: 'Calendar month summary' },
  { key: 'dpr', title: 'DPR', icon: '📈', desc: 'Daily Progress Report — production vs BOQ' },
  { key: 'dtpp', title: 'DTPP', icon: '🚛', desc: 'Daily Transport & Production Plan' },
  { key: 'production', title: 'Production Report', icon: '⚙️', desc: 'Castings, concrete & bed usage' },
  { key: 'daily-production', title: 'Daily Production', icon: '🏭', desc: 'Single-day production detail' },
  { key: 'productivity', title: 'Productivity', icon: '⚡', desc: 'Output per bed & shift' },
  { key: 'yard', title: 'Yard Report', icon: '🏗️', desc: 'Inventory, zones & movements' },
  { key: 'qa', title: 'QA Report', icon: '🛡️', desc: 'Inspections, NCRs & punch list' },
  { key: 'management', title: 'Management Dashboard', icon: '👔', desc: 'Cross-department KPI summary' },
  { key: 'drawings', title: 'Drawing Reports', icon: '📐', desc: 'Register status & revisions' },
  { key: 'planning', title: 'Planning Reports', icon: '🗂️', desc: 'Schedule & element pipeline' },
  { key: 'weekly-planning', title: 'Weekly Planning', icon: '📋', desc: 'Next 7 days casting plan' },
  { key: 'monthly-planning', title: 'Monthly Planning', icon: '🗃️', desc: 'Month casting & delivery plan' }
]

type Db = Record<string, any[]>
const TABLES = [
  'deliveries', 'casting_schedule', 'elements', 'production_casting', 'stockyard_inventory',
  'yard_movement', 'qc_inspections', 'post_casting_inspections', 'dimensional_inspections',
  'finishing_inspections', 'incoming_inspections', 'ncr_register', 'punch_list', 'gate_passes',
  'delivery_schedule', 'allocations', 'drawings', 'drawing_revisions', 'projects', 'boq_items',
  'fleet_status', 'trailers', 'concrete_batches', 'trips', 'storage_zones', 'approvals'
]

// ── date helpers (reporting day = 06:00 GMT+4 → next 06:00) ────────────────
function addDays(d: string, n: number): string {
  const dt = new Date(`${d}T12:00:00Z`)
  dt.setUTCDate(dt.getUTCDate() + n)
  return dt.toISOString().slice(0, 10)
}
function inReportingDay(ts: string, day: string): boolean {
  if (!ts) return false
  const start = new Date(`${day}T06:00:00+04:00`).getTime()
  const end = start + 24 * 3600 * 1000
  const t = new Date(ts).getTime()
  return t >= start && t < end
}
function inRange(dateStr: string, from: string, to: string): boolean {
  return !!dateStr && dateStr >= from && dateStr <= to
}
const sum = (rows: any[], k: string) => Number(rows.reduce((a, r) => a + (Number(r[k]) || 0), 0).toFixed(2))

type Built = { kpis: { label: string; value: string | number }[]; sections: ReportSection[]; meta: string[] }

function buildReport(key: ReportKey, db: Db, day: string): Built {
  const projects = db.projects || []
  const projName = (no: string) => projects.find(p => p.project_no === no)?.project_name || no

  const weekFrom = addDays(day, -6)
  const monthFrom = `${day.slice(0, 7)}-01`
  const weekTo7 = addDays(day, 6)
  const monthTo = addDays(monthFrom, 34).slice(0, 7) + '-01'

  const deliveriesFor = (from: string, to: string) => (db.deliveries || []).filter(d =>
    d.delivery_timestamp ? (new Date(d.delivery_timestamp).getTime() >= new Date(`${from}T06:00:00+04:00`).getTime() && new Date(d.delivery_timestamp).getTime() < new Date(`${addDays(to, 1)}T06:00:00+04:00`).getTime()) : inRange(d.delivery_date, from, to))

  const delCols = [
    { key: 'dn_no', label: 'DN No' }, { key: 'project_no', label: 'Project' }, { key: 'project_name', label: 'Name' },
    { key: 'element_type', label: 'Type' }, { key: 'element_count', label: 'Pcs' },
    { key: 'volume_cum', label: 'Vol m³' }, { key: 'weight_tons', label: 'Wt T' }, { key: 'delivery_date', label: 'Date' }
  ]
  const castCols = [
    { key: 'schedule_date', label: 'Date' }, { key: 'shift', label: 'Shift' }, { key: 'bed', label: 'Bed' },
    { key: 'project_no', label: 'Project' }, { key: 'drawing_no', label: 'Drawing' }, { key: 'qty', label: 'Qty' }, { key: 'status', label: 'Status' }
  ]
  const ncrCols = [
    { key: 'ncr_no', label: 'NCR' }, { key: 'ncr_date', label: 'Date' }, { key: 'project_no', label: 'Project' },
    { key: 'severity', label: 'Severity' }, { key: 'description', label: 'Description' }, { key: 'status', label: 'Status' }
  ]

  const projAgg = (dels: any[]) => {
    const map = new Map<string, any>()
    for (const d of dels) {
      const cur = map.get(d.project_no) || { project_no: d.project_no, project_name: projName(d.project_no), trips: 0, pcs: 0, volume: 0, weight: 0 }
      cur.trips++; cur.pcs += Number(d.element_count) || 0
      cur.volume = Number((cur.volume + (Number(d.volume_cum) || 0)).toFixed(2))
      cur.weight = Number((cur.weight + (Number(d.weight_tons) || 0)).toFixed(2))
      map.set(d.project_no, cur)
    }
    return Array.from(map.values())
  }
  const projAggCols = [
    { key: 'project_no', label: 'Project' }, { key: 'project_name', label: 'Name' }, { key: 'trips', label: 'Trips' },
    { key: 'pcs', label: 'Pcs' }, { key: 'volume', label: 'Vol m³' }, { key: 'weight', label: 'Wt T' }
  ]

  switch (key) {
    case 'daily': {
      const dels = (db.deliveries || []).filter(d => inReportingDay(d.delivery_timestamp, day) || d.delivery_date === day)
      const casts = (db.casting_schedule || []).filter(c => c.schedule_date === day)
      const ncrs = (db.ncr_register || []).filter(n => n.ncr_date === day)
      const gps = (db.gate_passes || []).filter(g => g.gp_date === day)
      const qc = (db.post_casting_inspections || []).filter(q => q.inspection_date === day)
      return {
        meta: [`Reporting day: ${day} 06:00 → ${addDays(day, 1)} 06:00 (GMT+4)`],
        kpis: [
          { label: 'Delivery Trips', value: dels.length },
          { label: 'Pieces Shipped', value: sum(dels, 'element_count') },
          { label: 'Volume m³', value: sum(dels, 'volume_cum') },
          { label: 'Castings', value: casts.length },
          { label: 'Gate Passes', value: gps.length },
          { label: 'NCRs Raised', value: ncrs.length }
        ],
        sections: [
          { heading: 'Deliveries (by trip)', columns: delCols, rows: dels },
          { heading: 'Delivery Summary by Project', columns: projAggCols, rows: projAgg(dels) },
          { heading: 'Casting Activity', columns: castCols, rows: casts },
          { heading: 'Post-Casting Inspections', columns: [{ key: 'element_code', label: 'Element' }, { key: 'surface_finish', label: 'Finish' }, { key: 'honeycombing', label: 'Honeycomb' }, { key: 'result', label: 'Result' }, { key: 'inspector', label: 'Inspector' }], rows: qc },
          { heading: 'Gate Passes', columns: [{ key: 'gp_no', label: 'GP No' }, { key: 'trailer_plate', label: 'Trailer' }, { key: 'driver_name', label: 'Driver' }, { key: 'project_no', label: 'Project' }, { key: 'time_out', label: 'Out' }, { key: 'status', label: 'Status' }], rows: gps },
          { heading: 'NCRs Raised', columns: ncrCols, rows: ncrs }
        ]
      }
    }
    case 'weekly': case 'monthly': {
      const from = key === 'weekly' ? weekFrom : monthFrom
      const dels = deliveriesFor(from, day)
      const casts = (db.casting_schedule || []).filter(c => inRange(c.schedule_date, from, day))
      const ncrs = (db.ncr_register || []).filter(n => inRange(n.ncr_date, from, day))
      const byDay = new Map<string, any>()
      for (const d of dels) {
        const dd = d.delivery_date
        const cur = byDay.get(dd) || { date: dd, trips: 0, pcs: 0, volume: 0 }
        cur.trips++; cur.pcs += Number(d.element_count) || 0
        cur.volume = Number((cur.volume + (Number(d.volume_cum) || 0)).toFixed(2))
        byDay.set(dd, cur)
      }
      return {
        meta: [`Period: ${from} → ${day} (reporting days 06:00 GMT+4)`],
        kpis: [
          { label: 'Trips', value: dels.length },
          { label: 'Pieces', value: sum(dels, 'element_count') },
          { label: 'Volume m³', value: sum(dels, 'volume_cum') },
          { label: 'Weight T', value: sum(dels, 'weight_tons') },
          { label: 'Castings', value: casts.length },
          { label: 'NCRs', value: ncrs.length }
        ],
        sections: [
          { heading: 'Daily Throughput', columns: [{ key: 'date', label: 'Date' }, { key: 'trips', label: 'Trips' }, { key: 'pcs', label: 'Pcs' }, { key: 'volume', label: 'Vol m³' }], rows: Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)) },
          { heading: 'Project Summary', columns: projAggCols, rows: projAgg(dels) },
          { heading: 'Casting Schedule in Period', columns: castCols, rows: casts },
          { heading: 'NCRs in Period', columns: ncrCols, rows: ncrs }
        ]
      }
    }
    case 'dpr': {
      const els = db.elements || []
      const castToday = els.filter(e => e.cast_date === day)
      const perProject = projects.filter(p => p.active !== false).map(p => {
        const pe = els.filter(e => e.project_no === p.project_no)
        const castCum = pe.filter(e => ['Cast', 'Curing', 'Ready', 'Loaded', 'Dispatched', 'Delivered'].includes(e.status))
        const boqQty = sum((db.boq_items || []).filter(b => b.project_no === p.project_no), 'qty')
        return {
          project_no: p.project_no, project_name: p.project_name,
          planned: pe.length, cast_cum: castCum.length,
          cast_vol: sum(castCum, 'volume_cum'),
          boq_qty: boqQty || '—',
          progress: pe.length ? `${Math.round(castCum.length / pe.length * 100)}%` : '—'
        }
      })
      const delsToday = (db.deliveries || []).filter(d => inReportingDay(d.delivery_timestamp, day) || d.delivery_date === day)
      return {
        meta: [`Progress as of ${day}`],
        kpis: [
          { label: 'Elements Cast Today', value: castToday.length },
          { label: 'Volume Cast m³', value: sum(castToday, 'volume_cum') },
          { label: 'Deliveries Today', value: delsToday.length },
          { label: 'Active Projects', value: perProject.length }
        ],
        sections: [
          { heading: 'Today’s Castings', columns: [{ key: 'element_code', label: 'Element' }, { key: 'project_no', label: 'Project' }, { key: 'drawing_no', label: 'Drawing' }, { key: 'element_type', label: 'Type' }, { key: 'volume_cum', label: 'Vol m³' }, { key: 'bed', label: 'Bed' }], rows: castToday },
          { heading: 'Cumulative Progress by Project', columns: [{ key: 'project_no', label: 'Project' }, { key: 'project_name', label: 'Name' }, { key: 'planned', label: 'Planned Els' }, { key: 'cast_cum', label: 'Cast (cum)' }, { key: 'cast_vol', label: 'Vol m³' }, { key: 'boq_qty', label: 'BOQ Qty' }, { key: 'progress', label: 'Progress' }], rows: perProject },
          { heading: 'Today’s Deliveries', columns: delCols, rows: delsToday }
        ]
      }
    }
    case 'dtpp': {
      const casts = (db.casting_schedule || []).filter(c => c.schedule_date === day && c.status !== 'Cancelled')
      const delSch = (db.delivery_schedule || []).filter(s => s.schedule_date === day)
      const allocs = (db.allocations || []).filter(a => a.alloc_date === day)
      return {
        meta: [`Plan for ${day} — issue before shift start`],
        kpis: [
          { label: 'Castings Planned', value: casts.length },
          { label: 'Elements to Cast', value: sum(casts, 'qty') },
          { label: 'Delivery Slots', value: delSch.length },
          { label: 'Trailers Allocated', value: allocs.length }
        ],
        sections: [
          { heading: 'Production Plan (Castings)', columns: castCols, rows: casts },
          { heading: 'Transport Plan (Deliveries)', columns: [{ key: 'project_no', label: 'Project' }, { key: 'project_name', label: 'Name' }, { key: 'element_type', label: 'Type' }, { key: 'qty', label: 'Qty' }, { key: 'trailer_type_req', label: 'Trailer Type' }, { key: 'trips_est', label: 'Trips' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }], rows: delSch },
          { heading: 'Fleet Allocation', columns: [{ key: 'dispatch_no', label: 'Dispatch' }, { key: 'trailer_plate', label: 'Trailer' }, { key: 'driver_name', label: 'Driver' }, { key: 'project_no', label: 'Project' }, { key: 'shift', label: 'Shift' }, { key: 'status', label: 'Status' }], rows: allocs }
        ]
      }
    }
    case 'production': case 'daily-production': {
      const from = key === 'production' ? weekFrom : day
      const casts = (db.production_casting || []).filter(c => inRange(c.cast_date, from, day))
      const batches = (db.concrete_batches || []).filter(b => inRange(b.batch_date, from, day))
      const byGrade = new Map<string, any>()
      for (const b of batches) {
        const cur = byGrade.get(b.grade) || { grade: b.grade, batches: 0, volume: 0 }
        cur.batches++; cur.volume = Number((cur.volume + (Number(b.volume_cum) || 0)).toFixed(2))
        byGrade.set(b.grade, cur)
      }
      return {
        meta: [`Period: ${from} → ${day}`],
        kpis: [
          { label: 'Casting Logs', value: casts.length },
          { label: 'Volume m³', value: sum(casts, 'volume_cum') },
          { label: 'Concrete Batches', value: batches.length },
          { label: 'Batch Volume m³', value: sum(batches, 'volume_cum') }
        ],
        sections: [
          { heading: 'Casting Log', columns: [{ key: 'cast_date', label: 'Date' }, { key: 'shift', label: 'Shift' }, { key: 'bed_mould_id', label: 'Bed' }, { key: 'concrete_grade', label: 'Grade' }, { key: 'batch_number', label: 'Batch' }, { key: 'volume_cum', label: 'Vol m³' }, { key: 'qc_status', label: 'QC' }], rows: casts },
          { heading: 'Concrete Consumption by Grade', columns: [{ key: 'grade', label: 'Grade' }, { key: 'batches', label: 'Batches' }, { key: 'volume', label: 'Volume m³' }], rows: Array.from(byGrade.values()) },
          { heading: 'Concrete Batch Log', columns: [{ key: 'batch_no', label: 'Batch' }, { key: 'batch_date', label: 'Date' }, { key: 'grade', label: 'Grade' }, { key: 'slump_mm', label: 'Slump' }, { key: 'cube_ref', label: 'Cube Ref' }, { key: 'status', label: 'Status' }], rows: batches }
        ]
      }
    }
    case 'productivity': {
      const casts = (db.casting_schedule || []).filter(c => c.status === 'Completed')
      const byBed = new Map<string, any>()
      for (const c of casts) {
        const cur = byBed.get(c.bed) || { bed: c.bed, castings: 0, elements: 0 }
        cur.castings++; cur.elements += Number(c.qty) || 0
        byBed.set(c.bed, cur)
      }
      const byShift = new Map<string, any>()
      for (const c of casts) {
        const cur = byShift.get(c.shift) || { shift: c.shift, castings: 0, elements: 0 }
        cur.castings++; cur.elements += Number(c.qty) || 0
        byShift.set(c.shift, cur)
      }
      return {
        meta: ['All completed castings on record'],
        kpis: [
          { label: 'Completed Castings', value: casts.length },
          { label: 'Elements Produced', value: sum(casts, 'qty') },
          { label: 'Beds In Use', value: byBed.size }
        ],
        sections: [
          { heading: 'Output per Bed / Mould', columns: [{ key: 'bed', label: 'Bed' }, { key: 'castings', label: 'Castings' }, { key: 'elements', label: 'Elements' }], rows: Array.from(byBed.values()) },
          { heading: 'Output per Shift', columns: [{ key: 'shift', label: 'Shift' }, { key: 'castings', label: 'Castings' }, { key: 'elements', label: 'Elements' }], rows: Array.from(byShift.values()) }
        ]
      }
    }
    case 'yard': {
      const inv = db.stockyard_inventory || []
      const byStatus = new Map<string, number>()
      for (const i of inv) byStatus.set(i.status, (byStatus.get(i.status) || 0) + 1)
      return {
        meta: [`Inventory snapshot as of ${day}`],
        kpis: [
          { label: 'Elements in Yard', value: inv.length },
          { label: 'Ready', value: byStatus.get('Ready') || 0 },
          { label: 'Curing', value: byStatus.get('Curing') || 0 },
          { label: 'Rejected / Hold', value: byStatus.get('Rejected') || 0 }
        ],
        sections: [
          { heading: 'Inventory by Status', columns: [{ key: 'status', label: 'Status' }, { key: 'count', label: 'Count' }], rows: Array.from(byStatus.entries()).map(([status, count]) => ({ status, count })) },
          { heading: 'Storage Zones Utilization', columns: [{ key: 'zone_name', label: 'Zone' }, { key: 'bays', label: 'Bays' }, { key: 'capacity_pcs', label: 'Capacity' }, { key: 'current_pcs', label: 'Current' }], rows: db.storage_zones || [] },
          { heading: 'Element Inventory', columns: [{ key: 'element_code', label: 'Element' }, { key: 'project_no', label: 'Project' }, { key: 'element_type', label: 'Type' }, { key: 'bay_location', label: 'Bay' }, { key: 'status', label: 'Status' }, { key: 'curing_days', label: 'Curing d' }], rows: inv },
          { heading: 'Movement Log', columns: [{ key: 'element_code', label: 'Element' }, { key: 'from_bay', label: 'From' }, { key: 'to_bay', label: 'To' }, { key: 'crane', label: 'Crane' }, { key: 'operator', label: 'Operator' }, { key: 'movement_time', label: 'Time' }], rows: db.yard_movement || [] }
        ]
      }
    }
    case 'qa': {
      const pre = db.qc_inspections || []
      const post = db.post_casting_inspections || []
      const dim = db.dimensional_inspections || []
      const ncrs = db.ncr_register || []
      const punch = db.punch_list || []
      const passRate = (rows: any[], field: string, pass: string[]) =>
        rows.length ? `${Math.round(rows.filter(r => pass.includes(String(r[field]))).length / rows.length * 100)}%` : '—'
      return {
        meta: [`Quality status as of ${day}`],
        kpis: [
          { label: 'Pre-Pour Pass', value: passRate(pre, 'qc_result', ['PASSED']) },
          { label: 'Post-Cast Pass', value: passRate(post, 'result', ['Accepted']) },
          { label: 'Dimensional Pass', value: passRate(dim, 'result', ['Pass']) },
          { label: 'Open NCRs', value: ncrs.filter(n => n.status !== 'Closed').length },
          { label: 'Open Punch Items', value: punch.filter(p => p.status !== 'Closed').length }
        ],
        sections: [
          { heading: 'NCR Register', columns: ncrCols, rows: ncrs },
          { heading: 'Pre-Pour Inspections', columns: [{ key: 'element_code', label: 'Element' }, { key: 'inspector', label: 'Inspector' }, { key: 'concrete_test_ref', label: 'Test Ref' }, { key: 'qc_result', label: 'Result' }], rows: pre },
          { heading: 'Dimensional Checks', columns: [{ key: 'element_code', label: 'Element' }, { key: 'length_dev_mm', label: 'ΔL' }, { key: 'width_dev_mm', label: 'ΔW' }, { key: 'diagonal_dev_mm', label: 'ΔDiag' }, { key: 'result', label: 'Result' }], rows: dim },
          { heading: 'Punch List', columns: [{ key: 'item_no', label: 'Item' }, { key: 'project_no', label: 'Project' }, { key: 'description', label: 'Description' }, { key: 'due_date', label: 'Due' }, { key: 'status', label: 'Status' }], rows: punch },
          { heading: 'Incoming Material Inspections', columns: [{ key: 'inspection_date', label: 'Date' }, { key: 'material', label: 'Material' }, { key: 'supplier', label: 'Supplier' }, { key: 'result', label: 'Result' }], rows: db.incoming_inspections || [] }
        ]
      }
    }
    case 'management': {
      const els = db.elements || []
      const dels = db.deliveries || []
      const funnel = ['Planned', 'QR Generated', 'Cast', 'Curing', 'Ready', 'Loaded', 'Dispatched', 'Delivered', 'Rejected']
        .map(s => ({ status: s, count: els.filter(e => e.status === s).length }))
      return {
        meta: [`Executive summary as of ${day}`],
        kpis: [
          { label: 'Active Projects', value: projects.filter(p => p.active !== false && p.status !== 'Completed').length },
          { label: 'Elements Tracked', value: els.length },
          { label: 'Total Shipped m³', value: sum(dels, 'volume_cum') },
          { label: 'Fleet Size', value: (db.trailers || []).length },
          { label: 'Open NCRs', value: (db.ncr_register || []).filter(n => n.status !== 'Closed').length },
          { label: 'Pending Approvals', value: (db.approvals || []).filter(a => a.status === 'Pending').length }
        ],
        sections: [
          { heading: 'Element Lifecycle Funnel', columns: [{ key: 'status', label: 'Stage' }, { key: 'count', label: 'Elements' }], rows: funnel },
          { heading: 'Delivery Totals by Project', columns: projAggCols, rows: projAgg(dels) },
          { heading: 'Pending Approvals', columns: [{ key: 'req_date', label: 'Date' }, { key: 'type', label: 'Type' }, { key: 'reference', label: 'Ref' }, { key: 'requested_by', label: 'By' }, { key: 'approver', label: 'Approver' }], rows: (db.approvals || []).filter(a => a.status === 'Pending') },
          { heading: 'Project Register', columns: [{ key: 'project_no', label: 'Project' }, { key: 'project_name', label: 'Name' }, { key: 'location', label: 'Location' }, { key: 'status', label: 'Status' }], rows: projects }
        ]
      }
    }
    case 'drawings': {
      const dwgs = db.drawings || []
      const byStatus = new Map<string, number>()
      for (const d of dwgs) byStatus.set(d.status, (byStatus.get(d.status) || 0) + 1)
      return {
        meta: [`Drawing control status as of ${day}`],
        kpis: [
          { label: 'Total Drawings', value: dwgs.length },
          { label: 'Approved / IFC', value: dwgs.filter(d => ['Approved', 'IFC'].includes(d.status)).length },
          { label: 'For Approval', value: byStatus.get('For Approval') || 0 },
          { label: 'Superseded', value: byStatus.get('Superseded') || 0 }
        ],
        sections: [
          { heading: 'Register by Status', columns: [{ key: 'status', label: 'Status' }, { key: 'count', label: 'Drawings' }], rows: Array.from(byStatus.entries()).map(([status, count]) => ({ status, count })) },
          { heading: 'Drawing Register', columns: [{ key: 'drawing_no', label: 'Drawing' }, { key: 'project_no', label: 'Project' }, { key: 'title', label: 'Title' }, { key: 'type', label: 'Type' }, { key: 'revision', label: 'Rev' }, { key: 'status', label: 'Status' }], rows: dwgs },
          { heading: 'Revision History', columns: [{ key: 'drawing_no', label: 'Drawing' }, { key: 'revision', label: 'Rev' }, { key: 'rev_date', label: 'Date' }, { key: 'description', label: 'Change' }, { key: 'status', label: 'Status' }], rows: db.drawing_revisions || [] }
        ]
      }
    }
    case 'planning': case 'weekly-planning': case 'monthly-planning': {
      const to = key === 'weekly-planning' ? weekTo7 : key === 'monthly-planning' ? addDays(monthFrom, 40) : addDays(day, 30)
      const casts = (db.casting_schedule || []).filter(c => inRange(c.schedule_date, key === 'monthly-planning' ? monthFrom : day, to))
      const els = db.elements || []
      return {
        meta: [`Plan window: ${key === 'monthly-planning' ? monthFrom : day} → ${to}`],
        kpis: [
          { label: 'Scheduled Castings', value: casts.filter(c => c.status !== 'Cancelled').length },
          { label: 'Elements in Plan', value: sum(casts.filter(c => c.status !== 'Cancelled'), 'qty') },
          { label: 'Awaiting QR', value: els.filter(e => e.status === 'Planned').length },
          { label: 'QR Generated', value: els.filter(e => e.status === 'QR Generated').length }
        ],
        sections: [
          { heading: 'Casting Plan', columns: castCols, rows: casts },
          { heading: 'Delivery Plan', columns: [{ key: 'schedule_date', label: 'Date' }, { key: 'project_no', label: 'Project' }, { key: 'element_type', label: 'Type' }, { key: 'qty', label: 'Qty' }, { key: 'trailer_type_req', label: 'Trailer' }, { key: 'status', label: 'Status' }], rows: (db.delivery_schedule || []) },
          { heading: 'Elements Awaiting QR Generation', columns: [{ key: 'element_code', label: 'Element' }, { key: 'project_no', label: 'Project' }, { key: 'drawing_no', label: 'Drawing' }, { key: 'planned_cast_date', label: 'Planned' }], rows: els.filter(e => e.status === 'Planned') }
        ]
      }
    }
  }
}

export default function ReportsHubPage() {
  const [params, setParams] = useSearchParams()
  const reportKey = (params.get('report') as ReportKey) || 'daily'
  const [db, setDb] = useState<Db>({})
  const [loading, setLoading] = useState(true)
  const [day, setDay] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const results = await Promise.all(TABLES.map(t => fetchRows(t)))
      const map: Db = {}
      TABLES.forEach((t, i) => { map[t] = results[i] })
      setDb(map)
      // operational "today" = latest data day, so demo data stays meaningful
      const dates = (map.deliveries || []).map(d => d.delivery_date).filter(Boolean).sort()
      setDay(dates[dates.length - 1] || new Date().toISOString().slice(0, 10))
      setLoading(false)
    }
    load()
  }, [])

  const active = REPORTS.find(r => r.key === reportKey) || REPORTS[0]
  const built = useMemo(() => (loading || !day) ? null : buildReport(active.key, db, day), [active.key, db, day, loading])

  const allRows = built ? built.sections.flatMap(s => s.rows.map(r => ({ __section: s.heading, ...r }))) : []
  const allCols = built ? [{ key: '__section', label: 'Section' }, ...built.sections.flatMap(s => s.columns).filter((c, i, a) => a.findIndex(x => x.key === c.key) === i)] : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5 gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Reports <span className="text-red-500 font-light">Hub</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Auto-generated operational reports — reporting day 06:00 → 06:00 GMT+4</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
            Report Date
            <input type="date" value={day} onChange={e => setDay(e.target.value)} className="glowing-input px-3 py-2 rounded-xl text-xs" />
          </label>
          <button onClick={() => built && exportCsv(`${active.key}-report.csv`, allCols, allRows)} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">📤 CSV</button>
          <button onClick={() => built && exportExcel(`${active.key}-report.xls`, active.title, allCols, allRows)} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">📊 Excel</button>
          <button onClick={() => built && printSectionsDoc({ title: active.title, subtitle: active.desc, meta: built.meta, kpis: built.kpis, sections: built.sections, paper: 'A4', landscape: built.sections.some(s => s.columns.length > 7), previewOnly: true })} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">👁 Preview</button>
          <button onClick={() => built && printSectionsDoc({ title: active.title, subtitle: active.desc, meta: built.meta, kpis: built.kpis, sections: built.sections, paper: 'A4', landscape: built.sections.some(s => s.columns.length > 7) })} className="px-3.5 py-2 bg-gradient-to-br from-red-500 to-red-700 text-white text-[10px] font-extrabold uppercase rounded-xl btn-interactive">🖨 Print / PDF</button>
        </div>
      </div>

      {/* Report picker */}
      <div className="glass-panel rounded-2xl p-3 border border-slate-200 dark:border-white/5 flex flex-wrap gap-1.5 no-print">
        {REPORTS.map(r => (
          <button
            key={r.key}
            onClick={() => setParams({ report: r.key })}
            title={r.desc}
            className={`px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase transition-all ${r.key === active.key
              ? 'bg-red-500/15 text-red-500 border border-red-500/20 shadow-sm shadow-red-500/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/5 border border-transparent'}`}
          >
            {r.icon} {r.title}
          </button>
        ))}
      </div>

      {loading || !built ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold animate-pulse">Building {active.title.toLowerCase()}…</div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {built.kpis.map(k => (
              <div key={k.label} className="glass-card-3d rounded-2xl p-4 text-center">
                <div className="text-2xl font-black glow-text-red">{k.value}</div>
                <div className="text-[8.5px] uppercase font-black text-slate-500 mt-1 tracking-wider">{k.label}</div>
              </div>
            ))}
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase">{built.meta.join(' • ')}</div>

          {/* Sections */}
          {built.sections.map(s => (
            <div key={s.heading} className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/60 dark:bg-black/20">
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-600 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block mr-2" />{s.heading}
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase">{s.rows.length} record(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold text-[9px] uppercase border-b border-slate-100 dark:border-white/5">
                      {s.columns.map(c => <th key={c.key} className="py-2 px-3 whitespace-nowrap">{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                    {s.rows.length === 0 ? (
                      <tr><td colSpan={s.columns.length} className="py-6 text-center text-slate-500 font-semibold uppercase text-[10px]">No records for this period</td></tr>
                    ) : s.rows.slice(0, 40).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5">
                        {s.columns.map(c => (
                          <td key={c.key} className="py-1.5 px-3 max-w-[180px] truncate font-semibold">
                            {/status|result/i.test(c.key)
                              ? <span className={`inline-block px-2 py-0.5 rounded-md border text-[9px] font-black uppercase ${statusChipClass(String(r[c.key]))}`}>{String(r[c.key] ?? '—')}</span>
                              : String(r[c.key] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {s.rows.length > 40 && <div className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase border-t border-slate-100 dark:border-white/5">Showing 40 of {s.rows.length} — print/export includes all records</div>}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
