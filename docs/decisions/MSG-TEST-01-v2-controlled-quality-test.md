# MSG-TEST-01: Prueba Controlada de Calidad del Motor V2 tras MSG-FIX-01B

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Motor de Mensajes · IA · Calidad |
| **Veredicto** | 🟡 APTO CON RETOQUES — listo para uso operativo con advertencia de longitud |

---

## Objetivo de la prueba

Verificar que el motor V2 actualizado en MSG-FIX-01B genera mensajes que:
1. Usan la señal real del perfil (snippets) para anclar la observación
2. Cumplen la guía de estilo humano de MSG-STYLE-01
3. No mencionan Talent4Pro, precios ni cierres de reunión en el primer contacto
4. Producen CTAs conversacionales y naturales

---

## Método

- **Script:** `scripts/test_msg_v2_talent4pro.ts` (archivo local, no versionado)
- **Motor:** `orchestrateV2()` — `claude-sonnet-4-6` con prompt actualizado en MSG-FIX-01B
- **Entorno:** local con `.env.local` (ANTHROPIC_API_KEY configurada)
- **Sales goal:** `Talent4Pro ofrece certificaciones profesionales acreditadas para mandos intermedios y directivos que buscan validar y escalar sus competencias de liderazgo e IA aplicada...`
- **Leads probados:** 4 perfiles representativos del target Talent4Pro, con snippets de perfil realistas

---

## Perfiles probados (anonimizados)

| ID | Rol | Sector | Snippet disponible |
|---|---|---|---|
| Lead-A | Director de Operaciones | Industrial | Sí — PMP, digitalización cadena de suministro, IA en planta |
| Lead-B | Manager de Transformación Digital | Consultoría de pymes | Sí — MBA, adopción digital, más allá del ERP/CRM |
| Lead-C | Responsable de Desarrollo de Talento | Servicios financieros | Sí — L&D, upskilling mandos, IA cambia los perfiles |
| Lead-D | Head of Product | Tecnología B2B | Sí — equipos distribuidos, liderazgo ágil, IA generativa |

---

## Mensajes generados y evaluación

### Lead-A — Director de Operaciones, sector industrial

**[OBSERVACIÓN]** *(268 caracteres)*
> Pilotar la digitalización de la cadena de suministro desde operaciones es una cosa, pero cuando llega el momento de integrar IA en decisiones de planta, el perfil PMP te da estructura aunque no siempre el lenguaje para interlocutar con los que vienen del lado técnico.

**[INSIGHT]** *(429 caracteres)*
> Lo que estoy viendo en perfiles industriales con tu recorrido es que la brecha no suele ser de conocimiento operativo, sino de vocabulario y criterio para evaluar qué propuestas de IA tienen sentido real en planta y cuáles son ruido. La certificación en gestión de proyectos resuelve la parte de metodología, pero el tramo de IA aplicada a decisiones operativas todavía no tiene un estándar claro en el sector industrial español.

**[CTA ABIERTO]** *(114 caracteres)*
> ¿En tu caso esa brecha la estás notando tú o más bien la estás viendo en los mandos intermedios que tienes debajo?

**Evaluación por criterio:**

| Criterio | Resultado |
|---|---|
| Parece escrito por persona real | ✅ Sí — PMP y "interlocutar" son detalles concretos |
| Se entiende en menos de 10 segundos | ✅ Observación clara y directa |
| Usa señal real del perfil | ✅ PMP + digitalización cadena de suministro |
| Una sola pregunta fácil de responder | ✅ CTA bifurcado, fácil de responder |
| Evita vender directamente | ✅ Sin pitch |
| Evita mencionar Talent4Pro | ✅ No aparece en ningún mensaje |
| Evita frases prohibidas | ✅ Sin frases de la lista negra |
| Evita tono de IA/copy comercial | ✅ Natural y específico |
| Puede abrir conversación | ✅ Muy probable |
| Longitud del insight | ⚠️ 429 caracteres — excede el límite conversacional de LinkedIn (~280-300) |

**Clasificación: APTO CON RETOQUES** — El insight funciona conceptualmente pero es demasiado largo para un DM de LinkedIn.

---

### Lead-B — Manager Transformación Digital, consultoría pymes

**[OBSERVACIÓN]** *(319 caracteres)*
> En transformación de pymes hay un patrón que se repite: los proyectos de adopción digital se frenan menos por la herramienta y más por quien tiene que liderar el cambio dentro. El ERP funciona, el CRM está configurado, pero el mando intermedio que debe sostener el nuevo modelo no tiene el respaldo formal para hacerlo.

**[INSIGHT]** *(421 caracteres)*
> Hay una brecha que muchos consultores están viendo ahora mismo: la dirección de la pyme pide resultados de transformación, pero los perfiles que ejecutan esa transformación no tienen forma de acreditar las competencias que ya tienen. No es falta de conocimiento, es falta de validación reconocible. Algunas consultoras están empezando a resolver esto certificando a sus propios equipos antes de que se lo pida el cliente.

