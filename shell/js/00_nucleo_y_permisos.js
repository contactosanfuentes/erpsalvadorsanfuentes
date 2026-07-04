        // --- CONFIGURACIÓN SUPABASE ---
        const SUPABASE_URL = 'https://hyixmaxhoxvamoecuars.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // ========== INICIALIZAR SISTEMA DE PERMISOS ==========
        (async function initPermisos(){
            try {
                const ok = await Permisos.init(supabaseClient);
                if (ok) {
                    // aplicarUI maneja show/hide de todos los [data-permiso] y [data-solo-admin]
                    Permisos.aplicarUI();
                }
            } catch(e){ console.warn('Permisos no inicializados:', e); }
        })();


        // ========== FUNCIONES UTILITARIAS ==========
        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            if (!container) return;
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            let icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
            
            toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.style.animation = 'fadeOutRight 0.3s forwards';
                setTimeout(() => toast.remove(), 3500);
            }, 3500);
        }

        // ========== COPIAR ENLACE PÚBLICO AL PORTAPAPELES ==========
        // Construye la URL absoluta (funciona tanto local como desplegado) y la copia al clipboard
        function copiarEnlacePublico(archivo, btn) {
            // Resolver URL absoluta basándose en la ubicación actual del index.html
            const base = window.location.href.replace(/index\.html.*$/, '').replace(/\/$/, '');
            const url = base + '/' + archivo;

            const copiar = (texto) => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    return navigator.clipboard.writeText(texto);
                }
                // Fallback para http sin clipboard API
                return new Promise((resolve, reject) => {
                    try {
                        const ta = document.createElement('textarea');
                        ta.value = texto;
                        ta.style.position = 'fixed';
                        ta.style.opacity = '0';
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                        resolve();
                    } catch(e) { reject(e); }
                });
            };

            copiar(url).then(() => {
                if (btn) {
                    const html = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
                    setTimeout(() => btn.innerHTML = html, 2000);
                }
                showToast('Enlace copiado al portapapeles', 'success');
            }).catch(() => {
                // Mostrar el enlace para que lo copien manualmente
                prompt('Copia este enlace:', url);
            });
        }

        // ========== GESTIÓN DE PERFIL ==========
