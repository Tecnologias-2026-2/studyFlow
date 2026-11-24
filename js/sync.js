/* =========================================================
   StudyFlow — Sincronización con Supabase
   (materias, tareas, subtareas, sesiones y ajustes del Pomodoro)

   - Al abrir una página de la app trae los datos de Supabase y la página
     se dibuja con ellos (si no hay conexión, usa la copia del navegador).
   - Cada cambio se guarda al instante en el navegador y se sube a Supabase
     unos milisegundos después. Si no hay internet, queda pendiente y se
     sube cuando vuelve la conexión.
   - Al volver a la pestaña se traen los cambios hechos en otro dispositivo.
   - La primera vez que una cuenta sincroniza, lo que ya tenía en este
     navegador se sube a Supabase (no se pierde nada).
   - RLS en Supabase hace que cada persona solo pueda tocar sus filas.

   Requiere store.js (SF), cuentas.js (SFCuentas) y supabase-config.js.
   Sin Supabase configurado no hace nada (modo local).
   ========================================================= */

window.SFSync = (() => {
  'use strict';

  const SF = window.SF;
  const Cuentas = window.SFCuentas;
  const CLAVE_BASE = (email) => `studyflow:sincronizado:${email}`;
  const ESPERA_SUBIDA = 300;      // ms entre el cambio y la subida
  const ESPERA_MAXIMA = 6000;     // ms máximos esperando a Supabase al abrir

  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const TABLAS = ['materias', 'tareas', 'subtareas', 'sesiones_pomodoro'];

  let estado = 'inactivo';        // inactivo | sincronizando | al-dia | pendiente | error
  let usuarioId = null;
  let temporizador = null;
  let subiendo = null;
  let otraVez = false;
  let avisado = false;

  const activo = () => {
    const user = SF.currentUser();
    return Boolean(Cuentas && Cuentas.MODO === 'supabase' && user && user.provider === 'supabase');
  };

  function cambiarEstado(nuevo) {
    estado = nuevo;
    document.documentElement.dataset.sync = nuevo;
    document.dispatchEvent(new CustomEvent('sf:sync', { detail: { estado } }));
  }

  /* ---------- Conversión entre la app y las filas de Supabase ---------- */
  const iso = (valor) => {
    if (valor === null || valor === undefined || valor === '') return null;
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
  };
  const ms = (valor) => { const t = Date.parse(valor); return Number.isNaN(t) ? Date.now() : t; };
  const entre = (n, min, max, defecto) => {
    const v = Math.round(Number(n));
    return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : defecto;
  };
  const texto = (v, max) => String(v ?? '').slice(0, max);

  /** Datos de la app → filas (por tabla, indexadas por id). */
  function aFilas(d, uid) {
    const filas = { materias: {}, tareas: {}, subtareas: {}, sesiones_pomodoro: {}, ajustes: null };
    d.subjects.forEach((m) => {
      filas.materias[m.id] = {
        id: m.id, usuario_id: uid, nombre: texto(m.name, 80) || 'Materia', profesor: texto(m.teacher, 80),
        emoji: texto(m.emoji || '📚', 16), color: texto(m.color || 'red', 20), creado_en: iso(m.createdAt || Date.now())
      };
    });
    d.tasks.forEach((t) => {
      if (!filas.materias[t.subjectId]) return; // en Supabase toda tarea tiene materia
      filas.tareas[t.id] = {
        id: t.id, usuario_id: uid, materia_id: t.subjectId, titulo: texto(t.title, 200) || 'Tarea',
        prioridad: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
        fecha_limite: t.dueDate || null, hora_limite: t.dueTime ? t.dueTime.slice(0, 5) : null,
        etiquetas: Array.isArray(t.tags) ? t.tags.slice(0, 20).map((x) => texto(x, 40)) : [],
        notas: texto(t.notes, 4000), completada: Boolean(t.done), completada_en: t.done ? iso(t.completedAt) : null,
        creado_en: iso(t.createdAt || Date.now())
      };
      (t.subtasks || []).forEach((s, i) => {
        filas.subtareas[s.id] = {
          id: s.id, usuario_id: uid, tarea_id: t.id, texto: texto(s.text, 200) || 'Subtarea',
          completada: Boolean(s.done), posicion: i
        };
      });
    });
    d.pomodoro.sessions.forEach((s) => {
      if (!s.id) return;
      filas.sesiones_pomodoro[s.id] = {
        id: s.id, usuario_id: uid, fecha: s.date, minutos: entre(s.minutes, 1, 600, 25), terminada_en: iso(s.at || Date.now())
      };
    });
    const a = d.pomodoro.settings;
    filas.ajustes = {
      usuario_id: uid,
      enfoque: entre(a.focus, 1, 180, 25), descanso_corto: entre(a.short, 1, 60, 5), descanso_largo: entre(a.long, 1, 120, 20),
      ciclos: entre(a.cycles, 1, 12, 4), meta_diaria: entre(a.dailyGoal, 1, 24, 4),
      sonido: Boolean(a.sound), notificaciones: Boolean(a.notify), auto_iniciar: Boolean(a.auto),
      temporizador: d.pomodoro.timer || null
    };
    return filas;
  }

  /** Filas de Supabase → datos de la app. */
  function deFilas(r) {
    const d = SF.emptyData();
    d.subjects = r.materias
      .map((m) => ({ id: m.id, name: m.nombre, teacher: m.profesor || '', emoji: m.emoji, color: m.color, createdAt: ms(m.creado_en) }))
      .sort((x, y) => x.createdAt - y.createdAt);
    const subtareas = {};
    r.subtareas.slice().sort((x, y) => x.posicion - y.posicion).forEach((s) => {
      (subtareas[s.tarea_id] = subtareas[s.tarea_id] || []).push({ id: s.id, text: s.texto, done: s.completada });
    });
    d.tasks = r.tareas
      .map((t) => ({
        id: t.id, title: t.titulo, subjectId: t.materia_id, priority: t.prioridad,
        dueDate: t.fecha_limite || '', dueTime: t.hora_limite ? t.hora_limite.slice(0, 5) : '',
        tags: t.etiquetas || [], notes: t.notas || '', subtasks: subtareas[t.id] || [],
        done: t.completada, completedAt: t.completada ? iso(t.completada_en) : null, createdAt: ms(t.creado_en)
      }))
      .sort((x, y) => x.createdAt - y.createdAt);
    d.pomodoro.sessions = r.sesiones_pomodoro
      .map((s) => ({ id: s.id, date: s.fecha, minutes: s.minutos, at: ms(s.terminada_en) }))
      .sort((x, y) => x.at - y.at);
    if (r.ajustes) {
      const a = r.ajustes;
      Object.assign(d.pomodoro.settings, {
        focus: a.enfoque, short: a.descanso_corto, long: a.descanso_largo, cycles: a.ciclos, dailyGoal: a.meta_diaria,
        sound: a.sonido, notify: a.notificaciones, auto: a.auto_iniciar
      });
      d.pomodoro.timer = a.temporizador || null;
    }
    return d;
  }

  /** Datos que se crearon antes de la sincronización: ids a uuid y sesiones con id. */
  function prepararLocales(d) {
    const nuevos = {};
    const idDe = (id) => (UUID.test(id) ? id : (nuevos[id] = nuevos[id] || SF.uid()));
    d.subjects.forEach((m) => { m.id = idDe(m.id); });
    d.tasks.forEach((t) => {
      t.id = idDe(t.id);
      t.subjectId = t.subjectId ? idDe(t.subjectId) : '';
      (t.subtasks || []).forEach((s) => { s.id = idDe(s.id); });
    });
    d.tasks = d.tasks.filter((t) => d.subjects.some((m) => m.id === t.subjectId));
    d.pomodoro.sessions.forEach((s) => { if (!s.id || !UUID.test(s.id)) s.id = SF.uid(); });
    return d;
  }

  const vacio = (filas) => TABLAS.every((t) => !Object.keys(filas[t]).length) && !filas.ajustes;
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  /* ---------- Copia de lo último que quedó en Supabase ---------- */
  function leerBase(email) {
    try { return JSON.parse(localStorage.getItem(CLAVE_BASE(email))); } catch (error) { return null; }
  }
  function guardarBase(email, filas) {
    try { localStorage.setItem(CLAVE_BASE(email), JSON.stringify(filas)); } catch (error) { /* nada */ }
  }

  /* ---------- Bajar ---------- */
  async function cliente() {
    const sb = await Cuentas.cliente();
    const { data } = await sb.auth.getSession();
    if (!data.session) throw new Error('sin-sesion');
    usuarioId = data.session.user.id;
    return sb;
  }

  async function bajar(sb) {
    const consultas = TABLAS.map((t) => sb.from(t).select('*'));
    consultas.push(sb.from('ajustes_pomodoro').select('*').maybeSingle());
    const res = await Promise.all(consultas);
    const fallo = res.find((r) => r.error);
    if (fallo) throw fallo.error;
    return {
      materias: res[0].data, tareas: res[1].data, subtareas: res[2].data, sesiones_pomodoro: res[3].data, ajustes: res[4].data
    };
  }

  /* ---------- Subir solo lo que cambió ---------- */
  async function aplicar(sb, antes, ahora) {
    const base = antes || { materias: {}, tareas: {}, subtareas: {}, sesiones_pomodoro: {}, ajustes: null };
    const cambios = (t) => Object.values(ahora[t]).filter((fila) => !igual(fila, base[t][fila.id]));
    const borrados = (t) => Object.keys(base[t]).filter((id) => !ahora[t][id]);
    const revisar = (r) => { if (r.error) throw r.error; };

    // Primero lo que otros necesitan (materia → tarea → subtarea)
    for (const t of TABLAS) {
      const filas = cambios(t);
      if (filas.length) revisar(await sb.from(t).upsert(filas, { onConflict: 'id' }));
    }
    if (ahora.ajustes && !igual(ahora.ajustes, base.ajustes)) {
      revisar(await sb.from('ajustes_pomodoro').upsert(ahora.ajustes, { onConflict: 'usuario_id' }));
    }
    // Después lo borrado (subtarea → tarea → materia)
    for (const t of TABLAS.slice().reverse()) {
      const ids = borrados(t);
      if (ids.length) revisar(await sb.from(t).delete().in('id', ids));
    }
  }

  function pendiente(email) {
    const base = leerBase(email);
    return !base || !igual(base, aFilas(SF.data(), usuarioId || base.ajustes?.usuario_id));
  }

  async function subir() {
    if (!activo()) return;
    if (subiendo) { otraVez = true; return subiendo; }
    const email = SF.currentUser().email;
    subiendo = (async () => {
      try {
        const sb = await cliente();
        const ahora = aFilas(SF.data(), usuarioId);
        const base = leerBase(email);
        if (!base || !igual(base, ahora)) {
          cambiarEstado('sincronizando');
          await aplicar(sb, base, ahora);
          guardarBase(email, ahora);
        }
        cambiarEstado('al-dia');
        avisado = false;
      } catch (error) {
        cambiarEstado(navigator.onLine === false ? 'pendiente' : 'error');
        console.warn('StudyFlow: no se pudo guardar en Supabase:', error.message || error);
        if (!avisado && window.UI && window.UI.toast) {
          avisado = true;
          window.UI.toast('Sin conexión con el servidor: tus cambios quedan guardados aquí y se subirán solos.', 'error');
        }
        clearTimeout(temporizador);
        temporizador = setTimeout(subir, 15000);
      } finally {
        subiendo = null;
        if (otraVez) { otraVez = false; subir(); }
      }
    })();
    return subiendo;
  }

  function programarSubida() {
    if (!activo()) return;
    cambiarEstado('pendiente');
    clearTimeout(temporizador);
    temporizador = setTimeout(subir, ESPERA_SUBIDA);
  }

  /* ---------- Sincronizar: sube lo pendiente y trae lo del servidor ---------- */
  async function sincronizar() {
    if (!activo()) return;
    const email = SF.currentUser().email;
    cambiarEstado('sincronizando');
    try {
      const sb = await cliente();
      const base = leerBase(email);

      if (!base) {
        // Primera vez en este navegador: ¿qué hay en el servidor?
        const servidor = await bajar(sb);
        const filasServidor = aFilas(deFilas(servidor), usuarioId);
        const local = prepararLocales(SF.data());
        const filasLocales = aFilas(local, usuarioId);
        if (vacio({ ...filasServidor, ajustes: servidor.ajustes }) && !SF.isNewUser()) {
          // La cuenta aún no tenía nada en Supabase: se sube lo de este navegador
          SF.reemplazarDatos(email, local, true);
          await aplicar(sb, null, filasLocales);
          guardarBase(email, filasLocales);
          cambiarEstado('al-dia');
          return;
        }
        // Ya había datos en Supabase (otro dispositivo): esos mandan
        SF.reemplazarDatos(email, deFilas(servidor), true);
        guardarBase(email, filasServidor);
        cambiarEstado('al-dia');
        return;
      } else if (pendiente(email)) {
        await subir();
      }

      const datos = deFilas(await bajar(sb));
      const filas = aFilas(datos, usuarioId);
      SF.reemplazarDatos(email, datos, true);
      guardarBase(email, filas);
      cambiarEstado('al-dia');
    } catch (error) {
      cambiarEstado(navigator.onLine === false ? 'pendiente' : 'error');
      if (error.message !== 'sin-sesion') console.warn('StudyFlow: no se pudo sincronizar con Supabase:', error.message || error);
    }
  }

  /** Antes de cerrar sesión: sube lo pendiente y borra la copia local. */
  async function cerrar() {
    const user = SF.currentUser();
    if (!user || user.provider !== 'supabase') return;
    clearTimeout(temporizador);
    try { await Promise.race([subir(), new Promise((r) => setTimeout(r, 4000))]); } catch (error) { /* nada */ }
    SF.borrarDatosLocales(user.email);
    try { localStorage.removeItem(CLAVE_BASE(user.email)); } catch (error) { /* nada */ }
  }

  /* ---------- Arranque ---------- */
  if (activo()) {
    // La página espera los datos del servidor (máximo unos segundos)
    SF.esperar(Promise.race([sincronizar(), new Promise((r) => setTimeout(r, ESPERA_MAXIMA))]));
    SF.alGuardar(programarSubida);

    // Al volver a la pestaña: traer lo que se hizo en otro dispositivo
    let ultima = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (!activo()) return;
      if (document.visibilityState === 'hidden') { if (estado === 'pendiente') subir(); return; }
      if (Date.now() - ultima < 5000) return;
      ultima = Date.now();
      sincronizar().then(() => document.dispatchEvent(new CustomEvent('sf:change')));
    });
    window.addEventListener('online', () => { if (activo()) subir(); });
  }

  return { sincronizar, subir, cerrar, estado: () => estado, _aFilas: aFilas, _deFilas: deFilas };
})();
