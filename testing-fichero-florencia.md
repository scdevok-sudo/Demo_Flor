# Plan de pruebas — Fichero Virtual de Pacientes (Florencia Inveninato)

Checklist de QA manual, fase por fase, para ir tildando a medida que Claude Code entrega cada una. La idea no es confirmar que "el código hace lo que dice que hace" — es tratar de romperlo: casos límite, datos sucios, campos vacíos, superposiciones, cosas que un usuario real (vos o Florencia) va a terminar haciendo tarde o temprano sin querer.

Cómo usarlo: marcá `[x]` lo que probaste y salió bien. Si algo falla, no lo tildes — copiame el ítem tal cual está acá más lo que pasó (captura si hay), y lo mando a corregir antes de avanzar a la fase siguiente. No avances de fase con ítems sin probar solo porque "seguro andan".

Donde dice "Verificar en Supabase", podés pedirme a mí que lo chequee directo en la base (tengo acceso de lectura al proyecto real) en vez de andar abriendo el Table Editor vos mismo.

---

## Antes de empezar (preparación, 5 minutos)

- [ ] `npm test`, `npm run lint` y `npm run build` pasan limpios.
- [ ] Tener **dos pacientes de prueba con datos ficticios** (nunca reales), uno por sede, y uno más para dar de baja.
- [ ] Tener a mano un celular (o el modo dispositivo del navegador a ~375px), una foto, un video corto, un PDF y un `.zip` para probar rechazos.
- [ ] Abrir la consola del navegador (F12) y dejarla abierta durante todo el recorrido.
- [ ] Si algo falla, anotarlo en la tabla del final antes de seguir.

---

## Ya cubierto por tests automáticos (`npm test`)

Correr `npm test` antes de dar por buena una fase: tiene que pasar todo. Estos casos **no** hay que repetirlos a mano (se sacaron de las listas de abajo):

- DNI: con o sin puntos es el mismo valor; formato `29.483.094`.
- Búsqueda de pacientes: por DNI exacto o parcial, por apellido/nombre parcial, sin distinguir mayúsculas ni tildes.
- Edad desde fecha de nacimiento (cumpleaños hoy / mañana / ayer, 29 de febrero, fechas inválidas o futuras).
- Fechas: formato corto/largo, día local sin corrimiento por zona horaria, lunes de la semana.
- Agenda: qué bloques atienden cada día (recurrente y puntual), superposición de bloques, espacio libre y superposición de turnos, turno que se pasa del cierre, cancelados/no asistió que siguen ocupando lugar.
- Archivos: valores de los topes (10 / 10 / 20 / 6 / 4), tipo y tamaño permitido, extensión cuando el celular no manda tipo.

Lo que los tests **no** miran es que la pantalla use esa lógica (que el botón bloquee, que el mensaje se vea). Eso sigue en las listas de abajo.

Además, `sql/verificar-rls.sql` revisa RLS y permisos de las tablas y los buckets: correrlo al cierre de cada fase que cree tablas y en la Fase 7.

---

## Transversal (repetir en cada fase, no es un paso único)

- [ ] Después de cada alta/edición/baja, refrescar la página (F5) y confirmar que el cambio persiste. Si desaparece al refrescar, no está yendo contra Supabase — vuelve a estado mockeado.
- [ ] Cerrar sesión y volver a loguearse: los datos cargados tienen que seguir ahí. Esto descarta que algo esté guardando en localStorage disfrazado de "real".
- [ ] Abrir la consola del navegador (F12 → Console) en cada flujo nuevo. Un error silencioso que no se ve en pantalla igual puede estar rompiendo algo.
- [ ] Probar en viewport angosto (~375px, F12 → Toggle device toolbar) los flujos de carga — el sistema es mobile-first a propósito, sobre todo para fotos.

---

## Fase 0 — Fundación (auth + cliente Supabase)

- [ ] Login con el usuario real (vos o Florencia) funciona y entra a `/pacientes`.
- [ ] Login con contraseña incorrecta: mensaje de error claro en pantalla, no un crash en blanco ni un error crudo de Supabase.
- [ ] Sin sesión iniciada, entrar directo por URL a una ruta protegida (`/pacientes`, `/agenda`, etc.) redirige a `/login`, no muestra nada de contenido.
- [ ] Con sesión iniciada, entrar a `/login` por URL redirige a `/pacientes` en vez de mostrar el formulario de nuevo.
- [ ] "Salir" cierra la sesión de verdad: después de salir, tocar "atrás" en el navegador no te vuelve a dejar adentro sin loguearte de nuevo.
- [ ] No hay ningún botón, atajo o dato de "demo" visible (usuario/contraseña de ejemplo, cartel de presentación, selector de rol falso).
- [ ] Con `VITE_USAR_SEED=true` en desarrollo: aparecen pacientes/turnos de ejemplo en pantalla, pero esos datos de ejemplo **no** están en la tabla real de Supabase (verificar en Supabase).
- [ ] Con `VITE_USAR_SEED=false`: la app arranca completamente vacía, sin ningún dato de prueba.
- [ ] Buscar en el repo (`grep -r` por la URL del proyecto o por "supabase.co") que no haya ninguna credencial ni URL hardcodeada fuera de `.env*`.

