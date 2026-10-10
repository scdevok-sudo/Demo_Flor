import { Check, Mail, Undo2 } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTramites } from "@/data/useTramites"
import { useFichero } from "@/lib/store"
import { TIPOS_TRAMITE, type Paciente, type Tramite } from "@/lib/tipos"
import { fechaCorta } from "@/lib/util"

function Item({
  tramite,
  paciente,
  onMarcar,
}: {
  tramite: Tramite
  paciente: Paciente | undefined
  onMarcar: (resuelto: boolean) => void
}) {
  const { resuelto } = tramite
  const nombre = paciente ? `${paciente.apellido}, ${paciente.nombre}` : "Paciente eliminado"

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors",
        resuelto ? "border-border bg-muted/50" : "border-border bg-card"
      )}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        {paciente ? (
          <Link
            to={`/pacientes/${paciente.id}`}
            className={cn(
              "block truncate text-sm font-medium hover:underline",
              resuelto ? "text-muted-foreground line-through" : "text-brand-dark"
            )}
          >
            {nombre}
          </Link>
        ) : (
          <p className="truncate text-sm font-medium text-muted-foreground">{nombre}</p>
        )}
        <p
          className={cn(
            "flex items-center gap-1.5 text-xs text-muted-foreground",
            resuelto && "line-through"
          )}
        >
          <Mail className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{paciente?.mail || "Sin mail cargado"}</span>
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          Agregado el {fechaCorta(tramite.agregado)}
        </p>
      </div>
      {resuelto ? (
        <Button
          type="button"
          variant="ghost"
          className="h-11 shrink-0 sm:h-9"
          onClick={() => onMarcar(false)}
        >
          <Undo2 className="size-4" />
          Deshacer
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0 sm:h-9"
          onClick={() => onMarcar(true)}
        >
          <Check className="size-4" />
          Resuelto
        </Button>
      )}
    </li>
  )
}

export function Tramites() {
  const { pacientes } = useFichero()
  const { tramites, cargando, error, marcar, recargar } = useTramites()
  const pacientePorId = new Map(pacientes.map((p) => [p.id, p]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-brand-dark">Trámites pendientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dos listas independientes. Un paciente puede estar en las dos. Se suman desde su ficha.
        </p>
      </div>

      {error ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-destructive">
          {error}
          <Button type="button" variant="outline" size="sm" onClick={recargar}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {cargando ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Cargando trámites…</p>
      ) : (
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {TIPOS_TRAMITE.map(({ id, etiqueta }) => {
          const lista = tramites.filter((t) => t.tipo === id)
          // Pendientes primero; los resueltos quedan tachados al final.
          const ordenada = [
            ...lista.filter((t) => !t.resuelto),
            ...lista.filter((t) => t.resuelto),
          ]
          const pendientes = lista.filter((t) => !t.resuelto).length

          return (
            <Card key={id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-heading text-lg text-brand-dark">{etiqueta}</h2>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {pendientes} {pendientes === 1 ? "pendiente" : "pendientes"}
                  </span>
                </div>
                {ordenada.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-input bg-muted/40 px-5 py-9 text-center text-sm text-muted-foreground">
                    No hay trámites en esta lista.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {ordenada.map((t) => (
                      <Item
                        key={t.id}
                        tramite={t}
                        paciente={pacientePorId.get(t.pacienteId)}
                        onMarcar={(resuelto) => void marcar(t.id, resuelto)}
                      />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      )}
    </div>
  )
}
