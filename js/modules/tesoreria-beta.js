// ============================================================
// modules/tesoreria.js — Tesorería (vista de cuentas y movimientos)
// Tablas: tesoreria_cuentas, tesoreria_movimientos (RLS con sesión)
// El saldo se calcula: suma de monto (con signo) por cuenta,
// igual que en el sistema original.
// ============================================================
import { getClient, q } from '../core/db.js';
import { esc, fmtCLP, fmtFecha, tabla } from '../core/ui.js';

export default async function render(el) {
  const sb = getClient();

  const [cuentas, movs] = await Promise.all([
    q(sb.from('tesoreria_cuentas').select('id, nombre, tipo, orden')
      .order('orden', { ascending: true, nullsFirst: false }).order('nombre')),
    q(sb.from('tesoreria_movimientos')
      .select('id, cuenta_id, fecha, concepto, monto, referencia')
      .order('fecha', { ascending: false })),
  ]);

  // Saldo por cuenta = suma de montos con signo
  const saldos = {};
  movs.forEach(m => saldos[m.cuenta_id] = (saldos[m.cuenta_id] || 0) + Number(m.monto || 0));
  const total = Object.values(saldos).reduce((s, v) => s + v, 0);
  const nombreCuenta = {};
  cuentas.forEach(c => nombreCuenta[c.id] = c.nombre);

  const cardsCuentas = cuentas.map(c => {
    const s = saldos[c.id] || 0;
    return `<div class="stat-card" style="border-top:4px solid ${s < 0 ? 'var(--rojo)' : 'var(--gris-borde)'}">
      <div class="valor" style="${s < 0 ? 'color:var(--rojo)' : ''}">${fmtCLP(s)}</div>
      <div class="etiqueta">${esc(c.nombre)}</div>
      <span class="chip">${esc(c.tipo || 'cuenta')}</span>
    </div>`;
  }).join('');

  el.innerHTML = `
    <h1>Tesorería</h1>
    <div class="grid-stats">
      <div class="stat-card" style="border-top:4px solid var(--verde)">
        <div class="valor">${fmtCLP(total)}</div>
        <div class="etiqueta">Saldo total</div>
        <span class="chip">${cuentas.length} cuentas · ${movs.length} movimientos</span>
      </div>
      ${cardsCuentas}
    </div>
    <div class="card">
      <h2>Últimos movimientos</h2>
      <div class="filtros">
        <select id="f-cuenta">
          <option value="">Todas las cuentas</option>
          ${cuentas.map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('')}
        </select>
      </div>
      <div id="lista-movs"></div>
    </div>
    <p class="vacio">Módulo en lectura — el registro/edición de movimientos se migrará desde tesoreria.html en la próxima etapa.</p>`;

  const pintar = () => {
    const cid = el.querySelector('#f-cuenta').value;
    const visibles = (cid ? movs.filter(m => String(m.cuenta_id) === cid) : movs).slice(0, 60);
    el.querySelector('#lista-movs').innerHTML = tabla(visibles, [
      { k: 'fecha', t: 'Fecha', fmt: v => fmtFecha(v) },
      { k: 'concepto', t: 'Concepto' },
      { k: 'cuenta_id', t: 'Cuenta', fmt: v => esc(nombreCuenta[v] || '—') },
      { k: 'monto', t: 'Monto', fmt: v => Number(v) >= 0
          ? `<strong style="color:var(--verde)">${fmtCLP(v)}</strong>`
          : `<strong style="color:var(--rojo)">${fmtCLP(v)}</strong>` },
      { k: 'referencia', t: 'Referencia' },
    ], 'Sin movimientos registrados');
  };
  el.querySelector('#f-cuenta').onchange = pintar;
  pintar();
}
