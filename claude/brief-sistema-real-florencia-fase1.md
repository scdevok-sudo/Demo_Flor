# Instrucciones para Claude Code — Construcción del sistema real (Fichero Virtual, Florencia Inveninato)

Florencia ya pagó el primer 50% ($565.000 ARS). Esto arranca el desarrollo real — ya no es la demo. Alcance, precios y condiciones están cerrados en `claude/especificacion-requerimientos-florencia.md` (fuente de verdad funcional) y en `Presupuesto_FlorenciaInveninato_SCdev_DESCUENTO.docx` (condiciones comerciales). Leé primero `claude/especificacion-requerimientos-florencia.md` completo antes de tocar código — ahí están los 8 módulos en detalle, con sus notas y permisos.

## De dónde se parte

Arrancás desde el repo de la demo que ya armamos (React + Vite + TS + Tailwind + ShadCN, `react-router-dom`, `lucide-react`, `jsPDF`). Tiene todo el flujo de UI de los 8 módulos ya construido, pero con datos mockeados en memoria de React, login dummy y sin storage real. **No es un repo nuevo**: evolucionás este mismo código, módulo por módulo, de demo a sistema real — mismo criterio que venimos usando en otros proyectos (ej. Deca/Juan): cada fase deja el repo compilando y funcionando, cada vez más parecido al sistema final.

A medida que avances, sacá todo lo que quedó pensado solo para "mostrar una demo": login que no valida nada, datos de prueba visibles por default, cualquier atajo de acceso directo que saltee el login real. Los datos de prueba (seed) quedan solo detrás de un flag de desarrollo, nunca visibles en el build de producción.

## Lo que NO hacés en esta ronda: base de datos

**La base de datos la armo yo a mano** (proyecto Supabase, tablas, columnas, constraints, políticas RLS, buckets de Storage y sus políticas de acceso). Vos no creás ni modificás nada de eso — nada de archivos de migración SQL, nada de `supabase db` ni DDL.

Lo que sí hacés: todo el código de aplicación que lee y escribe contra esa base (cliente de Supabase, queries, subida de archivos a Storage, autenticación). Para que ese código tenga sentido sin esperarme, más abajo te dejo el **contrato de datos** — la estructura de tablas y columnas que voy a crear, sacada directamente de la especificación. Mientras programás cada módulo:

- Si para cuando llegás a un módulo la tabla correspondiente ya existe en Supabase (yo te aviso o la vas a ver si tenés acceso al proyecto), conectate contra eso de verdad.
- Si todavía no la armé, no inventes un schema distinto ni la crees vos: dejá ese módulo con una capa de datos fina y aislada (un archivo por entidad, ej. `src/data/pacientes.ts`, con funciones `listar()`, `crear()`, `actualizar()`, etc.) que hoy puede devolver datos mockeados pero mañana se cablea contra Supabase cambiando solo ese archivo, sin tocar componentes. Avisame en vez de seguir de largo si algo bloquea.
- Nombres de tablas/columnas van en un único archivo de constantes, no hardcodeados por todos lados — si yo termino usando un nombre distinto en Supabase, el ajuste es un find-replace en un solo lugar, no una reescritura.

### Contrato de datos (referencia — así van a quedar armadas las tablas)

No lo crees vos, es para que tu código asuma esta forma:

**`pacientes`**: id, nombre, apellido, dni (único), email, ocupacion, fecha_nacimiento, categoria (`ortopedia` \| `ortodoncia` \| `alineadores` \| `armonizacion_facial`), sede (`la_plata` \| `tandil`), anamnesis, obra_social, particularidades, derivado_por, activo (bool), created_at, updated_at.
*(`armonizacion_facial` existe como valor válido en el enum, pero en esta fase no se puede dar de alta un paciente con esa categoría — ver "Armonización facial (próximamente)" más abajo.)*

**`archivos_clinicos`** (cubre fotos y videos de los módulos 2 y 3): id, paciente_id (FK), origen (`foto_inicial` \| `foto_final` \| `intra_tratamiento` \| `radiografia` \| `estudio`), zona (`cara` \| `boca` \| null), etiqueta (texto libre — "perfil_izquierdo", "oclusal_superior", etc., o null para intra-tratamiento/estudios), tipo_archivo (`imagen` \| `video` \| `pdf`), etapa (`inicial` \| `intermedio` \| `final`, solo aplica a radiografías/estudios), storage_path, fecha (para intra-tratamiento, vínculo con seguimiento), created_at.

