# 🕵️‍♂️ LinkedIn Lead Scraper V2 — Message Generator Edition

Sistema completo de prospección B2B: busca perfiles en LinkedIn, genera 3 mensajes personalizados por lead y centraliza todo en una tabla lista para copiar y enviar.

---

## 📋 Tabla de Contenidos

1. [Visión General](#-visión-general)
2. [Features](#-features)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Arquitectura](#-arquitectura)
5. [Guía de Uso](#-guía-de-uso)
6. [API Reference](#-api-reference)
7. [Costos](#-costos)
8. [Roadmap](#-roadmap)

---

## 📌 Visión General

Sistema completo de prospección B2B en tres pasos:

1. **Busca** perfiles de LinkedIn por criterios (puesto, sector, ubicación) vía SearchApi.io
2. **Genera** 3 mensajes personalizados por lead (secuencia de contacto) con OpenAI
3. **Copia** cada mensaje desde la tabla centralizada y pégalo en LinkedIn DMs

Los mensajes NO se envían automáticamente (LinkedIn lo bloquea). El usuario copia y pega manualmente.

---

## ✨ Features

### Sprint 1–2: Message Generator
- ✅ Generación de 3 mensajes por lead (Secuencia 1, 2, 3)
- ✅ Personalización con propuesta de valor (hasta 1000 caracteres)
- ✅ Prompt B2B profesional optimizado para cerrar conversaciones
- ✅ Métricas, casos de éxito y features distribuidos en los 3 mensajes

### Sprint 3–4: Batch Processing
- ✅ Generar mensajes para 10–40 leads en paralelo (5 concurrent)
- ✅ Barra de progreso real-time (SSE)
- ✅ Notificación al completar
- ✅ Redirect automático a /messages

### Sprint 5: Messages Hub
- ✅ Tabla centralizada de todos los mensajes
- ✅ Agrupados por búsqueda → lead
- ✅ Copy buttons con feedback visual (✓ Copiado)
- ✅ Links directos a perfiles de LinkedIn
- ✅ Responsive (desktop tabla + mobile cards)

### V3: Authentication System
- ✅ Login page with dark minimal design, Entrar/Registro tabs, email/password inputs, admin approval workflow
- ✅ User Registration (status: pending_approval)
- ✅ Secure Signin (status: approved check)
- ✅ Middleware route protection (`/app/*`, `/admin/*`)

---

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS, Shadcn/UI |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Search | SearchApi.io (Google Search proxy) |
| LLM | OpenAI `gpt-4o-mini` |
| Deploy | Vercel |
| Auth | API Keys (env vars) |

---

## 🏗 Arquitectura

### Flujo Principal

```
Usuario crea búsqueda en /
        ↓
Resultados guardados en Supabase (searches + contacts)
        ↓
Usuario va a /searches
        ↓
Selecciona búsqueda + escribe propuesta de valor (≤1000 chars)
        ↓
Click [GENERAR MENSAJES EN LOTE]
        ↓
Backend:
  ├── Extrae todos los contacts de esa búsqueda
  ├── Para cada contact → OpenAI genera 3 mensajes de secuencia
  ├── Guarda en leads + message_drafts (sequence 1, 2, 3)
  └── Devuelve progreso vía polling de /batch/status
        ↓
Frontend:
  ├── Muestra barra de progreso (processed / total)
  └── Cuando status=complete → redirect a /messages
        ↓
En /messages:
  ├── GET /api/drafts → array plano ordenado por search → lead → sequence
  ├── Tabla: NOMBRE | LINKEDIN | MSG 1 | MSG 2 | MSG 3
  └── Usuario copia mensaje → pega en LinkedIn DM
```

### Estructura de Base de Datos

```sql
searches        -- Campañas de búsqueda (filtros, query Google, status)
contacts        -- Perfiles encontrados por búsqueda (linkedin_url, job_title, etc.)
leads           -- Perfiles procesados para generación de mensajes
message_drafts  -- Mensajes generados (sequence INT 1/2/3, draft_text, confidence)
```

**Relaciones:**
```
searches ──< contacts
searches ──< leads ──< message_drafts
```

### Estructura de Ficheros

```
src/
├── app/
│   ├── page.tsx                          # Dashboard principal (búsqueda + vista de contactos)
│   ├── searches/page.tsx                 # Selector de búsqueda + generación en lote
│   ├── messages/page.tsx                 # Tabla de mensajes generados
│   └── api/
│       ├── search/route.ts               # POST — ejecuta búsqueda en LinkedIn
│       ├── searches/route.ts             # GET — lista búsquedas
│       ├── contacts/route.ts             # GET — contactos por búsqueda
│       ├── drafts/route.ts               # GET — todos los mensajes generados
│       ├── generate-messages/
│       │   ├── route.ts                  # POST — genera mensajes para un lead
│       │   └── batch/
│       │       ├── route.ts              # POST — genera mensajes para toda una búsqueda
│       │       └── status/route.ts       # GET — progreso del batch
│       └── status/route.ts               # GET — estado de una búsqueda
├── lib/
│   ├── claude_prompts.ts                 # Prompts OpenAI (parsing, validación, generación)
│   ├── message_store.ts                  # Helpers DB: saveLeadWithDrafts
│   ├── supabase.ts                       # Cliente Supabase (server-side)
│   └── utils.ts                          # Utilidades genéricas
└── types/
    └── index.ts                          # Tipos compartidos (SearchFilters, MessageDraft, etc.)
```

---

## 📖 Guía de Uso

### 1. Hacer una búsqueda

1. Ir a `/` (dashboard)
2. Click **[NUEVO ESCANEO]**
3. Rellenar los 4 campos: Puesto, Años de experiencia, Sector, Localización
4. Esperar resultados (30–60 s)
5. Los contactos se guardan automáticamente en Supabase

### 2. Generar mensajes en lote

1. Ir a `/searches`
2. Seleccionar una búsqueda anterior
3. Escribir la propuesta de valor (**máx 1000 caracteres**)
   - Incluye: qué haces, beneficios, métricas, casos de éxito, precio
   - Cuanto más específica, más personalizados serán los mensajes
4. Click **[GENERAR MENSAJES EN LOTE (X leads)]**
5. Esperar la barra de progreso
6. Al completar → redirect automático a `/messages`

### 3. Ver y copiar mensajes

La tabla en `/messages` muestra:

| NOMBRE | LINKEDIN | MENSAJE 1 | MENSAJE 2 | MENSAJE 3 |
|--------|----------|-----------|-----------|-----------|
| Juan García | 🔗 | Primer contacto `[COPIAR]` | Follow-up día 3 `[COPIAR]` | Follow-up día 7 `[COPIAR]` |

- **MSG 1** — Primer contacto: hook + relevancia + CTA suave
- **MSG 2** — Follow-up día 3: ángulo diferente + social proof + CTA directa
- **MSG 3** — Follow-up día 7: urgencia implícita + cierre educado

Click **[COPIAR]** → feedback visual ✓ → pegar en LinkedIn DM

---

## 🔌 API Reference

Todas las rutas requieren el header `x-api-key: <SEARCH_API_KEY>`.

### `POST /api/search`
Ejecuta una búsqueda de perfiles en LinkedIn.

**Body:**
```json
{
  "jobTitle": "Director de Ventas",
  "experience": "5+ años",
  "industry": "SaaS",
  "location": "Barcelona"
}
```

**Response:** `{ search_id, status: "running" }`

---

### `GET /api/searches`
Lista todas las búsquedas.

**Response:** `{ searches: SearchRecord[], total }`

---

### `GET /api/contacts?search_id=<uuid>`
Obtiene los contactos de una búsqueda.

**Response:** `{ contacts: ContactRecord[], total, page, page_size }`

---

### `POST /api/generate-messages/batch`
Genera 3 mensajes para todos los leads de una búsqueda (max 5 en paralelo).

**Body:**
```json
{
  "search_id": "uuid",
  "your_product": "Descripción de tu producto/servicio (≤1000 chars)"
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
Obtiene todos los mensajes generados. `search_id` es opcional; sin él devuelve todos.

**Response:** Array plano, ordenado por `search_id → lead_id → sequence`:
```json
[
  {
    "id": "uuid",
    "lead_id": "uuid",
    "lead_name": "Juan García",
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

## 💰 Costos

### Por operación

| Servicio | Coste | Notas |
|----------|-------|-------|
| SearchApi.io | ~$0.005–0.01 / búsqueda | Free tier: 100 búsquedas/mes |
| OpenAI gpt-4o-mini | ~$0.0007 / lead (3 msgs) | Input $0.15/M + Output $0.60/M tokens |
| Supabase | $0 | Free tier: 500 MB, 2 usuarios simultáneos |

### Ejemplo: batch de 100 leads

| Concepto | Coste |
|----------|-------|
| SearchApi (1 búsqueda) | $0.01 |
| OpenAI (100 leads × 3 msgs) | ~$0.07 |
| **Total** | **~$0.08** |

### Pricing recomendado para clientes

| Plan | Precio | Incluye |
|------|--------|---------|
| Free | $0 | 10 búsquedas/mes, máx 5 leads |
| Pro | $29/mes | 100 búsquedas/mes, leads ilimitados |
| Enterprise | $99/mes | Ilimitado + acceso API |

---

## 🗺 Roadmap

### Sprint 6 — Follow-ups automáticos
- [ ] Programar envíos automáticos (día 3, 7, 14)
- [ ] Tracking de respuestas

### Sprint 7 — CRM Integration
- [ ] Exportar a HubSpot / Pipedrive
- [ ] Webhook para auto-sync

### Sprint 8 — Analytics
- [ ] Dashboard de métricas (tasa de respuesta, conversión)
- [ ] A/B testing de mensajes

### Sprint 9 — Email Hunter
- [ ] Integración Hunter.io / RocketReach
- [ ] Emails + teléfonos verificados

---

## 🚀 Deploy

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
# Búsqueda
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

## 📝 Notas

- Los mensajes **no se envían automáticamente** (LinkedIn bloquea la automatización). El usuario copia y pega en los DMs manualmente.
- Solo se almacenan perfiles **públicos** de LinkedIn, compatible con GDPR.
- El sistema no guarda conversaciones ni respuestas.

---

*Desarrollado con filosofía Wabi-Sabi: imperfección, artesanía, eficiencia.*
