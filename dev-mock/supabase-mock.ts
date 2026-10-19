/**
 * Supabase falso en memoria, SOLO para probar el layout en desarrollo (VITE_MOCK=true).
 * No se usa en producción: vite.config.ts lo enchufa vía alias únicamente con ese flag.
 */
type Fila = Record<string, any>
type Respuesta = { data: any; error: { code?: string; message: string } | null }

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const hoy = new Date()
const lunes = new Date(hoy)
lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7))
const dia = (n: number) => {
  const d = new Date(lunes)
  d.setDate(lunes.getDate() + n)
  return iso(d)
}
const id = () => crypto.randomUUID()

// ---------- Imágenes y modelo de ejemplo ----------
const colores = ["#e8b4a0", "#c9d6df", "#d9c5e8", "#f2d6a2", "#b9d8c2", "#f0b8c4"]
function svg(texto: string, i: number) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450"><rect width="600" height="450" fill="${colores[i % colores.length]}"/><circle cx="300" cy="200" r="110" fill="rgba(255,255,255,.45)"/><text x="300" y="400" font-size="28" text-anchor="middle" fill="#333" font-family="sans-serif">${texto}</text></svg>`
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s)
}
function stlAscii() {
  // Octaedro simple en STL ASCII.
  const v = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
  const caras = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]]
  let t = "solid demo\n"
  for (const c of caras) {
    t += "facet normal 0 0 0\nouter loop\n"
    for (const k of c) t += `vertex ${v[k].join(" ")}\n`
    t += "endloop\nendfacet\n"
  }
  return new Blob([t + "endsolid demo\n"], { type: "model/stl" })
}

const urls = new Map<string, string>()
const urlDe = (path: string) => {
  if (urls.has(path)) return urls.get(path)!
  let u: string
  if (path.endsWith(".stl")) u = URL.createObjectURL(stlAscii())
  else if (path.endsWith(".pdf")) u = URL.createObjectURL(new Blob(["%PDF-1.1\n%%EOF"], { type: "application/pdf" }))
  else u = svg(path.split("/").pop()!.replace(/\.\w+$/, ""), path.length)
  urls.set(path, u)
  return u
}

// ---------- Datos de ejemplo ----------
const pac = (n: string, a: string, dni: string, cat: string, sede: string, extra: Fila = {}): Fila => ({
  id: "p-" + dni, nombre: n, apellido: a, dni, email: n.toLowerCase() + "@example.com", telefono: "221 555-01" + dni.slice(-2),
  ocupacion: "Estudiante", fecha_nacimiento: "2008-03-14", categoria: cat, sede, anamnesis: "Sin antecedentes relevantes.",
  obra_social: "OSDE 210", particularidades: "", derivado_por: "", activo: true, updated_at: new Date().toISOString(), ...extra,
})
const largo =
  "Paciente con apiñamiento anterior moderado, mordida cruzada posterior izquierda y desviación de línea media de 2 mm hacia la derecha. Se observa respiración bucal predominante y hábito de interposición lingual. Se indica expansión maxilar seguida de aparatología fija en ambos maxilares, con controles mensuales y retenedores al finalizar. "
const P = [
  pac("Bautista", "Fernández", "54892117", "ortopedia", "la_plata", { particularidades: largo }),
  pac("Carla", "Rodríguez Etcheverry de la Vega", "38120455", "ortodoncia", "la_plata"),
  pac("Camila", "Rossi", "41230987", "alineadores", "tandil"),
  pac("Mateo", "Gómez", "46011234", "ortodoncia", "la_plata"),
  pac("Lucía", "Martínez", "39555111", "armonizacion_facial", "la_plata"),
  pac("Julián", "Pérez", "42777333", "ortopedia", "tandil"),
  pac("Sofía", "Álvarez", "40111999", "ortodoncia", "la_plata"),
  pac("Tomás", "Sánchez", "44222888", "alineadores", "la_plata", { activo: false }),
]
const P1 = P[0].id

const bd: Record<string, Fila[]> = {
  pacientes: P,
  bloques_horarios: [
    { id: id(), sede: "la_plata", dias: [1, 2, 3, 4, 5], hora_desde: "09:00:00", hora_hasta: "13:00:00", etiqueta: "Mañana" },
    { id: id(), sede: "la_plata", dias: [1, 3, 5], hora_desde: "15:00:00", hora_hasta: "20:00:00", etiqueta: "Tarde" },
  ],
  jornadas_tandil: [{ id: id(), fecha: dia(5), hora_desde: "09:00:00", hora_hasta: "18:00:00", etiqueta: "Jornada Tandil" }],
  turnos: [] as Fila[],
  tramites: [] as Fila[],
  diagnosticos: [
    { id: id(), paciente_id: P1, diagnostico: largo + largo, plan_tratamiento: largo + largo, tecnica: "Autoligado Damon + expansor tipo Hyrax", created_at: new Date().toISOString() },
  ],
  seguimiento: [] as Fila[],
  presupuestos: [] as Fila[],
  cuotas: [] as Fila[],
  mantenimiento_registros: [] as Fila[],
  archivos_clinicos: [] as Fila[],
}

