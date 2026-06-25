# Índice de Decisiones Arquitectónicas
> Guía Proyectos Grandes — Herramienta de Captación LinkedIn para Talent4Pro
> Última actualización: 2026-06-25 (MSG-STYLE-01)

Este directorio es el punto de entrada canónico para todas las decisiones de diseño del proyecto.
Los agentes de IA deben leer este índice antes de operar sobre cualquier componente del sistema.

---

## Decisiones de Estrategia y Producto

Ubicación: `docs/decisions/DOC-BASE-NNN-*.md`

| Doc | Título | Estado | Categoría | Afecta a |
|---|---|---|---|---|
| [DOC-BASE-01](DOC-BASE-01-objetivo-comercial-talent4pro.md) | Objetivo Comercial — Captación de Alumnos para Talent4Pro | **ACTIVA** | Estrategia · Producto · Motor de Mensajes | `CONTEXT.md` · ADRs del agente de redacción |
| [DEPLOY-CHECK-01](DEPLOY-CHECK-01-vercel-staging-readiness.md) | Auditoría de Preparación para Vercel Staging | **ACTIVA** | Infraestructura · Despliegue · Seguridad | `next.config.mjs` · `/api/search/route.ts` · `.gitignore` |
| [DEPLOY-PREP-01](DEPLOY-PREP-01-vercel-staging-prep.md) | Preparación Mínima para Staging en Vercel | **COMPLETA** | Infraestructura · Despliegue | `src/app/api/search/route.ts` · `.vercelignore` |
| [DEPLOY-VALIDATE-01](DEPLOY-VALIDATE-01-final-predeploy-check.md) | Validación Final Predeploy para Vercel Staging | **COMPLETA** | Infraestructura · Validación | build · lint · checklist · variables de entorno |
| [POST-DEPLOY-01](POST-DEPLOY-01-vercel-functional-validation.md) | Validación Funcional del Despliegue en Vercel | **COMPLETA** | Infraestructura · Validación Funcional | https://linkedin-scrapper-v2.vercel.app |
| [MSG-AUDIT-01](MSG-AUDIT-01-message-engine-audit-talent4pro.md) | Auditoría del Motor de Mensajes para Talent4Pro | **COMPLETA** | Motor de Mensajes · IA · Producto | `agent_v2.ts` · `claude_prompts.ts` · `/api/generate-v2` |
| [MSG-STYLE-01](MSG-STYLE-01-human-conversation-style-talent4pro.md) | Guía de Estilo de Conversación Humana para Talent4Pro | **ACTIVA** | Motor de Mensajes · Estilo · Producto | `agent_v2.ts` (system prompt) · futura tarea MSG-FIX-01B |

---

## Decisiones Standalone (una ADR por fichero)

Ubicación: `docs/adr/ADR-NNN-*.md`

| ADR | Título | Estado | Categoría | Afecta a |
|---|---|---|---|---|
| [ADR-004](../adr/ADR-004-fallback-leads-entornos-restringidos.md) | Mecanismo de Fallback de Leads en Entornos Restringidos | **CONGELADA** | Infraestructura · Resiliencia | `orchestrate.ts` · todos los agentes del pipeline |

---

## Decisiones Embebidas (guía del agente de redacción)

Ubicación: `docs/adr/ADRs.md`

Documento consolidado con las decisiones internas del módulo de prospección (agente de redacción `claude-sonnet-4-6`):

| ADR | Título | Estado |
|---|---|---|
| ADR-001 | Modelo y Proveedor de IA | CONGELADO |
| ADR-002 | Framework de Mensajes (Observación → Insight → CTA Abierto) | CONGELADO |
| ADR-003 | Voz y Tono | CONGELADO |
| ADR-004 | Prohibiciones Explícitas por Tipo de Mensaje | CONGELADO |
| ADR-005 | Coherencia con el Sistema de Diseño | CONGELADO |
| ADR-006 | Gestión de Contexto del Lead | CONGELADO |

---

## Protocolo de Registro de Nuevas Decisiones

1. Crear fichero `docs/adr/ADR-NNN-titulo-kebab-case.md` siguiendo el formato Nygard.
2. Añadir entrada en la tabla de este índice.
3. Actualizar `CONTEXT.md` → sección `## Estado Actual`.
4. Commit con mensaje `docs(adr): ADR-NNN — <título breve>`.

## Regla de Consulta para Agentes

> Cualquier agente de IA que modifique `scripts/orchestrate.ts`, `src/lib/linkedin_scraper.ts`,
> o cualquier módulo del pipeline de datos **debe leer todos los ficheros de `docs/adr/`
> antes de generar código o configuración.**
