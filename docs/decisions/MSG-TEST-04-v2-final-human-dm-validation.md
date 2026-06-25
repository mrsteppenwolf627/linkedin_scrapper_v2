# MSG-TEST-04: Validación Final de Naturalidad del Motor V2 tras MSG-FIX-04

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Motor de Mensajes · IA · Calidad |
| **Veredicto** | ✅ LISTO PARA DEPLOY OPERATIVO |

---

## Objetivo

Validar si el motor V2, tras MSG-FIX-04 (eliminación de patrones repetitivos y lenguaje de consultor), genera mensajes que superan el criterio de naturalidad estricto de MSG-STYLE-02: "¿podría haberlo escrito una persona desde el móvil en 2 minutos?"

---

## Método

- **Script:** `scripts/test_msg_v2_talent4pro.ts` (versionado en REPO-CLEAN-01)
- **Motor:** `orchestrateV2()` — `claude-sonnet-4-6` con prompt de MSG-FIX-01B + FIX-02 + FIX-03 + FIX-04
- **Entorno:** local con `.env.local`
- **Leads:** 4 perfiles ficticios representativos del target Talent4Pro (mismos de pruebas anteriores)

---

## Mensajes generados y evaluación completa

### Lead-A — Director de Operaciones, sector industrial

**[OBSERVACIÓN]** *(170 chars)*
> Pilotando digitalización en cadena de suministro con 15 años en planta es una combinación que no se ve mucho. La mayoría llega a ese punto desde IT, no desde operaciones.

**[INSIGHT]** *(174 chars)*
> Lo que me encuentro bastante es que la gente que viene de planta sabe exactamente dónde la IA puede ayudar, pero no siempre tiene fácil explicarlo hacia arriba o hacia fuera.

**[CTA ABIERTO]** *(57 chars)*
> ¿Te está pasando algo así o en tu caso está más resuelto?

#### Nivel 1 — Criterios técnicos

| Criterio | Resultado |
|---|---|
| observacion ≤ 220 chars | ✅ 170 |
| insight ≤ 250 chars | ✅ 174 |
| cta_abierto ≤ 140 chars | ✅ 57 |
| No menciona Talent4Pro | ✅ |
| No pide reunión | ✅ |
| Una sola pregunta | ✅ |
| Palabras prohibidas | ✅ Ninguna detectada |
| Patrones de apertura prohibidos | ✅ "Lo que me encuentro bastante" ≠ "Lo que estoy viendo es que" |

#### Nivel 2 — Naturalidad real

| Criterio | Resultado |
|---|---|
| Podría escribirlo desde el móvil | ✅ |
| Suena como DM real | ✅ |
| Castellano sencillo | ✅ |
| Frases cortas | ✅ |
| Evita palabras de consultor | ✅ |
| Evita sonar demasiado inteligente | ✅ |
| Evita tono académico | ✅ |
| Evita tono de post de LinkedIn | ✅ |
| CTA fácil de responder | ✅ "¿está más resuelto?" — una o dos palabras |
| Usa señal real del perfil | ✅ "pilotando", "15 años en planta", "operaciones vs IT" |

**Clasificación: APTO** — Todos los criterios superados. La observación es específica y el cierre de la observación ("La mayoría llega desde IT, no desde operaciones") es una observación genuinamente humana y no obvia. El CTA de 57 chars es el más corto de los cuatro y perfectamente directo.

---

### Lead-B — Manager de Transformación Digital, consultoría pymes

**[OBSERVACIÓN]** *(171 chars)*
> Curioso lo que comentas de ir más allá del ERP y el CRM. En pymes eso suele chocar con que el cliente quiere resultados rápidos y no quiere oír hablar de más herramientas.

**[INSIGHT]** *(194 chars)*
> Me da la sensación de que el salto ahora mismo no es de herramienta sino de cómo el consultor demuestra que entiende el negocio, no solo la tecnología. Y eso es más difícil de explicar en un CV.

**[CTA ABIERTO]** *(73 chars)*
> ¿Te está costando diferenciarte en ese sentido o no lo ves como problema?

#### Nivel 1 — Criterios técnicos

| Criterio | Resultado |
|---|---|
| observacion ≤ 220 chars | ✅ 171 |
| insight ≤ 250 chars | ✅ 194 |
| cta_abierto ≤ 140 chars | ✅ 73 |
| No menciona Talent4Pro | ✅ |
| No pide reunión | ✅ |
| Una sola pregunta | ✅ |
| Palabras prohibidas | ✅ Ninguna en el texto del mensaje |
| Patrones de apertura prohibidos | ✅ "Me da la sensación de que" ≠ ninguno de los prohibidos |

#### Nivel 2 — Naturalidad real

