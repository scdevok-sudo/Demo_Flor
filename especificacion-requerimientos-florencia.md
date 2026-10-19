# Especificación de requerimientos — Fichero Virtual de Pacientes (Florencia Inveninato)

> Documento de alcance funcional del **sistema real** (no de la demo), siguiendo el formato de `SKILL-especificacion-requerimientos.md`. Reemplaza a `lead-florencia-ortodoncia.md` como fuente de verdad del alcance a partir de este punto — ese documento sigue existiendo como historial de cómo se llegó hasta acá (reunión, iteraciones de pricing, decisiones comerciales), pero para specs funcionales usar este.

## Nota de procedencia (leer antes de usar este documento)

Este documento se armó a partir del historial completo del proyecto (reunión de relevamiento del 15/09, audio del 19/09, reunión del 04/10, reunión del 06/10, y los briefs que se le fueron pasando a Claude Code para construir la demo), **no** a partir del escaneo de código que Claude Code hizo sobre el repo de la demo (`claude/especificacion-requerimientos-florencia.md` dentro de ese repo). Ese escaneo quedó incompleto porque al repo le faltaban varios de los archivos de brief (solo tenía `brief-demo-florencia-update-2-agenda.md` y el `README.md`), así que su resumen de discrepancias no es confiable — compara contra una versión vieja del alcance, no contra lo que realmente se pidió.

Dos cosas de ese escaneo sí se incorporaron acá porque son hechos nuevos y verificables sobre la implementación, no interpretaciones:

- En la demo, el tope de 20 archivos de la sección Intra-tratamiento es compartido entre fotos y videos (no son 20 fotos + 20 videos aparte).
- Los botones "Reactivar" y "Liberar horario" sobre turnos cancelados/no asistió fueron agregados por Claude Code por iniciativa propia (no estaban pedidos) — quedan incorporados acá porque tienen sentido funcional.

Una tercera cosa del escaneo **no** se incorporó tal cual: el código de la demo terminó afirmando como decidido que la sede Tandil funciona con fechas puntuales sueltas en vez de un horario semanal recurrente, y el comentario que decía "pendiente de confirmar con Florencia" fue reemplazado por esa decisión. Acá se deja marcado otra vez como pendiente de confirmar (ver módulo 7) — es una interpretación razonable, pero nunca pasó por la clienta.

## Contexto

Florencia Inveninato es ortodoncista, con consultorio en La Plata y pacientes también en Tandil. Atiende dos grandes ramas clínicas — ortopedia (niños) y ortodoncia (adultos) — más una línea de negocio no dental (armonización facial). Hoy no tiene ningún sistema digital: gestiona todo en papel y carpetas sueltas por consultorio. Usó Dentalink anteriormente y lo dejó por considerarlo demasiado complejo para su forma de trabajo.

Está por dejar su consultorio actual (probablemente a fin de 2026) para abrir un espacio propio, así que el sistema se piensa portable, sin atarse a la ubicación física actual.

Lo que pide es un **fichero virtual de pacientes**: una ficha por paciente que centralice datos personales, historia clínica resumida, fotos y videos clínicos, estudios y radiografías, diagnóstico, plan de tratamiento, presupuesto y control de pagos, seguimiento diario del tratamiento, una agenda de turnos de uso interno, y una sección de trámites administrativos pendientes.

## Actores/roles

- **Profesional** (Florencia): única usuaria del sistema. Alta, consulta y edición completa de todos los módulos.

No hay personal administrativo que vaya a usar el sistema hoy — el circuito es 100% ella. Si en el futuro suma una asistente, se necesitará un segundo rol con permisos acotados; todos los módulos de este documento ya están pensados con el criterio "solo rol Profesional" para poder abrir ese segundo rol más adelante sin rediseñar el sistema.

## Componentes de la aplicación

Propuesta de arquitectura (no es la decisión final, es la base concreta sobre la que decidir antes de cotizar):

