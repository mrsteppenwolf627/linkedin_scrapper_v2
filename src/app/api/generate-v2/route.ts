// ============================================
// POST /api/generate-v2
// Bridge: UI → V2 Writing Agent (claude-sonnet-4-6) → Supabase
//
// Body: { search_id: string, sales_goal: string }
// Flow: contacts → orchestrateV2() → message_batches → leads → message_drafts
//
// Garantía de integridad:
//   batch_id se captura al crear message_batches y se propaga
//   EXPLÍCITAMENTE a leads y message_drafts — nunca implícito.
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase'
import { orchestrateV2 } from '@/lib/agent_v2'
import type { LeadRawV2, MensajeLeadV2 } from '@/lib/agent_v2'
import type { ApiError } from '@/types'

// ── Tipos internos ────────────────────────────────────
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

type ContactRow = {
  id: string
  name: string | null
  job_title: string | null
  company: string | null
  location: string | null
  linkedin_url: string
  raw_google_snippet: string | null
}

// ── Función de persistencia con batch_id requerido ────
// batch_id es un string requerido, no opcional.
// Escribe EXPLÍCITAMENTE en leads.batch_id y message_drafts.batch_id.
// Nunca depende de triggers o mecanismos implícitos de la BD.
async function persistLeadWithV2Drafts(
  supabase: SupabaseClient,
  params: {
    batchId: string       // requerido — propagado a leads y message_drafts
    searchId: string      // requerido — propagado a leads y message_drafts
    salesGoal: string
    contact: ContactRow
    result: MensajeLeadV2
  }
): Promise<{ lead_id: string; draft_ids: string[] }> {
  const { batchId, searchId, salesGoal, contact, result } = params

  // ── Paso A: insertar lead vinculado al batch ──────────
  const { data: leadRow, error: leadErr } = await supabase
    .from('leads')
    .insert({
      name:         result.lead          || 'Desconocido',
      title:        result.rol           || null,
      company:      result.empresa       || null,
      industry:     null,
      location:     contact.location     ?? null,
      linkedin_url: contact.linkedin_url,
      your_product: salesGoal,
      search_id:    searchId,   // FK explícita
      batch_id:     batchId,    // FK explícita — nunca NULL en V2
    })
    .select('id')
    .single()

  if (leadErr || !leadRow) {
    throw new Error(`leads insert failed: ${leadErr?.message ?? 'no data returned'}`)
  }

  const lead_id = leadRow.id as string

  // ── Paso B: insertar 3 drafts con batch_id explícito ─
  // batch_id se escribe directamente en cada draft.
  // Esto garantiza la vinculación aunque no exista ningún trigger en BD.
  // NOTA: message_drafts no tiene columna search_id (verificado en schema real).
  // El vínculo con la búsqueda se resuelve via lead_id → leads.search_id.
  const draftsPayload = result.mensajes.map((m, seq) => ({
    lead_id,
    batch_id:   batchId,       // explícito — requerido — FK a message_batches
    sequence:   seq + 1,
    draft_text: m.texto,
    confidence: 0.9,
    tipo:       m.tipo,        // 'observacion' | 'insight' | 'cta_abierto'
  }))

  const { data: draftRows, error: draftsErr } = await supabase
    .from('message_drafts')
    .insert(draftsPayload)
    .select('id')

  if (draftsErr || !draftRows) {
    throw new Error(`message_drafts insert failed: ${draftsErr?.message ?? 'no data returned'}`)
  }

  return {
    lead_id,
    draft_ids: draftRows.map((r: { id: string }) => r.id),
  }
}

// ── Handler principal ─────────────────────────────────
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

  if (!search_id?.trim()) {
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

  // ── 1. Fetch contacts válidos para esta búsqueda ──────
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

  // ── 2. Mapear contacts → LeadRawV2 ───────────────────
  // raw_google_snippet: fragmento real del perfil LinkedIn extraído por SearchAPI.
  // Se pasa como posts_recientes[0] para que el agente V2 pueda anclar
  // la observación en algo concreto del perfil en lugar de inferir solo desde rol+empresa.
  const leads: LeadRawV2[] = contacts.map(c => ({
    nombre:          c.name     ?? 'Desconocido',
    empresa:         c.company  ?? '',
    rol:             c.job_title ?? '',
    posts_recientes: c.raw_google_snippet ? [c.raw_google_snippet] : [],
  }))

  // ── 3. Crear message_batch y CAPTURAR el id ───────────
  // Este es el único punto donde se genera batch_id.
  // El id resultante es el contrato de integridad del run completo.
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

  // batch_id es inmutable a partir de aquí — se pasa a todas las operaciones
  const batchId = batchRow.id as string
  console.log(`[generate-v2] batch creado: ${batchId} | leads: ${leads.length}`)

  // ── 4. Llamar al agente V2 ────────────────────────────
  let agentResults: MensajeLeadV2[]
  try {
    agentResults = await orchestrateV2(leads, sales_goal)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido en el agente V2'
    console.error('[generate-v2] Agent error:', msg)
    return NextResponse.json<ApiError>(
      { error: 'Agent Error', message: msg },
      { status: 500 }
    )
  }

  // ── 5. Persistir leads + drafts (secuencial, con batchId requerido) ──
  // Secuencial intencional: cada lead debe estar insertado antes de
  // insertar sus drafts (FK lead_id). No paralelizamos para mantener
  // el orden y facilitar el debug.
  let processed = 0
  let failed = 0

  for (let i = 0; i < agentResults.length; i++) {
    try {
      const { lead_id, draft_ids } = await persistLeadWithV2Drafts(supabase, {
        batchId,          // requerido — nunca undefined
        searchId: search_id,
        salesGoal: sales_goal,
        contact:  contacts[i],
        result:   agentResults[i],
      })

      processed++
      console.log(
        `[generate-v2] ✅ ${agentResults[i].lead} @ ${agentResults[i].empresa}` +
        ` | lead=${lead_id} | drafts=[${draft_ids.join(', ')}]`
      )
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[generate-v2] ❌ ${agentResults[i]?.lead ?? 'unknown'}: ${msg}`)
    }
  }

  const time_ms = Date.now() - t0
  console.log(
    `[generate-v2] DONE batch=${batchId} | processed=${processed} failed=${failed} | ${time_ms}ms`
  )

  return NextResponse.json<GenerateV2Response>({
    batch_id:    batchId,
    search_id,
    total_leads: leads.length,
    processed,
    failed,
    time_ms,
    agent: 'claude-sonnet-4-6',
  })
}
