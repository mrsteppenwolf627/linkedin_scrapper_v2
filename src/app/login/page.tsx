"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("signin")
  
  const reason = searchParams.get("reason")
  const statusMessage = React.useMemo(() => {
    switch (reason) {
      case "pending":
        return { type: "info", text: "Tu cuenta aún no ha sido aprobada por un administrador." }
      case "rejected":
        return { type: "error", text: "Tu solicitud de acceso ha sido rechazada." }
      case "unauthorized":
        return { type: "error", text: "Debes iniciar sesión para acceder a esta página." }
      default:
        return null
    }
  }, [reason])

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
        if (res.status === 403) {
          if (data.message?.includes("aprobada")) {
            router.push("/login?reason=pending")
            return
          }
          if (data.message?.includes("rechazada")) {
            router.push("/login?reason=rejected")
            return
          }
        }
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

      toast.success("Cuenta creada correctamente.")
      router.push("/login?reason=pending")
      setActiveTab("signin")
      setSigninData(prev => ({ ...prev, email: signupData.email }))
      setSignupData({ email: "", password: "", confirmPassword: "" })
    } catch (err) {
      setSignupError("Error de conexión al servidor.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          LinkedIn Scraper
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Esta herramienta ha transformado nuestra forma de prospectar en LinkedIn, permitiéndonos crear mensajes personalizados en segundos.&rdquo;
            </p>
            <footer className="text-sm">Sales Team</footer>
          </blockquote>
        </div>
      </div>
      <div className="p-4 lg:p-8 h-full flex items-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {activeTab === "signin" ? "Iniciar sesión" : "Crear una cuenta"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Introduce tus datos a continuación
            </p>
          </div>

          {statusMessage && (
            <div className={cn(
              "p-3 rounded-md text-sm font-medium",
              statusMessage.type === "info" ? "bg-primary/10 text-primary border border-primary/20" : "bg-destructive/10 text-destructive border border-destructive/20"
            )}>
              {statusMessage.text}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Registro</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4">
              <form onSubmit={handleSignin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    ref={signinEmailRef}
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    value={signinData.email}
                    onChange={(e) => {
                      setSigninData({ ...signinData, email: e.target.value })
                      setSigninError("")
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    disabled={isLoading}
                    value={signinData.password}
                    onChange={(e) => {
                      setSigninData({ ...signinData, password: e.target.value })
                      setSigninError("")
                    }}
                    required
                  />
                </div>
                {signinError && (
                  <p className="text-sm font-medium text-destructive">{signinError}</p>
                )}
                <Button className="w-full" disabled={isLoading}>
                  {isLoading ? "Cargando..." : "Iniciar Sesión"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    ref={signupEmailRef}
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    value={signupData.email}
                    onChange={(e) => {
                      setSignupData({ ...signupData, email: e.target.value })
                      setSignupError("")
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    disabled={isLoading}
                    value={signupData.password}
                    onChange={(e) => {
                      setSignupData({ ...signupData, password: e.target.value })
                      setSignupError("")
                    }}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Mínimo 8 caracteres</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    disabled={isLoading}
                    value={signupData.confirmPassword}
                    onChange={(e) => {
                      setSignupData({ ...signupData, confirmPassword: e.target.value })
                      setSignupError("")
                    }}
                    required
                  />
                </div>
                {signupError && (
                  <p className="text-sm font-medium text-destructive">{signupError}</p>
                )}
                <Button className="w-full" disabled={isLoading}>
                  {isLoading ? "Creando cuenta..." : "Registrarse"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="px-8 text-center text-sm text-muted-foreground">
            Al continuar, aceptas nuestras Condiciones de servicio y Política de privacidad.
          </p>
        </div>
      </div>
    </div>
  )
}