**`diagnosticos`**: id, paciente_id (FK), diagnostico (texto), plan_tratamiento (texto), tecnica (texto), created_at, updated_at. *(Historial simple: si se reemplaza el diagnóstico, insertá una fila nueva en vez de pisar la anterior — no hace falta versionado más complejo que eso.)*

**`presupuestos`**: id, paciente_id (FK), monto_total, condiciones (texto), duracion_estimada_tratamiento (texto libre), valor_contencion, valor_alta, fecha_alta, created_at, updated_at.

**`cuotas`**: id, presupuesto_id (FK), numero_cuota (1-8), monto, metodo_pago (`efectivo` \| `transferencia`), estado (`efectuado` \| `pendiente`), fecha.

**`mantenimiento_registros`**: id, presupuesto_id (FK), fecha, monto, estado (`efectuado` \| `pendiente`).

**`seguimiento`**: id, paciente_id (FK), fecha, texto, created_at. (La asociación a fotos/videos de esa fecha se resuelve consultando `archivos_clinicos` por `paciente_id` + `fecha`, no hace falta tabla puente.)

**`bloques_horarios`** (solo La Plata — horario recurrente): id, sede (siempre `la_plata`), dias (array de día de semana), hora_desde, hora_hasta, etiqueta (texto libre), created_at.

**`jornadas_tandil`** (Tandil — fechas puntuales, no recurrente): id, fecha, hora_desde, hora_hasta, etiqueta (texto libre, opcional), created_at. Florencia va dos días por mes a Tandil y los elige ella misma mes a mes, así que no hay patrón semanal que modelar — cada jornada se carga individualmente con su propia fecha y horario. Si una fecha no tiene jornada cargada, no hay turnos disponibles ese día en Tandil.

**`turnos`**: id, paciente_id (FK, nullable si el turno está libre), sede, fecha, hora_inicio, duracion_minutos, estado (`libre` \| `ocupado` \| `cancelado` \| `no_asistio`), created_at, updated_at. (Misma tabla para las dos sedes — lo que cambia es de dónde sale el rango horario disponible: `bloques_horarios` para La Plata, `jornadas_tandil` para Tandil.)

**`tramites`**: id, paciente_id (FK), tipo (`obra_social` \| `facturacion`), estado (`pendiente` \| `resuelto`), fecha_agregado, fecha_resuelto.

**Storage** (buckets de Supabase, los armo yo): `pacientes-fotos` (fotos/videos de módulo 2, path `{paciente_id}/{origen}/{uuid}.ext`), `pacientes-estudios` (radiografías/estudios de módulo 3, mismo criterio), `presupuestos-pdf` (PDFs generados, si se guardan — a confirmar si hace falta persistirlos o alcanza con generarlos al vuelo cada vez).

## Fases (en este orden)

| # | Módulo | Qué incluye |
|---|---|---|
| 0 | Fundación | Cliente Supabase, autenticación real, limpieza de accesos de demo |
| 1 | Ficha de paciente | Módulo 1 completo, conectado a datos reales |
| 2 | Fotos/videos + Estudios/radiografías | Módulos 2 y 3, subida real a Storage |
| 3 | Diagnóstico + Presupuesto y pagos | Módulos 4 y 5, PDF real |
| 4 | Seguimiento | Módulo 6 |
| 5 | Agenda virtual | Módulo 7 |
| 6 | Trámites pendientes | Módulo 8 |
| 7 | Cierre | QA mobile, deploy a Vercel Pro |

Commiteá cada fase por separado (no mezcles módulos en un mismo commit), así las puedo revisar una por una.

### Fase 0 — Fundación

- Cliente de Supabase inicializado con variables de entorno (`.env.example` documentado, nunca credenciales hardcodeadas).
- Autenticación real reemplazando el login dummy: Supabase Auth, un solo usuario (Florencia), login simple por email/contraseña (no hace falta magic link ni OAuth social — es una sola usuaria, no vale la pena la complejidad extra). Si preferís otro método avisame antes de implementarlo.
- Sacá del build de producción cualquier atajo de acceso directo, selector de rol falso, o aviso que exponga rutas internas — todo lo que haya quedado pensado solo para mostrar la demo sin loguearse.
- Los datos de prueba (seed) quedan solo detrás de un flag de entorno de desarrollo.

### Fase 1 — Ficha de paciente (módulo 1)

