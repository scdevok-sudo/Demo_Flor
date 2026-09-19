import type { jsPDF } from "jspdf"

import { esArmonizacion, type Paciente } from "@/lib/tipos"
import { fechaLarga, formatoDNI, hoyISO, montoARS, nombreMes } from "@/lib/util"

/** Colores de marca en RGB, para jsPDF. */
const OSCURO: [number, number, number] = [67, 73, 82] // #434952
const MEDIO: [number, number, number] = [141, 156, 164] // #8D9CA4
const CLARO: [number, number, number] = [194, 197, 198] // #C2C5C6
const CORAL: [number, number, number] = [248, 143, 143] // #F88F8F
const CORAL_SUAVE: [number, number, number] = [253, 237, 237]

const ANCHO = 210
const ALTO = 297
const MARGEN = 18
const UTIL = ANCHO - MARGEN * 2

export function nombreArchivo(p: Paciente): string {
  const limpio = `${p.apellido}-${p.nombre}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
  return `presupuesto-${limpio}.pdf`
}

/**
 * jsPDF se carga recién cuando hace falta: así el panel no arrastra
 * la librería en la carga inicial.
 */
export async function generarPresupuesto(p: Paciente): Promise<jsPDF> {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  let y = 0

  // ---- Membrete -----------------------------------------------------------
  const dibujarMembrete = () => {
    doc.setFillColor(...OSCURO)
    doc.rect(0, 0, ANCHO, 36, "F")
    doc.setFillColor(...CORAL)
    doc.rect(0, 36, ANCHO, 1.6, "F")

    doc.setTextColor(...CORAL)
    doc.setFont("times", "bold")
    doc.setFontSize(32)
    doc.text("fi.", MARGEN, 24)

    doc.setTextColor(255, 255, 255)
    doc.setFont("times", "normal")
    doc.setFontSize(15)
    doc.text("Florencia Inveninato", MARGEN + 20, 19)

    doc.setTextColor(...CLARO)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text("Ortodoncia y ortopedia maxilar", MARGEN + 20, 24.5)
    doc.text("La Plata  ·  Tandil", MARGEN + 20, 29)

    y = 52
  }

  const pie = () => {
    doc.setDrawColor(...CLARO)
    doc.setLineWidth(0.2)
    doc.line(MARGEN, ALTO - 20, ANCHO - MARGEN, ALTO - 20)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...MEDIO)
    doc.text(
      "Presupuesto sin valor de factura. Válido por 30 días desde la fecha de emisión.",
      MARGEN,
      ALTO - 15
    )
    doc.text("Florencia Inveninato · Ortodoncia", ANCHO - MARGEN, ALTO - 15, { align: "right" })
  }

  const nuevaPagina = () => {
    pie()
    doc.addPage()
    doc.setFillColor(...OSCURO)
    doc.rect(0, 0, ANCHO, 12, "F")
    doc.setFillColor(...CORAL)
    doc.rect(0, 12, ANCHO, 1, "F")
    y = 28
  }

  const espacio = (alto: number) => {
    if (y + alto > ALTO - 26) nuevaPagina()
  }

  const titulo = (texto: string) => {
    espacio(16)
    doc.setFillColor(...CORAL)
    doc.rect(MARGEN, y - 3.4, 3, 3.4, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(...OSCURO)
    doc.text(texto.toUpperCase(), MARGEN + 5.5, y)
    y += 3
    doc.setDrawColor(...CLARO)
    doc.setLineWidth(0.2)
    doc.line(MARGEN, y, ANCHO - MARGEN, y)
    y += 6
  }

  const parrafo = (texto: string) => {
    const lineas = doc.splitTextToSize(texto || "—", UTIL) as string[]
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(50, 54, 60)
    for (const linea of lineas) {
      espacio(6)
      doc.text(linea, MARGEN, y)
      y += 5
    }
    y += 4
  }

  /** Fila de dato con etiqueta chica arriba y valor debajo. */
  const dato = (etiqueta: string, valor: string, x: number, ancho: number) => {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...MEDIO)
    doc.text(etiqueta.toUpperCase(), x, y)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(...OSCURO)
    const lineas = doc.splitTextToSize(valor || "—", ancho) as string[]
    doc.text(lineas[0], x, y + 5)
  }

  dibujarMembrete()

  // ---- Título del documento ----------------------------------------------
  doc.setFont("times", "bold")
  doc.setFontSize(21)
  doc.setTextColor(...OSCURO)
  doc.text("Presupuesto de tratamiento", MARGEN, y)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(...MEDIO)
  doc.text(fechaLarga(hoyISO()), ANCHO - MARGEN, y, { align: "right" })
  y += 12

  // ---- Datos del paciente -------------------------------------------------
  titulo("Paciente")
  const col = UTIL / 3
  dato("Nombre y apellido", `${p.nombre} ${p.apellido}`, MARGEN, col - 4)
  dato("DNI", formatoDNI(p.dni), MARGEN + col, col - 4)
  dato("Edad", p.edad ? `${p.edad} años` : "—", MARGEN + col * 2, col - 4)
  y += 13
  dato("Tratamiento", p.categoria, MARGEN, col - 4)
  dato("Sede", p.sede, MARGEN + col, col - 4)
  dato(
    "Cobertura",
    esArmonizacion(p.categoria) ? "Particular" : p.obraSocial || "Particular",
    MARGEN + col * 2,
    col - 4
  )
  y += 15

  // ---- Clínica ------------------------------------------------------------
  titulo("Diagnóstico")
  parrafo(p.diagnostico)

  titulo("Plan de tratamiento")
  parrafo(p.plan)

  // Armonización facial no usa técnica de aparatología.
  if (!esArmonizacion(p.categoria)) {
    titulo("Técnica a utilizar")
    parrafo(p.tecnica)
  }

  // ---- Monto --------------------------------------------------------------
  espacio(34)
  doc.setFillColor(...CORAL_SUAVE)
  doc.setDrawColor(...CORAL)
  doc.setLineWidth(0.4)
  doc.roundedRect(MARGEN, y, UTIL, 24, 2.5, 2.5, "FD")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(...OSCURO)
  doc.text("MONTO TOTAL DEL TRATAMIENTO", MARGEN + 8, y + 9)
  doc.setFont("times", "bold")
  doc.setFontSize(22)
  doc.text(montoARS(p.montoTotal), MARGEN + 8, y + 18.5)

  const total = Number(p.montoTotal) || 0
  const pagas = p.cuotas.filter((c) => c.efectuado).length
  if (pagas > 0) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...OSCURO)
    doc.text(`${pagas} de 12 cuotas abonadas`, ANCHO - MARGEN - 8, y + 16, { align: "right" })
  }
  y += 34

  // ---- Condiciones --------------------------------------------------------
  titulo("Condiciones")
  parrafo(p.condiciones)

  // ---- Plan de pagos ------------------------------------------------------
  // Tres columnas de 4 para que las 12 cuotas entren en una sola página.
  if (total > 0) {
    const filas = 4
    const anchoCol = UTIL / 3
    // Se reserva el bloque entero antes del título, para que no quede huérfano.
    espacio(16 + filas * 5.4 + 4)
    titulo("Plan de pagos")
    const base = y

    p.cuotas.forEach((cuota, i) => {
      const x = MARGEN + Math.floor(i / filas) * anchoCol
      const yCuota = base + (i % filas) * 5.4

      doc.setFont("helvetica", cuota.efectuado ? "bold" : "normal")
      doc.setFontSize(8)
      if (cuota.efectuado) doc.setTextColor(50, 54, 60)
      else doc.setTextColor(...MEDIO)
      doc.text(
        `${cuota.mes}. ${nombreMes(cuota.mes)} · ${cuota.medio} · ${
          cuota.efectuado ? "abonada" : "pendiente"
        }`,
        x,
        yCuota
      )
    })

    y = base + filas * 5.4 + 4
  }

  pie()
  return doc
}

export async function descargarPresupuesto(p: Paciente): Promise<void> {
  const doc = await generarPresupuesto(p)
  doc.save(nombreArchivo(p))
}

/**
 * Imprime desde un iframe oculto en vez de abrir una pestaña nueva,
 * que el navegador suele bloquear.
 */
export async function imprimirPresupuesto(p: Paciente): Promise<void> {
  const doc = await generarPresupuesto(p)
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
export function mensajeWhatsApp(p: Paciente): string {
  return [
    `Hola ${p.nombre}, ¿cómo estás?`,
    "",
    "Te comparto el presupuesto de tu tratamiento:",
    `• Plan: ${p.plan || "a definir"}`,
    esArmonizacion(p.categoria) ? "" : `• Técnica: ${p.tecnica || "a definir"}`,
    `• Monto total: ${montoARS(p.montoTotal)}`,
    p.condiciones ? `• Condiciones: ${p.condiciones}` : "",
    "",
    "[Adjunto el PDF del presupuesto]",
    "",
    "Cualquier duda me escribís. ¡Saludos!",
    "Flor",
  ]
    .filter(Boolean)
    .join("\n")
}

export function enlaceWhatsApp(p: Paciente): string {
  return `https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp(p))}`
}
