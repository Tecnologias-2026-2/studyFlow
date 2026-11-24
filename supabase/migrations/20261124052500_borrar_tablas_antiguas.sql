-- StudyFlow: se eliminan las tablas de una versión anterior que la app ya no usa.
-- Las cuentas viven en Supabase Auth + public.perfiles (ver 20261124050000_perfiles.sql).
-- Antes de borrarlas se guardó un respaldo (sin contraseñas) fuera de la base de datos.

drop function if exists public.incrementar_tareas(integer);
drop function if exists public.sumar_puntos(integer, integer);
drop function if exists public.incrementar_racha(integer);
drop function if exists public.actualizar_mejor_racha(integer);

drop table if exists public.tareas;
drop table if exists public.materias;
drop table if exists public.sesiones_pomodoro;
drop table if exists public.logros;
drop table if exists public.notificaciones;
drop table if exists public.usuarios;
