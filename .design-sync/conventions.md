## Safetech Precast ERP — conventions

**This is an application's internal component set, not a published UI library.** Only 7 components exist (`AlertsPanel`, `CountUpCard`, `Typeahead`, `NavBar`, `Sidebar`, `ModuleWorkspace`, `ImportWizard`) — there is no Button/Card/Badge/Dialog primitive layer. Visual consistency comes from Tailwind utility classes repeated directly in page JSX plus a small custom-class theme layer (below), not from a component abstraction.

**Dark by default.** The app initializes to dark theme (`document.documentElement.classList.add('dark')`) and most surface/accent colors are tuned for that near-black backdrop (`.dark body { background-color: #08080a }`). When composing with these components — especially `AlertsPanel`, whose alert pills use colors like `bg-red-950/20 text-red-300` — wrap the composition root in a `dark` class on an ancestor element, or colors will read as washed-out on a white canvas.

**4 of the 7 components cannot render standalone**: `NavBar`, `Sidebar`, `ModuleWorkspace`, `ImportWizard` all call `useAuth()`, which throws unless wrapped in the app's real `<AuthProvider>` — and that provider itself requires a live, authenticated Supabase session with no way to fake one via props. Don't compose these into a new design expecting them to render in isolation; they're real, fully-typed, and correct against the actual app's runtime, but only render when actually running inside Safetech's authenticated app shell.

**Custom class family** (layered on top of Tailwind; real names, verified against the shipped stylesheet):
| Class | Use |
|---|---|
| `glass-panel` | Frosted glassmorphism panel (nav bars, containers) — light/dark variants both defined |
| `glass-card-3d` | Elevated stat/metric card backdrop (used by `CountUpCard`) |
| `glowing-input` | Form input with red-accent focus glow |
| `btn-interactive` | Hover/active lift + shadow transition for buttons |
| `concrete-bg` | Page-level subtle grid/texture background |
| `concrete-accent-{gray\|red}` / `glow-text-{gray\|red}` | Accent pairs for stat highlighting — **only `gray` and `red` are defined**; `CountUpCard`'s default styling references `-cyan`/`-orange` variants that don't exist anywhere in the stylesheet (a pre-existing app bug, not a design-sync gap — the glow silently no-ops for non-red accents) |
| `status-live` | Pulsing "live" status indicator animation |
| `warning-card` / `safety-accent` | Orange-accented warning/callout treatments |
| `rev-badge` | Small monospace revision-number badge |

Brand font is **Outfit** (loaded at runtime via Google Fonts CDN in `index.html`, not shipped locally — falls back to system sans-serif here).

**Where the truth lives**: the bound `styles.css` (imports the compiled Tailwind output + this theme layer) and each component's own `.prompt.md`/`.d.ts` in `components/<group>/<Name>/`.

**Idiomatic build snippet** (real, verified pattern — a stat card composed like the actual dashboard):
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <CountUpCard label="Today's Trips" value={18} />
  <CountUpCard label="Open NCRs" value={3} accent="red" />
</div>
```
