# Actualización 2 — Agenda virtual (sobre la demo "Fichero Virtual" ya armada)

Esto es un ajuste sobre la demo que ya armaste a partir de `brief-demo-florencia-claude-code.md` y `brief-demo-florencia-update-1.md`. No cambia nada de lo ya hecho (stack, no-goals, módulos 1 a 6, las 4 categorías de paciente, responsive) — suma un módulo nuevo: agenda de turnos.

## Contexto

Florencia pidió poder ver sus días y horarios de atención y cargar manualmente a qué paciente le corresponde cada turno. **Es un calendario de uso interno de ella, no un sistema de reserva online para el paciente** — ella es la única que carga y modifica la agenda, no hay autogestión de turnos desde afuera ni login de paciente.

Atiende los días **lunes, miércoles y jueves, de 14 a 20hs**, con turnos cada **media hora** (12 turnos por día, 36 por semana). Esto tiene que quedar configurable, no hardcodeado (ver punto 4).

## 1. Ruta y navegación

- Nueva ruta `/agenda`.
- Sumarla a la navegación principal/sidebar que ya existe, al mismo nivel que `/pacientes`.

## 2. Vista semanal (vista principal de `/agenda`)

- Grilla semanal con los días y horarios de atención precargados (lunes/miércoles/jueves, 14:00 a 20:00, slots de 30 minutos).
- Navegación entre semana anterior/siguiente (flechas), mostrando el rango de fechas de la semana actual.
- **Selector de sede (La Plata | Tandil) arriba de la grilla.** Esto todavía no está confirmado con Florencia (puede que atienda el mismo horario en las dos sedes, o un horario distinto por sede) — constrúyelo igual con el selector puesto, porque sacarlo después si resulta que no hace falta es trivial, y si hace falta y no está, es más trabajo agregarlo. Dejalo en una nota de código o comentario como "pendiente de confirmar con la clienta si el horario es el mismo en ambas sedes".
- Cada slot muestra su estado con un color distinto, usando la paleta de marca ya definida (`#434952`, `#8D9CA4`, `#C2C5C6`, `#F88F8F`):
  - **Libre**: fondo blanco/borde gris claro.
  - **Ocupado**: fondo con el color de acento (coral), nombre del paciente visible en el slot.
  - **Cancelado**: gris, con el texto tachado o en itálica.
  - **No asistió** (opcional, si da el tiempo): variante outline con un ícono de advertencia.

## 3. Asignar y gestionar turnos

- Click en un slot **libre** → abre un modal/panel para asignar el turno: reusar el mismo buscador de paciente por DNI/apellido que ya existe en `/pacientes`, para no duplicar lógica. Al elegir un paciente, el slot pasa a "ocupado" con ese paciente.
- Click en un slot **ocupado** → ver el detalle (nombre, categoría del paciente) con acciones: editar (cambiar de paciente o de horario) / cancelar turno / marcar como "no asistió".
- No hace falta persistencia real ni validación de conflictos en tiempo real — sigue siendo todo en memoria de React, como el resto de la demo, y es un solo usuario (Florencia) cargando datos.

## 4. Configuración de agenda (no hardcodear el horario)

- Pantalla o modal de configuración, accesible desde `/agenda` (ej. un botón "Configurar horarios"), donde se pueda editar:
  - Días de atención (checkboxes Lun a Dom).
  - Horario de atención (desde / hasta).
  - Duración del turno (dropdown: 15 / 20 / 30 / 45 / 60 min).
- La grilla semanal se arma en base a esta configuración, no a valores fijos en el código — así, si el día de mañana Florencia cambia sus días u horarios, se ajusta desde la UI.

## 5. Desde la ficha del paciente

- En `/pacientes/:id`, agregar una sección o tab nueva "Próximos turnos": lista los turnos futuros agendados de ese paciente (fecha, hora, sede), usando los mismos datos de la agenda. No hace falta que sea editable desde ahí, alcanza con que se vea.

## 6. Datos de prueba

- Asignar turnos ya cargados a 3-4 de los pacientes ficticios que ya existen en la demo, distribuidos en la semana actual y la próxima, mezclando estados (libre, ocupado, alguno cancelado) para que la grilla no se vea vacía al abrir `/agenda` por primera vez.

## 7. Responsive

Mismo criterio mobile-first que el resto de la demo (ver `brief-demo-florencia-update-1.md`, punto 3) — Florencia también va a cargar turnos desde el celular:

- En mobile, la grilla semanal completa (3 días × 12 slots) no entra cómoda en una tabla horizontal. Usar un selector de día (chips o tabs: Lun | Mié | Jue) que muestre los slots de ese día como lista vertical, en vez de la grilla de 3 columnas.
- Botones de acción (asignar, editar, cancelar) con área de touch cómoda, mismo criterio que ya aplicaste en la carga de fotos.
- Probar en viewport ~375px antes de dar por terminado.

## Lo que NO entra en este módulo (no-goals)

- Reserva de turnos online por el paciente (sigue siendo 100% carga manual de Florencia).
- Recordatorios automáticos por WhatsApp/email.
- Bloqueo de conflictos en tiempo real o backend real — sigue todo en memoria de React, igual que el resto de la demo.
- Login de paciente o cualquier acceso externo a la agenda.

## Recordatorio de lo que sigue igual

- Sin backend real, todo mockeado en memoria de React (`useState`/`useReducer` o Zustand, según lo que ya estés usando en el resto de la demo).
- Mismo stack (React + Vite + TS, Tailwind, ShadCN, lucide-react) y misma identidad visual (paleta + tipografía) que el resto de la demo.
- Nunca usar datos de pacientes reales, solo los ficticios que ya existen.
- Deploy final en Vercel con el mismo link que ya se está compartiendo.
