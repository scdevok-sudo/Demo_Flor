import { useState } from "react"
import { Download, Plus, Printer, Trash2 } from "lucide-react"
import { cn } from "cn"

import { Campo, DatoLeido, SelectSimple, TituloBloque } from "@/components/campos"
import { IconoWhatsApp } from "@/components/IconoWhatsApp"
import { Isotipo } from "@/components/marca"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { descargarPresupuesto, enlaceWhatsApp, imprimirPresupuesto } from "@/lib/pdf"
import {
  MAX_CUOTAS,
  MEDIOS_PAGO,
  PLAZO_CUOTAS_MESES,
  esArmonizacion,
  type Cuota,
  type MedioPago,
  type Paciente,
  type RegistroMantenimiento,
} from "@/lib/tipos"
import { fechaLarga, formatoDNI, hoyISO, montoARS, nuevoId } from "@/lib/util"

const soloNumeros = (v: string) => v.replace(/[^\d]/g, "")

/** Campo de monto en pesos, sin puntos. */
function InputMonto({
  valor,
  onCambio,
  placeholder,
  className,
  etiqueta,
}: {
  valor: string
  onCambio: (v: string) => void
  placeholder?: string
  className?: string
  etiqueta?: string
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
        $
      </span>
      <Input
        className={cn("h-10 pl-7 tabular-nums", className)}
        inputMode="numeric"
        aria-label={etiqueta}
        value={valor}
        onChange={(e) => onCambio(soloNumeros(e.target.value))}
        placeholder={placeholder}
      />
    </div>
  )
}

interface Props {
  paciente: Paciente
  actualizar: (cambios: Partial<Paciente>) => void
}

/**
 * Cuota en mobile: card de un solo renglón, para que todas se recorran de un
 * vistazo. Las cobradas se tiñen de coral, así el estado se lee sin leer.
 * No va envuelta en un <label> a propósito: el tilde se comería los clics del
 * selector de medio de pago.
 */
function FilaCuota({
  cuota,
  onCambio,
}: {
  cuota: Cuota
  onCambio: (cambios: Partial<Cuota>) => void
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        cuota.efectuado ? "border-brand-coral/50 bg-brand-coral-soft/60" : "border-border bg-card"
      )}
    >
      <p className="min-w-0 flex-1 text-sm font-medium text-brand-dark">
        Cuota <span className="tabular-nums">{cuota.mes}</span>
      </p>
      <SelectSimple
        className="w-30 shrink-0 bg-card"
        valor={cuota.medio}
        onCambio={(v) => onCambio({ medio: v as MedioPago })}
        opciones={MEDIOS_PAGO}
      />
      <Checkbox
        aria-label={`Cuota ${cuota.mes} cobrada`}
        checked={cuota.efectuado}
        onCheckedChange={(v: boolean) => onCambio({ efectuado: v })}
      />
    </div>
  )
}

