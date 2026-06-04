# Error Report — Auditoría de Mensajes
> Fecha: 2026-06-04
> Archivo auditado: `C:\Users\a.alarcon\Desktop\Cursor projects\linkedin scrapper v2\mensajes_listos.json`
> Metodología: Guía Proyectos Grandes — Tres Pilares (Brevedad · Naturalidad · Cero Pitch)

---

## Resumen Ejecutivo

| Métrica | Valor |
|---|---|
| Leads auditados | 3 |
| Mensajes totales | 9 |
| 🔴 FALLOS | **6** |
| 🟡 ADVERTENCIAS | **1** |
| 🟢 OK | 2 |
| Tasa de aprobación | 22% |

### Veredicto por Lead

| Lead | Empresa | Rol | Veredicto |
|---|---|---|---|
| Carlos Mendoza | Iberdrola | Senior Energy Consultant | 🔴 FALLO |
| Laura Sánchez | Endesa | Directora de Desarrollo de Negocio | 🔴 FALLO |
| Alejandro Torres | Repsol | Head of Renewable Energy Projects | 🔴 FALLO |

---

## Detalle por Lead y Pilar

### Lead: Carlos Mendoza · Iberdrola · Senior Energy Consultant

**Veredicto global:** 🔴 FALLO

#### Mensaje: `observacion` — 🟡 ADVERTENCIA (17 palabras)

> He notado que trabajas como Senior Energy Consultant en Iberdrola, una empresa líder en el sector energético.

**BREVEDAD** 🟢 OK

**NATURALIDAD** 🟡 ADVERTENCIA
- ⚠️ "empresa líder" (halago genérico sin sustancia)
  - Fragmento: "...empresa líder..."

**CERO_PITCH** 🟢 OK

---

#### Mensaje: `insight` — 🔴 FALLO (42 palabras)

> La transición hacia energías más sostenibles está impulsando cambios significativos en la industria. Muchas empresas están encontrando oportunidades en la optimización de sus procesos y la implementación de nuevas tecnologías que no solo reducen costos, sino que también mejoran la eficiencia energética.

**BREVEDAD** 🟢 OK

**NATURALIDAD** 🟡 ADVERTENCIA
- ⚠️ "cambios significativos" (vaguedad corporativa)
  - Fragmento: "...cambios significativos..."

**CERO_PITCH** 🔴 FALLO
- ⚠️ "optimización de sus procesos" (consulting pitch)
  - Fragmento: "...optimización de sus procesos..."
- ⚠️ "no solo X sino también Y" (estructura de pitch de ventas)
  - Fragmento: "...no solo reducen costos, sino que también..."
- ⚠️ "muchas empresas están..." (estadística sin respaldo — ADR-004)
  - Fragmento: "...Muchas empresas están..."
- ⚠️ "eficiencia operativa/energética" (buzzword de consultoría)
  - Fragmento: "...eficiencia energética..."

---

#### Mensaje: `cta_abierto` — 🟢 OK (22 palabras)

> Me gustaría saber tu opinión sobre cómo están abordando estos desafíos en Iberdrola. ¿Crees que hay áreas donde se podrían implementar mejoras?

**BREVEDAD** 🟢 OK

**NATURALIDAD** 🟢 OK

**CERO_PITCH** 🟢 OK

---

### Lead: Laura Sánchez · Endesa · Directora de Desarrollo de Negocio

**Veredicto global:** 🔴 FALLO

#### Mensaje: `observacion` — 🔴 FALLO (26 palabras)

> Hola Laura, he visto que como Directora de Desarrollo de Negocio en Endesa, estás en una posición clave para impulsar iniciativas estratégicas en el sector energético.

**BREVEDAD** 🟢 OK

**NATURALIDAD** 🔴 FALLO
- ⚠️ "Hola [nombre]" al inicio (ADR-005: LinkedIn lo añade)
  - Fragmento: "...Hola Laura..."
- ⚠️ "he visto que" (referencia al perfil LinkedIn — ADR-004)
  - Fragmento: "...he visto que..."
- ⚠️ "posición clave" (halago genérico — ADR-004)
  - Fragmento: "...posición clave..."

**CERO_PITCH** 🟢 OK

---

#### Mensaje: `insight` — 🔴 FALLO (41 palabras)

> En un entorno donde la sostenibilidad y la innovación son prioridades, muchas empresas están encontrando oportunidades al diversificar sus ofertas. Esto no solo mejora la competitividad, sino que también responde a la creciente demanda de soluciones energéticas más limpias y eficientes.

**BREVEDAD** 🟢 OK

**NATURALIDAD** 🔴 FALLO
- ⚠️ "en un entorno donde" (cliché prohibido — ADR-003)
  - Fragmento: "...En un entorno donde..."

**CERO_PITCH** 🔴 FALLO
- ⚠️ "soluciones energéticas" (pitch implícito)
  - Fragmento: "...soluciones energ..."
