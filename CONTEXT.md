# CONTEXT.md — Herramienta de Captación LinkedIn para Talent4Pro
> **Metodología:** Guía para Proyectos Grandes  
> **Mantenido por:** Claude Code (Backend) · Gemini CLI (Frontend) · Codex (Testing)

---

## Objetivo Comercial

Esta herramienta tiene como objetivo captar alumnos potenciales para la **certificación de Talent4Pro** a través de LinkedIn outreach.

El flujo operativo es:
1. Buscar perfiles de LinkedIn de profesionales que encajan con el perfil de alumno objetivo.
2. Generar secuencias de mensajes personalizados que abran conversación — sin vender directamente.
3. El usuario copia los mensajes y los envía manualmente por LinkedIn.

**Prioridad actual:** mejorar la calidad y conversión de las secuencias de mensajes (motor de mensajes). La búsqueda de perfiles está funcionando y no se toca en esta fase.

**Riesgo principal:** mensajes genéricos, robóticos o demasiado comerciales que el receptor ignora o rechaza. El objetivo NO es vender la certificación en el primer contacto, sino abrir una conversación.

**Métrica principal futura:** tasa de respuesta / conversación abierta (no clicks, no leads generados).

**Restricción operativa — SearchAPI:** el motor de búsqueda usa SearchAPI.io con créditos gratuitos. No se optimiza, no se cambia ni se escala en esta fase. Cualquier mejora al sistema de búsqueda queda fuera del alcance hasta nueva decisión.

---

## Arquitectura

```
Landing Page (/) ──► Login (/login) ──► Auth System ──► Dashboard (/dashboard/*)
                                              │
                                    Admin Approval Gate
                                  (status: pending → approved)
                                              │
                                    Message Generator
```

**Stack técnico:**
- **Frontend:** Next.js 15 · React 18 · TypeScript · Tailwind CSS (design brutalista, bordes sharp)
- **Backend:** Next.js API Routes · Edge Runtime Middleware (`middleware.ts`)
- **Base de datos:** Supabase PostgreSQL
- **Auth:** Supabase Auth + JWT HttpOnly cookies + custom `users` table (roles/status)
- **IA:** OpenAI `gpt-4o-mini` — 3 estilos de draft por lead (Direct, Consultative, Value-First)
- **Búsqueda:** Serper.dev (Google Search API) → filtrado a linkedin.com/in/ URLs

**Flujo principal de generación de mensajes:**
```
Lead (LinkedIn profile) ──► POST /api/generate-messages ──► OpenAI gpt-4o-mini
                                                                      │
                                                          Supabase (leads + message_drafts)
                                                                      │
                                                        Frontend: tabla de drafts → copiar a LinkedIn
```

**Modelo de datos (tablas Supabase):**
| Tabla | Propósito | Versión |
|---|---|---|
| `users` | Auth, roles (`user`/`admin`), status (`pending_approval`/`approved`/`rejected`) | V3 |
| `user_approvals` | Log de aprobaciones/rechazos | V3 |
| `leads` | Perfiles LinkedIn parseados | V1-V2 |
| `message_drafts` | Drafts generados por OpenAI (3 por lead) | V1-V2 |
| `message_batches` | Agrupación de drafts por búsqueda | V2+ |

**Roles de agentes IA:**
- **Claude Code:** API routes, prompts OpenAI, schemas BD, auth, lógica de negocio, middleware
- **Gemini CLI:** Componentes React, UI/UX, formularios, landing page, dashboards
- **Codex:** Tests E2E, integración, auditoría de seguridad

---

## Estado Actual

### V1-V2: Message Generator ✅ COMPLETO
- API `/api/generate-messages` + ruta batch
- Schema Supabase: `leads`, `message_drafts`, `message_batches`
- UI: `SearchSelector`, tabla de drafts, Batch Generator (`/searches`), Messages Hub (`/messages`)
- Operaciones batch: crear, eliminar, seleccionar, regenerar
- Recuperación de mensajes legacy (heredados)