- **Frontend**: React + Vite + Tailwind + ShadCN, igual que la demo. Alojado en **Vercel** (plan Pro — el plan Hobby/free prohíbe uso comercial por ToS).
- **Backend + base de datos**: **Supabase** (Postgres + RLS + Auth + Storage, plan Pro — el plan free pausa el proyecto a los 7 días de inactividad, inviable para un sistema que la clienta no usa todos los días). RLS resuelve bien el control de acceso a nivel de fila cuando el sistema maneja datos de salud.
- **Storage de archivos**: buckets de Supabase Storage para fotos, videos y PDFs. El tope de almacenamiento y el costo por volumen de video (pesa bastante más que una foto) hay que confirmarlo con el plan de Supabase elegido antes de cerrar precio — ver tabla de decisiones pendientes.
- **Generador de PDF**: para el presupuesto, con membrete e identidad visual propia de Florencia (ya recibida, ver más abajo).
- **Envío del presupuesto y de turnos por WhatsApp**: en v1, flujo manual asistido (el sistema genera el PDF / arma el mensaje y abre `wa.me` o WhatsApp Web con todo prellenado, pero el envío final lo hace Florencia). La automatización completa requeriría una API de negocio de WhatsApp (ej. WATI) — queda fuera de esta v1, ver tabla de decisiones pendientes.
- **Frontend accesible desde computadora y celular** — la carga de fotos/video está pensada especialmente para hacerse desde el celular.

## Resumen de decisiones pendientes antes de cotizar

| # | Decisión | Depende de | Bloquea |
|---|---|---|---|
| 1 | Horario de agenda en Tandil: ¿recurrente semanal (como La Plata) o fechas puntuales sueltas? | Confirmación de Florencia | Diseño final del módulo 7 |
| 2 | Formato de las tomografías que entrega Imago, y si se pueden visualizar desde la página | Respuesta de Imago a Florencia | Alcance del visor en módulo 3 |
| 3 | Proveedor y costo real de storage de fotos/video a volumen, y tope práctico de archivos por paciente | Cotización de Supabase Storage u otro proveedor | Precio final, Notas del módulo 2 |
| 4 | Automatización de envío de WhatsApp (API de negocio tipo WATI) vs. flujo manual asistido | Decisión comercial/técnica de Santi | Alcance y precio del módulo 5 |
| 5 | Detalle completo de Armonización facial: fotos (cuántas, zonas, momentos), campos de ficha que aplican, y si usa la misma lógica de presupuesto/cuotas que el resto | Reunión con Florencia | Alcance y precio de esa categoría |
| 6 | Criterio de borrado/reemplazo de fotos y videos ya cargados (eliminar vs. solo reemplazar) | Confirmación de Florencia | Notas del módulo 2 |
| 7 | Cotización actual del dólar (MEP/blue) para firmar el costo real de Vercel Pro + Supabase Pro | Mercado | Cálculo de margen del mantenimiento |

## Requerimientos por módulo

---

### 1. Ficha de paciente

#### Descripción

Punto de entrada al sistema: cada paciente se da de alta acá antes de poder cargarle fotos, estudios, diagnóstico, presupuesto, turnos o trámites. Hay cuatro categorías de paciente: Ortopedia, Ortodoncia, Alineadores y Armonización facial. Las primeras tres comparten casi toda la estructura de ficha y el mismo set de fotos (módulo 2); Armonización facial usa una ficha más corta y un set de fotos distinto, todavía sin definir en detalle (ver tabla de decisiones pendientes, ítem 5).

#### Requerimientos funcionales

- El sistema deberá permitir el alta, la baja (desactivación) y la modificación de pacientes.
- Campos mínimos por paciente:
  - Nombre y apellido.
  - DNI.
  - Mail.
  - Ocupación.
  - Edad y fecha de nacimiento.
  - Categoría: Ortopedia | Ortodoncia | Alineadores | Armonización facial.
  - Sede: La Plata | Tandil.
  - Anamnesis (texto libre).
  - Datos de obra social (si aplica) o marca de "particular".
  - Particularidades / dato de color para humanizar el trato.
  - Derivado por.
  - Activo: Sí | No.
  - Fecha de creación y de última modificación.
- El sistema deberá validar que no existan dos pacientes con el mismo DNI.
- El sistema deberá permitir la búsqueda de pacientes por DNI (criterio principal) y por apellido (alternativo), combinables.
- El listado de pacientes deberá incluir tanto los de La Plata como los de Tandil, con la sede como un filtro, no como una división en sistemas separados.

#### Notas

