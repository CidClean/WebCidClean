import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export interface LineItemDraft {
  description: string
  amount: string
}

interface QuoteLineItemsEditorProps {
  items: LineItemDraft[]
  onChange: (items: LineItemDraft[]) => void
  readOnly?: boolean
}

export function QuoteLineItemsEditor({ items, onChange, readOnly }: QuoteLineItemsEditorProps) {
  function updateItem(index: number, patch: Partial<LineItemDraft>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function addItem() {
    onChange([...items, { description: '', amount: '' }])
  }

  const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            placeholder="Description"
            value={item.description}
            onChange={(e) => updateItem(i, { description: e.target.value })}
            disabled={readOnly}
            className="flex-1"
          />
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Amount"
            value={item.amount}
            onChange={(e) => updateItem(i, { amount: e.target.value })}
            disabled={readOnly}
            className="w-28"
          />
          {!readOnly && (
            <button type="button" onClick={() => removeItem(i)} className="text-xs text-red-600 hover:underline">
              Remove
            </button>
          )}
        </div>
      ))}
      {!readOnly && (
        <Button type="button" variant="secondary" onClick={addItem}>
          Add Line Item
        </Button>
      )}
      <div className="text-sm font-semibold text-gray-900">Total: ${total.toFixed(2)}</div>
    </div>
  )
}
