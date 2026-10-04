import { useState } from "react"
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
import { aMinutos, deMinutos, horariosDelDia } from "@/lib/agenda"
import { DURACIONES, type ConfigAgenda } from "@/lib/tipos"
import { DIAS_CORTO } from "@/lib/util"

/** Lun → Dom, con su número de Date.getDay. */
const DIAS_UI = [1, 2, 3, 4, 5, 6, 0]

/** 00:00, 00:30 … 23:30 — en 24 hs, sin depender del locale del navegador. */
const HORAS = Array.from({ length: 48 }, (_, i) => deMinutos(i * 30))

interface Props {
  abierto: boolean
  config: ConfigAgenda
  onCerrar: () => void
  onGuardar: (config: ConfigAgenda) => void
}

export function ModalConfigAgenda({ abierto, config, onCerrar, onGuardar }: Props) {
  return (
    <Dialog open={abierto} onOpenChange={(o) => (!o ? onCerrar() : undefined)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        {/* Se monta de nuevo cada vez que se abre, así el borrador parte de la config vigente. */}
        {abierto ? <Formulario config={config} onCerrar={onCerrar} onGuardar={onGuardar} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function Formulario({
  config,
  onCerrar,
  onGuardar,
}: Omit<Props, "abierto">) {
  const [borrador, setBorrador] = useState(config)

  const error =
    borrador.dias.length === 0
      ? "Elegí al menos un día de atención."
      : aMinutos(borrador.hasta) <= aMinutos(borrador.desde)
        ? "El horario de cierre tiene que ser posterior al de apertura."
        : horariosDelDia(borrador).length === 0
          ? "El horario no alcanza para un turno de esa duración."
          : null

  const alternarDia = (dia: number) =>
    setBorrador((b) => ({
      ...b,
      dias: b.dias.includes(dia) ? b.dias.filter((d) => d !== dia) : [...b.dias, dia],
    }))

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading text-xl text-brand-dark">Configurar horarios</DialogTitle>
        <DialogDescription>
          La grilla de la agenda se arma con estos valores. Los turnos ya cargados fuera del nuevo
          horario se conservan, pero no se ven en la grilla.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-brand-dark">Días de atención</legend>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {DIAS_UI.map((dia) => {
              const activo = borrador.dias.includes(dia)
              return (
                <button
                  key={dia}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => alternarDia(dia)}
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
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-brand-dark">Desde</p>
            <SelectSimple
              valor={borrador.desde}
              onCambio={(v) => setBorrador({ ...borrador, desde: v })}
              opciones={HORAS.map((h) => ({ valor: h, etiqueta: `${h} hs` }))}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-brand-dark">Hasta</p>
            <SelectSimple
              valor={borrador.hasta}
              onCambio={(v) => setBorrador({ ...borrador, hasta: v })}
              opciones={HORAS.map((h) => ({ valor: h, etiqueta: `${h} hs` }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-brand-dark">Duración del turno</p>
          <SelectSimple
            valor={String(borrador.duracion)}
            onCambio={(v) => setBorrador({ ...borrador, duracion: Number(v) })}
            opciones={DURACIONES.map((d) => ({ valor: String(d), etiqueta: `${d} minutos` }))}
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {horariosDelDia(borrador).length} turnos por día · {horariosDelDia(borrador).length * borrador.dias.length} por semana
          </p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" className="h-11 sm:h-9" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button
          className="h-11 sm:h-9"
          disabled={error !== null}
          onClick={() => {
            onGuardar(borrador)
            onCerrar()
          }}
        >
          Guardar
        </Button>
      </DialogFooter>
    </>
  )
}
