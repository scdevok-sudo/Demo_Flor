# Especificación de requerimientos — Fichero Virtual (sistema real)

## Cliente: Florencia Inveninato — Ortodoncia y ortopedia maxilar (La Plata · Tandil)

> Documento de trabajo interno de SCdev. Se arma **a partir del código de la demo** (`florencia-demo`, estado
> al 07/10/2026, con cambios todavía sin commitear), no a partir de los briefs. Reemplaza como fuente de verdad
> del alcance a `lead-florencia-ortodoncia.md`, que se redactó antes de la demo.
> Formato de `SKILL-especificacion-requerimientos.md`, con la estructura de la especificación de
> Capacitaciones del SGI de Nexoris como referencia.

**Fecha de redacción:** 07/10/2026
**Fuente:** código de `src/` (tipos, store, páginas, componentes, datos de prueba) y `README.md` de la demo.

> **Nota sobre las fuentes.** Al momento de escribir esto, en el disco solo existen
> `brief-demo-florencia-update-2-agenda.md` y el `README.md` de la demo. **No encontré**
> `brief-demo-florencia-claude-code.md`, `update-1`, `update-3`, `update-4-presupuesto.md`,
> `lead-florencia-ortodoncia.md`, `SKILL-especificacion-requerimientos.md` ni `plantilla-requerimiento.md`.
> Por eso la comparación contra briefs de la sección «Resumen de discrepancias» se hizo contra el update 2 y
> el README; para los módulos de los updates 1, 3 y 4 está marcado qué falta verificar.

---

# Resumen de discrepancias (demo real vs. briefs)

## A. Pedido y no implementado

| # | Qué pedía | Estado en el código |
|---|---|---|
| A1 | Update 2, punto 4: configurar **duración del turno** (15/20/30/45/60) como parte de la configuración de agenda. | No existe como configuración global. La duración se elige **turno por turno** al asignarlo (`ModalTurno.tsx`). `DURACIONES` sigue siendo la lista 15/20/30/45/60 (`tipos.ts`). |
| A2 | Update 2, punto 4: días de atención como checkboxes Lun–Dom en una sola configuración. | Reemplazado por bloques horarios por sede (ver B1). Los días se eligen con botones de alternancia dentro de cada bloque de La Plata. Tandil no tiene días de la semana, solo fechas puntuales. |
| A3 | Update 2, punto 2: «Cancelado: tachado o itálica» + «No asistió: opcional». | Implementado (los dos). Sin diferencia. |
| A4 | Updates 1, 3 y 4 y brief original. | **No verificable**: los archivos no están. Revisar a mano contra la lista de B antes de cotizar. |

No encontré nada pedido en el update 2 que falte, salvo A1/A2, que son cambios de diseño y no omisiones.

## B. Implementado pero no pedido (decisiones tomadas durante el desarrollo)

| # | Qué hace | Dónde | Por qué se agregó |
|---|---|---|---|
| B1 | **Horarios por sede, en bloques que conviven.** La Plata: bloques semanales (demo: lun/mié/jue 14–20 «Turnos generales», lun 11–13 y jue 12–13 «Turnos especiales»). Tandil: solo **fechas puntuales** (demo: 2 días «Visita a Tandil», 14–19). Cada bloque lleva una etiqueta libre. | `tipos.ts` (`BloqueHorario`), `ModalConfigAgenda.tsx`, `agenda.ts` | Resuelve el «pendiente de confirmar con la clienta» del brief: el horario NO es igual en ambas sedes. |
| B2 | **Turnos de duración variable** (15/20/30/45/60) y grilla como línea de tiempo continua (2 px por minuto). Los huecos se clickean de a 15 min. | `Agenda.tsx`, `ModalTurno.tsx`, `agenda.ts` (`PASO_MIN = 15`) | Consecuencia de A1: Florencia mezcla turnos de distinta duración en el mismo día. |
| B3 | **Validación de superposición**: no deja asignar un turno que pise a otro o que exceda el cierre del bloque, y bloquea guardar bloques de la misma sede que se superponen. | `agenda.ts` (`espacioLibre`, `bloquesSuperpuestos`) | El brief dejaba la validación de conflictos fuera de alcance; con duraciones variables era necesaria para que la grilla no se rompa. |
| B4 | **Reactivar** un turno cancelado/no asistió y **Liberar horario** (borra el turno). | `ModalTurno.tsx` | Sin esto un turno cancelado ocupaba el horario para siempre. Un turno cancelado o «no asistió» **sigue ocupando el lugar** hasta que se libera. |
| B5 | **Editar turno**: cambiar horario, duración y paciente. | `ModalTurno.tsx` | El brief pedía editar «paciente u horario»; sumé duración. |
| B6 | **Botón «Enviar por WhatsApp» en el turno**: abre `wa.me` con mensaje de confirmación prellenado. No automatiza nada. | `agenda.ts` (`enlaceWhatsAppTurno`) | Atajo de confirmación manual. Roza el no-goal «recordatorios por WhatsApp», pero es envío manual. |
| B7 | **Módulo Trámites pendientes** (`/tramites`): dos listas (obra social, facturación), alta desde la ficha, «Resuelto / Deshacer». | `Tramites.tsx`, `ModalTramites.tsx` | Módulo 8 del encargo. |
| B8 | **Campo «Mail»** en la ficha (todas las categorías). Solo se muestra en la lista de trámites. | `FormDatosPaciente.tsx` | Para vincular al paciente con los trámites. No se usa para enviar nada. |
| B9 | **Videos** (placeholder) en fotos iniciales, intra-tratamiento y finales. | `Fotos.tsx` | No verificable contra briefs. El video es solo una imagen con ícono de play, no se reproduce. |
| B10 | **Mantenimiento mensual**, **duración estimada**, **valor de contención**, **fecha y valor de alta** dentro de Presupuesto. | `Presupuesto.tsx` | No verificable (update 4). |
| B11 | **Comparar iniciales vs. finales** con un switch, y comparación antes/después en armonización. | `Fotos.tsx`, `AntesDespues.tsx` | Mencionado en el README; no verificable contra el brief. |
| B12 | **Filtros de listado** por sede y por categoría combinados con el buscador (DNI si se tipean números, apellido si no). | `Pacientes.tsx`, `buscar.ts` | No verificable. |
| B13 | **Impresión directa** del presupuesto (iframe oculto → impresora), además del PDF. | `pdf.ts` | No verificable. |

