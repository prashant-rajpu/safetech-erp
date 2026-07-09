import CountUpCard from '../../src/components/CountUpCard'

// Ported from real dashboard usage (src/pages/Dashboard.tsx) — the primary
// variant axis is `accent` (default cyan glow vs. red-flag glow for
// attention metrics like open NCRs / delayed elements).

export function Default() {
  return <CountUpCard label="Today's Trips" value={18} />
}

export function RedAccent() {
  return <CountUpCard label="Open NCRs" value={3} accent="red" />
}

export function WithSuffix() {
  return <CountUpCard label="Today's Volume (m³)" value={42.6} suffix=" m³" />
}

export function LargeValue() {
  return <CountUpCard label="Elements Tracked" value={1247} />
}
