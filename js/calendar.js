/* =========================================================
   StudyFlow — Calendario
   Componente reutilizable (dashboard y página Calendario).
   Los puntos de color salen de las tareas pendientes con fecha límite;
   una cuenta nueva no tiene ninguno.
   ========================================================= */

(() => {
  'use strict';

  const SF = window.SF;
  const UI = window.SFUI;
  const { icon } = window.SFIcons;
  const { esc } = SF;

  const root = document.querySelector('[data-calendar]');
  if (!root) return;

  const selectable = !root.dataset.link;
  let view;
  let selected;
  const academicos = {}; // AAAA-MM → eventos del calendario académico (desde /api/eventos)

  SF.onReady(() => {
    if (!SF.currentUser()) return;

    const requested = new URLSearchParams(window.location.search).get('fecha');
    const base = /^\d{4}-\d{2}-\d{2}$/.test(requested || '') ? SF.fromKey(requested) : new Date();
    view = new Date(base.getFullYear(), base.getMonth(), 1);
    selected = SF.toKey(base);

    build();
    render();
    document.addEventListener('sf:change', render);
  });

  function build() {
    root.innerHTML = `
      <div class="calendar__header">
        <button type="button" class="calendar__nav" data-prev aria-label="Mes anterior">${icon('left')}</button>
        <h2 class="calendar__title" id="cal-titulo"><span data-month></span> <span class="calendar__year" data-year></span></h2>
        <button type="button" class="calendar__nav" data-next aria-label="Mes siguiente">${icon('right')}</button>
      </div>
      <div class="calendar__weekdays" aria-hidden="true"><span>DOM</span><span>LUN</span><span>MAR</span><span>MIE</span><span>JUE</span><span>VIE</span><span>SAB</span></div>
      <div class="calendar__grid" data-grid></div>
      <ul class="calendar__legend" data-legend aria-label="Leyenda" hidden></ul>`;

    root.querySelector('[data-prev]').addEventListener('click', () => shiftMonth(-1));
    root.querySelector('[data-next]').addEventListener('click', () => shiftMonth(1));

    root.querySelector('[data-grid]').addEventListener('click', (event) => {
      const button = event.target.closest('button[data-date]');
      if (!button) return;

      if (root.dataset.link) {
        window.location.href = `${root.dataset.link}?fecha=${button.dataset.date}`;
        return;
      }
      selected = button.dataset.date;
      render();
      root.querySelector(`button[data-date="${selected}"]`).focus();
      document.dispatchEvent(new CustomEvent('sf:calendar-select', { detail: { key: selected } }));
    });
  }

  function shiftMonth(delta) {
    view = new Date(view.getFullYear(), view.getMonth() + delta, 1);
    render();
  }

  /** Tareas con fecha límite agrupadas por día (clave AAAA-MM-DD). */
  function tasksByDay() {
    const map = {};
    SF.tasks().forEach((task) => {
      if (!task.dueDate) return;
      (map[task.dueDate] = map[task.dueDate] || []).push(task);
    });
    return map;
  }

  function render() {
    const focusKey = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.date : null;
    const grid = root.querySelector('[data-grid]');
    const year = view.getFullYear();
    const month = view.getMonth();
    const offset = new Date(year, month, 1).getDay();
    const events = tasksByDay();
    const todayKey = SF.todayKey();
    const mes = `${year}-${String(month + 1).padStart(2, '0')}`;
    cargarAcademicos(mes);
    const academicosDia = window.SFApi && academicos[mes] ? window.SFApi.eventosPorDia(academicos[mes]) : {};

    root.querySelector('[data-month]').textContent = SF.MONTHS[month].charAt(0).toUpperCase() + SF.MONTHS[month].slice(1);
    root.querySelector('[data-year]').textContent = year;

    const cells = [];
    for (let i = 0; i < 42; i += 1) {
      const date = new Date(year, month, i - offset + 1);
      if (date.getMonth() !== month) {
        cells.push(`<span class="calendar__day is-outside" aria-hidden="true">${date.getDate()}</span>`);
        continue;
      }

      const key = SF.toKey(date);
      const pending = (events[key] || []).filter((t) => !t.done);
      const classes = ['calendar__day'];
      if (key === todayKey) classes.push('is-today');
      else if (selectable && key === selected) classes.push('is-selected');

      const total = (events[key] || []).length;
      const totalSubs = (events[key] || []).reduce((n, t) => n + (t.subtasks || []).length, 0);
      const delDia = academicosDia[key] || [];
      if (delDia.length) classes.push('has-event', `has-event--${delDia[0].tipo}`);
      const textoEventos = delDia.map((e) => `${window.SFApi.TIPOS[e.tipo] ? window.SFApi.TIPOS[e.tipo].label : 'Evento'}: ${e.titulo}`).join(', ');
      const label = `${date.getDate()} de ${SF.MONTHS[month]} de ${year}${total ? `, ${total} ${total === 1 ? 'tarea' : 'tareas'}` : ''}${totalSubs ? ` con ${totalSubs} ${totalSubs === 1 ? 'subtarea' : 'subtareas'}` : ''}${textoEventos ? `, ${textoEventos}` : ''}`;

      const dots = pending.length
        ? `<span class="calendar__dots" aria-hidden="true">${uniqueColors(pending).map((c) => `<span class="dot-subject"${c ? ` data-color="${c}"` : ''}></span>`).join('')}</span>`
        : '';

      const marca = delDia.length ? `<span class="calendar__mark" aria-hidden="true"></span>` : '';
      cells.push(`<button type="button" class="${classes.join(' ')}" data-date="${key}" aria-label="${esc(label)}"${delDia.length ? ` title="${esc(textoEventos)}"` : ''}${selectable ? ` aria-pressed="${key === selected}"` : ''}>${date.getDate()}${dots}${marca}</button>`);
    }
    grid.innerHTML = cells.join('');

    renderLegend();
    UI.applyColors(root);

    if (focusKey) {
      const again = grid.querySelector(`button[data-date="${focusKey}"]`);
      if (again) again.focus();
    }
  }

  /** Pide al backend los eventos del mes (una vez por mes) y vuelve a pintar. */
  function cargarAcademicos(mes) {
    if (!window.SFApi || mes in academicos) return;
    academicos[mes] = null;
    window.SFApi.eventosDelMes(mes).then((lista) => {
      academicos[mes] = lista;
      render();
      document.dispatchEvent(new CustomEvent('sf:eventos', { detail: { mes } }));
    });
  }

  function uniqueColors(tasks) {
    const colors = [];
    tasks.forEach((task) => {
      const subject = SF.subjectById(task.subjectId);
      const color = subject ? subject.color : '';
      if (!colors.includes(color)) colors.push(color);
    });
    return colors.slice(0, 3);
  }

  function renderLegend() {
    const legend = root.querySelector('[data-legend]');
    const subjects = SF.subjects();
    const mes = `${view.getFullYear()}-${String(view.getMonth() + 1).padStart(2, '0')}`;
    const tipos = [...new Set((academicos[mes] || []).map((e) => e.tipo))];
    legend.hidden = subjects.length === 0 && tipos.length === 0;
    legend.innerHTML = subjects
      .map((s) => `<li><span class="dot-subject" data-color="${s.color}" aria-hidden="true"></span>${esc(s.name)}</li>`)
      .join('') + tipos
      .map((tipo) => `<li><span class="calendar__mark calendar__mark--legend has-event--${tipo}" aria-hidden="true"></span>${esc(window.SFApi.TIPOS[tipo] ? window.SFApi.TIPOS[tipo].label : tipo)}</li>`)
      .join('');
  }

  window.SFCalendar = { getSelected: () => selected, academicos: (mes) => academicos[mes] || [] };
})();