## C. Pendiente / ambiguo en el código

- **No hay ningún comentario tipo «pendiente de confirmar con la clienta» en el código.** Busqué `pendiente de`,
  `confirmar`, `TODO`, `FIXME`, `a definir` y `clienta` en todo `src/`. El comentario que el brief original
  mencionaba para sede en `Agenda.tsx` ya no existe: quedó reemplazado por una afirmación como hecho
  consumado (`Agenda.tsx:17-20`, «Cada sede tiene su propio horario: La Plata atiende todas las semanas… y
  Tandil sólo los días puntuales que ella carga»). **Eso hay que confirmarlo con Florencia igual**: pasó de «pendiente» a
  «decidido en el código» sin que figure una confirmación.
- `pdf.ts:278-279`: el mensaje de WhatsApp usa el texto literal «a definir» cuando faltan plan o técnica.
- `pdf.ts:70`: «Válido por 30 días desde la fecha de emisión» está **escrito a fuego**; no hay una fecha de vencimiento ni un campo editable.
- `Presupuesto.tsx` (descripción de Mantenimiento): dice «Desde el mes 6, una vez terminadas las cuotas iniciales», pero **no se valida ni se bloquea nada** según el mes.

## D. Discrepancias entre el código y la documentación de la demo (README)

| README dice | Código dice |
|---|---|
| Control de **12 cuotas** | `MAX_CUOTAS = 8`, a pagar en `PLAZO_CUOTAS_MESES = 6` (`tipos.ts`) |
| Intra-tratamiento «**hasta 15**» | `MAX_FOTOS_INTRA = 20`, y ese tope cuenta fotos **y videos** juntos |
| Estudios «**hasta 4 cada uno**» | `MAX_RADIOGRAFIAS = 6`, `MAX_ESTUDIOS = 4` |
| «Seis solapas» / «seis módulos» | **Siete solapas** (se suma «Próximos turnos») y dos módulos fuera de la ficha (Agenda, Trámites) |
| Rutas: `/login`, `/pacientes`, `/pacientes/nuevo`, `/pacientes/:id` | Además `/agenda` y `/tramites` |
| «Firma digital: descartada» | Consistente: no hay firma en el código |

> Para el sistema real valen los valores del código **solo como punto de partida**: hay que confirmar con la clienta cada tope (cuotas, fotos, radiografías).

---

# Contexto

Florencia Inveninato es ortodoncista y atiende en dos sedes: **La Plata** (semanal) y **Tandil** (algunos días
puntuales al mes). Trabaja cuatro categorías de tratamiento: **Ortopedia, Ortodoncia, Alineadores y Armonización facial**.

Hoy no tiene un fichero digital unificado. La demo ("Fichero Virtual") mostró el flujo completo y la estética, y sirvió
para acordar el alcance antes de cotizar. La demo es 100 % en memoria de React: no hay backend, no hay carga real de archivos y
el login es de adorno. Los seis pacientes son inventados.

El sistema real digitaliza:

1. La ficha del paciente (filiatorios, fotos y videos clínicos, estudios, diagnóstico y plan).
2. El presupuesto en PDF, su envío por WhatsApp y el control de cuotas y del mantenimiento mensual.
3. El seguimiento de evolución por sesión.
4. La agenda de turnos de las dos sedes.
5. Las listas de trámites pendientes (obra social y facturación).

La agenda es de **uso interno de Florencia**. No hay reserva online ni acceso del paciente.

# Actores/roles

| Actor | Qué hace | Estado |
|---|---|---|
| **Florencia (profesional)** | Único usuario de la demo. Carga y modifica todo. | Confirmado por el código. |
| **Paciente** | No accede al sistema. Recibe presupuestos y confirmaciones por WhatsApp (manual). | Confirmado. |
| **Asistente / secretaria** | No existe en la demo. | **Pregunta pendiente:** ¿alguien más va a cargar turnos, cobros o trámites? Si sí, hay que definir roles y qué ve cada uno (por ejemplo, ¿ve los montos?). |

# Componentes de la aplicación

Propuesta concreta, sobre la que Santi decide. Se mantiene el frontend de la demo y se le agrega un backend.

