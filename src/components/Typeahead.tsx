import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Typeahead({ value, onChange, table, column, placeholder }: { value:string, onChange:(v:string)=>void, table:string, column:string, placeholder?:string }){
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(()=>{
    let mounted = true
    if(!value) return setSuggestions([])
    
    supabase.from(table).select(column).ilike(column, `${value}%`).limit(10).then((res: any)=>{
      if(!mounted) return
      const rows = (res.data || []) as any[]
      // Filter out duplicate strings to keep autocomplete clean
      const uniqueVals = Array.from(new Set(rows.map(r=>r[column]).filter(Boolean)))
      setSuggestions(uniqueVals)
    })
    return ()=>{ mounted = false }
  }, [value])

  return (
    <div className="relative">
      <input 
        className="w-full px-4 py-3 rounded-xl glowing-input focus:outline-none placeholder-slate-500 font-medium" 
        placeholder={placeholder} 
        value={value} 
        onChange={e=>onChange(e.target.value)} 
      />
      {suggestions.length>0 && (
        <div className="absolute left-0 right-0 mt-2 bg-[#12141a]/95 backdrop-blur-md rounded-xl border border-white/10 max-h-40 overflow-auto z-50 shadow-2xl shadow-black/80">
          {suggestions.map(s=> (
            <div 
              key={s} 
              className="px-4 py-2.5 hover:bg-cyan-500/20 hover:text-cyan-300 cursor-pointer text-xs font-semibold border-b border-white/5 last:border-b-0 transition-colors duration-150" 
              onClick={()=>{
                onChange(s)
                setSuggestions([])
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
