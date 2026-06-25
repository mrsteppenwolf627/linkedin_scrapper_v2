# MSG-FIX-03: Estilo DM Simple y Humano Aplicado al Motor V2

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Motor de Mensajes · IA · Fix |
| **Resuelve** | Diagnóstico de MSG-STYLE-02 — tono consultivo/analítico en los mensajes generados |
| **Afecta a** | `src/lib/agent_v2.ts` (system prompt) |

---

## Problema corregido

Los mensajes de MSG-TEST-02 cumplían los límites de longitud pero sonaban a consultor de LinkedIn: lenguaje elaborado, frases analíticas, vocabulario corporativo. El motor no generaba DMs — generaba análisis de sector en formato corto.

MSG-STYLE-02 identificó que el problema era el **registro del lenguaje**, no la longitud. Esta tarea aplica esa corrección al system prompt.

---

## Cambios aplicados

### 1. Rol del agente (primera línea)

**Antes:**
> "Eres un redactor especializado en mensajes de LinkedIn para apertura de conversación con candidatos y prescriptores para una certificación profesional dirigida a mandos intermedios y directivos."

**Después:**
> "Escribes DMs de LinkedIn cortos y directos para abrir conversación con posibles candidatos o prescriptores de una certificación profesional. Tu única tarea: que el mensaje parezca escrito por una persona real desde el móvil, en 2 minutos, sin pensar demasiado."

El cambio traslada el foco de "redactor especializado" (tono de profesional) a "alguien que escribe desde el móvil" (tono de persona). Esa referencia mental cambia el registro de todo lo que sigue.

---

### 2. Sección ESTILO OBLIGATORIO → REGLA CENTRAL DE ESTILO

La sección anterior listaba criterios abstractos ("natural", "conversacional", "sin pitch"). La nueva sección establece un test concreto:

> "¿podría una persona haberlo escrito desde el móvil en 2 minutos, sin pensar demasiado? Si el mensaje requiere vocabulario especial, estructura elaborada o tono analítico → está mal."

Se añaden reglas concretas: dos frases por bloque, castellano sencillo, sin tono de consultor/académico/landing, mejor imperfecto que pulido.

Los **patrones de referencia** se sustituyen por los ejemplos de MSG-STYLE-02:
- "Buenas. Una pregunta rápida: ¿en tu empresa ya os están pidiendo cosas de IA o todavía está verde?"
- "Te escribo porque hablo con gente de operaciones que quiere entender la IA sin meterse a programar. ¿Te pasa algo parecido?"
- "Con tu perfil, ¿estás viendo que los clientes preguntan más por IA o todavía no mucho?"
- "Estoy moviendo algo para gente que quiere entender la IA desde negocio, no desde código. ¿Te suena alguien a quien le pueda cuadrar?"

---

### 3. Sección PALABRAS Y EXPRESIONES PROHIBIDAS

La sección anterior tenía 11 frases de outreach genérico. Se amplía con el vocabulario de consultor/analista identificado en MSG-STYLE-02:

**Añadidas (20 términos):**
`gap · criterio · marcos · articular · validar competencias · certificar competencias · job descriptions · discovery · upskilling · IA aplicada al negocio · transformación · liderar cambios · brecha · territorio de IT · está mutando · programas de desarrollo · aval · perfiles como el tuyo · los [roles] que... · lo que están viendo muchos...`

Estas palabras no violan los ADRs existentes pero producen exactamente el tono que se quiere evitar.

---

### 4. Sección FRAMEWORK — simplificación del lenguaje

Los tres mensajes del framework (Observación, Insight, CTA) mantienen los mismos límites de caracteres pero el lenguaje de las instrucciones se simplifica para evitar que el modelo adopte el tono de las propias instrucciones.

Ejemplos de cambio:

| Antes | Después |
|---|---|
| "Conecta el cargo del lead con una tensión real o decisión observable en su sector." | "Una frase o dos. Algo concreto del sector o del rol del lead. No un análisis — una observación corta." |
| "Perspectiva de valor conectada a la situación del lead." | "Una idea simple sobre lo que está pasando en su entorno. Sin palabras de consultor." |
| "Ancla en normativa, evento sectorial o palanca específica." | "Di una cosa concreta y para." |

Los ejemplos del CTA también se actualizan con el registro correcto:
- "¿Te está llegando esto también o todavía no?"
- "¿Lo estás viendo o todavía está lejos en tu entorno?"

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/lib/agent_v2.ts` | 4 bloques del system prompt actualizados: rol, sección de estilo, palabras prohibidas, framework |

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
- `posts_recientes` fix de MSG-FIX-01B — sin cambios

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
| El modelo puede usar términos prohibidos que no están en la lista | Bajo — la regla del "móvil en 2 minutos" actúa como filtro genérico más allá de la lista |
| Mensajes demasiado simples pueden perder el gancho específico del perfil | Bajo — la REGLA DE ESPECIFICIDAD sigue activa; el modelo sigue instruido a anclar en empresa+rol+snippet |
| Sin prueba post-cambio, no podemos confirmar la mejora | Pendiente — es la siguiente tarea (MSG-TEST-03) |

---

## Próxima tarea recomendada

**MSG-TEST-03** — Prueba de naturalidad con 3-4 leads antes de deploy:

1. Ejecutar `scripts/test_msg_v2_talent4pro.ts` con los mismos leads de referencia
2. Evaluar cada mensaje contra el criterio central: "¿podría haberlo escrito una persona desde el móvil?"
3. Verificar que ningún mensaje usa palabras de la lista prohibida
4. Si 3/4 son APTO → motor listo para deploy a Vercel
5. Si hay fallos → identificar el patrón y documentar para MSG-FIX-04 si fuera necesario

---

## Referencias

- Guía de estilo aplicada: `docs/decisions/MSG-STYLE-02-simple-human-dm-language.md`
- Prueba que motivó el cambio: `docs/decisions/MSG-TEST-02-v2-final-length-quality-test.md`
- Fix anterior: `docs/decisions/MSG-FIX-01B-v2-human-style-and-profile-signal.md`
- Motor modificado: `src/lib/agent_v2.ts`
