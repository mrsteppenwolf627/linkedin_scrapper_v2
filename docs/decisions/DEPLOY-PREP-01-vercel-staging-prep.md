# DEPLOY-PREP-01: Preparación Mínima para Staging en Vercel

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Infraestructura · Despliegue |
| **Resuelve** | Bloqueadores #1 y #2 de `DEPLOY-CHECK-01` |
| **Afecta a** | `src/app/api/search/route.ts` · `.vercelignore` |

---

## Objetivo

Resolver los 2 bloqueadores detectados en `DEPLOY-CHECK-01` que impedían el despliegue del proyecto en Vercel como entorno de staging privado.

---

## Cambios realizados

### 1. `src/app/api/search/route.ts` — `export const maxDuration = 300`

**Problema resuelto:** la ruta `/api/search` implementa Server-Sent Events (SSE) para búsquedas que pueden durar varios minutos. Sin `maxDuration`, Vercel aplica el timeout por defecto del plan:
- Hobby: 10 segundos → búsqueda inoperable
- Pro: 300 segundos, pero sin declaración explícita el comportamiento no estaba garantizado

**Cambio:** se añadió `export const maxDuration = 300` junto al `export const dynamic = 'force-dynamic'` ya existente.

```typescript
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // segundos — búsquedas SSE pueden tardar varios minutos
```

Solo se añadió una línea. El resto del archivo (handler, SSE, auth, lógica) no se tocó.

---

### 2. `.vercelignore` — creado en la raíz del proyecto

**Problema resuelto:** Vercel desplegaba todos los archivos no excluidos por `.gitignore`, incluyendo `leads_raw.json` y `mensajes_listos.json`, que pueden contener perfiles reales de personas (nombres, empresas, URLs LinkedIn).

**Archivos excluidos del deployment:**

| Archivo / directorio | Motivo |
|---|---|
| `leads_raw.json` | Datos de salida locales — pueden contener perfiles reales |
| `mensajes_listos.json` | Datos de salida locales — mensajes generados con datos de personas |
| `.env` · `.env.local` · `.env.*.local` | Variables de entorno — nunca deben subir al servidor |
| `.context-backups/` | Backups internos del proyecto, sin relevancia en producción |
| `node_modules/` | Vercel instala dependencias durante el build |
| `.next/` | Build local — Vercel genera el suyo propio |
| `scripts/` | Scripts de desarrollo local, no necesarios en runtime |
| `tests/` | Tests locales, no necesarios en runtime |
| `migrations/` | SQL para Supabase CLI local — no se ejecutan en Vercel |
| `*.log` · `next-dev.log` · etc. | Logs de desarrollo local |

**`docs/` NO está excluido** — decisión explícita. `src/lib/agent_v2.ts` lee `docs/adr/*.md` en runtime mediante `fs.readFileSync`. Si `docs/` se excluyera del deployment, `loadAllADRs()` fallaría silenciosamente y el agente de redacción V2 operaría sin las restricciones de tono/marca definidas en los ADRs.

---

## Qué NO se ha tocado

- Lógica de búsqueda (`executeLinkedInSearch`, `generateGoogleQuery`)
- Prompts de ningún tipo (`agent_v2.ts`, `claude_prompts.ts`)
- UI / componentes React
- Endpoints de autenticación o admin
- Variables de entorno o sus nombres
- Base de datos / migraciones
- Configuración de SearchAPI.io

---

## Riesgo residual

Los riesgos identificados en `DEPLOY-CHECK-01` como "aceptables para staging" permanecen sin cambios:

| Riesgo | Estado tras esta tarea |
|---|---|
| `NEXT_PUBLIC_SEARCH_API_KEY` expuesta en bundle del cliente | Sin cambios — aceptable para staging privado |
| `/api/status` sin `x-api-key` | Sin cambios — bajo impacto (UUIDs no predecibles) |
| Sin rate limiting en endpoints de IA/búsqueda | Sin cambios — mitigado por aprobación admin |
| `agent_v2.ts` lee `docs/adr/` del filesystem | Ahora garantizado: `docs/` incluido en deployment |

**Pendiente de resolución antes del primer deploy:**

1. Configurar las 11 variables de entorno en el dashboard de Vercel (Settings → Environment Variables)
2. Establecer `NEXT_PUBLIC_APP_URL` con la URL real de Vercel (no `localhost:3000`)
3. Verificar que `npm run build` pasa sin errores localmente
4. Confirmar que Supabase no está pausado (tier gratuito pausa tras 7 días)
5. Confirmar créditos disponibles en SearchAPI.io

---

## Próxima tarea recomendada

**DEPLOY-01** — Primer despliegue en Vercel staging:

1. Instalar Vercel CLI: `npm i -g vercel`
2. Ejecutar `npm run build` localmente — confirmar 0 errores
3. Vincular el proyecto: `vercel link`
4. Subir las 11 variables de entorno: `vercel env add` (o dashboard)
5. Desplegar en preview: `vercel deploy`
6. Verificar rutas críticas: `/`, `/login`, `/dashboard`, `/api/status`
7. Probar una búsqueda real para confirmar que el SSE funciona con `maxDuration = 300`

---

## Referencias

- Auditoría previa: `docs/decisions/DEPLOY-CHECK-01-vercel-staging-readiness.md`
- Ruta modificada: `src/app/api/search/route.ts`
- Archivo creado: `.vercelignore`
- Motor V2 (dependencia de `docs/`): `src/lib/agent_v2.ts` → función `loadAllADRs()`