## Fase 1 — Ficha de paciente

**Alta**
- [ ] Alta completa con todos los campos.
- [ ] Intentar guardar sin nombre, sin apellido o sin DNI: bloquea con mensaje, no guarda un registro a medias.
- [ ] Alta con un DNI que ya existe (probar también escrito con puntos, `29.483.094` contra `29483094`; la normalización ya está testeada, esto prueba que la base lo rechace): mensaje "Ya existe un paciente con ese DNI", nunca un error crudo de Postgres en pantalla.
- [ ] Categoría "Armonización facial" se ve en el selector pero deshabilitada con "Próximamente" — no se puede completar un alta con esa categoría.
- [ ] Pegar algo como `<script>alert(1)</script>` en anamnesis o particularidades: se guarda como texto literal, no se ejecuta nada raro en la página.

**Edición**
- [ ] Editar un campo, "Guardar cambios", refrescar: el cambio quedó.
- [ ] Teléfono (requiere la columna `telefono` en `pacientes`): cargarlo en el alta y en la edición, guardar, refrescar: queda. Probar escritos distintos (`221 555-0123`, `0221 15 555-0123`, `+54 9 221 555 0123`) y confirmar a qué chat abre WhatsApp en cada caso. Vaciarlo y guardar: queda en null.
- [ ] Intentar cambiar el DNI de un paciente al DNI de otro paciente ya existente: mismo mensaje de duplicado.

**Baja**
- [ ] Dar de baja (lógica): desaparece del listado de activos.
- [ ] Verificar en Supabase que la fila sigue existiendo con `activo = false` (no se borró la fila).
- [ ] La ficha de un paciente dado de baja sigue siendo consultable (no da 404 ni error al entrar).

**Búsqueda y filtros**
- [ ] El buscador de la pantalla filtra el listado mientras escribís (la lógica de coincidencia ya está testeada).
- [ ] Con al menos dos pacientes cargados en sedes distintas: filtro "La Plata" y "Tandil" muestran solo lo que corresponde.
- [ ] Filtro de categoría combinado con el de sede al mismo tiempo.
- [ ] El listado "Todas" mezcla pacientes de las dos sedes en una sola lista (no hay sistemas separados por sede).

## Fase 2 — Fotos/videos y Estudios/radiografías

- [ ] Subir una foto a cada una de las 4 etiquetas de cara y las 6 de boca (set inicial).
- [ ] Intentar subir una 11ª foto inicial: bloquea por tope, mensaje claro (los valores de los topes están testeados; falta probar que la pantalla los aplique).
- [ ] Mismo tope para el set final (10).
- [ ] Intra-tratamiento: subir hasta el tope (20, fotos y videos cuentan juntos para el mismo tope) y confirmar que la 21ª se bloquea.
- [ ] Radiografías: tope 6. Estudios: tope 4.
- [ ] Subir un `.zip` a una categoría de solo imagen: el mensaje se ve en pantalla y no rompe nada (qué tipos y tamaños se aceptan ya está testeado).
- [ ] Verificar en Supabase Storage que el archivo subido realmente está en el bucket correspondiente (`pacientes-fotos` / `pacientes-estudios`), con el path `{paciente_id}/{origen}/...` — no solo que se ve en la UI.
- [ ] Borrar una foto de slot fijo (inicial o final): aparece el modal «¿Borrar …?». «Cancelar» (o cerrar con Esc) no borra nada; «Sí, borrar» la quita y el slot vuelve a mostrar «Subir».
- [ ] Después de borrar un slot, subir una foto nueva en ese mismo slot: se carga normal.
- [ ] Borrar una foto/video intra-tratamiento, una radiografía y un estudio: mismo modal, y el contador («N de 20», «N de 6», «N de 4») baja.
- [ ] Tras borrar, verificar en Supabase: la fila ya no está en `archivos_clinicos` **y** el objeto ya no está en el bucket (`pacientes-fotos` / `pacientes-estudios`). Si la política de Storage no permite DELETE, la app avisa con un mensaje que nombra el path: confirmar que no pasa.
- [ ] Borrar en mobile (375px): el botón del tacho es visible y tocable sin hover, junto al de reemplazar.
- [ ] Con «Comparar con las iniciales» activado, borrar una inicial y volver a la comparación: ese casillero queda vacío («Antes»).
- [ ] Reemplazar un archivo ya cargado: el registro apunta al nuevo archivo. Ojo: el objeto anterior queda en el bucket (no se borra al reemplazar); confirmar si es lo que querés ahora que el borrado existe.
- [ ] Subir una foto desde el viewport mobile (375px).
- [ ] Carga de una foto intra-tratamiento con fecha asociada: la fecha queda guardada (se va a usar en Fase 4 para vincular con seguimiento).

