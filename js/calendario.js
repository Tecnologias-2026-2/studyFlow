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
  const abiertas = new Set(); // tareas con las subtareas desplegadas en el panel del día

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

    // Acciones en el panel del día: se guardan en el mismo almacén que la sección Tareas
    const list = document.getElementById('dayList');
    list.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-day-toggle]');
      if (!toggle) return;
      const id = toggle.dataset.dayToggle;
      if (abiertas.has(id)) abiertas.delete(id); else abiertas.add(id);
      renderDay();
      const again = document.querySelector(`[data-day-toggle="${id}"]`);
      if (again) again.focus();
    });
    list.addEventListener('change', (event) => {
      const box = event.target;
      if (box.dataset.dayTask) {
        const task = SF.toggleTask(box.dataset.dayTask);
        if (task) UI.toast(task.done ? 'Tarea completada' : 'Tarea marcada como pendiente');
      } else if (box.dataset.daySub) {
        SF.toggleSubtask(box.dataset.dayParent, box.dataset.daySub);
      }
      const again = document.querySelector(`[data-fk="${box.dataset.fk}"]`);
      if (again) again.focus();
    });
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
      const subs = task.subtasks || [];
      const doneSubs = subs.filter((s) => s.done).length;
      const open = abiertas.has(task.id);
      const toggle = subs.length
        ? `<button type="button" class="day-panel__toggle" data-day-toggle="${task.id}" aria-expanded="${open}" aria-controls="day-subs-${task.id}" aria-label="${open ? 'Ocultar' : 'Mostrar'} las ${subs.length} subtareas de «${esc(task.title)}»">${icon('right')}</button>`
        : '<span class="day-panel__toggle-space" aria-hidden="true"></span>';
      const subList = subs.length
        ? `<ul class="day-panel__subs" id="day-subs-${task.id}" aria-label="Subtareas de «${esc(task.title)}»"${open ? '' : ' hidden'}>${subs.map((s) => `
            <li class="day-panel__sub${s.done ? ' is-done' : ''}">
              <input type="checkbox" id="day-sub-${s.id}" data-day-sub="${s.id}" data-day-parent="${task.id}" data-fk="day-sub-${s.id}"${s.done ? ' checked' : ''}>
              <label for="day-sub-${s.id}">${esc(s.text)}</label>
            </li>`).join('')}</ul>`
        : '';
      return `<li class="day-panel__task${task.done ? ' is-done' : ''}">
        <div class="day-panel__item">
          ${toggle}
          <input type="checkbox" class="day-panel__check" data-day-task="${task.id}" data-fk="day-task-${task.id}" aria-label="Marcar «${esc(task.title)}» como ${task.done ? 'pendiente' : 'completada'}"${task.done ? ' checked' : ''}>
          <span class="dot-subject"${subject ? ` data-color="${subject.color}"` : ''} aria-hidden="true"></span>
          <span class="day-panel__item-info">
            <span class="day-panel__item-title">${esc(task.title)}</span>
            <span class="day-panel__item-sub">${subject ? esc(subject.name) : 'Sin materia'}${task.dueTime ? ` · ${task.dueTime}` : ''}${subs.length ? ` · ${doneSubs}/${subs.length} subtareas` : ''}${task.done ? ' · Completada' : ''}</span>
          </span>
          <span class="badge badge--${level}">${SF.PRIORITY[level].label}</span>
        </div>
        ${subList}
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
