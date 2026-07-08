# Safetech ERP — Local Network Hosting Guide

How to host the ERP on your own device so anyone on the same Wi-Fi
(phones, tablets, office PCs) can open it for **preview and review**.
No internet needed — the app runs fully offline on a browser-local database.

---

## The two folders (important)

| Folder | Role |
|---|---|
| `/mnt/Gemini Cli/build` | **Canonical source** — edit code here; this is the git repo |
| `/root/build` | **Toolchain copy** — run all `npm` / `vite` commands here (the phone-storage mount cannot execute node native modules) |

After editing on the mount, sync before running anything:
```
sh "/mnt/Gemini Cli/build/scripts/dev-lan.sh"
```
That one command syncs source → `/root/build`, installs dependencies if
missing, and starts the LAN dev server (skip to Option A below).

---

## Option A — Dev server (live reload, for active development)

```
cd /root/build
npx vite --host
```

Vite prints the addresses, e.g.:
```
➜  Local:   http://localhost:5173/
➜  Network: http://10.150.16.167:5173/   ← share this one
```
Open the **Network** URL on any device on the same Wi-Fi.

## Option B — Production preview (fast, what reviewers should see)

Serves the optimized `dist/` bundle exactly as it would run in production:

```
cd /root/build
npx vite build        # only needed after code changes
npx vite preview --host
```

Runs at port **4173** → share `http://<device-ip>:4173/`.

## Option C — Serve the prebuilt `dist/` with any static server

A ready-built copy of `dist/` already exists in **both** folders. Any
static file server can host it — no build step, no node_modules:

```
cd /root/build/dist          # or "/mnt/Gemini Cli/build/dist"
python3 -m http.server 8080 --bind 0.0.0.0
```
Open `http://<device-ip>:8080/`. (`404.html` is included for deep-link
refreshes on hosts that support it; with plain `http.server`, start from
the root URL and navigate inside the app.)

---

## Finding your device IP

- Vite prints it (Option A/B) — easiest.
- Android: Settings → Wi-Fi → current network → IP address.
- Or: `ifconfig 2>/dev/null | grep 'inet '`.

The IP can change when the router reassigns leases; if the link stops
working for others, re-check the IP (or give this device a static/
reserved IP in your router settings).

## Review checklist for testers

1. Open the Network URL — you are auto-signed-in as `admin@safetech.ae`.
2. Demo data is seeded automatically on first load.
3. Each browser keeps its **own** data (localStorage) — testers do not
   see each other's entries; that is expected with the mock database.
4. To reset a device to fresh demo data: browser Settings → Site data →
   Clear, then reload.
5. QR labels: Planning → Casting Schedule → plan a cast → Generate QR.
   Print dialogs work from Chrome on desktop and Android.

## Troubleshooting

- **Other devices can't connect**: both devices must be on the same
  Wi-Fi network; some guest/hotspot networks block device-to-device
  traffic ("AP isolation") — use a normal home/office network or your
  own phone hotspot.
- **Blank page from `dist/`**: serve the folder root (don't open
  `index.html` via `file://`) — the app needs an HTTP server.
- **`vite: command not found` / native module errors**: you are in the
  wrong folder — run toolchain commands from `/root/build`, never from
  the mount.
- **Public demo** (internet, not LAN): already deployed at
  https://prashant-rajpu.github.io/safetech-erp/ — redeploy by building
  with `--base=/safetech-erp/` and force-pushing `dist/` to `gh-pages`.
