# MSG-FIX-07: Variante de Estilo Forzada por Lead en Motor V2

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Motor de Mensajes · IA · Fix |
| **Afecta a** | `src/lib/agent_v2.ts` · `src/app/api/generate-v2/route.ts` · `scripts/test_msg_v2_talent4pro.ts` |

---

## Problema corregido

En generaciones reales de 10+ leads se repetían siempre los mismos patrones de inicio:
- "Te lo preguntaba porque..." / "Me lo preguntaba porque..."
- "Mi sensación es que..."
- "Desde selección se nota antes que nadie..."
- "Si no va contigo..." / "Si te viene alguien a la cabeza..."
- "Que le pueda cuadrar..." / "Que te quite el sueño..."
- Aparición residual de "gap"

MSG-FIX-06 añadió 6 familias de mensajes y pedía al modelo "no repetir estructura", pero el modelo no tiene memoria entre llamadas — genera cada lead de forma completamente independiente, por lo que no puede saber qué estructura usó para el lead anterior.

---

## Hipótesis técnica — confirmada

**El agente genera una llamada independiente a Claude por cada lead.** El loop está en `orchestrateV2()` en `src/lib/agent_v2.ts` (línea `for (const lead of leads)`). Cada iteración crea su propia petición HTTP a la API de Anthropic sin contexto de las anteriores.

Pedir "varía entre leads" desde el system prompt no tiene efecto porque el modelo que procesa el lead 3 nunca vio lo que generó para el lead 1 ni el 2.

**Solución:** asignar la variante de estilo **antes de llamar al agente** y pasarla en el user prompt de cada lead.

---

## Cambios aplicados

### 1. `src/lib/agent_v2.ts` — interfaz `LeadRawV2`

Se añade campo opcional:
```typescript
export interface LeadRawV2 {
  nombre: string
  empresa: string
  rol: string
  posts_recientes: string[]
  style_variant?: number  // 0-5 → variantes 1-6
}
```

### 2. `src/lib/agent_v2.ts` — función `getVariantInstruction()`

Nueva función que traduce un número de variante (0-5) a instrucciones concretas para el user prompt:

| Variante | Nombre | Mensaje 1 | Mensaje 2 | Mensaje 3 |
|---|---|---|---|---|
| 0 | Directa | Pregunta directa + dato del perfil | Una frase de aclaración mínima | Cierre suave sin prescriptor |
| 1 | Observación casual | Observación breve, puede no terminar en pregunta | Frase de contexto | Pregunta alternativa |
| 2 | Prescriptor | Busca si puede referir a alguien | Qué tipo de perfil en una frase | Derivación directa |
| 3 | Validación de mercado | ¿El tema está llegando a su sector? | Validando si es real o ruido | Cómo lo ve desde su posición |
| 4 | Rol concreto | Algo específico del rol o empresa | Baja a algo práctico del día a día | Cierre muy corto |
| 5 | Minimalista | Máx 2 frases | Máx 1 frase | Máx 1 frase |

Cada variante incluye prohibiciones específicas para evitar los patrones problemáticos de las pruebas anteriores.

### 3. `src/lib/agent_v2.ts` — límites de caracteres reducidos

| Campo | Antes | Ahora |
|---|---|---|
| `observacion` | ≤ 260 | ≤ **240** |
| `insight` | ≤ 220 | ≤ **160** |
| `cta_abierto` | ≤ 160 | ≤ **120** |

Los follow-ups más cortos reducen el riesgo de que suenen como emails de campaña.

### 4. `src/lib/agent_v2.ts` — prohibiciones reforzadas

Se añade en PALABRAS Y EXPRESIONES PROHIBIDAS una sección específica de frases de transición repetitivas que nunca pueden usarse:

```
"Te lo preguntaba porque" · "Me lo preguntaba porque" · "Lo preguntaba porque"
"Mi sensación es que" · "Me interesa saber" · "Curiosidad por saber"
"Desde selección se nota antes que nadie" · "Desde [rol] se nota antes que nadie"
"Si no va contigo" · "Si no es algo que" · "Si te viene alguien a la cabeza"
"Que le pueda cuadrar" · "Que te quite el sueño"
```

