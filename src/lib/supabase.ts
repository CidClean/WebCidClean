import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Fallback defaults are the Supabase publishable (anon) key and project URL —
// both are designed to be public/client-exposed, so they're safe to ship as a
// default for previews that don't set env vars. Set VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY to override for a different Supabase project.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://apcreqcjmhmufzudnvqi.supabase.co'
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_0fi-xhgj2J_cMdV3RRWnog_zTAGzOMZ'

// Implicit flow (not the default PKCE) because email links here — OTP login
// codes, password recovery, portal invites — routinely get opened on a
// different device/browser than the one that requested them. PKCE ties the
// exchange to a code_verifier stored in the requesting browser's storage, so
// it breaks that cross-device case; implicit flow issues the session
// directly from the link with nothing to look up locally. The raw 6-digit
// OTP code path (verifyOtp) is unaffected by this either way per Supabase's
// docs — it always returns tokens directly.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'implicit' },
})
