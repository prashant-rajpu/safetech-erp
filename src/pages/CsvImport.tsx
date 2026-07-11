import React, { useState } from 'react'
import { Download, AlertTriangle, XCircle } from 'lucide-react'
import Papa from 'papaparse'
import { supabase } from '../lib/supabaseClient'

type Row = Record<string, string>

const EXPECTED_COLUMNS = ['project_no', 'project_name', 'trailer_plate', 'element_type', 'element_count', 'dn_no', 'volume_cum', 'weight_tons', 'delivery_date', 'remarks']

export default function CsvImport(){
  const [rows, setRows] = useState<Row[]>([])
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState<'idle' | 'parsing' | 'ready' | 'importing' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ inserted: number, skipped: number, errors: string[] } | null>(null)

  const handleFile = (file: File) => {
    setFileName(file.name)
    setStatus('parsing')
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setRows(res.data)
        setStatus('ready')
      },
      error: () => setStatus('error'),
    })
  }

  const handleImport = async () => {
    setStatus('importing')
    let inserted = 0
    let skipped = 0
    const errors: string[] = []

    // Resolve trailer plate -> id once
    const { data: trailers } = await supabase.from('trailers').select('id,plate_no')
    const plateToId: Record<string, string> = {}
    for (const t of trailers || []) plateToId[t.plate_no] = t.id

    for (const row of rows){
      if(!row.project_no && !row.dn_no){ skipped++; continue }
      const payload = {
        project_no: row.project_no || null,
        project_name: row.project_name || null,
        location: row.project_name || null,
        trailer_id: plateToId[row.trailer_plate] ?? null,
        element_type: row.element_type || null,
        element_count: row.element_count ? parseInt(row.element_count, 10) : null,
        dn_no: row.dn_no || null,
        volume_cum: row.volume_cum ? parseFloat(row.volume_cum) : null,
        weight_tons: row.weight_tons ? parseFloat(row.weight_tons) : null,
        remarks: row.remarks || null,
        delivery_date: row.delivery_date || new Date().toISOString().slice(0, 10),
      }
      const { error } = await supabase.from('deliveries').insert([payload])
      if(error) errors.push(`${row.dn_no || row.project_no || 'row'}: ${error.message}`)
      else inserted++
    }

    setResult({ inserted, skipped, errors })
    setStatus('done')
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white uppercase">
            Data Import <span className="text-primary font-light">Terminal</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Upload CSV files to backfill historical delivery and dispatch notes</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 max-w-2xl mx-auto border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-primary-dark to-black" />
        
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Upload a structured CSV exported from old spreadsheet formats to backfill the <code className="px-2 py-0.5 bg-slate-950 text-primary rounded-md font-bold font-mono">deliveries</code> table.
          <br/>
          <span className="block mt-2">Expected column list: <code className="text-slate-200 bg-white/5 px-1.5 py-0.5 rounded font-mono font-semibold">{EXPECTED_COLUMNS.join(', ')}</code></span>
        </p>

        {/* File Picker */}
        <div className="border-2 border-dashed border-white/10 hover:border-primary/30 rounded-2xl p-8 text-center bg-slate-950/40 transition-all duration-300 relative group">
          <input
            type="file"
            accept=".csv"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="space-y-2 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary group-hover:scale-110 transition-transform duration-300">
              <Download size={20} />
            </div>
            <div className="text-sm font-bold text-slate-300">
              {fileName ? fileName : 'Choose CSV log file or drag here'}
            </div>
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
              Only comma-separated CSV files are supported
            </div>
          </div>
        </div>

        {status === 'parsing' && (
          <div className="mt-6 text-center text-xs font-bold text-primary tracking-wider uppercase animate-pulse">
            Parsing document {fileName}…
          </div>
        )}

        {status === 'ready' && (
          <div className="mt-6 space-y-4">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              {rows.length} rows successfully parsed from {fileName}
            </div>
            
            <div className="max-h-40 overflow-auto text-[10px] font-mono bg-slate-950/80 rounded-xl p-3 border border-white/5 space-y-1.5 text-slate-400">
              {rows.slice(0, 5).map((r, i) => (
                <div key={i} className="truncate border-b border-white/5 pb-1.5 last:border-0 last:pb-0">{JSON.stringify(r)}</div>
              ))}
              {rows.length > 5 && (
                <div className="text-slate-600 font-extrabold tracking-wide uppercase pt-1 text-[9px]">
                  … and {rows.length - 5} more records
                </div>
              )}
            </div>

            <button 
              onClick={handleImport} 
              className="bg-gradient-to-br from-primary to-primary-dark text-white px-6 py-3 rounded-xl font-extrabold text-xs tracking-wider uppercase btn-interactive shadow-lg shadow-primary/30"
            >
              Commit {rows.length} Rows to Database
            </button>
          </div>
        )}

        {status === 'importing' && (
          <div className="mt-6 text-center text-xs font-bold text-primary tracking-wider uppercase animate-pulse">
            Importing records to database…
          </div>
        )}

        {status === 'done' && result && (
          <div className="mt-6 space-y-3">
            <div className="text-sm font-semibold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-md shadow-green-500" />
              <span className="text-slate-200">Import Complete: {result.inserted} rows inserted successfully.</span>
            </div>
            {result.skipped > 0 && (
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle size={13} className="shrink-0" /> Skipped {result.skipped} rows missing project or DN reference.
              </div>
            )}
            {result.errors.length > 0 && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary-dark/10 text-primary">
                <div className="text-xs font-extrabold tracking-wider uppercase mb-2">Import Errors ({result.errors.length}):</div>
                <ul className="list-disc list-inside text-[11px] font-mono space-y-1">
                  {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 text-center text-xs font-bold text-primary tracking-wider uppercase flex items-center justify-center gap-1.5">
            <XCircle size={14} /> Parsing failed. Verify file is formatted as valid CSV.
          </div>
        )}
      </div>
    </div>
  )
}
