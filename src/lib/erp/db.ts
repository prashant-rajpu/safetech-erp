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
// Snapshot the table (via the import_snapshots table) before a bulk import;
// restoring brings back the exact pre-import state via a server-side atomic
// function (see db/import_snapshots.sql — delete-all + reinsert must not
// partially apply, so it runs as one transaction in Postgres, not two
// separate client round-trips).

export async function snapshotTable(table: string, userEmail: string) {
  const rows = await fetchRows(table)
  await supabase.from('import_snapshots').upsert([{
    table_name: table, rows, snapshot_by: userEmail || 'system'
  }], { onConflict: 'table_name' })
}

export async function hasSnapshot(table: string): Promise<boolean> {
  const { data } = await supabase.from('import_snapshots').select('table_name').eq('table_name', table).maybeSingle()
  return !!data
}

export async function snapshotInfo(table: string): Promise<string | null> {
  const { data } = await supabase.from('import_snapshots').select('snapshot_at').eq('table_name', table).maybeSingle()
  return data?.snapshot_at ?? null
}

export async function restoreSnapshot(table: string): Promise<boolean> {
  const { error } = await supabase.rpc('restore_snapshot_table', { p_table: table })
  return !error
}

// ── System settings (company identity for printed documents) ────────────────

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await fetchRows('system_settings')
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return map
}
