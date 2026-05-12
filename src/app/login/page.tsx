"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("signin")

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

    // Basic validation
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect height="12" width="4" x="2" y="9" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            LinkedIn Lead Scraper
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Accede para gestionar tus leads y mensajes personalizados.
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup">Registrarse</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-4">
            <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
              <CardHeader className="hidden sm:block">
                <CardTitle className="text-lg">Bienvenido</CardTitle>
                <CardDescription>
                  Ingresa tus credenciales para continuar.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignin}>
                <CardContent className="space-y-4 pt-4 sm:pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      ref={signinEmailRef}
                      placeholder="nombre@empresa.com"
                      type="email"
                      autoComplete="email"
                      required
                      value={signinData.email}
                      onChange={(e) => {
                        setSigninData({ ...signinData, email: e.target.value })
                        setSigninError("")
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Contraseña</Label>
                    </div>
                    <Input
                      id="signin-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={signinData.password}
                      onChange={(e) => {
                        setSigninData({ ...signinData, password: e.target.value })
                        setSigninError("")
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  {signinError && (
                    <div className="rounded-md bg-destructive/10 p-3 text-xs font-medium text-destructive">
                      {signinError}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <Card className="border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
              <CardHeader className="hidden sm:block">
                <CardTitle className="text-lg">Crear cuenta</CardTitle>
                <CardDescription>
                  Regístrate para solicitar acceso a la plataforma.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4 pt-4 sm:pt-0">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      ref={signupEmailRef}
                      placeholder="nombre@empresa.com"
                      type="email"
                      autoComplete="email"
                      required
                      value={signupData.email}
                      onChange={(e) => {
                        setSignupData({ ...signupData, email: e.target.value })
                        setSignupError("")
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={signupData.password}
                      onChange={(e) => {
                        setSignupData({ ...signupData, password: e.target.value })
                        setSignupError("")
                      }}
                      disabled={isLoading}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Mínimo 8 caracteres.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirmar Contraseña</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={signupData.confirmPassword}
                      onChange={(e) => {
                        setSignupData({ ...signupData, confirmPassword: e.target.value })
                        setSignupError("")
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  {signupError && (
                    <div className="rounded-md bg-destructive/10 p-3 text-xs font-medium text-destructive">
                      {signupError}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-2">
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Registrando..." : "Solicitar Registro"}
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Tu cuenta deberá ser aprobada por un administrador antes de poder acceder.
                  </p>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} LinkedIn Lead Scraper. Todos los derechos reservados.
        </div>
      </div>
    </div>
  )
}
