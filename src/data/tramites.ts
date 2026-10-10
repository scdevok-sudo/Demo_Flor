import { COLUMNAS_TRAMITES as C, TABLA_TRAMITES } from "@/data/constantes"
import { supabase } from "@/lib/supabase"
import type { TipoTramite, Tramite } from "@/lib/tipos"
import { aISO } from "@/lib/util"

type Fila = Record<string, unknown>
type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string }

const ERROR_GUARDAR = "No se pudo guardar. Revisá tu conexión e intentá de nuevo."

const TIPO_A_DB: Record<TipoTramite, string> = { "obra-social": "obra_social", facturacion: "facturacion" }
const TIPO_DE_DB: Record<string, TipoTramite> = { obra_social: "obra-social", facturacion: "facturacion" }

function aTramite(f: Fila): Tramite | null {
  const tipo = TIPO_DE_DB[String(f[C.tipo])]
  if (!tipo) return null
  return {
    id: String(f[C.id]),
    pacienteId: String(f[C.pacienteId]),
    tipo,
    // fecha_agregado es un instante: se muestra el día en hora local.
    agregado: aISO(new Date(String(f[C.fechaAgregado]))),
    resuelto: f[C.estado] === "resuelto",
  }
}

const aTramites = (filas: Fila[]) => filas.map(aTramite).filter((t): t is Tramite => t !== null)

/** Todos los trámites, el más recientemente agregado primero. */
export async function listar(): Promise<Resultado<Tramite[]>> {
  const { data, error } = await supabase
    .from(TABLA_TRAMITES)
    .select("*")
    .order(C.fechaAgregado, { ascending: false })
  if (error) return { ok: false, error: "No se pudieron cargar los trámites." }
  return { ok: true, valor: aTramites(data as Fila[]) }
}

/** Tipos de trámite que el paciente ya tiene pendientes. */
export async function pendientesDe(pacienteId: string): Promise<Resultado<TipoTramite[]>> {
  const { data, error } = await supabase
    .from(TABLA_TRAMITES)
    .select("*")
    .eq(C.pacienteId, pacienteId)
    .eq(C.estado, "pendiente")
  if (error) return { ok: false, error: "No se pudieron cargar los trámites del paciente." }
  return { ok: true, valor: aTramites(data as Fila[]).map((t) => t.tipo) }
}

/** Suma al paciente a cada lista elegida, salvo que ya esté pendiente en ella. */
export async function agregar(pacienteId: string, tipos: TipoTramite[]): Promise<Resultado<null>> {
  const ya = await pendientesDe(pacienteId)
  if (!ya.ok) return ya
  const nuevos = tipos.filter((t) => !ya.valor.includes(t))
  if (nuevos.length === 0) return { ok: true, valor: null }
  const { error } = await supabase.from(TABLA_TRAMITES).insert(
    nuevos.map((tipo) => ({ [C.pacienteId]: pacienteId, [C.tipo]: TIPO_A_DB[tipo], [C.estado]: "pendiente" }))
  )
  if (error) return { ok: false, error: ERROR_GUARDAR }
  return { ok: true, valor: null }
}

export async function marcar(id: string, resuelto: boolean): Promise<Resultado<null>> {
  const { error } = await supabase
    .from(TABLA_TRAMITES)
    .update({
      [C.estado]: resuelto ? "resuelto" : "pendiente",
      [C.fechaResuelto]: resuelto ? new Date().toISOString() : null,
    })
    .eq(C.id, id)
  if (error) return { ok: false, error: ERROR_GUARDAR }
  return { ok: true, valor: null }
}