- CRUD completo contra `pacientes`: alta, baja lógica (campo `activo`), edición.
- Validación de DNI único (constraint en la tabla, la armo yo — tu código igual debería manejar el error de unicidad con un mensaje claro, no un error crudo de Postgres).
- Buscador combinado por DNI y apellido.
- Listado con filtro por sede (La Plata | Tandil), no como sistemas separados.
- El selector de categoría muestra las cuatro opciones (Ortopedia, Ortodoncia, Alineadores, Armonización facial), pero **Armonización facial aparece marcada con una etiqueta "Próximamente" y deshabilitada** — no se puede dar de alta un paciente con esa categoría todavía. Ver "Armonización facial (próximamente)" más abajo para el detalle de qué sí construir ahora.

### Fase 2 — Fotografías/videos clínicos y Estudios/radiografías (módulos 2 y 3)

- Subida real de archivos a los buckets de Storage (no más placeholders).
- Reemplazá los placeholders de la demo por previews reales (imagen embebida, ícono + nombre para video/PDF).
- Mantené los topes ya definidos: 10 fotos/video iniciales (4 cara + 6 boca, etiquetas ya confirmadas en la especificación), 10 finales (misma estructura), 20 intra-tratamiento (fotos y videos comparten el mismo tope), 6 radiografías, 4 estudios.
- Validar tipo de archivo (imagen/video/PDF según corresponda) y mostrar un error claro si se excede el tope de la categoría.
- **Tomografías**: no armes nada específico todavía, un estudio común (imagen o PDF genérico) alcanza por ahora. Está bloqueado por la respuesta de Imago sobre el formato (posible DICOM, que necesitaría un visor aparte) — dejalo comentado como pendiente, no lo resuelvas por tu cuenta.
- **Borrado de archivos**: por ahora no permitas eliminar fotos/videos ya cargados, solo reemplazar (para no perder trazabilidad del historial). Esto es un criterio por defecto mío, no confirmado con Florencia todavía — si en algún momento cambia, es un ajuste chico.

### Fase 3 — Diagnóstico y plan de tratamiento + Presupuesto y control de pagos (módulos 4 y 5)

- Campos de diagnóstico/plan/técnica conectados a `diagnosticos`, autocompletando el presupuesto.
- Presupuesto conectado a `presupuestos` + `cuotas` + `mantenimiento_registros`: selector de 1 a 8 cuotas (plazo 6 meses), registros de mantenimiento ilimitados agregados a mano (sin fórmula), duración estimada de tratamiento en texto libre, valor de contención editable, valor de alta con fecha.
- Generación de PDF real (reusá `jsPDF`, ya está en la demo) con el membrete e identidad visual de Florencia (paleta `#434952` / `#8D9CA4` / `#C2C5C6` / acento `#F88F8F`, tipografía Monterchi Serif o Playfair Display como fallback + Montserrat).
- Botón de compartir por WhatsApp: flujo manual asistido (`wa.me` con mensaje prellenado) — no hay integración de envío automático en esta fase.

### Fase 4 — Seguimiento (módulo 6)

- Alta de registros por fecha, texto libre, sin límite, mientras el paciente esté activo.
- Listado cronológico, con las fotos/videos intra-tratamiento de esa misma fecha visibles desde el registro.

### Fase 5 — Agenda virtual (módulo 7)

- **La Plata**: configuración de disponibilidad como lista de bloques horarios recurrentes (`bloques_horarios`): día(s) de la semana, desde, hasta, etiqueta libre, pudiendo convivir varios bloques el mismo día.
- **Tandil — confirmado, dos modelos distintos a propósito**: Florencia atiende en Tandil solo **dos días por mes, y los elige ella misma** (no es un día fijo de la semana como en La Plata). Por eso Tandil **no usa bloques recurrentes** — usa `jornadas_tandil`: Florencia carga cada jornada puntual con su fecha y horario cuando decide ir. Si una fecha no tiene jornada cargada, la agenda de Tandil muestra un aviso tipo "Tandil no tiene turnos disponibles este día", sin ofrecer horarios. La demo ya había implementado exactamente este modelo por su cuenta (sin que se lo pidiéramos en su momento) — resultó ser la lectura correcta del caso real, así que **no lo reviertas**: llevalo tal cual al sistema real, conectado contra `jornadas_tandil` en vez de datos mockeados.
- Duración del turno como propiedad individual de cada turno (no del bloque/jornada): selector 15/20/30/45/60 min al crear o editar un turno. Aplica igual en las dos sedes.
- Vista semanal tipo línea de tiempo: cada turno posicionado por hora de inicio, alto proporcional a su duración — no una grilla de celdas uniformes. En Tandil, la vista solo muestra horarios disponibles en los días con jornada cargada.
- Validación de que un turno nuevo no se superponga con uno existente ni exceda el bloque/jornada horaria.
- Asignación de turno a paciente existente (reusa el buscador del módulo 1).
- Estados: libre, ocupado, cancelado, no asistió — con las acciones de reactivar/liberar horario que ya tiene la demo (quedan, tienen sentido).
- Botón de enviar turno por WhatsApp (`wa.me`, mismo patrón que el presupuesto).
- Tab de "Próximos turnos" en la ficha del paciente.
- Selector de sede en la agenda (La Plata | Tandil) — ya no es una duda pendiente, es un requisito confirmado: cada sede se comporta distinto y la UI tiene que dejarlo claro (por ejemplo, mostrando en Tandil un calendario de jornadas cargadas en vez de una grilla semanal fija).

