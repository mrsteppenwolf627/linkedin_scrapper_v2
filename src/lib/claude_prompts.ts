// ============================================
// LinkedIn Scraper V1 - 4 Prompts AI (OpenAI)
// ============================================
// Prompts: parse_snippet | validate_contact | check_duplicate | generate_query

import OpenAI from 'openai'
import type {
  ParsedContact,
  ValidatedContact,
  DuplicateCheckResult,
  SearchFilters,
  LeadInput,
  LeadProfile,
  HumanizedMessage,
  MessageDraft,
  MessageStrategy,
  MessageSequenceMeta,
  GenerateMessagesResponse,
  TokenUsage,
  LatamCountry,
} from '@/types'

// gpt-4o-mini pricing (USD per token, April 2026 reference)
const COST_INPUT_PER_TOKEN  = 0.15  / 1_000_000
const COST_OUTPUT_PER_TOKEN = 0.60  / 1_000_000

function calcUsage(
  prompt_tokens: number,
  completion_tokens: number
): TokenUsage {
  return {
    prompt_tokens,
    completion_tokens,
    total_tokens: prompt_tokens + completion_tokens,
    estimated_cost_usd:
      prompt_tokens * COST_INPUT_PER_TOKEN +
      completion_tokens * COST_OUTPUT_PER_TOKEN,
  }
}

// Singleton del cliente OpenAI
let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY not set in environment')
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

// Modelo para parsing/validación/enriquecimiento/humanización (rápido y barato)
const MODEL = 'gpt-4o-mini'
// Modelo para generación de mensajes (calidad máxima — upgrade a gpt-4o si es necesario)
const MODEL_MESSAGES = 'gpt-4o-mini'

// ── Confidence normalizer ────────────────────────────────────────────────────
// OpenAI sometimes returns confidence as "90%", 90, "0.9", or 0.9.
// This function always produces a float in [0, 1], with 0.85 as fallback.
const CONFIDENCE_FALLBACK = 0.85

function normalizeConfidence(raw: unknown): number {
  if (raw === null || raw === undefined) return CONFIDENCE_FALLBACK

  let n: number

  if (typeof raw === 'string') {
    const cleaned = raw.trim()
    // "90%" → parse as 90 then divide
    n = cleaned.endsWith('%')
      ? parseFloat(cleaned)          // gives 90
      : parseFloat(cleaned)          // gives 0.9 or 90
    if (isNaN(n)) return CONFIDENCE_FALLBACK
    // If the raw string had a % sign, it was a 0-100 value
    if (cleaned.endsWith('%')) n = n / 100
    // If it's still >1 it was on a 0-100 scale without the % sign
    else if (n > 1) n = n / 100
  } else if (typeof raw === 'number') {
    n = raw > 1 ? raw / 100 : raw
  } else {
    return CONFIDENCE_FALLBACK
  }

  return isNaN(n) ? CONFIDENCE_FALLBACK : Math.min(1, Math.max(0, n))
}

// ============================================
// PROMPT 1: parse_linkedin_snippet_v1
// Extrae datos estructurados del snippet de Google
// ============================================

export async function parseLinkedInSnippet(
  snippet: string,
  linkedinUrl: string
): Promise<ParsedContact> {
  const openai = getOpenAI()

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 400,
    response_format: { type: 'json_object' }, // Garantiza JSON válido sin regex
    messages: [
      {
        role: 'system',
        content:
          'Eres un extractor experto de datos de perfiles de LinkedIn desde snippets de Google Search. Siempre respondes con JSON válido.',
      },
      {
        role: 'user',
        content: `Extrae los datos del siguiente snippet y devuelve un JSON con esta estructura exacta:
{
  "nombre": "nombre completo o null",
  "titulo": "job title/puesto actual o null",
  "empresa": "nombre de la empresa actual o null",
  "ubicacion": "ciudad/país o null",
  "anos_experiencia": número entero o null,
  "palabras_clave_encontradas": ["keyword1", "keyword2"],
  "score_confianza": número entre 0.0 y 1.0,
  "es_valido": true o false,
  "notas": "observación en una frase"
}

SNIPPET: ${snippet}
URL LINKEDIN: ${linkedinUrl}

Reglas:
- Si un dato no está claro → null. NUNCA inventar.
- score_confianza: 1.0 = todos los campos claros. Reduce 0.1 por cada campo null/ambiguo.
- es_valido = false si: falta nombre, snippet es spam, o URL no es linkedin.com/in/
- palabras_clave_encontradas: solo las que aparecen literalmente en el snippet.`,
      },
    ],
  })

  const text = response.choices[0].message.content ?? '{}'
  return JSON.parse(text) as ParsedContact
}