| Componente | Propuesta | Alternativa / nota |
|---|---|---|
| **Frontend** | Reusar la demo: Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui + React Router. Responsive mobile-first (probado a 375 px). | Sin cambios. |
| **Backend + base de datos** | **Supabase** (Postgres + Auth + Storage + políticas de acceso por fila). Cubre auth, base y archivos en un solo proveedor y evita escribir una API propia para un CRUD. | Alternativa: API Node propia + Postgres. Más control y más trabajo; solo se justifica si hay lógica de negocio que no entra en Postgres. |
| **Storage de fotos y estudios** | Bucket privado con URLs firmadas de corta duración. Miniaturas generadas al subir. | Ver «Decisiones pendientes: archivos». |
| **Storage de videos** | **No** mezclar con las fotos: pesan mucho más. Propuesta inicial: mismo storage con tope de tamaño; si el volumen crece, proveedor de video (transcodificación + streaming). | **Confirmar proveedor y costo antes de cotizar.** |
| **PDF del presupuesto** | Mantener jsPDF en el cliente (ya funciona, con membrete). Guardar en storage cada PDF emitido, para tener historial de lo enviado. | Generación en servidor solo si hace falta consistencia entre dispositivos. |
| **WhatsApp** | Fase 1: flujo manual `wa.me` + adjuntar el PDF a mano (como la demo). | Fase 2 opcional: API de negocio tipo WATI. Ver decisiones pendientes. |
| **Auth** | Email + contraseña (Supabase Auth). Sesión persistente. | Ver módulo 0. |
| **Hosting** | Vercel para el frontend (como la demo). | — |

**Entidades de datos reales** (hoy son `useState`/mock; relaciones propuestas):

```
usuario (1) ──< (N) paciente
paciente (1) ──< (N) foto_slot            slot + momento (inicial|final|antes|despues), url
paciente (1) ──< (N) foto_control         fecha, nota, es_video, url   (intra-tratamiento)
paciente (1) ──< (N) video                momento (inicial|final), fecha, nota, url
paciente (1) ──< (N) archivo_estudio      tipo (radiografia|estudio), momento (inicial|intermedio|final), formato, url
paciente (1) ──1 (1) plan_tratamiento     diagnostico, plan, tecnica
paciente (1) ──1 (1) presupuesto          monto_total, condiciones, duracion_estimada, valor_contencion, valor_alta, fecha_alta
presupuesto (1) ──< (N) cuota             numero, medio_pago, efectuado
presupuesto (1) ──< (N) registro_mantenimiento   fecha, monto, efectuado
paciente (1) ──< (N) entrada_seguimiento  fecha, texto
paciente (1) ──< (N) turno                sede, fecha, hora, duracion, estado
bloque_horario                            sede, dias[] | fecha, desde, hasta, etiqueta
paciente (1) ──< (N) tramite              tipo (obra_social|facturacion), agregado, resuelto
```

**Pregunta abierta:** `presupuesto` ¿es uno por paciente (como en la demo) o puede haber varios (re-presupuestos, segunda fase)?
La demo asume **uno por paciente**. `plan_tratamiento` hoy vive dentro del paciente; separarlo es opcional.

---

# Requerimientos por módulo

## 0. Acceso y sesión (transversal)

### Descripción
La demo tiene un formulario de login que **no valida nada** (`Login.tsx`): usuario y contraseña vienen precargados
(`flor@consultorio.com` / `demo1234`) y «Ingresar» navega a `/pacientes`. «Salir» navega a `/login` sin cerrar nada.
No hay rutas protegidas. El nombre «Dra. F. Inveninato» del menú está escrito a fuego.

### Requerimientos funcionales
- El sistema deberá autenticar al usuario con email y contraseña y denegar el acceso a cualquier ruta que no sea `/login` sin sesión válida.
- El sistema deberá cerrar la sesión de verdad al presionar «Salir».
- El sistema deberá mostrar en el menú el nombre del usuario autenticado, no un texto fijo.
- El sistema deberá permitir recuperar la contraseña.

### Notas
- **Pregunta pendiente:** ¿un solo usuario o más? (ver Actores/roles).
- **Pregunta pendiente:** ¿recuperación de contraseña por mail? ¿doble factor? Son datos de salud.
- Los datos de pacientes son sensibles. **Pregunta pendiente (a validar con un asesor legal, no resuelta acá):** requisitos de resguardo, retención y consentimiento aplicables a historias clínicas y a imágenes de pacientes en Argentina.

### Permisos
Hoy: un único rol con acceso total. Sin definir si hay más.

---

## 1. Ficha de paciente

### Descripción
Alta, listado, búsqueda y datos filiatorios del paciente. La ficha es la pantalla central: tiene 7 solapas (Datos, Fotos, Estudios, Diagnóstico, Presupuesto, Seguimiento, Próximos turnos). La **categoría** del paciente cambia el contenido de algunas solapas.

### Requerimientos funcionales

**Listado (`/pacientes`)**
- El sistema deberá listar los pacientes ordenados por apellido, con apellido y nombre, edad, DNI (con formato), categoría, sede y estado Activo/Inactivo.
- El sistema deberá mostrar el total de fichas y la cantidad «en tratamiento» (activos).
- El sistema deberá buscar con un único campo: si el texto son dígitos (2 o más) busca por DNI (coincidencia parcial); si no, por apellido o nombre, sin distinguir mayúsculas ni tildes.
- El sistema deberá filtrar por sede (Todas / La Plata / Tandil) y por categoría (Todas + las 4), combinables con el buscador.
- El sistema deberá mostrar el listado como tabla en escritorio y como tarjetas en mobile.

