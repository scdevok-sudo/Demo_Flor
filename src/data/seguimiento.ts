import { COLUMNAS_SEGUIMIENTO as C, TABLA_SEGUIMIENTO } from "@/data/constantes"
import { supabase } from "@/lib/supabase"

export interface EntradaSeguimiento {
  id: string
  /** AAAA-MM-DD */
  fecha: string
  texto: string
}

type Fila = Record<string, unknown>
type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string }

const ERROR_GUARDAR = "No se pudo guardar. Revisá tu conexión e intentá de nuevo."

function aEntrada(f: Fila): EntradaSeguimiento {
  return {
    id: String(f[C.id]),
    fecha: String(f[C.fecha] ?? "").slice(0, 10),
    texto: String(f[C.texto] ?? ""),
  }
}

/** Entradas del paciente, de la fecha más reciente a la más vieja. */
export async function listar(pacienteId: string): Promise<Resultado<EntradaSeguimiento[]>> {
  const { data, error } = await supabase
    .from(TABLA_SEGUIMIENTO)
    .select("*")
    .eq(C.pacienteId, pacienteId)
    .order(C.fecha, { ascending: false })
    .order(C.createdAt, { ascending: false })
  if (error) return { ok: false, error: "No se pudo cargar el seguimiento." }
  return { ok: true, valor: (data as Fila[]).map(aEntrada) }
}

export async function crear(
  pacienteId: string,
  fecha: string,
  texto: string
): Promise<Resultado<EntradaSeguimiento>> {
  const { data, error } = await supabase
    .from(TABLA_SEGUIMIENTO)
    .insert({ [C.pacienteId]: pacienteId, [C.fecha]: fecha, [C.texto]: texto.trim() })
    .select()
    .single()
  if (error) return { ok: false, error: ERROR_GUARDAR }
  return { ok: true, valor: aEntrada(data as Fila) }
}

export async function borrar(id: string): Promise<Resultado<null>> {
  const { error } = await supabase.from(TABLA_SEGUIMIENTO).delete().eq(C.id, id)
  if (error) return { ok: false, error: "No se pudo borrar la entrada." }
  return { ok: true, valor: null }
}
