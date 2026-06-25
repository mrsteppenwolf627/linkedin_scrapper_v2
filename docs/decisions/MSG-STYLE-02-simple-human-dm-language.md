# MSG-STYLE-02: Lenguaje Simple y Humano para DMs de LinkedIn

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | ACTIVA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Motor de Mensajes · Estilo · Producto |
| **Afecta a** | `src/lib/agent_v2.ts` (system prompt) · futura tarea MSG-FIX-03 |
| **Sustituye** | Criterios de tono de `MSG-STYLE-01` — esta guía es más restrictiva |

---

## Problema detectado

Los mensajes generados en MSG-TEST-02 cumplen los límites de longitud pero siguen sonando artificiales. El receptor los identificaría como generados por IA no por la longitud, sino por el **tono**: son demasiado analíticos, demasiado elaborados y demasiado "consultor de LinkedIn".

MSG-TEST-02 declaró el motor "listo para deploy". Esa evaluación era prematura.

---

## Por qué MSG-TEST-02 no es suficiente

MSG-TEST-02 evaluó cumplimiento de límites y ausencia de frases prohibidas. No evaluó si el mensaje sonaba como algo que una persona real escribiría desde el móvil en un DM de LinkedIn.

Estos mensajes de MSG-TEST-02 cumplen todos los criterios técnicos y aun así fallan:

> "Lo que está moviendo a muchos perfiles como el tuyo no es el ERP de turno sino saber articular criterio sobre IA aplicada al negocio."

> "Los directores de operaciones que están liderando estos cambios se encuentran con que su experiencia no tiene un lenguaje común con los equipos de datos."

> "El rol de Head of Product está mutando más rápido que la mayoría de job descriptions que circulan por ahí."

Ninguna de estas frases violan los ADRs ni las prohibiciones de MSG-STYLE-01. Pero ninguna persona las escribiría así en un DM. Suenan a análisis de consultor, a post de LinkedIn, a email de outreach corporativo.

El problema no es lo que se dice. Es cómo se dice.

---

## Nueva regla de estilo

### Principio central

**El mensaje debe poder haberlo escrito una persona desde el móvil, en 2 minutos, sin pensar demasiado.**

Si el mensaje requiere planificación, estructura o vocabulario especializado para escribirse, está mal. Un DM de LinkedIn genuino es imperfecto, directo y corto. La herramienta debe imitar eso, no superarlo.

### Reglas concretas

- **Castellano normal.** Sin palabras que no usarías hablando con un conocido.
- **Frases cortas.** Dos frases por bloque como máximo. Si hay más, una sobra.
- **Cero grandilocuencia.** Si suena impresionante, reescríbelo más sencillo.
- **Cero análisis.** No explicar el problema del sector. Hacer una observación concreta y parar.
- **Cero jerga.** Sin términos de consultoría, recursos humanos, producto ni transformación digital.
- **Cero tono académico.** Sin estructuras del tipo "lo que está ocurriendo es que X implica Y".
- **Cero tono de consultor.** Sin diagnósticos de industria. Sin marcos. Sin "lo que vemos en el mercado".
- **Mejor imperfecto que pulido.** Un mensaje con una pequeña torpeza natural es más creíble que uno brillante.
- **Preguntas simples.** La pregunta del CTA debe responderse con una palabra o una frase corta.

---

## Palabras y expresiones prohibidas

Las siguientes expresiones producen tono de consultor, analista o copy de marketing. El motor no debe usarlas:

| Palabra / expresión | Por qué se prohíbe |
|---|---|
| `gap` | Jerga corporativa anglicada |
| `criterio` | Vocabulario de consultor |
| `marcos` | Vocabulario de metodólogo |
| `articular` | Nunca se usa en conversación informal |
| `validar competencias` | Lenguaje de RRHH / academia |
| `certificar competencias` | Pitch implícito de la solución |
| `job descriptions` | Anglicismo corporativo innecesario |
| `discovery` | Jerga de producto tech |
| `upskilling` | Anglicismo de L&D |
| `IA aplicada al negocio` | Formulación demasiado elaborada |
| `transformación` | Buzzword desgastado |
| `liderar cambios` | Copy de LinkedIn |
| `brecha` | Metáfora corporativa |
| `territorio de IT` | Expresión de consultor de procesos |
| `está mutando` | Lenguaje de post de LinkedIn |
| `programas de desarrollo` | Vocabulario de RRHH |
| `aval` | Formal y distante |
| `perfiles como el tuyo` | Genérico, detectado como template |
| `los directores de X que...` | Inicio de análisis sectorial, no conversación |
| `lo que están viendo muchos...` | Voz de analista de mercado |

