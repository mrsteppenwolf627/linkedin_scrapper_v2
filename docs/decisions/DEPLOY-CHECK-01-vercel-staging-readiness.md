# DEPLOY-CHECK-01: Auditoría de Preparación para Vercel Staging

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | ACTIVA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Infraestructura · Despliegue · Seguridad |
| **Afecta a** | `next.config.mjs` · `src/app/api/search/route.ts` · todas las API routes · `.gitignore` |

---

## Resumen ejecutivo

El proyecto es **arquitectónicamente compatible con Vercel** (Next.js 15 App Router, sin servidor custom, middleware Edge Runtime). Sin embargo, existen **2 bloqueadores** que deben resolverse antes del primer despliegue y **4 riesgos** aceptables en staging que deben documentarse.

**Veredicto: LISTO CON RESTRICCIONES** — no desplegar hasta resolver los bloqueadores.

---

## Estado actual del proyecto para despliegue

### Compatibilidad base ✅

| Criterio | Estado | Nota |
|---|---|---|
| Framework | ✅ Compatible | Next.js 15 App Router — soporte nativo en Vercel |
| Servidor custom | ✅ No hay | Solo `next start` — sin Express ni servidor externo |
| Middleware | ✅ Compatible | `src/middleware.ts` usa solo Web APIs — no módulos Node.js nativos |
| `next.config.mjs` | ✅ Limpio | Minimal config; `experimental.serverActions.bodySizeLimit` es válido |
| Build script | ✅ Estándar | `npm run build` → `next build` |
| TypeScript | ✅ Strict | `tsconfig.json` con `strict: true` |
| `force-dynamic` en /api/search | ✅ Configurado | Evita que Vercel cachee la respuesta SSE |

### Build local

- Última verificación de `tsc --noEmit` sin errores: **2026-06-04**
- No existe registro de `npm run build` completo posterior a esa fecha
- **Acción requerida:** ejecutar `npm run build` y `npm run lint` localmente antes de desplegar

---

## Variables de entorno necesarias

Todas deben configurarse en el **dashboard de Vercel** antes del primer despliegue (Settings → Environment Variables).

| Variable | Entorno | Propósito | Criticidad |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production · Preview | URL pública del proyecto Supabase | 🔴 CRÍTICO |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production · Preview | Anon key (browser client) | 🔴 CRÍTICO |
| `SUPABASE_ANON_KEY` | Production · Preview | Anon key (server-side fallback `/api/auth/signin`) | 🔴 CRÍTICO |
| `SUPABASE_SERVICE_ROLE_KEY` | Production · Preview | Service role key — solo server-side; NUNCA exponer | 🔴 CRÍTICO |
| `ANTHROPIC_API_KEY` | Production · Preview | Motor de mensajes V2 (`agent_v2.ts`) | 🔴 CRÍTICO |
| `OPENAI_API_KEY` | Production · Preview | Motor de mensajes V1 (`claude_prompts.ts`) y scraper | 🔴 CRÍTICO |
| `SEARCHAPI_IO_KEY` | Production · Preview | Motor de búsqueda SearchAPI.io (créditos gratuitos) | 🔴 CRÍTICO |
| `SEARCH_API_KEY` | Production · Preview | Clave interna de protección de endpoints `/api/*` | 🔴 CRÍTICO |
| `NEXT_PUBLIC_SEARCH_API_KEY` | Production · Preview | Debe coincidir exactamente con `SEARCH_API_KEY` | 🔴 CRÍTICO |
| `NEXT_PUBLIC_APP_URL` | Production · Preview | **Debe cambiarse de `localhost:3000` a la URL de Vercel** | 🟡 IMPORTANTE |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Production · Preview | Email del admin inicial | 🟡 IMPORTANTE |

**Total: 11 variables. Ninguna tiene valor por defecto seguro en producción.**

### Nota sobre `SUPABASE_SERVICE_ROLE_KEY`

Esta clave tiene acceso sin restricciones RLS a toda la base de datos. Se usa solo en rutas server-side. En Vercel, las variables **sin** prefijo `NEXT_PUBLIC_` son exclusivamente server-side — esta protección es correcta y no debe alterarse.

---

## Bloqueadores antes de desplegar

