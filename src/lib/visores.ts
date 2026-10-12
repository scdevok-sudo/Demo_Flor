/**
 * Qué visor corresponde a cada archivo, resuelto por extensión.
 * Para sumar DICOM después: agregar "dicom" acá, sus extensiones en `POR_EXTENSION`
 * y un caso en `VisorArchivo`; el resto del módulo no cambia.
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
