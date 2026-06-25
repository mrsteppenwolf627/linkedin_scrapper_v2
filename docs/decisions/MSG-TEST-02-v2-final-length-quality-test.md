# MSG-TEST-02: Prueba Final de Calidad y Longitud del Motor V2

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Motor de Mensajes · IA · Calidad |
| **Veredicto** | ✅ LISTO PARA DEPLOY |

---

## Objetivo

Verificar que el motor V2, tras los límites de longitud aplicados en MSG-FIX-02, genera mensajes dentro de los límites establecidos y con la calidad de naturalidad definida en MSG-STYLE-01.

---

## Método

- **Script:** `scripts/test_msg_v2_talent4pro.ts` (mismo que MSG-TEST-01)
- **Motor:** `orchestrateV2()` — `claude-sonnet-4-6` con prompt de MSG-FIX-01B + MSG-FIX-02
- **Entorno:** local con `.env.local`
- **Sales goal:** descripción Talent4Pro (mandos intermedios, certificación de liderazgo e IA aplicada)
- **Leads probados:** 4 perfiles con snippets reales (mismos perfiles que MSG-TEST-01 para comparabilidad)

---

## Cumplimiento de límites por lead

| Lead | Rol | observacion | insight | cta_abierto | ≤ Límites |
|---|---|---|---|---|---|
| Lead-A | Director Operaciones, industrial | 208 chars ✅ | 233 chars ✅ | 98 chars ✅ | ✅ Todos OK |
| Lead-B | Manager Transformación, consultoría | 186 chars ✅ | 184 chars ✅ | 93 chars ✅ | ✅ Todos OK |
| Lead-C | Responsable L&D, financiero | 212 chars ✅ | 224 chars ✅ | 103 chars ✅ | ✅ Todos OK |
| Lead-D | Head of Product, tech | 188 chars ✅ | 210 chars ✅ | 86 chars ✅ | ✅ Todos OK |

**Todos los mensajes dentro de los límites.** Ningún campo supera el techo establecido. El margen mínimo es de 8 chars (Lead-A observación: 208 de 220). No hay casos ajustados que sugieran que el modelo está "rozando" el límite artificialmente.

---

## Evaluación de calidad por lead

### Lead-A — Director de Operaciones, sector industrial

**[OBSERVACIÓN]** *(208 chars)*
> Pilotar la digitalización de la cadena de suministro con 15 años en producción y logística es una posición incómoda: tienes más contexto que nadie, pero las decisiones sobre IA casi nunca llegan desde planta.

**[INSIGHT]** *(233 chars)*
> Los directores de operaciones que están liderando estos cambios se encuentran con que su experiencia no tiene un lenguaje común con los equipos de datos. Certificar esas competencias está empezando a resolver esa brecha en industria.

**[CTA ABIERTO]** *(98 chars)*
> ¿En tu caso el reto es más de herramientas, de equipos o de cómo justificar las decisiones arriba?

| Criterio | Resultado |
|---|---|
| Parece escrito por persona real | ✅ |
| Se entiende en < 10 segundos | ✅ |
| Usa señal real del perfil | ✅ (15 años producción, digitalización) |
| Una sola pregunta fácil de responder | ✅ (opciones múltiples naturales) |
| Evita vender directamente | ⚠️ "Certificar esas competencias" en el insight — roza la solución |
| Evita mencionar Talent4Pro | ✅ |
| Evita frases prohibidas | ✅ |
| Evita tono IA/copy comercial | ✅ |
| Puede abrir conversación | ✅ |

**Clasificación: APTO CON RETOQUES** — El insight menciona "Certificar" en mensaje 2. Contextualmente es una observación de mercado, no un pitch, pero un receptor sensible puede percibirlo como una señal de venta anticipada.

---

### Lead-B — Manager de Transformación Digital, consultoría de pymes

**[OBSERVACIÓN]** *(186 chars)*
> Con pymes, el reto no suele ser la herramienta sino convencer al dueño de que merece el cambio. Y cuando logras eso, el siguiente techo es demostrar que tú también evolucionas con ellas.

