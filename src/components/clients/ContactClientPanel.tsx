import { useEffect, useMemo, useState } from 'react'
import { listMessageTemplates } from '../../api/messageTemplates'
import { logClientContact } from '../../api/clientContact'
import { buildMailto, buildSms, buildTel, buildWhatsApp, renderTemplate } from '../../lib/messageTemplate'
import { CONTACT_CHANNELS, CONTACT_CHANNEL_LABELS, type Client, type ContactChannel, type JobSite, type MessageTemplate } from '../../types/models'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Input'
import { Select } from '../ui/Select'

type Target = 'client' | 'jobSite'

export function ContactClientPanel({
  client,
  jobSite,
  onClose,
  onLogged,
}: {
  client: Client
  jobSite?: JobSite
  onClose: () => void
  onLogged?: () => void
}) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [channel, setChannel] = useState<ContactChannel>('email')
  const [templateId, setTemplateId] = useState('')
  const [target, setTarget] = useState<Target>('client')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listMessageTemplates().then(setTemplates)
  }, [])

  const vars = useMemo(
    () => ({
      first_name: client.first_name,
      last_name: client.last_name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      job_site_name: jobSite?.name,
      job_site_address: jobSite?.address,
    }),
    [client, jobSite],
  )

  // Job site contact defaults to the on-site person when it differs from
  // the client's own info — a job site's day-to-day contact isn't always
  // the same person as the billing/account contact.
  useEffect(() => {
    if (jobSite?.contact_email || jobSite?.contact_phone) setTarget('jobSite')
  }, [jobSite])

  function applyTemplate(id: string) {
    setTemplateId(id)
    const t = templates.find((x) => x.id === id)
    if (!t) return
    setSubject(t.subject ? renderTemplate(t.subject, vars) : '')
    setBody(renderTemplate(t.body, vars))
  }

  const isEmail = channel === 'email'
  const isPhoneBased = !isEmail

  const emailAddress = target === 'jobSite' ? jobSite?.contact_email : client.email
  const phoneAddress = target === 'jobSite' ? jobSite?.contact_phone : client.phone
  const address = isEmail ? emailAddress : phoneAddress

  const hasAlternateEmail = !!jobSite?.contact_email && jobSite.contact_email !== client.email
  const hasAlternatePhone = !!jobSite?.contact_phone && jobSite.contact_phone !== client.phone
  const showTargetPicker = isEmail ? hasAlternateEmail : hasAlternatePhone

  function handleSend() {
    if (!address) {
      setError(`No ${isEmail ? 'email' : 'phone number'} on file for this contact.`)
      return
    }
    setError(null)

    let url: string
    if (channel === 'email') url = buildMailto(address, subject, body)
    else if (channel === 'sms') url = buildSms(address, body)
    else if (channel === 'whatsapp') url = buildWhatsApp(address, body)
    else url = buildTel(address)

    if (channel === 'whatsapp') window.open(url, '_blank', 'noopener')
    else window.location.href = url

    const template = templates.find((t) => t.id === templateId)
    setSending(true)
    logClientContact({
      clientId: client.id,
      jobSiteId: jobSite?.id ?? null,
      channel,
      templateId: templateId || null,
      templateLabel: template?.label ?? null,
      contactAddress: address,
    })
      .then(() => {
        onLogged?.()
        onClose()
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to log contact'))
      .finally(() => setSending(false))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Contact {client.first_name} {client.last_name}
          </h3>
          <button onClick={onClose} className="text-xs text-gray-500 hover:underline">
            Close
          </button>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {CONTACT_CHANNELS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChannel(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                channel === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {CONTACT_CHANNEL_LABELS[c]}
            </button>
          ))}
        </div>

        {showTargetPicker && (
          <Field label="Contact">
            <Select value={target} onChange={(e) => setTarget(e.target.value as Target)}>
              <option value="jobSite">
                {jobSite?.contact_name || jobSite?.name} ({isEmail ? jobSite?.contact_email : jobSite?.contact_phone})
              </option>
              <option value="client">
                {client.first_name} {client.last_name} ({isEmail ? client.email : client.phone})
              </option>
            </Select>
          </Field>
        )}

        {!address && (
          <p className="text-sm text-red-600">
            No {isEmail ? 'email' : 'phone number'} on file for {target === 'jobSite' ? 'this job site contact' : 'this client'}.
          </p>
        )}

        {isPhoneBased && channel !== 'call' && (
          <>
            <Field label="Template">
              <Select value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
                <option value="">Write your own…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Message">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
              />
            </Field>
          </>
        )}

        {isEmail && (
          <>
            <Field label="Template">
              <Select value={templateId} onChange={(e) => applyTemplate(e.target.value)}>
                <option value="">Write your own…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Subject">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </Field>
            <Field label="Message">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
              />
            </Field>
          </>
        )}

        {channel === 'call' && (
          <p className="text-sm text-gray-500">
            Opens your phone's dialer with {address ?? 'this contact'} — no message is sent, just the call.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button onClick={handleSend} disabled={sending || !address} className="w-full">
          {sending ? 'Logging...' : channel === 'call' ? 'Call' : channel === 'whatsapp' ? 'Open WhatsApp' : channel === 'sms' ? 'Open Messages' : 'Open Email'}
        </Button>
      </div>
    </div>
  )
}
