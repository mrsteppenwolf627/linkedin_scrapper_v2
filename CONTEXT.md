# CONTEXT.md - LinkedIn Lead Scraper: Message Generator + User System

## Project Overview
**Goal**: Transform LinkedIn profile searches into AI-generated personalized outreach messages. Protected by user authentication with admin approval.
**Stack**: Next.js 14 + OpenAI API (gpt-4o-mini) + Supabase PostgreSQL + Zapier  
**Philosophy**: Zero friction for sales reps. Find → Generate → Send. Secured by admin approval gate.

---

## Roles
- **Claude Code**: Backend (API routes, OpenAI prompts, DB schemas, auth, business logic)
- **Gemini CLI**: Frontend (React components, UI/UX, form handling, draft display, login/admin dashboard)
- **Codex**: Testing (e2e auth flow, integration tests)

---

## Architecture
```
[NEW] User Registration → Pending → Admin Approval → Access

LinkedIn Profile (from existing search)
    ↓
API POST /api/generate-messages (protected by auth)
    ↓
OpenAI gpt-4o-mini (3 drafts: Direct, Consultative, Value-First)
    ↓
Supabase (store lead + generated drafts)
    ↓
Frontend displays drafts → User copies to LinkedIn
```

---

## Data Model

### Table: `users` (NEW - V3)
```sql
id (uuid, pk)
email (text, unique)
password_hash (text)
role (text: 'user' | 'admin', default='user')
status (text: 'pending_approval' | 'approved' | 'rejected', default='pending_approval')
created_at (timestamp)
approved_at (timestamp, nullable)
approved_by (uuid, fk to users(id), nullable)
```

### Table: `user_approvals` (NEW - V3, log table)
```sql
id (uuid, pk)
user_id (uuid, fk)
approved_by (uuid, fk)
status (text: 'approved' | 'rejected')
reason (text, nullable)
created_at (timestamp)
```

### Table: `leads` (V1-V2)
```sql
id (uuid, pk)
search_id (uuid, fk)
name (text)
title (text)
company (text)
industry (text)
location (text)
linkedin_url (text)
profile_snippet (text)
score (numeric, optional)
created_at (timestamp)
```

### Table: `message_drafts` (V1-V2)
```sql
id (uuid, pk)
lead_id (uuid, fk)
search_id (uuid, fk)
batch_id (uuid, fk to message_batches, nullable)
sequence (int: 1 | 2 | 3)
text (text)
sounds_human (numeric 0-1, optional)
confidence (numeric 0-1)
created_at (timestamp)
```

### Table: `message_batches` (V2 onwards)
```sql
id (uuid, pk)
search_id (uuid, fk)
batch_name (text)
message_count (int)
status (text: 'generated' | 'deleted', default='generated')
created_at (timestamp)
```

---

## Current Status

### V1-V2: Message Generator ✅ COMPLETE
- [x] Architecture defined
- [x] Data model designed
- [x] OpenAI prompt finalized (humanization v2)
- [x] API endpoint `/api/generate-messages` + batch route
- [x] Supabase schema (leads, message_drafts, message_batches)
- [x] Frontend form component (SearchSelector)
- [x] Draft display component (results table)
- [x] Batch Generator UI (/searches)
- [x] Messages Management UI (/messages) with batch selection
- [x] Legacy messages recovery (heredados)
- [x] Batch operations (create, delete, select, regenerate)

### V3: Sistema de Usuarios + Auth 🔄 **CURRENT PHASE**
- [ ] Create `users` + `user_approvals` tables in Supabase  ← run migrations/20260512_users_auth.sql
- [x] POST `/api/auth/signup` — register new user (pending approval)
- [x] POST `/api/auth/signin` — login (check status = 'approved')
- [x] POST `/api/auth/logout` — logout
- [x] GET `/api/admin/pending-users` — list pending approvals
- [x] POST `/api/admin/approve-user/:id` — approve user
- [x] POST `/api/admin/reject-user/:id` — reject user
- [ ] Login page UI (`/login`)
- [ ] Admin dashboard UI (`/admin/approvals`)
- [ ] Middleware to protect routes (`/app/*`, `/admin/*`)
- [ ] E2E tests (signup → pending → approve → signin → access)

---

## Decisiones Arquitectónicas

### 1. Auth Strategy: Supabase Auth
- **Decision**: Use Supabase Auth (built-in) + custom `users` table for roles/status
- **Why**: Already using Supabase, JWT tokens, password hashing automatic, HttpOnly cookies
- **Alternative rejected**: NextAuth (overkill), custom (insecure)

### 2. Admin Approval Flow
- **Decision**: `status` field ('pending_approval' | 'approved' | 'rejected')
- **Why**: Simple, explicit, audit trail via `user_approvals` log table
- **Alternative**: Email confirmation (less control, automatic)

### 3. Initial Admin User
- **Decision**: Hardcoded admin email in env var (ADMIN_EMAIL)
- **Why**: Simple for MVP, can scale to UI later
- **Alternative**: Manual SQL insert (less safe)

### 4. Role System
- **Decision**: Simple `role` field ('user' | 'admin')
- **Why**: Flexible for future RBAC, easy to implement
- **Alternative**: Permissions table (overkill for MVP)

---

