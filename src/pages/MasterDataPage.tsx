import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'

type MasterTable = 
  | 'customers' | 'projects' | 'concrete_grades' | 'mix_designs' | 'element_types'
  | 'production_beds' | 'moulds' | 'yard_bays' | 'trailers' | 'drivers'
  | 'crane_operators' | 'qc_inspectors'

export default function MasterDataPage() {
  const [selectedTable, setSelectedTable] = useState<MasterTable>('projects')
  const [tableData, setTableData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Simple input maps for adding new items
  const [newValue, setNewValue] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const tablesList: { key: MasterTable; label: string; icon: string }[] = [
    { key: 'projects', label: 'Projects Master', icon: '📁' },
    { key: 'customers', label: 'Customers Master', icon: '🤝' },
    { key: 'concrete_grades', label: 'Concrete Grades', icon: '🧪' },
    { key: 'mix_designs', label: 'Mix Designs', icon: '🧱' },
    { key: 'element_types', label: 'Element Types', icon: '📐' },
    { key: 'production_beds', label: 'Production Beds', icon: '📏' },
    { key: 'moulds', label: 'Moulds Master', icon: '📦' },
    { key: 'yard_bays', label: 'Yard Bays List', icon: '🏗' },
    { key: 'trailers', label: 'Trailers Fleet', icon: '🚚' },
    { key: 'drivers', label: 'Drivers Database', icon: '👮' },
    { key: 'crane_operators', label: 'Crane Operators', icon: '🏗️' },
    { key: 'qc_inspectors', label: 'QC Inspectors', icon: '📝' }
  ]

  useEffect(() => {
    async function loadTable() {
      setLoading(true)
      const { data } = await supabase.from(selectedTable).select('*')
      setTableData(data || [])
      setNewValue({})
      setLoading(false)
    }
    loadTable()
  }, [selectedTable])

  // Get form input fields depending on active table
  const inputFields = useMemo(() => {
    switch (selectedTable) {
      case 'projects':
        return [
          { key: 'project_no', label: 'Project Code', placeholder: 'E.g. P26008' },
          { key: 'project_name', label: 'Project Name', placeholder: 'E.g. Sobha Heights' },
          { key: 'client', label: 'Client Name', placeholder: 'E.g. Sobha' },
          { key: 'consultant', label: 'Consultant', placeholder: 'E.g. AECOM' },
          { key: 'location', label: 'Location', placeholder: 'E.g. DUBAI' },
          { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Completed', 'On Hold'] }
        ]
      case 'customers':
        return [
          { key: 'name', label: 'Customer Name', placeholder: 'E.g. Nshama' },
          { key: 'email', label: 'Email', placeholder: 'info@nshama.ae' },
          { key: 'phone', label: 'Contact Phone', placeholder: '+971 4 000 0000' },
          { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
        ]
      case 'concrete_grades':
        return [
          { key: 'grade', label: 'Grade Code', placeholder: 'E.g. C55' },
          { key: 'grade_name', label: 'Grade Description', placeholder: 'E.g. C55/65 OPC + Silica' }
        ]
      case 'mix_designs':
        return [
          { key: 'mix_code', label: 'Mix Code ID', placeholder: 'E.g. MIX-C55-MS' },
          { key: 'concrete_grade', label: 'Concrete Grade', placeholder: 'C55' },
          { key: 'cement_type', label: 'Cement Type', placeholder: 'OPC + Microsilica' },
          { key: 'w_c_ratio', label: 'Water/Cement Ratio', placeholder: '0.31' }
        ]
      case 'element_types':
        return [
          { key: 'type_name', label: 'Element Type Name', placeholder: 'E.g. Solid Slab' },
          { key: 'type_code', label: 'Type Code', placeholder: 'SL' }
        ]
      case 'production_beds':
        return [
          { key: 'bed_name', label: 'Bed Name', placeholder: 'Bed 3' },
          { key: 'length_m', label: 'Length (meters)', placeholder: '120' },
          { key: 'width_m', label: 'Width (meters)', placeholder: '2.4' },
          { key: 'type', label: 'Bed Type', placeholder: 'Prestressed' }
        ]
      case 'moulds':
        return [
          { key: 'mould_name', label: 'Mould Name', placeholder: 'Mould D' },
          { key: 'type', label: 'Mould Type', placeholder: 'Battery Mould' }
        ]
      case 'yard_bays':
        return [
          { key: 'bay_name', label: 'Bay Name', placeholder: 'Bay 09' },
          { key: 'capacity_pcs', label: 'Capacity (pcs)', placeholder: '150' },
          { key: 'zone', label: 'Yard Zone', placeholder: 'Zone Precast' }
        ]
      case 'trailers':
        return [
          { key: 'plate_no', label: 'Plate Number', placeholder: 'E.g. 98214' },
          { key: 'supplier', label: 'Supplier subcontractor', placeholder: 'OMD Transport' },
          { key: 'type', label: 'Trailer Frame Type', placeholder: 'Trailer - Flatbed' }
        ]
      case 'drivers':
        return [
          { key: 'name', label: 'Driver Name', placeholder: 'E.g. Jaspal Singh' },
          { key: 'mobile', label: 'Mobile Number', placeholder: 'E.g. 050 1234567' }
        ]
      case 'crane_operators':
        return [
          { key: 'name', label: 'Operator Name', placeholder: 'E.g. Ramesh Kumar' },
          { key: 'license_no', label: 'Crane License Number', placeholder: 'CR-99231' },
          { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
        ]
      case 'qc_inspectors':
        return [
          { key: 'name', label: 'Inspector Name', placeholder: 'E.g. John Doe' },
          { key: 'certification_no', label: 'Certification License', placeholder: 'QC-ACI-101' },
          { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
        ]
      default:
        return []
    }
  }, [selectedTable])

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await supabase.from(selectedTable).insert([newValue])
      const { data } = await supabase.from(selectedTable).select('*')
      setTableData(data || [])
      setNewValue({})
      alert('Record added successfully to Master Database!')
    } catch (err) {
      console.error(err)
      alert('Error adding record to database.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this master record?')) return
    try {
      await supabase.from(selectedTable).delete().eq('id', id)
      const { data } = await supabase.from(selectedTable).select('*')
      setTableData(data || [])
      alert('Record deleted successfully!')
    } catch (err) {
      console.error(err)
      alert('Error deleting record')
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
            Master Data <span className="text-red-500 font-light">CRUD Directory</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure active parameters, concrete mix designs, moulds, yard storage, and operators</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Side: Select Master Table list */}
        <div className="md:col-span-1 glass-panel rounded-2xl p-4 border border-slate-200 dark:border-white/5 space-y-1 h-fit">
          <span className="text-[10px] uppercase font-black text-slate-500 block mb-2 px-3">Select Table</span>
          {tablesList.map(t => (
            <button
              key={t.key}
              onClick={() => setSelectedTable(t.key)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-150 flex items-center gap-2.5 ${
                selectedTable === t.key 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Right Side: CRUD management layout */}
        <div className="md:col-span-3 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Add Record Form */}
            <div className="lg:col-span-1 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4 h-fit">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/5 pb-2">
                Add New Master Entry
              </h3>
              <form onSubmit={handleAddRecord} className="space-y-3">
                {inputFields.map(f => (
                  <label key={f.key} className="block">
                    <span className="text-[9px] uppercase font-black text-slate-500">{f.label}</span>
                    {f.type === 'select' ? (
                      <select
                        className="w-full mt-1 px-2.5 py-1.5 rounded-lg glowing-input text-xs"
                        value={newValue[f.key] || ''}
                        onChange={e => setNewValue(prev => ({ ...prev, [f.key]: e.target.value }))}
                      >
                        <option value="">Select...</option>
                        {f.options?.map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={f.placeholder}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg glowing-input text-xs"
                        value={newValue[f.key] || ''}
                        onChange={e => setNewValue(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    )}
                  </label>
                ))}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-br from-red-500 to-red-700 text-white font-bold text-xs uppercase py-2.5 rounded-xl shadow-lg mt-2 btn-interactive"
                >
                  {saving ? 'Adding...' : '💾 Add Master entry'}
                </button>
              </form>
            </div>

            {/* List & Edit Grid */}
            <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-300">
                Registered database entries
              </h3>
              
              {loading ? (
                <div className="text-center py-12 text-slate-500 font-semibold animate-pulse">Loading directory data...</div>
              ) : (
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-bold text-[9px] uppercase">
                        {inputFields.map(f => (
                          <th key={f.key} className="py-2">{f.label}</th>
                        ))}
                        <th className="py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                      {tableData.length === 0 ? (
                        <tr>
                          <td colSpan={inputFields.length + 1} className="py-8 text-center text-slate-500 uppercase font-semibold">No records registered</td>
                        </tr>
                      ) : (
                        tableData.map((row, idx) => (
                          <tr key={row.id || idx} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            {inputFields.map(f => (
                              <td key={f.key} className="py-2 max-w-[120px] truncate font-semibold">
                                {row[f.key] || '—'}
                              </td>
                            ))}
                            <td className="py-2 text-center">
                              <button
                                onClick={() => handleDeleteRecord(row.id)}
                                className="text-red-500 font-bold text-[9px] uppercase px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