| Criterio | Resultado |
|---|---|
| Podría escribirlo desde el móvil | ✅ |
| Suena como DM real | ✅ |
| Castellano sencillo | ✅ |
| Frases cortas | ✅ "Y eso es más difícil de explicar en un CV." — frase de golpe |
| Evita palabras de consultor | ✅ |
| Evita sonar demasiado inteligente | ✅ |
| Evita tono académico | ✅ |
| Evita tono de post de LinkedIn | ✅ |
| CTA fácil de responder | ✅ Bifurcado natural |
| Usa señal real del perfil | ✅ "ERP y el CRM" directos del snippet |

**Clasificación: APTO** — El mejor mensaje de toda la sesión de pruebas. "Curioso lo que comentas de ir más allá del ERP y el CRM" es la apertura más natural y humana generada hasta ahora. Referencia directa al contenido del snippet sin nombrarlo. El insight es limpio y el CTA muy específico.

---

### Lead-C — Responsable de Desarrollo de Talento, servicios financieros

**[OBSERVACIÓN]** *(145 chars)*
> En banca y servicios financieros, los managers de equipo están empezando a necesitar entender cosas de IA que hace un año ni estaban en el radar.

**[INSIGHT]** *(154 chars)*
> Lo complicado no es encontrar formación técnica — hay de sobra. Lo difícil es que sea útil para alguien que lidera personas, no para alguien que programa.

**[CTA ABIERTO]** *(53 chars)*
> ¿Lo estás viendo tú también o depende mucho del área?

#### Nivel 1 — Criterios técnicos

| Criterio | Resultado |
|---|---|
| observacion ≤ 220 chars | ✅ 145 (era 226 en MSG-TEST-03) |
| insight ≤ 250 chars | ✅ 154 (era 186 y con palabras prohibidas) |
| cta_abierto ≤ 140 chars | ✅ 53 |
| No menciona Talent4Pro | ✅ |
| No pide reunión | ✅ |
| Una sola pregunta | ✅ |
| Palabras prohibidas | ✅ Ninguna — "lidera personas" ≠ "liderar cambios" |
| Patrones de apertura prohibidos | ✅ "Lo complicado no es..." ≠ ninguno de los prohibidos |

#### Nivel 2 — Naturalidad real

| Criterio | Resultado |
|---|---|
| Podría escribirlo desde el móvil | ✅ |
| Suena como DM real | ✅ |
| Castellano sencillo | ✅ |
| Frases cortas | ✅ "hay de sobra" — tres palabras, contundente |
| Evita palabras de consultor | ✅ |
| Evita sonar demasiado inteligente | ✅ |
| Evita tono académico | ✅ |
| Evita tono de post de LinkedIn | ✅ |
| CTA fácil de responder | ✅ "depende mucho del área" — bifurcado natural |
| Usa señal real del perfil | ✅ "banca y servicios financieros", "managers de equipo" |

**Clasificación: APTO** — Mejora radical respecto a MSG-TEST-03, donde fue NO APTO (226 chars, "programas de desarrollo"). Ahora está a 145 chars, sin palabras prohibidas, y el insight con el contraste "hay de sobra / lo difícil es" es genuinamente humano.

---

### Lead-D — Head of Product, empresa tecnológica

**[OBSERVACIÓN]** *(215 chars)*
> Llevas un tiempo pensando en cómo los PMs deberían moverse con la IA generativa. Es una pregunta que no tiene respuesta fácil, especialmente cuando encima tienes equipos distribuidos que van a velocidades distintas.

**[INSIGHT]** *(169 chars)*
> Me da la sensación de que lo difícil no es entender la tecnología en sí. Es saber qué se le puede pedir a la IA en product y qué sigue siendo tuyo como líder del equipo.

**[CTA ABIERTO]** *(65 chars)*
> ¿Lo estás resolviendo sobre la marcha o ya tienes algo más claro?

#### Nivel 1 — Criterios técnicos

| Criterio | Resultado |
|---|---|
| observacion ≤ 220 chars | ✅ 215 (dentro del límite, margen 5 chars) |
| insight ≤ 250 chars | ✅ 169 |
| cta_abierto ≤ 140 chars | ✅ 65 |
| No menciona Talent4Pro | ✅ |
| No pide reunión | ✅ |
| Una sola pregunta | ✅ |
| Palabras prohibidas | ✅ Ninguna — "líder del equipo" ≠ "liderar cambios" |
| Patrones de apertura prohibidos | ✅ "Me da la sensación de que" ≠ ninguno de los prohibidos |

#### Nivel 2 — Naturalidad real

| Criterio | Resultado |
|---|---|
| Podría escribirlo desde el móvil | ✅ |
| Suena como DM real | ✅ |
| Castellano sencillo | ✅ |
| Frases cortas | ⚠️ Observación con una cláusula compleja final |
| Evita palabras de consultor | ✅ |
| Evita sonar demasiado inteligente | ✅ |
| Evita tono académico | ✅ |
| Evita tono de post de LinkedIn | ✅ |
| CTA fácil de responder | ✅ Bifurcado simple: "sobre la marcha / algo más claro" |
| Usa señal real del perfil | ✅ "PMs", "IA generativa", "equipos distribuidos" |
| Repetición de apertura con Lead-B | ⚠️ Mismo inicio de insight: "Me da la sensación de que" |