**[INSIGHT]** *(184 chars)*
> Lo que está moviendo a muchos perfiles como el tuyo no es el ERP de turno sino saber articular criterio sobre IA aplicada al negocio. Ahí es donde el MBA ya no es suficiente aval solo.

**[CTA ABIERTO]** *(93 chars)*
> ¿Estás notando que tus clientes te preguntan más por IA o todavía es territorio de los de IT?

| Criterio | Resultado |
|---|---|
| Parece escrito por persona real | ✅ |
| Se entiende en < 10 segundos | ✅ |
| Usa señal real del perfil | ✅ (ERP, MBA, pymes, IA aplicada al negocio) |
| Una sola pregunta fácil de responder | ✅ |
| Evita vender directamente | ✅ Sin mención de solución |
| Evita mencionar Talent4Pro | ✅ |
| Evita frases prohibidas | ✅ |
| Evita tono IA/copy comercial | ✅ — "el MBA ya no es suficiente aval solo" es genuinamente humano |
| Puede abrir conversación | ✅ Alta probabilidad |

**Clasificación: APTO** — El mejor mensaje de la prueba. Observación específica, insight directo, CTA contextualizado en la realidad del lead.

---

### Lead-C — Responsable de Desarrollo de Talento, servicios financieros

**[OBSERVACIÓN]** *(212 chars)*
> En banca y servicios financieros, el gap entre lo que los managers hacen hoy y lo que necesitan saber de IA está llegando más rápido que los programas de desarrollo. Y no es un gap técnico, es un gap de criterio.

**[INSIGHT]** *(224 chars)*
> El problema que están viendo muchos equipos de L&D del sector es que el upskilling en IA para directivos no encaja bien en formación genérica: los managers necesitan validar que saben aplicarlo, no solo que lo han escuchado.

**[CTA ABIERTO]** *(103 chars)*
> ¿Estás encontrando que esa brecha de criterio es lo más difícil de cerrar, o el reto principal es otro?

| Criterio | Resultado |
|---|---|
| Parece escrito por persona real | ✅ |
| Se entiende en < 10 segundos | ✅ |
| Usa señal real del perfil | ✅ (L&D, banca, upskilling, mandos) |
| Una sola pregunta fácil de responder | ✅ |
| Evita vender directamente | ✅ |
| Evita mencionar Talent4Pro | ✅ |
| Evita frases prohibidas | ✅ |
| Evita tono IA/copy comercial | ✅ |
| Puede abrir conversación | ✅ |

**Clasificación: APTO** — El insight es preciso para un perfil de L&D y el CTA recoge exactamente la tensión planteada en la observación. Secuencia coherente.

---

### Lead-D — Head of Product, empresa tecnológica

**[OBSERVACIÓN]** *(188 chars)*
> Con equipos distribuidos y IA generativa entrando fuerte en el ciclo de producto, el rol de Head of Product está mutando más rápido que la mayoría de job descriptions que circulan por ahí.

**[INSIGHT]** *(210 chars)*
> Lo que están viendo muchos PMs senior es que el gap ya no es técnico: es de criterio, de marcos para decidir qué automatizar y qué no, y de cómo liderar equipos cuando la IA hace parte del trabajo de discovery.

**[CTA ABIERTO]** *(86 chars)*
> ¿En tu caso ya estás redefiniendo cómo trabajáis o todavía estáis en modo exploración?

| Criterio | Resultado |
|---|---|
| Parece escrito por persona real | ✅ |
| Se entiende en < 10 segundos | ✅ |
| Usa señal real del perfil | ✅ (equipos distribuidos, IA generativa, discovery) |
| Una sola pregunta fácil de responder | ✅ — bifurcado "ya / todavía" muy natural |
| Evita vender directamente | ✅ |
| Evita mencionar Talent4Pro | ✅ |
| Evita frases prohibidas | ✅ |
| Evita tono IA/copy comercial | ✅ — el más conversacional de los 4 |
| Puede abrir conversación | ✅ |

**Clasificación: APTO** — Tres mensajes perfectamente encadenados. El CTA retoma el "todavía" de la observación. Es el ejemplo de referencia del motor.

---

## Resultados agregados

