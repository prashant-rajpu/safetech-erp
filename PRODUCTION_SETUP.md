# Safetech Precast ERP — Production Setup Runbook

The app ships in **offline demo mode** (per-browser localStorage database,
auto-login as admin). This runbook takes it to **real multi-user company
operation**. Time needed: roughly one hour.

## Step 1 — Create the shared database (Supabase)

1. Create a free project at https://supabase.com (choose a region near Dubai,
   e.g. `me-central-1` / `ap-south-1`).
2. In the SQL Editor run, **in this order**:
   - `db/init.sql` — legacy core tables (users, projects, trailers, deliveries…)
   - `db/erp_schema.sql` — all ERP operations tables (generated to match the
     frontend exactly)
   - `db/rls_policies.sql` — **the permission engine**: converts users.role to a
     dynamic role, seeds the roles/departments permission matrix, defines
     `has_permission(section, action)`, and replaces the placeholder
     "authenticated full access" policies with real per-section Row-Level
     Security. Run this last; it is idempotent (re-running resets the matrix to
     defaults).
3. Note your **Project URL** and **anon key** (Settings → API).

## Step 2 — Point the app at the database

Create `.env` in the project root:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Rebuild (`npx vite build`). The client detects the env vars and switches from
the localStorage mock to the real backend automatically — no code changes.

## Step 3 — Real user accounts

1. Supabase → Authentication → Users → create each employee's account
   (email + password).
2. Seed the first admin row:
   `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed_admin.js <AUTH_UID> <email>`
3. Log in as admin → **Administration → Users** to set each person's role
   (viewer / controller / supervisor / admin) and **department**, and
   **Administration → Permissions** to tune per-section access. Grants apply
   immediately at the database level (RLS reads the matrix live) — no redeploy.

## Step 4 — Load your real master data

Order matters — masters first, then operational data:

1. **Master Data**: Projects, Clients, Consultants, Beds, Moulds, Element
   Types, Mix Designs, Vehicles, Trailers, Drivers, Suppliers — each module
   screen has *Sample CSV* (template) → fill → *Import CSV* (with validation,
   duplicate detection and one-click undo).
2. **Per project**: use **Planning → Project Auto-Import** — one CSV creates
   the project, BOQ, drawing register, BOM, element register, casting
   schedule and delivery plan in one pass.
3. Remove demo rows via each module's delete, or start from a clean database
   (skip seeding is automatic in real-backend mode).

## Step 5 — Hosting for the whole company

Pick one:

- **Office LAN only** (no internet exposure): any PC/server runs
  `scripts/dev-lan.sh` or serves `dist/` statically (see
  LOCAL_HOSTING_GUIDE.md). Give the host machine a reserved IP.
- **Internet (work from site/anywhere)**: host `dist/` on GitHub Pages
  (already set up), Netlify, Vercel or S3 — the app is static files; the
  data lives in Supabase either way.

## Step 6 — Operational hygiene

- **Backups**: Supabase runs daily backups on paid tiers; on the free tier,
  schedule regular exports. In offline/LAN mode use **Administration →
  Backup & Restore** to download JSON snapshots.
- **Printing**: test the A4 delivery note, A3 delivery report, and QR label
  sheets on the office printer once (Chrome print dialog, margins default).
- **QR scanning**: any phone camera or the built-in **Stockyard → QR Scanner**
  screen reads the labels; `token[1]` of the payload is the element code.
- **Security**: with `db/rls_policies.sql` applied, access is enforced
  server-side by Row-Level Security keyed to the live permission matrix — a
  signed-in user can only read/write the sections their role or department
  grants. The gate security columns (`diesel_status`, `driver_status`,
  `leaving_status`) are locked to Dispatch *approve* authority by a database
  trigger, and Administration / Role Management is admin-only. Verify by logging
  in as a non-admin and confirming a direct write is rejected.

## What is intentionally NOT in this system

Finance, Accounting, Payroll, Billing, Taxation and Procurement are out of
scope by design — pair the ERP with your existing accounting package.

## Quick health check after setup

1. Log in from two different devices — both see the same data.
2. Import a master CSV → rows appear on the other device.
3. Plan a casting → Generate QR → label prints with project/drawing details.
4. Complete a casting → element appears in Stockyard as Curing.
5. Create a gate pass → printable A5 pass with QR.
6. Reports → Daily Report shows today's activity (06:00-to-06:00 day).
