import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Fallback defaults are the Supabase publishable (anon) key and project URL —
// both are designed to be public/client-exposed, so they're safe to ship as a
// default for previews that don't set env vars. Set VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY to override for a different Supabase project.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://apcreqcjmhmufzudnvqi.supabase.co'
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_0fi-xhgj2J_cMdV3RRWnog_zTAGzOMZ'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
