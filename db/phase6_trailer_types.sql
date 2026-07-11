-- Phase 6 extension: Trailer Loading Simulation — trailer bed dimensions/capacity.
-- Ships EMPTY on purpose. No real trailer specs are known; per this project's
-- "never present fabricated data as real" principle, none are invented here.
-- Populate real specs via /m/trailer-types before the simulation is useful.

create table if not exists trailer_types (
  id uuid primary key default gen_random_uuid(),
  type_name text,
  bed_length_mm integer,
  bed_width_mm integer,
  max_weight_tons numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  updated_by text
);

alter table trailer_types enable row level security;

do $$
declare
  t text := 'trailer_types';
  sec text := 'master';
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
