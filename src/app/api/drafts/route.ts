// ============================================
// GET /api/drafts
// Devuelve todos los drafts (flat array) con info del lead y búsqueda.
//
// Query params:
//   search_id  (optional) — filtra por búsqueda
//   batch_id   (optional) — filtra por lote de generación (preferred)
//
// Response: array plano ordenado por lead_id → sequence (1, 2, 3)
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { ApiError } from '@/types'

interface DraftItem {
  id:                string
  lead_id:           string
  lead_name:         string
  lead_linkedin_url: string
  lead_company:      string | null
  search_name:       string | null
  batch_id:          string | null
  sequence:          number
  draft_text:        string
  confidence:        number
}

export async function GET(req: NextRequest) {
  // --- Auth ---
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.SEARCH_API_KEY) {
    return NextResponse.json<ApiError>(
      { error: 'Unauthorized', message: 'API key inválida o ausente' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const search_id = searchParams.get('search_id')
  const batch_id  = searchParams.get('batch_id')
  const legacy    = searchParams.get('legacy') === 'true' // batch_id IS NULL

  const supabase = createServerClient()

  let query = supabase
    .from('leads')
    .select(
      `id,
       name,
       linkedin_url,
       company,
       search_id,
       batch_id,
       searches (name),
       message_drafts (
         id,
         sequence,
         draft_text,
         confidence
       )`
    )
    .order('id', { ascending: true })

  if (legacy) {
    query = query.is('batch_id', null)
  } else if (batch_id) {
    query = query.eq('batch_id', batch_id)
  } else if (search_id) {
    query = query.eq('search_id', search_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('[/api/drafts] Supabase error:', error.message)
    return NextResponse.json<ApiError>(
      { error: 'Database Error', message: error.message },
      { status: 500 }
    )
  }

  // Flatten leads → drafts, sorting drafts by sequence within each lead
  const drafts: DraftItem[] = []

  for (const lead of data ?? []) {
    const searchName = Array.isArray(lead.searches)
      ? (lead.searches[0]?.name ?? null)
      : (lead.searches as { name: string } | null)?.name ?? null

    const sortedDrafts = [...(lead.message_drafts ?? [])].sort(
      (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)
    )

    for (const d of sortedDrafts) {
      drafts.push({
        id:                d.id,
        lead_id:           lead.id,
        lead_name:         lead.name,
        lead_linkedin_url: lead.linkedin_url,
        lead_company:      lead.company ?? null,
        search_name:       searchName,
        batch_id:          lead.batch_id ?? null,
        sequence:          d.sequence,
        draft_text:        d.draft_text,
        confidence:        d.confidence,
      })
    }
  }

  return NextResponse.json(drafts)
}
