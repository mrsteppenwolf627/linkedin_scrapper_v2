import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'

type SupabaseFactory = () => any

const supabaseState: { createClient: SupabaseFactory } = {
  createClient: () => {
    throw new Error('Supabase mock not configured for this test')
  },
}

;(mock as any).module('@/lib/supabase', {
  namedExports: {
    createServerClient: () => supabaseState.createClient(),
  },
})

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function importFresh<T>(modulePath: string): Promise<T> {
  const nonce = `${Date.now()}-${Math.random()}`
  return import(`${modulePath}?t=${nonce}`) as Promise<T>
}

test('signup: usuario nuevo queda pending_approval', async () => {
  process.env.NEXT_PUBLIC_ADMIN_EMAIL = 'admin@company.com'

  let insertedUser: Record<string, unknown> | null = null
  const createdUsers: Array<{ email: string; password: string; email_confirm: boolean }> = []

  supabaseState.createClient = () => ({
    from: (table: string) => {
      if (table !== 'users') throw new Error(`Unexpected table: ${table}`)
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
        insert: async (payload: Record<string, unknown>) => {
          insertedUser = payload
          return { error: null }
        },
      }
    },
    auth: {
      admin: {
        createUser: async (payload: { email: string; password: string; email_confirm: boolean }) => {
          createdUsers.push(payload)
          return { data: { user: { id: 'user-1' } }, error: null }
        },
        deleteUser: async () => ({ error: null }),
      },
    },
  })

  const { POST } = await importFresh<{ POST: (req: Request) => Promise<Response> }>('../src/app/api/auth/signup/route.ts')
  const res = await POST(jsonRequest('http://localhost/api/auth/signup', {
    email: 'new.user@test.com',
    password: 'password123',
  }))

  const body = await res.json() as { success?: boolean }
  assert.equal(res.status, 201)
  assert.equal(body.success, true)
  assert.equal(createdUsers.length, 1)
  const u = insertedUser as { role: string; status: string } | null
  assert.equal(u?.role, 'user')
  assert.equal(u?.status, 'pending_approval')
})

test('signin: usuario pending rechaza con mensaje esperado', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_ANON_KEY = 'anon-key'

  supabaseState.createClient = () => ({
    from: (table: string) => {
      if (table !== 'users') throw new Error(`Unexpected table: ${table}`)
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: {
                id: 'pending-user',
                email: 'pending@test.com',
                role: 'user',
                status: 'pending_approval',
              },
              error: null,
            }),
          }),
        }),
      }
    },
  })

  const originalFetch = global.fetch
  const fetchCalls: Array<{ url: string }> = []
  global.fetch = (async (url: string | URL | globalThis.Request) => {
    fetchCalls.push({ url: String(url) })
    return new Response(JSON.stringify({
      access_token: 'pending-token',
      expires_in: 3600,
      user: { id: 'pending-user' },
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }) as typeof fetch

  try {
    const { POST } = await importFresh<{ POST: (req: Request) => Promise<Response> }>('../src/app/api/auth/signin/route.ts')
    const res = await POST(jsonRequest('http://localhost/api/auth/signin', {
      email: 'pending@test.com',
      password: 'password123',
    }))

    const body = await res.json() as { message?: string }
    assert.equal(fetchCalls.length, 1)
    assert.equal(res.status, 403)
    assert.equal(body.message, 'Tu cuenta aún no ha sido aprobada')
  } finally {
    global.fetch = originalFetch
  }
})

test('signin: usuario approved success con token + cookie', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_ANON_KEY = 'anon-key'

  supabaseState.createClient = () => ({
    from: (table: string) => {
      if (table !== 'users') throw new Error(`Unexpected table: ${table}`)
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: {
                id: 'approved-user',
                email: 'approved@test.com',
                role: 'user',
                status: 'approved',
              },
              error: null,
            }),
          }),
        }),
      }
    },
  })

  const originalFetch = global.fetch
  global.fetch = (async () => new Response(JSON.stringify({
    access_token: 'approved-token',
    expires_in: 1800,
    user: { id: 'approved-user' },
  }), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch

  try {
    const { POST } = await importFresh<{ POST: (req: Request) => Promise<Response> }>('../src/app/api/auth/signin/route.ts')
    const res = await POST(jsonRequest('http://localhost/api/auth/signin', {
      email: 'approved@test.com',
      password: 'password123',
    }))

    const body = await res.json() as { success?: boolean; user?: { email?: string } }
    const cookie = res.headers.get('set-cookie') ?? ''

    assert.equal(res.status, 200)
    assert.equal(body.success, true)
    assert.equal(body.user?.email, 'approved@test.com')
    assert.match(cookie, /sb-auth-token=approved-token/)
    assert.match(cookie, /HttpOnly/i)
  } finally {
    global.fetch = originalFetch
  }
})