**Alta (`/pacientes/nuevo`)**
- El sistema deberá permitir crear la ficha con **solo nombre y apellido**; todo lo demás es opcional. El botón «Crear ficha» permanece deshabilitado hasta que ambos estén completos.
- Tras crear, el sistema deberá abrir la ficha nueva.

**Datos — categorías Ortopedia, Ortodoncia y Alineadores (ficha completa)**
- Nombre, apellido, mail, DNI, fecha de nacimiento, edad, ocupación, categoría, sede, derivado por.
- Obra social («Particular» si no tiene cobertura) y N.º de afiliado.
- Anamnesis (texto libre) y «Particularidades / dato de color» (texto libre).
- Interruptor «Paciente activo».
- El sistema deberá calcular la edad desde la fecha de nacimiento y permitir corregirla a mano. La edad hoy se guarda como texto; en el sistema real deberá derivarse de la fecha cuando esta exista.

**Datos — categoría Armonización facial (ficha corta)**
- Nombre, apellido, mail, DNI, edad (manual), categoría, sede, derivado por, particularidades/notas, activo.
- **No** incluye ocupación, fecha de nacimiento, anamnesis ni obra social.

**Cabecera de la ficha**
- El sistema deberá mostrar iniciales, nombre completo, DNI, edad, sede, categoría y estado.
- El sistema deberá incluir el botón «Agregar a trámites pendientes» (módulo 8).
- El sistema deberá mostrar «No encontramos esa ficha» si el id no existe.

### Notas
- La demo guarda cada cambio **al instante** (sin botón Guardar) en la ficha existente. En el sistema real hay que decidir: autoguardado con indicador de estado, o botón explícito. **Pregunta pendiente.**
- **No existe borrar ni archivar un paciente.** Solo «Inactivo». Aun así, Agenda y Trámites contemplan un «Paciente eliminado». **Pregunta pendiente:** ¿se podrán borrar pacientes? ¿baja lógica?
- **No hay validación de DNI** (formato, longitud, unicidad). La demo acepta DNI vacío o repetido. **Pregunta pendiente:** ¿DNI único? ¿extranjeros sin DNI?
- Al **cambiar la categoría** de un paciente, los datos del formulario que dejan de mostrarse (p. ej. anamnesis en un paciente que pasa a Armonización) **se conservan ocultos**. Definir si se conservan o se limpian.
- **Armonización facial — preguntas abiertas** (no resolver acá): la ficha corta, el diagnóstico corto sin técnica, la galería antes/después de 6 slots y «Cobertura: Particular» forzada son decisiones de la demo; confirmar cada una con la clienta (ver `lead-florencia-ortodoncia.md`, «Armonización facial en la demo»).
- El mail se usa solo para vincular al paciente en Trámites. **Pregunta pendiente:** ¿se usará para enviar algo?
- Datos de prueba: 6 pacientes ficticios (`pac-1` a `pac-6`): Fernández Bautista (Ortopedia, La Plata), Domínguez Carla (Ortodoncia, Tandil), Alsogaray Martín (Ortodoncia, La Plata), Fernández Julieta (Ortopedia, Tandil), Peralta Rocío (Alineadores, La Plata), Quiroga Malena (Armonización facial, La Plata). Los montos, fechas y notas son inventados y **no son reglas de negocio**.

### Permisos
Florencia: crear, ver, editar. Borrado: sin definir.

---

## 2. Fotografías clínicas

### Descripción
Dos variantes según la categoría.

**Ortopedia / Ortodoncia / Alineadores** — tres secciones:
1. **Iniciales:** serie fija de **10 slots**: 4 de cara (perfil izquierdo, perfil derecho, ¾ perfil sonrisa, frente sonriendo) y 6 de boca (frente, lateral derecha, lateral izquierda, oclusal superior, oclusal inferior, overjet inferior).
2. **Intra-tratamiento:** fotos y videos con **fecha** y **nota** por ítem.
3. **Finales:** la misma serie de 10, con un switch «Comparar con las iniciales» que muestra par antes/después.

Iniciales y finales tienen además una sección de **Videos**.

**Armonización facial** — «Antes / Después»: 6 slots (frente, perfil derecho, perfil izquierdo × antes y después), con switch «Ver comparación». Sin intra-tratamiento ni videos.

### Requerimientos funcionales
- El sistema deberá permitir cargar, reemplazar y quitar la foto de cada slot, y mostrar «N de 10 cargadas».
- El sistema deberá permitir agregar fotos y videos de control con fecha (hoy por defecto) y una nota editable, hasta un máximo (demo: **20 en total** entre fotos y videos); al llegar al máximo deberá deshabilitar los botones y avisar.
- El sistema deberá permitir subir y quitar videos en las secciones iniciales y finales, sin tope en la demo.
- El sistema deberá mostrar la comparación antes/después slot por slot.
- El sistema deberá mantener visible el botón de quitar en pantallas táctiles (sin depender de hover).
- Todas las acciones de quitar deberán pedir confirmación en el sistema real (la demo borra sin confirmar).

