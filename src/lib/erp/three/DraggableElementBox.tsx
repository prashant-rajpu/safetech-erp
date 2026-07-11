import React from 'react'
import { Html } from '@react-three/drei'

type DraggableElementBoxProps = {
  id: string
  position: [number, number, number]
  lengthM: number
  widthM: number
  thicknessM: number
  color: string
  label: string
  isDragging: boolean
  isInvalid: boolean
  onDragStart: (id: string) => void
}

/** Interactive counterpart to ElementBox.tsx — used only by the Trailer
    Loading Simulation. Drag state is owned by the parent page (not this
    component): pointer-down here just tells the page "start dragging me",
    and the page's bed-plane onPointerMove/onPointerUp does the actual
    world-space positioning via R3F's built-in pointer events (event.point),
    so no manual THREE.Raycaster code is needed anywhere. */
export default function DraggableElementBox({
  id, position, lengthM, widthM, thicknessM, color, label, isDragging, isInvalid, onDragStart,
}: DraggableElementBoxProps) {
  const dims: [number, number, number] = [
    Math.max(lengthM, 0.2), Math.max(thicknessM, 0.1), Math.max(widthM, 0.2)
  ]
  const displayColor = isInvalid ? '#ef4444' : color

  return (
    <group position={position}>
      <mesh
        position={[0, dims[1] / 2, 0]}
        onPointerDown={(e) => { e.stopPropagation(); onDragStart(id) }}
      >
        <boxGeometry args={dims} />
        <meshStandardMaterial
          color={displayColor}
          emissive={isDragging ? displayColor : '#000000'}
          emissiveIntensity={isDragging ? 0.5 : 0}
          transparent
          opacity={isDragging ? 0.75 : 1}
        />
      </mesh>
      <Html position={[0, dims[1] + 0.3, 0]} center distanceFactor={12}>
        <div className={`px-1.5 py-0.5 rounded text-white text-[9px] font-mono whitespace-nowrap pointer-events-none ${isInvalid ? 'bg-primary-dark' : 'bg-black/80'}`}>
          {label}{isDragging ? ' ✥' : ''}
        </div>
      </Html>
    </group>
  )
}
