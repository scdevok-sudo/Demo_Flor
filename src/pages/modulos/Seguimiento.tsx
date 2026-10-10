import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Campo, TituloBloque } from "@/components/campos"
import { ContenidoArchivo } from "@/components/fotos"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSeguimiento } from "@/data/useSeguimiento"
import type { Paciente } from "@/lib/tipos"
import { fechaLarga, hoyISO } from "@/lib/util"

interface Props {
  paciente: Paciente
}

export function Seguimiento({ paciente }: Props) {
  const s = useSeguimiento(paciente.id)
  const [fecha, setFecha] = useState(hoyISO())
  const [texto, setTexto] = useState("")
  /** Entrada a la que se le pidió borrar y espera confirmación. */
  const [confirmando, setConfirmando] = useState<string | null>(null)

  async function agregar() {
    if (!texto.trim() || !fecha) return
    if (await s.agregar(fecha, texto)) {
      setTexto("")
      setFecha(hoyISO())
    }
  }

  if (s.cargando) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Cargando seguimiento…</p>
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <TituloBloque
            titulo="Nueva entrada"
            descripcion="Lo que pasó en la sesión de hoy, en dos renglones."
          />
          {paciente.activo ? (
            <>
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
              <div className="flex flex-wrap items-center justify-end gap-3">
                {s.error ? (
                  <p role="alert" className="text-sm text-destructive">{s.error}</p>
                ) : null}
                <Button
                  type="button"
                  size="lg"
                  className="h-10"
                  disabled={!texto.trim() || !fecha || s.guardando}
                  onClick={() => void agregar()}
                >
                  <Plus className="size-4" />
                  {s.guardando ? "Guardando…" : "Agregar al seguimiento"}
                </Button>
              </div>
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-input bg-muted/40 px-5 py-6 text-center text-sm text-muted-foreground">
              El paciente está inactivo: no se pueden agregar entradas nuevas. El historial sigue
              disponible.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <TituloBloque
            titulo="Historial"
            descripcion="De lo más reciente a lo más viejo."
            accion={
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {s.entradas.length} {s.entradas.length === 1 ? "entrada" : "entradas"}
              </span>
            }
          />

          {!paciente.activo && s.error ? (
            <p role="alert" className="text-sm text-destructive">{s.error}</p>
          ) : null}

          {s.entradas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-input bg-muted/40 px-5 py-10 text-center text-sm text-muted-foreground">
              Todavía no hay entradas de seguimiento.
            </div>
          ) : (
            <ol className="relative space-y-6 border-l border-border pl-6">
              {s.entradas.map((e) => {
                const adjuntos = s.archivosDe(e.fecha)
                return (
                  <li key={e.id} className="group relative">
                    <span className="bg-brand-coral absolute top-1.5 -left-[1.845rem] size-2.5 rounded-full ring-4 ring-card" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          {fechaLarga(e.fecha)}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                          {e.texto}
                        </p>
                      </div>
                      {confirmando === e.id ? (
                        <div className="flex shrink-0 items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground">¿Borrar?</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setConfirmando(null)
                              void s.borrar(e.id)
                            }}
                          >
                            Sí
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => setConfirmando(null)}>
                            No
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmando(e.id)}
                          aria-label="Borrar entrada"
                          className="shrink-0 rounded-lg p-2.5 text-muted-foreground transition-opacity hover:bg-muted hover:text-destructive md:p-1.5 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                        >
                          <Trash2 className="size-5 md:size-3.5" />
                        </button>
                      )}
                    </div>

                    {adjuntos.length > 0 ? (
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                        {adjuntos.map((a) => (
                          <div
                            key={a.id}
                            className="aspect-4/5 overflow-hidden rounded-lg border border-border bg-muted"
                          >
                            <ContenidoArchivo
                              archivo={a}
                              etiqueta={`${a.tipo === "video" ? "Video" : "Foto"} del ${fechaLarga(e.fecha)}`}
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
