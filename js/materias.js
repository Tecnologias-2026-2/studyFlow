/* =========================================================
   StudyFlow — Materias
   Cuadrícula de materias (con buscador por materia o profesor)
   y el modal para crear y editar (nombre, profesor, ícono y color).
   Una cuenta nueva no tiene ninguna materia todavía.
   ========================================================= */

(() => {
  'use strict';

  const SF = window.SF;
  const UI = window.SFUI;
  const { icon } = window.SFIcons;
  const { esc } = SF;
  const $ = (id) => document.getElementById(id);

  let editingId = null;
  let query = '';

  const fold = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  SF.onReady(() => {
    if (!SF.currentUser()) return;
    init();
  });

  function init() {
    $('subjectModalClose').innerHTML = icon('close');
    $('subjectSearchIcon').innerHTML = icon('search');
    $('subjectSearchForm').addEventListener('submit', (event) => event.preventDefault());
    $('subjectSearch').addEventListener('input', (event) => { query = event.target.value; render(); });
    UI.enhanceDialog($('subjectModal'));
    buildPickers();

    $('newSubjectBtn').addEventListener('click', () => openModal());
    $('subjectGrid').addEventListener('click', onGridClick);
    $('subjectForm').addEventListener('submit', onSubmit);

    render();
    document.addEventListener('sf:change', render);

    if (new URLSearchParams(window.location.search).get('nueva') === '1') {
      openModal();
      window.history.replaceState(null, '', window.location.pathname);
    }
  }

  function buildPickers() {
    $('emojiGrid').innerHTML = SF.EMOJIS.map((emoji, i) => `
      <input type="radio" name="emoji" id="emoji-${i}" value="${emoji}"${i === 0 ? ' checked' : ''}>
      <label for="emoji-${i}">${emoji}</label>`).join('');

    $('colorGrid').innerHTML = SF.COLORS.map((color, i) => `
      <input type="radio" name="color" id="color-${i}" value="${color}"${i === 0 ? ' checked' : ''}>
      <label for="color-${i}" data-color="${color}" title="${color}"></label>`).join('');
    UI.applyColors($('colorGrid'));
  }

  function render() {
    const subjects = SF.subjects();
    const total = subjects.length;
    $('subjectCount').textContent = `${total} ${total === 1 ? 'materia registrada' : 'materias registradas'}`;
    $('subjectSearchForm').hidden = !total;

    const q = fold(query.trim());
    const visible = q ? subjects.filter((s) => fold(`${s.name} ${s.teacher || ''}`).includes(q)) : subjects;
    const create = `<button type="button" class="subject-card subject-card--create" id="createTile">
      <span data-icon="plus"></span>Nueva materia</button>`;

    let html;
    if (!total) {
      html = `<div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state__icon">${icon('book')}</span>
          <h2>Aún no tienes materias</h2>
          <p>Crea tu primera materia para empezar a organizar tus tareas por asignatura.</p>
          <button type="button" class="btn btn--primary btn--sm" id="createTile">+ Nueva materia</button>
        </div>`;
    } else if (!visible.length) {
      html = `<div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state__icon">${icon('search')}</span>
          <h2>Sin resultados</h2>
          <p>No hay materias ni profesores que coincidan con «${esc(query.trim())}».</p>
        </div>`;
    } else {
      html = visible.map(cardHTML).join('') + (q ? '' : create);
    }
    $('subjectGrid').innerHTML = html;

    document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = icon(el.dataset.icon); });
    if ($('createTile')) $('createTile').addEventListener('click', () => openModal());
    UI.applyColors($('subjectGrid'));
  }

  function cardHTML(subject) {
    const stats = SF.subjectStats(subject.id);
    const count = `${stats.total} ${stats.total === 1 ? 'tarea' : 'tareas'}`;
    return `
      <article class="subject-card" data-id="${subject.id}" data-color="${subject.color}">
        <div class="subject-card__top">
          <span class="subject-card__emoji" aria-hidden="true">${esc(subject.emoji)}</span>
          <div class="subject-card__actions">
            <button type="button" class="icon-button icon-button--sm" data-edit aria-label="Editar «${esc(subject.name)}»">${icon('edit')}</button>
            <button type="button" class="icon-button icon-button--sm" data-delete aria-label="Eliminar «${esc(subject.name)}»">${icon('trash')}</button>
          </div>
        </div>
        <h3 class="subject-card__name">${esc(subject.name)}</h3>
        <p class="subject-card__teacher">${subject.teacher ? esc(subject.teacher) : 'Sin profesor asignado'}</p>
        <div class="subject-card__meta">
          <span class="subject-card__count">${icon('check')}${count}</span>
          <span class="subject-card__percent" title="Progreso">${stats.progress}%</span>
        </div>
        <progress class="bar bar--subject" data-color="${subject.color}" max="100" value="${stats.progress}" aria-label="Progreso de ${esc(subject.name)}: ${stats.progress}%"></progress>
        <a class="subject-card__link" href="tareas.html?materia=${encodeURIComponent(subject.id)}" aria-label="Ver materia ${esc(subject.name)} y sus tareas">
          <span>Ver materia</span>${icon('arrow')}</a>
      </article>`;
  }

  async function onGridClick(event) {
    const card = event.target.closest('.subject-card');
    if (!card || !card.dataset.id) return;
    const id = card.dataset.id;

    if (event.target.closest('[data-edit]')) {
      openModal(id);
    } else if (event.target.closest('[data-delete]')) {
      const subject = SF.subjectById(id);
      const stats = SF.subjectStats(id);
      const extra = stats.total ? ` Sus ${stats.total} tareas asociadas también se eliminarán.` : '';
      const ok = await UI.confirmDialog({ title: 'Eliminar materia', text: `¿Seguro que quieres eliminar «${subject.name}»?${extra}` });
      if (ok) { SF.removeSubject(id); UI.toast('Materia eliminada'); }
    }
  }

  function openModal(id = null) {
    const form = $('subjectForm');
    editingId = id;
    form.reset();
    UI.clearErrors(form);

    const subject = id ? SF.subjectById(id) : null;
    $('subjectModalTitle').textContent = subject ? 'Editar materia' : 'Nueva materia';
    $('subjectSubmit').textContent = subject ? 'Guardar cambios' : 'Crear materia';

    if (subject) {
      form.name.value = subject.name;
      form.teacher.value = subject.teacher || '';
      const emoji = form.querySelector(`input[name="emoji"][value="${CSS.escape(subject.emoji)}"]`);
      if (emoji) emoji.checked = true;
      const color = form.querySelector(`input[name="color"][value="${subject.color}"]`);
      if (color) color.checked = true;
    }

    $('subjectModal').showModal();
    form.name.focus();
  }

  function onSubmit(event) {
    event.preventDefault();
    const form = event.target;
    UI.clearErrors(form);

    const name = form.name.value.trim();
    if (!name) { UI.setFieldError(form.name, 'Escribe el nombre de la materia.'); return; }

    const payload = { name, teacher: form.teacher.value.trim(), emoji: form.emoji.value, color: form.color.value };

    if (editingId) {
      SF.updateSubject(editingId, payload);
      UI.toast('Materia actualizada');
    } else {
      SF.addSubject(payload);
      UI.toast('Materia creada');
    }

    $('subjectModal').close();
    render();
  }
})();
