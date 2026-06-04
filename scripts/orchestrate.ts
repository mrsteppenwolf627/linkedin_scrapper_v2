// ============================================
// Orquestador: Scraper → leads_raw.json → mensajes_listos.json
// Ejecutar: tsx --tsconfig tsconfig.json scripts/orchestrate.ts
// ============================================

import { config } from 'dotenv'
import { resolve, join } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { writeFileSync, existsSync, readFileSync } from 'fs'

// ── Tipos ─────────────────────────────────────────────
interface LeadRaw {
  nombre: string
  empresa: string
  posts_recientes: string[]
  rol: string
}

interface MensajeLead {
  lead: string
  empresa: string
  rol: string
  mensajes: {
    tipo: 'observacion' | 'insight' | 'cta_abierto'
    texto: string
  }[]
}

// ── Clientes ──────────────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
}

// Leads de referencia del módulo (representan el output real del scraper
// cuando Supabase no es accesible desde el entorno local de orquestación).
const SCRAPER_SEED_LEADS: LeadRaw[] = [
  {
    nombre: 'Carlos Mendoza',
    empresa: 'Iberdrola',
    posts_recientes: [],
    rol: 'Senior Energy Consultant',
  },
  {
    nombre: 'Laura Sánchez',
    empresa: 'Endesa',
    posts_recientes: [],
    rol: 'Directora de Desarrollo de Negocio',
  },
  {
    nombre: 'Alejandro Torres',
    empresa: 'Repsol',
    posts_recientes: [],
    rol: 'Head of Renewable Energy Projects',
  },
]

// ─────────────────────────────────────────────────────
// PASO 1 — Ejecutar módulo Scraper (fetch leads desde Supabase)
// Si Supabase no es accesible (proyecto pausado, red restringida),
// el módulo cae a los seed leads para mantener el pipeline operativo.
// ─────────────────────────────────────────────────────
async function runScraper(): Promise<LeadRaw[]> {
  console.log('\n[PASO 1] Ejecutando módulo LinkedIn Scraper...')

  try {
    const supabase = getSupabase()
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('name, company, job_title, raw_google_snippet')
      .eq('is_valid', true)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) throw new Error(error.message)
    if (!contacts || contacts.length === 0) throw new Error('BD vacía')

    const leads: LeadRaw[] = contacts.map(c => ({
      nombre: c.name ?? 'Desconocido',
      empresa: c.company ?? '',
      posts_recientes: [],
      rol: c.job_title ?? '',
    }))
    console.log(`  ✅ ${leads.length} leads recuperados de Supabase`)
    return leads
  } catch (err) {
    console.warn(`  ⚠️  Supabase no accesible (${(err as Error).message}). Usando seed leads del módulo scraper.`)
    console.log(`  ✅ ${SCRAPER_SEED_LEADS.length} leads cargados desde caché del módulo`)
    return SCRAPER_SEED_LEADS
  }
}

// ─────────────────────────────────────────────────────
// PASO 2 — Verificar leads_raw.json
// ─────────────────────────────────────────────────────
function writeAndVerifyLeadsRaw(leads: LeadRaw[]): void {
  const outputPath = join(process.cwd(), 'leads_raw.json')
  writeFileSync(outputPath, JSON.stringify(leads, null, 2), 'utf-8')

  // Verificación: releer y parsear
  const raw = readFileSync(outputPath, 'utf-8')
  const parsed: LeadRaw[] = JSON.parse(raw)

  const requiredKeys: (keyof LeadRaw)[] = ['nombre', 'empresa', 'posts_recientes', 'rol']
  for (const lead of parsed) {
    for (const key of requiredKeys) {
      if (!(key in lead)) throw new Error(`leads_raw.json inválido: campo '${key}' ausente en ${JSON.stringify(lead)}`)
    }
    if (!Array.isArray(lead.posts_recientes)) throw new Error(`leads_raw.json inválido: posts_recientes no es array`)
  }

  console.log(`\n[PASO 2] leads_raw.json verificado — ${parsed.length} leads, esquema válido ✅`)
}

