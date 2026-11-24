# StudyFlow

Plataforma de productividad académica para universitarios: Pomodoro, gestión
de materias y tareas, estadísticas, logros y metas semanales.

Este proyecto empezó como un **prototipo de diseño y maquetación** basado en el
diseño de Figma de StudyFlow. Ahora tiene un **backend en Node.js (Express)** que
se publica en Render y entrega datos por API. Todavía no usa base de datos: las
cuentas, materias y tareas siguen guardándose en el navegador.

## Tecnologías

- HTML5 semántico
- CSS3 (variables, Flexbox, Grid, media queries)
- JavaScript vanilla (sin frameworks ni librerías)

## Estructura del proyecto

```
StudyFlow/
│
├── index.html                  Punto de entrada (redirige a html/inicio.html)
│
├── html/
│   ├── inicio.html              Landing page (hero, características, testimonio)
│   ├── iniciar-sesion.html      Iniciar sesión con correo y contraseña
│   ├── crear-cuenta.html        Crear cuenta (confirma «Cuenta creada con éxito»)
│   ├── recuperar-contrasena.html  Olvidé mi contraseña
│   ├── terminos.html            Términos y condiciones
│   ├── privacidad.html          Política de privacidad
│   ├── dashboard.html           Panel principal (Inicio)
│   ├── tareas.html              Mis Tareas: crear, editar, subtareas, filtros
│   ├── materias.html            Mis Materias: crear, editar, profesor, buscador, progreso
│   ├── pomodoro.html            Temporizador Pomodoro y resumen del día
│   ├── calendario.html          Calendario con detalle del día
│   └── perfil.html              Mi perfil y seguridad (contraseña)
│
├── css/
│   ├── styles.css               General: variables, reset, accesibilidad, botones, navbar, footer
│   ├── inicio.css               Landing: hero, mockup, características, testimonio
│   ├── components.css           Compartido: stats, formularios, modal, pestañas, chips, avisos
│   ├── auth.css                 Iniciar sesión / crear cuenta / recuperar contraseña
│   ├── mockup.css               Vista previa de la app (landing y acceso)
│   ├── legal.css                Términos y privacidad
│   ├── app.css                  App: sidebar, barra superior, menús desplegables
│   ├── calendar.css              Componente calendario (reutilizado en dashboard y Calendario)
│   ├── dashboard.css            Dashboard: sesión, progreso, materias, tareas
│   ├── tareas.css               Mis Tareas: tarjetas, filtros, columna lateral
│   ├── materias.css             Materias: tarjetas y selector de ícono/color
│   ├── pomodoro.css             Pomodoro: temporizador, configuración, resumen
│   ├── calendario.css           Página Calendario: layout y panel del día
│   └── perfil.css               Mi perfil: tarjeta y formularios
│
├── js/
│   ├── icons.js                 Iconos SVG reutilizables
│   ├── store.js                 Capa de datos: cuentas, sesión, materias, tareas y Pomodoro (localStorage)
│   ├── ui.js                    Utilidades: avisos, diálogos, validación de formularios
│   ├── main.js                  Landing: menú móvil, scroll suave, carrusel de testimonios
│   ├── mockup.js                Vista previa de la app (landing y acceso)
│   ├── auth.js                  Crear cuenta, iniciar sesión y recuperar contraseña
│   ├── app.js                   App: sidebar, buscador, notificaciones, cerrar sesión
│   ├── dashboard.js             Panel principal
│   ├── tareas.js                Mis Tareas
│   ├── materias.js              Materias
│   ├── pomodoro.js              Temporizador Pomodoro
│   ├── calendar.js              Componente calendario
│   ├── calendario.js            Página Calendario (panel del día)
│   └── perfil.js                Mi perfil y seguridad
│
├── assets/
│   ├── images/
│   ├── icons/                   favicon.svg
│   └── logo/                    studyflow-mark.svg
│
└── README.md
```

## Cómo ejecutarlo localmente

1. Abre la carpeta `StudyFlow/` en Visual Studio Code.
2. Instala la extensión **Live Server**.
3. Clic derecho sobre `index.html` → **Open with Live Server**.

`index.html` redirige a `html/inicio.html`. Todas las rutas son relativas, por lo
que también funciona en GitHub Pages u otro hosting estático (incluso si el sitio
se publica en una subcarpeta).

## Cómo funciona (todo en el navegador, sin backend)

Es un prototipo: no hay servidor ni base de datos. Todo se guarda en `localStorage`,
por cuenta (identificada por su correo). Los datos de una cuenta nunca se mezclan con
los de otra, y **una cuenta nueva siempre empieza en cero**: sin materias, sin tareas,
sin sesiones de Pomodoro.

- **Crear cuenta** (`crear-cuenta.html`): nombre, correo y contraseña (mínimo 8
  caracteres), con validación en pantalla. Los botones de **Google** y **Microsoft**
  simulan el acceso: piden un correo (y opcionalmente un nombre) y crean o inician la
  cuenta con ese correo — no se conectan a un proveedor real.
- **Iniciar sesión** (`iniciar-sesion.html`): valida contra la cuenta guardada.
  **¿Olvidaste tu contraseña?** lleva a `recuperar-contrasena.html`, donde se verifica
  el correo y se define una nueva contraseña directamente (aquí no hay envío real de
  correos: es la simulación equivalente dentro de un prototipo sin backend).
- Visitar cualquier página interna (`dashboard.html`, `tareas.html`, etc.) sin sesión
  iniciada redirige automáticamente a `iniciar-sesion.html`.
