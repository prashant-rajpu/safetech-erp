import type { ModuleDef } from './registry'

// Small shared UI helpers, kept separate from ModuleWorkspace so pages can
// use them without pulling the whole workspace into their bundle chunk.

/** Status → chip color heuristics shared across all modules */
export function statusChipClass(value: string): string {
  const v = String(value || '').toLowerCase()
  if (/(pass|approved|active|completed|cleared|accepted|ready|delivered|closed|current|confirmed|allocated|exited)/.test(v))
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  if (/(pending|hold|review|tentative|progress|curing|planned|scheduled|standby|loading|issued|conditional|observation|generated)/.test(v))
    return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  if (/(fail|reject|open|critical|major|cancel|superseded|workshop|retired)/.test(v))
    return 'bg-red-500/10 text-red-500 border-red-500/20'
  return 'bg-slate-500/10 text-slate-500 border-slate-500/20'
}

/** Compact pipe-delimited QR payload — token[1] is always the lookup key. */
export function buildQrPayload(module: ModuleDef, row: any): string {
  const keyVal = String(row[module.qrField || module.fields[0].key] ?? '')
  const detailFields = module.fields.filter(f => f.key !== module.qrField).slice(0, 7)
  const details = detailFields
    .map(f => `${f.label.replace(/[^A-Za-z0-9 ]/g, '').slice(0, 10)}:${String(row[f.key] ?? '').slice(0, 24)}`)
    .filter(d => !d.endsWith(':'))
  return ['SPBM-EL', keyVal, ...details].join('|')
}
