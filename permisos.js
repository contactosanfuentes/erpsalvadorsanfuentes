// ============================================================
// SISTEMA DE PERMISOS ERP SCOUT - permisos.js
// Incluir en cada módulo: <script src="permisos.js"></script>
// Uso: await Permisos.init(supabaseClient); luego Permisos.puede('tesoreria')
// ============================================================
window.Permisos = (function(){
    let _permisos = {};
    let _perfil = null;
    let _rolesDef = {};
    let _listo = false;
    let _asesorados = []; // IDs de adultos_registros que este usuario asesora (su PPF)

    let _initPromise = null;

    async function init(sb){
        if(_listo) return true;
        if(_initPromise) return _initPromise; // evitar doble llamada concurrente
        _initPromise = (async()=>{
            try {
                const {data:{user}} = await sb.auth.getUser();
                if(!user){ _listo=true; return false; }

                const {data:perfil} = await sb.from('perfiles').select('*').eq('id',user.id).single();
                _perfil = perfil;

                const {data:roles} = await sb.from('roles_permisos').select('*');
                (roles||[]).forEach(r=>_rolesDef[r.rol]=r);

                const base = _rolesDef[perfil?.rol]?.permisos || {};
                const extra = perfil?.permisos_extra || {};
                _permisos = {...base, ...extra};
                // Cargar asesorados ANTES de marcar listo
                try {
                    const { data: apData } = await sb.from('asesores_personales')
                        .select('asesorado_adulto_id')
                        .eq('asesor_perfil_id', user.id)
                        .eq('activo', true);
                    _asesorados = (apData || []).map(a => a.asesorado_adulto_id);
                } catch(e) { _asesorados = []; }
                _listo = true; // marcar listo solo cuando TODO está cargado
                return true;
            } catch(e){ console.error('Error init permisos:',e); _initPromise=null; return false; }
        })();
        return _initPromise;
    }

    function puede(permiso){ return _permisos[permiso] === true; }
    function rol(){ return _perfil?.rol || null; }
    function nivel(){ return _rolesDef[_perfil?.rol]?.nivel || 0; }
    function unidad(){ return _perfil?.unidad_asignada || null; }
    function perfil(){ return _perfil; }
    function esAdmin(){ return _perfil?.rol === 'admin'; }
    function listo(){ return _listo; }

    // Oculta elementos del DOM que requieren un permiso que no se tiene.
    // Uso en HTML: <div data-permiso="tesoreria">...</div>
    function aplicarUI(){
        document.querySelectorAll('[data-permiso]').forEach(el=>{
            const req = el.getAttribute('data-permiso');
            if(puede(req)){
                el.classList.remove('oculto-permiso');
                el.style.display = 'flex'; // override explícito del CSS
            } else {
                el.classList.add('oculto-permiso');
                el.style.display = 'none';
            }
        });
        document.querySelectorAll('[data-solo-admin]').forEach(el=>{
            if(esAdmin()){
                el.classList.remove('oculto-permiso');
                el.style.display = 'flex';
            } else {
                el.classList.add('oculto-permiso');
                el.style.display = 'none';
            }
        });
    }

    // ¿Puede editar a un joven de cierta unidad?
    // Dirigente solo edita su unidad; coordinación y admin editan todo.
    function puedeEditarUnidad(unidadJoven){
        if(!puede('editar_jovenes')) return false;
        if(nivel() >= 4) return true; // coordinación y admin
        if(rol()==='dirigente'){
            return !unidad() || unidad()===unidadJoven; // su unidad o todas
        }
        return true;
    }

    
    // ¿Puede ver/editar a un adulto de cierta unidad?
    // ¿Es este usuario el Asesor Personal de este adulto (PPF)?
    function esAsesorDe(jovenId) {
        return _asesorados.includes(Number(jovenId)) || _asesorados.includes(String(jovenId));
    }

    // Puede editar PPF de este adulto (solo si es su AP o es admin/coordinación)
    function puedeEditarPPF(jovenId) {
        if(nivel() >= 4 || esAdmin()) return true;
        return esAsesorDe(jovenId);
    }

    function asesorados() { return _asesorados; }

    // ¿Es coordinación o superior?
    function esCoord() { return nivel() >= 4; }

    // ¿Es joven (base o mayor)?
    function esJoven() { return (rol()||'').startsWith('joven'); }

    // Normaliza texto para comparar unidades (Compañía == Compania, etc.)
    function _norm(s) {
        return (s||'').toLowerCase()
            .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e')
            .replace(/[íìï]/g,'i').replace(/[óòö]/g,'o')
            .replace(/[úùü]/g,'u').replace(/ñ/g,'n');
    }

    // Oculta/muestra elementos con data-permiso o selector CSS
    function bloquearSiNoTiene(permiso, selector) {
        if(puede(permiso)) return false; // tiene permiso, no bloquear
        const els = selector
            ? document.querySelectorAll(selector)
            : document.querySelectorAll('[data-permiso="'+permiso+'"]');
        els.forEach(el => { el.style.display = 'none'; });
        return true;
    }

    function puedeVerAdultoDeUnidad(unidadAdulto) {
        if(!puede('ver_adultos')) return false;
        if(nivel() >= 4) return true; // coordinación y admin ven todos
        if(rol()==='dirigente') {
            return !unidad() || (unidadAdulto||'').toLowerCase().includes((unidad()||'').toLowerCase());
        }
        return false;
    }

    function puedeEditarAdulto(adultoData) {
        if(!puede('editar_adultos')) return false;
        if(nivel() >= 4) return true;
        // Dirigente solo edita adultos de su unidad donde es AP
        const emailActual = _perfil?.email || '';
        return (adultoData?.asesor_personal_email === emailActual) ||
               (adultoData?.unidad_rol || '').toLowerCase().includes((unidad()||'').toLowerCase());
    }

    return { init, puede, rol, nivel, unidad, perfil, esAdmin, esCoord, esJoven, listo, aplicarUI, puedeEditarUnidad, puedeVerAdultoDeUnidad, puedeEditarAdulto, esAsesorDe, puedeEditarPPF, asesorados, bloquearSiNoTiene };
})();
