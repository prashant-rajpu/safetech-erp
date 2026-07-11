import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'

type Scene3DShellProps = {
  children: React.ReactNode
  cameraPosition?: [number, number, number]
  height?: number
  /** Disable while a drag interaction is in progress elsewhere in the scene
      (e.g. Trailer Loading Sim) so OrbitControls doesn't fight the drag gesture. */
  orbitEnabled?: boolean
}

/** Shared Canvas wrapper — lighting, orbit controls, ground grid, camera defaults.
    Every 3D view mounts its content inside this shell rather than reimplementing it. */
export default function Scene3DShell({ children, cameraPosition = [15, 12, 15], height = 480, orbitEnabled = true }: Scene3DShellProps) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/5" style={{ height }}>
      <Canvas frameloop="demand" camera={{ position: cameraPosition, fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 10]} intensity={0.9} castShadow />
        <Grid args={[60, 60]} cellColor="#334155" sectionColor="#475569" fadeDistance={40} infiniteGrid />
        <OrbitControls makeDefault enabled={orbitEnabled} minDistance={3} maxDistance={60} />
        {children}
      </Canvas>
    </div>
  )
}
