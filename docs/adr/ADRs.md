# ADRs — Decisiones Arquitectónicas del Agente de Redacción
> Guía Proyectos Grandes · Sección: Módulo de Prospección
> Estado: CONGELADO — no modificar sin consenso del equipo

---

## ADR-001: Modelo y Proveedor de IA

**Decisión:** `claude-sonnet-4-6` (Anthropic) como motor del agente de redacción.
**Por qué:** Sucesor directo de claude-3-5-sonnet; mejor instrucción-following para prompts estructurados con framework explícito. El sistema prompt se cachea entre leads (prompt caching de Anthropic) reduciendo latencia y coste en runs con múltiples leads.
**Consecuencia:** Requiere `ANTHROPIC_API_KEY` en `.env.local`. No intercambiable con OpenAI sin reescribir el agente.

---

## ADR-002: Framework de Mensajes — Estructura Obligatoria (CONGELADO)

Cada secuencia tiene exactamente **3 mensajes** en este orden:

| # | Tipo | Propósito | Longitud |
|---|---|---|---|
| 1 | `observacion` | Apertura basada en dato concreto del lead | 2-3 frases |
| 2 | `insight` | Perspectiva de valor sin pitch | 3-4 frases |
| 3 | `cta_abierto` | Pregunta abierta que invita a compartir opinión | 1-2 frases |

**Invariante:** El orden no puede alterarse. Saltarse un tipo rompe el contrato de datos con el módulo de prospección.

---

## ADR-003: Voz y Tono (CONGELADO)

- **Idioma:** Español neutro, peninsular. Sin latinismos ni regionalismos.
- **Registro:** Profesional directo. Tuteo (no ustedeo).
- **Persona:** Primera persona singular del redactor. No "nosotros".
- **Estilo:** Informado, específico, humano. Nunca genérico ni corporativo.
- **Clichés prohibidos:** "En el entorno actual", "el mercado está cambiando", "en estos tiempos", "solución innovadora", "valor añadido", "sinergias".

---

## ADR-004: Prohibiciones Explícitas por Tipo de Mensaje (CONGELADO)

### Mensaje 1 — Observación
- **PROHIBIDO:** Cualquier referencia a haber visto el perfil de LinkedIn.
  - ❌ "Vi tu perfil", "Me llamó la atención tu perfil", "He revisado tu LinkedIn"
  - ❌ Frases de apertura robóticas: "Espero que este mensaje te encuentre bien"
  - ❌ Mencionar la empresa del remitente
  - ❌ Halagos genéricos: "Tu trayectoria es impresionante"

### Mensaje 2 — Insight
- **PROHIBIDO:** Pitch directo o indirecto de producto/servicio.
  - ❌ "Nosotros podemos ayudarte con...", "Nuestra solución...", "Te ofrecemos..."
  - ❌ Datos inventados sin contexto real del lead
  - ❌ Afirmaciones sin respaldo: "El 90% de las empresas..."

### Mensaje 3 — CTA Abierto
- **PROHIBIDO:** CTAs cerrados o transaccionales que presionen a una acción concreta.
  - ❌ "¿Tienes 15 minutos esta semana?", "¿Podemos agendar una llamada?"
  - ❌ Urgencia artificial: "Esta semana tengo hueco...", "Antes del viernes..."
  - ❌ Frases de cierre formulaicas: "Quedo a tu disposición", "Un saludo cordial"
- **OBLIGATORIO:** Terminar con signo de interrogación (?).

---

## ADR-005: Coherencia con el Sistema de Diseño

- El JSON de salida debe ser parseable sin preprocesamiento:
  ```json
  {"observacion": "...", "insight": "...", "cta_abierto": "..."}
  ```
- Los mensajes deben poder copiarse directamente a LinkedIn sin edición manual.
- No incluir salutaciones tipo "Hola [nombre]" — el canal de LinkedIn ya muestra el nombre.
- No incluir firmas ni despedidas en ningún mensaje.
- Sin emojis salvo que el perfil del lead lo justifique explícitamente.

---

## ADR-006: Gestión de Contexto del Lead

- `posts_recientes`: Si está vacío, inferir observación desde `rol` + `empresa`.
- `rol` vacío: Usar `empresa` como único eje de la observación.
- `empresa` vacía: Basarse exclusivamente en el `rol`.
- Nunca inventar datos no presentes en el perfil del lead.
- El `nombre` del lead NO debe aparecer en los mensajes (LinkedIn lo añade automáticamente).