// Turnos: semana actual, varios por día en ambas sedes.
const horas = ["09:00", "09:30", "10:30", "11:00", "12:00", "15:00", "16:00", "16:30", "17:30", "18:30"]
for (let d = 0; d < 6; d++)
  horas.forEach((h, i) => {
    if ((d + i) % 3 === 0) return
    const p = P[(d + i) % 7]
    bd.turnos.push({
      id: id(), paciente_id: p.id, sede: d === 5 ? "tandil" : "la_plata", fecha: dia(d), hora_inicio: h + ":00",
      duracion_minutos: [30, 45, 60][(d + i) % 3], estado: i === 4 && d === 2 ? "cancelado" : i === 7 ? "no_asistio" : "ocupado",
      updated_at: new Date().toISOString(),
    })
  })
bd.turnos.push({ id: id(), paciente_id: P1, sede: "la_plata", fecha: dia(7), hora_inicio: "10:00:00", duracion_minutos: 30, estado: "ocupado", updated_at: "" })

P.slice(0, 6).forEach((p, i) => {
  bd.tramites.push({ id: id(), paciente_id: p.id, tipo: i % 2 ? "facturacion" : "obra_social", estado: "pendiente", fecha_agregado: new Date(Date.now() - i * 864e5).toISOString(), fecha_resuelto: null })
  bd.tramites.push({ id: id(), paciente_id: p.id, tipo: i % 2 ? "obra_social" : "facturacion", estado: i < 2 ? "resuelto" : "pendiente", fecha_agregado: new Date(Date.now() - i * 5e7).toISOString(), fecha_resuelto: null })
})

for (let i = 0; i < 6; i++)
  bd.seguimiento.push({
    id: id(), paciente_id: P1, fecha: dia(-i * 20), created_at: new Date(Date.now() - i * 1e6).toISOString(),
    texto: i % 2 ? "Control mensual. Se cambia arco y se refuerza higiene." : largo + "Se pide radiografía de control para la próxima visita y se conversa con los padres.",
  })

// Presupuesto con 12 cuotas (primeras 3 cobradas) y mantenimiento.
const presId = id()
bd.presupuestos.push({ id: presId, paciente_id: P1, monto_total: 1800000, condiciones: largo, duracion_estimada_tratamiento: "24 meses", valor_contencion: 120000, valor_alta: 90000, fecha_alta: null, created_at: new Date().toISOString(), updated_at: "" })
for (let n = 1; n <= 12; n++) {
  const v = new Date(hoy.getFullYear(), hoy.getMonth() - 2 + n, 10)
  bd.cuotas.push({ id: id(), presupuesto_id: presId, numero_cuota: n, monto: 150000, metodo_pago: n % 2 ? "transferencia" : "efectivo", estado: n <= 3 ? "efectuado" : "pendiente", fecha: n <= 3 ? iso(v) : null, fecha_vencimiento: iso(v) })
}
for (let n = 0; n < 4; n++)
  bd.mantenimiento_registros.push({ id: id(), presupuesto_id: presId, fecha: dia(n * 30), monto: 45000, estado: n < 1 ? "efectuado" : "pendiente" })

// Archivos: series completas de fotos, intra-tratamiento, radiografías y estudios.
const arch = (origen: string, etiqueta: string | null, zona: string | null, tipo: string, ext: string, etapa: string | null = null) =>
  bd.archivos_clinicos.push({
    id: id(), paciente_id: P1, origen, zona, etiqueta, tipo_archivo: tipo, etapa,
    storage_path: `${P1}/${origen}/${etiqueta ?? origen}-${bd.archivos_clinicos.length}.${ext}`, fecha: dia(-10), created_at: new Date(Date.now() + bd.archivos_clinicos.length).toISOString(),
  })
