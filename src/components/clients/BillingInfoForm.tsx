import { useEffect, useState, type FormEvent } from 'react'
import { getClientBillingInfo, upsertClientBillingInfo } from '../../api/clients'
import type { Client } from '../../types/models'
import { Button } from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Input'

export function BillingInfoForm({ clientId, client }: { clientId: string; client: Client }) {
  const [billingName, setBillingName] = useState('')
  const [billingEmail, setBillingEmail] = useState('')
  const [billingPhone, setBillingPhone] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [notes, setNotes] = useState('')
  const [sameAsClient, setSameAsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getClientBillingInfo(clientId)
      .then((info) => {
        if (info) {
          setBillingName(info.billing_name ?? '')
          setBillingEmail(info.billing_email ?? '')
          setBillingPhone(info.billing_phone ?? '')
          setBillingAddress(info.billing_address ?? '')
          setPaymentTerms(info.payment_terms ?? '')
          setNotes(info.notes ?? '')
        }
      })
      .finally(() => setLoading(false))
  }, [clientId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await upsertClientBillingInfo(clientId, {
        billing_name: billingName || null,
        billing_email: billingEmail || null,
        billing_phone: billingPhone || null,
        billing_address: billingAddress || null,
        payment_terms: paymentTerms || null,
        notes: notes || null,
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save billing info')
    } finally {
      setSaving(false)
    }
  }

  function toggleSameAsClient(checked: boolean) {
    setSameAsClient(checked)
    if (checked) {
      setBillingName(client.company || `${client.first_name} ${client.last_name}`)
      setBillingEmail(client.email ?? '')
      setBillingPhone(client.phone ?? '')
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 p-4 space-y-3 max-w-lg">
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={sameAsClient} onChange={(e) => toggleSameAsClient(e.target.checked)} />
        Same as client information
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Billing Name">
          <Input value={billingName} onChange={(e) => setBillingName(e.target.value)} />
        </Field>
        <Field label="Billing Email">
          <Input type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} />
        </Field>
        <Field label="Billing Phone">
          <Input value={billingPhone} onChange={(e) => setBillingPhone(e.target.value)} />
        </Field>
        <Field label="Payment Terms">
          <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g. Net 30" />
        </Field>
      </div>
      <Field label="Billing Address">
        <Textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} rows={2} />
      </Field>
      <Field label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Saved.</p>}
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Billing Info'}
      </Button>
    </form>
  )
}
