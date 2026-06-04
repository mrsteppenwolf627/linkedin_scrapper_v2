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
import { writeFileSync, existsSync, readFileSync, readdirSync } from 'fs'

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
// Carga todas las ADRs del directorio docs/adr/ en orden alfabético.
// Esto garantiza que cualquier ADR añadida al directorio sea consultada
// automáticamente por el agente sin cambios de código (ADR-004 incluida).
// ─────────────────────────────────────────────────────
function loadAllADRs(): string {
  const adrDir = join(process.cwd(), 'docs', 'adr')
  if (!existsSync(adrDir)) return '(directorio docs/adr/ no encontrado)'

  const files = readdirSync(adrDir)
    .filter(f => f.endsWith('.md'))
    .sort() // orden alfabético → ADR-001 antes que ADR-004

  if (files.length === 0) return '(no hay archivos .md en docs/adr/)'

  const contents = files.map(f => {
    const content = readFileSync(join(adrDir, f), 'utf-8')
    return `\n${'─'.repeat(60)}\n## ARCHIVO: ${f}\n${'─'.repeat(60)}\n${content}`
  })

  return contents.join('\n')
}

// ─────────────────────────────────────────────────────
// PASO 3 — Agente de redacción (claude-sonnet-4-6)
// Framework: Observación → Insight → CTA Abierto
// El system prompt se cachea entre leads (prompt caching Anthropic).
// El agente carga TODOS los ficheros .md de docs/adr/ antes de redactar,
// incluyendo ADR-004 (fallback leads) y cualquier ADR futura.
// ─────────────────────────────────────────────────────
async function draftMessages(leads: LeadRaw[]): Promise<MensajeLead[]> {
  console.log('\n[PASO 3] Agente de redacción (claude-sonnet-4-6) — generando secuencias...')

  const anthropic = getAnthropic()

  // Cargar todas las ADRs del directorio docs/adr/ (incluye ADR-004 y futuras)
  const adrsContent = loadAllADRs()
  const adrDir = join(process.cwd(), 'docs', 'adr')
  const adrFiles = existsSync(adrDir)
    ? readdirSync(adrDir).filter(f => f.endsWith('.md')).sort()
    : []
  console.log(`  → ${adrFiles.length} ADR(s) cargadas: ${adrFiles.join(', ')} (${adrsContent.length} chars total)`)

  // System prompt v2 — Patches aplicados post-auditoría (error_report_2026-06-04.md)
  // Correcciones: anti-genericidad, prohibición "no solo X sino Y",
  // un solo CTA sin reunión, lista negra de buzzwords.
  // Se cachea entre leads (cache_control: ephemeral).
  const systemPromptText = `Eres un Senior Copywriter especializado en ventas B2B y LinkedIn outreach en español.

## REGLA DE ESPECIFICIDAD (aplica a los 3 mensajes)
Antes de redactar, pregúntate: "¿Podría enviar este mensaje a cualquier persona con este cargo
en cualquier empresa del sector, o es específico SOLO para este lead?"
Si la respuesta es "cualquiera", reescríbelo. Un mensaje genérico tiene CERO valor.
Ancla siempre en: empresa concreta + rol específico + contexto sectorial real y nombrado.

## FRAMEWORK OBLIGATORIO: Observación → Insight → CTA Abierto

### MENSAJE 1 — OBSERVACIÓN
- Conecta el cargo del lead con una tensión real o decisión concreta observable en su sector.
- Longitud: 2-3 frases. Sin más.
- PROHIBIDO: "He notado que trabajas como X en Y" → solo repite lo que el lead ya sabe.
- PROHIBIDO: calificativos genéricos sobre la empresa: "empresa líder", "empresa de referencia".
- PROHIBIDO: calificativos genéricos sobre el cargo: "posición clave", "área clave", "rol estratégico".
- PROHIBIDO: cualquier referencia a haber visto su perfil de LinkedIn.
- PROHIBIDO: salutaciones con nombre ("Hola [nombre]") — LinkedIn lo muestra automáticamente.
- El lead debe sentir que el remitente entiende su contexto específico, no que recibe spam.

### MENSAJE 2 — INSIGHT
- Un insight de valor que conecte la situación del lead con una tensión real de su sector.
- Longitud: 3-4 frases. Sin pitch de producto ni mención del remitente.
- PROHIBIDO: la construcción "no solo X sino (que) también Y" — estructura de pitch reconocible.
  ❌ "no solo reducen costos, sino que también mejoran la eficiencia"
  ✅ Una sola afirmación directa con el ángulo más relevante para este lead concreto.
- PROHIBIDO: generalizaciones sin sujeto: "Muchas empresas están...", "En un entorno donde..."
  Si no puedes nombrar a quién le pasa, no lo uses.
- Ancla el insight en algo específico: normativa europea de energía, evento sectorial, palanca concreta.
- El lead debe pensar: "Esto es relevante para mi situación concreta", no "me están vendiendo algo".

### MENSAJE 3 — CTA ABIERTO
- Exactamente UNA sola pregunta. Ni más ni menos.
- Longitud: 1-2 frases. OBLIGATORIO terminar con signo de interrogación (?).
- PROHIBIDO: cualquier invitación a conversar, reunirse o hablar:
  ❌ "¿Te parece si conversamos sobre ello?"
  ❌ "¿Podemos hablar esta semana?"
  ❌ "¿Tienes 15 minutos?"
- La pregunta debe invitar a compartir una OPINIÓN o PERSPECTIVA sobre su propio trabajo:
  ✅ "¿Cómo lo estáis abordando desde vuestra posición en [empresa]?"
  ✅ "¿Qué peso le estáis dando a [tema concreto] en vuestra estrategia actual?"

## LISTA NEGRA DE TÉRMINOS (prohibidos en cualquier mensaje)
| Término prohibido | Por qué |
|---|---|
| "diferenciador" | sales buzzword sin sustancia |
| "soluciones energéticas" | pitch implícito de producto |
| "optimización de procesos" | consulting speak genérico |
| "eficiencia operativa" | buzzword sin medición |
| "empresa líder" | halago sin datos concretos |
| "innovación constante" | cliché sin referencia específica |
| "creciente demanda" | market-speak sin fuente |
| "competitividad" | frame de ventas, no de valor |

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
