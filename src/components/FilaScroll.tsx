import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "cn"

/**
 * Fila que scrollea de costado cuando no entra (solapas, chips de filtro).
 *
 * El contenido se desvanece en el borde hacia donde queda algo por ver, así se
 * lee como deslizable y no como cortado. Si entra completa no hay degradado.
 * De paso se esconde la barra de scroll, que en estas filas molesta más de lo
 * que ayuda.
 */
export function FilaScroll({
  children,
  className,
  etiqueta,
}: {
  children: ReactNode
  className?: string
  etiqueta?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [bordes, setBordes] = useState({ izq: false, der: false })

  const medir = useCallback(() => {
    const el = ref.current
    if (!el) return
    const resto = el.scrollWidth - el.clientWidth - el.scrollLeft
    setBordes({ izq: el.scrollLeft > 4, der: resto > 4 })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    medir()
    el.addEventListener("scroll", medir, { passive: true })
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    for (const hijo of el.children) observador.observe(hijo)
    return () => {
      el.removeEventListener("scroll", medir)
      observador.disconnect()
    }
  }, [medir])

  const degradado =
    bordes.izq || bordes.der
      ? `linear-gradient(to right, ${
          bordes.izq ? "transparent 0, #000 2.5rem" : "#000 0"
        }, ${bordes.der ? "#000 calc(100% - 2.5rem), transparent 100%" : "#000 100%"})`
      : undefined

  return (
    <div
      ref={ref}
      role={etiqueta ? "group" : undefined}
      aria-label={etiqueta}
      style={degradado ? { maskImage: degradado, WebkitMaskImage: degradado } : undefined}
      className={cn(
        "overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {children}
    </div>
  )
}
