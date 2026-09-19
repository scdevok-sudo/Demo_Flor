import { Campo, SelectSimple } from "@/components/campos"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  CATEGORIAS,
  SEDES,
  esArmonizacion,
  type Categoria,
  type Paciente,
  type Sede,
} from "@/lib/tipos"

export type DatosPaciente = Omit<Paciente, "id">

export interface PropsForm {
  valores: DatosPaciente
  set: <K extends keyof DatosPaciente>(campo: K, valor: DatosPaciente[K]) => void
}

/** Edad cumplida a partir de la fecha de nacimiento. */
function edadDesde(iso: string): string {
  const nacimiento = new Date(iso)
  if (Number.isNaN(nacimiento.getTime())) return ""
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad -= 1
  return edad >= 0 && edad < 120 ? String(edad) : ""
}

function SelectorCategoria({ valores, set }: PropsForm) {
  return (
    <Campo etiqueta="Categoría" nota="Define qué módulos tiene la ficha.">
      <SelectSimple
        valor={valores.categoria}
        onCambio={(v) => set("categoria", v as Categoria)}
        opciones={CATEGORIAS}
      />
    </Campo>
  )
}

function Activo({ valores, set, nota }: PropsForm & { nota: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-brand-dark">Paciente activo</p>
        <p className="text-xs text-muted-foreground">{nota}</p>
      </div>
      <Switch checked={valores.activo} onCheckedChange={(v: boolean) => set("activo", v)} />
    </div>
  )
}

/**
 * Ficha corta de armonización facial: sin ocupación, fecha de nacimiento,
 * anamnesis extendida ni obra social. El diagnóstico y el plan van, como en el
 * resto de las categorías, en la solapa de diagnóstico.
 */
function FormArmonizacion({ valores, set }: PropsForm) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre">
          <Input
            className="h-9"
            value={valores.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Malena"
          />
        </Campo>
        <Campo etiqueta="Apellido">
          <Input
            className="h-9"
            value={valores.apellido}
            onChange={(e) => set("apellido", e.target.value)}
            placeholder="Quiroga"
          />
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Campo etiqueta="DNI">
          <Input
            className="h-9 tabular-nums"
            inputMode="numeric"
            value={valores.dni}
            onChange={(e) => set("dni", e.target.value)}
            placeholder="35120884"
          />
        </Campo>
        <Campo etiqueta="Edad">
          <Input
            className="h-9 tabular-nums"
            inputMode="numeric"
            value={valores.edad}
            onChange={(e) => set("edad", e.target.value)}
            placeholder="32"
          />
        </Campo>
        <SelectorCategoria valores={valores} set={set} />
        <Campo etiqueta="Sede">
          <SelectSimple
            valor={valores.sede}
            onCambio={(v) => set("sede", v as Sede)}
            opciones={SEDES}
          />
        </Campo>
      </div>

      <Campo etiqueta="Derivado por">
        <Input
          className="h-9"
          value={valores.derivadoPor}
          onChange={(e) => set("derivadoPor", e.target.value)}
          placeholder="Consulta espontánea"
        />
      </Campo>

      <Campo
        etiqueta="Particularidades / notas"
        nota="Alergias, antecedentes, expectativas del paciente."
      >
        <Textarea
          rows={3}
          value={valores.particularidades}
          onChange={(e) => set("particularidades", e.target.value)}
          placeholder="Sin alergias conocidas. Primera vez con relleno, busca algo sutil…"
        />
      </Campo>

      <Activo valores={valores} set={set} nota="Desactivalo cuando termine el ciclo de sesiones." />
    </div>
  )
}

/**
 * Módulo 1 — Datos del paciente.
 * Se usa igual en el alta y en la ficha, para que no haya dos formularios distintos.
 * Ortopedia, ortodoncia y alineadores comparten esta ficha completa;
 * armonización facial usa la versión corta.
 */
export function FormDatosPaciente({ valores, set }: PropsForm) {
  if (esArmonizacion(valores.categoria)) {
    return <FormArmonizacion valores={valores} set={set} />
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre">
          <Input
            className="h-9"
            value={valores.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            placeholder="Bautista"
          />
        </Campo>
        <Campo etiqueta="Apellido">
          <Input
            className="h-9"
            value={valores.apellido}
            onChange={(e) => set("apellido", e.target.value)}
            placeholder="Fernández"
          />
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Campo etiqueta="DNI">
          <Input
            className="h-9 tabular-nums"
            inputMode="numeric"
            value={valores.dni}
            onChange={(e) => set("dni", e.target.value)}
            placeholder="54892117"
          />
        </Campo>
        <Campo etiqueta="Fecha de nacimiento">
          <Input
            className="h-9"
            type="date"
            value={valores.fechaNacimiento}
            onChange={(e) => {
              set("fechaNacimiento", e.target.value)
              const edad = edadDesde(e.target.value)
              if (edad) set("edad", edad)
            }}
          />
        </Campo>
        <Campo etiqueta="Edad" nota="Se calcula sola, se puede corregir.">
          <Input
            className="h-9 tabular-nums"
            inputMode="numeric"
            value={valores.edad}
            onChange={(e) => set("edad", e.target.value)}
            placeholder="9"
          />
        </Campo>
        <Campo etiqueta="Ocupación">
          <Input
            className="h-9"
            value={valores.ocupacion}
            onChange={(e) => set("ocupacion", e.target.value)}
            placeholder="Estudiante"
          />
        </Campo>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectorCategoria valores={valores} set={set} />
        <Campo etiqueta="Sede">
          <SelectSimple
            valor={valores.sede}
            onCambio={(v) => set("sede", v as Sede)}
            opciones={SEDES}
          />
        </Campo>
        <Campo etiqueta="Derivado por">
          <Input
            className="h-9"
            value={valores.derivadoPor}
            onChange={(e) => set("derivadoPor", e.target.value)}
            placeholder="Consulta espontánea"
          />
        </Campo>
      </div>

      <div className="grid gap-4 rounded-xl border border-dashed border-border bg-muted/40 p-4 sm:grid-cols-2">
        <Campo etiqueta="Obra social" nota="Si no tiene cobertura, escribí «Particular».">
          <Input
            className="h-9 bg-card"
            value={valores.obraSocial}
            onChange={(e) => set("obraSocial", e.target.value)}
            placeholder="OSDE 210 / Particular"
          />
        </Campo>
        <Campo etiqueta="N.º de afiliado">
          <Input
            className="h-9 bg-card tabular-nums"
            value={valores.nroAfiliado}
            onChange={(e) => set("nroAfiliado", e.target.value)}
            placeholder="62004518301"
          />
        </Campo>
      </div>

      <Campo etiqueta="Anamnesis" nota="Antecedentes, medicación, alergias, hábitos.">
        <Textarea
          rows={4}
          value={valores.anamnesis}
          onChange={(e) => set("anamnesis", e.target.value)}
          placeholder="Antecedentes médicos y odontológicos relevantes…"
        />
      </Campo>

      <Campo
        etiqueta="Particularidades / dato de color"
        nota="Nombre de la mamá o el papá, preferencias de turno, con qué se distiende."
      >
        <Textarea
          rows={3}
          value={valores.particularidades}
          onChange={(e) => set("particularidades", e.target.value)}
          placeholder="Mamá: Verónica. Juega al fútbol los sábados…"
        />
      </Campo>

      <Activo
        valores={valores}
        set={set}
        nota="Desactivalo cuando el tratamiento termine o quede en pausa."
      />
    </div>
  )
}
