import { Sparkles } from "lucide-react"

import { Campo } from "@/components/campos"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { esArmonizacion, type Paciente } from "@/lib/tipos"

interface Props {
  paciente: Paciente
  actualizar: (cambios: Partial<Paciente>) => void
}

export function Diagnostico({ paciente, actualizar }: Props) {
  // Armonización facial usa la versión corta: dos campos breves y sin técnica.
  const corto = esArmonizacion(paciente.categoria)

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-brand-coral/40 bg-brand-coral-soft px-4 py-3.5">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-dark" />
        <p className="text-sm leading-relaxed text-brand-dark">
          Lo que cargues acá se copia solo al presupuesto: no hace falta volver a escribirlo.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <Campo
            etiqueta="Diagnóstico"
            nota={corto ? "En dos renglones." : "Clasificación, discrepancias, hábitos."}
          >
            <Textarea
              rows={corto ? 3 : 4}
              value={paciente.diagnostico}
              onChange={(e) => actualizar({ diagnostico: e.target.value })}
              placeholder={
                corto
                  ? "Pérdida de volumen en el tercio medio. Surcos nasogenianos marcados."
                  : "Clase II esquelética por retrusión mandibular…"
              }
            />
          </Campo>

          <Campo
            etiqueta="Plan de tratamiento"
            nota={
              corto
                ? "Qué se aplica y en cuántas sesiones."
                : "Fases, duración estimada, contención."
            }
          >
            <Textarea
              rows={corto ? 3 : 5}
              value={paciente.plan}
              onChange={(e) => actualizar({ plan: e.target.value })}
              placeholder={
                corto
                  ? "Relleno con ácido hialurónico en pómulos y surcos. Dos sesiones."
                  : "Fase 1 de ortopedia funcional: expansión del maxilar superior…"
              }
            />
          </Campo>

          {corto ? null : (
            <Campo etiqueta="Técnica a utilizar" nota="Aparatología y prescripción.">
              <Textarea
                rows={2}
                value={paciente.tecnica}
                onChange={(e) => actualizar({ tecnica: e.target.value })}
                placeholder="Brackets de autoligado pasivo, prescripción Roth 0.022"
              />
            </Campo>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