## Fase 3 — Diagnóstico + Presupuesto y pagos

**Diagnóstico**
- [ ] Cargar diagnóstico, plan y técnica, tocar "Guardar diagnóstico", refrescar: siguen ahí.
- [ ] Editar y guardar de nuevo: aparece "Versiones anteriores (1)" con el texto viejo intacto. En Supabase, `diagnosticos` tiene 2 filas para ese paciente (no se pisó la primera).
- [ ] Editar el texto y **no** guardar, cambiar de solapa y volver: el borrador sigue ahí con el aviso "Hay cambios sin guardar". Refrescar la página sin guardar: vuelve a la versión guardada.
- [ ] El botón "Guardar diagnóstico" está deshabilitado si no hay cambios.

**Presupuesto: alta y datos**
- [ ] Sin guardar nada, la solapa Presupuesto muestra un borrador con 8 cuotas pendientes y el botón dice "Crear presupuesto". En Supabase todavía no hay fila en `presupuestos`.
- [ ] "Crear presupuesto" con monto y condiciones: aparecen 1 fila en `presupuestos` y 8 en `cuotas` (`numero_cuota` 1 a 8, estado pendiente, `monto` = total / 8 redondeado).
- [ ] Cambiar el monto total y guardar: el `monto` de **todas** las cuotas se recalcula.
- [ ] El diagnóstico, plan y técnica que se ven en el presupuesto son los de la versión **guardada** (no los de un borrador sin guardar).
- [ ] Duración estimada en texto libre ("2 años", "hasta 4 años"): se guarda y vuelve tras refrescar.
- [ ] Valor de contención, valor de alta y fecha de alta: se guardan; dejarlos vacíos también guarda sin error.

**Cuotas (zona de riesgo: son registros de pago reales)**
- [ ] Probar 1 cuota y 8 cuotas (extremos). Bajar de 8 a 5 con todas pendientes: las filas 6 a 8 se borran en `cuotas`. Subir de 5 a 8: se crean 6, 7 y 8 pendientes.
- [ ] **Cobrar las cuotas 7 y 8 y bajar el selector a 5: las opciones 1 a 7 aparecen deshabilitadas y no se borra nada.** En Supabase, las cuotas 7 y 8 siguen con estado `efectuado`.
- [ ] Desmarcar la 8 y bajar a 7: sí se permite, y la 8 desaparece. Con la 7 cobrada no se puede bajar de 7.
- [ ] Cobrar una cuota: en Supabase `estado = efectuado` y `fecha` = hoy. Desmarcarla: `pendiente` y `fecha` vacía.
- [ ] Cambiar el medio de pago (efectivo / transferencia) de una cuota y refrescar: persiste.
- [ ] Cobrar una cuota en un paciente que **no** tenía presupuesto creado: se crea el presupuesto en ese momento y la cuota queda cobrada (no se pierde el clic).

**Mantenimiento**
- [ ] Agregar 15 o más registros sin que aparezca ningún tope. Cambiar el monto de uno, marcarlo efectuado, refrescar: persiste.
- [ ] Borrar un registro: desaparece en pantalla y en Supabase (`mantenimiento_registros`). Confirmar que es lo que querés (borra sin pedir confirmación).
- [ ] Agregar un mantenimiento en un paciente sin presupuesto creado: se crea el presupuesto y el registro queda guardado.

