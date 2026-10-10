import {
  COLUMNAS_BLOQUES as CB,
  COLUMNAS_JORNADAS as CJ,
  COLUMNAS_TURNOS as CT,
  TABLA_BLOQUES,
  TABLA_JORNADAS,
  TABLA_TURNOS,
} from "@/data/constantes"
import { supabase } from "@/lib/supabase"
import type { BloqueHorario, ConfigAgenda, EstadoTurno, Sede, Turno } from "@/lib/tipos"

type Fila = Record<string, unknown>
type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string }

const ERROR_GUARDAR = "No se pudo guardar. Revisá tu conexión e intentá de nuevo."

const SEDE_A_DB: Record<Sede, string> = { "La Plata": "la_plata", Tandil: "tandil" }
const SEDE_DE_DB: Record<string, Sede> = { la_plata: "La Plata", tandil: "Tandil" }

const ESTADO_A_DB: Record<EstadoTurno, string> = {
  ocupado: "ocupado",
  cancelado: "cancelado",
  "no-asistio": "no_asistio",
}
const ESTADO_DE_DB: Record<string, EstadoTurno> = {
  ocupado: "ocupado",
  cancelado: "cancelado",
  no_asistio: "no-asistio",
}

/** «14:00:00» -> «14:00» */
const hhmm = (v: unknown) => String(v ?? "").slice(0, 5)
const texto = (v: unknown) => (typeof v === "string" ? v : "")

// ---- Horarios: La Plata (bloques recurrentes) y Tandil (jornadas puntuales) ------------

function aBloque(f: Fila): BloqueHorario {
  return {
    id: String(f[CB.id]),
    sede: "La Plata",
    dias: ((f[CB.dias] as number[] | null) ?? []).map(Number),
    desde: hhmm(f[CB.horaDesde]),
    hasta: hhmm(f[CB.horaHasta]),
    etiqueta: texto(f[CB.etiqueta]),
  }
}

function aJornada(f: Fila): BloqueHorario {
  return {
    id: String(f[CJ.id]),
    sede: "Tandil",
    dias: [],
    fecha: texto(f[CJ.fecha]).slice(0, 10),
    desde: hhmm(f[CJ.horaDesde]),
    hasta: hhmm(f[CJ.horaHasta]),
    etiqueta: texto(f[CJ.etiqueta]),
  }
}

export async function cargarConfig(): Promise<Resultado<ConfigAgenda>> {
  const [bloques, jornadas] = await Promise.all([
    supabase.from(TABLA_BLOQUES).select("*").eq(CB.sede, "la_plata"),
    supabase.from(TABLA_JORNADAS).select("*"),
  ])
  if (bloques.error || jornadas.error) {
    return { ok: false, error: "No se pudieron cargar los horarios de atención." }
  }
  return {
    ok: true,
    valor: {
      bloques: [...(bloques.data as Fila[]).map(aBloque), ...(jornadas.data as Fila[]).map(aJornada)],
    },
  }
}

function filaBloque(b: BloqueHorario): Fila {
  return {
    [CB.sede]: "la_plata",
    [CB.dias]: b.dias,
    [CB.horaDesde]: b.desde,
    [CB.horaHasta]: b.hasta,
    [CB.etiqueta]: b.etiqueta.trim() || null,
  }
}

function filaJornada(b: BloqueHorario): Fila {
  return {
    [CJ.fecha]: b.fecha,
    [CJ.horaDesde]: b.desde,
    [CJ.horaHasta]: b.hasta,
    [CJ.etiqueta]: b.etiqueta.trim() || null,
  }
}

const igual = (a: BloqueHorario, b: BloqueHorario) =>
  a.desde === b.desde &&
  a.hasta === b.hasta &&
  a.etiqueta.trim() === b.etiqueta.trim() &&
  (a.fecha ?? "") === (b.fecha ?? "") &&
  [...a.dias].sort().join() === [...b.dias].sort().join()

/**
 * Lleva la base de `actual` a `nueva`: borra lo que se quitó, actualiza lo que
 * cambió e inserta lo nuevo (las filas nuevas todavía no están en `actual`).
 * Los turnos ya cargados no se tocan.
 */
