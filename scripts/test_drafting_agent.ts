// ============================================
// Test de Integración: Agente de Redacción
// Verifica tono profesional, estructura y coherencia con ADRs.md
//
// Modo 1 (defecto): valida mensajes_listos.json ya generado
//   tsx scripts/test_drafting_agent.ts
//
// Modo 2 (live): regenera mensajes con la API y luego valida
//   tsx scripts/test_drafting_agent.ts --live
// ============================================

import { config } from 'dotenv'
import { resolve, join } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import Anthropic from '@anthropic-ai/sdk'
import { existsSync, readFileSync, writeFileSync } from 'fs'

// ── Tipos ─────────────────────────────────────────────
interface Mensaje {
  tipo: 'observacion' | 'insight' | 'cta_abierto'
  texto: string
}

interface MensajeLead {
  lead: string
  empresa: string
  rol: string
  mensajes: Mensaje[]
}

// ── Resultado de test ──────────────────────────────────
interface TestResult {
  name: string
  passed: boolean
  detail?: string
}

// ── Constantes de validación ──────────────────────────
// Frases prohibidas por ADR-004
const FORBIDDEN_PHRASES = [
  'vi tu perfil',
  'me llamó la atención tu perfil',
  'he revisado tu linkedin',
  'revisé tu perfil',
  'tu perfil',
  'espero que este mensaje te encuentre bien',
  'espero que estés bien',
  'nuestra solución',
  'nosotros podemos ayudarte',
  'te ofrecemos',
  'tienes 15 minutos',
  'podemos agendar',
  'quedo a tu disposición',
  'un saludo cordial',
  'saludos cordiales',
  'en el entorno actual',
  'el mercado está cambiando',
  'en estos tiempos',
  'solución innovadora',
  'valor añadido',
]

// Indicadores de tono no profesional / robótico
const ROBOTIC_PATTERNS = [
  /^hola,?\s/i,          // Salutación genérica al inicio (LinkedIn la añade)
  /^estimado\/a/i,       // Demasiado formal / robótico
  /^buenos días/i,       // Horario-dependiente
  /^buenas tardes/i,
  /📊|💡|🚀|✅|👋/,     // Emojis de ventas robóticas
]

// ── Generador de mensajes (modo --live) ───────────────
async function generateLiveMessages(): Promise<MensajeLead[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada. Añádela a .env.local')

  const anthropic = new Anthropic({ apiKey })

  const adrsPath = join(process.cwd(), 'docs', 'adr', 'ADRs.md')
  const adrsContent = existsSync(adrsPath) ? readFileSync(adrsPath, 'utf-8') : ''

  const systemPrompt = `Eres un Senior Copywriter especializado en ventas B2B y LinkedIn outreach en español.

## FRAMEWORK OBLIGATORIO: Observación → Insight → CTA Abierto

### MENSAJE 1 — OBSERVACIÓN
- 2-3 frases basadas en dato concreto del lead (rol, empresa, sector).
- Sin mencionar haber visto su perfil. Sin halagos genéricos.

### MENSAJE 2 — INSIGHT
- 3-4 frases con perspectiva de valor sin pitch de producto.
- Conecta la situación del lead con tensiones reales del sector.

### MENSAJE 3 — CTA ABIERTO
- 1-2 frases. Pregunta abierta sobre opinión/perspectiva del lead.
- Obligatorio terminar con signo de interrogación (?).
- No pedir reuniones ni tiempo concreto.

## DECISIONES DE MARCA (ADRs)
${adrsContent}

## FORMATO
JSON válido exclusivamente: {"observacion": "...", "insight": "...", "cta_abierto": "..."}`

  const testLeads = [
    { nombre: 'María García', empresa: 'Acciona Energía', rol: 'Directora de Sostenibilidad', posts_recientes: [] },
    { nombre: 'Pablo Ruiz', empresa: 'Naturgy', rol: 'Head of Digital Transformation', posts_recientes: [] },
  ]

  const results: MensajeLead[] = []

  for (const lead of testLeads) {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `Lead: EMPRESA: ${lead.empresa} | ROL: ${lead.rol}. El nombre no debe aparecer en los mensajes. Genera la secuencia.`
      }],
    })

    const message = await stream.finalMessage()
    const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    const drafted = JSON.parse(textBlock?.text ?? '{}') as {
      observacion: string; insight: string; cta_abierto: string
    }

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

  // Guardar para inspección
  writeFileSync(join(process.cwd(), 'mensajes_test_live.json'), JSON.stringify(results, null, 2), 'utf-8')
  return results
}

