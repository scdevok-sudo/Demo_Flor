import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Paciente } from "@/lib/tipos"
import { coincide } from "@/lib/buscar"
import {
  aISO,
  deISO,
  edadDesde,
  enlaceWhatsAppChat,
  numeroWhatsApp,
  fechaConDia,
  fechaCorta,
  fechaLarga,
  formatoDNI,
  hoyISO,
  iniciales,
  lunesDe,
  montoARS,
  normalizar,
  soloDigitos,
  sumarDias,
} from "@/lib/util"

describe("DNI", () => {
  it("soloDigitos: con y sin puntos es lo mismo (duplicados)", () => {
    expect(soloDigitos("29.483.094")).toBe("29483094")
    expect(soloDigitos("29483094")).toBe("29483094")
    expect(soloDigitos(" 29 483 094 ")).toBe("29483094")
    expect(soloDigitos("")).toBe("")
  })

  it("formatoDNI agrega los puntos", () => {
    expect(formatoDNI("54892117")).toBe("54.892.117")
    expect(formatoDNI("29.483.094")).toBe("29.483.094")
    expect(formatoDNI("5489211")).toBe("5.489.211")
    expect(formatoDNI("")).toBe("—")
  })
})

describe("normalizar", () => {
  it("minúsculas, sin tildes, sin espacios en los bordes", () => {
    expect(normalizar("  PÉREZ ")).toBe("perez")
    expect(normalizar("Ñandú")).toBe("nandu")
  })
})

describe("coincide (buscador de pacientes)", () => {
  const perez = { nombre: "María José", apellido: "Pérez", dni: "29.483.094" } as Paciente
  const gomez = { nombre: "Juan", apellido: "Gómez", dni: "30111222" } as Paciente

  it("búsqueda vacía: todos", () => {
    expect(coincide(perez, "")).toBe(true)
    expect(coincide(perez, "   ")).toBe(true)
  })

  it("por DNI exacto, con o sin puntos", () => {
    expect(coincide(perez, "29483094")).toBe(true)
    expect(coincide(perez, "29.483.094")).toBe(true)
    expect(coincide(gomez, "29483094")).toBe(false)
  })

  it("por DNI parcial", () => {
    expect(coincide(perez, "4830")).toBe(true)
  })

  it("un solo dígito no dispara la búsqueda por DNI", () => {
    expect(coincide(perez, "2")).toBe(false)
  })

  it("por apellido parcial, sin tildes ni mayúsculas", () => {
    expect(coincide(perez, "pere")).toBe(true)
    expect(coincide(perez, "PÉREZ")).toBe(true)
    expect(coincide(perez, "pErEz")).toBe(true)
    expect(coincide(gomez, "gomez")).toBe(true)
    expect(coincide(gomez, "pere")).toBe(false)
  })

  it("por nombre, y por «apellido nombre» o «nombre apellido»", () => {
    expect(coincide(perez, "maria")).toBe(true)
    expect(coincide(perez, "perez maria")).toBe(true)
    expect(coincide(perez, "maria jose perez")).toBe(true)
    expect(coincide(perez, "jose perez")).toBe(true)
  })
})

describe("fechas puras", () => {
  it("fechaCorta / fechaLarga", () => {
    expect(fechaCorta("2026-03-14")).toBe("14/03/2026")
    expect(fechaLarga("2026-03-14")).toBe("14 de marzo de 2026")
    expect(fechaLarga("2026-03-04")).toBe("4 de marzo de 2026")
  })

  it("vacío o mal formado no rompe", () => {
    expect(fechaCorta("")).toBe("—")
    expect(fechaLarga("")).toBe("—")
    expect(fechaCorta("basura")).toBe("basura")
    expect(fechaLarga("basura")).toBe("basura")
  })

  it("aISO / deISO son inversas y usan hora local (sin correr el día)", () => {
    const d = deISO("2026-10-05")
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 5])
    expect(aISO(d)).toBe("2026-10-05")
    expect(aISO(new Date(2026, 0, 1, 23, 59))).toBe("2026-01-01")
    expect(aISO(new Date(2026, 11, 31, 0, 0))).toBe("2026-12-31")
  })

  it("sumarDias cruza meses y años", () => {
    expect(aISO(sumarDias(deISO("2026-12-30"), 3))).toBe("2027-01-02")
    expect(aISO(sumarDias(deISO("2026-03-01"), -1))).toBe("2026-02-28")
  })

  it("lunesDe: lunes a domingo caen en el mismo lunes", () => {
    for (const dia of ["2026-10-05", "2026-10-07", "2026-10-11"]) {
      expect(aISO(lunesDe(deISO(dia)))).toBe("2026-10-05")
    }
    expect(aISO(lunesDe(deISO("2026-10-12")))).toBe("2026-10-12")
  })

  it("fechaConDia", () => {
    expect(fechaConDia("2026-10-05")).toBe("Lun 5 oct")
    expect(fechaConDia("2026-10-11")).toBe("Dom 11 oct")
  })
})

