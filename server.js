// ==========================================================
// StudyFlow — Servidor (backend) para Render
//
// - Sirve la página web (HTML, CSS, JS, imágenes).
// - Entrega datos como API JSON (los datos viven en la carpeta data/):
//     GET /api/salud                 estado del servidor
//     GET /api/eventos               calendario académico (festivos, parciales, entregas)
//     GET /api/eventos?mes=2026-11   solo los eventos de ese mes
//     GET /api/consejos              consejos de estudio
//     GET /api/consejos/hoy          el consejo del día
//
// Todavía no usa base de datos (Supabase u otra): las cuentas, materias y
// tareas de cada estudiante siguen guardándose en su navegador.
// ==========================================================

import express from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const CARPETA_DATOS = path.join(RAIZ, 'data');
const PUERTO = process.env.PORT || 3000;
const COLECCIONES = ['eventos', 'consejos'];
const INICIO = Date.now();

const app = express();
app.disable('x-powered-by');

// Cada llamada a la API queda en los logs de Render: método, ruta, estado y tiempo
app.use('/api', (req, res, next) => {
  const t0 = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    console.log(req.method + ' ' + req.originalUrl + ' → ' + res.statusCode + ' (' + ms.toFixed(1) + ' ms)');
  });
  res.set('Cache-Control', 'no-store');
  next();
});

async function leerColeccion(nombre) {
  const texto = await readFile(path.join(CARPETA_DATOS, nombre + '.json'), 'utf8');
  return JSON.parse(texto);
}

// ---------- API ----------
app.get('/api/salud', (req, res) => {
  res.json({
    ok: true,
    servicio: 'StudyFlow API',
    colecciones: COLECCIONES,
    encendidoHace: Math.round((Date.now() - INICIO) / 1000) + ' s',
    hora: new Date().toISOString()
  });
});

app.get('/api/eventos', async (req, res, next) => {
  try {
    let eventos = await leerColeccion('eventos');
    const { mes, tipo } = req.query;
    if (mes !== undefined) {
      if (!/^\d{4}-\d{2}$/.test(mes)) return res.status(400).json({ error: 'El parámetro mes debe tener el formato AAAA-MM' });
      // Un evento entra si empieza o termina en ese mes
      eventos = eventos.filter((e) => e.fecha.startsWith(mes) || (e.fin || '').startsWith(mes));
    }
    if (tipo) eventos = eventos.filter((e) => e.tipo === tipo);
    res.json(eventos);
  } catch (err) {
    next(err);
  }
});

app.get('/api/consejos/hoy', async (req, res, next) => {
  try {
    const consejos = await leerColeccion('consejos');
    // El mismo consejo durante todo el día (cambia cada día)
    const dia = Math.floor(Date.now() / 86400000);
    res.json(consejos[dia % consejos.length]);
  } catch (err) {
    next(err);
  }
});

app.get('/api/:coleccion', async (req, res, next) => {
  const { coleccion } = req.params;
  if (!COLECCIONES.includes(coleccion)) {
    return res.status(404).json({ error: 'No existe la colección "' + coleccion + '"', colecciones: COLECCIONES });
  }
  try {
    res.json(await leerColeccion(coleccion));
  } catch (err) {
    next(err);
  }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta de API no encontrada' }));

// Errores de la API: se registran en Render y se responde en JSON
app.use('/api', (err, req, res, next) => {
  console.error('Error en ' + req.originalUrl + ':', err);
  res.status(500).json({ error: 'No se pudieron leer los datos' });
});

// ---------- Página web ----------
// Archivos internos que no deben poder descargarse
const PRIVADO = /^\/(node_modules|data|server\.js|package(-lock)?\.json|render\.yaml|\.git)/;
app.use((req, res, next) => (PRIVADO.test(req.path) ? res.status(404).end() : next()));

app.use(express.static(RAIZ, { dotfiles: 'deny', extensions: ['html'] }));

app.listen(PUERTO, () => {
  console.log('StudyFlow funcionando en http://localhost:' + PUERTO);
});
