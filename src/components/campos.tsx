import type { ReactNode } from "react"
import { cn } from "cn"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/** Etiqueta + control, con la nota opcional debajo. */
export function Campo({
  etiqueta,
  nota,
  className,
  children,
}: {
  etiqueta: string
  nota?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {etiqueta}
      </Label>
      {children}
      {nota ? <p className="text-xs text-muted-foreground">{nota}</p> : null}
    </div>
  )
}

export interface Opcion {
  valor: string
  etiqueta?: string
}

export function SelectSimple({
  valor,
  onCambio,
  opciones,
  placeholder = "Elegir…",
  className,
}: {
  valor: string
  onCambio: (valor: string) => void
  opciones: Array<Opcion | string>
  placeholder?: string
  className?: string
}) {
  const items: Opcion[] = opciones.map((o) => (typeof o === "string" ? { valor: o } : o))
  const etiquetaDe = (v: string) => items.find((o) => o.valor === v)?.etiqueta ?? v

  return (
    <Select value={valor} onValueChange={(v) => onCambio(String(v ?? ""))}>
      <SelectTrigger className={cn("h-9 w-full min-h-10 sm:min-h-0", className)}>
        <SelectValue placeholder={placeholder}>
          {(v: unknown) => (v ? etiquetaDe(String(v)) : placeholder)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.map((o) => (
          <SelectItem key={o.valor} value={o.valor}>
            {o.etiqueta ?? o.valor}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Dato de sólo lectura, para las vistas previas. */
export function DatoLeido({
  etiqueta,
  valor,
  className,
}: {
  etiqueta: string
  valor: ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {etiqueta}
      </p>
      <div className="text-sm leading-relaxed text-foreground">{valor || "—"}</div>
    </div>
  )
}

/** Encabezado de bloque dentro de un módulo. */
export function TituloBloque({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string
  descripcion?: string
  accion?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h3 className="font-heading text-lg text-brand-dark">{titulo}</h3>
        {descripcion ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{descripcion}</p>
        ) : null}
      </div>
      {accion}
    </div>
  )
}
