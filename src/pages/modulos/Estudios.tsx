import { lazy, Suspense, useState } from "react"
import { Box, ExternalLink, FileText, Plus, RefreshCw } from "lucide-react"

import { SelectSimple, TituloBloque } from "@/components/campos"
import { BotonBorrar, SelectorArchivo } from "@/components/fotos"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TOPES, type ArchivoClinico, type TipoArchivo, type Etapa, type Origen } from "@/data/archivos"
import { useArchivos, type Archivos } from "@/data/useArchivos"
import type { Paciente } from "@/lib/tipos"
import { fechaCorta } from "@/lib/util"
import { extensionDe, visorDe } from "@/lib/visores"

const Visor3D = lazy(() => import("@/components/Visor3D").then((m) => ({ default: m.Visor3D })))

const TIPOS: TipoArchivo[] = ["imagen", "pdf", "modelo3d"]

interface Props {
  paciente: Paciente
}

// Estudios 3D: se asume escaneo intraoral en STL/PLY (formato de Imago SIN confirmar).
// Si resulta ser DICOM (tomografía) hace falta un visor aparte: ver src/lib/visores.ts.
const ACEPTA = "image/*,application/pdf,.stl,.ply"

const ETAPAS: { valor: Etapa; etiqueta: string }[] = [
  { valor: "inicial", etiqueta: "Inicial" },
  { valor: "intermedio", etiqueta: "Intermedio" },
  { valor: "final", etiqueta: "Final" },
]

function Bloque({
  titulo,
  descripcion,
  origen,
  archivos,
}: {
  titulo: string
  descripcion: string
  origen: Origen
  archivos: Archivos
}) {
  const lista = archivos.delOrigen(origen)
  const max = TOPES[origen]
  const lleno = lista.length >= max
  const clave = `${origen}:nuevo`
  const subiendoNuevo = archivos.subiendo.includes(clave)

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <TituloBloque
          titulo={titulo}
          descripcion={descripcion}
          accion={
            <SelectorArchivo
              accept={ACEPTA}
              disabled={lleno || subiendoNuevo}
              onArchivo={(file) =>
                archivos.subir(clave, origen, file, TIPOS, {
                  etiqueta: file.name,
                  etapa: "inicial",
                })
              }
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              {subiendoNuevo ? "Subiendo…" : "Agregar"}
            </SelectorArchivo>
          }
        />

        {lista.length === 0 ? (
          <div className="rounded-xl border border-dashed border-input bg-muted/40 px-5 py-9 text-center text-sm text-muted-foreground">
            Sin archivos cargados.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {lista.map((a) => (
              <Fila key={a.id} archivo={a} archivos={archivos} />
            ))}
          </ul>
        )}

        <p className="text-xs text-muted-foreground tabular-nums">
          {lista.length} de {max} archivos
        </p>
      </CardContent>
    </Card>
  )
}

function Fila({ archivo: a, archivos }: { archivo: ArchivoClinico; archivos: Archivos }) {
  const nombre = a.etiqueta || (a.tipo === "pdf" ? "Estudio.pdf" : "Imagen")
  const subiendo = archivos.subiendo.includes(a.id)
  const [viendo, setViendo] = useState(false)
  const visor = a.url ? visorDe(a.storagePath) : null

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
        {a.tipo === "imagen" && a.url ? (
          <img src={a.url} alt={nombre} loading="lazy" className="size-full object-cover" />
        ) : (
          a.tipo === "modelo3d" ? <Box className="size-5" /> : <FileText className="size-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-brand-dark">{nombre}</p>
        <p className="text-xs text-muted-foreground">
          <span className="uppercase">{a.tipo === "modelo3d" ? "3D" : a.tipo}</span> · {fechaCorta(a.fecha)}
        </p>
      </div>

      <SelectSimple
        className="h-8 w-36"
        valor={a.etapa ?? "inicial"}
        onCambio={(v) => archivos.actualizar(a, { etapa: v as Etapa })}
        opciones={ETAPAS}
      />

      {visor === "malla3d" && a.url ? (
        <>
          <Button type="button" variant="outline" size="sm" onClick={() => setViendo(true)}>
            <Box className="size-3.5" />
            Ver en 3D
          </Button>
          <Dialog open={viendo} onOpenChange={setViendo}>
            <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>{nombre}</DialogTitle>
              </DialogHeader>
              {viendo ? (
                <Suspense fallback={<p className="py-10 text-center text-sm">Cargando visor…</p>}>
                  <Visor3D url={a.url} extension={extensionDe(a.storagePath)} />
                </Suspense>
              ) : null}
            </DialogContent>
          </Dialog>
        </>
      ) : null}

      {a.url ? (
        <a
          href={a.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Abrir ${nombre}`}
          className="rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-brand-dark md:p-2"
        >
          <ExternalLink className="size-5 md:size-4" />
        </a>
      ) : null}

      <SelectorArchivo
        accept={ACEPTA}
        disabled={subiendo}
        onArchivo={(file) => archivos.reemplazar(a, file, TIPOS)}
        etiqueta={`Reemplazar ${nombre}`}
        className="rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-brand-dark disabled:opacity-50 md:p-2"
      >
        <RefreshCw className="size-5 md:size-4" />
      </SelectorArchivo>

      <BotonBorrar
        nombre={nombre}
        disabled={subiendo}
        onConfirmar={() => archivos.borrar(a)}
        iconoClassName="size-5 md:size-4"
        className="rounded-lg p-2.5 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50 md:p-2"
      />
    </li>
  )
}

export function Estudios({ paciente }: Props) {
  const archivos = useArchivos(paciente.id)

  if (archivos.cargando) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Cargando estudios…</p>
  }

  return (
    <div className="space-y-5">
      {archivos.error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {archivos.error}
          <Button type="button" variant="outline" size="sm" onClick={archivos.recargar}>
            Recargar
          </Button>
        </div>
      ) : null}
      <Bloque
        titulo="Radiografías"
        descripcion="Panorámicas, teleperfiles y periapicales. Imagen, PDF o modelo 3D (STL/PLY)."
        origen="radiografia"
        archivos={archivos}
      />
      <Bloque
        titulo="Estudios complementarios"
        descripcion="Cefalometrías, periodontogramas, interconsultas. Imagen, PDF o modelo 3D (STL/PLY)."
        origen="estudio"
        archivos={archivos}
      />
    </div>
  )
}
