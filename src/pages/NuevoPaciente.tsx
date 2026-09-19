import { useState, type FormEvent } from "react"
import { ArrowLeft, Check } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { FormDatosPaciente, type DatosPaciente } from "@/components/FormDatosPaciente"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useFichero } from "@/lib/store"
import { pacienteVacio } from "@/lib/tipos"

export function NuevoPaciente() {
  const { agregarPaciente } = useFichero()
  const navigate = useNavigate()
  const [valores, setValores] = useState<DatosPaciente>(() => pacienteVacio())

  function set<K extends keyof DatosPaciente>(campo: K, valor: DatosPaciente[K]) {
    setValores((prev) => ({ ...prev, [campo]: valor }))
  }

  const listo = valores.nombre.trim() !== "" && valores.apellido.trim() !== ""

  function guardar(e: FormEvent) {
    e.preventDefault()
    if (!listo) return
    const paciente = agregarPaciente(valores)
    navigate(`/pacientes/${paciente.id}`)
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
          Con el nombre y el apellido alcanza para abrir la ficha. El resto lo vas completando
          cuando lo tengas.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FormDatosPaciente valores={valores} set={set} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button
          variant="ghost"
          size="lg"
          className="h-10"
          render={<Link to="/pacientes" />}
          nativeButton={false}
        >
          Cancelar
        </Button>
        <Button type="submit" size="lg" className="h-10" disabled={!listo}>
          <Check className="size-4" />
          Crear ficha
        </Button>
      </div>
    </form>
  )
}
