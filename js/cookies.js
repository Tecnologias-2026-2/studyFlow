/* =========================================================
   StudyFlow — Aviso de cookies y datos de sesión (caducan en 30 días)

   - La primera vez sale un aviso para aceptar o rechazar las cookies.
   - La decisión se guarda en la cookie "studyflow_consent" por 30 días;
     al vencer, el aviso vuelve a salir.
   - Solo si se aceptan se guardan datos que NO son secretos, también por
     30 días: nombre, correo, carrera y fecha del último acceso.
     Nunca se guardan contraseñas.
   - Con esos datos el correo aparece ya escrito al iniciar sesión y la
     app puede saludar por el nombre.
   - "Configurar cookies" (pie de página y Mi perfil) permite cambiar la
     decisión o borrar los datos guardados.
   ========================================================= */

window.SFCookies = (() => {
  'use strict';

  const DIAS = 30; // todas las cookies de StudyFlow caducan a los 30 días
  const CONSENTIMIENTO = 'studyflow_consent';
  const DATOS = ['studyflow_nombre', 'studyflow_correo', 'studyflow_carrera', 'studyflow_ultimo_acceso'];

  // ---------- Leer, escribir y borrar cookies ----------
  function escribir(nombre, valor, dias = DIAS) {
    const vence = new Date(Date.now() + dias * 864e5).toUTCString();
    document.cookie = `${nombre}=${encodeURIComponent(valor)}; Max-Age=${dias * 86400}; Expires=${vence}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  }

  function leer(nombre) {
    const par = document.cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${nombre}=`));
    return par ? decodeURIComponent(par.slice(nombre.length + 1)) : '';
  }

  const borrar = (nombre) => { document.cookie = `${nombre}=; Max-Age=0; Path=/; SameSite=Lax`; };
  const decision = () => leer(CONSENTIMIENTO); // 'accepted', 'rejected' o ''
  const aceptadas = () => decision() === 'accepted';
  const borrarDatos = () => DATOS.forEach(borrar);

  // ---------- Datos de la sesión (solo con permiso) ----------
  function usuarioActual() {
    try { return window.SF && window.SF.currentUser ? window.SF.currentUser() : null; } catch (e) { return null; }
  }

  function guardarSesion(usuario = usuarioActual()) {
    if (!aceptadas() || !usuario) return;
    const nombre = [usuario.name, usuario.lastName].filter(Boolean).join(' ');
    if (nombre) escribir('studyflow_nombre', nombre);
    if (usuario.email) escribir('studyflow_correo', usuario.email);
    if (usuario.career) escribir('studyflow_carrera', usuario.career);
    // Último acceso: una vez por visita (pestaña)
    let anotado = false;
    try { anotado = sessionStorage.getItem('studyflow:acceso-anotado') === '1'; } catch (e) { /* nada */ }
    if (!anotado) {
      escribir('studyflow_ultimo_acceso', new Date().toISOString());
      try { sessionStorage.setItem('studyflow:acceso-anotado', '1'); } catch (e) { /* nada */ }
    }
  }

  // El correo aparece escrito en "Iniciar sesión" y "Olvidé mi contraseña"
  function rellenarCorreo() {
    if (!aceptadas()) return;
    const correo = leer('studyflow_correo');
    if (!correo) return;
    ['loginEmail', 'recoverEmail'].forEach((id) => {
      const input = document.getElementById(id);
      if (!input || input.value) return;
      input.value = correo;
      const nota = document.createElement('small');
      nota.className = 'cookies-recordado';
      nota.textContent = 'Recordamos tu correo de tu último ingreso.';
      input.insertAdjacentElement('afterend', nota);
    });
  }

  function datos() {
    if (!aceptadas()) return null;
    return {
      nombre: leer('studyflow_nombre'),
      correo: leer('studyflow_correo'),
      carrera: leer('studyflow_carrera'),
      ultimoAcceso: leer('studyflow_ultimo_acceso')
    };
  }

  // ---------- Estilos (tema oscuro de StudyFlow) ----------
  const CSS = `
    .cookies{position:fixed;left:50%;bottom:20px;z-index:9990;transform:translateX(-50%);width:min(640px,calc(100vw - 32px));padding:20px 22px;border-radius:18px;background:#101a30;color:#f3f6fb;border:1px solid rgba(41,214,221,.55);box-shadow:0 20px 60px rgba(0,0,0,.55);font-family:"Plus Jakarta Sans","Segoe UI",system-ui,sans-serif}
    .cookies[hidden]{display:none}
    .cookies__cabeza{display:flex;align-items:center;gap:10px;margin-bottom:6px}
    .cookies__icono{font-size:24px;line-height:1}
    .cookies__titulo{margin:0;font-size:18px;line-height:26px;font-weight:800;color:#f3f6fb}
    .cookies__texto{margin:0 0 14px;font-size:14px;line-height:22px;color:#c3cbdb}
    .cookies__botones{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
    .cookies__btn{min-height:44px;padding:0 20px;border-radius:12px;font:inherit;font-size:15px;font-weight:700;cursor:pointer}
    .cookies__btn--aceptar{border:0;background:#29d6dd;color:#06222a}
    .cookies__btn--rechazar{border:1px solid rgba(255,255,255,.35);background:transparent;color:#f3f6fb}
    .cookies__btn--borrar{border:0;background:none;color:#fca5a5;text-decoration:underline;text-underline-offset:3px;padding:0 6px}
    .cookies__btn:focus-visible{outline:3px solid #ffcf5c;outline-offset:2px}
    .cookies__estado{margin:10px 0 0;font-size:13px;color:#86efac}
    .cookies__estado:empty{display:none}
    .cookies__error{margin:10px 0 0;font-size:13px;color:#fca5a5;font-weight:600}
    .cookies-recordado{display:block;margin-top:6px;font-size:12px;color:#8b96ad}
    .cookies-config{padding:6px 0;border:0;background:none;color:inherit;font:inherit;font-size:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
    @media (max-width:560px){.cookies{bottom:76px;padding:16px}.cookies__btn{flex:1}}
  `;

  // ---------- El aviso ----------
  let aviso, btnAceptar, btnBorrar, error, estado, origenFoco;

  function construir() {
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);

    aviso = document.createElement('div');
    aviso.className = 'cookies';
    aviso.id = 'aviso-cookies';
    aviso.setAttribute('role', 'dialog');
    aviso.setAttribute('aria-labelledby', 'cookies-titulo');
    aviso.setAttribute('aria-describedby', 'cookies-texto');
    aviso.hidden = true;
    aviso.innerHTML = `
      <div class="cookies__cabeza"><span class="cookies__icono" aria-hidden="true">🍪</span>
        <h2 class="cookies__titulo" id="cookies-titulo">Usamos cookies</h2></div>
      <p class="cookies__texto" id="cookies-texto">Si las aceptas, StudyFlow recordará tu nombre, tu correo, tu carrera y tu último acceso durante <b>30 días</b>. Nunca guardamos tu contraseña.</p>
      <div class="cookies__botones">
        <button class="cookies__btn cookies__btn--aceptar" type="button" id="aceptar-cookies">Aceptar cookies</button>
        <button class="cookies__btn cookies__btn--rechazar" type="button" id="rechazar-cookies">Rechazar</button>
        <button class="cookies__btn cookies__btn--borrar" type="button" id="borrar-cookies" hidden>Borrar mis datos guardados</button>
      </div>
      <p class="cookies__estado" id="estado-cookies" role="status" aria-live="polite"></p>
      <p class="cookies__error" id="error-cookies" role="alert" hidden>Tu navegador bloqueó las cookies. Revisa su configuración para poder guardarlas.</p>`;
    document.body.appendChild(aviso);

    btnAceptar = aviso.querySelector('#aceptar-cookies');
    btnBorrar = aviso.querySelector('#borrar-cookies');
    error = aviso.querySelector('#error-cookies');
    estado = aviso.querySelector('#estado-cookies');

    btnAceptar.addEventListener('click', () => {
      escribir(CONSENTIMIENTO, 'accepted');
      if (!aceptadas()) { error.hidden = false; return; } // el navegador no la guardó
      guardarSesion();
      cerrar();
    });

    aviso.querySelector('#rechazar-cookies').addEventListener('click', () => {
      escribir(CONSENTIMIENTO, 'rejected');
      borrarDatos(); // si antes había aceptado, se borra lo guardado
      cerrar();
    });

    btnBorrar.addEventListener('click', () => {
      borrarDatos();
      btnBorrar.hidden = true;
      estado.textContent = 'Listo: borramos tu nombre, correo, carrera y último acceso.';
    });

    document.addEventListener('keydown', (e) => {
      // Escape solo cierra cuando ya hay una decisión (desde "Configurar cookies")
      if (e.key === 'Escape' && !aviso.hidden && decision()) cerrar();
    });
  }

  function abrir() {
    if (!aviso) construir();
    origenFoco = document.activeElement;
    error.hidden = true;
    estado.textContent = decision() === 'accepted' ? 'Ahora mismo las cookies están aceptadas.'
      : decision() === 'rejected' ? 'Ahora mismo las cookies están rechazadas.' : '';
    btnBorrar.hidden = !DATOS.some((n) => leer(n));
    aviso.hidden = false;
    btnAceptar.focus();
  }

  function cerrar() {
    aviso.hidden = true;
    if (origenFoco && document.contains(origenFoco) && origenFoco !== document.body) origenFoco.focus();
  }

  // Botón "Configurar cookies": pie de la página de inicio, páginas legales y Mi perfil
  function ponerBotones() {
    document.querySelectorAll('.site-footer, .legal-footer, [data-cookies-config]').forEach((lugar) => {
      if (lugar.querySelector('.cookies-config')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cookies-config';
      b.textContent = 'Configurar cookies';
      b.addEventListener('click', abrir);
      const destino = lugar.querySelector('.footer__bottom, .container') || lugar;
      destino.appendChild(b);
    });
  }

  function iniciar() {
    ponerBotones();
    if (!decision()) {
      borrarDatos(); // sin decisión no queda ningún dato guardado
      abrir();
      return;
    }
    // Cualquier valor distinto de "accepted" (rechazadas o cambiado a mano) borra los datos
    if (!aceptadas()) { borrarDatos(); return; }
    guardarSesion();
    rellenarCorreo();
    // Al iniciar sesión o editar el perfil se actualizan los datos guardados
    document.addEventListener('sf:change', () => guardarSesion());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();

  return { abrir, aceptadas, datos, guardarSesion, borrarDatos, DIAS };
})();
