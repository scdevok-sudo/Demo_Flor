import { useCallback, useEffect, useState } from "react"

import * as datos from "@/data/tramites"
import type { Tramite } from "@/lib/tipos"

/** Listas de trámites pendientes (módulo 8): obra social y facturación. */
export function useTramites() {
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    void datos.listar().then((r) => {
      if (r.ok) {
        setTramites(r.valor)
        setError(null)
      } else setError(r.error)
      setCargando(false)
    })
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function marcar(id: string, resuelto: boolean) {
    setError(null)
    const r = await datos.marcar(id, resuelto)
    if (!r.ok) return setError(r.error)
    setTramites((ts) => ts.map((t) => (t.id === id ? { ...t, resuelto } : t)))
  }

  return { tramites, cargando, error, marcar, recargar: cargar }
}
