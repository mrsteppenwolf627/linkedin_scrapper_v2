# MSG-STYLE-01: Guía de Estilo de Conversación Humana para Mensajes Talent4Pro

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | ACTIVA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Motor de Mensajes · Estilo · Producto |
| **Afecta a** | `src/lib/agent_v2.ts` (system prompt) · futura tarea MSG-FIX-01B |

---

## Objetivo de la guía

Definir cómo deben sonar los mensajes de prospección de LinkedIn para Talent4Pro antes de modificar el motor V2.

Esta guía **no es un manual de copywriting de ventas**. Es una referencia de tono y criterio para que el motor de IA genere mensajes que parezcan escritos por una persona real, capaces de abrir conversación con candidatos potenciales o prescriptores para la certificación Talent4Pro.

---

## Qué problema resuelve

El motor V2 actual (`src/lib/agent_v2.ts`) genera mensajes correctos en estructura (Observación → Insight → CTA Abierto) pero con tono de outreach B2B genérico. Sin contexto específico de Talent4Pro ni criterios de naturalidad, el agente produce mensajes que:

- Suenan como redactados por un consultor de ventas
- Usan vocabulario corporativo que activa el filtro de spam del receptor
- Intentan impresionar en lugar de conectar
- Hacen preguntas demasiado amplias o demasiado formales

El resultado es un mensaje técnicamente correcto pero humanamente ineficaz.

---

## Principios de estilo

### 1. Debe parecer escrito manualmente

No existe ninguna señal visual, de longitud o de estructura que indique que el mensaje viene de una herramienta. La referencia es: ¿podría esta persona haber escrito esto desde su móvil en 2 minutos?

### 2. Debe sonar como LinkedIn real, no como email marketing

LinkedIn tiene una cultura de conversación directa y breve. Los mensajes largos, bien estructurados y con múltiples párrafos se detectan como automatizados antes de leerlos.

### 3. Debe ser breve

Un primer mensaje de prospección en LinkedIn no supera los 3–4 frases. Si necesita más para explicarse, el mensaje tiene un problema de concepto, no de redacción.

### 4. Debe usar lenguaje normal

El receptor es un profesional con experiencia. Hablarle como si no lo supiera, o usar jerga corporativa que él mismo escribe en su LinkedIn, produce distancia. El objetivo es sonar como alguien que le habla de igual a igual.

### 5. Debe abrir conversación, no vender

El primer mensaje no menciona precios, plazos, plazas, duración ni compromiso. Su única función es obtener una respuesta — cualquier respuesta. Una respuesta de "no me interesa" es mejor que el silencio, porque abre la posibilidad de preguntar quién sí podría encajar.

### 6. No cierra reunión en el primer contacto

"¿Tienes 15 minutos?" en un primer mensaje es un CTA transaccional que presupone interés antes de que exista. Genera rechazo. La reunión se pide después de dos o tres intercambios.

### 7. No suena a academia, bootcamp ni formación genérica

Talent4Pro es una certificación profesional acreditada, no un curso online. El tono debe reflejar eso: habla a un profesional sobre su desarrollo profesional, no a un estudiante sobre un programa de formación.

### 8. No menciona precio, matrícula ni duración en los primeros mensajes

Estos datos generan objeciones antes de que exista interés. Se comparten cuando el receptor las pide, no antes.

### 9. Puede dirigirse a candidato directo o a prescriptor

Un prescriptor es alguien que no es el candidato directo pero puede conocer a alguien que lo sea. El patrón cambia ligeramente (ver sección de patrones), pero el tono es el mismo.

### 10. Usa preguntas naturales, no CTAs comerciales

La pregunta cierra el mensaje. Debe ser fácil de responder con una frase corta. No puede ser retórica. No puede ser una lista de dos preguntas mezcladas. Debe poder responderse con "sí", "no", "depende" o "cuéntame más".

---

## Frases prohibidas

Las siguientes frases activan el reconocimiento de spam del receptor. El motor V2 no debe usarlas bajo ningún concepto:

| Frase | Por qué se prohíbe |
|---|---|
| "He visto tu perfil y me parece muy interesante" | Apertura robótica universal — llega a miles de personas iguales |
| "Dado tu background" | Sonido de template — el receptor sabe que es genérico |
| "Explorar sinergias" | Buzzword vacío — no significa nada concreto |
| "Agendar una llamada" | CTA transaccional prematuro |
| "Impulsar tu carrera" | Lenguaje de motivación genérica — no creíble |
| "Transformación digital de alto impacto" | Jerga corporativa — activa filtro de rechazo |
| "Oportunidad única" | Tono de publicidad — antipático en contexto profesional |
| "Te presento una certificación" | Venta directa en el primer contacto |
| "Creo que encajas perfectamente" | Halago no merecido — el receptor sabe que no nos conocemos |
| "Me gustaría compartirte más información" | Fórmula de vendedor — predecible y vacía |
| "¿Tienes 15 minutos esta semana?" | CTA de reunión prematuro |

---

## Patrones de mensaje recomendados

Los siguientes patrones son referencias de estructura y tono. El motor debe adaptarlos al contexto real del lead (empresa, rol, sector) — no copiarlos literalmente.

### Patrón 1 — Pregunta directa a candidato

> "Buenas, [nombre]. Una pregunta rápida: con tu perfil de [rol/área], ¿estás viendo presión por entender más de IA aplicada en empresas o todavía no te ha llegado esa ola?"

**Cuándo usarlo:** perfil con cargo de mando intermedio o directivo en empresa con actividad en transformación.
**Por qué funciona:** pregunta concreta, fácil de responder, no presupone interés, abre conversación sin mencionar Talent4Pro.

