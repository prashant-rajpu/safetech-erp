-- Phase 8: Custom Report Builder + Shop Drawing Viewer
--
-- custom_reports: saved user-built report definitions (source table +
-- selected columns + filters), rendered through the same ReportSection /
-- exportCsv / exportExcel / printSectionsDoc pipeline ReportsHubPage.tsx
-- already uses. Ships empty — no reports pre-authored.
--
-- drawings.file_url: first real use of Supabase Storage in this app (named
-- in CLAUDE.md's intended tech stack, never used until now). PRIVATE bucket
-- 'drawings' (not public — these are confidential project documents) + RLS
-- on storage.objects gated by the 'design' section, matching the existing
-- drawings ModuleDef's section in registry.ts. file_url stores the storage
-- OBJECT PATH, not a public URL — DrawingViewerPage.tsx requests a
-- short-lived signed URL client-side before rendering, so access always
-- goes through Supabase auth + the RLS policies below, never a bare
-- unauthenticated link.

create table if not exists custom_reports (
  id uuid primary key default gen_random_uuid(),
  name text,
  source_table text,
  columns jsonb,
  filters jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

alter table custom_reports enable row level security;

do $$
declare
  t text := 'custom_reports';
  sec text := 'reports';
begin
  execute format('drop policy if exists %I on %I', t || '_sel', t);
  execute format('drop policy if exists %I on %I', t || '_ins', t);
  execute format('drop policy if exists %I on %I', t || '_upd', t);
  execute format('drop policy if exists %I on %I', t || '_del', t);

  execute format(
    'create policy %I on %I for select using (has_permission(%L, %L))',
    t || '_sel', t, sec, 'view'
  );
  execute format(
    'create policy %I on %I for insert with check (has_permission(%L, %L))',
    t || '_ins', t, sec, 'create'
  );
  execute format(
    'create policy %I on %I for update using (has_permission(%L, %L)) with check (has_permission(%L, %L))',
    t || '_upd', t, sec, 'edit', sec, 'edit'
  );
  execute format(
    'create policy %I on %I for delete using (has_permission(%L, %L))',
    t || '_del', t, sec, 'delete'
  );
end $$;

alter table drawings add column if not exists file_url text;

insert into storage.buckets (id, name, public)
values ('drawings', 'drawings', false)
on conflict (id) do nothing;

drop policy if exists "drawings_bucket_sel" on storage.objects;
drop policy if exists "drawings_bucket_ins" on storage.objects;
drop policy if exists "drawings_bucket_upd" on storage.objects;
drop policy if exists "drawings_bucket_del" on storage.objects;

create policy "drawings_bucket_sel" on storage.objects for select
  using (bucket_id = 'drawings' and has_permission('design', 'view'));
create policy "drawings_bucket_ins" on storage.objects for insert
  with check (bucket_id = 'drawings' and has_permission('design', 'edit'));
create policy "drawings_bucket_upd" on storage.objects for update
  using (bucket_id = 'drawings' and has_permission('design', 'edit'))
  with check (bucket_id = 'drawings' and has_permission('design', 'edit'));
create policy "drawings_bucket_del" on storage.objects for delete
  using (bucket_id = 'drawings' and has_permission('design', 'delete'));