### V3: Auth System ✅ COMPLETO
- Endpoints: `/api/auth/signup`, `/api/auth/signin`, `/api/auth/logout`
- Endpoints admin: pending-users, approve-user/[id], reject-user/[id]
- Middleware Edge Runtime: protege `/dashboard/*` y `/admin/*`
- Seguridad: sin auto-approve por email, HttpOnly cookies, hashing bcrypt vía Supabase, RPC transaccional

### V3: Login Page ✅ COMPLETO
- Diseño dark minimal con tabs "Entrar" / "Registro"
- SearchParams `?reason=pending` / `?reason=rejected` para mensajes de estado

### V3: Landing Page ✅ COMPLETO
- 6 Server Components (sin `use client`): Navbar, HeroSection, FeaturesSection, TestimonialSection, CTASection, Footer
- Paleta: `#F0EDE4` · `#1A1A1A` · `#D94F00` · `#4A7C59` — bordes sharp (border-radius: 0)

### V3: Admin Dashboard ✅ COMPLETO
- `/admin/approvals`: tabla Email · Status · Fecha · Acciones (Aprobar / Rechazar)
- Protección: solo `role='admin'` + `status='approved'`

### V3: User Management Panel ✅ COMPLETO (`/dashboard/users`)
- Endpoints: `GET /api/auth/me`, `GET /api/admin/users`, `PATCH /api/admin/users/[id]`, `DELETE /api/admin/users/[id]`
- Acceso condicional: botón "Gestionar Usuarios" solo visible para `role='admin'`

### V3: Dashboard Visual Refactor ✅ COMPLETO
- Grid 2×2 con 4 módulos: Buscador · Mis Búsquedas · Generador · Hub de Mensajes
- Header persistente con Logout; sombras sólidas estilo brutalista

### Auditoría de Infraestructura / Credenciales ✅ EJECUTADA (2026-06-04)
- `docs/decisions/missing_credentials_report_2026-06-04.md`: reporte completo
- 🔴 CRÍTICO #1: `ANTHROPIC_API_KEY` ausente en `.env.local` → orquestador crashea
- 🔴 CRÍTICO #2: `NEXT_PUBLIC_SUPABASE_ANON_KEY` ausente → `createBrowserClient()` falla
- Frontend: 100% rutas relativas `/api/...` — correcto para localhost:3000
- `.env.example` actualizado: eliminadas vars obsoletas V1 (GOOGLE_API_KEY/GOOGLE_CX), añadidas ANTHROPIC_API_KEY, SEARCHAPI_IO_KEY, NEXT_PUBLIC_SEARCH_API_KEY, SUPABASE_ANON_KEY dual

### Auditoría Técnica de Mensajes ✅ EJECUTADA (2026-06-04)
- `scripts/audit_messages.ts`: auditor de tres pilares (Brevedad · Naturalidad · Cero Pitch)
- Resultado sobre `mensajes_listos.json` (gpt-4o-mini): **6 FALLOS · 1 ADVERTENCIA · 2 OK**
- `docs/decisions/error_report_2026-06-04.md`: reporte detallado con violaciones por lead/mensaje
- `scripts/orchestrate.ts` system prompt v2: 5 patches aplicados post-auditoría
  - Patch 1: anti-restatement en Observación (prohibido repetir cargo+empresa)
  - Patch 2: prohibición "no solo X sino también Y" + "Muchas empresas están..."
  - Patch 3: CTA = exactamente 1 pregunta, sin invitar a conversar/reunirse
  - Patch 4: lista negra de 8 buzzwords corporativos
  - Patch 5: regla de especificidad global (test de genericidad antes de redactar)
- `npm run audit:messages` para auditar el artefacto más reciente

### Integración V2 UI ↔ Agente ✅ COMPLETA (2026-06-04)
- `src/lib/agent_v2.ts`: motor exportable claude-sonnet-4-6 + ADRs (importable en Next.js y scripts)
- `src/app/api/generate-v2/route.ts`: endpoint bridge — recibe `{search_id, sales_goal}` → orchestrateV2 → Supabase
- `scripts/orchestrate.ts`: refactorizado como wrapper CLI delgado que re-exporta `orchestrateV2`
- `migrations/20260511_message_batches.sql`: añadidos `agent_version`, `tipo` en `message_drafts`, vista `leads_v2_messages`
- `src/app/dashboard/searches/page.tsx`: botón "Generar" conectado a `/api/generate-v2` con `sales_goal`
- `tsc --noEmit` sin errores · validate-context.sh 13/13 ✅

