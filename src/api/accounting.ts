import { supabase } from '../lib/supabase'

export interface AccountingRow {
  job_site_id: string
  job_site_name: string
  client_id: string
  client_name: string
  service_amount: number
  staff_payment_amount: number
  profit: number
}

export async function listActiveJobAccounting(): Promise<AccountingRow[]> {
  const { data, error } = await supabase
    .from('job_sites')
    .select('id, name, service_amount, staff_payment_amount, client_id, clients(first_name, last_name, company)')
    .eq('status', 'active')
    .order('name', { ascending: true })
  if (error) throw error

  return (data as unknown as Array<{
    id: string
    name: string
    service_amount: number | null
    staff_payment_amount: number | null
    client_id: string
    clients: { first_name: string; last_name: string; company: string | null } | null
  }>).map((row) => {
    const service = row.service_amount ?? 0
    const staffPay = row.staff_payment_amount ?? 0
    const clientName = row.clients
      ? row.clients.company || `${row.clients.first_name} ${row.clients.last_name}`
      : 'Unknown client'
    return {
      job_site_id: row.id,
      job_site_name: row.name,
      client_id: row.client_id,
      client_name: clientName,
      service_amount: service,
      staff_payment_amount: staffPay,
      profit: service - staffPay,
    }
  })
}