### BLOQUEADOR #1 — Timeout de función para `/api/search` (SSE)

**Impacto: CRÍTICO**

La ruta `/api/search/route.ts` implementa Server-Sent Events (SSE) a través de un `ReadableStream` que llama a `executeLinkedInSearch`. Una búsqueda puede tardar varios minutos.

Problema: no existe `export const maxDuration` en el archivo de la ruta. En Vercel:
- Plan **Hobby**: timeout de 10 segundos → la búsqueda falla inmediatamente
- Plan **Pro**: timeout de 300 segundos (default), pero sin declaración explícita, el comportamiento no está garantizado

**Resolución requerida (tarea de código separada):**
```typescript
// src/app/api/search/route.ts — añadir al inicio del archivo
export const maxDuration = 300 // segundos — máximo en Vercel Pro
```

Sin este cambio, el endpoint de búsqueda es inoperable en Vercel Hobby y potencialmente inestable en Pro.

---

### BLOQUEADOR #2 — Archivos de datos en el repositorio sin `.vercelignore`

**Impacto: PRIVACIDAD**

En la raíz del proyecto existen dos archivos de datos que Vercel desplegará junto con el código, ya que no están en `.gitignore` ni existe un `.vercelignore`:

- `leads_raw.json` — perfiles de LinkedIn scrapeados
- `mensajes_listos.json` — mensajes generados por el agente

Si estos archivos contienen datos reales de personas (nombres, empresas, URLs de LinkedIn), su despliegue en Vercel los hace accesibles a través del servidor de producción, potencialmente como assets estáticos.

**Resolución requerida (tarea de código separada):**
Crear `.vercelignore` con al menos:
```
leads_raw.json
mensajes_listos.json
scripts/
docs/
migrations/
tests/
*.log
```

---

## Riesgos detectados (aceptables para staging)

### RIESGO #1 — `NEXT_PUBLIC_SEARCH_API_KEY` expuesta en el bundle del cliente

La clave interna que protege todos los endpoints `/api/*` (excepto `/api/auth/*`) se expone al frontend vía `NEXT_PUBLIC_SEARCH_API_KEY`. Cualquier usuario que inspeccione el JavaScript del bundle puede extraerla.

**Contexto:** esto es intencional por diseño (el frontend necesita incluirla en el header `x-api-key`). Para una herramienta de uso interno con usuarios de confianza (admin-aprovados), el riesgo es bajo. No es un bloqueador para staging.

**Mitigación futura:** mover la lógica de llamada a API routes intermedias (BFF pattern) que no expongan la clave al cliente.

---

### RIESGO #2 — Sin rate limiting en endpoints que consumen créditos

Las siguientes rutas llaman a APIs de pago y no tienen protección por tasa de peticiones:

| Endpoint | Servicio externo | Coste |
|---|---|---|
| `POST /api/search` | SearchAPI.io | Créditos por búsqueda |
| `POST /api/generate-v2` | Anthropic (`claude-sonnet-4-6`) | Por token |
| `POST /api/generate-messages` | OpenAI (`gpt-4o-mini`) | Por token |
| `POST /api/generate-messages/batch` | OpenAI | Por token × leads |

La protección existente (`x-api-key` en header) es suficiente para staging privado, pero no protege contra un usuario legítimo (con clave válida) que dispare peticiones en bucle.

**Mitigación aceptable para staging:** la aprobación admin requerida para acceder al dashboard reduce el riesgo. Sin embargo, si la `SEARCH_API_KEY` se filtra, cualquier persona puede llamar a estas rutas desde fuera de la UI.

---

### RIESGO #3 — `/api/status` sin autenticación

La ruta `GET /api/status?search_id=<uuid>` no valida el header `x-api-key`. Cualquier persona con un UUID válido (o que lo adivine) puede consultar el estado de una búsqueda.

**Impacto real:** bajo, ya que los UUIDs son no predecibles. No es un bloqueador para staging.

---

### RIESGO #4 — `agent_v2.ts` lee el filesystem en runtime

La función `loadAllADRs()` en `src/lib/agent_v2.ts` lee `docs/adr/*.md` usando `fs.readFileSync` en tiempo de ejecución:

```typescript
const adrDir = join(process.cwd(), 'docs', 'adr')
```

