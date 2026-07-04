// ============================================================
// modules/dashboard.js — Panel principal con indicadores reales
// Tablas: mmbb_registrations, adultos_registros, eventos, tesoreria_cuentas
// ============================================================
import { getClient, q } from '../core/db.js';
import { UNIDADES } from '../core/config.js';
import { esc, fmtCLP, fmtFecha } from '../core/ui.js';
import * as Permisos from '../core/permisos.js';

export default async function render(el) {
  const sb = getClient();

  // Consultas en paralelo
  const [jovenes, eventos, { count: nAdultos }] = await Promise.all([
    q(sb.from('mmbb_registrations').select('id, unidad, registro_pagado').eq('activo', true)),
    q(sb.from('eventos').select('id, nombre, fecha_inicio').gte('fecha_inicio', new Date().toISOString().slice(0, 10)).order('fecha_inicio').limit(5)).catch(() => []),
    sb.from('adultos_registros').select('id', { count: 'exact', head: true }).eq('activo', true),
  ]);

  const porUnidad = {};
  jovenes.forEach(j => porUnidad[j.unidad] = (porUnidad[j.unidad] || 0) + 1);
  const pagados = jovenes.filter(j => j.registro_pagado).length;

  // Tesorería solo si tiene permiso (RLS igual la protege).
  // Saldo = suma de monto con signo de todos los movimientos (como el original).
  let saldoHtml = '';
  if (Permisos.esAdmin() || Permisos.puede('tesoreria')) {
    try {
      const movs = await q(sb.from('tesoreria_movimientos').select('monto'));
      const total = movs.reduce((s, m) => s + Number(m.monto || 0), 0);
      saldoHtml = `<div class="stat-card">
        <div class="valor">${fmtCLP(total)}</div>
        <div class="etiqueta">Saldo total tesorería</div>
      </div>`;
    } catch { /* sin acceso RLS */ }
  }

  const cardsUnidades = UNIDADES.map(u => `
    <div class="stat-card" style="border-top:4px solid ${u.color}">
      <div class="valor">${porUnidad[u.nombre] || 0}</div>
      <div class="etiqueta">${esc(u.nombre)}</div>
    </div>`).join('');

  const eventosHtml = eventos?.length
    ? eventos.map(e => `<li><strong>${esc(e.nombre)}</strong> — ${fmtFecha(e.fecha_inicio)}</li>`).join('')
    : '<li class="vacio">Sin eventos próximos</li>';

  el.innerHTML = `
    <h1>Dashboard</h1>
    <div class="grid-stats">
      <div class="stat-card">
        <div class="valor">${jovenes.length}</div>
        <div class="etiqueta">Jóvenes activos</div>
        <span class="chip">${pagados} con registro pagado</span>
      </div>
      <div class="stat-card">
        <div class="valor">${nAdultos ?? '—'}</div>
        <div class="etiqueta">Adultos voluntarios</div>
      </div>
      ${saldoHtml}
    </div>
    <h2>Miembros por unidad</h2>
    <div class="grid-stats">${cardsUnidades}</div>
    <div class="card">
      <h2>🏕️ Próximos eventos</h2>
      <ul>${eventosHtml}</ul>
    </div>`;
}
