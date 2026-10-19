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
import { esHeic, heicAJpeg } from "@/lib/heic"
import { hoyISO } from "@/lib/util"

interface Extra {
  zona?: "cara" | "boca"
  etiqueta?: string | null
  etapa?: Etapa | null
}

/**
 * Archivos clínicos de un paciente (módulos 2 y 3) contra Supabase Storage.
 * Sube, reemplaza y borra (el borrado siempre se confirma antes, en la pantalla).
 */
export function useArchivos(pacienteId: string) {
  const [archivos, setArchivos] = useState<ArchivoClinico[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** Claves (slot o id de archivo) con una subida en curso. */
  const [subiendo, setSubiendo] = useState<string[]>([])
  /** Subset de `subiendo` que todavía está convirtiendo un HEIC a JPEG. */
  const [convirtiendo, setConvirtiendo] = useState<string[]>([])

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

  /**
   * Los HEIC de iPhone no se ven en un <img>: se pasan a JPEG antes de subir, así en Storage
   * nunca queda HEIC. Devuelve el archivo a subir, o `null` si la conversión falló (ya avisó).
   */
  async function prepararImagen(clave: string, file: File): Promise<File | null> {
    if (!esHeic(file)) return file
    setConvirtiendo((c) => [...c, clave])
    try {
      return await heicAJpeg(file)
    } catch {
      setError("No se pudo convertir la foto del iPhone (HEIC) a JPEG. Probá de nuevo o sacala en formato «Más compatible».")
      return null
    } finally {
      setConvirtiendo((c) => c.filter((k) => k !== clave))
    }
  }

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
    const listo = await prepararImagen(clave, file)
    if (!listo) return marcar(clave, false)
    const r = await datos.subir({
      pacienteId,
      origen,
      tipo: valido.valor,
      file: listo,
      fecha: hoyISO(),
      ...extra,
      // Estudios rotula con el nombre del archivo: que no quede «.HEIC» si se subió un JPEG.
      ...(extra.etiqueta === file.name ? { etiqueta: listo.name } : {}),
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
    const listo = await prepararImagen(archivo.id, file)
    if (!listo) return marcar(archivo.id, false)
    const r = await datos.reemplazar(archivo, pacienteId, listo, valido.valor)
    marcar(archivo.id, false)
    if (!r.ok) return setError(r.error)
    setArchivos((a) => a.map((x) => (x.id === archivo.id ? r.valor : x)))
  }

  /** Borra el registro y el objeto de Storage. Devuelve false si algo falló (el motivo queda en `error`). */
  async function borrar(archivo: ArchivoClinico): Promise<boolean> {
    setError(null)
    marcar(archivo.id, true)
    const r = await datos.borrar(archivo)
    marcar(archivo.id, false)
    if (!r.ok) {
      setError(r.error)
      return false
    }
    // Si la fila se borró pero el objeto no, igual deja de mostrarse y se avisa.
    setArchivos((a) => a.filter((x) => x.id !== archivo.id))
    if (r.valor.aviso) setError(r.valor.aviso)
    return r.valor.aviso === null
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
    convirtiendo,
    subir,
    reemplazar,
    borrar,
    actualizar,
    delOrigen: (origen: Origen) => archivos.filter((a) => a.origen === origen),
  }
}

export type Archivos = ReturnType<typeof useArchivos>
