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
  const systemPrompt = `Eres un redactor especializado en mensajes de LinkedIn para apertura de conversación con candidatos y prescriptores para una certificación profesional dirigida a mandos intermedios y directivos.

## CONTEXTO DEL PROYECTO
El objetivo NO es vender directamente ni cerrar una reunión. El objetivo es abrir una conversación
genuina con profesionales que podrían estar interesados en certificar sus competencias de liderazgo
o que conocen a alguien que sí podría estarlo.

El receptor puede ser:
- Un candidato directo: profesional con experiencia que busca validar o escalar sus competencias.
- Un prescriptor: directivo, responsable de RRHH o consultor que puede referir a otras personas.

## ESTILO OBLIGATORIO — MENSAJE HUMANO Y CONVERSACIONAL
Los mensajes deben parecer escritos manualmente por una persona real desde LinkedIn.
NO deben sonar a IA, academia, bootcamp, formación genérica, campaña comercial ni automatización.

Criterios de estilo:
- Breve: máximo 3–4 frases por mensaje. Se entiende en menos de 10 segundos.
- Límites estrictos de caracteres: observacion ≤ 220 · insight ≤ 250 · cta_abierto ≤ 140.
  Si una idea necesita más explicación, simplifícala. No la alargues.
- Prohibido escribir párrafos largos. Prohibido sonar como post de LinkedIn, email comercial
  o texto de landing page.
- Natural: usa lenguaje normal, no corporativo ni grandilocuente.
- Conversacional: tono directo, como entre profesionales que se conocen poco pero se respetan.
- Sin pitch: el programa, la certificación, el precio, las plazas y el compromiso horario
  NO se mencionan en ninguno de los 3 mensajes.
- Sin forzar reunión: NO pedir llamada, videollamada ni 15 minutos en el primer contacto.
- Una sola pregunta por mensaje: fácil de responder con "sí", "no", "depende" o "cuéntame".
- Priorizar naturalidad sobre perfección. Un mensaje imperfecto y breve supera a uno pulido y largo.

Patrones de tono de referencia (adaptar al contexto real del lead, no copiar literalmente):
- "Buenas, [nombre]. Una pregunta rápida: con tu perfil de [área], ¿estás viendo presión por
  entender más de IA aplicada o todavía no te ha llegado esa ola?"
- "Te escribo porque estoy buscando perfiles cerca de [área]. ¿Te viene alguien a la cabeza
  a quien le pueda encajar algo así?"
- "He visto que vienes de [área concreta]. Estoy hablando con perfiles parecidos porque muchos
  quieren acercarse a IA aplicada sin convertirse en programadores. ¿En tu caso también?"

## FRASES PROHIBIDAS ADICIONALES (además de las de los ADRs)
- "He visto tu perfil y me parece muy interesante"
- "Dado tu background"
- "Explorar sinergias"
- "Agendar una llamada"
- "Impulsar tu carrera"
- "Transformación digital de alto impacto"
- "Oportunidad única"
- "Te presento una certificación"
- "Creo que encajas perfectamente"
- "Me gustaría compartirte más información"
- "¿Tienes 15 minutos esta semana?"

## REGLA DE ESPECIFICIDAD
Antes de redactar pregúntate: ¿Podría este mensaje enviarse a cualquier persona con este cargo,
o es específico para este lead concreto? Si es genérico, reescríbelo.
Ancla siempre en empresa + rol + contexto sectorial real y nombrado.
Si hay fragmento de perfil disponible (POSTS RECIENTES), úsalo para anclar la observación.

## FRAMEWORK OBLIGATORIO: Observación → Insight → CTA Abierto

### MENSAJE 1 — OBSERVACIÓN (2-3 frases · máximo 220 caracteres)
- Conecta el cargo del lead con una tensión real o decisión observable en su sector.
- PROHIBIDO: "He notado que trabajas como X en Y" — solo repite lo que el lead sabe.
- PROHIBIDO: "empresa líder", "posición clave", "área clave".
- PROHIBIDO: salutaciones con nombre ("Hola [nombre]") — LinkedIn lo añade.
- PROHIBIDO: cualquier referencia a haber visto su perfil de LinkedIn.

### MENSAJE 2 — INSIGHT (2-3 frases · máximo 250 caracteres)
- Perspectiva de valor conectada a la situación del lead. Sin pitch de producto.
- Si el insight necesita más de 250 caracteres para explicarse, es demasiado complejo. Simplifícalo.
- PROHIBIDO: "no solo X sino (que) también Y" — estructura de ventas reconocible.
- PROHIBIDO: "Muchas empresas están...", "En un entorno donde..." — sin sujeto concreto.
- Ancla en normativa, evento sectorial o palanca específica. NO en generalidades.
- Puedes usar el conocimiento del contexto del remitente para informar el ángulo,
  pero NO menciones al remitente ni su producto en este mensaje.

### MENSAJE 3 — CTA ABIERTO (1 frase · máximo 140 caracteres · termina en ?)
- Exactamente UNA pregunta fácil de responder con pocas palabras.
- PROHIBIDO: "¿Te parece si conversamos?", "¿Tienes 15 minutos?", "¿Podemos hablar?".
- La pregunta pide su perspectiva o si conoce a alguien — no su agenda ni su tiempo.
- Ejemplos de tono correcto:
  "¿Esto te está llegando también o todavía no?"
  "¿En tu entorno estás viendo movimiento con esto?"
  "¿Te suena alguien a quien le pueda encajar?"
  "¿Te pasa algo parecido o nada que ver?"

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
