import { supabase } from '../lib/supabase'
import type { MessageTemplate } from '../types/models'

export async function listMessageTemplates(): Promise<MessageTemplate[]> {
  const { data, error } = await supabase.from('message_templates').select('*').order('label', { ascending: true })
  if (error) throw error
  return data
}

export interface MessageTemplateInput {
  label: string
  subject: string | null
  body: string
}

export async function createMessageTemplate(input: MessageTemplateInput): Promise<MessageTemplate> {
  const { data, error } = await supabase.from('message_templates').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateMessageTemplate(id: string, patch: Partial<MessageTemplateInput>): Promise<MessageTemplate> {
  const { data, error } = await supabase.from('message_templates').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteMessageTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('message_templates').delete().eq('id', id)
  if (error) throw error
}
