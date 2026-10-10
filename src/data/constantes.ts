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

export const TABLA_DIAGNOSTICOS = "diagnosticos"

export const COLUMNAS_DIAGNOSTICOS = {
  id: "id",
  pacienteId: "paciente_id",
  diagnostico: "diagnostico",
  planTratamiento: "plan_tratamiento",
  tecnica: "tecnica",
  createdAt: "created_at",
} as const

export const TABLA_PRESUPUESTOS = "presupuestos"

export const COLUMNAS_PRESUPUESTOS = {
  id: "id",
  pacienteId: "paciente_id",
  montoTotal: "monto_total",
  condiciones: "condiciones",
  duracionEstimada: "duracion_estimada_tratamiento",
  valorContencion: "valor_contencion",
  valorAlta: "valor_alta",
  fechaAlta: "fecha_alta",
  createdAt: "created_at",
  updatedAt: "updated_at",
} as const

export const TABLA_CUOTAS = "cuotas"

export const COLUMNAS_CUOTAS = {
  id: "id",
  presupuestoId: "presupuesto_id",
  numeroCuota: "numero_cuota",
  monto: "monto",
  metodoPago: "metodo_pago",
  estado: "estado",
  fecha: "fecha",
} as const

export const TABLA_MANTENIMIENTO = "mantenimiento_registros"

export const COLUMNAS_MANTENIMIENTO = {
  id: "id",
  presupuestoId: "presupuesto_id",
  fecha: "fecha",
  monto: "monto",
  estado: "estado",
} as const

export const TABLA_SEGUIMIENTO = "seguimiento"

export const COLUMNAS_SEGUIMIENTO = {
  id: "id",
  pacienteId: "paciente_id",
  fecha: "fecha",
  texto: "texto",
  createdAt: "created_at",
} as const

export const TABLA_BLOQUES = "bloques_horarios"

export const COLUMNAS_BLOQUES = {
  id: "id",
  sede: "sede",
  dias: "dias",
  horaDesde: "hora_desde",
  horaHasta: "hora_hasta",
  etiqueta: "etiqueta",
} as const

export const TABLA_JORNADAS = "jornadas_tandil"

export const COLUMNAS_JORNADAS = {
  id: "id",
  fecha: "fecha",
  horaDesde: "hora_desde",
  horaHasta: "hora_hasta",
  etiqueta: "etiqueta",
} as const

export const TABLA_TURNOS = "turnos"

export const COLUMNAS_TURNOS = {
  id: "id",
  pacienteId: "paciente_id",
  sede: "sede",
  fecha: "fecha",
  horaInicio: "hora_inicio",
  duracion: "duracion_minutos",
  estado: "estado",
  updatedAt: "updated_at",
} as const

export const TABLA_TRAMITES = "tramites"

export const COLUMNAS_TRAMITES = {
  id: "id",
  pacienteId: "paciente_id",
  tipo: "tipo",
  estado: "estado",
  fechaAgregado: "fecha_agregado",
  fechaResuelto: "fecha_resuelto",
} as const
