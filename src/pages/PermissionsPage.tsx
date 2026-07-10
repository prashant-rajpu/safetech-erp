import React, { useEffect, useMemo, useState } from 'react'
import { fetchRows, updateAudited, insertAudited } from '../lib/erp/db'
import { NAV_SECTIONS, type SectionKey } from '../lib/erp/registry'
import { PERM_ACTIONS, normalizeFlags, ADMIN_ROLE, type PermAction, type PermFlags } from '../lib/erp/permissionEngine'
import { useAuth } from '../lib/useAuth'

// Permission engine control panel: role × section and department × section
// matrices with the full action set (View / Create / Edit / Delete / Approve).
// Changes write to role_permissions / department_permissions and apply
// immediately — Sidebar, ModuleWorkspace and the protected pages all read
// these tables live through usePermissions().

const ACTION_META: Record<PermAction, { icon: string; label: string; on: string }> = {
  view:    { icon: '👁', label: 'View',    on: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  create:  { icon: '＋', label: 'Create',  on: 'bg-sky-500/10 text-sky-500 border-sky-500/20' },
  edit:    { icon: '✏️', label: 'Edit',    on: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  delete:  { icon: '🗑', label: 'Delete',  on: 'bg-red-500/10 text-red-500 border-red-500/20' },
  approve: { icon: '✔️', label: 'Approve', on: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
}

const FLAG_KEY: Record<PermAction, keyof Required<PermFlags>> = {
  view: 'can_view', create: 'can_create', edit: 'can_edit', delete: 'can_delete', approve: 'can_approve'
}

export default function PermissionsPage() {
  const { profile, user } = useAuth()
  const userEmail = profile?.email || user?.email || ''
  const [tab, setTab] = useState<'roles' | 'departments'>('roles')
  const [rolePerms, setRolePerms] = useState<any[]>([])
  const [deptPerms, setDeptPerms] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [savedFlash, setSavedFlash] = useState(false)

  async function reload() {
    setLoading(true)
    const [rp, dp, r, d] = await Promise.all([
      fetchRows('role_permissions'), fetchRows('department_permissions'),
      fetchRows('roles'), fetchRows('departments')
    ])
    setRolePerms(rp); setDeptPerms(dp); setRoles(r); setDepartments(d)
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  const sections = NAV_SECTIONS.map(s => ({ key: s.key as SectionKey, name: s.name, icon: s.icon }))

  const subjects = tab === 'roles'
    ? roles.map(r => ({ key: r.role_key, label: r.label, locked: r.role_key === ADMIN_ROLE }))
    : departments.map(d => ({ key: d.department_key, label: d.label, locked: false }))

  useEffect(() => {
    if (subjects.length && !subjects.some(s => s.key === selected)) {
      setSelected(subjects.find(s => !s.locked)?.key || subjects[0]?.key || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, roles, departments])

  const activeSubject = subjects.find(s => s.key === selected)
  const table = tab === 'roles' ? 'role_permissions' : 'department_permissions'
  const subjectField = tab === 'roles' ? 'role_key' : 'department_key'
  const perms = tab === 'roles' ? rolePerms : deptPerms

  const cell = (sectionKey: string) =>
    perms.find(p => p[subjectField] === selected && p.section_key === sectionKey)

  async function toggle(sectionKey: string, action: PermAction) {
    if (!activeSubject || activeSubject.locked) {
      alert('Administrator access is fixed — it always has full access.')
      return
    }
    const row = cell(sectionKey)
    const current: Required<PermFlags> = {
      can_view: !!row?.can_view,
      can_create: row?.can_create !== undefined ? !!row.can_create : !!row?.can_edit,
      can_edit: !!row?.can_edit,
      can_delete: !!row?.can_delete,
      can_approve: !!row?.can_approve
    }
    const flipped = { ...current, [FLAG_KEY[action]]: !current[FLAG_KEY[action]] }
    const next = normalizeFlags(flipped)
    const detail = `Permission ${selected}/${sectionKey} → ${action}=${String(next[FLAG_KEY[action]])}`
    if (row) {
      await updateAudited(table, row.id, next, userEmail, detail)
    } else {
      await insertAudited(table, [{ [subjectField]: selected, section_key: sectionKey, ...next }], userEmail, detail)
    }
    await reload()
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1200)
  }

  const grantCount = useMemo(() => {
    const mine = perms.filter(p => p[subjectField] === selected)
    return PERM_ACTIONS.reduce((n, a) => n + mine.filter(r => !!r[FLAG_KEY[a]]).length, 0)
  }, [perms, selected, subjectField])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5 gap-3">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Permission <span className="text-red-500 font-light">Engine</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View / Create / Edit / Delete / Approve per section — changes apply instantly across the app
          </p>
        </div>
        {savedFlash && (
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase animate-pulse">✓ Saved</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['roles', 'departments'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase border transition-all ${tab === t
              ? 'bg-red-500/10 text-red-500 border-red-500/30'
              : 'text-slate-500 border-slate-200 dark:border-white/10 hover:text-red-500'}`}>
            {t === 'roles' ? '🎭 Role Permissions' : '🏢 Department Permissions'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-16 text-center text-slate-500 font-semibold animate-pulse">Loading permission matrix…</div>
      ) : (
        <>
          {/* Subject selector */}
          <div className="flex flex-wrap gap-2 items-center">
            {subjects.map(s => (
              <button key={s.key} onClick={() => setSelected(s.key)}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-extrabold uppercase border transition-all ${selected === s.key
                  ? 'bg-red-600 text-white border-red-600'
                  : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-red-500/40'}`}>
                {s.label}{s.locked ? ' 🔒' : ''}
              </button>
            ))}
            <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase">{grantCount} grants active</span>
          </div>

          {activeSubject?.locked ? (
            <div className="glass-panel rounded-2xl p-8 border border-slate-200 dark:border-white/5 text-center">
              <div className="text-3xl mb-2">🔒</div>
              <p className="text-sm font-bold text-neutral-800 dark:text-white uppercase">Administrator — full access, fixed</p>
              <p className="text-xs text-slate-500 mt-1">The built-in admin role always has every permission and cannot be edited or deleted.</p>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[9px] uppercase bg-slate-50/60 dark:bg-black/20">
                      <th className="py-3 px-4">Section</th>
                      {PERM_ACTIONS.map(a => (
                        <th key={a} className="py-3 px-3 text-center">{ACTION_META[a].icon} {ACTION_META[a].label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {sections.map(s => {
                      const row = cell(s.key)
                      return (
                        <tr key={s.key} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-2.5 px-4 font-extrabold text-neutral-800 dark:text-white uppercase text-[11px]">
                            {s.icon} {s.name}
                          </td>
                          {PERM_ACTIONS.map(a => {
                            const on = a === 'create' && row?.can_create === undefined
                              ? !!row?.can_edit
                              : !!row?.[FLAG_KEY[a]]
                            return (
                              <td key={a} className="py-2.5 px-3 text-center">
                                <button onClick={() => toggle(s.key, a)}
                                  className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border transition-all ${on
                                    ? ACTION_META[a].on
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10 hover:text-red-500'}`}>
                                  {on ? '● ON' : '○ off'}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="glass-panel rounded-2xl p-4 border border-slate-200 dark:border-white/5 text-[10px] text-slate-500 space-y-1">
        <p>• Effective access = <strong>union</strong> of a user's role grants and their department's grants (either one is enough).</p>
        <p>• Granting Create/Edit/Delete/Approve auto-grants View; revoking View revokes everything in that section.</p>
        <p>• <strong>Approve</strong> controls approval requests and protected fields — dispatch gate security flags (diesel / driver / leaving) need Approve on Dispatch.</p>
        <p>• Roles and Departments themselves are managed in Administration → Roles / Departments; the admin role is locked.</p>
        <p>• On a real Supabase deployment, the same tables drive Row-Level Security (db/rls_policies.sql) — the database enforces these grants server-side.</p>
        <p>• All permission changes are recorded in Audit Logs.</p>
      </div>
    </div>
  )
}
