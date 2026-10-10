import { useState, type FormEvent } from "react"
import { ArrowLeft, Check } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { FormDatosPaciente, type DatosPaciente } from "@/components/FormDatosPaciente"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useFichero } from "@/lib/store"
import { pacienteVacio } from "@/lib/tipos"
import { soloDigitos } from "@/lib/util"

export function NuevoPaciente() {
  const { crearPaciente } = useFichero()
  const navigate = useNavigate()
  const [valores, setValores] = useState<DatosPaciente>(() => pacienteVacio())

  function set<K extends keyof DatosPaciente>(campo: K, valor: DatosPaciente[K]) {
    setValores((prev) => ({ ...prev, [campo]: valor }))
  }

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listo =
    valores.nombre.trim() !== "" && valores.apellido.trim() !== "" && soloDigitos(valores.dni) !== ""

  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (!listo || guardando) return
    setGuardando(true)
    setError(null)
    const r = await crearPaciente(valores)
    setGuardando(false)
    if (r.ok) navigate(`/pacientes/${r.paciente.id}`)
    else setError(r.error)
  }

  return (
    <form onSubmit={guardar} className="space-y-6">
      <div>
        <Link
          to="/pacientes"
          className="-my-2 inline-flex items-center gap-1.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Pacientes
        </Link>
        <h1 className="font-heading mt-2 text-3xl text-brand-dark">Nuevo paciente</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Con nombre, apellido y DNI alcanza para abrir la ficha. El resto lo vas completando
          cuando lo tengas.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FormDatosPaciente valores={valores} set={set} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {error ? (
          <p role="alert" className="mr-auto text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button
          variant="ghost"
          size="lg"
          className="h-10"
          render={<Link to="/pacientes" />}
          nativeButton={false}
        >
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="h-10" disabled={!listo || guardando}>
          <Check className="size-4" />
          {guardando ? "Creando…" : "Crear ficha"}
        </Button>
      </div>
    </form>
  )
}
