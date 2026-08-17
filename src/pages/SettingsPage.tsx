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
import type { CatalogItem, CatalogItemKind, Discount, DiscountType } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'

type Tab = 'catalog' | 'discounts' | 'tax'

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('catalog')

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

      <div className="border-b border-gray-200 flex gap-4">
        {(
          [
            ['catalog', 'Services & Add-ons'],
            ['discounts', 'Discounts'],
            ['tax', 'Tax Rate'],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`pb-2 text-sm font-medium border-b-2 -mb-px ${
              tab === value ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'catalog' && <CatalogTab />}
      {tab === 'discounts' && <DiscountsTab />}
      {tab === 'tax' && <TaxRateTab />}
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
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'New Service / Add-on'}</Button>
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
        <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
          {items.length === 0 && <p className="p-4 text-sm text-gray-500">No services or add-ons yet.</p>}
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3">
              <div>
                <span className="text-sm font-medium text-gray-900">{item.name}</span>
                <span className="ml-2 text-xs text-gray-500 capitalize">{item.kind}</span>
                {item.taxable && <span className="ml-2 text-xs text-blue-600">taxable</span>}
                {!item.active && <span className="ml-2 text-xs text-gray-400">inactive</span>}
              </div>
              <div className="flex items-center gap-3">
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
    <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 p-4 space-y-3 max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kind">
          <Select value={kind} onChange={(e) => setKind(e.target.value as CatalogItemKind)}>
            <option value="service">Service</option>
            <option value="addon">Add-on</option>
          </Select>
        </Field>
        <Field label="Default Price">
          <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </Field>
        <div className="col-span-2">
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
      <Button type="submit" disabled={submitting}>
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
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'New Discount'}</Button>
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
        <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
          {discounts.length === 0 && <p className="p-4 text-sm text-gray-500">No discounts yet.</p>}
          {discounts.map((d) => (
            <div key={d.id} className="flex items-center justify-between p-3">
              <div>
                <span className="text-sm font-medium text-gray-900">{d.name}</span>
                {!d.active && <span className="ml-2 text-xs text-gray-400">inactive</span>}
              </div>
              <div className="flex items-center gap-3">
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
    <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 p-4 space-y-3 max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as DiscountType)}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </Select>
        </Field>
        <Field label={type === 'percentage' ? 'Value (%)' : 'Value ($)'}>
          <Input type="number" step="0.01" min="0" value={value} onChange={(e) => setValue(e.target.value)} required />
        </Field>
        <div className="col-span-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save'}
      </Button>
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
    <div className="bg-white rounded border border-gray-200 p-4 space-y-3 max-w-xs">
      <Field label="Tax Rate (%)">
        <Input type="number" step="0.01" min="0" max="100" value={taxRatePercent} onChange={(e) => setTaxRatePercent(e.target.value)} />
      </Field>
      <p className="text-xs text-gray-500">Applied to taxable line items on quotes. Default is Florida's 6%.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Saved.</p>}
      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  )
}
