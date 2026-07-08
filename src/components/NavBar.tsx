import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

export default function NavBar(){
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if(!user || !profile) return null

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="glass-panel rounded-2xl px-6 py-4 mb-8 flex items-center justify-between z-50 relative border border-red-500/10 shadow-lg shadow-red-950/20 no-print">
      {/* Brand Logo / Title */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-red-500/40">
            S
          </div>
          <span className="font-extrabold tracking-wider text-white text-lg">
            SAFETECH <span className="text-red-500 font-light">CENTER</span>
          </span>
        </div>
        
        {/* Divider */}
        <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>

        {/* Navigation Links */}
        <div className="hidden sm:flex items-center gap-2">
          <Link 
            to="/dashboard" 
            className={`text-sm px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
              isActive('/dashboard') 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            Dashboard
          </Link>
          {(profile.role === 'controller' || profile.role === 'admin') && (
            <>
              <Link 
                to="/entry" 
                className={`text-sm px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                  isActive('/entry') 
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                Log Entry
              </Link>
              <Link 
                to="/delivery-note" 
                className={`text-sm px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                  isActive('/delivery-note') 
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                Delivery Notes
              </Link>
            </>
          )}
          <Link 
            to="/reports" 
            className={`text-sm px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
              isActive('/reports') 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            Reports
          </Link>
          {profile.role === 'admin' && (
            <>
              <Link 
                to="/admin" 
                className={`text-sm px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                  isActive('/admin') 
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                Control Panel
              </Link>
              <Link 
                to="/import" 
                className={`text-sm px-4 py-2 rounded-xl transition-all duration-300 font-medium ${
                  isActive('/import') 
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                Import Logs
              </Link>
            </>
          )}
        </div>
      </div>

      {/* User Info / Actions */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col text-right">
          <span className="text-xs font-semibold text-slate-300">{profile.email}</span>
          <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold">{profile.role}</span>
        </div>
        <button 
          onClick={handleSignOut} 
          className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 px-4 py-2 rounded-xl btn-interactive transition-all duration-200"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
