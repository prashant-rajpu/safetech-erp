import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type UserRow = { id: string, email: string, role: 'admin' | 'controller' | 'viewer' }
type ProjectRow = { id: string, project_no: string, project_name: string | null, location: string | null, active: boolean }
type SupplierRow = { id: string, name: string }

const ROLES: UserRow['role'][] = ['admin', 'controller', 'viewer']
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
            Control Panel <span className="text-red-500 font-light">Administration</span>
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
                ? 'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md shadow-red-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="max-w-3xl mx-auto p-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-300 text-xs font-bold tracking-wide uppercase">
          ⚠️ {error}
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
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function loadUsers(){
    setLoading(true)
    const { data, error } = await supabase.from('users').select('id,email,role').order('email')
    if(error) onError(error.message)
    else setUsers((data || []) as UserRow[])
    setLoading(false)
  }

  useEffect(()=>{ loadUsers() }, [])

  const handleRoleChange = async (id: string, role: UserRow['role']) => {
    setSavingId(id)
    const { error } = await supabase.from('users').update({ role }).eq('id', id)
    if(error) onError(error.message)
    else setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    setSavingId(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white uppercase tracking-wide">Authorized Personnel Roles</h3>
        <p className="text-xs text-slate-400">Configure access levels for dispatch controllers and yard viewers</p>
      </div>

      <div className="overflow-hidden border border-white/5 rounded-2xl bg-slate-950/40">
        {loading ? (
          <div className="p-6 text-center text-red-500 font-semibold animate-pulse">Loading system users…</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No authorized users found.</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/5 bg-white/5">
                <th className="p-4 font-bold text-xs uppercase tracking-wider">Email Address</th>
                <th className="p-4 font-bold text-xs uppercase tracking-wider">Access Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors duration-150">
                  <td className="p-4 font-medium text-slate-200">{u.email}</td>
                  <td className="p-4 flex items-center gap-3">
                    <select
                      className="glowing-input px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
                      value={u.role}
                      disabled={savingId === u.id}
                      onChange={e => handleRoleChange(u.id, e.target.value as UserRow['role'])}
                    >
                      {ROLES.map(r => <option key={r} value={r} className="bg-neutral-900 text-white">{r}</option>)}
                    </select>
                    {savingId === u.id && (
                      <span className="text-[10px] font-bold text-red-500 tracking-wider uppercase animate-pulse">Saving…</span>
                    )}
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
        <button disabled={saving} className="bg-gradient-to-br from-red-500 to-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider btn-interactive">
          {saving ? 'Adding…' : 'Add Project'}
        </button>
      </form>

      <div className="overflow-hidden border border-white/5 rounded-2xl bg-slate-950/40">
        {loading ? (
          <div className="p-6 text-center text-red-500 font-semibold animate-pulse">Loading project directory…</div>
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
                  <td className="p-4 font-extrabold text-red-500">{p.project_no}</td>
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
        <button disabled={saving} className="bg-gradient-to-br from-red-500 to-red-700 text-white px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider btn-interactive">
          {saving ? 'Adding…' : 'Add Supplier'}
        </button>
      </form>

      <div className="overflow-hidden border border-white/5 rounded-2xl bg-slate-950/40">
        {loading ? (
          <div className="p-6 text-center text-red-500 font-semibold animate-pulse">Loading suppliers list…</div>
        ) : suppliers.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No suppliers registered.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {suppliers.map(s => (
              <li key={s.id} className="p-4 text-xs font-bold text-slate-200 tracking-wide uppercase hover:bg-white/5 transition-colors duration-150 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
