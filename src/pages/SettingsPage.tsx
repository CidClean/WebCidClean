import { useEffect, useState, type FormEvent } from 'react'
import {
  createCatalogItem,
  createDiscount,
  getAppSettings,
  listCatalogItems,
  listDiscounts,
  updateCatalogItem,
  updateDiscount,
  updateTaxRate,
} from '../api/settings'
import {
  countExpensesUsingCategory,
  createExpenseCategory,
  deleteExpenseCategory,
  listExpenseCategories,
} from '../api/expenses'
import { enrollTotp, listMfaFactors, unenrollFactor, verifyTotpCode, type MfaFactor } from '../api/mfa'
import {
  createMessageTemplate,
  deleteMessageTemplate,
  listMessageTemplates,
  updateMessageTemplate,
} from '../api/messageTemplates'
import type { CatalogItem, CatalogItemKind, Discount, DiscountType, ExpenseCategory, MessageTemplate } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'

type Tab = 'catalog' | 'discounts' | 'expense-categories' | 'templates' | 'tax' | 'security'

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('catalog')

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="relative sm:w-48 shrink-0">
          <nav className="flex flex-row sm:flex-col gap-1 overflow-x-auto">
            {(
              [
                ['catalog', 'Services & Add-ons'],
                ['discounts', 'Discounts'],
                ['expense-categories', 'Expense Categories'],
                ['templates', 'Message Templates'],
                ['tax', 'Tax Rate'],
                ['security', 'Security'],
              ] as [Tab, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`text-left px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                  tab === value ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div
            aria-hidden="true"
            className="sm:hidden pointer-events-none absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-gray-50 to-transparent"
          />
        </div>

        <div className="flex-1 min-w-0">
          {tab === 'catalog' && <CatalogTab />}
          {tab === 'discounts' && <DiscountsTab />}
          {tab === 'expense-categories' && <ExpenseCategoriesTab />}
          {tab === 'templates' && <MessageTemplatesTab />}
          {tab === 'tax' && <TaxRateTab />}
          {tab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  )
}

function CatalogTab() {
  const [items, setItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  function refresh() {
    setLoading(true)
    listCatalogItems()
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  async function toggleActive(item: CatalogItem) {
    await updateCatalogItem(item.id, { active: !item.active })
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)} className="w-full sm:w-auto">
          {showForm ? 'Cancel' : 'New Service / Add-on'}
        </Button>
      </div>
      {showForm && (
        <CatalogItemForm
          onCreated={() => {
            setShowForm(false)
            refresh()
          }}
        />
      )}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {items.length === 0 && <p className="p-4 text-sm text-gray-500">No services or add-ons yet.</p>}
          {items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-3">
              <div className="min-w-0 break-words">
                <span className="text-sm font-medium text-gray-900">{item.name}</span>
                <span className="ml-2 text-xs text-gray-500 capitalize">{item.kind}</span>
                {item.taxable && <span className="ml-2 text-xs text-blue-600">taxable</span>}
                {!item.active && <span className="ml-2 text-xs text-gray-400">inactive</span>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm text-gray-700">${item.default_price}</span>
                <button onClick={() => toggleActive(item)} className="text-xs text-blue-600 hover:underline">
                  {item.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CatalogItemForm({ onCreated }: { onCreated: () => void }) {
  const [kind, setKind] = useState<CatalogItemKind>('service')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [taxable, setTaxable] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createCatalogItem({ kind, name, default_price: Number(price) || 0, taxable })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Kind">
          <Select value={kind} onChange={(e) => setKind(e.target.value as CatalogItemKind)}>
            <option value="service">Service</option>
            <option value="addon">Add-on</option>
          </Select>
        </Field>
        <Field label="Default Price">
          <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={taxable} onChange={(e) => setTaxable(e.target.checked)} />
        Taxable
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}

function DiscountsTab() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  function refresh() {
    setLoading(true)
    listDiscounts()
      .then(setDiscounts)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  async function toggleActive(discount: Discount) {
    await updateDiscount(discount.id, { active: !discount.active })
    refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)} className="w-full sm:w-auto">
          {showForm ? 'Cancel' : 'New Discount'}
        </Button>
      </div>
      {showForm && (
        <DiscountForm
          onCreated={() => {
            setShowForm(false)
            refresh()
          }}
        />
      )}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {discounts.length === 0 && <p className="p-4 text-sm text-gray-500">No discounts yet.</p>}
          {discounts.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-3">
              <div className="min-w-0 break-words">
                <span className="text-sm font-medium text-gray-900">{d.name}</span>
                {!d.active && <span className="ml-2 text-xs text-gray-400">inactive</span>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm text-gray-700">{d.type === 'percentage' ? `${d.value}%` : `$${d.value}`}</span>
                <button onClick={() => toggleActive(d)} className="text-xs text-blue-600 hover:underline">
                  {d.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DiscountForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState<DiscountType>('percentage')
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createDiscount({ name, type, value: Number(value) || 0 })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as DiscountType)}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </Select>
        </Field>
        <Field label={type === 'percentage' ? 'Value (%)' : 'Value ($)'}>
          <Input type="number" step="0.01" min="0" value={value} onChange={(e) => setValue(e.target.value)} required />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}

function MessageTemplatesTab() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MessageTemplate | null>(null)

  function refresh() {
    setLoading(true)
    listMessageTemplates()
      .then(setTemplates)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return
    await deleteMessageTemplate(id)
    refresh()
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Reusable messages for the Contact panel on clients and job sites. Use <code>{'{{first_name}}'}</code>,{' '}
        <code>{'{{last_name}}'}</code>, <code>{'{{company}}'}</code>, <code>{'{{email}}'}</code>,{' '}
        <code>{'{{phone}}'}</code>, and — when sent from a job site — <code>{'{{job_site_name}}'}</code>,{' '}
        <code>{'{{job_site_address}}'}</code>. The same body is used for email, SMS, and WhatsApp; Subject only
        applies to email.
      </p>
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null)
            setShowForm((v) => !v)
          }}
          className="w-full sm:w-auto"
        >
          {showForm ? 'Cancel' : 'New Template'}
        </Button>
      </div>
      {showForm && (
        <MessageTemplateForm
          template={editing}
          onSaved={() => {
            setShowForm(false)
            setEditing(null)
            refresh()
          }}
        />
      )}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {templates.length === 0 && <p className="p-4 text-sm text-gray-500">No message templates yet.</p>}
          {templates.map((t) => (
            <div key={t.id} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 p-3">
              <div className="min-w-0 break-words">
                <span className="text-sm font-medium text-gray-900">{t.label}</span>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-md">{t.body}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => {
                    setEditing(t)
                    setShowForm(true)
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button onClick={() => handleDelete(t.id)} className="text-xs text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MessageTemplateForm({ template, onSaved }: { template: MessageTemplate | null; onSaved: () => void }) {
  const [label, setLabel] = useState(template?.label ?? '')
  const [subject, setSubject] = useState(template?.subject ?? '')
  const [body, setBody] = useState(template?.body ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const input = { label, subject: subject || null, body }
      if (template) await updateMessageTemplate(template.id, input)
      else await createMessageTemplate(input)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 max-w-lg">
      <Field label="Label">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Visit reminder" required />
      </Field>
      <Field label="Subject (email only)">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Field>
      <Field label="Message">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
          required
        />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}

function ExpenseCategoriesTab() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    setLoading(true)
    listExpenseCategories()
      .then(setCategories)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  const topLevel = categories.filter((c) => !c.parent_category_id)
  const childrenOf = (id: string) => categories.filter((c) => c.parent_category_id === id)

  async function handleDelete(category: ExpenseCategory) {
    if (childrenOf(category.id).length > 0) {
      setError(`Delete subcategories of "${category.name}" first.`)
      return
    }
    setError(null)
    let usageCount = 0
    try {
      usageCount = await countExpensesUsingCategory(category.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check category usage')
      return
    }
    const message =
      usageCount > 0
        ? `Delete category "${category.name}"? It's used by ${usageCount} expense${usageCount === 1 ? '' : 's'} — ${
            usageCount === 1 ? 'that expense' : 'those expenses'
          } will keep its amount but lose its category, and won't be assigned to any other category automatically.`
        : `Delete category "${category.name}"? It isn't used by any expenses yet.`
    if (!confirm(message)) return
    try {
      await deleteExpenseCategory(category.id)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)} className="w-full sm:w-auto">
          {showForm ? 'Cancel' : 'New Category'}
        </Button>
      </div>
      {showForm && (
        <ExpenseCategoryForm
          categories={categories}
          onCreated={() => {
            setShowForm(false)
            refresh()
          }}
        />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {topLevel.length === 0 && <p className="p-4 text-sm text-gray-500">No expense categories yet.</p>}
          {topLevel.map((cat) => (
            <div key={cat.id}>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-3">
                <span className="text-sm font-medium text-gray-900 break-words min-w-0">{cat.name}</span>
                <button onClick={() => handleDelete(cat)} className="text-xs text-red-600 hover:underline shrink-0">
                  Delete
                </button>
              </div>
              {childrenOf(cat.id).map((sub) => (
                <div key={sub.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-3 pl-8 border-t border-gray-50">
                  <span className="text-sm text-gray-700 break-words min-w-0">{sub.name}</span>
                  <button onClick={() => handleDelete(sub)} className="text-xs text-red-600 hover:underline shrink-0">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExpenseCategoryForm({
  categories,
  onCreated,
}: {
  categories: ExpenseCategory[]
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const topLevel = categories.filter((c) => !c.parent_category_id)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createExpenseCategory({ name, parent_category_id: parentId || null })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Parent Category (optional)">
          <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">None (top-level)</option>
            {topLevel.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}

function SecurityTab() {
  const [factors, setFactors] = useState<MfaFactor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null)

  function refresh() {
    setLoading(true)
    listMfaFactors()
      .then(setFactors)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  const verifiedFactors = factors.filter((f) => f.status === 'verified')

  async function startEnrollment() {
    setError(null)
    try {
      // Clean up any abandoned unverified factors from a previous attempt
      // before starting a new one.
      for (const f of factors.filter((x) => x.status === 'unverified')) {
        await unenrollFactor(f.id)
      }
      const enrollment = await enrollTotp()
      setEnrolling(enrollment)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start enrollment')
    }
  }

  async function handleDisable(factorId: string) {
    if (!confirm('Disable two-factor authentication for this account?')) return
    setError(null)
    try {
      await unenrollFactor(factorId)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 max-w-lg">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">
          Two-Factor Authentication
        </h2>
        <p className="text-xs text-gray-500">
          Required for admin accounts. Adds a 6-digit code from an authenticator app (like Google Authenticator or
          Authy) on top of your password.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : enrolling ? (
        <TotpEnrollmentForm
          enrollment={enrolling}
          onDone={() => {
            setEnrolling(null)
            refresh()
          }}
          onCancel={() => setEnrolling(null)}
        />
      ) : verifiedFactors.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-green-700">Two-factor authentication is enabled.</p>
          {verifiedFactors.map((f) => (
            <div key={f.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Authenticator app</span>
              <button onClick={() => handleDisable(f.id)} className="text-xs text-red-600 hover:underline">
                Disable
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Button onClick={startEnrollment} className="w-full sm:w-auto">
          Enable Two-Factor Authentication
        </Button>
      )}
    </div>
  )
}

function TotpEnrollmentForm({
  enrollment,
  onDone,
  onCancel,
}: {
  enrollment: { factorId: string; qrCode: string; secret: string }
  onDone: () => void
  onCancel: () => void
}) {
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await verifyTotpCode(enrollment.factorId, code)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-gray-700">Scan this QR code with your authenticator app:</p>
      <img src={enrollment.qrCode} alt="TOTP QR code" className="w-40 h-40 border border-gray-200 rounded-lg" />
      <p className="text-xs text-gray-500">
        Can't scan it? Enter this code manually: <code className="font-mono">{enrollment.secret}</code>
      </p>
      <Field label="Enter the 6-digit code from the app to confirm">
        <Input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" pattern="[0-9]*" required />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? 'Verifying...' : 'Verify & Enable'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
      </div>
    </form>
  )
}

function TaxRateTab() {
  const [taxRatePercent, setTaxRatePercent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAppSettings()
      .then((s) => setTaxRatePercent(String(s.tax_rate * 100)))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await updateTaxRate(Number(taxRatePercent) / 100)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 max-w-xs">
      <Field label="Tax Rate (%)">
        <Input type="number" step="0.01" min="0" max="100" value={taxRatePercent} onChange={(e) => setTaxRatePercent(e.target.value)} />
      </Field>
      <p className="text-xs text-gray-500">Applied to taxable line items on quotes. Default is Florida's 6%.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Saved.</p>}
      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}
