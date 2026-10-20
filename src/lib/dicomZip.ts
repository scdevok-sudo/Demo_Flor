import { extensionDe } from "@/lib/visores"

/** Un archivo DICOM (un corte) dentro de una serie. */
export interface CorteDicom {
  nombre: string
  datos: Uint8Array
}

export interface SerieDicom {
  /** SeriesInstanceUID */
  id: string
  /** SeriesNumber, si el equipo lo informó. */
  numero: number | null
  modalidad: string
  descripcion: string
  cortes: CorteDicom[]
}

/** Lo que exporta VueMotion mezcla el estudio con un visor de Windows: acá se descarta todo lo que no es DICOM. */
export class SinDicomError extends Error {
  constructor() {
    super("El ZIP no contiene archivos DICOM.")
  }
}

type Fflate = typeof import("fflate")
type DicomParser = typeof import("dicom-parser")

/** Los DICOM llegan sin extensión (o `.dcm`): evita descomprimir DLLs, imágenes y demás antes de mirar el contenido. */
function puedeSerDicom(nombre: string): boolean {
  if (nombre.endsWith("/")) return false
  const ext = extensionDe(nombre.slice(nombre.lastIndexOf("/") + 1))
  return ext === "" || ext === "dcm"
}

/** Preámbulo de 128 bytes + «DICM» (parte 10 del estándar). */
function tieneMagicDicm(datos: Uint8Array): boolean {
  return datos.length > 132 && datos[128] === 0x44 && datos[129] === 0x49 && datos[130] === 0x43 && datos[131] === 0x4d
}

function leerCabecera(dicomParser: DicomParser, nombre: string, datos: Uint8Array) {
  try {
    // Alcanza con los grupos 0008 y 0020: no hace falta recorrer los píxeles.
    const ds = dicomParser.parseDicom(datos, { untilTag: "x00280000" })
    const uid = ds.string("x0020000e")
    if (!uid) return null // DICOMDIR, LOCKFILE y demás: DICOM sin imagen.
    const numero = ds.intString("x00200011")
    return {
      uid,
      numero: Number.isFinite(numero) ? (numero as number) : null,
      modalidad: ds.string("x00080060") ?? "",
      descripcion: ds.string("x0008103e") ?? "",
      instancia: ds.intString("x00200013") ?? 0,
      nombre,
    }
  } catch {
    return null
  }
}

/** Descomprime el ZIP, se queda con los DICOM reales y los agrupa por serie (ordenadas por número). */
export async function extraerSeries(zip: Uint8Array): Promise<SerieDicom[]> {
  const [fflate, dicomParser]: [Fflate, DicomParser] = await Promise.all([import("fflate"), import("dicom-parser")])
  const entradas = await new Promise<Record<string, Uint8Array>>((resolve, reject) =>
    fflate.unzip(zip, { filter: (f) => f.originalSize > 132 && puedeSerDicom(f.name) }, (e, r) => (e ? reject(e) : resolve(r)))
  )

  const porSerie = new Map<string, { serie: SerieDicom; instancias: Map<CorteDicom, number> }>()
  for (const [nombre, datos] of Object.entries(entradas)) {
    if (!tieneMagicDicm(datos)) continue
    const c = leerCabecera(dicomParser, nombre, datos)
    if (!c) continue
    let grupo = porSerie.get(c.uid)
    if (!grupo) {
      grupo = {
        serie: { id: c.uid, numero: c.numero, modalidad: c.modalidad, descripcion: c.descripcion, cortes: [] },
        instancias: new Map(),
      }
      porSerie.set(c.uid, grupo)
    }
    const corte = { nombre, datos }
    grupo.serie.cortes.push(corte)
    grupo.instancias.set(corte, c.instancia)
  }
  if (porSerie.size === 0) throw new SinDicomError()

  const grupos = [...porSerie.values()]
  for (const g of grupos) g.serie.cortes.sort((a, b) => g.instancias.get(a)! - g.instancias.get(b)! || a.nombre.localeCompare(b.nombre))
  return grupos
    .map((g) => g.serie)
    .sort((a, b) => (a.numero ?? Infinity) - (b.numero ?? Infinity))
}

/** ZIP solo con los DICOM, una carpeta por serie: `serie01/0001.dcm`. */
export async function empaquetarSeries(series: SerieDicom[]): Promise<Uint8Array> {
  const fflate = await import("fflate")
  const archivos: Record<string, Uint8Array> = {}
  series.forEach((s, i) =>
    s.cortes.forEach((c, j) => {
      archivos[`serie${String(i + 1).padStart(2, "0")}/${String(j + 1).padStart(4, "0")}.dcm`] = c.datos
    })
  )
  return new Promise((resolve, reject) => fflate.zip(archivos, { level: 6 }, (e, r) => (e ? reject(e) : resolve(r))))
}

/** Del ZIP que exporta el PACS al ZIP liviano que se sube a Storage. */
export async function filtrarZipDicom(file: File): Promise<File> {
  const series = await extraerSeries(new Uint8Array(await file.arrayBuffer()))
  const zip = await empaquetarSeries(series)
  return new File([zip as Uint8Array<ArrayBuffer>], file.name, { type: "application/zip", lastModified: file.lastModified })
}
