# ADR-004: Mecanismo de Fallback de Leads en Entornos Restringidos

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-04 |
| **Estado** | CONGELADA |
| **Autores** | Codex / Antigravity (Ingeniero Disciplinado) |
| **Revisores** | Claude Code (Backend Architect) |
| **Categoría** | Infraestructura · Orquestador · Resiliencia |
| **Afecta a** | `scripts/orchestrate.ts` · módulo LinkedIn Scraper · agentes de IA del pipeline |

---

## Contexto

El orquestador (`scripts/orchestrate.ts`) depende en su Paso 1 de una conexión activa a Supabase para recuperar los contactos válidos más recientes. Esta conexión falla sistemáticamente en dos escenarios reales y documentados:

1. **Proyecto Supabase pausado** — El tier gratuito de Supabase pausa proyectos inactivos tras 7 días sin tráfico. Reactivar requiere acceso manual al dashboard y puede tardar varios minutos.
2. **Entorno de red restringido** — El sandbox de desarrollo (sesión local de Claude Code, CI/CD sin VPN, máquinas sin acceso a `*.supabase.co`) produce `TypeError: fetch failed` en cualquier llamada al cliente Supabase.

Sin un mecanismo de fallback, cualquiera de estos dos escenarios detiene completamente el pipeline, bloqueando el desarrollo del módulo de prospección (Paso 3: agente de redacción) aunque ese módulo no tenga dependencia real con la base de datos.

**Problema central:** una dependencia de infraestructura en Paso 1 bloqueaba el trabajo válido en Paso 3.

---

## Decisión

**Se adopta un conjunto de datos semilla (*seed leads*) embebido directamente en `scripts/orchestrate.ts` como mecanismo de fallback automático.**

El comportamiento es el siguiente:

```
Paso 1 — runScraper()
  ├── INTENTA conexión Supabase (timeout implícito de fetch)
  │     ✅ Éxito → devuelve contactos reales de BD
  │     ❌ Error (cualquier causa) → captura silenciosa con console.warn
  └── FALLBACK → devuelve SCRAPER_SEED_LEADS (array de LeadRaw hardcodeado)
```

Los seed leads representan perfiles realistas del sector objetivo (energía, B2B España) y cumplen el contrato de datos `{ nombre, empresa, posts_recientes[], rol }` definido en el módulo de prospección.

**El fallback es transparente para los pasos posteriores** — Paso 2 (verificación JSON), Paso 3 (agente de redacción) y Paso 4 (escritura de artefactos) no distinguen entre datos reales y semilla.

### Implementación de referencia

```typescript
// scripts/orchestrate.ts
const SCRAPER_SEED_LEADS: LeadRaw[] = [
  { nombre: 'Carlos Mendoza',   empresa: 'Iberdrola', posts_recientes: [], rol: 'Senior Energy Consultant' },
  { nombre: 'Laura Sánchez',    empresa: 'Endesa',    posts_recientes: [], rol: 'Directora de Desarrollo de Negocio' },
  { nombre: 'Alejandro Torres', empresa: 'Repsol',    posts_recientes: [], rol: 'Head of Renewable Energy Projects' },
]

async function runScraper(): Promise<LeadRaw[]> {
  try {
    // intento primario: Supabase
    const { data, error } = await supabase.from('contacts').select(...)
    if (error || !data?.length) throw new Error(error?.message ?? 'BD vacía')
    return data.map(toLeadRaw)
  } catch (err) {
    console.warn(`⚠️  Supabase no accesible (${err.message}). Usando seed leads.`)
    return SCRAPER_SEED_LEADS   // ← fallback
  }
}
```

---

## Consecuencias

### ✅ Positivas

- **Desarrollo continuo sin bloqueos:** el pipeline completo (incluido el agente de redacción) puede ejecutarse y validarse sin depender del estado de infraestructura.
- **CI/CD independiente:** entornos de prueba sin acceso a red externa pueden ejecutar `npm run test:drafting` y `tsx scripts/orchestrate.ts` sin modificaciones.
- **Degradación controlada:** el sistema no falla silenciosamente — emite `console.warn` con la causa del error antes de activar el fallback.
- **Cero coste de activación:** no requiere variables de entorno adicionales, mocks ni librerías. El fallback es puro código TypeScript.
- **Transparencia arquitectónica:** el comportamiento está documentado en el código y en esta ADR; ningún agente recibe datos de origen incierto.

