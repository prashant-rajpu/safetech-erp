-- Phase 5: Formwork / Mould Preparation — the one genuine schema gap.
-- moulds is a master-list table only (mould_name/type/product_width_m); nothing
-- tracks the actual mould-prep workflow (setup/strike/inspection/condition).
-- Reuses the 'production' RBAC section (same as concrete_batches/production_casting).

create table if not exists mould_preparation_log (
  id uuid primary key default gen_random_uuid(),
  mould_name text,
  bed text,
  activity text check (activity in ('Setup','Strike','Inspection','Cleaning','Repair')),
  scheduled_date date,
  completed_date date,
  condition text check (condition in ('Good','Minor Damage','Major Damage','Under Repair')),
  reuse_count integer,
  technician text,
  remarks text,
  status text default 'Scheduled' check (status in ('Scheduled','Completed','On Hold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

alter table mould_preparation_log enable row level security;

do $$
declare
  t text := 'mould_preparation_log';
  sec text := 'production';
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
