# DEPLOY-VALIDATE-01: Validación Final Predeploy para Vercel Staging

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Infraestructura · Despliegue · Validación |
| **Veredicto** | 🟡 LISTO CON ADVERTENCIAS |

---

## 1. Estado del repositorio (`git status`)

```
?? .codex/
?? next-dev.log
?? next-node.err.log
?? next-node.out.log
```

**El working tree está limpio.** Solo hay archivos sin trackear — todos son logs de desarrollo local que no se versionen ni se suben. No hay cambios pendientes de commit.

---

## 2. Búsqueda de archivos sensibles versionados

| Archivo | ¿En git? | ¿En .vercelignore? | ¿En .gitignore? | Riesgo |
|---|---|---|---|---|
| `.env` | ❌ No | ✅ Sí | ✅ Sí | Ninguno |
| `.env.local` | ❌ No | ✅ Sí | ✅ Sí | Ninguno |
| `.env.*.local` | ❌ No | ✅ Sí | ✅ Sí | Ninguno |
| `leads_raw.json` | ⚠️ **SÍ** | ✅ Sí | ❌ **No** | Moderado |
| `mensajes_listos.json` | ⚠️ **SÍ** | ✅ Sí | ❌ **No** | Moderado |
| `*.log` (locales) | ❌ No | ✅ Sí | ✅ Sí | Ninguno |

### Análisis de `leads_raw.json` y `mensajes_listos.json`

Estos dos archivos **están versionados en git** pero **no están en `.gitignore`**. Están correctamente incluidos en `.vercelignore`, lo que significa que Vercel **no los desplegará** ni los servirá en producción.

Sin embargo, permanecen en el historial de git. Si el repositorio fuera público o compartido, estos archivos (que pueden contener nombres reales, empresas y URLs de LinkedIn) serían accesibles.

**Para staging privado en Vercel (repositorio privado):** el riesgo es bajo — `.vercelignore` los protege del deployment. No es bloqueador.

**Tarea pendiente (fuera del alcance de este sprint):** añadir `leads_raw.json` y `mensajes_listos.json` a `.gitignore` y ejecutar `git rm --cached` para sacarlos del tracking.

---

## 3. Revisión de `.vercelignore`

```
leads_raw.json          ✅ excluido
mensajes_listos.json    ✅ excluido
.env / .env.local       ✅ excluido
.context-backups/       ✅ excluido
node_modules/           ✅ excluido
.next/                  ✅ excluido
scripts/                ✅ excluido
tests/                  ✅ excluido
migrations/             ✅ excluido
*.log                   ✅ excluido
docs/                   ✅ NO excluido — correcto
.env.example            ✅ NO excluido — correcto
```

**`docs/` no está excluido**: decisión correcta. `src/lib/agent_v2.ts` → función `loadAllADRs()` lee `docs/adr/*.md` en runtime mediante `fs.readFileSync(join(process.cwd(), 'docs', 'adr'))`. Si `docs/` se excluyera, el agente V2 operaría sin las restricciones de tono definidas en los ADRs.

---

## 4. Variables de entorno necesarias para Vercel

Configurar en **Vercel Dashboard → Settings → Environment Variables** antes del primer deploy.

