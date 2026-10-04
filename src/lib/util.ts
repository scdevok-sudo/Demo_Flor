/** Foto de relleno para la demo. No hay carga real de archivos. */
export function fotoDemo(semilla: string, ancho = 480, alto = 600): string {
  return `https://picsum.photos/seed/${encodeURIComponent(semilla)}/${ancho}/${alto}`
}

export function nuevoId(prefijo = "id"): string {
  return `${prefijo}-${Math.random().toString(36).slice(2, 9)}`
}

export function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
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

/** Sólo dígitos, para comparar DNI sin importar cómo se escriba. */
export function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, "")
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
