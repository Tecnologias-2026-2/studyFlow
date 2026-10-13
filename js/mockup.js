/* =========================================================
   StudyFlow — Mockup de la app (decorativo)
   Vista previa del panel que aparece en la landing, en
   «Iniciar sesión» y en «Crear cuenta», según el diseño de Figma.
   Se dibuja en cualquier elemento con el atributo data-app-mockup.
   La semana mostrada es la semana actual, con hoy resaltado.
   ========================================================= */

window.SFMockup = (() => {
  'use strict';

  const svg = (body, size = 14) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

  const ICONS = {
    layers: svg('<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/>'),
    check: svg('<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
    timer: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2"/><path d="M9.5 2h5"/>'),
    chart: svg('<path d="M5 20V11M12 20V5M19 20v-6"/>'),
    calendar: svg('<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
    sparkle: svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
    stop: svg('<rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor"/>', 10),
    up: svg('<path d="M12 19V5M6 11l6-6 6 6"/>', 12)
  };

  const LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  /** Días de la semana actual (lunes a domingo); los dos primeros con «actividad». */
  function week() {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return LETTERS.map((letter, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return { letter, n: day.getDate(), today: day.toDateString() === today.toDateString(), dot: i < 2 };
    });
  }

  function html() {
    const days = week().map((d) => `
      <span class="app-mock__day${d.today ? ' is-today' : ''}"><b>${d.letter}</b><i>${d.n}</i>${d.dot ? '<em></em>' : ''}</span>`).join('');

    return `
      <div class="app-mock">
        <div class="app-mock__bar">
          <span class="app-mock__lights"><i></i><i></i><i></i></span>
          <span class="app-mock__url">studyflow.app</span>
          <span class="app-mock__spark">${ICONS.sparkle}</span>
        </div>
        <div class="app-mock__body">
          <ul class="app-mock__side">
            <li class="is-active">${ICONS.layers}</li><li>${ICONS.check}</li><li>${ICONS.timer}</li><li>${ICONS.chart}</li><li>${ICONS.calendar}</li>
          </ul>
          <div class="app-mock__main">
            <div class="app-mock__row">
              <div class="app-mock__card app-mock__card--timer">
                <div class="app-mock__head"><span>${ICONS.timer}Pomodoro</span><em class="app-mock__pill">Listo</em></div>
                <strong class="app-mock__time">25:00</strong>
                <span class="app-mock__track"></span>
                <div class="app-mock__head"><small>Enfoque</small><span class="app-mock__stop">${ICONS.stop}</span></div>
              </div>
              <div class="app-mock__card">
                <div class="app-mock__head"><span>${ICONS.calendar}Esta semana</span></div>
                <div class="app-mock__week">${days}</div>
              </div>
            </div>
            <div class="app-mock__card">
              <div class="app-mock__head"><span>${ICONS.check}Tareas pendientes</span><small>4 de 7</small></div>
              <ul class="app-mock__tasks">
                <li style="--t:239,68,68"><span>Resolver ejercicios de cálculo</span><em>Matemáticas</em></li>
                <li style="--t:245,158,11"><span>Preparar exposición de Historia</span><em>Historia</em></li>
                <li class="is-done" style="--t:34,197,94"><span>Leer capítulo de Biología</span><em>Biología</em>${ICONS.check}</li>
              </ul>
            </div>
            <div class="app-mock__card app-mock__head">
              <span>${ICONS.chart}Productividad semanal</span><b class="app-mock__trend">${ICONS.up}12%</b>
            </div>
          </div>
        </div>
        <div class="app-mock__status">
          <span><i></i>StudyFlow v2.4</span>
          <span>3 tareas hoy <span class="app-mock__sep"></span> <b>🔥 15 días</b></span>
        </div>
      </div>`;
  }

  function mountAll(root = document) {
    root.querySelectorAll('[data-app-mockup]').forEach((el) => {
      el.insertAdjacentHTML('beforeend', html());
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountAll(), { once: true });
  else mountAll();

  return { html, mountAll };
})();
