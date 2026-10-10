import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react"

import * as datosPacientes from "@/data/pacientes"
import type { DatosPersistidos } from "@/data/pacientes"
import {
  pacienteVacio,
  type Paciente,
} from "@/lib/tipos"
import { edadDesde, nuevoId } from "@/lib/util"

/**
 * Estado en memoria (se reemplaza por Supabase módulo a módulo). Los datos de
 * ejemplo sólo se cargan en desarrollo con VITE_USAR_SEED=true.
 */
const USAR_SEED = import.meta.env.DEV && import.meta.env.VITE_USAR_SEED === "true"

type Accion =
  | { tipo: "cargar"; pacientes: Paciente[] }
  | { tipo: "agregar"; paciente: Paciente }
  | { tipo: "actualizar"; id: string; cambios: Partial<Paciente> }

function reducer(estado: Paciente[], accion: Accion): Paciente[] {
  switch (accion.tipo) {
    case "cargar":
      return accion.pacientes
    case "agregar":
      return [accion.paciente, ...estado]
    case "actualizar":
      return estado.map((p) => (p.id === accion.id ? { ...p, ...accion.cambios } : p))
  }
}

/** Resultado de una operación contra la base: `error` ya viene en castellano. */
export type Guardado = { ok: true; paciente: Paciente } | { ok: false; error: string }

/** Deja sólo los campos que viven en la tabla `pacientes`. */
export function datosPersistidos(p: Paciente | Omit<Paciente, "id">): DatosPersistidos {
  const { nombre, apellido, dni, mail, ocupacion, fechaNacimiento, categoria, sede, anamnesis,
    obraSocial, particularidades, derivadoPor, activo } = p
  return { nombre, apellido, dni, mail, ocupacion, fechaNacimiento, categoria, sede, anamnesis,
    obraSocial, particularidades, derivadoPor, activo }
}

interface Fichero {
  pacientes: Paciente[]
  cargandoPacientes: boolean
  errorPacientes: string | null
  recargarPacientes: () => void
  /** Alta contra la base. */
  crearPaciente: (datos: Omit<Paciente, "id">) => Promise<Guardado>
  /** Guarda los datos de la ficha (edición y baja lógica) contra la base. */
  guardarPaciente: (id: string, datos: Paciente | Omit<Paciente, "id">) => Promise<Guardado>
  /**
   * Cambios en los módulos que todavía no persisten (fotos, estudios, presupuesto…):
   * sólo en memoria hasta que se conecte cada uno.
   */
  actualizarPaciente: (id: string, cambios: Partial<Paciente>) => void
}

const FicheroContext = createContext<Fichero | null>(null)

export function FicheroProvider({ children }: { children: ReactNode }) {
  const [pacientes, dispatch] = useReducer(reducer, [])
  const [cargandoPacientes, setCargandoPacientes] = useState(!USAR_SEED)
  const [errorPacientes, setErrorPacientes] = useState<string | null>(null)

  const traerPacientes = useCallback(() => {
    void datosPacientes.listar().then((r) => {
      if (r.ok) dispatch({ tipo: "cargar", pacientes: r.valor })
      else setErrorPacientes(r.error)
      setCargandoPacientes(false)
    })
  }, [])

  const recargarPacientes = useCallback(() => {
    if (USAR_SEED) return
    setCargandoPacientes(true)
    setErrorPacientes(null)
    traerPacientes()
  }, [traerPacientes])

  useEffect(() => {
    if (!USAR_SEED) return traerPacientes()
    // El import dinámico bajo el flag de desarrollo hace que los datos de prueba
    // no entren al bundle de producción.
    void import("@/lib/datos").then((m) => {
      dispatch({ tipo: "cargar", pacientes: m.PACIENTES_DEMO })
      setCargandoPacientes(false)
    })
  }, [traerPacientes])

  const valor = useMemo<Fichero>(
    () => ({
      pacientes,
      cargandoPacientes,
      errorPacientes,
      recargarPacientes,
      crearPaciente: async (datos) => {
        if (USAR_SEED) {
          const paciente: Paciente = { ...pacienteVacio(), ...datos, id: nuevoId("pac") }
          dispatch({ tipo: "agregar", paciente })
          return { ok: true, paciente }
        }
        const r = await datosPacientes.crear(datosPersistidos(datos))
        if (!r.ok) return r
        dispatch({ tipo: "agregar", paciente: r.valor })
        return { ok: true, paciente: r.valor }
      },
      guardarPaciente: async (id, datos) => {
        const persistidos = datosPersistidos(datos)
        if (USAR_SEED) {
          const cambios = { ...persistidos, edad: edadDesde(persistidos.fechaNacimiento) }
          dispatch({ tipo: "actualizar", id, cambios })
          return { ok: true, paciente: { ...(pacientes.find((p) => p.id === id) as Paciente), ...cambios } }
        }
        const r = await datosPacientes.actualizar(id, persistidos)
        if (!r.ok) return r
        // La base devuelve sólo las columnas de la tabla: se conserva lo que sigue en memoria.
        const { id: _id, ...guardado } = r.valor
        dispatch({ tipo: "actualizar", id, cambios: { ...datosPersistidos(guardado), edad: guardado.edad } })
        return { ok: true, paciente: r.valor }
      },
      actualizarPaciente: (id, cambios) => dispatch({ tipo: "actualizar", id, cambios }),
    }),
    [pacientes, cargandoPacientes, errorPacientes, recargarPacientes]
  )

  return <FicheroContext.Provider value={valor}>{children}</FicheroContext.Provider>
}

export function useFichero(): Fichero {
  const ctx = useContext(FicheroContext)
  if (!ctx) throw new Error("useFichero necesita estar dentro de <FicheroProvider>")
  return ctx
}

export function usePaciente(id: string | undefined): Paciente | undefined {
  const { pacientes } = useFichero()
  return pacientes.find((p) => p.id === id)
}
