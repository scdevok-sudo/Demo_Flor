import { useCallback, useEffect, useState } from "react"

import * as datos from "@/data/presupuestos"
import {
  datosVacios,
  type Cuota,
  type DatosPresupuesto,
  type Presupuesto,
  type RegistroMantenimiento,
} from "@/data/presupuestos"
import { MAX_CUOTAS, type MedioPago } from "@/lib/tipos"
import { hoyISO } from "@/lib/util"

const MEDIO_INICIAL: MedioPago = "Transferencia"

const borrador = (cantidad: number): Cuota[] =>
  Array.from({ length: cantidad }, (_, i) => ({
    id: "",
    mes: i + 1,
    medio: MEDIO_INICIAL,
    efectuado: false,
    vencimiento: "",
    fechaPago: "",
  }))

const mismosDatos = (a: DatosPresupuesto, b: DatosPresupuesto) =>
  (Object.keys(a) as (keyof DatosPresupuesto)[]).every((k) => a[k].trim() === b[k].trim())

/**
 * Presupuesto, cuotas y mantenimiento de un paciente (módulo 5). El presupuesto
 * no existe en la base hasta el primer guardado (o hasta que se cobra una cuota
 * o se agrega un mantenimiento): mientras tanto se muestra un borrador local.
 */
export function usePresupuesto(pacienteId: string) {
  const [pres, setPres] = useState<Presupuesto | null>(null)
  const [form, setForm] = useState<DatosPresupuesto>(datosVacios())
  const [cantidadBorrador, setCantidadBorrador] = useState(MAX_CUOTAS)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    void datos.obtener(pacienteId).then((r) => {
      if (r.ok) {
        setPres(r.valor)
        setForm(r.valor?.datos ?? datosVacios())
        setError(null)
      } else setError(r.error)
      setCargando(false)
    })
  }, [pacienteId])

  useEffect(() => {
    cargar()
  }, [cargar])

  const cuotas = pres?.cuotas ?? borrador(cantidadBorrador)
  const mantenimiento = pres?.mantenimiento ?? []
  const hayCambios = !mismosDatos(form, pres?.datos ?? datosVacios())

  /** Devuelve el presupuesto guardado, creándolo si todavía no existía. */
  async function asegurar(): Promise<Presupuesto | null> {
    if (pres) return pres
    const r = await datos.crear(pacienteId, form, cantidadBorrador, MEDIO_INICIAL)
    if (!r.ok) {
      setError(r.error)
      return null
    }
    setPres(r.valor)
    return r.valor
  }

  /** Corre una acción contra la base con el estado de «guardando» y el manejo de error. */
  async function correr(accion: () => Promise<void>) {
    setGuardando(true)
    setError(null)
    await accion()
    setGuardando(false)
  }

  const guardarDatos = () =>
    correr(async () => {
      if (!pres) {
        await asegurar()
        return
      }
      const r = await datos.actualizarDatos(pres.id, form, pres.cuotas.length)
      if (!r.ok) return setError(r.error)
      setPres({ ...pres, datos: r.valor })
    })

  /** Número de la última cuota cobrada: la cantidad no puede bajar de ahí. */
  const minimoCuotas = Math.max(1, ...cuotas.filter((c) => c.efectuado).map((c) => c.mes))

  const cambiarCantidad = (cantidad: number) =>
    correr(async () => {
      if (cantidad < minimoCuotas) {
        return setError(`No se puede bajar de ${minimoCuotas} cuotas: la cuota ${minimoCuotas} ya está cobrada.`)
      }
      if (!pres) return setCantidadBorrador(cantidad)
      const r = await datos.ajustarCuotas(pres.id, pres.cuotas, cantidad, pres.datos.montoTotal, MEDIO_INICIAL)
      if (!r.ok) return setError(r.error)
      setPres({ ...pres, cuotas: r.valor })
    })

  const actualizarCuota = (mes: number, cambios: Partial<Pick<Cuota, "medio" | "efectuado">>) =>
    correr(async () => {
      const base = await asegurar()
      const cuota = base?.cuotas.find((c) => c.mes === mes)
      if (!base || !cuota) return
      const r = await datos.actualizarCuota(cuota, cambios, hoyISO())
      if (!r.ok) return setError(r.error)
      setPres({ ...base, cuotas: base.cuotas.map((c) => (c.id === cuota.id ? r.valor : c)) })
    })

  const fijarPrimeraCuota = (fecha: string) =>
    correr(async () => {
      const base = await asegurar()
      if (!base) return
      const r = await datos.fijarVencimientos(base.cuotas, fecha)
      if (!r.ok) return setError(r.error)
      setPres({ ...base, cuotas: r.valor })
    })

  const cambiarVencimiento = (mes: number, fecha: string) =>
    correr(async () => {
      const base = await asegurar()
      const cuota = base?.cuotas.find((c) => c.mes === mes)
      if (!base || !cuota) return
      const r = await datos.actualizarVencimiento(cuota, fecha)
      if (!r.ok) return setError(r.error)
      setPres({ ...base, cuotas: base.cuotas.map((c) => (c.id === cuota.id ? r.valor : c)) })
    })

  const agregarMantenimiento = (fecha: string, monto: string) =>
    correr(async () => {
      const base = await asegurar()
      if (!base) return
      const r = await datos.agregarMantenimiento(base.id, fecha, monto)
      if (!r.ok) return setError(r.error)
      setPres({ ...base, mantenimiento: [...base.mantenimiento, r.valor] })
    })

  const actualizarMantenimiento = (
    registro: RegistroMantenimiento,
    cambios: Partial<Pick<RegistroMantenimiento, "monto" | "efectuado">>
  ) =>
    correr(async () => {
      if (!pres) return
      const r = await datos.actualizarMantenimiento(registro, cambios)
      if (!r.ok) return setError(r.error)
      setPres({ ...pres, mantenimiento: pres.mantenimiento.map((m) => (m.id === registro.id ? r.valor : m)) })
    })

  const borrarMantenimiento = (id: string) =>
    correr(async () => {
      if (!pres) return
      const r = await datos.borrarMantenimiento(id)
      if (!r.ok) return setError(r.error)
      setPres({ ...pres, mantenimiento: pres.mantenimiento.filter((m) => m.id !== id) })
    })

  return {
    form,
    editar: (cambios: Partial<DatosPresupuesto>) => setForm((f) => ({ ...f, ...cambios })),
    hayCambios,
    existe: pres !== null,
    presupuestoId: pres?.id ?? null,
    cuotas,
    minimoCuotas,
    mantenimiento,
    cargando,
    guardando,
    error,
    guardarDatos,
    cambiarCantidad,
    actualizarCuota,
    fijarPrimeraCuota,
    cambiarVencimiento,
    agregarMantenimiento,
    actualizarMantenimiento,
    borrarMantenimiento,
    recargar: cargar,
  }
}

export type EstadoPresupuesto = ReturnType<typeof usePresupuesto>
