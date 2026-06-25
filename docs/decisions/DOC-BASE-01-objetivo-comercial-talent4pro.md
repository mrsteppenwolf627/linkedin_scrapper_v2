# DOC-BASE-01: Objetivo Comercial — Captación de Alumnos para Talent4Pro

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | ACTIVA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Estrategia · Producto · Motor de Mensajes |
| **Afecta a** | `docs/`, `CONTEXT.md`, ADRs del motor de mensajes |

---

## Objetivo del Proyecto

Esta herramienta existe para **captar alumnos potenciales para la certificación de Talent4Pro** mediante LinkedIn outreach.

El perfil objetivo son profesionales en activo en España con perfil de LinkedIn que encajan con el programa de certificación que ofrece Talent4Pro. El canal de captación es el mensaje directo de LinkedIn (DM), enviado manualmente por el usuario tras copiar las secuencias generadas por la herramienta.

El objetivo del primer contacto **no es vender la certificación**: es abrir una conversación genuina que permita explorar si existe interés o contexto relevante.

---

## Qué está funcionando

- **Motor de búsqueda:** la integración con SearchAPI.io (proxy de Google) encuentra perfiles de LinkedIn y los filtra correctamente. Las búsquedas se persisten en Supabase y están disponibles en el dashboard.
- **Motor de mensajes V2:** `src/lib/agent_v2.ts` genera secuencias de 3 mensajes (Observación → Insight → CTA Abierto) usando `claude-sonnet-4-6` con prompt caching. El endpoint `/api/generate-v2` conecta la UI con el agente.
- **Infraestructura base:** auth, admin approvals, dashboard, Supabase, variables de entorno — todo operativo.
- **ADRs del agente de redacción:** las decisiones de marco, tono y prohibiciones están documentadas y congeladas en `docs/adr/ADRs.md`.

---

## Qué no está resuelto

- **Calidad y conversión de mensajes:** los mensajes generados tienden a ser genéricos, robóticos o demasiado comerciales. La tasa de respuesta / conversación abierta no está medida ni optimizada.
- **Falta de contexto de Talent4Pro en los prompts:** el sistema prompt del agente de redacción no incorpora el contexto específico de la propuesta de valor de Talent4Pro ni el perfil del alumno objetivo.
- **`sales_goal` como único vector de personalización:** actualmente el único parámetro que orienta los mensajes hacia Talent4Pro es el campo `sales_goal` que el usuario introduce manualmente en cada búsqueda. No existe plantilla ni guía estructurada.
- **Sin métricas de efectividad:** no hay trazabilidad de qué mensajes derivaron en respuesta. La herramienta genera drafts pero no mide resultados.

---

## Decisión: la mejora prioritaria es el motor de mensajes

Dado que la búsqueda de perfiles funciona y el objetivo comercial es Talent4Pro, **la palanca de mayor impacto inmediato es mejorar la calidad de las secuencias de mensajes** para aumentar la tasa de respuesta.

La dirección correcta es:
- Mensajes que abran conversación, no que vendan.
- Anclar el insight en la situación real del lead (sector, rol, empresa), no en la propuesta del remitente.
- Formular un CTA que invite al lead a compartir su perspectiva, no a agendar una demo.

Esta decisión no implica cambios de código en esta tarea — solo establece la prioridad estratégica documentada.

---

## No se toca el motor de búsqueda

SearchAPI.io funciona con créditos gratuitos. No se modifica, no se optimiza, no se escala. Cualquier mejora al sistema de búsqueda (paginación, filtros adicionales, cambio de proveedor) queda fuera del alcance hasta nueva decisión explícita.

Razón: el cuello de botella actual no es la cantidad de perfiles encontrados, sino la conversión de los mensajes enviados.

---

## Próxima tarea recomendada

**Auditar el sistema actual de generación de mensajes** — revisar los prompts de `src/lib/agent_v2.ts` y `src/lib/claude_prompts.ts`, generar mensajes de muestra sobre perfiles reales y evaluar contra los criterios de los ADRs:

- ¿Los mensajes pasan el test de especificidad (no podrían enviarse a cualquier persona con ese cargo)?
- ¿El CTA invita a compartir opinión, o presiona a una acción transaccional?
- ¿El insight menciona la propuesta del remitente de forma que rompe la naturalidad?
- ¿El `sales_goal` actual de Talent4Pro produce mensajes orientados a la certificación o demasiado genéricos?

El resultado de esta auditoría informará los cambios al prompt del agente en la siguiente tarea.

---

## Referencias

- Contexto general del proyecto: `CONTEXT.md`
- ADRs del agente de redacción: `docs/adr/ADRs.md`
- ADR de fallback de leads: `docs/adr/ADR-004-fallback-leads-entornos-restringidos.md`
- Motor del agente V2: `src/lib/agent_v2.ts`
- Endpoint bridge: `src/app/api/generate-v2/route.ts`
