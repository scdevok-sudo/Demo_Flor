import { useState } from "react"
import { Check } from "lucide-react"

import { FormDatosPaciente, type DatosPaciente } from "@/components/FormDatosPaciente"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { datosPersistidos, useFichero } from "@/lib/store"
import type { Paciente } from "@/lib/tipos"
import { soloDigitos } from "@/lib/util"

interface Props {
  paciente: Paciente
}

/** Edita un borrador y guarda todo junto contra la base (no se escribe por tecla). */
export function DatosGenerales({ paciente }: Props) {
  const { guardarPaciente } = useFichero()
  const [borrador, setBorrador] = useState<DatosPaciente>(paciente)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)

  function set<K extends keyof DatosPaciente>(campo: K, valor: DatosPaciente[K]) {
    setBorrador((prev) => ({ ...prev, [campo]: valor }))
    setGuardado(false)
  }

  const cambiado =
    JSON.stringify(datosPersistidos(borrador)) !== JSON.stringify(datosPersistidos(paciente))
  const completo =
    borrador.nombre.trim() !== "" && borrador.apellido.trim() !== "" && soloDigitos(borrador.dni) !== ""

  async function guardar() {
    setGuardando(true)
    setError(null)
    const r = await guardarPaciente(paciente.id, borrador)
    setGuardando(false)
    if (r.ok) setGuardado(true)
    else setError(r.error)
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <FormDatosPaciente valores={borrador} set={set} />
        <div className="flex flex-wrap items-center justify-end gap-3">
          {error ? (
            <p role="alert" className="mr-auto text-sm text-destructive">
              {error}
            </p>
          ) : !completo ? (
            <p className="mr-auto text-sm text-muted-foreground">Nombre, apellido y DNI son obligatorios.</p>
          ) : guardado ? (
            <p className="mr-auto text-sm text-muted-foreground">Cambios guardados.</p>
          ) : null}
          <Button
            type="button"
            size="lg"
            className="h-10"
            disabled={!cambiado || !completo || guardando}
            onClick={guardar}
          >
            <Check className="size-4" />
            {guardando ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