### ADR-004: Fallback de Leads ✅ REGISTRADA Y ACTIVA (2026-06-04)
- `docs/adr/ADR-004-fallback-leads-entornos-restringidos.md` — Status: CONGELADA
- Decisión: seed leads activados automáticamente cuando Supabase no es accesible
- `docs/decisions/index.md` creado como índice canónico de todas las decisiones
- `orchestrate.ts` actualizado: carga TODOS los `.md` de `docs/adr/` (no solo `ADRs.md`)
- Cualquier agente que opere sobre el pipeline debe consultar `docs/adr/` antes de generar código

### Pipeline de Datos: Orquestador ✅ COMPLETO — Refactor a claude-sonnet-4-6 (2026-06-04)
- `scripts/orchestrate.ts`: Agente de redacción migrado de gpt-4o-mini → **claude-sonnet-4-6** (Anthropic SDK)
- `docs/adr/ADRs.md`: Decisiones de marca congeladas inyectadas en system prompt antes de redactar
- Framework explícito en system prompt: Observación (2-3 frases) → Insight (3-4 frases) → CTA Abierto (1-2 frases + ?)
- Prompt caching habilitado: system prompt cacheado entre leads (~0.1x coste por HIT)
- `scripts/test_drafting_agent.ts`: Suite de integración — 60 checks por 3 leads (estructura, tono, ADRs)
  - Checks incluyen: frases prohibidas (ADR-004), patrones robóticos, nombre del lead ausente (ADR-005), CTA con ?
  - Modo estático: `npm run test:drafting` · Modo live API: `npm run test:drafting:live`
- Tests sobre output gpt-4o-mini anterior: 4/60 fallos detectados (correctos — el viejo modelo violaba ADR-004 y ADR-005)
- Requiere `ANTHROPIC_API_KEY` en `.env.local` para el agente de redacción

### MSG-TEST-02: Prueba Final Motor V2 ✅ COMPLETA (2026-06-25)
- 4 leads probados — 3 APTO, 1 APTO CON RETOQUES (Lead-A menciona "Certificar" en insight)
- Todos dentro de límites: observacion≤220, insight≤250 (max 233), cta≤140 (max 103) ✅
- Mejora vs MSG-TEST-01: insight más largo bajó de 488 → 233 chars (−255 chars)
- Motor V2 apto para uso operativo en campañas Talent4Pro
- **Veredicto: LISTO PARA DEPLOY**
- Próxima tarea: DEPLOY-02 — push a Vercel y prueba real en producción

### MSG-FIX-02: Límite de Longitud en Motor V2 ✅ COMPLETO (2026-06-25)
- observacion ≤ 220 chars · insight ≤ 250 chars · cta_abierto ≤ 140 chars
- Sección ESTILO y cada mensaje del FRAMEWORK actualizado con límites explícitos
- Build ✅ 26/26 páginas · 0 errores · solo `agent_v2.ts` tocado como código
- Pendiente: MSG-TEST-02 — confirmar que los límites se cumplen con leads reales

### MSG-TEST-01: Prueba Controlada Motor V2 ✅ COMPLETA (2026-06-25)
- 4 leads probados con snippets reales — motor funciona con la señal de perfil
- Resultado: 1 APTO (Lead-D tech), 3 APTO CON RETOQUES (insight demasiado largo >400 chars)
- Snippets usados correctamente en todos los leads — observaciones específicas ✅
- CTAs excelentes en 4/4 — conversacionales, naturales, bifurcados ✅
- Talent4Pro no aparece en ningún mensaje ✅ · Frases prohibidas ausentes ✅
- Problema detectado: insight sin límite de caracteres → textos de 400-488 chars en 3/4 leads
- Veredicto: **LISTO PARA USO OPERATIVO** — usuario debe recortar Mensaje 2 si >250 chars
- Próxima tarea: MSG-FIX-02 — añadir límite ~250 chars al insight en el prompt

