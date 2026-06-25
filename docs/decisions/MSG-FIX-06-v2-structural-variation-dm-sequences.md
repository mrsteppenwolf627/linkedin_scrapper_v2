# MSG-FIX-06: Variación Estructural en Secuencias de DMs del Motor V2

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Motor de Mensajes · IA · Fix |
| **Afecta a** | `src/lib/agent_v2.ts` (system prompt) |

---

## Problema corregido

Tras MSG-FIX-05, los mensajes individuales mejoraron, pero en una generación real de varios leads aparecen patrones repetitivos que delatan la automatización:

- Mensaje 1 siempre empezaba con "Buenas. Una pregunta rápida..."
- Mensaje 2 siempre empezaba con "Te lo preguntaba porque hablo con..."
- Mensaje 3 siempre terminaba con "¿Te viene alguien a la cabeza...? / Que le pueda cuadrar..."

Un lead que recibe el mensaje no lo percibe — pero el operador que revisa los drafts generados para 10+ leads ve claramente la plantilla.

---

## Patrones repetitivos detectados

| Posición | Patrón repetitivo |
|---|---|
| Mensaje 1 | "Buenas. Una pregunta rápida..." / "Una pregunta rápida..." |
| Mensaje 2 | "Te lo preguntaba porque..." / "Hablo con gente..." / "Estoy hablando con gente..." / "Me interesa saber..." |
| Mensaje 3 | "Y si no es algo que..." / "¿Te viene alguien a la cabeza...?" / "Que le pueda cuadrar..." / "Que te quite el sueño..." |

---

## Cambios aplicados

### 1. Actualización de ejemplos en REGLA CENTRAL DE ESTILO

Los ejemplos de registro pasaban a la lista de "patrones a evitar por repetición", así que se actualizaron con nuevos ejemplos que muestran el tono correcto sin ser los patrones que se prohíben.

### 2. Regla de variación estructural explícita

Se añade en REGLA CENTRAL DE ESTILO:

> "REGLA DE VARIACIÓN ESTRUCTURAL: No uses siempre la misma apertura, la misma estructura ni las mismas fórmulas. Si varios mensajes para distintos leads comparten el mismo inicio, la generación está mal."

Se añaden los patrones a evitar por repetición excesiva para cada posición de la secuencia.

### 3. Familias de mensajes (6 por posición)

El FRAMEWORK deja de especificar un único formato y propone **6 familias de enfoque** por mensaje. El modelo debe elegir una según el lead y no usar siempre la misma.

#### Familias de Mensaje 1 (observacion)

| Familia | Enfoque |
|---|---|
| A | Pregunta directa con señal del perfil |
| B | Observación corta que deja el aire |
| C | Contraste o tensión entre dos ideas |
| D | Contexto específico del rol |
| E | Prescriptor desde el inicio |
| F | Validación de mercado |

#### Familias de Mensaje 2 (insight)

| Familia | Enfoque |
|---|---|
| A | Explicación breve y directa |
| B | Contexto desde la perspectiva del lead |
| C | Aclaración de a quién va dirigido |
| D | Hipótesis del remitente |
| E | Caso práctico concreto |
| F | Puente suave hacia el receptor |

#### Familias de Mensaje 3 (cta_abierto)

| Familia | Enfoque |
|---|---|
| A | Cierre suave sin presión |
| B | Pregunta de prescripción |
| C | Pregunta alternativa sobre el sector |
| D | Cierre humano ("Te leo cuando puedas") |
| E | No presión explícita |
| F | Derivación hacia prescriptor |

### 4. Regla de autoevaluación antes de responder

Antes de devolver el JSON, el modelo debe comprobar internamente:
- ¿Los 3 mensajes parecen escritos por la misma persona, pero no por una plantilla?
- ¿El mensaje 1 incluye saludo y señal real del lead?
- ¿El mensaje 2 empieza con una fórmula repetida?
- ¿El mensaje 3 es muy corto y sin presión?
- ¿Hay palabras de consultor en algún mensaje?
- ¿Cada mensaje puede enviarse solo por LinkedIn sin contexto previo?
- Si algo falla → reescribir antes de devolver el JSON.

### 5. Actualización de la instrucción del user prompt

Cambia de "Redacta la secuencia Observación → Insight → CTA Abierto" a "Redacta la secuencia de 3 DMs reales de LinkedIn. Elige una familia distinta para cada mensaje. No repitas la misma estructura."

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/lib/agent_v2.ts` | 4 bloques del system prompt + user prompt instruction |

---

## Qué NO se ha tocado

- `src/app/api/generate-v2/route.ts` — sin cambios
- `src/lib/claude_prompts.ts` (motor V1) — sin cambios
- Ningún endpoint — sin cambios
- UI — sin cambios
- Schema Supabase — sin cambios
- Variables de entorno — sin cambios
- SearchAPI — sin cambios
- Modelo (`claude-sonnet-4-6`) — sin cambios
- Estructura JSON de salida (`observacion`, `insight`, `cta_abierto`) — sin cambios
- Límites de caracteres (260/220/160) — sin cambios
- ADRs (`docs/adr/ADRs.md`) — sin cambios
- Lista de palabras prohibidas de vocabulario — sin cambios

---

## Resultado del build

```
✓ Compiled successfully in 3.4s
✓ Generating static pages (26/26)
0 errores · 0 warnings
```

---

## Riesgo residual

| Riesgo | Evaluación |
|---|---|
| El modelo puede elegir siempre la misma familia sin instrucción explícita de cuál usar | Bajo — la regla de variación actúa como principio general; las familias son opciones, no mandatos rotativos |
| El system prompt es ahora significativamente más largo → más tokens en cache miss | Bajo — el prompt sigue siendo cacheado por lead con `cache_control: ephemeral`; el coste incremental es mínimo |
| Las familias pueden verse como plantillas por el modelo | Bajo — se especifica explícitamente "adaptar al lead real, no copiar literalmente" |
| Sin prueba post-cambio | Pendiente — es la siguiente tarea (MSG-TEST-06) |

---

## Próxima tarea recomendada

**MSG-TEST-06** — Generar 10+ leads reales y revisar repetición estructural:

1. Ejecutar `scripts/test_msg_v2_talent4pro.ts` con los 4 leads existentes + añadir 6 leads nuevos de distintos sectores
2. Revisar si los 10+ mensajes 1 empiezan con estructuras distintas
3. Revisar si los 10+ mensajes 2 usan familias distintas
4. Verificar que el mensaje 3 varía entre leads
5. Si la variación es clara (no más de 2 leads con el mismo patrón) → motor listo para campaña

---

## Referencias

- Fix anterior: `docs/decisions/MSG-FIX-05-v2-real-linkedin-dm-sequence.md`
- Última prueba: `docs/decisions/MSG-TEST-04-v2-final-human-dm-validation.md`
- Guía de estilo: `docs/decisions/MSG-STYLE-02-simple-human-dm-language.md`
- Motor modificado: `src/lib/agent_v2.ts`