- Validar en el servidor la unicidad del DNI.
- El bloque de obra social y anamnesis extendida aplica a Ortopedia/Ortodoncia/Alineadores; para pacientes menores se reemplaza por los datos del familiar dentro de particularidades.
- Armonización facial pide menos datos en el alta — qué campos se sacan exactamente queda pendiente (ítem 5 de decisiones pendientes).
- Un paciente no se elimina físicamente si ya tiene fotos, estudios, presupuestos, seguimiento o trámites cargados — se desactiva en su lugar, y la ficha sigue siendo consultable como historial.

#### Permisos

- Accesible solo para el rol Profesional.

---

### 2. Fotografías y videos clínicos

#### Descripción

Registro fotográfico (y, desde la reunión del 06/10, también en video) del paciente en tres momentos: inicial, intra-tratamiento y final. Las fotos iniciales y finales tienen cantidad fija y clasificación por zona (cara/boca); las intra-tratamiento son más libres. Este set aplica a Ortopedia, Ortodoncia y Alineadores — Armonización facial usa un set de fotos distinto (ítem 5 de decisiones pendientes).

#### Requerimientos funcionales

- El sistema deberá permitir la carga de hasta 10 fotos/videos iniciales por paciente, en dos grupos fijos:
  - **4 de cara**: perfil izquierdo, perfil derecho, ¾ perfil sonrisa, frente sonriendo (el perfil izquierdo se muestra antes que el derecho).
  - **6 de boca**: frente, lateral derecha, lateral izquierda, oclusal superior, oclusal inferior, overjet vista inferior.
- El sistema deberá permitir la carga de hasta 10 fotos/videos finales por paciente, con la misma estructura y etiquetas que las iniciales, para comparar antes/después.
- El sistema deberá permitir la carga de fotos/videos intra-tratamiento asociados al paciente, con un tope de 20 archivos (fotos y videos comparten el mismo tope, no son topes separados).
- Cada foto/video intra-tratamiento deberá poder asociarse a una fecha, vinculándose al registro correspondiente del módulo 6 (Seguimiento).
- El sistema deberá aceptar carga de archivos tanto desde computadora como desde celular.

#### Notas

- El tope real de archivos/tamaño queda condicionado al proveedor de storage que se elija — confirmar antes de cotizar (ítem 3 de decisiones pendientes). El video pesa bastante más que una foto.
- Queda pendiente de confirmar con Florencia el criterio de borrado/reemplazo de fotos y videos ya cargados (ítem 6 de decisiones pendientes) — mientras no se confirme, no asumir que se pueden eliminar libremente, para no perder trazabilidad del historial.

#### Permisos

- Accesible solo para el rol Profesional.

---

### 3. Estudios y radiografías

#### Descripción

Espacio para adjuntar archivos clínicos complementarios (radiografías panorámicas, estudios cefalométricos, tomografías), independiente de las fotos clínicas.

#### Requerimientos funcionales

- El sistema deberá permitir la carga de hasta 6 radiografías por paciente, en formato imagen o PDF.
- El sistema deberá permitir la carga de hasta 4 estudios complementarios por paciente, en formato imagen o PDF.
- Cada estudio/radiografía deberá poder marcarse como inicial, intermedio o final.

#### Notas

- Aceptar formato imagen (JPG/PNG) y PDF para ambos tipos de archivo.
- **Tomografías**: Florencia quiere poder visualizarlas directamente desde la página. No se define nada de esto todavía — depende de que confirme con Imago (su proveedor) en qué formato las entrega (ítem 2 de decisiones pendientes). Si el formato es DICOM (habitual en tomografía dental), un visor de imagen/PDF genérico no alcanza y hace falta un visor específico — a confirmar recién cuando llegue la respuesta de Imago.

#### Permisos

- Accesible solo para el rol Profesional.

---

### 4. Diagnóstico y plan de tratamiento

#### Descripción

Campo clínico central donde la profesional documenta su evaluación y la estrategia elegida. Alimenta directamente al presupuesto (módulo 5).

#### Requerimientos funcionales

- El sistema deberá proveer un campo de texto libre para diagnóstico.
- El sistema deberá proveer un campo de texto libre para plan de tratamiento.
- El sistema deberá proveer un campo de texto libre (o selector con opción "otro") para técnica a utilizar.
- Estos tres campos deberán estar disponibles para autocompletar el presupuesto del módulo 5.

