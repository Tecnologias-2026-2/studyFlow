/* =========================================================
   StudyFlow — Interacciones generales de interfaz (todas las páginas)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();
  setupSmoothAnchorScroll();
  setupActionButtons();
  setupTestimonials();
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
 * Feedback visual sencillo para los botones de acción
 * (esta maqueta no incluye backend ni autenticación real).
 */
function setupActionButtons() {
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-action');

      if (action === 'signup' || action === 'login') {
        const hero = document.getElementById('inicio');
        if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (action === 'demo') {
        const features = document.getElementById('funciones');
        if (features) features.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/**
 * Carrusel de testimonios: los puntos cambian de testimonio y
 * avanza solo cada 7 s (se pausa al pasar el mouse o con el foco dentro).
 */
function setupTestimonials() {
  const card = document.getElementById('testimonialCard');
  if (!card) return;
  const slides = Array.from(card.querySelectorAll('[data-slide]'));
  const dots = Array.from(card.querySelectorAll('[data-goto]'));
  if (slides.length < 2) return;

  let current = 0;
  let timer = null;

  const show = (index) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    dots.forEach((dot, i) => {
      if (i === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const start = () => { if (!reduceMotion) { stop(); timer = setInterval(() => show(current + 1), 7000); } };
  const stop = () => { if (timer) clearInterval(timer); timer = null; };

  dots.forEach((dot) => dot.addEventListener('click', () => { show(Number(dot.dataset.goto)); start(); }));
  card.addEventListener('mouseenter', stop);
  card.addEventListener('mouseleave', start);
  card.addEventListener('focusin', stop);
  card.addEventListener('focusout', start);

  show(0);
  start();
}
