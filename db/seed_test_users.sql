-- ═══════════════════════════════════════════════════════════════════════════
-- OPTIONAL — Phase 2 acceptance test helper.
--
-- On a real backend public.users starts empty; a row must exist for each auth
-- user (keyed by their auth uid) with a role + department, or has_permission()
-- finds no role and denies everything.
--
-- Steps:
--   1. Supabase → Authentication → Users → create these four accounts
--      (any password) so you can log in as each and observe RLS:
--        admin@safetech.ae        (admin)
--        gate@safetech.ae         (controller — has dispatch approve/gate)
--        production@safetech.ae   (supervisor)
--        viewer@safetech.ae       (viewer — read-only)
--   2. Run this file in the SQL Editor. It maps each auth user to a role +
--      department by email, into public.users.
--
-- After this: log in as viewer@ and confirm a write is REJECTED by RLS (not just
-- greyed out), e.g. in the browser console:
--   await supabase.from('elements').insert([{ element_code: 'TEST-1' }])
--   → { error: { message: 'new row violates row-level security policy ...' } }
-- Then as admin@ change viewer's grants in Permissions and re-test — access
-- changes immediately, no redeploy.
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.users (id, email, role, department)
select
  u.id,
  u.email,
  case u.email
    when 'admin@safetech.ae'      then 'admin'
    when 'gate@safetech.ae'       then 'controller'
    when 'production@safetech.ae' then 'supervisor'
    else 'viewer'
  end as role,
  case u.email
    when 'gate@safetech.ae'       then 'dispatch'
    when 'production@safetech.ae' then 'production'
    else 'management'
  end as department
from auth.users u
where u.email in (
  'admin@safetech.ae', 'gate@safetech.ae', 'production@safetech.ae', 'viewer@safetech.ae'
)
on conflict (id) do update
  set role = excluded.role, department = excluded.department, email = excluded.email;

-- Verify the mapping:
select email, role, department from public.users order by role;
