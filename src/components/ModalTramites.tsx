import { useEffect, useState } from "react"
import { ClipboardCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import * as datos from "@/data/tramites"
import { TIPOS_TRAMITE, type Paciente, type TipoTramite } from "@/lib/tipos"

/** Botón de la ficha + diálogo para elegir a cuál de las dos listas (o ambas) sumar al paciente. */
export function AgregarATramites({ paciente }: { paciente: Paciente }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <Button type="button" variant="outline" className="h-10" onClick={() => setAbierto(true)}>
        <ClipboardCheck className="size-4" />
        Agregar a trámites pendientes
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          {/* Se monta de nuevo al abrir para que las casillas partan vacías. */}
          {abierto ? <Contenido paciente={paciente} onCerrar={() => setAbierto(false)} /> : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Contenido({ paciente, onCerrar }: { paciente: Paciente; onCerrar: () => void }) {
  const [pendientes, setPendientes] = useState<TipoTramite[] | null>(null)
  const [elegidos, setElegidos] = useState<TipoTramite[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void datos.pendientesDe(paciente.id).then((r) => {
      if (r.ok) setPendientes(r.valor)
      else setError(r.error)
    })
  }, [paciente.id])

  const yaPendiente = (tipo: TipoTramite) => pendientes?.includes(tipo) ?? false

  async function agregar() {
    setGuardando(true)
    setError(null)
    const r = await datos.agregar(paciente.id, elegidos)
    setGuardando(false)
    if (r.ok) onCerrar()
    else setError(r.error)
  }

  const alternar = (tipo: TipoTramite, marcado: boolean) =>
    setElegidos((e) => (marcado ? [...e, tipo] : e.filter((x) => x !== tipo)))

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading text-xl text-brand-dark">
          Agregar a trámites pendientes
        </DialogTitle>
        <DialogDescription>
          {paciente.nombre} {paciente.apellido}. Podés elegir una lista o las dos.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        {TIPOS_TRAMITE.map(({ id, etiqueta }) => {
          const ya = yaPendiente(id)
          return (
            <label
              key={id}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-2.5 has-disabled:cursor-not-allowed has-disabled:opacity-60"
            >
              <Checkbox
                disabled={ya}
                checked={ya || elegidos.includes(id)}
                onCheckedChange={(v: boolean) => alternar(id, v)}
              />
              <span className="min-w-0 flex-1 text-sm font-medium text-brand-dark">{etiqueta}</span>
              {ya ? <span className="text-xs text-muted-foreground">Ya está pendiente</span> : null}
            </label>
          )
        })}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      ) : null}

      <DialogFooter>
        <Button variant="outline" className="h-11 sm:h-9" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button
          className="h-11 sm:h-9"
          disabled={elegidos.length === 0 || pendientes === null || guardando}
          onClick={() => void agregar()}
        >
          {guardando ? "Guardando…" : "Agregar"}
        </Button>
      </DialogFooter>
    </>
  )
}
