# Plan de pruebas — Fichero Virtual de Pacientes (Florencia Inveninato)

Checklist de QA manual, fase por fase, para ir tildando a medida que Claude Code entrega cada una. La idea no es confirmar que "el código hace lo que dice que hace" — es tratar de romperlo: casos límite, datos sucios, campos vacíos, superposiciones, cosas que un usuario real (vos o Florencia) va a terminar haciendo tarde o temprano sin querer.

Cómo usarlo: marcá `[x]` lo que probaste y salió bien. Si algo falla, no lo tildes — copiame el ítem tal cual está acá más lo que pasó (captura si hay), y lo mando a corregir antes de avanzar a la fase siguiente. No avances de fase con ítems sin probar solo porque "seguro andan".

Donde dice "Verificar en Supabase", podés pedirme a mí que lo chequee directo en la base (tengo acceso de lectura al proyecto real) en vez de andar abriendo el Table Editor vos mismo.

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
- [ ] Intentar borrar un archivo ya cargado: no debería estar permitido (por ahora solo reemplazar, según el brief).
- [ ] Reemplazar un archivo ya cargado: confirmar qué pasa exactamente (¿pisa al anterior? ¿queda duplicado?). Si no está claro, preguntame antes de asumir que está bien.
- [ ] Subir una foto desde el viewport mobile (375px).
- [ ] Carga de una foto intra-tratamiento con fecha asociada: la fecha queda guardada (se va a usar en Fase 4 para vincular con seguimiento).

## Fase 3 — Diagnóstico + Presupuesto y pagos

- [ ] Cargar diagnóstico/plan/técnica y guardar.
- [ ] Reemplazar el diagnóstico de un paciente que ya tenía uno: confirmar que queda un historial (fila nueva), no que pisa el anterior.
- [ ] Presupuesto: probar con 1 cuota y con 8 cuotas (los dos extremos).
- [ ] Cargar varios registros de mantenimiento sin límite — confirmar que no hay un tope artificial que no debería estar.
- [ ] Generar el PDF del presupuesto: revisar que tenga la identidad visual correcta (colores `#434952`/`#8D9CA4`/`#C2C5C6`/acento `#F88F8F`, tipografía) y los datos reales del paciente, no placeholders.
- [ ] Generar PDF con campos opcionales vacíos (ej. sin valor de contención cargado): no rompe la generación.
- [ ] Botón de compartir por WhatsApp: abre `wa.me` con un mensaje prellenado razonable — confirmar que no intenta mandar nada automático.

## Fase 4 — Seguimiento

- [ ] Alta de un registro de seguimiento con fecha y texto libre.
- [ ] Cargar más de un registro en la misma fecha: no se pisan entre sí.
- [ ] Si el paciente tiene fotos intra-tratamiento cargadas con esa misma fecha (Fase 2), confirmar que aparecen vinculadas automáticamente en el registro de seguimiento.
- [ ] Probar cargar seguimiento en un paciente dado de baja (inactivo): confirmar qué hace el sistema y si es el comportamiento esperado (el brief dice "mientras el paciente esté activo").

## Fase 5 — Agenda virtual

- [ ] La Plata: cargar un bloque horario recurrente (ej. lunes y miércoles de 14 a 18) y confirmar que se repite todas las semanas en esos días.
- [ ] Cargar dos bloques el mismo día (ej. mañana y tarde): la pantalla los acepta; y uno que se pisa con otro muestra el aviso (la regla está testeada).
- [ ] Tandil: cargar una jornada puntual con fecha y horario específico.
- [ ] Tandil, un día sin jornada cargada: la agenda muestra el aviso de "no hay turnos disponibles ese día", no una grilla vacía ni un error.
- [ ] Crear un turno de cada duración (15/20/30/45/60 min).
- [ ] Intentar crear un turno que se superpone con uno ya existente, o que se pasa del cierre del bloque: la pantalla lo bloquea con mensaje (la regla está testeada).
- [ ] Asignar un turno a un paciente existente usando el buscador (debe reusar el de Fase 1).
- [ ] Probar los cuatro estados: libre → ocupado → cancelado → no asistió, y las acciones de reactivar/liberar horario.
- [ ] Botón de enviar turno por WhatsApp.
- [ ] Tab "Próximos turnos" en la ficha del paciente: solo muestra turnos futuros, no pasados.
- [ ] Selector de sede en la agenda: la vista de La Plata (grilla semanal) y la de Tandil (calendario de jornadas) se ven claramente distintas.
- [ ] Vista mobile de la agenda: turnos posicionados por hora con alto proporcional a la duración, no una grilla uniforme.

## Fase 6 — Trámites pendientes

- [ ] Desde la ficha de un paciente, agregarlo a la lista de obra social.
- [ ] Agregarlo a facturación.
- [ ] Agregarlo a ambas listas desde el mismo botón/flujo.
- [ ] Cada ítem de las listas muestra nombre, mail y fecha de alta.
- [ ] Marcar un ítem como resuelto: sale de pendientes (o queda marcado como tal, según cómo se haya definido visualmente).
- [ ] Probar con un paciente que no tiene mail cargado (es opcional en el alta): no rompe la lista ni el ítem.

## Fase 7 — Cierre

- [ ] QA mobile (~375px) completo de los 8 módulos, no solo de los últimos que se tocaron.
- [ ] Confirmar que el deploy está en Vercel Pro, no Hobby.
- [ ] `grep` del repo completo por credenciales, URLs de Supabase o keys hardcodeadas — no debe aparecer nada fuera de `.env*`.
- [ ] Confirmar que `.gitignore` sigue ignorando `.env*` salvo `.env.example`.
- [ ] Verificar en Supabase que las 11 tablas tienen RLS activo y que el rol `authenticated` tiene los permisos de tabla (SELECT/INSERT/UPDATE/DELETE) — no solo las políticas RLS (ya tuvimos un bug exactamente acá, vale la pena re-chequear al cierre).

---

## Registro de fallas encontradas

Anotá acá cualquier cosa que falle durante las pruebas, con fecha, para no perder el hilo entre sesiones de testing:

| Fecha | Fase | Qué se probó | Qué pasó | Estado |
|---|---|---|---|---|
| | | | | |
