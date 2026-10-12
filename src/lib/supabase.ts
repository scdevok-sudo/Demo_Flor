import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Copiá .env.example a .env.local y completalo."
  )
}

const CLAVE_RECORDAR = "fi-recordar-sesion"

/** Preferencia «Recordar sesión» (activa por defecto). */
export const recordarSesion = {
  get(): boolean {
    try {
      return localStorage.getItem(CLAVE_RECORDAR) !== "0"
    } catch {
      return true
    }
  },
  set(valor: boolean) {
    try {
      localStorage.setItem(CLAVE_RECORDAR, valor ? "1" : "0")
    } catch {
      // Sin almacenamiento disponible: la sesión vive solo en memoria.
    }
  },
}

/**
 * Con «Recordar sesión» la sesión va a localStorage (sobrevive al cerrar el navegador);
 * sin eso va a sessionStorage y se pierde al cerrar la pestaña o el navegador.
 */
const almacenamiento = {
  getItem: (clave: string) => localStorage.getItem(clave) ?? sessionStorage.getItem(clave),
  setItem: (clave: string, valor: string) => {
    const [usa, otro] = recordarSesion.get() ? [localStorage, sessionStorage] : [sessionStorage, localStorage]
    usa.setItem(clave, valor)
    otro.removeItem(clave)
  },
  removeItem: (clave: string) => {
    localStorage.removeItem(clave)
    sessionStorage.removeItem(clave)
  },
}

export const supabase = createClient(url, anonKey, { auth: { storage: almacenamiento } })
