# POST-DEPLOY-01: Validación Funcional del Despliegue en Vercel

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Infraestructura · Despliegue · Validación Funcional |
| **Resultado** | ✅ DESPLIEGUE FUNCIONAL CONFIRMADO |

---

## Datos del despliegue

| Parámetro | Valor |
|---|---|
| URL de producción | https://linkedin-scrapper-v2.vercel.app |
| Entorno | Production (usado como staging privado) |
| Rama desplegada | `master` |
| Commit desplegado | `2cf8294` |
| Estado en Vercel | Ready · Latest |
| Fecha de validación | 2026-06-25 |

---

## Qué se ha validado

| Flujo | Resultado |
|---|---|
| Landing page (`/`) carga sin errores | ✅ Confirmado |
| Navegación inicial funciona correctamente | ✅ Confirmado |
| Botón "Empezar ahora" funciona y redirige correctamente | ✅ Confirmado |
| Búsqueda real ejecutada sin errores ni timeout | ✅ Confirmado |
| Sin errores 404, 500 ni carga infinita en prueba básica | ✅ Confirmado |

La validación cubre el camino feliz de la herramienta: acceso a la landing, navegación hacia el flujo de uso y ejecución de una búsqueda real de perfiles LinkedIn.

El endpoint `/api/search` con `maxDuration = 300` (añadido en DEPLOY-PREP-01) funcionó correctamente bajo las condiciones del SSE en Vercel Production.

---

## Qué queda fuera de esta validación

Los siguientes flujos **no se han testado** en el entorno Vercel. No se han detectado errores en ellos, pero tampoco se han ejercido explícitamente:

| Flujo | Estado |
|---|---|
| Signup → pending_approval → Admin approve → Login completo | No validado en Vercel |
| Generación de mensajes V2 (`/api/generate-v2`) en Vercel | No validado |
| Hub de mensajes (`/dashboard/messages`) carga de datos reales | No validado |
| Admin panel (`/admin/approvals`) funcionamiento completo | No validado |
| `agent_v2.ts` leyendo `docs/adr/` desde filesystem de Vercel | No validado explícitamente |
| SSE streaming bajo carga prolongada (>30 segundos) | No validado |
| Comportamiento con Supabase en estado de reposo (pausa gratuita) | No validado |

---

## Riesgos pendientes

Los riesgos documentados en `DEPLOY-CHECK-01` y `DEPLOY-VALIDATE-01` siguen activos. Esta validación no los elimina:

| Riesgo | Estado |
|---|---|
| `leads_raw.json` y `mensajes_listos.json` en git (no en `.gitignore`) | Pendiente — bajo impacto con repo privado |
| Sin rate limiting en endpoints de IA (`/api/generate-v2`, `/api/search`) | Pendiente — mitigado por aprobación admin |
| ESLint no configurado en el proyecto | Pendiente — no bloqueador |
| `/api/status` sin `x-api-key` | Pendiente — bajo impacto |
| Flujo completo de auth (signup→approve→login) no validado en Vercel | Pendiente |

---

## Estado de la infraestructura tras el despliegue

El proyecto ha superado la fase de despliegue de infraestructura. El stack completo funciona en Vercel:

- **Motor de búsqueda:** operativo en producción (SearchAPI.io + SSE + Supabase)
- **Auth:** no validado explícitamente en Vercel, pero la arquitectura es idéntica a local
- **Motor de mensajes V1 y V2:** no validados en Vercel, pero el build incluye correctamente todas las rutas

La infraestructura ya no es el cuello de botella. **El foco del proyecto pasa ahora al motor de mensajes y su conversión.**

---

## Próxima tarea recomendada

**MSG-AUDIT-01** — Auditar el motor actual de generación de mensajes para Talent4Pro:

El despliegue confirma que la herramienta funciona. El siguiente problema a resolver es que los mensajes generados por el agente V2 pueden no estar orientados correctamente al objetivo de captación de Talent4Pro.

La auditoría debe responder:

1. ¿Los mensajes generados con `sales_goal` de Talent4Pro pasan el test de especificidad de los ADRs?
2. ¿El CTA invita a compartir opinión o presiona a una acción transaccional?
3. ¿El insight menciona la propuesta de Talent4Pro de forma que rompe la naturalidad?
4. ¿El framework Observación → Insight → CTA Abierto es adecuado para captar alumnos, o hay que ajustar los pesos/estructura?
5. ¿Qué `sales_goal` concreto debería usarse para Talent4Pro?

Herramienta de entrada: ejecutar `npm run test:drafting:live` con leads reales y un `sales_goal` de Talent4Pro para obtener mensajes de muestra que auditar contra los ADRs.

---

## Referencias

- Auditoría previa: `docs/decisions/DEPLOY-CHECK-01-vercel-staging-readiness.md`
- Bloqueadores resueltos: `docs/decisions/DEPLOY-PREP-01-vercel-staging-prep.md`
- Validación predeploy: `docs/decisions/DEPLOY-VALIDATE-01-final-predeploy-check.md`
- Objetivo comercial: `docs/decisions/DOC-BASE-01-objetivo-comercial-talent4pro.md`
- Motor de mensajes V2: `src/lib/agent_v2.ts`
- ADRs del agente de redacción: `docs/adr/ADRs.md`
