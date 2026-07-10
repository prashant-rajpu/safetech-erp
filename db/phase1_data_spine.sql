-- ═══════════════════════════════════════════════════════════════════════════
-- v2 Roadmap — Phase 1: Core Data Spine.
--
-- Run after init.sql + erp_schema.sql + rls_policies.sql + import_snapshots.sql
-- + hse_workforce.sql, in the Supabase SQL editor. Idempotent: safe to re-run.
--
-- IMPORTANT CORRECTION vs. the phase plan: rls_policies.sql §4a already
-- replaced the placeholder "authenticated full access" policy with real
-- has_permission() policies on EVERY existing table (see its dynamic
-- (table, section) loop, which covers all 58+ tables incl. elements,
-- production_casting, element_traceability, maintenance_logs, etc. — mirrored
-- in src/lib/erp/tableSections.ts). So there is no existing-table RLS gap to
-- retrofit here; only the AUDIT COLUMNS were genuinely missing on those
-- tables (erp_schema.sql only gave them created_at). This migration:
--   1. Adds updated_at/created_by/updated_by to every existing public table
--      that lacks them (generic, idempotent — covers all 58 pre-existing
--      tables without hand-listing them).
--   2. Adds elements.shape_type (needed by the future Phase 6 3D renderer).
--      elements' RLS is already real (rls_policies.sql), so nothing else
--      needed there.
--   3. Creates 22 new tables across 6 new sections: prestressing, erection,
--      maintenance, documents, handover, environmental — covering CLAUDE.md
--      categories 8 (Site Erection), 9 (Maintenance), 11 (Prestressing),
--      12 (Document Control), 14 (Customer Handover/DLP), 15
--      (Sustainability/Environmental) that had zero tables today.
--      Explicitly NOT created: Spare Parts / raw-material stock (inventory-
--      valuation-adjacent, out of scope); no new Batching/Formwork tables
--      (concrete_batches / moulds already cover those module names).
--   4. Re-sections the existing maintenance_logs table from 'logistics' into
--      the new 'maintenance' section (it's a generic equipment-maintenance
--      log, not fleet-specific — belongs with the new Maintenance category,
--      not duplicated). Paired with an AppRoutes.tsx change so the /maintenance
--      route's permission gate matches, and an RBAC grant so logistics dept
--      keeps the access it has today.
--   5. RLS for all 22 new tables + the re-sectioned maintenance_logs, same
--      dynamic drop-and-recreate pattern as rls_policies.sql / hse_workforce.sql.
--   6. RBAC seed for the 6 new sections.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Audit-column retrofit on every existing table ─────────────────────────
-- Generic + idempotent: covers all pre-existing tables (erp_schema.sql tables
-- only had created_at) without hand-listing them. No-op on tables that already
-- have these columns (hse_workforce.sql tables, and this file's new tables).
do $$
declare rec record;
begin
  for rec in select table_name from information_schema.tables
             where table_schema = 'public' and table_type = 'BASE TABLE'
  loop
    execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', rec.table_name);
    execute format('alter table public.%I add column if not exists created_by text', rec.table_name);
    execute format('alter table public.%I add column if not exists updated_by text', rec.table_name);
  end loop;
end $$;

-- ── 2. elements hardening ─────────────────────────────────────────────────────
alter table elements add column if not exists shape_type text
  check (shape_type in ('Box','Solid Wall','Hollow-core','Beam','Column','Panel','Slab','Stairs','Custom'));
-- audit columns added generically above; RLS already real via rls_policies.sql.

-- ── 3. New tables: Prestressing (CLAUDE.md §11) ───────────────────────────────

create table if not exists pt_strands (
  id uuid primary key default gen_random_uuid(),
  strand_id text,
  strand_type text,
  diameter_mm numeric,
  supplier text,
  batch_no text,
  tensile_strength_mpa numeric,
  qty_meters numeric,
  status text default 'In Stock' check (status in ('In Stock','Issued','Consumed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists pt_tensioning (
  id uuid primary key default gen_random_uuid(),
  tensioning_no text,
  bed text,
  element_code text,
  tensioning_date date,
  strand_count integer,
  initial_force_kn numeric,
  target_elongation_mm numeric,
  actual_elongation_mm numeric,
  tensioned_by text,
  status text default 'Planned' check (status in ('Planned','Tensioned','Released')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists pt_release (
  id uuid primary key default gen_random_uuid(),
  release_no text,
  tensioning_no text,
  element_code text,
  release_date date,
  concrete_strength_mpa numeric,
  released_by text,
  status text default 'Pending' check (status in ('Pending','Released','Hold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists pt_long_line_plans (
  id uuid primary key default gen_random_uuid(),
  plan_no text,
  bed text,
  plan_date date,
  project_no text,
  element_codes text,
  total_length_m numeric,
  strand_pattern text,
  status text default 'Planned' check (status in ('Planned','In Progress','Completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

-- ── 4. New tables: Site Erection (CLAUDE.md §8) ───────────────────────────────

create table if not exists erection_planning (
  id uuid primary key default gen_random_uuid(),
  plan_no text,
  project_no text,
  plan_date date,
  element_codes text,
  crane text,
  sequence_no integer,
  status text default 'Planned' check (status in ('Planned','Scheduled','In Progress','Completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists erection_log (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  project_no text,
  erection_date date,
  location text,
  crane text,
  operator text,
  erected_by text,
  status text default 'Erected' check (status in ('Erected','Pending','Rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists grouting_records (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  grout_date date,
  joint_ref text,
  grout_mix text,
  applied_by text,
  status text default 'Completed' check (status in ('Pending','Completed','Rework')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists connection_inspections (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  inspection_date date,
  connection_type text,
  weld_check text check (weld_check in ('Pass','Fail','N/A')),
  bolt_torque_check text check (bolt_torque_check in ('Pass','Fail','N/A')),
  result text default 'Accepted' check (result in ('Accepted','Rejected')),
  inspector text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

-- ── 5. New tables: Maintenance (CLAUDE.md §9) ─────────────────────────────────
-- equipment_register / preventive_maintenance / calibration_records are new.
-- Breakdown/general maintenance reuses the EXISTING maintenance_logs table
-- (re-sectioned below into 'maintenance' — see header note 4).

create table if not exists equipment_register (
  id uuid primary key default gen_random_uuid(),
  equipment_id text,
  equipment_type text,
  make_model text,
  location text,
  purchase_date date,
  status text default 'Active' check (status in ('Active','Under Maintenance','Retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists preventive_maintenance (
  id uuid primary key default gen_random_uuid(),
  pm_no text,
  equipment_id text,
  scheduled_date date,
  task text,
  frequency text,
  completed_date date,
  technician text,
  status text default 'Scheduled' check (status in ('Scheduled','Completed','Overdue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists calibration_records (
  id uuid primary key default gen_random_uuid(),
  equipment_id text,
  calibration_date date,
  calibrated_by text,
  next_due_date date,
  certificate_no text,
  status text default 'Valid' check (status in ('Valid','Due Soon','Expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

-- ── 6. New tables: Document Control (CLAUDE.md §12) ───────────────────────────

create table if not exists rfi_register (
  id uuid primary key default gen_random_uuid(),
  rfi_no text,
  project_no text,
  raised_date date,
  subject text,
  description text,
  raised_by text,
  response text,
  response_date date,
  status text default 'Open' check (status in ('Open','Answered','Closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists method_statements (
  id uuid primary key default gen_random_uuid(),
  ms_no text,
  project_no text,
  title text,
  activity text,
  revision text,
  prepared_by text,
  approved_by text,
  approval_date date,
  status text default 'Draft' check (status in ('Draft','Under Review','Approved','Superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists submittals (
  id uuid primary key default gen_random_uuid(),
  submittal_no text,
  project_no text,
  title text,
  type text,
  submitted_date date,
  submitted_by text,
  reviewer text,
  review_status text check (review_status in ('Pending','Approved','Approved as Noted','Rejected')),
  status text default 'Submitted' check (status in ('Submitted','Under Review','Closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

-- ── 7. New tables: Customer Handover / DLP (CLAUDE.md §14) ────────────────────

create table if not exists handover_packages (
  id uuid primary key default gen_random_uuid(),
  package_no text,
  project_no text,
  handover_date date,
  prepared_by text,
  documents_included text,
  client_signoff_by text,
  status text default 'In Preparation' check (status in ('In Preparation','Submitted','Accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists dlp_records (
  id uuid primary key default gen_random_uuid(),
  project_no text,
  dlp_start_date date,
  dlp_end_date date,
  defects_count integer default 0,
  status text default 'Active' check (status in ('Active','Closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists handover_defects (
  id uuid primary key default gen_random_uuid(),
  defect_no text,
  project_no text,
  element_code text,
  description text,
  raised_date date,
  due_date date,
  closed_date date,
  assigned_to text,
  status text default 'Open' check (status in ('Open','In Progress','Closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists customer_acceptance (
  id uuid primary key default gen_random_uuid(),
  project_no text,
  acceptance_date date,
  accepted_by text,
  client_rep text,
  remarks text,
  status text default 'Pending' check (status in ('Pending','Accepted','Rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

-- ── 8. New tables: Environmental / Sustainability (CLAUDE.md §15) ─────────────

create table if not exists carbon_records (
  id uuid primary key default gen_random_uuid(),
  record_date date,
  project_no text,
  activity text,
  co2_kg numeric,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists waste_records (
  id uuid primary key default gen_random_uuid(),
  record_date date,
  project_no text,
  waste_type text,
  qty_kg numeric,
  disposal_method text,
  disposed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists water_records (
  id uuid primary key default gen_random_uuid(),
  record_date date,
  source text,
  usage_litres numeric,
  purpose text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists environmental_reports (
  id uuid primary key default gen_random_uuid(),
  report_no text,
  report_period text,
  project_no text,
  summary text,
  prepared_by text,
  submitted_date date,
  status text default 'Draft' check (status in ('Draft','Submitted','Approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

-- ── 9. RLS: enable + per-table policies for all 22 new tables, plus the
--    re-sectioned maintenance_logs. Same dynamic pattern as rls_policies.sql
--    §4a / hse_workforce.sql §3.
do $$
declare
  rec record;
  pol record;
begin
  for rec in
    select * from (values
      ('pt_strands','prestressing'), ('pt_tensioning','prestressing'),
      ('pt_release','prestressing'), ('pt_long_line_plans','prestressing'),
      ('erection_planning','erection'), ('erection_log','erection'),
      ('grouting_records','erection'), ('connection_inspections','erection'),
      ('equipment_register','maintenance'), ('preventive_maintenance','maintenance'),
      ('calibration_records','maintenance'), ('maintenance_logs','maintenance'),
      ('rfi_register','documents'), ('method_statements','documents'),
      ('submittals','documents'),
      ('handover_packages','handover'), ('dlp_records','handover'),
      ('handover_defects','handover'), ('customer_acceptance','handover'),
      ('carbon_records','environmental'), ('waste_records','environmental'),
      ('water_records','environmental'), ('environmental_reports','environmental')
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

-- ── 10. RBAC seed: 6 new section_keys ─────────────────────────────────────────
-- admin: full CRUD+approve, always. supervisor: full CRUD on the operational
-- ones (prestressing/erection/maintenance — shop-floor daily work, matches its
-- existing full-control role elsewhere). controller/viewer: view-only on all
-- six, matching their existing narrow/read-focused scope. documents/handover/
-- environmental: admin + relevant department only (design office writes RFIs/
-- method statements/submittals; management handles handover + environmental
-- reporting) — narrower than the operational sections since these are
-- office-driven, not daily shop-floor work.
-- logistics department keeps its maintenance_logs access via the 'maintenance'
-- section grant below (it moved out of 'logistics' — see header note 4).

insert into role_permissions (role_key, section_key, can_view, can_create, can_edit, can_delete, can_approve) values
  ('admin','prestressing',true,true,true,true,true),
  ('admin','erection',true,true,true,true,true),
  ('admin','maintenance',true,true,true,true,true),
  ('admin','documents',true,true,true,true,true),
  ('admin','handover',true,true,true,true,true),
  ('admin','environmental',true,true,true,true,true),
  ('supervisor','prestressing',true,true,true,true,true),
  ('supervisor','erection',true,true,true,true,true),
  ('supervisor','maintenance',true,true,true,true,true),
  ('supervisor','documents',true,false,false,false,false),
  ('supervisor','handover',true,false,false,false,false),
  ('supervisor','environmental',true,false,false,false,false),
  ('controller','prestressing',true,false,false,false,false),
  ('controller','erection',true,false,false,false,false),
  ('controller','maintenance',true,false,false,false,false),
  ('controller','documents',true,false,false,false,false),
  ('controller','handover',true,false,false,false,false),
  ('controller','environmental',true,false,false,false,false),
  ('viewer','prestressing',true,false,false,false,false),
  ('viewer','erection',true,false,false,false,false),
  ('viewer','maintenance',true,false,false,false,false),
  ('viewer','documents',true,false,false,false,false),
  ('viewer','handover',true,false,false,false,false),
  ('viewer','environmental',true,false,false,false,false)
on conflict (role_key, section_key) do update set
  can_view = excluded.can_view, can_create = excluded.can_create, can_edit = excluded.can_edit,
  can_delete = excluded.can_delete, can_approve = excluded.can_approve;

insert into department_permissions (department_key, section_key, can_view, can_create, can_edit, can_delete, can_approve) values
  ('logistics','maintenance',true,true,true,false,false),
  ('design','documents',true,true,true,false,false),
  ('management','handover',true,true,true,false,false),
  ('management','environmental',true,true,true,false,false)
on conflict (department_key, section_key) do update set
  can_view = excluded.can_view, can_create = excluded.can_create, can_edit = excluded.can_edit,
  can_delete = excluded.can_delete, can_approve = excluded.can_approve;

-- Done. Verify as different logged-in users:
--   select has_permission('prestressing','edit');  -- true for admin/supervisor
--   select has_permission('maintenance','create');  -- true for admin/supervisor/logistics dept
--   select has_permission('documents','edit');      -- true for admin/design dept, false for supervisor
--   insert into pt_strands (...) ...;                -- rejected for viewer by RLS
