import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAllInvoices, type InvoiceWithJobSite } from '../api/invoices'
import { INVOICE_STATUSES } from '../types/models'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'

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
      <h1 className="text-xl font-semibold text-gray-900">Invoices</h1>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by job site or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">All statuses</option>
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No invoices match. Generate one from a job site's Invoices tab.</p>
      ) : (
        <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
          {filtered.map((inv) => (
            <Link
              key={inv.id}
              to={
                inv.job_sites
                  ? `/clients/${inv.job_sites.client_id}/job-sites/${inv.job_sites.id}/invoice/${inv.id}`
                  : '#'
              }
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium text-gray-900">{inv.job_sites?.name ?? 'Unknown job site'}</div>
                <div className="text-sm text-gray-500">
                  {clientLabel(inv.job_sites)} — {inv.period_start} to {inv.period_end}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">${inv.amount.toFixed(2)}</span>
                <StatusBadge status={inv.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
