// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth mapping every database table to the permission
// SECTION that governs it. Consumed by:
//   • the mock-mode enforcement simulation (supabaseClient.ts) — approximates
//     Postgres RLS in the browser for local demos, and
//   • db/rls_policies.sql — the same mapping is mirrored into the real per-table
//     policies (keep the two in sync when adding tables).
//
// Most tables are derived automatically from the module registry (a module's
// table belongs to its section). Legacy/operational tables that predate the
// registry are mapped explicitly below.
// ─────────────────────────────────────────────────────────────────────────────

import { MODULES, type SectionKey } from './registry'

// Tables not backed by a registry ModuleDef (legacy pages + init.sql tables).
const EXTRA_TABLE_SECTIONS: Record<string, SectionKey> = {
  customers: 'master',
  production_casting: 'production',
  stockyard_inventory: 'stockyard',
  element_traceability: 'stockyard',
  deliveries: 'dispatch',
  dispatch_log: 'dispatch',
  gate_passes: 'dispatch',
  fleet_status: 'logistics',
  maintenance_logs: 'maintenance',
}

/** table name → governing section. Registry modules win where both define one. */
export const TABLE_SECTIONS: Record<string, SectionKey> = (() => {
  const map: Record<string, SectionKey> = { ...EXTRA_TABLE_SECTIONS }
  for (const mod of MODULES) map[mod.table] = mod.section
  return map
})()

export const tableSection = (table: string): SectionKey | undefined => TABLE_SECTIONS[table]

// ── Special-case tables (checked BEFORE the section gate) ────────────────────

// Reference tables the permission engine itself must read to compute grants.
// Readable by every authenticated user; writable only by admin.
export const PUBLIC_READ_TABLES = new Set<string>([
  'roles', 'departments', 'permissions',
  'role_permissions', 'department_permissions',
  'system_settings',
])

// Append-only audit trail: any authenticated user may INSERT (writes are logged
// on every legitimate action); only admin may read / update / delete.
export const APPEND_ONLY_TABLES = new Set<string>(['audit_logs'])

// User directory: a user may read their own row; admin manages all.
export const SELF_TABLES = new Set<string>(['users'])

// ── Dispatch-gate column protection ──────────────────────────────────────────
// These flags may only be set by a user with the 'approve' grant on 'dispatch'
// (the gate controller). Mirrors GATE_PROTECTED_FIELDS in DispatchForm.tsx and
// the enforce_gate_fields() trigger in db/rls_policies.sql.
export const GATE_PROTECTED_FIELDS = ['diesel_status', 'driver_status', 'leaving_status']
export const GATE_TABLES = new Set<string>(['dispatch_log', 'deliveries'])