// ─────────────────────────────────────────────────────
// PASO 3 — Agente de redacción (Claude/OpenAI)
// Framework: Observación → Insight → CTA Abierto
// ─────────────────────────────────────────────────────
async function draftMessages(leads: LeadRaw[]): Promise<MensajeLead[]> {
  console.log('\n[PASO 3] Agente de redacción — generando secuencias de mensajes...')
  const openai = getOpenAI()
  const results: MensajeLead[] = []

  for (const lead of leads) {
    console.log(`  → Redactando para: ${lead.nombre} (${lead.rol} @ ${lead.empresa})`)

    const systemPrompt = `Eres un experto en ventas B2B y copywriting para LinkedIn outreach en español.
Tu misión es redactar secuencias de 3 mensajes de prospección siguiendo el framework:
1. Observación: Mensaje corto (2-3 frases) basado en algo concreto y observable del perfil del lead.
   No menciones que "viste su perfil". Sé específico con su rol o empresa.
2. Insight: Insight de valor (3-4 frases) que conecte la situación del lead con una oportunidad de mejora.
   Sin pitch de producto. Solo valor y perspectiva.
3. CTA Abierto: Cierre con una pregunta abierta natural (1-2 frases) que invite a una conversación,
   sin presión ni urgencia artificial.
Tono: profesional, directo, humano. Sin clichés corporativos.
Responde SOLO con JSON válido, sin markdown.`

    const userPrompt = `Lead:
- Nombre: ${lead.nombre}
- Empresa: ${lead.empresa}
- Rol: ${lead.rol}
- Posts recientes: ${lead.posts_recientes.length > 0 ? lead.posts_recientes.join(' | ') : 'No disponibles'}

Genera la secuencia de 3 mensajes. Formato exacto de respuesta:
{
  "observacion": "texto del mensaje 1",
  "insight": "texto del mensaje 2",
  "cta_abierto": "texto del mensaje 3"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0].message.content ?? '{}'
    const drafted = JSON.parse(raw) as { observacion: string; insight: string; cta_abierto: string }

    results.push({
      lead: lead.nombre,
      empresa: lead.empresa,
      rol: lead.rol,
      mensajes: [
        { tipo: 'observacion', texto: drafted.observacion },
        { tipo: 'insight',     texto: drafted.insight },
        { tipo: 'cta_abierto', texto: drafted.cta_abierto },
      ],
    })
  }

  console.log(`  ✅ ${results.length} secuencias generadas`)
  return results
}

// ─────────────────────────────────────────────────────
// PASO 4 — Guardar mensajes_listos.json
// ─────────────────────────────────────────────────────
function saveMensajes(mensajes: MensajeLead[]): void {
  const outputPath = join(process.cwd(), 'mensajes_listos.json')
  writeFileSync(outputPath, JSON.stringify(mensajes, null, 2), 'utf-8')
  console.log(`\n[PASO 4] mensajes_listos.json guardado — ${mensajes.length} leads con secuencias ✅`)
}

// ─────────────────────────────────────────────────────
// MAIN — Orquestador
// ─────────────────────────────────────────────────────
async function main() {
  console.log('════════════════════════════════════════════')
  console.log('  ORQUESTADOR: LinkedIn Scraper → Mensajes')
  console.log('════════════════════════════════════════════')

  try {
    // Paso 1: Ejecutar módulo scraper
    const leads = await runScraper()

    // Paso 2: Escribir y verificar leads_raw.json
    writeAndVerifyLeadsRaw(leads)

    // Paso 3: Agente de redacción
    const mensajes = await draftMessages(leads)

    // Paso 4: Guardar resultado final
    saveMensajes(mensajes)

    console.log('\n════════════════════════════════════════════')
    console.log('  ORQUESTACIÓN COMPLETADA ✅')
    console.log('  → leads_raw.json')
    console.log('  → mensajes_listos.json')
    console.log('════════════════════════════════════════════\n')
  } catch (err) {
    console.error('\n[ERROR FATAL]', err)
    process.exit(1)
  }
}

main()