#### Notas

- Estos campos se pueden actualizar a medida que el tratamiento avanza; conviene guardar un historial simple para no perder el diagnóstico original si se reemplaza, sin necesidad de versionado complejo.

#### Permisos

- Accesible solo para el rol Profesional.

---

### 5. Presupuesto y control de pagos

#### Descripción

A partir de los datos ya cargados del paciente, el sistema arma un presupuesto exportable a PDF con membrete propio. El ciclo de pago de un tratamiento de ortodoncia tiene tres etapas: cuotas iniciales, mantenimiento mensual mientras dura el tratamiento, y valores de cierre al finalizar.

#### Requerimientos funcionales

- El sistema deberá generar un presupuesto precargado con los datos del paciente ya existentes (nombre, edad, diagnóstico, plan de tratamiento, técnica).
- El sistema deberá permitir editar el monto y las condiciones antes de generar el presupuesto definitivo.
- El sistema deberá exportar el presupuesto a PDF, con membrete e identidad visual propia de Florencia, disponible para imprimir y para compartir por WhatsApp (flujo manual asistido, ver Componentes de la aplicación).
- **Cuotas iniciales**: el sistema deberá permitir configurar entre 1 y 8 cuotas, pagaderas en un plazo de 6 meses, marcando por cuota si el pago fue en efectivo o transferencia, y si está efectuado o pendiente.
- **Mantenimiento del tratamiento**: a partir de que terminan las cuotas iniciales, el sistema deberá permitir cargar registros de mantenimiento mes a mes (fecha, monto, efectuado/pendiente), sin límite de registros, agregados manualmente por Florencia — el monto no se calcula con ninguna fórmula, lo decide ella en cada registro.
- El sistema deberá proveer un campo de texto libre para la duración estimada del tratamiento, completado a mano por Florencia (sin selector de opciones fijas ni tope técnico).
- **Cierre del tratamiento**: el sistema deberá proveer un campo editable de "valor de contención" (el dispositivo que usa el paciente al finalizar) y un campo de "valor de alta" con su fecha correspondiente.

#### Notas

- Queda pendiente de decisión si el envío del PDF por WhatsApp se automatiza (requiere una API de negocio tipo WATI) o si el flujo sigue siendo manual asistido (ítem 4 de decisiones pendientes).
- El consentimiento informado con firma queda fuera del alcance de esta v1 — Florencia sigue haciéndolo en papel. Puede retomarse como fase futura si se resuelve el tema de firma digital.

#### Permisos

- Accesible solo para el rol Profesional.

---

### 6. Seguimiento / planilla diaria de evolución

#### Descripción

Registro cronológico de lo que se le hace al paciente en cada sesión, durante todo el tratamiento.

#### Requerimientos funcionales

- El sistema deberá permitir el alta de un registro de seguimiento por fecha, con texto libre, sin límite de registros mientras el paciente esté activo.
- Cada registro deberá poder asociarse, opcionalmente, a una o más fotos/videos intra-tratamiento del módulo 2 cargados en esa misma fecha.
- El listado de seguimiento deberá poder consultarse ordenado cronológicamente.

#### Notas

- Este módulo depende de que el paciente ya esté dado de alta (módulo 1).

#### Permisos

- Accesible solo para el rol Profesional.

---

### 7. Agenda virtual

#### Descripción

Agenda de uso **interno**: Florencia ve sus días y horarios de atención y carga manualmente a qué paciente corresponde cada turno. No es un sistema de reserva online para el paciente — no hay autogestión de turnos, login de paciente, ni lógica de bloqueo en tiempo real contra reservas simultáneas, porque solo hay un usuario cargando datos.

#### Requerimientos funcionales

