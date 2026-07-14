// ══════════ AUTENTICACIÓN DE APODERADOS ══════════
// Misma lógica de reclamación que el Portal del Adulto Voluntario, adaptada a apoderados:
// 1) Sesión con Google (correo personal, sin restricción de dominio).
// 2) Se muestran SOLO los jóvenes cuyo registro tiene ese correo como apoderado (titular o suplentes).
// 3) Si el correo no está vinculado a ningún hijo/a o representado: reclamación con RUN + fecha de nacimiento
//    del joven; el correo se escribe en el primer cupo de apoderado libre. Nunca pisa cupos ocupados.
(function(){
    const $ = id => document.getElementById(id);
    let authEmail = null;

    window.loginGoogleApoderado = async function(){
        const { error } = await db.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + window.location.pathname, queryParams: { prompt: 'select_account' } }
        });
        if (error) mostrarErrorLogin('Error: ' + error.message);
    };

    window.cerrarSesionApoderado = async function(){ await db.auth.signOut(); window.location.reload(); };

    function mostrarErrorLogin(msg){ const e = $('apo-login-error'); e.textContent = msg; e.style.display = 'block'; }

    async function iniciar(){
        const { data: { session } } = await db.auth.getSession();
        if (!session) { $('apo-login').style.display = 'flex'; return; }
        authEmail = (session.user.email || '').toLowerCase();
        $('apo-login').style.display = 'none';
        $('apo-portal').style.display = 'block';
        $('apo-email-sesion').textContent = authEmail;
        await cargarMisPupilos();
    }

    async function cargarMisPupilos(){
        const res = $('res');
        res.innerHTML = '<div class="esm" style="background:white;border-radius:10px;padding:30px"><i class="fas fa-circle-notch fa-spin"></i>Cargando a tus hijos, hijas o representados...</div>';
        const e = authEmail.replace(/[%_]/g, '');
        const { data, error } = await db.from('mmbb_registrations').select('*')
            .or(`apoderado_titular_email.ilike.${e},apoderado_suplente1_email.ilike.${e},apoderado_suplente2_email.ilike.${e}`);
        if (error) { res.innerHTML = `<div class="errb"><i class="fas fa-exclamation-circle"></i>Error: ${error.message}</div>`; return; }
        if (!data || !data.length) { res.innerHTML = ''; $('apo-reclamo').style.display = 'block'; return; }
        $('apo-reclamo').style.display = 'none';
        $('apo-intro').innerHTML = `<i class="fas fa-users"></i> Tus hijos, hijas o representados vinculados (${data.length}):`;
        await window.renderResultados(data);
    }

    function normalizarRun(r){ return String(r || '').replace(/[^0-9kK]/g, '').toLowerCase(); }

    window.reclamarPupilo = async function(){
        const msg = $('apo-reclamo-msg'); msg.style.display = 'block'; msg.style.color = '#64748b'; msg.textContent = 'Verificando...';
        const runBuscado = normalizarRun($('apo-run').value);
        const fnac = $('apo-fnac').value; // yyyy-mm-dd
        if (runBuscado.length < 7 || !fnac) { msg.style.color = '#b91c1c'; msg.textContent = 'Completa el RUN y la fecha de nacimiento del joven.'; return; }
        const { data, error } = await db.from('mmbb_registrations')
            .select('id, run, fecha_nacimiento, nombres, apellidos, apoderado_titular_email, apoderado_suplente1_email, apoderado_suplente2_email');
        if (error) { msg.style.color = '#b91c1c'; msg.textContent = 'Error: ' + error.message; return; }
        const j = (data || []).find(r => normalizarRun(r.run) === runBuscado);
        if (!j) { msg.style.color = '#b91c1c'; msg.textContent = 'No encontramos un joven con ese RUN. Verifica el número.'; return; }
        const fnacBD = String(j.fecha_nacimiento || '').slice(0, 10);
        if (!fnacBD || fnacBD !== fnac) { msg.style.color = '#b91c1c'; msg.textContent = 'La fecha de nacimiento no coincide con el registro. Verifícala o contacta al equipo de grupo.'; return; }
        // ¿Ya vinculado con este correo?
        const correos = [j.apoderado_titular_email, j.apoderado_suplente1_email, j.apoderado_suplente2_email].map(c => (c || '').toLowerCase());
        if (correos.includes(authEmail)) { msg.style.color = '#059669'; msg.textContent = '✓ Ya estabas vinculado. Cargando...'; await cargarMisPupilos(); return; }
        // Primer cupo libre (nunca pisa cupos ocupados por otros correos)
        let campo = null;
        if (!correos[0]) campo = 'apoderado_titular_email';
        else if (!correos[1]) campo = 'apoderado_suplente1_email';
        else if (!correos[2]) campo = 'apoderado_suplente2_email';
        if (!campo) { msg.style.color = '#b91c1c'; msg.textContent = 'Los 3 cupos de apoderado de este joven ya están ocupados por otros correos. Si eres su apoderado, pide al equipo de grupo que lo corrija en el ERP.'; return; }
        const { error: e2 } = await db.from('mmbb_registrations').update({ [campo]: authEmail }).eq('id', j.id);
        if (e2) { msg.style.color = '#b91c1c'; msg.textContent = 'Error al vincular: ' + e2.message; return; }
        msg.style.color = '#059669'; msg.textContent = `✓ Vinculado a ${j.nombres} ${j.apellidos || ''}. Cargando...`;
        $('apo-run').value = ''; $('apo-fnac').value = '';
        await cargarMisPupilos();
    };

    window.reclamarOtroPupilo = function(){ $('apo-reclamo').style.display = 'block'; $('apo-reclamo').scrollIntoView({ behavior: 'smooth' }); };

    window.addEventListener('DOMContentLoaded', iniciar);
})();
