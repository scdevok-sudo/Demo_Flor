import { describe, expect, it, vi } from "vitest"

// archivos.ts importa el cliente de Supabase, que exige variables de entorno.
vi.mock("@/lib/supabase", () => ({ supabase: {} }))

import { TOPES, validarArchivo, zonaDeSlot, etiquetaDeSlot, slotDeEtiqueta } from "@/data/archivos"

const MB = 1024 * 1024

function archivo(nombre: string, tipo: string, bytes = 1024): File {
  const f = new File(["x"], nombre, { type: tipo })
  Object.defineProperty(f, "size", { value: bytes })
  return f
}

describe("TOPES", () => {
  it("valores del brief", () => {
    expect(TOPES).toEqual({
      foto_inicial: 10, // 4 de cara + 6 de boca
      foto_final: 10,
      intra_tratamiento: 20,
      radiografia: 6,
      estudio: 4,
    })
  })
})

describe("validarArchivo", () => {
  it("acepta una imagen donde se permiten imágenes", () => {
    expect(validarArchivo(archivo("a.jpg", "image/jpeg"), ["imagen"])).toEqual({ ok: true, valor: "imagen" })
  })

  it("acepta video donde se permiten imagen o video", () => {
    expect(validarArchivo(archivo("a.mp4", "video/mp4"), ["imagen", "video"])).toEqual({ ok: true, valor: "video" })
  })

  it("acepta PDF", () => {
    expect(validarArchivo(archivo("e.pdf", "application/pdf"), ["pdf", "imagen"])).toEqual({ ok: true, valor: "pdf" })
  })

  it("rechaza un .zip con mensaje claro", () => {
    const r = validarArchivo(archivo("a.zip", "application/zip"), ["imagen"])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("imágenes")
  })

  it("rechaza un tipo reconocido pero no permitido en esa sección", () => {
    expect(validarArchivo(archivo("v.mp4", "video/mp4"), ["imagen"]).ok).toBe(false)
    expect(validarArchivo(archivo("e.pdf", "application/pdf"), ["imagen"]).ok).toBe(false)
  })

  it("el mensaje lista todos los tipos permitidos", () => {
    const r = validarArchivo(archivo("a.zip", "application/zip"), ["imagen", "video"])
    if (!r.ok) expect(r.error).toContain("imágenes o videos")
  })

  it("sin MIME (algunos celulares con HEIC), usa la extensión", () => {
    expect(validarArchivo(archivo("IMG_1.HEIC", ""), ["imagen"])).toEqual({ ok: true, valor: "imagen" })
    expect(validarArchivo(archivo("clip.MOV", ""), ["video"])).toEqual({ ok: true, valor: "video" })
  })

  it("sin MIME y sin extensión conocida: rechaza", () => {
    expect(validarArchivo(archivo("sinextension", ""), ["imagen"]).ok).toBe(false)
    expect(validarArchivo(archivo("a.exe", ""), ["imagen"]).ok).toBe(false)
  })

  it("límites de tamaño: imagen 25 MB, video 100 MB, pdf 25 MB", () => {
    expect(validarArchivo(archivo("a.jpg", "image/jpeg", 25 * MB), ["imagen"]).ok).toBe(true)
    expect(validarArchivo(archivo("a.jpg", "image/jpeg", 25 * MB + 1), ["imagen"]).ok).toBe(false)
    expect(validarArchivo(archivo("a.mp4", "video/mp4", 100 * MB), ["video"]).ok).toBe(true)
    expect(validarArchivo(archivo("a.mp4", "video/mp4", 100 * MB + 1), ["video"]).ok).toBe(false)
    expect(validarArchivo(archivo("e.pdf", "application/pdf", 25 * MB + 1), ["pdf"]).ok).toBe(false)
  })

  it("el mensaje de tamaño indica el máximo", () => {
    const r = validarArchivo(archivo("a.mp4", "video/mp4", 101 * MB), ["video"])
    if (!r.ok) expect(r.error).toContain("100 MB")
  })
})

describe("slots", () => {
  it("zonaDeSlot distingue cara de boca", () => {
    expect(zonaDeSlot("perfil-izquierdo")).toBe("cara")
    expect(zonaDeSlot("frente-sonriendo")).toBe("cara")
    expect(zonaDeSlot("oclusal-superior")).toBe("boca")
  })

  it("etiqueta y slot son inversos", () => {
    expect(etiquetaDeSlot("perfil-izquierdo")).toBe("perfil_izquierdo")
    expect(slotDeEtiqueta("perfil_izquierdo")).toBe("perfil-izquierdo")
    expect(slotDeEtiqueta(null)).toBe("")
  })
})
