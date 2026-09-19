import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Campo, TituloBloque } from "@/components/campos"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Paciente } from "@/lib/tipos"
import { fechaLarga, hoyISO, nuevoId } from "@/lib/util"

interface Props {
  paciente: Paciente
  actualizar: (cambios: Partial<Paciente>) => void
}

export function Seguimiento({ paciente, actualizar }: Props) {
  const [fecha, setFecha] = useState(hoyISO())
  const [texto, setTexto] = useState("")

  const entradas = [...paciente.seguimiento].sort((a, b) => b.fecha.localeCompare(a.fecha))

  function agregar() {
    if (!texto.trim()) return
    actualizar({
      seguimiento: [{ id: nuevoId("sg"), fecha, texto: texto.trim() }, ...paciente.seguimiento],
    })
    setTexto("")
    setFecha(hoyISO())
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <TituloBloque
            titulo="Nueva entrada"
            descripcion="Lo que pasó en la sesión de hoy, en dos renglones."
          />
          <div className="grid gap-4 sm:grid-cols-[minmax(0,11rem)_1fr]">
            <Campo etiqueta="Fecha">
              <Input
                className="h-9"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </Campo>
            <Campo etiqueta="Qué se hizo">
              <Textarea
                rows={3}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Cambio de arco a 016x022 NiTi. Se refuerzan indicaciones de higiene."
              />
            </Campo>
          </div>
          <div className="flex justify-end">
            <Button type="button" size="lg" className="h-10" disabled={!texto.trim()} onClick={agregar}>
              <Plus className="size-4" />
              Agregar al seguimiento
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <TituloBloque
            titulo="Historial"
            descripcion="De lo más reciente a lo más viejo."
            accion={
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {entradas.length} {entradas.length === 1 ? "entrada" : "entradas"}
              </span>
            }
          />

          {entradas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-input bg-muted/40 px-5 py-10 text-center text-sm text-muted-foreground">
              Todavía no hay entradas de seguimiento.
            </div>
          ) : (
            <ol className="relative space-y-6 border-l border-border pl-6">
              {entradas.map((e) => (
                <li key={e.id} className="group relative">
                  <span className="bg-brand-coral absolute top-1.5 -left-[1.845rem] size-2.5 rounded-full ring-4 ring-card" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {fechaLarga(e.fecha)}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-foreground">{e.texto}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        actualizar({
                          seguimiento: paciente.seguimiento.filter((x) => x.id !== e.id),
                        })
                      }
                      aria-label="Borrar entrada"
                      className="shrink-0 rounded-lg p-2.5 text-muted-foreground transition-opacity hover:bg-muted hover:text-destructive md:p-1.5 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                    >
                      <Trash2 className="size-5 md:size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
