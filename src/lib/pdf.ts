import type { jsPDF } from "jspdf"

import type { Cuota, RegistroMantenimiento } from "@/data/presupuestos"
import { esArmonizacion, type Paciente } from "@/lib/tipos"
import { enlaceWhatsAppChat, fechaCorta, fechaLarga, formatoDNI, hoyISO, montoARS } from "@/lib/util"

/** Colores de marca en RGB, para jsPDF. */
const OSCURO: [number, number, number] = [67, 73, 82] // #434952
const MEDIO: [number, number, number] = [141, 156, 164] // #8D9CA4
const CLARO: [number, number, number] = [194, 197, 198] // #C2C5C6
const CORAL: [number, number, number] = [248, 143, 143] // #F88F8F
const FONDO: [number, number, number] = [244, 245, 245] // tinte de #C2C5C6
const TEXTO: [number, number, number] = [50, 54, 60]

const ANCHO = 210
const ALTO = 297
const MARGEN = 18
const UTIL = ANCHO - MARGEN * 2
const BASE_PIE = ALTO - 23

/** Lo que el presupuesto toma del diagnóstico y del módulo de pagos. */
export interface ContenidoPresupuesto {
  diagnostico: string
  plan: string
  tecnica: string
  montoTotal: string
  condiciones: string
  cuotas: Cuota[]
  /** Id del presupuesto: se muestra abreviado como número de referencia. */
  referencia?: string
  duracionEstimada?: string
  mantenimiento?: RegistroMantenimiento[]
}

