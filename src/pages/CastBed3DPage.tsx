import React, { useEffect, useMemo, useState } from 'react'
import { fetchRows } from '../lib/erp/db'
import Scene3DShell from '../lib/erp/three/Scene3DShell'
import ElementBox, { statusColor3D } from '../lib/erp/three/ElementBox'
import { AlertTriangle } from 'lucide-react'

function elementsOf(row: any, elements: any[]): any[] {
  const codes = String(row.element_codes || '').split(',').map((c: string) => c.trim()).filter(Boolean)
  return elements.filter(e => codes.includes(e.element_code))
}

export default function CastBed3DPage() {
  const [beds, setBeds] = useState<any[]>([])
  const [schedule, setSchedule] = useState<any[]>([])
  const [elements, setElements] = useState<any[]>([])
  const [selectedBed, setSelectedBed] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [b, s, e] = await Promise.all([
        fetchRows('production_beds'), fetchRows('casting_schedule'), fetchRows('elements'),
      ])
      setBeds(b); setSchedule(s); setElements(e)
      if (b.length > 0) setSelectedBed(b[0].bed_name)
      setLoading(false)
    }
    load()
  }, [])

  const bed = beds.find(b => b.bed_name === selectedBed)
  const bedLengthM = Number(bed?.length_m) || 24
  const bedWidthM = Number(bed?.width_m) || 3

  const bedSchedule = useMemo(() =>
    schedule.filter(s => s.bed === selectedBed && !['Cancelled'].includes(s.status)),
    [schedule, selectedBed])

  const placedElements = useMemo(() => {
    const placed: { el: any; row: any; x: number }[] = []
    let cursorM = 0.5
    for (const row of bedSchedule) {
      for (const el of elementsOf(row, elements)) {
        const lenM = (Number(el.length_mm) || 1000) / 1000
        placed.push({ el, row, x: cursorM + lenM / 2 })
        cursorM += lenM + 0.3
      }
    }
    return placed
  }, [bedSchedule, elements])

  if (loading) return <div className="p-6 text-primary font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading cast bed 3D data…</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Cast Bed <span className="text-primary font-light">3D View</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Elements on bed, colored by casting status</p>
        </div>
        <select
          className="mt-3 md:mt-0 px-3 py-1.5 rounded-lg glowing-input text-xs w-48"
          value={selectedBed}
          onChange={e => setSelectedBed(e.target.value)}
        >
          {beds.map(b => <option key={b.id} value={b.bed_name}>{b.bed_name} ({b.length_m}m × {b.width_m}m)</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-[11px] text-amber-500 font-semibold">
        <AlertTriangle size={13} className="inline shrink-0 -mt-0.5 mr-1" />Illustrative view — bed dimensions are real ({bedLengthM}m × {bedWidthM}m), but element order along the bed is derived from schedule order, not a tracked physical position.
      </div>

      {beds.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold">No beds registered.</div>
      ) : (
        <Scene3DShell cameraPosition={[bedLengthM / 2, 10, bedWidthM * 3]}>
          <mesh position={[bedLengthM / 2, -0.05, 0]} receiveShadow>
            <boxGeometry args={[bedLengthM, 0.1, bedWidthM]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          {placedElements.map(({ el, row, x }, i) => (
            <ElementBox
              key={el.element_code + i}
              position={[x, 0, 0]}
              lengthM={(Number(el.length_mm) || 1000) / 1000}
              widthM={(Number(el.width_mm) || 500) / 1000}
              thicknessM={(Number(el.thickness_mm) || 200) / 1000}
              color={statusColor3D(row.status)}
              label={el.element_code}
            />
          ))}
        </Scene3DShell>
      )}

      {placedElements.length === 0 && beds.length > 0 && (
        <div className="text-center text-slate-500 text-sm py-4">No scheduled elements on {selectedBed}.</div>
      )}
    </div>
  )
}
