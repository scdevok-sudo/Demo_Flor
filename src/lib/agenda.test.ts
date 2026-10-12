import { describe, expect, it } from "vitest"
import {
  aMinutos,
  aplicaEn,
  bloqueEn,
  bloquesDelDia,
  bloquesSuperpuestos,
  deMinutos,
  enlaceWhatsAppTurno,
  espacioLibre,
} from "@/lib/agenda"
import type { BloqueHorario, ConfigAgenda, Paciente, Turno } from "@/lib/tipos"

// 2026-10-05 es lunes, 2026-10-07 miércoles, 2026-10-10 sábado.
const LUN = "2026-10-05"
const MIE = "2026-10-07"
const SAB = "2026-10-10"

function bloque(p: Partial<BloqueHorario>): BloqueHorario {
  return { id: "b", sede: "La Plata", dias: [], desde: "14:00", hasta: "18:00", etiqueta: "", ...p }
}

function turno(p: Partial<Turno>): Turno {
  return {
    id: "t",
    pacienteId: "p1",
    sede: "La Plata",
    fecha: LUN,
    hora: "14:00",
    duracion: 30,
    estado: "ocupado",
    ...p,
  }
}

describe("aMinutos / deMinutos", () => {
  it("convierte ida y vuelta", () => {
    expect(aMinutos("14:30")).toBe(870)
    expect(deMinutos(870)).toBe("14:30")
    expect(deMinutos(aMinutos("09:05"))).toBe("09:05")
  })
})

describe("aplicaEn", () => {
  it("bloque semanal: sólo los días marcados", () => {
    const b = bloque({ dias: [1, 3] })
    expect(aplicaEn(b, LUN)).toBe(true)
    expect(aplicaEn(b, MIE)).toBe(true)
    expect(aplicaEn(b, SAB)).toBe(false)
  })

  it("se repite todas las semanas", () => {
    const b = bloque({ dias: [1] })
    expect(aplicaEn(b, "2026-10-12")).toBe(true)
    expect(aplicaEn(b, "2026-10-19")).toBe(true)
  })

  it("fecha puntual: sólo esa fecha, ignora dias", () => {
    const b = bloque({ fecha: SAB, dias: [1] })
    expect(aplicaEn(b, SAB)).toBe(true)
    expect(aplicaEn(b, LUN)).toBe(false)
  })
})

describe("bloquesDelDia / bloqueEn", () => {
  const config: ConfigAgenda = {
    bloques: [
      bloque({ id: "tarde", dias: [1], desde: "14:00", hasta: "18:00" }),
      bloque({ id: "manana", dias: [1], desde: "09:00", hasta: "12:00" }),
      bloque({ id: "tandil", sede: "Tandil", fecha: LUN, desde: "10:00", hasta: "13:00" }),
    ],
  }

  it("dos bloques el mismo día conviven y salen ordenados", () => {
    expect(bloquesDelDia(config, "La Plata", LUN).map((b) => b.id)).toEqual(["manana", "tarde"])
  })

  it("filtra por sede", () => {
    expect(bloquesDelDia(config, "Tandil", LUN).map((b) => b.id)).toEqual(["tandil"])
  })

  it("día sin jornada: lista vacía", () => {
    expect(bloquesDelDia(config, "Tandil", MIE)).toEqual([])
  })

  it("bloqueEn: incluye el inicio, excluye el cierre", () => {
    expect(bloqueEn(config, "La Plata", LUN, aMinutos("14:00"))?.id).toBe("tarde")
    expect(bloqueEn(config, "La Plata", LUN, aMinutos("17:59"))?.id).toBe("tarde")
    expect(bloqueEn(config, "La Plata", LUN, aMinutos("18:00"))).toBeUndefined()
  })

  it("bloqueEn: hueco entre bloques y otro día devuelven undefined", () => {
    expect(bloqueEn(config, "La Plata", LUN, aMinutos("13:00"))).toBeUndefined()
    expect(bloqueEn(config, "La Plata", MIE, aMinutos("15:00"))).toBeUndefined()
  })
})

