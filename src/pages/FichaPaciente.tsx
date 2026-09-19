import { useState } from "react"
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  FileImage,
  Images,
  Receipt,
  Stethoscope,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { FilaScroll } from "@/components/FilaScroll"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AntesDespues } from "@/pages/modulos/AntesDespues"
import { DatosGenerales } from "@/pages/modulos/DatosGenerales"
import { Diagnostico } from "@/pages/modulos/Diagnostico"
import { Estudios } from "@/pages/modulos/Estudios"
import { Fotos } from "@/pages/modulos/Fotos"
import { Presupuesto } from "@/pages/modulos/Presupuesto"
import { Seguimiento } from "@/pages/modulos/Seguimiento"
import { useFichero, usePaciente } from "@/lib/store"
import { esArmonizacion, type Paciente } from "@/lib/tipos"
import { formatoDNI, iniciales } from "@/lib/util"

/**
 * Las mismas seis solapas para todas las categorías. Lo que cambia es el
 * contenido de algunas: armonización facial usa su galería de antes/después
 * en «Fotos» y la versión corta de «Datos» y «Diagnóstico».
 */
const SOLAPAS = [
  { id: "datos", etiqueta: "Datos", icono: ClipboardList },
  { id: "fotos", etiqueta: "Fotos", icono: Images },
  { id: "estudios", etiqueta: "Estudios", icono: FileImage },
  { id: "diagnostico", etiqueta: "Diagnóstico", icono: Stethoscope },
  { id: "presupuesto", etiqueta: "Presupuesto", icono: Receipt },
  { id: "seguimiento", etiqueta: "Seguimiento", icono: CalendarClock },
]

export function FichaPaciente() {
  const { id } = useParams()
  const paciente = usePaciente(id)
  const { actualizarPaciente } = useFichero()
  const [solapa, setSolapa] = useState("datos")

  if (!paciente) return <NoEncontrado />

  const actualizar = (cambios: Partial<Paciente>) => actualizarPaciente(paciente.id, cambios)
  const af = esArmonizacion(paciente.categoria)

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/pacientes"
          className="-my-2 inline-flex items-center gap-1.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Pacientes
        </Link>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <div className="bg-secondary flex size-12 shrink-0 items-center justify-center rounded-full text-base font-semibold text-brand-dark sm:size-14 sm:text-lg">
              {iniciales(paciente.nombre, paciente.apellido)}
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl leading-tight text-brand-dark sm:text-3xl">
                {paciente.nombre} {paciente.apellido}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="tabular-nums">DNI {formatoDNI(paciente.dni)}</span>
                {" · "}
                {paciente.edad ? `${paciente.edad} años` : "Edad sin cargar"}
                {" · "}
                {paciente.sede}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={af ? "secondary" : "default"}>{paciente.categoria}</Badge>
            <Badge variant={paciente.activo ? "outline" : "ghost"}>
              {paciente.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={solapa} onValueChange={(v) => setSolapa(String(v))}>
        <FilaScroll className="bg-secondary rounded-lg p-1">
          <TabsList className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0">
            {SOLAPAS.map(({ id: sid, etiqueta, icono: Icono }) => (
              <TabsTrigger
                key={sid}
                value={sid}
                className="h-9 flex-none px-3.5 whitespace-nowrap data-active:bg-brand-coral! data-active:text-[#3A3F47]!"
              >
                <Icono className="size-4 shrink-0" />
                {etiqueta}
              </TabsTrigger>
            ))}
          </TabsList>
        </FilaScroll>

        <TabsContent value="datos" className="pt-5">
          <DatosGenerales paciente={paciente} actualizar={actualizar} />
        </TabsContent>

        <TabsContent value="fotos" className="pt-5">
          {af ? (
            <AntesDespues paciente={paciente} actualizar={actualizar} />
          ) : (
            <Fotos paciente={paciente} actualizar={actualizar} />
          )}
        </TabsContent>

        <TabsContent value="estudios" className="pt-5">
          <Estudios paciente={paciente} actualizar={actualizar} />
        </TabsContent>

        <TabsContent value="diagnostico" className="pt-5">
          <Diagnostico paciente={paciente} actualizar={actualizar} />
        </TabsContent>

        <TabsContent value="presupuesto" className="pt-5">
          <Presupuesto paciente={paciente} actualizar={actualizar} />
        </TabsContent>

        <TabsContent value="seguimiento" className="pt-5">
          <Seguimiento paciente={paciente} actualizar={actualizar} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NoEncontrado() {
  return (
    <div className="mx-auto max-w-sm py-20 text-center">
      <h1 className="font-heading text-2xl text-brand-dark">No encontramos esa ficha</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Puede que se haya borrado o que el enlace esté mal.
      </p>
      <Button className="mt-6 h-10" size="lg" render={<Link to="/pacientes" />} nativeButton={false}>
        Volver a pacientes
      </Button>
    </div>
  )
}
