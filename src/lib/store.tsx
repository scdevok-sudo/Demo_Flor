import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react"

import { PACIENTES_DEMO } from "@/lib/datos"
import { pacienteVacio, type Paciente } from "@/lib/tipos"
import { nuevoId } from "@/lib/util"

/**
 * Estado de la demo: vive sólo en memoria. Al refrescar el navegador
 * se vuelve a los pacientes de ejemplo. No hay backend.
 */
type Accion =
  | { tipo: "agregar"; paciente: Paciente }
  | { tipo: "actualizar"; id: string; cambios: Partial<Paciente> }

function reducer(estado: Paciente[], accion: Accion): Paciente[] {
  switch (accion.tipo) {
    case "agregar":
      return [accion.paciente, ...estado]
    case "actualizar":
      return estado.map((p) => (p.id === accion.id ? { ...p, ...accion.cambios } : p))
  }
}

interface Fichero {
  pacientes: Paciente[]
  agregarPaciente: (datos: Partial<Paciente>) => Paciente
  actualizarPaciente: (id: string, cambios: Partial<Paciente>) => void
}

const FicheroContext = createContext<Fichero | null>(null)

export function FicheroProvider({ children }: { children: ReactNode }) {
  const [pacientes, dispatch] = useReducer(reducer, PACIENTES_DEMO)

  const valor = useMemo<Fichero>(
    () => ({
      pacientes,
      agregarPaciente: (datos) => {
        const paciente: Paciente = { ...pacienteVacio(), ...datos, id: nuevoId("pac") }
        dispatch({ tipo: "agregar", paciente })
        return paciente
      },
      actualizarPaciente: (id, cambios) => dispatch({ tipo: "actualizar", id, cambios }),
    }),
    [pacientes]
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
