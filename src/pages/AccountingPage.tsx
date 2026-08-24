import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { listJobAccounting, type AccountingRow } from '../api/accounting'
import {
  createExpense,
  deleteExpense,
  listExpenseCategories,
  listExpenses,
  type ExpenseWithCategory,
} from '../api/expenses'
import { listSchedulableJobSites, type SchedulableJobSite } from '../api/jobSites'
import type { ExpenseCategory } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { StatCard } from '../components/ui/StatCard'

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function startOfMonth(): string {
  const now = new Date()
  return toDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)))
}

function startOfWeek(): string {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - d.getUTCDay())
  return toDateOnly(d)
}

type Tab = 'accounts' | 'expenses'

export function AccountingPage() {
  const [tab, setTab] = useState<Tab>('accounts')
  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(toDateOnly(new Date()))
  const [rows, setRows] = useState<AccountingRow[]>([])
  const [generalExpenses, setGeneralExpenses] = useState<ExpenseWithCategory[]>([])
  const [jobSites, setJobSites] = useState<SchedulableJobSite[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    listSchedulableJobSites().then(setJobSites)
    listExpenseCategories().then(setCategories)
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([listJobAccounting(from, to), listExpenses({ from, to, jobSiteId: null })])
      .then(([accountingRows, expenses]) => {
        setRows(accountingRows)
        setGeneralExpenses(expenses)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load accounting data'))
      .finally(() => setLoading(false))
  }, [from, to, refreshTick])

  function refresh() {
    setRefreshTick((t) => t + 1)
  }

  const totals = rows.reduce(
    (acc, r) => ({
      service: acc.service + r.service_amount,
      staffCost: acc.staffCost + r.staff_cost,
      jobExpenses: acc.jobExpenses + r.job_expenses,
      profit: acc.profit + r.profit,
    }),
    { service: 0, staffCost: 0, jobExpenses: 0, profit: 0 },
  )
  const generalTotal = generalExpenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totals.profit - generalTotal

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Accounting</h1>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
          />
        </div>
        <Button variant="secondary" onClick={() => setFrom(startOfWeek())}>
          This Week
        </Button>
        <Button variant="secondary" onClick={() => setFrom(startOfMonth())}>
          This Month
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Revenue" value={`$${totals.service.toFixed(2)}`} />
        <StatCard label="Staff + Job Cost" value={`$${(totals.staffCost + totals.jobExpenses).toFixed(2)}`} />
        <StatCard label="General Expenses" value={`$${generalTotal.toFixed(2)}`} />
        <StatCard label="Net Profit" value={`$${netProfit.toFixed(2)}`} warn={netProfit < 0} />
      </div>

      <div className="border-b border-gray-200 flex gap-4">
        {(
          [
            ['accounts', 'Accounts'],
            ['expenses', 'Expenses'],
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

      {tab === 'accounts' && (
        <section className="space-y-3">
          <p className="text-xs text-gray-500">
            Income (service amount) minus staff cost accrued in this range minus job-attributed expenses in this range.
          </p>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-gray-500">No active or paused job sites yet.</p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="p-3 font-medium">Client</th>
                    <th className="p-3 font-medium">Job Site</th>
                    <th className="p-3 font-medium text-right hidden sm:table-cell">Service Amount</th>
                    <th className="p-3 font-medium text-right hidden sm:table-cell">Staff Cost</th>
                    <th className="p-3 font-medium text-right hidden sm:table-cell">Job Expenses</th>
                    <th className="p-3 font-medium text-right">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.job_site_id} className="border-b border-gray-100 last:border-0">
                      <td className="p-3">
                        <Link to={`/clients/${row.client_id}`} className="text-blue-600 hover:underline">
                          {row.client_name}
                        </Link>
                      </td>
                      <td className="p-3">
                        <Link
                          to={`/clients/${row.client_id}/job-sites/${row.job_site_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {row.job_site_name}
                        </Link>
                      </td>
                      <td className="p-3 text-right hidden sm:table-cell">${row.service_amount.toFixed(2)}</td>
                      <td className="p-3 text-right hidden sm:table-cell">${row.staff_cost.toFixed(2)}</td>
                      <td className="p-3 text-right hidden sm:table-cell">${row.job_expenses.toFixed(2)}</td>
                      <td className="p-3 text-right font-medium">${row.profit.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 font-semibold">
                    <td className="p-3" colSpan={2}>
                      Total
                    </td>
                    <td className="p-3 text-right hidden sm:table-cell">${totals.service.toFixed(2)}</td>
                    <td className="p-3 text-right hidden sm:table-cell">${totals.staffCost.toFixed(2)}</td>
                    <td className="p-3 text-right hidden sm:table-cell">${totals.jobExpenses.toFixed(2)}</td>
                    <td className="p-3 text-right">${totals.profit.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'expenses' && (
        <div className="space-y-8">
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">General Company Expenses</h2>
              <p className="text-xs text-gray-500">Expenses not attributed to any job site.</p>
            </div>
            <ExpenseList
              expenses={generalExpenses}
              onDeleted={refresh}
              emptyMessage="No general expenses in this range."
            />
            <div className="text-right text-sm font-semibold pr-3">Total: ${generalTotal.toFixed(2)}</div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Log an Expense</h2>
            <ExpenseForm categories={categories} jobSites={jobSites} onCreated={refresh} />
          </section>
        </div>
      )}
    </div>
  )
}

function ExpenseList({
  expenses,
  onDeleted,
  emptyMessage,
}: {
  expenses: ExpenseWithCategory[]
  onDeleted: () => void
  emptyMessage: string
}) {
  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return
    await deleteExpense(id)
    onDeleted()
  }

  if (expenses.length === 0) {
    return <p className="text-sm text-gray-500">{emptyMessage}</p>
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
      {expenses.map((e) => (
        <div key={e.id} className="flex items-center justify-between p-3 text-sm">
          <div>
            <span className="text-gray-900">{e.expense_categories?.name ?? 'Uncategorized'}</span>
            {e.description && <span className="text-gray-500 ml-2">{e.description}</span>}
            <span className="text-gray-400 ml-2">{e.expense_date}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-700">${e.amount.toFixed(2)}</span>
            <button onClick={() => handleDelete(e.id)} className="text-xs text-red-600 hover:underline">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ExpenseForm({
  categories,
  jobSites,
  onCreated,
}: {
  categories: ExpenseCategory[]
  jobSites: SchedulableJobSite[]
  onCreated: () => void
}) {
  const [categoryId, setCategoryId] = useState('')
  const [jobSiteId, setJobSiteId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState(toDateOnly(new Date()))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const topLevel = categories.filter((c) => !c.parent_category_id)
  const childrenOf = (id: string) => categories.filter((c) => c.parent_category_id === id)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createExpense({
        category_id: categoryId || null,
        job_site_id: jobSiteId || null,
        amount: Number(amount) || 0,
        description: description || null,
        expense_date: expenseDate,
      })
      setAmount('')
      setDescription('')
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 max-w-2xl">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Uncategorized</option>
            {topLevel.map((c) => (
              <optgroup key={c.id} label={c.name}>
                <option value={c.id}>{c.name}</option>
                {childrenOf(c.id).map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    &nbsp;&nbsp;{sub.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <Field label="Account (job site, optional)">
          <Select value={jobSiteId} onChange={(e) => setJobSiteId(e.target.value)}>
            <option value="">General / Company-wide</option>
            {jobSites.map((js) => (
              <option key={js.id} value={js.id}>
                {js.name}
                {js.clients ? ` — ${js.clients.company || `${js.clients.first_name} ${js.clients.last_name}`}` : ''}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Amount">
          <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>
        <Field label="Date">
          <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
        </Field>
        <div className="col-span-2">
          <Field label="Description (optional)">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Add Expense'}
      </Button>
    </form>
  )
}