### ⚠️ Negativas / Trade-offs

- **Riesgo de validación con datos no reales:** en fases tempranas del desarrollo, el agente de redacción y los tests de integración se ejecutan sobre leads sintéticos. Los prompts, el tono y la calidad de los mensajes generados pueden no representar el rendimiento real sobre datos de producción.
- **Deriva de representatividad:** si los seed leads no se actualizan periódicamente, pueden volverse obsoletos respecto al perfil real de los leads en BD (sectores, roles, terminología).
- **Riesgo de normalización del fallback:** si el equipo se acostumbra al fallback, puede no detectar que Supabase está pausado durante días. Mitigación: el `console.warn` hace el estado explícito en cada ejecución.
- **Datos hardcodeados en código fuente:** los seed leads son visibles en el repositorio. No contienen información real de clientes, pero deben mantenerse ficticios y representativos del sector objetivo.

---

## Opciones Consideradas y Descartadas

| Opción | Razón de descarte |
|---|---|
| **Fichero externo `seed_leads.json`** | Añade dependencia de fichero y complejidad de carga. El array embebido es más simple y portable. |
| **Mock de Supabase con `vitest`/`jest`** | Requiere framework de testing adicional. El objetivo era resiliencia del pipeline, no unit testing de Supabase. |
| **Variable de entorno `USE_SEED_LEADS=true`** | Requiere coordinación de entorno. El fallback automático por error es más robusto y no exige gestión manual. |
| **Parar el pipeline con error claro** | Bloqueaba el desarrollo del Paso 3 aunque Supabase fuera irrelevante para ese paso. Inaceptable. |
| **Docker Compose con Supabase local** | Infraestructura excesiva para el problema. Introduce dependencias de Docker que no todos los entornos tienen. |

---

## Protocolo de Mantenimiento

1. **Actualizar seed leads** cuando cambie el perfil de clientes objetivo (sector, roles habituales, terminología).
2. **Nunca sustituir** datos reales de clientes por seed leads en producción. Esta ADR aplica exclusivamente al entorno de desarrollo y CI.
3. **Reactivar Supabase** periódicamente para validar el pipeline con datos reales antes de releases importantes.
4. **Extender los seed leads** (mínimo 5 perfiles) si los tests de integración necesitan mayor cobertura de variedad de roles/sectores.

---

## Consulta Obligatoria por Agentes

> **Esta ADR debe ser leída por cualquier agente de IA que opere sobre el pipeline de orquestación antes de generar código, configuración o mensajes que involucren la fuente de datos de leads.**

Implicaciones concretas para cada agente:

| Agente | Implicación de esta ADR |
|---|---|
| **Claude Code** (Backend) | Al modificar `runScraper()` o el cliente Supabase, preservar el bloque `try/catch` con fallback a `SCRAPER_SEED_LEADS`. |
| **Agente de Redacción** (`claude-sonnet-4-6`) | Saber que los leads pueden ser semilla. No asumir que el nombre, empresa o rol están verificados contra una BD real en fases de desarrollo. |
| **Codex / Antigravity** (Testing) | Los tests de integración sobre `mensajes_listos.json` pueden haber sido generados con seed leads. Documentar el origen en los reports de test. |
| **Gemini CLI** (Frontend) | Si se implementa un indicador de fuente de datos en el dashboard, distinguir entre "leads reales (BD)" y "leads semilla (fallback)". |

---

## Referencias

- Implementación: `scripts/orchestrate.ts` → función `runScraper()` · constante `SCRAPER_SEED_LEADS`
- ADR relacionada: `docs/adr/ADRs.md` → ADR-001 (modelo de IA), ADR-002 (framework de mensajes)
- Contrato de datos: `src/lib/linkedin_scraper.ts` → interface `LeadRawExport`
- Tests afectados: `scripts/test_drafting_agent.ts` → modo estático (valida artefactos que pueden venir de seed)