### Notas
- **Simplificación de la demo:** «Subir foto» no abre ningún selector de archivos: asigna una imagen aleatoria de `picsum.photos`. Los videos son una imagen con ícono de play y **no se reproducen**. No hay carga real.
- **Decisiones pendientes para el sistema real:**
  - ¿Dónde se almacenan fotos y videos (ver Componentes)? Los **videos pesan mucho más** que las fotos: confirmar el proveedor de storage y su costo antes de cotizar.
  - Tamaño máximo por foto y por video, y formatos aceptados (JPG/PNG/HEIC para fotos desde celular; MP4/MOV para video). HEIC requiere conversión.
  - ¿Se comprimen/redimensionan al subir? ¿Se conserva el original?
  - ¿Se puede **reemplazar** una foto o hay que quitar y subir de nuevo? ¿Se conserva historial de reemplazos?
  - ¿El tope de 20 de intra-tratamiento es real o solo de la demo? ¿Los videos intra cuentan en el mismo tope? ¿Y la cantidad de videos iniciales/finales?
  - ¿Subida directa desde la cámara del celular? Florencia va a cargar desde el teléfono.
  - ¿Quién puede ver las fotos? ¿Se pueden descargar o compartir?
- Las notas de las fotos de control se guardan al tipear; sin validación.
- Datos de prueba: series cargadas completas o parciales para `pac-1`, `pac-3`, `pac-5`; fotos de control de `pac-3` (6) y `pac-5` (1), con notas clínicas inventadas.

### Permisos
Florencia: ver, subir, quitar, editar nota.

---

## 3. Estudios y radiografías

### Descripción
Dos bloques por paciente (igual en todas las categorías, incluida Armonización facial):
- **Radiografías** (imágenes): panorámicas, teleperfiles, periapicales. Demo: hasta **6**.
- **Estudios complementarios** (PDF): cefalometrías, periodontogramas, interconsultas. Demo: hasta **4**.

Cada archivo tiene nombre, formato (imagen/PDF) y un selector de **momento**: Inicial / Intermedio / Final.

### Requerimientos funcionales
- El sistema deberá permitir agregar archivos hasta el máximo de cada bloque, deshabilitando «Agregar» al llegar.
- El sistema deberá permitir cambiar el momento (Inicial/Intermedio/Final) de cada archivo.
- El sistema deberá permitir quitar archivos.
- El sistema deberá mostrar una miniatura para las imágenes y un ícono para los PDF, con el contador «N de M archivos».

### Notas
- **Simplificación de la demo:** «Agregar» crea un registro con nombre inventado (`radiografia-AAAA-MM-DD.jpg`) y una imagen de relleno. **No se sube ni se abre ningún archivo.**
- **Decisiones pendientes:** tope real de archivos por bloque (¿hay tope?); tamaño máximo y formatos aceptados; ¿se puede **renombrar** un archivo?; ¿se puede **abrir/descargar/ampliar** (hoy no se puede abrir ninguno)?; ¿se permiten otros formatos (DICOM, JPG, PDF) en radiografías?
- **Tomografías — PENDIENTE EXTERNO.** No se define nada acá. Depende de la respuesta de **Imago** sobre el formato de entrega. No es una tarea de desarrollo hasta que esa respuesta llegue. La demo no tiene ningún elemento de tomografía.
- Datos de prueba: radiografías y PDFs de `pac-1`, `pac-2`, `pac-3` y `pac-5`; nombres como `panoramica-inicial.jpg` o `cefalometria-inicial.pdf`.

### Permisos
Florencia: ver, agregar, cambiar momento, quitar.

---

## 4. Diagnóstico y plan de tratamiento

### Descripción
Tres campos de texto libre por paciente: **Diagnóstico**, **Plan de tratamiento** y **Técnica a utilizar**. En Armonización facial es la versión corta: diagnóstico y plan más chicos y **sin técnica**. Lo que se escribe acá se copia solo a la solapa de Presupuesto, al PDF y al mensaje de WhatsApp.

### Requerimientos funcionales
- El sistema deberá permitir editar diagnóstico, plan y (salvo Armonización facial) técnica, como texto libre.
- El sistema deberá reflejar esos textos, sin reescribirlos, en el presupuesto (vista previa y PDF) y en el mensaje de WhatsApp.
- El sistema deberá ocultar el campo «Técnica» cuando la categoría sea Armonización facial.

### Notas
- No hay estructura: ni plantillas, ni fases, ni fechas, ni versiones. **Pregunta pendiente:** ¿el plan de tratamiento debe tener fases estructuradas con fechas o sigue siendo texto libre? ¿Se necesita historial de cambios del diagnóstico/plan?
- Si el diagnóstico o el plan están vacíos, el presupuesto los muestra vacíos (en WhatsApp dice «a definir»).
- Datos de prueba: diagnósticos y planes clínicos inventados para `pac-1` a `pac-6`.

### Permisos
Florencia: ver y editar.

---

## 5. Presupuesto y control de pagos

### Descripción
Una solapa con cinco bloques:
1. **Vista previa** con membrete (isotipo + «Florencia Inveninato — Ortodoncia y ortopedia maxilar · La Plata · Tandil»): datos del paciente, tratamiento (categoría), sede, cobertura, diagnóstico, plan y técnica. Solo lectura.
2. **Monto y condiciones:** monto total (pesos, solo dígitos) y condiciones (texto libre). Botones **Generar PDF**, **Enviar por WhatsApp** e **Imprimir**.
3. **Cuotas iniciales:** cantidad elegible de 1 a 8, a pagar en 6 meses. Por cuota: medio de pago (Efectivo/Transferencia) y estado (efectuado/pendiente).
4. **Mantenimiento del tratamiento:** duración estimada (texto libre) y registros mensuales (fecha, monto, efectuado) con alta rápida.
5. **Cierre del tratamiento:** valor de contención, fecha de alta, valor de alta.