export function Presupuesto({ paciente, actualizar }: Props) {
  const cuotas = paciente.cuotas
  const pagas = cuotas.filter((c) => c.efectuado).length
  const total = Number(paciente.montoTotal) || 0
  const valorCuota = cuotas.length > 0 ? total / cuotas.length : 0
  const cobrado = valorCuota * pagas
  const af = esArmonizacion(paciente.categoria)

  const cambiarCantidad = (n: number) =>
    actualizar({
      cuotas: Array.from(
        { length: n },
        (_, i): Cuota =>
          cuotas[i] ?? { mes: i + 1, medio: "Transferencia", efectuado: false }
      ),
    })

  const setCuota = (mes: number, cambios: Partial<Cuota>) =>
    actualizar({ cuotas: cuotas.map((c) => (c.mes === mes ? { ...c, ...cambios } : c)) })

  return (
    <div className="space-y-5">
      {/* --- Vista previa con membrete -------------------------------------- */}
      <Card className="overflow-hidden p-0">
        <div className="bg-sidebar flex items-center gap-3 px-5 py-4 sm:px-7">
          <Isotipo className="text-3xl" />
          <div className="border-l border-white/20 pl-3">
            <p className="font-heading text-base leading-tight text-white">
              Florencia Inveninato
            </p>
            <p className="text-[11px] text-white/55">
              Ortodoncia y ortopedia maxilar · La Plata · Tandil
            </p>
          </div>
        </div>
        <div className="bg-brand-coral h-1" />

        <CardContent className="space-y-6 px-5 py-6 sm:px-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h3 className="font-heading text-2xl text-brand-dark">Presupuesto de tratamiento</h3>
            <Badge variant="secondary">Vista previa</Badge>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <DatoLeido etiqueta="Paciente" valor={`${paciente.nombre} ${paciente.apellido}`} />
            <DatoLeido etiqueta="DNI" valor={formatoDNI(paciente.dni)} />
            <DatoLeido etiqueta="Edad" valor={paciente.edad ? `${paciente.edad} años` : "—"} />
            <DatoLeido etiqueta="Tratamiento" valor={paciente.categoria} />
            <DatoLeido etiqueta="Sede" valor={paciente.sede} />
            <DatoLeido
              etiqueta="Cobertura"
              valor={af ? "Particular" : paciente.obraSocial || "Particular"}
            />
          </div>

          <div className="space-y-5 border-t border-border pt-5">
            <DatoLeido etiqueta="Diagnóstico" valor={paciente.diagnostico} />
            <DatoLeido etiqueta="Plan de tratamiento" valor={paciente.plan} />
            {af ? null : <DatoLeido etiqueta="Técnica a utilizar" valor={paciente.tecnica} />}
          </div>

          <p className="text-xs text-muted-foreground">
            Estos datos vienen del módulo de diagnóstico. Para cambiarlos, editalos ahí.
          </p>
        </CardContent>
      </Card>

      {/* --- Monto y condiciones -------------------------------------------- */}
      <Card>
        <CardContent className="space-y-5 pt-6">
          <TituloBloque titulo="Monto y condiciones" descripcion="Lo único que se escribe acá." />

          <div className="grid gap-4 sm:grid-cols-[minmax(0,15rem)_1fr]">
            <Campo
              etiqueta="Monto total"
              nota={
                total > 0 && cuotas.length > 0
                  ? `${cuotas.length} cuotas de ${montoARS(valorCuota)}`
                  : "En pesos, sin puntos."
              }
            >
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  className="h-10 pl-7 tabular-nums"
                  inputMode="numeric"
                  value={paciente.montoTotal}
                  onChange={(e) =>
                    actualizar({ montoTotal: e.target.value.replace(/[^\d]/g, "") })
                  }
                  placeholder="1450000"
                />
              </div>
            </Campo>

            <Campo etiqueta="Condiciones" nota="Qué incluye, qué no, forma de pago.">
              <Textarea
                rows={4}
                value={paciente.condiciones}
                onChange={(e) => actualizar({ condiciones: e.target.value })}
                placeholder="Incluye aparatología, controles mensuales y contención al finalizar…"
              />
            </Campo>
          </div>

          <div className="flex flex-col gap-2.5 border-t border-border pt-5 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              size="lg"
              className="h-11 sm:h-10"
              onClick={() => void descargarPresupuesto(paciente)}
            >
              <Download className="size-4" />
              Generar PDF
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-11 sm:h-10"
              nativeButton={false}
              render={
                <a href={enlaceWhatsApp(paciente)} target="_blank" rel="noreferrer noopener" />
              }
            >
              <IconoWhatsApp className="size-4" />
              Enviar por WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 sm:h-10"
              onClick={() => void imprimirPresupuesto(paciente)}
            >
              <Printer className="size-4" />
              Imprimir
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            El PDF se arma con el membrete de marca. WhatsApp abre el chat con el mensaje
            escrito; el PDF se adjunta a mano.
          </p>
        </CardContent>
      </Card>

      {/* --- Cuotas ---------------------------------------------------------- */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <TituloBloque
            titulo="Cuotas iniciales"
            descripcion={`Hasta ${MAX_CUOTAS} cuotas, a pagar en ${PLAZO_CUOTAS_MESES} meses. Marcá cada una cuando la cobres.`}
            accion={
              <div className="text-right">
                <p className="text-sm font-semibold text-brand-dark tabular-nums">
                  {pagas} de {cuotas.length} cobradas
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {montoARS(cobrado)} de {montoARS(total)}
                </p>
              </div>
            }
          />

          <Campo etiqueta="Cantidad de cuotas" className="max-w-48">
            <SelectSimple
              valor={String(cuotas.length)}
              onCambio={(v) => cambiarCantidad(Number(v))}
              opciones={Array.from({ length: MAX_CUOTAS }, (_, i) => ({
                valor: String(i + 1),
                etiqueta: i === 0 ? "1 cuota" : `${i + 1} cuotas`,
              }))}
            />
          </Campo>

          {/* Tabla — escritorio */}
          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Cuota</TableHead>
                  <TableHead>Medio de pago</TableHead>
                  <TableHead className="pr-4 text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuotas.map((c) => (
                  <TableRow key={c.mes} className="hover:bg-transparent">
                    <TableCell className="py-2.5 pl-4">
                      <span className="font-medium text-brand-dark">
                        Cuota <span className="tabular-nums">{c.mes}</span>
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <SelectSimple
                        className="h-8 w-40"
                        valor={c.medio}
                        onCambio={(v) => setCuota(c.mes, { medio: v as MedioPago })}
                        opciones={MEDIOS_PAGO}
                      />
                    </TableCell>
                    <TableCell className="py-2.5 pr-4">
                      <label className="flex cursor-pointer items-center justify-end gap-2.5 text-sm">
                        <span
                          className={
                            c.efectuado ? "font-medium text-brand-dark" : "text-muted-foreground"
                          }
                        >
                          {c.efectuado ? "Efectuado" : "Pendiente"}
                        </span>
                        <Checkbox
                          checked={c.efectuado}
                          onCheckedChange={(v: boolean) => setCuota(c.mes, { efectuado: v })}
                        />
                      </label>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Cards por mes — mobile */}
          <div className="space-y-2 md:hidden">
            {cuotas.map((c) => (
              <FilaCuota
                key={c.mes}
                cuota={c}
                onCambio={(cambios) => setCuota(c.mes, cambios)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Mantenimiento paciente={paciente} actualizar={actualizar} />
      <CierreTratamiento paciente={paciente} actualizar={actualizar} />
    </div>
  )
}

/**
 * Mantenimiento mensual: mismo patrón de alta que el seguimiento diario (el
 * registro nuevo queda arriba, sin límite). El monto lo escribe Florencia cada
 * vez; no hay fórmula ni descuento automático.
 */
function Mantenimiento({ paciente, actualizar }: Props) {
  const [fecha, setFecha] = useState(hoyISO())
  const [monto, setMonto] = useState("")

  const registros = [...paciente.mantenimiento].sort((a, b) => b.fecha.localeCompare(a.fecha))

  const cambiar = (id: string, cambios: Partial<RegistroMantenimiento>) =>
    actualizar({
      mantenimiento: paciente.mantenimiento.map((r) => (r.id === id ? { ...r, ...cambios } : r)),
    })

  function agregar() {
    if (!monto || !fecha) return
    actualizar({
      mantenimiento: [
        { id: nuevoId("mt"), fecha, monto, efectuado: false },
        ...paciente.mantenimiento,
      ],
    })
    setMonto("")
    setFecha(hoyISO())
  }

  return (
    <Card>
      <CardContent className="space-y-5 pt-6">
        <TituloBloque
          titulo="Mantenimiento del tratamiento"
          descripcion={`Desde el mes ${PLAZO_CUOTAS_MESES}, una vez terminadas las cuotas iniciales. El monto lo cargás vos, mes a mes.`}
          accion={
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {registros.length} {registros.length === 1 ? "registro" : "registros"}
            </span>
          }
        />

        <Campo
          etiqueta="Duración estimada del tratamiento"
          nota="Texto libre: «2 años», «18 meses», «hasta 4 años»."
          className="max-w-sm"
        >
          <Input
            className="h-10"
            value={paciente.duracionEstimada}
            onChange={(e) => actualizar({ duracionEstimada: e.target.value })}
            placeholder="2 años"
          />
        </Campo>

        <div className="grid gap-4 border-t border-border pt-5 sm:grid-cols-[minmax(0,11rem)_minmax(0,12rem)_auto] sm:items-end">
          <Campo etiqueta="Fecha">
            <Input
              className="h-10"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </Campo>
          <Campo etiqueta="Monto">
            <InputMonto valor={monto} onCambio={setMonto} placeholder="45000" etiqueta="Monto" />
          </Campo>
          <Button
            type="button"
            size="lg"
            className="h-11 sm:h-10"
            disabled={!monto || !fecha}
            onClick={agregar}
          >
            <Plus className="size-4" />
            Agregar registro
          </Button>
        </div>

        {registros.length === 0 ? (
          <div className="rounded-xl border border-dashed border-input bg-muted/40 px-5 py-9 text-center text-sm text-muted-foreground">
            Todavía no hay registros de mantenimiento.
          </div>
        ) : (
          <ul className="space-y-2">
            {registros.map((r) => (
              <li
                key={r.id}
                className={cn(
                  "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-3 py-2.5 transition-colors",
                  r.efectuado
                    ? "border-brand-coral/50 bg-brand-coral-soft/60"
                    : "border-border bg-card"
                )}
              >
                <p className="min-w-0 flex-1 basis-40 text-sm font-medium text-brand-dark">
                  {fechaLarga(r.fecha)}
                </p>
                <div className="w-36 shrink-0">
                  <InputMonto
                    className="h-9 bg-card"
                    valor={r.monto}
                    onCambio={(v) => cambiar(r.id, { monto: v })}
                    etiqueta={`Monto del ${fechaLarga(r.fecha)}`}
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={r.efectuado}
                    onCheckedChange={(v: boolean) => cambiar(r.id, { efectuado: v })}
                  />
                  <span
                    className={r.efectuado ? "font-medium text-brand-dark" : "text-muted-foreground"}
                  >
                    {r.efectuado ? "Efectuado" : "Pendiente"}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    actualizar({ mantenimiento: paciente.mantenimiento.filter((x) => x.id !== r.id) })
                  }
                  aria-label={`Borrar registro del ${fechaLarga(r.fecha)}`}
                  className="rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive md:p-2"
                >
                  <Trash2 className="size-5 md:size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** Cierre: valor de la contención (editable, puede quedar vacío) y valor de alta (un único registro con fecha). */
function CierreTratamiento({ paciente, actualizar }: Props) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <TituloBloque
          titulo="Cierre del tratamiento"
          descripcion="Se completa cuando se sabe. Pueden quedar vacíos mientras el tratamiento sigue en curso."
        />
        <div className="grid gap-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,11rem)_minmax(0,12rem)]">
          <Campo etiqueta="Valor de contención" nota="Dispositivo para después del alta.">
            <InputMonto
              valor={paciente.valorContencion}
              onCambio={(valorContencion) => actualizar({ valorContencion })}
              placeholder="85000"
              etiqueta="Valor de contención"
            />
          </Campo>
          <Campo etiqueta="Fecha del alta">
            <Input
              className="h-10"
              type="date"
              value={paciente.valorAltaFecha}
              onChange={(e) => actualizar({ valorAltaFecha: e.target.value })}
            />
          </Campo>
          <Campo etiqueta="Valor de alta" nota="Un único valor final.">
            <InputMonto
              valor={paciente.valorAlta}
              onCambio={(valorAlta) => actualizar({ valorAlta })}
              placeholder="120000"
              etiqueta="Valor de alta"
            />
          </Campo>
        </div>
      </CardContent>
    </Card>
  )
}
