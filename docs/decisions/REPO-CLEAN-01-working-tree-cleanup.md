# REPO-CLEAN-01: Limpieza del Working Tree antes de MSG-TEST-04

| Campo | Valor |
|---|---|
| **Fecha** | 2026-06-25 |
| **Estado** | COMPLETA |
| **Autor** | Claude Code (Backend Architect) |
| **Categoría** | Infraestructura · Repositorio |
| **Afecta a** | `.gitignore` · `scripts/test_msg_v2_talent4pro.ts` |

---

## Archivos detectados (`git status --short` inicial)

```
?? .codex/
?? next-dev.log
?? next-node.err.log
?? next-node.out.log
?? scripts/test_msg_v2_talent4pro.ts
```

---

## Decisión por archivo

| Archivo | Decisión | Motivo |
|---|---|---|
| `.codex/` | **IGNORAR** — añadir a `.gitignore` | Directorio interno de Codex (equivalente a `.claude/`). Contiene `next-dev.err.log` y `next-dev.out.log`. No debe versionarse. |
| `next-dev.log` | **IGNORAR** — añadir a `.gitignore` | Log de desarrollo del servidor Next.js. Artefacto local efímero. |
| `next-node.err.log` | **IGNORAR** — añadir a `.gitignore` | Stderr del proceso Node en dev. Artefacto local efímero. |
| `next-node.out.log` | **IGNORAR** — añadir a `.gitignore` | Stdout del proceso Node en dev. Artefacto local efímero. |
| `scripts/test_msg_v2_talent4pro.ts` | **VERSIONAR** | Script de prueba del motor V2 reutilizable para todos los MSG-TEST. Sin datos reales: nombres ficticios (Lead-A/B/C/D), empresas inventadas, sin claves hardcodeadas. |

---

## Cambios aplicados

### `.gitignore` actualizado

Añadidas al final del archivo:

```gitignore
# Codex internal files
.codex/

# Runtime logs (Next.js dev + node process)
next-dev.log
next-node.err.log
next-node.out.log
*.log
```

El patrón `*.log` cubre también cualquier log futuro que genere Next.js o Node en desarrollo. La sección `.claude/` ya existía — `.codex/` se añade en la misma sección para consistencia.

### `scripts/test_msg_v2_talent4pro.ts` versionado

El script:
- Usa `orchestrateV2()` del motor V2 exportable
- Contiene 4 leads ficticios con nombres anonimizados (`Lead-A`, `Lead-B`, etc.) y empresas inventadas
- El `SALES_GOAL` de Talent4Pro es el texto canónico del proyecto — ya está en documentación
- No contiene claves, URLs reales, ni datos personales de ningún tipo
- Es reutilizable para MSG-TEST-04 y cualquier prueba futura del motor

---

## Archivos ignorados (no entran al repo)

- `.codex/next-dev.err.log`
- `.codex/next-dev.out.log`
- `next-dev.log`
- `next-node.err.log`
- `next-node.out.log`

---

## Archivos versionados en este commit

- `.gitignore` — actualizado con nuevas entradas
- `scripts/test_msg_v2_talent4pro.ts` — script de prueba del motor V2

---

## Archivos eliminados

Ninguno. No se ha eliminado nada — los logs son ignorados, no borrados del disco.

---

## Estado final de `git status --short` tras el commit

Esperado: working tree limpio (solo archivos ignorados que no aparecen en el status).

---

## Próxima tarea recomendada

**MSG-TEST-04** — Prueba final del motor V2 con los fixes acumulados de MSG-FIX-01B a MSG-FIX-04:

1. Ejecutar `npx tsx --tsconfig tsconfig.json --env-file=.env.local scripts/test_msg_v2_talent4pro.ts`
2. Evaluar 4 leads con criterio estricto de naturalidad (MSG-STYLE-02)
3. Verificar que ningún insight empieza con los patrones prohibidos de MSG-FIX-04
4. Verificar que ningún mensaje usa palabras de la lista ampliada
5. Si 3/4 o 4/4 son APTO → motor listo para deploy operativo en Vercel

---

## Referencias

- Contexto del repo: `CONTEXT.md`
- Gitignore base: `.gitignore`
- Script de prueba: `scripts/test_msg_v2_talent4pro.ts`
- Próxima prueba: `docs/decisions/MSG-TEST-04-*.md` (por crear)
