"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Linkedin, Zap, Quote } from "lucide-react"
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

  const getStatusMessage = () => {
    switch (reason) {
      case "pending":
        return {
          title: "Cuenta pendiente",
          message: "Tu cuenta aún no ha sido aprobada por un administrador. Te notificaremos pronto.",
          type: "info"
        }
      case "rejected":
        return {
          title: "Acceso denegado",
          message: "Tu solicitud de acceso ha sido rechazada por el administrador.",
          type: "error"
        }
      case "unauthorized":
        return {
          title: "Acceso restringido",
          message: "Debes iniciar sesión para acceder a esta página.",
          type: "warning"
        }
      default:
        return null
    }
  }

  const status = getStatusMessage()

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* PANEL OSCURO (Izquierda) */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Background Pattern/Gradient for flavor */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-background/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-background/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-2">
          <div className="p-2 bg-background/10 rounded-lg backdrop-blur-sm">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">LinkedIn Scraper</h3>
        </div>

        <div className="relative z-10 mt-auto space-y-4 max-w-md">
          <Quote className="h-10 w-10 opacity-20" />
          <blockquote className="text-lg italic leading-relaxed font-light">
            &ldquo;Esta herramienta ha transformado nuestra forma de prospectar en LinkedIn, permitiéndonos crear mensajes personalizados en segundos.&rdquo;
          </blockquote>
          <p className="text-xs font-medium uppercase tracking-widest opacity-75">
            — Sales Team
          </p>
        </div>
      </div>

      {/* PANEL FORMULARIO (Derecha) */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground uppercase">
              Iniciar Sesión
            </h2>
            <p className="text-sm text-muted-foreground">
              Introduce tus datos a continuación para acceder a la plataforma.
            </p>
          </div>

          {status && (
            <div className={cn(
              "p-4 rounded-lg border text-sm space-y-1",
              status.type === "info" && "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
              status.type === "error" && "bg-destructive/10 border-destructive/20 text-destructive",
              status.type === "warning" && "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
            )}>
              <p className="font-bold">{status.title}</p>
              <p className="opacity-90">{status.message}</p>
            </div>
          )}

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-0 mb-6 border-b rounded-none">
              <TabsTrigger 
                value="signin" 
                className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent data-active:shadow-none py-3"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:bg-transparent data-active:shadow-none py-3"
              >
                Registro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-0">
              <SigninForm />
            </TabsContent>
            
            <TabsContent value="signup" className="mt-0">
              <SignupForm />
            </TabsContent>
          </Tabs>

          <footer className="text-center">
            <p className="text-[10px] leading-relaxed text-muted-foreground max-w-[280px] mx-auto">
              Al continuar, aceptas nuestras{" "}
              <a href="#" className="underline underline-offset-4 hover:text-primary">
                Condiciones de servicio
              </a>{" "}
              y{" "}
              <a href="#" className="underline underline-offset-4 hover:text-primary">
                Política de privacidad
              </a>.
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
