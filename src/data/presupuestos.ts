import {
  COLUMNAS_CUOTAS as CC,
  COLUMNAS_MANTENIMIENTO as CM,
  COLUMNAS_PRESUPUESTOS as CP,
  TABLA_CUOTAS,
  TABLA_MANTENIMIENTO,
  TABLA_PRESUPUESTOS,
} from "@/data/constantes"
import { supabase } from "@/lib/supabase"
import { type MedioPago } from "@/lib/tipos"

/** Campos propios del presupuesto. Los montos van como texto de dígitos, igual que los inputs. */
export interface DatosPresupuesto {
  montoTotal: string
  condiciones: string
  duracionEstimada: string
  valorContencion: string
  valorAlta: string
  /** AAAA-MM-DD o vacío */
  fechaAlta: string
}

export interface Cuota {
  id: string
  /** Número de cuota, desde 1 */
  mes: number
  medio: MedioPago
  efectuado: boolean
}

/** Pago mensual de mantenimiento: el monto lo escribe Florencia a mano. */
export interface RegistroMantenimiento {
  id: string
  /** AAAA-MM-DD */
  fecha: string
  monto: string
  efectuado: boolean
}

export interface Presupuesto {
  id: string
  datos: DatosPresupuesto
  cuotas: Cuota[]
  mantenimiento: RegistroMantenimiento[]
}

export const datosVacios = (): DatosPresupuesto => ({
  montoTotal: "",
  condiciones: "",
  duracionEstimada: "",
  valorContencion: "",
  valorAlta: "",
  fechaAlta: "",
})

type Fila = Record<string, unknown>
type Resultado<T> = { ok: true; valor: T } | { ok: false; error: string }

const ERROR_GUARDAR = "No se pudo guardar. Revisá tu conexión e intentá de nuevo."

const MEDIO_A_DB: Record<MedioPago, string> = { Efectivo: "efectivo", Transferencia: "transferencia" }
const MEDIO_DE_DB: Record<string, MedioPago> = { efectivo: "Efectivo", transferencia: "Transferencia" }

const texto = (v: unknown) => (typeof v === "string" ? v : "")
const monto = (v: unknown) => (v === null || v === undefined ? "" : String(v))
const aNumero = (s: string): number | null => (s.trim() === "" ? null : Number(s))
const aNull = (s: string) => (s.trim() === "" ? null : s.trim())

function aDatos(f: Fila): DatosPresupuesto {
  return {
    montoTotal: monto(f[CP.montoTotal]),
    condiciones: texto(f[CP.condiciones]),
    duracionEstimada: texto(f[CP.duracionEstimada]),
    valorContencion: monto(f[CP.valorContencion]),
    valorAlta: monto(f[CP.valorAlta]),
    fechaAlta: texto(f[CP.fechaAlta]).slice(0, 10),
  }
}

function aFilaPresupuesto(d: DatosPresupuesto): Fila {
  return {
    [CP.montoTotal]: aNumero(d.montoTotal),
    [CP.condiciones]: aNull(d.condiciones),
    [CP.duracionEstimada]: aNull(d.duracionEstimada),
    [CP.valorContencion]: aNumero(d.valorContencion),
    [CP.valorAlta]: aNumero(d.valorAlta),
    [CP.fechaAlta]: aNull(d.fechaAlta),
  }
}

function aCuota(f: Fila): Cuota {
  return {
    id: String(f[CC.id]),
    mes: Number(f[CC.numeroCuota]),
    medio: MEDIO_DE_DB[texto(f[CC.metodoPago])] ?? "Transferencia",
    efectuado: f[CC.estado] === "efectuado",
  }
}

function aRegistro(f: Fila): RegistroMantenimiento {
  return {
    id: String(f[CM.id]),
    fecha: texto(f[CM.fecha]).slice(0, 10),
    monto: monto(f[CM.monto]),
    efectuado: f[CM.estado] === "efectuado",
  }
}

