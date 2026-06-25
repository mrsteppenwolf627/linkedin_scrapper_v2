# MSG-AUDIT-01: Auditoría del Motor de Generación de Mensajes para Talent4Pro

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Motor de Mensajes · IA · Producto |
| **Afecta a** | `src/lib/agent_v2.ts` · `src/lib/claude_prompts.ts` · `/api/generate-v2` · `/api/generate-messages` |

---

## Resumen ejecutivo

El proyecto tiene **dos motores de generación de mensajes independientes** con arquitecturas, modelos y objetivos distintos. Solo uno de ellos (V2) está alineado con el framework de apertura de conversaciones definido en los ADRs. Sin embargo, **V2 tiene un defecto estructural crítico**: el campo `posts_recientes` se envía siempre vacío al agente, lo que obliga a todas las observaciones a basarse únicamente en cargo y empresa — la fuente de genericidad más importante del sistema. Además, **ninguno de los dos motores tiene contexto específico de Talent4Pro** en sus prompts; la única orientación comercial viene del campo `sales_goal` de texto libre.

**Veredicto: el motor V2 es el correcto para Talent4Pro, pero necesita dos mejoras concretas antes de ser eficaz.**

---

## Mapa del flujo actual

### Motor V1 — `generate-messages` (legacy, B2B sales)

```
POST /api/generate-messages
  │
  ├── Entrada: { name, title, company, industry, location,
  │             linkedin_url, profile_snippet, your_product,
  │             country, trigger, voice_of_customer }
  │
  ├── Paso 1: enrichLeadProfile()          → gpt-4o-mini
  │           extrae: pain_points, decision_maker_level,
  │           priorities, company_size, sector_keywords,
  │           role_psychology, trigger, voice_of_customer
  │
  ├── Paso 2: generateLinkedInMessages()   → gpt-4o-mini
  │           framework: Hook → Social Proof → Urgency
  │           usa perfil enriquecido + trigger + voz del lead
  │           3 mensajes ≤ 280 caracteres c/u
  │
  ├── Paso 3: humanizeMessage()            → gpt-4o-mini
  │           solo si ai_detector_risk > 0.45 o sounds_human < 0.6
  │           corrección estructural: variación de longitud,
  │           eliminación de triadas, patrones IA
  │
  └── Salida: 3 MessageDraft con scores (ai_detector_risk,
              sounds_human, confidence, structure_notes)
```

### Motor V2 — `generate-v2` (activo, conversation-opening)

```
POST /api/generate-v2
  │
  ├── Entrada: { search_id, sales_goal }
  │
  ├── Paso 1: fetch contacts de Supabase (contacts válidos
  │           de esa búsqueda, ordenados por confidence_score)
  │
  ├── Paso 2: mapeo contacts → LeadRawV2
  │           { nombre, empresa, rol, posts_recientes: [] }
  │           ⚠️  posts_recientes SIEMPRE vacío
  │
  ├── Paso 3: crear message_batch en Supabase
  │
  ├── Paso 4: orchestrateV2(leads, sales_goal) → agent_v2.ts
  │   │
  │   ├── loadAllADRs() — lee docs/adr/*.md del filesystem
  │   │
  │   ├── System prompt (cacheado entre leads):
  │   │   - Regla de especificidad global
  │   │   - Framework: Observación → Insight → CTA Abierto
  │   │   - Prohibiciones por tipo de mensaje
  │   │   - Lista negra de buzzwords
  │   │   - ADRs completos inyectados
  │   │
  │   ├── User prompt (por lead):
  │   │   CONTEXTO REMITENTE: ${sales_goal}
  │   │   EMPRESA: ${lead.empresa}
  │   │   ROL: ${lead.rol}
  │   │   POSTS RECIENTES: "No disponibles — infiere desde rol y empresa"
  │   │
  │   └── claude-sonnet-4-6 → JSON { observacion, insight, cta_abierto }
  │
  └── Paso 5: persistir leads + message_drafts en Supabase
              (batch_id propagado explícitamente)
```

---

## Archivos implicados

