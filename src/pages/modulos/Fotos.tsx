import { useState } from "react"
import { ImageOff, Play, Plus, Trash2, Video } from "lucide-react"
import { cn } from "cn"

import { TituloBloque } from "@/components/campos"
import { RecuadroFoto } from "@/components/fotos"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  MAX_FOTOS_INTRA,
  SLOTS_BOCA,
  SLOTS_CARA,
  type FotoFechada,
  type FotoSlot,
  type Paciente,
  type SlotFoto,
} from "@/lib/tipos"
import { fechaCorta, fotoDemo, hoyISO, nuevoId } from "@/lib/util"

interface Props {
  paciente: Paciente
  actualizar: (cambios: Partial<Paciente>) => void
}

/** Serie fija de 10 fotos: 4 de cara + 6 de boca. */
function Serie({
  fotos,
  semilla,
  onCambio,
  comparar,
}: {
  fotos: FotoSlot[]
  semilla: string
  onCambio: (fotos: FotoSlot[]) => void
  comparar?: FotoSlot[]
}) {
  const url = (slot: SlotFoto) => fotos.find((f) => f.slot === slot)?.url ?? null
  const urlComparada = (slot: SlotFoto) => comparar?.find((f) => f.slot === slot)?.url ?? null

  const set = (slot: SlotFoto, valor: string | null) =>
    onCambio(fotos.map((f) => (f.slot === slot ? { ...f, url: valor } : f)))

  const grupo = (titulo: string, slots: readonly { id: SlotFoto; etiqueta: string }[]) => (
    <div className="space-y-2.5">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {titulo}
      </p>
      {/* Comparando entran dos fotos por celda, así que van menos columnas. */}
      <div
        className={cn(
          "grid gap-2.5 sm:gap-3",
          comparar
            ? "grid-cols-1 gap-4 min-[520px]:grid-cols-2 sm:gap-3 lg:grid-cols-3"
            : "grid-cols-2 min-[440px]:grid-cols-3 lg:grid-cols-5"
        )}
      >
        {slots.map((s) => (
          <div key={s.id} className={comparar ? "space-y-2" : undefined}>
            {comparar ? (
              <div className="grid grid-cols-2 gap-1.5">
                <ComparaFoto url={urlComparada(s.id)} etiqueta="Antes" />
                <ComparaFoto url={url(s.id)} etiqueta="Después" />
              </div>
            ) : (
              <RecuadroFoto
                url={url(s.id)}
                etiqueta={s.etiqueta}
                onSubir={() => set(s.id, fotoDemo(`${semilla}-${s.id}`))}
                onQuitar={() => set(s.id, null)}
              />
            )}
            {comparar ? (
              <p className="text-center text-[11px] leading-tight text-muted-foreground">
                {s.etiqueta}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {grupo("Cara", SLOTS_CARA as readonly { id: SlotFoto; etiqueta: string }[])}
      {grupo("Boca", SLOTS_BOCA as readonly { id: SlotFoto; etiqueta: string }[])}
    </div>
  )
}

function ComparaFoto({ url, etiqueta }: { url: string | null; etiqueta: string }) {
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

/** Foto o video con fecha y nota. El video es un placeholder: no se reproduce. */
function TileFechado({
  item,
  onCambioNota,
  onQuitar,
}: {
  item: FotoFechada
  onCambioNota: (nota: string) => void
  onQuitar: () => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="group relative aspect-4/5 overflow-hidden rounded-xl border border-border bg-muted">
        <img
          src={item.url}
          alt={item.nota || (item.video ? "Video" : "Control")}
          loading="lazy"
          className="size-full object-cover"
        />
        {item.video ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/25">
              <span className="flex size-11 items-center justify-center rounded-full bg-white/90 text-brand-dark shadow-sm">
                <Play className="size-5 fill-current" />
              </span>
            </div>
            <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded bg-brand-dark/85 px-1.5 py-0.5 text-[10px] font-medium text-white">
              <Video className="size-3" />
              Video
            </span>
          </>
        ) : null}
        <button
          type="button"
          onClick={onQuitar}
          aria-label={item.video ? "Quitar video" : "Quitar foto"}
          className="absolute top-1 right-1 rounded-lg bg-white/90 p-2.5 text-brand-dark shadow-sm transition-opacity md:p-1.5 md:top-1.5 md:right-1.5 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        >
          <Trash2 className="size-5 md:size-3.5" />
        </button>
        <span className="absolute bottom-1.5 left-1.5 rounded bg-brand-dark/85 px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums">
          {fechaCorta(item.fecha)}
        </span>
      </div>
      <Input
        className="h-9 border-transparent bg-transparent px-1 text-xs hover:border-input md:h-8"
        value={item.nota}
        placeholder={item.video ? "Nota del video…" : "Nota del control…"}
        onChange={(e) => onCambioNota(e.target.value)}
      />
    </div>
  )
}

function nuevoVideo(semilla: string): FotoFechada {
  return {
    id: nuevoId("vid"),
    url: fotoDemo(`${semilla}-${Date.now()}`, 480, 600),
    fecha: hoyISO(),
    nota: "",
    video: true,
  }
}

/** Videos de una sección de fotos. */
function Videos({
  videos,
  semilla,
  onCambio,
}: {
  videos: FotoFechada[]
  semilla: string
  onCambio: (videos: FotoFechada[]) => void
}) {
  return (
    <div className="space-y-2.5 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Videos
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9"
          onClick={() => onCambio([nuevoVideo(semilla), ...videos])}
        >
          <Video className="size-3.5" />
          Subir video
        </Button>
      </div>
      {videos.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin videos cargados.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 min-[440px]:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {videos.map((v) => (
            <TileFechado
              key={v.id}
              item={v}
              onCambioNota={(nota) =>
                onCambio(videos.map((x) => (x.id === v.id ? { ...x, nota } : x)))
              }
              onQuitar={() => onCambio(videos.filter((x) => x.id !== v.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function contar(fotos: FotoSlot[]): number {
  return fotos.filter((f) => f.url).length
}

export function Fotos({ paciente, actualizar }: Props) {
  const [comparando, setComparando] = useState(false)
  const intra = paciente.fotosIntra
  const lleno = intra.length >= MAX_FOTOS_INTRA

  return (
    <div className="space-y-5">
      {/* --- Iniciales ------------------------------------------------------ */}
      <Card>
        <CardContent className="space-y-5 pt-6">
          <TituloBloque
            titulo="Fotografías iniciales"
            descripcion="Serie fija de 10 tomas: 4 de cara y 6 de boca."
            accion={
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {contar(paciente.fotosIniciales)} de 10 cargadas
              </span>
            }
          />
          <Serie
            fotos={paciente.fotosIniciales}
            semilla={`${paciente.id}-ini`}
            onCambio={(fotosIniciales) => actualizar({ fotosIniciales })}
          />
          <Videos
            videos={paciente.videosIniciales}
            semilla={`${paciente.id}-vid-ini`}
            onCambio={(videosIniciales) => actualizar({ videosIniciales })}
          />
        </CardContent>
      </Card>

      {/* --- Intra-tratamiento ---------------------------------------------- */}
      <Card>
        <CardContent className="space-y-5 pt-6">
          <TituloBloque
            titulo="Intra-tratamiento"
            descripcion={`Hasta ${MAX_FOTOS_INTRA} entre fotos y videos, con la fecha del control.`}
            accion={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  disabled={lleno}
                  onClick={() =>
                    actualizar({
                      fotosIntra: [
                        {
                          id: nuevoId("foto"),
                          url: fotoDemo(`${paciente.id}-intra-${Date.now()}`, 480, 600),
                          fecha: hoyISO(),
                          nota: "",
                        },
                        ...intra,
                      ],
                    })
                  }
                >
                  <Plus className="size-3.5" />
                  Agregar foto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  disabled={lleno}
                  onClick={() =>
                    actualizar({ fotosIntra: [nuevoVideo(`${paciente.id}-intra-vid`), ...intra] })
                  }
                >
                  <Video className="size-3.5" />
                  Subir video
                </Button>
              </div>
            }
          />

          {intra.length === 0 ? (
            <Vacio texto="Todavía no hay fotos de control cargadas." />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 min-[440px]:grid-cols-3 sm:gap-3 lg:grid-cols-5">
              {intra.map((f) => (
                <TileFechado
                  key={f.id}
                  item={f}
                  onCambioNota={(nota) =>
                    actualizar({
                      fotosIntra: intra.map((x) => (x.id === f.id ? { ...x, nota } : x)),
                    })
                  }
                  onQuitar={() => actualizar({ fotosIntra: intra.filter((x) => x.id !== f.id) })}
                />
              ))}
            </div>
          )}
          {lleno ? (
            <p className="text-xs text-muted-foreground">
              Llegaste al máximo de {MAX_FOTOS_INTRA} fotos y videos de control.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* --- Finales --------------------------------------------------------- */}
      <Card>
        <CardContent className="space-y-5 pt-6">
          <TituloBloque
            titulo="Fotografías finales"
            descripcion="La misma serie, para comparar el antes y el después."
            accion={
              <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-muted-foreground">
                Comparar con las iniciales
                <Switch checked={comparando} onCheckedChange={(v: boolean) => setComparando(v)} />
              </label>
            }
          />
          <Serie
            fotos={paciente.fotosFinales}
            semilla={`${paciente.id}-fin`}
            onCambio={(fotosFinales) => actualizar({ fotosFinales })}
            comparar={comparando ? paciente.fotosIniciales : undefined}
          />
          <Videos
            videos={paciente.videosFinales}
            semilla={`${paciente.id}-vid-fin`}
            onCambio={(videosFinales) => actualizar({ videosFinales })}
          />
          {!comparando ? (
            <p className="text-xs text-muted-foreground tabular-nums">
              {contar(paciente.fotosFinales)} de 10 cargadas
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="rounded-xl border border-dashed border-input bg-muted/40 px-5 py-10 text-center text-sm text-muted-foreground">
      {texto}
    </div>
  )
}
