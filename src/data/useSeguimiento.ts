import { useCallback, useEffect, useState } from "react"

import * as archivos from "@/data/archivos"
import type { ArchivoClinico } from "@/data/archivos"
import * as datos from "@/data/seguimiento"
import type { EntradaSeguimiento } from "@/data/seguimiento"

/**
 * Seguimiento de un paciente (módulo 6): entradas por fecha y, para mostrar junto
 * a cada una, las fotos y videos intra-tratamiento (módulo 2) de ese mismo día.
 */
export function useSeguimiento(pacienteId: string) {
  const [entradas, setEntradas] = useState<EntradaSeguimiento[]>([])
  const [intra, setIntra] = useState<ArchivoClinico[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    void Promise.all([
      datos.listar(pacienteId),
      archivos.listar(pacienteId, "intra_tratamiento"),
    ]).then(([e, a]) => {
      if (e.ok) {
        setEntradas(e.valor)
        setError(null)
      } else setError(e.error)
      // Si fallan sólo los archivos, el texto igual se muestra.
      if (a.ok) setIntra(a.valor)
      setCargando(false)
    })
  }, [pacienteId])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function agregar(fecha: string, texto: string): Promise<boolean> {
    setGuardando(true)
    setError(null)
    const r = await datos.crear(pacienteId, fecha, texto)
    setGuardando(false)
    if (!r.ok) {
      setError(r.error)
      return false
    }
    setEntradas((lista) => [r.valor, ...lista].sort((a, b) => b.fecha.localeCompare(a.fecha)))
    return true
  }

  async function borrar(id: string) {
    setError(null)
    const r = await datos.borrar(id)
    if (!r.ok) return setError(r.error)
    setEntradas((lista) => lista.filter((e) => e.id !== id))
  }

  return {
    entradas,
    archivosDe: (fecha: string) => intra.filter((a) => a.fecha === fecha),
    cargando,
    guardando,
    error,
    agregar,
    borrar,
    recargar: cargar,
  }
}

export type EstadoSeguimiento = ReturnType<typeof useSeguimiento>
