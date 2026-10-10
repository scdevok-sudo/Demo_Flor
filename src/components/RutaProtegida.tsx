import { Navigate, Outlet } from "react-router-dom"

import { useAuth } from "@/lib/auth"

/** Deja pasar solo con sesión activa; sin sesión redirige al login. */
export function RutaProtegida() {
  const { session, cargando } = useAuth()
  if (cargando) return <div className="min-h-svh" />
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}
