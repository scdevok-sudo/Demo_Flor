import type { BloqueHorario, ConfigAgenda, Paciente, Sede, Turno } from "@/lib/tipos"
import { DIAS_LARGO, deISO, enlaceWhatsAppChat, fechaConDia, fechaCorta } from "@/lib/util"

/** Los turnos arrancan en múltiplos de este paso. */
export const PASO_MIN = 15

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + (m || 0)
}

export function deMinutos(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`
}

/** ¿Este bloque atiende ese día (AAAA-MM-DD)? Por fecha puntual o por día de la semana. */
export function aplicaEn(b: BloqueHorario, iso: string): boolean {
  return b.fecha ? b.fecha === iso : b.dias.includes(deISO(iso).getDay())
}

/** Bloques de la sede que atienden ese día, de más temprano a más tarde. */
export function bloquesDelDia(config: ConfigAgenda, sede: Sede, iso: string): BloqueHorario[] {
  return config.bloques
    .filter((b) => b.sede === sede && aplicaEn(b, iso))
    .sort((a, b) => aMinutos(a.desde) - aMinutos(b.desde))
}

/** Bloque de esa sede y día que contiene el minuto dado, si hay uno. */
export function bloqueEn(
  config: ConfigAgenda,
  sede: Sede,
  iso: string,
  minuto: number
): BloqueHorario | undefined {
  return bloquesDelDia(config, sede, iso).find(
    (b) => minuto >= aMinutos(b.desde) && minuto < aMinutos(b.hasta)
  )
}

export function finTurno(t: Pick<Turno, "hora" | "duracion">): number {
  return aMinutos(t.hora) + t.duracion
}

/**
 * Minutos libres a partir de `inicio` dentro del bloque: hasta el próximo turno
 * del mismo día/sede o hasta el cierre del bloque. 0 si `inicio` cae dentro de
 * otro turno. Los cancelados y los «no asistió» siguen ocupando el lugar hasta
 * que se libera el horario, igual que se ven en la grilla.
 */
export function espacioLibre(
  turnos: Turno[],
  sede: Sede,
  fecha: string,
  inicio: number,
  bloque: BloqueHorario,
  excluirId?: string
): number {
  let tope = aMinutos(bloque.hasta)
  for (const t of turnos) {
    if (t.sede !== sede || t.fecha !== fecha || t.id === excluirId) continue
    const desde = aMinutos(t.hora)
    const hasta = finTurno(t)
    if (inicio >= desde && inicio < hasta) return 0
    if (desde > inicio) tope = Math.min(tope, desde)
  }
  return Math.max(0, tope - inicio)
}

/** Dos bloques de la misma sede que se pisan (los que sólo se tocan no cuentan). */
export function bloquesSuperpuestos(bloques: BloqueHorario[]): string | null {
  const comparten = (a: BloqueHorario, b: BloqueHorario): string | null => {
    if (a.sede !== b.sede) return null
    if (a.fecha && b.fecha) return a.fecha === b.fecha ? fechaCorta(a.fecha) : null
    if (a.fecha) return b.dias.includes(deISO(a.fecha).getDay()) ? fechaCorta(a.fecha) : null
    if (b.fecha) return a.dias.includes(deISO(b.fecha).getDay()) ? fechaCorta(b.fecha) : null
    const dia = a.dias.find((d) => b.dias.includes(d))
    return dia === undefined ? null : `el ${DIAS_LARGO[dia].toLowerCase()}`
  }
  for (let i = 0; i < bloques.length; i++) {
    for (let j = i + 1; j < bloques.length; j++) {
      const a = bloques[i]
      const b = bloques[j]
      if (aMinutos(a.desde) >= aMinutos(b.hasta) || aMinutos(b.desde) >= aMinutos(a.hasta)) continue
      const cuando = comparten(a, b)
      if (cuando) {
        return `Dos bloques se superponen (${cuando}): ${a.desde}–${a.hasta} y ${b.desde}–${b.hasta}.`
      }
    }
  }
  return null
}

/** Mensaje prellenado; el envío es manual desde WhatsApp, no hay automatización. */
export function enlaceWhatsAppTurno(p: Paciente, t: Turno): string {
  const texto = [
    `Hola ${p.nombre}, ¿cómo estás?`,
    "",
    `Te confirmo tu turno el ${fechaConDia(t.fecha)} (${DIAS_LARGO[deISO(t.fecha).getDay()]}) a las ${t.hora} hs, en ${t.sede}. Dura unos ${t.duracion} minutos.`,
    "",
    "Si necesitás cambiarlo, avisame con tiempo. ¡Saludos!",
    "Flor",
  ].join("\n")
  return enlaceWhatsAppChat(p.telefono, texto)
}