const slots: [string, string][] = [
  ...["perfil_izquierdo", "perfil_derecho", "tres_cuartos_sonrisa", "frente_sonriendo"].map((s): [string, string] => [s, "cara"]),
  ...["boca_frente", "boca_lateral_derecha", "boca_lateral_izquierda", "oclusal_superior", "oclusal_inferior", "overjet_inferior"].map((s): [string, string] => [s, "boca"]),
]
for (const o of ["foto_inicial", "foto_final"]) for (const [s, z] of slots) arch(o, s, z, "imagen", "jpg")
for (let i = 0; i < 8; i++) arch("intra_tratamiento", null, null, i === 7 ? "video" : "imagen", "jpg", ["inicial", "intermedio", "final"][i % 3])
for (let i = 0; i < 4; i++) arch("radiografia", null, null, "imagen", "jpg")
arch("estudio", null, null, "modelo3d", "stl")
arch("estudio", null, null, "pdf", "pdf")
arch("estudio", null, null, "imagen", "jpg")

// ---------- Query builder ----------
class Consulta implements PromiseLike<Respuesta> {
  private filtros: ((f: Fila) => boolean)[] = []
  private orden: { col: string; asc: boolean }[] = []
  private tope?: number
  private accion: "select" | "insert" | "update" | "delete" = "select"
  private payload: any
  private devolver = false
  private unico = false

  constructor(private tabla: string) {
    if (!bd[tabla]) bd[tabla] = []
  }
  select() { this.devolver = true; return this }
  insert(p: any) { this.accion = "insert"; this.payload = p; return this }
  update(p: any) { this.accion = "update"; this.payload = p; return this }
  delete() { this.accion = "delete"; return this }
  eq(c: string, v: any) { this.filtros.push((f) => f[c] === v); return this }
  gt(c: string, v: any) { this.filtros.push((f) => f[c] > v); return this }
  gte(c: string, v: any) { this.filtros.push((f) => f[c] >= v); return this }
  lte(c: string, v: any) { this.filtros.push((f) => f[c] <= v); return this }
  order(c: string, o?: { ascending?: boolean }) { this.orden.push({ col: c, asc: o?.ascending !== false }); return this }
  limit(n: number) { this.tope = n; return this }
  single() { this.unico = true; this.devolver = true; return this }

  private ejecutar(): Respuesta {
    const tabla = bd[this.tabla]
    const coincide = (f: Fila) => this.filtros.every((fn) => fn(f))
    let res: Fila[]
    if (this.accion === "insert") {
      const filas = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((p: Fila) => {
        const f = { id: id(), created_at: new Date().toISOString(), fecha_agregado: new Date().toISOString(), ...p }
        if (this.tabla === "pacientes" && tabla.some((x) => x.dni === f.dni)) return null
        return f
      })
      if (filas.includes(null)) return { data: null, error: { code: "23505", message: "dup" } }
      tabla.push(...filas)
      res = filas
    } else if (this.accion === "update") {
      res = tabla.filter(coincide)
      res.forEach((f) => Object.assign(f, this.payload))
    } else if (this.accion === "delete") {
      res = tabla.filter(coincide)
      bd[this.tabla] = tabla.filter((f) => !res.includes(f))
    } else res = tabla.filter(coincide)
    for (const { col, asc } of [...this.orden].reverse())
      res = [...res].sort((a, b) => (a[col] === b[col] ? 0 : (a[col] ?? "") > (b[col] ?? "") ? 1 : -1) * (asc ? 1 : -1))
    if (this.tope !== undefined) res = res.slice(0, this.tope)
    const sal = res.map((f) => ({ ...f }))
    if (this.unico) return sal[0] ? { data: sal[0], error: null } : { data: null, error: { code: "PGRST116", message: "0 filas" } }
    return { data: this.accion === "select" || this.devolver ? sal : null, error: null }
  }
  then<A = Respuesta, B = never>(ok?: ((v: Respuesta) => A | PromiseLike<A>) | null, ko?: ((r: any) => B | PromiseLike<B>) | null) {
    return Promise.resolve().then(() => this.ejecutar()).then(ok, ko)
  }
}

const sesion = { access_token: "mock", user: { id: "mock-user", email: "demo@example.com" } }

export const recordarSesion = { get: () => true, set: (_v: boolean) => {} }

export const supabase = {
  from: (tabla: string) => new Consulta(tabla),
  auth: {
    getSession: async () => ({ data: { session: sesion }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ error: null }),
    updateUser: async () => ({ error: null }),
  },
  storage: {
    from: (_bucket: string) => ({
      createSignedUrl: async (path: string) => ({ data: { signedUrl: urlDe(path) }, error: null }),
      upload: async (path: string, file: File) => {
        urls.set(path, URL.createObjectURL(file))
        return { data: { path }, error: null }
      },
      remove: async (paths: string[]) => ({ data: paths.map((name) => ({ name })), error: null }),
    }),
  },
} as any
