export type Sede = "La Plata" | "Tandil"
export type MomentoEstudio = "Inicial" | "Intermedio" | "Final"
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
export const MOMENTOS: MomentoEstudio[] = ["Inicial", "Intermedio", "Final"]
export const MEDIOS_PAGO: MedioPago[] = ["Efectivo", "Transferencia"]

export function esArmonizacion(categoria: Categoria): boolean {
  return categoria === "Armonización facial"
}

/** Los 10 slots fijos de la serie fotográfica dental: 4 de cara + 6 de boca. */
export const SLOTS_CARA = [
  { id: "frente", etiqueta: "Frente" },
  { id: "frente-sonriendo", etiqueta: "Frente sonriendo" },
  { id: "perfil-derecho", etiqueta: "Perfil derecho" },
  { id: "perfil-izquierdo", etiqueta: "Perfil izquierdo" },
] as const

export const SLOTS_BOCA = [
  { id: "boca-frontal", etiqueta: "Frontal" },
  { id: "boca-lateral-derecha", etiqueta: "Lateral derecha" },
  { id: "boca-lateral-izquierda", etiqueta: "Lateral izquierda" },
  { id: "oclusal-superior", etiqueta: "Oclusal superior" },
  { id: "oclusal-inferior", etiqueta: "Oclusal inferior" },
  { id: "sonrisa", etiqueta: "Sonrisa" },
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

export interface FotoFechada {
  id: string
  url: string
  fecha: string
  nota: string
}

export interface Archivo {
  id: string
  nombre: string
  momento: MomentoEstudio
  formato: "imagen" | "pdf"
  url: string | null
}

export interface Cuota {
  mes: number
  medio: MedioPago
  efectuado: boolean
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
  anamnesis: string
  obraSocial: string
  nroAfiliado: string
  particularidades: string
  derivadoPor: string
  activo: boolean
  fotosIniciales: FotoSlot[]
  fotosIntra: FotoFechada[]
  fotosFinales: FotoSlot[]
  /** Sólo armonización facial: 3 tomas previas al tratamiento. */
  fotosAntes: FotoSlot[]
  /** Sólo armonización facial: las mismas 3 tomas después. */
  fotosDespues: FotoSlot[]
  radiografias: Archivo[]
  estudios: Archivo[]
  diagnostico: string
  plan: string
  tecnica: string
  montoTotal: string
  condiciones: string
  cuotas: Cuota[]
  seguimiento: EntradaSeguimiento[]
}

export const MAX_FOTOS_INTRA = 15
export const MAX_ARCHIVOS = 4

export function serieVacia(): FotoSlot[] {
  return SLOTS_SERIE.map((s) => ({ slot: s.id, url: null }))
}

export function serieAFVacia(): FotoSlot[] {
  return SLOTS_AF.map((s) => ({ slot: s.id, url: null }))
}

export function cuotasVacias(): Cuota[] {
  return Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    medio: "Transferencia" as MedioPago,
    efectuado: false,
  }))
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
    dni: "",
    ocupacion: "",
    edad: "",
    fechaNacimiento: "",
    categoria: "Ortopedia",
    sede: "La Plata",
    anamnesis: "",
    obraSocial: "",
    nroAfiliado: "",
    particularidades: "",
    derivadoPor: "",
    activo: true,
    fotosIniciales: serieVacia(),
    fotosIntra: [],
    fotosFinales: serieVacia(),
    fotosAntes: serieAFVacia(),
    fotosDespues: serieAFVacia(),
    radiografias: [],
    estudios: [],
    diagnostico: "",
    plan: "",
    tecnica: "",
    montoTotal: "",
    condiciones: "",
    cuotas: cuotasVacias(),
    seguimiento: [],
  }
}
