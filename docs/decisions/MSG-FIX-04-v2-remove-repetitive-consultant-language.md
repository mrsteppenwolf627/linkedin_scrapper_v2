# MSG-FIX-04: Eliminación de Patrones Repetitivos y Lenguaje Residual de Consultor en Motor V2

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Motor de Mensajes · IA · Fix |
| **Resuelve** | Problemas detectados en `MSG-TEST-03` |
| **Afecta a** | `src/lib/agent_v2.ts` (system prompt) |

---

## Problema corregido

MSG-TEST-03 identificó dos problemas residuales tras MSG-FIX-03:

1. **Patrón de apertura repetitivo:** el modelo abría el insight con "Lo que estoy viendo es que..." en 4 de 4 leads. En una campaña real, todos los mensajes empezarían igual y serían identificados inmediatamente como automatizados.

2. **Palabras prohibidas que persistían:** "criterio" (Lead-A) y "programas de desarrollo" (Lead-C) seguían apareciendo a pesar de estar en la lista de prohibiciones, porque la lista anterior era incompleta o no incluía sus formas alternativas ("programa de desarrollo" en singular, "liderar el cambio" vs "liderar cambios").

---

## Cambios aplicados

### Cambio 1 — Lista de palabras prohibidas ampliada

Se añaden o formalizan estas entradas:

| Añadido | Por qué |
|---|---|
| `marco` | Forma singular ausente (solo estaba "marcos") |
| `liderar el cambio` | Forma singular — "liderar cambios" estaba pero no esta forma |
| `programa de desarrollo` | Forma singular — solo estaba el plural |
| `estrategia` / `estratégico` | Vocabulario de dirección que eleva el registro innecesariamente |
| `reto` | Eufemismo de consultor para "problema" |
| `evolución profesional` | Lenguaje de RRHH/academia |
| `competencias` | Vocabulario de RRHH — suena a evaluación de desempeño |
| `certificar` / `validar` | Pitch implícito de la solución cuando se usan como verbos aislados |

---

### Cambio 2 — Prohibición explícita de patrones de apertura del insight

Se añade en la sección MENSAJE 2 (INSIGHT) una lista de patrones de inicio prohibidos:

```
- "Lo que estoy viendo es que..."
- "Estoy viendo que..."
- "Lo que están viendo muchos..."
- "Cada vez más perfiles..."
- "Muchos profesionales..."
- "El reto no es..."
- "El problema es..."
```

Estos patrones producen mensajes de estructura idéntica entre leads, lo que los identifica como automatizados, y además tienen tono de analista o consultor, no de persona.

---

### Cambio 3 — Regla de variedad

Se añade en la sección MENSAJE 2 (INSIGHT):

> "No uses la misma estructura de frase en dos mensajes distintos. Si el mensaje parece una plantilla, está mal. Cada mensaje debe parecer escrito de forma manual para esa persona concreta. Si dos mensajes podrían empezar igual, uno está mal."

---

### Cambio 4 — Sustituciones concretas

Se añaden 4 ejemplos de transformación en la sección MENSAJE 2 (INSIGHT) para que el modelo tenga referencia de cómo reformular sin lenguaje de consultor:

| Versión consultor | Versión DM humano |
|---|---|
| "Lo que estoy viendo es que muchos perfiles necesitan criterio sobre IA." | "Me da la sensación de que mucha gente quiere entender la IA sin complicarse con la parte técnica." |
| "Los programas de desarrollo no siempre han ido al mismo ritmo." | "Muchas empresas todavía van un poco tarde con esto." |
| "El reto es liderar el cambio." | "Lo difícil es bajarlo a cosas reales del día a día." |
| "Necesitan articular criterio sobre IA aplicada al negocio." | "Necesitan saber cuándo la IA ayuda de verdad y cuándo es humo." |

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/lib/agent_v2.ts` | Lista de palabras prohibidas ampliada; sección MENSAJE 2 con patrones prohibidos, regla de variedad y sustituciones |

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
- Estructura JSON de salida — sin cambios
- ADRs (`docs/adr/ADRs.md`) — sin cambios
- Límites de caracteres (220/250/140) — sin cambios

---

## Resultado del build

```
✓ Compiled successfully in 3.2s
✓ Generating static pages (26/26)
0 errores · 0 warnings
```

---

## Riesgo residual

| Riesgo | Evaluación |
|---|---|
| El modelo puede encontrar otras aperturas repetitivas no listadas | Bajo — la regla de variedad actúa como principio general, no solo sobre los patrones listados |
| Palabras prohibidas que no están en la lista | Bajo — el vocabulario de consultor tiene un núcleo limitado; las ampliaciones sucesivas lo han cubierto bien |
| Las sustituciones pueden volverse el nuevo patrón | Bajo — son ejemplos de registro, no plantillas obligatorias |
| Sin prueba post-cambio | Pendiente — es la siguiente tarea (MSG-TEST-04) |

---

## Próxima tarea recomendada

**MSG-TEST-04** — Prueba final con 3-4 leads antes de aceptar el motor como listo para producción:

1. Ejecutar `scripts/test_msg_v2_talent4pro.ts`
2. Comprobar que ningún insight empieza con los patrones prohibidos
3. Comprobar que ningún mensaje usa palabras de la lista ampliada
4. Verificar variedad de apertura entre leads
5. Si 3/4 o 4/4 son APTO → motor listo para deploy operativo en Vercel y uso en campaña

---

## Referencias

- Prueba que detectó los problemas: `docs/decisions/MSG-TEST-03-v2-real-human-dm-quality-test.md`
- Guía de estilo base: `docs/decisions/MSG-STYLE-02-simple-human-dm-language.md`
- Fix anterior: `docs/decisions/MSG-FIX-03-v2-simple-human-dm-style.md`
- Motor modificado: `src/lib/agent_v2.ts`
