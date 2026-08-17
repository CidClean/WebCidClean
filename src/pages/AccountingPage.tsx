import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listActiveJobAccounting, type AccountingRow } from '../api/accounting'

export function AccountingPage() {
  const [rows, setRows] = useState<AccountingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listActiveJobAccounting()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load accounting data'))
      .finally(() => setLoading(false))
  }, [])

  const totals = rows.reduce(
    (acc, r) => ({
      service: acc.service + r.service_amount,
      staff: acc.staff + r.staff_payment_amount,
      profit: acc.profit + r.profit,
    }),
    { service: 0, staff: 0, profit: 0 },
  )

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Accounting</h1>
      <p className="text-sm text-gray-500">Service amount, staff payment, and profit for all active job sites.</p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">No active job sites yet.</p>
      ) : (
        <div className="bg-white rounded border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="p-3 font-medium">Client</th>
                <th className="p-3 font-medium">Job Site</th>
                <th className="p-3 font-medium text-right">Service Amount</th>
                <th className="p-3 font-medium text-right">Staff Payment</th>
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
                    <Link to={`/clients/${row.client_id}/job-sites/${row.job_site_id}`} className="text-blue-600 hover:underline">
                      {row.job_site_name}
                    </Link>
                  </td>
                  <td className="p-3 text-right">${row.service_amount.toFixed(2)}</td>
                  <td className="p-3 text-right">${row.staff_payment_amount.toFixed(2)}</td>
                  <td className="p-3 text-right font-medium">${row.profit.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 font-semibold">
                <td className="p-3" colSpan={2}>
                  Total
                </td>
                <td className="p-3 text-right">${totals.service.toFixed(2)}</td>
                <td className="p-3 text-right">${totals.staff.toFixed(2)}</td>
                <td className="p-3 text-right">${totals.profit.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
