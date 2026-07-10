-- Import-undo support, backed by Postgres instead of localStorage.
-- Run after init.sql + erp_schema.sql + rls_policies.sql.

create table if not exists import_snapshots (
  table_name text primary key,
  rows jsonb not null,
  snapshot_at timestamptz not null default now(),
  snapshot_by text
);
alter table import_snapshots enable row level security;

do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname='public' and tablename='import_snapshots' loop
    execute format('drop policy if exists %I on public.import_snapshots', pol.policyname);
  end loop;
end $$;

create policy import_snapshots_sel on import_snapshots for select to authenticated using (true);
create policy import_snapshots_ins on import_snapshots for insert to authenticated with check (has_permission('admin','edit'));
create policy import_snapshots_upd on import_snapshots for update to authenticated using (has_permission('admin','edit')) with check (has_permission('admin','edit'));
create policy import_snapshots_del on import_snapshots for delete to authenticated using (has_permission('admin','edit'));

-- Restoring means "delete every current row, reinsert the snapshotted rows" — a
-- destructive operation that must not partially apply. supabase-js has no
-- multi-statement transaction, so do it server-side in one function, same
-- dynamic-SQL-via-format() pattern already used in rls_policies.sql's DO blocks.
create or replace function public.restore_snapshot_table(p_table text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_permission('admin','edit') then
    raise exception 'permission denied';
  end if;
  execute format('delete from public.%I', p_table);
  execute format(
    'insert into public.%I select * from jsonb_populate_recordset(null::public.%I, (select rows from import_snapshots where table_name = %L))',
    p_table, p_table, p_table
  );
  delete from import_snapshots where table_name = p_table;
end $$;

-- The frontend's casting-log form has always inserted an element_code onto
-- production_casting rows (to link a casting log to its QC/traceability
-- record by element), but erp_schema.sql never defined that column — the
-- QC-pass cascade in ProductionPage.tsx needs it to look up the right row.
alter table production_casting add column if not exists element_code text;
