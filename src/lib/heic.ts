import { extensionDe } from "@/lib/visores"

const MIME_HEIC = ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]

/** iOS a veces no manda el MIME de un HEIC: se mira también la extensión. */
export function esHeic(file: Pick<File, "name" | "type">): boolean {
  return MIME_HEIC.includes(file.type.toLowerCase()) || ["heic", "heif"].includes(extensionDe(file.name))
}

/** Convierte un HEIC/HEIF a JPEG en el navegador (la librería se carga recién al necesitarla). */
export async function heicAJpeg(file: File): Promise<File> {
  const { default: heic2any } = await import("heic2any")
  const resultado = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 })
  const blob = Array.isArray(resultado) ? resultado[0] : resultado
  const nombre = file.name.replace(/\.(heic|heif)$/i, "") || "foto"
  return new File([blob], `${nombre}.jpg`, { type: "image/jpeg", lastModified: file.lastModified })
}
