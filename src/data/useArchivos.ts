import { useCallback, useEffect, useState } from "react"

import * as datos from "@/data/archivos"
import {
  TOPES,
  validarArchivo,
  type ArchivoClinico,
  type Etapa,
  type Origen,
  type TipoArchivo,
} from "@/data/archivos"
import { hoyISO } from "@/lib/util"

interface Extra {
  zona?: "cara" | "boca"
  etiqueta?: string | null
  etapa?: Etapa | null
}

/**
 * Archivos clínicos de un paciente (módulos 2 y 3) contra Supabase Storage.
 * Nunca borra: sólo sube y reemplaza.
 */
export function useArchivos(pacienteId: string) {
  const [archivos, setArchivos] = useState<ArchivoClinico[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** Claves (slot o id de archivo) con una subida en curso. */
  const [subiendo, setSubiendo] = useState<string[]>([])

  const cargar = useCallback(() => {
    void datos.listar(pacienteId).then((r) => {
      if (r.ok) {
        setArchivos(r.valor)
        setError(null)
      } else setError(r.error)
      setCargando(false)
    })
  }, [pacienteId])

  useEffect(() => {
    cargar()
  }, [cargar])

  const marcar = (clave: string, activo: boolean) =>
    setSubiendo((s) => (activo ? [...s, clave] : s.filter((c) => c !== clave)))

  /** Sube un archivo nuevo. `clave` identifica el control que dispara la subida. */
  async function subir(
    clave: string,
    origen: Origen,
    file: File,
    permitidos: TipoArchivo[],
    extra: Extra = {}
  ): Promise<void> {
    setError(null)
    const valido = validarArchivo(file, permitidos)
    if (!valido.ok) return setError(valido.error)
    if (archivos.filter((a) => a.origen === origen).length >= TOPES[origen]) {
      return setError(`Se alcanzó el máximo de ${TOPES[origen]} archivos en esta sección.`)
    }
    marcar(clave, true)
    const r = await datos.subir({
      pacienteId,
      origen,
      tipo: valido.valor,
      file,
      fecha: hoyISO(),
      ...extra,
    })
    marcar(clave, false)
    if (!r.ok) return setError(r.error)
    setArchivos((a) => [...a, r.valor])
  }

  async function reemplazar(archivo: ArchivoClinico, file: File, permitidos: TipoArchivo[]) {
    setError(null)
    const valido = validarArchivo(file, permitidos)
    if (!valido.ok) return setError(valido.error)
    marcar(archivo.id, true)
    const r = await datos.reemplazar(archivo, pacienteId, file, valido.valor)
    marcar(archivo.id, false)
    if (!r.ok) return setError(r.error)
    setArchivos((a) => a.map((x) => (x.id === archivo.id ? r.valor : x)))
  }

  async function actualizar(
    archivo: ArchivoClinico,
    cambios: { etiqueta?: string | null; etapa?: Etapa | null }
  ) {
    setError(null)
    const r = await datos.actualizarCampos(archivo, cambios)
    if (!r.ok) return setError(r.error)
    setArchivos((a) => a.map((x) => (x.id === archivo.id ? r.valor : x)))
  }

  return {
    archivos,
    cargando,
    error,
    recargar: cargar,
    subiendo,
    subir,
    reemplazar,
    actualizar,
    delOrigen: (origen: Origen) => archivos.filter((a) => a.origen === origen),
  }
}

export type Archivos = ReturnType<typeof useArchivos>
