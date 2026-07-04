        function initAdultos() {
            if (window.supabaseClient) {
                console.log('✅ Supabase listo, cargando adultos...');
                window.cargarAdultos();
            } else {
                console.log('⏳ Esperando Supabase...');
                setTimeout(initAdultos, 100);
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAdultos);
        } else {
            initAdultos();
        }