---

### Patrón 2 — Prescriptor

> "Buenas, [nombre]. Te escribo porque estoy buscando perfiles que estén cerca de consultoría, procesos o transformación digital y quieran moverse hacia IA aplicada. ¿Te viene alguien a la cabeza a quien le pueda encajar?"

**Cuándo usarlo:** perfil con rol directivo, RRHH, desarrollo organizativo o consultor con equipo.
**Por qué funciona:** delega la decisión de si encaja, reduce la presión sobre el receptor, activa el instinto de ayuda en lugar del filtro de rechazo.

---

### Patrón 3 — Observación ligera sobre el área del lead

> "Buenas, [nombre]. He visto que vienes de [área concreta]. Estoy hablando con perfiles parecidos porque muchos están intentando acercarse a IA aplicada sin convertirse en programadores. ¿En tu caso también te está pasando o nada que ver?"

**Cuándo usarlo:** cuando hay señal real del perfil (empresa conocida, sector en transformación, rol de negocio en empresa tech).
**Por qué funciona:** usa contexto real del lead, da una razón concreta para contactar, formula la pregunta de forma que el "no" es una respuesta igualmente válida y esperada.

---

### Patrón 4 — Exploración sin venta

> "Buenas, [nombre]. Estoy validando algo relacionado con perfiles de negocio que quieren dar el salto a consultoría/IA aplicada. Por tu experiencia en [área], ¿esto te suena como una necesidad real o lo ves todavía lejano?"

**Cuándo usarlo:** cuando no hay señal fuerte del perfil y se está testando resonancia con el tema.
**Por qué funciona:** posiciona al remitente como alguien que "está validando", no vendiendo. Esto reduce resistencia. La pregunta binaria es fácil de responder.

---

## Criterios de buen mensaje

Un mensaje cumple los criterios si supera todos estos puntos:

- [ ] Parece escrito por una persona, no generado por IA
- [ ] Se entiende en menos de 10 segundos
- [ ] No menciona la certificación, el producto ni el precio
- [ ] No fuerza reunión
- [ ] Usa al menos una señal real del perfil del lead (empresa, sector, rol o área)
- [ ] Hace exactamente una pregunta — ni cero ni dos
- [ ] La pregunta puede responderse con una frase corta
- [ ] No produce rechazo inmediato al leerlo
- [ ] Podría recibir como respuesta: "sí", "depende", "cuéntame" o "conozco a alguien"

---

## Criterios de mal mensaje

Un mensaje falla si cumple cualquiera de estos puntos:

- [ ] Suena demasiado perfecto o pulido
- [ ] Parece generado por una herramienta
- [ ] Usa tono de consultor genérico
- [ ] Contiene cualquiera de las frases prohibidas
- [ ] Intenta impresionar con vocabulario corporativo
- [ ] Menciona Talent4Pro, la certificación o el programa en el primer contacto
- [ ] Pide reunión o llamada
- [ ] Hace más de una pregunta
- [ ] Tiene más de 4–5 frases
- [ ] Usa estructura de tres párrafos bien delimitados (señal de template)

---

## Cómo aplicar esta guía al motor V2

Esta guía debe incorporarse al **system prompt de `src/lib/agent_v2.ts`** como una sección adicional antes de la lista de prohibiciones actuales. La sección debe:

1. Explicar que el objetivo del mensaje es **abrir conversación**, no vender una certificación
2. Definir el **tono esperado**: conversacional, directo, breve, como si lo escribiera una persona desde LinkedIn
3. Incluir los **patrones de referencia** como ejemplos de registro (no como plantillas a copiar)
4. Reforzar las **frases prohibidas** actuales con las específicas de Talent4Pro
5. Añadir el **criterio de buen mensaje** como checklist interno del agente antes de entregar el JSON

El system prompt actual ya tiene la estructura correcta. La guía de estilo es una **capa adicional de criterio** que transforma al agente de "copywriter B2B genérico" en "redactor de mensajes de apertura para captación educativa en LinkedIn".

---

## Próxima tarea recomendada

**MSG-FIX-01B** — Aplicar la guía de estilo humano al system prompt del motor V2:

1. Abrir `src/lib/agent_v2.ts`
2. Añadir al system prompt:
   - Sección de contexto: qué es Talent4Pro y qué tipo de candidato se busca
   - Sección de tono: los principios de esta guía (breve, natural, sin pitch)
   - Sección de patrones: 2–3 patrones de referencia como ejemplos de registro
   - Sección de prohibiciones adicionales: las frases prohibidas de esta guía que no están en los ADRs actuales
3. En `src/app/api/generate-v2/route.ts`: pasar `raw_google_snippet` como `posts_recientes[0]` (fix de MSG-AUDIT-01 #1)
4. Verificar con `npm run build` que no hay errores
5. Commit: `feat(agent): align V2 prompt with Talent4Pro human conversation style`

Estas dos tareas (contexto Talent4Pro + snippet) son el cambio mínimo necesario para que el motor V2 produzca mensajes comercialmente útiles para captación de alumnos.

---

## Referencias

- Auditoría del motor: `docs/decisions/MSG-AUDIT-01-message-engine-audit-talent4pro.md`
- Objetivo comercial: `docs/decisions/DOC-BASE-01-objetivo-comercial-talent4pro.md`
- ADRs del agente (tono, prohibiciones, framework): `docs/adr/ADRs.md`
- Motor V2: `src/lib/agent_v2.ts`
- Endpoint V2: `src/app/api/generate-v2/route.ts`
