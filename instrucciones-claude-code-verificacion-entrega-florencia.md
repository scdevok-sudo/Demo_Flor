# Instrucciones — Verificación final antes de entregar el sistema a Florencia

## Qué es esto

Esto **no es una tarea de desarrollo**. Es un chequeo de go/no-go: recorré cada ítem, probalo de verdad (no asumas que algo "seguro anda" porque el código lo implementa), y marcalo explícitamente como OK o FALLA. No arregles nada por tu cuenta si encontrás un problema — anotalo en el reporte final y pará ahí. Yo decido qué se corrige antes de entregar y qué queda para después.

Al final quiero un reporte con tres columnas: ítem / resultado (OK, FALLA, NO SE PUDO PROBAR) / detalle. Nada de "probablemente funciona" — si no lo probaste, decilo.

## 1. Baseline automático

- [ ] `npm run build`, `npm test` y `npm run lint` — los tres limpios, sin warnings nuevos.

## 2. Checklist de Fase 7 — Cierre (ya definido, usalo tal cual)

**Producción**
- [ ] Deploy en Vercel **Pro** (no Hobby), con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` cargadas en Production.
- [ ] Entrar por URL directa a `/pacientes`, `/agenda` y `/pacientes/<id>` y recargar (F5): no da 404.
- [ ] En la app desplegada no aparece ningún paciente de ejemplo ni imágenes de relleno, aunque `VITE_USAR_SEED` esté en `true` en el entorno.
- [ ] Solapa Fotos de un paciente de Armonización facial (si existe uno de prueba): muestra "Próximamente", sin botones de subir, y esa categoría sigue deshabilitada en el alta.
- [ ] Sin sesión, ninguna ruta muestra datos; cerrar sesión y tocar "atrás" no deja entrar.

**Límites de Storage**
- [ ] Proyecto Supabase en plan Pro y "Upload file size limit" global revisado (igual o mayor a los límites que usa la app: 25 MB imagen/PDF, 100 MB video, 50 MB modelo 3D).
- [ ] Subir en producción un archivo grande (video cercano a 100 MB, o el STL/PLY de prueba más pesado que tengas) desde el celular: sube o muestra un error claro, no queda colgado.

**Seguridad y base**
- [ ] `grep -rn "supabase.co"` y por claves (`eyJ`, `sb_`) en el repo: solo aparece en `.env.example` (placeholder) y en docs; `.env` sigue ignorado y fuera del historial de git.
- [ ] Correr `sql/verificar-rls.sql` (si no existe o está desactualizado, decímelo — no lo recrees por tu cuenta): todas las tablas con RLS activo, permisos de `authenticated` correctos, políticas de los buckets. Sin sesión (rol `anon`) nada es accesible.
- [ ] Las URLs de fotos/estudios son firmadas y vencen: abrir una URL vieja (pasada la hora) no muestra el archivo.

**Mobile completo (~375px) de los 8 módulos**
- [ ] Datos/alta: sin scroll horizontal, teclado numérico en DNI y montos.
- [ ] Fotos y Estudios: cámara/galería del celular, subida y vista previa (incluido el visor 3D si el celular lo soporta — si no, que al menos no rompa la pantalla).
- [ ] Diagnóstico y Presupuesto: textos largos, tabla de cuotas pasa a tarjetas, PDF se descarga.
- [ ] Seguimiento, Agenda y Trámites: sin elementos cortados ni botones difíciles de tocar.

## 3. Lo que se sumó después de escrito el plan de pruebas (no está en la lista de arriba)

**Estudios 3D**
- [ ] Subir un archivo STL/PLY real (no de prueba genérico) y confirmar que el visor lo abre y se puede rotar/hacer zoom, en desktop y en mobile.
- [ ] Si conseguiste ya el archivo real que manda Imago: confirmame si terminó siendo STL/PLY como asumimos, o si es DICOM. Si es DICOM, no lo resuelvas — es scope aparte, lo evaluamos.
- [ ] Subir un archivo con extensión no soportada (ej. un `.obj` o `.fbx`) a Estudios: rechaza con mensaje claro, no rompe la pantalla.

**Login — olvidé contraseña y recordar sesión**
- [ ] Probar el flujo completo de "Olvidé mi contraseña" de punta a punta **con un mail real de prueba** (no el de Florencia): pedir el link, que llegue, abrir la pantalla de "Contraseña nueva", guardarla, entrar con la contraseña nueva.
- [ ] Confirmar que Site URL y Redirect URLs en Supabase (Authentication → URL Configuration) apuntan al dominio de producción, no a localhost.
- [ ] "Recordar sesión" tildado: cerrar el navegador entero (no solo la pestaña) y volver a abrir — la sesión sigue activa.
- [ ] "Recordar sesión" destildado: cerrar el navegador y volver a abrir — pide login de nuevo.
- [ ] Decime si ya se configuró un SMTP propio en Supabase Auth o si sigue con el servicio de mail gratuito (lento y limitado) — si sigue con el gratuito, no es un FALLA pero anotalo igual en el reporte, es una decisión mía pendiente antes de que Florencia dependa de esto en el día a día.

**PDF de presupuesto, ronda 2**
- [ ] Generar un PDF de prueba y confirmar: entra en una sola página, no hay franjas vacías, aparece la fecha de vencimiento por cuota, aparece el número de referencia del presupuesto, y aparece el resumen de "Total abonado / Saldo pendiente" calculado bien (probalo con algunas cuotas marcadas como abonadas para confirmar que el cálculo da el número correcto, no solo que el campo existe).

## 4. Antes de entregar — limpieza de datos de prueba

- [ ] **Ningún paciente, presupuesto, foto, estudio o turno de prueba (ficticios, usados durante este testing) queda en el proyecto real de Supabase.** Esto es en serio: lo primero que va a ver Florencia al entrar tiene que ser su sistema vacío, no "Camila Rossi" o cualquier otro dato de prueba. Borralos de las tablas y de los buckets de Storage, no solo desactivarlos.
- [ ] El usuario de login de Florencia (su email real) existe en Supabase Auth, con una contraseña que **vos le vas a pasar a ella por un canal separado** (no me la mandes a mí ni la dejes en ningún doc) — confirmame solo que el usuario existe y está listo, no la contraseña en sí.
- [ ] Ningún usuario de prueba tuyo (el que usaste para probar olvidé-contraseña, por ejemplo) queda con acceso al sistema si no corresponde que lo tenga.

## 5. Reporte final

Armame una tabla con todos los ítems de arriba (1 a 4), resultado y detalle. Si hay algo en FALLA, no sigas arreglándolo por tu cuenta — decime qué es y esperá instrucción mía antes de tocar código de nuevo. Si todo da OK, decímelo explícitamente así: "Sistema listo para entregar, todo OK" — no lo des por sentado sin ese veredicto explícito al final.