- ⚠️ "diversificar sus ofertas" (consulting pitch)
  - Fragmento: "...diversificar sus ofertas..."
- ⚠️ "no solo X sino también Y" (estructura de pitch de ventas)
  - Fragmento: "...no solo mejora la competitividad, sino que también..."
- ⚠️ "muchas empresas están..." (estadística sin respaldo — ADR-004)
  - Fragmento: "...muchas empresas están..."
- ⚠️ "creciente demanda" (market-speak sin datos)
  - Fragmento: "...creciente demanda..."

---

#### Mensaje: `cta_abierto` — 🟢 OK (21 palabras)

> Me gustaría saber, ¿cuáles son los principales desafíos que enfrentas actualmente en el desarrollo de nuevas oportunidades de negocio en Endesa?

**BREVEDAD** 🟢 OK

**NATURALIDAD** 🟢 OK

**CERO_PITCH** 🟢 OK

---

### Lead: Alejandro Torres · Repsol · Head of Renewable Energy Projects

**Veredicto global:** 🔴 FALLO

#### Mensaje: `observacion` — 🔴 FALLO (21 palabras)

> Hola Alejandro, he notado que estás liderando los proyectos de energía renovable en Repsol, un área clave para la transición energética.

**BREVEDAD** 🟢 OK

**NATURALIDAD** 🔴 FALLO
- ⚠️ "Hola [nombre]" al inicio (ADR-005: LinkedIn lo añade)
  - Fragmento: "...Hola Alejandro..."
- ⚠️ "área clave" (cliché corporativo)
  - Fragmento: "...área clave..."

**CERO_PITCH** 🟢 OK

---

#### Mensaje: `insight` — 🔴 FALLO (42 palabras)

> La innovación en este sector es constante y la integración de nuevas tecnologías puede ser un diferenciador significativo. Muchas empresas están explorando formas de optimizar sus proyectos para no solo cumplir con regulaciones, sino también para mejorar su sostenibilidad y eficiencia operativa.

**BREVEDAD** 🟢 OK

**NATURALIDAD** 🟢 OK

**CERO_PITCH** 🔴 FALLO
- ⚠️ "diferenciador [X]" (sales buzzword)
  - Fragmento: "...diferenciador significativo..."
- ⚠️ "no solo X sino también Y" (estructura de pitch de ventas)
  - Fragmento: "...no solo cumplir con regulaciones, sino también..."
- ⚠️ "muchas empresas están..." (estadística sin respaldo — ADR-004)
  - Fragmento: "...Muchas empresas están..."
- ⚠️ "eficiencia operativa/energética" (buzzword de consultoría)
  - Fragmento: "...eficiencia operativa..."

---

#### Mensaje: `cta_abierto` — 🔴 FALLO (23 palabras)

> Me gustaría saber tu perspectiva sobre los principales desafíos que enfrentas en la implementación de estos proyectos. ¿Te parece si conversamos sobre ello?

**BREVEDAD** 🟢 OK

**NATURALIDAD** 🟢 OK

**CERO_PITCH** 🔴 FALLO
- ⚠️ "¿Te parece si conversamos?" (CTA de reunión — ADR-004)
  - Fragmento: "... ¿Te parece si conversamos..."

---

## Patrones Recurrentes (Top Ofensores)

| Patrón | Ocurrencias | Severidad |
|---|---|---|
| "no solo X sino también Y" (estructura de pitch de ventas) | 3 | 🔴 |
| "muchas empresas están..." (estadística sin respaldo — ADR-004) | 3 | 🔴 |
| "eficiencia operativa/energética" (buzzword de consultoría) | 2 | 🟡 |
| "Hola [nombre]" al inicio (ADR-005: LinkedIn lo añade) | 2 | 🔴 |
| "empresa líder" (halago genérico sin sustancia) | 1 | 🟡 |
| "cambios significativos" (vaguedad corporativa) | 1 | 🟡 |
| "optimización de sus procesos" (consulting pitch) | 1 | 🔴 |
| "he visto que" (referencia al perfil LinkedIn — ADR-004) | 1 | 🔴 |
| "posición clave" (halago genérico — ADR-004) | 1 | 🟡 |
| "en un entorno donde" (cliché prohibido — ADR-003) | 1 | 🔴 |
| "soluciones energéticas" (pitch implícito) | 1 | 🔴 |
| "diversificar sus ofertas" (consulting pitch) | 1 | 🔴 |
| "creciente demanda" (market-speak sin datos) | 1 | 🟡 |
| "área clave" (cliché corporativo) | 1 | 🟡 |
| "diferenciador [X]" (sales buzzword) | 1 | 🔴 |
| "¿Te parece si conversamos?" (CTA de reunión — ADR-004) | 1 | 🔴 |

## Optimización del System Prompt del Agente de Redacción

Los patrones detectados son sistemáticos y corregibles con instrucciones más precisas.
A continuación se propone el **diff** del System Prompt a aplicar en la siguiente iteración.

---

