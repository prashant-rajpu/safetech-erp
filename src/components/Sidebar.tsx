import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import safetechLogo from '../assets/safetech_logo.png'
import { NAV_SECTIONS } from '../lib/erp/registry'
import { usePermissions } from '../lib/erp/usePermissions'
import { useAuth } from '../lib/useAuth'

type SidebarProps = {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const location = useLocation()
  const { profile } = useAuth()
  const { canView } = usePermissions()
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ dashboard: true })

  // Load and apply theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const initialTheme = savedTheme || 'dark'
    setTheme(initialTheme)
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Auto-expand the section owning the current route
  useEffect(() => {
    const current = location.pathname + location.search
    for (const section of NAV_SECTIONS) {
      if (section.items.some(it => it.path === current || (it.path.startsWith('/m/') && location.pathname === it.path))) {
        setExpandedMenus(prev => ({ ...prev, [section.key]: true }))
        break
      }
    }
  }, [location.pathname, location.search])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleSection = (key: string) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const visibleSections = NAV_SECTIONS.filter(s => canView(s.key))

  const isItemActive = (path: string) => {
    const current = location.pathname + location.search
    if (path.includes('?')) return current === path
    return location.pathname === path
  }

  return (
    <>
      {/* Mobile Drawer Overlay Background */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* SIDEBAR WRAPPER */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-[#0c0c0f] border-r border-slate-200 dark:border-red-500/10 shadow-2xl z-50 transform md:transform-none transition-transform duration-300 flex flex-col justify-between no-print ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>

        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-black border border-neutral-800 flex items-center justify-center p-1 shrink-0 shadow-lg shadow-black/25">
              <img src={safetechLogo} alt="Safetech" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-black text-sm tracking-tight text-neutral-900 dark:text-white leading-none">SAFETECH</span>
              <span className="text-[10px] text-red-500 font-extrabold uppercase mt-0.5 tracking-widest leading-none">OPERATIONS</span>
              <span className="text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider truncate">Control Panel</span>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-grow py-4 overflow-y-auto px-3.5 space-y-2">
          {visibleSections.map(section => {
            const isExpanded = !!expandedMenus[section.key]
            const hasActiveChild = section.items.some(it => isItemActive(it.path))

            // Dashboard renders as a single flat link
            if (section.key === 'dashboard') {
              const active = isItemActive('/dashboard')
              return (
                <Link
                  key={section.key}
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 font-extrabold text-xs uppercase tracking-wider ${
                    active
                      ? 'bg-red-500/15 text-red-500 border border-red-500/20 shadow-sm shadow-red-500/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/5'
                  }`}
                >
                  <span className="text-sm opacity-80">{section.icon}</span>
                  <span>{section.name}</span>
                </Link>
              )
            }

            return (
              <div key={section.key} className="space-y-1">
                <button
                  onClick={() => toggleSection(section.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 font-extrabold text-xs uppercase tracking-wider group ${
                    hasActiveChild ? 'text-red-500' : 'text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm opacity-80 group-hover:scale-115 transition-transform duration-200">{section.icon}</span>
                    <span>{section.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                </button>

                {isExpanded && (
                  <div className="pl-6.5 space-y-0.5 border-l-2 border-slate-100 dark:border-red-500/10 ml-5 py-1.5 transition-all">
                    {section.items.map(item => {
                      const active = isItemActive(item.path)
                      return (
                        <Link
                          key={`${section.key}-${item.name}`}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={`block px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all ${
                            active
                              ? 'bg-red-500/15 text-red-500 border border-red-500/20 shadow-sm shadow-red-500/10'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Sidebar Footer with Theme Toggle */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/10 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs uppercase text-slate-600 dark:text-slate-300">
              {(profile?.email || 'AD').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-extrabold text-neutral-800 dark:text-slate-200 truncate capitalize">{profile?.role || 'Administrator'}</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate leading-none mt-0.5">{profile?.email || 'admin@safetech.ae'}</span>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-red-500/20 text-xs font-bold transition-all shadow-sm group"
          >
            <span className="uppercase tracking-wider">
              {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </span>
            <span className="text-xs group-hover:animate-pulse">
              {theme === 'dark' ? 'Toggle Light' : 'Toggle Dark'}
            </span>
          </button>
        </div>

      </aside>
    </>
  )
}
