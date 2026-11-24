/* =========================================================
   StudyFlow — Cuentas de usuario

   Con Supabase configurado (js/supabase-config.js):
     - El correo y la contraseña los guarda Supabase Auth (cifrada).
     - Nombre, apellido, universidad, carrera y semestre van a la tabla
       "perfiles" de Supabase.
     - Materias, tareas, subtareas y Pomodoro van a sus tablas de Supabase
       (js/sync.js); el navegador guarda una copia para funcionar sin conexión.
   Sin Supabase configurado: todo queda en el navegador (modo local).

   Requiere store.js (window.SF).
   ========================================================= */

window.SFCuentas = (() => {
  'use strict';

  const SF = window.SF;
  const config = window.SF_SUPABASE || {};
  const MODO = config.url && config.key ? 'supabase' : 'local';
  const ORIGEN = window.location.origin;

  // La librería oficial de Supabase la sirve nuestro backend (GET /vendor/supabase.js).
  // Si falla (sin conexión), el siguiente intento vuelve a pedirla.
  function cargarLibreria() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve(window.supabase);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/vendor/supabase.js';
      script.async = true;
      script.onload = () => (window.supabase && window.supabase.createClient ? resolve(window.supabase) : reject(new Error('librería incompleta')));
      script.onerror = () => { script.remove(); reject(new Error('sin conexión')); };
      document.head.appendChild(script);
    });
  }

  let clientePromesa = null;
  function cliente() {
    if (MODO !== 'supabase') return Promise.resolve(null);
    if (!clientePromesa) {
      clientePromesa = cargarLibreria()
        .then(({ createClient }) => createClient(config.url, config.key, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        }))
        .catch((error) => {
          clientePromesa = null;
          throw new Error(`No se pudo cargar Supabase (${error.message}).`);
        });
    }
    return clientePromesa;
  }

  /** Error con un código que la interfaz sabe explicar. */
  function fallo(codigo, detalle) {
    const error = new Error(detalle || codigo);
    error.codigo = codigo;
    return error;
  }

  function traducir(error) {
    const m = String((error && error.message) || '').toLowerCase();
    if (m.includes('already registered') || m.includes('already been registered')) return fallo('exists');
    if (m.includes('invalid login credentials')) return fallo('credenciales');
    if (m.includes('email not confirmed')) return fallo('sin-confirmar');
    if (m.includes('rate limit') || m.includes('security purposes')) return fallo('limite');
    if (m.includes('password')) return fallo('password', error.message);
    if (m.includes('failed to fetch') || m.includes('network') || m.includes('cargar supabase')) return fallo('red');
    return fallo('desconocido', error && error.message);
  }

  const partirNombre = (completo) => {
    const [nombre, ...resto] = String(completo || '').trim().split(/\s+/);
    return { nombre: nombre || '', apellido: resto.join(' ') };
  };

  /* ---------- Crear cuenta ---------- */
  async function registrar({ fullName, email, password }) {
    if (MODO === 'local') {
      try {
        const cuenta = await SF.register({ fullName, email, password });
        return { email: cuenta.email, confirmarCorreo: false };
      } catch (error) {
        throw fallo(error.message === 'exists' ? 'exists' : 'storage');
      }
    }

    const sb = await cliente().catch((e) => { throw traducir(e); });
    const { nombre, apellido } = partirNombre(fullName);
    const { data, error } = await sb.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { nombre, apellido }, emailRedirectTo: `${ORIGEN}/html/iniciar-sesion.html?confirmada=1` }
    });
    if (error) throw traducir(error);
    // Supabase no avisa directamente si el correo ya existía: devuelve un usuario sin identidades
    if (!data.user || (Array.isArray(data.user.identities) && data.user.identities.length === 0)) throw fallo('exists');

    // El registro no deja la sesión abierta: se entra por "Iniciar sesión"
    if (data.session) await sb.auth.signOut();
    return { email: data.user.email, confirmarCorreo: !data.session };
  }

  /* ---------- Iniciar sesión ---------- */
  async function iniciarSesion(email, password) {
    if (MODO === 'local') {
      const cuenta = await SF.authenticate(email, password);
      if (!cuenta) throw fallo(SF.account(email) && !SF.account(email).passHash ? 'sin-password' : 'credenciales');
      if (!SF.login(email)) throw fallo('storage');
      return cuenta;
    }

    const sb = await cliente().catch((e) => { throw traducir(e); });
    const { data, error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) throw traducir(error);

    const { data: perfil, error: errorPerfil } = await sb.from('perfiles').select('*').eq('id', data.user.id).maybeSingle();
    if (errorPerfil) console.warn('StudyFlow: no se pudo leer el perfil de Supabase:', errorPerfil.message);
    const meta = data.user.user_metadata || {};
    const datos = perfil || { id: data.user.id, email: data.user.email, nombre: meta.nombre || '', apellido: meta.apellido || '', creado_en: data.user.created_at };

    if (!SF.syncAccount({ ...datos, email: data.user.email }) || !SF.login(data.user.email)) {
      await sb.auth.signOut();
      throw fallo('storage');
    }
    return SF.currentUser();
  }

  /* ---------- Cerrar sesión ---------- */
  async function cerrarSesion() {
    // Sube lo que falte y borra la copia local de las materias y tareas
    if (window.SFSync) await window.SFSync.cerrar();
    try {
      const sb = await cliente();
      if (sb) await sb.auth.signOut();
    } catch (error) { /* aunque falle Supabase, se cierra la sesión local */ }
    SF.logout();
  }

  /**
   * En las páginas de la app: comprueba que la sesión de Supabase siga viva.
   * Devuelve true (válida), false (no hay sesión o es de otra cuenta) o
   * null (no se pudo comprobar: sin conexión o Supabase no cargó). Con null
   * la persona sigue trabajando con la copia local y no se cierra su sesión.
   */
  async function verificarSesion() {
    if (MODO === 'local') return true;
    try {
      const sb = await cliente();
      const { data, error } = await sb.auth.getSession();
      if (error) return null;
      const user = SF.currentUser();
      return Boolean(data.session && user && data.session.user.email === user.email);
    } catch (error) {
      return null;
    }
  }

  /* ---------- Perfil ---------- */
  async function actualizarPerfil(cambios) {
    SF.updateAccount(cambios);
    if (MODO === 'local') return true;
    const sb = await cliente();
    const { data: sesion } = await sb.auth.getSession();
    if (!sesion.session) throw fallo('sesion');
    const fila = {};
    if ('name' in cambios) fila.nombre = cambios.name;
    if ('lastName' in cambios) fila.apellido = cambios.lastName;
    if ('university' in cambios) fila.universidad = cambios.university;
    if ('career' in cambios) fila.carrera = cambios.career;
    if ('semester' in cambios) fila.semestre = cambios.semester ? Number(cambios.semester) : null;
    if (!Object.keys(fila).length) return true;
    const { error } = await sb.from('perfiles').update(fila).eq('id', sesion.session.user.id);
    if (error) throw traducir(error);
    return true;
  }

  /* ---------- Contraseña ---------- */
  async function cambiarPassword(actual, nueva) {
    const user = SF.currentUser();
    if (MODO === 'local') {
      if (user.passHash && !(await SF.checkPassword(actual))) throw fallo('actual');
      await SF.setPassword(user.email, nueva);
      return true;
    }
    const sb = await cliente();
    // Se confirma la contraseña actual antes de cambiarla
    const { error: errorActual } = await sb.auth.signInWithPassword({ email: user.email, password: actual });
    if (errorActual) throw fallo('actual');
    const { error } = await sb.auth.updateUser({ password: nueva });
    if (error) throw traducir(error);
    return true;
  }

  /** Recuperar contraseña: con Supabase envía un correo con un enlace. */
  async function enviarRecuperacion(email) {
    const sb = await cliente().catch((e) => { throw traducir(e); });
    const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${ORIGEN}/html/recuperar-contrasena.html`
    });
    if (error) throw traducir(error);
  }

  /** ¿La página se abrió desde el enlace de recuperación? */
  async function enlaceDeRecuperacion() {
    if (MODO === 'local') return false;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get('error_description')) throw fallo('enlace');
    const sb = await cliente();
    const { data } = await sb.auth.getSession();
    return Boolean(data.session) && (hash.get('type') === 'recovery' || sessionStorage.getItem('studyflow:recuperando') === '1');
  }

  async function restablecerPassword(nueva) {
    const sb = await cliente();
    const { error } = await sb.auth.updateUser({ password: nueva });
    if (error) throw traducir(error);
    await sb.auth.signOut();
    try { sessionStorage.removeItem('studyflow:recuperando'); } catch (e) { /* nada */ }
  }

  // Si se llega con el enlace de recuperación, se recuerda mientras dura la pestaña
  if (MODO === 'supabase' && new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery') {
    try { sessionStorage.setItem('studyflow:recuperando', '1'); } catch (e) { /* nada */ }
  }

  /** Mensajes en español para cada error. */
  const MENSAJES = {
    exists: 'Este correo ya tiene una cuenta. Inicia sesión.',
    credenciales: 'Correo o contraseña incorrectos.',
    'sin-confirmar': 'Aún no has confirmado tu correo. Abre el enlace que te enviamos y vuelve a intentarlo.',
    'sin-password': 'Esta cuenta no tiene contraseña. Usa «¿Olvidaste tu contraseña?» para crear una.',
    limite: 'Hiciste demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.',
    password: 'La contraseña no cumple los requisitos de seguridad.',
    red: 'No se pudo conectar con el servidor de cuentas. Revisa tu conexión e inténtalo de nuevo.',
    storage: 'Tu navegador no permitió guardar los datos. Revisa que el almacenamiento del sitio no esté bloqueado.',
    actual: 'La contraseña actual no es correcta.',
    sesion: 'Tu sesión venció. Vuelve a iniciar sesión.',
    enlace: 'El enlace ya no es válido o venció. Pide uno nuevo.',
    desconocido: 'No se pudo completar la operación. Inténtalo de nuevo.'
  };
  const mensaje = (error) => MENSAJES[error && error.codigo] || MENSAJES.desconocido;

  return {
    MODO, cliente, registrar, iniciarSesion, cerrarSesion, verificarSesion,
    actualizarPerfil, cambiarPassword, enviarRecuperacion, enlaceDeRecuperacion, restablecerPassword, mensaje
  };
})();
