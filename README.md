# StudyFlow

Plataforma de productividad académica para universitarios: materias, tareas con
subtareas, calendario, temporizador Pomodoro y perfil.

- **Producción:** https://studyflow-m1sq.onrender.com (Render, plan gratuito)
- **Diseño:** https://www.figma.com/design/s1VlpQj5Kp7ybpq2Xs0jR0/Studyflow

## Arquitectura en una línea

HTML + CSS + JavaScript sin frameworks, servido por un backend **Node.js + Express 5**
(`server.js`) que además entrega una **API JSON pública** (`/api/...`). Las cuentas y
los datos de cada estudiante viven en **Supabase** (Auth + PostgreSQL con RLS), al que
el navegador habla directamente con la librería oficial `@supabase/supabase-js`.

| Qué | Dónde vive | Quién lo maneja |
| --- | --- | --- |
| Páginas, estilos, scripts | Este repositorio | `server.js` (archivos estáticos) |
| Calendario académico y consejos | `data/eventos.json`, `data/consejos.json` | `server.js` → `GET /api/...` |
| Correo y contraseña | Supabase Auth | `js/cuentas.js` |
| Perfil | Tabla `perfiles` | `js/cuentas.js` |
| Materias, tareas, subtareas, Pomodoro | Tablas `materias`, `tareas`, `subtareas`, `sesiones_pomodoro`, `ajustes_pomodoro` | `js/store.js` (copia local) + `js/sync.js` (sincronización) |

## Estructura

```
server.js                 Backend Express: API, librería de Supabase, archivos estáticos
package.json              Dependencias: express, @supabase/supabase-js
render.yaml               Configuración del servicio en Render
data/                     JSON que sirve la API (no se puede descargar directamente)
supabase/migrations/      Esquema de la base de datos (SQL)
index.html                Redirige a html/inicio.html
html/                     Una página por sección
css/                      styles.css (base) + un archivo por sección
js/
  store.js                Estado de la app (SF): materias, tareas, Pomodoro, sesión
  supabase-config.js      URL y clave pública (publishable) de Supabase
  cuentas.js              Registro, login, perfil, contraseña (Supabase Auth)
  sync.js                 Sincroniza store.js con las tablas de Supabase
  api.js                  Cliente de la API propia (/api/eventos, /api/consejos)
  app.js                  Menú lateral, barra superior, guardia de sesión
  auth.js                 Formularios de crear cuenta, iniciar sesión, recuperar
  dashboard.js, tareas.js, materias.js, calendar.js, calendario.js,
  pomodoro.js, perfil.js  Lógica de cada página
  ui.js, icons.js         Avisos, diálogos, validación, iconos
  cookies.js              Aviso de cookies (30 días, nunca contraseñas)
  accesibilidad.js        Panel de accesibilidad
  main.js, mockup.js      Landing y vista previa decorativa
```

## Ejecutar en local

```bash
npm install
npm start          # http://localhost:3000
```

Hace falta el servidor (no basta con abrir el HTML): sirve `/api/...` y
`/vendor/supabase.js`. Con `js/supabase-config.js` vacío (`key: ''`) la app funciona en
**modo local**: todo se guarda en `localStorage`, sin Supabase.

## API propia (solo lectura)

| Método y ruta | Respuesta | Errores |
| --- | --- | --- |
| `GET /api/salud` | Estado del servidor | — |
| `GET /api/eventos?mes=AAAA-MM&tipo=...` | Eventos del calendario académico | 400 si `mes` o `tipo` no son válidos |
| `GET /api/consejos` | Todos los consejos | 500 si el JSON no se puede leer |
| `GET /api/consejos/hoy` | Consejo del día (hora de Colombia) | 500 si el JSON no se puede leer |
| Otros métodos en esas rutas | — | 405 (`Allow: GET, HEAD`) |
| Cualquier otra `/api/...` | — | 404 JSON |

Verlo en el navegador: **Inspeccionar → Network (Red)**, filtro `api`. Las peticiones a
Supabase aparecen con el dominio `*.supabase.co` (`/auth/v1/...`, `/rest/v1/...`). Cada
llamada a `/api` queda también en **Render → Logs** (`GET /api/eventos?mes=2026-11 → 200 (1.1 ms)`).

## Base de datos

Ver `supabase/migrations/`. Todas las tablas tienen RLS: cada persona solo lee y
modifica sus filas (`usuario_id = auth.uid()`); sin sesión no se puede leer nada.

## Documentación técnica completa

La auditoría técnica (arquitectura, endpoints, base de datos, Network, errores y
flujogramas) está en el documento «StudyFlow — Auditoría técnica y documentación».
