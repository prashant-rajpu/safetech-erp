import React, { useEffect, useMemo, useState } from 'react'
import { fetchRows } from '../lib/erp/db'
import Scene3DShell from '../lib/erp/three/Scene3DShell'
import ElementBox, { statusColor3D } from '../lib/erp/three/ElementBox'

const BAY_SPACING_M = 6

export default function YardStack3DPage() {
  const [bays, setBays] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [stackPlans, setStackPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [b, inv, sp] = await Promise.all([
        fetchRows('yard_bays'), fetchRows('stockyard_inventory'), fetchRows('stack_plans'),
      ])
      setBays(b); setInventory(inv); setStackPlans(sp)
      setLoading(false)
    }
    load()
  }, [])

  const bayGroups = useMemo(() => {
    const bayNames = bays.length > 0 ? bays.map(b => b.bay_name) : Array.from(new Set(inventory.map(i => i.bay_location).filter(Boolean)))
    return bayNames.map((bayName, bayIdx) => {
      const items = inventory.filter(i => i.bay_location === bayName)
      const positionMap = new Map(stackPlans.filter(p => p.planned_bay === bayName).map(p => [p.element_code, p.planned_position]))
      const ordered = [...items].sort((a, b) => (positionMap.get(a.element_code) ?? 999) - (positionMap.get(b.element_code) ?? 999))
      return { bayName, x: bayIdx * BAY_SPACING_M, items: ordered }
    })
  }, [bays, inventory, stackPlans])

  if (loading) return <div className="p-6 text-red-500 font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading yard 3D data…</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Yard / Stack <span className="text-red-500 font-light">3D View</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Elements by bay, colored by erection-readiness</p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-[11px] text-amber-500 font-semibold">
        ⚠ Illustrative view — bay layout spacing is invented (no bay geometry is tracked); stack order uses Stack Planning's position where a plan exists, else insertion order.
      </div>

      {bayGroups.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold">No bays or stockyard inventory registered.</div>
      ) : (
        <Scene3DShell cameraPosition={[bayGroups.length * BAY_SPACING_M / 2, 12, 16]}>
          {bayGroups.map(({ bayName, x, items }) => (
            <group key={bayName}>
              <mesh position={[x, -0.05, 0]} receiveShadow>
                <boxGeometry args={[3, 0.1, 3]} />
                <meshStandardMaterial color="#1e293b" />
              </mesh>
              {items.map((item, i) => (
                <ElementBox
                  key={item.element_code}
                  position={[x, i * 0.6, 0]}
                  lengthM={(Number(item.length_mm) || 3000) / 1000}
                  widthM={(Number(item.width_mm) || 1200) / 1000}
                  thicknessM={0.5}
                  color={statusColor3D(item.status)}
                  label={item.element_code}
                />
              ))}
            </group>
          ))}
        </Scene3DShell>
      )}
    </div>
  )
}
