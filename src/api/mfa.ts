import { supabase } from '../lib/supabase'

export interface MfaFactor {
  id: string
  factor_type: string
  status: 'verified' | 'unverified'
}

export async function listMfaFactors(): Promise<MfaFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  return data.totp as MfaFactor[]
}

export interface MfaEnrollment {
  factorId: string
  qrCode: string
  secret: string
}

export async function enrollTotp(): Promise<MfaEnrollment> {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
  if (error) throw error
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret }
}

export async function verifyTotpCode(factorId: string, code: string): Promise<void> {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
  if (challengeError) throw challengeError
  const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code })
  if (verifyError) throw verifyError
}

export async function unenrollFactor(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw error
}

export async function getAssuranceLevel(): Promise<{ currentLevel: string | null; nextLevel: string | null }> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw error
  return { currentLevel: data.currentLevel, nextLevel: data.nextLevel }
}
