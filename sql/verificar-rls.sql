-- Verificación de seguridad de la base: RLS + permisos de tabla + buckets.
-- Sólo lee el catálogo, no modifica nada. Correr en el SQL Editor de Supabase
-- (cada bloque por separado: el editor muestra sólo el resultado del último).
-- Cuándo correrlo: al terminar cada fase que cree tablas, y en la Fase 7.
--
-- Por qué los dos chequeos: RLS con políticas correctas NO alcanza si el rol
-- `authenticated` no tiene GRANT sobre la tabla (da "permission denied" igual).

-- ============================================================
-- 1) Tablas del esquema public
--    Esperado: 11 filas, todas con estado = 'OK'.
--    FALLA   = RLS apagado, falta algún permiso de authenticated,
--              o `anon` (usuario sin login) tiene algún permiso.
--    REVISAR = RLS activo pero sin ninguna política (nadie podría leer).
-- ============================================================
select * from (
select
  c.relname                                                   as tabla,
  c.relrowsecurity                                            as rls_activo,
  (select count(*) from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname) as politicas,
  has_table_privilege('authenticated', c.oid, 'SELECT')       as auth_select,
  has_table_privilege('authenticated', c.oid, 'INSERT')       as auth_insert,
  has_table_privilege('authenticated', c.oid, 'UPDATE')       as auth_update,
  has_table_privilege('authenticated', c.oid, 'DELETE')       as auth_delete,
  (   has_table_privilege('anon', c.oid, 'SELECT')
   or has_table_privilege('anon', c.oid, 'INSERT')
   or has_table_privilege('anon', c.oid, 'UPDATE')
   or has_table_privilege('anon', c.oid, 'DELETE'))           as anon_tiene_permisos,
  case
    when not c.relrowsecurity                                   then 'FALLA: RLS apagado'
    when not (   has_table_privilege('authenticated', c.oid, 'SELECT')
             and has_table_privilege('authenticated', c.oid, 'INSERT')
             and has_table_privilege('authenticated', c.oid, 'UPDATE')
             and has_table_privilege('authenticated', c.oid, 'DELETE'))
                                                                then 'FALLA: faltan permisos de authenticated'
    when (   has_table_privilege('anon', c.oid, 'SELECT')
          or has_table_privilege('anon', c.oid, 'INSERT')
          or has_table_privilege('anon', c.oid, 'UPDATE')
          or has_table_privilege('anon', c.oid, 'DELETE'))      then 'FALLA: anon tiene permisos'
    when not exists (select 1 from pg_policies p
                      where p.schemaname = 'public' and p.tablename = c.relname)
                                                                then 'REVISAR: RLS sin políticas'
    else 'OK'
  end                                                         as estado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')           -- tablas (incluye particionadas)
) t
order by (estado = 'OK'), tabla;       -- primero las que tienen problemas

-- ============================================================
-- 2) Buckets de Storage
--    Esperado: los tres privados (publico = false).
--    Los archivos se leen con URL firmada, nunca por URL pública.
-- ============================================================
select
  b.id     as bucket,
  b.public as publico,
  case when b.public then 'FALLA: bucket público' else 'OK' end as estado
from storage.buckets b
order by b.id;

-- ============================================================
-- 3) Políticas sobre storage.objects (quién puede leer/escribir archivos)
--    Esperado: políticas para `authenticated`, ninguna para `anon`/`public`.
-- ============================================================
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
