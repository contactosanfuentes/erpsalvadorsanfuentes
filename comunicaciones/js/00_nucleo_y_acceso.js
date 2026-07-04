
    const SB_URL='https://hyixmaxhoxvamoecuars.supabase.co';
    const KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
    const EJ_KEY='sdJuTji-tJ4-ZO2pk',EJ_SVC='service_o5o77ra',EJ_TPL='template_22s3v9c';
    const _accessToken = new URLSearchParams(window.location.search).get('token');
    const _opts = _accessToken ? { global: { headers: { Authorization: `Bearer ${_accessToken}` } } } : {};
    const db=supabase.createClient(SB_URL,KEY,_opts);

    // ===== CONTROL DE ACCESO: Comunicaciones =====
    (async function _verificarAcceso(){
        try {
            const _ok = await Permisos.init(db);
            if (_ok && !Permisos.puede('comunicaciones')) {
                document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;color:#475569;"><i class="fas fa-lock" style="font-size:3rem;color:#ef4444;margin-bottom:16px;"></i><h2 style="color:#1e293b;">Acceso Restringido</h2><p style="margin-top:8px;max-width:400px;">No tienes permiso para acceder a Comunicaciones. Contacta a un administrador.</p></div>';
            }
        } catch(e){ console.warn('Permisos:', e); }
    })();
