-- StudyFlow: materias, tareas, subtareas y Pomodoro en Supabase
--
-- Cada fila pertenece a una persona (usuario_id = auth.uid()) y RLS hace
-- que nadie pueda leer, crear, cambiar ni borrar filas de otra cuenta.
-- Las llaves foráneas compuestas (id, usuario_id) impiden además colgar una
-- tarea de la materia de otra persona o una subtarea de la tarea de otra.
--
-- Los id (uuid) los genera la página (crypto.randomUUID) para poder guardar
-- primero en el navegador y sincronizar después.

-- ---------- Materias ----------
create table if not exists public.materias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  profesor text not null default '' check (char_length(profesor) <= 80),
  emoji text not null default '📚' check (char_length(emoji) <= 16),
  color text not null default 'red' check (char_length(color) <= 20),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (id, usuario_id)
);
create index if not exists materias_usuario_idx on public.materias (usuario_id);

-- ---------- Tareas (toda tarea pertenece a una materia) ----------
create table if not exists public.tareas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  materia_id uuid not null,
  titulo text not null check (char_length(titulo) between 1 and 200),
  prioridad text not null default 'medium' check (prioridad in ('high', 'medium', 'low')),
  fecha_limite date,
  hora_limite time,
  etiquetas text[] not null default '{}' check (cardinality(etiquetas) <= 20),
  notas text not null default '' check (char_length(notas) <= 4000),
  completada boolean not null default false,
  completada_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (id, usuario_id),
  foreign key (materia_id, usuario_id) references public.materias (id, usuario_id) on delete cascade
);
create index if not exists tareas_usuario_idx on public.tareas (usuario_id);
create index if not exists tareas_materia_idx on public.tareas (materia_id, usuario_id);

-- ---------- Subtareas ----------
create table if not exists public.subtareas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  tarea_id uuid not null,
  texto text not null check (char_length(texto) between 1 and 200),
  completada boolean not null default false,
  posicion integer not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  foreign key (tarea_id, usuario_id) references public.tareas (id, usuario_id) on delete cascade
);
create index if not exists subtareas_usuario_idx on public.subtareas (usuario_id);
create index if not exists subtareas_tarea_idx on public.subtareas (tarea_id, usuario_id);

-- ---------- Sesiones de Pomodoro terminadas (racha, horas de estudio) ----------
create table if not exists public.sesiones_pomodoro (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.perfiles (id) on delete cascade,
  fecha date not null,
  minutos smallint not null check (minutos between 1 and 600),
  terminada_en timestamptz not null default now()
);
create index if not exists sesiones_usuario_fecha_idx on public.sesiones_pomodoro (usuario_id, fecha);

-- ---------- Ajustes del Pomodoro y temporizador en curso (una fila por persona) ----------
create table if not exists public.ajustes_pomodoro (
  usuario_id uuid primary key default auth.uid() references public.perfiles (id) on delete cascade,
  enfoque smallint not null default 25 check (enfoque between 1 and 180),
  descanso_corto smallint not null default 5 check (descanso_corto between 1 and 60),
  descanso_largo smallint not null default 20 check (descanso_largo between 1 and 120),
  ciclos smallint not null default 4 check (ciclos between 1 and 12),
  meta_diaria smallint not null default 4 check (meta_diaria between 1 and 24),
  sonido boolean not null default false,
  notificaciones boolean not null default false,
  auto_iniciar boolean not null default false,
  temporizador jsonb,
  actualizado_en timestamptz not null default now()
);

-- ---------- Fecha de última modificación ----------
drop trigger if exists materias_actualizado on public.materias;
create trigger materias_actualizado before update on public.materias
for each row execute function public.perfiles_actualizado();
drop trigger if exists tareas_actualizado on public.tareas;
create trigger tareas_actualizado before update on public.tareas
for each row execute function public.perfiles_actualizado();
drop trigger if exists subtareas_actualizado on public.subtareas;
create trigger subtareas_actualizado before update on public.subtareas
for each row execute function public.perfiles_actualizado();
drop trigger if exists ajustes_pomodoro_actualizado on public.ajustes_pomodoro;
create trigger ajustes_pomodoro_actualizado before update on public.ajustes_pomodoro
for each row execute function public.perfiles_actualizado();

-- ---------- RLS: cada persona solo toca sus propias filas ----------
do $$
declare t text;
begin
  foreach t in array array['materias', 'tareas', 'subtareas', 'sesiones_pomodoro', 'ajustes_pomodoro'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);

    execute format('drop policy if exists "Cada usuario lee lo suyo" on public.%I', t);
    execute format('create policy "Cada usuario lee lo suyo" on public.%I for select to authenticated using ((select auth.uid()) = usuario_id)', t);
    execute format('drop policy if exists "Cada usuario crea lo suyo" on public.%I', t);
    execute format('create policy "Cada usuario crea lo suyo" on public.%I for insert to authenticated with check ((select auth.uid()) = usuario_id)', t);
    execute format('drop policy if exists "Cada usuario edita lo suyo" on public.%I', t);
    execute format('create policy "Cada usuario edita lo suyo" on public.%I for update to authenticated using ((select auth.uid()) = usuario_id) with check ((select auth.uid()) = usuario_id)', t);
    execute format('drop policy if exists "Cada usuario borra lo suyo" on public.%I', t);
    execute format('create policy "Cada usuario borra lo suyo" on public.%I for delete to authenticated using ((select auth.uid()) = usuario_id)', t);
  end loop;
end $$;
