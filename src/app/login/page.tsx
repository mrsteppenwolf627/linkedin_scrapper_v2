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
    <div className="min-h-screen w-full bg-[#1A1A1A] text-[#FCFCFC] flex items-center justify-center p-4 selection:bg-[#FCFCFC] selection:text-[#1A1A1A] font-sans">
      <div className="w-full max-w-sm flex flex-col items-center space-y-8">
        
        {/* CABECERA */}
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
            INICIAR SESIÓN
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">
            INTRODUCE TUS DATOS A CONTINUACIÓN
          </p>
        </div>

        {/* STATUS MESSAGE */}
        {statusMessage && (
          <div className="w-full p-4 border border-white/10 bg-white/5 rounded-none text-[10px] uppercase tracking-widest text-center text-white/80 animate-in fade-in zoom-in-95 duration-300">
            {statusMessage}
          </div>
        )}

        <div className="w-full flex flex-col space-y-6">
          {/* EMAIL - Input Principal (Gande, Sharp) */}
          <div className="flex flex-col w-full">
            <input
              type="email"
              required
              placeholder="NOMBRE@EMPRESA.COM"
              className="w-full bg-transparent border border-input rounded-none py-3 px-4 text-white placeholder:text-[rgb(120,120,120)] placeholder:opacity-100 focus:outline-none focus:border-white transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Tabs defaultValue="signin" className="w-full flex flex-col space-y-6">
            {/* SELECTORES DE MODO (Vertical, Mismo Ancho que Inputs) */}
            <TabsList className="flex flex-col gap-2 bg-transparent h-auto p-0 rounded-none w-full">
              <TabsTrigger 
                value="signin" 
                className={cn(
                  "w-full rounded-none border border-input bg-transparent py-2 px-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-all shadow-none",
                  "data-active:border-white data-active:bg-white/5 data-active:text-white text-muted-foreground"
                )}
              >
                ENTRAR
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className={cn(
                  "w-full rounded-none border border-input bg-transparent py-2 px-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-all shadow-none",
                  "data-active:border-white data-active:bg-white/5 data-active:text-white text-muted-foreground"
                )}
              >
                REGISTRO
              </TabsTrigger>
            </TabsList>

            {/* FORMULARIOS ESPECÍFICOS (Password + Botón Acción) */}
            <TabsContent value="signin" className="mt-0 outline-none w-full">
              <SigninForm email={email} isLoading={isLoading} onLoadingChange={setIsLoading} />
            </TabsContent>
            
            <TabsContent value="signup" className="mt-0 outline-none w-full">
              <SignupForm email={email} isLoading={isLoading} onLoadingChange={setIsLoading} />
            </TabsContent>
          </Tabs>
        </div>

        {/* FOOTER */}
        <footer className="w-full text-center pt-8 border-t border-white/5">
          <p className="text-[9px] uppercase tracking-[0.15em] leading-relaxed text-muted-foreground/40 max-w-[300px] mx-auto">
            Al continuar, aceptas nuestras Condiciones de servicio y Política de privacidad.
          </p>
        </footer>
      </div>
    </div>
  )
}
