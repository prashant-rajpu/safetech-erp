-- Safetech Precast ERP — complete operations schema (58 tables)
-- Generated from the application's seed modules (legacySeeds.ts + erpSeeds.ts)
-- so column names/types match the frontend exactly. This file REPLACES the
-- need to run db/init.sql for data tables; run init.sql only if you want its
-- auth trigger/user bootstrap. Then set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
-- Scope: precast manufacturing operations only (no finance/procurement).

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  project_no text,
  project_name text,
  location text,
  client text,
  consultant text,
  status text,
  active boolean,
  created_at timestamptz not null default now()
);
alter table projects enable row level security;
create policy "authenticated full access" on projects for all to authenticated using (true) with check (true);

create table if not exists trailers (
  id uuid primary key default gen_random_uuid(),
  plate_no text,
  supplier text,
  type text,
  created_at timestamptz not null default now()
);
alter table trailers enable row level security;
create policy "authenticated full access" on trailers for all to authenticated using (true) with check (true);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text,
  supplier_type text,
  contact_person text,
  phone text,
  email text,
  status text,
  created_at timestamptz not null default now()
);
alter table suppliers enable row level security;
create policy "authenticated full access" on suppliers for all to authenticated using (true) with check (true);

create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  project_no text,
  project_name text,
  location text,
  trailer_id text,
  element_type text,
  element_count integer,
  dn_no text,
  volume_cum numeric,
  weight_tons numeric,
  delivery_date text,
  delivery_timestamp text,
  remarks text,
  created_at timestamptz not null default now()
);
alter table deliveries enable row level security;
create policy "authenticated full access" on deliveries for all to authenticated using (true) with check (true);

create table if not exists fleet_status (
  id uuid primary key default gen_random_uuid(),
  trailer_id text,
  status_text text,
  site_location text,
  driver_name text,
  driver_phone text,
  status_timestamp text,
  created_at timestamptz not null default now()
);
alter table fleet_status enable row level security;
create policy "authenticated full access" on fleet_status for all to authenticated using (true) with check (true);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text,
  role text,
  created_at timestamptz not null default now()
);
alter table users enable row level security;
create policy "authenticated full access" on users for all to authenticated using (true) with check (true);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  contact_person text,
  email text,
  phone text,
  status text,
  created_at timestamptz not null default now()
);
alter table customers enable row level security;
create policy "authenticated full access" on customers for all to authenticated using (true) with check (true);

create table if not exists concrete_grades (
  id uuid primary key default gen_random_uuid(),
  grade text,
  grade_name text,
  created_at timestamptz not null default now()
);
alter table concrete_grades enable row level security;
create policy "authenticated full access" on concrete_grades for all to authenticated using (true) with check (true);

create table if not exists mix_designs (
  id uuid primary key default gen_random_uuid(),
  mix_code text,
  concrete_grade text,
  cement_type text,
  w_c_ratio numeric,
  created_at timestamptz not null default now()
);
alter table mix_designs enable row level security;
create policy "authenticated full access" on mix_designs for all to authenticated using (true) with check (true);

create table if not exists element_types (
  id uuid primary key default gen_random_uuid(),
  type_name text,
  type_code text,
  created_at timestamptz not null default now()
);
alter table element_types enable row level security;
create policy "authenticated full access" on element_types for all to authenticated using (true) with check (true);

create table if not exists production_beds (
  id uuid primary key default gen_random_uuid(),
  bed_name text,
  length_m integer,
  width_m numeric,
  type text,
  created_at timestamptz not null default now()
);
alter table production_beds enable row level security;
create policy "authenticated full access" on production_beds for all to authenticated using (true) with check (true);

create table if not exists moulds (
  id uuid primary key default gen_random_uuid(),
  mould_name text,
  type text,
  product_width_m numeric,
  created_at timestamptz not null default now()
);
alter table moulds enable row level security;
create policy "authenticated full access" on moulds for all to authenticated using (true) with check (true);

create table if not exists yard_bays (
  id uuid primary key default gen_random_uuid(),
  bay_name text,
  capacity_pcs integer,
  zone text,
  created_at timestamptz not null default now()
);
alter table yard_bays enable row level security;
create policy "authenticated full access" on yard_bays for all to authenticated using (true) with check (true);

create table if not exists crane_operators (
  id uuid primary key default gen_random_uuid(),
  name text,
  license_no text,
  status text,
  created_at timestamptz not null default now()
);
alter table crane_operators enable row level security;
create policy "authenticated full access" on crane_operators for all to authenticated using (true) with check (true);

