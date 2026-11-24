/* =========================================================
   StudyFlow — Interacciones generales de interfaz (todas las páginas)
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();
  setupSmoothAnchorScroll();
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
 * Carrusel de testimonios: cambia solo cuando la persona elige un punto
 * (no avanza ni se anima por sí mismo).
 */
function setupTestimonials() {
  const card = document.getElementById('testimonialCard');
  if (!card) return;
  // Los testimonios vienen del backend (GET /api/testimonios); si no responde, quedan los del HTML
  if (window.SFApi && !card.dataset.cargado) {
    card.dataset.cargado = '1';
    window.SFApi.testimonios()
      .then((lista) => {
        if (!Array.isArray(lista) || !lista.length) return;
        pintarTestimonios(card, lista);
        setupTestimonials();
      })
      .catch(() => setupTestimonials());
    return;
  }
  const slides = Array.from(card.querySelectorAll('[data-slide]'));
  const dots = Array.from(card.querySelectorAll('[data-goto]'));
  if (slides.length < 2) return;

  let current = 0;

  const show = (index, animar) => {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
      slide.classList.toggle('is-entering', Boolean(animar) && i === current);
    });
    dots.forEach((dot, i) => {
      if (i === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  };

  // La transición solo ocurre como respuesta a un clic del usuario
  dots.forEach((dot) => dot.addEventListener('click', () => show(Number(dot.dataset.goto), true)));

  show(0, false);
}

function pintarTestimonios(card, lista) {
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tonos = ['teal', 'amber', 'red'];
  card.querySelector('.testimonial__slides').innerHTML = lista.map((t, i) => `
    <figure class="testimonial__slide" data-slide${i ? ' hidden' : ''}>
      <blockquote><p>“${esc(t.texto)}”</p></blockquote>
      <figcaption class="testimonial__author">
        <span class="testimonial__avatar${t.color && t.color !== 'teal' ? ` testimonial__avatar--${esc(t.color)}` : ''}" aria-hidden="true">${esc(t.iniciales)}</span>
        <span><span class="testimonial__name">${esc(t.nombre)}</span><span class="testimonial__role">${esc(t.carrera)}</span></span>
      </figcaption>
    </figure>`).join('');
  card.querySelector('.testimonial__dots').innerHTML = lista.map((t, i) => `
    <button type="button" class="dot dot--${tonos[i % tonos.length]}" data-goto="${i}" aria-label="Testimonio ${i + 1} de ${lista.length}"${i ? '' : ' aria-current="true"'}></button>`).join('');
}
