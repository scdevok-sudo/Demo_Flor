import { useRef, type ReactNode } from "react"
import { Camera, ImageOff, RefreshCw, Trash2 } from "lucide-react"
import { cn } from "cn"

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
    <video src={archivo.url} controls preload="metadata" playsInline className="size-full object-cover" />
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

/** Recuadro de un slot fijo. Vacío: invita a subir. Cargado: solo se puede reemplazar, no borrar. */
export function RecuadroSlot({
  archivo,
  etiqueta,
  subiendo,
  accept,
  onArchivo,
}: {
  archivo: ArchivoClinico | null
  etiqueta: string
  subiendo: boolean
  accept: string
  onArchivo: (file: File) => void
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
            <SelectorArchivo
              accept={accept}
              onArchivo={onArchivo}
              disabled={subiendo}
              etiqueta={`Reemplazar ${etiqueta}`}
              className="absolute top-1 right-1 rounded-lg bg-white/90 p-2.5 text-brand-dark shadow-sm md:top-1.5 md:right-1.5 md:p-1.5"
            >
              <RefreshCw className="size-5 md:size-3.5" />
            </SelectorArchivo>
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
            Subiendo…
          </div>
        ) : null}
      </div>
      <p className="text-center text-[11px] leading-tight text-muted-foreground">{etiqueta}</p>
    </div>
  )
}
