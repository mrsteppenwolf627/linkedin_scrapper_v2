// ============================================
// V2 Writing Agent — claude-sonnet-4-6
// Motor exportable: usado por API route + CLI orchestrator
// Framework: Observación → Insight → CTA Abierto (ADRs)
// ============================================

import Anthropic from '@anthropic-ai/sdk'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// ── Tipos públicos ────────────────────────────────────
export interface LeadRawV2 {
  nombre: string
  empresa: string
  rol: string
  posts_recientes: string[]
}

export interface MensajeV2 {
  tipo: 'observacion' | 'insight' | 'cta_abierto'
  texto: string
}

export interface MensajeLeadV2 {
  lead: string
  empresa: string
  rol: string
  sales_goal: string
  mensajes: MensajeV2[]
}

// ── Carga de ADRs ─────────────────────────────────────
function loadAllADRs(): string {
  const adrDir = join(process.cwd(), 'docs', 'adr')
  if (!existsSync(adrDir)) return '(docs/adr/ no encontrado)'
  const files = readdirSync(adrDir).filter(f => f.endsWith('.md')).sort()
  if (!files.length) return '(sin ADRs)'
  return files
    .map(f => `\n${'─'.repeat(60)}\n## ${f}\n${'─'.repeat(60)}\n${readFileSync(join(adrDir, f), 'utf-8')}`)
    .join('\n')
}

// ── Motor principal ───────────────────────────────────
export async function orchestrateV2(
  leads: LeadRawV2[],
  salesGoal: string
): Promise<MensajeLeadV2[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no configurada en .env.local')
  const anthropic = new Anthropic({ apiKey })

  const adrsContent = loadAllADRs()

  // System prompt cacheado entre leads — NO incluye salesGoal (va en user prompt)
  const systemPrompt = `Eres un Senior Copywriter especializado en ventas B2B y LinkedIn outreach en español.

## REGLA DE ESPECIFICIDAD
Antes de redactar pregúntate: ¿Podría este mensaje enviarse a cualquier persona con este cargo,
o es específico para este lead concreto? Si es genérico, reescríbelo.
Ancla siempre en empresa + rol + contexto sectorial real y nombrado.

## FRAMEWORK OBLIGATORIO: Observación → Insight → CTA Abierto

### MENSAJE 1 — OBSERVACIÓN (2-3 frases)
- Conecta el cargo del lead con una tensión real o decisión observable en su sector.
- PROHIBIDO: "He notado que trabajas como X en Y" — solo repite lo que el lead sabe.
- PROHIBIDO: "empresa líder", "posición clave", "área clave".
- PROHIBIDO: salutaciones con nombre ("Hola [nombre]") — LinkedIn lo añade.
- PROHIBIDO: cualquier referencia a haber visto su perfil de LinkedIn.

### MENSAJE 2 — INSIGHT (3-4 frases)
- Perspectiva de valor conectada a la situación del lead. Sin pitch de producto.
- PROHIBIDO: "no solo X sino (que) también Y" — estructura de ventas reconocible.
- PROHIBIDO: "Muchas empresas están...", "En un entorno donde..." — sin sujeto concreto.
- Ancla en normativa, evento sectorial o palanca específica. NO en generalidades.
- Puedes usar el conocimiento del contexto del remitente para informar el ángulo,
  pero NO menciones al remitente ni su producto en este mensaje.

### MENSAJE 3 — CTA ABIERTO (1-2 frases, termina en ?)
- Exactamente UNA pregunta que invite al lead a compartir OPINIÓN o PERSPECTIVA.
- PROHIBIDO: "¿Te parece si conversamos?", "¿Tienes 15 minutos?", "¿Podemos hablar?".
- La pregunta pide su expertise, no su agenda.

## LISTA NEGRA
diferenciador · soluciones energéticas · optimización de procesos · eficiencia operativa
empresa líder · innovación constante · creciente demanda · competitividad

## DECISIONES ARQUITECTÓNICAS DE MARCA (ADRs)
${adrsContent}

## FORMATO — CRÍTICO
Tu respuesta debe ser ÚNICAMENTE el objeto JSON. Sin markdown, sin bloques de código.
El primer carácter debe ser { y el último }.
{"observacion": "<texto>", "insight": "<texto>", "cta_abierto": "<texto>"}`

  const results: MensajeLeadV2[] = []

  for (const lead of leads) {
    const userPrompt = `CONTEXTO DEL REMITENTE (úsalo solo para informar el insight, no para mencionar en los mensajes 1-2):
Propuesta de valor que ofrece el remitente: ${salesGoal || 'No especificada'}

LEAD A PROSPECTAR:
EMPRESA: ${lead.empresa || '(no especificada)'}
ROL: ${lead.rol || '(no especificado)'}
POSTS RECIENTES: ${lead.posts_recientes.length > 0 ? lead.posts_recientes.join(' | ') : 'No disponibles — infiere desde rol y empresa'}

INSTRUCCIÓN: Redacta la secuencia Observación → Insight → CTA Abierto.
El nombre del lead NO debe aparecer en ningún mensaje.
El producto/servicio del remitente NO debe mencionarse en mensajes 1 ni 2.`

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userPrompt }],
    })

    const message = await stream.finalMessage()
    const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    const raw = (textBlock?.text ?? '{}')
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()

    const drafted = JSON.parse(raw) as { observacion: string; insight: string; cta_abierto: string }

    results.push({
      lead: lead.nombre,
      empresa: lead.empresa,
      rol: lead.rol,
      sales_goal: salesGoal,
      mensajes: [
        { tipo: 'observacion', texto: drafted.observacion },
        { tipo: 'insight',     texto: drafted.insight },
        { tipo: 'cta_abierto', texto: drafted.cta_abierto },
      ],
    })
  }

  return results
}
