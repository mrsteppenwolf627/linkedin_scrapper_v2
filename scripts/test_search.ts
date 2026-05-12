// ============================================
// LinkedIn Scraper V1 - Script de testing manual
// Ejecutar: npm run test:search
// Requiere .env.local con todas las variables
// ============================================

// Cargar variables de entorno desde .env.local
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { searchGoogle, filterLinkedInProfiles } from '../src/lib/google_search'
import { parseLinkedInSnippet, validateContact, generateGoogleQuery } from '../src/lib/claude_prompts'
import type { SearchFilters } from '../src/types'

// ============================================
// CONFIGURACIÃ“N DEL TEST
// ============================================
const TEST_FILTERS: SearchFilters = {
  jobTitle: 'consultor',
  experience: '5+ años',
  industry: 'energía',
  location: 'España',
  maxResults: 10,
}

// ============================================
// TEST 1: GeneraciÃ³n de query
// ============================================
async function testQueryGeneration() {
  console.log('\n' + '='.repeat(50))
  console.log('TEST 1: GeneraciÃ³n de query Google')
  console.log('='.repeat(50))

  const query = await generateGoogleQuery(TEST_FILTERS)
  console.log('âœ… Query generada:', query)
  return query
}

// ============================================
// TEST 2: Google Search
// ============================================
async function testGoogleSearch(query: string) {
  console.log('\n' + '='.repeat(50))
  console.log('TEST 2: BÃºsqueda en Google (Serper.dev)')
  console.log('='.repeat(50))

  const allResults = await searchGoogle(query, 10)
  const profileResults = filterLinkedInProfiles(allResults)

  console.log(`âœ… Google devolviÃ³ ${allResults.length} resultados`)
  console.log(`âœ… Perfiles LinkedIn vÃ¡lidos: ${profileResults.length}`)

  if (profileResults.length > 0) {
    console.log('\nPrimeros 3 resultados:')
    profileResults.slice(0, 3).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.title}`)
      console.log(`     URL: ${r.link}`)
      console.log(`     Snippet: ${r.snippet.slice(0, 100)}...`)
    })
  }

  return profileResults
}

// ============================================
// TEST 3: OpenAI Parsing
// ============================================
async function testParsing(snippet: string, url: string) {
  console.log('\n' + '='.repeat(50))
  console.log('TEST 3: Parsing con OpenAI (gpt-4o-mini)')
  console.log('='.repeat(50))

  console.log('Snippet a parsear:', snippet.slice(0, 150))
  const parsed = await parseLinkedInSnippet(snippet, url)
  console.log('âœ… Resultado del parsing:', JSON.stringify(parsed, null, 2))
  return parsed
}

// ============================================
// TEST 4: OpenAI Validation
// ============================================
async function testValidation(parsed: Awaited<ReturnType<typeof parseLinkedInSnippet>>) {
  console.log('\n' + '='.repeat(50))
  console.log('TEST 4: ValidaciÃ³n con OpenAI (gpt-4o-mini)')
  console.log('='.repeat(50))

  const validated = await validateContact(parsed, TEST_FILTERS)
  console.log('âœ… Resultado de validaciÃ³n:', JSON.stringify(validated, null, 2))
  return validated
}

// ============================================
// TEST 5: Snippet simulado (sin necesidad de Google)
// ============================================
async function testWithMockSnippet() {
  console.log('\n' + '='.repeat(50))
  console.log('TEST 5: Test con snippet simulado (mock)')
  console.log('='.repeat(50))

  const mockSnippet =
    'Carlos GarcÃ­a - Senior Energy Consultant at Iberdrola Â· 8 years of experience in renewable energy and solar consulting in Spain'
  const mockUrl = 'https://linkedin.com/in/carlos-garcia-energy'

  const parsed = await testParsing(mockSnippet, mockUrl)

  if (parsed.es_valido) {
    await testValidation(parsed)
  } else {
    console.log('âš ï¸  Contacto invÃ¡lido en parsing, saltando validaciÃ³n')
  }
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('ðŸš€ LinkedIn Scraper V1 - Test Suite')
  console.log('🔍 Filtros de prueba:', JSON.stringify(TEST_FILTERS, null, 2))

  const args = process.argv.slice(2)
  const runAll = args.includes('--all') || args.length === 0
  const runMockOnly = args.includes('--mock')

  try {
    if (runMockOnly) {
      // Test rÃ¡pido sin consumir API de Google
      await testWithMockSnippet()
    } else if (runAll) {
      // Test completo con APIs reales
      const query = await testQueryGeneration()
      const results = await testGoogleSearch(query)

      if (results.length > 0) {
        const firstResult = results[0]
        const parsed = await testParsing(firstResult.snippet, firstResult.link)
        if (parsed.es_valido) {
          await testValidation(parsed)
        }
      } else {
        console.log('\nâš ï¸  No se encontraron resultados de Google. Ejecutando test mock...')
        await testWithMockSnippet()
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('âœ… TODOS LOS TESTS COMPLETADOS')
    console.log('='.repeat(50))
  } catch (err) {
    console.error('\nâŒ ERROR EN TESTS:', err)
    process.exit(1)
  }
}

main()

