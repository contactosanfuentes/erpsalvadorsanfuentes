// ============================================================
// modules/programa.js — Programa de Jóvenes: progresión por unidad
// Tablas: progresion_jovenes + mmbb_registrations
// Terminología AGSCh: etapas por rama (ej. Clan: Paso/Compromiso/Partida)
// ============================================================
import { getClient, q } from '../core/db.js';
import { UNIDADES } from '../core/config.js';
import { esc, tabla } from '../core/ui.js';

export default async function render(el) {
  const sb = getClient();

  const [jovenes, progresion] = await Promise.all([
    q(sb.from('mmbb_registrations').select('id, nombres, apellidos, apellido_paterno, apellido_materno, unidad').eq('activo', true)),
    q(sb.from('progresion_jovenes').select('joven_id, etapa_actual, updated_at')),
  ]);

  const progPorJoven = {};
  progresion.forEach(p => progPorJoven[p.joven_id] = p);

  const filas = jovenes.map(j => ({
    nombre: `${j.nombres || ''} ${j.apellidos || `${j.apellido_paterno || ''} ${j.apellido_materno || ''}`}`.trim(),
    unidad: j.unidad,
    etapa: progPorJoven[j.id]?.etapa_actual || null,
  }));

  // Resumen por unidad: cuántos tienen etapa registrada
  const resumen = UNIDADES.map(u => {
    const deUnidad = filas.filter(f => f.unidad === u.nombre);
    const conEtapa = deUnidad.filter(f => f.etapa).length;
    const pct = deUnidad.length ? Math.round(conEtapa / deUnidad.length * 100) : 0;
    return `<div class="stat-card" style="border-top:4px solid ${u.color}">
      <div class="etiqueta"><strong>${esc(u.nombre)}</strong></div>
      <div class="valor">${conEtapa}/${deUnidad.length}</div>
      <div class="etiqueta">con etapa de progresión registrada</div>
      <div class="prog-barra" style="margin-top:8px"><div style="width:${pct}%;background:${u.color}"></div></div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <h1>Programa de Jóvenes</h1>
    <div class="grid-stats">${resumen}</div>
    <div class="filtros">
      <select id="f-unidad">
        <option value="">Todas las unidades</option>
        ${UNIDADES.map(u => `<option>${esc(u.nombre)}</option>`).join('')}
      </select>
      <label style="display:flex;align-items:center;gap:6px;font-size:14px">
        <input type="checkbox" id="f-sin"> Solo sin etapa registrada
      </label>
    </div>
    <div class="card" id="lista"></div>
    <p class="vacio">La ficha completa de progresión (competencias, camino, proyectos) se migrará por rama desde programa_jovenes.html.</p>`;

  const pintar = () => {
    const uni = el.querySelector('#f-unidad').value;
    const soloSin = el.querySelector('#f-sin').checked;
    const visibles = filas.filter(f =>
      (!uni || f.unidad === uni) && (!soloSin || !f.etapa));
    el.querySelector('#lista').innerHTML = tabla(visibles, [
      { k: 'nombre', t: 'Nombre' },
      { k: 'unidad', t: 'Unidad', fmt: v => {
          const u = UNIDADES.find(x => x.nombre === v);
          return `<span class="badge" style="background:${u?.color || '#64748B'}">${esc(v || '—')}</span>`;
        } },
      { k: 'etapa', t: 'Etapa de progresión', fmt: v => v
          ? `<strong>${esc(v)}</strong>`
          : '<span class="vacio">sin registro</span>' },
    ]);
  };
  el.querySelector('#f-unidad').onchange = pintar;
  el.querySelector('#f-sin').onchange = pintar;
  pintar();
}