**Clasificación: APTO CON RETOQUES** — El mensaje funciona bien en aislamiento pero el insight repite la misma estructura de apertura que Lead-B ("Me da la sensación de que"). En una campaña donde distintos leads recibieran mensajes del mismo motor, la repetición sería visible. La observación a 215 chars tiene además una cláusula subordinada algo elaborada ("especialmente cuando encima tienes equipos distribuidos que van a velocidades distintas"). El CTA es excelente.

---

## Resultados agregados

| Lead | Nivel 1 | Nivel 2 | Clasificación |
|---|---|---|---|
| Lead-A (industrial) | ✅ Todo OK | ✅ Todo OK | **APTO** |
| Lead-B (consultoría) | ✅ Todo OK | ✅ Todo OK | **APTO** |
| Lead-C (L&D financiero) | ✅ Todo OK | ✅ Todo OK | **APTO** |
| Lead-D (tech) | ✅ Todo OK | ⚠️ Repetición con Lead-B | APTO CON RETOQUES |

**3 APTO · 1 APTO CON RETOQUES · 0 NO APTO**

---

## Comparativa MSG-TEST-03 vs MSG-TEST-04

| Métrica | MSG-TEST-03 | MSG-TEST-04 | Tendencia |
|---|---|---|---|
| APTO sin retoques | 1/4 | **3/4** | ↑↑ |
| APTO CON RETOQUES | 2/4 | 1/4 | ↑ |
| NO APTO | 1/4 | **0/4** | ↑↑ |
| Palabras prohibidas en mensajes | 2 casos | **0 casos** | ✅ |
| Excesos de límite de caracteres | 1 (226 chars) | **0** | ✅ |
| Repetición de patrón de apertura | 4/4 usaban "Lo que estoy viendo" | 2/4 usan "Me da la sensación" | Mejora parcial |
| Lead-C (el caso más problemático) | NO APTO (226 chars, palabras prohibidas) | **APTO** (145 chars, limpio) | ↑↑↑ |

---

## Frases artificiales detectadas

Solo una en esta prueba:

- **"especialmente cuando encima tienes equipos distribuidos que van a velocidades distintas"** (Lead-D observación) — cláusula subordinada algo larga y elaborada. No viola ninguna regla pero bordea el límite de naturalidad. Sin esta cláusula, la observación sería más limpia.

No hay frases de consultor, académicas ni de landing page en ningún mensaje.

---

## Patrones repetitivos detectados

- **"Me da la sensación de que..."**: Lead-B y Lead-D abren el insight con esta estructura. Es diferente del patrón prohibido "Lo que estoy viendo es que", pero es igualmente reconocible en una campaña.

**Causa raíz:** el modelo genera cada mensaje de forma independiente, sin memoria de los mensajes anteriores en el mismo batch. No puede saber qué estructura usó para Lead-B cuando genera Lead-D. Este es un límite arquitectónico, no un problema del prompt.

**Impacto práctico:** bajo. En una campaña real, cada receptor recibe UN mensaje, no la secuencia completa. La repetición solo sería visible para el remitente al revisar todos los drafts.

---

## Veredicto final

**✅ LISTO PARA DEPLOY OPERATIVO**

El motor supera el umbral establecido (3/4 o 4/4 APTO). Los mensajes son notablemente más humanos, simples y directos que en todas las pruebas anteriores. Ningún mensaje usa palabras prohibidas. Ningún mensaje excede los límites de caracteres. Ningún mensaje menciona Talent4Pro ni pide reunión.

El único punto pendiente (repetición de "Me da la sensación de que") no es un bloqueador — tiene bajo impacto práctico y origen arquitectónico.

**El motor V2 está listo para usarse en campañas de prospección Talent4Pro en Vercel.**

---

## Próxima tarea recomendada

**DEPLOY-02** — Confirmar que los cambios del motor V2 están en Vercel y probar una búsqueda + generación real desde el dashboard en producción:

1. Verificar que el commit más reciente (`master`) está desplegado en https://linkedin-scrapper-v2.vercel.app
2. Ejecutar una búsqueda real de perfiles desde el dashboard
3. Generar mensajes con el `sales_goal` canónico de Talent4Pro
4. Revisar 2-3 mensajes generados contra los criterios de MSG-STYLE-02
5. Si pasan → el motor está operativo. Documentar en `CONTEXT.md`.

---

## Referencias

- Fix aplicado: `docs/decisions/MSG-FIX-04-v2-remove-repetitive-consultant-language.md`
- Prueba anterior: `docs/decisions/MSG-TEST-03-v2-real-human-dm-quality-test.md`
- Guía de estilo: `docs/decisions/MSG-STYLE-02-simple-human-dm-language.md`
- Script de prueba: `scripts/test_msg_v2_talent4pro.ts`
- Motor evaluado: `src/lib/agent_v2.ts`
