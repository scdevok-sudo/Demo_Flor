import { useEffect, useState } from "react"
import { CalendarDays } from "lucide-react"
import { Link } from "react-router-dom"

import { TituloBloque } from "@/components/campos"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import * as datos from "@/data/agenda"
import type { Paciente, Turno } from "@/lib/tipos"
import { aISO, fechaConDia } from "@/lib/util"

/** Turnos futuros del paciente, tomados de la agenda. Sólo lectura. */
export function ProximosTurnos({ paciente }: { paciente: Paciente }) {
  const [proximos, setProximos] = useState<Turno[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const ahora = new Date()
    const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`
    void datos.proximosDe(paciente.id, aISO(ahora), hora).then((r) => {
      if (r.ok) setProximos(r.valor)
      else setError(r.error)
    })
  }, [paciente.id])

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <TituloBloque
          titulo="Próximos turnos"
          descripcion="Los turnos se cargan desde la agenda."
        />

        {error ? (
          <p role="alert" className="text-sm text-destructive">{error}</p>
        ) : proximos === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Cargando turnos…</p>
        ) : proximos.length === 0 ? (
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
