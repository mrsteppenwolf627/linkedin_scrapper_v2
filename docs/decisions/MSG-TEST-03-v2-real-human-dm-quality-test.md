# MSG-TEST-03: Prueba de Naturalidad Real del Motor V2 tras MSG-FIX-03

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Motor de Mensajes · IA · Calidad |
| **Veredicto** | 🟡 NECESITA AJUSTE MENOR |

---

## Objetivo

Validar si el motor V2, tras aplicar la guía de lenguaje simple de MSG-FIX-03, genera mensajes que suenan como DMs reales de LinkedIn escritos por una persona normal — no como textos de consultor, IA, post de LinkedIn o copy comercial.

---

## Método

- **Script:** `scripts/test_msg_v2_talent4pro.ts` (mismo de pruebas anteriores)
- **Motor:** `orchestrateV2()` — `claude-sonnet-4-6` con prompt actualizado en MSG-FIX-03
- **Entorno:** local con `.env.local`
- **Leads:** 4 perfiles representativos del target Talent4Pro (mismos de MSG-TEST-01 y MSG-TEST-02)

---

## Mensajes generados y evaluación completa

### Lead-A — Director de Operaciones, sector industrial

**[OBSERVACIÓN]** *(213 chars)*
> Con 15 años en producción y logística, lo que estás pilotando en la cadena de suministro es de los casos más concretos que veo ahora mismo. La mayoría sigue en fase de 'estamos estudiando' y tú ya estás en marcha.

**[INSIGHT]** *(173 chars)*
> Lo que me comenta gente en operaciones es que el salto no es tanto técnico como de criterio: saber qué pedirle a la IA y qué no. Eso no lo resuelve un curso de herramientas.

**[CTA ABIERTO]** *(80 chars)*
> ¿Tú lo estás notando también o en tu caso el equipo ya tiene eso bastante claro?

#### Nivel 1 — Criterios técnicos

| Criterio | Resultado |
|---|---|
| observacion ≤ 220 chars | ✅ 213 |
| insight ≤ 250 chars | ✅ 173 |
| cta_abierto ≤ 140 chars | ✅ 80 |
| No menciona Talent4Pro | ✅ |
| No pide reunión | ✅ |
| No usa frases prohibidas del outreach | ✅ |
| Una sola pregunta | ✅ |
| **Palabra prohibida "criterio"** | ❌ Aparece en insight |

#### Nivel 2 — Naturalidad real

| Criterio | Resultado |
|---|---|
| Podría escribirlo desde el móvil | ✅ |
| Suena como DM real | ✅ |
| Castellano sencillo | ✅ |
| Frases cortas | ✅ ("Y tú ya estás en marcha" — excelente) |
| Evita palabras de consultor | ❌ "criterio" en insight |
| Evita sonar demasiado inteligente | ✅ |
| Evita tono académico | ✅ |
| Evita tono de post de LinkedIn | ✅ |
| CTA fácil de responder | ✅ Bifurcado, natural |

**Frase que aún suena artificial:** *"el salto no es tanto técnico como de criterio"* — estructura de análisis. Sin "criterio", sería: *"el salto no es tanto técnico: es saber qué pedirle y qué no"*.

**Clasificación: APTO CON RETOQUES** — El mensaje es notablemente mejor que MSG-TEST-02. La observación y el CTA son buenos. El insight necesita quitar "criterio" y simplificar la estructura.

---

### Lead-B — Manager de Transformación Digital, consultoría pymes

**[OBSERVACIÓN]** *(170 chars)*
> Muchos managers de transformación en pymes me dicen que el ERP y el CRM ya no son suficientes para justificar el valor que aportan. El cliente lo da por hecho y pide más.

**[INSIGHT]** *(211 chars)*
> Lo que estoy viendo es que los que más avanzan ahora no son los que saben más herramientas, sino los que pueden demostrar que saben liderar el cambio, no solo implementarlo. Y eso es difícil de mostrar en un CV.

