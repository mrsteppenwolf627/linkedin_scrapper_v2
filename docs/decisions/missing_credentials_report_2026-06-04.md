# Missing Credentials Report — Auditoría de Entorno Local
> Fecha: 2026-06-04  
> Ingeniero: Claude Code (Infrastructure Audit)  
> Metodología: Guía Proyectos Grandes

---

## 1. Resumen Ejecutivo

| Severidad | Hallazgos | Impacto |
|---|---|---|
| 🔴 CRÍTICO | 2 variables | Bloquean funcionalidad core |
| 🟡 MEDIO | 3 variables | Documentación desactualizada / nombre incorrecto |
| 🟢 INFO | 2 variables | Presentes pero no documentadas en .env.example |

**Veredicto global:** Entorno de desarrollo **parcialmente configurado**. El orquestador de IA crashea al arrancar. El cliente de autenticación browser tiene riesgo latente de fallo silencioso.

---

## 2. Tabla Comparativa: .env.example vs .env.local

| Variable | En .env.example | En .env.local | Estado | Usada en código |
|---|:---:|:---:|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | OK | `src/lib/supabase.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ❌ | **🔴 FALTANTE** | `src/lib/supabase.ts:35` (createBrowserClient) |
| `SUPABASE_ANON_KEY` | ❌ | ✅ | 🟡 Nombre incorrecto | `src/app/api/auth/signin/route.ts:27` (fallback) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | OK | `src/lib/supabase.ts:11` |
| `ANTHROPIC_API_KEY` | ✅ | ❌ | **🔴 FALTANTE** | `scripts/orchestrate.ts` |
| `OPENAI_API_KEY` | ✅ | ✅ | OK | `src/lib/claude_prompts.ts:46` |
| `SEARCHAPI_IO_KEY` | ❌ | ✅ | 🟡 No documentada | `src/lib/google_search.ts:16` |
| `SEARCH_API_KEY` | ✅ | ✅ | OK | 8 API routes (guard) |
| `NEXT_PUBLIC_SEARCH_API_KEY` | ❌ | ✅ | 🟡 No documentada | 5 páginas frontend (x-api-key header) |
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ | OK | Configuración general |
| `GOOGLE_API_KEY` | ✅ | ❌ | 🟡 Obsoleta (V1) | **NO usada** — código usa SearchAPI.io |
| `GOOGLE_CX` | ✅ | ❌ | 🟡 Obsoleta (V1) | **NO usada** — reemplazada por SearchAPI.io |
| `NEXT_PUBLIC_ADMIN_EMAIL` | ❌ | ✅ | 🟢 INFO | Config opcional |

---

## 3. Hallazgos Críticos

### 🔴 CRÍTICO #1: `ANTHROPIC_API_KEY` — COMPLETAMENTE AUSENTE

**Componente afectado:** `scripts/orchestrate.ts` → función `getAnthropic()`

```typescript
// scripts/orchestrate.ts:38
function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY no está configurada en .env.local')
  return new Anthropic({ apiKey })
}
```

**Síntoma al ejecutar:**
```
[ERROR FATAL] Error: ANTHROPIC_API_KEY no está configurada en .env.local
```

**Impacto:** `npm run audit:messages`, `npm run test:drafting:live`, y el Paso 3 del orquestador fallan completamente. El agente `claude-sonnet-4-6` no puede inicializarse.

**✅ Solución — añadir a `.env.local`:**
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Dónde obtenerla:** [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key

---

### 🔴 CRÍTICO #2: `NEXT_PUBLIC_SUPABASE_ANON_KEY` — NOMBRE INCORRECTO

**Situación:** `.env.local` tiene `SUPABASE_ANON_KEY` (sin prefijo `NEXT_PUBLIC_`), pero `supabase.ts` necesita `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

```typescript
// src/lib/supabase.ts:34-35
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // ← busca NEXT_PUBLIC_ prefix
```

```typescript
// src/app/api/auth/signin/route.ts:27 — tiene fallback temporal
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
//                           ↑ este funciona         ↑ este falla silenciosamente
```

**Impacto real:**
- ✅ Login funciona (signin route tiene el fallback `SUPABASE_ANON_KEY`)
- ❌ `createBrowserClient()` en `supabase.ts` lanza excepción al usarse en componentes client-side que invoquen autenticación directamente vía browser

**✅ Solución — añadir alias en `.env.local`:**
```env
# Ya tienes SUPABASE_ANON_KEY. Añade el alias con NEXT_PUBLIC_:
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# (mismo valor que SUPABASE_ANON_KEY)
```

---

## 4. Hallazgos Medios

### 🟡 MEDIO #3: `SEARCHAPI_IO_KEY` — No documentada en .env.example

**El código usa SearchAPI.io, no Google CSE.**

```typescript
// src/lib/google_search.ts:16
const apiKey = process.env.SEARCHAPI_IO_KEY
// ↑ SearchAPI.io, NOT Google Custom Search Engine
```

