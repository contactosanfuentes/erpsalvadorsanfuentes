// ============================================================
// migrador.js — Descompone una página monolítica del ERP en módulos
// Método: parse AST (acorn) → cortar SOLO en inicios de sentencia
// de nivel superior → agrupar por tema → triple verificación.
// Uso: node migrador.js <config.json>
// ============================================================
const acorn = require('acorn');
const fs = require('fs');
const path = require('path');

const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const src = fs.readFileSync(cfg.origen, 'utf8');

// ---------- 1. Localizar el script principal por delimitadores exactos ----------
const iniScript = src.indexOf(cfg.scriptInicio) + cfg.scriptInicio.length;
const finScript = src.indexOf(cfg.scriptFin, iniScript);
if (iniScript < cfg.scriptInicio.length || finScript < 0) throw new Error('Delimitadores de script no encontrados');
const script = src.slice(iniScript, finScript);

// ---------- 2. Parsear y obtener sentencias top-level ----------
const ast = acorn.parse(script, { ecmaVersion: 'latest', allowAwaitOutsideFunction: true });
const stmts = ast.body;
console.log(`Script: ${script.split('\n').length} líneas, ${stmts.length} sentencias top-level`);

// ---------- 3. Cortar por grupos (offsets al inicio de línea de cada sentencia) ----------
function inicioDeLinea(pos) {
  const nl = script.lastIndexOf('\n', pos - 1);
  return nl + 1;
}
const grupos = cfg.grupos; // [{nombre, desde}] — desde = índice de sentencia; el primero debe ser 0
const cortes = grupos.map(g => ({ nombre: g.nombre, pos: g.desde === 0 ? 0 : inicioDeLinea(stmts[g.desde].start) }));
for (let i = 1; i < cortes.length; i++) {
  if (cortes[i].pos <= cortes[i-1].pos) throw new Error(`Grupo fuera de orden: ${cortes[i].nombre}`);
}

const outJs = path.join(cfg.destino, cfg.carpeta, 'js');
fs.mkdirSync(outJs, { recursive: true });
const archivos = [];
for (let i = 0; i < cortes.length; i++) {
  const ini = cortes[i].pos;
  const fin = i + 1 < cortes.length ? cortes[i+1].pos : script.length;
  const fn = `${String(i).padStart(2,'0')}_${cortes[i].nombre}.js`;
  fs.writeFileSync(path.join(outJs, fn), script.slice(ini, fin));
  archivos.push(fn);
}

// ---------- VERIFICACIÓN A: concatenación == script original ----------
const recon = archivos.map(f => fs.readFileSync(path.join(outJs, f), 'utf8')).join('');
if (recon !== script) throw new Error('FALLO A: concatenación difiere del original');
console.log(`✓ A: ${archivos.length} módulos JS; concatenación == original (byte a byte)`);

// ---------- VERIFICACIÓN B: cada módulo es JS válido standalone ----------
for (const f of archivos) {
  try {
    acorn.parse(fs.readFileSync(path.join(outJs, f), 'utf8'), { ecmaVersion: 'latest', allowAwaitOutsideFunction: true });
  } catch(e) { throw new Error(`FALLO B: ${f} no parsea: ${e.message}`); }
}
console.log('✓ B: todos los módulos parsean standalone');

// ---------- 4. Extraer bloques CSS ----------
const outCss = path.join(cfg.destino, cfg.carpeta, 'css');
fs.mkdirSync(outCss, { recursive: true });
let pagina = src;
const cssReemplazos = [];
(cfg.estilos || []).forEach((e, i) => {
  const a = pagina.indexOf(e.inicio);
  const b = pagina.indexOf(e.fin, a);
  if (a < 0 || b < 0) throw new Error(`Bloque CSS no encontrado: ${e.archivo}`);
  const contenido = pagina.slice(a + e.inicio.length, b);
  fs.writeFileSync(path.join(outCss, e.archivo), contenido);
  const bloqueOriginal = pagina.slice(a, b + e.fin.length);
  const link = `<link rel="stylesheet" href="${cfg.carpeta}/css/${e.archivo}">`;
  cssReemplazos.push({ bloqueOriginal, link, contenido, e });
  pagina = pagina.slice(0, a) + link + pagina.slice(b + e.fin.length);
});
console.log(`✓ CSS: ${cssReemplazos.length} hojas extraídas`);

// ---------- 5. Reemplazar el script principal por tags src ----------
const tags = archivos.map(f => `    <script src="${cfg.carpeta}/js/${f}"></script>`).join('\n');
const bloqueScript = cfg.scriptInicio + script + cfg.scriptFin;
if (!pagina.includes(bloqueScript)) throw new Error('Bloque de script no localizable tras extracción CSS');
pagina = pagina.replace(bloqueScript, () => tags);
fs.writeFileSync(path.join(cfg.destino, cfg.pagina), pagina);

// ---------- VERIFICACIÓN C: reconstrucción end-to-end == página original ----------
let reconstruida = fs.readFileSync(path.join(cfg.destino, cfg.pagina), 'utf8');
reconstruida = reconstruida.replace(tags, () => bloqueScript);
for (const r of cssReemplazos.reverse()) {
  reconstruida = reconstruida.replace(r.link, () => r.bloqueOriginal);
}
if (reconstruida !== src) throw new Error('FALLO C: la página reconstruida difiere del original');
console.log('✓ C: página regenerada reconstruye el original exacto (end-to-end)');
console.log(`\nLISTO: ${cfg.pagina} → ${cfg.carpeta}/ (${archivos.length} JS + ${cssReemplazos.length} CSS)`);
