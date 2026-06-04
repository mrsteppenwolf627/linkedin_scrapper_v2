// ============================================
// Auditor Técnico de Mensajes — Guía Proyectos Grandes
// Evalúa mensajes_listos.json contra tres pilares:
//   1. BREVEDAD    — ningún mensaje supera 150 palabras
//   2. NATURALIDAD — sin patrones robóticos ni clichés corporativos
//   3. CERO PITCH  — sin palabras/frases de venta agresiva en mensajes 1-2
//
// Genera: docs/decisions/error_report_YYYY-MM-DD.md
// Uso:    tsx --tsconfig tsconfig.json scripts/audit_messages.ts [ruta/a/mensajes.json]
// ============================================

import { config } from 'dotenv'
import { resolve, join } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { existsSync, readFileSync, writeFileSync } from 'fs'

// ── Tipos ─────────────────────────────────────────────
interface Mensaje {
  tipo: 'observacion' | 'insight' | 'cta_abierto'
  texto: string
}

interface MensajeLead {
  lead: string
  empresa: string
  rol: string
  mensajes: Mensaje[]
}

type Pilar = 'BREVEDAD' | 'NATURALIDAD' | 'CERO_PITCH'
type Veredicto = 'OK' | 'ADVERTENCIA' | 'FALLO'

interface ViolacionDetalle {
  pattern: string
  fragmento: string
}

interface ResultadoMensaje {
  tipo: string
  texto: string
  palabras: number
  veredicto: Veredicto
  pilares: Record<Pilar, { estado: Veredicto; violaciones: ViolacionDetalle[] }>
}

interface ResultadoLead {
  lead: string
  empresa: string
  rol: string
  veredictoGlobal: Veredicto
  mensajes: ResultadoMensaje[]
}

// ── Diccionario de patrones por pilar ─────────────────

// CERO PITCH — palabras y frases de venta agresiva
// Aplica principalmente a Observación e Insight (mensajes 1 y 2)
const PITCH_PATTERNS: { pattern: string | RegExp; label: string; severidad: Veredicto }[] = [
  { pattern: /soluciones?\s+energ/i,     label: '"soluciones energéticas" (pitch implícito)', severidad: 'FALLO' },
  { pattern: /nuestra solución/i,         label: '"nuestra solución" (pitch directo)', severidad: 'FALLO' },
  { pattern: /te ofrecemos/i,             label: '"te ofrecemos" (pitch directo)', severidad: 'FALLO' },
  { pattern: /podemos ayudarte/i,         label: '"podemos ayudarte" (pitch directo)', severidad: 'FALLO' },
  { pattern: /diferenciador\s+(clave|significativo|competitivo)?/i, label: '"diferenciador [X]" (sales buzzword)', severidad: 'FALLO' },
  { pattern: /ventaja\s+competitiva/i,    label: '"ventaja competitiva" (sales frame)', severidad: 'FALLO' },
  { pattern: /implementar mejoras/i,      label: '"implementar mejoras" (pitch implícito — asume problemas del lead)', severidad: 'FALLO' },
  { pattern: /áreas?\s+(donde|en las? que)\s+se\s+podr[íi]/i, label: '"áreas donde se podría..." (pitch implícito de mejora)', severidad: 'FALLO' },
  { pattern: /optimizaci[oó]n\s+de\s+sus\s+procesos/i, label: '"optimización de sus procesos" (consulting pitch)', severidad: 'FALLO' },
  { pattern: /diversificar\s+sus?\s+ofertas?/i, label: '"diversificar sus ofertas" (consulting pitch)', severidad: 'FALLO' },
  { pattern: /no\s+solo\s+.{0,40}\s+sino\s+(que\s+)?tambi[eé]n/i, label: '"no solo X sino también Y" (estructura de pitch de ventas)', severidad: 'FALLO' },
  { pattern: /muchas?\s+empresas?\s+est[aá]n/i, label: '"muchas empresas están..." (estadística sin respaldo — ADR-004)', severidad: 'FALLO' },
  { pattern: /creciente\s+demanda/i,      label: '"creciente demanda" (market-speak sin datos)', severidad: 'ADVERTENCIA' },
  { pattern: /eficiencia\s+(operativa|energ[eé]tica)/i, label: '"eficiencia operativa/energética" (buzzword de consultoría)', severidad: 'ADVERTENCIA' },
]

