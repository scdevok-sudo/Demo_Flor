/** Nombres de tablas y buckets de Supabase. Si cambia alguno en la base, se ajusta acá. */
export const TABLAS = {
  pacientes: "pacientes",
} as const

export const COLUMNAS_PACIENTES = {
  id: "id",
  nombre: "nombre",
  apellido: "apellido",
  dni: "dni",
  email: "email",
  ocupacion: "ocupacion",
  fechaNacimiento: "fecha_nacimiento",
  categoria: "categoria",
  sede: "sede",
  anamnesis: "anamnesis",
  obraSocial: "obra_social",
  particularidades: "particularidades",
  derivadoPor: "derivado_por",
  activo: "activo",
  updatedAt: "updated_at",
} as const

export const TABLA_ARCHIVOS = "archivos_clinicos"

export const COLUMNAS_ARCHIVOS = {
  id: "id",
  pacienteId: "paciente_id",
  origen: "origen",
  zona: "zona",
  etiqueta: "etiqueta",
  tipoArchivo: "tipo_archivo",
  etapa: "etapa",
  storagePath: "storage_path",
  fecha: "fecha",
  createdAt: "created_at",
} as const

export const BUCKETS = {
  fotos: "pacientes-fotos",
  estudios: "pacientes-estudios",
  presupuestos: "presupuestos-pdf",
} as const
