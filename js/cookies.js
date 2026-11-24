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
    .cookies{position:fixed;left:20px;bottom:20px;z-index:9990;display:grid;grid-template-columns:auto 1fr;column-gap:16px;width:min(460px,calc(100vw - 112px));padding:22px;border:1px solid rgba(255,255,255,.08);border-radius:24px;background:#101a30;color:#f3f6fb;box-shadow:0 20px 60px rgba(0,0,0,.45),0 0 0 1px rgba(41,214,221,.1);font-family:"Plus Jakarta Sans","Segoe UI",system-ui,-apple-system,sans-serif}
    .cookies[hidden]{display:none}
    .cookies::before{content:"";position:absolute;top:0;left:24px;right:24px;height:3px;border-radius:0 0 3px 3px;background:linear-gradient(90deg,#29d6dd,#6f7cf6)}
    .cookies__icono{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:10px;background:rgba(41,214,221,.14);color:#29d6dd;grid-row:span 2}
    .cookies__icono svg{width:24px;height:24px}
    .cookies__titulo{margin:0 0 4px;font-size:1.1rem;line-height:1.4;font-weight:700;color:#f3f6fb}
    .cookies__texto{margin:0;font-size:.92rem;line-height:1.55;color:#a3aec4}
    .cookies__texto b{color:#f3f6fb;font-weight:700}
    .cookies__pie{grid-column:1/-1;margin-top:18px}
    .cookies__botones{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
    .cookies__btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:11px 22px;border:1px solid transparent;border-radius:999px;font:inherit;font-size:.95rem;font-weight:600;line-height:normal;cursor:pointer;transition:transform 160ms ease,background-color 160ms ease}
    .cookies__btn:hover{transform:translateY(-1px)}
    .cookies__btn--aceptar{background:linear-gradient(135deg,#34e0e7,#1aa8b0);color:#04191c}
    .cookies__btn--aceptar:hover{background:linear-gradient(135deg,#4be7ed,#21b8c1)}
    .cookies__btn--rechazar{background:transparent;color:#f3f6fb;border-color:rgba(255,255,255,.18)}
    .cookies__btn--rechazar:hover{background:rgba(255,255,255,.06)}
    .cookies__btn--borrar{min-height:44px;padding:0 6px;background:none;color:#fca5a5;text-decoration:underline;text-underline-offset:3px}
    .cookies__btn--borrar:hover{transform:none}
    .cookies__btn:focus-visible,.cookies__link:focus-visible{outline:3px solid #ffcf5c;outline-offset:2px}
    .cookies__link{margin-left:auto;color:#29d6dd;font-size:.85rem;font-weight:600;text-decoration:underline;text-underline-offset:3px}
    .cookies__estado{margin:12px 0 0;font-size:.82rem;color:#86efac}
    .cookies__estado:empty{display:none}
    .cookies__error{margin:12px 0 0;font-size:.82rem;color:#fca5a5;font-weight:600}
    .cookies-recordado{display:block;margin-top:6px;font-size:12px;color:#8b96ad}
    .cookies-config{padding:6px 0;border:0;background:none;color:inherit;font:inherit;font-size:inherit;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
    .cookies-config:hover{color:#29d6dd}
    @media (prefers-reduced-motion:no-preference){.cookies:not([hidden]){animation:cookies-entra .2s ease-out}}
    @keyframes cookies-entra{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    html.a11y-pausa .cookies{animation:none}
    @media (max-width:560px){.cookies{left:8px;right:8px;bottom:70px;width:auto;padding:18px;column-gap:12px;border-radius:20px}.cookies__icono{width:40px;height:40px}.cookies__btn--aceptar,.cookies__btn--rechazar{flex:1}.cookies__link{margin-left:0;width:100%;text-align:center}}
  `;


  // ---------- El aviso ----------
  let aviso, btnAceptar, btnBorrar, error, estado, origenFoco;

  function ponerEstilos() {
    if (document.getElementById('sf-cookies-css')) return;
    const estilo = document.createElement('style');
    estilo.id = 'sf-cookies-css';
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
  }

  function construir() {
    ponerEstilos();

    aviso = document.createElement('div');
    aviso.className = 'cookies';
    aviso.id = 'aviso-cookies';
    aviso.setAttribute('role', 'dialog');
    aviso.setAttribute('aria-labelledby', 'cookies-titulo');
    aviso.setAttribute('aria-describedby', 'cookies-texto');
    aviso.hidden = true;
    aviso.innerHTML = `
      <span class="cookies__icono" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3.5-3A3 3 0 0 1 14 5.5 3 3 0 0 1 12 3z"/><circle cx="8.5" cy="10.5" r=".8" fill="currentColor"/><circle cx="10" cy="15.5" r=".8" fill="currentColor"/><circle cx="15" cy="14.5" r=".8" fill="currentColor"/></svg></span>
      <h2 class="cookies__titulo" id="cookies-titulo">Usamos cookies</h2>
      <p class="cookies__texto" id="cookies-texto">Si las aceptas, StudyFlow recordará tu nombre, correo, carrera y último acceso durante <b>30 días</b>. Nunca guardamos tu contraseña.</p>
      <div class="cookies__pie">
      <div class="cookies__botones">
        <button class="cookies__btn cookies__btn--aceptar" type="button" id="aceptar-cookies">Aceptar</button>
        <button class="cookies__btn cookies__btn--rechazar" type="button" id="rechazar-cookies">Rechazar</button>
        <a class="cookies__link" href="/html/privacidad.html#cookies">Más información</a>
        <button class="cookies__btn cookies__btn--borrar" type="button" id="borrar-cookies" hidden>Borrar mis datos guardados</button>
      </div>
      <p class="cookies__estado" id="estado-cookies" role="status" aria-live="polite"></p>
      <p class="cookies__error" id="error-cookies" role="alert" hidden>Tu navegador bloqueó las cookies. Revisa su configuración para poder guardarlas.</p>
      </div>`;
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
    ponerEstilos();
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
