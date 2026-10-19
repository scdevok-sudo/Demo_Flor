# Instrucciones — Escanear la demo terminada y armar la especificación de requerimientos del sistema real

Esto es para cuando termines y verifiques (navegador + mobile 375px) las Actualizaciones 1 a 4 de la demo "Fichero Virtual" de Florencia Inveninato. No es un cambio de código — es un trabajo de auditoría y documentación sobre el repo ya terminado.

## Por qué hace falta esto

Los briefs que fuiste recibiendo (`brief-demo-florencia-claude-code.md`, `update-1`, `update-2-agenda`/`brief-demo-florencia-agenda.md`, `update-3`, `update-4-presupuesto.md`) son la intención original. Pero vos fuiste tomando decisiones propias durante la implementación que no estaban pedidas explícitamente (ej. los botones "Reactivar" y "Liberar horario" en turnos cancelados, que sumaste por tu cuenta en el módulo de Agenda). Puede haber más casos así, para bien o para mal. Antes de cotizar y construir el sistema real necesitamos un documento que diga **qué hay realmente en el código**, no lo que los briefs pedían — los briefs y el código pueden haberse separado en el camino.

## Qué tenés que hacer

### 1. Recorrer el código fuente, módulo por módulo

No uses los documentos de brief como fuente — leelos solo como referencia de contexto. La fuente de verdad es el código: componentes, rutas, estado (store/contexto de React), tipos/interfaces. Para cada uno de estos módulos, listá exactamente qué campos, botones, validaciones, estados y flujos existen hoy en la demo:

1. Ficha de paciente
2. Fotografías clínicas
3. Estudios y radiografías
4. Diagnóstico y plan de tratamiento
5. Presupuesto y control de pagos
6. Seguimiento diario de evolución
7. Agenda virtual
8. Trámites pendientes

Para cada módulo, anotá también los datos de prueba/mock que usaste (para no confundirlos después con reglas de negocio reales).

### 2. Armar un resumen de discrepancias (va primero en el documento final)

Antes de la especificación completa, una sección corta que compare lo que pedían los briefs contra lo que terminó en el código, con tres categorías:

- **Pedido y no implementado** (si quedó algo afuera).
- **Implementado pero no pedido** (decisiones que tomaste vos durante el desarrollo — como Reactivar/Liberar horario). Para cada una, una línea de qué hace y por qué la agregaste.
- **Pendiente/ambiguo en el código**: cualquier comentario tipo "pendiente de confirmar con la clienta" o similar que hayas dejado en el código (ej. el de sede en `Agenda.tsx`), listado explícitamente con archivo y línea.

### 3. Traducir cada simplificación de demo a una decisión pendiente para el sistema real

La demo no tiene backend (todo vive en memoria de React) ni sube archivos de verdad. Para el sistema real, cada una de estas simplificaciones se convierte en algo que hay que decidir y especificar — no lo resuelvas vos, solo dejalo planteado como pregunta/nota dentro del módulo correspondiente:

- Qué entidades de datos reales corresponden a cada cosa que hoy es un `useState`/mock (paciente, turno, bloque horario, ítem de trámite, registro de mantenimiento, etc.) y cómo se relacionan entre sí.
- Fotos/videos: dónde se van a almacenar de verdad, tamaño máximo, formatos aceptados — marcar que el video pesa bastante más que una foto y conviene confirmar el proveedor de storage antes de cotizar.
- Generación y envío del PDF del presupuesto: si el envío por WhatsApp se automatiza (requiere una API de negocio tipo WATI) o queda en el flujo manual (`wa.me` + adjuntar a mano), igual que está planteado en `lead-florencia-ortodoncia.md`.
- Tomografías (Estudios y radiografías): no definir nada todavía, está bloqueado por la respuesta de Imago sobre el formato — dejarlo marcado como pendiente externo, no como una tarea de desarrollo.
- Login/autenticación real (la demo tiene login dummy que no valida nada).

### 4. Armar el documento final con el formato de SCdev

Usá exactamente el formato de `SKILL-especificacion-requerimientos.md` (y `plantilla-requerimiento.md` para cada módulo):

1. **Contexto**
2. **Actores/roles**
3. **Componentes de la aplicación** (acá sí proponé una arquitectura real: backend, base de datos, storage de archivos — no hace falta que sea la decisión final, pero sí una propuesta concreta sobre la que Santi pueda decidir, no un "a definir" en blanco)
4. **Requerimientos por módulo** — los 8 módulos de arriba, cada uno con **Descripción / Requerimientos funcionales / Notas / Permisos**, redactado en modo normativo ("el sistema deberá permitir...", "deberá validar que..."), tal como pide la skill
5. **Requisitos técnicos y pautas de trabajo**

Guardalo como `claude/especificacion-requerimientos-florencia.md` (nuevo archivo). Esto reemplaza/actualiza a `lead-florencia-ortodoncia.md` como la fuente de verdad del alcance — ese documento se armó antes de la demo, a partir de notas de reunión, así que puede tener diferencias con lo que terminó implementado.

## Qué NO hacer

- No toques código en este paso, es solo documentación.
- No inventes reglas de negocio que no estén ni en el código ni en los briefs — si algo quedó ambiguo, se anota como pregunta pendiente, no se resuelve a criterio propio.
- No incluyas Armonización facial como si estuviera totalmente definida — sigue teniendo preguntas abiertas (ver "Armonización facial en la demo" en `lead-florencia-ortodoncia.md`), marcalas igual en el nuevo documento.