// ============================================
// PROMPT 2: validate_contact_v1
// Valida que el contacto cumple los filtros de búsqueda
// ============================================

export async function validateContact(
  contact: ParsedContact,
  filters: SearchFilters,
  rawText?: string  // Texto original completo (title + snippet) para mejor matching
): Promise<ValidatedContact> {
  const openai = getOpenAI()

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 300,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Eres un validador de contactos de LinkedIn. Evalúas si un perfil cumple los criterios de búsqueda. Siempre respondes con JSON válido.',
      },
      {
        role: 'user',
        content: `Valida si este contacto cumple los criterios y devuelve JSON:
{
  "is_valid": true o false,
  "razones_rechazo": ["razón1"],
  "score_cumplimiento": número entre 0.0 y 1.0,
  "notas": "explicación breve"
}

DATOS EXTRAÍDOS: ${JSON.stringify(contact)}
${rawText ? `TEXTO COMPLETO DEL PERFIL: "${rawText}"` : ''}

FILTROS:
- Puesto: ${filters.jobTitle}
- Experiencia: ${filters.experience}
- Sector: ${filters.industry}
- Ubicación: ${filters.location}

Criterios para is_valid = true:
1. es_valido del contacto es true
2. El título del contacto o su snippet tiene relación semántica clara con el puesto "${filters.jobTitle}"
3. La experiencia del contacto encaja con el criterio "${filters.experience}".
4. El sector "${filters.industry}" tiene relación semántica con el perfil
5. Ubicación: solo rechazar si la ubicación del contacto es explícita Y claramente fuera de "${filters.location}". Si es ambiguo → NO rechazar.

score_cumplimiento: 0.25 por criterio cumplido.`,
      },
    ],
  })

  const text = response.choices[0].message.content ?? '{}'
  const validation = JSON.parse(text) as {
    is_valid: boolean
    razones_rechazo: string[]
    score_cumplimiento: number
    notas: string
  }

  return { ...contact, ...validation }
}

// ============================================
// PROMPT 3: check_duplicate_v1
// Deduplicación inteligente: ¿son la misma persona?
// Solo se llama cuando hay candidatos similares por nombre
// ============================================

export async function checkDuplicateWithClaude(
  newContact: { nombre: string | null; linkedin_url: string; email?: string | null },
  existingContact: { name: string; linkedin_url: string; email?: string | null }
): Promise<DuplicateCheckResult> {
  const openai = getOpenAI()

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 150,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Determinas si dos contactos de LinkedIn son la misma persona. Respondes siempre con JSON válido.',
      },
      {
        role: 'user',
        content: `¿Son la misma persona? Devuelve JSON:
{
  "is_duplicate": true o false,
  "confianza": número entre 0.0 y 1.0,
  "razon": "explicación en una frase"
}

NUEVO: nombre="${newContact.nombre}", url="${newContact.linkedin_url}", email="${newContact.email ?? 'n/a'}"
EXISTENTE: nombre="${existingContact.name}", url="${existingContact.linkedin_url}", email="${existingContact.email ?? 'n/a'}"

Criterios:
- Email exacto igual → confianza 1.0
- URL normalizada igual → confianza 0.95
- Nombre muy similar + misma empresa → confianza 0.80
- Solo nombre parecido → confianza ≤ 0.50

Marcar duplicado solo si confianza >= 0.75.`,
      },
    ],
  })

  const text = response.choices[0].message.content ?? '{}'
  const result = JSON.parse(text) as {
    is_duplicate: boolean
    confianza: number
    razon: string
  }

  return {
    isDuplicate: result.is_duplicate,
    duplicateConfidence: result.confianza,
  }
}

// ============================================
// PROMPT 4: generate_google_query_v1
// Genera una query de Google óptima para LinkedIn
// ============================================