| Lead | Clasificación | Dentro de límites | Uso snippet | CTA calidad |
|---|---|---|---|---|
| Lead-A (industrial) | APTO CON RETOQUES | ✅ | ✅ | ✅ |
| Lead-B (consultoría) | **APTO** | ✅ | ✅ | ✅ |
| Lead-C (L&D financiero) | **APTO** | ✅ | ✅ | ✅ |
| Lead-D (tech) | **APTO** | ✅ | ✅ | ✅ |

**3 APTO · 1 APTO CON RETOQUES · 0 NO APTO**

---

## Comparativa MSG-TEST-01 vs MSG-TEST-02

| Métrica | MSG-TEST-01 | MSG-TEST-02 | Mejora |
|---|---|---|---|
| Insights dentro de límite | 1/4 (Lead-D, 337 chars) | 4/4 | ✅ |
| Insight más largo | 488 chars (Lead-C) | 233 chars (Lead-A) | −255 chars |
| Mensajes APTO sin retoques | 1/4 | 3/4 | +2 |
| Talent4Pro mencionado | 0/4 | 0/4 | — |
| Frases prohibidas | 0/4 | 0/4 | — |
| CTAs conversacionales | 4/4 | 4/4 | — |

---

## Diagnóstico de naturalidad

El mayor cambio entre MSG-TEST-01 y MSG-TEST-02 no es solo la longitud — es que mensajes más cortos fuerzan al agente a elegir el ángulo más directo. En MSG-TEST-01, el agente intentaba desarrollar el diagnóstico completo. En MSG-TEST-02, elige el gancho más afilado y para.

El resultado es que los mensajes suenan más como algo que le diría un conocido en LinkedIn que como un análisis de consultor. Ese es exactamente el objetivo de MSG-STYLE-01.

**Patrón detectado:** el insight de Lead-A menciona "Certificar esas competencias" — el único caso en 8 mensajes (4 leads × 2 pruebas) donde el agente se aproxima a mencionar la solución en el Mensaje 2. No es un pitch directo, pero merece atención en una campaña real.

---

## Veredicto final

**✅ LISTO PARA DEPLOY**

El motor V2 genera mensajes dentro de los límites establecidos, con tono conversacional, señal real del perfil y sin mención de Talent4Pro ni CTAs de reunión. La calidad es suficiente para iniciar una campaña de prospección real.

**Condición operativa:** el usuario debe revisar el Mensaje 2 en casos donde el rol del lead es directamente "certificador" (RRHH, L&D), ya que el agente puede aproximarse más a mencionar la solución. No es un bloqueador — es una revisión de 5 segundos antes de enviar.

---

## Mejor ejemplo de referencia (Lead-D, completo)

Este es el mensaje de referencia que demuestra el estilo correcto:

> **Observación:** Con equipos distribuidos y IA generativa entrando fuerte en el ciclo de producto, el rol de Head of Product está mutando más rápido que la mayoría de job descriptions que circulan por ahí.

> **Insight:** Lo que están viendo muchos PMs senior es que el gap ya no es técnico: es de criterio, de marcos para decidir qué automatizar y qué no, y de cómo liderar equipos cuando la IA hace parte del trabajo de discovery.

> **CTA:** ¿En tu caso ya estás redefiniendo cómo trabajáis o todavía estáis en modo exploración?

Total: 484 chars en 3 mensajes. Ninguno supera el techo. Puede enviarse directamente.

---

## Próxima tarea recomendada

**DEPLOY-02** — Despliegue del motor V2 actualizado a Vercel:

1. Verificar que el commit de MSG-FIX-02 está en `master`
2. `vercel deploy --prod` (o push a master si auto-deploy está configurado)
3. Probar una búsqueda + generación real desde el dashboard en producción
4. Validar que los mensajes generados en Vercel cumplen los mismos límites

Después del deploy, el motor V2 puede usarse operativamente para campañas de prospección Talent4Pro.

---

## Referencias

- Fix de longitud: `docs/decisions/MSG-FIX-02-v2-insight-length-limit.md`
- Primera prueba: `docs/decisions/MSG-TEST-01-v2-controlled-quality-test.md`
- Guía de estilo: `docs/decisions/MSG-STYLE-01-human-conversation-style-talent4pro.md`
- Motor evaluado: `src/lib/agent_v2.ts`
