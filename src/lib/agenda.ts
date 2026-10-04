import type { ConfigAgenda } from "@/lib/tipos"

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + (m || 0)
}

export function deMinutos(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`
}

/** Horarios de inicio de cada turno según la configuración: 14:00, 14:30 … 19:30. */
export function horariosDelDia(config: ConfigAgenda): string[] {
  const horas: string[] = []
  const fin = aMinutos(config.hasta)
  for (let t = aMinutos(config.desde); t + config.duracion <= fin; t += config.duracion) {
    horas.push(deMinutos(t))
  }
  return horas
}

/** Días de atención ordenados lunes → domingo. */
export function diasOrdenados(config: ConfigAgenda): number[] {
  return [...config.dias].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
}
