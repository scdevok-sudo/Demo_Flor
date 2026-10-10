import { useCallback, useEffect, useState } from "react"

import * as datos from "@/data/diagnosticos"
import type { DatosDiagnostico, Diagnostico } from "@/data/diagnosticos"

const VACIO: DatosDiagnostico = { diagnostico: "", plan: "", tecnica: "" }

const iguales = (a: DatosDiagnostico, b: DatosDiagnostico) =>
  a.diagnostico.trim() === b.diagnostico.trim() &&
  a.plan.trim() === b.plan.trim() &&
  a.tecnica.trim() === b.tecnica.trim()

/**
 * Diagnóstico y plan de tratamiento de un paciente (módulo 4). Cada guardado
 * agrega una versión nueva; la primera de `versiones` es la vigente.
 */
export function useDiagnostico(pacienteId: string) {
  const [versiones, setVersiones] = useState<Diagnostico[]>([])
  const [form, setForm] = useState<DatosDiagnostico>(VACIO)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    void datos.listar(pacienteId).then((r) => {
      if (r.ok) {
        setVersiones(r.valor)
        const vigente = r.valor[0]
        setForm(vigente ? { diagnostico: vigente.diagnostico, plan: vigente.plan, tecnica: vigente.tecnica } : VACIO)
        setError(null)
      } else setError(r.error)
      setCargando(false)
    })
  }, [pacienteId])

  useEffect(() => {
    cargar()
  }, [cargar])

  const vigente = versiones[0] ?? null
  const hayCambios = !iguales(form, vigente ?? VACIO)

  async function guardar() {
    if (!hayCambios) return
    setGuardando(true)
    setError(null)
    const r = await datos.guardar(pacienteId, form)
    setGuardando(false)
    if (!r.ok) return setError(r.error)
    setVersiones((v) => [r.valor, ...v])
  }

  return {
    vigente,
    versiones,
    form,
    editar: (cambios: Partial<DatosDiagnostico>) => setForm((f) => ({ ...f, ...cambios })),
    hayCambios,
    cargando,
    guardando,
    error,
    guardar,
    recargar: cargar,
  }
}

export type EstadoDiagnostico = ReturnType<typeof useDiagnostico>
