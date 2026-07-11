import React, { useEffect, useMemo, useRef, useState } from 'react'
import { fetchRows } from '../lib/erp/db'
import Scene3DShell from '../lib/erp/three/Scene3DShell'
import DraggableElementBox from '../lib/erp/three/DraggableElementBox'
import { statusColor3D } from '../lib/erp/three/ElementBox'
import { AlertTriangle, Check, X } from 'lucide-react'

const LOADABLE_STATUSES = ['Stockyard', 'Curing']

type Pos = [number, number, number]

export default function TrailerLoadSim3DPage() {
  const [trailers, setTrailers] = useState<any[]>([])
  const [trailerTypes, setTrailerTypes] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [selectedPlate, setSelectedPlate] = useState('')
  const [loading, setLoading] = useState(true)

  const [positions, setPositions] = useState<Record<string, Pos>>({})
  const [placedIds, setPlacedIds] = useState<Set<string>>(new Set())
  const draggingId = useRef<string | null>(null)
  const [draggingIdState, setDraggingIdState] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [tr, tt, inv] = await Promise.all([
        fetchRows('trailers'), fetchRows('trailer_types'), fetchRows('stockyard_inventory'),
      ])
      setTrailers(tr); setTrailerTypes(tt); setInventory(inv)
      if (tr.length > 0) setSelectedPlate(tr[0].plate_no)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    function onWindowPointerUp() { draggingId.current = null; setDraggingIdState(null) }
    window.addEventListener('pointerup', onWindowPointerUp)
    return () => window.removeEventListener('pointerup', onWindowPointerUp)
  }, [])

  const trailer = trailers.find(t => t.plate_no === selectedPlate)
  const trailerType = trailerTypes.find(t => (t.type_name || '').toLowerCase() === (trailer?.trailer_type || '').toLowerCase())

  const loadableElements = useMemo(() =>
    inventory.filter(i => LOADABLE_STATUSES.includes(i.status)),
    [inventory])

  // Stage newly-seen elements in a row beside the bed the first time they appear
  const bedLengthM = trailerType ? (Number(trailerType.bed_length_mm) || 0) / 1000 : 0
  const bedWidthM = trailerType ? (Number(trailerType.bed_width_mm) || 0) / 1000 : 0
  useEffect(() => {
    if (!trailerType) return
    setPositions(prev => {
      const next = { ...prev }
      let cursor = 0
      for (const el of loadableElements) {
        if (!next[el.element_code]) {
          next[el.element_code] = [-(bedLengthM / 2) - 3, 0, cursor]
          cursor += 2
        }
      }
      return next
    })
  }, [loadableElements, trailerType, bedLengthM])

  function handleDragStart(id: string) {
    draggingId.current = id
    setDraggingIdState(id)
    setPlacedIds(prev => new Set(prev).add(id))
  }

  function handleGroundPointerMove(e: any) {
    if (!draggingId.current) return
    e.stopPropagation()
    setPositions(prev => ({ ...prev, [draggingId.current!]: [e.point.x, 0, e.point.z] }))
  }

  function handleGroundPointerUp() {
    draggingId.current = null
    setDraggingIdState(null)
  }

  const placedElements = loadableElements.filter(el => placedIds.has(el.element_code))
  const totalWeight = placedElements.reduce((a, el) => a + (Number(el.weight_tons) || 0), 0)
  const capacity = trailerType ? Number(trailerType.max_weight_tons) || 0 : 0
  const withinCapacity = !trailerType ? true : totalWeight <= capacity

  function isOutOfBounds(el: any): boolean {
    if (!placedIds.has(el.element_code) || !trailerType) return false
    const [x, , z] = positions[el.element_code] || [0, 0, 0]
    const lenM = (Number(el.length_mm) || 1000) / 1000
    const widM = (Number(el.width_mm) || 500) / 1000
    return (
      x - lenM / 2 < -bedLengthM / 2 || x + lenM / 2 > bedLengthM / 2 ||
      z - widM / 2 < -bedWidthM / 2 || z + widM / 2 > bedWidthM / 2
    )
  }

  const anyOutOfBounds = placedElements.some(isOutOfBounds)

  if (loading) return <div className="p-6 text-primary font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading trailer loading simulation…</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Trailer Loading <span className="text-primary font-light">3D Simulation</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Drag elements onto the trailer bed to check fit and weight capacity</p>
        </div>
        <select
          className="mt-3 md:mt-0 px-3 py-1.5 rounded-lg glowing-input text-xs w-56"
          value={selectedPlate}
          onChange={e => { setSelectedPlate(e.target.value); setPositions({}); setPlacedIds(new Set()) }}
        >
          {trailers.map(t => <option key={t.id} value={t.plate_no}>{t.plate_no} ({t.trailer_type || 'no type set'})</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-[11px] text-amber-500 font-semibold">
        <AlertTriangle size={13} className="inline shrink-0 -mt-0.5 mr-1" />Illustrative live check only — nothing here is saved. Checks bed-boundary fit and total weight vs. capacity; does not detect elements overlapping each other.
      </div>

      {trailers.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold">No trailers registered.</div>
      ) : !trailerType ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold space-y-2">
          <div>No capacity data configured for trailer type "{trailer?.trailer_type || '—'}".</div>
          <div className="text-xs">Add bed dimensions and max weight via Master Data → Trailer Types before simulating this trailer.</div>
        </div>
      ) : (
        <>
          <div className={`glass-panel rounded-2xl p-4 border ${withinCapacity && !anyOutOfBounds ? 'border-emerald-500/30' : 'border-primary/30'}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black uppercase text-slate-500">
                {trailer.trailer_type} — Bed {(bedLengthM).toFixed(1)}m × {bedWidthM.toFixed(1)}m
              </span>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${withinCapacity ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                  {totalWeight.toFixed(1)}T / {capacity}T {withinCapacity ? <Check size={11} /> : <><X size={11} /> Over Capacity</>}
                </span>
                {anyOutOfBounds && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20 inline-flex items-center gap-1">
                    <X size={11} /> Element(s) Out of Bed Bounds
                  </span>
                )}
              </div>
            </div>
          </div>

          <Scene3DShell cameraPosition={[0, 10, bedWidthM * 4 + 4]} orbitEnabled={!draggingIdState}>
            {/* Large invisible ground plane — captures pointer moves during drag across bed + staging area */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, -0.01, 0]}
              onPointerMove={handleGroundPointerMove}
              onPointerUp={handleGroundPointerUp}
            >
              <planeGeometry args={[bedLengthM + 30, bedWidthM + 20]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {/* Trailer bed platform */}
            <mesh position={[0, -0.05, 0]} receiveShadow>
              <boxGeometry args={[bedLengthM, 0.1, bedWidthM]} />
              <meshStandardMaterial color="#334155" />
            </mesh>

            {loadableElements.map(el => (
              <DraggableElementBox
                key={el.element_code}
                id={el.element_code}
                position={positions[el.element_code] || [0, 0, 0]}
                lengthM={(Number(el.length_mm) || 1000) / 1000}
                widthM={(Number(el.width_mm) || 500) / 1000}
                thicknessM={(Number(el.thickness_mm) || 200) / 1000}
                color={statusColor3D(el.status)}
                label={el.element_code}
                isDragging={draggingIdState === el.element_code}
                isInvalid={isOutOfBounds(el)}
                onDragStart={handleDragStart}
              />
            ))}
          </Scene3DShell>

          {loadableElements.length === 0 && (
            <div className="text-center text-slate-500 text-sm py-4">No elements currently in Stockyard/Curing status to load.</div>
          )}
        </>
      )}
    </div>
  )
}
