import { useMemo, useState, type ReactNode } from "react"
import { AlertTriangle, ChevronLeft, ChevronRight, Plus, Settings2 } from "lucide-react"
import { cn } from "cn"

import { FilaScroll } from "@/components/FilaScroll"
import { ModalConfigAgenda } from "@/components/ModalConfigAgenda"
import { ModalTurno, type SlotElegido } from "@/components/ModalTurno"
import { Button } from "@/components/ui/button"
import { diasOrdenados, horariosDelDia } from "@/lib/agenda"
import { useFichero } from "@/lib/store"
import { SEDES, type Paciente, type Sede, type Turno } from "@/lib/tipos"
import { DIAS_CORTO, DIAS_LARGO, aISO, diaMes, lunesDe, sumarDias } from "@/lib/util"

/**
 * PENDIENTE DE CONFIRMAR CON LA CLIENTA: si el horario de atención es el mismo
 * en La Plata y Tandil o distinto por sede. Por ahora la configuración es una
 * sola y el selector de sede sólo separa los turnos. Si resulta que no hace
 * falta, se saca el selector y listo; si hace falta un horario por sede, la
 * config pasa a ser un Record<Sede, ConfigAgenda>.
 */

function nombreCorto(p: Paciente | undefined): string {
  return p ? `${p.apellido}, ${p.nombre.charAt(0)}.` : "—"
}

interface CeldaProps {
  turno: Turno | undefined
  paciente: Paciente | undefined
  hora: string
  onClick: () => void
  /** Lista (mobile) o celda de grilla (escritorio) */
  variante: "lista" | "grilla"
}