| Archivo | Rol | Motor |
|---|---|---|
| `src/lib/agent_v2.ts` | Motor V2 — agente de redacción exportable | V2 |
| `src/app/api/generate-v2/route.ts` | Endpoint bridge UI → V2 | V2 |
| `src/lib/claude_prompts.ts` | Motor V1 — pipeline enrich+generate+humanize | V1 |
| `src/app/api/generate-messages/route.ts` | Endpoint bridge UI → V1 | V1 |
| `src/app/api/search/route.ts` | Búsqueda SSE — produce los contacts en Supabase | Común |
| `docs/adr/ADRs.md` | Reglas de tono, prohibiciones, framework — leídas en runtime por V2 | V2 |
| `docs/adr/ADR-004-fallback-leads-entornos-restringidos.md` | Seed leads para desarrollo | V2 |

---

## Diagnóstico del motor actual

### V1 vs V2 — diferencias clave

| Dimensión | Motor V1 (`claude_prompts.ts`) | Motor V2 (`agent_v2.ts`) |
|---|---|---|
| **Modelo** | OpenAI `gpt-4o-mini` | Anthropic `claude-sonnet-4-6` |
| **Framework** | Hook → Social Proof → Urgency | Observación → Insight → CTA Abierto |
| **Objetivo del mensaje** | Venta directa B2B — cerrar reunión | Apertura de conversación — sin pitch |
| **Enriquecimiento del lead** | Sí — extrae pain_points, psicología, trigger | No — solo nombre, empresa, rol |
| **Posts del lead** | Acepta `profile_snippet` | Acepta `posts_recientes` pero llegan vacíos |
| **Orientación comercial** | `your_product` (por lead, texto libre) | `sales_goal` (por búsqueda, texto libre) |
| **Post-procesamiento** | Humanización si risk > 0.45 | Ninguno |
| **Restricciones de ADR** | No — prompt propio independiente | Sí — inyecta ADRs en runtime |
| **Longitud de mensajes** | ≤ 280 caracteres por mensaje | Sin límite explícito de caracteres |
| **Integración con UI** | Sí (por lead individual) | Sí (por búsqueda completa) |

**Conclusión:** V1 es un motor de cold sales B2B diseñado para cerrar reuniones. V2 es un motor de apertura consultiva. **Para Talent4Pro, solo V2 tiene el enfoque correcto.** V1 no debe usarse para captación de alumnos.

---

## Problemas detectados

### PROBLEMA #1 — `posts_recientes` siempre vacío (CRÍTICO)

**Ubicación:** `src/app/api/generate-v2/route.ts`, líneas 177–182

```typescript
const leads: LeadRawV2[] = contacts.map(c => ({
  nombre:          c.name     ?? 'Desconocido',
  empresa:         c.company  ?? '',
  rol:             c.job_title ?? '',
  posts_recientes: [],   // ← hardcodeado como array vacío
}))
```

La tabla `contacts` en Supabase no tiene columna de posts. La búsqueda con SearchAPI solo recupera `raw_google_snippet` (el snippet del resultado de Google), no los posts reales de LinkedIn. Este snippet **no se pasa al agente V2**.

Consecuencia directa: el agente siempre ejecuta ADR-006 fallback:
> "posts_recientes vacío: inferir observación desde rol + empresa"

Esto significa que el Mensaje 1 (Observación) de **todos los leads** se construye solo a partir del cargo y el nombre de la empresa. Esto es la fuente principal de mensajes genéricos: cualquier persona con el mismo cargo en la misma empresa recibiría la misma observación.

**El `raw_google_snippet` existe en la tabla pero no se usa en V2.** Contiene fragmentos reales del perfil de LinkedIn (extracto de descripción, logros mencionados) que podrían dar sustancia a la observación.

---

### PROBLEMA #2 — `sales_goal` sin estructura ni guía (ALTO)

El campo `sales_goal` es texto libre que el usuario escribe en cada búsqueda. El agente lo recibe como:

```
CONTEXTO DEL REMITENTE (úsalo solo para informar el insight,
no para mencionar en los mensajes 1-2):
Propuesta de valor que ofrece el remitente: ${salesGoal}
```

No hay plantilla, ni ejemplo, ni validación. Si el usuario escribe:
- `"Certificación Talent4Pro"` → el insight será vago
- `"Certificación en habilidades directivas para mandos intermedios que quieren avanzar a posiciones de liderazgo senior"` → el insight será más preciso

La calidad del output depende enteramente de la calidad del input del usuario, sin ninguna guía estructurada. No existe un `sales_goal` canónico de Talent4Pro documentado en el sistema.

---

