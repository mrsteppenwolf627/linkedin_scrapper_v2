"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"signin" | "signup">("signin")
  const reason = searchParams.get("reason")

  // Signin form state
  const [signinData, setSigninData] = React.useState({ email: "", password: "" })
  const [signinError, setSigninError] = React.useState("")

  // Signup form state
  const [signupData, setSignupData] = React.useState({
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [signupError, setSignupError] = React.useState("")

  const signinEmailRef = React.useRef<HTMLInputElement>(null)
  const signupEmailRef = React.useRef<HTMLInputElement>(null)

  // Focus on first input when tab changes
  React.useEffect(() => {
    if (activeTab === "signin") {
      signinEmailRef.current?.focus()
    } else {
      signupEmailRef.current?.focus()
    }
  }, [activeTab])

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSigninError("")

    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signinData),
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        setSigninError(data.message || "Error al iniciar sesión")
        return
      }

      toast.success("¡Bienvenido!")
      router.push("/app/messages")
    } catch (err) {
      setSigninError("Error de conexión al servidor.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSignupError("")

    if (signupData.password.length < 8) {
      setSignupError("La contraseña debe tener al menos 8 caracteres.")
      setIsLoading(false)
      return
    }

    if (signupData.password !== signupData.confirmPassword) {
      setSignupError("Las contraseñas no coinciden.")
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupData.email,
          password: signupData.password,
        }),
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        setSignupError(data.message || "Error al registrarse")
        return
      }

      toast.success("Cuenta creada. Espera la aprobación del administrador.")
      setActiveTab("signin")
      setSigninData(prev => ({ ...prev, email: signupData.email }))
      setSignupData({ email: "", password: "", confirmPassword: "" })
    } catch (err) {
      setSignupError("Error de conexión al servidor.")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClasses = "w-full bg-transparent border-t-0 border-x-0 border-b border-muted-foreground/30 px-0 py-2 focus:border-orange-600 focus:ring-0 transition-colors outline-none text-foreground placeholder:text-muted-foreground/50"
  const labelClasses = "block text-xs uppercase tracking-widest text-muted-foreground font-sans mb-1"

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#F5F1EA] text-[#1A1A1A] font-sans selection:bg-orange-200">
      {/* 1. Sidebar Izquierdo (20%) */}
      <aside className="w-full md:w-[20%] border-r border-muted-foreground/10 p-8 flex flex-col justify-between bg-white/50 backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="h-8 w-8 bg-[#1A1A1A] flex items-center justify-center rounded-sm">
              <svg className="h-5 w-5 text-[#F5F1EA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-serif font-bold text-lg tracking-tight">Scraper</span>
          </div>

          <nav className="space-y-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Opciones</p>
              <ul className="space-y-4">
                <li>
                  <button
                    onClick={() => setActiveTab("signin")}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-orange-600 flex items-center gap-2",
                      activeTab === "signin" ? "text-orange-600" : "text-muted-foreground"
                    )}
                  >
                    <span className={cn("h-1 w-1 rounded-full bg-orange-600 transition-opacity", activeTab === "signin" ? "opacity-100" : "opacity-0")} />
                    Iniciar Sesión
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab("signup")}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-orange-600 flex items-center gap-2",
                      activeTab === "signup" ? "text-orange-600" : "text-muted-foreground"
                    )}
                  >
                    <span className={cn("h-1 w-1 rounded-full bg-orange-600 transition-opacity", activeTab === "signup" ? "opacity-100" : "opacity-0")} />
                    Registrarse
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        {reason && (
          <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-sm">
            <p className="text-[10px] uppercase tracking-wider text-orange-800 font-bold mb-1">Status</p>
            <p className="text-xs text-orange-700 leading-relaxed">
              {reason === "unauthorized" ? "Sesión requerida" : reason}
            </p>
          </div>
        )}
      </aside>

      {/* 2. Centro (60%) */}
      <main className="flex-1 p-8 md:p-24 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <header className="mb-12">
            <h1 className="font-serif text-5xl font-medium tracking-tight mb-4">
              {activeTab === "signin" ? "Bienvenido" : "Crea tu cuenta"}
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {activeTab === "signin" 
                ? "Accede a tu panel de control para gestionar leads." 
                : "Únete a la plataforma y solicita acceso al administrador."}
            </p>
          </header>

          {activeTab === "signin" ? (
            <form onSubmit={handleSignin} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-6">
                <div>
                  <label htmlFor="signin-email" className={labelClasses}>Email</label>
                  <input
                    id="signin-email"
                    ref={signinEmailRef}
                    type="email"
                    required
                    placeholder="correo@ejemplo.com"
                    className={inputClasses}
                    value={signinData.email}
                    onChange={(e) => {
                      setSigninData({ ...signinData, email: e.target.value })
                      setSigninError("")
                    }}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="signin-password" className={labelClasses}>Contraseña</label>
                  <input
                    id="signin-password"
                    type="password"
                    required
                    className={inputClasses}
                    value={signinData.password}
                    onChange={(e) => {
                      setSigninData({ ...signinData, password: e.target.value })
                      setSigninError("")
                    }}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {signinError && (
                <p className="text-xs text-red-600 font-medium">{signinError}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1A1A1A] hover:bg-orange-600 text-[#F5F1EA] rounded-none py-6 transition-all font-serif text-lg border-none"
              >
                {isLoading ? "Cargando..." : "Entrar →"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-6">
                <div>
                  <label htmlFor="signup-email" className={labelClasses}>Email</label>
                  <input
                    id="signup-email"
                    ref={signupEmailRef}
                    type="email"
                    required
                    placeholder="correo@ejemplo.com"
                    className={inputClasses}
                    value={signupData.email}
                    onChange={(e) => {
                      setSignupData({ ...signupData, email: e.target.value })
                      setSignupError("")
                    }}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label htmlFor="signup-password" className={labelClasses}>Contraseña</label>
                  <input
                    id="signup-password"
                    type="password"
                    required
                    className={inputClasses}
                    value={signupData.password}
                    onChange={(e) => {
                      setSignupData({ ...signupData, password: e.target.value })
                      setSignupError("")
                    }}
                    disabled={isLoading}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Mínimo 8 caracteres</p>
                </div>
                <div>
                  <label htmlFor="signup-confirm" className={labelClasses}>Confirmar Contraseña</label>
                  <input
                    id="signup-confirm"
                    type="password"
                    required
                    className={inputClasses}
                    value={signupData.confirmPassword}
                    onChange={(e) => {
                      setSignupData({ ...signupData, confirmPassword: e.target.value })
                      setSignupError("")
                    }}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {signupError && (
                <p className="text-xs text-red-600 font-medium">{signupError}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1A1A1A] hover:bg-orange-600 text-[#F5F1EA] rounded-none py-6 transition-all font-serif text-lg border-none"
              >
                {isLoading ? "Procesando..." : "Registrarme →"}
              </Button>
            </form>
          )}

          <footer className="mt-12 pt-12 border-t border-muted-foreground/10 text-center">
            <p className="text-[11px] text-muted-foreground tracking-widest uppercase">
              &copy; {new Date().getFullYear()} LinkedIn Lead Scraper
            </p>
          </footer>
        </div>
      </main>

      {/* 3. Panel Derecho (20%) */}
      <aside className="hidden lg:flex w-[20%] bg-[#1A1A1A] text-[#F5F1EA] p-8 flex-col justify-center border-l border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-600/5 blur-[80px]" />
        
        <div className="relative z-10 space-y-12">
          <div className="space-y-4">
            <p className="text-orange-600 text-xs font-serif italic">Filosofía</p>
            <h2 className="font-serif text-2xl leading-tight">Wabi-Sabi en el Outreach.</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              La perfección es aburrida. Automatizamos lo mecánico para que tú puedas centrarte en lo humano. Simple, directo, imperfecto.
            </p>
          </div>

          <div className="pt-8 border-t border-white/10 space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Status</span>
              <span className="text-[10px] text-orange-500 font-bold">LIVE</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Version</span>
              <span className="text-[10px]">V3.0.2</span>
            </div>
          </div>

          <div className="pt-12">
            <div className="h-24 w-full border border-white/5 rounded-sm p-4 flex flex-col justify-end">
              <p className="text-[40px] font-serif leading-none text-orange-600/20">99%</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Uptime</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
