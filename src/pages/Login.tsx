import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|undefined>(undefined)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) =>{
    e.preventDefault()
    setLoading(true)
    setError(undefined)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if(error){
      setError(error.message)
      setLoading(false)
      return
    }
    setLoading(false)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="glass-panel rounded-3xl p-8 max-w-md w-full border border-primary/10 shadow-2xl relative overflow-hidden flex flex-col items-center">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary-dark to-black" />
        
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-black border border-neutral-800 flex items-center justify-center p-1.5 shadow-xl shadow-primary/10 mb-4">
          <img src="/safetech_logo.png" alt="Logo" className="w-full h-full object-contain rounded-xl" />
        </div>
        
        <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-wider uppercase mb-1">SAFETECH</h2>
        <p className="text-xs uppercase tracking-widest text-primary font-bold mb-8">Operations Control Panel</p>
        
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 block mb-1.5">Email Address</span>
            <input 
              className="w-full px-4 py-3 rounded-xl glowing-input focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 font-medium" 
              placeholder="name@safetech.ae"
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
            />
          </label>
          
          <label className="block">
            <span className="text-xs uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 block mb-1.5">Password</span>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-xl glowing-input focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 font-medium" 
              placeholder="••••••••"
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
            />
          </label>
          
          {error && (
            <div className="text-xs font-bold text-primary uppercase tracking-wide bg-primary-dark/20 border border-primary/10 p-3 rounded-xl flex items-center gap-1.5">
              <AlertTriangle size={13} className="shrink-0" /> {error}
            </div>
          )}
          
          <button 
            className="w-full bg-gradient-to-br from-primary to-primary-dark text-white py-3.5 rounded-xl font-extrabold uppercase tracking-wider text-xs btn-interactive shadow-lg shadow-primary/20" 
            disabled={loading}
          >
            {loading ? 'Authorizing Terminal...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}
