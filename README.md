# LinkedIn Lead Scraper V3 - Message Generator + Auth

Sistema de prospeccion B2B con flujo completo:
1. Buscar perfiles en LinkedIn
2. Generar mensajes personalizados con IA
3. Gestionar acceso con autenticacion y aprobacion de admin

## Stack

- Next.js 15 (App Router)
- React + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Auth)
- OpenAI (gpt-4o-mini)

## Estado actual

- V1-V2 Message Generator: COMPLETO
- V3 Auth System: COMPLETO
- V3 Admin Approvals Dashboard (/admin/approvals): COMPLETO
- E2E auth flow (TAREA 12): PENDIENTE

## Flujo de usuario

### Usuario nuevo

1. Ir a `/login`
2. Crear cuenta (`POST /api/auth/signup`)
3. Queda en `pending_approval`
4. Esperar aprobacion de admin

### Admin

1. Ir a `/admin/approvals`
2. Ver tabla con `pending_approval` y `rejected`
3. Aprobar: `POST /api/admin/approve-user/[id]`
4. Rechazar: `POST /api/admin/reject-user/[id]`

### Usuario aprobado

1. Iniciar sesion (`POST /api/auth/signin`)
2. Recibe cookie HttpOnly con sesion
3. Accede a `/app/*`

## Rutas principales

- Publicas:
  - `/`
  - `/login`
  - `/api/auth/*`

- Protegidas:
  - `/app/*` (usuario autenticado + `status=approved`)
  - `/admin/*` (admin + `status=approved`)

## Endpoints V3 (Auth/Admin)

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `POST /api/auth/logout`

### Admin

- `GET /api/admin/pending-users`
- `POST /api/admin/approve-user/[id]`
- `POST /api/admin/reject-user/[id]`

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
- Session token en cookie HttpOnly
- Middleware para proteger `/app/*` y `/admin/*`
- Guard server-side `requireAdmin` para endpoints admin
- RPC transaccional para approve/reject

## Variables de entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

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
- `README.md` normalizado a UTF-8 limpio para evitar caracteres rotos en GitHub.