describe("espacioLibre", () => {
  const b = bloque({ dias: [1], desde: "14:00", hasta: "18:00" })

  it("sin turnos: hasta el cierre del bloque", () => {
    expect(espacioLibre([], "La Plata", LUN, aMinutos("14:00"), b)).toBe(240)
    expect(espacioLibre([], "La Plata", LUN, aMinutos("17:30"), b)).toBe(30)
  })

  it("se corta en el próximo turno", () => {
    const ts = [turno({ hora: "15:00", duracion: 30 })]
    expect(espacioLibre(ts, "La Plata", LUN, aMinutos("14:00"), b)).toBe(60)
  })

  it("justo al terminar un turno hay lugar hasta el siguiente", () => {
    const ts = [turno({ hora: "14:00", duracion: 30 }), turno({ id: "t2", hora: "15:00" })]
    expect(espacioLibre(ts, "La Plata", LUN, aMinutos("14:30"), b)).toBe(30)
  })

  it("dentro de otro turno: 0 (superposición bloqueada)", () => {
    const ts = [turno({ hora: "14:00", duracion: 60 })]
    expect(espacioLibre(ts, "La Plata", LUN, aMinutos("14:00"), b)).toBe(0)
    expect(espacioLibre(ts, "La Plata", LUN, aMinutos("14:45"), b)).toBe(0)
    expect(espacioLibre(ts, "La Plata", LUN, aMinutos("15:00"), b)).toBe(180)
  })

  it("cancelados y no asistió siguen ocupando el lugar", () => {
    for (const estado of ["cancelado", "no-asistio"] as const) {
      const ts = [turno({ hora: "14:00", duracion: 30, estado })]
      expect(espacioLibre(ts, "La Plata", LUN, aMinutos("14:15"), b)).toBe(0)
    }
  })

  it("ignora turnos de otra sede u otra fecha", () => {
    const ts = [turno({ sede: "Tandil", hora: "15:00" }), turno({ id: "t2", fecha: MIE, hora: "15:00" })]
    expect(espacioLibre(ts, "La Plata", LUN, aMinutos("14:00"), b)).toBe(240)
  })

  it("excluirId: al mover un turno no se bloquea contra sí mismo", () => {
    const ts = [turno({ id: "mio", hora: "14:00", duracion: 30 })]
    expect(espacioLibre(ts, "La Plata", LUN, aMinutos("14:00"), b, "mio")).toBe(240)
  })

  it("un turno que se pasa del cierre no entra (turno fuera de rango)", () => {
    // 17:45 + 30 min se pasa del cierre (18:00): sólo quedan 15 min.
    const libre = espacioLibre([], "La Plata", LUN, aMinutos("17:45"), b)
    expect(libre).toBe(15)
    expect(30 <= libre).toBe(false)
    expect(15 <= libre).toBe(true)
  })
})

describe("bloquesSuperpuestos", () => {
  it("sin bloques o con uno solo: null", () => {
    expect(bloquesSuperpuestos([])).toBeNull()
    expect(bloquesSuperpuestos([bloque({ dias: [1] })])).toBeNull()
  })

  it("bloques que sólo se tocan no cuentan", () => {
    const a = bloque({ dias: [1], desde: "09:00", hasta: "12:00" })
    const b = bloque({ id: "b2", dias: [1], desde: "12:00", hasta: "15:00" })
    expect(bloquesSuperpuestos([a, b])).toBeNull()
  })

  it("mañana y tarde el mismo día conviven", () => {
    const a = bloque({ dias: [1, 3], desde: "09:00", hasta: "12:00" })
    const b = bloque({ id: "b2", dias: [1, 3], desde: "14:00", hasta: "18:00" })
    expect(bloquesSuperpuestos([a, b])).toBeNull()
  })

  it("recurrentes que se pisan en un día en común", () => {
    const a = bloque({ dias: [1, 3], desde: "14:00", hasta: "18:00" })
    const b = bloque({ id: "b2", dias: [3, 5], desde: "17:00", hasta: "19:00" })
    expect(bloquesSuperpuestos([a, b])).toContain("el miércoles")
  })

  it("misma hora pero sin día en común: no se pisan", () => {
    const a = bloque({ dias: [1], desde: "14:00", hasta: "18:00" })
    const b = bloque({ id: "b2", dias: [2], desde: "14:00", hasta: "18:00" })
    expect(bloquesSuperpuestos([a, b])).toBeNull()
  })

  it("misma franja en sedes distintas: no se pisan", () => {
    const a = bloque({ dias: [1] })
    const b = bloque({ id: "b2", sede: "Tandil", dias: [1] })
    expect(bloquesSuperpuestos([a, b])).toBeNull()
  })

  it("dos fechas puntuales iguales se pisan; distintas no", () => {
    const a = bloque({ fecha: SAB, desde: "10:00", hasta: "13:00" })
    const b = bloque({ id: "b2", fecha: SAB, desde: "12:00", hasta: "14:00" })
    const c = bloque({ id: "b3", fecha: "2026-10-17", desde: "12:00", hasta: "14:00" })
    expect(bloquesSuperpuestos([a, b])).toContain("10/10/2026")
    expect(bloquesSuperpuestos([a, c])).toBeNull()
  })

  it("fecha puntual contra recurrente (en cualquier orden)", () => {
    const puntual = bloque({ fecha: LUN, desde: "15:00", hasta: "16:00" })
    const semanal = bloque({ id: "b2", dias: [1], desde: "14:00", hasta: "18:00" })
    const otroDia = bloque({ id: "b3", dias: [2], desde: "14:00", hasta: "18:00" })
    expect(bloquesSuperpuestos([puntual, semanal])).not.toBeNull()
    expect(bloquesSuperpuestos([semanal, puntual])).not.toBeNull()
    expect(bloquesSuperpuestos([puntual, otroDia])).toBeNull()
  })
})

describe("enlaceWhatsAppTurno", () => {
  it("arma un wa.me con el mensaje codificado, sin número si el paciente no tiene teléfono", () => {
    const p = { nombre: "Ana", telefono: "" } as Paciente
    const url = enlaceWhatsAppTurno(p, turno({ fecha: LUN, hora: "14:30", duracion: 45 }))
    expect(url.startsWith("https://wa.me/?text=")).toBe(true)
    const texto = decodeURIComponent(url.split("text=")[1])
    expect(texto).toContain("Hola Ana")
    expect(texto).toContain("14:30 hs")
    expect(texto).toContain("La Plata")
    expect(texto).toContain("45 minutos")
  })
})
