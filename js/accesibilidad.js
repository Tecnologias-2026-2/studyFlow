// ==========================================================
// StudyFlow — Ajustes de accesibilidad
//
// Botón redondo en la esquina inferior derecha que abre una media
// ventana flotante (en el celular, una hoja inferior) con:
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
  // Paleta de StudyFlow
  var PRIMARIO = '#29d6dd', PRIMARIO_OSC = '#1aa8b0', FONDO = '#0a1226', TARJETA = '#101a30',
      BORDE = 'rgba(255,255,255,.08)', TEXTO = '#f3f6fb', SUAVE = '#a3aec4';
  var AZUL = PRIMARIO;
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

    // ---------- Botón flotante (colores de StudyFlow) ----------
    '.a11y{font-family:"Plus Jakarta Sans","Segoe UI",system-ui,-apple-system,sans-serif;color:' + TEXTO + '}',
    '.a11y *{box-sizing:border-box}',
    '.a11y__boton{position:fixed;right:20px;bottom:20px;z-index:9999;display:flex;align-items:center;justify-content:center;width:56px;height:56px;padding:0;border:2px solid rgba(255,255,255,.85);border-radius:50%;background:linear-gradient(135deg,#34e0e7,' + PRIMARIO_OSC + ');color:#04191c;cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.5),0 0 0 4px rgba(41,214,221,.15);transition:transform .16s ease}',
    '.a11y__boton:hover{transform:translateY(-2px)}',
    '.a11y__boton[aria-expanded="true"]{box-shadow:0 10px 28px rgba(0,0,0,.5),0 0 0 4px rgba(41,214,221,.45)}',
    '.a11y__boton svg{width:30px;height:30px}',
    '.a11y--oculto .a11y__boton{display:none}',

    // ---------- Media ventana flotante ----------
    '.a11y__fondo{position:fixed;inset:0;z-index:10000;background:transparent}',
    '.a11y__panel{position:fixed;right:20px;bottom:88px;z-index:10001;display:flex;flex-direction:column;width:400px;height:min(580px,70vh,calc(100vh - 112px));height:min(580px,70dvh,calc(100dvh - 112px));overflow:hidden;border:1px solid ' + BORDE + ';border-radius:24px;background:' + FONDO + ';box-shadow:0 24px 70px rgba(0,0,0,.6),0 0 0 1px rgba(41,214,221,.12)}',
    '.a11y__fondo[hidden],.a11y__panel[hidden]{display:none}',
    '@media (prefers-reduced-motion:no-preference){.a11y__panel:not([hidden]){animation:a11y-entra .18s ease-out}}',
    '@keyframes a11y-entra{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}',
    '.a11y__asa{display:none}',
    '.a11y__cabeza{flex:none;display:flex;align-items:center;gap:12px;padding:16px 16px 14px;border-bottom:1px solid ' + BORDE + ';background:' + TARJETA + '}',
    '.a11y__logo{display:flex;flex:none;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;background:rgba(41,214,221,.14);color:' + PRIMARIO + '}',
    '.a11y__logo svg{width:26px;height:26px}',
    '.a11y__cabeza-txt{flex:1;min-width:0}',
    '.a11y__titulo{margin:0;font-size:17px;line-height:22px;font-weight:800;color:' + TEXTO + '}',
    '.a11y__ocultar{margin:2px 0 0;padding:2px 0;border:0;background:none;color:' + SUAVE + ';font:inherit;font-size:13px;text-decoration:underline;text-underline-offset:3px;cursor:pointer}',
    '.a11y__ocultar:hover{color:' + TEXTO + '}',
    '.a11y__chip{display:inline-flex;flex:none;align-items:center;justify-content:center;width:40px;height:40px;padding:0;border:1px solid ' + BORDE + ';border-radius:50%;background:rgba(255,255,255,.04);color:' + TEXTO + ';cursor:pointer}',
    '.a11y__chip svg,.a11y__x svg{width:18px;height:18px}',
    '.a11y__x{display:flex;flex:none;align-items:center;justify-content:center;width:40px;height:40px;border:1px solid ' + BORDE + ';border-radius:50%;background:rgba(255,255,255,.04);color:' + TEXTO + ';cursor:pointer}',
    '.a11y__chip:hover,.a11y__x:hover{background:rgba(255,255,255,.1)}',
    '.a11y__cuerpo{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:14px 14px 18px;scrollbar-width:thin;scrollbar-color:#2a3654 transparent}',
    '.a11y__caja{margin-bottom:12px;padding:16px;border:1px solid ' + BORDE + ';border-radius:16px;background:' + TARJETA + '}',
    '.a11y__subtitulo{margin:0 0 8px;font-size:15px;line-height:20px;font-weight:800;color:' + TEXTO + '}',
    // Perfiles con interruptor
    '.a11y__perfil{display:flex;align-items:center;gap:12px;width:100%;padding:11px 2px;border:0;border-bottom:1px solid ' + BORDE + ';background:none;color:inherit;font:inherit;text-align:left;cursor:pointer}',
    '.a11y__perfil:last-child{border-bottom:0}',
    '.a11y__perfil-ico{display:flex;flex-shrink:0;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;background:rgba(41,214,221,.12);color:' + PRIMARIO + '}',
    '.a11y__perfil-ico svg{width:20px;height:20px}',
    '.a11y__perfil-txt{flex:1;min-width:0}',
    '.a11y__perfil-txt b{display:block;font-size:14px;line-height:20px;color:' + TEXTO + '}',
    '.a11y__perfil-txt small{display:block;font-size:12.5px;line-height:17px;color:' + SUAVE + '}',
    '.a11y__switch{position:relative;flex-shrink:0;width:44px;height:24px;border-radius:999px;background:#33405c;transition:background .16s}',
    '.a11y__switch::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#f3f6fb;box-shadow:0 1px 3px rgba(0,0,0,.4);transition:transform .16s}',
    '.a11y__perfil[aria-checked="true"] .a11y__switch{background:' + PRIMARIO + '}',
    '.a11y__perfil[aria-checked="true"] .a11y__switch::after{transform:translateX(20px);background:#04191c}',
    // Tarjetas de módulos
    '.a11y__rejilla{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
    '.a11y__tamano{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 10px 10px 14px;border-radius:12px;background:rgba(255,255,255,.04)}',
    '.a11y__tamano b{font-size:13.5px;color:' + TEXTO + '}',
    '.a11y__tamano-fila{display:flex;align-items:center;gap:8px}',
    '.a11y__circulo{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:0;border-radius:50%;background:' + PRIMARIO + ';color:#04191c;cursor:pointer}',
    '.a11y__circulo svg{width:18px;height:18px}',
    '.a11y__circulo:disabled{background:#33405c;color:#8b96ad;cursor:not-allowed}',
    '.a11y__valor{min-width:104px;font-size:13.5px;font-weight:700;text-align:center;color:' + TEXTO + '}',
    '.a11y__mod{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:86px;padding:10px 6px;border:1px solid ' + BORDE + ';border-radius:12px;background:rgba(255,255,255,.03);color:' + TEXTO + ';font:inherit;font-size:12.5px;font-weight:600;line-height:16px;text-align:center;cursor:pointer;transition:background .16s,border-color .16s}',
    '.a11y__mod:hover{border-color:rgba(41,214,221,.45);background:rgba(41,214,221,.06)}',
    '.a11y__mod-ico{display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;color:' + PRIMARIO + '}',
    '.a11y__mod-ico svg{width:20px;height:20px}',
    '.a11y__mod[aria-pressed="true"]{border-color:' + PRIMARIO + ';background:rgba(41,214,221,.16)}',
    '.a11y__mod[aria-pressed="true"] .a11y__mod-ico{background:' + PRIMARIO + ';color:#04191c}',
    '.a11y__reset{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:46px;border:0;border-radius:999px;background:linear-gradient(135deg,#34e0e7,' + PRIMARIO_OSC + ');color:#04191c;font:inherit;font-size:14.5px;font-weight:700;cursor:pointer}',
    '.a11y__reset svg{width:18px;height:18px}',
    '.a11y button:focus-visible{outline:3px solid #ffcf5c;outline-offset:2px}',
    '.a11y__nota{margin:10px 0 0;font-size:12px;line-height:16px;color:' + SUAVE + ';text-align:center}',
    // Móvil: hoja inferior que ocupa media pantalla
    '@media (max-width:560px){' +
      '.a11y__boton{right:12px;bottom:12px;width:50px;height:50px}' +
      '.a11y__fondo{background:rgba(4,9,24,.6)}' +
      '.a11y__panel{left:8px;right:8px;bottom:8px;width:auto;height:62vh;height:62dvh;max-height:calc(100dvh - 16px);border-radius:22px}' +
      '.a11y__asa{display:block;flex:none;width:40px;height:4px;margin:8px auto 0;border-radius:4px;background:#33405c}' +
      '.a11y__cabeza{padding:10px 12px 12px;gap:10px}' +
      '.a11y__rejilla{grid-template-columns:repeat(2,1fr)}' +
      'body{padding-bottom:72px}' +
    '}',
    '@media (max-width:340px){.a11y__tamano{flex-direction:column;align-items:stretch}.a11y__tamano-fila{justify-content:space-between}}'
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
        '<span class="a11y__asa" aria-hidden="true"></span>' +
        '<div class="a11y__cabeza">' +
          '<span class="a11y__logo" aria-hidden="true">' + I.persona + '</span>' +
          '<div class="a11y__cabeza-txt">' +
            '<h2 class="a11y__titulo" id="a11y-titulo">Ajustes de accesibilidad</h2>' +
            '<button class="a11y__ocultar" type="button">Ocultar el botón</button>' +
          '</div>' +
          '<button class="a11y__chip" type="button" data-a11y-reset aria-label="Restablecer todos los ajustes" title="Restablecer">' + I.reiniciar + '</button>' +
          '<button class="a11y__x" type="button" aria-label="Cerrar ajustes de accesibilidad">' + I.cerrar + '</button>' +
        '</div>' +
        '<div class="a11y__cuerpo">' +
          '<section class="a11y__caja" aria-labelledby="a11y-perfiles">' +
            '<h3 class="a11y__subtitulo" id="a11y-perfiles">Perfiles</h3>' +
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
