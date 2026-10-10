# Fichero virtual — Florencia Inveninato

Sistema de fichas de pacientes (React + Vite + TypeScript + Tailwind + ShadCN)
contra Supabase (Postgres, Auth y Storage).

## Cómo levantarlo

```bash
npm install
cp .env.example .env.local   # completar con la URL y la anon key del proyecto Supabase
npm run dev
```

Abre en `http://localhost:5173`. El ingreso es con email y contraseña de
Supabase Auth. Las credenciales viven solo en `.env.local` / en las variables
de entorno del hosting, nunca en el repo.

Scripts: `npm run build` (tsc + vite), `npm run lint`, `npm test` (Vitest).

## Variables de entorno

| Variable | Qué es |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon) del proyecto |
| `VITE_USAR_SEED` | Solo desarrollo: carga pacientes ficticios. Se ignora en el build de producción. |

## Módulos

1. Ficha de paciente (`pacientes`)
2. Fotos y videos clínicos (`archivos_clinicos` + bucket `pacientes-fotos`)
3. Estudios y radiografías (`archivos_clinicos` + bucket `pacientes-estudios`)
4. Diagnóstico y plan de tratamiento, con historial (`diagnosticos`)
5. Presupuesto y control de pagos (`presupuestos`, `cuotas`, `mantenimiento_registros`), PDF con membrete
6. Seguimiento (`seguimiento`), con las fotos intra-tratamiento de cada fecha
7. Agenda: La Plata con bloques recurrentes (`bloques_horarios`), Tandil con jornadas puntuales (`jornadas_tandil`), turnos en `turnos`
8. Trámites pendientes (`tramites`)

Armonización facial figura como «Próximamente»: no se puede dar de alta ni tiene flujo propio todavía.

## Estructura

- `src/data/` — acceso a Supabase (una pieza por entidad) y hooks. Nombres de tablas y columnas en `constantes.ts`.
- `src/pages/` y `src/components/` — pantallas y piezas de UI.
- `src/lib/` — tipos, utilidades, lógica de agenda y generación del PDF.
- `sql/verificar-rls.sql` — chequeo de políticas RLS.

La base (tablas, RLS, buckets) se administra a mano en Supabase; este repo no
contiene migraciones.

## Deploy

Vercel (plan Pro: el plan Hobby no permite uso comercial). `vercel.json` ya
trae el rewrite para que las rutas del router funcionen al recargar. Cargar las
dos variables `VITE_SUPABASE_*` en el proyecto de Vercel.