describe("con reloj fijo", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 10 de octubre de 2026, mediodía local.
    vi.setSystemTime(new Date(2026, 9, 10, 12, 0, 0))
  })
  afterEach(() => vi.useRealTimers())

  it("hoyISO", () => {
    expect(hoyISO()).toBe("2026-10-10")
  })

  it("edadDesde: cumple hoy ya cuenta el año", () => {
    expect(edadDesde("1990-10-10")).toBe("36")
  })

  it("edadDesde: cumple mañana todavía no", () => {
    expect(edadDesde("1990-10-11")).toBe("35")
  })

  it("edadDesde: cumplió ayer", () => {
    expect(edadDesde("1990-10-09")).toBe("36")
  })

  it("edadDesde: mes posterior y mes anterior", () => {
    expect(edadDesde("2000-12-31")).toBe("25")
    expect(edadDesde("2000-01-01")).toBe("26")
  })

  it("edadDesde: nacido el 29 de febrero", () => {
    expect(edadDesde("2000-02-29")).toBe("26")
  })

  it("edadDesde: recién nacido es 0", () => {
    expect(edadDesde("2026-10-01")).toBe("0")
  })

  it("edadDesde: vacío, inválido, futuro o absurdo devuelven vacío", () => {
    expect(edadDesde("")).toBe("")
    expect(edadDesde("no-es-fecha")).toBe("")
    expect(edadDesde("2030-01-01")).toBe("")
    expect(edadDesde("1800-01-01")).toBe("")
  })
})

describe("varios", () => {
  it("iniciales", () => {
    expect(iniciales("ana", "pérez")).toBe("AP")
  })

  it("montoARS", () => {
    expect(montoARS(0)).toBe("—")
    expect(montoARS("")).toBe("—")
    expect(montoARS("abc")).toBe("—")
    expect(montoARS(1500000)).toMatch(/1\.500\.000/)
    expect(montoARS("$ 1500000")).toMatch(/1\.500\.000/)
  })
})

describe("numeroWhatsApp / enlaceWhatsAppChat", () => {
  it("normaliza celulares argentinos a 549 + área + número", () => {
    expect(numeroWhatsApp("221 555-0123")).toBe("5492215550123")
    expect(numeroWhatsApp("0221 555-0123")).toBe("5492215550123")
    expect(numeroWhatsApp("+54 9 221 555-0123")).toBe("5492215550123")
    expect(numeroWhatsApp("54 221 555 0123")).toBe("5492215550123")
  })
  it("descarta el 15 del celular", () => {
    expect(numeroWhatsApp("0221 15 555-0123")).toBe("5492215550123")
    expect(numeroWhatsApp("(0221) 15-555-0123")).toBe("5492215550123")
    expect(numeroWhatsApp("011 15 5555-0123")).toBe("5491155550123")
    expect(numeroWhatsApp("221 15 5550123")).toBe("5492215550123")
    expect(numeroWhatsApp("0221155550123")).toBe("5492215550123")
    expect(numeroWhatsApp("1155550123")).toBe("5491155550123")
  })
  it("no toca un 15 que es parte del número", () => {
    expect(numeroWhatsApp("221 555-1523")).toBe("5492215551523")
    expect(numeroWhatsApp("2215551500")).toBe("5492215551500")
  })
  it("devuelve null si el número no alcanza o está vacío", () => {
    expect(numeroWhatsApp("")).toBeNull()
    expect(numeroWhatsApp("555-0123")).toBeNull()
  })
  it("arma el enlace al chat, o sin número si no hay teléfono válido", () => {
    expect(enlaceWhatsAppChat("221 555-0123", "Hola")).toBe("https://wa.me/5492215550123?text=Hola")
    expect(enlaceWhatsAppChat("", "Hola")).toBe("https://wa.me/?text=Hola")
  })
})