// ── Validaciones individuales ──────────────────────────

function checkJsonStructure(lead: MensajeLead): TestResult[] {
  return [
    {
      name: `[${lead.lead}] JSON: campos raíz presentes`,
      passed: Boolean(lead.lead && lead.empresa && lead.rol && Array.isArray(lead.mensajes)),
    },
    {
      name: `[${lead.lead}] JSON: exactamente 3 mensajes`,
      passed: lead.mensajes.length === 3,
      detail: `Encontrados: ${lead.mensajes.length}`,
    },
    {
      name: `[${lead.lead}] JSON: tipos correctos (observacion, insight, cta_abierto)`,
      passed:
        lead.mensajes[0]?.tipo === 'observacion' &&
        lead.mensajes[1]?.tipo === 'insight' &&
        lead.mensajes[2]?.tipo === 'cta_abierto',
      detail: lead.mensajes.map(m => m.tipo).join(' → '),
    },
  ]
}

function checkMessageNotEmpty(lead: MensajeLead): TestResult[] {
  return lead.mensajes.map(m => ({
    name: `[${lead.lead}] Contenido: mensaje '${m.tipo}' no está vacío`,
    passed: m.texto.trim().length > 0,
  }))
}

function checkMessageLength(lead: MensajeLead): TestResult[] {
  const limits: Record<string, { min: number; max: number }> = {
    observacion: { min: 40,  max: 500 },
    insight:     { min: 80,  max: 700 },
    cta_abierto: { min: 20,  max: 300 },
  }
  return lead.mensajes.map(m => {
    const { min, max } = limits[m.tipo] ?? { min: 0, max: 9999 }
    const len = m.texto.trim().length
    return {
      name: `[${lead.lead}] Longitud: '${m.tipo}' dentro de rango (${min}-${max} chars)`,
      passed: len >= min && len <= max,
      detail: `${len} chars`,
    }
  })
}

function checkForbiddenPhrases(lead: MensajeLead): TestResult[] {
  return lead.mensajes.map(m => {
    const lower = m.texto.toLowerCase()
    const hit = FORBIDDEN_PHRASES.find(p => lower.includes(p.toLowerCase()))
    return {
      name: `[${lead.lead}] Tono: '${m.tipo}' sin frases prohibidas (ADR-004)`,
      passed: !hit,
      detail: hit ? `Frase prohibida encontrada: "${hit}"` : undefined,
    }
  })
}

function checkRoboticPatterns(lead: MensajeLead): TestResult[] {
  return lead.mensajes.map(m => {
    const hit = ROBOTIC_PATTERNS.find(rx => rx.test(m.texto))
    return {
      name: `[${lead.lead}] Tono: '${m.tipo}' sin patrones robóticos`,
      passed: !hit,
      detail: hit ? `Patrón detectado: ${hit.toString()}` : undefined,
    }
  })
}

function checkCtaEndsWithQuestion(lead: MensajeLead): TestResult {
  const cta = lead.mensajes.find(m => m.tipo === 'cta_abierto')
  return {
    name: `[${lead.lead}] CTA: termina con signo de interrogación (ADR-004)`,
    passed: Boolean(cta?.texto.trim().endsWith('?')),
    detail: cta ? `Último char: "${cta.texto.trim().slice(-1)}"` : 'CTA no encontrado',
  }
}

function checkLeadNameAbsent(lead: MensajeLead): TestResult[] {
  // El nombre no debe aparecer en los mensajes (LinkedIn lo añade; ADR-005)
  const firstName = lead.lead.split(' ')[0]
  return lead.mensajes.map(m => ({
    name: `[${lead.lead}] Marca: '${m.tipo}' no contiene el nombre del lead (ADR-005)`,
    passed: !m.texto.includes(firstName),
    detail: m.texto.includes(firstName) ? `Nombre "${firstName}" encontrado en el texto` : undefined,
  }))
}

