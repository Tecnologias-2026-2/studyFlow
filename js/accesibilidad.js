// ==========================================================
// StudyFlow — Ajustes de accesibilidad
//
// Botón redondo en la esquina inferior izquierda que abre un panel
// lateral con:
//   - Perfiles (activan varios ajustes a la vez)
//   - Módulos de contenido (texto, enlaces, títulos, espaciado...)
//   - Módulos de color (contraste, modo oscuro, saturación...)
//   - Módulos de orientación (animaciones, imágenes, guía, cursor)
// Los ajustes se guardan en este navegador y se aplican en todas
// las páginas. Se carga en el <head> para que no "parpadee".
// ==========================================================

(function () {
  var CLAVE = 'studyflow:accesibilidad';
  var CLAVE_OCULTO = 'studyflow:accesibilidad-oculto';
  var TAMANOS = [100, 115, 130, 150];

  // ---------- Íconos (SVG de trazo, heredan el color) ----------
  function svg(cuerpo) {
    return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + cuerpo + '</svg>';
  }
  var I = {
    persona: svg('<circle cx="12" cy="4.5" r="1.8" fill="currentColor"/><path d="M5 8.5l7 1.5 7-1.5"/><path d="M12 10v4.5l-3 6"/><path d="M12 14.5l3 6"/>'),
    ojo: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    rayo: svg('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
    foco: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
    libro: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'),
    enlace: svg('<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>'),
    titulo: svg('<path d="M6 4v16M18 4v16M6 12h12"/>'),
    letra: svg('<path d="M4 20L10 4l6 16M6.5 14h7"/><path d="M17 20v-6a2.5 2.5 0 0 1 5 0v6M17 17h5"/>'),
    espacio: svg('<path d="M3 7h18M3 12h18M3 17h18"/><path d="M7 4l-3 3 3 3M17 14l3 3-3 3"/>'),
    contraste: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>'),
    luna: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
    gota: svg('<path d="M12 2.7l5.7 5.7a8 8 0 1 1-11.3 0z"/>'),
    gris: svg('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 15l5-5 4 4 3-3 6 6"/>'),
    pausa: svg('<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>'),
    imagen: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/><path d="M3 3l18 18"/>'),
    guia: svg('<path d="M3 12h18"/><path d="M3 6h18M3 18h18" opacity=".35"/>'),
    cursor: svg('<path d="M4 3l7 18 2.5-7.5L21 11z"/>'),
    mas: svg('<path d="M12 5v14M5 12h14"/>'),
    menos: svg('<path d="M5 12h14"/>'),
    cerrar: svg('<path d="M18 6L6 18M6 6l12 12"/>'),
    reiniciar: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>')
  };

  // ---------- Qué se puede activar ----------
  var MODULOS = {
    contenido: [
      { id: 'enlaces', texto: 'Resaltar enlaces', icono: 'enlace' },
      { id: 'titulos', texto: 'Resaltar títulos', icono: 'titulo' },
      { id: 'legible', texto: 'Letra legible', icono: 'letra' },
      { id: 'espaciado', texto: 'Espaciado de texto', icono: 'espacio' }
    ],
    color: [
      { id: 'contraste', texto: 'Alto contraste', icono: 'contraste' },
      { id: 'oscuro', texto: 'Modo oscuro', icono: 'luna' },
      { id: 'saturacion', texto: 'Baja saturación', icono: 'gota' },
      { id: 'monocromo', texto: 'Monocromo', icono: 'gris' }
    ],
    orientacion: [
      { id: 'pausa', texto: 'Detener animaciones', icono: 'pausa' },
      { id: 'sinimagenes', texto: 'Ocultar imágenes', icono: 'imagen' },
      { id: 'guia', texto: 'Guía de lectura', icono: 'guia' },
      { id: 'cursor', texto: 'Cursor grande', icono: 'cursor' }
    ]
  };
  var PERFILES = [
    { id: 'vision', titulo: 'Modo para baja visión', detalle: 'Texto más grande, más contraste y enlaces resaltados', icono: 'ojo',
      activa: { tamano: 130, contraste: true, enlaces: true, titulos: true, cursor: true } },
    { id: 'epilepsia', titulo: 'Modo seguro para epilepsia', detalle: 'Detiene las animaciones y suaviza los colores', icono: 'rayo',
      activa: { pausa: true, saturacion: true } },
    { id: 'tdah', titulo: 'Modo amigable para el TDAH', detalle: 'Menos distracciones y una guía para leer', icono: 'foco',
      activa: { pausa: true, guia: true, titulos: true } },
    { id: 'dislexia', titulo: 'Modo para dislexia', detalle: 'Letra más clara y más espacio entre letras y líneas', icono: 'libro',
      activa: { legible: true, espaciado: true } }
  ];
  var TODOS = [].concat(MODULOS.contenido, MODULOS.color, MODULOS.orientacion).map(function (m) { return m.id; });

  // ---------- Ajustes guardados ----------
  function leer() {
    try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; }
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(ajustes)); } catch (e) { /* sin almacenamiento */ }
  }
  var ajustes = leer();
  if (TAMANOS.indexOf(ajustes.tamano) === -1) ajustes.tamano = 100;

  // ---------- Estilos ----------
  var AZUL = '#0b6f75', AZUL_OSCURO = '#074b50';
  var CSS = [
    // Tamaño: amplía todo menos el propio panel
    'html[data-a11y-tamano] body > *:not(.a11y){zoom:var(--a11y-zoom,1)}',
    // Filtros de color (se combinan en --a11y-filtro)
    'html[data-a11y-filtro] body > *:not(.a11y){filter:var(--a11y-filtro)}',
    // En modo oscuro, las fotos se vuelven a invertir para que se vean normales
    'html.a11y-oscuro img,html.a11y-oscuro video,html.a11y-oscuro picture{filter:invert(1) hue-rotate(180deg)}',
    'html.a11y-oscuro body{background:#111}',
    // Contenido
    'html.a11y-enlaces a:not(.a11y *){text-decoration:underline !important;text-underline-offset:3px;text-decoration-thickness:2px;outline:2px dashed currentColor;outline-offset:2px}',
    'html.a11y-titulos :is(h1,h2,h3,h4,h5,h6):not(.a11y *){outline:3px solid #f2ce5e !important;outline-offset:4px;border-radius:4px}',
    // En modo oscuro el amarillo se invertiría a café: se usa el color del propio título
    'html.a11y-oscuro.a11y-titulos :is(h1,h2,h3,h4,h5,h6):not(.a11y *){outline-color:currentColor !important}',
    'html.a11y-legible body *:not(.a11y *):not(svg):not(svg *){font-family:Verdana,Tahoma,Arial,sans-serif !important}',
    'html.a11y-espaciado body *:not(.a11y *){letter-spacing:.12em !important;word-spacing:.16em !important}',
    'html.a11y-espaciado :is(p,li,dd,td):not(.a11y *){line-height:1.8 !important}',
    // Orientación
    'html.a11y-pausa *,html.a11y-pausa *::before,html.a11y-pausa *::after{animation:none !important;transition:none !important;scroll-behavior:auto !important}',
    'html.a11y-sinimagenes img:not(.a11y *),html.a11y-sinimagenes video:not(.a11y *){opacity:0 !important}',
    'html.a11y-sinimagenes *:not(.a11y *){background-image:none !important}',
    'html.a11y-cursor,html.a11y-cursor *{cursor:url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 24 24\'><path d=\'M4 3l7 18 2.5-7.5L21 11z\' fill=\'black\' stroke=\'white\' stroke-width=\'1.5\'/></svg>") 6 3,auto !important}',
    '.a11y__guia{position:fixed;left:0;right:0;height:3px;background:' + AZUL + ';box-shadow:0 0 0 3px #f2ce5e;pointer-events:none;z-index:9998;display:none}',
    'html.a11y-guia .a11y__guia{display:block}',

    // ---------- Botón flotante ----------
    '.a11y{font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#1d293d}',
    '.a11y *{box-sizing:border-box}',
    '.a11y__boton{position:fixed;right:20px;bottom:20px;z-index:9999;display:flex;align-items:center;justify-content:center;width:56px;height:56px;padding:0;border:3px solid #fff;border-radius:50%;background:' + AZUL + ';color:#fff;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.3);transition:transform .2s}',
    '.a11y__boton:hover{transform:scale(1.07)}',
    '.a11y__boton svg{width:30px;height:30px}',
    '.a11y--oculto .a11y__boton{display:none}',

    // ---------- Panel lateral ----------
    '.a11y__fondo{position:fixed;inset:0;z-index:10000;background:rgba(0,20,30,.45)}',
    '.a11y__panel{position:fixed;top:0;right:0;bottom:0;z-index:10001;width:440px;max-width:100vw;overflow-y:auto;background:#eef3f7;box-shadow:-8px 0 32px rgba(0,0,0,.3)}',
    '.a11y__fondo[hidden],.a11y__panel[hidden]{display:none}',
    '.a11y__cabeza{position:relative;padding:20px 20px 64px;background:' + AZUL + ';color:#fff;text-align:center}',
    '.a11y__barra{display:flex;justify-content:space-between;align-items:center;gap:8px}',
    '.a11y__chip{display:inline-flex;align-items:center;gap:6px;height:40px;padding:0 14px;border:1.5px solid rgba(255,255,255,.7);border-radius:999px;background:transparent;color:#fff;font:inherit;font-size:14px;font-weight:600;cursor:pointer}',
    '.a11y__chip svg{width:18px;height:18px}',
    '.a11y__x{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border:0;border-radius:50%;background:' + AZUL_OSCURO + ';color:#fff;cursor:pointer}',
    '.a11y__x svg{width:20px;height:20px}',
    '.a11y__logo{display:flex;align-items:center;justify-content:center;width:64px;height:64px;margin:18px auto 10px;border-radius:50%;background:#fff;color:' + AZUL + '}',
    '.a11y__logo svg{width:38px;height:38px}',
    '.a11y__titulo{margin:0;font-size:26px;line-height:32px;font-weight:800;color:#fff}',
    '.a11y__ocultar{margin-top:10px;padding:4px 8px;border:0;background:none;color:#fff;font:inherit;font-size:15px;text-decoration:underline;text-underline-offset:3px;cursor:pointer}',
    '.a11y__cuerpo{position:relative;z-index:1;margin-top:-44px;padding:0 16px 24px}',
    '.a11y__caja{margin-bottom:16px;padding:20px;border-radius:20px;background:#fff;box-shadow:0 2px 6px rgba(2,83,115,.08)}',
    '.a11y__subtitulo{margin:0 0 12px;font-size:18px;line-height:24px;font-weight:800;color:#1d293d}',
    // Perfiles con interruptor
    '.a11y__perfil{display:flex;align-items:center;gap:14px;width:100%;padding:14px 4px;border:0;border-bottom:1px solid #e2e8f0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}',
    '.a11y__perfil:last-child{border-bottom:0}',
    '.a11y__perfil-ico{display:flex;flex-shrink:0;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:#eef3f7;color:' + AZUL + '}',
    '.a11y__perfil-txt{flex:1}',
    '.a11y__perfil-txt b{display:block;font-size:16px;line-height:22px;color:#1d293d}',
    '.a11y__perfil-txt small{display:block;font-size:14px;line-height:20px;color:#45556c}',
    '.a11y__switch{position:relative;flex-shrink:0;width:46px;height:26px;border-radius:999px;background:#8a99ad;transition:background .2s}',
    '.a11y__switch::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .2s}',
    '.a11y__perfil[aria-checked="true"] .a11y__switch{background:' + AZUL + '}',
    '.a11y__perfil[aria-checked="true"] .a11y__switch::after{transform:translateX(20px)}',
    // Tarjetas de módulos
    '.a11y__rejilla{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
    '.a11y__tamano{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px;border-radius:16px;background:#eef3f7}',
    '.a11y__tamano b{font-size:15px}',
    '.a11y__tamano-fila{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;max-width:280px;padding:4px;border-radius:999px;background:#fff}',
    '.a11y__circulo{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border:0;border-radius:50%;background:' + AZUL + ';color:#fff;cursor:pointer}',
    '.a11y__circulo svg{width:20px;height:20px}',
    '.a11y__circulo:disabled{background:#94a3b8;cursor:not-allowed}',
    '.a11y__valor{font-size:15px;font-weight:700;color:#1d293d}',
    '.a11y__mod{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:118px;padding:14px 8px;border:2px solid transparent;border-radius:16px;background:#eef3f7;color:#1d293d;font:inherit;font-size:14px;font-weight:600;line-height:18px;text-align:center;cursor:pointer;transition:background .15s,border-color .15s}',
    '.a11y__mod:hover{border-color:#c5dde6}',
    '.a11y__mod-ico{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:#fff;color:' + AZUL + '}',
    '.a11y__mod[aria-pressed="true"]{border-color:' + AZUL + ';background:' + AZUL + ';color:#fff}',
    '.a11y__mod[aria-pressed="true"] .a11y__mod-ico{color:' + AZUL + '}',
    '.a11y__reset{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:52px;border:0;border-radius:16px;background:' + AZUL + ';color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer}',
    '.a11y__reset svg{width:20px;height:20px}',
    '.a11y button:focus-visible{outline:3px solid #f2ce5e;outline-offset:2px;box-shadow:0 0 0 6px ' + AZUL + '}',
    '.a11y__nota{margin:4px 0 0;font-size:13px;line-height:18px;color:#45556c;text-align:center}',
    '@media (max-width:560px){.a11y__boton{right:12px;bottom:12px;width:50px;height:50px}.a11y__panel{width:100vw}body{padding-bottom:72px}}'
  ].join('');

  var estilo = document.createElement('style');
  estilo.id = 'a11y-estilos';
  estilo.textContent = CSS;
  document.head.appendChild(estilo);

  // ---------- Aplicar ajustes a la página ----------
  function aplicar() {
    var html = document.documentElement;
    TODOS.forEach(function (id) { html.classList.toggle('a11y-' + id, !!ajustes[id]); });

    if (ajustes.tamano !== 100) {
      html.setAttribute('data-a11y-tamano', ajustes.tamano);
      html.style.setProperty('--a11y-zoom', ajustes.tamano / 100);
    } else {
      html.removeAttribute('data-a11y-tamano');
      html.style.removeProperty('--a11y-zoom');
    }

    var filtros = [];
    if (ajustes.oscuro) filtros.push('invert(1) hue-rotate(180deg)');
    if (ajustes.contraste) filtros.push('contrast(1.45)');
    if (ajustes.saturacion) filtros.push('saturate(.45)');
    if (ajustes.monocromo) filtros.push('grayscale(1)');
    if (filtros.length) {
      html.setAttribute('data-a11y-filtro', '');
      html.style.setProperty('--a11y-filtro', filtros.join(' '));
    } else {
      html.removeAttribute('data-a11y-filtro');
      html.style.removeProperty('--a11y-filtro');
    }
  }
  aplicar(); // antes de que se pinte la página

  // ---------- Construir el botón y el panel ----------
  function tarjeta(m) {
    return '<button class="a11y__mod" type="button" data-a11y-mod="' + m.id + '" aria-pressed="false">' +
      '<span class="a11y__mod-ico">' + I[m.icono] + '</span>' + m.texto + '</button>';
  }

  function construir() {
    if (document.querySelector('.a11y')) return;

    var raiz = document.createElement('div');
    raiz.className = 'a11y';
    try { if (sessionStorage.getItem(CLAVE_OCULTO)) raiz.classList.add('a11y--oculto'); } catch (e) { /* nada */ }

    raiz.innerHTML =
      '<button class="a11y__boton" type="button" aria-expanded="false" aria-controls="a11y-panel" aria-label="Ajustes de accesibilidad">' + I.persona + '</button>' +
      '<div class="a11y__fondo" hidden></div>' +
      '<div class="a11y__panel" id="a11y-panel" role="dialog" aria-modal="true" aria-labelledby="a11y-titulo" hidden>' +
        '<div class="a11y__cabeza">' +
          '<div class="a11y__barra">' +
            '<button class="a11y__chip" type="button" data-a11y-reset>' + I.reiniciar + 'Restablecer</button>' +
            '<button class="a11y__x" type="button" aria-label="Cerrar ajustes de accesibilidad">' + I.cerrar + '</button>' +
          '</div>' +
          '<div class="a11y__logo">' + I.persona + '</div>' +
          '<h2 class="a11y__titulo" id="a11y-titulo">Ajustes de accesibilidad</h2>' +
          '<button class="a11y__ocultar" type="button">Ocultar el botón de accesibilidad</button>' +
        '</div>' +
        '<div class="a11y__cuerpo">' +
          '<section class="a11y__caja" aria-labelledby="a11y-perfiles">' +
            '<h3 class="a11y__subtitulo" id="a11y-perfiles">Seleccione su perfil de accesibilidad</h3>' +
            PERFILES.map(function (p) {
              return '<button class="a11y__perfil" type="button" role="switch" aria-checked="false" data-a11y-perfil="' + p.id + '">' +
                '<span class="a11y__perfil-ico">' + I[p.icono] + '</span>' +
                '<span class="a11y__perfil-txt"><b>' + p.titulo + '</b><small>' + p.detalle + '</small></span>' +
                '<span class="a11y__switch" aria-hidden="true"></span></button>';
            }).join('') +
          '</section>' +
          '<section class="a11y__caja" aria-labelledby="a11y-contenido">' +
            '<h3 class="a11y__subtitulo" id="a11y-contenido">Módulos de contenido</h3>' +
            '<div class="a11y__rejilla">' +
              '<div class="a11y__tamano" role="group" aria-labelledby="a11y-tamano-titulo">' +
                '<b id="a11y-tamano-titulo">Tamaño de fuente</b>' +
                '<div class="a11y__tamano-fila">' +
                  '<button class="a11y__circulo" type="button" data-a11y-tamano="-1" aria-label="Disminuir tamaño de fuente">' + I.menos + '</button>' +
                  '<span class="a11y__valor" aria-live="polite"></span>' +
                  '<button class="a11y__circulo" type="button" data-a11y-tamano="1" aria-label="Aumentar tamaño de fuente">' + I.mas + '</button>' +
                '</div>' +
              '</div>' +
              MODULOS.contenido.map(tarjeta).join('') +
            '</div>' +
          '</section>' +
          '<section class="a11y__caja" aria-labelledby="a11y-color">' +
            '<h3 class="a11y__subtitulo" id="a11y-color">Módulos de color</h3>' +
            '<div class="a11y__rejilla">' + MODULOS.color.map(tarjeta).join('') + '</div>' +
          '</section>' +
          '<section class="a11y__caja" aria-labelledby="a11y-orientacion">' +
            '<h3 class="a11y__subtitulo" id="a11y-orientacion">Módulos de orientación</h3>' +
            '<div class="a11y__rejilla">' + MODULOS.orientacion.map(tarjeta).join('') + '</div>' +
          '</section>' +
          '<button class="a11y__reset" type="button" data-a11y-reset>' + I.reiniciar + 'Restablecer todos los ajustes</button>' +
          '<p class="a11y__nota">Los ajustes se guardan en este navegador.</p>' +
        '</div>' +
      '</div>' +
      '<div class="a11y__guia" aria-hidden="true"></div>';
    document.body.appendChild(raiz);

    var boton = raiz.querySelector('.a11y__boton');
    var panel = raiz.querySelector('.a11y__panel');
    var fondo = raiz.querySelector('.a11y__fondo');
    var valor = raiz.querySelector('.a11y__valor');
    var menos = raiz.querySelector('[data-a11y-tamano="-1"]');
    var mas = raiz.querySelector('[data-a11y-tamano="1"]');
    var guia = raiz.querySelector('.a11y__guia');

    // Un perfil está "activo" si todos sus ajustes están puestos
    function perfilActivo(p) {
      return Object.keys(p.activa).every(function (k) {
        return k === 'tamano' ? ajustes.tamano >= p.activa.tamano : !!ajustes[k];
      });
    }

    function pintar() {
      valor.textContent = ajustes.tamano === 100 ? 'Predeterminado' : ajustes.tamano + ' %';
      menos.disabled = ajustes.tamano === TAMANOS[0];
      mas.disabled = ajustes.tamano === TAMANOS[TAMANOS.length - 1];
      raiz.querySelectorAll('[data-a11y-mod]').forEach(function (b) {
        b.setAttribute('aria-pressed', ajustes[b.dataset.a11yMod] ? 'true' : 'false');
      });
      PERFILES.forEach(function (p) {
        raiz.querySelector('[data-a11y-perfil="' + p.id + '"]').setAttribute('aria-checked', perfilActivo(p) ? 'true' : 'false');
      });
    }

    function cambiar() { guardar(); aplicar(); pintar(); }

    // ---- Abrir y cerrar (el foco queda dentro mientras está abierto) ----
    function abrir(si) {
      panel.hidden = !si;
      fondo.hidden = !si;
      boton.setAttribute('aria-expanded', si ? 'true' : 'false');
      if (si) raiz.querySelector('.a11y__x').focus();
      else if (!raiz.classList.contains('a11y--oculto')) boton.focus();
    }
    boton.addEventListener('click', function () { abrir(true); });
    raiz.querySelector('.a11y__x').addEventListener('click', function () { abrir(false); });
    fondo.addEventListener('click', function () { abrir(false); });

    document.addEventListener('keydown', function (e) {
      if (panel.hidden) return;
      if (e.key === 'Escape') { abrir(false); return; }
      if (e.key !== 'Tab') return;
      var lista = panel.querySelectorAll('button:not([disabled])');
      var primero = lista[0], ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    });

    // ---- Ocultar el botón (vuelve a aparecer en la próxima visita) ----
    raiz.querySelector('.a11y__ocultar').addEventListener('click', function () {
      try { sessionStorage.setItem(CLAVE_OCULTO, '1'); } catch (e) { /* nada */ }
      raiz.classList.add('a11y--oculto');
      abrir(false);
    });

    // ---- Perfiles: encienden o apagan varios ajustes juntos ----
    raiz.querySelectorAll('[data-a11y-perfil]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = PERFILES.filter(function (x) { return x.id === b.dataset.a11yPerfil; })[0];
        var encender = !perfilActivo(p);
        Object.keys(p.activa).forEach(function (k) {
          if (k === 'tamano') ajustes.tamano = encender ? Math.max(ajustes.tamano, p.activa.tamano) : 100;
          else ajustes[k] = encender;
        });
        cambiar();
      });
    });

    // ---- Módulos ----
    raiz.querySelectorAll('[data-a11y-mod]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.dataset.a11yMod;
        ajustes[id] = !ajustes[id];
        cambiar();
      });
    });

    // ---- Tamaño de fuente ----
    [menos, mas].forEach(function (b) {
      b.addEventListener('click', function () {
        var i = TAMANOS.indexOf(ajustes.tamano) + Number(b.getAttribute('data-a11y-tamano'));
        ajustes.tamano = TAMANOS[Math.max(0, Math.min(TAMANOS.length - 1, i))];
        cambiar();
        if (b.disabled) (b === mas ? menos : mas).focus(); // que el foco no se pierda
      });
    });

    // ---- Restablecer ----
    raiz.querySelectorAll('[data-a11y-reset]').forEach(function (b) {
      b.addEventListener('click', function () {
        ajustes = { tamano: 100 };
        cambiar();
      });
    });

    // ---- Guía de lectura: una línea que sigue al mouse o al dedo ----
    function moverGuia(y) { guia.style.top = (y - 1) + 'px'; }
    document.addEventListener('mousemove', function (e) { if (ajustes.guia) moverGuia(e.clientY); });
    document.addEventListener('touchmove', function (e) { if (ajustes.guia && e.touches[0]) moverGuia(e.touches[0].clientY); }, { passive: true });
    moverGuia(window.innerHeight / 2);

    pintar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', construir);
  else construir();
})();
