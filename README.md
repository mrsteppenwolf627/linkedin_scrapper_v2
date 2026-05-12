# ðŸ•µï¸â€â™‚ï¸ LinkedIn Lead Scraper V2 â€” Message Generator Edition

Sistema completo de prospecciÃ³n B2B: busca perfiles en LinkedIn, genera 3 mensajes personalizados por lead y centraliza todo en una tabla lista para copiar y enviar.

---

## ðŸ“‹ Tabla de Contenidos

1. [VisiÃ³n General](#-visiÃ³n-general)
2. [Features](#-features)
3. [Stack TecnolÃ³gico](#-stack-tecnolÃ³gico)
4. [Arquitectura](#-arquitectura)
5. [GuÃ­a de Uso](#-guÃ­a-de-uso)
6. [API Reference](#-api-reference)
7. [Costos](#-costos)
8. [Roadmap](#-roadmap)

---

## ðŸ“Œ VisiÃ³n General

Sistema completo de prospecciÃ³n B2B en tres pasos:

1. **Busca** perfiles de LinkedIn por criterios (puesto, sector, ubicaciÃ³n) vÃ­a SearchApi.io
2. **Genera** 3 mensajes personalizados por lead (secuencia de contacto) con OpenAI
3. **Copia** cada mensaje desde la tabla centralizada y pÃ©galo en LinkedIn DMs

Los mensajes NO se envÃ­an automÃ¡ticamente (LinkedIn lo bloquea). El usuario copia y pega manualmente.

---

## âœ¨ Features

### Sprint 1â€“2: Message Generator
- âœ… GeneraciÃ³n de 3 mensajes por lead (Secuencia 1, 2, 3)
- âœ… PersonalizaciÃ³n con propuesta de valor (hasta 1000 caracteres)
- âœ… Prompt B2B profesional optimizado para cerrar conversaciones
- âœ… MÃ©tricas, casos de Ã©xito y features distribuidos en los 3 mensajes

### Sprint 3â€“4: Batch Processing
- âœ… Generar mensajes para 10â€“40 leads en paralelo (5 concurrent)
- âœ… Barra de progreso real-time (SSE)
- âœ… NotificaciÃ³n al completar
- âœ… Redirect automÃ¡tico a /messages

### Sprint 5: Messages Hub
- âœ… Tabla centralizada de todos los mensajes
- âœ… Agrupados por bÃºsqueda â†’ lead
- âœ… Copy buttons con feedback visual (âœ“ Copiado)
- âœ… Links directos a perfiles de LinkedIn
- âœ… Responsive (desktop tabla + mobile cards)

### V3: Authentication System
- âœ… Login page with dark minimal design, Entrar/Registro tabs, email/password inputs, admin approval workflow
- âœ… User Registration (status: pending_approval)
- âœ… Secure Signin (status: approved check)
- âœ… Middleware route protection (`/app/*`, `/admin/*`)
- ✅ Admin approvals dashboard (`/admin/approvals`) con approve/reject y refetch automático

---

## ðŸ›  Stack TecnolÃ³gico

| Capa | TecnologÃ­a |
|------|-----------|
| Frontend | Next.js 15 (App Router), React, Tailwind CSS, Shadcn/UI |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Search | SearchApi.io (Google Search proxy) |
| LLM | OpenAI `gpt-4o-mini` |
| Deploy | Vercel |
| Auth | Supabase Auth + custom users table + HttpOnly JWT cookie |

---

## ðŸ— Arquitectura

### Flujo Principal

```
Usuario crea bÃºsqueda en /
        â†“
Resultados guardados en Supabase (searches + contacts)
        â†“
Usuario va a /searches
        â†“
Selecciona bÃºsqueda + escribe propuesta de valor (â‰¤1000 chars)
        â†“
Click [GENERAR MENSAJES EN LOTE]
        â†“
Backend:
  â”œâ”€â”€ Extrae todos los contacts de esa bÃºsqueda
  â”œâ”€â”€ Para cada contact â†’ OpenAI genera 3 mensajes de secuencia
  â”œâ”€â”€ Guarda en leads + message_drafts (sequence 1, 2, 3)
  â””â”€â”€ Devuelve progreso vÃ­a polling de /batch/status
        â†“
Frontend:
  â”œâ”€â”€ Muestra barra de progreso (processed / total)
  â””â”€â”€ Cuando status=complete â†’ redirect a /messages
        â†“
En /messages:
  â”œâ”€â”€ GET /api/drafts â†’ array plano ordenado por search â†’ lead â†’ sequence
  â”œâ”€â”€ Tabla: NOMBRE | LINKEDIN | MSG 1 | MSG 2 | MSG 3
  â””â”€â”€ Usuario copia mensaje â†’ pega en LinkedIn DM
```

### Estructura de Base de Datos

```sql
searches        -- CampaÃ±as de bÃºsqueda (filtros, query Google, status)
contacts        -- Perfiles encontrados por bÃºsqueda (linkedin_url, job_title, etc.)
leads           -- Perfiles procesados para generaciÃ³n de mensajes
message_drafts  -- Mensajes generados (sequence INT 1/2/3, draft_text, confidence)
```

**Relaciones:**
```
searches â”€â”€< contacts
searches â”€â”€< leads â”€â”€< message_drafts
```

### Estructura de Ficheros

```
src/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ page.tsx                          # Dashboard principal (bÃºsqueda + vista de contactos)
â”‚   â”œâ”€â”€ searches/page.tsx                 # Selector de bÃºsqueda + generaciÃ³n en lote
â”‚   â”œâ”€â”€ messages/page.tsx                 # Tabla de mensajes generados
â”‚   â””â”€â”€ api/
â”‚       â”œâ”€â”€ search/route.ts               # POST â€” ejecuta bÃºsqueda en LinkedIn
â”‚       â”œâ”€â”€ searches/route.ts             # GET â€” lista bÃºsquedas
â”‚       â”œâ”€â”€ contacts/route.ts             # GET â€” contactos por bÃºsqueda
â”‚       â”œâ”€â”€ drafts/route.ts               # GET â€” todos los mensajes generados
â”‚       â”œâ”€â”€ generate-messages/
â”‚       â”‚   â”œâ”€â”€ route.ts                  # POST â€” genera mensajes para un lead
â”‚       â”‚   â””â”€â”€ batch/
â”‚       â”‚       â”œâ”€â”€ route.ts              # POST â€” genera mensajes para toda una bÃºsqueda
â”‚       â”‚       â””â”€â”€ status/route.ts       # GET â€” progreso del batch
â”‚       â””â”€â”€ status/route.ts               # GET â€” estado de una bÃºsqueda
â”œâ”€â”€ lib/
â”‚   â”œâ”€â”€ claude_prompts.ts                 # Prompts OpenAI (parsing, validaciÃ³n, generaciÃ³n)
â”‚   â”œâ”€â”€ message_store.ts                  # Helpers DB: saveLeadWithDrafts
â”‚   â”œâ”€â”€ supabase.ts                       # Cliente Supabase (server-side)
â”‚   â””â”€â”€ utils.ts                          # Utilidades genÃ©ricas
â””â”€â”€ types/
    â””â”€â”€ index.ts                          # Tipos compartidos (SearchFilters, MessageDraft, etc.)
```

---

## ðŸ“– GuÃ­a de Uso

### 1. Hacer una bÃºsqueda

1. Ir a `/` (dashboard)
2. Click **[NUEVO ESCANEO]**
3. Rellenar los 4 campos: Puesto, AÃ±os de experiencia, Sector, LocalizaciÃ³n
4. Esperar resultados (30â€“60 s)
5. Los contactos se guardan automÃ¡ticamente en Supabase

### 2. Generar mensajes en lote

1. Ir a `/searches`
2. Seleccionar una bÃºsqueda anterior
3. Escribir la propuesta de valor (**mÃ¡x 1000 caracteres**)
   - Incluye: quÃ© haces, beneficios, mÃ©tricas, casos de Ã©xito, precio
   - Cuanto mÃ¡s especÃ­fica, mÃ¡s personalizados serÃ¡n los mensajes
4. Click **[GENERAR MENSAJES EN LOTE (X leads)]**
5. Esperar la barra de progreso
6. Al completar â†’ redirect automÃ¡tico a `/messages`

### 3. Ver y copiar mensajes

La tabla en `/messages` muestra:

| NOMBRE | LINKEDIN | MENSAJE 1 | MENSAJE 2 | MENSAJE 3 |
|--------|----------|-----------|-----------|-----------|
| Juan GarcÃ­a | ðŸ”— | Primer contacto `[COPIAR]` | Follow-up dÃ­a 3 `[COPIAR]` | Follow-up dÃ­a 7 `[COPIAR]` |

- **MSG 1** â€” Primer contacto: hook + relevancia + CTA suave
- **MSG 2** â€” Follow-up dÃ­a 3: Ã¡ngulo diferente + social proof + CTA directa
- **MSG 3** â€” Follow-up dÃ­a 7: urgencia implÃ­cita + cierre educado

Click **[COPIAR]** â†’ feedback visual âœ“ â†’ pegar en LinkedIn DM

---

## ðŸ”Œ API Reference

Las rutas de scraping/message generation requieren `x-api-key: <SEARCH_API_KEY>`. Las rutas de auth/admin usan sesión JWT en cookie HttpOnly.

### `POST /api/search`
Ejecuta una bÃºsqueda de perfiles en LinkedIn.

**Body:**
```json
{
  "jobTitle": "Director de Ventas",
  "experience": "5+ aÃ±os",
  "industry": "SaaS",
  "location": "Barcelona"
}
```

**Response:** `{ search_id, status: "running" }`

---

### `GET /api/searches`
Lista todas las bÃºsquedas.

**Response:** `{ searches: SearchRecord[], total }`

---

### `GET /api/contacts?search_id=<uuid>`
Obtiene los contactos de una bÃºsqueda.

**Response:** `{ contacts: ContactRecord[], total, page, page_size }`

---

### `POST /api/generate-messages/batch`
Genera 3 mensajes para todos los leads de una bÃºsqueda (max 5 en paralelo).

**Body:**
```json
{
  "search_id": "uuid",
  "your_product": "DescripciÃ³n de tu producto/servicio (â‰¤1000 chars)"
}
```

**Response:**
```json
{
  "search_id": "uuid",
  "total_contacts": 20,
  "processed": 18,
  "failed": 2,
  "cost_total_usd": 0.014,
  "time_ms": 42000
}
```

---

### `GET /api/generate-messages/batch/status?search_id=<uuid>`
Progreso del batch en tiempo real (polling).

**Response:**
```json
{
  "search_id": "uuid",
  "status": "complete",
  "processed": 20,
  "total": 20,
  "percentage": 100
}
```

---

### `GET /api/drafts?search_id=<uuid>`
Obtiene todos los mensajes generados. `search_id` es opcional; sin Ã©l devuelve todos.

**Response:** Array plano, ordenado por `search_id â†’ lead_id â†’ sequence`:
```json
[
  {
    "id": "uuid",
    "lead_id": "uuid",
    "lead_name": "Juan GarcÃ­a",
    "lead_linkedin_url": "https://linkedin.com/in/juan-garcia",
    "lead_company": "TechCorp",
    "search_name": "SEARCH-FOUNDER-BARCELONA",
    "sequence": 1,
    "draft_text": "Juan, en startups B2B como TechCorp...",
    "confidence": 0.95
  }
]
```

---

## ðŸ’° Costos

### Por operaciÃ³n

| Servicio | Coste | Notas |
|----------|-------|-------|
| SearchApi.io | ~$0.005â€“0.01 / bÃºsqueda | Free tier: 100 bÃºsquedas/mes |
| OpenAI gpt-4o-mini | ~$0.0007 / lead (3 msgs) | Input $0.15/M + Output $0.60/M tokens |
| Supabase | $0 | Free tier: 500 MB, 2 usuarios simultÃ¡neos |

### Ejemplo: batch de 100 leads

| Concepto | Coste |
|----------|-------|
| SearchApi (1 bÃºsqueda) | $0.01 |
| OpenAI (100 leads Ã— 3 msgs) | ~$0.07 |
| **Total** | **~$0.08** |

### Pricing recomendado para clientes

| Plan | Precio | Incluye |
|------|--------|---------|
| Free | $0 | 10 bÃºsquedas/mes, mÃ¡x 5 leads |
| Pro | $29/mes | 100 bÃºsquedas/mes, leads ilimitados |
| Enterprise | $99/mes | Ilimitado + acceso API |

---

## ðŸ—º Roadmap

### Sprint 6 â€” Follow-ups automÃ¡ticos
- [ ] Programar envÃ­os automÃ¡ticos (dÃ­a 3, 7, 14)
- [ ] Tracking de respuestas

### Sprint 7 â€” CRM Integration
- [ ] Exportar a HubSpot / Pipedrive
- [ ] Webhook para auto-sync

### Sprint 8 â€” Analytics
- [ ] Dashboard de mÃ©tricas (tasa de respuesta, conversiÃ³n)
- [ ] A/B testing de mensajes

### Sprint 9 â€” Email Hunter
- [ ] IntegraciÃ³n Hunter.io / RocketReach
- [ ] Emails + telÃ©fonos verificados

---

## ðŸš€ Deploy

### Local

```bash
npm install
cp .env.example .env.local   # rellenar variables
npm run dev                   # http://localhost:3000
```

### Vercel

```bash
vercel deploy
```

### Variables de entorno requeridas

```bash
# BÃºsqueda
SEARCHAPI_IO_KEY=

# IA
OPENAI_API_KEY=

# Base de datos
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Seguridad interna
SEARCH_API_KEY=
NEXT_PUBLIC_SEARCH_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ðŸ“ Notas

- Los mensajes **no se envÃ­an automÃ¡ticamente** (LinkedIn bloquea la automatizaciÃ³n). El usuario copia y pega en los DMs manualmente.
- Solo se almacenan perfiles **pÃºblicos** de LinkedIn, compatible con GDPR.
- El sistema no guarda conversaciones ni respuestas.

---

*Desarrollado con filosofÃ­a Wabi-Sabi: imperfecciÃ³n, artesanÃ­a, eficiencia.*