/** Monto de cada cuota: el total repartido en partes iguales. */
const montoCuota = (total: string, cantidad: number) =>
  total.trim() === "" || cantidad === 0 ? null : Math.round(Number(total) / cantidad)

/** El presupuesto vigente del paciente (el más reciente), o `null` si todavía no tiene. */
export async function obtener(pacienteId: string): Promise<Resultado<Presupuesto | null>> {
  const error = { ok: false, error: "No se pudo cargar el presupuesto." } as const
  const { data, error: e1 } = await supabase
    .from(TABLA_PRESUPUESTOS)
    .select("*")
    .eq(CP.pacienteId, pacienteId)
    .order(CP.createdAt, { ascending: false })
    .limit(1)
  if (e1) return error
  const fila = (data as Fila[])[0]
  if (!fila) return { ok: true, valor: null }
  const id = String(fila[CP.id])

  const [cuotas, mantenimiento] = await Promise.all([
    supabase.from(TABLA_CUOTAS).select("*").eq(CC.presupuestoId, id).order(CC.numeroCuota),
    supabase.from(TABLA_MANTENIMIENTO).select("*").eq(CM.presupuestoId, id).order(CM.fecha),
  ])
  if (cuotas.error || mantenimiento.error) return error
  return {
    ok: true,
    valor: {
      id,
      datos: aDatos(fila),
      cuotas: (cuotas.data as Fila[]).map(aCuota),
      mantenimiento: (mantenimiento.data as Fila[]).map(aRegistro),
    },
  }
}

/** Primer guardado: crea el presupuesto y sus cuotas iniciales (todas pendientes). */
export async function crear(
  pacienteId: string,
  datos: DatosPresupuesto,
  cantidadCuotas: number,
  medioInicial: MedioPago
): Promise<Resultado<Presupuesto>> {
  const { data, error } = await supabase
    .from(TABLA_PRESUPUESTOS)
    .insert({ [CP.pacienteId]: pacienteId, ...aFilaPresupuesto(datos) })
    .select()
    .single()
  if (error) return { ok: false, error: ERROR_GUARDAR }
  const id = String((data as Fila)[CP.id])

  const porCuota = montoCuota(datos.montoTotal, cantidadCuotas)
  const filas = Array.from({ length: cantidadCuotas }, (_, i) => ({
    [CC.presupuestoId]: id,
    [CC.numeroCuota]: i + 1,
    [CC.monto]: porCuota,
    [CC.metodoPago]: MEDIO_A_DB[medioInicial],
    [CC.estado]: "pendiente",
  }))
  const r = await supabase.from(TABLA_CUOTAS).insert(filas).select()
  if (r.error) return { ok: false, error: ERROR_GUARDAR }
  const cuotas = (r.data as Fila[]).map(aCuota).sort((a, b) => a.mes - b.mes)
  return { ok: true, valor: { id, datos: aDatos(data as Fila), cuotas, mantenimiento: [] } }
}

/** Guarda los campos del presupuesto y reparte el nuevo total entre las cuotas. */
export async function actualizarDatos(
  id: string,
  datos: DatosPresupuesto,
  cantidadCuotas: number
): Promise<Resultado<DatosPresupuesto>> {
  const { data, error } = await supabase
    .from(TABLA_PRESUPUESTOS)
    .update({ ...aFilaPresupuesto(datos), [CP.updatedAt]: new Date().toISOString() })
    .eq(CP.id, id)
    .select()
    .single()
  if (error) return { ok: false, error: ERROR_GUARDAR }
  const r = await supabase
    .from(TABLA_CUOTAS)
    .update({ [CC.monto]: montoCuota(datos.montoTotal, cantidadCuotas) })
    .eq(CC.presupuestoId, id)
  if (r.error) return { ok: false, error: ERROR_GUARDAR }
  return { ok: true, valor: aDatos(data as Fila) }
}

