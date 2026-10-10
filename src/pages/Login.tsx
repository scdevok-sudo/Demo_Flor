import { useState, type FormEvent } from "react"
import { ArrowRight } from "lucide-react"

import { Campo } from "@/components/campos"
import { Isotipo } from "@/components/marca"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"

export function Login() {
  const { ingresar } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(await ingresar(email.trim(), password))
    setEnviando(false)
  }

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <div className="bg-sidebar flex flex-col justify-between px-8 py-10 md:w-[45%] md:px-14 md:py-16">
        <Isotipo className="text-5xl md:text-6xl" />
        <div className="mt-10 md:mt-0">
          <h1 className="font-heading text-3xl leading-tight text-white md:text-4xl">
            Fichero virtual
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">
            Las fichas de tus pacientes, las fotos y los presupuestos en un solo lugar.
            Ortopedia y ortodoncia, La Plata y Tandil.
          </p>
        </div>
        <p className="mt-10 hidden text-xs text-white/40 md:block">
          Florencia Inveninato · Ortodoncia
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <form onSubmit={enviar} className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="font-heading text-2xl text-brand-dark">Ingresar</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Entrá con tu usuario para ver el fichero.
            </p>
          </div>

          <Campo etiqueta="Usuario">
            <Input
              className="h-10"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Campo>

          <Campo etiqueta="Contraseña">
            <Input
              className="h-10"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Campo>

          <Button type="submit" size="lg" className="h-10 w-full" disabled={enviando}>
            {enviando ? "Ingresando…" : "Ingresar"}
            <ArrowRight className="size-4" />
          </Button>

          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2.5 text-center text-xs text-destructive">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
