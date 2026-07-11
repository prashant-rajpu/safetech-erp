import React, { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

type UserRow = { id: string, email: string, role: string, department?: string }
type RoleRow = { id: string, role_key: string, label?: string }
type DepartmentRow = { id: string, department_key: string, label?: string }
type ProjectRow = { id: string, project_no: string, project_name: string | null, location: string | null, active: boolean }
type SupplierRow = { id: string, name: string }

type Tab = 'users' | 'projects' | 'suppliers'

export default function AdminPanel(){
  const [tab, setTab] = useState<Tab>('users')
  const [error, setError] = useState<string | undefined>(undefined)

  const tabs: { key: Tab, label: string }[] = [
    { key: 'users', label: 'User Roles' },
    { key: 'projects', label: 'Precast Projects' },
    { key: 'suppliers', label: 'Logistic Suppliers' }
  ]

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white uppercase">
            Control Panel <span className="text-primary font-light">Administration</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Configure project directories, user authorization roles, and suppliers list</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-panel p-2.5 rounded-2xl max-w-xl mx-auto flex gap-2 border border-white/5 shadow-lg shadow-black/40">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all duration-300 btn-interactive ${
              tab === t.key 
                ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-md shadow-primary/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="max-w-3xl mx-auto p-4 rounded-xl border border-primary/20 bg-primary-dark/20 text-primary text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
          <AlertTriangle size={14} className="shrink-0" /> {error}
        </div>
      )}

      {/* Main Tab Panel */}
      <div className="glass-panel rounded-2xl p-6 max-w-4xl mx-auto border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-amber-400" />
        
        {tab === 'users' && <UsersTab onError={setError} />}
        {tab === 'projects' && <ProjectsTab onError={setError} />}
        {tab === 'suppliers' && <SuppliersTab onError={setError} />}
      </div>
    </div>
  )
}

