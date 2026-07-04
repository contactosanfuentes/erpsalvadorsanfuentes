// ============================================================
// router.js — Router hash con carga perezosa de módulos
// Módulos con campo `legacy` cargan la página original completa.
// ============================================================
import { MODULOS } from './config.js';
import * as Permisos from './permisos.js';
import { mostrarError } from './ui.js';

const outlet = () => document.getElementById('vista');

export function rutaActual() {
  return (location.hash.replace(/^#\/?/, '') || 'dashboard').split('?')[0];
}

export async function navegar() {
  const id = rutaActual();
  const mod = MODULOS.find(m => m.id === id);
  const el = outlet();
  if (!el) return;

  document.querySelectorAll('.nav-item').forEach(a =>
    a.classList.toggle('activo', a.dataset.modulo === id));

  if (!mod) {
    el.innerHTML = `<div class="card"><h2>Módulo no encontrado</h2>
      <p>La ruta <code>#/${id}</code> no existe.</p></div>`;
    return;
  }
  const permisoOk = !mod.permiso
    || Permisos.esAdmin()
    || (mod.permiso === 'admin' ? Permisos.esAdmin() : Permisos.puede(mod.permiso));
  if (!permisoOk) {
    el.innerHTML = `<div class="card"><h2>🔒 Sin acceso</h2>
      <p>No tienes permiso para el módulo <strong>${mod.titulo}</strong>.</p></div>`;
    return;
  }

  try {
    if (mod.legacy) {
      const m = await import('../modules/_legacy.js');
      await m.default(el, { modulo: mod });
    } else {
      el.innerHTML = `<div class="cargando"><div class="spinner"></div><p>Cargando ${mod.titulo}…</p></div>`;
      const m = await import(`../modules/${mod.id}.js`);
      await m.default(el, { modulo: mod });
      Permisos.aplicarUI(el);
    }
  } catch (e) {
    console.error(`[router] módulo ${id}:`, e);
    mostrarError(el, `No se pudo cargar el módulo ${mod.titulo}.`, e);
  }
}

export function iniciarRouter() {
  window.addEventListener('hashchange', navegar);
  navegar();
}
