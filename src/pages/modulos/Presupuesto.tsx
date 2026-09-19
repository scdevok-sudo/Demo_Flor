import { Download, Printer } from "lucide-react"
import { cn } from "cn"

import { Campo, DatoLeido, SelectSimple, TituloBloque } from "@/components/campos"
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
  MEDIOS_PAGO,
  esArmonizacion,
  type Cuota,
  type MedioPago,
  type Paciente,
} from "@/lib/tipos"
import { formatoDNI, montoARS, nombreMes } from "@/lib/util"

interface Props {
  paciente: Paciente
  actualizar: (cambios: Partial<Paciente>) => void
}

function IconoWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.41a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29Z" />
    </svg>
  )
}

/**
 * Cuota en mobile: card de un solo renglón, para que las 12 se recorran de un
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
        <span className="tabular-nums">{cuota.mes}</span>
        <span className="ml-1.5 text-xs font-normal text-muted-foreground capitalize">
          {nombreMes(cuota.mes)}
        </span>
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
  const valorCuota = total / 12
  const cobrado = valorCuota * pagas
  const af = esArmonizacion(paciente.categoria)

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
              nota={total > 0 ? `12 cuotas de ${montoARS(valorCuota)}` : "En pesos, sin puntos."}
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
            titulo="Control de cuotas"
            descripcion="12 meses. Marcá cada una cuando la cobres."
            accion={
              <div className="text-right">
                <p className="text-sm font-semibold text-brand-dark tabular-nums">
                  {pagas} de 12 cobradas
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {montoARS(cobrado)} de {montoARS(total)}
                </p>
              </div>
            }
          />

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
                      <span className="font-medium text-brand-dark tabular-nums">{c.mes}</span>
                      <span className="ml-2 text-xs text-muted-foreground capitalize">
                        {nombreMes(c.mes)}
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
    </div>
  )
}
