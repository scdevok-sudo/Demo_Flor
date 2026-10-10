import { Sparkles } from "lucide-react"

import { Campo } from "@/components/campos"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { EstadoDiagnostico } from "@/data/useDiagnostico"
import { esArmonizacion, type Paciente } from "@/lib/tipos"
import { fechaCorta } from "@/lib/util"

interface Props {
  paciente: Paciente
  estado: EstadoDiagnostico
}

export function Diagnostico({ paciente, estado }: Props) {
  // Armonización facial usa la versión corta: dos campos breves y sin técnica.
  const corto = esArmonizacion(paciente.categoria)
  const { form, editar, hayCambios, guardando, cargando, error, guardar, versiones } = estado

  if (cargando) return <p className="py-12 text-center text-sm text-muted-foreground">Cargando diagnóstico…</p>

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-brand-coral/40 bg-brand-coral-soft px-4 py-3.5">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-brand-dark" />
        <p className="text-sm leading-relaxed text-brand-dark">
          Lo que guardes acá se copia solo al presupuesto: no hace falta volver a escribirlo.
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
              value={form.diagnostico}
              onChange={(e) => editar({ diagnostico: e.target.value })}
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
              value={form.plan}
              onChange={(e) => editar({ plan: e.target.value })}
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
                value={form.tecnica}
                onChange={(e) => editar({ tecnica: e.target.value })}
                placeholder="Brackets de autoligado pasivo, prescripción Roth 0.022"
              />
            </Campo>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <Button
              type="button"
              size="lg"
              className="h-11 sm:h-10"
              disabled={!hayCambios || guardando}
              onClick={() => void guardar()}
            >
              {guardando ? "Guardando…" : "Guardar diagnóstico"}
            </Button>
            {error ? (
              <p role="alert" className="text-sm text-destructive">{error}</p>
            ) : hayCambios ? (
              <p className="text-xs text-muted-foreground">Hay cambios sin guardar.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {versiones.length > 1 ? (
        <Card>
          <CardContent className="pt-6">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-brand-dark">
                Versiones anteriores ({versiones.length - 1})
              </summary>
              <ul className="mt-4 space-y-4">
                {versiones.slice(1).map((v) => (
                  <li key={v.id} className="space-y-1.5 rounded-xl border border-border px-4 py-3">
                    <p className="text-xs font-semibold text-muted-foreground tabular-nums">
                      {fechaCorta(v.creado.slice(0, 10))}
                    </p>
                    <p className="text-sm whitespace-pre-wrap text-brand-dark">
                      <span className="font-medium">Diagnóstico: </span>{v.diagnostico || "—"}
                    </p>
                    <p className="text-sm whitespace-pre-wrap text-brand-dark">
                      <span className="font-medium">Plan: </span>{v.plan || "—"}
                    </p>
                    {corto ? null : (
                      <p className="text-sm whitespace-pre-wrap text-brand-dark">
                        <span className="font-medium">Técnica: </span>{v.tecnica || "—"}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
