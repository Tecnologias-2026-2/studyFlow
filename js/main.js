/* =========================================================
   StudyFlow — Interacciones generales de interfaz (todas las páginas)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();
  setupSmoothAnchorScroll();
  mostrarEstudiantesRegistrados();
  redirectIfLoggedIn();
});

/**
 * Si ya hay una sesión activa, la landing lleva directo al panel.
 */
function redirectIfLoggedIn() {
  if (window.SF && window.SF.currentUser && window.SF.currentUser()) {
    window.location.replace('dashboard.html');
  }
}

/**
 * Menú hamburguesa para navegación en móvil.
 */
function setupMobileMenu() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');

  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    menu.hidden = !isOpen;
  });

  // Cierra el menú al elegir un enlace.
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/**
 * Desplazamiento suave al hacer clic en enlaces internos (#ancla).
 */
function setupSmoothAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
}

/**
 * Número real de estudiantes registrados, pedido al backend
 * (GET /api/estadisticas → función contar_estudiantes en Supabase).
 * Si no responde, la línea se queda oculta: nunca se muestra un número inventado.
 */
function mostrarEstudiantesRegistrados() {
  const linea = document.getElementById('estudiantesRegistrados');
  if (!linea || !window.SFApi) return;
  window.SFApi.get('estadisticas').then(({ estudiantes }) => {
    if (!Number.isInteger(estudiantes) || estudiantes < 1) return;
    document.getElementById('estudiantesNumero').textContent = estudiantes.toLocaleString('es-CO');
    document.getElementById('estudiantesEtiqueta').textContent =
      estudiantes === 1 ? 'estudiante registrado' : 'estudiantes registrados';
    linea.hidden = false;
  }).catch(() => { /* sin dato real, no se muestra nada */ });
}

