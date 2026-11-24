/* =========================================================
   StudyFlow — Página Calendario: panel con el detalle del día
   ========================================================= */

(() => {
  'use strict';

  const SF = window.SF;
  const UI = window.SFUI;
  const { icon } = window.SFIcons;
  const { esc } = SF;

  let currentKey = SF.todayKey();

  SF.onReady(() => {
    if (!SF.currentUser()) return;

    const requested = new URLSearchParams(window.location.search).get('fecha');
    if (/^\d{4}-\d{2}-\d{2}$/.test(requested || '')) currentKey = requested;

    renderDay();
    document.addEventListener('sf:calendar-select', (event) => {
      currentKey = event.detail.key;
      renderDay();
    });
    document.addEventListener('sf:change', renderDay);
    document.addEventListener('sf:eventos', renderDay);
  });

  function renderDay() {
    const date = SF.fromKey(currentKey);
    const weekday = SF.WEEKDAYS[date.getDay()];

    document.getElementById('dayWeekday').textContent = weekday.toUpperCase();
    document.getElementById('dayDate').textContent = `${date.getDate()} de ${SF.MONTHS[date.getMonth()]}`;
    document.getElementById('dayYear').textContent = date.getFullYear();
    document.getElementById('dayCreate').href = `tareas.html?nueva=1&fecha=${currentKey}`;

    const tasks = SF.tasks()
      .filter((t) => t.dueDate === currentKey)
      .sort((a, b) => (a.dueTime || '99:99').localeCompare(b.dueTime || '99:99'));

    const list = document.getElementById('dayList');
    const empty = document.getElementById('dayEmpty');

    list.innerHTML = tasks.map((task) => {
      const subject = SF.subjectById(task.subjectId);
      const level = task.priority;
      return `<li class="day-panel__item${task.done ? ' is-done' : ''}">
        <span class="dot-subject"${subject ? ` data-color="${subject.color}"` : ''} aria-hidden="true"></span>
        <span class="day-panel__item-info">
          <span class="day-panel__item-title">${esc(task.title)}</span>
          <span class="day-panel__item-sub">${subject ? esc(subject.name) : 'Sin materia'}${task.dueTime ? ` · ${task.dueTime}` : ''}${task.done ? ' · Completada' : ''}</span>
        </span>
        <span class="badge badge--${level}">${SF.PRIORITY[level].label}</span>
      </li>`;
    }).join('');

    empty.hidden = tasks.length > 0;
    empty.innerHTML = `
      <span class="day-panel__empty-icon">${icon('clipboard')}</span>
      <p class="day-panel__empty-title">Sin tareas programadas</p>
      <p class="day-panel__empty-text">No tienes tareas programadas para este día.</p>`;

    UI.applyColors(list);
    renderAcademicos();
  }

  /** Eventos del calendario académico (vienen del backend: /api/eventos). */
  function renderAcademicos() {
    let box = document.getElementById('dayEvents');
    if (!box) {
      box = document.createElement('div');
      box.id = 'dayEvents';
      box.className = 'day-events';
      document.getElementById('dayList').before(box);
    }
    const mes = currentKey.slice(0, 7);
    const lista = window.SFCalendar && window.SFApi
      ? (window.SFApi.eventosPorDia(window.SFCalendar.academicos(mes))[currentKey] || [])
      : [];
    box.hidden = lista.length === 0;
    box.innerHTML = lista.length ? `<h3 class="day-events__title">Calendario académico</h3><ul class="day-events__list">${lista.map((e) => {
      const tipo = window.SFApi.TIPOS[e.tipo] || { label: 'Evento' };
      return `<li class="day-events__item has-event--${esc(e.tipo)}"><span class="day-events__type">${esc(tipo.label)}</span><span class="day-events__name">${esc(e.titulo)}</span><span class="day-events__desc">${esc(e.descripcion || '')}</span></li>`;
    }).join('')}</ul>` : '';
  }
})();
