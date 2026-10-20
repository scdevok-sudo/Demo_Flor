import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { SelectSimple } from "@/components/campos"
import { Button } from "@/components/ui/button"
import type { SerieDicom } from "@/lib/dicomZip"

type Niivue = import("@niivue/niivue").Niivue

/** Eje del volumen con menos voxels: es por donde se apilaron los cortes del estudio. */
const ejeDeCortes = (dims: ArrayLike<number>) => [1, 2, 3].reduce((m, i) => (dims[i] < dims[m] ? i : m), 1) - 1

/** «Serie 2 de 11 · 7 cortes»: la posición en la lista, no el número interno de DICOM (que no le dice nada a quien mira). */
const etiquetaSerie = (s: SerieDicom, i: number, total: number) =>
  [`Serie ${i + 1} de ${total}`, `${s.cortes.length} ${s.cortes.length === 1 ? "corte" : "cortes"}`, s.descripcion]
    .filter(Boolean)
    .join(" · ")

/**
 * Visor de cortes (2D) de un estudio DICOM: serie por serie, corte por corte.
 * Recibe el ZIP ya filtrado (una carpeta por serie). Niivue y el conversor DICOM -> NIfTI (wasm)
 * se cargan recién al abrirlo. Va en modo de cortes, no de volumen: el render 3D es otro pedido.
 */
