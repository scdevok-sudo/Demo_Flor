import { lazy, Suspense, useState } from "react"
import { Box, ExternalLink, FileText, Layers, Plus, RefreshCw, X } from "lucide-react"

import { SelectSimple, TituloBloque } from "@/components/campos"
import { BotonBorrar, SelectorArchivo } from "@/components/fotos"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TOPES, nombreVisible, type ArchivoClinico, type TipoArchivo, type Etapa, type Origen } from "@/data/archivos"
import { useArchivos, type Archivos } from "@/data/useArchivos"
import type { Paciente } from "@/lib/tipos"
import { fechaCorta } from "@/lib/util"
import { extensionDe, visorDe } from "@/lib/visores"

const Visor3D = lazy(() => import("@/components/Visor3D").then((m) => ({ default: m.Visor3D })))
const VisorDicom = lazy(() => import("@/components/VisorDicom").then((m) => ({ default: m.VisorDicom })))

const TIPOS: TipoArchivo[] = ["imagen", "pdf", "modelo3d", "estudio_dicom"]

interface Props {
  paciente: Paciente
}

// Escaneo intraoral en STL/PLY (visor de malla 3D) y estudios DICOM en ZIP (visor de cortes 2D).
const ACEPTA = "image/*,application/pdf,.stl,.ply,.zip"

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
  const convirtiendoNuevo = archivos.convirtiendo.includes(clave)

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
              {convirtiendoNuevo ? "Procesando…" : subiendoNuevo ? "Subiendo…" : "Agregar"}
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
  const nombre = nombreVisible(a)
  const subiendo = archivos.subiendo.includes(a.id)
  const [viendo, setViendo] = useState(false)
  const [viendoCortes, setViendoCortes] = useState(false)
  const visor = a.url ? visorDe(a.storagePath) : null

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
        {a.tipo === "imagen" && a.url ? (
          <img src={a.url} alt={nombre} loading="lazy" className="size-full object-cover" />
        ) : (
          a.tipo === "modelo3d" ? (
            <Box className="size-5" />
          ) : a.tipo === "estudio_dicom" ? (
            <Layers className="size-5" />
          ) : (
            <FileText className="size-5" />
          )
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-brand-dark">{nombre}</p>
        <p className="text-xs text-muted-foreground">
          <span className="uppercase">{a.tipo === "modelo3d" ? "3D" : a.tipo === "estudio_dicom" ? "DICOM" : a.tipo}</span> · {fechaCorta(a.fecha)}
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
            <DialogContent className="sm:max-w-[min(48rem,calc(100%-2rem))]">
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

      {a.tipo === "estudio_dicom" && a.url ? (
        <>
          <Button type="button" variant="outline" size="sm" onClick={() => setViendoCortes(true)}>
            <Layers className="size-3.5" />
            Ver cortes
          </Button>
          <Dialog open={viendoCortes} onOpenChange={setViendoCortes}>
            <DialogContent
              showCloseButton={false}
              className="top-0 left-0 flex h-dvh max-h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-2 rounded-none p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:max-w-none sm:gap-3 sm:p-4"
            >
              <DialogHeader className="flex-row items-center justify-between gap-2">
                <DialogTitle className="min-w-0 flex-1 truncate">{nombre}</DialogTitle>
                <DialogClose render={<Button variant="ghost" size="icon" className="size-11 shrink-0" />}>
                  <X className="size-5" />
                  <span className="sr-only">Cerrar</span>
                </DialogClose>
              </DialogHeader>
              {viendoCortes ? (
                <div className="min-h-0 flex-1">
                  <Suspense fallback={<p className="py-10 text-center text-sm">Cargando visor…</p>}>
                    <VisorDicom url={a.url} />
                  </Suspense>
                </div>
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
        descripcion="Panorámicas, teleperfiles y periapicales. Imagen, PDF, modelo 3D (STL/PLY) o estudio DICOM (ZIP)."
        origen="radiografia"
        archivos={archivos}
      />
      <Bloque
        titulo="Estudios complementarios"
        descripcion="Cefalometrías, periodontogramas, interconsultas. Imagen, PDF, modelo 3D (STL/PLY) o estudio DICOM (ZIP)."
        origen="estudio"
        archivos={archivos}
      />
    </div>
  )
}
