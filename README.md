# Safetech Precast ERP — Production Build

**🌐 Live demo: https://prashant-rajpu.github.io/safetech-erp/**

The demo runs entirely in your browser (localStorage-backed mock database,
auto-signed-in as admin) — no server, no signup. Data you enter stays on
your device; clear site data to reset the seeded demo content.

Full ERP for **Safetech Precast Building Manufacturing LLC (Dubai)**, strictly scoped to
precast concrete manufacturing operations (no finance / accounting / payroll / billing /
taxation / procurement). React 18 + Vite + TypeScript + Tailwind, red/black Safetech
glassmorphism with dark/light theme, running fully offline on a **localStorage-backed
mock database** — no internet or Supabase project needed.

## Run on the local network (LAN)

```
sh scripts/dev-lan.sh
```

This syncs the source from `/mnt/Gemini Cli/build` (where you edit) to `/root/build`
(ext4, where node native modules can execute), installs dependencies if missing, and
starts Vite with `--host`. Open the printed `Network:` URL (e.g. `http://<device-ip>:5173`)
from any phone/tablet/PC on the same Wi-Fi.

Manual equivalent from `/root/build`: `npm install` once, then `npx vite --host`.
Production check: `npx tsc --noEmit && npx vite build` (both pass).

The mock auth auto-signs-in as `admin@safetech.ae`. Demo data is seeded on first load
(reseed by clearing site data / localStorage).

## Navigation (11 sections)

Dashboard (6 tabs: Executive / Production / Planning / Dispatch / Yard / Quality) ·
Master Data · Design · Planning · Production · QA/QC · Stockyard · Dispatch ·
Logistics · Reports · Administration. ~45 registry-driven module screens render
through a single generic workspace at `/m/:moduleId`.

## Key workflows

- **Project Auto-Import** (`/project-import`): one project CSV auto-creates
  Project → BOQ → Drawings + R0 revisions → BOM → Elements → Casting Schedule →
  Delivery Schedule, all snapshotted for one-click cross-table undo.
- **Casting Schedule + QR** (`/casting-schedule`): plan casts per bed/shift, generate
  unique element codes (`00-<MARK><NN>-<YYMM>M-<serial>`), generate offline QR labels
  once elements are planned to cast (payload carries project / drawing / details for
  downstream departments), and completing a cast flows elements into the stockyard
  and traceability tables.
- **Gate Pass** (`/gate-pass`): numbered passes (prefix from System Settings), printable
  A5 pass with QR. Gate security flags (diesel / driver / leaving status) remain
  gate-controller-only and are never overwritten by other modules.
- **Reports Hub** (`/reports-hub`): 15 report types (daily/weekly/monthly, DPR, DTPP,
  production, productivity, yard, QA, management, drawings, planning) respecting the
  06:00 GMT+4 reporting-day boundary, with CSV / Excel / Preview / Print.
- **Every module**: CSV import wizard (drag & drop, column mapping, duplicate detection,
  validation preview, error-report download, rollback/undo), CSV/Excel/sample export,
  A4/A3 portrait/landscape print with company header, QR, barcode, signatures,
  revision line and auto pagination.
- **Administration**: role × section permission matrix (admin fixed full access;
  Edit auto-grants View), audit logs on every write, system settings.

## Legacy boards vs. module screens

Some flows appear twice in the nav on purpose — they read/write the same
tables, so data is always consistent:

- **Interactive boards** (Production Planning, Bed Planning, Element Location,
  Fleet Status Board, Dispatch Gate Log) are the tabbed operational screens
  for day-to-day work.
- **Module screens** (`/m/…`) are the registry-driven CRUD views — use them
  for bulk CSV import/export, printing registers, and record maintenance.

## Switching to a real shared database

By default the app runs on a per-browser localStorage mock (each device has
its own sandbox). To share data across devices, create a Supabase project,
apply `db/init.sql`, and set in `.env`:

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

The client (`src/lib/supabaseClient.ts`) detects these at build time and uses
the real backend automatically; remove them to fall back to offline mock mode.

## Architecture notes

- `src/lib/supabaseClient.ts` — PostgREST-style mock over localStorage (`mock_db_<table>`),
  seeds from `src/lib/erpSeeds.ts` (36 tables).
- `src/lib/qr.ts` — from-scratch offline QR encoder (byte mode, EC-M, versions 1–13,
  Reed-Solomon), verified by a syndrome/round-trip test harness.
- `src/lib/erp/registry.ts` — module + navigation registry; screens are config, not code.
- `src/lib/erp/printDoc.ts` — paginated print documents, QR label sheets, CSV/Excel export.
- Business rules preserved: 24-h reporting day 06:00→06:00 GMT+4, delivery note ≤20 rows
  on one A4, delivery report on A3, protected gate fields.

## Known gaps / next steps

- Bundle is ~1.2 MB (312 kB gzipped) — code-split per route with `React.lazy` if yard
  phones feel slow.
- The mock DB is per-browser (localStorage). To share data across devices, swap the mock
  for a real Supabase project — the client API surface already matches PostgREST.
- E2E scaffold in `tests/e2e/` still targets the legacy login flow; unit tests (Vitest) pass.