**[CTA ABIERTO]** *(89 caracteres)*
> ¿En tu día a día con pymes lo ves también, o el cuello de botella está más en otro sitio?

**Evaluación por criterio:**

| Criterio | Resultado |
|---|---|
| Parece escrito por persona real | ✅ Conversacional, usa "patrón que se repite" |
| Se entiende en menos de 10 segundos | ✅ Observación directa |
| Usa señal real del perfil | ✅ ERP/CRM mencionados directamente del snippet |
| Una sola pregunta fácil de responder | ✅ CTA muy natural y abierto |
| Evita vender directamente | ⚠️ "Algunas consultoras están certificando a sus equipos" — roza la sugerencia de solución |
| Evita mencionar Talent4Pro | ✅ No aparece |
| Evita frases prohibidas | ✅ Sin frases de la lista negra |
| Evita tono de IA/copy comercial | ✅ Tono diagnóstico, no comercial |
| Puede abrir conversación | ✅ Alta probabilidad |
| Longitud del insight | ⚠️ 421 caracteres — demasiado largo |

**Clasificación: APTO CON RETOQUES** — El insight llega a mencionar "certificando" en el Mensaje 2, lo que puede activar el filtro de spam de algunos perfiles. CTA excelente.

---

### Lead-C — Responsable de Desarrollo de Talento, servicios financieros

**[OBSERVACIÓN]** *(306 caracteres)*
> En banca y servicios financieros, el perfil de mando medio está cambiando más rápido que los catálogos de formación. La IA está redefiniendo qué se espera de alguien que gestiona equipos, y eso pone a los equipos de L&D en una posición complicada: diseñar programas para un perfil que todavía está mutando.

**[INSIGHT]** *(488 caracteres)*
> Lo que estoy viendo en el sector es que el nudo no está en el contenido formativo sino en la validación: los managers completan programas de upskilling pero no tienen manera de demostrar que sus competencias han evolucionado, ni hacia arriba ni hacia los equipos que lideran. Sin un marco de acreditación reconocible, el desarrollo queda dentro del sistema interno y no viaja. Eso complica tanto la retención como la atracción de perfiles que ya vienen exigiendo evidencia de crecimiento.

**[CTA ABIERTO]** *(124 caracteres)*
> ¿Esto te está generando fricción cuando diseñas los programas para mandos, o de momento lo estáis resolviendo de otra forma?

**Evaluación por criterio:**

| Criterio | Resultado |
|---|---|
| Parece escrito por persona real | ✅ Usa "L&D" del snippet, lenguaje del sector |
| Se entiende en menos de 10 segundos | ✅ Observación precisa |
| Usa señal real del perfil | ✅ L&D, upskilling mandos, banca |
| Una sola pregunta fácil de responder | ✅ CTA contextualizado en su función |
| Evita vender directamente | ⚠️ "Sin un marco de acreditación reconocible" — apunta demasiado hacia la solución |
| Evita mencionar Talent4Pro | ✅ No aparece |
| Evita frases prohibidas | ✅ Sin frases de la lista negra |
| Evita tono de IA/copy comercial | ✅ Tono de conversación entre profesionales de L&D |
| Puede abrir conversación | ✅ Muy alta probabilidad — este perfil tiene el problema descrito |
| Longitud del insight | ❌ 488 caracteres — el más largo de la prueba, claramente excesivo |

**Clasificación: APTO CON RETOQUES** — El insight es el más preciso de los 4 en términos de diagnóstico, pero el más largo. Necesita compresión. El CTA es el mejor de todos los probados.

---

### Lead-D — Head of Product, empresa tech

**[OBSERVACIÓN]** *(258 caracteres)*
> Liderar producto en B2B tech con equipos distribuidos ya es suficientemente exigente sin añadir encima la pregunta de qué hacer con la IA generativa dentro del propio equipo de producto. Pero es la pregunta que más está apareciendo ahora mismo en esos roles.

**[INSIGHT]** *(337 caracteres)*
> Muchos heads of product están en un punto concreto: saben que la IA va a cambiar cómo trabajan sus PMs, pero no tienen claro si su trabajo es aprenderla ellos primero, delegar eso al equipo, o cambiar cómo miden el rendimiento. La decisión no es técnica, es de liderazgo. Y hay poca referencia clara de cómo otros están resolviendo esto.

**[CTA ABIERTO]** *(89 caracteres)*
> ¿Tú cómo lo estás planteando en tu equipo, tienes ya una posición o todavía está abierto?

**Evaluación por criterio:**

