import { useState } from 'react'
import type { CatalogItem, Discount } from '../../types/models'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

export interface LineItemDraft {
  description: string
  amount: string
  taxable: boolean
}

interface QuoteLineItemsEditorProps {
  items: LineItemDraft[]
  onChange: (items: LineItemDraft[]) => void
  readOnly?: boolean
  catalogItems: CatalogItem[]
  discounts: Discount[]
  taxRate: number
}

export function QuoteLineItemsEditor({
  items,
  onChange,
  readOnly,
  catalogItems,
  discounts,
  taxRate,
}: QuoteLineItemsEditorProps) {
  const [catalogSelection, setCatalogSelection] = useState('')
  const [discountSelection, setDiscountSelection] = useState('')

  function updateItem(index: number, patch: Partial<LineItemDraft>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function addManualItem() {
    onChange([...items, { description: '', amount: '', taxable: false }])
  }

  function addCatalogItem() {
    const item = catalogItems.find((c) => c.id === catalogSelection)
    if (!item) return
    onChange([...items, { description: item.name, amount: String(item.default_price), taxable: item.taxable }])
    setCatalogSelection('')
  }

  function addDiscount() {
    const discount = discounts.find((d) => d.id === discountSelection)
    if (!discount) return
    const currentSubtotal = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
    const discountAmount =
      discount.type === 'percentage' ? -(currentSubtotal * (discount.value / 100)) : -discount.value
    onChange([...items, { description: `Discount: ${discount.name}`, amount: discountAmount.toFixed(2), taxable: false }])
    setDiscountSelection('')
  }

  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  // Sum ALL taxable line items into the base, including negative ones (e.g.
  // a manual taxable credit) — excluding amount > 0 silently dropped a
  // negative taxable line instead of letting it reduce the tax base
  // (finding #5). Matches the server-side calc in replace_quote_line_items
  // / replace_invoice_line_items.
  const taxableBase = items.reduce((sum, item) => (item.taxable ? sum + (Number(item.amount) || 0) : sum), 0)
  const tax = taxableBase * taxRate
  const total = subtotal + tax

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <Input
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(i, { description: e.target.value })}
              disabled={readOnly}
              className="w-full"
            />
            <div className="flex items-center justify-between gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={item.amount}
                onChange={(e) => updateItem(i, { amount: e.target.value })}
                disabled={readOnly}
                className="w-28"
              />
              <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={item.taxable}
                  onChange={(e) => updateItem(i, { taxable: e.target.checked })}
                  disabled={readOnly}
                />
                taxable
              </label>
              {!readOnly && (
                <button type="button" onClick={() => removeItem(i)} className="text-xs text-red-600 hover:underline">
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center pt-1">
          <Button type="button" variant="secondary" onClick={addManualItem} className="w-full sm:w-auto">
            Add Line Item
          </Button>

          {catalogItems.length > 0 && (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
              <Select value={catalogSelection} onChange={(e) => setCatalogSelection(e.target.value)} className="w-full sm:w-48">
                <option value="">Add from catalog...</option>
                {catalogItems.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (${c.default_price})
                  </option>
                ))}
              </Select>
              <Button type="button" variant="secondary" onClick={addCatalogItem} disabled={!catalogSelection} className="w-full sm:w-auto">
                Add
              </Button>
            </div>
          )}

          {discounts.length > 0 && (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
              <Select value={discountSelection} onChange={(e) => setDiscountSelection(e.target.value)} className="w-full sm:w-48">
                <option value="">Apply discount...</option>
                {discounts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.type === 'percentage' ? `${d.value}%` : `$${d.value}`})
                  </option>
                ))}
              </Select>
              <Button type="button" variant="secondary" onClick={addDiscount} disabled={!discountSelection} className="w-full sm:w-auto">
                Add
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="pt-2 space-y-1 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {tax > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Tax ({(taxRate * 100).toFixed(2)}%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-gray-900">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
