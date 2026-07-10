import { createClient } from '@supabase/supabase-js'

const REAL_URL = import.meta.env.VITE_SUPABASE_URL
const REAL_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(
  REAL_URL && REAL_URL.startsWith('https://') && REAL_URL.includes('.supabase.co') &&
  REAL_KEY && REAL_KEY.length > 20
)

export const supabase = isSupabaseConfigured
  ? createClient(REAL_URL, REAL_KEY)
  : (null as any)
