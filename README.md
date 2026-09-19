# Fichero virtual — Florencia Inveninato (demo)

Demo de presentación del sistema de fichas de pacientes. **No es el sistema
productivo**: sirve para mostrar el flujo completo y la estética, y acordar el
alcance antes de cotizar y arrancar el desarrollo real.

## Cómo levantarlo

```bash
npm install
npm run dev
```

Abre en `http://localhost:5173`. El login no valida nada: tocá **Ingresar** y
entrás directo al fichero.

## Qué es real y qué no

| | |
|---|---|
| Estado | En memoria de React. Al recargar la página vuelve a los datos de ejemplo. |
| Backend | No hay. Ni base de datos, ni API, ni auth. |
| Login | Formulario de adorno, no valida credenciales. |
| Fotos y estudios | No hay carga real de archivos: "Subir foto" asigna una imagen de relleno de picsum.photos. |
| PDF del presupuesto | **Real.** Se genera del lado del cliente con jsPDF, con el membrete de marca. |
| Imprimir | **Real.** Manda el PDF generado a la impresora desde un iframe oculto. |
| WhatsApp | Abre `wa.me` con el mensaje prellenado. El PDF se adjunta a mano. |
| Firma digital | Descartada para esta versión. |

Los seis pacientes son inventados. No hay datos de pacientes reales en ningún lado.

## Rutas

- `/login` — ingreso dummy
- `/pacientes` — listado, con buscador por DNI o apellido y filtros por sede y categoría
- `/pacientes/nuevo` — alta
- `/pacientes/:id` — ficha con las seis solapas

## Categorías de paciente

Cuatro: **Ortopedia**, **Ortodoncia**, **Alineadores** y **Armonización facial**.
Se elige en el alta y se puede cambiar después desde la solapa Datos; el filtro
del listado se combina con el buscador.

Las cuatro usan las mismas seis solapas. Lo que cambia es el contenido de
algunas: armonización facial tiene una ficha más corta y su propia galería.

| | Ortopedia / Ortodoncia / Alineadores | Armonización facial |
|---|---|---|
| Datos | ficha completa | corta: nombre, apellido, DNI, edad, sede, derivado por, particularidades, activo |
| Fotos | serie de 10 + intra + final | **Antes / Después**: 6 slots (3 + 3: frente, perfil derecho, perfil izquierdo), sin intra |
| Estudios | — | igual |
| Diagnóstico | diagnóstico, plan y técnica | versión corta, sin técnica |
| Presupuesto | — | el mismo módulo, sin la fila de técnica |
| Seguimiento | — | igual |

## Los seis módulos

1. **Datos** — filiatorios, anamnesis, particularidades. La edad se calcula sola
   desde la fecha de nacimiento.
2. **Fotos** — serie inicial de 10 slots fijos (4 de cara + 6 de boca),
   intra-tratamiento con fecha (hasta 15) y serie final, con un toggle para
   comparar antes/después.
3. **Estudios** — radiografías y estudios complementarios, hasta 4 cada uno,
   con selector Inicial / Intermedio / Final.
4. **Diagnóstico** — diagnóstico, plan y técnica. Se copian solos al presupuesto.
5. **Presupuesto** — vista previa con membrete, monto y condiciones editables,
   generación de PDF, envío por WhatsApp, impresión y control de 12 cuotas.
6. **Seguimiento** — timeline cronológico, lo más nuevo arriba.

## Responsive

Pensado mobile-first y probado a 375px de ancho: el listado pasa de tabla a
cards y el control de 12 cuotas a filas de un renglón (las cobradas teñidas de
coral, para leerlas de un vistazo). Las solapas de la ficha y los chips de
filtro scrollean dentro de su caja — no se cortan contra el borde de la
pantalla — y el contenido se desvanece del lado que queda por ver
(`components/FilaScroll.tsx`). Las grillas de fotos van de 2 a 3 columnas, y de
a una por renglón al comparar antes/después. Los botones de borrar quedan
siempre visibles: sin hover no hay forma de llegar a ellos en una pantalla
táctil.

## Identidad visual

Provista por la clienta:

- Isotipo `fi.` — el punto siempre en coral
- `#434952` gris oscuro azulado (dominante) · `#8D9CA4` medio ·
  `#C2C5C6` claro · `#F88F8F` coral (acento y CTAs)
- Playfair Display para títulos (stand-in de Monterchi Serif, que no está en
  Google Fonts) + Montserrat para el resto

Los tokens viven en `src/index.css`; los colores del PDF, en `src/lib/pdf.ts`.

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · shadcn/ui (sobre Base UI) ·
React Router · lucide-react · jsPDF (carga diferida, sólo al generar el PDF).

## Dónde tocar cada cosa

```
src/
  lib/
    tipos.ts    modelo de datos y constantes (slots de fotos, sedes, cuotas)
    datos.ts    los seis pacientes de ejemplo
    store.tsx   estado en memoria (context + useReducer)
    pdf.ts      armado del PDF, impresión y mensaje de WhatsApp
    util.ts     fechas, montos, DNI
  components/   layout, marca y campos de formulario compartidos
  pages/
    modulos/    un archivo por módulo de la ficha
```
