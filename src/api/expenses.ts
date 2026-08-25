import { supabase } from '../lib/supabase'
import type { Expense, ExpenseCategory } from '../types/models'

export async function listExpenseCategories(): Promise<ExpenseCategory[]> {
  const { data, error } = await supabase.from('expense_categories').select('*').order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createExpenseCategory(input: {
  name: string
  parent_category_id: string | null
}): Promise<ExpenseCategory> {
  const { data, error } = await supabase.from('expense_categories').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateExpenseCategory(id: string, patch: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
  const { data, error } = await supabase.from('expense_categories').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteExpenseCategory(id: string): Promise<void> {
  const { error } = await supabase.from('expense_categories').delete().eq('id', id)
  if (error) throw error
}

export async function countExpensesUsingCategory(categoryId: string): Promise<number> {
  const { count, error } = await supabase
    .from('expenses')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId)
  if (error) throw error
  return count ?? 0
}

export interface ExpenseWithCategory extends Expense {
  expense_categories: { id: string; name: string; parent_category_id: string | null } | null
}

export async function listExpenses(filters: {
  from?: string
  to?: string
  jobSiteId?: string | null
}): Promise<ExpenseWithCategory[]> {
  let query = supabase
    .from('expenses')
    .select('*, expense_categories(id, name, parent_category_id)')
    .order('expense_date', { ascending: false })
  if (filters.from) query = query.gte('expense_date', filters.from)
  if (filters.to) query = query.lte('expense_date', filters.to)
  if (filters.jobSiteId === null) query = query.is('job_site_id', null)
  else if (filters.jobSiteId) query = query.eq('job_site_id', filters.jobSiteId)
  const { data, error } = await query
  if (error) throw error
  return data as unknown as ExpenseWithCategory[]
}

export async function createExpense(input: {
  category_id: string | null
  job_site_id: string | null
  amount: number
  description: string | null
  expense_date: string
}): Promise<Expense> {
  const { data, error } = await supabase.from('expenses').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateExpense(id: string, patch: Partial<Expense>): Promise<Expense> {
  const { data, error } = await supabase.from('expenses').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}
