import { FormDatosPaciente, type DatosPaciente } from "@/components/FormDatosPaciente"
import { Card, CardContent } from "@/components/ui/card"
import type { Paciente } from "@/lib/tipos"

interface Props {
  paciente: Paciente
  actualizar: (cambios: Partial<Paciente>) => void
}

export function DatosGenerales({ paciente, actualizar }: Props) {
  function set<K extends keyof DatosPaciente>(campo: K, valor: DatosPaciente[K]) {
    actualizar({ [campo]: valor } as Partial<Paciente>)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <FormDatosPaciente valores={paciente} set={set} />
      </CardContent>
    </Card>
  )
}