// NATURALIDAD — patrones robóticos, clichés corporativos
const NATURALIDAD_PATTERNS: { pattern: string | RegExp; label: string; severidad: Veredicto }[] = [
  { pattern: /^hola,?\s+\w+/i,            label: '"Hola [nombre]" al inicio (ADR-005: LinkedIn lo añade)', severidad: 'FALLO' },
  { pattern: /he\s+visto\s+que/i,          label: '"he visto que" (referencia al perfil LinkedIn — ADR-004)', severidad: 'FALLO' },
  { pattern: /me\s+llam[oó]\s+la\s+atenci[oó]n/i, label: '"me llamó la atención" (ADR-004)', severidad: 'FALLO' },
  { pattern: /he\s+revisado\s+tu/i,        label: '"he revisado tu..." (referencia al perfil — ADR-004)', severidad: 'FALLO' },
  { pattern: /en\s+un\s+entorno\s+(donde|en\s+el\s+que)/i, label: '"en un entorno donde" (cliché prohibido — ADR-003)', severidad: 'FALLO' },
  { pattern: /en\s+el\s+entorno\s+actual/i, label: '"en el entorno actual" (cliché prohibido — ADR-003)', severidad: 'FALLO' },
  { pattern: /el\s+mercado\s+est[aá]\s+cambiando/i, label: '"el mercado está cambiando" (ADR-003)', severidad: 'FALLO' },
  { pattern: /empresa\s+l[ií]der/i,        label: '"empresa líder" (halago genérico sin sustancia)', severidad: 'ADVERTENCIA' },
  { pattern: /posici[oó]n\s+clave/i,       label: '"posición clave" (halago genérico — ADR-004)', severidad: 'ADVERTENCIA' },
  { pattern: /[aá]rea\s+clave/i,           label: '"área clave" (cliché corporativo)', severidad: 'ADVERTENCIA' },
  { pattern: /cambios\s+significativos/i,  label: '"cambios significativos" (vaguedad corporativa)', severidad: 'ADVERTENCIA' },
  { pattern: /innovaci[oó]n\s+es\s+constante/i, label: '"la innovación es constante" (cliché genérico sin contexto)', severidad: 'FALLO' },
  { pattern: /prioridades\s+estratégicas/i, label: '"prioridades estratégicas" (corporate speak genérico)', severidad: 'ADVERTENCIA' },
  { pattern: /espero\s+que\s+este\s+mensaje/i, label: '"Espero que este mensaje..." (apertura prohibida — ADR-004)', severidad: 'FALLO' },
]

// CTA CERRADO — solo aplica al mensaje tipo cta_abierto
const CTA_CERRADO_PATTERNS: { pattern: string | RegExp; label: string; severidad: Veredicto }[] = [
  { pattern: /\??\s*¿te\s+parece\s+(si|que)\s+conversamos/i, label: '"¿Te parece si conversamos?" (CTA de reunión — ADR-004)', severidad: 'FALLO' },
  { pattern: /\??\s*¿(podemos|podr[íi]amos)\s+(agendar|hablar|reunirnos)/i, label: '"¿Podemos agendar/hablar?" (CTA cerrado — ADR-004)', severidad: 'FALLO' },
  { pattern: /¿tienes\s+\d+\s+minutos/i,  label: '"¿Tienes X minutos?" (CTA de tiempo — ADR-004)', severidad: 'FALLO' },
  { pattern: /esta\s+semana\s+tengo\s+hueco/i, label: '"Esta semana tengo hueco" (urgencia artificial — ADR-004)', severidad: 'FALLO' },
  { pattern: /quedo\s+a\s+tu\s+disposici[oó]n/i, label: '"Quedo a tu disposición" (ADR-004)', severidad: 'FALLO' },
]

// ── Utilidades ──────────────────────────────────────
function contarPalabras(texto: string): number {
  return texto.trim().split(/\s+/).filter(w => w.length > 0).length
}

