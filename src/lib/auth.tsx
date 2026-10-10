import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase"

interface Auth {
  session: Session | null
  /** true hasta que se resuelve la sesión inicial guardada. */
  cargando: boolean
  /** Devuelve un mensaje de error en castellano, o null si entró. */
  ingresar: (email: string, password: string) => Promise<string | null>
  salir: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCargando(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const valor = useMemo<Auth>(
    () => ({
      session,
      cargando,
      ingresar: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (!error) return null
        return error.status === 400
          ? "Email o contraseña incorrectos."
          : "No se pudo ingresar. Revisá tu conexión e intentá de nuevo."
      },
      salir: async () => {
        await supabase.auth.signOut()
      },
    }),
    [session, cargando]
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider")
  return ctx
}