function Celda({ turno, paciente, hora, onClick, variante }: CeldaProps) {
  const estado = turno?.estado ?? "libre"

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${hora} hs, ${estado === "libre" ? "libre" : `${estado}, ${nombreCorto(paciente)}`}`}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border text-left text-sm transition-colors",
        variante === "lista" ? "min-h-14 px-3.5 py-2.5" : "min-h-12 px-2.5 py-1.5",
        estado === "libre" &&
          "border-border bg-card text-muted-foreground hover:border-brand-coral hover:bg-brand-coral-soft",
        estado === "ocupado" && "border-brand-coral bg-brand-coral font-medium text-[#3A3F47] hover:brightness-95",
        estado === "cancelado" &&
          "border-border bg-muted text-muted-foreground italic line-through hover:bg-muted/70",
        estado === "no-asistio" &&
          "border-brand-coral bg-card font-medium text-brand-dark hover:bg-brand-coral-soft"
      )}
    >
      {variante === "lista" ? (
        <span className="w-12 shrink-0 font-medium tabular-nums">{hora}</span>
      ) : null}
      <span className="min-w-0 flex-1 truncate">
        {estado === "libre" ? (
          <span className="inline-flex items-center gap-1 text-xs">
            <Plus className="size-3.5" />
            Libre
          </span>
        ) : (
          nombreCorto(paciente)
        )}
      </span>
      {estado === "no-asistio" ? (
        <AlertTriangle className="size-4 shrink-0 text-brand-coral" aria-hidden />
      ) : null}
    </button>
  )
}

export function Agenda() {
  const { turnos, pacientes, configAgenda, setConfigAgenda } = useFichero()
  const [sede, setSede] = useState<Sede>("La Plata")
  const [lunes, setLunes] = useState(() => lunesDe(new Date()))
  const [diaMobile, setDiaMobile] = useState(0)
  const [slot, setSlot] = useState<SlotElegido | null>(null)
  const [configAbierta, setConfigAbierta] = useState(false)

  const horarios = useMemo(() => horariosDelDia(configAgenda), [configAgenda])
  const dias = useMemo(
    () =>
      diasOrdenados(configAgenda).map((d) => {
        const fecha = sumarDias(lunes, (d + 6) % 7)
        return { dia: d, fecha, iso: aISO(fecha) }
      }),
    [configAgenda, lunes]
  )

  const porSlot = useMemo(() => {
    const m = new Map<string, Turno>()
    for (const t of turnos) if (t.sede === sede) m.set(`${t.fecha}|${t.hora}`, t)
    return m
  }, [turnos, sede])

  const pacientePorId = useMemo(() => new Map(pacientes.map((p) => [p.id, p])), [pacientes])

  const diaActivo = dias[Math.min(diaMobile, dias.length - 1)]
  const domingo = sumarDias(lunes, 6)
  const rango = `${diaMes(lunes)} – ${diaMes(domingo)} ${domingo.getFullYear()}`
  const esSemanaActual = aISO(lunes) === aISO(lunesDe(new Date()))

  const turnoSel = slot ? porSlot.get(`${slot.fecha}|${slot.hora}`) : undefined
  const horasTomadas = new Set(
    slot ? horarios.filter((h) => porSlot.has(`${slot.fecha}|${h}`)) : []
  )

  const celda = (iso: string, hora: string, variante: CeldaProps["variante"]) => {
    const turno = porSlot.get(`${iso}|${hora}`)
    return (
      <Celda
        key={`${iso}-${hora}`}
        turno={turno}
        paciente={turno ? pacientePorId.get(turno.pacienteId) : undefined}
        hora={hora}
        variante={variante}
        onClick={() => setSlot({ fecha: iso, hora })}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-brand-dark">Agenda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turnos de {sede} · {horarios.length} por día de atención
          </p>
        </div>
        <Button variant="outline" size="lg" className="h-10" onClick={() => setConfigAbierta(true)}>
          <Settings2 className="size-4" />
          Configurar horarios
        </Button>
      </div>

      {/* Sede + navegación de semana */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-lg border border-border bg-card p-1 sm:w-fit">
          <div className="flex items-center gap-1" role="group" aria-label="Sede">
            {SEDES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSede(s)}
                className={cn(
                  "flex-1 rounded-md px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors sm:flex-none sm:py-1.5",
                  sede === s
                    ? "bg-brand-coral text-[#3A3F47]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button
            variant="outline"
            className="size-11 sm:size-9"
            aria-label="Semana anterior"
            onClick={() => setLunes((l) => sumarDias(l, -7))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="min-w-0 text-center sm:min-w-44">
            <p className="text-sm font-medium text-brand-dark tabular-nums">{rango}</p>
            {esSemanaActual ? (
              <p className="text-xs text-muted-foreground">Esta semana</p>
            ) : (
              <button
                type="button"
                className="p-1 text-xs text-muted-foreground underline underline-offset-2"
                onClick={() => setLunes(lunesDe(new Date()))}
              >
                Volver a hoy
              </button>
            )}
          </div>
          <Button
            variant="outline"
            className="size-11 sm:size-9"
            aria-label="Semana siguiente"
            onClick={() => setLunes((l) => sumarDias(l, 7))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Referencias de color */}
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <Leyenda clase="border-border bg-card">Libre</Leyenda>
        <Leyenda clase="border-brand-coral bg-brand-coral">Ocupado</Leyenda>
        <Leyenda clase="border-border bg-muted">Cancelado</Leyenda>
        <Leyenda clase="border-brand-coral bg-card">No asistió</Leyenda>
      </ul>

      {dias.length === 0 || horarios.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-14 text-center">
          <p className="font-heading text-lg text-brand-dark">No hay horarios configurados</p>
        </div>
      ) : (
        <>
          {/* Grilla semanal — escritorio */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card p-3 md:block">
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `4rem repeat(${dias.length}, minmax(9rem, 1fr))` }}
            >
              <div />
              {dias.map(({ dia, fecha, iso }) => (
                <div key={iso} className="pb-1 text-center">
                  <p className="text-sm font-medium text-brand-dark">{DIAS_LARGO[dia]}</p>
                  <p className="text-xs text-muted-foreground">{diaMes(fecha)}</p>
                </div>
              ))}
              {horarios.map((hora) => (
                <FilaHora key={hora} hora={hora}>
                  {dias.map(({ iso }) => celda(iso, hora, "grilla"))}
                </FilaHora>
              ))}
            </div>
          </div>

          {/* Un día por vez — mobile */}
          <div className="space-y-3 md:hidden">
            <div className="rounded-lg border border-border bg-card p-1">
              <FilaScroll etiqueta="Elegir día">
                <div className="flex w-max min-w-full gap-1" role="tablist">
                  {dias.map(({ dia, fecha, iso }, i) => (
                    <button
                      key={iso}
                      type="button"
                      role="tab"
                      aria-selected={diaActivo.iso === iso}
                      onClick={() => setDiaMobile(i)}
                      className={cn(
                        "min-h-12 flex-1 rounded-md px-3 py-1.5 text-center transition-colors",
                        diaActivo.iso === iso
                          ? "bg-brand-coral text-[#3A3F47]"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <span className="block text-sm font-medium">{DIAS_CORTO[dia]}</span>
                      <span className="block text-xs">{diaMes(fecha)}</span>
                    </button>
                  ))}
                </div>
              </FilaScroll>
            </div>
            <div className="space-y-2">
              {horarios.map((hora) => celda(diaActivo.iso, hora, "lista"))}
            </div>
          </div>
        </>
      )}

      <ModalTurno
        slot={slot}
        sede={sede}
        turno={turnoSel}
        horarios={horarios}
        horasTomadas={horasTomadas}
        onCerrar={() => setSlot(null)}
      />
      <ModalConfigAgenda
        abierto={configAbierta}
        config={configAgenda}
        onCerrar={() => setConfigAbierta(false)}
        onGuardar={setConfigAgenda}
      />
    </div>
  )
}

function FilaHora({ hora, children }: { hora: string; children: ReactNode }) {
  return (
    <>
      <div className="flex items-center justify-end pr-2 text-xs font-medium text-muted-foreground tabular-nums">
        {hora}
      </div>
      {children}
    </>
  )
}

function Leyenda({ clase, children }: { clase: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={cn("size-3 rounded-sm border", clase)} />
      {children}
    </li>
  )
}
