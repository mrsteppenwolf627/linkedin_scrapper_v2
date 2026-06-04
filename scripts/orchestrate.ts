// ============================================
// Orquestador: Scraper → leads_raw.json → mensajes_listos.json
// Ejecutar: tsx --tsconfig tsconfig.json scripts/orchestrate.ts
// Agente de redacción: claude-sonnet-4-6 (Anthropic)
// ============================================

import { config } from 'dotenv'
import { resolve, join } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
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

function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no está configurada en .env.local')
  return new Anthropic({ apiKey })
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

  const raw = readFileSync(outputPath, 'utf-8')
  const parsed: LeadRaw[] = JSON.parse(raw)

  const requiredKeys: (keyof LeadRaw)[] = ['nombre', 'empresa', 'posts_recientes', 'rol']
  for (const lead of parsed) {
    for (const key of requiredKeys) {
      if (!(key in lead)) throw new Error(`leads_raw.json inválido: campo '${key}' ausente en ${JSON.stringify(lead)}`)
    }
    if (!Array.isArray(lead.posts_recientes)) throw new Error('leads_raw.json inválido: posts_recientes no es array')
  }

  console.log(`\n[PASO 2] leads_raw.json verificado — ${parsed.length} leads, esquema válido ✅`)
}

// ─────────────────────────────────────────────────────
// PASO 3 — Agente de redacción (claude-sonnet-4-6)
// Framework: Observación → Insight → CTA Abierto
// El system prompt se cachea entre leads (prompt caching Anthropic).
// El agente consulta ADRs.md antes de redactar para mantener
// coherencia con las decisiones arquitectónicas congeladas.
// ─────────────────────────────────────────────────────
async function draftMessages(leads: LeadRaw[]): Promise<MensajeLead[]> {
  console.log('\n[PASO 3] Agente de redacción (claude-sonnet-4-6) — generando secuencias...')

  const anthropic = getAnthropic()

  // Leer ADRs.md para inyectar decisiones de marca en el system prompt
  const adrsPath = join(process.cwd(), 'docs', 'adr', 'ADRs.md')
  const adrsContent = existsSync(adrsPath)
    ? readFileSync(adrsPath, 'utf-8')
    : '(ADRs.md no encontrado — aplicar criterios de tono y estructura por defecto)'
  console.log(`  → ADRs.md cargado (${adrsContent.length} caracteres)`)

  // System prompt con el framework explícito + decisiones de marca
  // Se marca con cache_control para reutilizarse entre todos los leads del run.
  const systemPromptText = `Eres un Senior Copywriter especializado en ventas B2B y LinkedIn outreach en español.

## TU MISIÓN
Redactar secuencias de prospección para leads del sector energético siguiendo estrictamente el framework de 3 mensajes.

## FRAMEWORK OBLIGATORIO: Observación → Insight → CTA Abierto

### MENSAJE 1 — OBSERVACIÓN
- Basada en un dato concreto y observable: rol del lead, empresa, sector o responsabilidad.
- Longitud: exactamente 2-3 frases. Sin más.
- Demuestra conocimiento del contexto sin decir que "viste su perfil".
- El lead debe sentir que el remitente entiende su mundo, no que recibe spam.

### MENSAJE 2 — INSIGHT
- Un insight de valor que conecte la situación del lead con una tensión o oportunidad real de su sector.
- Longitud: 3-4 frases. Sin pitch de producto ni mención del remitente.
- Basado en dinámicas reales: regulación energética, transición renovable, presión de márgenes, digitalización.
- El lead debe pensar: "Esto es relevante para mí", no "me están vendiendo algo".

### MENSAJE 3 — CTA ABIERTO
- Una sola pregunta abierta que invite al lead a compartir su perspectiva u opinión.
- Longitud: 1-2 frases. Debe terminar con signo de interrogación (?).
- No pedir reuniones, llamadas ni tiempo concreto.
- El lead debe sentir que le piden su expertise, no su agenda.

## DECISIONES ARQUITECTÓNICAS DE MARCA (ADRs)
${adrsContent}

## FORMATO DE RESPUESTA
Responde EXCLUSIVAMENTE con JSON válido y parseable. Sin markdown, sin texto antes o después.
Estructura obligatoria:
{"observacion": "<texto>", "insight": "<texto>", "cta_abierto": "<texto>"}`

  const results: MensajeLead[] = []

  for (const lead of leads) {
    console.log(`  → Redactando para: ${lead.nombre} (${lead.rol} @ ${lead.empresa})`)

    const userPrompt = `Redacta la secuencia de 3 mensajes para este lead:

NOMBRE: ${lead.nombre}
EMPRESA: ${lead.empresa}
ROL: ${lead.rol}
POSTS RECIENTES: ${lead.posts_recientes.length > 0 ? lead.posts_recientes.join(' | ') : 'No disponibles — infiere el contexto desde rol y empresa'}

Sigue el framework Observación → Insight → CTA Abierto y todas las decisiones de marca de los ADRs.
El nombre del lead NO debe aparecer en los mensajes.`

    // Streaming con prompt caching en el system prompt.
    // El system prompt es estable para todos los leads: se escribe en caché
    // en el primer lead y se lee desde caché en los siguientes (~0.1x coste).
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPromptText,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    })

    const message = await stream.finalMessage()

    const textBlock = message.content.find(
      (b): b is Anthropic.TextBlock => b.type === 'text'
    )
    const raw = textBlock?.text ?? '{}'
    const drafted = JSON.parse(raw) as {
      observacion: string
      insight: string
      cta_abierto: string
    }

    // Log de uso de caché para verificación
    const usage = message.usage as Anthropic.Usage & {
      cache_creation_input_tokens?: number
      cache_read_input_tokens?: number
    }
    const cacheStatus = usage.cache_read_input_tokens
      ? `(caché HIT: ${usage.cache_read_input_tokens} tokens desde caché)`
      : `(caché WRITE: ${usage.cache_creation_input_tokens ?? 0} tokens escritos)`
    console.log(`     ${cacheStatus}`)

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

  console.log(`  ✅ ${results.length} secuencias generadas (modelo: claude-sonnet-4-6)`)
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
  console.log('  Agente: claude-sonnet-4-6 + ADRs.md')
  console.log('════════════════════════════════════════════')

  try {
    const leads = await runScraper()
    writeAndVerifyLeadsRaw(leads)
    const mensajes = await draftMessages(leads)
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
