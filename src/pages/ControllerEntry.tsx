import React, { useState } from 'react'
import DispatchForm from './DispatchForm'
import FleetStatusForm from './FleetStatusForm'
import DeliveryForm from './DeliveryForm'

type Tab = 'dispatch' | 'fleet' | 'delivery'

export default function ControllerEntry({ defaultTab = 'dispatch' }: { defaultTab?: Tab }){
  const [tab, setTab] = useState<Tab>(defaultTab)

  React.useEffect(() => {
    setTab(defaultTab)
  }, [defaultTab])

  const tabs: { key: Tab, label: string }[] = [
    { key: 'dispatch', label: 'Dispatch Log' },
    { key: 'fleet', label: 'Fleet Status' },
    { key: 'delivery', label: 'Delivery Receipt' },
  ]

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white uppercase">
            Data Entry <span className="text-red-500 font-light">Terminal</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Submit logistics, dispatch, and delivery notes into the Safetech database</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel p-2.5 rounded-2xl max-w-xl mx-auto flex gap-2 border border-white/5 shadow-lg shadow-black/40">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={()=>setTab(t.key)}
            className={`flex-1 py-3 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all duration-300 btn-interactive ${
              tab === t.key 
                ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md shadow-red-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Forms Container */}
      <div className="glass-panel rounded-2xl p-6 max-w-3xl mx-auto border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Concrete girder lines on form */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-red-800 to-black" />
        
        {tab === 'dispatch' && <DispatchForm />}
        {tab === 'fleet' && <FleetStatusForm />}
        {tab === 'delivery' && <DeliveryForm />}
      </div>
    </div>
  )
}
