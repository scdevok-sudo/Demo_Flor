import { CalendarDays } from "lucide-react"
import { Link } from "react-router-dom"

import { TituloBloque } from "@/components/campos"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useFichero } from "@/lib/store"
import type { Paciente } from "@/lib/tipos"
import { aISO, fechaConDia } from "@/lib/util"

/** Turnos futuros del paciente, tomados de la agenda. Sólo lectura. */
export function ProximosTurnos({ paciente }: { paciente: Paciente }) {
  const { turnos } = useFichero()

  const ahora = new Date()
  const hoy = aISO(ahora)
  const horaAhora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`

  const proximos = turnos
    .filter(
      (t) =>
        t.pacienteId === paciente.id &&
        t.estado === "ocupado" &&
        (t.fecha > hoy || (t.fecha === hoy && t.hora >= horaAhora))
    )
    .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <TituloBloque
          titulo="Próximos turnos"
          descripcion="Los turnos se cargan desde la agenda."
        />

        {proximos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">Este paciente no tiene turnos próximos.</p>
            <Button
              variant="outline"
              className="mt-4 h-10"
              render={<Link to="/agenda" />}
              nativeButton={false}
            >
              <CalendarDays className="size-4" />
              Ir a la agenda
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {proximos.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium text-brand-dark">{fechaConDia(t.fecha)}</p>
                  <p className="text-sm text-muted-foreground">{t.sede}</p>
                </div>
                <p className="text-lg font-medium text-brand-dark tabular-nums">{t.hora} hs</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
