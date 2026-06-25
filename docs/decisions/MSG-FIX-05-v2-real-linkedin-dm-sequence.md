# MSG-FIX-05: Conversión del Motor V2 a Secuencia Real de DMs de LinkedIn

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Motor de Mensajes · IA · Fix |
| **Afecta a** | `src/lib/agent_v2.ts` (system prompt) |

---

## Problema corregido

El motor V2 generaba tres piezas de análisis separadas (Observación / Insight / CTA Abierto) que, aunque eran correctas como estructuras internas, no eran mensajes reales enviables. Al usarlos como DMs de LinkedIn, el resultado seguía sonando artificial porque cada bloque asumía que el receptor había leído los anteriores.

La raíz del problema era conceptual: el framework pedía al modelo razonar como un analista en tres pasos, en lugar de escribir como una persona que envía tres mensajes en días distintos.

---

## Decisión

Mantener la estructura JSON exacta (`observacion`, `insight`, `cta_abierto`) pero reinterpretar cada campo como un mensaje real e independiente:

| Campo JSON | Antes | Ahora |
|---|---|---|
| `observacion` | Observación de apertura (análisis) | Primer DM completo — se envía tal cual |
| `insight` | Perspectiva de mercado | Follow-up breve si no hay respuesta |
| `cta_abierto` | Pregunta abierta al final | Último toque suave o pregunta de prescripción |

La UI, la base de datos y el endpoint no necesitan cambios — el contrato JSON es el mismo.

---

## Cambios aplicados

### 1. Límites de caracteres actualizados

| Campo | Antes | Ahora | Razón |
|---|---|---|---|
| `observacion` | ≤ 220 | ≤ **260** | El primer DM completo necesita espacio para saludo + observación + pregunta |
| `insight` | ≤ 250 | ≤ **220** | El follow-up debe ser más corto que el primer mensaje |
| `cta_abierto` | ≤ 140 | ≤ **160** | El último toque puede incluir una pequeña frase de contexto + pregunta |

### 2. Sección FRAMEWORK completamente reescrita

El nombre cambia de "FRAMEWORK OBLIGATORIO: Observación → Insight → CTA Abierto" a "SECUENCIA OBLIGATORIA: 3 DMs reales de LinkedIn".

Se añade la regla central: *"Si un campo no puede enviarse como mensaje autónomo por LinkedIn, está mal generado."*

#### MENSAJE 1 (observacion)
- Nuevo: incluye saludo breve ("Buenas," o similar)
- Nuevo: se envía "tal cual", sin necesidad de edición
- Se mantiene: usar señal del perfil si existe, sin pitch, sin mención de Talent4Pro
- Ejemplo actualizado: "Buenas, Toni. Vi que haces web y SEO en Barcelona. ¿Te están empezando a pedir también cosas de IA o automatización, o todavía no mucho?"

#### MENSAJE 2 (insight)
- Nuevo: es un follow-up para cuando no hay respuesta al primero
- Nuevo: aporta contexto humano sobre por qué se escribió
- Nuevo: puede empezar con "Te lo decía porque...", "Lo comento porque...", "Te preguntaba por eso..."
- Se mantiene: prohibiciones de apertura, regla de variedad, sustituciones
- Ejemplo actualizado: "Te lo decía porque estoy hablando con gente de negocio que quiere entender la IA sin meterse a programar. Me interesa ver cómo lo estáis viviendo desde fuera de IT."

#### MENSAJE 3 (cta_abierto)
- Nuevo: es el último contacto en la secuencia
- Nuevo: puede preguntar si conoce a alguien a quien le encaje
- Se mantiene: sin reunión, sin presión
- Ejemplo actualizado: "Y si no es tu caso, ¿te viene alguien a la cabeza a quien le pueda cuadrar algo así?"

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/lib/agent_v2.ts` | Límites de caracteres actualizados; sección FRAMEWORK completamente reescrita como secuencia de 3 DMs reales |

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
- ADRs (`docs/adr/ADRs.md`) — sin cambios
- Lista de palabras prohibidas — mantenida, sin cambios

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
| El modelo puede no entender que el Mensaje 2 se envía días después sin respuesta previa | Bajo — el prompt explica el contexto de uso. Si falla, se ajusta en MSG-FIX-06. |
| El saludo del Mensaje 1 puede resultar repetitivo si el modelo siempre usa "Buenas," | Bajo — el prompt no impone un saludo fijo, solo indica que incluya uno breve. |
| Los caracteres del Mensaje 1 (≤260) pueden ser demasiados para mensajes de conexión LinkedIn (límite 300) | Bajo — 260 chars deja margen. En DMs directos, el límite es mucho mayor. |
| Sin prueba post-cambio | Pendiente — es la siguiente tarea (MSG-TEST-05). |

---

## Próxima tarea recomendada

**MSG-TEST-05** — Prueba real de la secuencia de DMs con 4 leads:

1. Ejecutar `scripts/test_msg_v2_talent4pro.ts`
2. Evaluar si el Mensaje 1 puede enviarse directamente como primer DM
3. Evaluar si el Mensaje 2 funciona como follow-up natural
4. Evaluar si el Mensaje 3 funciona como último toque o pregunta de prescripción
5. Verificar que los tres mensajes son coherentes como secuencia sin ser repetitivos
6. Si 3/4 son APTO → motor listo para uso operativo en Vercel

---

## Referencias

- Prueba que motivó el cambio: `docs/decisions/MSG-TEST-04-v2-final-human-dm-validation.md`
- Guía de estilo: `docs/decisions/MSG-STYLE-02-simple-human-dm-language.md`
- Motor modificado: `src/lib/agent_v2.ts`
