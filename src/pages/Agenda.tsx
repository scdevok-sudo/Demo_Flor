import { useMemo, useState, type ReactNode } from "react"
import { AlertTriangle, ChevronLeft, ChevronRight, Settings2 } from "lucide-react"
import { cn } from "cn"

import { FilaScroll } from "@/components/FilaScroll"
import { ModalConfigAgenda } from "@/components/ModalConfigAgenda"
import { ModalTurno, type SlotElegido } from "@/components/ModalTurno"
import { Button } from "@/components/ui/button"
import {
  PASO_MIN,
  aMinutos,
  bloquesDelDia,
  deMinutos,
  finTurno,
} from "@/lib/agenda"
import { useAgenda } from "@/data/useAgenda"
import { useFichero } from "@/lib/store"
import { SEDES, type BloqueHorario, type Paciente, type Sede, type Turno } from "@/lib/tipos"
import { DIAS_CORTO, DIAS_LARGO, aISO, diaMes, lunesDe, sumarDias } from "@/lib/util"

/**
 * Cada sede tiene su propio horario: La Plata atiende todas las semanas
 * (bloques por día de la semana) y Tandil sólo los días puntuales que ella carga.
 */

/** Alto en píxeles de cada minuto de la línea de tiempo: un turno de 45 min es 3 veces uno de 15. */
const PX_POR_MIN = 2

function nombreCorto(p: Paciente | undefined): string {
  return p ? `${p.apellido}, ${p.nombre.charAt(0)}.` : "—"
}