export async function generateGoogleQuery(filters: SearchFilters): Promise<string> {
  const openai = getOpenAI()

  // Este prompt devuelve texto plano (la query), no JSON
  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 150,
    messages: [
      {
        role: 'system',
        content:
          'Generas queries de Google efectivas para encontrar perfiles de LinkedIn. Respondes SOLO con la query limpia, sin bloques de código ni explicaciones.',
      },
      {
        role: 'user',
        content: `Crea una búsqueda de Google para encontrar estos perfiles en LinkedIn:
- Puesto: ${filters.jobTitle}
- Sector: ${filters.industry}
- Ubicación: ${filters.location}

Reglas CRÍTICAS:
1. Empieza SIEMPRE con el operador: site:linkedin.com/in/
2. Ignora completamente los años de experiencia para esta query (se filtrarán después).
3. Incluye solo el puesto, el sector y la localización.
4. Usa comillas para términos compuestos si es necesario.
5. NO uses el operador intitle.

Ejemplo de salida: site:linkedin.com/in/ "Director de Marketing" "Salud" Madrid`,
      },
    ],
  })

  const text = response.choices[0].message.content ?? ''

  return text.trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\s+/g, ' ');
}

// ============================================
// extractTriggerAndVoice
// Función standalone: extrae el trigger real + voz del prospect.
// Más ligera que enrichLeadProfile (solo 2 campos, ~200 tokens).
// Llamar explícitamente cuando se quiera visibilidad en la pipeline
// o cuando solo se necesiten estos dos campos sin el enriquecimiento completo.
// ============================================

export async function extractTriggerAndVoice(
  name: string,
  title: string,
  company: string,
  industry: string,
  snippet?: string
): Promise<{ trigger: string; voice_of_customer: string[] }> {
  const openai = getOpenAI()

  const snippetBlock = snippet?.trim()
    ? `\nSNIPPET DEL PERFIL:\n"${snippet}"`
    : ''

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 200,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Extraes señales de outreach de perfiles LinkedIn. Buscas eventos REALES que justifiquen contactar a esta persona AHORA, y las palabras exactas que usa para describir su trabajo. Responde siempre con JSON válido.`,
      },
      {
        role: 'user',
        content: `Analiza este perfil y extrae trigger y voz del prospect.

PERFIL:
- Nombre: ${name}
- Título: ${title}
- Empresa: ${company}
- Sector: ${industry}${snippetBlock}

Devuelve exactamente este JSON:
{
  "trigger": "Evento REAL y ESPECÍFICO del perfil/snippet que justifica contactar AHORA. Ej: 'Cambió de empresa hace 3 meses', 'Publicó sobre X problema', 'Empresa contrató en Y área'. Si no hay evidencia concreta → 'Sin trigger identificado'.",
  "voice_of_customer": ["frase o término exacto del snippet", "otro término suyo", "keyword de su sector"]
}

Reglas trigger: ESPECÍFICO > GENÉRICO ("Contrataron 3 DevOps" > "empresa en crecimiento"). Solo usa lo visible en el snippet.
Reglas voice: palabras TEXTUALES del snippet, no sinónimos. Máx 5. Si no hay snippet, usa términos estándar del sector + título.`,
      },
    ],
  })

  const text = response.choices[0].message.content ?? '{}'
  const result = JSON.parse(text) as { trigger?: string; voice_of_customer?: string[] }
  return {
    trigger: result.trigger ?? 'Sin trigger identificado',
    voice_of_customer: result.voice_of_customer ?? [],
  }
}

// ============================================
// PROMPT A: enrich_lead_profile_v1
// Fase 1: Extrae insights de venta del perfil del lead
// ============================================

export async function enrichLeadProfile(
  name: string,
  title: string,
  company: string,
  industry: string,
  location: string,
  profileSnippet?: string
): Promise<LeadProfile> {
  const openai = getOpenAI()

  const snippetBlock = profileSnippet?.trim()
    ? `\nSNIPPET / TEXTO DEL PERFIL:\n"${profileSnippet}"`
    : ''

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 600,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Eres un analista de ventas B2B senior. Analizas perfiles de LinkedIn para extraer insights accionables que ayuden a personalizar mensajes de cold outreach. Eres específico, no genérico. Piensas como un vendedor de alto rendimiento: qué duele, qué motiva, qué presupuesto manejan. Responde siempre con JSON válido.`,
      },
      {
        role: 'user',
        content: `Analiza este perfil y devuelve insights de venta:

PERFIL:
- Nombre: ${name}
- Título: ${title}
- Empresa: ${company}
- Sector: ${industry}
- Ubicación: ${location}${snippetBlock}

Devuelve exactamente este JSON:
{
  "likely_pain_points": ["pain1", "pain2", "pain3"],
  "decision_maker_level": "executive" | "manager" | "specialist",
  "likely_priorities": ["priority1", "priority2"],
  "company_size": "small" | "mid" | "enterprise",
  "sector_keywords": ["keyword1", "keyword2", "keyword3"],
  "role_psychology": "Una frase describiendo qué motiva y presiona a esta persona en su rol",
  "trigger": "Evento o señal REAL que justifica contactar a esta persona AHORA (cambio de rol, contratación visible, expansión, publicación reciente, etc.). Si no hay evidencia real, escribe 'Sin trigger identificado'.",
  "voice_of_customer": ["palabra1", "palabra2", "palabra3"]
}

Reglas:
- Basa TODO en datos reales del perfil/snippet. NUNCA inventar.
- decision_maker_level: "executive" si C-level/VP/Director; "manager" si lidera equipo; "specialist" si IC
- company_size: "enterprise" multinacional/gran empresa; "mid" mediana; "small" startup/pyme
- sector_keywords: términos técnicos/negocio propios del sector
- role_psychology: qué le quita el sueño y qué quiere conseguir
- trigger: el EVENTO ESPECÍFICO, no inferencia genérica. "Contrataron 3 ingenieros" > "la empresa está creciendo"
- voice_of_customer: palabras/frases TEXTUALES del snippet que describen su rol o problemas. Si no hay snippet, usa términos estándar de su industria/título`,
      },
    ],
  })

  const text = response.choices[0].message.content ?? '{}'
  return JSON.parse(text) as LeadProfile
}