- **Cerrar sesión** está al final del menú lateral en todas las páginas internas.
- **Ver Demo** en la landing (`dashboard.html?demo=1`) crea, solo si no hay ninguna
  sesión activa, una cuenta de ejemplo con materias, tareas y racha ya cargadas —así
  se ve StudyFlow "en uso" sin afectar cuentas reales.

## Navegación entre páginas

- Landing → **Iniciar Sesión** abre `iniciar-sesion.html`; **Comenzar Gratis** /
  **Comienza Gratis** abren `crear-cuenta.html`; **Ver Demo** abre el panel con datos
  de ejemplo.
- El sidebar de las páginas internas conecta Inicio, Tareas, Calendario, Pomodoro,
  Materias y Perfil entre sí, más **Cerrar sesión**.
- El buscador de la barra superior busca en tareas y materias en tiempo real.
- La campana muestra recordatorios (tareas vencidas, de hoy y de mañana).

## Datos de ejemplo (solo en la cuenta Demo)

La cuenta creada por **Ver Demo** usa la fecha de prototipo **5 de agosto de 2026**
como referencia y materias/tareas de ejemplo, definidas en `js/store.js`
(función `demoData`). Cualquier otra cuenta empieza completamente vacía.

## Añadir una página nueva

1. Copia una página existente similar (por ejemplo `materias.html`) como base en `html/`.
2. Si necesita estilos propios, crea `css/<pagina>.css` y añádelo al `<head>`.
3. Si necesita lógica propia, crea `js/<pagina>.js` (usa `SF.onReady(...)` para esperar
   los datos) y añádelo antes de `</body>`.
4. En `js/app.js`, agrega la entrada correspondiente al arreglo `NAV` para que el
   enlace del sidebar apunte a la nueva página.

## Prototipo de Figma

`https://www.figma.com/design/s1VlpQj5Kp7ybpq2Xs0jR0/Studyflow`


## Backend (Render)

`server.js` sirve la página y una API JSON con los datos de la carpeta `data/`:

| Ruta | Qué devuelve | Dónde se usa |
| --- | --- | --- |
| `GET /api/salud` | Estado del servidor | Render (health check) |
| `GET /api/eventos?mes=AAAA-MM` | Calendario académico: festivos, parciales, entregas | Calendario y Dashboard |
| `GET /api/consejos` / `GET /api/consejos/hoy` | Consejos de estudio / el del día | Dashboard |

Para verlo en el navegador: clic derecho → **Inspeccionar** → pestaña **Network
(Red)** → filtra por `api`. Cada petición también queda en **Render → Logs**
(`GET /api/eventos?mes=2026-11 → 200 (2.5 ms)`).

Probar en el computador:

```bash
npm install
npm start        # http://localhost:3000
```

Publicar en Render: **New → Web Service** → este repositorio → Build `npm install`
→ Start `npm start` (o usar `render.yaml`).

## Accesibilidad

- Revisado con las reglas de Chrome Lighthouse/axe-core (WCAG 2.2 AA y buenas
  prácticas): contraste de colores, nombres accesibles, orden de títulos,
  tamaño mínimo de objetivos táctiles, landmarks únicos.
- Botón flotante de accesibilidad (`js/accesibilidad.js`): perfiles (visión baja,
  epilepsia, TDAH, dislexia), tamaño de texto, alto contraste, modo oscuro,
  resaltar enlaces y títulos, fuente legible, pausar animaciones, guía de lectura
  y cursor grande.

## Cookies

`js/cookies.js` muestra un aviso la primera vez. Si se aceptan, guarda nombre,
correo, carrera y último acceso; **todas las cookies caducan a los 30 días**
(también la que recuerda la decisión). Nunca se guardan contraseñas. Se pueden
cambiar desde «Configurar cookies» (pie de página, páginas legales y Mi perfil).

## Flujo de acceso

1. **Crear cuenta**: se valida el formulario, se guarda la cuenta (la contraseña
   se guarda cifrada con SHA-256 y sal) y se vuelve a leer para comprobar que
   quedó guardada. Solo entonces aparece **«Cuenta creada con éxito»**.
2. **Iniciar sesión**: el correo llega escrito; con la contraseña correcta se
   entra al panel.
3. Las páginas de la app (Materias, Inicio, Tareas, Calendario, Pomodoro y
   Perfil) no se muestran sin sesión: redirigen a «Iniciar sesión».

## Tareas, subtareas y calendario

- Las tareas con subtareas tienen una **flecha** que las despliega o contrae.
- El **Calendario** muestra en el panel de cada día las tareas y, con su flecha,
  sus subtareas; marcarlas ahí se guarda en el mismo lugar que en Tareas.
- La **Racha** (barra superior y tarjeta del panel) lleva a **Tareas**.

> Limitación: las cuentas y tareas se guardan en el navegador (localStorage).
> No hay base de datos todavía, así que no se comparten entre dispositivos.

## Supabase (solo cuentas)

- `supabase/migrations/20261124050000_perfiles.sql`: tabla `perfiles` (nombre,
  apellido, universidad, carrera, semestre) con RLS: cada usuario solo ve y
  edita lo suyo. El perfil se crea solo al registrarse.
- El correo y la contraseña los guarda **Supabase Auth** (contraseña cifrada);
  no hay ninguna columna de contraseña en nuestras tablas.
- `js/supabase-config.js`: URL y clave publishable del proyecto. Con la clave
  vacía, las cuentas siguen en el navegador (modo local).
- `js/cuentas.js`: registro, inicio de sesión, cerrar sesión, perfil, cambio y
  recuperación de contraseña, contra Supabase o en modo local.
- Materias, tareas y Pomodoro siguen en el navegador.
