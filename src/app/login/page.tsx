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
        return {
          title: "Cuenta pendiente",
          message: "Tu cuenta aún no ha sido aprobada por un administrador.",
          className: "bg-muted/50 border-border text-foreground"
        }
      case "rejected":
        return {
          title: "Acceso denegado",
          message: "Tu solicitud de acceso ha sido rechazada.",
          className: "bg-destructive/10 border-destructive/20 text-destructive"
        }
      case "unauthorized":
        return {
          title: "Sesión requerida",
          message: "Debes iniciar sesión para acceder a la plataforma.",
          className: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-500"
        }
      default:
        return null
    }
  }, [reason])

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row bg-background selection:bg-primary/10">
      {/* LOGO (Arriba izquierda) */}
      <div className="fixed top-6 left-6 z-50 flex items-center gap-2">
        <Zap className="w-5 h-5 text-foreground fill-primary/20" />
        <span className="font-bold text-lg tracking-tight text-foreground">LinkedIn Scraper</span>
      </div>

      {/* CITA (Abajo izquierda) - Hidden on very small screens */}
      <div className="hidden lg:flex fixed bottom-8 left-8 z-50 max-w-sm flex-col">
        <div className="text-5xl font-serif text-muted-foreground/30 leading-none mb-2">"</div>
        <blockquote className="text-sm text-muted-foreground italic font-light leading-relaxed">
          Esta herramienta ha transformado nuestra forma de prospectar en LinkedIn, permitiéndonos crear mensajes personalizados en segundos.
        </blockquote>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-3 font-semibold">
          — Sales Team
        </p>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 w-full">
        {/* Left column: Empty/Decorative on large, hidden or space-taker */}
        <div className="hidden lg:block bg-muted/5 border-r border-border/50" />

        {/* Right column: Form */}
        <div className="flex items-center justify-center p-6 sm:p-12 lg:p-24 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="w-full max-w-[420px] z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter text-foreground uppercase">
                INICIAR SESIÓN
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Introduce tus datos a continuación para acceder a la plataforma.
              </p>
            </div>

            {statusMessage && (
              <div className={cn(
                "p-4 rounded-sm border text-sm space-y-1 animate-in zoom-in-95 duration-300",
                statusMessage.className
              )}>
                <p className="font-bold uppercase tracking-tight text-xs">{statusMessage.title}</p>
                <p className="opacity-90 leading-snug">{statusMessage.message}</p>
              </div>
            )}

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-0 mb-8 border-b border-border/60 rounded-none">
                <TabsTrigger 
                  value="signin" 
                  className="rounded-none border-b-2 border-transparent data-active:border-foreground data-active:text-foreground data-active:font-bold text-muted-foreground bg-transparent shadow-none py-3 text-base transition-all"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="rounded-none border-b-2 border-transparent data-active:border-foreground data-active:text-foreground data-active:font-bold text-muted-foreground bg-transparent shadow-none py-3 text-base transition-all"
                >
                  Registro
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-0 focus-visible:outline-none">
                <SigninForm />
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0 focus-visible:outline-none">
                <SignupForm />
              </TabsContent>
            </Tabs>

            <footer className="pt-8 border-t border-border/40 text-center">
              <p className="text-[11px] leading-relaxed text-muted-foreground/80 max-w-[300px] mx-auto">
                Al continuar, aceptas nuestras{" "}
                <a href="#" className="font-semibold text-foreground hover:underline underline-offset-4">
                  Condiciones de servicio
                </a>{" "}
                y{" "}
                <a href="#" className="font-semibold text-foreground hover:underline underline-offset-4">
                  Política de privacidad
                </a>.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}
