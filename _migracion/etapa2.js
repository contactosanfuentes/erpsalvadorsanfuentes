// ============================================================
// etapa2.js — Divide módulos IIFE en archivos temáticos.
// Método: desenvuelve (async()=>{ CUERPO })() → CUERPO dividido en
// scripts clásicos + la cola de inicialización (con await) envuelta
// en su propio (async()=>{...})(); al final.
// Verificaciones:
//   A2: desenvolver+concatenar reproduce el cuerpo original exacto
//   B:  cada archivo parsea standalone y solo el último tiene await
//   C:  la página reemplaza 1 tag por N tags, nada más cambia
// Uso: node etapa2.js <config.json>
// ============================================================
const acorn = require('acorn');
const fs = require('fs');
const path = require('path');

const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const rutaApp = path.join(cfg.destino, cfg.carpeta, 'js', '00_app.js');
const src = fs.readFileSync(rutaApp, 'utf8');

const ast = acorn.parse(src, { ecmaVersion: 'latest', allowAwaitOutsideFunction: true });
if (ast.body.length !== 1) throw new Error('Se esperaba un único IIFE');
const fnNode = ast.body[0].expression.callee;
const cuerpoNodes = fnNode.body.body;

// Cuerpo textual: desde después de la llave de apertura hasta antes de la de cierre
const abre = fnNode.body.start;   // posición de '{'
const cierra = fnNode.body.end;   // posición después de '}'
const cuerpoTexto = src.slice(abre + 1, cierra - 1);
const offset = abre + 1; // para convertir posiciones absolutas a relativas del cuerpo

function inicioDeLinea(posAbs) {
  const rel = posAbs - offset;
  const nl = cuerpoTexto.lastIndexOf('\n', rel - 1);
  return nl + 1;
}

const wrapDesde = cfg.wrapDesde; // índice de sentencia desde el cual envolver (o null)
const grupos = cfg.grupos;
const cortes = grupos.map(g => ({ nombre: g.nombre, pos: g.desde === 0 ? 0 : inicioDeLinea(cuerpoNodes[g.desde].start) }));
const posWrap = (wrapDesde != null) ? inicioDeLinea(cuerpoNodes[wrapDesde].start) : cuerpoTexto.length;

const outJs = path.join(cfg.destino, cfg.carpeta, 'js');
const archivos = [];
for (let i = 0; i < cortes.length; i++) {
  const ini = cortes[i].pos;
  const fin = i + 1 < cortes.length ? cortes[i + 1].pos : posWrap;
  if (fin <= ini) throw new Error(`Grupo vacío o fuera de orden: ${cortes[i].nombre}`);
  const fn = `${String(i).padStart(2, '0')}_${cortes[i].nombre}.js`;
  fs.writeFileSync(path.join(outJs, fn), cuerpoTexto.slice(ini, fin));
  archivos.push(fn);
}
let colaWrap = '';
if (wrapDesde != null) {
  colaWrap = cuerpoTexto.slice(posWrap);
  const fn = `${String(cortes.length).padStart(2, '0')}_inicializacion.js`;
  fs.writeFileSync(path.join(outJs, fn), `(async () => {\n${colaWrap}\n})();\n`);
  archivos.push(fn);
}

// ---------- VERIFICACIÓN A2: reconstrucción exacta del cuerpo ----------
let recon = '';
for (let i = 0; i < archivos.length; i++) {
  let contenido = fs.readFileSync(path.join(outJs, archivos[i]), 'utf8');
  if (wrapDesde != null && i === archivos.length - 1) {
    const pre = '(async () => {\n', post = '\n})();\n';
    if (!contenido.startsWith(pre) || !contenido.endsWith(post)) throw new Error('Wrapper inesperado');
    contenido = contenido.slice(pre.length, -post.length);
  }
  recon += contenido;
}
if (recon !== cuerpoTexto) throw new Error('FALLO A2: reconstrucción difiere del cuerpo original');
console.log(`✓ A2: ${archivos.length} archivos; el cuerpo del IIFE se reconstruye exacto`);

// ---------- VERIFICACIÓN B: parseo standalone + awaits solo en el último ----------
for (let i = 0; i < archivos.length; i++) {
  const contenido = fs.readFileSync(path.join(outJs, archivos[i]), 'utf8');
  const esUltimoWrap = (wrapDesde != null && i === archivos.length - 1);
  try {
    acorn.parse(contenido, { ecmaVersion: 'latest', allowAwaitOutsideFunction: esUltimoWrap });
  } catch (e) { throw new Error(`FALLO B: ${archivos[i]}: ${e.message}`); }
}
console.log('✓ B: todos parsean; await de nivel superior solo en la cola envuelta');

// ---------- Actualizar la página ----------
const pagina = path.join(cfg.destino, cfg.pagina);
let html = fs.readFileSync(pagina, 'utf8');
const tagViejo = cfg.tagViejo; // ej: '<script src="checkin/js/00_app.js"></script>'
if (!html.includes(tagViejo)) throw new Error('Tag original no encontrado en la página');
const indent = (html.split('\n').find(l => l.includes(tagViejo)) || '').match(/^\s*/)[0];
const tags = archivos.map(f => `<script src="${cfg.carpeta}/js/${f}"></script>`).join('\n' + indent);
html = html.replace(tagViejo, () => tags);
fs.writeFileSync(pagina, html);
fs.unlinkSync(rutaApp);
console.log(`✓ C: ${cfg.pagina} actualizada (1 tag → ${archivos.length} tags); 00_app.js eliminado`);
console.log(`LISTO: ${cfg.carpeta} → ${archivos.join(', ')}`);
