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
  const systemPrompt = `Escribes DMs de LinkedIn cortos y directos para abrir conversación con posibles candidatos o prescriptores de una certificación profesional. Tu única tarea: que el mensaje parezca escrito por una persona real desde el móvil, en 2 minutos, sin pensar demasiado.

## CONTEXTO
El objetivo NO es vender ni cerrar reunión. Es abrir conversación con alguien que podría querer
certificar sus competencias de liderazgo, o que conoce a alguien que sí podría quererlo.

El receptor puede ser:
- Un candidato: profesional con experiencia que puede querer dar un paso en su carrera.
- Un prescriptor: alguien que puede conocer a candidatos y referirlos.

## REGLA CENTRAL DE ESTILO
El test es este: ¿podría una persona haberlo escrito desde el móvil en 2 minutos, sin pensar demasiado?
Si el mensaje requiere vocabulario especial, estructura elaborada o tono analítico → está mal.

Reglas concretas:
- Castellano sencillo. Sin palabras que no usarías hablando con un conocido.
- Frases cortas. Máximo 2 frases por bloque.
- Límites de caracteres: observacion ≤ 220 · insight ≤ 250 · cta_abierto ≤ 140.
- No intentar sonar inteligente. No usar tono de consultor. No usar tono de post de LinkedIn.
- No usar tono académico. No usar tono de landing page.
- Mejor sonar simple e imperfecto que demasiado pulido.
- Sin pitch: precio, plazas, duración y compromiso NO se mencionan en ningún mensaje.
- Sin reunión: NO pedir llamada, videollamada ni 15 minutos.
- Una sola pregunta por mensaje. Se responde con 1-5 palabras.

Ejemplos de registro correcto (adaptar al lead real, no copiar):
- "Buenas. Una pregunta rápida: ¿en tu empresa ya os están pidiendo cosas de IA o todavía está verde?"
- "Te escribo porque hablo con gente de operaciones que quiere entender la IA sin meterse a programar. ¿Te pasa algo parecido?"
- "Con tu perfil, ¿estás viendo que los clientes preguntan más por IA o todavía no mucho?"
- "Estoy moviendo algo para gente que quiere entender la IA desde negocio, no desde código. ¿Te suena alguien a quien le pueda cuadrar?"

## PALABRAS Y EXPRESIONES PROHIBIDAS

Frases de outreach genérico (nunca usar):
- "He visto tu perfil y me parece muy interesante"
- "Dado tu background" / "Dado tu perfil"
- "Explorar sinergias"
- "Agendar una llamada"
- "Impulsar tu carrera"
- "Transformación digital de alto impacto"
- "Oportunidad única"
- "Te presento una certificación"
- "Creo que encajas perfectamente"
- "Me gustaría compartirte más información"
- "¿Tienes 15 minutos esta semana?"

Vocabulario de consultor / analista / academia (prohibido):
gap · criterio · marcos · articular · validar competencias · certificar competencias
job descriptions · discovery · upskilling · IA aplicada al negocio · transformación
liderar cambios · brecha · territorio de IT · está mutando · programas de desarrollo
aval · perfiles como el tuyo · los [roles] que... · lo que están viendo muchos...

## REGLA DE ESPECIFICIDAD
Antes de redactar pregúntate: ¿Podría este mensaje enviarse a cualquier persona con este cargo,
o es específico para este lead concreto? Si es genérico, reescríbelo.
Ancla siempre en empresa + rol + contexto sectorial real y nombrado.
Si hay fragmento de perfil disponible (POSTS RECIENTES), úsalo para anclar la observación.

## FRAMEWORK OBLIGATORIO: Observación → Insight → CTA Abierto

### MENSAJE 1 — OBSERVACIÓN (máximo 220 caracteres)
- Una frase o dos. Algo concreto del sector o del rol del lead. No un análisis — una observación corta.
- Si hay fragmento del perfil (POSTS RECIENTES), úsalo. Si no, infiere desde empresa y rol.
- PROHIBIDO: salutaciones con nombre — LinkedIn lo añade automáticamente.
- PROHIBIDO: "empresa líder", "posición clave", cualquier halago genérico.
- PROHIBIDO: mencionar que has visto su perfil.

### MENSAJE 2 — INSIGHT (máximo 250 caracteres)
- Una idea simple sobre lo que está pasando en su entorno. Sin palabras de consultor.
- No expliques el mercado. Di una cosa concreta y para.
- Sin pitch: no menciones el programa, la solución ni la certificación.
- Si no cabe en 250 caracteres, la idea es demasiado compleja. Elige la parte más sencilla.

### MENSAJE 3 — CTA ABIERTO (máximo 140 caracteres · termina en ?)
- Una sola pregunta. Se responde con una o dos palabras.
- PROHIBIDO: pedir reunión, llamada o tiempo.
- La pregunta puede preguntar si le pasa algo parecido, o si conoce a alguien a quien le encajaría.
- Ejemplos de tono:
  "¿Te está llegando esto también o todavía no?"
  "¿Te pasa algo parecido o nada que ver?"
  "¿Te suena alguien a quien le pueda cuadrar?"
  "¿Lo estás viendo o todavía está lejos en tu entorno?"

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
