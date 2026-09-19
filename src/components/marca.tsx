import { cn } from "cn"

/** Isotipo "fi." — el punto va siempre en coral. */
export function Isotipo({
  className,
  tono = "claro",
}: {
  className?: string
  tono?: "claro" | "oscuro"
}) {
  return (
    <span
      className={cn(
        "font-heading leading-none tracking-tight select-none",
        tono === "claro" ? "text-white" : "text-brand-dark",
        className
      )}
    >
      fi<span className="text-brand-coral">.</span>
    </span>
  )
}

export function Firma({ className, tono = "claro" }: { className?: string; tono?: "claro" | "oscuro" }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Isotipo className="text-3xl" tono={tono} />
      <span
        className={cn(
          "border-l pl-2.5 text-[11px] leading-tight font-medium tracking-wide uppercase",
          tono === "claro"
            ? "border-white/20 text-white/70"
            : "border-brand-light text-muted-foreground"
        )}
      >
        Florencia
        <br />
        Inveninato
      </span>
    </div>
  )
}