create table if not exists qc_inspectors (
  id uuid primary key default gen_random_uuid(),
  name text,
  certification_no text,
  status text,
  created_at timestamptz not null default now()
);
alter table qc_inspectors enable row level security;
create policy "authenticated full access" on qc_inspectors for all to authenticated using (true) with check (true);

create table if not exists reinforcement_tracking (
  id uuid primary key default gen_random_uuid(),
  cage_id text,
  element_code text,
  steel_weight_kg numeric,
  fabricator text,
  inspection_status text,
  status text,
  created_at timestamptz not null default now()
);
alter table reinforcement_tracking enable row level security;
create policy "authenticated full access" on reinforcement_tracking for all to authenticated using (true) with check (true);

create table if not exists qc_inspections (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  pre_pour_check boolean,
  reinforcement_check boolean,
  cover_check boolean,
  embedded_items_check boolean,
  dimensions_check boolean,
  concrete_test_ref text,
  inspector text,
  qc_result text,
  created_at timestamptz not null default now()
);
alter table qc_inspections enable row level security;
create policy "authenticated full access" on qc_inspections for all to authenticated using (true) with check (true);

create table if not exists yard_movement (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  from_bay text,
  to_bay text,
  crane text,
  operator text,
  movement_time text,
  remarks text,
  created_at timestamptz not null default now()
);
alter table yard_movement enable row level security;
create policy "authenticated full access" on yard_movement for all to authenticated using (true) with check (true);

create table if not exists maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  equipment_type text,
  equipment_id text,
  maintenance_date text,
  description text,
  technician text,
  status text,
  created_at timestamptz not null default now()
);
alter table maintenance_logs enable row level security;
create policy "authenticated full access" on maintenance_logs for all to authenticated using (true) with check (true);

create table if not exists production_casting (
  id uuid primary key default gen_random_uuid(),
  casting_id text,
  cast_date text,
  shift text,
  bed_mould_id text,
  supervisor text,
  concrete_grade text,
  batch_number text,
  mix_design text,
  volume_cum numeric,
  weight_tons numeric,
  start_time text,
  finish_time text,
  qc_status text,
  remarks text,
  created_at timestamptz not null default now()
);
alter table production_casting enable row level security;
create policy "authenticated full access" on production_casting for all to authenticated using (true) with check (true);

create table if not exists stockyard_inventory (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  project_no text,
  building text,
  floor text,
  zone text,
  element_type text,
  revision text,
  length_mm integer,
  width_mm integer,
  thickness_mm integer,
  volume_cum numeric,
  weight_tons numeric,
  cast_date text,
  bay_location text,
  status text,
  curing_days integer,
  remarks text,
  created_at timestamptz not null default now()
);
alter table stockyard_inventory enable row level security;
create policy "authenticated full access" on stockyard_inventory for all to authenticated using (true) with check (true);

create table if not exists element_traceability (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  planning_timestamp text,
  casting_timestamp text,
  qc_timestamp text,
  curing_timestamp text,
  stockyard_timestamp text,
  loading_timestamp text,
  dispatch_timestamp text,
  delivery_timestamp text,
  erection_timestamp text,
  completed_timestamp text,
  created_at timestamptz not null default now()
);
alter table element_traceability enable row level security;
create policy "authenticated full access" on element_traceability for all to authenticated using (true) with check (true);

create table if not exists consultants (
  id uuid primary key default gen_random_uuid(),
  name text,
  contact_person text,
  phone text,
  email text,
  status text,
  created_at timestamptz not null default now()
);
alter table consultants enable row level security;
create policy "authenticated full access" on consultants for all to authenticated using (true) with check (true);

create table if not exists reinforcement_types (
  id uuid primary key default gen_random_uuid(),
  ref_code text,
  description text,
  diameter_mm integer,
  unit text,
  standard text,
  status text,
  created_at timestamptz not null default now()
);
alter table reinforcement_types enable row level security;
create policy "authenticated full access" on reinforcement_types for all to authenticated using (true) with check (true);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  plate_no text,
  type text,
  make text,
  model_year text,
  owner text,
  status text,
  created_at timestamptz not null default now()
);
alter table vehicles enable row level security;
create policy "authenticated full access" on vehicles for all to authenticated using (true) with check (true);

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  name text,
  mobile text,
  license_no text,
  license_expiry text,
  assigned_plate text,
  status text,
  created_at timestamptz not null default now()
);
alter table drivers enable row level security;
create policy "authenticated full access" on drivers for all to authenticated using (true) with check (true);