function buscarPatrones(
  texto: string,
  patterns: { pattern: string | RegExp; label: string; severidad: Veredicto }[]
): ViolacionDetalle[] {
  const violaciones: ViolacionDetalle[] = []
  for (const { pattern, label } of patterns) {
    const rx = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern
    const match = texto.match(rx)
    if (match) {
      violaciones.push({
        pattern: label,
        fragmento: `"...${match[0]}..."`,
      })
    }
  }
  return violaciones
}

function severidadMaxima(violaciones: ViolacionDetalle[], patterns: { pattern: string | RegExp; label: string; severidad: Veredicto }[]): Veredicto {
  if (violaciones.length === 0) return 'OK'
  let hayFallo = false
  let hayAdv = false
  for (const v of violaciones) {
    const found = patterns.find(p => p.label === v.pattern)
    if (found?.severidad === 'FALLO') hayFallo = true
    if (found?.severidad === 'ADVERTENCIA') hayAdv = true
  }
  if (hayFallo) return 'FALLO'
  if (hayAdv) return 'ADVERTENCIA'
  return 'OK'
}

// ── Auditor por mensaje ───────────────────────────────
function auditarMensaje(m: Mensaje): ResultadoMensaje {
  const palabras = contarPalabras(m.texto)

  // ── Pilar 1: BREVEDAD
  const brevEdadViolaciones: ViolacionDetalle[] = []
  let brevEdadEstado: Veredicto = 'OK'
  if (palabras > 150) {
    brevEdadViolaciones.push({ pattern: `Supera 150 palabras`, fragmento: `${palabras} palabras` })
    brevEdadEstado = 'FALLO'
  } else if (palabras > 100) {
    brevEdadViolaciones.push({ pattern: 'Entre 100-150 palabras', fragmento: `${palabras} palabras` })
    brevEdadEstado = 'ADVERTENCIA'
  }

  // ── Pilar 2: NATURALIDAD
  const natViolaciones = buscarPatrones(m.texto, NATURALIDAD_PATTERNS)
  const natEstado = severidadMaxima(natViolaciones, NATURALIDAD_PATTERNS)

  // ── Pilar 3: CERO PITCH
  let pitchViolaciones: ViolacionDetalle[] = []
  let pitchEstado: Veredicto = 'OK'

  if (m.tipo === 'observacion' || m.tipo === 'insight') {
    pitchViolaciones = buscarPatrones(m.texto, PITCH_PATTERNS)
    pitchEstado = severidadMaxima(pitchViolaciones, PITCH_PATTERNS)
  } else if (m.tipo === 'cta_abierto') {
    // CTA: aplica CTA_CERRADO + comprueba que termina con ?
    pitchViolaciones = buscarPatrones(m.texto, CTA_CERRADO_PATTERNS)
    pitchEstado = severidadMaxima(pitchViolaciones, CTA_CERRADO_PATTERNS)
    if (!m.texto.trim().endsWith('?')) {
      pitchViolaciones.push({ pattern: 'CTA no termina con interrogación', fragmento: `último char: "${m.texto.trim().slice(-1)}"` })
      pitchEstado = 'FALLO'
    }
    // CTA con dos preguntas (doble signo de interrogación)
    const nPreguntas = (m.texto.match(/\?/g) ?? []).length
    if (nPreguntas > 1) {
      pitchViolaciones.push({ pattern: `CTA con ${nPreguntas} preguntas (máximo 1 permitida)`, fragmento: m.texto.slice(0, 60) + '...' })
      if (pitchEstado !== 'FALLO') pitchEstado = 'ADVERTENCIA'
    }
  }

  // ── Veredicto global del mensaje
  const estados: Veredicto[] = [brevEdadEstado, natEstado, pitchEstado]
  const veredicto: Veredicto = estados.includes('FALLO')
    ? 'FALLO'
    : estados.includes('ADVERTENCIA')
      ? 'ADVERTENCIA'
      : 'OK'

  return {
    tipo: m.tipo,
    texto: m.texto,
    palabras,
    veredicto,
    pilares: {
      BREVEDAD:    { estado: brevEdadEstado,  violaciones: brevEdadViolaciones },
      NATURALIDAD: { estado: natEstado,        violaciones: natViolaciones },
      CERO_PITCH:  { estado: pitchEstado,      violaciones: pitchViolaciones },
    },
  }
}

