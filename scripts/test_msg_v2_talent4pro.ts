// MSG-TEST-01 — Prueba controlada motor V2 para Talent4Pro
// Uso: npx tsx --tsconfig tsconfig.json scripts/test_msg_v2_talent4pro.ts

import { orchestrateV2, type LeadRawV2 } from '../src/lib/agent_v2'

const SALES_GOAL =
  'Talent4Pro ofrece certificaciones profesionales acreditadas para mandos intermedios ' +
  'y directivos que buscan validar y escalar sus competencias de liderazgo e IA aplicada. ' +
  'El programa combina metodología práctica con mentoría de expertos y está diseñado para ' +
  'profesionales con experiencia que quieren dar el siguiente paso en su carrera sin ' +
  'convertirse en técnicos.'

const TEST_LEADS: LeadRawV2[] = [
  {
    nombre: 'Lead-A',
    empresa: 'Grupo Industrial Peninsular',
    rol: 'Director de Operaciones',
    posts_recientes: [
      'Director de Operaciones · 15 años liderando equipos de producción y logística · ' +
      'Certificado PMP · Pilotando digitalización de la cadena de suministro · ' +
      'Interesado en cómo la IA puede mejorar la toma de decisiones en planta'
    ],
    style_variant: 0,  // VARIANTE 1 — Directa
  },
  {
    nombre: 'Lead-B',
    empresa: 'Consultora de Negocio Nacional',
    rol: 'Manager de Transformación Digital',
    posts_recientes: [
      'Manager especializado en transformación de pymes · Ayudo a empresas a adoptar ' +
      'herramientas digitales sin perder el negocio de vista · MBA por IE · ' +
      'Buscando formas de añadir más valor más allá del ERP y el CRM'
    ],
    style_variant: 1,  // VARIANTE 2 — Observación casual
  },
  {
    nombre: 'Lead-C',
    empresa: 'Empresa de Servicios Financieros',
    rol: 'Responsable de Desarrollo de Talento',
    posts_recientes: [
      'Responsable de L&D en empresa financiera · Diseño programas de desarrollo para ' +
      'mandos medios y directivos · Viendo cómo la IA cambia los perfiles que nuestros ' +
      'managers necesitan desarrollar · Buscando soluciones de upskilling práctico'
    ],
    style_variant: 2,  // VARIANTE 3 — Prescriptor
  },
  {
    nombre: 'Lead-D',
    empresa: 'Empresa Tecnológica Mediana',
    rol: 'Head of Product',
    posts_recientes: [
      'Head of Product en B2B tech · Construyendo producto con equipos distribuidos · ' +
      'Interesado en metodologías de liderazgo ágil · Reflexionando sobre cómo los ' +
      'product managers deben evolucionar con la IA generativa'
    ],
    style_variant: 3,  // VARIANTE 4 — Validación de mercado
  },
]

async function main() {
  console.log('=== MSG-TEST-01: Motor V2 — Prueba Talent4Pro ===\n')
  try {
    const resultados = await orchestrateV2(TEST_LEADS, SALES_GOAL)
    for (const r of resultados) {
      console.log(`\n>>> LEAD: ${r.lead} | ${r.rol} @ ${r.empresa}`)
      for (const m of r.mensajes) {
        console.log(`\n[${m.tipo}] (${m.texto.length} chars)`)
        console.log(m.texto)
      }
      console.log('\n' + '─'.repeat(70))
    }
    console.log('\n✅ Prueba completada.')
  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

main()