## Tareas Fase V3 (Priorizado)

| # | Tarea | Modelo | Prioridad | Estado |
|---|---|---|---|---|
| 1 | Crear tablas `users` + `user_approvals` en Supabase SQL | Claude | 🔴 P0 | ⏳ run SQL |
| 2 | POST `/api/auth/signup` (register → pending) | Claude | 🔴 P0 | ✅ |
| 3 | POST `/api/auth/signin` (login, check approved) | Claude | 🔴 P0 | ✅ |
| 4 | GET `/api/admin/pending-users` (list pending) | Claude | 🔴 P0 | ✅ |
| 5 | POST `/api/admin/approve-user/:id` (approve) | Claude | 🔴 P0 | ✅ |
| 6 | POST `/api/auth/logout` (logout) | Claude | 🟠 P1 | ✅ |
| 7 | Login page UI (`/login`) | Gemini | 🔴 P0 | ⏳ |
| 8 | Admin dashboard (`/admin/approvals`) UI + logic | Gemini | 🔴 P0 | ⏳ |
| 9 | Middleware: protect `/app/*` + `/admin/*` routes | Claude | 🔴 P0 | ⏳ |
| 10 | E2E tests: signup → pending → approve → signin | Codex | 🟠 P1 | ⏳ |

---

## Flujo de Usuario (V3)

### Nuevo Usuario
```
1. Va a /login → ve "No tengo cuenta" link
2. Click → va a /signup
3. Llena: email + password (8+ chars)
4. Submit → POST /api/auth/signup
   ↓ BD: INSERT users (status='pending_approval')
   ↓ Response: "Espera la aprobación del admin"
5. Vuelve a login, intenta signin
   ↓ POST /api/auth/signin
   ↓ Query: users.status != 'approved'
   ↓ Response: "Tu cuenta aún no ha sido aprobada"
```

### Admin (Tú)
```
1. Va a /admin/approvals
   ↓ GET /api/admin/pending-users
   ↓ Ve lista de pending registrations
2. Ve: email, fecha signup, [Aprobar] [Rechazar]
3. Click Aprobar
   ↓ POST /api/admin/approve-user/:id
   ↓ BD: UPDATE users SET status='approved', approved_at=NOW()
   ↓ BD: INSERT user_approvals (status='approved')
   ↓ Response: "Usuario aprobado"
4. Usuario ahora puede signin → acceso a `/app/*`
```

---

## Workflow Operativo (Tu Metodología)

### Orden recomendado:
1. **Claude** → Tablas SQL + endpoints auth
2. **Gemini** → Login page + Admin dashboard UI
3. **Claude** → Middleware + protección rutas
4. **Codex** → Tests e2e

### Si algo falla:
- **Timeout** → escala modelo (Flash→Pro)
- **Simple error** → fix prompt, reintenta
- **Complejo** → cambia modelo, pasa contexto

### Commits:
```bash
git commit -m "Feat: [desc] (via Claude/Gemini/Codex)"
```

---

## Stack Técnico (V3 additions)

- **Auth**: Supabase Auth + custom `users` table
- **Password**: bcrypt hashing (Supabase automatic)
- **Sessions**: JWT tokens, HttpOnly cookies
- **Frontend**: Next.js 14, TypeScript, React
- **API**: `/api/auth/*`, `/api/admin/*`
- **Middleware**: `middleware.ts` (route protection)
- **Testing**: Jest + Playwright (e2e)

---

## Restricciones Críticas (V3)

- Admin approval **MUST** be mandatory (no auto-signup)
- Password: mínimo 8 caracteres
- Sessions: HttpOnly cookies (no localStorage)
- Admin user: Tu email hardcoded en .env.local
- All auth routes: POST (no GET)
- All protected routes: check JWT + user.status = 'approved'

---

## Checklist Antes de Empezar V3

- [ ] Este CONTEXT.md en carpeta del proyecto
- [ ] Claude Code listo
- [ ] Gemini CLI listo
- [ ] Codex listo
- [ ] Supabase SQL Editor abierto
- [ ] Terminal lista (git commits)
- [ ] .env.local con ADMIN_EMAIL configurado

---

## Assumptions

- User brings their own OpenAI API key (BYOA model)
- LinkedIn profile data already extracted
- No real-time LinkedIn integration yet (copy/paste only)
- Spanish language priority
- Single admin initially (you)
- Email domain verification not required (MVP)

---

## Notes

- Keep prompts < 2000 tokens (cost efficiency)
- Confidence scoring helps users prioritize drafts
- Admin dashboard should show: email, signup date, action buttons
- After V3 complete → ready for Vercel deployment
- Consider CORS for future webhook integrations

---

## Próximos Pasos

**INMEDIATO (Hoy):**
1. Copia este CONTEXT.md a tu carpeta del proyecto
2. Lee con calma las tareas V3
3. Abre Supabase SQL Editor
4. Ejecuta script de creación de tablas
5. Comienza con TAREA 1 en Claude Code

**DESPUÉS (Cuando V3 esté 100% listo):**
1. Deploy a Vercel
2. Webhooks de Slack/LinkedIn
3. Refinements basados en user feedback

---

**Última actualización**: 12 de mayo de 2026  
**Estado**: Listo para iniciar V3