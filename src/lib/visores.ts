/**
 * Qué visor corresponde a cada archivo, resuelto por extensión.
 * Solo cubre los archivos que se distinguen por extensión (mallas STL/PLY). Los estudios DICOM
 * van en ZIP, que es genérico: se reconocen por el tipo `estudio_dicom` (ver `VisorDicom`).
 */
export type Visor = "malla3d"

const POR_EXTENSION: Record<string, Visor> = {
  stl: "malla3d",
  ply: "malla3d",
}

export function extensionDe(nombre: string): string {
  const i = nombre.lastIndexOf(".")
  return i >= 0 ? nombre.slice(i + 1).toLowerCase() : ""
}

export function visorDe(nombreOPath: string): Visor | null {
  return POR_EXTENSION[extensionDe(nombreOPath)] ?? null
}
