import { supabase } from '../supabaseClient'

// Timestamp in the plant's operational timezone (GMT+4), 'YYYY-MM-DD HH:mm'
export function nowStamp(): string {
  const gulf = new Date(Date.now() + (4 * 60 + new Date().getTimezoneOffset()) * 60000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${gulf.getFullYear()}-${p(gulf.getMonth() + 1)}-${p(gulf.getDate())} ${p(gulf.getHours())}:${p(gulf.getMinutes())}`
}

export function todayGulf(): string {
  return nowStamp().slice(0, 10)
}

export async function logAudit(userEmail: string, action: string, tableName: string, recordId: string, details: string) {
  await supabase.from('audit_logs').insert([{
    ts: nowStamp(), user_email: userEmail || 'system', action, table_name: tableName, record_id: recordId, details
  }])
}

export async function fetchRows(table: string, filter?: { field: string; value: string }): Promise<any[]> {
  let q: any = supabase.from(table).select('*')
  if (filter) q = q.eq(filter.field, filter.value)
  const { data } = await q.limit(100000)
  return data || []
}

export async function insertAudited(table: string, rows: any[], userEmail: string, note?: string): Promise<any[]> {
  const { data } = await supabase.from(table).insert(rows)
  await logAudit(userEmail, 'INSERT', table, (data?.[0]?.id ?? ''), note || `${rows.length} record(s) added`)
  return data || []
}

export async function updateAudited(table: string, id: string, patch: any, userEmail: string, note?: string) {
  await supabase.from(table).update(patch).eq('id', id)
  await logAudit(userEmail, 'UPDATE', table, id, note || 'record updated')
}

export async function deleteAudited(table: string, id: string, userEmail: string, note?: string) {
  await supabase.from(table).delete().eq('id', id)
  await logAudit(userEmail, 'DELETE', table, id, note || 'record deleted')
}

// ── Import rollback support ──────────────────────────────────────────────────
// Snapshot the physical localStorage table before a bulk import; restoring
// brings back the exact pre-import state.

export function snapshotTable(table: string) {
  const cur = localStorage.getItem(`mock_db_${table}`) || '[]'
  localStorage.setItem(`mock_snapshot_${table}`, cur)
  localStorage.setItem(`mock_snapshot_${table}_at`, nowStamp())
}

export function hasSnapshot(table: string): boolean {
  return localStorage.getItem(`mock_snapshot_${table}`) !== null
}

export function snapshotInfo(table: string): string | null {
  return localStorage.getItem(`mock_snapshot_${table}_at`)
}

export function restoreSnapshot(table: string): boolean {
  const snap = localStorage.getItem(`mock_snapshot_${table}`)
  if (snap === null) return false
  localStorage.setItem(`mock_db_${table}`, snap)
  localStorage.removeItem(`mock_snapshot_${table}`)
  localStorage.removeItem(`mock_snapshot_${table}_at`)
  return true
}

// ── System settings (company identity for printed documents) ────────────────

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await fetchRows('system_settings')
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return map
}
