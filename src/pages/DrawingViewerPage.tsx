import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fetchRows, updateAudited } from '../lib/erp/db'
import { useAuth } from '../lib/useAuth'
import { usePermissions } from '../lib/erp/usePermissions'
import { statusChipClass } from '../lib/erp/uiHelpers'
import { Upload, FileText } from 'lucide-react'

const BUCKET = 'drawings'
const SIGNED_URL_TTL_SECONDS = 300

export default function DrawingViewerPage() {
  const { profile, user } = useAuth()
  const { can } = usePermissions()
  const canUpload = can('design', 'edit')
  const userEmail = profile?.email || user?.email || ''

  const [drawings, setDrawings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function reload() {
    setLoading(true)
    const data = await fetchRows('drawings')
    setDrawings(data.sort((a, b) => String(a.drawing_no).localeCompare(String(b.drawing_no))))
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  const selected = drawings.find(d => d.id === selectedId) || null

  // Bucket is private — every view fetches a fresh short-lived signed URL
  // rather than storing/rendering a public link, so access always goes
  // through Supabase auth + the drawings_bucket_* RLS policies.
  useEffect(() => {
    setSignedUrl(null)
    if (!selected?.file_url) return
    let cancelled = false
    supabase.storage.from(BUCKET).createSignedUrl(selected.file_url, SIGNED_URL_TTL_SECONDS).then((res: any) => {
      if (!cancelled && res?.data?.signedUrl) setSignedUrl(res.data.signedUrl)
    })
    return () => { cancelled = true }
  }, [selected?.id, selected?.file_url])

  async function handleUpload(file: File) {
    if (!selected) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'bin'
      const path = `${selected.drawing_no}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
      if (error) { alert(`Upload failed: ${error.message}`); return }
      await updateAudited('drawings', selected.id, { file_url: path }, userEmail, `Drawing file uploaded — ${selected.drawing_no}`)
      await reload()
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const isPdf = selected?.file_url?.toLowerCase().endsWith('.pdf')

  if (loading) return <div className="p-6 text-primary font-semibold flex items-center justify-center min-h-[300px] animate-pulse">Loading drawing register…</div>

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-white/5">
        <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white uppercase">
          Drawing <span className="text-primary font-light">Viewer</span>
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Browse the drawing register and view or upload the drawing file for each entry</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-panel p-4 rounded-2xl border border-slate-200 dark:border-white/5 space-y-1.5 max-h-[70vh] overflow-y-auto">
          {drawings.length === 0 ? (
            <div className="text-slate-500 text-sm py-8 text-center">No drawings registered.</div>
          ) : (
            drawings.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all ${
                  selectedId === d.id ? 'bg-primary/15 border border-primary/20' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-neutral-900 dark:text-white">{d.drawing_no}</span>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${statusChipClass(d.status)}`}>{d.status || '—'}</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">{d.title}</div>
                {d.file_url && <div className="text-[9px] text-primary mt-0.5 inline-flex items-center gap-1"><FileText size={9} /> File attached</div>}
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-200 dark:border-white/5 min-h-[60vh] flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Select a drawing to view its file</div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
                <div>
                  <div className="font-mono font-black text-sm text-neutral-900 dark:text-white">{selected.drawing_no} <span className="text-slate-400 font-normal">Rev {selected.revision || 'R0'}</span></div>
                  <div className="text-xs text-slate-500">{selected.title}</div>
                </div>
                {canUpload && (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-3.5 py-2 bg-gradient-to-br from-primary to-primary-dark text-white text-[10px] font-extrabold uppercase rounded-xl btn-interactive inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Upload size={12} /> {uploading ? 'Uploading…' : selected.file_url ? 'Replace File' : 'Upload File'}
                    </button>
                  </>
                )}
              </div>

              <div className="flex-1 mt-4 flex items-center justify-center bg-slate-50 dark:bg-black/20 rounded-2xl overflow-hidden">
                {!selected.file_url ? (
                  <div className="text-slate-400 text-sm text-center px-6">No file uploaded for this drawing yet.</div>
                ) : !signedUrl ? (
                  <div className="text-slate-400 text-sm animate-pulse">Loading file…</div>
                ) : isPdf ? (
                  <iframe src={signedUrl} title={selected.drawing_no} className="w-full h-[60vh] border-0" />
                ) : (
                  <img src={signedUrl} alt={selected.drawing_no} className="max-w-full max-h-[60vh] object-contain" />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