**PDF y WhatsApp**
- [ ] Generar PDF: membrete y colores de marca correctos, datos reales del paciente, diagnóstico/plan/técnica vigentes, monto, condiciones y plan de pagos con cuotas abonadas/pendientes.
- [ ] PDF con campos vacíos (sin condiciones, sin monto, sin cuotas cobradas): se genera sin romper.
- [ ] PDF con un texto de diagnóstico muy largo: pasa a una segunda página con el encabezado reducido y el pie.
- [ ] Imprimir: abre el diálogo de impresión con el PDF.
- [ ] Enviar por WhatsApp: abre `wa.me` con el chat del paciente (según su teléfono) y el mensaje prellenado. Si el paciente no tiene teléfono, abre WhatsApp sin contacto elegido. El PDF se adjunta a mano.
- [ ] Probar PDF y WhatsApp con cambios de monto sin guardar: confirmar qué muestran (hoy usan lo que está en pantalla, no lo guardado).

## Fase 4 — Seguimiento

- [ ] Alta con fecha de hoy y texto: aparece arriba del historial, y tras refrescar sigue ahí.
- [ ] Alta con una fecha pasada: se ubica en el orden cronológico correcto (más reciente primero).
- [ ] Dos entradas en la misma fecha: ambas se ven, ninguna pisa a la otra.
- [ ] Texto con saltos de línea: se respetan en el historial.
- [ ] Botón "Agregar" deshabilitado con el texto vacío o solo espacios.
- [ ] **Vínculo con fotos:** subir una foto y un video intra-tratamiento hoy (solapa Fotos) y cargar una entrada de seguimiento con fecha de hoy: foto y video aparecen debajo de esa entrada. La entrada de otra fecha no los muestra.
- [ ] Una foto de otro tipo (inicial, final) cargada hoy **no** aparece en el seguimiento.
- [ ] El video del seguimiento se reproduce desde la entrada.
- [ ] Borrar una entrada: primero pregunta "¿Borrar? Sí / No". "No" no borra; "Sí" la borra (también en Supabase).
- [ ] Paciente **inactivo** (dado de baja): el formulario de alta no aparece (se ve el aviso), pero el historial sigue visible.
- [ ] Volver a activar al paciente: el formulario reaparece.
- [ ] Con la conexión cortada (modo offline del navegador) intentar agregar: muestra el error y **no** pierde el texto escrito.

## Fase 5 — Agenda virtual

**Horarios**
- [ ] La Plata: cargar un bloque recurrente (ej. lunes y miércoles de 14 a 18), guardar, refrescar: sigue ahí y aparece en todas las semanas (probar semana siguiente y anterior).
- [ ] Dos bloques el mismo día (mañana y tarde): ambos se guardan y se ven. Uno que se pisa con otro: aviso en pantalla y no deja guardar.
- [ ] Editar un bloque existente (cambiar horario o días) y quitar uno: en Supabase (`bloques_horarios`) no quedan filas duplicadas ni huérfanas.
- [ ] Bloque con cierre anterior a la apertura, o sin días: no deja guardar y explica por qué.
- [ ] Tandil: cargar una jornada puntual con fecha y horario, guardar, refrescar: aparece en `jornadas_tandil` (no en `bloques_horarios`).
- [ ] Tandil, día **sin** jornada: no hay horarios ofrecidos; la semana sin jornadas muestra "Tandil no tiene días de atención esta semana".
- [ ] Dos jornadas el mismo día de Tandil que se pisan: aviso, no guarda.
- [ ] Cortar la conexión y guardar horarios: el diálogo **no** se cierra y muestra el error.

**Turnos**
- [ ] Crear un turno de cada duración (15, 20, 30, 45 y 60 min) y verificar la fila en `turnos` (hora, duración, sede, estado `ocupado`).
- [ ] Turno que se superpone con otro, o que se pasa del cierre del bloque: la pantalla lo bloquea o limita la duración con mensaje.
- [ ] Asignar con el buscador de pacientes (por apellido y por DNI).
- [ ] Editar un turno: cambiar horario, duración y paciente; refrescar y confirmar.
- [ ] Estados: ocupado → no asistió → reactivar; ocupado → cancelado → reactivar. En Supabase el `estado` cambia (`no_asistio`, `cancelado`).
- [ ] **"Liberar horario" borra la fila del turno** (no queda historial). Confirmar que es lo que querés; si no, avisar.
- [ ] Un turno cancelado o "no asistió" sigue bloqueando ese horario hasta liberarlo.
- [ ] Con la conexión cortada, crear un turno: el diálogo queda abierto con el error y no aparece un turno fantasma.
- [ ] Turnos de las dos sedes el mismo día y hora: no se afectan entre sí.

