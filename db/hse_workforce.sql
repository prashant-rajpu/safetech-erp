-- Phase: HSE + Workforce modules (9 new tables, 2 new RBAC sections).
-- Run after init.sql + erp_schema.sql + rls_policies.sql + import_snapshots.sql.
-- Idempotent: safe to re-run.
--
-- Unlike the 58 tables in erp_schema.sql (created_at only), every table here
-- also carries updated_at/created_by/updated_by per CLAUDE.md's data-model
-- rule — this is the new standard going forward; retrofitting the existing
-- 58 tables is a separate, later migration.

-- ── 1. HSE tables ─────────────────────────────────────────────────────────

create table if not exists hse_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_no text,
  incident_date date,
  project_no text,
  location text,
  incident_type text check (incident_type in ('Near Miss','Injury','Property Damage','Environmental')),
  severity text check (severity in ('Minor','Moderate','Major','Critical')),
  description text,
  injured_person text,
  root_cause text,
  corrective_action text,
  status text default 'Open',
  reported_by text,
  closed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists toolbox_talks (
  id uuid primary key default gen_random_uuid(),
  talk_date date,
  topic text,
  conducted_by text,
  department text,
  attendees_count integer,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists risk_assessments (
  id uuid primary key default gen_random_uuid(),
  ra_no text,
  activity text,
  hazards text,
  risk_level text check (risk_level in ('Low','Medium','High')),
  control_measures text,
  assessed_by text,
  review_date date,
  status text default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists hse_permits (
  id uuid primary key default gen_random_uuid(),
  permit_no text,
  permit_type text check (permit_type in ('Hot Work','Confined Space','Working at Height','Lifting')),
  issued_to text,
  valid_from date,
  valid_to date,
  status text default 'Active',
  issued_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists safety_audits (
  id uuid primary key default gen_random_uuid(),
  audit_no text,
  audit_date date,
  area text,
  auditor text,
  findings_count integer default 0,
  score numeric,
  status text default 'Open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

-- ── 2. Workforce tables ──────────────────────────────────────────────────

create table if not exists crew_members (
  id uuid primary key default gen_random_uuid(),
  name text,
  trade text,
  employee_no text,
  department text,
  phone text,
  status text default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists crew_assignments (
  id uuid primary key default gen_random_uuid(),
  assignment_date date,
  crew_member text,
  project_no text,
  task text,
  shift text check (shift in ('Day','Night')),
  status text default 'Assigned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

create table if not exists shift_schedules (
  id uuid primary key default gen_random_uuid(),
  shift_date date,
  shift_type text check (shift_type in ('Day','Night')),
  department text,
  supervisor text,
  headcount_planned integer,
  headcount_actual integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

-- Shared: satisfies both HSE "Certifications" and Workforce "Certification
-- Tracking" (CLAUDE.md) without a duplicate table — cert_category filters
-- which dashboard surfaces a given row.
create table if not exists certifications (
  id uuid primary key default gen_random_uuid(),
  person_name text,
  cert_type text,
  cert_category text check (cert_category in ('Safety','Trade','Competency')),
  cert_no text,
  issued_date date,
  expiry_date date,
  status text default 'Valid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

-- ── 3. RLS: enable + per-table policies keyed by section ────────────────
-- Same dynamic drop-and-recreate pattern as rls_policies.sql §4a, reusing
-- has_permission() rather than hand-rolling auth logic.

do $$
declare
  rec record;
  pol record;
begin
  for rec in
    select * from (values
      ('hse_incidents','hse'), ('toolbox_talks','hse'), ('risk_assessments','hse'),
      ('hse_permits','hse'), ('safety_audits','hse'),
      ('crew_members','workforce'), ('crew_assignments','workforce'),
      ('shift_schedules','workforce'), ('certifications','workforce')
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

-- ── 4. RBAC seed: new section_keys 'hse' and 'workforce' ─────────────────
-- admin: full (always). supervisor: full CRUD (matches its existing
-- shop-floor-authority role — daily toolbox talks/incident reporting/crew
-- assignment). controller/viewer: view-only (matches their existing scope).
-- production department: edit on workforce only (crew is production-floor
-- work); no HSE department grant this phase (HSE cuts across departments).

insert into role_permissions (role_key, section_key, can_view, can_create, can_edit, can_delete, can_approve) values
  ('admin','hse',true,true,true,true,true),
  ('admin','workforce',true,true,true,true,true),
  ('supervisor','hse',true,true,true,true,true),
  ('supervisor','workforce',true,true,true,true,true),
  ('controller','hse',true,false,false,false,false),
  ('controller','workforce',true,false,false,false,false),
  ('viewer','hse',true,false,false,false,false),
  ('viewer','workforce',true,false,false,false,false)
on conflict (role_key, section_key) do update set
  can_view = excluded.can_view, can_create = excluded.can_create, can_edit = excluded.can_edit,
  can_delete = excluded.can_delete, can_approve = excluded.can_approve;

insert into department_permissions (department_key, section_key, can_view, can_create, can_edit, can_delete, can_approve) values
  ('production','workforce',true,true,true,false,false)
on conflict (department_key, section_key) do update set
  can_view = excluded.can_view, can_create = excluded.can_create, can_edit = excluded.can_edit,
  can_delete = excluded.can_delete, can_approve = excluded.can_approve;

-- Done. Verify as different logged-in users:
--   select has_permission('hse','edit');        -- true for admin/supervisor, false for controller/viewer
--   select has_permission('workforce','create'); -- true for admin/supervisor, false for controller/viewer