### 5. `src/lib/agent_v2.ts` — user prompt actualizado

El user prompt ahora incluye:
- El NOMBRE del lead (antes no se pasaba explícitamente)
- La instrucción de variante generada por `getVariantInstruction(lead.style_variant ?? 0)`
- La instrucción final indica que la variante es **obligatoria**

### 6. `src/app/api/generate-v2/route.ts` — asignación de variante por índice

```typescript
const leads: LeadRawV2[] = contacts.map((c, index) => ({
  ...
  style_variant: index % 6,  // rota entre 6 variantes para evitar repetición en el batch
}))
```

El lead 0 usará variante 0 (Directa), el lead 1 variante 1 (Observación casual), etc. En un batch de 12 leads, cada variante se usa exactamente 2 veces — garantizando variedad estructural sin depender de que el modelo "recuerde" lo que generó antes.

### 7. `scripts/test_msg_v2_talent4pro.ts` — actualizado

Se añade `style_variant` a cada lead de prueba (0, 1, 2, 3) para que el test refleje el comportamiento real del endpoint.

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/lib/agent_v2.ts` | Interfaz `LeadRawV2` + función `getVariantInstruction()` + límites + prohibiciones + user prompt |
| `src/app/api/generate-v2/route.ts` | `style_variant: index % 6` en el mapeo de contacts |
| `scripts/test_msg_v2_talent4pro.ts` | `style_variant` añadido a cada lead de prueba |

---

## Qué NO se ha tocado

- `src/lib/claude_prompts.ts` (motor V1) — sin cambios
- `/api/generate-messages` — sin cambios
- `/api/search` — sin cambios
- UI — sin cambios
- Schema Supabase — sin cambios (el campo `style_variant` es interno al agente, no se persiste en BD)
- Variables de entorno — sin cambios
- SearchAPI — sin cambios
- Modelo (`claude-sonnet-4-6`) — sin cambios
- Estructura JSON de salida (`observacion`, `insight`, `cta_abierto`) — sin cambios
- ADRs (`docs/adr/ADRs.md`) — sin cambios

---

## Resultado del build

```
✓ Compiled successfully in 3.3s
✓ Generating static pages (26/26)
0 errores · 0 warnings
```

---

## Riesgo residual

| Riesgo | Evaluación |
|---|---|
| El modelo puede no seguir la variante asignada con fidelidad total | Bajo-medio — las instrucciones de variante son específicas. En MSG-TEST-07 se comprobará el cumplimiento. |
| Los límites más estrictos (insight ≤ 160) pueden producir mensajes 2 demasiado abruptos | Bajo — 160 chars es suficiente para 1 frase bien escrita en castellano. |
| En batches de menos de 6 leads, no todas las variantes se usan | Bajo impacto — incluso 2-3 variantes distintas son suficientes para eliminar la repetición visible. |
| `style_variant` no persiste en Supabase — los drafts guardados no tienen info de qué variante usaron | Aceptable para la fase actual. |

---

## Próxima tarea recomendada

**MSG-TEST-07** — Prueba real de 10+ leads para medir repetición estructural:

1. Ampliar `scripts/test_msg_v2_talent4pro.ts` con al menos 10 leads (cubrir las 6 variantes al menos una vez)
2. Verificar que cada Mensaje 1 tiene una estructura de apertura distinta entre leads
3. Verificar que ningún Mensaje 2 empieza con las frases prohibidas reforzadas
4. Si la variedad es clara → motor listo para campaña operativa en Vercel

---

## Referencias

- Fix anterior: `docs/decisions/MSG-FIX-06-v2-structural-variation-dm-sequences.md`
- Última prueba: `docs/decisions/MSG-TEST-04-v2-final-human-dm-validation.md`
- Motor modificado: `src/lib/agent_v2.ts`
- Endpoint modificado: `src/app/api/generate-v2/route.ts`
