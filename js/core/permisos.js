// ============================================================
// permisos.js — Sistema de permisos (ES module)
// Misma lógica del permisos.js original: rol base (roles_permisos)
// + permisos_extra del perfil. Usa las mismas tablas.
// ============================================================
import { getClient } from './db.js';

let _permisos = {};
let _perfil = null;
let _rolesDef = {};
let _asesorados = [];
let _listo = false;
let _initPromise = null;

export async function init() {
  if (_listo) return true;
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    try {
      const sb = getClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { _listo = true; return false; }

      const { data: perfil } = await sb.from('perfiles').select('*').eq('id', user.id).single();
      _perfil = perfil;

      const { data: roles } = await sb.from('roles_permisos').select('*');
      (roles || []).forEach(r => _rolesDef[r.rol] = r);

      const base = _rolesDef[perfil?.rol]?.permisos || {};
      const extra = perfil?.permisos_extra || {};
      _permisos = { ...base, ...extra };

      try {
        const { data: ap } = await sb.from('asesores_personales')
          .select('asesorado_adulto_id')
          .eq('asesor_perfil_id', user.id)
          .eq('activo', true);
        _asesorados = (ap || []).map(a => a.asesorado_adulto_id);
      } catch { _asesorados = []; }

      _listo = true;
      return true;
    } catch (e) {
      console.error('[permisos] init:', e);
      _initPromise = null;
      return false;
    }
  })();
  return _initPromise;
}

export const puede    = (p) => _permisos[p] === true;
export const rol      = () => _perfil?.rol || null;
export const nivel    = () => _rolesDef[_perfil?.rol]?.nivel || 0;
export const unidad   = () => _perfil?.unidad_asignada || null;
export const perfil   = () => _perfil;
export const esAdmin  = () => _perfil?.rol === 'admin';
export const listo    = () => _listo;
export const asesorados = () => _asesorados;

// Oculta elementos con data-permiso no autorizado
export function aplicarUI(root = document) {
  root.querySelectorAll('[data-permiso]').forEach(el => {
    if (!puede(el.getAttribute('data-permiso'))) el.style.display = 'none';
  });
}
