import React, { useEffect, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'

export default function CountUpCard({ label, value, accent, suffix }: { label: string, value: number, accent?: 'red' | 'default', suffix?: string }){
  const count = useMotionValue(0)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.8, ease: 'easeOut' })
    const unsub = count.on('change', v => setDisplay(Math.round(v * 10) / 10))
    return () => { controls.stop(); unsub() }
  }, [value])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-2xl glass-card-3d concrete-accent-${accent === 'red' ? 'orange' : 'cyan'}`}
    >
      <div className="text-xs uppercase tracking-widest font-semibold text-slate-400">{label}</div>
      <div className={`text-3.5xl font-extrabold mt-2 ${accent === 'red' ? 'glow-text-orange' : 'glow-text-cyan'}`}>
        {display}{suffix}
      </div>
    </motion.div>
  )
}
