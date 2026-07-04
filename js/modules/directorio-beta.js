// ============================================================
// modules/directorio.js — Directorio de miembros
// Tablas: mmbb_registrations (jóvenes), adultos_registros (adultos)
// ============================================================
import { getClient, q } from '../core/db.js';
import { UNIDADES } from '../core/config.js';
import { esc, fmtRut, fmtFecha, edad, tabla } from '../core/ui.js';

let _jovenes = [], _adultos = [], _vista = 'jovenes';

export default async function render(el) {
  const sb = getClient();
  [_jovenes, _adultos] = await Promise.all([
    q(sb.from('mmbb_registrations')
      .select('id, nombres, apellidos, apellido_paterno, apellido_materno, run, unidad, fecha_nacimiento, apoderado_titular_nombre, apoderado_titular_telefono, activo')
      .eq('activo', true).order('apellido_paterno')),
    q(sb.from('adultos_registros')
      .select('id, nombres, apellidos, apellido_paterno, apellido_materno, run, unidad_rol, roles, telefono, email, activo')
      .eq('activo', true).order('apellido_paterno')),
  ]);

  el.innerHTML = `
    <h1>Directorio</h1>
    <div class="filtros">
      <button class="btn ${_vista === 'jovenes' ? '' : 'btn-sec'}" id="btn-jov">Jóvenes (${_jovenes.length})</button>
      <button class="btn ${_vista === 'adultos' ? '' : 'btn-sec'}" id="btn-adu">Adultos (${_adultos.length})</button>
      <input type="search" id="buscar" placeholder="Buscar por nombre o RUT…">
      <select id="f-unidad">
        <option value="">Todas las unidades</option>
        ${UNIDADES.map(u => `<option>${esc(u.nombre)}</option>`).join('')}
      </select>
    </div>
    <div class="card" id="lista"></div>`;

  const pintar = () => {
    const txt = el.querySelector('#buscar').value.toLowerCase().trim();
    const uni = el.querySelector('#f-unidad').value;
    const nombre = (r) => `${r.nombres || ''} ${r.apellidos || `${r.apellido_paterno || ''} ${r.apellido_materno || ''}`}`.trim();

    if (_vista === 'jovenes') {
      let filas = _jovenes.filter(r =>
        (!uni || r.unidad === uni) &&
        (!txt || nombre(r).toLowerCase().includes(txt) || (r.run || '').includes(txt)));
      el.querySelector('#lista').innerHTML = tabla(filas, [
        { k: 'nombres', t: 'Nombre', fmt: (_, r) => esc(nombre(r)) },
        { k: 'run', t: 'RUT', fmt: v => fmtRut(v) },
        { k: 'unidad', t: 'Unidad', fmt: v => badgeUnidad(v) },
        { k: 'fecha_nacimiento', t: 'Edad', fmt: v => edad(v) ?? '—' },
        { k: 'apoderado_titular_nombre', t: 'Apoderado/a' },
        { k: 'apoderado_titular_telefono', t: 'Teléfono' },
      ]);
    } else {
      let filas = _adultos.filter(r =>
        (!uni || (r.unidad_rol || '').includes(uni.split(' ')[0])) &&
        (!txt || nombre(r).toLowerCase().includes(txt) || (r.run || '').includes(txt)));
      el.querySelector('#lista').innerHTML = tabla(filas, [
        { k: 'nombres', t: 'Nombre', fmt: (_, r) => esc(nombre(r)) },
        { k: 'run', t: 'RUT', fmt: v => fmtRut(v) },
        { k: 'unidad_rol', t: 'Unidad / Rol' },
        { k: 'telefono', t: 'Teléfono' },
        { k: 'email', t: 'Email' },
      ]);
    }
  };

  el.querySelector('#btn-jov').onclick = () => { _vista = 'jovenes'; render(el); };
  el.querySelector('#btn-adu').onclick = () => { _vista = 'adultos'; render(el); };
  el.querySelector('#buscar').oninput = pintar;
  el.querySelector('#f-unidad').onchange = pintar;
  pintar();
}

function badgeUnidad(nombre) {
  const u = UNIDADES.find(x => x.nombre === nombre);
  return `<span class="badge" style="background:${u?.color || '#64748B'}">${esc(nombre || '—')}</span>`;
}
