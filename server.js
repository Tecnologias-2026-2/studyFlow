// ==========================================================
// StudyFlow — Servidor (backend) para Render
//
// - Sirve la página web (HTML, CSS, JS, imágenes).
// - Entrega datos públicos como API JSON (leídos de la carpeta data/):
//     GET /api/salud                          estado del servidor
//     GET /api/eventos                        calendario académico (festivos, parciales, entregas)
//     GET /api/eventos?mes=2026-11&tipo=...   filtrado por mes y/o tipo
//     GET /api/consejos                       consejos de estudio
//     GET /api/consejos/hoy                   el consejo del día (hora de Colombia)
//
// Los datos de cada estudiante (cuenta, perfil, materias, tareas, subtareas
// y Pomodoro) NO pasan por este servidor: el navegador habla directo con
// Supabase (js/cuentas.js y js/sync.js), protegido con RLS.
// ==========================================================

import express from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const CARPETA_DATOS = path.join(RAIZ, 'data');
const PUERTO = process.env.PORT || 3000;
const COLECCIONES = ['eventos', 'consejos'];
const TIPOS_EVENTO = ['academico', 'entregas', 'examenes', 'festivo'];
const MES_VALIDO = /^\d{4}-(0[1-9]|1[0-2])$/;
const ZONA_COLOMBIA_MS = -5 * 3600 * 1000; // UTC-5, sin horario de verano
const INICIO = Date.now();

const app = express();
app.disable('x-powered-by');

// Cabeceras básicas de seguridad para todas las respuestas
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  next();
});

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
      if (typeof mes !== 'string' || !MES_VALIDO.test(mes)) {
        return res.status(400).json({ error: 'El parámetro mes debe tener el formato AAAA-MM (mes entre 01 y 12)' });
      }
      // Un evento entra si empieza o termina en ese mes
      eventos = eventos.filter((e) => e.fecha.startsWith(mes) || (e.fin || '').startsWith(mes));
    }
    if (tipo !== undefined) {
      if (typeof tipo !== 'string' || !TIPOS_EVENTO.includes(tipo)) {
        return res.status(400).json({ error: 'El parámetro tipo no es válido', tipos: TIPOS_EVENTO });
      }
      eventos = eventos.filter((e) => e.tipo === tipo);
    }
    res.json(eventos);
  } catch (err) {
    next(err);
  }
});

app.get('/api/consejos/hoy', async (req, res, next) => {
  try {
    const consejos = await leerColeccion('consejos');
    // El mismo consejo durante todo el día de Colombia (cambia a medianoche, UTC-5)
    const dia = Math.floor((Date.now() + ZONA_COLOMBIA_MS) / 86400000);
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

// La API es de solo lectura: otros métodos sobre rutas existentes → 405
const RUTAS_API = /^\/api\/(salud|eventos|consejos|consejos\/hoy)\/?$/;
app.use('/api', (req, res) => {
  if (RUTAS_API.test(req.originalUrl.split('?')[0])) {
    res.set('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Método ' + req.method + ' no permitido: la API solo acepta GET' });
  }
  res.status(404).json({ error: 'Ruta de API no encontrada' });
});

// Errores de la API: se registran en Render y se responde en JSON
app.use('/api', (err, req, res, next) => {
  console.error('Error en ' + req.originalUrl + ':', err);
  res.status(500).json({ error: 'No se pudieron leer los datos' });
});

// ---------- Librería de Supabase para el navegador ----------
// Se sirve desde este mismo servidor (paquete oficial @supabase/supabase-js,
// versión fijada en package-lock.json) en vez de un CDN externo.
const SUPABASE_NAVEGADOR = path.join(RAIZ, 'node_modules', '@supabase', 'supabase-js', 'dist', 'umd', 'supabase.js');
app.get('/vendor/supabase.js', (req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.type('application/javascript').sendFile(SUPABASE_NAVEGADOR, (err) => {
    if (err && !res.headersSent) res.status(500).type('application/javascript').send('/* Supabase no disponible */');
  });
});

// ---------- Página web ----------
// Archivos internos que no deben poder descargarse
// (carpetas internas, archivos del servidor y cualquier archivo o carpeta oculta)
const PRIVADO = /^\/((node_modules|data|supabase)(\/|$)|(server\.js|package(-lock)?\.json|render\.yaml|README\.md)$|\.)/i;
app.use((req, res, next) => (PRIVADO.test(req.path) ? res.status(404).end() : next()));

app.use(express.static(RAIZ, { dotfiles: 'deny', extensions: ['html'] }));

// Página no encontrada (en español, con enlace al inicio)
app.use((req, res) => {
  res.status(404).type('html').send('<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Página no encontrada — StudyFlow</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#060b17;color:#f3f6fb;font-family:system-ui,sans-serif;text-align:center}a{color:#29d6dd}</style></head><body><main><h1>Página no encontrada</h1><p><a href="/html/inicio.html">Volver al inicio de StudyFlow</a></p></main></body></html>');
});

app.listen(PUERTO, () => {
  console.log('StudyFlow funcionando en http://localhost:' + PUERTO);
});
