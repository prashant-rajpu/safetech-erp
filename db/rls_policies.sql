-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2 — Dynamic permission engine, enforced by Postgres RLS.
--
-- Run LAST, after db/init.sql and db/erp_schema.sql, in the Supabase SQL editor.
-- Idempotent: safe to re-run (re-running RESETS the permission matrix to the
-- defaults below — edit grants afterwards from the in-app Permissions screen).
--
-- What this does:
--   1. Aligns the RBAC schema with the app's permission engine
--      (roles / departments / permissions / role_permissions /
--       department_permissions), converting users.role from a fixed enum to a
--      dynamic text role and adding users.department.
--   2. Seeds the role/department permission matrix (mirrors src/lib/erpSeeds.ts).
--   3. Defines has_permission(section, action) — the exact SQL twin of
--      permissionEngine.ts hasPermission(): admin-always, role ∪ department,
--      create→edit fallback, missing rows deny.
--   4. Replaces the placeholder "authenticated full access" policies with real
--      per-table policies keyed to each table's section (see tableSections.ts).
--   5. Protects the dispatch gate columns with a trigger, and locks
--      Administration / Role Management to admin.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. RBAC schema alignment ────────────────────────────────────────────────

create table if not exists roles (
  role_key text primary key, label text, description text, locked boolean default false
);
create table if not exists departments (
  department_key text primary key, label text, description text
);
create table if not exists permissions (
  action_key text primary key, label text, description text
);
create table if not exists role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_key text not null, section_key text not null,
  can_view boolean default false, can_create boolean default false, can_edit boolean default false,
  can_delete boolean default false, can_approve boolean default false
);
create table if not exists department_permissions (
  id uuid primary key default gen_random_uuid(),
  department_key text not null, section_key text not null,
  can_view boolean default false, can_create boolean default false, can_edit boolean default false,
  can_delete boolean default false, can_approve boolean default false
);

-- erp_schema.sql may have created role_permissions with only can_view/can_edit —
-- widen it to the full 5-action model.
alter table role_permissions add column if not exists can_view boolean default false;
alter table role_permissions add column if not exists can_create boolean default false;
alter table role_permissions add column if not exists can_edit boolean default false;
alter table role_permissions add column if not exists can_delete boolean default false;
alter table role_permissions add column if not exists can_approve boolean default false;

-- Upsert targets for the seed below.
create unique index if not exists role_permissions_role_section_uidx on role_permissions(role_key, section_key);
create unique index if not exists department_permissions_dept_section_uidx on department_permissions(department_key, section_key);

-- Convert the fixed enum role to a dynamic text role + add department.
-- (No-ops if already text / already present.)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'users'
      and column_name = 'role' and data_type = 'USER-DEFINED'
  ) then
    alter table users alter column role drop default;
    alter table users alter column role type text using role::text;
    alter table users alter column role set default 'viewer';
  end if;
end $$;
alter table users add column if not exists department text;

-- ── 2. Seed the permission matrix (mirrors src/lib/erpSeeds.ts) ──────────────

insert into roles (role_key, label, description, locked) values
  ('admin',      'Administrator',        'Full access — all modules, settings, and user management (locked)', true),
  ('controller', 'Controller',           'Operational access incl. dispatch gate authority (approve on Dispatch)', false),
  ('supervisor', 'Production Supervisor','Full control of Planning, Production and QA/QC; read-only elsewhere', false),
  ('viewer',     'Viewer',               'Read-only access to dashboards, registers, and reports', false)
on conflict (role_key) do nothing;

insert into permissions (action_key, label, description) values
  ('view',   'View',   'See the section in navigation and open its screens read-only'),
  ('create', 'Create', 'Add new records and import CSV data'),
  ('edit',   'Edit',   'Modify existing records and undo imports'),
  ('delete', 'Delete', 'Remove records'),
  ('approve','Approve','Approve requests and control protected fields (e.g. dispatch gate flags)')
on conflict (action_key) do nothing;