/** Deja exactamente `cantidad` cuotas: agrega las que faltan o saca las sobrantes. */
export async function ajustarCuotas(
  id: string,
  actuales: Cuota[],
  cantidad: number,
  total: string,
  medioInicial: MedioPago
): Promise<Resultado<Cuota[]>> {
  const porCuota = montoCuota(total, cantidad)
  if (cantidad < actuales.length) {
    const r = await supabase
      .from(TABLA_CUOTAS)
      .delete()
      .eq(CC.presupuestoId, id)
      .gt(CC.numeroCuota, cantidad)
    if (r.error) return { ok: false, error: ERROR_GUARDAR }
  } else if (cantidad > actuales.length) {
    const filas = Array.from({ length: cantidad - actuales.length }, (_, i) => ({
      [CC.presupuestoId]: id,
      [CC.numeroCuota]: actuales.length + i + 1,
      [CC.monto]: porCuota,
      [CC.metodoPago]: MEDIO_A_DB[medioInicial],
      [CC.estado]: "pendiente",
    }))
    const r = await supabase.from(TABLA_CUOTAS).insert(filas)
    if (r.error) return { ok: false, error: ERROR_GUARDAR }
  }
  const r = await supabase
    .from(TABLA_CUOTAS)
    .update({ [CC.monto]: porCuota })
    .eq(CC.presupuestoId, id)
  if (r.error) return { ok: false, error: ERROR_GUARDAR }
  const lista = await supabase.from(TABLA_CUOTAS).select("*").eq(CC.presupuestoId, id).order(CC.numeroCuota)
  if (lista.error) return { ok: false, error: ERROR_GUARDAR }
  return { ok: true, valor: (lista.data as Fila[]).map(aCuota) }
}

/** Cambia medio y/o estado de una cuota. Al cobrarla guarda la fecha; al desmarcarla la limpia. */
export async function actualizarCuota(
  cuota: Cuota,
  cambios: Partial<Pick<Cuota, "medio" | "efectuado">>,
  hoy: string
): Promise<Resultado<Cuota>> {
  const nueva = { ...cuota, ...cambios }
  const { data, error } = await supabase
    .from(TABLA_CUOTAS)
    .update({
      [CC.metodoPago]: MEDIO_A_DB[nueva.medio],
      [CC.estado]: nueva.efectuado ? "efectuado" : "pendiente",
      [CC.fecha]: nueva.efectuado ? hoy : null,
    })
    .eq(CC.id, cuota.id)
    .select()
    .single()
  if (error) return { ok: false, error: ERROR_GUARDAR }
  return { ok: true, valor: aCuota(data as Fila) }
}

export async function agregarMantenimiento(
  presupuestoId: string,
  fecha: string,
  importe: string
): Promise<Resultado<RegistroMantenimiento>> {
  const { data, error } = await supabase
    .from(TABLA_MANTENIMIENTO)
    .insert({
      [CM.presupuestoId]: presupuestoId,
      [CM.fecha]: fecha,
      [CM.monto]: aNumero(importe),
      [CM.estado]: "pendiente",
    })
    .select()
    .single()
  if (error) return { ok: false, error: ERROR_GUARDAR }
  return { ok: true, valor: aRegistro(data as Fila) }
}

export async function actualizarMantenimiento(
  registro: RegistroMantenimiento,
  cambios: Partial<Pick<RegistroMantenimiento, "monto" | "efectuado">>
): Promise<Resultado<RegistroMantenimiento>> {
  const nuevo = { ...registro, ...cambios }
  const { data, error } = await supabase
    .from(TABLA_MANTENIMIENTO)
    .update({ [CM.monto]: aNumero(nuevo.monto), [CM.estado]: nuevo.efectuado ? "efectuado" : "pendiente" })
    .eq(CM.id, registro.id)
    .select()
    .single()
  if (error) return { ok: false, error: ERROR_GUARDAR }
  return { ok: true, valor: aRegistro(data as Fila) }
}

export async function borrarMantenimiento(id: string): Promise<Resultado<null>> {
  const { error } = await supabase.from(TABLA_MANTENIMIENTO).delete().eq(CM.id, id)
  if (error) return { ok: false, error: ERROR_GUARDAR }
  return { ok: true, valor: null }
}
