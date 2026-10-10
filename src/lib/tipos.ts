export type Sede = "La Plata" | "Tandil"
export type MedioPago = "Efectivo" | "Transferencia"

/**
 * Categoría del paciente. Define qué módulos tiene la ficha:
 * las tres primeras comparten la misma estructura; armonización facial
 * usa una ficha corta y su propia galería de antes/después.
 */
export type Categoria = "Ortopedia" | "Ortodoncia" | "Alineadores" | "Armonización facial"

export const SEDES: Sede[] = ["La Plata", "Tandil"]
export const CATEGORIAS: Categoria[] = [
  "Ortopedia",
  "Ortodoncia",
  "Alineadores",
  "Armonización facial",
]
export const MEDIOS_PAGO: MedioPago[] = ["Efectivo", "Transferencia"]

export function esArmonizacion(categoria: Categoria): boolean {
  return categoria === "Armonización facial"
}

/** Los 10 slots fijos de la serie fotográfica dental: 4 de cara + 6 de boca. */
export const SLOTS_CARA = [
  { id: "perfil-izquierdo", etiqueta: "Perfil izquierdo" },
  { id: "perfil-derecho", etiqueta: "Perfil derecho" },
  { id: "tres-cuartos-sonrisa", etiqueta: "¾ perfil sonrisa" },
  { id: "frente-sonriendo", etiqueta: "Frente sonriendo" },
] as const

export const SLOTS_BOCA = [
  { id: "boca-frente", etiqueta: "Frente" },
  { id: "boca-lateral-derecha", etiqueta: "Lateral derecha" },
  { id: "boca-lateral-izquierda", etiqueta: "Lateral izquierda" },
  { id: "oclusal-superior", etiqueta: "Oclusal superior" },
  { id: "oclusal-inferior", etiqueta: "Oclusal inferior" },
  { id: "overjet-inferior", etiqueta: "Overjet vista inferior" },
] as const

export const SLOTS_SERIE = [...SLOTS_CARA, ...SLOTS_BOCA]
export type SlotSerie = (typeof SLOTS_SERIE)[number]["id"]

/** Los 3 slots de armonización facial. Se repiten en «antes» y en «después». */
export const SLOTS_AF = [
  { id: "af-frente", etiqueta: "Frente" },
  { id: "af-perfil-derecho", etiqueta: "Perfil derecho" },
  { id: "af-perfil-izquierdo", etiqueta: "Perfil izquierdo" },
] as const

export type SlotAF = (typeof SLOTS_AF)[number]["id"]
export type SlotFoto = SlotSerie | SlotAF

export interface FotoSlot {
  slot: SlotFoto
  url: string | null
}

export interface EntradaSeguimiento {
  id: string
  fecha: string
  texto: string
}

export interface Paciente {
  id: string
  nombre: string
  apellido: string
  dni: string
  ocupacion: string
  edad: string
  fechaNacimiento: string
  categoria: Categoria
  sede: Sede
  /** Se usa para vincular al paciente con los trámites pendientes. */
  mail: string
  anamnesis: string
  obraSocial: string
  particularidades: string
  derivadoPor: string
  activo: boolean
  /** Sólo armonización facial: 3 tomas previas al tratamiento. */
  fotosAntes: FotoSlot[]
  /** Sólo armonización facial: las mismas 3 tomas después. */
  fotosDespues: FotoSlot[]
  seguimiento: EntradaSeguimiento[]
}

export const MAX_CUOTAS = 8
export const PLAZO_CUOTAS_MESES = 6

export function serieAFVacia(): FotoSlot[] {
  return SLOTS_AF.map((s) => ({ slot: s.id, url: null }))
}

export function etiquetaSlot(slot: SlotFoto): string {
  return (
    [...SLOTS_SERIE, ...SLOTS_AF].find((s) => s.id === slot)?.etiqueta ?? slot
  )
}

export function pacienteVacio(): Omit<Paciente, "id"> {
  return {
    nombre: "",
    apellido: "",
    mail: "",
    dni: "",
    ocupacion: "",
    edad: "",
    fechaNacimiento: "",
    categoria: "Ortopedia",
    sede: "La Plata",
    anamnesis: "",
    obraSocial: "",
    particularidades: "",
    derivadoPor: "",
    activo: true,
    fotosAntes: serieAFVacia(),
    fotosDespues: serieAFVacia(),
    seguimiento: [],
  }
}

/** Un turno ocupado/cancelado/no-asistió. Un horario sin turno cargado está libre. */
export type EstadoTurno = "ocupado" | "cancelado" | "no-asistio"

export interface Turno {
  id: string
  pacienteId: string
  sede: Sede
  /** AAAA-MM-DD */
  fecha: string
  /** HH:MM */
  hora: string
  /** minutos; es por turno, no por bloque */
  duracion: number
  estado: EstadoTurno
}

/**
 * Un bloque de atención. Los bloques conviven (los extra no reemplazan al
 * horario general). La etiqueta es texto libre, no una categoría del sistema.
 */
export interface BloqueHorario {
  id: string
  /** Cada sede tiene su propio horario. */
  sede: Sede
  /** Semanal (La Plata): 0 = domingo … 6 = sábado (igual que Date.getDay). Vacío si es una fecha puntual. */
  dias: number[]
  /** Fecha puntual AAAA-MM-DD (Tandil: unos pocos días al mes). Si está, `dias` no se usa. */
  fecha?: string
  desde: string
  hasta: string
  etiqueta: string
}

/** Horarios de atención. Se edita desde «Configurar horarios», no está fijo en el código. */
export interface ConfigAgenda {
  bloques: BloqueHorario[]
}

export const DURACIONES = [15, 20, 30, 45, 60]

export type TipoTramite = "obra-social" | "facturacion"

export const TIPOS_TRAMITE: { id: TipoTramite; etiqueta: string }[] = [
  { id: "obra-social", etiqueta: "Trámites de obra social" },
  { id: "facturacion", etiqueta: "Trámites de facturación" },
]

export interface Tramite {
  id: string
  pacienteId: string
  tipo: TipoTramite
  /** AAAA-MM-DD en que se agregó a la lista */
  agregado: string
  resuelto: boolean
}