### Requerimientos funcionales
- El sistema deberá permitir cargar el monto total solo con dígitos y mostrarlo formateado en pesos argentinos.
- El sistema deberá dividir el monto total **en partes iguales** según la cantidad de cuotas y mostrar «N cuotas de $X».
- El sistema deberá permitir elegir de 1 a 8 cuotas; al reducir la cantidad, las cuotas sobrantes se eliminan junto con su estado.
- El sistema deberá permitir marcar cada cuota como efectuada y elegir su medio de pago.
- El sistema deberá mostrar «N de M cobradas» y el monto cobrado sobre el total (cuota × cuotas efectuadas).
- El sistema deberá mostrar las cuotas como tabla en escritorio y como filas de un renglón en mobile, con las cobradas teñidas de coral.
- El sistema deberá generar un PDF con membrete: fecha de emisión, datos del paciente, diagnóstico, plan, técnica (salvo Armonización facial), monto, avance de cuotas («N de M cuotas abonadas»), condiciones y plan de pagos con estado de cada cuota. Debe incluir el pie «Presupuesto sin valor de factura. Válido por 30 días desde la fecha de emisión.»
- El sistema deberá permitir imprimir el mismo PDF directamente.
- El sistema deberá abrir WhatsApp (`wa.me`) con un mensaje prellenado (saludo, plan, técnica, monto total, condiciones). El PDF **no se adjunta**: se adjunta a mano.
- El sistema deberá permitir agregar registros de mantenimiento (fecha y monto obligatorios), editar el monto, marcarlos efectuados y borrarlos, ordenados del más nuevo al más viejo.
- El sistema deberá permitir cargar valor de contención, fecha y valor de alta, que pueden quedar vacíos.
- En Armonización facial el sistema deberá mostrar la cobertura como «Particular» y no mostrar la técnica.

### Notas
- El **monto de mantenimiento lo escribe Florencia cada vez**: no hay fórmula, ni descuento, ni vínculo con las cuotas.
- La demo **no valida** que el mantenimiento arranque después del mes 6, ni que la suma de cuotas coincida con nada.
- Los montos son texto con solo dígitos; sin decimales. **Pregunta pendiente:** ¿alguna vez hay centavos? ¿otra moneda (dólares)?
- **Preguntas pendientes de negocio** (no inventar):
  - ¿Las cuotas son siempre iguales entre sí? ¿Hay ajuste por inflación o intereses?
  - ¿Hay una entrega/seña inicial distinta de las cuotas?
  - ¿El tope de 8 cuotas / 6 meses es real?
  - ¿El importe de la contención y del alta se suma al total del presupuesto o se cobra aparte?
  - ¿Hace falta recibo/comprobante de cada pago? ¿Se registra la fecha real de cada cobro? (hoy solo hay tilde).
  - ¿Hay saldo adeudado o alertas de pagos atrasados?
  - ¿«Presupuesto sin valor de factura» y «30 días» son redacción definitiva?
  - ¿Un paciente puede tener más de un presupuesto (modelo actual: uno)?
- **PDF — decisión pendiente:** la demo lo genera en el navegador con jsPDF (incluye el membrete). Definir si queda en el cliente o pasa al servidor, y si se guarda en el sistema cada versión emitida.
- **WhatsApp — decisión pendiente:** ¿se **automatiza** el envío (requiere una API de negocio tipo WATI, con costo mensual y alta de número) o queda el flujo manual (`wa.me` + adjuntar a mano)? Es la misma disyuntiva planteada en `lead-florencia-ortodoncia.md`. Hasta decidir, el alcance asume flujo manual.
- Datos de prueba: montos como `$780.000`, `$1.450.000`, `$1.980.000`, `$990.000`, `$420.000`, cuotas pagas parciales y registros de mantenimiento (`$38.000`–`$60.000`) son inventados.

### Permisos
Florencia: ver, editar, generar PDF, enviar, imprimir. Si se suma otro rol, definir si ve montos.

---

## 6. Seguimiento diario de evolución

### Descripción
Línea de tiempo por paciente. Cada entrada tiene **fecha** y **texto libre** («lo que pasó en la sesión de hoy»).

### Requerimientos funcionales
- El sistema deberá permitir agregar una entrada con fecha (hoy por defecto, editable) y texto; «Agregar» queda deshabilitado con el texto vacío.
- El sistema deberá mostrar el historial ordenado de la fecha más reciente a la más vieja, con un contador de entradas.
- El sistema deberá permitir borrar entradas.
- El sistema deberá mostrar «Todavía no hay entradas de seguimiento» cuando no haya ninguna.

### Notas
- **No se pueden editar** entradas existentes; solo agregar o borrar. **Pregunta pendiente:** ¿se necesita editar? ¿Las entradas deben ser inmutables (valor de historia clínica) o borrables?
- Borrar no pide confirmación en la demo.
- Sin autor ni hora; sin adjuntos; sin vínculo con el turno ni con las fotos de control.
- Datos de prueba: entradas clínicas inventadas en `pac-1`, `pac-2`, `pac-3`, `pac-4` y `pac-5`.