export function VisorDicom({ url }: { url: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const nv = useRef<Niivue | null>(null)
  /** Volúmenes NIfTI ya convertidos por serie, para no repetir la conversión al volver a una. */
  const convertidas = useRef(new Map<string, File[]>())
  const vox = useRef<[number, number, number]>([0, 0, 0])
  const eje = useRef(0)

  const [series, setSeries] = useState<SerieDicom[]>([])
  const [serie, setSerie] = useState(0)
  const [partes, setPartes] = useState<File[]>([])
  const [parte, setParte] = useState(0)
  const [corte, setCorte] = useState({ indice: 0, total: 0 })
  const [estado, setEstado] = useState<"descargando" | "convirtiendo" | "listo" | "error">("descargando")
  const [aviso, setAviso] = useState<string | null>(null)

  // 1) Descarga del ZIP + lectura de las series + motor de render.
  useEffect(() => {
    let cancelado = false
    let motor: Niivue | undefined
    const cache = convertidas.current

    async function iniciar() {
      const [{ Niivue }, { extraerSeries }] = await Promise.all([import("@niivue/niivue"), import("@/lib/dicomZip")])
      const respuesta = await fetch(url)
      if (!respuesta.ok) throw new Error("descarga")
      const lista = await extraerSeries(new Uint8Array(await respuesta.arrayBuffer()))
      if (cancelado || !canvas.current) return

      motor = new Niivue({ backColor: [0, 0, 0, 1], show3Dcrosshair: false, isColorbar: false })
      await motor.attachToCanvas(canvas.current)
      motor.setCrosshairWidth(0)
      motor.onLocationChange = (loc) => {
        const v = (loc as { vox?: number[] }).vox
        if (!v) return
        vox.current = [v[0], v[1], v[2]]
        setCorte((c) => ({ ...c, indice: Math.round(v[eje.current]) }))
      }
      nv.current = motor
      if (cancelado) return
      setSeries(lista)
      setEstado("convirtiendo")
    }

    iniciar().catch(() => {
      if (!cancelado) {
        setAviso("No se pudo abrir el estudio. Probá descargarlo con el botón de abrir.")
        setEstado("error")
      }
    })
    return () => {
      cancelado = true
      nv.current = null
      cache.clear()
      motor?.cleanup()
    }
  }, [url])

  // 2) Conversión de la serie elegida (los cortes se apilan en un volumen para poder navegarlos).
  useEffect(() => {
    const actual = series[serie]
    if (!actual) return
    let cancelado = false

    async function convertir(s: SerieDicom) {
      let volumenes = convertidas.current.get(s.id)
      if (!volumenes) {
        const archivos = s.cortes.map((c) => new File([c.datos as Uint8Array<ArrayBuffer>], c.nombre.replace(/\//g, "_")))
        // Un conversor (worker wasm) por serie: la segunda corrida sobre el mismo worker falla.
        const { Dcm2niix } = await import("@niivue/dcm2niix")
        const conversor = new Dcm2niix()
        await conversor.init()
        const salida = await conversor.input(archivos).run().finally(() => conversor.worker?.terminate())
        volumenes = salida.filter((f) => /\.nii(\.gz)?$/i.test(f.name))
        convertidas.current.set(s.id, volumenes)
      }
      if (cancelado) return
      if (volumenes.length === 0) throw new Error("vacia")
      setPartes(volumenes)
      setParte(0)
    }

    convertir(actual).catch(() => {
        if (cancelado) return
      setPartes([])
      setAviso("No se pudo armar esta serie.")
      setEstado("error")
    })
    return () => {
      cancelado = true
    }
  }, [series, serie])

  // 3) Carga del volumen en el visor, en el plano en que se tomaron los cortes.
  useEffect(() => {
    const archivo = partes[parte]
    const motor = nv.current
    if (!archivo || !motor) return
    let cancelado = false
    const blobUrl = URL.createObjectURL(archivo)

    motor
      .loadVolumes([{ url: blobUrl, name: archivo.name }])
      .then(() => {
        if (cancelado) return
        const dims = motor.volumes[0].dims as number[]
        const e = ejeDeCortes(dims)
        eje.current = e
        motor.setSliceType([motor.sliceTypeSagittal, motor.sliceTypeCoronal, motor.sliceTypeAxial][e])
        const total = dims[e + 1]
        irA(Math.floor(total / 2), total)
        setEstado("listo")
      })
      .catch(() => {
        if (cancelado) return
        setAviso("No se pudo mostrar esta serie.")
        setEstado("error")
      })
      .finally(() => URL.revokeObjectURL(blobUrl))

    return () => {
      cancelado = true
    }
  }, [partes, parte])

  function irA(indice: number, total = corte.total) {
    const motor = nv.current
    if (!motor) return
    const v: [number, number, number] = [...vox.current]
    v[eje.current] = Math.min(Math.max(indice, 0), total - 1)
    motor.scene.crosshairPos = motor.vox2frac(v)
    motor.updateGLVolume()
    vox.current = v
    setCorte({ indice: v[eje.current], total })
  }

  const navegable = estado === "listo" && corte.total > 1
  const ocupado = estado === "descargando" || estado === "convirtiendo"

  return (
    <div className="flex size-full min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {series.length > 1 ? (
          <SelectSimple
            className="w-full min-w-0 sm:w-96"
            valor={String(serie)}
            onCambio={(v) => {
              if (Number(v) === serie) return
              setSerie(Number(v))
              setAviso(null)
              setEstado("convirtiendo")
            }}
            opciones={series.map((s, i) => ({ valor: String(i), etiqueta: etiquetaSerie(s, i, series.length) }))}
          />
        ) : series[0] ? (
          <p className="text-sm text-muted-foreground">{etiquetaSerie(series[0], 0, 1)}</p>
        ) : null}
        {partes.length > 1 ? (
          <div className="flex gap-1.5" role="group" aria-label="Partes de la serie">
            {partes.map((_, i) => (
              <Button key={i} type="button" size="sm" variant={i === parte ? "default" : "outline"} onClick={() => setParte(i)}>
                Parte {i + 1} de {partes.length}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-black">
        <canvas ref={canvas} className="block size-full touch-none" />
        {ocupado || estado === "error" ? (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/80">
            {estado === "error" ? aviso : estado === "descargando" ? "Descargando estudio…" : "Armando la serie…"}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Button
          type="button"
          variant="outline"
          aria-label="Corte anterior"
          className="size-11 shrink-0 sm:order-1"
          disabled={!navegable || corte.indice <= 0}
          onClick={() => irA(corte.indice - 1)}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <span className="min-w-0 flex-1 text-center text-sm tabular-nums text-muted-foreground sm:order-4 sm:w-28 sm:flex-none">
          {estado === "listo" ? `Corte ${corte.indice + 1} / ${corte.total}` : ""}
        </span>
        <Button
          type="button"
          variant="outline"
          aria-label="Corte siguiente"
          className="size-11 shrink-0 sm:order-3"
          disabled={!navegable || corte.indice >= corte.total - 1}
          onClick={() => irA(corte.indice + 1)}
        >
          <ChevronRight className="size-5" />
        </Button>
        <input
          type="range"
          aria-label="Corte"
          className="order-last h-11 w-full min-w-0 accent-brand-dark sm:order-2 sm:w-auto sm:flex-1"
          min={0}
          max={Math.max(corte.total - 1, 0)}
          value={corte.indice}
          disabled={!navegable}
          onChange={(e) => irA(Number(e.target.value))}
        />
      </div>
    </div>
  )
}
