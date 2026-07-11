import React, { useEffect, useMemo, useState } from 'react'
import { fetchRows, insertAudited, updateAudited, nowStamp, todayGulf, getSettings } from '../lib/erp/db'
import { openPrintWindow, exportCsv } from '../lib/erp/printDoc'
import { qrSvg } from '../lib/qr'
import { statusChipClass } from '../lib/erp/uiHelpers'
import { usePermissions } from '../lib/erp/usePermissions'
import { useAuth } from '../lib/useAuth'

// NOTE: Gate passes are their own register. This page never reads or writes
// the protected gate security flags on dispatch_log (diesel_status,
// driver_status, leaving_status) — those remain gate-controller-only in the
// Dispatch Gate Log screen.

export default function GatePassPage() {
  const { profile, user } = useAuth()
  const { canEdit } = usePermissions()
  const editable = canEdit('dispatch')
  const userEmail = profile?.email || user?.email || ''

  const [passes, setPasses] = useState<any[]>([])
  const [trailers, setTrailers] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyRow, setBusyRow] = useState<string | null>(null)

  const [fDate, setFDate] = useState(todayGulf())
  const [fTrailer, setFTrailer] = useState('')
  const [fDriver, setFDriver] = useState('')
  const [fProject, setFProject] = useState('')
  const [fDn, setFDn] = useState('')
  const [fItems, setFItems] = useState('')
  const [saving, setSaving] = useState(false)

  async function reload() {
    setLoading(true)
    const [gp, tr, pr, dr, sup] = await Promise.all([
      fetchRows('gate_passes'),
      fetchRows('trailers'),
      fetchRows('projects'),
      fetchRows('drivers'),
      fetchRows('suppliers')
    ])
    const supplierNameById = new Map(sup.map((s: any) => [s.id, s.name]))
    setPasses(gp.sort((a, b) => String(b.gp_no).localeCompare(String(a.gp_no))))
    setTrailers(tr.map((t: any) => ({ ...t, supplierName: supplierNameById.get(t.supplier_id) || '' })))
    setProjects(pr)
    setDrivers(dr)
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  // Auto-fill driver from the Drivers master (assigned_plate linkage)
  useEffect(() => {
    const d = drivers.find(x => x.assigned_plate === fTrailer)
    if (d?.name) setFDriver(d.name)
  }, [fTrailer, drivers])

  const kpis = useMemo(() => ({
    today: passes.filter(p => p.gp_date === todayGulf()).length,
    issued: passes.filter(p => p.status === 'Issued').length,
    exited: passes.filter(p => p.status === 'Exited').length
  }), [passes])

  async function nextGpNo(): Promise<string> {
    const settings = await getSettings()
    const prefix = settings.gate_pass_prefix || 'GP-2026-'
    const nums = passes
      .map(p => Number(String(p.gp_no || '').replace(prefix, '')))
      .filter(n => !Number.isNaN(n))
    const next = (nums.length ? Math.max(...nums) : 500) + 1
    return `${prefix}${String(next).padStart(4, '0')}`
  }

  async function issuePass(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    if (!fTrailer || !fProject) {
      alert('Trailer and project are required.')
      return
    }
    setSaving(true)
    try {
      const gpNo = await nextGpNo()
      await insertAudited('gate_passes', [{
        gp_no: gpNo, gp_date: fDate, trailer_plate: fTrailer, driver_name: fDriver,
        project_no: fProject, dn_no: fDn, items_desc: fItems,
        issued_by: userEmail || 'Gate Controller', time_out: '', status: 'Issued'
      }], userEmail, `Gate pass ${gpNo} issued for ${fTrailer}`)
      setFDn(''); setFItems('')
      await reload()
    } finally {
      setSaving(false)
    }
  }

  async function markExited(row: any) {
    setBusyRow(row.id)
    try {
      await updateAudited('gate_passes', row.id, { status: 'Exited', time_out: nowStamp().slice(11) }, userEmail, `Gate pass ${row.gp_no} — vehicle exited`)
      await reload()
    } finally {
      setBusyRow(null)
    }
  }

  async function printPass(row: any) {
    const settings = await getSettings()
    const company = settings.company_name || 'Safetech Precast Building Manufacturing LLC'
    const address = settings.company_address || ''
    const project = projects.find(p => p.project_no === row.project_no)
    const qrPayload = ['SPBM-GP', row.gp_no, `Trailer:${row.trailer_plate}`, `Driver:${row.driver_name}`, `Proj:${row.project_no}`, `DN:${row.dn_no || '-'}`, `Date:${row.gp_date}`].join('|')
    const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Gate Pass ${esc(row.gp_no)}</title>
<style>
  @page { size: A5 landscape; margin: 8mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; background: #f1f5f9; }
  .pass { background: white; width: 210mm; max-width: 100%; margin: 12px auto; border: 2.5px solid #111; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,.18); }
  .head { display: flex; justify-content: space-between; align-items: center; background: #0a0a0a; color: white; padding: 10px 16px; }
  .brand b { color: #ef4444; font-size: 15px; letter-spacing: 1px; }
  .brand div { font-size: 7.5px; color: #cbd5e1; margin-top: 2px; }
  .gp-title { text-align: right; }
  .gp-title .t { font-size: 15px; font-weight: 900; letter-spacing: 2px; }
  .gp-title .n { font-family: monospace; font-size: 12px; color: #ef4444; font-weight: 800; }
  .body { display: flex; gap: 16px; padding: 14px 16px; }
  .grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; }
  .cell span { display: block; font-size: 7.5px; text-transform: uppercase; color: #777; font-weight: 800; letter-spacing: .5px; }
  .cell b { font-size: 12px; font-weight: 800; }
  .items { grid-column: 1 / -1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 8px; min-height: 34px; }
  .qr-box { text-align: center; }
  .qr-box .gpn { font-family: monospace; font-size: 8px; font-weight: 800; margin-top: 3px; }
  .rules { font-size: 7.2px; color: #555; padding: 0 16px 6px; }
  .sigs { display: flex; gap: 14px; padding: 8px 16px 14px; }
  .sig { flex: 1; text-align: center; font-size: 7.5px; font-weight: 800; text-transform: uppercase; color: #444; }
  .sig .line { border-bottom: 1.2px solid #111; height: 26px; margin-bottom: 3px; }
  .foot { display: flex; justify-content: space-between; font-size: 7px; color: #888; border-top: 1px solid #e2e8f0; padding: 5px 16px; }
  @media print { body { background: white } .pass { box-shadow: none; margin: 0 } }
</style></head>
<body>
  <div class="pass">
    <div class="head">
      <div class="brand"><b>SAFETECH</b><div>${esc(company)}<br>${esc(address)}</div></div>
      <div class="gp-title"><div class="t">YARD GATE PASS</div><div class="n">${esc(row.gp_no)}</div></div>
    </div>
    <div class="body">
      <div class="grid">
        <div class="cell"><span>Date</span><b>${esc(row.gp_date)}</b></div>
        <div class="cell"><span>Time Out</span><b>${esc(row.time_out || '—')}</b></div>
        <div class="cell"><span>Trailer Plate</span><b>${esc(row.trailer_plate)}</b></div>
        <div class="cell"><span>Driver</span><b>${esc(row.driver_name || '—')}</b></div>
        <div class="cell"><span>Project</span><b>${esc(row.project_no)} — ${esc(project?.project_name || '')}</b></div>
        <div class="cell"><span>Delivery Note</span><b>${esc(row.dn_no || '—')}</b></div>
        <div class="items"><span style="display:block;font-size:7.5px;text-transform:uppercase;color:#777;font-weight:800">Load Description</span><b style="font-size:10.5px">${esc(row.items_desc || '—')}</b></div>
      </div>
      <div class="qr-box">${qrSvg(qrPayload, { size: 108, margin: 1 })}<div class="gpn">${esc(row.gp_no)}</div></div>
    </div>
    <div class="rules">Vehicle may exit only after diesel, driver documents and load security are verified by the gate controller in the Dispatch Gate Log. This pass is void without stamp and signature.</div>
    <div class="sigs">
      <div class="sig"><div class="line"></div>Gate Controller</div>
      <div class="sig"><div class="line"></div>Driver</div>
      <div class="sig"><div class="line"></div>Security Stamp</div>
    </div>
    <div class="foot"><span>Issued by ${esc(row.issued_by || '—')}</span><span>Generated ${nowStamp()} (GMT+4)</span></div>
  </div>
</body></html>`
    openPrintWindow(html, true)
  }

  const csvCols = [
    { key: 'gp_no', label: 'GP No' }, { key: 'gp_date', label: 'Date' }, { key: 'trailer_plate', label: 'Trailer' },
    { key: 'driver_name', label: 'Driver' }, { key: 'project_no', label: 'Project' }, { key: 'dn_no', label: 'DN No' },
    { key: 'items_desc', label: 'Load' }, { key: 'time_out', label: 'Time Out' }, { key: 'status', label: 'Status' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5 gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Gate <span className="text-red-500 font-light">Pass</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Issue, print and track yard exit passes — gate security flags stay under gate-controller authority</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <span className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase">Today: {kpis.today}</span>
          <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase">Issued: {kpis.issued}</span>
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase">Exited: {kpis.exited}</span>
          <button onClick={() => exportCsv('gate-passes.csv', csvCols, passes)} className="px-3.5 py-2 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-[10px] font-extrabold uppercase rounded-xl transition-all">📤 CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {editable && (
          <form onSubmit={issuePass} className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3 h-fit">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
              🎫 Issue New Gate Pass
            </h3>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Date</span>
              <input type="date" className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={fDate} onChange={e => setFDate(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Trailer</span>
              <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={fTrailer} onChange={e => setFTrailer(e.target.value)}>
                <option value="">Select…</option>
                {trailers.map(t => <option key={t.id} value={t.plate_no}>{t.plate_no} — {t.supplierName} ({t.trailer_type})</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Driver</span>
              <input type="text" className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={fDriver} onChange={e => setFDriver(e.target.value)} placeholder="Auto-fills from trailer" />
            </label>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Project</span>
              <select className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={fProject} onChange={e => setFProject(e.target.value)}>
                <option value="">Select…</option>
                {projects.map(p => <option key={p.id} value={p.project_no}>{p.project_no} — {p.project_name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Delivery Note No (optional)</span>
              <input type="text" className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={fDn} onChange={e => setFDn(e.target.value)} placeholder="SPBM-10396" />
            </label>
            <label className="block">
              <span className="text-[9px] uppercase font-black text-slate-500">Load Description</span>
              <textarea rows={2} className="w-full mt-1 px-3 py-2 rounded-lg glowing-input text-xs" value={fItems} onChange={e => setFItems(e.target.value)} placeholder="HCS x18 — 10.6 m³" />
            </label>
            <button type="submit" disabled={saving} className="w-full bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-xs uppercase py-3 rounded-xl shadow-lg btn-interactive">
              {saving ? 'Issuing…' : '🎫 Issue Gate Pass'}
            </button>
          </form>
        )}

        <div className={`${editable ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-3`}>
          {loading ? (
            <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold animate-pulse">Loading gate passes…</div>
          ) : passes.length === 0 ? (
            <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold uppercase">No gate passes issued</div>
          ) : (
            passes.map(row => (
              <div key={row.id} className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-sm text-red-500">{row.gp_no}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${statusChipClass(row.status)}`}>{row.status}</span>
                    <span className="text-[10px] font-bold text-slate-500">{row.gp_date}{row.time_out ? ` • Out ${row.time_out}` : ''}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
                    🚚 {row.trailer_plate} — {row.driver_name || 'No driver'} • {row.project_no} {row.dn_no ? `• DN ${row.dn_no}` : ''}
                  </div>
                  {row.items_desc && <div className="text-[10px] text-slate-500 mt-0.5">{row.items_desc}</div>}
                </div>
                <div className="flex gap-1.5 shrink-0 no-print">
                  <button onClick={() => printPass(row)} className="px-3 py-1.5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-red-500 text-[9px] font-extrabold uppercase rounded-lg transition-all">🖨 Print Pass</button>
                  {editable && row.status === 'Issued' && (
                    <button disabled={busyRow === row.id} onClick={() => markExited(row)} className="px-3 py-1.5 border border-emerald-500/30 text-emerald-500 bg-emerald-500/5 text-[9px] font-extrabold uppercase rounded-lg transition-all">
                      ✓ Mark Exited
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
