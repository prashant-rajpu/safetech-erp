import React, { useEffect, useMemo, useState } from 'react'
import { fetchRows, updateAudited, insertAudited } from '../lib/erp/db'
import { NAV_SECTIONS, type SectionKey } from '../lib/erp/registry'
import { useAuth } from '../lib/useAuth'

// Admin-editable access matrix: role × section → view / edit.
// Sidebar and ModuleWorkspace read this live via usePermissions().

export default function PermissionsPage() {
  const { profile, user } = useAuth()
  const userEmail = profile?.email || user?.email || ''
  const [perms, setPerms] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savedFlash, setSavedFlash] = useState(false)

  async function reload() {
    setLoading(true)
    const [p, r] = await Promise.all([fetchRows('role_permissions'), fetchRows('roles')])
    setPerms(p)
    setRoles(r)
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  const sections = NAV_SECTIONS.map(s => ({ key: s.key as SectionKey, name: s.name, icon: s.icon }))

  const cell = (roleKey: string, sectionKey: string) =>
    perms.find(p => p.role_key === roleKey && p.section_key === sectionKey)

  async function toggle(roleKey: string, sectionKey: string, field: 'can_view' | 'can_edit') {
    if (roleKey === 'admin') {
      alert('Administrator access is fixed — it always has full access.')
      return
    }
    const row = cell(roleKey, sectionKey)
    if (row) {
      const patch: any = { [field]: !row[field] }
      // Removing view also removes edit; granting edit also grants view
      if (field === 'can_view' && row.can_view) patch.can_edit = false
      if (field === 'can_edit' && !row.can_edit) patch.can_view = true
      await updateAudited('role_permissions', row.id, patch, userEmail, `Permission ${roleKey}/${sectionKey} → ${field}=${!row[field]}`)
    } else {
      await insertAudited('role_permissions', [{
        role_key: roleKey, section_key: sectionKey,
        can_view: field === 'can_view' ? true : true,
        can_edit: field === 'can_edit'
      }], userEmail, `Permission row created ${roleKey}/${sectionKey}`)
    }
    await reload()
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1200)
  }

  const editableRoles = useMemo(() => roles.filter(r => r.role_key !== 'admin'), [roles])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5 gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Role <span className="text-red-500 font-light">Permissions</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Per-section access matrix — changes apply instantly to sidebar and module edit rights</p>
        </div>
        {savedFlash && (
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase animate-pulse">✓ Saved</span>
        )}
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold animate-pulse">Loading permission matrix…</div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[9px] uppercase bg-slate-50/60 dark:bg-black/20">
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4 text-center">
                    <span className="text-red-500">Administrator</span>
                    <div className="text-[8px] text-slate-400 normal-case font-semibold mt-0.5">Full access (fixed)</div>
                  </th>
                  {editableRoles.map(r => (
                    <th key={r.role_key} className="py-3 px-4 text-center">
                      {r.label}
                      <div className="text-[8px] text-slate-400 normal-case font-semibold mt-0.5">{r.description}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {sections.map(s => (
                  <tr key={s.key} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-4 font-extrabold text-neutral-800 dark:text-white uppercase text-[11px]">
                      {s.icon} {s.name}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">View + Edit</span>
                    </td>
                    {editableRoles.map(r => {
                      const row = cell(r.role_key, s.key)
                      const canView = !!row?.can_view
                      const canEdit = !!row?.can_edit
                      return (
                        <td key={r.role_key} className="py-2.5 px-4 text-center">
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => toggle(r.role_key, s.key, 'can_view')}
                              className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border transition-all ${canView
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10 hover:text-red-500'}`}
                            >
                              👁 View
                            </button>
                            <button
                              onClick={() => toggle(r.role_key, s.key, 'can_edit')}
                              className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border transition-all ${canEdit
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10 hover:text-red-500'}`}
                            >
                              ✏️ Edit
                            </button>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-white/5 text-[10px] text-slate-500 space-y-1">
        <p>• <strong>View</strong> shows the section in the sidebar and opens its screens read-only.</p>
        <p>• <strong>Edit</strong> enables add / edit / delete / import in that section (granting Edit auto-grants View; revoking View revokes Edit).</p>
        <p>• Gate security flags (diesel, driver check, leaving status) remain restricted to the Dispatch Gate Log regardless of this matrix.</p>
        <p>• All permission changes are recorded in Audit Logs.</p>
      </div>
    </div>
  )
}