create table if not exists drawings (
  id uuid primary key default gen_random_uuid(),
  drawing_no text,
  project_no text,
  title text,
  type text,
  element_type text,
  revision text,
  status text,
  issued_date text,
  received_date text,
  created_at timestamptz not null default now()
);
alter table drawings enable row level security;
create policy "authenticated full access" on drawings for all to authenticated using (true) with check (true);

create table if not exists drawing_revisions (
  id uuid primary key default gen_random_uuid(),
  drawing_no text,
  revision text,
  rev_date text,
  description text,
  status text,
  issued_by text,
  created_at timestamptz not null default now()
);
alter table drawing_revisions enable row level security;
create policy "authenticated full access" on drawing_revisions for all to authenticated using (true) with check (true);

create table if not exists boq_items (
  id uuid primary key default gen_random_uuid(),
  project_no text,
  item_code text,
  description text,
  element_type text,
  unit text,
  qty integer,
  volume_cum integer,
  weight_tons integer,
  created_at timestamptz not null default now()
);
alter table boq_items enable row level security;
create policy "authenticated full access" on boq_items for all to authenticated using (true) with check (true);

create table if not exists bom_items (
  id uuid primary key default gen_random_uuid(),
  project_no text,
  drawing_no text,
  material text,
  spec text,
  unit text,
  qty_per_element numeric,
  elements integer,
  total_qty numeric,
  created_at timestamptz not null default now()
);
alter table bom_items enable row level security;
create policy "authenticated full access" on bom_items for all to authenticated using (true) with check (true);

create table if not exists elements (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  project_no text,
  drawing_no text,
  revision text,
  element_type text,
  building text,
  floor text,
  zone text,
  length_mm integer,
  width_mm integer,
  thickness_mm integer,
  volume_cum numeric,
  weight_tons numeric,
  concrete_grade text,
  mix_design text,
  planned_cast_date text,
  bed text,
  mould text,
  assigned_mould text,
  cast_revision text,
  qr_generated boolean,
  qr_generated_at text,
  priority text,
  status text,
  cast_date text,
  remarks text,
  created_at timestamptz not null default now()
);
alter table elements enable row level security;
create policy "authenticated full access" on elements for all to authenticated using (true) with check (true);

create table if not exists casting_schedule (
  id uuid primary key default gen_random_uuid(),
  schedule_date text,
  shift text,
  bed text,
  project_no text,
  drawing_no text,
  element_codes text,
  qty integer,
  priority text,
  status text,
  remarks text,
  created_at timestamptz not null default now()
);
alter table casting_schedule enable row level security;
create policy "authenticated full access" on casting_schedule for all to authenticated using (true) with check (true);

create table if not exists concrete_batches (
  id uuid primary key default gen_random_uuid(),
  batch_no text,
  batch_date text,
  mix_code text,
  grade text,
  volume_cum numeric,
  slump_mm integer,
  temp_c integer,
  cube_ref text,
  plant text,
  water_added_litres integer,
  status text,
  created_at timestamptz not null default now()
);
alter table concrete_batches enable row level security;
create policy "authenticated full access" on concrete_batches for all to authenticated using (true) with check (true);

create table if not exists finishing_works (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  work_type text,
  work_date text,
  crew text,
  hours numeric,
  status text,
  remarks text,
  created_at timestamptz not null default now()
);
alter table finishing_works enable row level security;
create policy "authenticated full access" on finishing_works for all to authenticated using (true) with check (true);

create table if not exists repair_works (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  defect text,
  severity text,
  repair_method text,
  repair_date text,
  approved_by text,
  source_ncr_no text,
  status text,
  created_at timestamptz not null default now()
);
alter table repair_works enable row level security;
create policy "authenticated full access" on repair_works for all to authenticated using (true) with check (true);

create table if not exists incoming_inspections (
  id uuid primary key default gen_random_uuid(),
  inspection_date text,
  material text,
  supplier text,
  qty text,
  batch_ref text,
  result text,
  inspector text,
  remarks text,
  created_at timestamptz not null default now()
);
alter table incoming_inspections enable row level security;
create policy "authenticated full access" on incoming_inspections for all to authenticated using (true) with check (true);

