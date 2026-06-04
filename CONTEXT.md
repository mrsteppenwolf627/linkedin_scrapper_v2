CONTEXT.md - LinkedIn Scraper: Message Generator + User System
Project Overview
Goal: Transform LinkedIn profile searches into AI-generated personalized outreach messages. Protected by user authentication with admin approval.
Stack: Next.js 15 + OpenAI API (gpt-4o-mini) + Supabase PostgreSQL + TypeScript + Tailwind CSS
Philosophy: Zero friction for sales reps. Find -> Generate -> Send. Secured by admin approval gate.

Roles

Claude Code: Backend (API routes, OpenAI prompts, DB schemas, auth, business logic, middleware)
Gemini CLI: Frontend (React components, UI/UX, form handling, landing page, login/admin dashboard)
Codex: Testing (e2e auth flow, integration tests, security audit)


Architecture
Landing Page (/) -> Login (/login) -> Auth System -> Dashboard (/dashboard/*)
                                         |
                                   Admin Approval (status='pending' -> 'approved')
                                         |
                                   Access to Message Generator
                                   
Message Generation Flow:
LinkedIn Profile (from existing search)
    |
API POST /api/generate-messages (protected by auth)
    |
OpenAI gpt-4o-mini (3 drafts: Direct, Consultative, Value-First)
    |
Supabase (store lead + generated drafts)
    |
Frontend displays drafts -> User copies to LinkedIn

Data Model
Table: users (V3 - Auth)
sqlid (uuid, pk)
email (text, unique)
password_hash (text)
role (text: 'user' | 'admin', default='user')
status (text: 'pending_approval' | 'approved' | 'rejected', default='pending_approval')
created_at (timestamp)
approved_at (timestamp, nullable)
approved_by (uuid, fk to users(id), nullable)
Table: user_approvals (V3 - Log)
sqlid (uuid, pk)
user_id (uuid, fk)
approved_by (uuid, fk)
status (text: 'approved' | 'rejected')
reason (text, nullable)
created_at (timestamp)
Table: leads (V1-V2 - Message Generator)
sqlid (uuid, pk)
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
Table: message_drafts (V1-V2 - Message Generator)
sqlid (uuid, pk)
lead_id (uuid, fk)
search_id (uuid, fk)
batch_id (uuid, fk to message_batches, nullable)
sequence (int: 1 | 2 | 3)
text (text)
sounds_human (numeric 0-1, optional)
confidence (numeric 0-1)
created_at (timestamp)
Table: message_batches (V2 onwards - Message Generator)
sqlid (uuid, pk)
search_id (uuid, fk)
batch_name (text)
message_count (int)
status (text: 'generated' | 'deleted', default='generated')
created_at (timestamp)

Current Status
V1-V2: Message Generator ✅ COMPLETE

 Architecture defined
 Data model designed
 OpenAI prompt finalized (humanization v2)
 API endpoint /api/generate-messages + batch route
 Supabase schema (leads, message_drafts, message_batches)
 Frontend form component (SearchSelector)
 Draft display component (results table)
 Batch Generator UI (/searches)
 Messages Management UI (/messages) with batch selection
 Legacy messages recovery (heredados)
 Batch operations (create, delete, select, regenerate)

V3: Auth System ✅ COMPLETE

 Database: users + user_approvals tables (Supabase SQL)
 Endpoints:

POST /api/auth/signup (register -> status='pending_approval')
POST /api/auth/signin (login, check status='approved')
POST /api/auth/logout (logout, clear session)
GET /api/admin/pending-users (list pending + rejected users)
POST /api/admin/approve-user/:id (approve user via RPC)
POST /api/admin/reject-user/:id (reject user via RPC)


 Middleware (middleware.ts - Edge Runtime):

Protege /dashboard/* -> requiere auth + status='approved'
Protege /admin/* -> requiere auth + role='admin' + status='approved'
Publica: /, /login, /api/auth/*


 Security:

Fixed privilege escalation (no auto-approve by email)
Enforced: todos los signups -> status='pending_approval'
HttpOnly cookies para JWT tokens
Password hashing via Supabase
RPC transaccional para approve/reject



V3: Login Page UI ✅ COMPLETE

 Design: Dark minimal, hamburguesa layout (vertical stack)
 Components:

src/dashboard/login/page.tsx (main page)
src/components/auth/SigninForm.tsx (signin logic)
src/components/auth/SignupForm.tsx (signup logic)


 Features:

Tabs: "Entrar" | "Registro" (botones verticales, border sharp)
Inputs: Email + Password (sharp, legible placeholders)
Button: "Iniciar Sesión" (blanco/negro, sharp)
SearchParams: ?reason=pending, ?reason=rejected (status messages)
Validación: Email format + password length (8+ chars)
UI responsivo, dark mode compatible


 Commit: "Fix: redesign login page (design system compliant)"

V3: Landing Page ✅ COMPLETE

 6 Server Components (sin "use client"):

Navbar.tsx (fixed top, logo ⚡ + nav links + CTA "Empezar")
HeroSection.tsx (terminal preview animado, stats, 2 CTAs)
FeaturesSection.tsx (grid 3 cols: Búsqueda / Mensajes / Campañas)
TestimonialSection.tsx (fondo negro, blockquote, social proof chips)
CTASection.tsx (fondo naranja #D94F00, "Registrarse gratis")
Footer.tsx (logo + nav links + copyright)


 Features:

Estética idéntica al dashboard (same palette + bordes sharp)
Colores: #F0EDE4 (bg), #1A1A1A (texto), #D94F00 (accent), #4A7C59 (secondary)
Bordes: Sharp (border-radius: 0)
Server-side rendering (sin estado, sin hydration overhead)
Responsivo: Mobile first, desktop optimizado


 Routing:

/ -> Landing page
/login -> Auth page
/dashboard/* -> Dashboard (protegido)
/admin/* -> Admin panel (protegido)


 Commit: abe4ac2 - "Feat: create landing page (design-consistent)"

V3: Admin Dashboard ✅ COMPLETE (TAREA 11)

 Admin Approvals page (/admin/approvals)

Tabla con: Email | Status | Requested Date | Actions
Botones: Aprobar | Rechazar (con refetch automático)
API calls: GET /api/admin/pending-users, POST approve/reject
Estética: Idéntica al dashboard (sharps, OKLCH variables)
Protección: Solo role='admin' + status='approved'

 Commit: b09b808 - "Feat: admin approvals dashboard (via Codex)"
V3: E2E Tests 🕒 PENDIENTE (TAREA 12)

 Signup -> Pending approval -> Admin approve -> Signin -> Access
Asignada a: Codex


🔑 Endpoints Implementados
Auth
POST /api/auth/signup
  Body: { email, password }
  Response: { success, error?, reason? }
  
POST /api/auth/signin
  Body: { email, password }
  Response: { success, token?, error? }
  
POST /api/auth/logout
  Response: { success }
Admin
GET /api/admin/pending-users
  Response: User[]

POST /api/admin/approve-user/[id]
  Body: {}
  Response: { success, message }

POST /api/admin/reject-user/[id]
  Body: { reason?: string }
  Response: { success, message }
Message Generator (V1-V2)
GET /api/searches
GET /api/contacts/[id]
POST /api/generate-messages
GET /api/batches
GET /api/drafts?legacy=true

📁 File Structure
src/dashboard/
├── page.tsx                           # Landing page (✅ COMPLETE)
├── login/
│   └── page.tsx                       # Auth page - dark minimal (✅ COMPLETE)
├── app/
│   ├── page.tsx                       # Dashboard (protegido)
│   ├── searches/page.tsx
│   ├── messages/page.tsx
│   └── batches/page.tsx
├── admin/
│   ├── layout.tsx                     # Protección admin
│   └── approvals/
│       └── page.tsx                   # (✅ COMPLETE)
├── api/
│   ├── auth/
│   │   ├── signup/route.ts            # (✅ COMPLETE)
│   │   ├── signin/route.ts            # (✅ COMPLETE)
│   │   └── logout/route.ts            # (✅ COMPLETE)
│   ├── admin/
│   │   ├── pending-users/route.ts     # (✅ COMPLETE)
│   │   ├── approve-user/[id]/route.ts # (✅ COMPLETE)
│   │   └── reject-user/[id]/route.ts  # (✅ COMPLETE)
│   └── [V1-V2 routes...]
└── middleware.ts                      # Route protection (✅ COMPLETE)

src/components/
├── landing/                           # 6 componentes (✅ COMPLETE)
│   ├── Navbar.tsx
│   ├── HeroSection.tsx
│   ├── FeaturesSection.tsx
│   ├── TestimonialSection.tsx
│   ├── CTASection.tsx
│   └── Footer.tsx
├── auth/                              # Auth forms (✅ COMPLETE)
│   ├── SigninForm.tsx
│   └── SignupForm.tsx
└── [V1-V2 components...]

src/lib/
├── auth.ts                            # Auth utilities
├── supabase.ts                        # Supabase client
└── utils.ts

src/types/
└── index.ts

Decisiones Arquitectónicas (Congeladas)
1. Auth Strategy: Supabase Auth + Custom Users Table

Decisión: Use Supabase Auth (built-in) + custom users table para roles/status
Por qué: Ya usando Supabase, JWT tokens automáticos, password hashing seguro, HttpOnly cookies

2. Admin Approval Flow (Mandatory)

Decisión: Status field ('pending_approval' | 'approved' | 'rejected')
Por qué: Simple, explícito, audit trail vía user_approvals log

3. Landing Page = Dashboard (Same Aesthetic)

Decisión: Landing page usa EXACTAMENTE la misma palette + bordes sharp
Por qué: Coherencia visual, branded experience

4. Middleware Edge Runtime Protection

Decisión: Protege /dashboard/* y /admin/* en middleware.ts (Edge Runtime)
Por qué: Performance, early redirect


Flujo de Usuario (V3)
Nuevo Usuario
1. Va a / (landing) -> click "Empezar" -> /login
2. Click "Registrarse" -> formulario signup
3. Email + Password -> Submit
4. POST /api/auth/signup -> status='pending_approval'
5. Response: "Espera aprobación del admin"
Admin (Aprobación)
1. /admin/approvals
2. Ve tabla: email, status, fecha
3. Click "Aprobar" -> POST /api/admin/approve-user/:id
4. Usuario ahora puede signin
Usuario Aprobado
1. /login -> Signin
2. POST /api/auth/signin (status='approved')
3. Redirect -> /dashboard/searches (dashboard)
4. Acceso completo a message generator

Stack Técnico
Frontend: Next.js 15 + React 18 + TypeScript + Tailwind CSS
Backend: Next.js API Routes + Edge Runtime Middleware
Database: Supabase PostgreSQL
Auth: Supabase Auth + JWT HttpOnly cookies
Password: bcrypt hashing (Supabase automatic)
Styling: Tailwind CSS con variables OKLCH

Proximas Tareas
TAREA 12: E2E Tests (Codex)

Signup -> Pending -> Approve -> Signin -> Access

Ultima actualizacion: 12 de mayo de 2026, 16:00
Estado: V3 Auth + Dashboard + Admin + User Management + UI Refactor COMPLETO | E2E Tests PENDIENTE
Build note: ✅ npm run build pasando (incluye fix de SearchFilters en scripts/test_search.ts, commit fd75c09).

V3: User Management Panel ✅ COMPLETE (TAREA 13)

Ruta: /dashboard/users
Condicional de rol en /dashboard:
- role=admin: muestra boton "Gestionar Usuarios"
- role=user: no muestra boton

Proteccion:
- Middleware: requiere cookie auth-token en /dashboard/*
- Pagina /dashboard/users valida rol admin y redirige a /dashboard si no cumple

Nuevos endpoints:
- GET /api/auth/me
- GET /api/admin/users
- PATCH /api/admin/users/[id]
- DELETE /api/admin/users/[id]

V3: Dashboard Visual Refactor ✅ COMPLETE (TAREA 14)

Refactorización total del dashboard para alinearlo con el Design System de la Landing Page:
- Estructura: Grid 2x2 con 4 botones semánticos (Buscador, Mis Búsquedas, Generador, Hub de Mensajes).
- Paleta: #F0EDE4 (Cream), #1A1A1A (Dark), #D94F00 (Accent), #4A7C59 (Secondary)
- Bordes: Sharp (border-radius: 0) en todo el sistema.
- Layout: Responsive grid (1/2 columnas) con sombras sólidas "brutalist style".
- UX: Header persistente con Logout, navegación clara y bienvenida dinámica (USER@...).
- Consistencia: Sincronización de estilos en subpáginas (Searches, Messages, Users).

Commit: "UI: Dashboard visual refactor (2x2 grid + semantic buttons)"