`.env.example` documenta `GOOGLE_API_KEY` / `GOOGLE_CX` (V1 legacy, ya no se usan). 
`.env.local` tiene `SEARCHAPI_IO_KEY=ra3DVgFGzurj2fRpmUpJp2nd` ✅

**Acción requerida:** Actualizar `.env.example` (hecho en este reporte).

### 🟡 MEDIO #4: `NEXT_PUBLIC_SEARCH_API_KEY` — No documentada en .env.example

Usada por **5 páginas del frontend** como header de autenticación:

```typescript
// src/app/dashboard/search/page.tsx:141
"x-api-key": process.env.NEXT_PUBLIC_SEARCH_API_KEY ?? ""
// src/app/dashboard/searches/page.tsx:23
// src/components/BatchProgress.tsx:23
// ...
```

Está en `.env.local` como `NEXT_PUBLIC_SEARCH_API_KEY=dev_secret_key_123` ✅  
Pero no está documentada en `.env.example`.

---

## 5. Análisis de Rutas del Frontend

### ¿Apuntan a localhost o servicios remotos?

**Respuesta: 100% local.** Todas las llamadas del frontend usan rutas relativas.

```typescript
// Patrón uniforme en TODOS los componentes:
fetch("/api/searches", ...)
fetch("/api/generate-messages", ...)
fetch("/api/batches", ...)
fetch("/api/auth/signin", ...)
// → Se resuelven como localhost:3000/api/... en desarrollo ✅
```

**No se detectaron URLs de producción hardcodeadas en el frontend.**

La única URL externa hardcodeada es en el backend del scraper:
```typescript
// src/lib/google_search.ts:23 — INTENCIONADA (cliente externo de SearchAPI.io)
const url = new URL('https://www.searchapi.io/api/v1/search')
```
Esta es correcta: es el endpoint del servicio externo de búsqueda, no una URL de la propia app.

---

## 6. Configuración Dev vs Producción

| Componente | Dev | Producción | Estado |
|---|---|---|---|
| Cookie `secure` | `false` | `true` | ✅ Correcto (`NODE_ENV === 'production'`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Pendiente configurar | ✅ Dev OK |
| Supabase | Proyecto real (pausado) | Mismo proyecto | ⚠️ No hay entorno staging |
| SearchAPI.io | Key real de producción | Misma key | ⚠️ No hay key de desarrollo separada |
| OpenAI | Key real | Misma key | ⚠️ Sin separación dev/prod |
| Anthropic | ❌ No configurada | — | 🔴 BLOCKER |

**Observación:** El proyecto usa un único set de credenciales para dev y producción. No hay entorno staging. Esto es aceptable en fase early-dev, pero representa riesgo en producción (un test en local consume créditos reales de API).

---

## 7. Pasos de Resolución (ordenados por prioridad)

### Paso 1 — Añadir `ANTHROPIC_API_KEY` (🔴 BLOCKER)

```bash
# Editar .env.local y añadir:
ANTHROPIC_API_KEY=sk-ant-api03-[tu-key-aquí]
```

**Dónde:** `C:\Users\a.alarcon\Desktop\Cursor projects\linkedin scrapper v2\.env.local`  
**Consola:** [console.anthropic.com → API Keys](https://console.anthropic.com)

### Paso 2 — Añadir alias `NEXT_PUBLIC_SUPABASE_ANON_KEY` (🔴 BLOCKER latente)

```bash
# Copiar el valor de SUPABASE_ANON_KEY y añadir con prefijo NEXT_PUBLIC_:
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZmdsaWh1eHphb2hvaHVxdGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDEyNjksImV4cCI6MjA4OTU3NzI2OX0.zkoGSrdqPCkgQNE4CVDdvGhJ3WGo1KmjR3g92MwWweg
```

### Paso 3 — Verificar entorno tras cambios

```bash
npm run dev
# → Navegar a http://localhost:3000
# → Probar login con cuenta existente
# → Ejecutar: tsx --tsconfig tsconfig.json scripts/orchestrate.ts
```

---

## 8. Estado Post-Corrección Esperado

```
.env.local (estado objetivo)
├── NEXT_PUBLIC_SUPABASE_URL          ✅ presente
├── NEXT_PUBLIC_SUPABASE_ANON_KEY     ✅ [AÑADIR]
├── SUPABASE_ANON_KEY                 ✅ presente (mantener)
├── SUPABASE_SERVICE_ROLE_KEY         ✅ presente
├── ANTHROPIC_API_KEY                 ✅ [AÑADIR]
├── OPENAI_API_KEY                    ✅ presente
├── SEARCHAPI_IO_KEY                  ✅ presente
├── SEARCH_API_KEY                    ✅ presente
├── NEXT_PUBLIC_SEARCH_API_KEY        ✅ presente
├── NEXT_PUBLIC_APP_URL               ✅ presente
└── NEXT_PUBLIC_ADMIN_EMAIL           ✅ presente
```
