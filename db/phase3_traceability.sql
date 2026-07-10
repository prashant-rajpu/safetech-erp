-- ═══════════════════════════════════════════════════════════════════════════
-- v2 Roadmap — Phase 3: Element Traceability (real scan + status/defect logging)
--
-- Run after phase1_data_spine.sql. Idempotent: safe to re-run.
--
-- 1. New table traceability_events — the append-only per-stage event log
--    that actually fulfills CLAUDE.md's "every stage records Timestamp,
--    User, Department, Status, Remarks" design. The existing wide
--    element_traceability table never did (11 bare text timestamp columns,
--    no user/department/status/remarks) — left untouched here except for
--    the unique-constraint fix below.
-- 2. Unique constraint on element_traceability.element_code — closes a
--    latent duplicate-row bug (3 different pages write to this table
--    independently with no dedup). Table is empty at time of writing, so
--    this applies with zero data-migration risk. NOTE: CastingSchedulePage.tsx
--    and CastBedPlanPage.tsx's "Complete -> Stockyard" cascade must switch
--    from a blind .insert() to .upsert(..., {onConflict:'element_code'})
--    for this constraint not to break their existing writes — done as a
--    companion frontend change alongside this migration, not optional.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists traceability_events (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  stage text check (stage in (
    'Planning','Casting','QC','Curing','Stockyard','Loading','Dispatch',
    'Delivered','At Site','Erected','Completed'
  )),
  event_type text check (event_type in ('Scan','Status Update','Defect Reported')),
  status text,
  defect_severity text check (defect_severity in ('Cosmetic','Minor','Major')),
  defect_description text,
  remarks text,
  logged_by text,
  department text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

-- Fix the latent duplicate-row bug (safe: table is empty).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'element_traceability_element_code_key'
  ) then
    alter table element_traceability
      add constraint element_traceability_element_code_key unique (element_code);
  end if;
end $$;

-- RLS: same dynamic drop-and-recreate pattern as prior migrations, reusing
-- has_permission(). Reuses the 'stockyard' section (same as element_traceability
-- today, since this is co-located functionality on the QR Scanner page).
do $$
declare
  rec record;
  pol record;
begin
  for rec in
    select * from (values
      ('traceability_events','stockyard')
    ) as t(tbl, sec)
  loop
    if to_regclass('public.' || rec.tbl) is null then continue; end if;
    execute format('alter table public.%I enable row level security', rec.tbl);
    for pol in select policyname from pg_policies where schemaname='public' and tablename=rec.tbl loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, rec.tbl);
    end loop;
    execute format('create policy %I on public.%I for select to authenticated using (has_permission(%L,%L))',       rec.tbl||'_sel', rec.tbl, rec.sec, 'view');
    execute format('create policy %I on public.%I for insert to authenticated with check (has_permission(%L,%L))',   rec.tbl||'_ins', rec.tbl, rec.sec, 'create');
    execute format('create policy %I on public.%I for update to authenticated using (has_permission(%L,%L)) with check (has_permission(%L,%L))', rec.tbl||'_upd', rec.tbl, rec.sec, 'edit', rec.sec, 'edit');
    execute format('create policy %I on public.%I for delete to authenticated using (has_permission(%L,%L))',        rec.tbl||'_del', rec.tbl, rec.sec, 'delete');
  end loop;
end $$;

-- Done. No new RBAC seed needed — reuses the existing 'stockyard' section
-- grants already seeded in db/rls_policies.sql.
