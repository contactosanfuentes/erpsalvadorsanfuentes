// ============================================================
// ui.js — Utilidades de interfaz compartidas
// ============================================================

// ---------- Formato ----------
export function fmtRut(run) {
  if (!run) return '';
  const limpio = String(run).trim().replace(/[.\-\s]/g, '');
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1).toUpperCase();
  return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
}

export function fmtCLP(n) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n || 0);
}

export function fmtFecha(f) {
  if (!f) return '—';
  const d = new Date(f + (String(f).length === 10 ? 'T12:00:00' : ''));
  return isNaN(d) ? '—' : d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function edad(fechaNac) {
  if (!fechaNac) return null;
  const hoy = new Date(), n = new Date(fechaNac);
  let e = hoy.getFullYear() - n.getFullYear();
  if (hoy < new Date(hoy.getFullYear(), n.getMonth(), n.getDate())) e--;
  return e;
}

export function esc(s) {
  const d = document.createElement('div');
  d.textContent = s ?? '';
  return d.innerHTML;
}

// ---------- Toasts ----------
export function toast(msg, tipo = 'ok') {
  let cont = document.getElementById('toasts');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'toasts';
    document.body.appendChild(cont);
  }
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  t.textContent = msg;
  cont.appendChild(t);
  setTimeout(() => { t.classList.add('salir'); setTimeout(() => t.remove(), 400); }, 3500);
}

// ---------- Error en vista ----------
export function mostrarError(el, mensaje, err) {
  el.innerHTML = `<div class="card card-error">
    <h3>⚠️ ${esc(mensaje)}</h3>
    <p class="detalle-error">${esc(err?.message || '')}</p>
    <button class="btn" onclick="location.reload()">Reintentar</button>
  </div>`;
}

// ---------- Tabla genérica ----------
// cols: [{k:'campo', t:'Título', fmt: fn?}]
export function tabla(filas, cols, vacio = 'Sin registros') {
  if (!filas?.length) return `<p class="vacio">${esc(vacio)}</p>`;
  const head = cols.map(c => `<th>${esc(c.t)}</th>`).join('');
  const body = filas.map(f =>
    `<tr>${cols.map(c => `<td>${c.fmt ? c.fmt(f[c.k], f) : esc(f[c.k] ?? '—')}</td>`).join('')}</tr>`
  ).join('');
  return `<div class="tabla-scroll"><table class="tabla">
    <thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}