test('signin: usuario rejected rechaza con mensaje', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_ANON_KEY = 'anon-key'

  supabaseState.createClient = () => ({
    from: (table: string) => {
      if (table !== 'users') throw new Error(`Unexpected table: ${table}`)
      return {
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: {
                id: 'rejected-user',
                email: 'rejected@test.com',
                role: 'user',
                status: 'rejected',
              },
              error: null,
            }),
          }),
        }),
      }
    },
  })

  const originalFetch = global.fetch
  global.fetch = (async () => new Response(JSON.stringify({
    access_token: 'rejected-token',
    expires_in: 3600,
    user: { id: 'rejected-user' },
  }), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch

  try {
    const { POST } = await importFresh<{ POST: (req: Request) => Promise<Response> }>('../src/app/api/auth/signin/route.ts')
    const res = await POST(jsonRequest('http://localhost/api/auth/signin', {
      email: 'rejected@test.com',
      password: 'password123',
    }))

    const body = await res.json() as { message?: string }
    assert.equal(res.status, 403)
    assert.match(body.message ?? '', /rechazada/i)
  } finally {
    global.fetch = originalFetch
  }
})

test('admin/pending-users: solo admin puede ver', async () => {
  supabaseState.createClient = () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: { message: 'No session' } }),
    },
    from: () => {
      throw new Error('Should not hit DB without admin session')
    },
  })

  const { GET } = await importFresh<{ GET: (req: NextRequest) => Promise<Response> }>('../src/app/api/admin/pending-users/route.ts')
  const req = new NextRequest('http://localhost/api/admin/pending-users')
  const res = await GET(req)

  assert.equal(res.status, 401)
})

test('admin/approve-user: solo admin puede aprobar, llama rpc atómico', async () => {
  const rpcCalls: Array<{ fn: string; args: Record<string, unknown> }> = []

  supabaseState.createClient = () => ({
    auth: {
      getUser: async (token: string) => {
        if (token === 'admin-token') {
          return { data: { user: { id: 'admin-1' } }, error: null }
        }
        return { data: { user: null }, error: { message: 'Invalid token' } }
      },
    },
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: (_field: string, value: string) => ({
              single: async () => {
                if (value === 'admin-1') {
                  return {
                    data: { id: 'admin-1', email: 'admin@test.com', role: 'admin', status: 'approved' },
                    error: null,
                  }
                }
                return { data: null, error: { message: 'Not found' } }
              },
            }),
          }),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
    rpc: async (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push({ fn, args })
      return {
        data: { email: 'user@test.com', status: 'approved' },
        error: null,
      }
    },
  })

  const { POST } = await importFresh<{
    POST: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>
  }>('../src/app/api/admin/approve-user/[id]/route.ts')

  const req = new NextRequest('http://localhost/api/admin/approve-user/user-123', {
    method: 'POST',
    headers: { cookie: 'sb-auth-token=admin-token' },
  })
  const res = await POST(req, { params: Promise.resolve({ id: 'user-123' }) })
  const body = await res.json() as { success?: boolean }

  assert.equal(res.status, 200)
  assert.equal(body.success, true)
  assert.equal(rpcCalls.length, 1)
  assert.equal(rpcCalls[0].fn, 'approve_user')
  assert.equal(rpcCalls[0].args.p_user_id, 'user-123')
  assert.equal(rpcCalls[0].args.p_admin_id, 'admin-1')
})

test('admin/approve-user: usuario no admin no puede aprobar', async () => {
  supabaseState.createClient = () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: { message: 'Invalid token' } }),
    },
    from: () => {
      throw new Error('Should not hit DB without valid admin session')
    },
  })

  const { POST } = await importFresh<{
    POST: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>
  }>('../src/app/api/admin/approve-user/[id]/route.ts')

  const req = new NextRequest('http://localhost/api/admin/approve-user/user-123', {
    method: 'POST',
  })
  const res = await POST(req, { params: Promise.resolve({ id: 'user-123' }) })

  assert.equal(res.status, 401)
})

test('logout: borra cookie + revoca token', async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

  const fetchCalls: Array<{ url: string; authorization: string | null }> = []
  const originalFetch = global.fetch
  global.fetch = (async (url: string | URL | globalThis.Request, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    fetchCalls.push({
      url: String(url),
      authorization: headers.get('authorization'),
    })
    return new Response(null, { status: 204 })
  }) as typeof fetch

  try {
    const { POST } = await importFresh<{ POST: (req: NextRequest) => Promise<Response> }>('../src/app/api/auth/logout/route.ts')
    const req = new NextRequest('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { cookie: 'sb-auth-token=logout-token' },
    })
    const res = await POST(req)

    const cookie = res.headers.get('set-cookie') ?? ''
    assert.equal(res.status, 200)
    assert.equal(fetchCalls.length, 1)
    assert.match(fetchCalls[0].url, /\/auth\/v1\/logout$/)
    assert.equal(fetchCalls[0].authorization, 'Bearer logout-token')
    assert.match(cookie, /sb-auth-token=/)
    assert.match(cookie, /Max-Age=0/i)
    assert.match(cookie, /HttpOnly/i)
  } finally {
    global.fetch = originalFetch
  }
})
