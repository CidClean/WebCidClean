export interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

// Mirrors the password policy actually enforced by this Supabase project
// (min 12 chars + all four character classes) — checked here too so the
// submit button gates on it instead of the user hitting Supabase's raw,
// verbose rejection message after submitting.
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 12 characters', test: (p) => p.length >= 12 },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export function passwordMeetsRequirements(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((r) => r.test(password))
}

export function PasswordRequirementsList({ password }: { password: string }) {
  return (
    <ul className="space-y-1 text-sm">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const met = req.test(password)
        return (
          <li key={req.label} className={`flex items-center gap-2 ${met ? 'text-green-600' : 'text-gray-500'}`}>
            <span className="w-4 text-center">{met ? '✓' : '○'}</span>
            {req.label}
          </li>
        )
      })}
    </ul>
  )
}