export function nombreArchivo(p: Paciente): string {
  const limpio = `${p.apellido}-${p.nombre}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
  return `presupuesto-${limpio}.pdf`
}

// Playfair Display hace de Monterchi Serif hasta que haya licencia de la fuente de marca.
const FUENTES = [
  { archivo: "PlayfairDisplay-SemiBold.ttf", familia: "Playfair", estilo: "normal" },
  { archivo: "Montserrat-Regular.ttf", familia: "Montserrat", estilo: "normal" },
  { archivo: "Montserrat-SemiBold.ttf", familia: "Montserrat", estilo: "bold" },
] as const

function aBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binario = ""
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binario)
}

let fuentesCargadas: Promise<string[]> | null = null

/** Descarga (una sola vez) las TTF subseteadas de /public/fonts, en base64. */
function cargarFuentes(): Promise<string[]> {
  fuentesCargadas ??= Promise.all(
    FUENTES.map(async (f) => {
      const r = await fetch(`${import.meta.env.BASE_URL}fonts/${f.archivo}`)
      if (!r.ok) throw new Error(`No se pudo cargar la fuente ${f.archivo}`)
      return aBase64(await r.arrayBuffer())
    })
  ).catch((e) => {
    fuentesCargadas = null
    throw e
  })
  return fuentesCargadas
}

/**
 * jsPDF se carga recién cuando hace falta: así el panel no arrastra
 * la librería en la carga inicial.
 */
export async function generarPresupuesto(p: Paciente, c: ContenidoPresupuesto): Promise<jsPDF> {
  const [{ jsPDF }, fuentes] = await Promise.all([import("jspdf"), cargarFuentes()])
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true })
  FUENTES.forEach((f, i) => {
    doc.addFileToVFS(f.archivo, fuentes[i])
    doc.addFont(f.archivo, f.familia, f.estilo)
  })
  let y = 0

  const serif = (tam: number) => {
    doc.setFont("Playfair", "normal")
    doc.setFontSize(tam)
  }
  const sans = (tam: number, negrita = false) => {
    doc.setFont("Montserrat", negrita ? "bold" : "normal")
    doc.setFontSize(tam)
  }

  // ---- Membrete: isotipo "fi." (punto siempre coral) + datos ----------------
  const dibujarMembrete = () => {
    doc.setFillColor(...OSCURO)
    doc.rect(0, 0, ANCHO, 30, "F")

    serif(30)
    doc.setTextColor(255, 255, 255)
    doc.text("fi", MARGEN, 20.5)
    const anchoFi = doc.getTextWidth("fi")
    doc.setTextColor(...CORAL)
    doc.text(".", MARGEN + anchoFi, 20.5)

    const xDatos = MARGEN + 24
    doc.setDrawColor(...MEDIO)
    doc.setLineWidth(0.2)
    doc.line(xDatos - 5, 9, xDatos - 5, 22)
    serif(14)
    doc.setTextColor(255, 255, 255)
    doc.text("Florencia Inveninato", xDatos, 14.5)
    sans(7.5)
    doc.setTextColor(...CLARO)
    doc.text("Ortodoncia y ortopedia maxilar", xDatos, 19.5)
    doc.text("La Plata  ·  Tandil", xDatos, 23.5)

    y = 40
  }

  const pie = () => {
    doc.setDrawColor(...CLARO)
    doc.setLineWidth(0.2)
    doc.line(MARGEN, ALTO - 20, ANCHO - MARGEN, ALTO - 20)
    sans(7)
    doc.setTextColor(...MEDIO)
    doc.text("Presupuesto sin valor de factura. Válido por 30 días desde la fecha de emisión.", MARGEN, ALTO - 15)
    doc.text("Florencia Inveninato  ·  La Plata  ·  Tandil", ANCHO - MARGEN, ALTO - 15, { align: "right" })
  }

  const nuevaPagina = () => {
    pie()
    doc.addPage()
    doc.setFillColor(...OSCURO)
    doc.rect(0, 0, ANCHO, 12, "F")
    serif(11)
    doc.setTextColor(255, 255, 255)
    doc.text("fi", MARGEN, 8)
    const w = doc.getTextWidth("fi")
    doc.setTextColor(...CORAL)
    doc.text(".", MARGEN + w, 8)
    sans(7.5)
    doc.setTextColor(...CLARO)
    doc.text("Florencia Inveninato", MARGEN + w + 6, 7.8)
    y = 26
  }

  const espacio = (alto: number) => {
    if (y + alto > BASE_PIE) nuevaPagina()
  }

  const titulo = (texto: string) => {
    espacio(14)
    sans(7.5, true)
    doc.setTextColor(...OSCURO)
    doc.text(texto.toUpperCase(), MARGEN, y, { charSpace: 0.4 })
    y += 2
    doc.setDrawColor(...CLARO)
    doc.setLineWidth(0.2)
    doc.line(MARGEN, y, ANCHO - MARGEN, y)
    y += 5
  }

  const parrafo = (texto: string) => {
    sans(9)
    const lineas = doc.splitTextToSize(texto || "—", UTIL) as string[]
    doc.setTextColor(...TEXTO)
    for (const linea of lineas) {
      espacio(6)
      doc.text(linea, MARGEN, y)
      y += 4.8
    }
    y += 2.5
  }

  /** Dato con etiqueta chica arriba y valor debajo. */
  const dato = (etiqueta: string, valor: string, x: number, yy: number, ancho: number) => {
    sans(6.5)
    doc.setTextColor(...MEDIO)
    doc.text(etiqueta.toUpperCase(), x, yy, { charSpace: 0.3 })
    sans(9.5, true)
    doc.setTextColor(...OSCURO)
    const lineas = doc.splitTextToSize(valor || "—", ancho) as string[]
    doc.text(lineas[0], x, yy + 5.5)
  }

  dibujarMembrete()

  // ---- Título del documento ----------------------------------------------
  serif(21)
  doc.setTextColor(...OSCURO)
  doc.text("Presupuesto de tratamiento", MARGEN, y)
  sans(8)
  doc.setTextColor(...MEDIO)
  doc.text(fechaLarga(hoyISO()), ANCHO - MARGEN, y - 4, { align: "right" })
  if (c.referencia) {
    sans(8, true)
    doc.setTextColor(...OSCURO)
    doc.text(`Ref. Nº ${c.referencia.replace(/-/g, "").slice(0, 8).toUpperCase()}`, ANCHO - MARGEN, y + 1, { align: "right" })
  }
  doc.setFillColor(...CORAL)
  doc.rect(MARGEN, y + 3.5, 14, 0.9, "F")
  y += 14

  // ---- Datos del paciente -------------------------------------------------
  titulo("Paciente")
  const col = UTIL / 3
  doc.setFillColor(...FONDO)
  doc.roundedRect(MARGEN, y - 4, UTIL, 24, 2, 2, "F")
  const x0 = MARGEN + 5
  dato("Nombre y apellido", `${p.nombre} ${p.apellido}`, x0, y + 1, col - 6)
  dato("DNI", formatoDNI(p.dni), x0 + col, y + 1, col - 6)
  dato("Edad", p.edad ? `${p.edad} años` : "—", x0 + col * 2, y + 1, col - 6)
  dato("Tratamiento", p.categoria, x0, y + 11, col - 6)
  dato("Sede", p.sede, x0 + col, y + 11, col - 6)
  dato(
    "Cobertura",
    esArmonizacion(p.categoria) ? "Particular" : p.obraSocial || "Particular",
    x0 + col * 2,
    y + 11,
    col - 6
  )
  y += 30

  // ---- Clínica ------------------------------------------------------------
  titulo("Diagnóstico")
  parrafo(c.diagnostico)

  titulo("Plan de tratamiento")
  parrafo(c.plan)

  // Armonización facial no usa técnica de aparatología.
  if (!esArmonizacion(p.categoria)) {
    titulo("Técnica a utilizar")
    parrafo(c.tecnica)
  }

  // ---- Inversión y saldo --------------------------------------------------
  const total = Number(c.montoTotal) || 0
  const cantidad = c.cuotas.length
  const valorCuota = cantidad > 0 ? Math.round(total / cantidad) : 0
  const pagas = c.cuotas.filter((q) => q.efectuado).length
  const mantenimiento = [...(c.mantenimiento ?? [])].sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Abonado y saldo salen de las cuotas y del mantenimiento registrado. El saldo de las
  // cuotas es el total menos lo abonado, así el redondeo de la cuota no deja centavos sueltos.
  const abonadoCuotas = Math.min(total, valorCuota * pagas)
  const saldoCuotas = Math.max(0, total - abonadoCuotas)
  const montoMant = (m: RegistroMantenimiento) => Number(m.monto) || 0
  const abonadoMant = mantenimiento.filter((m) => m.efectuado).reduce((s, m) => s + montoMant(m), 0)
  const saldoMant = mantenimiento.filter((m) => !m.efectuado).reduce((s, m) => s + montoMant(m), 0)
  const abonado = abonadoCuotas + abonadoMant
  const saldo = saldoCuotas + saldoMant
  const hayMantenimiento = abonadoMant + saldoMant > 0

  titulo("Inversión")
  espacio(26)
  const altoCaja = 21
  doc.setFillColor(...FONDO)
  doc.roundedRect(MARGEN, y - 4, UTIL, altoCaja, 2, 2, "F")
  doc.setFillColor(...CORAL)
  doc.rect(MARGEN, y - 4, 1.4, altoCaja, "F")

  const bloque = (etiqueta: string, valor: string, x: number, destacado: boolean) => {
    sans(6.5)
    doc.setTextColor(...MEDIO)
    doc.text(etiqueta.toUpperCase(), x, y + 1, { charSpace: 0.3 })
    serif(destacado ? 17 : 13)
    doc.setTextColor(...OSCURO)
    doc.text(valor, x, y + 10.5)
  }
  const colInv = (UTIL - 8) / 3
  bloque("Monto total del tratamiento", montoARS(c.montoTotal), MARGEN + 7, true)
  bloque("Total abonado", abonado > 0 ? montoARS(abonado) : "$ 0", MARGEN + 7 + colInv + 6, false)
  bloque("Saldo pendiente", saldo > 0 ? montoARS(saldo) : "$ 0", MARGEN + 7 + colInv * 2 + 6, false)
  // Separadores finos entre los tres bloques.
  doc.setDrawColor(...CLARO)
  doc.setLineWidth(0.2)
  doc.line(MARGEN + 7 + colInv + 1, y - 0.5, MARGEN + 7 + colInv + 1, y + 11)
  doc.line(MARGEN + 7 + colInv * 2 + 1, y - 0.5, MARGEN + 7 + colInv * 2 + 1, y + 11)

  const detalle: string[] = []
  if (total > 0 && cantidad > 0) detalle.push(`${cantidad} ${cantidad === 1 ? "cuota" : "cuotas"} de ${montoARS(valorCuota)}`)
  if (c.duracionEstimada) detalle.push(`Duración estimada: ${c.duracionEstimada}`)
  sans(7.5)
  doc.setTextColor(...TEXTO)
  doc.text(detalle.join("   ·   "), MARGEN + 7, y + 15.5)
  y += altoCaja + 1
  if (hayMantenimiento) {
    sans(6.5)
    doc.setTextColor(...MEDIO)
    doc.text("Total abonado y saldo pendiente incluyen el mantenimiento mensual registrado.", MARGEN, y + 1)
    y += 3
  }
  y += 5

  // ---- Tablas -------------------------------------------------------------
  type Columna = { texto: string; x: number; align: "left" | "right" }
  const FILA = 5.8

  /** Reserva el título + la tabla entera (si es corta) para que el título no quede huérfano. */
  const tituloTabla = (texto: string, filas: number) => {
    espacio(14 + 7 + FILA * (filas <= 12 ? filas : 3))
    titulo(texto)
  }

  const tabla = (columnas: Columna[], filas: { celdas: string[]; hecho: boolean }[]) => {
    const cabecera = () => {
      doc.setFillColor(...OSCURO)
      doc.roundedRect(MARGEN, y - 4.2, UTIL, 6.6, 1.2, 1.2, "F")
      sans(6.5, true)
      doc.setTextColor(255, 255, 255)
      for (const col of columnas) {
        doc.text(col.texto.toUpperCase(), col.x, y + 0.1, { align: col.align, charSpace: 0.3 })
      }
      y += 6.6
    }
    cabecera()
    filas.forEach((fila, i) => {
      if (y + FILA > BASE_PIE) {
        nuevaPagina()
        cabecera()
      }
      if (i % 2 === 0) {
        doc.setFillColor(...FONDO)
        doc.rect(MARGEN, y - 4, UTIL, FILA, "F")
      }
      fila.celdas.forEach((texto, j) => {
        const esEstado = j === columnas.length - 1
        sans(8, fila.hecho && esEstado)
        if (esEstado) doc.setTextColor(...(fila.hecho ? OSCURO : MEDIO))
        else doc.setTextColor(...TEXTO)
        doc.text(texto, columnas[j].x, y, { align: columnas[j].align })
      })
      y += FILA
    })
    y += 2.5
  }

  if (total > 0 && cantidad > 0) {
    tituloTabla("Plan de pagos", cantidad)
    tabla(
      [
        { texto: "Cuota", x: MARGEN + 5, align: "left" },
        { texto: "Vencimiento", x: MARGEN + 30, align: "left" },
        { texto: "Medio de pago", x: MARGEN + 76, align: "left" },
        { texto: "Valor", x: MARGEN + 138, align: "right" },
        { texto: "Estado", x: ANCHO - MARGEN - 5, align: "right" },
      ],
      c.cuotas.map((q) => ({
        celdas: [
          `${q.mes} de ${cantidad}`,
          q.vencimiento ? fechaCorta(q.vencimiento) : "—",
          q.medio,
          montoARS(valorCuota),
          q.efectuado ? (q.fechaPago ? `Abonada ${fechaCorta(q.fechaPago)}` : "Abonada") : "Pendiente",
        ],
        hecho: q.efectuado,
      }))
    )
  }

  if (mantenimiento.length > 0) {
    tituloTabla("Mantenimiento mensual", mantenimiento.length)
    tabla(
      [
        { texto: "Fecha", x: MARGEN + 5, align: "left" },
        { texto: "Monto", x: MARGEN + 138, align: "right" },
        { texto: "Estado", x: ANCHO - MARGEN - 5, align: "right" },
      ],
      mantenimiento.map((m) => ({
        celdas: [fechaLarga(m.fecha), montoARS(m.monto), m.efectuado ? "Abonado" : "Pendiente"],
        hecho: m.efectuado,
      }))
    )
  }

  // ---- Condiciones de pago ------------------------------------------------
  if (c.condiciones.trim()) {
    titulo("Condiciones de pago")
    parrafo(c.condiciones)
  }

  pie()
  return doc
}

export async function descargarPresupuesto(p: Paciente, c: ContenidoPresupuesto): Promise<void> {
  const doc = await generarPresupuesto(p, c)
  doc.save(nombreArchivo(p))
}

/**
 * Imprime desde un iframe oculto en vez de abrir una pestaña nueva,
 * que el navegador suele bloquear.
 */
export async function imprimirPresupuesto(p: Paciente, c: ContenidoPresupuesto): Promise<void> {
  const doc = await generarPresupuesto(p, c)
  const url = URL.createObjectURL(doc.output("blob"))

  const marco = document.createElement("iframe")
  marco.style.position = "fixed"
  marco.style.right = "0"
  marco.style.bottom = "0"
  marco.style.width = "0"
  marco.style.height = "0"
  marco.style.border = "0"
  marco.src = url

  marco.onload = () => {
    marco.contentWindow?.focus()
    marco.contentWindow?.print()
    // Se limpia después de que el diálogo de impresión tomó el documento.
    window.setTimeout(() => {
      URL.revokeObjectURL(url)
      marco.remove()
    }, 60_000)
  }

  document.body.append(marco)
}

/** Mensaje prellenado para compartir por WhatsApp (no adjunta el PDF). */
export function mensajeWhatsApp(p: Paciente, c: ContenidoPresupuesto): string {
  return [
    `Hola ${p.nombre}, ¿cómo estás?`,
    "",
    "Te comparto el presupuesto de tu tratamiento:",
    `• Plan: ${c.plan || "a definir"}`,
    esArmonizacion(p.categoria) ? "" : `• Técnica: ${c.tecnica || "a definir"}`,
    `• Monto total: ${montoARS(c.montoTotal)}`,
    c.condiciones ? `• Condiciones: ${c.condiciones}` : "",
    "",
    "[Adjunto el PDF del presupuesto]",
    "",
    "Cualquier duda me escribís. ¡Saludos!",
    "Flor",
  ]
    .filter(Boolean)
    .join("\n")
}

export function enlaceWhatsApp(p: Paciente, c: ContenidoPresupuesto): string {
  return enlaceWhatsAppChat(p.telefono, mensajeWhatsApp(p, c))
}