insert into departments (department_key, label, description) values
  ('production','Production Department','Casting, reinforcement, finishing crews'),
  ('qaqc',      'QA / QC Department',   'Quality inspectors and engineers'),
  ('stockyard', 'Stockyard Department', 'Yard, crane and storage teams'),
  ('dispatch',  'Dispatch & Gate',      'Gate controllers and dispatch coordinators'),
  ('logistics', 'Logistics Department', 'Fleet, trips and maintenance'),
  ('planning',  'Planning Department',  'Production planners and schedulers'),
  ('design',    'Design Office',        'Drawings, BOQ and revisions'),
  ('management','Management',           'Plant and project management')
on conflict (department_key) do nothing;

-- role_permissions: role_key × section_key × 5 flags. DO UPDATE so setup is
-- authoritative even if erp_schema seeded partial rows.
insert into role_permissions (role_key, section_key, can_view, can_create, can_edit, can_delete, can_approve) values
  ('admin','dashboard',true,true,true,true,true),
  ('admin','master',true,true,true,true,true),
  ('admin','design',true,true,true,true,true),
  ('admin','planning',true,true,true,true,true),
  ('admin','production',true,true,true,true,true),
  ('admin','qaqc',true,true,true,true,true),
  ('admin','stockyard',true,true,true,true,true),
  ('admin','dispatch',true,true,true,true,true),
  ('admin','logistics',true,true,true,true,true),
  ('admin','reports',true,true,true,true,true),
  ('admin','admin',true,true,true,true,true),
  ('controller','dashboard',true,false,false,false,false),
  ('controller','master',true,false,false,false,false),
  ('controller','design',true,true,true,false,false),
  ('controller','planning',true,true,true,false,false),
  ('controller','production',true,true,true,false,false),
  ('controller','qaqc',true,true,true,false,false),
  ('controller','stockyard',true,true,true,false,false),
  ('controller','dispatch',true,true,true,false,true),
  ('controller','logistics',true,true,true,false,false),
  ('controller','reports',true,false,false,false,false),
  ('controller','admin',false,false,false,false,false),
  ('supervisor','dashboard',true,false,false,false,false),
  ('supervisor','master',true,false,false,false,false),
  ('supervisor','design',true,false,false,false,false),
  ('supervisor','planning',true,true,true,true,true),
  ('supervisor','production',true,true,true,true,true),
  ('supervisor','qaqc',true,true,true,true,true),
  ('supervisor','stockyard',true,false,false,false,false),
  ('supervisor','dispatch',true,false,false,false,false),
  ('supervisor','logistics',true,false,false,false,false),
  ('supervisor','reports',true,false,false,false,false),
  ('supervisor','admin',false,false,false,false,false),
  ('viewer','dashboard',true,false,false,false,false),
  ('viewer','master',true,false,false,false,false),
  ('viewer','design',true,false,false,false,false),
  ('viewer','planning',true,false,false,false,false),
  ('viewer','production',true,false,false,false,false),
  ('viewer','qaqc',true,false,false,false,false),
  ('viewer','stockyard',true,false,false,false,false),
  ('viewer','dispatch',true,false,false,false,false),
  ('viewer','logistics',true,false,false,false,false),
  ('viewer','reports',true,false,false,false,false),
  ('viewer','admin',false,false,false,false,false)
on conflict (role_key, section_key) do update set
  can_view = excluded.can_view, can_create = excluded.can_create, can_edit = excluded.can_edit,
  can_delete = excluded.can_delete, can_approve = excluded.can_approve;

insert into department_permissions (department_key, section_key, can_view, can_create, can_edit, can_delete, can_approve) values
  ('production','production',true,true,true,false,false),
  ('qaqc','qaqc',true,true,true,false,true),
  ('stockyard','stockyard',true,true,true,false,false),
  ('logistics','logistics',true,true,true,false,false),
  ('planning','planning',true,true,true,false,false),
  ('design','design',true,true,true,false,false)
