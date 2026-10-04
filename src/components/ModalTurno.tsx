import { useState } from "react"
import { AlertTriangle, Ban, Pencil, RotateCcw, Trash2 } from "lucide-react"

import { BuscadorPaciente } from "@/components/BuscadorPaciente"
import { SelectSimple } from "@/components/campos"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useFichero } from "@/lib/store"
import { esArmonizacion, type EstadoTurno, type Sede, type Turno } from "@/lib/tipos"
import { fechaConDia, formatoDNI } from "@/lib/util"

export interface SlotElegido {
  fecha: string
  hora: string
}

interface Props {
  slot: SlotElegido | null
  sede: Sede
  turno: Turno | undefined
  /** Horarios del día de la grilla, para poder mover el turno. */
  horarios: string[]
  /** Horas del mismo día/sede que ya están tomadas por otro turno. */
  horasTomadas: Set<string>
  onCerrar: () => void
}

const ETIQUETA_ESTADO: Record<EstadoTurno, string> = {
  ocupado: "Confirmado",
  cancelado: "Cancelado",
  "no-asistio": "No asistió",
}

export function ModalTurno({ slot, sede, turno, horarios, horasTomadas, onCerrar }: Props) {
  return (
    <Dialog open={slot !== null} onOpenChange={(o) => (!o ? onCerrar() : undefined)}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        {/* key: al cambiar de slot/turno se reinicia el modo interno */}
        {slot ? (
          <Contenido
            key={`${slot.fecha}-${slot.hora}-${turno?.id ?? "libre"}`}
            slot={slot}
            sede={sede}
            turno={turno}
            horarios={horarios}
            horasTomadas={horasTomadas}
            onCerrar={onCerrar}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function Contenido({
  slot,
  sede,
  turno,
  horarios,
  horasTomadas,
  onCerrar,
}: Omit<Props, "slot"> & { slot: SlotElegido }) {
  const { pacientes, agregarTurno, actualizarTurno, eliminarTurno } = useFichero()
  const [editando, setEditando] = useState(false)

  const paciente = turno ? pacientes.find((p) => p.id === turno.pacienteId) : undefined
  const cuando = `${fechaConDia(slot.fecha)} · ${slot.hora} hs · ${sede}`

  // Asignar un slot libre
  if (!turno) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-brand-dark">Asignar turno</DialogTitle>
          <DialogDescription>{cuando}</DialogDescription>
        </DialogHeader>
        <BuscadorPaciente
          onElegir={(p) => {
            agregarTurno({ pacienteId: p.id, sede, fecha: slot.fecha, hora: slot.hora, estado: "ocupado" })
            onCerrar()
          }}
        />
      </>
    )
  }

  // Cambiar de paciente o de horario
  if (editando) {
    const opcionesHora = horarios.filter((h) => h === turno.hora || !horasTomadas.has(h))
    return (
      <>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-brand-dark">Editar turno</DialogTitle>
          <DialogDescription>{cuando}</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-brand-dark">Horario</p>
          <SelectSimple
            valor={turno.hora}
            onCambio={(h) => {
              actualizarTurno(turno.id, { hora: h })
              onCerrar()
            }}
            opciones={opcionesHora.map((h) => ({ valor: h, etiqueta: `${h} hs` }))}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-brand-dark">Paciente</p>
          <BuscadorPaciente
            seleccionadoId={turno.pacienteId}
            onElegir={(p) => {
              actualizarTurno(turno.id, { pacienteId: p.id })
              onCerrar()
            }}
          />
        </div>

        <Button variant="outline" className="h-11" onClick={() => setEditando(false)}>
          Volver
        </Button>
      </>
    )
  }

  // Detalle
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading text-xl text-brand-dark">Turno</DialogTitle>
        <DialogDescription>{cuando}</DialogDescription>
      </DialogHeader>

      <div className="space-y-1 rounded-lg border border-border p-3.5">
        <p className="text-base font-medium text-brand-dark">
          {paciente ? `${paciente.apellido}, ${paciente.nombre}` : "Paciente eliminado"}
        </p>
        {paciente ? (
          <p className="text-sm text-muted-foreground tabular-nums">DNI {formatoDNI(paciente.dni)}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 pt-1.5">
          {paciente ? (
            <Badge variant={esArmonizacion(paciente.categoria) ? "secondary" : "default"}>
              {paciente.categoria}
            </Badge>
          ) : null}
          <Badge variant="outline">{ETIQUETA_ESTADO[turno.estado]}</Badge>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" className="h-11" onClick={() => setEditando(true)}>
          <Pencil className="size-4" />
          Editar
        </Button>
        {turno.estado === "ocupado" ? (
          <>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => {
                actualizarTurno(turno.id, { estado: "no-asistio" })
                onCerrar()
              }}
            >
              <AlertTriangle className="size-4" />
              No asistió
            </Button>
            <Button
              variant="destructive"
              className="h-11 sm:col-span-2"
              onClick={() => {
                actualizarTurno(turno.id, { estado: "cancelado" })
                onCerrar()
              }}
            >
              <Ban className="size-4" />
              Cancelar turno
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className="h-11"
              onClick={() => {
                actualizarTurno(turno.id, { estado: "ocupado" })
                onCerrar()
              }}
            >
              <RotateCcw className="size-4" />
              Reactivar
            </Button>
            <Button
              variant="destructive"
              className="h-11 sm:col-span-2"
              onClick={() => {
                eliminarTurno(turno.id)
                onCerrar()
              }}
            >
              <Trash2 className="size-4" />
              Liberar horario
            </Button>
          </>
        )}
      </div>
    </>
  )
}
