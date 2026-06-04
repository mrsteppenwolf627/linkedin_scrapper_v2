#!/usr/bin/env bash
# validate-context.sh — Valida que CONTEXT.md cumpla la Guía para Proyectos Grandes
# Uso: bash validate-context.sh [ruta/al/CONTEXT.md]

set -euo pipefail

CONTEXT_FILE="${1:-CONTEXT.md}"
ERRORS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================================"
echo "  Validador CONTEXT.md — Guía para Proyectos Grandes"
echo "======================================================"
echo ""

# ── 1. Archivo existe ─────────────────────────────────────
if [[ ! -f "$CONTEXT_FILE" ]]; then
  echo -e "${RED}[ERROR]${NC} No se encontró el archivo: $CONTEXT_FILE"
  exit 1
fi
echo -e "${GREEN}[OK]${NC}    Archivo encontrado: $CONTEXT_FILE"

# ── Helper: comprobar sección obligatoria ─────────────────
check_section() {
  local label="$1"
  local pattern="$2"
  if grep -qE "$pattern" "$CONTEXT_FILE"; then
    echo -e "${GREEN}[OK]${NC}    Campo obligatorio presente: $label"
  else
    echo -e "${RED}[ERROR]${NC} Campo obligatorio ausente: $label  (patrón: $pattern)"
    ERRORS=$((ERRORS + 1))
  fi
}

# ── Helper: comprobar que una sección no está vacía ────────
check_section_not_empty() {
  local label="$1"
  local header_pattern="$2"
  # Extrae líneas desde la cabecera hasta la siguiente cabecera ## o EOF
  local content
  content=$(awk "/$header_pattern/{found=1; next} found && /^## /{exit} found{print}" "$CONTEXT_FILE" | grep -v '^\s*$' || true)
  if [[ -n "$content" ]]; then
    echo -e "${GREEN}[OK]${NC}    Sección con contenido: $label"
  else
    echo -e "${YELLOW}[WARN]${NC}  Sección vacía o sin contenido útil: $label"
    ERRORS=$((ERRORS + 1))
  fi
}

echo ""
echo "── Campos Obligatorios ──────────────────────────────"

# Sección ## Arquitectura
check_section "## Arquitectura" "^## Arquitectura"
check_section_not_empty "Arquitectura" "^## Arquitectura"

# Sección ## Estado Actual
check_section "## Estado Actual" "^## Estado Actual"
check_section_not_empty "Estado Actual" "^## Estado Actual"

# Sección ## Última Actualización
check_section "## Última Actualización" "^## (Última|Ultima) Actualizaci"
check_section_not_empty "Última Actualización" "^## (Última|Ultima) Actualizaci"

# Sección ## Backlog Priorizado
check_section "## Backlog Priorizado" "^## Backlog Priorizado"
check_section_not_empty "Backlog Priorizado" "^## Backlog Priorizado"

# Sección ## Restricciones
check_section "## Restricciones" "^## Restricciones"
check_section_not_empty "Restricciones" "^## Restricciones"

echo ""
echo "── Campos de Última Actualización ───────────────────"

# Fecha (formato YYYY-MM-DD)
if grep -qE "^\|?\s*Fecha\s*\|?\s*[0-9]{4}-[0-9]{2}-[0-9]{2}" "$CONTEXT_FILE"; then
  echo -e "${GREEN}[OK]${NC}    Fecha de actualización presente (YYYY-MM-DD)"
else
  echo -e "${RED}[ERROR]${NC} Fecha de actualización ausente o con formato incorrecto (esperado: YYYY-MM-DD)"
  ERRORS=$((ERRORS + 1))
fi

# Responsable
if grep -qE "^\|?\s*Responsable\s*\|" "$CONTEXT_FILE"; then
  echo -e "${GREEN}[OK]${NC}    Campo Responsable presente"
else
  echo -e "${RED}[ERROR]${NC} Campo Responsable ausente en tabla Última Actualización"
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo "── Estructura de Directorios ────────────────────────"

# docs/adr
if [[ -d "docs/adr" ]]; then
  echo -e "${GREEN}[OK]${NC}    Directorio docs/adr existe"
else
  echo -e "${RED}[ERROR]${NC} Directorio docs/adr no existe"
  ERRORS=$((ERRORS + 1))
fi

# docs/decisions
if [[ -d "docs/decisions" ]]; then
  echo -e "${GREEN}[OK]${NC}    Directorio docs/decisions existe"
else
  echo -e "${RED}[ERROR]${NC} Directorio docs/decisions no existe"
  ERRORS=$((ERRORS + 1))
fi

# .context-backups
if [[ -d ".context-backups" ]]; then
  echo -e "${GREEN}[OK]${NC}    Directorio .context-backups existe"
else
  echo -e "${RED}[ERROR]${NC} Directorio .context-backups no existe"
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo "======================================================"
if [[ $ERRORS -eq 0 ]]; then
  echo -e "${GREEN}RESULTADO: CONTEXT.md válido. Todos los campos obligatorios presentes.${NC}"
  exit 0
else
  echo -e "${RED}RESULTADO: $ERRORS error(es) encontrado(s). Revisar CONTEXT.md antes de continuar.${NC}"
  exit 1
fi