### PROBLEMA #3 — Sin contexto de Talent4Pro en el sistema prompt (ALTO)

El system prompt de `agent_v2.ts` es genérico para cualquier outreach B2B:

> "Eres un Senior Copywriter especializado en ventas B2B y LinkedIn outreach en español."

No hay mención de:
- Qué es Talent4Pro
- Qué tipo de candidato se busca (perfil del alumno objetivo)
- Qué motivaciones profesionales suelen tener esos candidatos
- Por qué alguien elegiría certificarse
- Qué preguntas abren conversación sobre desarrollo profesional vs. las que abren conversación sobre productos B2B

Un agente de outreach para captación de alumnos debe operar con una lógica distinta a un agente de ventas de software B2B.

---

### PROBLEMA #4 — El CTA Abierto no está orientado a cualificación (MEDIO)

El ADR-002 y ADR-004 definen el CTA como "una pregunta que invita al lead a compartir OPINIÓN o PERSPECTIVA". Esto es correcto para apertura, pero sin contexto de Talent4Pro, las preguntas generadas tienden a ser sobre el sector del lead ("¿Cómo estáis gestionando X en vuestro equipo?") en lugar de sobre su desarrollo profesional o ambición personal, que es donde existe la palanca de captación.

Un candidato potencial a Talent4Pro responde a preguntas sobre crecimiento, reconocimiento de su expertise, y momentos de transición profesional — no a preguntas sobre los retos operativos de su empresa.

---

### PROBLEMA #5 — Dos motores activos sin separación clara (MEDIO)

Los endpoints `/api/generate-messages` (V1) y `/api/generate-v2` (V2) coexisten. El dashboard usa V2 (botón "Generar" en `/dashboard/searches`), pero V1 sigue activo y accesible. No hay documentación visible para el usuario sobre cuál usar. Si alguien llama a V1 para leads de Talent4Pro, obtendrá mensajes con framework de urgencia y social proof que van en contra de los ADRs.

---

### PROBLEMA #6 — Sin límite de caracteres en V2 (BAJO)

El motor V1 enforcea `≤ 280 caracteres por mensaje` en el prompt. V2 no tiene límite explícito. LinkedIn tiene un límite de 300 caracteres para mensajes de conexión y límites variables para mensajes directos. Un mensaje demasiado largo en el primer contacto reduce la tasa de respuesta.

---

### PROBLEMA #7 — Sin mecanismo de evaluación post-envío (BAJO)

No existe forma de registrar si un mensaje derivó en respuesta. El sistema genera drafts y los almacena, pero una vez que el usuario copia el mensaje y lo envía manualmente, la herramienta pierde el rastro. Sin esta señal, es imposible saber qué mensajes funcionan y cuáles no.

---

## Riesgos comerciales

| Riesgo | Probabilidad | Impacto |
|---|---|---|
| Mensajes idénticos para leads del mismo sector/rol (genericidad por posts vacíos) | Alta | Alta |
| Usuario escribe un `sales_goal` pobre → mensajes irrelevantes | Alta | Alta |
| Mensajes que suenan a outreach de software B2B en lugar de captación educativa | Media | Alta |
| CTA que no conecta con motivaciones de desarrollo profesional | Media | Media |
| Candidato recibe mensaje que no le habla de su situación real → ignora | Alta | Alta |

---

## Riesgos técnicos

| Riesgo | Probabilidad | Impacto |
|---|---|---|
| `raw_google_snippet` disponible en BD pero no usado → oportunidad perdida | Certeza | Alta |
| `sales_goal` sin validación mínima → output impredecible | Alta | Media |
| V1 activo simultáneamente → puede usarse por error para leads Talent4Pro | Media | Media |
| Sin límite de caracteres en V2 → mensajes fuera de spec LinkedIn | Baja | Baja |
| ADRs leídos en runtime (`fs.readFileSync`) → cambio de ADRs afecta inmediatamente al agente sin deploy | Baja | Media |

---

## Recomendación de mejora

### Qué NO tocar

- Motor V1 (`claude_prompts.ts`, `/api/generate-messages`) — funciona para su caso de uso original; no se toca
- Endpoint `/api/generate-v2` — la arquitectura del bridge es correcta
- Framework ADR-002 (Observación → Insight → CTA Abierto) — es el enfoque correcto para captación; no cambiar la estructura
- ADR-003 (voz, tono, tuteo, español neutro) — correctos para el contexto
- ADR-004 (prohibiciones) — válidas y necesarias

