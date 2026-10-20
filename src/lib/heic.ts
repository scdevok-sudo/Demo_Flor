import { extensionDe } from "@/lib/visores"

const MIME_HEIC = ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]

/** iOS a veces no manda el MIME de un HEIC: se mira también la extensión. */
export function esHeic(file: Pick<File, "name" | "type">): boolean {
  return MIME_HEIC.includes(file.type.toLowerCase()) || ["heic", "heif"].includes(extensionDe(file.name))
}

/** Convierte un HEIC/HEIF a JPEG en el navegador (la librería se carga recién al necesitarla). */
export async function heicAJpeg(file: File): Promise<File> {
  // libheif-js (bundle con el wasm incluido): lee los HEIC de iOS recientes con mapa de tonos HDR,
  // que la libheif vieja de heic2any rechazaba con «format not supported».
  const { default: libheif } = await import("libheif-js/wasm-bundle")
  const [imagen] = new libheif.HeifDecoder().decode(new Uint8Array(await file.arrayBuffer()))
  if (!imagen) throw new Error("HEIC sin imágenes")
  const ancho = imagen.get_width()
  const alto = imagen.get_height()
  const datos = new ImageData(ancho, alto)
  await new Promise<void>((resolve, reject) =>
    imagen.display(datos, (r) => (r ? resolve() : reject(new Error("No se pudo decodificar el HEIC"))))
  )
  const canvas = document.createElement("canvas")
  canvas.width = ancho
  canvas.height = alto
  canvas.getContext("2d")!.putImageData(datos, 0, 0)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9))
  if (!blob) throw new Error("No se pudo generar el JPEG")
  const nombre = file.name.replace(/\.(heic|heif)$/i, "") || "foto"
  return new File([blob], `${nombre}.jpg`, { type: "image/jpeg", lastModified: file.lastModified })
}
