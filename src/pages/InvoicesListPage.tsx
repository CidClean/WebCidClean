import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listAllInvoices, type InvoiceWithJobSite } from '../api/invoices'
import { isInvoiceOverdue } from '../lib/accrual'
import { INVOICE_STATUSES } from '../types/models'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ListToolbar } from '../components/ui/ListToolbar'

function clientLabel(jobSites: InvoiceWithJobSite['job_sites']): string {
  const c = jobSites?.clients
  if (!c) return 'Unknown client'
  return c.company || `${c.first_name} ${c.last_name}`
}

export function InvoicesListPage() {
  const [invoices, setInvoices] = useState<InvoiceWithJobSite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | (typeof INVOICE_STATUSES)[number]>('all')

  useEffect(() => {
    listAllInvoices()
      .then(setInvoices)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load invoices'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false
      if (!q) return true
      const haystack = `${inv.job_sites?.name ?? ''} ${clientLabel(inv.job_sites)}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [invoices, search, statusFilter])

  return (
    <div className="space-y-6">
      <ListToolbar title="Invoices" count={invoices.length}>
        <Input
          placeholder="Search by job site or client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="w-44">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">All statuses</option>
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </ListToolbar>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No invoices match. Generate one from a job site's Invoices tab.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-200">
                <th className="px-4 py-2 font-medium">Job Site</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Client</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Period</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inv) => (
                <InvoiceRow key={inv.id} invoice={inv} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function InvoiceRow({ invoice: inv }: { invoice: InvoiceWithJobSite }) {
  const navigate = useNavigate()
  const to = inv.job_sites
    ? `/clients/${inv.job_sites.client_id}/job-sites/${inv.job_sites.id}/invoice/${inv.id}`
    : null
  return (
    <tr onClick={() => to && navigate(to)} className={to ? 'cursor-pointer hover:bg-gray-50' : ''}>
      <td className="px-4 py-3 font-medium text-gray-900">{inv.job_sites?.name ?? 'Unknown job site'}</td>
      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{clientLabel(inv.job_sites)}</td>
      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
        {inv.period_start} to {inv.period_end}
      </td>
      <td className="px-4 py-3 text-gray-700">${inv.amount.toFixed(2)}</td>
      <td className="px-4 py-3">
        <StatusBadge status={inv.status} overdue={isInvoiceOverdue(inv)} />
      </td>
    </tr>
  )
}
