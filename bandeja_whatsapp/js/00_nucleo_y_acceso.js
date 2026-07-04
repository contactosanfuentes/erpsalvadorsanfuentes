const SUPA_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
// SUPA_KEY removed - using global client
const sb = window._sbClient || (window.supabaseClient) || supabase.createClient(SUPA_URL, '');

    // ===== CONTROL DE ACCESO: Bandeja de WhatsApp =====
    (async function _verificarAcceso(){
        try {
            const _ok = await Permisos.init(sb);
            if (_ok && !Permisos.puede('comunicaciones')) {
                document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;color:#475569;"><i class="fas fa-lock" style="font-size:3rem;color:#ef4444;margin-bottom:16px;"></i><h2 style="color:#1e293b;">Acceso Restringido</h2><p style="margin-top:8px;max-width:400px;">No tienes permiso para acceder a Bandeja de WhatsApp. Contacta a un administrador.</p></div>';
            }
        } catch(e){ console.warn('Permisos:', e); }
    })();

