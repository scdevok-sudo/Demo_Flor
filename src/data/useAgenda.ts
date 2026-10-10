import { useCallback, useEffect, useState } from "react"

import * as datos from "@/data/agenda"
import type { ConfigAgenda, Turno } from "@/lib/tipos"

/**
 * Agenda (módulo 7): horarios de atención de las dos sedes y los turnos del rango
 * de fechas que se está viendo (se vuelven a pedir al cambiar de semana).
 */
export function useAgenda(desde: string, hasta: string) {
  const [config, setConfig] = useState<ConfigAgenda>({ bloques: [] })
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarConfig = useCallback(async () => {
    const r = await datos.cargarConfig()
    if (r.ok) setConfig(r.valor)
    else setError(r.error)
    setCargando(false)
  }, [])

  useEffect(() => {
    void datos.cargarConfig().then((r) => {
      if (r.ok) setConfig(r.valor)
      else setError(r.error)
      setCargando(false)
    })
  }, [])

  useEffect(() => {
    let vigente = true
    void datos.listarTurnos(desde, hasta).then((r) => {
      if (!vigente) return
      if (r.ok) {
        setTurnos(r.valor)
        setError(null)
      } else setError(r.error)
    })
    return () => {
      vigente = false
    }
  }, [desde, hasta])

  /** Corre una escritura; devuelve si salió bien (el error queda en `error`). */
  async function escribir<T>(
    accion: () => Promise<{ ok: true; valor: T } | { ok: false; error: string }>,
    aplicar: (valor: T) => void
  ): Promise<boolean> {
    setError(null)
    const r = await accion()
    if (!r.ok) {
      setError(r.error)
      return false
    }
    aplicar(r.valor)
    return true
  }

  return {
    config,
    turnos,
    cargando,
    error,
    limpiarError: () => setError(null),
    guardarConfig: async (nueva: ConfigAgenda) => {
      const ok = await escribir(
        () => datos.guardarConfig(config.bloques, nueva.bloques),
        () => undefined
      )
      // Se vuelve a leer para quedarse con los ids reales de las filas nuevas.
      await cargarConfig()
      return ok
    },
    agregarTurno: (t: Omit<Turno, "id">) =>
      escribir(() => datos.crearTurno(t), (nuevo) => setTurnos((ts) => [...ts, nuevo])),
    actualizarTurno: (id: string, cambios: Parameters<typeof datos.actualizarTurno>[1]) =>
      escribir(
        () => datos.actualizarTurno(id, cambios),
        (nuevo) => setTurnos((ts) => ts.map((t) => (t.id === id ? nuevo : t)))
      ),
    eliminarTurno: (id: string) =>
      escribir(
        () => datos.eliminarTurno(id),
        () => setTurnos((ts) => ts.filter((t) => t.id !== id))
      ),
  }
}

export type EstadoAgenda = ReturnType<typeof useAgenda>