### MSG-FIX-01B: Motor V2 Mejorado ✅ COMPLETO (2026-06-25)
- `posts_recientes` ahora recibe `raw_google_snippet` del perfil real (antes siempre vacío)
- System prompt ampliado: contexto Talent4Pro + guía de estilo humano + frases prohibidas adicionales
- CTA ejemplos actualizados: preguntas conversacionales naturales vs. CTAs de reunión
- Build ✅ 26/26 páginas · 0 errores · V1 sin tocar · UI sin tocar · schema sin tocar
- Pendiente: prueba con leads reales para validar mejora de calidad (MSG-TEST-01)

### MSG-AUDIT-01: Auditoría del Motor de Mensajes ✅ COMPLETA (2026-06-25)
- Dos motores identificados: V1 (`claude_prompts.ts`, OpenAI) y V2 (`agent_v2.ts`, Anthropic)
- Solo V2 tiene el framework correcto para Talent4Pro (Observación → Insight → CTA Abierto)
- **Defecto crítico:** `posts_recientes` siempre vacío → observaciones genéricas para todos los leads
- **Corrección disponible:** pasar `raw_google_snippet` existente en BD al campo `posts_recientes`
- **Sin contexto Talent4Pro en prompt:** agente trata captación educativa como B2B genérico
- Próxima tarea: MSG-FIX-01 — pasar snippet + añadir contexto Talent4Pro al system prompt V2
- Ver: `docs/decisions/MSG-AUDIT-01-message-engine-audit-talent4pro.md`

### Despliegue en Vercel ✅ FUNCIONAL (2026-06-25)
- URL: https://linkedin-scrapper-v2.vercel.app
- Entorno: Production usado como staging privado · Rama: `master` · Commit: `2cf8294`
- Validado: landing, navegación, botón "Empezar ahora", búsqueda real ejecutada sin errores
- Motor de búsqueda operativo en producción (SearchAPI.io + SSE con `maxDuration = 300`)
- **Siguiente foco del proyecto: motor de mensajes y conversión para Talent4Pro**
- Flujo completo de auth y generación de mensajes V2 pendientes de validar en Vercel

### V3: E2E Tests 🕒 PENDIENTE
- Flujo: Signup → Pending → Admin Approve → Signin → Access
- Asignado a: Codex

---

## Última Actualización

| Campo | Valor |
|---|---|
| Fecha | 2026-06-25 |
| Responsable | Claude Code (Ingeniero de Infraestructura) |
| Motivo | MSG-TEST-02: motor V2 validado — 3 APTO, 1 APTO CON RETOQUES, todos dentro de límites. Listo para deploy. |
| validate-context.sh | ✅ EXIT_CODE 0 |
| Build | ✅ `npm run build` limpio — 26/26 páginas, 0 errores (verificado 2026-06-25) |
| Credenciales | .env.local completado (11 variables) — archivo gitignoreado, no entra al repo |
| Vercel | ✅ DESPLEGADO Y FUNCIONAL — https://linkedin-scrapper-v2.vercel.app |

---

## Backlog Priorizado

