import { useState } from "react"
import { AlertTriangle, Ban, Pencil, RotateCcw, Trash2 } from "lucide-react"

import { BuscadorPaciente } from "@/components/BuscadorPaciente"
import { IconoWhatsApp } from "@/components/IconoWhatsApp"
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
import {
  PASO_MIN,
  aMinutos,
  bloqueEn,
  deMinutos,
  enlaceWhatsAppTurno,
  espacioLibre,
  finTurno,
} from "@/lib/agenda"
import { useFichero } from "@/lib/store"
import { DURACIONES, esArmonizacion, type EstadoTurno, type Sede, type Turno } from "@/lib/tipos"
import { fechaConDia, formatoDNI } from "@/lib/util"

export interface SlotElegido {
  fecha: string
  hora: string
}

interface Props {
  slot: SlotElegido | null
  sede: Sede
  turno: Turno | undefined
  onCerrar: () => void
}

const ETIQUETA_ESTADO: Record<EstadoTurno, string> = {
  ocupado: "Confirmado",
  cancelado: "Cancelado",
  "no-asistio": "No asistió",
}

/** La duración más larga de la lista que entra en `libre` minutos, o la preferida si entra. */
function duracionQueEntra(libre: number, preferida: number): number {
  if (preferida <= libre) return preferida
  return [...DURACIONES].reverse().find((d) => d <= libre) ?? 0
}

const opcionesDuracion = (hasta: number) =>
  DURACIONES.filter((d) => d <= hasta).map((d) => ({ valor: String(d), etiqueta: `${d} min` }))

export function ModalTurno({ slot, sede, turno, onCerrar }: Props) {
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
            onCerrar={onCerrar}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function Contenido({ slot, sede, turno, onCerrar }: Omit<Props, "slot"> & { slot: SlotElegido }) {
  const { pacientes, turnos, configAgenda, agregarTurno, actualizarTurno, eliminarTurno } =
    useFichero()
  const [editando, setEditando] = useState(false)
  const [duracion, setDuracion] = useState(30)

  const paciente = turno ? pacientes.find((p) => p.id === turno.pacienteId) : undefined
  const inicio = aMinutos(slot.hora)
  const bloque = bloqueEn(configAgenda, sede, slot.fecha, inicio)
  const cuando = `${fechaConDia(slot.fecha)} · ${slot.hora} hs · ${sede}`

  // Asignar un horario libre: la duración se elige para este turno puntual.
  if (!turno) {
    const libre = bloque ? espacioLibre(turnos, sede, slot.fecha, inicio, bloque) : 0
    const opciones = opcionesDuracion(libre)
    const duracionElegida = duracionQueEntra(libre, duracion)

    return (
      <>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-brand-dark">Asignar turno</DialogTitle>
          <DialogDescription>{cuando}</DialogDescription>
        </DialogHeader>

        {opciones.length === 0 ? (
          <p role="alert" className="text-sm text-destructive">
            No hay lugar a esa hora: se superpondría con otro turno o con el cierre del bloque.
          </p>
        ) : (
          <>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-brand-dark">Duración</p>
              <SelectSimple
                valor={String(duracionElegida)}
                onCambio={(v) => setDuracion(Number(v))}
                opciones={opciones}
              />
              <p className="text-xs text-muted-foreground tabular-nums">
                {slot.hora} – {deMinutos(inicio + duracionElegida)} hs · hay {libre} min libres desde
                esa hora.
              </p>
            </div>
            <BuscadorPaciente
              onElegir={(p) => {
                agregarTurno({
                  pacienteId: p.id,
                  sede,
                  fecha: slot.fecha,
                  hora: slot.hora,
                  duracion: duracionElegida,
                  estado: "ocupado",
                })
                onCerrar()
              }}
            />
          </>
        )}
      </>
    )
  }

  // Cambiar de paciente, de horario o de duración
  if (editando) {
    const bloqueTurno = bloqueEn(configAgenda, sede, slot.fecha, inicio)
    const libreDesde = (min: number) =>
      bloqueTurno ? espacioLibre(turnos, sede, slot.fecha, min, bloqueTurno, turno.id) : 0

    const inicios: number[] = []
    if (bloqueTurno) {
      for (let m = aMinutos(bloqueTurno.desde); m + PASO_MIN <= aMinutos(bloqueTurno.hasta); m += PASO_MIN) {
        if (libreDesde(m) >= PASO_MIN) inicios.push(m)
      }
    }

    return (
      <>
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-brand-dark">Editar turno</DialogTitle>
          <DialogDescription>{cuando}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-brand-dark">Horario</p>
            <SelectSimple
              valor={turno.hora}
              onCambio={(h) => {
                const nuevaDuracion = duracionQueEntra(libreDesde(aMinutos(h)), turno.duracion)
                actualizarTurno(turno.id, { hora: h, duracion: nuevaDuracion })
                onCerrar()
              }}
              opciones={inicios.map((m) => ({ valor: deMinutos(m), etiqueta: `${deMinutos(m)} hs` }))}
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-brand-dark">Duración</p>
            <SelectSimple
              valor={String(turno.duracion)}
              onCambio={(v) => {
                actualizarTurno(turno.id, { duracion: Number(v) })
                onCerrar()
              }}
              opciones={opcionesDuracion(libreDesde(inicio))}
            />
          </div>
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
        <p className="text-sm text-muted-foreground tabular-nums">
          {turno.hora} – {deMinutos(finTurno(turno))} hs · {turno.duracion} min
        </p>
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
            {paciente ? (
              <Button
                variant="outline"
                className="h-11"
                nativeButton={false}
                render={
                  <a
                    href={enlaceWhatsAppTurno(paciente, turno)}
                    target="_blank"
                    rel="noreferrer noopener"
                  />
                }
              >
                <IconoWhatsApp className="size-4" />
                Enviar por WhatsApp
              </Button>
            ) : null}
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
