-- StudyFlow: número real de estudiantes registrados (para la página de inicio)
--
-- La tabla perfiles tiene RLS (cada persona solo ve su fila), así que nadie
-- puede contarla desde afuera. Esta función devuelve SOLO el total, sin
-- ningún dato personal, y es lo único que se expone sin iniciar sesión.

create or replace function public.contar_estudiantes()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.perfiles;
$$;

revoke all on function public.contar_estudiantes() from public;
-- Solo la llama el backend (server.js → /api/estadisticas) con la clave publicable.
grant execute on function public.contar_estudiantes() to anon;
