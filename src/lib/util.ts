export function nuevoId(prefijo = "id"): string {
  return `${prefijo}-${Math.random().toString(36).slice(2, 9)}`
}

export function hoyISO(): string {
  const d = new Date()
  const dos = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`
}

/** 2026-03-14 -> 14/03/2026 */
export function fechaCorta(iso: string): string {
  if (!iso) return "—"
  const [a, m, d] = iso.split("-")
  if (!a || !m || !d) return iso
  return `${d}/${m}/${a}`
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

/** 2026-03-14 -> 14 de marzo de 2026 */
export function fechaLarga(iso: string): string {
  if (!iso) return "—"
  const [a, m, d] = iso.split("-")
  if (!a || !m || !d) return iso
  return `${Number(d)} de ${MESES[Number(m) - 1]} de ${a}`
}

export function nombreMes(n: number): string {
  return MESES[(n - 1) % 12]
}

const pesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
})

export function montoARS(valor: string | number): string {
  const n = typeof valor === "number" ? valor : Number(String(valor).replace(/[^\d.-]/g, ""))
  if (!Number.isFinite(n) || n === 0) return "—"
  return pesos.format(n)
}

/** Edad cumplida a partir de la fecha de nacimiento (AAAA-MM-DD). */
export function edadDesde(iso: string): string {
  // deISO (hora local): new Date("AAAA-MM-DD") parsea en UTC y en Argentina corre el día.
  const nacimiento = iso ? deISO(iso) : new Date(NaN)
  if (Number.isNaN(nacimiento.getTime())) return ""
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad -= 1
  return edad >= 0 && edad < 120 ? String(edad) : ""
}

/** Sólo dígitos, para comparar DNI sin importar cómo se escriba. */
export function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, "")
}

/**
 * Número listo para wa.me (sólo dígitos, con código de país), o null si no alcanza.
 * Asume Argentina cuando no trae código: saca el 0 inicial y el «15», y antepone 549.
 */
export function numeroWhatsApp(telefono: string): string | null {
  // El «15» del celular, tal como se dice de memoria («0221 15 555-0123»), no va en el número internacional.
  const bloques = telefono.split(/[\s\-.()]+/).filter(Boolean)
  const sinQuince = bloques.filter((b, i) => !(b === "15" && i > 0 && i < bloques.length - 1))
  let n = soloDigitos(sinQuince.join(""))
  // Todo junto, sin separadores («0221155550123»): sin código de país son 10 dígitos + «15».
  const local = n.replace(/^0+/, "")
  if (!n.startsWith("54") && local.length === 12) {
    const posibles = [2, 3, 4].filter((i) => local.slice(i, i + 2) === "15")
    if (posibles.length === 1) n = local.slice(0, posibles[0]) + local.slice(posibles[0] + 2)
  }
  if (n.startsWith("00")) n = n.slice(2)
  if (n.startsWith("54")) {
    if (!n.startsWith("549")) n = "549" + n.slice(2)
  } else {
    n = "549" + n.replace(/^0+/, "")
  }
  // 549 + código de área + abonado: 13 dígitos en total.
  return n.length >= 12 && n.length <= 14 ? n : null
}

/** Chat de WhatsApp con el mensaje prellenado; sin número válido abre el selector de contactos. */
export function enlaceWhatsAppChat(telefono: string, texto: string): string {
  const numero = numeroWhatsApp(telefono)
  return `https://wa.me/${numero ?? ""}?text=${encodeURIComponent(texto)}`
}

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

export function iniciales(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
}

/** 54892117 -> 54.892.117 */
export function formatoDNI(dni: string): string {
  const d = soloDigitos(dni)
  if (!d) return "—"
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

/* ---------- Fechas locales (para la agenda) ---------- */

export const DIAS_CORTO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
export const DIAS_LARGO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MESES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

/** Date -> AAAA-MM-DD en hora local (toISOString usaría UTC y puede correr el día). */
export function aISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dia = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${dia}`
}

export function deISO(iso: string): Date {
  const [a, m, d] = iso.split("-").map(Number)
  return new Date(a, m - 1, d)
}

export function sumarDias(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** Lunes de la semana de `d`. */
export function lunesDe(d: Date): Date {
  const dif = (d.getDay() + 6) % 7
  return sumarDias(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -dif)
}

/** 5 oct */
export function diaMes(d: Date): string {
  return `${d.getDate()} ${MESES_CORTO[d.getMonth()]}`
}

/** 2026-10-05 -> Lun 5 oct */
export function fechaConDia(iso: string): string {
  const d = deISO(iso)
  return `${DIAS_CORTO[d.getDay()]} ${diaMes(d)}`
}