on conflict (department_key, section_key) do update set
  can_view = excluded.can_view, can_create = excluded.can_create, can_edit = excluded.can_edit,
  can_delete = excluded.can_delete, can_approve = excluded.can_approve;

-- ── 3. Permission helper (SQL twin of permissionEngine.ts hasPermission) ─────
-- SECURITY DEFINER so it reads users/role_permissions without re-triggering RLS
-- (avoids "infinite recursion in policy for relation users").
create or replace function public.has_permission(p_section text, p_action text)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_role text;
  v_dept text;
  v_ok   boolean;
begin
  select role, department into v_role, v_dept from users where id = auth.uid();
  if v_role is null then return false; end if;
  if v_role = 'admin' then return true; end if;

  -- role grant (create falls back to edit, matching rowAllows())
  select case p_action
           when 'view'    then can_view
           when 'create'  then coalesce(can_create, can_edit)
           when 'edit'    then can_edit
           when 'delete'  then can_delete
           when 'approve' then can_approve
           else false end
    into v_ok
    from role_permissions where role_key = v_role and section_key = p_section;
  if v_ok then return true; end if;

  -- department grant (union)
  if v_dept is not null and v_dept <> '' then
    select case p_action
             when 'view'    then can_view
             when 'create'  then coalesce(can_create, can_edit)
             when 'edit'    then can_edit
             when 'delete'  then can_delete
             when 'approve' then can_approve
             else false end
      into v_ok
      from department_permissions where department_key = v_dept and section_key = p_section;
    if v_ok then return true; end if;
  end if;

  return false;
end $$;

-- ── 4. Per-table policies ────────────────────────────────────────────────────

-- 4a. Operational tables: full CRUD gated by the table's section.
--     (table, section) mirrors TABLE_SECTIONS in src/lib/erp/tableSections.ts.
do $$
declare
  rec record;
  pol record;
begin
  for rec in
    select * from (values
      -- master
      ('projects','master'),('customers','master'),('consultants','master'),
      ('production_beds','master'),('moulds','master'),('element_types','master'),
      ('mix_designs','master'),('reinforcement_types','master'),('vehicles','master'),
      ('trailers','master'),('drivers','master'),('suppliers','master'),
      -- design
      ('drawings','design'),('drawing_revisions','design'),('boq_items','design'),
      -- planning
      ('bom_items','planning'),('elements','planning'),('casting_schedule','planning'),
      -- production
      ('reinforcement_tracking','production'),('concrete_batches','production'),
      ('finishing_works','production'),('repair_works','production'),
      ('concrete_grades','production'),('production_casting','production'),
      -- qaqc
      ('incoming_inspections','qaqc'),('mix_approvals','qaqc'),('qc_inspections','qaqc'),
      ('post_casting_inspections','qaqc'),('dimensional_inspections','qaqc'),
      ('finishing_inspections','qaqc'),('ncr_register','qaqc'),('punch_list','qaqc'),
      ('qc_inspectors','qaqc'),
      -- stockyard
      ('yard_bays','stockyard'),('storage_zones','stockyard'),('stockyard_inventory','stockyard'),
      ('yard_movement','stockyard'),('crane_planning','stockyard'),('crane_operators','stockyard'),
      ('element_traceability','stockyard'),
      -- dispatch
      ('delivery_schedule','dispatch'),('allocations','dispatch'),('dispatch_checklists','dispatch'),
      ('dispatch_log','dispatch'),('gate_passes','dispatch'),('deliveries','dispatch'),
      -- logistics
      ('trips','logistics'),('fuel_logs','logistics'),('vehicle_inspections','logistics'),
      ('tyre_history','logistics'),('fleet_status','logistics'),('maintenance_logs','logistics'),
      -- administration (approvals only — the RBAC tables get special policies below)
      ('approvals','admin')
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

-- 4b. Reference tables: readable by every authenticated user (the engine must
--     read these to compute grants), writable by admin only. This is what keeps
--     Role Management protected while still letting non-admins load their perms.
do $$
declare
  rec text;
  pol record;
begin
  foreach rec in array array['roles','departments','permissions','role_permissions','department_permissions','system_settings']
  loop
    if to_regclass('public.' || rec) is null then continue; end if;
    execute format('alter table public.%I enable row level security', rec);
    for pol in select policyname from pg_policies where schemaname='public' and tablename=rec loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, rec);
    end loop;
    execute format('create policy %I on public.%I for select to authenticated using (true)', rec||'_sel', rec);
    execute format('create policy %I on public.%I for insert to authenticated with check (has_permission(%L,%L))', rec||'_ins', rec, 'admin', 'create');
    execute format('create policy %I on public.%I for update to authenticated using (has_permission(%L,%L)) with check (has_permission(%L,%L))', rec||'_upd', rec, 'admin', 'edit', 'admin', 'edit');
    execute format('create policy %I on public.%I for delete to authenticated using (has_permission(%L,%L))', rec||'_del', rec, 'admin', 'delete');
  end loop;
