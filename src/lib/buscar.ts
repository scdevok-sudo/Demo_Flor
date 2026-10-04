import type { Paciente } from "@/lib/tipos"
import { normalizar, soloDigitos } from "@/lib/util"

/** El buscador es uno solo: si escribís números busca por DNI, si no, por apellido. */
export function coincide(p: Paciente, busqueda: string): boolean {
  const q = busqueda.trim()
  if (!q) return true

  const digitos = soloDigitos(q)
  if (digitos.length >= 2 && digitos.length >= q.replace(/[\s.]/g, "").length) {
    return soloDigitos(p.dni).includes(digitos)
  }

  const texto = normalizar(q)
  return (
    normalizar(p.apellido).includes(texto) ||
    normalizar(p.nombre).includes(texto) ||
    normalizar(`${p.apellido} ${p.nombre}`).includes(texto) ||
    normalizar(`${p.nombre} ${p.apellido}`).includes(texto)
  )
}