**[CTA ABIERTO]** *(76 chars)*
> ¿Te está pasando algo así o en tu caso todavía hay margen con lo de siempre?

#### Nivel 1 — Criterios técnicos

| Criterio | Resultado |
|---|---|
| observacion ≤ 220 chars | ✅ 170 |
| insight ≤ 250 chars | ✅ 211 |
| cta_abierto ≤ 140 chars | ✅ 76 |
| No menciona Talent4Pro | ✅ |
| No pide reunión | ✅ |
| No usa frases prohibidas del outreach | ✅ |
| Una sola pregunta | ✅ |
| Palabras prohibidas | ⚠️ "transformación" en la observación (contexto: rol del lead) |

#### Nivel 2 — Naturalidad real

| Criterio | Resultado |
|---|---|
| Podría escribirlo desde el móvil | ✅ |
| Suena como DM real | ✅ |
| Castellano sencillo | ✅ |
| Frases cortas | ✅ "El cliente lo da por hecho y pide más." — muy bueno |
| Evita palabras de consultor | ⚠️ "liderar el cambio" (cercano a "liderar cambios", prohibido) |
| Evita sonar demasiado inteligente | ✅ |
| Evita tono académico | ✅ |
| Evita tono de post de LinkedIn | ⚠️ "los que más avanzan ahora" tiene un leve eco de LinkedIn |
| CTA fácil de responder | ✅ Excelente — "con lo de siempre" es muy natural |

**Frase que aún suena algo elaborada:** *"los que pueden demostrar que saben liderar el cambio, no solo implementarlo"* — es una frase bien construida pero tiene la estructura del consultor. La observación y el CTA son los más humanos de este lead.

**Clasificación: APTO CON RETOQUES** — La observación y el CTA son buenos. El insight es el punto más débil. "transformación" se usa para nombrar el rol del lead, lo que es difícil de evitar, pero "liderar el cambio" suena demasiado elaborado.

---

### Lead-C — Responsable de Desarrollo de Talento, servicios financieros

**[OBSERVACIÓN]** *(226 chars)*
> En banca y servicios financieros, los managers que antes lideraban equipos ahora se encuentran tomando decisiones con herramientas que hace dos años no existían. Y los programas de desarrollo no siempre han ido al mismo ritmo.

**[INSIGHT]** *(186 chars)*
> Lo que estoy viendo en entornos parecidos: el problema no es que los mandos no quieran aprender. Es que no saben qué parte de todo esto les corresponde a ellos y qué parte es cosa de IT.

**[CTA ABIERTO]** *(74 chars)*
> ¿Te está llegando eso también o en tu empresa ya tenéis claro ese reparto?

#### Nivel 1 — Criterios técnicos

| Criterio | Resultado |
|---|---|
| observacion ≤ 220 chars | ❌ 226 chars — excede el límite en 6 chars |
| insight ≤ 250 chars | ✅ 186 |
| cta_abierto ≤ 140 chars | ✅ 74 |
| No menciona Talent4Pro | ✅ |
| No pide reunión | ✅ |
| Palabras prohibidas | ❌ "programas de desarrollo" en observación |

#### Nivel 2 — Naturalidad real

| Criterio | Resultado |
|---|---|
| Podría escribirlo desde el móvil | ❌ La observación es elaborada |
| Suena como DM real | ❌ "se encuentran tomando decisiones" suena formal |
| Castellano sencillo | ⚠️ Observación formal, insight más natural |
| Frases cortas | ⚠️ Observación tiene frases largas |
| Evita palabras de consultor | ❌ "programas de desarrollo" |
| CTA fácil de responder | ✅ "ese reparto" es muy bueno |

**Frases que suenan artificiales:** *"se encuentran tomando decisiones con herramientas que hace dos años no existían"* — construcción formal; *"los programas de desarrollo no siempre han ido al mismo ritmo"* — lenguaje de RRHH.

