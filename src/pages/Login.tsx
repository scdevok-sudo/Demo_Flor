import { useState, type FormEvent, type ReactNode } from "react"
import { ArrowRight } from "lucide-react"

import { Campo } from "@/components/campos"
import { Isotipo } from "@/components/marca"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"
import { recordarSesion } from "@/lib/supabase"

/** Panel de marca a la izquierda + el formulario que corresponda a la derecha. */
function Marco({ children }: { children: ReactNode }) {
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

      <div className="flex flex-1 items-center justify-center px-6 py-12">{children}</div>
    </div>
  )
}

function Mensaje({ tipo, children }: { tipo: "error" | "ok"; children: ReactNode }) {
  return (
    <p
      role={tipo === "error" ? "alert" : "status"}
      className={
        tipo === "error"
          ? "rounded-lg bg-destructive/10 px-3 py-2.5 text-center text-xs text-destructive"
          : "rounded-lg bg-brand-coral-soft px-3 py-2.5 text-center text-xs text-brand-dark"
      }
    >
      {children}
    </p>
  )
}

export function Login() {
  const { ingresar, recuperar } = useAuth()
  const [modo, setModo] = useState<"ingresar" | "recuperar">("ingresar")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [recordar, setRecordar] = useState(recordarSesion.get)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const cambiarModo = (nuevo: "ingresar" | "recuperar") => {
    setModo(nuevo)
    setError(null)
    setAviso(null)
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    setAviso(null)
    if (modo === "ingresar") {
      setError(await ingresar(email.trim(), password, recordar))
    } else {
      const fallo = await recuperar(email.trim())
      if (fallo) setError(fallo)
      else setAviso("Si el email está registrado, te enviamos un link para elegir una contraseña nueva. Revisá también la carpeta de spam.")
    }
    setEnviando(false)
  }

  return (
    <Marco>
      <form onSubmit={enviar} className="w-full max-w-sm space-y-5">
        <div>
          <h2 className="font-heading text-2xl text-brand-dark">
            {modo === "ingresar" ? "Ingresar" : "Recuperar contraseña"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {modo === "ingresar"
              ? "Entrá con tu usuario para ver el fichero."
              : "Escribí tu email y te mandamos un link para elegir una contraseña nueva."}
          </p>
        </div>

        <Campo etiqueta={modo === "ingresar" ? "Usuario" : "Email"}>
          <Input
            className="h-10"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Campo>

        {modo === "ingresar" ? (
          <>
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

            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-dark">
                <Checkbox checked={recordar} onCheckedChange={(v: boolean) => setRecordar(v)} />
                Recordar sesión
              </label>
              <button
                type="button"
                onClick={() => cambiarModo("recuperar")}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-brand-dark hover:underline"
              >
                Olvidé mi contraseña
              </button>
            </div>
          </>
        ) : null}

        <Button type="submit" size="lg" className="h-10 w-full" disabled={enviando}>
          {modo === "ingresar"
            ? enviando
              ? "Ingresando…"
              : "Ingresar"
            : enviando
              ? "Enviando…"
              : "Enviar link"}
          <ArrowRight className="size-4" />
        </Button>

        {modo === "recuperar" ? (
          <button
            type="button"
            onClick={() => cambiarModo("ingresar")}
            className="block w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-brand-dark hover:underline"
          >
            Volver a ingresar
          </button>
        ) : null}

        {error ? <Mensaje tipo="error">{error}</Mensaje> : null}
        {aviso ? <Mensaje tipo="ok">{aviso}</Mensaje> : null}
      </form>
    </Marco>
  )
}

/** Se muestra al abrir el link del mail de recuperación. */
export function NuevaContrasena() {
  const { nuevaPassword } = useAuth()
  const [password, setPassword] = useState("")
  const [repetida, setRepetida] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setError("La contraseña tiene que tener al menos 8 caracteres.")
    if (password !== repetida) return setError("Las contraseñas no coinciden.")
    setEnviando(true)
    setError(null)
    const fallo = await nuevaPassword(password)
    if (fallo) setError(fallo)
    setEnviando(false)
  }

  return (
    <Marco>
      <form onSubmit={enviar} className="w-full max-w-sm space-y-5">
        <div>
          <h2 className="font-heading text-2xl text-brand-dark">Contraseña nueva</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Elegí una contraseña de al menos 8 caracteres. Al guardarla entrás al fichero.
          </p>
        </div>

        <Campo etiqueta="Contraseña nueva">
          <Input
            className="h-10"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Campo>

        <Campo etiqueta="Repetir contraseña">
          <Input
            className="h-10"
            type="password"
            autoComplete="new-password"
            required
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
          />
        </Campo>

        <Button type="submit" size="lg" className="h-10 w-full" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar y entrar"}
          <ArrowRight className="size-4" />
        </Button>

        {error ? <Mensaje tipo="error">{error}</Mensaje> : null}
      </form>
    </Marco>
  )
}
