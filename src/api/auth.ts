import { supabase } from '../lib/supabase'

export async function sendLoginOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    // Only pre-provisioned users (invited by an admin) can sign in — this
    // never creates a new account from a stray email address.
    options: { shouldCreateUser: false },
  })
  if (error) throw error
}

export async function verifyLoginOtp(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw error
}