export async function guardarConfig(
  actual: BloqueHorario[],
  nueva: BloqueHorario[]
): Promise<Resultado<null>> {
  const tabla = (b: BloqueHorario) => (b.sede === "Tandil" ? TABLA_JORNADAS : TABLA_BLOQUES)
  const fila = (b: BloqueHorario) => (b.sede === "Tandil" ? filaJornada(b) : filaBloque(b))

  for (const b of actual.filter((a) => !nueva.some((n) => n.id === a.id))) {
    const { error } = await supabase.from(tabla(b)).delete().eq("id", b.id)
    if (error) return { ok: false, error: ERROR_GUARDAR }
  }
  for (const b of nueva) {
    const previo = actual.find((a) => a.id === b.id)
    if (previo && igual(previo, b)) continue
    const { error } = previo
      ? await supabase.from(tabla(b)).update(fila(b)).eq("id", b.id)
      : await supabase.from(tabla(b)).insert(fila(b))
    if (error) return { ok: false, error: ERROR_GUARDAR }
  }
  return { ok: true, valor: null }
}

// ---- Turnos ---------------------------------------------------------------------------

function aTurno(f: Fila): Turno | null {
  const estado = ESTADO_DE_DB[texto(f[CT.estado])]
  const pacienteId = f[CT.pacienteId]
  // Un horario «libre» es la ausencia de turno: no se modela como fila.
  if (!estado || typeof pacienteId !== "string") return null
  return {
    id: String(f[CT.id]),
    pacienteId,
    sede: SEDE_DE_DB[texto(f[CT.sede])] ?? "La Plata",
    fecha: texto(f[CT.fecha]).slice(0, 10),
    hora: hhmm(f[CT.horaInicio]),
    duracion: Number(f[CT.duracion]),
    estado,
  }
}

const aTurnos = (filas: Fila[]) => filas.map(aTurno).filter((t): t is Turno => t !== null)

/** Turnos de las dos sedes entre dos fechas (AAAA-MM-DD, ambas incluidas). */
export async function listarTurnos(desde: string, hasta: string): Promise<Resultado<Turno[]>> {
  const { data, error } = await supabase
    .from(TABLA_TURNOS)
    .select("*")
    .gte(CT.fecha, desde)
    .lte(CT.fecha, hasta)
    .order(CT.horaInicio)
  if (error) return { ok: false, error: "No se pudieron cargar los turnos." }
  return { ok: true, valor: aTurnos(data as Fila[]) }
}

/** Turnos confirmados del paciente desde hoy (y desde `hora` si es hoy). */
export async function proximosDe(
  pacienteId: string,
  hoy: string,
  hora: string
): Promise<Resultado<Turno[]>> {
  const { data, error } = await supabase
    .from(TABLA_TURNOS)
    .select("*")
    .eq(CT.pacienteId, pacienteId)
    .eq(CT.estado, "ocupado")
    .gte(CT.fecha, hoy)
    .order(CT.fecha)
    .order(CT.horaInicio)
  if (error) return { ok: false, error: "No se pudieron cargar los turnos." }
  const lista = aTurnos(data as Fila[]).filter((t) => t.fecha > hoy || t.hora >= hora)
  return { ok: true, valor: lista }
}

export async function crearTurno(t: Omit<Turno, "id">): Promise<Resultado<Turno>> {
  const { data, error } = await supabase
    .from(TABLA_TURNOS)
    .insert({
      [CT.pacienteId]: t.pacienteId,
      [CT.sede]: SEDE_A_DB[t.sede],
      [CT.fecha]: t.fecha,
      [CT.horaInicio]: t.hora,
      [CT.duracion]: t.duracion,
      [CT.estado]: ESTADO_A_DB[t.estado],
    })
    .select()
    .single()
  const turno = error ? null : aTurno(data as Fila)
  if (!turno) return { ok: false, error: ERROR_GUARDAR }
  return { ok: true, valor: turno }
}

export async function actualizarTurno(
  id: string,
  cambios: Partial<Pick<Turno, "pacienteId" | "hora" | "duracion" | "estado">>
): Promise<Resultado<Turno>> {
  const fila: Fila = { [CT.updatedAt]: new Date().toISOString() }
  if (cambios.pacienteId !== undefined) fila[CT.pacienteId] = cambios.pacienteId
  if (cambios.hora !== undefined) fila[CT.horaInicio] = cambios.hora
  if (cambios.duracion !== undefined) fila[CT.duracion] = cambios.duracion
  if (cambios.estado !== undefined) fila[CT.estado] = ESTADO_A_DB[cambios.estado]
  const { data, error } = await supabase.from(TABLA_TURNOS).update(fila).eq(CT.id, id).select().single()
  const turno = error ? null : aTurno(data as Fila)
  if (!turno) return { ok: false, error: ERROR_GUARDAR }
  return { ok: true, valor: turno }
}

/** «Liberar horario»: el horario vuelve a estar libre, sin fila de turno. */
export async function eliminarTurno(id: string): Promise<Resultado<null>> {
  const { error } = await supabase.from(TABLA_TURNOS).delete().eq(CT.id, id)
  if (error) return { ok: false, error: ERROR_GUARDAR }
  return { ok: true, valor: null }
}