**Navegación y vistas**
- [ ] Moverse varias semanas adelante y atrás: los turnos de cada semana aparecen en su semana y no se mezclan; "Volver a hoy" funciona.
- [ ] Cantidad "N turnos esta semana" coincide con lo que se ve.
- [ ] Selector de sede: La Plata (bloques semanales) y Tandil (solo días con jornada) se ven claramente distintos.
- [ ] Mobile (375px): se ve un día por vez, con selector de día; turnos posicionados por hora con alto proporcional a la duración; los botones se pueden tocar sin errar.
- [ ] WhatsApp del turno: mensaje con fecha, hora y sede correctas, en el chat del paciente (si tiene teléfono).
- [ ] Solapa "Próximos turnos" de la ficha: muestra solo turnos **confirmados y futuros** del paciente (no cancelados, no pasados, no de otro paciente); un turno de hoy a una hora ya pasada no aparece.

## Fase 6 — Trámites pendientes

- [ ] Desde la ficha, "Agregar a trámites pendientes" → solo obra social: aparece en esa lista (y en `tramites` con `tipo = obra_social`, `estado = pendiente`).
- [ ] Solo facturación; y ambas a la vez en una sola operación: 2 filas.
- [ ] Repetir el alta sobre un trámite ya pendiente: la casilla aparece tildada y deshabilitada con "Ya está pendiente", y no se crea fila duplicada.
- [ ] Cada ítem muestra nombre (con link a la ficha), mail y "Agregado el dd/mm/aaaa" con la fecha correcta de hoy.
- [ ] Marcar resuelto: pasa al final, tachado; en Supabase `estado = resuelto` y `fecha_resuelto` con valor. "Deshacer" lo vuelve a pendiente y limpia `fecha_resuelto`.
- [ ] Un paciente resuelto en obra social puede volver a sumarse a esa lista (queda como un trámite nuevo).
- [ ] Paciente sin mail cargado: el ítem dice "Sin mail cargado" y no rompe.
- [ ] Refrescar y cerrar/abrir sesión: el estado de cada trámite se conserva.
- [ ] Con la conexión cortada: el error se ve en pantalla (en la lista, con "Reintentar") y el diálogo de alta no se cierra.

## Fase 7 — Cierre

**Producción**
- [ ] Deploy en **Vercel Pro** (no Hobby), con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` cargadas en el proyecto.
- [ ] Entrar por URL directa a `/pacientes`, `/agenda` y `/pacientes/<id>` y recargar (F5): no da 404 (el rewrite de `vercel.json` funciona).
- [ ] En la app desplegada **no** aparece ningún paciente de ejemplo ni imágenes de relleno, aunque `VITE_USAR_SEED` esté en `true` en el entorno.
- [ ] Solapa Fotos de un paciente de Armonización facial (si existe uno): muestra "próximamente", sin botones de subir.
- [ ] Sin sesión, ninguna ruta muestra datos; cerrar sesión y tocar "atrás" no deja entrar.

**Límites de Storage**
- [ ] Proyecto Supabase en **plan Pro** y "Upload file size limit" global revisado (los límites de la app son 25 MB imagen/PDF y 100 MB video; el del proyecto tiene que ser igual o mayor).
- [ ] Subir en producción un video cercano a 100 MB desde el celular: sube o muestra un error claro (no queda colgado).

**Seguridad y base**
- [ ] `grep -rn "supabase.co"` y por claves (`eyJ`, `sb_`) en el repo: solo aparece en `.env.example` (placeholder) y en docs; `.env` sigue ignorado y fuera del historial de git.
- [ ] Correr `sql/verificar-rls.sql`: las 11 tablas con RLS activo, permisos de `authenticated` (SELECT/INSERT/UPDATE/DELETE) correctos y políticas de los 3 buckets. Sin sesión (rol `anon`) ninguna tabla ni bucket es accesible.
- [ ] Las URLs de fotos/estudios son firmadas y vencen: abrir una URL vieja (pasada la hora) no muestra el archivo.

**Mobile completo (~375px) de los 8 módulos**
- [ ] Datos / alta: formularios sin scroll horizontal, teclado correcto (numérico en DNI y montos).
- [ ] Fotos y Estudios: cámara/galería del celular, subida y vista previa.
- [ ] Diagnóstico y Presupuesto: textos largos, tabla de cuotas pasa a tarjetas, PDF se descarga.
- [ ] Seguimiento, Agenda y Trámites: sin elementos cortados ni botones difíciles de tocar.

---

## Registro de fallas encontradas

Anotá acá cualquier cosa que falle durante las pruebas, con fecha, para no perder el hilo entre sesiones de testing:

| Fecha | Fase | Qué se probó | Qué pasó | Estado |
|---|---|---|---|---|
| | | | | |
