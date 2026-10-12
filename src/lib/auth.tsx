import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"

import { recordarSesion, supabase } from "@/lib/supabase"

// Se lee al cargar el módulo, antes de que supabase-js limpie el hash de la URL.
const LLEGO_POR_RECUPERACION =
  typeof window !== "undefined" && window.location.hash.includes("type=recovery")

interface Auth {
  session: Session | null
  /** true hasta que se resuelve la sesión inicial guardada. */
  cargando: boolean
  /** Devuelve un mensaje de error en castellano, o null si entró. */
  /** true cuando se abrió el link del mail de recuperación: hay que elegir contraseña nueva. */
  recuperando: boolean
  ingresar: (email: string, password: string, recordar: boolean) => Promise<string | null>
  /** Manda el mail con el link. Devuelve un error en castellano, o null si salió. */
  recuperar: (email: string) => Promise<string | null>
  /** Guarda la contraseña nueva (sesión de recuperación). Devuelve error o null. */
  nuevaPassword: (password: string) => Promise<string | null>
  salir: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)
  const [recuperando, setRecuperando] = useState(LLEGO_POR_RECUPERACION)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCargando(false)
    })
    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      setSession(s)
      if (evento === "PASSWORD_RECOVERY") setRecuperando(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const valor = useMemo<Auth>(
    () => ({
      session,
      cargando,
      recuperando,
      ingresar: async (email, password, recordar) => {
        recordarSesion.set(recordar)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (!error) return null
        return error.status === 400
          ? "Email o contraseña incorrectos."
          : "No se pudo ingresar. Revisá tu conexión e intentá de nuevo."
      },
      recuperar: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        return error
          ? error.status === 429
            ? "Pediste demasiados mails seguidos. Esperá unos minutos e intentá de nuevo."
            : "No se pudo enviar el mail. Revisá tu conexión e intentá de nuevo."
          : null
      },
      nuevaPassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
          return /different from the old/i.test(error.message)
            ? "La contraseña nueva tiene que ser distinta de la anterior."
            : "No se pudo guardar la contraseña. El link puede haber vencido: pedí uno nuevo."
        }
        setRecuperando(false)
        return null
      },
      salir: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, cargando, recuperando]
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider")
  return ctx
}