### PATCH 1 — Prohibiciones ampliadas para Mensaje 1 (Observación)

Añadir a la sección `### MENSAJE 1 — OBSERVACIÓN`:

```diff
+ - PROHIBIDO: restatecer simplemente el cargo y empresa del lead sin añadir contexto propio.
+   ❌ "He notado que trabajas como X en Y" → solo repite lo que ya sabe el lead.
+   ✅ Conecta el cargo con una tensión real del sector o una decisión concreta observable.
+ - PROHIBIDO: calificativos genéricos sobre la empresa:
+   ❌ "empresa líder", "empresa de referencia", "una de las principales empresas"
+ - PROHIBIDO: calificativos genéricos sobre el puesto:
+   ❌ "posición clave", "área clave", "rol estratégico" sin sustancia concreta.
```

---

### PATCH 2 — Prohibición del patrón de pitch "no solo X sino también Y"

Añadir a la sección `### MENSAJE 2 — INSIGHT`:

```diff
+ - PROHIBIDO: la construcción "no solo X sino (que) también Y". Es una estructura
+   de ventas reconocible que rompe la naturalidad y activa la guardia del lector.
+   ❌ "no solo reducen costos, sino que también mejoran la eficiencia"
+   ❌ "no solo cumplir con regulaciones, sino también para mejorar la sostenibilidad"
+   ✅ Usa una sola afirmación directa con el dato o ángulo más relevante para este lead.
+ - PROHIBIDO: generalizaciones sin sujeto concreto:
+   ❌ "Muchas empresas están..." → ¿cuáles? Si no puedes nombrarlas, no lo uses.
+   ❌ "En un entorno donde..." → apertura de cliché de consultoría.
+   ✅ Ancla el insight en algo específico del sector del lead: normativa, evento, tendencia nombrada.
```

---

### PATCH 3 — CTA debe contener exactamente una pregunta, abierta y sin pedir reunión

Añadir a la sección `### MENSAJE 3 — CTA ABIERTO`:

```diff
+ - OBLIGATORIO: exactamente UNA sola pregunta. Ni más ni menos.
+   Si el mensaje contiene dos oraciones, la primera es contexto; la segunda es la pregunta.
+ - PROHIBIDO: preguntas que inviten a una conversación, llamada o reunión:
+   ❌ "¿Te parece si conversamos sobre ello?"
+   ❌ "¿Podemos hablar esta semana?"
+   ❌ "¿Tienes un momento para comentarlo?"
+   ✅ La pregunta debe invitar a compartir una OPINIÓN o PERSPECTIVA, no una agenda:
+   ✅ "¿Cómo estáis abordando X en [empresa] desde vuestra posición?"
+   ✅ "¿Qué peso le estáis dando a Y en vuestra estrategia actual?"
```

---

### PATCH 4 — Añadir lista negra de buzzwords a la sección de Restricciones Globales

```diff
+ ## LISTA NEGRA DE TÉRMINOS (prohibidos en cualquier mensaje)
+ Los siguientes términos activan la guardia del lector porque suenan a plantilla de CRM:
+
+ | Término prohibido | Por qué | Alternativa |
+ |---|---|---|
+ | "diferenciador" | sales buzzword | describe el beneficio concreto en su lugar |
+ | "soluciones energéticas" | pitch implícito | nombra la tecnología o proceso específico |
+ | "optimización de procesos" | consulting speak | especifica qué proceso y qué palanca |
+ | "eficiencia operativa" | genérico | ¿eficiencia en qué? ¿medida cómo? |
+ | "empresa líder" | halago sin sustancia | omite el adjetivo o usa un dato concreto |
+ | "innovación constante" | cliché | nombra la innovación específica |
+ | "creciente demanda" | market-speak | ¿demanda de qué? ¿medida por quién? |
```

---

### PATCH 5 — Regla de especificidad (anti-genericidad)

Añadir como regla global al inicio del system prompt:

```diff
+ ## REGLA DE ESPECIFICIDAD (aplica a los 3 mensajes)
+ Antes de redactar, pregúntate: "¿Podría enviar este mensaje a cualquier Director de X
+ en cualquier empresa del sector, o es específico SOLO para este lead?"
+ Si la respuesta es "cualquiera", reescríbelo.
+ Un mensaje genérico tiene CERO valor. El lead lo ignora porque siente que es spam.
+ Ancla siempre en: nombre de la empresa + rol específico + contexto sectorial concreto.
```

---

## Conclusión

Los mensajes auditados fueron generados por el modelo anterior (`gpt-4o-mini`).
Los 5 patches propuestos deben aplicarse al system prompt de `claude-sonnet-4-6`
en `scripts/orchestrate.ts` antes de la próxima ejecución de `npm run test:drafting:live`.

La regla de especificidad (Patch 5) es la más impactante: elimina la causa raíz
de la mayoría de los fallos detectados (observaciones que solo repiten cargo+empresa,
insights con "muchas empresas están...").
