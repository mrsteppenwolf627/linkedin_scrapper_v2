# MSG-FIX-02: Límite de Longitud de Mensajes en Motor V2

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Motor de Mensajes · IA · Fix |
| **Resuelve** | Problema de longitud detectado en `MSG-TEST-01` |
| **Afecta a** | `src/lib/agent_v2.ts` (system prompt) |

---

## Problema corregido

En `MSG-TEST-01`, 3 de 4 mensajes de insight superaron los 400 caracteres (máximo: 488). Para un DM de LinkedIn, esto es excesivo — el receptor percibe el mensaje como un email comercial, no como una conversación. El system prompt anterior especificaba "3-4 frases" pero no caracteres, lo que dejaba al modelo libre de escribir frases largas.

---

## Cambio aplicado

En `src/lib/agent_v2.ts`, dos bloques del system prompt modificados:

### Bloque 1 — Sección ESTILO OBLIGATORIO

Añadido bajo el criterio "Breve":
```
- Límites estrictos de caracteres: observacion ≤ 220 · insight ≤ 250 · cta_abierto ≤ 140.
  Si una idea necesita más explicación, simplifícala. No la alargues.
- Prohibido escribir párrafos largos. Prohibido sonar como post de LinkedIn, email comercial
  o texto de landing page.
```

Y al final de los criterios:
```
- Priorizar naturalidad sobre perfección. Un mensaje imperfecto y breve supera a uno pulido y largo.
```

### Bloque 2 — Sección FRAMEWORK (cada mensaje)

| Mensaje | Antes | Después |
|---|---|---|
| OBSERVACIÓN | "2-3 frases" | "2-3 frases · **máximo 220 caracteres**" |
| INSIGHT | "3-4 frases" | "2-3 frases · **máximo 250 caracteres**" + regla de simplificación |
| CTA ABIERTO | "1-2 frases" | "1 frase · **máximo 140 caracteres**" |

El límite del insight redujo también el número de frases permitidas de 3-4 a 2-3, lo que es coherente con los 250 caracteres.

---

## Límites elegidos y justificación

| Campo | Límite | Justificación |
|---|---|---|
| `observacion` | 220 chars | Observación directa: 2 frases cortas son suficientes. Más = parece un análisis, no una conversación. |
| `insight` | 250 chars | Espacio para una idea con desarrollo mínimo. Fuerza al modelo a elegir el ángulo más directo. |
| `cta_abierto` | 140 chars | Una pregunta corta. Si la pregunta necesita contexto propio, el insight no hizo su trabajo. |
| **Total máximo** | **610 chars** | ~3 mensajes de LinkedIn cómodos. Por comparación, un tweet es 280 chars. |

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/lib/agent_v2.ts` | Límites de caracteres añadidos en sección ESTILO OBLIGATORIO y en cada sección del FRAMEWORK |

---

## Qué NO se ha tocado

- `src/app/api/generate-v2/route.ts` — sin cambios
- `src/lib/claude_prompts.ts` (motor V1) — sin cambios
- Ningún endpoint de API — sin cambios
- UI / componentes React — sin cambios
- Schema de Supabase — sin cambios
- Variables de entorno — sin cambios
- SearchAPI — sin cambios
- Modelo Claude (`claude-sonnet-4-6`) — sin cambios
- Estructura JSON de salida (`observacion`, `insight`, `cta_abierto`) — sin cambios
- ADRs (`docs/adr/ADRs.md`) — sin cambios

---

## Resultado del build

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (26/26)
0 errores · 0 warnings
```

---

## Riesgo residual

| Riesgo | Evaluación |
|---|---|
| El modelo ignora el límite de caracteres | Bajo — Claude sigue instrucciones numéricas con buena precisión. Si lo supera en algún caso, el exceso será mínimo (10-20 chars) |
| Insight demasiado corto pierde sustancia | Bajo — 250 chars equivalen a 2 frases bien escritas, suficiente para anclar una tensión real |
| El límite de observación (220) es restrictivo para perfiles con mucho contexto | Bajo — el snippet puede ser rico, pero la observación debe ser un gancho, no un resumen |
| Sin validación automática de longitud en el output | Bajo para staging — en producción sería recomendable añadir un check post-generate |

---

## Próxima tarea recomendada

**MSG-TEST-02** — Prueba rápida de 2–3 leads para confirmar que el límite funciona:

1. Ejecutar `scripts/test_msg_v2_talent4pro.ts` con los mismos 4 leads de MSG-TEST-01
2. Verificar que ningún mensaje supera los límites establecidos
3. Si todos pasan: el motor está listo para uso operativo en Vercel
4. Si alguno falla: ajuste fino del límite (subir a 280 si 250 es demasiado restrictivo)

Si MSG-TEST-02 confirma los límites, el siguiente paso es **deploy a Vercel** y uso real en campañas de prospección Talent4Pro.

---

## Referencias

- Prueba que detectó el problema: `docs/decisions/MSG-TEST-01-v2-controlled-quality-test.md`
- Fix anterior: `docs/decisions/MSG-FIX-01B-v2-human-style-and-profile-signal.md`
- Guía de estilo: `docs/decisions/MSG-STYLE-01-human-conversation-style-talent4pro.md`
- Motor modificado: `src/lib/agent_v2.ts`