function UsersTab({ onError }: { onError: (e?: string) => void }){
  const [users, setUsers] = useState<UserRow[]>([])
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [departments, setDepartments] = useState<DepartmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function loadUsers(){
    setLoading(true)
    // Roles and departments are loaded from their tables, not hardcoded — so any
    // role created in Administration (e.g. a new QA Engineer role) is assignable
    // here without a code change.
    const [usersRes, rolesRes, deptsRes] = await Promise.all([
      supabase.from('users').select('id,email,role,department').order('email'),
      supabase.from('roles').select('id,role_key,label').order('role_key'),
      supabase.from('departments').select('id,department_key,label').order('department_key'),
    ])
    if(usersRes.error) onError(usersRes.error.message)
    else setUsers((usersRes.data || []) as UserRow[])
    setRoles((rolesRes.data || []) as RoleRow[])
    setDepartments((deptsRes.data || []) as DepartmentRow[])
    setLoading(false)
  }

  useEffect(()=>{ loadUsers() }, [])

  const handleRoleChange = async (id: string, role: string) => {
    setSavingId(id)
    const { error } = await supabase.from('users').update({ role }).eq('id', id)
    if(error) onError(error.message)
    else setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    setSavingId(null)
  }

  const handleDepartmentChange = async (id: string, department: string) => {
    setSavingId(id)
    const { error } = await supabase.from('users').update({ department }).eq('id', id)
    if(error) onError(error.message)
    else setUsers(prev => prev.map(u => u.id === id ? { ...u, department } : u))
    setSavingId(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white uppercase tracking-wide">Authorized Personnel Roles</h3>
        <p className="text-xs text-slate-400">Assign each user a role and department — permissions follow the union of both grants (configure grants in Permissions)</p>
      </div>

      <div className="overflow-hidden border border-white/5 rounded-2xl bg-slate-950/40">
        {loading ? (
          <div className="p-6 text-center text-primary font-semibold animate-pulse">Loading system users…</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No authorized users found.</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/5 bg-white/5">
                <th className="p-4 font-bold text-xs uppercase tracking-wider">Email Address</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider">Access Role</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider">Department</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors duration-150">
                  <td className="p-4 font-medium text-slate-200">{u.email}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <select
                        className="glowing-input px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
                        value={u.role}
                        disabled={savingId === u.id}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                      >
                        {roles.map(r => <option key={r.role_key} value={r.role_key} className="bg-neutral-900 text-white">{r.role_key}</option>)}
                        {/* keep an unknown stored role visible */}
                        {u.role && !roles.some(r => r.role_key === u.role) && <option value={u.role} className="bg-neutral-900 text-white">{u.role}</option>}
                      </select>
                      {savingId === u.id && (
                        <span className="text-[10px] font-bold text-primary tracking-wider uppercase animate-pulse">Saving…</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      className="glowing-input px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
                      value={u.department || ''}
                      disabled={savingId === u.id}
                      onChange={e => handleDepartmentChange(u.id, e.target.value)}
                    >
                      <option value="" className="bg-neutral-900 text-white">— none —</option>
                      {departments.map(d => <option key={d.department_key} value={d.department_key} className="bg-neutral-900 text-white">{d.department_key}</option>)}
                      {u.department && !departments.some(d => d.department_key === u.department) && <option value={u.department} className="bg-neutral-900 text-white">{u.department}</option>}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function ProjectsTab({ onError }: { onError: (e?: string) => void }){
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [projectNo, setProjectNo] = useState('')
  const [projectName, setProjectName] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)

  async function load(){
    setLoading(true)
    const { data, error } = await supabase.from('projects').select('*').order('project_no')
    if(error) onError(error.message)
    else setProjects((data || []) as ProjectRow[])
    setLoading(false)
  }
  useEffect(()=>{ load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!projectNo) return
    setSaving(true)
    const { error } = await supabase.from('projects').insert([{ project_no: projectNo, project_name: projectName || null, location: location || null, active: true }])
    if(error) onError(error.message)
    else { setProjectNo(''); setProjectName(''); setLocation(''); await load() }
    setSaving(false)
  }

  const toggleActive = async (p: ProjectRow) => {
    const { error } = await supabase.from('projects').update({ active: !p.active }).eq('id', p.id)
    if(error) onError(error.message)
    else setProjects(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white uppercase tracking-wide">Precast Concrete Projects Directory</h3>
        <p className="text-xs text-slate-400">Configure element delivery destinations and project numbers</p>
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
        <input className="px-4 py-2.5 rounded-xl glowing-input text-xs font-semibold placeholder-slate-500" placeholder="Project No (E.g. P25044)" value={projectNo} onChange={e=>setProjectNo(e.target.value)} />
        <input className="px-4 py-2.5 rounded-xl glowing-input text-xs font-semibold placeholder-slate-500" placeholder="Project Name" value={projectName} onChange={e=>setProjectName(e.target.value)} />
        <input className="px-4 py-2.5 rounded-xl glowing-input text-xs font-semibold placeholder-slate-500" placeholder="Location Details" value={location} onChange={e=>setLocation(e.target.value)} />
        <button disabled={saving} className="bg-gradient-to-br from-primary to-primary-dark text-white px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider btn-interactive">
          {saving ? 'Adding…' : 'Add Project'}
        </button>
      </form>

      <div className="overflow-hidden border border-white/5 rounded-2xl bg-slate-950/40">
        {loading ? (
          <div className="p-6 text-center text-primary font-semibold animate-pulse">Loading project directory…</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/5 bg-white/5">
                <th className="p-4 font-bold text-xs uppercase tracking-wider">Project No</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider">Project Name</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider">Site Location</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider">Logistics Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors duration-150">
                  <td className="p-4 font-extrabold text-primary">{p.project_no}</td>
                  <td className="p-4 font-medium text-slate-200">{p.project_name || 'N/A'}</td>
                  <td className="p-4 text-slate-400">{p.location || 'N/A'}</td>
                  <td className="p-4">
                    <button 
                      onClick={()=>toggleActive(p)} 
                      className={`text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-lg btn-interactive transition-all duration-200 ${
                        p.active 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}
                    >
                      {p.active ? 'Active' : 'Retired'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function SuppliersTab({ onError }: { onError: (e?: string) => void }){
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function load(){
    setLoading(true)
    const { data, error } = await supabase.from('suppliers').select('*').order('name')
    if(error) onError(error.message)
    else setSuppliers((data || []) as SupplierRow[])
    setLoading(false)
  }
  useEffect(()=>{ load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!name) return
    setSaving(true)
    const { error } = await supabase.from('suppliers').insert([{ name }])
    if(error) onError(error.message)
    else { setName(''); await load() }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white uppercase tracking-wide">Approved Trailer Logistics Suppliers</h3>
        <p className="text-xs text-slate-400">Manage subcontracted fleet shipping agencies and suppliers</p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-3 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
        <input className="px-4 py-2.5 rounded-xl glowing-input text-xs font-semibold placeholder-slate-500 flex-grow" placeholder="Enter Supplier / Subcontractor Agency Name" value={name} onChange={e=>setName(e.target.value)} />
        <button disabled={saving} className="bg-gradient-to-br from-primary to-primary-dark text-white px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider btn-interactive">
          {saving ? 'Adding…' : 'Add Supplier'}
        </button>
      </form>

      <div className="overflow-hidden border border-white/5 rounded-2xl bg-slate-950/40">
        {loading ? (
          <div className="p-6 text-center text-primary font-semibold animate-pulse">Loading suppliers list…</div>
        ) : suppliers.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No suppliers registered.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {suppliers.map(s => (
              <li key={s.id} className="p-4 text-xs font-bold text-slate-200 tracking-wide uppercase hover:bg-white/5 transition-colors duration-150 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
