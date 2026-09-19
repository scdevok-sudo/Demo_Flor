import { FileText, ImageIcon, Plus, Trash2 } from "lucide-react"

import { SelectSimple, TituloBloque } from "@/components/campos"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  MAX_ARCHIVOS,
  MOMENTOS,
  type Archivo,
  type MomentoEstudio,
  type Paciente,
} from "@/lib/tipos"
import { fotoDemo, hoyISO, nuevoId } from "@/lib/util"

interface Props {
  paciente: Paciente
  actualizar: (cambios: Partial<Paciente>) => void
}

function Bloque({
  titulo,
  descripcion,
  archivos,
  onCambio,
  formato,
  prefijoNombre,
  semilla,
}: {
  titulo: string
  descripcion: string
  archivos: Archivo[]
  onCambio: (archivos: Archivo[]) => void
  formato: Archivo["formato"]
  prefijoNombre: string
  semilla: string
}) {
  const lleno = archivos.length >= MAX_ARCHIVOS

  const agregar = () =>
    onCambio([
      ...archivos,
      {
        id: nuevoId("arch"),
        nombre: `${prefijoNombre}-${hoyISO()}.${formato === "pdf" ? "pdf" : "jpg"}`,
        momento: "Inicial",
        formato,
        url: formato === "imagen" ? fotoDemo(`${semilla}-${Date.now()}`, 600, 400) : null,
      },
    ])

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <TituloBloque
          titulo={titulo}
          descripcion={descripcion}
          accion={
            <Button type="button" variant="outline" size="sm" disabled={lleno} onClick={agregar}>
              <Plus className="size-3.5" />
              Agregar
            </Button>
          }
        />

        {archivos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-input bg-muted/40 px-5 py-9 text-center text-sm text-muted-foreground">
            Sin archivos cargados.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {archivos.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                  {a.url ? (
                    <img src={a.url} alt={a.nombre} loading="lazy" className="size-full object-cover" />
                  ) : a.formato === "pdf" ? (
                    <FileText className="size-5" />
                  ) : (
                    <ImageIcon className="size-5" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-dark">{a.nombre}</p>
                  <p className="text-xs text-muted-foreground uppercase">{a.formato}</p>
                </div>

                <SelectSimple
                  className="h-8 w-36"
                  valor={a.momento}
                  onCambio={(v) =>
                    onCambio(
                      archivos.map((x) =>
                        x.id === a.id ? { ...x, momento: v as MomentoEstudio } : x
                      )
                    )
                  }
                  opciones={MOMENTOS}
                />

                <button
                  type="button"
                  onClick={() => onCambio(archivos.filter((x) => x.id !== a.id))}
                  aria-label={`Quitar ${a.nombre}`}
                  className="rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive md:p-2"
                >
                  <Trash2 className="size-5 md:size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-muted-foreground tabular-nums">
          {archivos.length} de {MAX_ARCHIVOS} archivos
        </p>
      </CardContent>
    </Card>
  )
}

export function Estudios({ paciente, actualizar }: Props) {
  return (
    <div className="space-y-5">
      <Bloque
        titulo="Radiografías"
        descripcion="Panorámicas, teleperfiles y periapicales."
        archivos={paciente.radiografias}
        onCambio={(radiografias) => actualizar({ radiografias })}
        formato="imagen"
        prefijoNombre="radiografia"
        semilla={`${paciente.id}-rx`}
      />
      <Bloque
        titulo="Estudios complementarios"
        descripcion="Cefalometrías, periodontogramas, interconsultas."
        archivos={paciente.estudios}
        onCambio={(estudios) => actualizar({ estudios })}
        formato="pdf"
        prefijoNombre="estudio"
        semilla={`${paciente.id}-es`}
      />
    </div>
  )
}
