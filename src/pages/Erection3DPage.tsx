import React, { useEffect, useMemo, useState } from 'react'
import { fetchRows } from '../lib/erp/db'
import Scene3DShell from '../lib/erp/three/Scene3DShell'
import ElementBox, { statusColor3D } from '../lib/erp/three/ElementBox'

// No crane capacity field exists anywhere in the schema — this is a small,
// explicitly illustrative constant, not a real engineering capacity table.
const CRANE_CAPACITY_TONS: Record<string, number> = {
  'Gantry Crane 1': 25, 'Gantry Crane 2': 25, 'Tower Crane 1': 15, default: 20,
}

const PICKUP_POS: [number, number, number] = [-5, 0, -2]
const PLACEMENT_POS: [number, number, number] = [5, 0, 2]

type Step = { plan: any; elementCode: string }

export default function Erection3DPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [elements, setElements] = useState<any[]>([])
  const [stepIdx, setStepIdx] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [p, e] = await Promise.all([fetchRows('erection_planning'), fetchRows('elements')])
      setPlans(p); setElements(e)
      setLoading(false)
    }
    load()
  }, [])

  const steps: Step[] = useMemo(() => {
    const ordered = [...plans].sort((a, b) => (Number(a.sequence_no) || 0) - (Number(b.sequence_no) || 0))
    const out: Step[] = []
    for (const plan of ordered) {
      const codes = String(plan.element_codes || '').split(',').map((c: string) => c.trim()).filter(Boolean)
      for (const code of codes) out.push({ plan, elementCode: code })
    }
    return out
  }, [plans])

  const current = steps[stepIdx]
  const currentElement = current ? elements.find(e => e.element_code === current.elementCode) : null
  const craneName = current?.plan?.crane || 'default'
  const capacity = CRANE_CAPACITY_TONS[craneName] ?? CRANE_CAPACITY_TONS.default
  const weight = Number(currentElement?.weight_tons) || 0
  const withinCapacity = weight <= capacity

  if (loading) return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading erection sequence data…</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Erection Sequence <span className="text-red-500 font-light">Simulation</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Step through erection plan order, with a simplified crane capacity check</p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-[11px] text-amber-500 font-semibold">
        ⚠ Illustrative view — pickup/placement points and lift path are synthetic (no real coordinates are tracked). Crane capacity values are a small hardcoded reference, not real rated-capacity data.
      </div>

      {steps.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold">No erection plans registered.</div>
      ) : (
        <>
          <div className="flex items-center justify-between glass-panel rounded-2xl p-4 border border-white/5">
            <button
              onClick={() => setStepIdx(i => Math.max(0, i - 1))}
              disabled={stepIdx === 0}
              className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase rounded-xl disabled:opacity-30 btn-interactive"
            >
              ← Prev
            </button>
            <div className="text-center">
              <div className="text-xs font-black uppercase text-slate-500">Step {stepIdx + 1} of {steps.length}</div>
              <div className="text-sm font-bold text-neutral-900 dark:text-white mt-1">
                {current?.elementCode} — Plan {current?.plan?.plan_no} (Seq {current?.plan?.sequence_no ?? '—'}, Crane {craneName})
              </div>
            </div>
            <button
              onClick={() => setStepIdx(i => Math.min(steps.length - 1, i + 1))}
              disabled={stepIdx === steps.length - 1}
              className="px-4 py-2 bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-xs uppercase rounded-xl disabled:opacity-30 btn-interactive"
            >
              Next →
            </button>
          </div>

          <div className={`glass-panel rounded-2xl p-4 border ${withinCapacity ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-500">Crane Capacity Check</span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${withinCapacity ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {withinCapacity ? '✓ Within Capacity' : '✗ Over Capacity'}
              </span>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Element weight <strong>{weight.toFixed(1)}T</strong> vs. {craneName} reference capacity <strong>{capacity}T</strong>
            </div>
          </div>

          <Scene3DShell>
            {/* Pickup marker (wireframe ghost) */}
            <mesh position={PICKUP_POS}>
              <boxGeometry args={[1.5, 0.4, 0.8]} />
              <meshStandardMaterial color="#64748b" wireframe />
            </mesh>
            {/* Placement marker + the current element */}
            {currentElement && (
              <ElementBox
                position={PLACEMENT_POS}
                lengthM={(Number(currentElement.length_mm) || 1500) / 1000}
                widthM={(Number(currentElement.width_mm) || 800) / 1000}
                thicknessM={(Number(currentElement.thickness_mm) || 200) / 1000}
                color={statusColor3D(current.plan.status)}
                label={current.elementCode}
              />
            )}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([...PICKUP_POS, ...PLACEMENT_POS])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ef4444" />
            </line>
          </Scene3DShell>
        </>
      )}
    </div>
  )
}
