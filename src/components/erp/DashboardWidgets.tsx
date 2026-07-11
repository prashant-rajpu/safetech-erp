import React from 'react'
import { statusChipClass } from '../../lib/erp/uiHelpers'

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mb-4 pb-2 border-b border-slate-200 dark:border-white/5 flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
      {children}
    </div>
  )
}

export function MiniTable({ cols, rows, empty }: { cols: { key: string; label: string }[]; rows: any[]; empty: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-slate-400 font-bold text-[9px] uppercase border-b border-slate-100 dark:border-white/5">
            {cols.map(c => <th key={c.key} className="py-2 px-2 whitespace-nowrap">{c.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
          {rows.length === 0 ? (
            <tr><td colSpan={cols.length} className="py-6 text-center text-slate-500 font-semibold uppercase text-[10px]">{empty}</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/5">
              {cols.map(c => (
                <td key={c.key} className="py-1.5 px-2 max-w-[150px] truncate font-semibold">
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
  )
}