### Permisos
Florencia: ver, agregar, borrar.

---

## 7. Agenda virtual

### Descripción
Calendario de uso interno en `/agenda`. Selector de sede (La Plata | Tandil), navegación semanal, leyenda de colores, y para cada día los **bloques horarios** de esa sede como líneas de tiempo, donde se asignan turnos. Incluye el botón «Configurar horarios». En la ficha del paciente, la solapa «Próximos turnos» lista sus turnos futuros (solo lectura).

### Requerimientos funcionales

**Vista**
- El sistema deberá mostrar la semana (lunes a domingo) de la sede elegida, con el rango de fechas y «Esta semana» / «Volver a hoy».
- El sistema deberá mostrar solo los días en que la sede tiene algún bloque; si no hay ninguno, deberá avisarlo e indicar «Configurar horarios».
- El sistema deberá mostrar el estado de cada turno por color: **Libre** (blanco), **Ocupado** (coral, con apellido e inicial del nombre), **Cancelado** (gris, tachado, cursiva), **No asistió** (borde coral con ícono de advertencia).
- El sistema deberá mostrar el alto de cada turno proporcional a su duración y los huecos libres como botones de 15 minutos.
- El sistema deberá mostrar la semana completa en escritorio y **un día por vez** (selector de día) en mobile.

**Asignar / gestionar turnos**
- Al elegir un hueco libre, el sistema deberá permitir elegir duración (15/20/30/45/60 min, solo las que entran en el espacio libre hasta el próximo turno o el cierre del bloque) y buscar el paciente por DNI o apellido con el mismo buscador del listado.
- Si el hueco no tiene lugar para ninguna duración, el sistema deberá avisarlo y no permitir asignar.
- Al elegir un turno existente, el sistema deberá mostrar paciente, DNI, rango horario, duración, categoría y estado.
- Turno «ocupado» (etiquetado «Confirmado» en pantalla): **Editar**, **Enviar por WhatsApp**, **No asistió**, **Cancelar turno**.
- Turno cancelado o «no asistió»: **Editar**, **Reactivar**, **Liberar horario** (elimina el turno).
- Editar: cambiar horario (solo los inicios con lugar), duración y paciente.
- Un turno cancelado o «no asistió» deberá seguir ocupando su lugar hasta liberarse.

**Configuración de horarios**
- El sistema deberá permitir, por sede, agregar y quitar bloques con etiqueta libre, hora desde/hasta (cada 30 min).
- La Plata: el bloque se define por **días de la semana** (Lun a Dom) y se repite todas las semanas.
- Tandil: el bloque se define por una **fecha puntual**.
- Los bloques de una sede conviven entre sí (los extra no reemplazan al general).
- El sistema deberá impedir guardar si falta fecha o días, si el cierre no es posterior a la apertura, o si dos bloques de la misma sede se superponen, y deberá explicar el motivo.
- Los turnos cargados fuera de un bloque (porque se quitó o cambió) se conservan pero no se ven en la grilla.

**Próximos turnos del paciente**
- El sistema deberá listar los turnos futuros en estado «ocupado» (fecha, hora, sede), de más próximo a más lejano.
- Si no hay, deberá mostrar un acceso a la agenda.

### Notas
- Se asume **un solo usuario** cargando; no hay bloqueo de edición simultánea. **Pregunta pendiente** si se suma una secretaria (concurrencia).
- La sede del turno es independiente de la sede del paciente; nada las vincula ni las valida.
- «Próximos turnos» no muestra historial de turnos pasados ni cancelados. **Pregunta pendiente:** ¿hace falta un historial de asistencia por paciente?
- No hay recordatorios automáticos ni reserva online (no-goals vigentes).
- **Pregunta pendiente:** ¿se pueden crear turnos en fechas pasadas? La demo lo permite.
- **Pregunta pendiente:** ¿se pueden cargar turnos fuera de bloque (sobreturnos)? La demo no.
- **Pregunta pendiente:** ¿turno a pacientes que no son pacientes todavía (primera consulta)? La demo exige elegir un paciente existente.
- **Pregunta pendiente:** el horario por sede (La Plata semanal, Tandil por fechas puntuales) salió de una decisión de implementación; confirmar con la clienta (ver Resumen C).
- El mensaje de WhatsApp del turno es manual: «Te confirmo tu turno el… Si necesitás cambiarlo, avisame con tiempo». Texto definitivo sin validar.
- Datos de prueba: bloques por defecto (La Plata lun/mié/jue 14–20, lun 11–13, jue 12–13; Tandil dos fechas) y 18 turnos relativos a la semana en que se abre la demo, con los cuatro estados. **Nada de esto es regla de negocio.**

### Permisos
Florencia: ver, crear, editar, cancelar, liberar, configurar horarios.

---

## 8. Trámites pendientes

### Descripción
Página `/tramites` con **dos listas independientes**: «Trámites de obra social» y «Trámites de facturación». Un paciente puede estar en las dos. Se agregan desde un botón en la cabecera de la ficha («Agregar a trámites pendientes»).

