        // ==================== CONFIGURACIÓN SUPABASE ====================
        const SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';

        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('token');

        const { createClient } = supabase;
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
        });

        // ===== CONTROL DE ACCESO: Tesorería =====
        (async function verificarAccesoTesoreria(){
            try {
                const ok = await Permisos.init(supabaseClient);
                if (ok && !Permisos.puede('tesoreria')) {
                    document.body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:20px;color:#475569;"><i class="fas fa-lock" style="font-size:3rem;color:#ef4444;margin-bottom:16px;"></i><h2 style="color:#1e293b;">Acceso Restringido</h2><p style="margin-top:8px;max-width:400px;">No tienes permiso para acceder al módulo de Tesorería. Contacta a un administrador si necesitas acceso.</p></div>';
                }
            } catch(e){ console.warn('Permisos tesorería:', e); }
        })();


        // Email
        const CC_EMAILS = ['responsable@salvadorsanfuentes.org', 'asistente@salvadorsanfuentes.org', 'contacto@salvadorsanfuentes.org', 'GuiasyScouts@salvadorsanfuentes.org', 'tesoreria@salvadorsanfuentes.org'].join(',');

        const PAYMENT_BUCKET = 'payment-receipts';

        // ==================== VARIABLES GLOBALES ====================
