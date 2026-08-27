/** The variables a template body/subject can reference — kept in one place so the Settings composer's insert buttons can't drift out of sync with what actually gets substituted. */
export const TEMPLATE_VARIABLES: { key: string; label: string }[] = [
  { key: 'first_name', label: 'First name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'company', label: 'Company' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'job_site_name', label: 'Job site name' },
  { key: 'job_site_address', label: 'Job site address' },
]

/**
 * Substitutes {{key}} placeholders with values from `vars`. A placeholder
 * with no matching key is left in the text untouched (visible) rather than
 * silently blanked, so the admin notices it and can edit it by hand instead
 * of sending a message with a gap in it.
 */
export function renderTemplate(text: string, vars: Record<string, string | null | undefined>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    const value = vars[key]
    return value ? value : match
  })
}

/**
 * Digits-only, defaulting to a US country code for a bare 10-digit number —
 * consistent with the Naples, FL operation this app serves. Numbers already
 * carrying a country code (11+ digits) are left as-is.
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10 ? `1${digits}` : digits
}

export function buildMailto(email: string, subject: string, body: string): string {
  const params = new URLSearchParams()
  if (subject) params.set('subject', subject)
  if (body) params.set('body', body)
  const query = params.toString()
  return `mailto:${encodeURIComponent(email)}${query ? `?${query}` : ''}`
}

export function buildSms(phone: string, body: string): string {
  const params = new URLSearchParams()
  if (body) params.set('body', body)
  const query = params.toString()
  return `sms:${encodeURIComponent(phone)}${query ? `?${query}` : ''}`
}

export function buildWhatsApp(phone: string, body: string): string {
  const params = new URLSearchParams()
  if (body) params.set('text', body)
  const query = params.toString()
  return `https://wa.me/${normalizePhone(phone)}${query ? `?${query}` : ''}`
}

export function buildTel(phone: string): string {
  return `tel:${encodeURIComponent(phone)}`
}
