# MSG-FIX-01B: Señal Real de Perfil y Estilo Humano en Motor V2

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Motor de Mensajes · IA · Fix |
| **Resuelve** | Defectos #1, #2 y #3 de `MSG-AUDIT-01` |
| **Afecta a** | `src/app/api/generate-v2/route.ts` · `src/lib/agent_v2.ts` |

---

## Problema corregido

Dos defectos identificados en `MSG-AUDIT-01` y la guía de estilo definida en `MSG-STYLE-01`:

1. **`posts_recientes` siempre vacío:** el agente V2 recibía un array vacío para todos los leads, lo que forzaba a construir la observación solo desde cargo + empresa (ADR-006 fallback). Resultado: mensajes genéricos idénticos para leads del mismo sector.

2. **System prompt sin contexto Talent4Pro ni criterios de tono humano:** el agente operaba como copywriter B2B genérico, generando mensajes correctos en estructura pero con tono de outreach de software/consultoría, no de captación educativa.

---

## Cambios aplicados

### Cambio 1 — `src/app/api/generate-v2/route.ts`

**Qué:** en el mapeo de contacts a LeadRawV2, se pasa ahora `raw_google_snippet` como primer elemento de `posts_recientes`.

```typescript
// Antes
posts_recientes: [],

// Después
posts_recientes: c.raw_google_snippet ? [c.raw_google_snippet] : [],
```

**Por qué:** la tabla `contacts` contiene `raw_google_snippet` — el fragmento de texto que SearchAPI extrae del resultado de Google para ese perfil de LinkedIn. Contiene información real del lead: extracto de su descripción, logros mencionados, keywords de su área. Al pasarlo al agente, el Mensaje 1 (Observación) puede anclarse en algo concreto del perfil en lugar de inferir solo desde rol y nombre de empresa.

**Efecto si el snippet está vacío:** el comportamiento es idéntico al anterior (array vacío → ADR-006 fallback). No hay regresión para leads sin snippet.

---

### Cambio 2 — `src/lib/agent_v2.ts`

**Qué:** el system prompt incorpora tres bloques nuevos antes del framework existente:

**Bloque A — Contexto del proyecto:**
Define que el objetivo es abrir conversación con candidatos o prescriptores para una certificación de liderazgo. Establece que NO es outreach B2B de producto ni consultoría clásica.

**Bloque B — Estilo obligatorio (guía MSG-STYLE-01):**
- Breve: máximo 3–4 frases por mensaje
- Natural: lenguaje normal, no corporativo
- Conversacional: tono entre iguales, no de vendedor a prospect
- Sin pitch: programa, precio, plazas y duración no se mencionan en ningún mensaje
- Sin forzar reunión: no pedir llamada en el primer contacto
- Una sola pregunta por mensaje, fácil de responder

Incluye patrones de referencia de tono (no plantillas a copiar literalmente).

**Bloque C — Frases prohibidas adicionales:**
Las 11 frases de `MSG-STYLE-01` no cubiertas por los ADRs existentes.

**Cambio en CTA Abierto (Mensaje 3):**
Se añaden ejemplos de preguntas con el tono correcto:
- "¿Esto te está llegando también o todavía no?"
- "¿En tu entorno estás viendo movimiento con esto?"
- "¿Te suena alguien a quien le pueda encajar?"
- "¿Te pasa algo parecido o nada que ver?"

**Lo que NO se ha cambiado en el prompt:**
- El formato JSON de salida (`observacion`, `insight`, `cta_abierto`)
- Las prohibiciones y reglas de los ADRs existentes
- El modelo (`claude-sonnet-4-6`)
- El prompt caching (`cache_control: { type: 'ephemeral' }`)
- El user prompt (sigue recibiendo `sales_goal`, `empresa`, `rol`, `posts_recientes`)
- La función `loadAllADRs()` — los ADRs siguen inyectándose en runtime

---

## Archivos modificados

| Archivo | Tipo de cambio |
|---|---|
| `src/app/api/generate-v2/route.ts` | 1 línea — `posts_recientes: c.raw_google_snippet ? [c.raw_google_snippet] : []` |
| `src/lib/agent_v2.ts` | System prompt ampliado con contexto Talent4Pro, guía de estilo y frases prohibidas adicionales; ejemplos de CTA añadidos |

---

## Qué NO se ha tocado

- `src/lib/claude_prompts.ts` (motor V1) — sin cambios
- `src/app/api/generate-messages/route.ts` (endpoint V1) — sin cambios
- `src/app/api/search/route.ts` — sin cambios
- UI / componentes React — sin cambios
- Schema de Supabase — sin cambios
- Variables de entorno — sin cambios
- SearchAPI — sin cambios
- Modelo Claude (`claude-sonnet-4-6`) — sin cambios
- Estructura JSON de salida — sin cambios
- ADRs (`docs/adr/ADRs.md`) — sin cambios

---

## Resultado del build

```
✓ Compiled successfully in 3.8s
✓ Linting and checking validity of types
✓ Generating static pages (26/26)
0 errores · 0 warnings
```

---

## Riesgo residual

| Riesgo | Evaluación |
|---|---|
| `raw_google_snippet` puede contener texto en inglés o fragmentos de baja calidad | Bajo — el agente ya maneja posts_recientes de calidad variable (ADR-006). El fallback a rol+empresa sigue activo si el snippet es vacío. |
| System prompt más largo aumenta ligeramente el coste de tokens en cache miss | Muy bajo — el prompt sigue siendo cacheado entre leads con `cache_control: ephemeral`. |
| Las frases prohibidas adicionales pueden excluir expresiones que en algunos contextos serían correctas | Bajo — las frases prohibidas son las más asociadas al tono de vendedor; no cubren vocabulario sectorial legítimo. |
| Sin prueba con leads reales, no podemos confirmar la mejora de calidad | Pendiente — es la siguiente tarea. |

---

## Próxima tarea recomendada

**MSG-TEST-01** — Prueba controlada con 3–5 leads reales:

1. Usar la herramienta en Vercel o local para ejecutar una búsqueda con perfiles reales
2. Generar mensajes con `/api/generate-v2` y el `sales_goal` canónico de Talent4Pro
3. Evaluar cada mensaje contra los criterios de `MSG-STYLE-01`:
   - ¿Parece escrito por una persona?
   - ¿Se entiende en menos de 10 segundos?
   - ¿La observación usa datos reales del snippet?
   - ¿El CTA es una pregunta fácil de responder?
   - ¿Ningún mensaje menciona la certificación ni pide reunión?
4. Documentar ejemplos buenos y malos
5. Decidir si se necesita un ajuste adicional al prompt o si el motor está listo para uso operativo

---

## Referencias

- Auditoría que detectó los defectos: `docs/decisions/MSG-AUDIT-01-message-engine-audit-talent4pro.md`
- Guía de estilo aplicada: `docs/decisions/MSG-STYLE-01-human-conversation-style-talent4pro.md`
- Objetivo comercial: `docs/decisions/DOC-BASE-01-objetivo-comercial-talent4pro.md`
- ADRs del agente (no modificados): `docs/adr/ADRs.md`