En Vercel, `process.cwd()` apunta a `/var/task` (la raíz del deployment). El directorio `docs/adr/` **no está gitignoreado**, por lo que se desplegará con el código y la lectura funcionará correctamente.

**Condición:** si en el futuro se añade `docs/` a `.vercelignore`, esta función fallará silenciosamente (devuelve `'(docs/adr/ no encontrado)'`). Documentado como dependencia implícita.

---

## Protecciones básicas para staging — estado actual

| Protección | Estado |
|---|---|
| Auth con admin approval para acceder al dashboard | ✅ Activo |
| HttpOnly cookies (no XSS en tokens) | ✅ Activo |
| Middleware protege `/dashboard/*` y `/admin/*` | ✅ Activo |
| `x-api-key` en todos los endpoints de negocio | ✅ Activo (excepto /api/status) |
| RPC transaccional para approve/reject | ✅ Activo |
| Signup abierto (pero requiere aprobación manual) | ✅ Controlado |
| Rate limiting | ❌ No implementado |
| IP allowlist / Basic Auth en staging | ❌ No implementado |

Para un staging **de acceso privado y restringido** (equipo reducido, cuentas aprobadas manualmente), el nivel de protección es suficiente. No es adecuado para una URL pública indexable.

---

## Inconsistencias menores detectadas

| Ubicación | Descripción |
|---|---|
| `CONTEXT.md` → Arquitectura | Dice "Búsqueda: Serper.dev" pero el stack real usa SearchAPI.io (ver `.env.example` y código) |
| `package.json` → `name` | `"linkedin-scraper-v1"` — no refleja que es V2/V3 |
| `next.config.mjs` | Comentario dice "Las búsquedas pueden tardar varios minutos" pero no define `maxDuration` — inconsistencia entre intención y configuración |

Estas inconsistencias no bloquean el despliegue pero deben corregirse para evitar confusión.

---

## Checklist de pre-despliegue

```
[ ] npm run lint — sin errores
[ ] npm run build — sin errores
[ ] Configurar las 11 variables de entorno en Vercel dashboard
[ ] NEXT_PUBLIC_APP_URL = https://<proyecto>.vercel.app
[ ] NEXT_PUBLIC_ADMIN_EMAIL = email del primer admin
[ ] (Código) Añadir export const maxDuration = 300 en /api/search/route.ts
[ ] (Código) Crear .vercelignore para excluir leads_raw.json, mensajes_listos.json, scripts/, docs/
[ ] Verificar que Supabase no está pausado (tier gratuito pausa tras 7 días sin actividad)
[ ] Confirmar que SearchAPI.io tiene créditos disponibles
```

Los ítems marcados como `(Código)` requieren una tarea separada de código antes de desplegar.

---

## Recomendación final

**LISTO CON RESTRICCIONES** — no desplegar hasta resolver los 2 bloqueadores:

1. `export const maxDuration = 300` en `/api/search/route.ts` (sin esto, las búsquedas no funcionan en Vercel)
2. `.vercelignore` para excluir archivos de datos con posibles perfiles de personas

Una vez resueltos los bloqueadores, el despliegue en un entorno **Vercel Pro (staging privado)** es viable con las 11 variables de entorno configuradas.

---

## Próxima tarea recomendada

**DEPLOY-PREP-01** — Preparar el proyecto para Vercel:
1. Añadir `export const maxDuration = 300` a `/api/search/route.ts`
2. Crear `.vercelignore` con los archivos y directorios a excluir
3. Corregir referencia stale "Serper.dev" → "SearchAPI.io" en `CONTEXT.md`
4. Ejecutar `npm run build` y `npm run lint` — verificar que no hay errores
5. Documentar el resultado en `CONTEXT.md`

Solo después de esa tarea proceder con el despliegue en Vercel.

---

## Referencias

- Contexto del proyecto: `CONTEXT.md`
- Objetivo comercial: `docs/decisions/DOC-BASE-01-objetivo-comercial-talent4pro.md`
- Motor de búsqueda: `src/app/api/search/route.ts`
- Motor de mensajes V2: `src/lib/agent_v2.ts` · `src/app/api/generate-v2/route.ts`
- Variables de entorno: `.env.example`
- Configuración Next.js: `next.config.mjs`
