import { BUCKETS, COLUMNAS_ARCHIVOS as C, TABLA_ARCHIVOS } from "@/data/constantes"
import { supabase } from "@/lib/supabase"
import { SLOTS_BOCA, SLOTS_CARA } from "@/lib/tipos"

export type Origen = "foto_inicial" | "foto_final" | "intra_tratamiento" | "radiografia" | "estudio"
export type TipoArchivo = "imagen" | "video" | "pdf"
export type Etapa = "inicial" | "intermedio" | "final"

export interface ArchivoClinico {
  id: string
  origen: Origen
  zona: "cara" | "boca" | null
  etiqueta: string | null
  tipo: TipoArchivo
  etapa: Etapa | null
  storagePath: string
  fecha: string
  /** URL firmada, vence a la hora: se vuelve a pedir al recargar. */
  url: string | null
}

export type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string }

/** Topes por origen (los slots de fotos iniciales/finales son 4 de cara + 6 de boca). */
export const TOPES: Record<Origen, number> = {
  foto_inicial: SLOTS_CARA.length + SLOTS_BOCA.length,
  foto_final: SLOTS_CARA.length + SLOTS_BOCA.length,
  intra_tratamiento: 20,
  radiografia: 6,
  estudio: 4,
}

const MB = 1024 * 1024
const MAX_BYTES: Record<TipoArchivo, number> = { imagen: 25 * MB, video: 100 * MB, pdf: 25 * MB }

const POR_EXTENSION: Record<string, TipoArchivo> = {
  jpg: "imagen", jpeg: "imagen", png: "imagen", webp: "imagen", heic: "imagen", heif: "imagen",
  mp4: "video", mov: "video", webm: "video", m4v: "video",
  pdf: "pdf",
}

const NOMBRE_TIPO: Record<TipoArchivo, string> = { imagen: "imágenes", video: "videos", pdf: "PDF" }

function bucketDe(origen: Origen): string {
  return origen === "radiografia" || origen === "estudio" ? BUCKETS.estudios : BUCKETS.fotos
}

function extensionDe(nombre: string): string {
  const i = nombre.lastIndexOf(".")
  return i >= 0 ? nombre.slice(i + 1).toLowerCase() : ""
}

/** Valida tipo y tamaño. `permitidos` depende de la sección. */
export function validarArchivo(file: File, permitidos: TipoArchivo[]): Resultado<TipoArchivo> {
  const deMime: TipoArchivo | undefined = file.type.startsWith("image/")
    ? "imagen"
    : file.type.startsWith("video/")
      ? "video"
      : file.type === "application/pdf"
        ? "pdf"
        : undefined
  const tipo = deMime ?? POR_EXTENSION[extensionDe(file.name)]
  if (!tipo || !permitidos.includes(tipo)) {
    const lista = permitidos.map((t) => NOMBRE_TIPO[t]).join(" o ")
    return { ok: false, error: `Este archivo no es válido acá: se aceptan ${lista}.` }
  }
  if (file.size > MAX_BYTES[tipo]) {
    return { ok: false, error: `El archivo pesa más de ${MAX_BYTES[tipo] / MB} MB.` }
  }
  return { ok: true, valor: tipo }
}

/** Etiqueta guardada para un slot: «perfil-izquierdo» -> «perfil_izquierdo». */
export const etiquetaDeSlot = (slot: string) => slot.replace(/-/g, "_")
export const slotDeEtiqueta = (etiqueta: string | null) => (etiqueta ?? "").replace(/_/g, "-")

export function zonaDeSlot(slot: string): "cara" | "boca" {
  return SLOTS_CARA.some((s) => s.id === slot) ? "cara" : "boca"
}

type Fila = Record<string, unknown>

function aArchivo(f: Fila, url: string | null): ArchivoClinico {
  return {
    id: String(f[C.id]),
    origen: f[C.origen] as Origen,
    zona: (f[C.zona] as "cara" | "boca" | null) ?? null,
    etiqueta: (f[C.etiqueta] as string | null) ?? null,
    tipo: f[C.tipoArchivo] as TipoArchivo,
    etapa: (f[C.etapa] as Etapa | null) ?? null,
    storagePath: String(f[C.storagePath]),
    fecha: String(f[C.fecha] ?? "").slice(0, 10),
    url,
  }
}

