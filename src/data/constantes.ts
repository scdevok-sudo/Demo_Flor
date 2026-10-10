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
