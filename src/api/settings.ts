import { supabase } from '../lib/supabase'
import type { AppSettings, CatalogItem, CatalogItemKind, Discount } from '../types/models'

export async function listCatalogItems(kind?: CatalogItemKind): Promise<CatalogItem[]> {
  let query = supabase.from('catalog_items').select('*').order('name', { ascending: true })
  if (kind) query = query.eq('kind', kind)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createCatalogItem(input: {
  kind: CatalogItemKind
  name: string
  default_price: number
  taxable: boolean
}): Promise<CatalogItem> {
  const { data, error } = await supabase.from('catalog_items').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateCatalogItem(id: string, patch: Partial<CatalogItem>): Promise<CatalogItem> {
  const { data, error } = await supabase.from('catalog_items').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function listDiscounts(): Promise<Discount[]> {
  const { data, error } = await supabase.from('discounts').select('*').order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createDiscount(input: {
  name: string
  type: Discount['type']
  value: number
}): Promise<Discount> {
  const { data, error } = await supabase.from('discounts').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateDiscount(id: string, patch: Partial<Discount>): Promise<Discount> {
  const { data, error } = await supabase.from('discounts').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function getAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from('app_settings').select('*').eq('id', true).single()
  if (error) throw error
  return data
}

export async function updateTaxRate(taxRate: number): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .update({ tax_rate: taxRate })
    .eq('id', true)
    .select()
    .single()
  if (error) throw error
  return data
}
