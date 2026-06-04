// ============================================
// POST /api/generate-v2
// Bridge: UI → V2 Writing Agent (claude-sonnet-4-6) → Supabase
//
// Body: { search_id: string, sales_goal: string }
// Flow: contacts (Supabase) → orchestrateV2() → message_batches + message_drafts
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { orchestrateV2 } from '@/lib/agent_v2'
import type { LeadRawV2 } from '@/lib/agent_v2'
import type { ApiError } from '@/types'

interface GenerateV2RequestBody {
  search_id: string
  sales_goal: string
}

interface GenerateV2Response {
  batch_id: string
  search_id: string
  total_leads: number
  processed: number
  failed: number
  time_ms: number
  agent: 'claude-sonnet-4-6'
}

export async function POST(req: NextRequest) {
  const t0 = Date.now()

  // ── Auth ──────────────────────────────────────────────
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey || apiKey !== process.env.SEARCH_API_KEY) {
    return NextResponse.json<ApiError>(
      { error: 'Unauthorized', message: 'API key inválida o ausente' },
      { status: 401 }
    )
  }

  // ── Parse body ────────────────────────────────────────
  let body: GenerateV2RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'Body JSON inválido' },
      { status: 400 }
    )
  }

  const { search_id, sales_goal } = body

  if (!search_id) {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'Campo requerido: search_id' },
      { status: 400 }
    )
  }

  if (!sales_goal?.trim()) {
    return NextResponse.json<ApiError>(
      { error: 'Bad Request', message: 'Campo requerido: sales_goal (propuesta de valor)' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // ── 1. Fetch contacts for this search ─────────────────
  const { data: contacts, error: contactsErr } = await supabase
    .from('contacts')
    .select('id, name, job_title, company, location, linkedin_url, raw_google_snippet')
    .eq('search_id', search_id)
    .eq('is_valid', true)
    .order('confidence_score', { ascending: false })

  if (contactsErr) {
    return NextResponse.json<ApiError>(
      { error: 'Database Error', message: contactsErr.message },
      { status: 500 }
    )
  }

  if (!contacts || contacts.length === 0) {
    return NextResponse.json<ApiError>(
      { error: 'Not Found', message: 'No se encontraron contactos válidos para esta búsqueda' },
      { status: 404 }
    )
  }

  // ── 2. Map contacts → LeadRawV2 ───────────────────────
  const leads: LeadRawV2[] = contacts.map(c => ({
    nombre:           c.name ?? 'Desconocido',
    empresa:          c.company ?? '',
    rol:              c.job_title ?? '',
    posts_recientes:  [],
  }))

  // ── 3. Create message_batch record (V2) ───────────────
  const { data: batchRow, error: batchErr } = await supabase
    .from('message_batches')
    .insert({
      search_id,
      your_product:  sales_goal,
      total_leads:   leads.length,
      agent_version: 'v2',
    })
    .select('id')
    .single()

  if (batchErr || !batchRow) {
    return NextResponse.json<ApiError>(
      { error: 'Database Error', message: `Error al crear batch: ${batchErr?.message ?? 'sin datos'}` },
      { status: 500 }
    )
  }

  const batch_id = batchRow.id as string

  // ── 4. Run V2 writing agent ───────────────────────────
  let results
  try {
    results = await orchestrateV2(leads, sales_goal)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido en el agente V2'
    console.error('[generate-v2] Agent error:', msg)
    return NextResponse.json<ApiError>(
      { error: 'Agent Error', message: msg },
      { status: 500 }
    )
  }

  // ── 5. Persist drafts to message_drafts (with tipo) ───
  let processed = 0
  let failed = 0

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const contact = contacts[i]

    try {
      // Insert into leads table (links contact → batch)
      const { data: leadRow, error: leadErr } = await supabase
        .from('leads')
        .insert({
          name:         result.lead,
          title:        result.rol     || null,
          company:      result.empresa || null,
          industry:     null,
          location:     contact.location ?? null,
          linkedin_url: contact.linkedin_url,
          your_product: sales_goal,
          search_id,
          batch_id,
        })
        .select('id')
        .single()

      if (leadErr || !leadRow) throw new Error(leadErr?.message ?? 'sin lead_id')

      // Insert 3 drafts with tipo field
      const draftsPayload = result.mensajes.map((m, seq) => ({
        lead_id:    leadRow.id,
        sequence:   seq + 1,
        draft_text: m.texto,
        confidence: 0.9,
        tipo:       m.tipo,
      }))

      const { error: draftsErr } = await supabase
        .from('message_drafts')
        .insert(draftsPayload)

      if (draftsErr) throw new Error(draftsErr.message)

      processed++
      console.log(`[generate-v2] ✅ ${result.lead} @ ${result.empresa}`)
    } catch (err) {
      failed++
      console.error(`[generate-v2] ❌ ${result.lead}:`, err instanceof Error ? err.message : err)
    }
  }

  const time_ms = Date.now() - t0
  console.log(`[generate-v2] batch=${batch_id} | processed=${processed} failed=${failed} | ${time_ms}ms`)

  return NextResponse.json<GenerateV2Response>({
    batch_id,
    search_id,
    total_leads: leads.length,
    processed,
    failed,
    time_ms,
    agent: 'claude-sonnet-4-6',
  })
}
