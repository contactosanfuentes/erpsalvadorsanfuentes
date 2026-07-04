        // ==================== CONFIGURACIÓN DE NÚCLEO (API FIRST) ====================
        const SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
        const _accessToken = new URLSearchParams(window.location.search).get('token');
        const _opts = _accessToken ? { global: { headers: { Authorization: `Bearer ${_accessToken}` } } } : {};
        const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, _opts);
        window.supabaseClient = supabaseClient; // Exponer para certificados.js y drive-helper.js

        // ===== CONTROL DE ACCESO: Programa de Jóvenes =====
        let _permisosListos = false;
        (async function verificarAccesoJovenes(){
            try {
                // Siempre inicializar con el cliente del módulo
                const ok = await Permisos.init(supabaseClient);
                _permisosListos = true;
                if (ok && !Permisos.puede('ver_jovenes')) {
                    document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;color:#475569;"><i class="fas fa-lock" style="font-size:3rem;color:#ef4444;margin-bottom:16px;"></i><h2 style="color:#1e293b;">Acceso Restringido</h2><p style="margin-top:8px;max-width:400px;">No tienes permiso para ver los datos de los jóvenes. Contacta a un administrador.</p></div>';
                    return;
                }
                // Si no puede editar, ocultar botones de edición tras renderizar
                if (ok && !Permisos.puede('editar_jovenes')) {
                    document.body.classList.add('modo-solo-lectura');
                    const style = document.createElement('style');
                    style.textContent = '.modo-solo-lectura-ppf .tab-ppf, .modo-solo-lectura-ppf [data-seccion=\"ppf\"], .modo-solo-lectura-ppf .ppf-editar, .modo-solo-lectura-ppf button[onclick*=\"guardarPPF\"], .modo-solo-lectura-ppf button[onclick*=\"actualizarCamino\"], .modo-solo-lectura-ppf input.ppf-input, .modo-solo-lectura-ppf textarea.ppf-textarea, .modo-solo-lectura-ppf select.ppf-select { display:none !important; } .modo-solo-lectura-ppf .ppf-readonly { display:block !important; }.modo-solo-lectura .btn-editar, .modo-solo-lectura .btn-eliminar, .modo-solo-lectura [data-accion=\"editar\"], .modo-solo-lectura [data-accion=\"eliminar\"], .modo-solo-lectura select[onchange*=\"solicitarFirmaDigital\"], .modo-solo-lectura select[onchange*=\"etapa\"], .modo-solo-lectura .tab-firma, .modo-solo-lectura [class*=\"btn-avance\"] { display:none !important; }';
                    document.head.appendChild(style);
                }
            } catch(e){ console.warn('Permisos jóvenes:', e); }
        })();


        // Destinatarios por unidad (mismo que en formulario de registro)
