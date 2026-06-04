'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface MeResponse {
  user: {
    id: string
    email: string
    role: 'admin' | 'user'
    status: 'approved' | 'pending_approval' | 'rejected'
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<MeResponse['user'] | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok) {
          router.push('/login')
          return
        }

        const data = (await response.json()) as MeResponse
        setUser(data.user)
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    void checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F0EDE4]">
        <p className="text-[#1A1A1A] font-bold uppercase tracking-widest text-xs">Cargando...</p>
      </div>
    )
  }

  if (!user) return null

  const userName = user.email.split('@')[0].toUpperCase()
  const isAdmin = user.role === 'admin'

  return (
    <div className="min-h-screen bg-[#F0EDE4] text-[#1A1A1A] font-sans">
      {/* NAVBAR */}
      <nav className="border-b border-[#1A1A1A] bg-[#F0EDE4] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 font-black text-sm tracking-tighter uppercase">
            <span className="text-[#D94F00] text-xl">⚡</span>
            <span>LINKEDIN SCRAPER</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F0EDE4] transition-colors"
          >
            LOGOUT
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* HEADER */}
        <header className="mb-12">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">
            BIENVENIDO, {userName}
          </h1>
          <p className="text-base font-bold text-[#1A1A1A]/70 uppercase tracking-tight">
            Gestiona tus búsquedas, mensajes y usuarios
          </p>
        </header>

        {/* GRID 2x2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* Card 1: BUSCADOR */}
          <Link href="/dashboard/search">
            <div className="group border border-[#1A1A1A] bg-white p-8 flex flex-col gap-6 shadow-[4px_4px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1A1A1A] transition-all cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <span className="text-4xl" aria-hidden="true">🔍</span>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">
                  Buscador
                </h2>
              </div>
              <p className="text-sm font-bold text-[#1A1A1A]/70 leading-relaxed uppercase tracking-tight">
                Busca perfiles en LinkedIn y encuentra prospectivos para tus campañas (Próxima release).
              </p>
              <button className="mt-auto w-full bg-[#D94F00] text-white text-[11px] font-black uppercase tracking-widest px-6 py-3 border border-[#1A1A1A] group-hover:brightness-110 transition-all shadow-[2px_2px_0px_#1A1A1A]">
                Buscar
              </button>
            </div>
          </Link>

          {/* Card 2: MIS BÚSQUEDAS */}
          <Link href="/dashboard/searches">
            <div className="group border border-[#1A1A1A] bg-white p-8 flex flex-col gap-6 shadow-[4px_4px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1A1A1A] transition-all cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <span className="text-4xl" aria-hidden="true">📋</span>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">
                  Mis Búsquedas
                </h2>
              </div>
              <p className="text-sm font-bold text-[#1A1A1A]/70 leading-relaxed uppercase tracking-tight">
                Ve tus búsquedas guardadas y consulta el historial de prospectos encontrados.
              </p>
              <button className="mt-auto w-full bg-[#D94F00] text-white text-[11px] font-black uppercase tracking-widest px-6 py-3 border border-[#1A1A1A] group-hover:brightness-110 transition-all shadow-[2px_2px_0px_#1A1A1A]">
                Ver
              </button>
            </div>
          </Link>

          {/* Card 3: GENERADOR */}
          <Link href="/dashboard/searches">
            <div className="group border border-[#1A1A1A] bg-white p-8 flex flex-col gap-6 shadow-[4px_4px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1A1A1A] transition-all cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <span className="text-4xl" aria-hidden="true">💬</span>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">
                  Generador
                </h2>
              </div>
              <p className="text-sm font-bold text-[#1A1A1A]/70 leading-relaxed uppercase tracking-tight">
                Crea mensajes personalizados en lote con IA (3 variantes por lead) para tus búsquedas.
              </p>
              <button className="mt-auto w-full bg-[#4A7C59] text-white text-[11px] font-black uppercase tracking-widest px-6 py-3 border border-[#1A1A1A] group-hover:brightness-110 transition-all shadow-[2px_2px_0px_#1A1A1A]">
                Generar
              </button>
            </div>
          </Link>

          {/* Card 4: HUB DE MENSAJES */}
          <Link href="/dashboard/messages">
            <div className="group border border-[#1A1A1A] bg-white p-8 flex flex-col gap-6 shadow-[4px_4px_0px_#1A1A1A] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1A1A1A] transition-all cursor-pointer h-full">
              <div className="flex items-center gap-4">
                <span className="text-4xl" aria-hidden="true">📧</span>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">
                  Hub de Mensajes
                </h2>
              </div>
              <p className="text-sm font-bold text-[#1A1A1A]/70 leading-relaxed uppercase tracking-tight">
                Visualiza tus mensajes generados, cópialos y gestiona tus lotes de envío.
              </p>
              <button className="mt-auto w-full bg-[#4A7C59] text-white text-[11px] font-black uppercase tracking-widest px-6 py-3 border border-[#1A1A1A] group-hover:brightness-110 transition-all shadow-[2px_2px_0px_#1A1A1A]">
                Ver
              </button>
            </div>
          </Link>

        </div>

        {/* ADMIN SECTION */}
        {isAdmin && (
          <section className="border-t-2 border-[#1A1A1A] pt-12 mt-12">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-[#1A1A1A] mb-8">
              ⚙️ Admin Tools
            </h2>
            <Link href="/dashboard/users">
              <div className="group bg-[#F5F5F5] border border-[#1A1A1A] p-8 shadow-[4px_4px_0px_#1A1A1A] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1A1A1A] transition-all cursor-pointer">
                <div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-1">Gestionar Usuarios</h3>
                  <p className="text-sm font-bold text-[#1A1A1A]/70 uppercase tracking-tight">
                    Aprueba o rechaza nuevos usuarios, gestiona sus roles y permisos.
                  </p>
                </div>
                <button className="whitespace-nowrap bg-[#D94F00] text-white text-[11px] font-black uppercase tracking-widest px-8 py-4 border border-[#1A1A1A] group-hover:brightness-110 transition-all shadow-[2px_2px_0px_#1A1A1A]">
                  Gestionar →
                </button>
              </div>
            </Link>
          </section>
        )}
      </main>
    </div>
  )
}