| # | Tarea | Responsable | Estado | Prioridad |
|---|---|---|---|---|
| 14 | Dashboard Visual Refactor (grid 2×2 + design system) | Gemini CLI | ✅ COMPLETO | — |
| 13 | User Management Panel (`/dashboard/users`) | Codex | ✅ COMPLETO | — |
| 20 | Refactor export: `linkedin_scraper.ts` → `leads_raw.json` (contrato datos) | Claude Code | ✅ COMPLETO | — |
| 21 | Orquestador pipeline Scraper → leads_raw.json → mensajes_listos.json | Claude Code | ✅ COMPLETO | — |
| 22 | DEPLOY-PREP-01: `maxDuration` en /api/search + `.vercelignore` | Claude Code | ✅ COMPLETO | — |
| 23 | MSG-AUDIT-01: auditar motor de mensajes V2 para Talent4Pro | Claude Code | ✅ COMPLETO | — |
| 24 | MSG-STYLE-01: guía de estilo humano para mensajes Talent4Pro | Claude Code | ✅ COMPLETO | — |
| 25 | MSG-FIX-01B: señal real de perfil + estilo humano en motor V2 | Claude Code | ✅ COMPLETO | — |
| 26 | MSG-TEST-01: prueba controlada motor V2 — 4 leads, 1 APTO, 3 APTO CON RETOQUES | Claude Code | ✅ COMPLETO | — |
| 27 | MSG-FIX-02: límites de longitud en motor V2 (observacion≤220, insight≤250, cta≤140) | Claude Code | ✅ COMPLETO | — |
| 28 | MSG-TEST-02: confirmar límites con 4 leads — todos OK, listo para deploy | Claude Code | ✅ COMPLETO | — |
| 29 | DEPLOY-02: despliegue de motor V2 actualizado a Vercel + prueba en producción | Claude Code | 🕒 PENDIENTE | Alta |
| 12 | E2E Tests (Signup → Approve → Signin → Access) | Codex | 🕒 PENDIENTE | Alta |
| 15 | Funcionalidad real `/dashboard/search` (Buscador) | Gemini CLI | 🕒 PENDIENTE | Alta |
| 16 | Paginación real en tabla de contactos | Gemini CLI | 🕒 PENDIENTE | Media |
| 17 | Filtros avanzados en historial de búsquedas | Gemini CLI | 🕒 PENDIENTE | Media |
| 18 | Exportación a JSON / Excel | Gemini CLI | 🕒 PENDIENTE | Baja |
| 19 | Animaciones de transición entre estados de carga | Gemini CLI | 🕒 PENDIENTE | Baja |

---

## Restricciones

### Técnicas
- **Edge Runtime:** El middleware (`middleware.ts`) corre en Edge Runtime — no se puede importar módulos Node.js nativos. Solo Web APIs y librerías compatibles.
- **OpenAI, no Anthropic:** El proyecto usa `OPENAI_API_KEY` con `gpt-4o-mini`. Los prompts están en `src/lib/claude_prompts.ts` pero llaman a OpenAI.
- **Sin auto-approve:** Ningún signup puede resultar en `status='approved'` automáticamente — todos arrancan en `pending_approval`. Decisión de seguridad congelada.
- **HttpOnly cookies obligatorias:** Los JWT tokens solo viajan en cookies HttpOnly. No se exponen en `localStorage` ni en headers de cliente.
- **RPC transaccional para approve/reject:** Las operaciones de aprobación/rechazo usan RPCs de Supabase para garantizar atomicidad. No se permite UPDATE directo desde cliente.
- **Tipado estricto TypeScript:** `tsconfig.json` con `strict: true`. Todos los tipos compartidos en `src/types/index.ts`.

### De diseño (congeladas)
- **Bordes sharp en todo el sistema:** `border-radius: 0` en todos los componentes UI. No se permiten bordes redondeados.
- **Paleta fija:** `#F0EDE4` (bg crema) · `#1A1A1A` (texto/bordes) · `#D94F00` (accent naranja) · `#4A7C59` (secondary verde). No se añaden colores sin consenso.
- **Landing = Dashboard (misma estética):** La coherencia visual entre landing y app es un requisito no negociable.
- **Server Components por defecto:** Los componentes de landing son Server Components sin `use client`. No agregar estado del cliente sin justificación.

### Operacionales
- **Variables de entorno obligatorias:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `SERPER_API_KEY`, `SEARCH_API_KEY`. El servidor no arranca sin ellas.
- **Header `x-api-key`:** Todos los endpoints internos (no auth) requieren el header `x-api-key` con el valor de `SEARCH_API_KEY`.
- **Multi-agente:** Los agentes IA deben respetar sus dominios. Claude Code no toca componentes React de UI; Gemini CLI no toca API routes ni lógica de auth.
