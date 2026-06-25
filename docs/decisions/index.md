# Índice de Decisiones Arquitectónicas
> Guía Proyectos Grandes — Herramienta de Captación LinkedIn para Talent4Pro
> Última actualización: 2026-06-25 (MSG-FIX-05)

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
| [MSG-FIX-01B](MSG-FIX-01B-v2-human-style-and-profile-signal.md) | Señal Real de Perfil y Estilo Humano en Motor V2 | **COMPLETA** | Motor de Mensajes · IA · Fix | `generate-v2/route.ts` · `agent_v2.ts` |
| [MSG-TEST-01](MSG-TEST-01-v2-controlled-quality-test.md) | Prueba Controlada de Calidad del Motor V2 — 4 leads Talent4Pro | **COMPLETA** | Motor de Mensajes · IA · Calidad | `agent_v2.ts` · veredicto: Apto con retoques |
| [MSG-FIX-02](MSG-FIX-02-v2-insight-length-limit.md) | Límite de Longitud de Mensajes en Motor V2 | **COMPLETA** | Motor de Mensajes · IA · Fix | `agent_v2.ts` — observacion≤220 · insight≤250 · cta≤140 |
| [MSG-TEST-02](MSG-TEST-02-v2-final-length-quality-test.md) | Prueba Final de Calidad y Longitud del Motor V2 | **COMPLETA** | Motor de Mensajes · IA · Calidad | Veredicto: ✅ LISTO PARA DEPLOY |
| [MSG-STYLE-02](MSG-STYLE-02-simple-human-dm-language.md) | Lenguaje Simple y Humano para DMs de LinkedIn | **ACTIVA** | Motor de Mensajes · Estilo · Producto | `agent_v2.ts` (system prompt) · futura tarea MSG-FIX-03 |
| [MSG-FIX-03](MSG-FIX-03-v2-simple-human-dm-style.md) | Estilo DM Simple y Humano Aplicado al Motor V2 | **COMPLETA** | Motor de Mensajes · IA · Fix | `agent_v2.ts` — rol + estilo + prohibiciones + framework |
| [MSG-TEST-03](MSG-TEST-03-v2-real-human-dm-quality-test.md) | Prueba de Naturalidad Real del Motor V2 tras MSG-FIX-03 | **COMPLETA** | Motor de Mensajes · IA · Calidad | Veredicto: 🟡 NECESITA AJUSTE MENOR |
| [MSG-FIX-04](MSG-FIX-04-v2-remove-repetitive-consultant-language.md) | Eliminación de Patrones Repetitivos y Lenguaje de Consultor | **COMPLETA** | Motor de Mensajes · IA · Fix | `agent_v2.ts` — patrones + variedad + sustituciones |
| [REPO-CLEAN-01](REPO-CLEAN-01-working-tree-cleanup.md) | Limpieza del Working Tree antes de MSG-TEST-04 | **COMPLETA** | Infraestructura · Repositorio | `.gitignore` · `scripts/test_msg_v2_talent4pro.ts` |
| [MSG-TEST-04](MSG-TEST-04-v2-final-human-dm-validation.md) | Validación Final de Naturalidad del Motor V2 | **COMPLETA** | Motor de Mensajes · IA · Calidad | Veredicto: ✅ LISTO PARA DEPLOY OPERATIVO |
| [MSG-FIX-05](MSG-FIX-05-v2-real-linkedin-dm-sequence.md) | Conversión del Motor V2 a Secuencia Real de DMs | **COMPLETA** | Motor de Mensajes · IA · Fix | `agent_v2.ts` — 3 DMs reales: primer contacto + follow-up + último toque |

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
