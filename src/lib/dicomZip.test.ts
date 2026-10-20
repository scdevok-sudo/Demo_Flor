import { zipSync } from "fflate"
import { describe, expect, it } from "vitest"

import { empaquetarSeries, extraerSeries, filtrarZipDicom, SinDicomError } from "@/lib/dicomZip"

const enc = new TextEncoder()

/** Elemento DICOM en Explicit VR Little Endian (VR de 2 caracteres, longitud de 16 bits). */
function elemento(grupo: number, elem: number, vr: string, valor: string): number[] {
  const bytes = [...enc.encode(valor)]
  if (bytes.length % 2) bytes.push(vr === "UI" ? 0 : 0x20)
  return [grupo & 255, grupo >> 8, elem & 255, elem >> 8, ...enc.encode(vr), bytes.length & 255, bytes.length >> 8, ...bytes]
}

/** DICOM mínimo: preámbulo + DICM + cabecera de la serie. Sin píxeles: alcanza para clasificar. */
function dicom(serie: string | null, opciones: { numero?: string; instancia?: string; modalidad?: string } = {}): Uint8Array {
  return new Uint8Array([
    ...new Array(128).fill(0),
    ...enc.encode("DICM"),
    ...elemento(0x0002, 0x0010, "UI", "1.2.840.10008.1.2.1"),
    ...elemento(0x0008, 0x0060, "CS", opciones.modalidad ?? "MR"),
    ...(serie ? elemento(0x0020, 0x000e, "UI", serie) : []),
    ...elemento(0x0020, 0x0011, "IS", opciones.numero ?? "1"),
    ...elemento(0x0020, 0x0013, "IS", opciones.instancia ?? "1"),
    ...new Array(64).fill(0),
  ])
}

describe("ZIP de estudios DICOM", () => {
  const exportVueMotion = () =>
    zipSync({
      "Launch Viewer.exe": new Uint8Array(500).fill(7),
      "ddv/mp/lib.dll": new Uint8Array(500).fill(7),
      "ddv/LOG/logger": new Uint8Array(500).fill(7), // sin extensión pero no es DICOM
      "exam/jpeg/image_s0001_i0001.jpg": new Uint8Array(500).fill(7),
      "exam/DICOMDIR": dicom(null),
      "exam/VW/A/I1000002": dicom("1.2.3.20", { numero: "2", instancia: "2" }),
      "exam/VW/A/I1000001": dicom("1.2.3.20", { numero: "2", instancia: "1" }),
      "exam/VW/B/I2000001": dicom("1.2.3.10", { numero: "1", modalidad: "CT" }),
      "exam/VW/C/corte.dcm": dicom("1.2.3.30", { numero: "3" }),
    })

  it("se queda solo con los DICOM, agrupados por serie y ordenados por número", async () => {
    const series = await extraerSeries(exportVueMotion())
    expect(series.map((s) => [s.id, s.modalidad, s.cortes.length])).toEqual([
      ["1.2.3.10", "CT", 1],
      ["1.2.3.20", "MR", 2],
      ["1.2.3.30", "MR", 1],
    ])
  })

  it("ordena los cortes de una serie por número de instancia", async () => {
    const [, serie] = await extraerSeries(exportVueMotion())
    expect(serie.cortes.map((c) => c.nombre.split("/").pop())).toEqual(["I1000001", "I1000002"])
  })

  it("el ZIP filtrado conserva la agrupación y pesa mucho menos", async () => {
    const original = exportVueMotion()
    const series = await extraerSeries(original)
    const filtrado = await empaquetarSeries(series)
    expect(filtrado.length).toBeLessThan(original.length)
    expect((await extraerSeries(filtrado)).map((s) => [s.id, s.cortes.length])).toEqual(series.map((s) => [s.id, s.cortes.length]))
  })

  it("filtrarZipDicom devuelve un File .zip con el mismo nombre", async () => {
    const file = new File([exportVueMotion() as Uint8Array<ArrayBuffer>], "EGES.zip", { type: "application/zip" })
    const filtrado = await filtrarZipDicom(file)
    expect(filtrado.name).toBe("EGES.zip")
    expect(filtrado.type).toBe("application/zip")
  })

  it("avisa si el ZIP no trae ningún DICOM", async () => {
    const sinDicom = zipSync({ "foto.jpg": new Uint8Array(300), "notas": new Uint8Array(300).fill(1) })
    await expect(extraerSeries(sinDicom)).rejects.toBeInstanceOf(SinDicomError)
  })
})
