import { Camera, Trash2 } from "lucide-react"
import { cn } from "cn"

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