// ============================================
// PROMPT B: generate_linkedin_messages_v4
// Fase 2: Generación con estrategia de vendedor experto + anti-IA
// ============================================

function getPronounInstruction(country?: LatamCountry | string): string {
  switch ((country ?? '').toUpperCase()) {
    case 'AR': return 'vos (tuteo rioplatense; en B2B formal también se acepta usted)'
    case 'CO':
    case 'CL':
    case 'PE': return 'usted'
    case 'BR': return 'você'
    default:   return 'tú' // ES, MX, default
  }
}

export async function generateLinkedInMessages(
  lead: LeadInput,
  profile?: LeadProfile
): Promise<GenerateMessagesResponse> {
  const openai = getOpenAI()

  const product = lead.your_product?.trim() || 'Tu Producto/Servicio'
  const pronoun = getPronounInstruction(lead.country)

  const trigger = profile?.trigger && profile.trigger !== 'Sin trigger identificado'
    ? profile.trigger
    : 'Sin trigger específico identificado'

  const voiceOfCustomer = profile?.voice_of_customer?.length
    ? profile.voice_of_customer.join('", "')
    : null

  const profileSection = profile
    ? `
PERFIL ENRIQUECIDO:
- Pain points: ${profile.likely_pain_points.join(', ')}
- Nivel de decisión: ${profile.decision_maker_level}
- Prioridades: ${profile.likely_priorities.join(', ')}
- Tamaño empresa: ${profile.company_size}
- Keywords del sector: ${profile.sector_keywords.join(', ')}
- Psicología del rol: ${profile.role_psychology}`
    : ''

  const response = await openai.chat.completions.create({
    model: MODEL_MESSAGES,
    max_tokens: 1800,
    temperature: 0.9,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Eres un vendedor B2B que hace investigación real antes de escribir. Tus mensajes suenan como alguien que VENDE, no como alguien que ENUNCIA.

DIFERENCIA CLAVE:
- Vendedor real: "Vi que contrataron 3 DevOps el mes pasado. ¿Escalando infraestructura?"
- Chatbot que enuncia: "Organizations prioritize infrastructure scalability in today's competitive landscape."

REGLA DE ORO: Si no lo dirías tomando un café con alguien, no lo escribas en el mensaje.

RESTRICCIONES ABSOLUTAS:
1. Máx 280 caracteres por mensaje
2. Pronombre: ${pronoun}
3. Sin emojis (máx 1 en toda la secuencia si encaja orgánicamente)
4. Sin listas, sin markdown, sin asteriscos
5. Sin exclamaciones innecesarias (máx 1 en toda la secuencia)

RESTRICCIONES ESTRUCTURALES (más importantes que el vocabulario):
- VARIACIÓN DE LONGITUD: alterna frases cortas (5-10 palabras) con largas (18-25 palabras). Patrón ideal: corta → larga → corta → corta → larga
- VARIACIÓN SINTÁCTICA: no iniciar dos oraciones consecutivas con el mismo patrón
- SIN TRIADAS: mata "rápido, confiable y escalable" y cualquier lista de 3 adjetivos
- SIN PATRONES IA DETECTADOS:
  • "No X, sino Y" / "Not X but Y"
  • "En el panorama actual..." / "En la era digital..." / "Hoy más que nunca..."
  • Conclusiones explícitas: "En resumen", "En conclusión", "En definitiva"
  • Anáfora: iniciar 2+ oraciones seguidas con la misma estructura
  • "Espero que estés bien", "Quería contactarte", "Como experto en"
- CIERRE: preguntas abiertas > CTAs cerradas. "¿Tiene sentido?" o "¿Vale la pena 10 min?" > "Avísame si te interesa"

ESTRATEGIA DE SECUENCIA:
[1 - hook]: Trigger real del prospect + pregunta que apunta al dolor. Sin CTA. Genera solo curiosidad.
[2 - social_proof]: Observación DIFERENTE del perfil + caso específico CON MÉTRICA CONCRETA en formato "[Sector] redujo [métrica] de X a Y en Z semanas" (inventa números plausibles para el sector) + pregunta de curiosidad. CTA ligero: "¿10 min?" o "¿Lo ves así también?"
[3 - urgency]: Elige UNA de estas aperturas (varía entre leads, no siempre la misma): "Voy a ser directo:", "Te digo la realidad:", "Sin filtros:", "La verdad es que:" — luego beneficio claro + cierre de autonomía sin presión.

Responde ÚNICAMENTE con JSON válido.`,
      },
      {
        role: 'user',
        content: `Genera 3 mensajes LinkedIn para este lead.

DATOS DEL LEAD:
- Nombre: ${lead.name}
- Título: ${lead.title || 'No especificado'}
- Empresa: ${lead.company || 'No especificada'}
- Sector: ${lead.industry || 'No especificado'}
- Ubicación: ${lead.location || 'No especificada'}${profileSection}

TRIGGER / EVENTO REAL: ${trigger}
← Úsalo como gancho concreto. No lo ignores ni lo generalices.

${voiceOfCustomer ? `VOZ DEL PROSPECT (palabras suyas exactas): "${voiceOfCustomer}"
← Refleja su vocabulario. No uses sinónimos "más bonitos" si él no los usa.` : ''}

PRODUCTO/SERVICIO:
${product}

PRONOMBRE PARA ESTE PAÍS: ${pronoun}

CHECKLIST ANTES DE ENTREGAR:
☐ ¿Leí cada mensaje en voz alta? ¿Suena como yo hablando?
☐ ¿Usé el trigger REAL, no una inferencia genérica?
☐ ¿Varié la longitud de frases? (patrón corta→larga→corta)
☐ ¿No empiezo 2 frases seguidas con el mismo patrón?
☐ ¿Eliminé triadas de adjetivos?
☐ ¿Eliminé "No X sino Y", "Hoy más que nunca", "En conclusión"?
☐ ¿El pronombre es correcto (${pronoun})?
☐ ¿Cierro con preguntas abiertas, no CTAs?
☐ ¿Cada mensaje ≤280 caracteres?

Devuelve exactamente este JSON:
{
  "sequence_1": {
    "text": "...",
    "strategy": "hook",
    "ai_detector_risk": 0.0,
    "confidence": 0.0,
    "sounds_human": 0.0,
    "structure_notes": "breve nota sobre variación de estructura usada"
  },
  "sequence_2": {
    "text": "...",
    "strategy": "social_proof",
    "ai_detector_risk": 0.0,
    "confidence": 0.0,
    "sounds_human": 0.0,
    "structure_notes": "..."
  },
  "sequence_3": {
    "text": "...",
    "strategy": "urgency",
    "ai_detector_risk": 0.0,
    "confidence": 0.0,
    "sounds_human": 0.0,
    "structure_notes": "..."
  },
  "meta": {
    "trigger_used": "trigger que usaste",
    "voice_detected": ["palabras", "de", "su", "vocabulario"],
    "structure_score": 0.0,
    "avg_sounds_human": 0.0,
    "readability_warning": "solo si algo estuvo bajo o faltó información"
  }
}

ai_detector_risk: 0.0–1.0 (probabilidad de detección IA; meta < 0.20)
sounds_human: 0.0–1.0 (¿suena como humano en conversación real?; meta > 0.75)
avg_sounds_human: promedio de sounds_human de los 3 mensajes
confidence: 0.0–1.0 (personalización y efectividad; −0.10 si no hay trigger real)
structure_score: 0.0–1.0 (variación de estructura sintáctica lograda)`,
      },
    ],
  })

  const raw = response.choices[0].message.content ?? '{}'
  const parsed = JSON.parse(raw) as {
    sequence_1: { text: string; strategy: string; ai_detector_risk: number; confidence: number; sounds_human: number; structure_notes: string }
    sequence_2: { text: string; strategy: string; ai_detector_risk: number; confidence: number; sounds_human: number; structure_notes: string }
    sequence_3: { text: string; strategy: string; ai_detector_risk: number; confidence: number; sounds_human: number; structure_notes: string }
    meta?: { trigger_used: string; voice_detected: string[]; structure_score: number; avg_sounds_human: number; readability_warning?: string }
  }

  const drafts: MessageDraft[] = [
    {
      draft_id: 1,
      sequence: 1,
      text: parsed.sequence_1?.text ?? '',
      confidence: normalizeConfidence(parsed.sequence_1?.confidence),
      strategy: (parsed.sequence_1?.strategy as MessageStrategy) ?? 'hook',
      ai_detector_risk: parsed.sequence_1?.ai_detector_risk ?? 0,
      sounds_human: parsed.sequence_1?.sounds_human ?? 0,
      structure_notes: parsed.sequence_1?.structure_notes ?? '',
    },
    {
      draft_id: 2,
      sequence: 2,
      text: parsed.sequence_2?.text ?? '',
      confidence: normalizeConfidence(parsed.sequence_2?.confidence),
      strategy: (parsed.sequence_2?.strategy as MessageStrategy) ?? 'social_proof',
      ai_detector_risk: parsed.sequence_2?.ai_detector_risk ?? 0,
      sounds_human: parsed.sequence_2?.sounds_human ?? 0,
      structure_notes: parsed.sequence_2?.structure_notes ?? '',
    },
    {
      draft_id: 3,
      sequence: 3,
      text: parsed.sequence_3?.text ?? '',
      confidence: normalizeConfidence(parsed.sequence_3?.confidence),
      strategy: (parsed.sequence_3?.strategy as MessageStrategy) ?? 'urgency',
      ai_detector_risk: parsed.sequence_3?.ai_detector_risk ?? 0,
      sounds_human: parsed.sequence_3?.sounds_human ?? 0,
      structure_notes: parsed.sequence_3?.structure_notes ?? '',
    },
  ]

  const meta: MessageSequenceMeta | undefined = parsed.meta
    ? {
        trigger_used: parsed.meta.trigger_used ?? trigger,
        voice_detected: parsed.meta.voice_detected ?? [],
        structure_score: parsed.meta.structure_score ?? 0,
        avg_sounds_human: parsed.meta.avg_sounds_human
          ?? (drafts.reduce((sum, d) => sum + (d.sounds_human ?? 0), 0) / drafts.length),
        readability_warning: parsed.meta.readability_warning,
      }
    : undefined

  const usage = calcUsage(
    response.usage?.prompt_tokens ?? 0,
    response.usage?.completion_tokens ?? 0
  )

  return { drafts, usage, meta }
}

// ============================================
// PROMPT C: humanize_message_v2
// Fase 3: Post-procesamiento estructural para reducir AI detection
// Solo se llama cuando ai_detector_risk > 0.45 O sounds_human < 0.6
// ============================================

export async function humanizeMessage(text: string): Promise<HumanizedMessage> {
  const openai = getOpenAI()

  const escapedText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 500,
    temperature: 0.9,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Tu única tarea: este mensaje suena a IA. Reescríbelo para que suene a humano.

La detección IA es ESTADÍSTICA (perplexity, burstiness), no de vocabulario.
Cambiar "meticulous" por "cuidadoso" NO resuelve el problema.

LO QUE SÍ FUNCIONA:
1. Variación de longitud de frases: alterna cortas (5-10 palabras) con largas (18-25)
2. Variación sintáctica: no iniciar 2 oraciones seguidas con el mismo patrón
3. Eliminar triadas de adjetivos (rápido, confiable, escalable → elige uno y desarrolla)
4. Eliminar patrones detectados: "No X sino Y", "Hoy más que nunca", "En conclusión"
5. Eliminar anáfora: 2+ oraciones que empiezan igual estructuralmente
6. Pregunta de cierre abierta > CTA cerrado

Preserva: hook original, estrategia, datos específicos del prospect. Máx 280 caracteres.
Responde siempre con JSON válido.`,
      },
      {
        role: 'user',
        content: `Humaniza este mensaje. El problema NO es el vocabulario — es la estructura.

MENSAJE ORIGINAL: "${escapedText}"

Analiza:
1. ¿Todas las frases tienen longitud parecida? → Varía
2. ¿Hay patrones repetidos al inicio de oraciones? → Rompe
3. ¿Hay triadas de adjetivos o beneficios? → Elimina
4. ¿Hay "No X sino Y"? ¿"Hoy más que nunca"? → Elimina
5. ¿El cierre es un CTA genérico? → Convierte en pregunta

Devuelve exactamente este JSON:
{
  "original": "${escapedText}",
  "humanized": "...",
  "changes_made": ["cambio estructural 1", "cambio estructural 2"],
  "ai_score_before": 0.0,
  "ai_score_after": 0.0,
  "confidence": 0.0
}

Reglas:
- humanized ≤ 280 caracteres (obligatorio)
- ai_score_after < 0.20
- Solo cambia estructura y flujo, NO inventes datos nuevos del prospect
- Lee el resultado en voz alta: ¿suena como alguien hablando de verdad?`,
      },
    ],
  })

  const raw = response.choices[0].message.content ?? '{}'
  return JSON.parse(raw) as HumanizedMessage
}