---

## Ejemplos antes / después

### Ejemplo 1

**Antes (MSG-TEST-02):**
> Lo que está moviendo a muchos perfiles como el tuyo no es el ERP de turno sino saber articular criterio sobre IA aplicada al negocio.

**Después (estilo correcto):**
> Estoy viendo que mucha gente de negocio quiere entender la IA sin hacerse programador.

---

### Ejemplo 2

**Antes (MSG-TEST-02):**
> El rol de Head of Product está mutando más rápido que la mayoría de job descriptions que circulan por ahí.

**Después (estilo correcto):**
> En producto parece que la IA está entrando más rápido de lo que muchos equipos esperaban.

---

### Ejemplo 3

**Antes (MSG-TEST-02):**
> Los managers necesitan validar que saben aplicarlo, no solo que lo han escuchado.

**Después (estilo correcto):**
> Muchos managers ya no quieren otra charla sobre IA. Quieren saber usarla en casos reales.

---

### Ejemplo 4

**Antes (MSG-TEST-02):**
> Los directores de operaciones que están liderando estos cambios se encuentran con que su experiencia no tiene un lenguaje común con los equipos de datos.

**Después (estilo correcto):**
> La gente de operaciones que intenta meter IA en planta choca siempre con lo mismo: habla un idioma distinto al de los que hacen los modelos.

---

## Patrones de mensaje de referencia

Estos ejemplos son la referencia de registro. El motor debe adaptarlos al contexto real del lead, no copiarlos:

**Patrón directo — candidato:**
> "Buenas, Marta. Una pregunta rápida: ¿en tu empresa ya os están pidiendo cosas de IA o todavía está un poco verde?"

**Patrón de contexto — candidato:**
> "Te escribo porque estoy hablando con gente de operaciones que está intentando entender mejor la IA sin meterse a programar. ¿Te pasa algo parecido?"

**Patrón de señal — candidato:**
> "Con tu perfil, ¿estás viendo que los clientes preguntan más por IA o todavía no mucho?"

**Patrón de prescriptor:**
> "Estoy moviendo algo para perfiles que quieren entender la IA desde negocio, no desde código. ¿Te suena alguien a quien le pueda cuadrar?"

---

## Criterios de aceptación

Un mensaje pasa si cumple **todos** estos puntos:

- [ ] Podría haberlo escrito una persona desde el móvil
- [ ] No contiene ninguna palabra de la lista prohibida
- [ ] Ninguna frase tiene más de 20 palabras
- [ ] No hay más de 2 frases por bloque
- [ ] El CTA se responde con 1-5 palabras
- [ ] No explica el sector ni hace análisis de mercado
- [ ] No intenta sonar inteligente
- [ ] No usa estructura de argumento (premisa → desarrollo → conclusión)
- [ ] Si se lee en voz alta, no suena raro

Un mensaje falla si cumple **cualquiera** de estos:

- [ ] Contiene una palabra de la lista prohibida
- [ ] Suena a post de LinkedIn
- [ ] Suena a email de consultor
- [ ] Suena a análisis de mercado
- [ ] Tiene una frase de más de 25 palabras
- [ ] El CTA requiere reflexión para responderlo

---

## Relación con MSG-STYLE-01

MSG-STYLE-01 estableció los principios correctos (breve, conversacional, sin pitch, sin reunión). Esta guía es una versión más restrictiva y concreta que añade:

- Lista de palabras prohibidas
- Ejemplos de transformación explícitos
- Criterios de aceptación binarios
- La regla del "móvil en 2 minutos" como filtro central

MSG-STYLE-01 sigue siendo válida. MSG-STYLE-02 la refina con un estándar más exigente sobre el registro del lenguaje.

---

## Próxima tarea recomendada

**MSG-FIX-03** — Aplicar esta guía al system prompt del motor V2:

1. Abrir `src/lib/agent_v2.ts`
2. Reemplazar la sección de ESTILO OBLIGATORIO con las reglas de MSG-STYLE-02
3. Añadir la lista de palabras prohibidas al system prompt
4. Sustituir los patrones de referencia actuales por los ejemplos de esta guía
5. Ejecutar `npm run build` y prueba con 2-3 leads
6. Commit: `Fix: apply simpler DM language to V2 system prompt`

---

## Referencias

- Guía anterior: `docs/decisions/MSG-STYLE-01-human-conversation-style-talent4pro.md`
- Prueba que motivó esta guía: `docs/decisions/MSG-TEST-02-v2-final-length-quality-test.md`
- Motor a modificar: `src/lib/agent_v2.ts`