create table if not exists mix_approvals (
  id uuid primary key default gen_random_uuid(),
  mix_code text,
  grade text,
  trial_date text,
  cube_7d_mpa numeric,
  cube_28d_mpa numeric,
  result text,
  approved_by text,
  remarks text,
  created_at timestamptz not null default now()
);
alter table mix_approvals enable row level security;
create policy "authenticated full access" on mix_approvals for all to authenticated using (true) with check (true);

create table if not exists post_casting_inspections (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  inspection_date text,
  surface_finish text,
  cracks text,
  honeycombing text,
  edges text,
  result text,
  inspector text,
  created_at timestamptz not null default now()
);
alter table post_casting_inspections enable row level security;
create policy "authenticated full access" on post_casting_inspections for all to authenticated using (true) with check (true);

create table if not exists dimensional_inspections (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  inspection_date text,
  length_dev_mm integer,
  width_dev_mm integer,
  thickness_dev_mm integer,
  diagonal_dev_mm integer,
  tolerance text,
  result text,
  inspector text,
  created_at timestamptz not null default now()
);
alter table dimensional_inspections enable row level security;
create policy "authenticated full access" on dimensional_inspections for all to authenticated using (true) with check (true);

create table if not exists finishing_inspections (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  inspection_date text,
  finish_grade text,
  patch_quality text,
  paint_ready text,
  result text,
  inspector text,
  remarks text,
  created_at timestamptz not null default now()
);
alter table finishing_inspections enable row level security;
create policy "authenticated full access" on finishing_inspections for all to authenticated using (true) with check (true);

create table if not exists ncr_register (
  id uuid primary key default gen_random_uuid(),
  ncr_no text,
  ncr_date text,
  project_no text,
  element_code text,
  description text,
  category text,
  severity text,
  root_cause text,
  corrective_action text,
  status text,
  raised_by text,
  closed_date text,
  created_at timestamptz not null default now()
);
alter table ncr_register enable row level security;
create policy "authenticated full access" on ncr_register for all to authenticated using (true) with check (true);

create table if not exists punch_list (
  id uuid primary key default gen_random_uuid(),
  item_no text,
  project_no text,
  element_code text,
  photo_ref text,
  location text,
  description text,
  raised_date text,
  due_date text,
  assigned_to text,
  status text,
  created_at timestamptz not null default now()
);
alter table punch_list enable row level security;
create policy "authenticated full access" on punch_list for all to authenticated using (true) with check (true);

create table if not exists storage_zones (
  id uuid primary key default gen_random_uuid(),
  zone_name text,
  description text,
  bays text,
  capacity_pcs integer,
  current_pcs integer,
  status text,
  created_at timestamptz not null default now()
);
alter table storage_zones enable row level security;
create policy "authenticated full access" on storage_zones for all to authenticated using (true) with check (true);

create table if not exists crane_planning (
  id uuid primary key default gen_random_uuid(),
  plan_date text,
  shift text,
  crane text,
  operator text,
  activity text,
  element_codes text,
  from_loc text,
  to_loc text,
  status text,
  created_at timestamptz not null default now()
);
alter table crane_planning enable row level security;
create policy "authenticated full access" on crane_planning for all to authenticated using (true) with check (true);

create table if not exists delivery_schedule (
  id uuid primary key default gen_random_uuid(),
  schedule_date text,
  project_no text,
  project_name text,
  element_type text,
  qty integer,
  trailer_type_req text,
  trips_est integer,
  priority text,
  status text,
  created_at timestamptz not null default now()
);
alter table delivery_schedule enable row level security;
create policy "authenticated full access" on delivery_schedule for all to authenticated using (true) with check (true);

create table if not exists allocations (
  id uuid primary key default gen_random_uuid(),
  alloc_date text,
  dispatch_no text,
  trailer_plate text,
  trailer_type text,
  driver_name text,
  project_no text,
  shift text,
  loading_time text,
  departure_time text,
  destination text,
  status text,
  created_at timestamptz not null default now()
);
alter table allocations enable row level security;
create policy "authenticated full access" on allocations for all to authenticated using (true) with check (true);

create table if not exists gate_passes (
  id uuid primary key default gen_random_uuid(),
  gp_no text,
  gp_date text,
  trailer_plate text,
  driver_name text,
  project_no text,
  dn_no text,
  items_desc text,
  issued_by text,
  time_out text,
  status text,
  created_at timestamptz not null default now()
);
alter table gate_passes enable row level security;
create policy "authenticated full access" on gate_passes for all to authenticated using (true) with check (true);