function BloqueTurno({
  turno,
  paciente,
  inicioBloque,
  onClick,
}: {
  turno: Turno
  paciente: Paciente | undefined
  inicioBloque: number
  onClick: () => void
}) {
  const estado = turno.estado
  const corto = turno.duracion < 30

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${turno.hora} hs, ${turno.duracion} minutos, ${estado}, ${nombreCorto(paciente)}`}
      style={{
        top: (aMinutos(turno.hora) - inicioBloque) * PX_POR_MIN + 1,
        height: turno.duracion * PX_POR_MIN - 2,
      }}
      className={cn(
        "absolute right-1 left-11 z-10 flex overflow-hidden rounded-md border px-2 text-left text-xs transition-colors",
        corto ? "items-center gap-1.5" : "flex-col justify-start gap-0.5 py-1",
        estado === "ocupado" && "border-brand-coral bg-brand-coral font-medium text-[#3A3F47] hover:brightness-95",
        estado === "cancelado" &&
          "border-border bg-muted text-muted-foreground italic line-through hover:bg-muted/70",
        estado === "no-asistio" &&
          "border-brand-coral bg-card font-medium text-brand-dark hover:bg-brand-coral-soft"
      )}
    >
      <span className="flex w-full min-w-0 items-center gap-1">
        <span className="min-w-0 flex-1 truncate">{nombreCorto(paciente)}</span>
        {estado === "no-asistio" ? (
          <AlertTriangle className="size-3.5 shrink-0 text-brand-coral" aria-hidden />
        ) : null}
      </span>
      <span className="shrink-0 text-[10px] font-normal tabular-nums opacity-80">
        {corto ? turno.hora : `${turno.hora} – ${deMinutos(finTurno(turno))} · ${turno.duracion} min`}
      </span>
    </button>
  )
}

/**
 * Un bloque horario como línea de tiempo continua: cada turno se posiciona por
 * su hora de inicio y su alto es proporcional a la duración. Los huecos son
 * botones de 15 minutos para crear un turno nuevo.
 */
function LineaDeTiempo({
  bloque,
  iso,
  turnos,
  pacientePorId,
  onElegir,
}: {
  bloque: BloqueHorario
  iso: string
  turnos: Turno[]
  pacientePorId: Map<string, Paciente>
  onElegir: (slot: SlotElegido) => void
}) {
  const desde = aMinutos(bloque.desde)
  const hasta = aMinutos(bloque.hasta)
  const enBloque = turnos.filter((t) => {
    const ini = aMinutos(t.hora)
    return ini >= desde && ini < hasta
  })

  const huecos: number[] = []
  for (let m = desde; m + PASO_MIN <= hasta; m += PASO_MIN) {
    if (!enBloque.some((t) => m >= aMinutos(t.hora) && m < finTurno(t))) huecos.push(m)
  }

  const marcas: number[] = []
  for (let m = desde; m < hasta; m += 30) marcas.push(m)

  return (
    <section aria-label={bloque.etiqueta || `${bloque.desde} a ${bloque.hasta}`} className="space-y-1.5">
      <p className="flex items-baseline justify-between gap-2 text-xs">
        <span className="min-w-0 truncate font-medium text-brand-dark">
          {bloque.etiqueta || "Sin etiqueta"}
        </span>
        <span className="shrink-0 text-muted-foreground tabular-nums">
          {bloque.desde}–{bloque.hasta}
        </span>
      </p>
      <div
        className="relative overflow-hidden rounded-lg border border-border bg-card"
        style={{ height: (hasta - desde) * PX_POR_MIN }}
      >
        {marcas.map((m) => (
          <div
            key={m}
            aria-hidden
            className={cn(
              "pointer-events-none absolute right-0 left-0 border-t",
              m % 60 === 0 ? "border-border" : "border-border/50 border-dashed"
            )}
            style={{ top: (m - desde) * PX_POR_MIN }}
          >
            <span className="absolute top-0.5 left-1.5 text-[10px] text-muted-foreground tabular-nums">
              {deMinutos(m)}
            </span>
          </div>
        ))}

        {huecos.map((m) => (
          <button
            key={m}
            type="button"
            aria-label={`Libre ${deMinutos(m)} hs`}
            onClick={() => onElegir({ fecha: iso, hora: deMinutos(m) })}
            style={{ top: (m - desde) * PX_POR_MIN, height: PASO_MIN * PX_POR_MIN }}
            className="group absolute right-0 left-11 flex items-center rounded-sm px-2 text-[10px] text-transparent transition-colors hover:bg-brand-coral-soft hover:text-brand-dark focus-visible:bg-brand-coral-soft focus-visible:text-brand-dark"
          >
            + Turno {deMinutos(m)}
          </button>
        ))}

        {enBloque.map((t) => (
          <BloqueTurno
            key={t.id}
            turno={t}
            paciente={pacientePorId.get(t.pacienteId)}
            inicioBloque={desde}
            onClick={() => onElegir({ fecha: iso, hora: t.hora })}
          />
        ))}
      </div>
    </section>
  )
}

export function Agenda() {
  const { pacientes } = useFichero()
  const [sede, setSede] = useState<Sede>("La Plata")
  const [lunes, setLunes] = useState(() => lunesDe(new Date()))
  const agenda = useAgenda(aISO(lunes), aISO(sumarDias(lunes, 6)))
  const { turnos, config: configAgenda } = agenda
  const [diaMobile, setDiaMobile] = useState(0)
  const [slot, setSlot] = useState<SlotElegido | null>(null)
  const [configAbierta, setConfigAbierta] = useState(false)

  // Sólo los días de la semana en que la sede tiene algún bloque.
  const dias = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const fecha = sumarDias(lunes, i)
        return { dia: fecha.getDay(), fecha, iso: aISO(fecha) }
      }).filter((d) => bloquesDelDia(configAgenda, sede, d.iso).length > 0),
    [configAgenda, lunes, sede]
  )

  const turnosDeSede = useMemo(() => turnos.filter((t) => t.sede === sede), [turnos, sede])
  const pacientePorId = useMemo(() => new Map(pacientes.map((p) => [p.id, p])), [pacientes])

  const diaActivo = dias[Math.min(diaMobile, dias.length - 1)]
  const domingo = sumarDias(lunes, 6)
  const rango = `${diaMes(lunes)} – ${diaMes(domingo)} ${domingo.getFullYear()}`
  const esSemanaActual = aISO(lunes) === aISO(lunesDe(new Date()))

  const turnoSel = slot
    ? turnosDeSede.find((t) => t.fecha === slot.fecha && t.hora === slot.hora)
    : undefined

  const semana = new Set(dias.map((d) => d.iso))
  const cantidadSemana = turnosDeSede.filter((t) => semana.has(t.fecha)).length

  /** Los bloques de un día, cada uno con su línea de tiempo. */
  const bloquesDe = (iso: string): ReactNode => {
    const delDia = turnosDeSede.filter((t) => t.fecha === iso)
    return (
      <div className="space-y-3">
        {bloquesDelDia(configAgenda, sede, iso).map((b) => (
          <LineaDeTiempo
            key={b.id}
            bloque={b}
            iso={iso}
            turnos={delDia}
            pacientePorId={pacientePorId}
            onElegir={setSlot}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-brand-dark">Agenda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turnos de {sede} · {cantidadSemana} {cantidadSemana === 1 ? "turno" : "turnos"} esta semana
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

      {agenda.error && !slot && !configAbierta ? (
        <p role="alert" className="text-sm text-destructive">{agenda.error}</p>
      ) : null}

      {agenda.cargando ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Cargando agenda…</p>
      ) : dias.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-5 py-14 text-center">
          <p className="font-heading text-lg text-brand-dark">
            {sede} no tiene días de atención esta semana
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cargá los días desde «Configurar horarios».
          </p>
        </div>
      ) : (
        <>
          {/* Semana — escritorio */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card p-3 md:block">
            <div
              // Ancho mínimo por día: tablet vertical ~3-4 días con scroll, tablet horizontal la semana entera.
              className="grid items-start gap-3 [--col:10rem] lg:[--col:9rem] xl:[--col:11rem]"
              style={{ gridTemplateColumns: `repeat(${dias.length}, minmax(var(--col), 1fr))` }}
            >
              {dias.map(({ dia, fecha, iso }) => (
                <div key={iso} className="space-y-2">
                  <div className="text-center">
                    <p className="text-sm font-medium text-brand-dark">{DIAS_LARGO[dia]}</p>
                    <p className="text-xs text-muted-foreground">{diaMes(fecha)}</p>
                  </div>
                  {bloquesDe(iso)}
                </div>
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
            {bloquesDe(diaActivo.iso)}
          </div>
        </>
      )}

      <ModalTurno
        slot={slot}
        sede={sede}
        turno={turnoSel}
        agenda={agenda}
        onCerrar={() => setSlot(null)}
      />
      <ModalConfigAgenda
        abierto={configAbierta}
        sede={sede}
        config={configAgenda}
        onCerrar={() => setConfigAbierta(false)}
        error={agenda.error}
        onGuardar={agenda.guardarConfig}
      />
    </div>
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
