// ============================================
// Message Store — DB helpers for leads + message_drafts + message_batches
// ============================================

import { createServerClient } from '@/lib/supabase'
import type { LeadInput, MessageDraft, MessageBatch } from '@/types'

interface SaveResult {
  lead_id: string
  draft_ids: string[]
}

/**
 * Creates a new message_batches row and returns its id.
 * Call once per generation run, before the per-contact loop.
 */
export async function createMessageBatch(
  searchId: string,
  yourProduct: string,
  totalLeads: number
): Promise<string> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('message_batches')
    .insert({
      search_id:    searchId,
      your_product: yourProduct || null,
      total_leads:  totalLeads,
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Error al crear message_batch: ${error?.message ?? 'sin datos'}`)
  }
  return data.id as string
}

/**
 * Inserts a lead record and its 3 AI-generated drafts.
 * Returns the new lead_id and the list of draft UUIDs.
 * Pass options.search_id to link the lead to a search.
 * Pass options.batch_id to link the lead to a generation batch.
 */
export async function saveLeadWithDrafts(
  lead: LeadInput,
  drafts: MessageDraft[],
  options?: { search_id?: string; batch_id?: string }
): Promise<SaveResult> {
  const supabase = createServerClient()

  // 1. Insert lead
  const { data: leadRow, error: leadErr } = await supabase
    .from('leads')
    .insert({
      name:         lead.name,
      title:        lead.title    || null,
      company:      lead.company  || null,
      industry:     lead.industry || null,
      location:     lead.location || null,
      linkedin_url: lead.linkedin_url,
      your_product: lead.your_product ?? null,
      search_id:    options?.search_id ?? null,
      batch_id:     options?.batch_id  ?? null,
    })
    .select('id')
    .single()

  if (leadErr || !leadRow) {
    throw new Error(`Error al guardar lead en Supabase: ${leadErr?.message ?? 'sin datos'}`)
  }

  // 2. Insert 3 drafts
  const draftsPayload = drafts.map((d) => ({
    lead_id:    leadRow.id,
    sequence:   d.sequence,
    draft_text: d.text,
    confidence: d.confidence,
  }))

  const { data: draftRows, error: draftsErr } = await supabase
    .from('message_drafts')
    .insert(draftsPayload)
    .select('id')

  if (draftsErr || !draftRows) {
    throw new Error(`Error al guardar drafts en Supabase: ${draftsErr?.message ?? 'sin datos'}`)
  }

  return {
    lead_id:   leadRow.id,
    draft_ids: draftRows.map((r: { id: string }) => r.id),
  }
}

/**
 * Returns all batches for a given search_id, newest first.
 * Joins search name for display.
 */
export async function listBatchesForSearch(searchId: string): Promise<MessageBatch[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('message_batches')
    .select('id, created_at, search_id, label, total_leads, your_product, searches(name)')
    .eq('search_id', searchId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Error al listar batches: ${error.message}`)

  return (data ?? []).map((row) => ({
    id:           row.id,
    created_at:   row.created_at,
    search_id:    row.search_id,
    search_name:  Array.isArray(row.searches)
      ? (row.searches[0]?.name ?? null)
      : (row.searches as { name: string } | null)?.name ?? null,
    label:        row.label,
    total_leads:  row.total_leads,
    your_product: row.your_product,
  }))
}
