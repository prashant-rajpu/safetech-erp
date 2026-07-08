import React, { useMemo, useRef, useState } from 'react'
import { USE_REAL_BACKEND } from '../lib/supabaseClient'
import { nowStamp } from '../lib/erp/db'

// Backup & Restore for the offline (localStorage) database.
// In offline mode ALL company data lives in this browser — a cleared cache
// means lost records. This page lets users download a full snapshot and
// restore it on any device, which is the operational safety net until a
// shared Supabase backend is configured.

const PREFIX = 'mock_db_'

type TableInfo = { table: string; rows: number; bytes: number }

function scanTables(): TableInfo[] {
  const out: TableInfo[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!
    if (!key.startsWith(PREFIX)) continue
    const raw = localStorage.getItem(key) || '[]'
    let rows = 0
    try { rows = JSON.parse(raw).length } catch { /* corrupted entry — show 0 */ }
    out.push({ table: key.slice(PREFIX.length), rows, bytes: raw.length })
  }
  return out.sort((a, b) => a.table.localeCompare(b.table))
}

function fmtBytes(n: number) {
  return n > 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + ' MB' : (n / 1024).toFixed(1) + ' KB'
}

export default function BackupPage() {
  const [refresh, setRefresh] = useState(0)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const tables = useMemo(() => scanTables(), [refresh])
  const totalRows = tables.reduce((s, t) => s + t.rows, 0)
  const totalBytes = tables.reduce((s, t) => s + t.bytes, 0)

  function exportAll() {
    const dump: Record<string, any[]> = {}
    for (const t of tables) {
      try { dump[t.table] = JSON.parse(localStorage.getItem(PREFIX + t.table) || '[]') } catch { dump[t.table] = [] }
    }
    const payload = {
      app: 'safetech-precast-erp',
      format: 1,
      exported_at: nowStamp(),
      tables: dump
    }
    const blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `safetech-erp-backup-${nowStamp().replace(/[: ]/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMessage({ kind: 'ok', text: `Backup downloaded — ${tables.length} tables, ${totalRows} rows.` })
  }

  async function importFile(file: File) {
    try {
      const payload = JSON.parse(await file.text())
      if (payload?.app !== 'safetech-precast-erp' || typeof payload?.tables !== 'object') {
        setMessage({ kind: 'err', text: 'Not a valid Safetech ERP backup file.' })
        return
      }
      const names = Object.keys(payload.tables)
      const ok = window.confirm(
        `Restore backup from ${payload.exported_at || 'unknown date'}?\n\n` +
        `${names.length} tables will be REPLACED on this device with the backup contents.`
      )
      if (!ok) return
      for (const [table, rows] of Object.entries(payload.tables)) {
        if (Array.isArray(rows)) localStorage.setItem(PREFIX + table, JSON.stringify(rows))
      }
      setRefresh(r => r + 1)
      setMessage({ kind: 'ok', text: `Restored ${names.length} tables. Reload any open pages to see the data.` })
    } catch {
      setMessage({ kind: 'err', text: 'Could not read the backup file (invalid JSON).' })
    }
  }

  function resetDemo() {
    const ok = window.confirm(
      'Reset to fresh demo data?\n\nALL data on this device will be deleted and the ' +
      'original demo content re-seeded. Download a backup first if in doubt.'
    )
    if (!ok) return
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!
      if (k.startsWith(PREFIX) || k.startsWith('mock_snapshot_')) keys.push(k)
    }
    keys.forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-white/5">
        <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
          Backup <span className="text-red-500 font-light">&amp; Restore</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {USE_REAL_BACKEND
            ? 'A shared Supabase backend is configured — server-side backups are managed in the Supabase dashboard. This page covers only browser-local data.'
            : 'Offline mode: all data lives in this browser. Download regular backups — clearing site data without one means losing records.'}
        </p>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-xs font-bold border ${message.kind === 'ok'
          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/5">
          <p className="text-[10px] font-black uppercase text-slate-400">Tables</p>
          <p className="text-3xl font-extrabold text-neutral-900 dark:text-white">{tables.length}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/5">
          <p className="text-[10px] font-black uppercase text-slate-400">Total Rows</p>
          <p className="text-3xl font-extrabold text-neutral-900 dark:text-white">{totalRows}</p>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/5">
          <p className="text-[10px] font-black uppercase text-slate-400">Storage Used</p>
          <p className="text-3xl font-extrabold text-neutral-900 dark:text-white">{fmtBytes(totalBytes)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={exportAll}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold uppercase rounded-xl btn-interactive transition-all">
          ⬇ Download Full Backup
        </button>
        <button onClick={() => fileRef.current?.click()}
          className="px-5 py-2.5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-red-500/30 hover:text-red-500 text-xs font-extrabold uppercase rounded-xl transition-all">
          ⬆ Restore from Backup
        </button>
        <button onClick={resetDemo}
          className="px-5 py-2.5 border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 text-xs font-extrabold uppercase rounded-xl transition-all">
          ♻ Reset to Demo Data
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = '' }} />
      </div>

      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-white dark:bg-[#0c0c0f]">
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[9px] uppercase">
                <th className="py-2.5 px-4">Table</th>
                <th className="py-2.5 px-4 text-right">Rows</th>
                <th className="py-2.5 px-4 text-right">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {tables.map(t => (
                <tr key={t.table} className="hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="py-2 px-4 font-mono font-bold text-neutral-800 dark:text-white">{t.table}</td>
                  <td className="py-2 px-4 text-right text-slate-500">{t.rows}</td>
                  <td className="py-2 px-4 text-right text-slate-500">{fmtBytes(t.bytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-white/5 text-[10px] text-slate-500 space-y-1">
        <p>• Backups are plain JSON — they can be opened, inspected, and archived anywhere.</p>
        <p>• Restoring on another device is how you move data between computers in offline mode.</p>
        <p>• For true multi-user shared data, configure Supabase (see PRODUCTION_SETUP.md) — this page then becomes a secondary safety net.</p>
      </div>
    </div>
  )
}
