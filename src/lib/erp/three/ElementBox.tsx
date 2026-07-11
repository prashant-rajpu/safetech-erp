import React from 'react'
import { Html } from '@react-three/drei'

/** Hex-color counterpart to statusChipClass() in uiHelpers.ts — same status
    vocabulary/categorization, WebGL materials can't consume Tailwind classes. */
export function statusColor3D(value: string): string {
  const v = String(value || '').toLowerCase()
  if (/(pass|approved|active|completed|cleared|accepted|ready|delivered|closed|current|confirmed|allocated|exited)/.test(v)) return '#10b981'
  if (/(pending|hold|review|tentative|progress|curing|planned|scheduled|standby|loading|issued|conditional|observation|generated)/.test(v)) return '#f59e0b'
  if (/(fail|reject|open|critical|major|cancel|superseded|workshop|retired)/.test(v)) return '#ef4444'
  return '#64748b'
}

type ElementBoxProps = {
  position: [number, number, number]
  lengthM: number
  widthM: number
  thicknessM: number
  color: string
  label: string
}

/** A single precast element rendered as a box primitive, scaled to its real
    dimensions. shape_type (when populated) is not yet used for geometry —
    every element renders as a box, matching the "no detailed shape" non-goal. */
export default function ElementBox({ position, lengthM, widthM, thicknessM, color, label }: ElementBoxProps) {
  const dims: [number, number, number] = [
    Math.max(lengthM, 0.2), Math.max(thicknessM, 0.1), Math.max(widthM, 0.2)
  ]
  return (
    <group position={position}>
      <mesh position={[0, dims[1] / 2, 0]} castShadow>
        <boxGeometry args={dims} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Html position={[0, dims[1] + 0.3, 0]} center distanceFactor={12}>
        <div className="px-1.5 py-0.5 rounded bg-black/80 text-white text-[9px] font-mono whitespace-nowrap pointer-events-none">
          {label}
        </div>
      </Html>
    </group>
  )
}
