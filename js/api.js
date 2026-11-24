/* =========================================================
   StudyFlow — Conexión con el backend (server.js en Render)
   Pide los datos públicos a la API. Se ven en el navegador en
   Inspeccionar → Network (Red), filtrando por "api".

     GET /api/eventos?mes=AAAA-MM   calendario académico del mes
     GET /api/testimonios           testimonios de la página de inicio
     GET /api/consejos/hoy          consejo de estudio del día

   Si la página se abre sin servidor (doble clic en el HTML), las
   peticiones fallan y la página sigue funcionando sin esos datos.
   ========================================================= */

window.SFApi = (() => {
  'use strict';

  const BASE = '/api/';
  const cache = new Map();

  async function get(ruta) {
    if (cache.has(ruta)) return cache.get(ruta);
    const promesa = fetch(BASE + ruta, { headers: { Accept: 'application/json' } })
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
        return respuesta.json();
      })
      .catch((error) => {
        cache.delete(ruta); // se puede volver a intentar más tarde
        console.warn(`StudyFlow: no se pudo cargar /api/${ruta} (${error.message}).`);
        throw error;
      });
    cache.set(ruta, promesa);
    return promesa;
  }

  const TIPOS = {
    festivo: { label: 'Festivo', tone: 'red' },
    examenes: { label: 'Exámenes', tone: 'purple' },
    entregas: { label: 'Entregas', tone: 'amber' },
    academico: { label: 'Académico', tone: 'blue' }
  };

  /** Eventos del mes (clave AAAA-MM). Devuelve [] si el servidor no responde. */
  const eventosDelMes = (mes) => get(`eventos?mes=${encodeURIComponent(mes)}`).catch(() => []);

  /** Agrupa eventos por día (AAAA-MM-DD), repitiendo los que duran varios días. */
  function eventosPorDia(eventos) {
    const mapa = {};
    eventos.forEach((evento) => {
      const inicio = new Date(`${evento.fecha}T12:00:00`);
      const fin = new Date(`${evento.fin || evento.fecha}T12:00:00`);
      for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
        const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        (mapa[clave] = mapa[clave] || []).push(evento);
      }
    });
    return mapa;
  }

  return {
    get,
    TIPOS,
    eventosDelMes,
    eventosPorDia,
    testimonios: () => get('testimonios'),
    consejoDelDia: () => get('consejos/hoy')
  };
})();