async function urlFirmada(origen: Origen, path: string): Promise<string | null> {
  const { data } = await supabase.storage.from(bucketDe(origen)).createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

export async function listar(pacienteId: string): Promise<Resultado<ArchivoClinico[]>> {
  const { data, error } = await supabase
    .from(TABLA_ARCHIVOS)
    .select("*")
    .eq(C.pacienteId, pacienteId)
    .order(C.createdAt, { ascending: true })
  if (error) return { ok: false, error: "No se pudieron cargar los archivos." }
  const archivos = await Promise.all(
    (data as Fila[]).map(async (f) =>
      aArchivo(f, await urlFirmada(f[C.origen] as Origen, String(f[C.storagePath])))
    )
  )
  return { ok: true, valor: archivos }
}

async function subirObjeto(pacienteId: string, origen: Origen, file: File): Promise<Resultado<string>> {
  const ext = extensionDe(file.name) || "bin"
  const path = `${pacienteId}/${origen}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(bucketDe(origen))
    .upload(path, file, { contentType: file.type || undefined, upsert: false })
  if (error) {
    return {
      ok: false,
      error: "No se pudo subir el archivo. Revisá la conexión o que no supere el límite de tamaño.",
    }
  }
  return { ok: true, valor: path }
}

export interface DatosSubida {
  pacienteId: string
  origen: Origen
  tipo: TipoArchivo
  file: File
  zona?: "cara" | "boca" | null
  etiqueta?: string | null
  etapa?: Etapa | null
  /** AAAA-MM-DD */
  fecha: string
}

export async function subir(d: DatosSubida): Promise<Resultado<ArchivoClinico>> {
  const objeto = await subirObjeto(d.pacienteId, d.origen, d.file)
  if (!objeto.ok) return objeto
  const { data, error } = await supabase
    .from(TABLA_ARCHIVOS)
    .insert({
      [C.pacienteId]: d.pacienteId,
      [C.origen]: d.origen,
      [C.zona]: d.zona ?? null,
      [C.etiqueta]: d.etiqueta ?? null,
      [C.tipoArchivo]: d.tipo,
      [C.etapa]: d.etapa ?? null,
      [C.storagePath]: objeto.valor,
      [C.fecha]: d.fecha,
    })
    .select()
    .single()
  if (error) {
    // No dejar un objeto huérfano si la fila no se pudo crear.
    await supabase.storage.from(bucketDe(d.origen)).remove([objeto.valor])
    return { ok: false, error: "El archivo se subió pero no se pudo registrar. Intentá de nuevo." }
  }
  return { ok: true, valor: aArchivo(data as Fila, await urlFirmada(d.origen, objeto.valor)) }
}

/**
 * Reemplaza el contenido de un registro. El archivo anterior queda en el bucket
 * (no se borra nada, para no perder trazabilidad); sólo el registro apunta al nuevo.
 */
export async function reemplazar(
  actual: ArchivoClinico,
  pacienteId: string,
  file: File,
  tipo: TipoArchivo
): Promise<Resultado<ArchivoClinico>> {
  const objeto = await subirObjeto(pacienteId, actual.origen, file)
  if (!objeto.ok) return objeto
  const { data, error } = await supabase
    .from(TABLA_ARCHIVOS)
    .update({ [C.storagePath]: objeto.valor, [C.tipoArchivo]: tipo })
    .eq(C.id, actual.id)
    .select()
    .single()
  if (error) {
    await supabase.storage.from(bucketDe(actual.origen)).remove([objeto.valor])
    return { ok: false, error: "No se pudo reemplazar el archivo. Intentá de nuevo." }
  }
  return { ok: true, valor: aArchivo(data as Fila, await urlFirmada(actual.origen, objeto.valor)) }
}

export async function actualizarCampos(
  actual: ArchivoClinico,
  cambios: { etiqueta?: string | null; etapa?: Etapa | null }
): Promise<Resultado<ArchivoClinico>> {
  const fila: Fila = {}
  if ("etiqueta" in cambios) fila[C.etiqueta] = cambios.etiqueta
  if ("etapa" in cambios) fila[C.etapa] = cambios.etapa
  const { data, error } = await supabase
    .from(TABLA_ARCHIVOS)
    .update(fila)
    .eq(C.id, actual.id)
    .select()
    .single()
  if (error) return { ok: false, error: "No se pudo guardar el cambio." }
  return { ok: true, valor: aArchivo(data as Fila, actual.url) }
}
