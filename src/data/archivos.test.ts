import { describe, expect, it, vi } from "vitest"

// archivos.ts importa el cliente de Supabase, que exige variables de entorno.
vi.mock("@/lib/supabase", () => ({ supabase: {} }))

import { TOPES, etiquetaDeSubida, nombreVisible, validarArchivo, zonaDeSlot, etiquetaDeSlot, slotDeEtiqueta } from "@/data/archivos"

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

describe("archivos de iPhone", () => {
  it("HEIC/HEIF con MIME es imagen válida", () => {
    expect(validarArchivo(archivo("IMG_1.HEIC", "image/heic"), ["imagen"])).toEqual({ ok: true, valor: "imagen" })
    expect(validarArchivo(archivo("IMG_2.heif", "image/heif"), ["imagen"])).toEqual({ ok: true, valor: "imagen" })
  })

  it("video .mov (video/quicktime) se acepta como video", () => {
    expect(validarArchivo(archivo("IMG_3.MOV", "video/quicktime"), ["imagen", "video"])).toEqual({ ok: true, valor: "video" })
  })
})

describe("modelos 3D", () => {
  it("acepta STL y PLY por extensión (sin MIME fiable)", () => {
    expect(validarArchivo(archivo("arcada.STL", "model/stl"), ["modelo3d"])).toEqual({ ok: true, valor: "modelo3d" })
    expect(validarArchivo(archivo("arcada.ply", ""), ["imagen", "modelo3d"])).toEqual({ ok: true, valor: "modelo3d" })
  })

  it("rechaza 3D donde no se permite y respeta el tope de 50 MB", () => {
    expect(validarArchivo(archivo("a.stl", ""), ["imagen"]).ok).toBe(false)
    expect(validarArchivo(archivo("a.stl", "", 50 * MB), ["modelo3d"]).ok).toBe(true)
    expect(validarArchivo(archivo("a.stl", "", 50 * MB + 1), ["modelo3d"]).ok).toBe(false)
  })
})

describe("estudios DICOM", () => {
  it("clasifica el ZIP como estudio_dicom aunque el MIME varíe", () => {
    for (const mime of ["application/zip", "application/x-zip-compressed", ""]) {
      expect(validarArchivo(archivo("EGES_vuemotion.zip", mime), ["imagen", "estudio_dicom"])).toEqual({
        ok: true,
        valor: "estudio_dicom",
      })
    }
  })

  it("rechaza el ZIP donde no se permite y respeta el tope de 400 MB", () => {
    expect(validarArchivo(archivo("a.zip", "application/zip"), ["imagen", "pdf"]).ok).toBe(false)
    expect(validarArchivo(archivo("a.zip", "", 400 * MB), ["estudio_dicom"]).ok).toBe(true)
    expect(validarArchivo(archivo("a.zip", "", 400 * MB + 1), ["estudio_dicom"]).ok).toBe(false)
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

describe("nombre de visualización", () => {
  it("ZIP DICOM y STL/PLY no muestran el nombre de exportación", () => {
    expect(etiquetaDeSubida("estudio_dicom", "EGES_109_vuemotion_x.zip", "2026-10-19")).toBe("Estudio DICOM — 19/10/2026")
    expect(etiquetaDeSubida("modelo3d", "scan_0042.stl", "2026-10-19")).toBe("Modelo 3D — 19/10/2026")
  })
  it("imagen y PDF conservan el nombre", () => {
    expect(etiquetaDeSubida("pdf", "panoramica.pdf", "2026-10-19")).toBe("panoramica.pdf")
  })
  it("registros viejos con el nombre crudo se muestran con el nombre nuevo", () => {
    expect(nombreVisible({ tipo: "estudio_dicom", etiqueta: "EGES_1.zip", fecha: "2026-03-14" })).toBe("Estudio DICOM — 14/03/2026")
    expect(nombreVisible({ tipo: "estudio_dicom", etiqueta: "Estudio DICOM — 14/03/2026", fecha: "2026-03-14" })).toBe("Estudio DICOM — 14/03/2026")
    expect(nombreVisible({ tipo: "pdf", etiqueta: null, fecha: "" })).toBe("Estudio.pdf")
  })
})
