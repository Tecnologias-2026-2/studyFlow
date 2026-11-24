-- StudyFlow: cuentas de usuario en Supabase
--
-- Supabase guarda SOLO los datos de la cuenta:
--   * correo y contraseña → Supabase Auth (tabla interna auth.users).
--     La contraseña nunca está en una tabla nuestra: Supabase la guarda
--     cifrada (bcrypt) y nadie puede leerla.
--   * nombre, apellido y datos del perfil → tabla public.perfiles.
-- Materias, tareas, subtareas y Pomodoro: ver 20261124064000_datos_academicos.sql.

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nombre text not null default '',
  apellido text not null default '',
  universidad text not null default '',
  carrera text not null default '',
  semestre smallint check (semestre between 1 and 12),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

alter table public.perfiles enable row level security;

-- Cada persona solo ve y edita su propio perfil
drop policy if exists "Cada usuario lee su perfil" on public.perfiles;
create policy "Cada usuario lee su perfil"
on public.perfiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Cada usuario edita su perfil" on public.perfiles;
create policy "Cada usuario edita su perfil"
on public.perfiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- El correo y el id no se cambian desde la página: solo estas columnas
revoke all on table public.perfiles from anon, authenticated;
grant select on table public.perfiles to authenticated;
grant update (nombre, apellido, universidad, carrera, semestre) on table public.perfiles to authenticated;

-- Al registrarse alguien en Supabase Auth se crea su perfil automáticamente
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, email, nombre, apellido)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'apellido', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.crear_perfil() from public, anon, authenticated;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
after insert on auth.users
for each row execute function public.crear_perfil();

-- Fecha de última modificación
create or replace function public.perfiles_actualizado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

drop trigger if exists perfiles_actualizado on public.perfiles;
create trigger perfiles_actualizado
before update on public.perfiles
for each row execute function public.perfiles_actualizado();
