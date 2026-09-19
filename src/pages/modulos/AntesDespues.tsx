import { useState } from "react"
import { ImageOff } from "lucide-react"

import { TituloBloque } from "@/components/campos"
import { RecuadroFoto } from "@/components/fotos"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { SLOTS_AF, type FotoSlot, type Paciente, type SlotFoto } from "@/lib/tipos"
import { fotoDemo } from "@/lib/util"

interface Props {
  paciente: Paciente
  actualizar: (cambios: Partial<Paciente>) => void
}

/** Las 3 tomas de un momento: frente, perfil derecho y perfil izquierdo. */
function Tanda({
  fotos,
  semilla,
  onCambio,
}: {
  fotos: FotoSlot[]
  semilla: string
  onCambio: (fotos: FotoSlot[]) => void
}) {
  const url = (slot: SlotFoto) => fotos.find((f) => f.slot === slot)?.url ?? null
  const set = (slot: SlotFoto, valor: string | null) =>
    onCambio(fotos.map((f) => (f.slot === slot ? { ...f, url: valor } : f)))

  return (
    <div className="grid max-w-2xl grid-cols-3 gap-2.5 sm:gap-3">
      {SLOTS_AF.map((s) => (
        <RecuadroFoto
          key={s.id}
          url={url(s.id)}
          etiqueta={s.etiqueta}
          onSubir={() => set(s.id, fotoDemo(`${semilla}-${s.id}`))}
          onQuitar={() => set(s.id, null)}
        />
      ))}
    </div>
  )
}

function Vista({ url, etiqueta }: { url: string | null; etiqueta: string }) {
  return (
    <div className="relative aspect-4/5 overflow-hidden rounded-lg border border-border bg-muted">
      {url ? (
        <img src={url} alt={etiqueta} loading="lazy" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <ImageOff className="size-4" />
        </div>
      )}
      <span className="absolute bottom-1 left-1 rounded bg-brand-dark/80 px-1.5 py-0.5 text-[9px] font-medium text-white">
        {etiqueta}
      </span>
    </div>
  )
}

function contar(fotos: FotoSlot[]): number {
  return fotos.filter((f) => f.url).length
}

/**
 * Módulo de fotos de armonización facial: 6 slots en total,
 * 3 antes y 3 después. Sin fotos intra-tratamiento.
 */
export function AntesDespues({ paciente, actualizar }: Props) {
  const [comparando, setComparando] = useState(false)
  const antes = paciente.fotosAntes
  const despues = paciente.fotosDespues

  const urlDe = (fotos: FotoSlot[], slot: SlotFoto) =>
    fotos.find((f) => f.slot === slot)?.url ?? null

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-5 pt-6">
          <TituloBloque
            titulo="Antes / Después"
            descripcion="Tres tomas de cada momento: frente, perfil derecho y perfil izquierdo."
            accion={
              <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-muted-foreground">
                Ver comparación
                <Switch checked={comparando} onCheckedChange={(v: boolean) => setComparando(v)} />
              </label>
            }
          />

          {comparando ? (
            /* Comparando hay el doble de fotos por fila: en mobile va de a una
               toma por renglón para que cada par se vea de verdad. */
            <div className="grid max-w-4xl grid-cols-1 gap-4 min-[520px]:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              {SLOTS_AF.map((s) => (
                <div key={s.id} className="space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    <Vista url={urlDe(antes, s.id)} etiqueta="Antes" />
                    <Vista url={urlDe(despues, s.id)} etiqueta="Después" />
                  </div>
                  <p className="text-center text-[11px] leading-tight text-muted-foreground">
                    {s.etiqueta}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2.5">
                <div className="flex max-w-2xl items-baseline justify-between gap-3">
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Antes
                  </p>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {contar(antes)} de 3
                  </span>
                </div>
                <Tanda
                  fotos={antes}
                  semilla={`${paciente.id}-antes`}
                  onCambio={(fotosAntes) => actualizar({ fotosAntes })}
                />
              </div>

              <div className="space-y-2.5 border-t border-border pt-5">
                <div className="flex max-w-2xl items-baseline justify-between gap-3">
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Después
                  </p>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {contar(despues)} de 3
                  </span>
                </div>
                <Tanda
                  fotos={despues}
                  semilla={`${paciente.id}-despues`}
                  onCambio={(fotosDespues) => actualizar({ fotosDespues })}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