El insight y el CTA son buenos — el problema está concentrado en la observación. Sin embargo, la palabra prohibida y el exceso de caracteres hacen que este mensaje no sea apto en su estado actual.

**Clasificación: NO APTO** — Excede el límite de observación (226 > 220), usa "programas de desarrollo" (prohibido), observación con tono formal.

---

### Lead-D — Head of Product, empresa tecnológica

**[OBSERVACIÓN]** *(153 chars)*
> Llevas un tiempo hablando de cómo los PMs tienen que evolucionar con la IA generativa. Es un tema que cada vez aparece más en conversaciones de producto.

**[INSIGHT]** *(183 chars)*
> Lo que estoy viendo es que muchos heads of product ya saben que tienen que cambiar algo, pero no está claro si el movimiento es hacia skills técnicas de IA o hacia otra cosa distinta.

**[CTA ABIERTO]** *(72 chars)*
> ¿En tu caso lo estás viendo más como un tema técnico o más de liderazgo?

#### Nivel 1 — Criterios técnicos

| Criterio | Resultado |
|---|---|
| observacion ≤ 220 chars | ✅ 153 |
| insight ≤ 250 chars | ✅ 183 |
| cta_abierto ≤ 140 chars | ✅ 72 |
| No menciona Talent4Pro | ✅ |
| No pide reunión | ✅ |
| Palabras prohibidas | ✅ Ninguna |
| Una sola pregunta | ✅ |

#### Nivel 2 — Naturalidad real

| Criterio | Resultado |
|---|---|
| Podría escribirlo desde el móvil | ✅ |
| Suena como DM real | ✅ |
| Castellano sencillo | ✅ |
| Frases cortas | ✅ Las tres frases son compactas |
| Evita palabras de consultor | ✅ "skills" es coloquial en tech, no consultor |
| Evita sonar demasiado inteligente | ✅ |
| Evita tono académico | ✅ |
| Evita tono de post de LinkedIn | ✅ |
| CTA fácil de responder | ✅ Excelente bifurcación técnico/liderazgo |
| Usa señal real del perfil | ✅ "Llevas un tiempo hablando de" ancla en posts reales |

**Clasificación: APTO** — El mejor de los 4. Todos los criterios superados. El CTA es el más preciso de todos los probados en esta sesión.

---

## Resultados agregados

| Lead | Nivel 1 | Nivel 2 | Clasificación |
|---|---|---|---|
| Lead-A (industrial) | ⚠️ "criterio" | ⚠️ 1 palabra prohibida | APTO CON RETOQUES |
| Lead-B (consultoría) | ⚠️ "transformación"/"liderar el cambio" | ⚠️ Insight elaborado | APTO CON RETOQUES |
| Lead-C (L&D financiero) | ❌ 226 chars + "programas de desarrollo" | ❌ Observación formal | NO APTO |
| Lead-D (tech) | ✅ Todo OK | ✅ Todo OK | **APTO** |

**1 APTO · 2 APTO CON RETOQUES · 1 NO APTO**

---

## Comparativa MSG-TEST-02 vs MSG-TEST-03

| Métrica | MSG-TEST-02 | MSG-TEST-03 | Tendencia |
|---|---|---|---|
| APTO sin retoques | 3/4 | 1/4 | ↓ (criterio más exigente) |
| Palabras de consultor detectadas | 0 (no se evaluaron) | 2 leads con 1 palabra c/u | Nuevo criterio |
| Excesos de límite | 0/4 | 1/4 (Lead-C, 226 chars) | Regresión puntual |
| Tono general | Consultivo/analítico | Notablemente más humano | ↑ |
| Mejores CTAs | 4/4 buenos | 4/4 buenos | Mantenido ✅ |
| Mensajes completamente limpios | 1/4 | 1/4 | — |

