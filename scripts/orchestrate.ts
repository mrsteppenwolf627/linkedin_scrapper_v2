// ============================================
// Orquestador CLI: Scraper → leads_raw.json → mensajes_listos.json
// Ejecutar: tsx --tsconfig tsconfig.json scripts/orchestrate.ts
//
// El motor de IA vive en src/lib/agent_v2.ts (importable también
// desde API routes Next.js vía @/lib/agent_v2).
// Este script es el runner standalone para desarrollo y CI.
// ============================================

import { config } from 'dotenv'
import { resolve, join } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { orchestrateV2, type LeadRawV2 } from '@/lib/agent_v2'

// Re-exportar para que scripts externos puedan importar desde aquí
export { orchestrateV2 } from '@/lib/agent_v2'
export type { LeadRawV2, MensajeLeadV2, MensajeV2 } from '@/lib/agent_v2'

// ── Tipos locales ─────────────────────────────────────
// Alias para compatibilidad con código existente en este script
type LeadRaw = LeadRawV2

interface MensajeLead {
  lead: string
  empresa: string
  rol: string
  sales_goal: string
  mensajes: {
    tipo: 'observacion' | 'insight' | 'cta_abierto'
    texto: string
  }[]
}

// ── Cliente Supabase ──────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

// ── Seed leads (ADR-004: fallback cuando Supabase no accesible) ──
const SCRAPER_SEED_LEADS: LeadRaw[] = [
  { nombre: 'Carlos Mendoza',   empresa: 'Iberdrola', posts_recientes: [], rol: 'Senior Energy Consultant' },
  { nombre: 'Laura Sánchez',    empresa: 'Endesa',    posts_recientes: [], rol: 'Directora de Desarrollo de Negocio' },
  { nombre: 'Alejandro Torres', empresa: 'Repsol',    posts_recientes: [], rol: 'Head of Renewable Energy Projects' },
]

// ─────────────────────────────────────────────────────
// PASO 1 — Módulo Scraper (Supabase con fallback ADR-004)
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
      nombre:          c.name ?? 'Desconocido',
      empresa:         c.company ?? '',
      posts_recientes: [],
      rol:             c.job_title ?? '',
    }))
    console.log(`  ✅ ${leads.length} leads recuperados de Supabase`)
    return leads
  } catch (err) {
    console.warn(`  ⚠️  Supabase no accesible (${(err as Error).message}). Usando seed leads (ADR-004).`)
    console.log(`  ✅ ${SCRAPER_SEED_LEADS.length} leads cargados desde caché`)
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
      if (!(key in lead)) throw new Error(`leads_raw.json inválido: campo '${key}' ausente`)
    }
    if (!Array.isArray(lead.posts_recientes)) throw new Error('posts_recientes no es array')
  }
  console.log(`\n[PASO 2] leads_raw.json verificado — ${parsed.length} leads, esquema válido ✅`)
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
// MAIN — Runner CLI standalone
// ─────────────────────────────────────────────────────
async function main() {
  // sales_goal para modo CLI: puede pasarse como argumento o usar placeholder
  const salesGoal = process.argv.slice(2).join(' ') || 'Demo CLI — sin propuesta de valor definida'

  console.log('════════════════════════════════════════════')
  console.log('  ORQUESTADOR: LinkedIn Scraper → Mensajes')
  console.log('  Motor: claude-sonnet-4-6 (src/lib/agent_v2)')
  console.log(`  Sales goal: ${salesGoal.slice(0, 60)}${salesGoal.length > 60 ? '...' : ''}`)
  console.log('════════════════════════════════════════════')

  try {
    // Paso 1: Scraper
    const leads = await runScraper()

    // Paso 2: Verificar leads_raw.json
    writeAndVerifyLeadsRaw(leads)

    // Paso 3: Motor V2 (importado desde src/lib/agent_v2.ts)
    console.log('\n[PASO 3] Agente de redacción (claude-sonnet-4-6)...')
    const mensajes = await orchestrateV2(leads, salesGoal)
    console.log(`  ✅ ${mensajes.length} secuencias generadas`)

    // Paso 4: Guardar
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