function checkNoProductPitchInObservacion(lead: MensajeLead): TestResult {
  const obs = lead.mensajes.find(m => m.tipo === 'observacion')
  const pitchWords = ['solución', 'producto', 'servicio', 'plataforma', 'herramienta', 'ayudamos']
  const lower = obs?.texto.toLowerCase() ?? ''
  const hit = pitchWords.find(w => lower.includes(w))
  return {
    name: `[${lead.lead}] Contenido: observación sin pitch implícito`,
    passed: !hit,
    detail: hit ? `Palabra de pitch detectada: "${hit}"` : undefined,
  }
}

// ── Runner ─────────────────────────────────────────────
function runAllChecks(data: MensajeLead[]): void {
  const allResults: TestResult[] = []

  for (const lead of data) {
    allResults.push(
      ...checkJsonStructure(lead),
      ...checkMessageNotEmpty(lead),
      ...checkMessageLength(lead),
      ...checkForbiddenPhrases(lead),
      ...checkRoboticPatterns(lead),
      checkCtaEndsWithQuestion(lead),
      ...checkLeadNameAbsent(lead),
      checkNoProductPitchInObservacion(lead),
    )
  }

  // ── Reporte ───────────────────────────────────────────
  const passed = allResults.filter(r => r.passed)
  const failed = allResults.filter(r => !r.passed)

  console.log('\n══════════════════════════════════════════════════')
  console.log('  TEST DE INTEGRACIÓN — AGENTE DE REDACCIÓN')
  console.log('══════════════════════════════════════════════════')
  console.log(`\n  Leads evaluados: ${data.length}`)
  console.log(`  Checks totales:  ${allResults.length}`)
  console.log(`  Pasados:         ${passed.length}`)
  console.log(`  Fallados:        ${failed.length}`)

  if (failed.length > 0) {
    console.log('\n── CHECKS FALLADOS ──────────────────────────────')
    for (const r of failed) {
      console.log(`  ❌ ${r.name}`)
      if (r.detail) console.log(`     → ${r.detail}`)
    }
  }

  console.log('\n── TODOS LOS CHECKS ─────────────────────────────')
  for (const r of allResults) {
    const icon = r.passed ? '✅' : '❌'
    console.log(`  ${icon} ${r.name}`)
  }

  console.log('\n══════════════════════════════════════════════════')
  if (failed.length === 0) {
    console.log(`  RESULTADO: ${allResults.length}/${allResults.length} — TONO Y ESTRUCTURA VÁLIDOS ✅`)
  } else {
    console.log(`  RESULTADO: ${passed.length}/${allResults.length} — ${failed.length} CHECK(S) FALLADO(S) ❌`)
  }
  console.log('══════════════════════════════════════════════════\n')

  process.exit(failed.length > 0 ? 1 : 0)
}

// ── MAIN ──────────────────────────────────────────────
async function main() {
  const isLive = process.argv.includes('--live')

  if (isLive) {
    console.log('\n[MODO LIVE] Generando mensajes frescos con claude-sonnet-4-6...')
    const data = await generateLiveMessages()
    console.log(`  ✅ ${data.length} leads generados → mensajes_test_live.json`)
    runAllChecks(data)
    return
  }

  // Modo defecto: validar mensajes_listos.json existente
  const mensajesPath = join(process.cwd(), 'mensajes_listos.json')
  if (!existsSync(mensajesPath)) {
    console.error('❌ mensajes_listos.json no encontrado. Ejecuta primero el orquestador:')
    console.error('   tsx --tsconfig tsconfig.json scripts/orchestrate.ts')
    process.exit(1)
  }

  const data: MensajeLead[] = JSON.parse(readFileSync(mensajesPath, 'utf-8'))
  console.log(`\n[MODO ESTÁTICO] Validando mensajes_listos.json (${data.length} leads)...`)
  runAllChecks(data)
}

main().catch(err => {
  console.error('[ERROR FATAL]', err)
  process.exit(1)
})
