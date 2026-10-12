import { useState } from "react"
import { ImageOff, Plus, RefreshCw, Video } from "lucide-react"
import { cn } from "cn"

import { TituloBloque } from "@/components/campos"
import { BotonBorrar, ContenidoArchivo, RecuadroSlot, SelectorArchivo } from "@/components/fotos"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  TOPES,
  etiquetaDeSlot,
  slotDeEtiqueta,
  zonaDeSlot,
  type ArchivoClinico,
  type Origen,
} from "@/data/archivos"
import { useArchivos, type Archivos } from "@/data/useArchivos"
import { SLOTS_BOCA, SLOTS_CARA, type Paciente } from "@/lib/tipos"
import { fechaCorta } from "@/lib/util"

interface Props {
  paciente: Paciente
}

const ACEPTA_MEDIA = "image/*,video/*"
const TIPOS_MEDIA = ["imagen", "video"] as const

type Slot = { id: string; etiqueta: string }

/** Serie fija de 10 tomas (foto o video): 4 de cara + 6 de boca. */
function Serie({
  origen,
  archivos,
  comparar,
}: {
  origen: "foto_inicial" | "foto_final"
  archivos: Archivos
  comparar?: ArchivoClinico[]
}) {
  const delOrigen = archivos.delOrigen(origen)
  const de = (lista: ArchivoClinico[], slot: string) =>
    lista.find((a) => slotDeEtiqueta(a.etiqueta) === slot) ?? null

  const subirSlot = (slot: string, archivo: ArchivoClinico | null, file: File) =>
    archivo
      ? archivos.reemplazar(archivo, file, [...TIPOS_MEDIA])
      : archivos.subir(`${origen}:${slot}`, origen, file, [...TIPOS_MEDIA], {
          zona: zonaDeSlot(slot),
          etiqueta: etiquetaDeSlot(slot),
        })

  const grupo = (titulo: string, slots: readonly Slot[]) => (
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
        {slots.map((s) => {
          const archivo = de(delOrigen, s.id)
          if (comparar) {
            const antes = de(comparar, s.id)
            return (
              <div key={s.id} className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <ComparaFoto archivo={antes} etiqueta="Antes" />
                  <ComparaFoto archivo={archivo} etiqueta="Después" />
                </div>
                <p className="text-center text-[11px] leading-tight text-muted-foreground">
                  {s.etiqueta}
                </p>
              </div>
            )
          }
          return (
            <RecuadroSlot
              key={s.id}
              archivo={archivo}
              etiqueta={s.etiqueta}
              accept={ACEPTA_MEDIA}
              subiendo={archivos.subiendo.includes(archivo?.id ?? `${origen}:${s.id}`)}
              onArchivo={(file) => subirSlot(s.id, archivo, file)}
              onBorrar={archivos.borrar}
            />
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {grupo("Cara", SLOTS_CARA)}
      {grupo("Boca", SLOTS_BOCA)}
    </div>
  )
}

function ComparaFoto({ archivo, etiqueta }: { archivo: ArchivoClinico | null; etiqueta: string }) {
  return (
    <div className="relative aspect-4/5 overflow-hidden rounded-lg border border-border bg-muted">
      {archivo ? (
        <ContenidoArchivo archivo={archivo} etiqueta={etiqueta} />
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

/** Foto o video de control con fecha y nota. Se puede reemplazar o borrar (con confirmación). */
function TileFechado({ archivo, archivos }: { archivo: ArchivoClinico; archivos: Archivos }) {
  const [nota, setNota] = useState(archivo.etiqueta ?? "")
  const esVideo = archivo.tipo === "video"
  const subiendo = archivos.subiendo.includes(archivo.id)

  function guardarNota() {
    const limpia = nota.trim()
    if (limpia !== (archivo.etiqueta ?? "")) void archivos.actualizar(archivo, { etiqueta: limpia || null })
  }

  return (
    <div className="space-y-1.5">
      <div className="relative aspect-4/5 overflow-hidden rounded-xl border border-border bg-muted">
        <ContenidoArchivo archivo={archivo} etiqueta={nota || "Control"} />
        <div className="absolute top-1 right-1 flex gap-1 md:top-1.5 md:right-1.5">
          <SelectorArchivo
            accept={ACEPTA_MEDIA}
            onArchivo={(file) => archivos.reemplazar(archivo, file, [...TIPOS_MEDIA])}
            disabled={subiendo}
            etiqueta={esVideo ? "Reemplazar video" : "Reemplazar foto"}
            className="rounded-lg bg-white/90 p-2.5 text-brand-dark shadow-sm md:p-1.5"
          >
            <RefreshCw className="size-5 md:size-3.5" />
          </SelectorArchivo>
          <BotonBorrar
            nombre={`${esVideo ? "el video" : "la foto"} del ${fechaCorta(archivo.fecha)}`}
            disabled={subiendo}
            onConfirmar={() => archivos.borrar(archivo)}
            className="rounded-lg bg-white/90 p-2.5 text-destructive shadow-sm md:p-1.5"
          />
        </div>
        <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded bg-brand-dark/85 px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums">
          {fechaCorta(archivo.fecha)}
        </span>
        {subiendo ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-medium text-brand-dark">
            Subiendo…
          </div>
        ) : null}
      </div>
      <Input
        className="h-9 border-transparent bg-transparent px-1 text-xs hover:border-input md:h-8"
        value={nota}
        placeholder={esVideo ? "Nota del video…" : "Nota del control…"}
        onChange={(e) => setNota(e.target.value)}
        onBlur={guardarNota}
      />
    </div>
  )
}

function contar(archivos: Archivos, origen: Origen): number {
  return archivos.delOrigen(origen).length
}

export function Fotos({ paciente }: Props) {
  const archivos = useArchivos(paciente.id)
  const [comparando, setComparando] = useState(false)
  const intra = archivos.delOrigen("intra_tratamiento")
  const topeIntra = TOPES.intra_tratamiento
  const lleno = intra.length >= topeIntra

  if (archivos.cargando) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Cargando fotos…</p>
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

      {/* --- Iniciales ------------------------------------------------------ */}
      <Card>
        <CardContent className="space-y-5 pt-6">
          <TituloBloque
            titulo="Fotografías iniciales"
            descripcion="Serie fija de 10 tomas, foto o video: 4 de cara y 6 de boca."
            accion={
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {contar(archivos, "foto_inicial")} de {TOPES.foto_inicial} cargadas
              </span>
            }
          />
          <Serie origen="foto_inicial" archivos={archivos} />
        </CardContent>
      </Card>

      {/* --- Intra-tratamiento ---------------------------------------------- */}
      <Card>
        <CardContent className="space-y-5 pt-6">
          <TituloBloque
            titulo="Intra-tratamiento"
            descripcion={`Hasta ${topeIntra} entre fotos y videos, con la fecha del control.`}
            accion={
              <div className="flex flex-wrap items-center gap-2">
                <SelectorArchivo
                  accept="image/*"
                  disabled={lleno}
                  onArchivo={(file) =>
                    archivos.subir("intra:foto", "intra_tratamiento", file, ["imagen"])
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                >
                  <Plus className="size-3.5" />
                  Agregar foto
                </SelectorArchivo>
                <SelectorArchivo
                  accept="video/*"
                  disabled={lleno}
                  onArchivo={(file) =>
                    archivos.subir("intra:video", "intra_tratamiento", file, ["video"])
                  }
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                >
                  <Video className="size-3.5" />
                  Subir video
                </SelectorArchivo>
              </div>
            }
          />

          {archivos.subiendo.some((c) => c.startsWith("intra:")) ? (
            <p className="text-xs text-muted-foreground">Subiendo archivo…</p>
          ) : null}

          {intra.length === 0 ? (
            <Vacio texto="Todavía no hay fotos de control cargadas." />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 min-[440px]:grid-cols-3 sm:gap-3 lg:grid-cols-5">
              {[...intra].reverse().map((a) => (
                <TileFechado key={a.id} archivo={a} archivos={archivos} />
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground tabular-nums">
            {intra.length} de {topeIntra} fotos y videos
            {lleno ? " · llegaste al máximo" : ""}
          </p>
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
            origen="foto_final"
            archivos={archivos}
            comparar={comparando ? archivos.delOrigen("foto_inicial") : undefined}
          />
          {!comparando ? (
            <p className="text-xs text-muted-foreground tabular-nums">
              {contar(archivos, "foto_final")} de {TOPES.foto_final} cargadas
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
