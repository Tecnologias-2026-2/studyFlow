/* =========================================================
   StudyFlow — Autenticación (cuentas guardadas en el navegador)
   Crear cuenta → mensaje "Cuenta creada con éxito" → Iniciar sesión
   → panel. Recuperar contraseña.
   ========================================================= */

(() => {
  'use strict';

  const { icon } = window.SFIcons;
  const UI = window.SFUI;
  const SF = window.SF;
  const Cuentas = window.SFCuentas;

  const DASHBOARD = 'dashboard.html';

  SF.onReady(() => {
    const onRecover = document.getElementById('recoverForm');

    // Quien ya tiene sesión va directo al panel (excepto al recuperar contraseña).
    if (SF.currentUser() && !onRecover) {
      window.location.replace(DASHBOARD);
      return;
    }

    renderVisual();
    UI.setupPasswordToggles();

    const login = document.getElementById('loginForm');
    const signup = document.getElementById('signupForm');

    if (login) setupLogin(login);
    if (signup) setupSignup(signup);
    if (onRecover) setupRecover();
  });

  /* ---------- Iniciar sesión ---------- */
  function setupLogin(form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      UI.clearErrors(form);

      const email = form.email.value.trim();
      const password = form.password.value;
      let valid = true;

      if (!UI.validEmail(email)) { UI.setFieldError(form.email, 'Escribe un correo electrónico válido.'); valid = false; }
      if (!password) { UI.setFieldError(form.password, 'Escribe tu contraseña.'); valid = false; }
      if (!valid) return;

      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        await Cuentas.iniciarSesion(email, password);
      } catch (error) {
        button.disabled = false;
        UI.formError(form, Cuentas.mensaje(error));
        return;
      }
      window.location.href = DASHBOARD;
    });

    // Viene de crear la cuenta (o de confirmar el correo): el correo ya aparece escrito
    const params = new URLSearchParams(window.location.search);
    if (params.get('confirmada') === '1') UI.toast('Correo confirmado. Ya puedes iniciar sesión.');
    const correo = params.get('correo');
    if (correo && !form.email.value) {
      form.email.value = correo;
      form.password.focus();
    }
  }

  /* ---------- Crear cuenta ---------- */
  function setupSignup(form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      UI.clearErrors(form);

      const fullName = form.elements.name.value.trim();
      const email = form.email.value.trim();
      const password = form.password.value;
      let valid = true;

      if (fullName.length < 2) { UI.setFieldError(form.elements.name, 'Escribe tu nombre completo.'); valid = false; }
      if (!UI.validEmail(email)) { UI.setFieldError(form.email, 'Escribe un correo electrónico válido.'); valid = false; }
      if (password.length < 8) { UI.setFieldError(form.password, 'La contraseña debe tener al menos 8 caracteres.'); valid = false; }
      if (form.confirm.value !== password) { UI.setFieldError(form.confirm, 'Las contraseñas no coinciden.'); valid = false; }
      if (!form.terms.checked) { UI.setFieldError(form.terms, 'Debes aceptar los términos y condiciones.'); valid = false; }
      if (!valid) return;

      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = 'Creando cuenta…';
      let account;
      try {
        account = await Cuentas.registrar({ fullName, email, password });
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Crear cuenta gratis';
        if (error.codigo === 'exists') UI.setFieldError(form.email, Cuentas.mensaje(error));
        else UI.formError(form, Cuentas.mensaje(error));
        return;
      }

      // Confirmación: la cuenta quedó guardada; ahora se entra con "Iniciar sesión"
      form.hidden = true;
      document.getElementById('signupFooter').hidden = true;
      document.querySelector('.auth-card__subtitle').hidden = true;
      document.getElementById('authTitle').textContent = 'Registro completo';
      const done = document.getElementById('signupDone');
      done.querySelector('.auth-success__icon').innerHTML = icon('check');
      document.getElementById('signupDoneEmail').textContent = account.email;
      if (account.confirmarCorreo) {
        done.querySelector('.auth-success__text').innerHTML = `Te enviamos un correo a <strong>${SF.esc(account.email)}</strong>. Abre el enlace para confirmar tu cuenta y luego inicia sesión.`;
      }
      document.getElementById('signupDoneLogin').href = `iniciar-sesion.html?correo=${encodeURIComponent(account.email)}`;
      done.hidden = false;
      UI.toast('Cuenta creada con éxito');
      document.getElementById('signupDoneTitle').focus();
    });
  }

  /* ---------- Recuperar contraseña ---------- */
  function setupRecover() {
    const recover = document.getElementById('recoverForm');
    const reset = document.getElementById('resetForm');
    const done = document.getElementById('resetDone');
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('recoverSubtitle');
    const badge = document.getElementById('recoverIcon');
    let targetEmail = '';

    const setHeader = (ico, text, sub) => {
      badge.innerHTML = icon(ico);
      title.textContent = text;
      subtitle.textContent = sub;
    };
    setHeader('mail', '¿Olvidaste tu contraseña?', 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.');

    const mostrarFormularioNuevo = (texto) => {
      setHeader('lock', 'Crea una nueva contraseña', texto);
      recover.hidden = true;
      reset.hidden = false;
      reset.password.focus();
    };

    // Supabase: se llegó con el enlace del correo → se pide la nueva contraseña
    Cuentas.enlaceDeRecuperacion()
      .then((desdeEnlace) => { if (desdeEnlace) mostrarFormularioNuevo('Escribe la contraseña que usarás de ahora en adelante.'); })
      .catch((error) => UI.formError(recover, Cuentas.mensaje(error)));

    recover.addEventListener('submit', async (event) => {
      event.preventDefault();
      UI.clearErrors(recover);
      const email = recover.email.value.trim();

      if (!UI.validEmail(email)) { UI.setFieldError(recover.email, 'Escribe un correo electrónico válido.'); return; }

      if (Cuentas.MODO === 'supabase') {
        const button = recover.querySelector('button[type="submit"]');
        button.disabled = true;
        try {
          await Cuentas.enviarRecuperacion(email);
        } catch (error) {
          button.disabled = false;
          UI.formError(recover, Cuentas.mensaje(error));
          return;
        }
        // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados
        setHeader('mail', 'Revisa tu correo', `Si ${email} tiene una cuenta, te llegará un enlace para crear una nueva contraseña.`);
        recover.hidden = true;
        return;
      }

      // Modo local (sin Supabase): no hay correo, se cambia aquí mismo
      if (!SF.account(email)) { UI.setFieldError(recover.email, 'No encontramos una cuenta con ese correo.'); return; }
      targetEmail = email;
      mostrarFormularioNuevo(`Cuenta: ${email}`);
    });

    reset.addEventListener('submit', async (event) => {
      event.preventDefault();
      UI.clearErrors(reset);
      let valid = true;

      if (reset.password.value.length < 8) { UI.setFieldError(reset.password, 'La contraseña debe tener al menos 8 caracteres.'); valid = false; }
      if (reset.confirm.value !== reset.password.value) { UI.setFieldError(reset.confirm, 'Las contraseñas no coinciden.'); valid = false; }
      if (!valid) return;

      try {
        if (Cuentas.MODO === 'supabase') await Cuentas.restablecerPassword(reset.password.value);
        else await SF.setPassword(targetEmail, reset.password.value);
      } catch (error) {
        UI.formError(reset, Cuentas.mensaje(error));
        return;
      }
      setHeader('check', '¡Contraseña actualizada!', 'Ya puedes iniciar sesión con tu nueva contraseña.');
      document.getElementById('recoverFooter').hidden = true;
      reset.hidden = true;
      done.hidden = false;
      done.querySelector('a').focus();
    });
  }

  /* ---------- Mockup decorativo (lado izquierdo) ---------- */
  function renderVisual() {
    const visual = document.getElementById('authVisual');
    if (!visual) return;

    visual.innerHTML = window.SFMockup ? window.SFMockup.html() : '';
  }
})();
