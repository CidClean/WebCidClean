import { supabase } from '../lib/supabase'

export type PortalInviteRole = 'client' | 'employee' | 'contractor'

export async function invitePortalUser(input: {
  email: string
  portalRole: PortalInviteRole
  clientId?: string
  staffId?: string
}): Promise<void> {
  const { data, error } = await supabase.functions.invoke('invite-portal-user', {
    body: {
      email: input.email,
      portalRole: input.portalRole,
      clientId: input.clientId,
      staffId: input.staffId,
      redirectTo: `${window.location.origin}/set-password`,
    },
  })
  if (error) {
    const message = (data as { error?: string } | null)?.error ?? error.message
    throw new Error(message)
  }
}