// ============================================
// PIPELINE: enrich → generate → humanize
// Orquestador completo de generación de mensajes (v5)
// ============================================

// Humanize only when clearly AI-written; threshold raised from 0.30 to 0.45
// to avoid over-processing messages that are already decent.
const AI_RISK_HUMANIZE_THRESHOLD = 0.45
const SOUNDS_HUMAN_HUMANIZE_THRESHOLD = 0.6

function needsHumanization(draft: MessageDraft): boolean {
  return (
    (draft.ai_detector_risk ?? 0) > AI_RISK_HUMANIZE_THRESHOLD ||
    (draft.sounds_human !== undefined && draft.sounds_human < SOUNDS_HUMAN_HUMANIZE_THRESHOLD)
  )
}

export async function generateMessagesWithPipeline(
  lead: LeadInput
): Promise<GenerateMessagesResponse> {
  // Fase 1: Enriquecer perfil
  const profile = await enrichLeadProfile(
    lead.name,
    lead.title,
    lead.company,
    lead.industry,
    lead.location,
    lead.profile_snippet
  )

  // Si el caller pre-extrajo trigger/voice (via extractTriggerAndVoice()), esos
  // valores tienen prioridad sobre lo que devolvió enrichLeadProfile.
  if (lead.trigger) profile.trigger = lead.trigger
  if (lead.voice_of_customer?.length) profile.voice_of_customer = lead.voice_of_customer

  // Fase 2: Generar mensajes con perfil enriquecido, trigger, voz y país
  const { drafts, usage, meta } = await generateLinkedInMessages(lead, profile)

  // Fase 3: Humanizar solo mensajes con detección IA alta O sounds_human bajo
  const finalDrafts = await Promise.all(
    drafts.map(async (draft) => {
      if (needsHumanization(draft)) {
        try {
          const result = await humanizeMessage(draft.text)
          return {
            ...draft,
            text: result.humanized || draft.text,
            ai_detector_risk: result.ai_score_after,
          }
        } catch {
          return draft
        }
      }
      return draft
    })
  )

  return { drafts: finalDrafts, usage, meta }
}