// ── Auditor por lead ──────────────────────────────────
function auditarLead(lead: MensajeLead): ResultadoLead {
  const mensajes = lead.mensajes.map(auditarMensaje)
  const veredictoGlobal: Veredicto = mensajes.some(m => m.veredicto === 'FALLO')
    ? 'FALLO'
    : mensajes.some(m => m.veredicto === 'ADVERTENCIA')
      ? 'ADVERTENCIA'
      : 'OK'
  return { lead: lead.lead, empresa: lead.empresa, rol: lead.rol, veredictoGlobal, mensajes }
}

// ── Generador del error report en Markdown ────────────
function generarReport(resultados: ResultadoLead[], archivoOrigen: string): string {
  const hoy = new Date().toISOString().split('T')[0]
  const totalMensajes = resultados.flatMap(r => r.mensajes)
  const fallos = totalMensajes.filter(m => m.veredicto === 'FALLO')
  const advertencias = totalMensajes.filter(m => m.veredicto === 'ADVERTENCIA')
  const ok = totalMensajes.filter(m => m.veredicto === 'OK')

  const icon = (v: Veredicto) => v === 'FALLO' ? '🔴 FALLO' : v === 'ADVERTENCIA' ? '🟡 ADVERTENCIA' : '🟢 OK'

  let md = `# Error Report — Auditoría de Mensajes
> Fecha: ${hoy}
> Archivo auditado: \`${archivoOrigen}\`
> Metodología: Guía Proyectos Grandes — Tres Pilares (Brevedad · Naturalidad · Cero Pitch)

---

## Resumen Ejecutivo

| Métrica | Valor |
|---|---|
| Leads auditados | ${resultados.length} |
| Mensajes totales | ${totalMensajes.length} |
| 🔴 FALLOS | **${fallos.length}** |
| 🟡 ADVERTENCIAS | **${advertencias.length}** |
| 🟢 OK | ${ok.length} |
| Tasa de aprobación | ${Math.round((ok.length / totalMensajes.length) * 100)}% |

### Veredicto por Lead

| Lead | Empresa | Rol | Veredicto |
|---|---|---|---|
${resultados.map(r => `| ${r.lead} | ${r.empresa} | ${r.rol} | ${icon(r.veredictoGlobal)} |`).join('\n')}

---

## Detalle por Lead y Pilar

`

  for (const r of resultados) {
    md += `### Lead: ${r.lead} · ${r.empresa} · ${r.rol}\n\n`
    md += `**Veredicto global:** ${icon(r.veredictoGlobal)}\n\n`

    for (const m of r.mensajes) {
      const iconV = icon(m.veredicto)
      md += `#### Mensaje: \`${m.tipo}\` — ${iconV} (${m.palabras} palabras)\n\n`
      md += `> ${m.texto}\n\n`

      const pilares = (['BREVEDAD', 'NATURALIDAD', 'CERO_PITCH'] as Pilar[])
      for (const pilar of pilares) {
        const p = m.pilares[pilar]
        if (p.estado !== 'OK') {
          md += `**${pilar}** ${icon(p.estado)}\n`
          for (const v of p.violaciones) {
            md += `- ⚠️ ${v.pattern}\n`
            md += `  - Fragmento: ${v.fragmento}\n`
          }
          md += '\n'
        } else {
          md += `**${pilar}** 🟢 OK\n\n`
        }
      }
      md += '---\n\n'
    }
  }

  // ── Análisis de patrones recurrentes ─────────────────
  md += `## Patrones Recurrentes (Top Ofensores)\n\n`

  const patternCount: Record<string, number> = {}
  for (const r of resultados) {
    for (const m of r.mensajes) {
      for (const pilar of Object.values(m.pilares)) {
        for (const v of pilar.violaciones) {
          patternCount[v.pattern] = (patternCount[v.pattern] ?? 0) + 1
        }
      }
    }
  }

  const sorted = Object.entries(patternCount).sort((a, b) => b[1] - a[1])
  if (sorted.length === 0) {
    md += '_No se detectaron patrones recurrentes._\n\n'
  } else {
    md += '| Patrón | Ocurrencias | Severidad |\n|---|---|---|\n'
    for (const [pattern, count] of sorted) {
      const allPatterns = [...PITCH_PATTERNS, ...NATURALIDAD_PATTERNS, ...CTA_CERRADO_PATTERNS]
      const found = allPatterns.find(p => p.label === pattern)
      const sev = found?.severidad ?? 'FALLO'
      md += `| ${pattern} | ${count} | ${sev === 'FALLO' ? '🔴' : '🟡'} |\n`
    }
    md += '\n'
  }

  // ── Optimización del System Prompt ────────────────────
  md += `## Optimización del System Prompt del Agente de Redacción

Los patrones detectados son sistemáticos y corregibles con instrucciones más precisas.
A continuación se propone el **diff** del System Prompt a aplicar en la siguiente iteración.

---

### PATCH 1 — Prohibiciones ampliadas para Mensaje 1 (Observación)

Añadir a la sección \`### MENSAJE 1 — OBSERVACIÓN\`:

\`\`\`diff
+ - PROHIBIDO: restatecer simplemente el cargo y empresa del lead sin añadir contexto propio.
+   ❌ "He notado que trabajas como X en Y" → solo repite lo que ya sabe el lead.
+   ✅ Conecta el cargo con una tensión real del sector o una decisión concreta observable.
+ - PROHIBIDO: calificativos genéricos sobre la empresa:
+   ❌ "empresa líder", "empresa de referencia", "una de las principales empresas"
+ - PROHIBIDO: calificativos genéricos sobre el puesto:
+   ❌ "posición clave", "área clave", "rol estratégico" sin sustancia concreta.
\`\`\`

---

### PATCH 2 — Prohibición del patrón de pitch "no solo X sino también Y"

Añadir a la sección \`### MENSAJE 2 — INSIGHT\`:

\`\`\`diff
+ - PROHIBIDO: la construcción "no solo X sino (que) también Y". Es una estructura
+   de ventas reconocible que rompe la naturalidad y activa la guardia del lector.
+   ❌ "no solo reducen costos, sino que también mejoran la eficiencia"
+   ❌ "no solo cumplir con regulaciones, sino también para mejorar la sostenibilidad"
+   ✅ Usa una sola afirmación directa con el dato o ángulo más relevante para este lead.
+ - PROHIBIDO: generalizaciones sin sujeto concreto:
+   ❌ "Muchas empresas están..." → ¿cuáles? Si no puedes nombrarlas, no lo uses.
+   ❌ "En un entorno donde..." → apertura de cliché de consultoría.
+   ✅ Ancla el insight en algo específico del sector del lead: normativa, evento, tendencia nombrada.
\`\`\`

---

### PATCH 3 — CTA debe contener exactamente una pregunta, abierta y sin pedir reunión

Añadir a la sección \`### MENSAJE 3 — CTA ABIERTO\`:

\`\`\`diff
+ - OBLIGATORIO: exactamente UNA sola pregunta. Ni más ni menos.
+   Si el mensaje contiene dos oraciones, la primera es contexto; la segunda es la pregunta.
+ - PROHIBIDO: preguntas que inviten a una conversación, llamada o reunión:
+   ❌ "¿Te parece si conversamos sobre ello?"
+   ❌ "¿Podemos hablar esta semana?"
+   ❌ "¿Tienes un momento para comentarlo?"
+   ✅ La pregunta debe invitar a compartir una OPINIÓN o PERSPECTIVA, no una agenda:
+   ✅ "¿Cómo estáis abordando X en [empresa] desde vuestra posición?"
+   ✅ "¿Qué peso le estáis dando a Y en vuestra estrategia actual?"
\`\`\`

---

### PATCH 4 — Añadir lista negra de buzzwords a la sección de Restricciones Globales

\`\`\`diff
+ ## LISTA NEGRA DE TÉRMINOS (prohibidos en cualquier mensaje)
+ Los siguientes términos activan la guardia del lector porque suenan a plantilla de CRM:
+
+ | Término prohibido | Por qué | Alternativa |
+ |---|---|---|
+ | "diferenciador" | sales buzzword | describe el beneficio concreto en su lugar |
+ | "soluciones energéticas" | pitch implícito | nombra la tecnología o proceso específico |
+ | "optimización de procesos" | consulting speak | especifica qué proceso y qué palanca |
+ | "eficiencia operativa" | genérico | ¿eficiencia en qué? ¿medida cómo? |
+ | "empresa líder" | halago sin sustancia | omite el adjetivo o usa un dato concreto |
+ | "innovación constante" | cliché | nombra la innovación específica |
+ | "creciente demanda" | market-speak | ¿demanda de qué? ¿medida por quién? |
\`\`\`

---

### PATCH 5 — Regla de especificidad (anti-genericidad)

Añadir como regla global al inicio del system prompt:

\`\`\`diff
+ ## REGLA DE ESPECIFICIDAD (aplica a los 3 mensajes)
+ Antes de redactar, pregúntate: "¿Podría enviar este mensaje a cualquier Director de X
+ en cualquier empresa del sector, o es específico SOLO para este lead?"
+ Si la respuesta es "cualquiera", reescríbelo.
+ Un mensaje genérico tiene CERO valor. El lead lo ignora porque siente que es spam.
+ Ancla siempre en: nombre de la empresa + rol específico + contexto sectorial concreto.
\`\`\`

---

## Conclusión

Los mensajes auditados fueron generados por el modelo anterior (\`gpt-4o-mini\`).
Los 5 patches propuestos deben aplicarse al system prompt de \`claude-sonnet-4-6\`
en \`scripts/orchestrate.ts\` antes de la próxima ejecución de \`npm run test:drafting:live\`.

La regla de especificidad (Patch 5) es la más impactante: elimina la causa raíz
de la mayoría de los fallos detectados (observaciones que solo repiten cargo+empresa,
insights con "muchas empresas están...").
`

  return md
}