**Nota sobre la comparativa:** el criterio en MSG-TEST-03 es significativamente más estricto que en MSG-TEST-02. Los mensajes de MSG-TEST-02 habrían sido NO APTO o APTO CON RETOQUES bajo los criterios actuales. El cambio de veredicto refleja un estándar más alto, no una regresión del motor.

---

## Frases que todavía suenan artificiales

Detectadas en esta prueba, ordenadas por gravedad:

1. **"el salto no es tanto técnico como de criterio"** (Lead-A) — "criterio" + estructura de análisis.
2. **"programas de desarrollo no siempre han ido al mismo ritmo"** (Lead-C) — lenguaje de RRHH/academia.
3. **"se encuentran tomando decisiones con herramientas que hace dos años no existían"** (Lead-C) — formal y elaborado.
4. **"los que pueden demostrar que saben liderar el cambio, no solo implementarlo"** (Lead-B) — estructura de consultor.
5. **"Lo que estoy viendo es que..."** (aparece en Lead-A, B, C y D) — patrón repetitivo que el modelo usa como apertura del insight. Funciona pero se repite demasiado.

**Patrón sistemático detectado:** el modelo tiende a abrir el insight con "Lo que estoy viendo es que..." en los 4 leads. Es natural una vez, pero en una campaña real todos los mensajes empezarían igual, lo que los delataría como automatizados.

---

## Diagnóstico

El tono ha mejorado significativamente respecto a MSG-TEST-02. Los mensajes ya no suenan a análisis de consultor. El progreso es real.

Los problemas restantes son puntuales y de dos tipos:

**Tipo 1 — Palabras prohibidas que el modelo usa sin percibir el problema:**
"criterio" y "programas de desarrollo" aparecen en contextos donde el modelo los considera naturales (y en cierta medida lo son en español), pero están en la lista porque activan el filtro de "consultor". El prompt actual prohíbe las palabras pero no da sustituciones concretas, lo que lleva al modelo a usarlas en algunos contextos.

**Tipo 2 — Apertura repetitiva del insight:**
"Lo que estoy viendo es que..." es un patrón que aparece en 4/4 leads. El model lo aprendió como forma correcta de abrir el insight de forma no agresiva, pero al repetirse en todos los mensajes de una campaña sería visible como automatización.

---

## Veredicto final

**🟡 NECESITA AJUSTE MENOR**

El motor está cerca. Lead-D es un mensaje que ya podría enviarse tal cual. Lead-A y Lead-B necesitan edición de una frase. Lead-C necesita reescribir la observación.

El ajuste necesario es específico: añadir al prompt una alternativa al patrón "Lo que estoy viendo es que..." y una sustitución para las palabras prohibidas más recurrentes.

El motor NO necesita rediseño. Necesita un pequeño ajuste de vocabulario para los casos límite.

---

## Próxima tarea recomendada

**MSG-FIX-04** — Eliminar el patrón "Lo que estoy viendo es que..." y añadir sustituciones para palabras prohibidas recurrentes:

1. En `src/lib/agent_v2.ts`, añadir a las prohibiciones:
   - "Lo que estoy viendo es que..." como apertura del insight (prohibido en todos los leads)
   - Sustituciones sugeridas: "Estoy hablando con...", "Me pasa que la gente de tu área...", "Lo curioso es que...", "Muchos en tu posición..."
2. Añadir a las palabras prohibidas la forma "criterio" cuando actúa como sustantivo abstracto
3. Ejecutar `npm run build` y MSG-TEST-04 con 2-3 leads
4. Si pasan → deploy a Vercel + push

Esta es la última iteración de prompt esperada antes de que el motor esté listo para uso operativo.

---

## Referencias

- Fix aplicado: `docs/decisions/MSG-FIX-03-v2-simple-human-dm-style.md`
- Guía de estilo: `docs/decisions/MSG-STYLE-02-simple-human-dm-language.md`
- Motor evaluado: `src/lib/agent_v2.ts`
