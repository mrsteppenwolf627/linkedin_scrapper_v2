"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { SigninForm } from "@/components/auth/SigninForm"
import { SignupForm } from "@/components/auth/SignupForm"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason")
  const [email, setEmail] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const statusMessage = React.useMemo(() => {
    switch (reason) {
      case "pending":
        return "Tu cuenta aún no ha sido aprobada por un administrador."
      case "rejected":
        return "Tu solicitud de acceso ha sido rechazada."
      case "unauthorized":
        return "Debes iniciar sesión para acceder."
      default:
        return null
    }
  }, [reason])

  return (
    <div className="min-h-screen w-full bg-[#1A1A1A] text-white flex flex-col items-center justify-center p-6 selection:bg-white selection:text-black font-sans">
      <div className="w-full max-w-[340px] space-y-8">
        {/* TÍTULOS */}
        <div className="space-y-1 text-center">
          <h1 className="text-4xl font-black tracking-tighter uppercase">
            INICIAR SESIÓN
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">
            INTRODUCE TUS DATOS A CONTINUACIÓN
          </p>
        </div>

        {/* STATUS MESSAGE */}
        {statusMessage && (
          <div className="p-3 border border-white/10 bg-white/5 rounded-none text-[10px] uppercase tracking-widest text-center text-white/80 animate-in fade-in zoom-in-95 duration-300">
            {statusMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* EMAIL (Compartido) */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold block">EMAIL</label>
            <input
              type="email"
              required
              placeholder="NOMBRE@EMPRESA.COM"
              className="w-full bg-transparent border border-input rounded-none px-3 py-2 text-white placeholder:text-white/10 focus:outline-none focus:border-white transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Tabs defaultValue="signin" className="w-full space-y-6">
            {/* TABS VERTICALES */}
            <TabsList className="flex flex-col gap-2 bg-transparent h-auto p-0 rounded-none w-full">
              <TabsTrigger 
                value="signin" 
                className={cn(
                  "w-full rounded-none border border-input bg-transparent py-3 text-[10px] uppercase tracking-[0.3em] font-bold transition-all shadow-none",
                  "data-active:border-white data-active:bg-white/5 data-active:text-white text-white/30"
                )}
              >
                ENTRAR
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className={cn(
                  "w-full rounded-none border border-input bg-transparent py-3 text-[10px] uppercase tracking-[0.3em] font-bold transition-all shadow-none",
                  "data-active:border-white data-active:bg-white/5 data-active:text-white text-white/30"
                )}
              >
                REGISTRO
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-0 outline-none">
              <SigninForm email={email} isLoading={isLoading} onLoadingChange={setIsLoading} />
            </TabsContent>
            
            <TabsContent value="signup" className="mt-0 outline-none">
              <SignupForm email={email} isLoading={isLoading} onLoadingChange={setIsLoading} />
            </TabsContent>
          </Tabs>
        </div>

        {/* FOOTER */}
        <footer className="text-center">
          <p className="text-[9px] uppercase tracking-[0.15em] leading-relaxed text-white/20 max-w-[280px] mx-auto">
            Al continuar, aceptas nuestras Condiciones de servicio y Política de privacidad.
          </p>
        </footer>
      </div>
    </div>
  )
}
