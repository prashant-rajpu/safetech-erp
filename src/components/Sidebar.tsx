import React, { useState, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import safetechLogo from '../assets/safetech_logo.png'
import { NAV_SECTIONS } from '../lib/erp/registry'
import { usePermissions } from '../lib/erp/usePermissions'
import { useAuth } from '../lib/useAuth'
import { getIcon } from '../lib/erp/icons'

type SidebarProps = {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const location = useLocation()
  const { profile } = useAuth()
  const { canView } = usePermissions()
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({ dashboard: true })
  const [navQuery, setNavQuery] = useState('')

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

  const toggleSection = (key: string) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const visibleSections = NAV_SECTIONS.filter(s => canView(s.key))

  // Nav search: filters sections/items by name. A section whose own name
  // matches keeps all its items; otherwise only matching items survive.
  const searchedSections = useMemo(() => {
    const q = navQuery.trim().toLowerCase()
    if (!q) return visibleSections
    return visibleSections
      .map(section => {
        if (section.name.toLowerCase().includes(q)) return section
        const items = section.items.filter(it => it.name.toLowerCase().includes(q))
        return items.length ? { ...section, items } : null
      })
      .filter((s): s is typeof visibleSections[number] => s !== null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navQuery, visibleSections.length, profile?.role])

  // Auto-expand every section that survives the search so matches are visible
  // without an extra click.
  useEffect(() => {
    if (!navQuery.trim()) return
    setExpandedMenus(prev => {
      const next = { ...prev }
      for (const s of searchedSections) next[s.key] = true
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navQuery])

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
      <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-[#0c0c0f] border-r border-slate-200 dark:border-primary/10 shadow-2xl z-50 transform md:transform-none transition-transform duration-300 flex flex-col justify-between no-print ${
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
              <span className="text-[10px] text-primary font-extrabold uppercase mt-0.5 tracking-widest leading-none">OPERATIONS</span>
              <span className="text-[8px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider truncate">Control Panel</span>
            </div>
          </div>
        </div>

        {/* Nav search */}
        <div className="px-3.5 pt-3">
          <input
            type="text"
            value={navQuery}
            onChange={e => setNavQuery(e.target.value)}
            placeholder="Search modules…"
            className="w-full px-3 py-2 rounded-xl glowing-input text-[11px] font-medium"
          />
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-grow py-4 overflow-y-auto px-3.5 space-y-2">
          {searchedSections.length === 0 && (
            <div className="text-center text-[11px] text-slate-400 py-6 font-semibold">No modules match "{navQuery}"</div>
          )}
          {searchedSections.map(section => {
            const isExpanded = !!expandedMenus[section.key]
            const hasActiveChild = section.items.some(it => isItemActive(it.path))
            const Icon = getIcon(section.icon)

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
                      ? 'bg-primary/15 text-primary border border-primary/20 shadow-sm shadow-primary/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <Icon size={15} className="opacity-80 shrink-0" />
                  <span>{section.name}</span>
                </Link>
              )
            }

            return (
              <div key={section.key} className="space-y-1">
                <button
                  onClick={() => toggleSection(section.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 font-extrabold text-xs uppercase tracking-wider group ${
                    hasActiveChild ? 'text-primary' : 'text-slate-600 dark:text-slate-400 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={15} className="opacity-80 shrink-0 group-hover:scale-115 transition-transform duration-200" />
                    <span>{section.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                </button>

                {isExpanded && (
                  <div className="pl-6.5 space-y-0.5 border-l-2 border-slate-100 dark:border-primary/10 ml-5 py-1.5 transition-all">
                    {section.items.map(item => {
                      const active = isItemActive(item.path)
                      return (
                        <Link
                          key={`${section.key}-${item.name}`}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={`block px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all ${
                            active
                              ? 'bg-primary/15 text-primary border border-primary/20 shadow-sm shadow-primary/10'
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

        {/* Sidebar Footer */}
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
        </div>

      </aside>
    </>
  )
}
