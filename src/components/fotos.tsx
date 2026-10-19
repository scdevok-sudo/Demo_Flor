import { useRef, useState, type ReactNode } from "react"
import { Camera, Download, ImageOff, RefreshCw, Trash2, VideoOff } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ArchivoClinico } from "@/data/archivos"

/**
 * Recuadro de una foto de slot fijo. Lo comparten la serie dental
 * y la galería de antes/después de armonización facial.
 *
 * En mobile el botón de borrar queda siempre visible: sin hover no hay
 * otra forma de llegar a él.
 */
export function RecuadroFoto({
  url,
  etiqueta,
  onSubir,
  onQuitar,
}: {
  url: string | null
  etiqueta: string
  onSubir: () => void
  onQuitar: () => void
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "group relative aspect-4/5 overflow-hidden rounded-xl border",
          url ? "border-border bg-muted" : "border-dashed border-input bg-muted/40"
        )}
      >
        {url ? (
          <>
            <img src={url} alt={etiqueta} loading="lazy" className="size-full object-cover" />
            <button
              type="button"
              onClick={onQuitar}
              aria-label={`Quitar foto ${etiqueta}`}
              className="absolute top-1 right-1 rounded-lg bg-white/90 p-2.5 text-brand-dark shadow-sm transition-opacity md:p-1.5 md:top-1.5 md:right-1.5 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              <Trash2 className="size-5 md:size-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onSubir}
            className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors hover:bg-brand-coral-soft hover:text-brand-dark"
          >
            <Camera className="size-5" />
            <span className="text-[11px] font-medium">Subir foto</span>
          </button>
        )}
      </div>
      <p className="text-center text-[11px] leading-tight text-muted-foreground">{etiqueta}</p>
    </div>
  )
}

/**
 * Video con respaldo: los de iPhone suelen venir en HEVC, que Firefox y varios Chrome no decodifican.
 * Si el navegador no puede, se avisa y se ofrece descargarlo en vez de dejar un reproductor en blanco.
 */
export function VideoReproducible({ url }: { url: string }) {
  const [falla, setFalla] = useState(false)
  if (falla) {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-2 bg-muted p-3 text-center">
        <VideoOff className="size-5 text-muted-foreground" />
        <p className="text-[11px] leading-tight text-muted-foreground">
          Este video no se puede reproducir en este navegador.
        </p>
        <a
          href={`${url}${url.includes("?") ? "&" : "?"}download=`}
          download
          className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-brand-dark hover:bg-muted"
        >
          <Download className="size-3.5" />
          Descargar
        </a>
      </div>
    )
  }
  return (
    <video
      src={url}
      controls
      preload="metadata"
      playsInline
      onError={() => setFalla(true)}
      className="size-full object-cover"
    />
  )
}

/** Foto o video de un archivo clínico real: muestra el contenido y permite subir o reemplazar. */
export function ContenidoArchivo({ archivo, etiqueta }: { archivo: ArchivoClinico; etiqueta: string }) {
  if (!archivo.url) {
    return (
      <div className="flex size-full items-center justify-center text-muted-foreground">
        <ImageOff className="size-5" />
      </div>
    )
  }
  return archivo.tipo === "video" ? (
    <VideoReproducible url={archivo.url} />
  ) : (
    <img src={archivo.url} alt={etiqueta} loading="lazy" className="size-full object-cover" />
  )
}

/** Botón + input oculto para elegir un archivo (en el celular abre cámara o galería). */
export function SelectorArchivo({
  accept,
  onArchivo,
  disabled,
  className,
  children,
  etiqueta,
}: {
  accept: string
  onArchivo: (file: File) => void
  disabled?: boolean
  className?: string
  children: ReactNode
  etiqueta?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) onArchivo(file)
        }}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={etiqueta}
        onClick={() => ref.current?.click()}
        className={className}
      >
        {children}
      </button>
    </>
  )
}

/**
 * Botón de borrar + modal de confirmación. Es evidencia clínica: nunca borra de un solo clic.
 * `nombre` es lo que se nombra en el modal (p. ej. «Perfil izquierdo» o «el estudio.pdf»).
 */
export function BotonBorrar({
  nombre,
  disabled,
  onConfirmar,
  className,
  iconoClassName,
}: {
  nombre: string
  disabled?: boolean
  onConfirmar: () => Promise<unknown>
  className?: string
  iconoClassName?: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [borrando, setBorrando] = useState(false)

  async function confirmar() {
    setBorrando(true)
    await onConfirmar()
    setBorrando(false)
    setAbierto(false)
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        aria-label={`Borrar ${nombre}`}
        onClick={() => setAbierto(true)}
        className={className}
      >
        <Trash2 className={iconoClassName ?? "size-5 md:size-3.5"} />
      </button>
      <Dialog open={abierto} onOpenChange={(v) => (borrando ? undefined : setAbierto(v))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-brand-dark">
              ¿Borrar {nombre}?
            </DialogTitle>
            <DialogDescription>
              Es material clínico del paciente. Se elimina de la ficha y del almacenamiento, y no
              se puede recuperar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="h-11 sm:h-9"
              disabled={borrando}
              onClick={() => setAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="h-11 sm:h-9"
              disabled={borrando}
              onClick={() => void confirmar()}
            >
              {borrando ? "Borrando…" : "Sí, borrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Recuadro de un slot fijo. Vacío: invita a subir. Cargado: se puede reemplazar o borrar (el slot queda libre). */
export function RecuadroSlot({
  archivo,
  etiqueta,
  subiendo,
  convirtiendo,
  accept,
  onArchivo,
  onBorrar,
}: {
  archivo: ArchivoClinico | null
  etiqueta: string
  subiendo: boolean
  convirtiendo?: boolean
  accept: string
  onArchivo: (file: File) => void
  onBorrar: (archivo: ArchivoClinico) => Promise<unknown>
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "relative aspect-4/5 overflow-hidden rounded-xl border",
          archivo ? "border-border bg-muted" : "border-dashed border-input bg-muted/40"
        )}
      >
        {archivo ? (
          <>
            <ContenidoArchivo archivo={archivo} etiqueta={etiqueta} />
            <div className="absolute top-1 right-1 flex gap-1 md:top-1.5 md:right-1.5">
              <SelectorArchivo
                accept={accept}
                onArchivo={onArchivo}
                disabled={subiendo}
                etiqueta={`Reemplazar ${etiqueta}`}
                className="rounded-lg bg-white/90 p-2.5 text-brand-dark shadow-sm md:p-1.5"
              >
                <RefreshCw className="size-5 md:size-3.5" />
              </SelectorArchivo>
              <BotonBorrar
                nombre={etiqueta}
                disabled={subiendo}
                onConfirmar={() => onBorrar(archivo)}
                className="rounded-lg bg-white/90 p-2.5 text-destructive shadow-sm md:p-1.5"
              />
            </div>
          </>
        ) : (
          <SelectorArchivo
            accept={accept}
            onArchivo={onArchivo}
            disabled={subiendo}
            className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors hover:bg-brand-coral-soft hover:text-brand-dark"
          >
            <Camera className="size-5" />
            <span className="text-[11px] font-medium">Subir</span>
          </SelectorArchivo>
        )}
        {subiendo ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-medium text-brand-dark">
            {convirtiendo ? "Convirtiendo…" : "Subiendo…"}
          </div>
        ) : null}
      </div>
      <p className="text-center text-[11px] leading-tight text-muted-foreground">{etiqueta}</p>
    </div>
  )
}
