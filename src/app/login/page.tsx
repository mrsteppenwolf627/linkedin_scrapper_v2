"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Zap } from "lucide-react"
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
    <div className="min-h-screen w-full bg-[#1A1A1A] text-white flex flex-col items-center justify-center p-6 selection:bg-white selection:text-black">
      {/* LOGO (Arriba izquierda) */}
      <div className="fixed top-8 left-8 flex items-center gap-2 opacity-80">
        <Zap className="w-5 h-5 fill-white" />
        <span className="font-bold text-lg tracking-tight uppercase">LinkedIn Scraper</span>
      </div>

      <div className="w-full max-w-[360px] space-y-10">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-tighter uppercase">
            INICIAR SESIÓN
          </h1>
          <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-medium">
            Introduce tus datos a continuación
          </p>
        </div>

        {statusMessage && (
          <div className="p-3 border border-white/10 bg-white/5 rounded-sm text-xs text-center text-white/80 animate-in fade-in zoom-in-95 duration-300">
            {statusMessage}
          </div>
        )}

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-0 mb-8 border-b border-white/10 rounded-none">
            <TabsTrigger 
              value="signin" 
              className="rounded-none border-b-2 border-transparent data-active:border-white data-active:text-white text-white/40 bg-transparent shadow-none py-3 text-sm uppercase tracking-widest font-bold transition-all"
            >
              Entrar
            </TabsTrigger>
            <TabsTrigger 
              value="signup"
              className="rounded-none border-b-2 border-transparent data-active:border-white data-active:text-white text-white/40 bg-transparent shadow-none py-3 text-sm uppercase tracking-widest font-bold transition-all"
            >
              Registro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-0 outline-none">
            <SigninForm />
          </TabsContent>
          
          <TabsContent value="signup" className="mt-0 outline-none">
            <SignupForm />
          </TabsContent>
        </Tabs>

        <footer className="text-center opacity-30 hover:opacity-100 transition-opacity duration-500">
          <p className="text-[10px] uppercase tracking-[0.15em] leading-relaxed max-w-[280px] mx-auto">
            Al continuar, aceptas nuestras Condiciones de servicio y Política de privacidad.
          </p>
        </footer>
      </div>
    </div>
  )
}
