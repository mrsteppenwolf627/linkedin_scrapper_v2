// ============================================
// GET  /api/batches?search_id=uuid  — lista lotes de una búsqueda
// DELETE /api/batches?id=uuid       — borra lote + leads + drafts
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { MessageBatch, ApiError } from '@/types'

function authError() {
  return NextResponse.json<ApiError>(
    { error: 'Unauthorized', message: 'API key inválida o ausente' },
    { status: 401 }
  )
}

// --- GET ---
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.SEARCH_API_KEY) return authError()

  const search_id = new URL(req.url).searchParams.get('search_id')

  const supabase = createServerClient()

  let query = supabase
    .from('message_batches')
    .select('id, created_at, search_id, label, total_leads, your_product, searches(name)')
    .order('created_at', { ascending: false })

  if (search_id) query = query.eq('search_id', search_id)

  const { data, error } = await query

  if (error) {
    return NextResponse.json<ApiError>(
      { error: 'Database Error', message: error.message },
      { status: 500 }
    )
  }

  const batches: MessageBatch[] = (data ?? []).map((row) => ({
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

  return NextResponse.json(batches)
}

// --- DELETE ---
export async function DELETE(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.SEARCH_API_KEY) return authError()

  const batch_id = new URL(req.url).searchParams.get('id')

  if (!batch_id) {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'Parámetro requerido: id' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // 1. Collect all lead_ids for this batch
  const { data: leadRows, error: leadFetchErr } = await supabase
    .from('leads')
    .select('id')
    .eq('batch_id', batch_id)

  if (leadFetchErr) {
    return NextResponse.json<ApiError>(
      { error: 'Database Error', message: leadFetchErr.message },
      { status: 500 }
    )
  }

  const leadIds = (leadRows ?? []).map((r: { id: string }) => r.id)

  // 2. Delete drafts for those leads
  if (leadIds.length > 0) {
    const { error: draftsErr } = await supabase
      .from('message_drafts')
      .delete()
      .in('lead_id', leadIds)

    if (draftsErr) {
      return NextResponse.json<ApiError>(
        { error: 'Database Error', message: `Error borrando drafts: ${draftsErr.message}` },
        { status: 500 }
      )
    }

    // 3. Delete leads
    const { error: leadsErr } = await supabase
      .from('leads')
      .delete()
      .eq('batch_id', batch_id)

    if (leadsErr) {
      return NextResponse.json<ApiError>(
        { error: 'Database Error', message: `Error borrando leads: ${leadsErr.message}` },
        { status: 500 }
      )
    }
  }

  // 4. Delete the batch record itself
  const { error: batchErr } = await supabase
    .from('message_batches')
    .delete()
    .eq('id', batch_id)

  if (batchErr) {
    return NextResponse.json<ApiError>(
      { error: 'Database Error', message: `Error borrando batch: ${batchErr.message}` },
      { status: 500 }
    )
  }

  console.log(`[batches] Deleted batch ${batch_id} — ${leadIds.length} leads removed`)
  return NextResponse.json({ success: true, leads_deleted: leadIds.length })
}
