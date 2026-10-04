import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { cn } from "cn"

import { Input } from "@/components/ui/input"
import { coincide } from "@/lib/buscar"
import { useFichero } from "@/lib/store"
import type { Paciente } from "@/lib/tipos"
import { formatoDNI, iniciales, soloDigitos } from "@/lib/util"

/** Mismo buscador que /pacientes (DNI o apellido), en versión lista para elegir. */
export function BuscadorPaciente({
  seleccionadoId,
  onElegir,
}: {
  seleccionadoId?: string
  onElegir: (paciente: Paciente) => void
}) {
  const { pacientes } = useFichero()
  const [busqueda, setBusqueda] = useState("")

  const resultados = useMemo(
    () =>
      pacientes
        .filter((p) => coincide(p, busqueda))
        .sort((a, b) => a.apellido.localeCompare(b.apellido, "es")),
    [pacientes, busqueda]
  )

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por DNI o apellido"
          inputMode="search"
          className="h-11 pl-9"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {busqueda.trim()
          ? `Buscando por ${soloDigitos(busqueda).length >= 2 ? "DNI" : "apellido"} · `
          : ""}
        {resultados.length} {resultados.length === 1 ? "paciente" : "pacientes"}
      </p>
      <ul className="max-h-60 space-y-1.5 overflow-y-auto">
        {resultados.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onElegir(p)}
              className={cn(
                "flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted active:bg-muted",
                seleccionadoId === p.id ? "border-brand-coral bg-brand-coral-soft" : "border-border"
              )}
            >
              <span className="bg-secondary flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-brand-dark">
                {iniciales(p.nombre, p.apellido)}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-brand-dark">
                  {p.apellido}, {p.nombre}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  DNI {formatoDNI(p.dni)} · {p.categoria}
                </span>
              </span>
            </button>
          </li>
        ))}
        {resultados.length === 0 ? (
          <li className="px-2 py-6 text-center text-sm text-muted-foreground">Sin resultados</li>
        ) : null}
      </ul>
    </div>
  )
}