end $$;

-- 4c. audit_logs: append-only. Any authenticated user may INSERT (writes are
--     logged on every legitimate action); only admin may read / update / delete.
do $$
declare pol record;
begin
  if to_regclass('public.audit_logs') is not null then
    alter table public.audit_logs enable row level security;
    for pol in select policyname from pg_policies where schemaname='public' and tablename='audit_logs' loop
      execute format('drop policy if exists %I on public.audit_logs', pol.policyname);
    end loop;
    create policy audit_logs_ins on public.audit_logs for insert to authenticated with check (true);
    create policy audit_logs_sel on public.audit_logs for select to authenticated using (has_permission('admin','view'));
    create policy audit_logs_upd on public.audit_logs for update to authenticated using (has_permission('admin','edit')) with check (has_permission('admin','edit'));
    create policy audit_logs_del on public.audit_logs for delete to authenticated using (has_permission('admin','delete'));
  end if;
end $$;

-- 4d. users: a user may read their own row; admin manages all. RLS was defined
--     in init.sql but never enabled there — enable it so those policies bite.
do $$
declare pol record;
begin
  if to_regclass('public.users') is not null then
    alter table public.users enable row level security;
    for pol in select policyname from pg_policies where schemaname='public' and tablename='users' loop
      execute format('drop policy if exists %I on public.users', pol.policyname);
    end loop;
    create policy users_self_select on public.users for select to authenticated using (id = auth.uid());
    create policy users_admin_read  on public.users for select to authenticated using (has_permission('admin','view'));
    create policy users_admin_write on public.users for all    to authenticated using (has_permission('admin','edit')) with check (has_permission('admin','edit'));
  end if;
end $$;

-- ── 5. Dispatch gate column protection ───────────────────────────────────────
-- diesel_status / driver_status / leaving_status may only be set by a user with
-- approve on 'dispatch'. Mirrors GATE_PROTECTED_FIELDS in DispatchForm.tsx.
create or replace function public.enforce_gate_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if has_permission('dispatch','approve') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.diesel_status := false; new.driver_status := false; new.leaving_status := false;
  elsif tg_op = 'UPDATE' then
    new.diesel_status := old.diesel_status;
    new.driver_status := old.driver_status;
    new.leaving_status := old.leaving_status;
  end if;
  return new;
end $$;

do $$
begin
  if to_regclass('public.dispatch_log') is not null
     and exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='dispatch_log' and column_name='diesel_status') then
    drop trigger if exists trg_enforce_gate_fields on public.dispatch_log;
    create trigger trg_enforce_gate_fields
      before insert or update on public.dispatch_log
      for each row execute function public.enforce_gate_fields();
  end if;
end $$;

-- Done. Verify as different logged-in users:
--   select has_permission('dispatch','approve');   -- true only for controller/admin
--   insert into elements (...) ...;                 -- rejected for viewer by RLS