- El sistema deberá mostrar una vista semanal con navegación entre semana anterior/siguiente.
- La disponibilidad se configura como una **lista de bloques horarios**, cada uno con: día o días que aplica, hora desde, hora hasta, y una etiqueta libre de texto. Los bloques pueden convivir el mismo día (ej. un bloque general y uno o más bloques adicionales).
- La **duración de cada turno es una propiedad del turno individual**, no del bloque — Florencia da turnos de distinta duración (15, 20, 30, 45 o 60 minutos) mezclados el mismo día. Al crear o editar un turno, se elige su duración puntual.
- La vista deberá representar los turnos como bloques posicionados por su hora de inicio dentro de cada franja disponible, con alto proporcional a su duración (no una grilla de celdas todas iguales).
- El sistema no deberá permitir que un turno nuevo se superponga con uno ya cargado, ni que exceda el cierre del bloque horario en el que se crea.
- El sistema deberá permitir asignar un turno a un paciente ya existente (buscador por DNI/apellido), sin recargar sus datos.
- Estado de cada turno: libre, ocupado, cancelado, no asistió. Un turno cancelado o marcado "no asistió" deberá poder reactivarse o liberar su horario.
- El sistema deberá permitir editar y cancelar un turno ya asignado.
- El sistema deberá permitir enviar el turno por WhatsApp (flujo manual asistido, mensaje prellenado).
- Desde la ficha del paciente (módulo 1), deberá poder consultarse sus próximos turnos agendados.

#### Notas

- **Pendiente de confirmar con Florencia** (ítem 1 de decisiones pendientes): si el horario de la sede Tandil funciona igual que La Plata (bloques recurrentes por día de la semana) o si Tandil se maneja con fechas puntuales sueltas que Florencia va cargando una por una, sin recurrencia semanal. No asumir ninguna de las dos sin confirmarlo — es un cambio de fondo en el modelo de datos de la agenda, no un detalle visual.
- No se contempla disponibilidad pública ni reserva de turno por el paciente — si eso cambia en el futuro, es una ampliación de alcance distinta (login de paciente, notificaciones, bloqueo de conflictos en tiempo real), no una extensión chica de este módulo.
- No se definen recordatorios automáticos de turno (más allá del envío manual por WhatsApp) — evaluar como fase futura si Florencia lo pide.

#### Permisos

- Accesible solo para el rol Profesional.

---

### 8. Trámites pendientes

#### Descripción

Registro de gestiones administrativas pendientes por paciente, separado de la ficha clínica: trámites de obra social y trámites de facturación.

#### Requerimientos funcionales

- El sistema deberá proveer dos listas independientes: trámites de obra social pendientes, y trámites de facturación pendientes.
- Desde la ficha del paciente (módulo 1), deberá poder sumarse al paciente a una de estas listas, o a ambas.
- Cada ítem deberá mostrar nombre del paciente, mail y fecha en que se agregó a la lista.
- Cada ítem deberá poder marcarse como resuelto/completado.

#### Notas

- No se definió el detalle de qué implica cada trámite más allá de nombre + fecha + estado — si Florencia pide más detalle (ej. texto libre por ítem) en el uso real, se ajusta sin ser un cambio estructural grande.

#### Permisos

- Accesible solo para el rol Profesional.

---

## Requisitos técnicos y pautas de trabajo

- Acceso desde computadora y desde celular — la carga de fotos/video está pensada especialmente para hacerse desde el celular; priorizar mobile-first en todo el frontend.
- Identidad visual propia de Florencia ya recibida (trabajo de marca hecho por Pachi): isotipo "fi.", paleta (`#434952`, `#8D9CA4`, `#C2C5C6`, `#F88F8F` de acento), tipografía Monterchi Serif (o Playfair Display como fallback) + Montserrat. Aplicar tal cual al sistema y al membrete del PDF de presupuesto.
- El sistema se piensa portable: Florencia va a dejar su consultorio actual y reabrir en un espacio propio — no debe quedar atado a la ubicación física actual.
- El sistema maneja datos de salud (historia clínica, fotos, estudios) — tenerlo en cuenta al definir permisos, backups y política de acceso, más allá de que el documento no profundiza en un marco de compliance específico.
- Queda **fuera del alcance de esta v1**: firma digital / consentimiento informado electrónico, envío 100% automático de presupuestos y turnos por WhatsApp (pendiente de decisión, ítem 4), y reserva de turnos online por parte del paciente.
- Cualquier pedido nuevo que llegue después de que Florencia confirme y pague el anticipo de este alcance se cobra aparte a la tarifa de scope creep/mantenimiento vigente ($25.000 ARS/hora).