create table if not exists dispatch_checklists (
  id uuid primary key default gen_random_uuid(),
  dn_no text,
  check_date text,
  trailer_plate text,
  straps_chains text,
  a_frames_racks text,
  edge_protection text,
  permits_route text,
  escort_required text,
  checked_by text,
  status text,
  created_at timestamptz not null default now()
);
alter table dispatch_checklists enable row level security;
create policy "authenticated full access" on dispatch_checklists for all to authenticated using (true) with check (true);

create table if not exists dispatch_log (
  id uuid primary key default gen_random_uuid(),
  trailer_id text,
  plate_no text,
  supplier_name text,
  trailer_type text,
  driver_name text,
  project_no text,
  do_no text,
  shift text,
  diesel_status boolean,
  driver_status boolean,
  dn_status boolean,
  leaving_status boolean,
  remarks text,
  log_date text,
  created_at timestamptz not null default now()
);
alter table dispatch_log enable row level security;
create policy "authenticated full access" on dispatch_log for all to authenticated using (true) with check (true);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  trip_date text,
  trailer_plate text,
  driver_name text,
  project_no text,
  dn_no text,
  departure text,
  arrival_site text,
  return_time text,
  km_out integer,
  km_in integer,
  km_total integer,
  status text,
  created_at timestamptz not null default now()
);
alter table trips enable row level security;
create policy "authenticated full access" on trips for all to authenticated using (true) with check (true);

create table if not exists fuel_logs (
  id uuid primary key default gen_random_uuid(),
  fill_date text,
  plate_no text,
  vehicle_type text,
  litres integer,
  odometer_km integer,
  station text,
  filled_by text,
  remarks text,
  created_at timestamptz not null default now()
);
alter table fuel_logs enable row level security;
create policy "authenticated full access" on fuel_logs for all to authenticated using (true) with check (true);

create table if not exists vehicle_inspections (
  id uuid primary key default gen_random_uuid(),
  inspection_date text,
  plate_no text,
  inspection_type text,
  brakes text,
  lights text,
  tyres text,
  hydraulics text,
  coupling text,
  result text,
  inspector text,
  created_at timestamptz not null default now()
);
alter table vehicle_inspections enable row level security;
create policy "authenticated full access" on vehicle_inspections for all to authenticated using (true) with check (true);

create table if not exists tyre_history (
  id uuid primary key default gen_random_uuid(),
  change_date text,
  plate_no text,
  position text,
  action text,
  brand text,
  odometer_km integer,
  remarks text,
  created_at timestamptz not null default now()
);
alter table tyre_history enable row level security;
create policy "authenticated full access" on tyre_history for all to authenticated using (true) with check (true);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  role_key text,
  label text,
  description text,
  created_at timestamptz not null default now()
);
alter table roles enable row level security;
create policy "authenticated full access" on roles for all to authenticated using (true) with check (true);

create table if not exists role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_key text,
  section_key text,
  can_view boolean,
  can_create boolean,
  can_edit boolean,
  can_delete boolean,
  can_approve boolean,
  created_at timestamptz not null default now()
);
alter table role_permissions enable row level security;
-- Placeholder open policy; replaced by real per-section policies in
-- db/rls_policies.sql (run that last). Do not open the system to many users
-- until rls_policies.sql has been applied.
create policy "authenticated full access" on role_permissions for all to authenticated using (true) with check (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  ts text,
  user_email text,
  action text,
  table_name text,
  record_id text,
  details text,
  created_at timestamptz not null default now()
);
alter table audit_logs enable row level security;
create policy "authenticated full access" on audit_logs for all to authenticated using (true) with check (true);

create table if not exists system_settings (
  id uuid primary key default gen_random_uuid(),
  key text,
  value text,
  created_at timestamptz not null default now()
);
alter table system_settings enable row level security;
create policy "authenticated full access" on system_settings for all to authenticated using (true) with check (true);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  req_date text,
  type text,
  reference text,
  description text,
  requested_by text,
  approver text,
  status text,
  created_at timestamptz not null default now()
);
alter table approvals enable row level security;
create policy "authenticated full access" on approvals for all to authenticated using (true) with check (true);

-- NOTE: the demo policy above grants every signed-in user full access.
-- Tighten per-table policies (e.g. gate-controller-only columns on
-- dispatch_log) before opening the system to many users.