### Qué mejorar primero (por orden de impacto)

**Mejora #1 — Pasar `raw_google_snippet` como `posts_recientes` (mayor impacto, menor riesgo)**

En `src/app/api/generate-v2/route.ts`, el mapeo de contacts a LeadRawV2 debe incluir el snippet:

```typescript
posts_recientes: c.raw_google_snippet ? [c.raw_google_snippet] : []
```

Esto no cambia el contrato del agente. El ADR-006 ya contempla el caso de posts no vacíos. El snippet da al agente una base real (aunque imperfecta) para construir la observación. Impacto inmediato: mensajes más específicos por lead.

**Mejora #2 — Añadir contexto Talent4Pro al system prompt del agente V2 (segundo en impacto)**

En `src/lib/agent_v2.ts`, el system prompt debe incluir una sección con:
- El perfil del alumno objetivo de Talent4Pro
- Las motivaciones profesionales que activan el interés por certificación
- Las preguntas CTA orientadas a desarrollo profesional, no a retos operativos
- La diferencia entre captar alumnos (educación, crecimiento personal) y vender software (ROI, eficiencia)

Este cambio convierte al agente de un copywriter B2B genérico en un especialista en captación educativa.

**Mejora #3 — Definir y documentar el `sales_goal` canónico de Talent4Pro**

Crear una plantilla de `sales_goal` que el usuario pueda copiar al iniciar una búsqueda. Algo como:
> "Talent4Pro ofrece certificaciones profesionales acreditadas para mandos intermedios y directivos que buscan validar y escalar sus competencias de liderazgo. El programa combina metodología práctica con mentoría de expertos y está diseñado para profesionales con experiencia que quieren dar el siguiente paso."

Este `sales_goal` da al agente suficiente contexto para generar un insight relevante sin mencionar explícitamente la certificación en los primeros dos mensajes.

### Orden de trabajo recomendado

| Orden | Tarea | Archivo | Esfuerzo | Impacto |
|---|---|---|---|---|
| 1 | Pasar `raw_google_snippet` como `posts_recientes[0]` | `generate-v2/route.ts` | 1 línea | Alto |
| 2 | Añadir sección Talent4Pro al system prompt | `agent_v2.ts` | ~20 líneas | Alto |
| 3 | Documentar `sales_goal` canónico en `.env.example` o en la UI como placeholder | `route.ts` o UI | Bajo | Medio |
| 4 | Añadir límite de caracteres al prompt V2 | `agent_v2.ts` | 1 línea | Bajo |
| 5 | Deprecar formalmente V1 para el flujo Talent4Pro | Documentación | Solo docs | Bajo |

Las mejoras 1 y 2 pueden hacerse en una sola tarea de código. Son las de mayor impacto y menor riesgo de romper algo existente.

---

## Próxima tarea recomendada

**MSG-FIX-01** — Mejorar el motor V2 para captación Talent4Pro:

1. En `src/app/api/generate-v2/route.ts`: pasar `raw_google_snippet` al campo `posts_recientes` del lead
2. En `src/lib/agent_v2.ts`: añadir sección de contexto Talent4Pro al system prompt del agente
3. Documentar el `sales_goal` canónico de Talent4Pro como comentario o placeholder en el código
4. Verificar que el build pasa sin errores (`npm run build`)
5. Actualizar `CONTEXT.md` y `docs/decisions/index.md`
6. Commit: `feat(agent): align V2 message engine with Talent4Pro outreach`

Estas dos mejoras son suficientes para cambiar cualitativamente los mensajes generados. No requieren cambios en la base de datos, en la UI, ni en el motor de búsqueda.

---

## Referencias

- Motor V2: `src/lib/agent_v2.ts`
- Motor V1: `src/lib/claude_prompts.ts`
- Endpoint V2: `src/app/api/generate-v2/route.ts`
- Endpoint V1: `src/app/api/generate-messages/route.ts`
- ADRs del agente: `docs/adr/ADRs.md`
- Objetivo comercial: `docs/decisions/DOC-BASE-01-objetivo-comercial-talent4pro.md`
- Despliegue funcional: `docs/decisions/POST-DEPLOY-01-vercel-functional-validation.md`