// ── MAIN ─────────────────────────────────────────────
function main() {
  const inputPath = process.argv[2] ?? join(process.cwd(), 'mensajes_listos.json')

  if (!existsSync(inputPath)) {
    console.error(`❌ Archivo no encontrado: ${inputPath}`)
    process.exit(1)
  }

  const data: MensajeLead[] = JSON.parse(readFileSync(inputPath, 'utf-8'))
  console.log(`\n════════════════════════════════════════════`)
  console.log(`  AUDITORÍA TÉCNICA — TRES PILARES`)
  console.log(`  Archivo: ${inputPath}`)
  console.log(`  Leads: ${data.length} · Mensajes: ${data.length * 3}`)
  console.log(`════════════════════════════════════════════`)

  const resultados = data.map(auditarLead)

  // Imprimir resumen en consola
  for (const r of resultados) {
    const icon = r.veredictoGlobal === 'FALLO' ? '🔴' : r.veredictoGlobal === 'ADVERTENCIA' ? '🟡' : '🟢'
    console.log(`\n${icon} ${r.lead} (${r.empresa})`)
    for (const m of r.mensajes) {
      const mIcon = m.veredicto === 'FALLO' ? '  ❌' : m.veredicto === 'ADVERTENCIA' ? '  ⚠️ ' : '  ✅'
      console.log(`${mIcon} ${m.tipo.padEnd(12)} ${m.palabras.toString().padStart(3)} palabras`)
      for (const [pilar, p] of Object.entries(m.pilares)) {
        if (p.estado !== 'OK') {
          for (const v of p.violaciones) {
            console.log(`       [${pilar}] ${v.pattern}`)
          }
        }
      }
    }
  }

  // Totales
  const totalMensajes = resultados.flatMap(r => r.mensajes)
  const fallos = totalMensajes.filter(m => m.veredicto === 'FALLO').length
  const advertencias = totalMensajes.filter(m => m.veredicto === 'ADVERTENCIA').length
  console.log(`\n── Totales ──────────────────────────────────`)
  console.log(`  🔴 FALLOS:       ${fallos}`)
  console.log(`  🟡 ADVERTENCIAS: ${advertencias}`)
  console.log(`  🟢 OK:           ${totalMensajes.length - fallos - advertencias}`)

  // Generar error report
  const hoy = new Date().toISOString().split('T')[0]
  const reportPath = join(process.cwd(), 'docs', 'decisions', `error_report_${hoy}.md`)
  const reportContent = generarReport(resultados, inputPath)
  writeFileSync(reportPath, reportContent, 'utf-8')

  console.log(`\n  📄 Report generado: ${reportPath}`)
  console.log(`════════════════════════════════════════════\n`)

  process.exit(fallos > 0 ? 1 : 0)
}

main()
