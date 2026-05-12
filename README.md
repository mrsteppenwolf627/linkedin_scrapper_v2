# LinkedIn Lead Scraper V3 - Message Generator + Auth

Sistema de prospeccion B2B con flujo completo:
1. Buscar perfiles en LinkedIn
2. Generar mensajes personalizados con IA
3. Gestionar acceso con autenticacion y aprobacion admin

## Stack

- Next.js 15 (App Router)
- React + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Auth)
- OpenAI (gpt-4o-mini)

## Estado actual

- V1-V2 Message Generator: COMPLETO
- V3 Auth System: COMPLETO
- V3 Admin Approvals Dashboard (`/admin/approvals`): COMPLETO
- V3 User Management Panel (`/dashboard/users`, solo admins): COMPLETO (TAREA 13)
- E2E auth flow (TAREA 12): PENDIENTE

## Rutas principales

- Publicas:
  - `/`
  - `/login`
  - `/api/auth/*`

- Protegidas:
  - `/dashboard/*` (usuario autenticado y aprobado)
  - `/admin/*` (admin y aprobado)

## Flujo de usuario

### Usuario nuevo

1. Ir a `/login`
2. Crear cuenta (`POST /api/auth/signup`)
3. Queda en `pending_approval`
4. Esperar aprobacion de admin

### Admin

1. Ir a `/admin/approvals`
2. Aprobar/rechazar pendientes
3. Ir a `/dashboard`
4. Ver boton `Gestionar Usuarios`
5. Entrar a `/dashboard/users`
6. Gestionar roles, estado y eliminacion de usuarios

### Usuario aprobado

1. Iniciar sesion (`POST /api/auth/signin`)
2. Recibe cookie HttpOnly `auth-token`
3. Accede a `/dashboard/*`
4. No ve acceso a `/dashboard/users` si no es admin

## Endpoints V3 (Auth/Admin)

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Admin

- `GET /api/admin/pending-users`
- `POST /api/admin/approve-user/[id]`
- `POST /api/admin/reject-user/[id]`
- `GET /api/admin/users`
- `PATCH /api/admin/users/[id]`
- `DELETE /api/admin/users/[id]`

## Endpoints Message Generator

- `POST /api/search`
- `GET /api/searches`
- `GET /api/contacts?search_id=<uuid>`
- `POST /api/generate-messages`
- `POST /api/generate-messages/batch`
- `GET /api/generate-messages/batch/status?search_id=<uuid>`
- `GET /api/drafts`
- `GET /api/batches`

## Seguridad

- Password hashing por Supabase Auth
- Cookie de sesion HttpOnly (`auth-token`)
- Middleware protege `/dashboard/*` y `/admin/*`
- Guard server-side `requireApproved()` y `requireAdmin()`
- Endpoints admin protegidos server-side

## Variables de entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=

# OpenAI
OPENAI_API_KEY=

# Search
SEARCHAPI_IO_KEY=
SEARCH_API_KEY=
NEXT_PUBLIC_SEARCH_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_EMAIL=
```

## Scripts utiles

```bash
npm run dev
npm run build
npm run test:search
npm run test:auth
```

## Notas

- LinkedIn DM no se envia automatico: el usuario copia y pega mensajes.
- README mantenido en UTF-8 limpio para evitar caracteres rotos en GitHub.
