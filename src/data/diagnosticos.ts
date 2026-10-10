import { COLUMNAS_DIAGNOSTICOS as C, TABLA_DIAGNOSTICOS } from "@/data/constantes"
import { supabase } from "@/lib/supabase"

export interface Diagnostico {
  id: string
  diagnostico: string
  plan: string
  tecnica: string
  /** ISO completo: cuándo se guardó esta versión. */
  creado: string
}

export type DatosDiagnostico = Pick<Diagnostico, "diagnostico" | "plan" | "tecnica">

type Fila = Record<string, unknown>
type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string }

const texto = (v: unknown) => (typeof v === "string" ? v : "")

function aDiagnostico(f: Fila): Diagnostico {
  return {
    id: String(f[C.id]),
    diagnostico: texto(f[C.diagnostico]),
    plan: texto(f[C.planTratamiento]),
    tecnica: texto(f[C.tecnica]),
    creado: texto(f[C.createdAt]),
  }
}

/** Todas las versiones del paciente, la más nueva primero (la primera es la vigente). */
export async function listar(pacienteId: string): Promise<Resultado<Diagnostico[]>> {
  const { data, error } = await supabase
    .from(TABLA_DIAGNOSTICOS)
    .select("*")
    .eq(C.pacienteId, pacienteId)
    .order(C.createdAt, { ascending: false })
  if (error) return { ok: false, error: "No se pudo cargar el diagnóstico." }
  return { ok: true, valor: (data as Fila[]).map(aDiagnostico) }
}

/** Historial simple: guardar siempre inserta una fila nueva, nunca pisa la anterior. */
export async function guardar(
  pacienteId: string,
  d: DatosDiagnostico
): Promise<Resultado<Diagnostico>> {
  const { data, error } = await supabase
    .from(TABLA_DIAGNOSTICOS)
    .insert({
      [C.pacienteId]: pacienteId,
      [C.diagnostico]: d.diagnostico.trim() || null,
      [C.planTratamiento]: d.plan.trim() || null,
      [C.tecnica]: d.tecnica.trim() || null,
    })
    .select()
    .single()
  if (error) return { ok: false, error: "No se pudo guardar. Revisá tu conexión e intentá de nuevo." }
  return { ok: true, valor: aDiagnostico(data as Fila) }
}