### Requerimientos funcionales
- El sistema deberá permitir, desde la ficha, agregar al paciente a una o a las dos listas mediante un diálogo con casillas.
- El sistema deberá impedir duplicados: si el paciente ya está **pendiente** en una lista, esa casilla aparece marcada y deshabilitada («Ya está pendiente»). Si estaba resuelto, se puede volver a agregar.
- El sistema deberá mostrar por ítem: apellido y nombre (enlace a la ficha), mail («Sin mail cargado» si no tiene) y fecha en que se agregó.
- El sistema deberá permitir marcar un trámite como **Resuelto** (queda tachado, al final de la lista) y **Deshacer**.
- El sistema deberá mostrar la cantidad de pendientes por lista.
- El sistema deberá ordenar: pendientes primero, resueltos al final.

### Notas
- El trámite **no tiene detalle ni nota**: solo paciente + tipo + fecha + resuelto. No hay descripción de qué trámite es, ni adjuntos, ni fecha de resolución, ni vencimiento. **Pregunta pendiente:** ¿qué información necesita cada trámite? ¿Qué es exactamente un «trámite de facturación»?
- No se puede **eliminar** un trámite; solo resolverlo.
- El mail se muestra pero no dispara ningún envío. **Pregunta pendiente:** ¿se usará para algo más (enviar documentación)?
- Datos de prueba: 6 trámites inventados sobre `pac-1`, `pac-2`, `pac-3` y `pac-5`.

### Permisos
Florencia: ver, agregar, resolver, deshacer.

---

# Decisiones pendientes consolidadas (para el sistema real)

| # | Tema | Qué hay que decidir | Bloquea |
|---|---|---|---|
| 1 | **Storage de archivos** | Proveedor, tamaño máximo y formatos de foto, video, radiografía y PDF. **El video pesa mucho más que la foto: confirmar proveedor antes de cotizar.** | Cotización |
| 2 | **Envío del PDF por WhatsApp** | Automatizar con API de negocio (tipo WATI) o seguir con `wa.me` y adjunto manual. | Alcance del módulo 5 |
| 3 | **Tomografías** | **Pendiente externo:** respuesta de Imago sobre el formato. No es tarea de desarrollo todavía. | Módulo 3 (parte) |
| 4 | **Auth y roles** | ¿Un usuario o varios? Recuperación de contraseña, 2FA. | Módulo 0 |
| 5 | **Armonización facial** | Siguen abiertas las preguntas de `lead-florencia-ortodoncia.md`; no darla por definida. | Módulos 1, 2, 4, 5 |
| 6 | **Topes** | Cuotas (8), plazo (6 meses), fotos de control (20), radiografías (6), estudios (4). ¿Son reales? | Módulos 2, 3, 5 |
| 7 | **Cuotas y cobros** | Fecha real de cobro, seña, saldo/alertas, recibos, centavos/moneda. | Módulo 5 |
| 8 | **Borrado y retención** | Borrar pacientes/archivos/entradas vs. baja lógica; confirmaciones; requisitos legales sobre historias clínicas y datos de salud. | Todos |
| 9 | **Agenda** | Sobreturnos, fechas pasadas, pacientes nuevos, historial de asistencia, confirmar horarios por sede. | Módulo 7 |
| 10 | **Trámites** | Qué datos lleva cada trámite. | Módulo 8 |
| 11 | **Un presupuesto por paciente** | ¿Se mantiene o habrá varios? | Módulo 5 |
| 12 | **Autoguardado** | ¿Cambio al instante o botón Guardar? | Todos |

---

# Requisitos técnicos y pautas de trabajo

- **Stack del frontend** (heredado de la demo): Vite, React 19, TypeScript, Tailwind v4, shadcn/ui (sobre Base UI), React Router, lucide-react, jsPDF (carga diferida).
- **Backend propuesto:** Supabase (Postgres, Auth, Storage, políticas por fila). Alternativa a evaluar: API propia.
- **Responsive:** mobile-first, probado a 375 px. Es requisito explícito: Florencia carga turnos y fotos desde el celular. Zona táctil mínima cómoda en acciones; sin funciones que dependan de hover.
- **Identidad visual** (provista por la clienta): isotipo `fi.` con el punto siempre coral; `#434952` (dominante), `#8D9CA4`, `#C2C5C6`, `#F88F8F` (acento y CTAs); Playfair Display para títulos (stand-in de Monterchi Serif) + Montserrat. Tokens en `src/index.css`; colores del PDF en `src/lib/pdf.ts`.
- **Datos de prueba:** nunca usar datos de pacientes reales en desarrollo ni en demos. Los seeds de la demo (`datos.ts`) quedan solo para entorno de desarrollo.
- **Migración de la demo al sistema real:** reemplazar `store.tsx` (context + `useReducer`/`useState`) por llamadas al backend; reemplazar `fotoDemo()` por la subida real; reemplazar el `Login` de adorno; quitar el pie «Demo de presentación…».
- **Privacidad:** los datos y las imágenes de pacientes son sensibles. Storage privado con URLs firmadas, acceso solo autenticado, copias de seguridad. Requisitos legales: ver decisión 8.
- **Fuera de alcance (vigente):** reserva de turnos online por el paciente, recordatorios automáticos, login de paciente, firma digital (descartada), automatización de WhatsApp (salvo que se decida el punto 2), tomografías (pendiente externo).
- **Calidad:** antes de dar por terminado un módulo, probarlo en navegador de escritorio y a 375 px.
- **Despliegue:** Vercel para el frontend; entornos separados de desarrollo y producción para la base de datos.