### Fase 6 — Trámites pendientes (módulo 8)

- Dos listas independientes (`tramites` filtrado por `tipo`): obra social y facturación.
- Botón desde la ficha del paciente para sumarlo a una lista, a la otra, o a ambas.
- Cada ítem muestra nombre, mail y fecha de alta; acción de marcar como resuelto.

### Fase 7 — Cierre

- QA completo en navegador y en viewport mobile (~375px) de las 8 fases — mobile-first es prioridad, la carga de fotos/video está pensada para hacerse desde el celular.
- Deploy a Vercel Pro (no Hobby — el plan free prohíbe uso comercial).
- Verificar que no haya ninguna credencial ni URL de Supabase hardcodeada en el repo.
- **Subir el proyecto de Supabase a plan Pro** (ver nota de límites de Storage más abajo) y revisar el "Upload file size limit" global antes de este cierre.

## Armonización facial (próximamente)

Su ficha y su set de fotos todavía no están definidos (pendiente de reunión con Florencia), así que no se construye el módulo completo en esta fase. Pero sí tiene que **verse** en el sistema, para que quede claro que está planeada:

- Aparece como cuarta opción en el selector de categoría del alta de paciente (módulo 1), con una etiqueta visual "Próximamente" y deshabilitada (no se puede seleccionar para crear un paciente todavía).
- El valor `armonizacion_facial` existe en el enum de `categoria` de la tabla `pacientes` (ver contrato de datos), reservado para cuando se habilite.
- No construyas ficha corta, set de fotos propio, ni ningún flujo funcional para esta categoría — eso es una fase aparte, una vez que Florencia confirme el detalle (cuántas fotos, de qué zonas, y si usa la misma lógica de presupuesto/cuotas que el resto).

## Fuera de alcance de esta fase (no lo construyas todavía)

- Firma digital / consentimiento informado electrónico.
- Envío 100% automático de presupuestos/turnos por WhatsApp (API de negocio tipo WATI) — v1 es manual asistido.
- Reserva de turnos online por el paciente, login de paciente, notificaciones automáticas.
- Visor específico de tomografías (DICOM) — bloqueado por Imago.
- Roles y permisos diferenciados (admin/Florencia): hoy todas las políticas RLS dan acceso total a cualquier usuario autenticado (`auth.role() = 'authenticated'`), sin distinción — Santi va a tener su propia cuenta de prueba/soporte además de la de Florencia, pero con los mismos permisos que ella, no hay jerarquía. Separar esto (una tabla de roles, políticas RLS por rol) queda para una fase futura, a definir cuándo haga falta.
- **Límites de tamaño de archivo en Storage**: los tres buckets no tienen `file_size_limit` propio, así que hoy usan el límite global del proyecto (que en plan Free suele ser menor a los 100 MB que el código asume para video). No se resuelve ahora — decisión de Santi (10/10/2026): se deja para el final, junto con el upgrade a Supabase Pro / Vercel Pro antes de poner el sistema en producción con Florencia. Si en una prueba un video grande falla con un error genérico de Storage en vez del mensaje de la app, es por esto, no es un bug a corregir ahora.

## Reglas generales

- No inventes reglas de negocio que no estén en `claude/especificacion-requerimientos-florencia.md`, en estas instrucciones, o confirmadas por mí en el chat — si algo queda ambiguo, preguntame en vez de decidir por tu cuenta. El modelo de Tandil de este documento ya está confirmado (no es una suposición tuya ni mía) — tratalo como un requisito cerrado, no como algo a reinterpretar.
- Nunca uses datos de pacientes reales en seeds/tests, solo datos ficticios.
- `npm run build` y lint limpios antes de cada commit de fase.
- Cualquier pedido que no esté en este documento ni en la especificación es scope creep y se cotiza aparte a $25.000 ARS/hora — avisame si ves algo que se sale de esto, no lo resuelvas gratis por tu cuenta.