| Variable | Entorno Vercel | Propósito | Fuente |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview | URL pública del proyecto Supabase | supabase.com → proyecto → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production + Preview | Anon key (browser client) | supabase.com → proyecto → Settings → API |
| `SUPABASE_ANON_KEY` | Production + Preview | Anon key (server-side, `/api/auth/signin`) | Mismo valor que `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Production + Preview | Service role — solo server-side, nunca exponer | supabase.com → proyecto → Settings → API |
| `ANTHROPIC_API_KEY` | Production + Preview | Agente V2 (`claude-sonnet-4-6`) | console.anthropic.com → API Keys |
| `OPENAI_API_KEY` | Production + Preview | Motor V1 (`gpt-4o-mini`) + scraper | platform.openai.com → API Keys |
| `SEARCHAPI_IO_KEY` | Production + Preview | Motor de búsqueda SearchAPI.io | searchapi.io → Dashboard → API Key |
| `SEARCH_API_KEY` | Production + Preview | Clave interna de protección endpoints `/api/*` | Valor aleatorio — `openssl rand -hex 32` |
| `NEXT_PUBLIC_SEARCH_API_KEY` | Production + Preview | Misma clave, expuesta al frontend | **Debe coincidir exactamente con `SEARCH_API_KEY`** |
| `NEXT_PUBLIC_APP_URL` | Production + Preview | URL base de la app — **NO localhost** | URL del proyecto en Vercel: `https://<proyecto>.vercel.app` |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Production + Preview | Email del administrador inicial | Email del primer admin |

**Total: 11 variables.** Ninguna tiene valor por defecto seguro para producción. Todas son obligatorias — el servidor no arranca correctamente sin ellas.

### Advertencia sobre `SEARCH_API_KEY`

Este valor actúa como contraseña interna para los endpoints `/api/*`. Debe ser un string aleatorio y único para staging. No reutilizar valores de desarrollo local.

---

## 5. Resultado de build y lint

### `npm run build` ✅

```
▲ Next.js 15.5.14
✓ Compiled successfully in 2.1s
✓ Linting and checking validity of types
✓ Generating static pages (26/26)
```

26 rutas compiladas — 0 errores, 0 warnings de TypeScript.

### `npm run lint` ⚠️ No ejecutable en modo no interactivo

`next lint` requiere configuración interactiva de ESLint (elige strict/base/cancel). El proyecto no tiene archivo `.eslintrc` ni `eslint.config.js`. El lint falla con un prompt interactivo que no puede ejecutarse en modo automatizado.

**Impacto:** el lint de Next.js no está disponible. Sin embargo, el build (`next build`) ejecuta chequeo de tipos TypeScript (`tsc`) de forma integrada y lo supera limpiamente — esto cubre el riesgo más importante. El lint de estilo (ESLint) es una mejora futura, no un bloqueador para staging.

### `bash validate-context.sh` ✅

```
RESULTADO: CONTEXT.md válido. Todos los campos obligatorios presentes.
EXIT_CODE 0
```

---

## 6. Checklist final para despliegue en Vercel

### Pre-deploy (hacer antes de lanzar el comando)

```
[✅] npm run build — pasa sin errores (verificado 2026-06-25)
[✅] validate-context.sh — pasa (EXIT_CODE 0)
[✅] export const maxDuration = 300 en /api/search/route.ts
[✅] .vercelignore creado y correcto
[✅] Working tree limpio (git status sin cambios pendientes)
[✅] docs/ no excluido de Vercel (agent_v2 puede leer ADRs)
[✅] .env.local en .gitignore — no sube al repo
[ ] Instalar Vercel CLI: npm i -g vercel
[ ] Vincular proyecto: vercel link
[ ] Configurar las 11 variables de entorno en Vercel dashboard
[ ] NEXT_PUBLIC_APP_URL = https://<proyecto>.vercel.app (no localhost)
[ ] Confirmar que Supabase no está pausado
[ ] Confirmar créditos disponibles en SearchAPI.io
[ ] Confirmar saldo en Anthropic y OpenAI
```

### Post-deploy (verificar tras el primer deploy)

```
[ ] / (landing) carga sin errores
[ ] /login muestra formulario
[ ] POST /api/auth/signup crea usuario en pending_approval
[ ] Admin puede aprobar usuario en /admin/approvals
[ ] Dashboard accesible tras login con usuario aprobado
[ ] /api/search dispara SSE sin timeout (probar con búsqueda real)
[ ] /api/generate-v2 genera mensajes correctamente
[ ] agent_v2 carga ADRs desde docs/adr/ (verificar en logs de Vercel)
```

---

## 7. Advertencias residuales (no bloqueadoras para staging)

| Advertencia | Impacto | Mitigación actual |
|---|---|---|
| `leads_raw.json` y `mensajes_listos.json` en git (no en `.gitignore`) | Moderado si el repo se hace público | `.vercelignore` los excluye del deployment |
| ESLint no configurado (`npm run lint` no funciona) | Bajo — TypeScript cubre los errores de tipo | `next build` ejecuta `tsc` integrado |
| `NEXT_PUBLIC_SEARCH_API_KEY` expuesta en bundle del cliente | Bajo para staging privado | Usuarios aprobados manualmente por admin |
| Sin rate limiting en endpoints de IA | Bajo para staging privado | Aprobación admin + `SEARCH_API_KEY` como barrera |
| `/api/status` sin `x-api-key` | Muy bajo — UUIDs no predecibles | Aceptable para staging |

---

## Veredicto final

**🟡 LISTO CON ADVERTENCIAS**

El proyecto puede desplegarse en Vercel staging privado. Los 2 bloqueadores de `DEPLOY-CHECK-01` están resueltos (`maxDuration` + `.vercelignore`). El build pasa limpio. Las advertencias documentadas no impiden el staging para un equipo pequeño con acceso controlado.

**Condición única antes de lanzar el primer deploy:** configurar las 11 variables de entorno en el dashboard de Vercel.

---

## Próxima tarea recomendada

**DEPLOY-01** — Primer despliegue en Vercel staging:

1. `npm i -g vercel` (si no está instalado)
2. `vercel link` — vincular el repositorio local al proyecto Vercel
3. Configurar las 11 variables vía `vercel env add` o el dashboard
4. `vercel deploy` — deploy en preview
5. Verificar checklist post-deploy
6. Documentar resultado en `CONTEXT.md`

**Tarea paralela recomendada (limpieza, baja prioridad):**
Añadir `leads_raw.json` y `mensajes_listos.json` a `.gitignore` + `git rm --cached` para sacarlos del historial futuro.

---

## Referencias

- Auditoría original: `docs/decisions/DEPLOY-CHECK-01-vercel-staging-readiness.md`
- Preparación de bloqueadores: `docs/decisions/DEPLOY-PREP-01-vercel-staging-prep.md`
- Variables de entorno de referencia: `.env.example`
- Motor SSE con `maxDuration`: `src/app/api/search/route.ts`
- Motor V2 (lee `docs/adr/`): `src/lib/agent_v2.ts`
