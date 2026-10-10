import { COLUMNAS_PACIENTES as C, TABLAS } from "@/data/constantes"
import { supabase } from "@/lib/supabase"
import { pacienteVacio, type Categoria, type Paciente, type Sede } from "@/lib/tipos"
import { edadDesde, soloDigitos } from "@/lib/util"

/** Valores de enum en la base <-> etiquetas que se muestran. */
const CATEGORIA_A_DB: Record<Categoria, string> = {
  Ortopedia: "ortopedia",
  Ortodoncia: "ortodoncia",
  Alineadores: "alineadores",
  "Armonización facial": "armonizacion_facial",
}
const CATEGORIA_DE_DB = invertir(CATEGORIA_A_DB) as Record<string, Categoria>

const SEDE_A_DB: Record<Sede, string> = { "La Plata": "la_plata", Tandil: "tandil" }
const SEDE_DE_DB = invertir(SEDE_A_DB) as Record<string, Sede>

function invertir(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]))
}

/** Los campos de `Paciente` que viven en la tabla `pacientes`. */
export type DatosPersistidos = Pick<
  Paciente,
  | "nombre" | "apellido" | "dni" | "mail" | "ocupacion" | "fechaNacimiento" | "categoria"
  | "sede" | "anamnesis" | "obraSocial" | "particularidades" | "derivadoPor" | "activo"
>

type Fila = Record<string, unknown>
type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string }

const texto = (v: unknown) => (typeof v === "string" ? v : "")

function aPaciente(f: Fila): Paciente {
  const fechaNacimiento = texto(f[C.fechaNacimiento]).slice(0, 10)
  return {
    ...pacienteVacio(),
    id: String(f[C.id]),
    nombre: texto(f[C.nombre]),
    apellido: texto(f[C.apellido]),
    dni: texto(f[C.dni]),
    mail: texto(f[C.email]),
    ocupacion: texto(f[C.ocupacion]),
    fechaNacimiento,
    edad: edadDesde(fechaNacimiento),
    categoria: CATEGORIA_DE_DB[texto(f[C.categoria])] ?? "Ortodoncia",
    sede: SEDE_DE_DB[texto(f[C.sede])] ?? "La Plata",
    anamnesis: texto(f[C.anamnesis]),
    obraSocial: texto(f[C.obraSocial]),
    particularidades: texto(f[C.particularidades]),
    derivadoPor: texto(f[C.derivadoPor]),
    activo: f[C.activo] !== false,
  }
}

const aNull = (s: string) => (s.trim() === "" ? null : s.trim())

function aFila(d: DatosPersistidos): Fila {
  return {
    [C.nombre]: d.nombre.trim(),
    [C.apellido]: d.apellido.trim(),
    [C.dni]: soloDigitos(d.dni),
    [C.email]: aNull(d.mail),
    [C.ocupacion]: aNull(d.ocupacion),
    [C.fechaNacimiento]: aNull(d.fechaNacimiento),
    [C.categoria]: CATEGORIA_A_DB[d.categoria],
    [C.sede]: SEDE_A_DB[d.sede],
    [C.anamnesis]: aNull(d.anamnesis),
    [C.obraSocial]: aNull(d.obraSocial),
    [C.particularidades]: aNull(d.particularidades),
    [C.derivadoPor]: aNull(d.derivadoPor),
    [C.activo]: d.activo,
  }
}

/** Traduce el error de Postgres/PostgREST a un mensaje para Florencia. */
function mensajeDeError(error: { code?: string; message?: string }): string {
  if (error.code === "23505") return "Ya existe un paciente con ese DNI."
  if (error.code === "23502") return "Falta completar un dato obligatorio."
  if (error.code === "22P02" || error.code === "23514") return "Hay un dato con un formato no válido."
  return "No se pudo guardar. Revisá tu conexión e intentá de nuevo."
}

export async function listar(): Promise<Resultado<Paciente[]>> {
  const { data, error } = await supabase.from(TABLAS.pacientes).select("*")
  if (error) return { ok: false, error: "No se pudieron cargar los pacientes." }
  return { ok: true, valor: (data as Fila[]).map(aPaciente) }
}

export async function crear(datos: DatosPersistidos): Promise<Resultado<Paciente>> {
  const { data, error } = await supabase.from(TABLAS.pacientes).insert(aFila(datos)).select().single()
  if (error) return { ok: false, error: mensajeDeError(error) }
  return { ok: true, valor: aPaciente(data as Fila) }
}

/** Edición y baja lógica (`activo: false`) pasan por acá. Nunca se borra la fila. */
export async function actualizar(id: string, datos: DatosPersistidos): Promise<Resultado<Paciente>> {
  const { data, error } = await supabase
    .from(TABLAS.pacientes)
    .update({ ...aFila(datos), [C.updatedAt]: new Date().toISOString() })
    .eq(C.id, id)
    .select()
    .single()
  if (error) return { ok: false, error: mensajeDeError(error) }
  return { ok: true, valor: aPaciente(data as Fila) }
}
