import { useEffect, useRef, useState } from "react"

/**
 * Visor de mallas 3D (STL/PLY) con rotación, zoom y desplazamiento.
 * Three.js se carga recién al abrir el visor, para no sumarlo al bundle inicial.
 */
export function Visor3D({ url, extension }: { url: string; extension: string }) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando")

  useEffect(() => {
    const el = contenedor.current
    if (!el) return
    let cancelado = false
    let limpiar: (() => void) | undefined

    async function iniciar(el: HTMLDivElement) {
      const THREE = await import("three")
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js")
      const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js")
      const { PLYLoader } = await import("three/examples/jsm/loaders/PLYLoader.js")

      const respuesta = await fetch(url)
      if (!respuesta.ok) throw new Error("descarga")
      const buffer = await respuesta.arrayBuffer()
      if (cancelado) return

      const geometria = extension === "ply" ? new PLYLoader().parse(buffer) : new STLLoader().parse(buffer)
      geometria.computeVertexNormals()
      geometria.center()
      geometria.computeBoundingSphere()
      const radio = geometria.boundingSphere?.radius || 1

      const conColor = geometria.hasAttribute("color")
      const material = new THREE.MeshStandardMaterial({
        color: conColor ? 0xffffff : 0xdcdfe0,
        vertexColors: conColor,
        roughness: 0.55,
        metalness: 0.05,
        side: THREE.DoubleSide,
      })
      const malla = new THREE.Mesh(geometria, material)

      const escena = new THREE.Scene()
      escena.background = new THREE.Color(0x434952)
      escena.add(malla)
      escena.add(new THREE.HemisphereLight(0xffffff, 0x434952, 1.6))
      const luz = new THREE.DirectionalLight(0xffffff, 2)
      escena.add(luz)

      const camara = new THREE.PerspectiveCamera(40, 1, radio / 100, radio * 100)
      camara.position.set(0, 0, radio * 3.2)

      const render = new THREE.WebGLRenderer({ antialias: true })
      render.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      el.append(render.domElement)
      render.domElement.style.display = "block"
      render.domElement.style.touchAction = "none"

      const controles = new OrbitControls(camara, render.domElement)
      controles.enableDamping = true
      controles.minDistance = radio * 0.5
      controles.maxDistance = radio * 10

      const ajustar = () => {
        const w = el.clientWidth
        const h = el.clientHeight
        render.setSize(w, h)
        camara.aspect = w / Math.max(h, 1)
        camara.updateProjectionMatrix()
      }
      ajustar()
      const observador = new ResizeObserver(ajustar)
      observador.observe(el)

      let cuadro = 0
      const animar = () => {
        controles.update()
        luz.position.copy(camara.position)
        render.render(escena, camara)
        cuadro = requestAnimationFrame(animar)
      }
      animar()
      setEstado("listo")

      limpiar = () => {
        cancelAnimationFrame(cuadro)
        observador.disconnect()
        controles.dispose()
        geometria.dispose()
        material.dispose()
        render.dispose()
        render.domElement.remove()
      }
    }

    iniciar(el).catch(() => {
      if (!cancelado) setEstado("error")
    })

    return () => {
      cancelado = true
      limpiar?.()
    }
  }, [url, extension])

  return (
    <div className="relative h-[60vh] min-h-72 w-full overflow-hidden rounded-xl bg-brand-dark">
      <div ref={contenedor} className="size-full" />
      {estado !== "listo" ? (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white/80">
          {estado === "cargando"
            ? "Cargando modelo 3D…"
            : "No se pudo mostrar el modelo. Probá descargarlo con el botón de abrir."}
        </p>
      ) : (
        <p className="pointer-events-none absolute bottom-2 left-3 text-xs text-white/60">
          Arrastrá para rotar · rueda o pellizco para acercar
        </p>
      )}
    </div>
  )
}
