import { useMemo, useState } from "react"
import { ChevronRight, Plus, Search, X } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { cn } from "cn"

import { FilaScroll } from "@/components/FilaScroll"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useFichero } from "@/lib/store"
import { CATEGORIAS, SEDES, esArmonizacion, type Categoria, type Paciente, type Sede } from "@/lib/tipos"
import { formatoDNI, iniciales, normalizar, soloDigitos } from "@/lib/util"

type FiltroSede = Sede | "Todas"
type FiltroCategoria = Categoria | "Todas"

const FILTROS_SEDE: FiltroSede[] = ["Todas", ...SEDES]
const FILTROS_CATEGORIA: FiltroCategoria[] = ["Todas", ...CATEGORIAS]

/** En mobile no entra el nombre completo de la categoría en el chip. */
const CORTO: Record<FiltroCategoria, string> = {
  Todas: "Todas",
  Ortopedia: "Ortopedia",
  Ortodoncia: "Ortodoncia",
  Alineadores: "Alineadores",
  "Armonización facial": "Armonización",
}

/** El buscador es uno solo: si escribís números busca por DNI, si no, por apellido. */
function coincide(p: Paciente, busqueda: string): boolean {
  const q = busqueda.trim()
  if (!q) return true

  const digitos = soloDigitos(q)
  if (digitos.length >= 2 && digitos.length >= q.replace(/[\s.]/g, "").length) {
    return soloDigitos(p.dni).includes(digitos)
  }

  const texto = normalizar(q)
  return (
    normalizar(p.apellido).includes(texto) ||
    normalizar(p.nombre).includes(texto) ||
    normalizar(`${p.apellido} ${p.nombre}`).includes(texto) ||
    normalizar(`${p.nombre} ${p.apellido}`).includes(texto)
  )
}

function EstadoBadge({ activo }: { activo: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap",
        activo ? "text-brand-dark" : "text-muted-foreground"
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", activo ? "bg-brand-coral" : "bg-brand-light")}
      />
      {activo ? "Activo" : "Inactivo"}
    </span>
  )
}

function CategoriaBadge({ categoria }: { categoria: Categoria }) {
  return (
    <Badge
      variant={esArmonizacion(categoria) ? "secondary" : "default"}
      className="font-medium whitespace-nowrap"
    >
      {CORTO[categoria]}
    </Badge>
  )
}

/** Fila de chips que scrollea de costado cuando no entra. */
function Chips<T extends string>({
  opciones,
  valor,
  onCambio,
  etiqueta,
  textoDe,
}: {
  opciones: T[]
  valor: T
  onCambio: (v: T) => void
  etiqueta: string
  textoDe?: (v: T) => string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-1 sm:w-fit">
      <FilaScroll etiqueta={etiqueta}>
        <div className="flex w-max min-w-full items-center gap-1">
          {opciones.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onCambio(o)}
              className={cn(
                "flex-none rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors sm:py-1.5",
                valor === o
                  ? "bg-brand-coral text-[#3A3F47]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {textoDe ? textoDe(o) : o}
            </button>
          ))}
        </div>
      </FilaScroll>
    </div>
  )
}

export function Pacientes() {
  const { pacientes } = useFichero()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState("")
  const [sede, setSede] = useState<FiltroSede>("Todas")
  const [categoria, setCategoria] = useState<FiltroCategoria>("Todas")

  const resultados = useMemo(
    () =>
      pacientes
        .filter((p) => (sede === "Todas" ? true : p.sede === sede))
        .filter((p) => (categoria === "Todas" ? true : p.categoria === categoria))
        .filter((p) => coincide(p, busqueda))
        .sort((a, b) => a.apellido.localeCompare(b.apellido, "es")),
    [pacientes, busqueda, sede, categoria]
  )

  const buscandoPorDNI = soloDigitos(busqueda).length >= 2
  const filtrando = sede !== "Todas" || categoria !== "Todas" || busqueda.trim() !== ""

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-brand-dark">Pacientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pacientes.length} fichas · {pacientes.filter((p) => p.activo).length} en tratamiento
          </p>
        </div>
        <Button
          render={<Link to="/pacientes/nuevo" />}
          nativeButton={false}
          size="lg"
          className="h-10"
        >
          <Plus className="size-4" />
          Nuevo paciente
        </Button>
      </div>

      {/* Buscador + filtros */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por DNI o apellido"
              inputMode="search"
              className="h-11 bg-card pr-10 pl-9"
            />
            {busqueda ? (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
                className="absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          <div className="sm:shrink-0">
            <Chips
              opciones={FILTROS_SEDE}
              valor={sede}
              onCambio={setSede}
              etiqueta="Filtrar por sede"
            />
          </div>
        </div>

        <Chips
          opciones={FILTROS_CATEGORIA}
          valor={categoria}
          onCambio={setCategoria}
          etiqueta="Filtrar por categoría"
          textoDe={(c) => CORTO[c]}
        />
      </div>

      {filtrando ? (
        <p className="-mt-2 text-xs text-muted-foreground">
          {busqueda ? `Buscando por ${buscandoPorDNI ? "DNI" : "apellido"} · ` : ""}
          {resultados.length} {resultados.length === 1 ? "resultado" : "resultados"}
        </p>
      ) : null}

      {/* Tabla — escritorio */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Paciente</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultados.map((p) => (
              <TableRow
                key={p.id}
                onClick={() => navigate(`/pacientes/${p.id}`)}
                className="cursor-pointer"
              >
                <TableCell className="py-3 pl-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-secondary flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-brand-dark">
                      {iniciales(p.nombre, p.apellido)}
                    </div>
                    <div>
                      <p className="font-medium text-brand-dark">
                        {p.apellido}, {p.nombre}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.edad} años</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">{formatoDNI(p.dni)}</TableCell>
                <TableCell>
                  <CategoriaBadge categoria={p.categoria} />
                </TableCell>
                <TableCell className="text-muted-foreground">{p.sede}</TableCell>
                <TableCell>
                  <EstadoBadge activo={p.activo} />
                </TableCell>
                <TableCell className="pr-4 text-muted-foreground">
                  <ChevronRight className="size-4" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {resultados.length === 0 ? <SinResultados /> : null}
      </div>

      {/* Listado — mobile */}
      <div className="space-y-2.5 md:hidden">
        {resultados.map((p) => (
          <Link
            key={p.id}
            to={`/pacientes/${p.id}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors active:bg-muted"
          >
            <div className="bg-secondary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-brand-dark">
              {iniciales(p.nombre, p.apellido)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-brand-dark">
                {p.apellido}, {p.nombre}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                DNI {formatoDNI(p.dni)} · {p.sede}
              </p>
              <div className="mt-1.5">
                <CategoriaBadge categoria={p.categoria} />
              </div>
            </div>
            <EstadoBadge activo={p.activo} />
          </Link>
        ))}
        {resultados.length === 0 ? (
          <div className="rounded-xl border border-border bg-card">
            <SinResultados />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SinResultados() {
  return (
    <div className="px-5 py-14 text-center">
      <p className="font-heading text-lg text-brand-dark">Sin resultados</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
        Probá con otro DNI o apellido, o aflojá los filtros de sede y categoría.
      </p>
    </div>
  )
}