| Criterio | Resultado |
|---|---|
| Parece escrito por persona real | ✅ Muy natural, conversacional |
| Se entiende en menos de 10 segundos | ✅ El más legible de los 4 |
| Usa señal real del perfil | ✅ IA generativa en equipos de producto — directo del snippet |
| Una sola pregunta fácil de responder | ✅ CTA conversacional y preciso |
| Evita vender directamente | ✅ Puro diagnóstico sin solución |
| Evita mencionar Talent4Pro | ✅ No aparece |
| Evita frases prohibidas | ✅ Sin frases de la lista negra |
| Evita tono de IA/copy comercial | ✅ Mejor de los 4 en este criterio |
| Puede abrir conversación | ✅ Muy alta probabilidad |
| Longitud del insight | ✅ 337 caracteres — el único dentro del rango aceptable |

**Clasificación: APTO** — El mejor mensaje de los 4 en todos los criterios.

---

## Resultados agregados

| Lead | Tipo | Clasificación | Longitud insight | Uso de snippet |
|---|---|---|---|---|
| Lead-A | Candidato (industrial) | APTO CON RETOQUES | ⚠️ 429 chars | ✅ Sí |
| Lead-B | Candidato (consultoría) | APTO CON RETOQUES | ⚠️ 421 chars | ✅ Sí |
| Lead-C | Prescriptor (L&D) | APTO CON RETOQUES | ❌ 488 chars | ✅ Sí |
| Lead-D | Candidato (tech) | APTO | ✅ 337 chars | ✅ Sí |

**Resumen:**
- 1/4 APTO sin retoques
- 3/4 APTO CON RETOQUES
- 0/4 NO APTO

---

## Diagnóstico de calidad

### Lo que funciona tras MSG-FIX-01B

1. **Los snippets se usan correctamente:** todos los mensajes anclan la observación en detalles reales del perfil (PMP, ERP/CRM, L&D, IA generativa en producto). El fix de `raw_google_snippet → posts_recientes` funciona.
2. **Las frases prohibidas no aparecen en ningún mensaje.** Ningún "He visto tu perfil", "Dado tu background", "Agendar una llamada".
3. **Talent4Pro no aparece en ningún mensaje.** El contexto del remitente informa el insight sin exponerse.
4. **Los CTAs son excelentes:** 4/4 son naturales, bifurcados, fáciles de responder y humanos.
5. **El tono general ha mejorado significativamente** respecto a lo que generaría el prompt anterior — más diagnóstico, menos pitch.

### Problema detectado: longitud del insight

Los mensajes 2 (Insight) de 3 de los 4 leads superan los 400 caracteres. En un DM de LinkedIn, esto es problemático:
- LinkedIn tiene un límite de 300 caracteres para mensajes de solicitud de conexión
- Un mensaje de 400-500 caracteres en DM directo ya se parece más a un email que a una conversación
- La guía MSG-STYLE-01 establece que el mensaje debe entenderse en menos de 10 segundos

El prompt actual no tiene límite de caracteres explícito para el insight. El ADR-002 define "3-4 frases" pero no caracteres.

### Patrón secundario: insight demasiado diagnóstico en prescriptores

En Lead-B y Lead-C, el insight roza la sugerencia de la solución ("certificando", "marco de acreditación"). Esto ocurre porque el `sales_goal` incluye la palabra "certificación" y el agente lo filtra mal en el Mensaje 2 cuando el perfil es de RRHH/L&D, que son los perfiles más cercanos a esa terminología.

---

## Decisión

**LISTO PARA USO OPERATIVO** con una limitación documentada y una mejora menor recomendada.

El motor produce mensajes suficientemente humanos, específicos y alineados con la guía para ser enviados en una campaña de prospección real. La calidad es notablemente superior a la esperada del prompt anterior.

**Limitación documentada:** los insights pueden ser excesivamente largos (>400 chars). En producción, el usuario debe revisar y recortar el Mensaje 2 antes de enviarlo. Esta limitación es menor en comparación con el problema previo (mensajes completamente genéricos por posts vacíos).

---

## Próxima tarea recomendada

**MSG-FIX-02** — Añadir límite de caracteres al insight en el system prompt:

En `src/lib/agent_v2.ts`, en la sección del Mensaje 2 (INSIGHT), añadir:
```
- Máximo 250 caracteres. Si supera eso, corta y resume.
```

Esta es la única mejora pendiente para que el motor esté completamente listo. Esfuerzo: 1 línea de prompt. Sin cambios de código, sin cambios de schema.

Después de ese ajuste, el motor V2 puede considerarse **Production-ready para campaña Talent4Pro**.

---

## Referencias

- Fix aplicado: `docs/decisions/MSG-FIX-01B-v2-human-style-and-profile-signal.md`
- Guía de estilo aplicada: `docs/decisions/MSG-STYLE-01-human-conversation-style-talent4pro.md`
- Auditoría original: `docs/decisions/MSG-AUDIT-01-message-engine-audit-talent4pro.md`
- Motor evaluado: `src/lib/agent_v2.ts`
