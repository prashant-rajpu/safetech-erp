import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Alert } from '../lib/analytics'

export default function AlertsPanel({ alerts }: { alerts: Alert[] }){
  if(alerts.length === 0) return null

  return (
    <div className="mb-6 space-y-2">
      <AnimatePresence>
        {alerts.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-4 rounded-xl border text-sm backdrop-blur flex items-center gap-3 ${
              a.severity === 'high'
                ? 'bg-red-950/20 border-red-500/30 text-red-300 shadow-lg shadow-red-500/5'
                : 'bg-amber-950/20 border-amber-500/30 text-amber-300 shadow-lg shadow-amber-500/5'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 animate-ping ${a.severity === 'high' ? 'bg-red-400' : 'bg-amber-400'}`} />
            <span className="font-medium">{a.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
