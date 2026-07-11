-- Phase 4: Logistics — Stack Planning
-- Adds a planned bay/position/stack-order table for elements, distinct from the
-- reactive yard_movement log. Reuses the 'stockyard' RBAC section (no dedicated
-- 'stack'/'crane' section exists in this schema).

create table if not exists stack_plans (
  id uuid primary key default gen_random_uuid(),
  element_code text,
  project_no text,
  planned_bay text,
  planned_position integer,
  planned_date date,
  status text check (status in ('Planned','Executed','Cancelled')) default 'Planned',
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

-- RLS: real has_permission() policies, same pattern as phase1_data_spine.sql / phase3_traceability.sql
alter table stack_plans enable row level security;

do $$
declare
  t text := 'stack_plans';
  sec text := 'stockyard';
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
