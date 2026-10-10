import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { cn } from "cn"

import { SelectSimple } from "@/components/campos"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { aMinutos, bloquesSuperpuestos, deMinutos } from "@/lib/agenda"
import type { BloqueHorario, ConfigAgenda, Sede } from "@/lib/tipos"
import { DIAS_CORTO, aISO, fechaCorta, nuevoId } from "@/lib/util"

/** Lun → Dom, con su número de Date.getDay. */
const DIAS_UI = [1, 2, 3, 4, 5, 6, 0]

/** 00:00, 00:30 … 23:30 — en 24 hs, sin depender del locale del navegador. */
const HORAS = Array.from({ length: 48 }, (_, i) => deMinutos(i * 30))
const OPCIONES_HORA = HORAS.map((h) => ({ valor: h, etiqueta: `${h} hs` }))

interface Props {
  abierto: boolean
  /** Sede que se está editando: cada una tiene sus propios bloques. */
  sede: Sede
  config: ConfigAgenda
  onCerrar: () => void
  /** Devuelve si se guardó; si no, el diálogo queda abierto mostrando `error`. */
  onGuardar: (config: ConfigAgenda) => Promise<boolean>
  error: string | null
}

export function ModalConfigAgenda({ abierto, sede, config, onCerrar, onGuardar, error }: Props) {
  return (
    <Dialog open={abierto} onOpenChange={(o) => (!o ? onCerrar() : undefined)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        {/* Se monta de nuevo cada vez que se abre, así el borrador parte de la config vigente. */}
        {abierto ? (
          <Formulario sede={sede} config={config} onCerrar={onCerrar} onGuardar={onGuardar} errorGuardado={error} />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function errorDe(bloques: BloqueHorario[], propios: BloqueHorario[], puntual: boolean): string | null {
  const nombre = (b: BloqueHorario) => `${puntual ? "Día" : "Bloque"} ${propios.indexOf(b) + 1}`
  const sinFecha = propios.find((b) => puntual && !b.fecha)
  if (sinFecha) return `${nombre(sinFecha)}: elegí la fecha.`
  const sinDias = propios.find((b) => !puntual && b.dias.length === 0)
  if (sinDias) return `${nombre(sinDias)}: elegí al menos un día.`
  const sinRango = propios.find((b) => aMinutos(b.hasta) <= aMinutos(b.desde))
  if (sinRango) return `${nombre(sinRango)}: el cierre tiene que ser posterior a la apertura.`
  return bloquesSuperpuestos(bloques)
}

function Formulario({
  sede,
  config,
  onCerrar,
  onGuardar,
  errorGuardado,
}: Omit<Props, "abierto" | "error"> & { errorGuardado: string | null }) {
  const [guardando, setGuardando] = useState(false)
  // Se edita la lista completa, pero sólo se muestran los bloques de la sede elegida.
  const [bloques, setBloques] = useState(config.bloques)
  const puntual = sede === "Tandil"
  const propios = bloques
    .filter((b) => b.sede === sede)
    .sort((a, b) => (a.fecha ?? "").localeCompare(b.fecha ?? ""))
  const error = errorDe(bloques, propios, puntual)

  const cambiar = (id: string, cambios: Partial<BloqueHorario>) =>
    setBloques((bs) => bs.map((b) => (b.id === id ? { ...b, ...cambios } : b)))

  const alternarDia = (b: BloqueHorario, dia: number) =>
    cambiar(b.id, {
      dias: b.dias.includes(dia) ? b.dias.filter((d) => d !== dia) : [...b.dias, dia],
    })

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading text-xl text-brand-dark">
          Configurar horarios · {sede}
        </DialogTitle>
        <DialogDescription>
          {puntual
            ? "Tandil se atiende sólo algunos días: cargá cada fecha en la que vas. La duración se elige en cada turno."
            : "Los bloques conviven: los extra no reemplazan al horario general. La duración se elige en cada turno."}{" "}
          Los turnos cargados fuera de un bloque se conservan, pero no se ven en la grilla.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {propios.length === 0 ? (
          <p className="rounded-xl border border-dashed border-input bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            {puntual ? "No hay días de atención cargados." : "No hay bloques cargados."}
          </p>
        ) : null}
        {propios.map((b, i) => (
          <fieldset key={b.id} className="space-y-4 rounded-xl border border-border p-3.5">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <legend className="text-sm font-medium text-brand-dark">
                  {puntual ? "Día" : "Bloque"} {i + 1}
                  {puntual && b.fecha ? ` · ${fechaCorta(b.fecha)}` : ""}
                </legend>
                <Input
                  className="h-10 sm:h-9"
                  aria-label={`Etiqueta del ${puntual ? "día" : "bloque"} ${i + 1}`}
                  value={b.etiqueta}
                  onChange={(e) => cambiar(b.id, { etiqueta: e.target.value })}
                  placeholder={puntual ? "Visita a Tandil…" : "Turnos generales, Turnos especiales…"}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 sm:h-9"
                onClick={() => setBloques((bs) => bs.filter((x) => x.id !== b.id))}
              >
                <Trash2 className="size-4" />
                {puntual ? "Quitar día" : "Quitar bloque"}
              </Button>
            </div>

            {puntual ? (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-brand-dark">Fecha</p>
                <Input
                  type="date"
                  className="h-10 sm:h-9"
                  aria-label={`Fecha del día ${i + 1}`}
                  value={b.fecha ?? ""}
                  onChange={(e) => cambiar(b.id, { fecha: e.target.value })}
                />
              </div>
            ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {DIAS_UI.map((dia) => {
                const activo = b.dias.includes(dia)
                return (
                  <button
                    key={dia}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => alternarDia(b, dia)}
                    className={cn(
                      "min-h-11 rounded-md border px-2 text-sm font-medium transition-colors",
                      activo
                        ? "border-transparent bg-brand-coral text-white"
                        : "border-brand-light bg-card text-brand-dark hover:bg-muted"
                    )}
                  >
                    {DIAS_CORTO[dia]}
                  </button>
                )
              })}
            </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-brand-dark">Desde</p>
                <SelectSimple
                  valor={b.desde}
                  onCambio={(v) => cambiar(b.id, { desde: v })}
                  opciones={OPCIONES_HORA}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-brand-dark">Hasta</p>
                <SelectSimple
                  valor={b.hasta}
                  onCambio={(v) => cambiar(b.id, { hasta: v })}
                  opciones={OPCIONES_HORA}
                />
              </div>
            </div>
          </fieldset>
        ))}

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full sm:h-9"
          onClick={() =>
            setBloques((bs) => [
              ...bs,
              puntual
                ? { id: nuevoId("bl"), sede, dias: [], fecha: aISO(new Date()), desde: "14:00", hasta: "19:00", etiqueta: "" }
                : { id: nuevoId("bl"), sede, dias: [], desde: "09:00", hasta: "12:00", etiqueta: "" },
            ])
          }
        >
          <Plus className="size-4" />
          {puntual ? "Agregar día de atención" : "Agregar bloque"}
        </Button>

        {error ?? errorGuardado ? (
          <p role="alert" className="text-sm text-destructive">
            {error ?? errorGuardado}
          </p>
        ) : null}
      </div>

      <DialogFooter>
        <Button variant="outline" className="h-11 sm:h-9" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button
          className="h-11 sm:h-9"
          disabled={error !== null || guardando}
          onClick={async () => {
            setGuardando(true)
            const ok = await onGuardar({ bloques })
            setGuardando(false)
            if (ok) onCerrar()
          }}
        >
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </>
  )
}
