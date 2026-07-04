        window.onload = async () => { 
            // Esperar hasta que Permisos esté inicializado (máx 8s)
            await new Promise(r => {
                const t = setInterval(() => { if (window.Permisos && Permisos.listo()) { clearInterval(t); r(); } }, 80);
                setTimeout(() => { clearInterval(t); r(); }, 8000);
            });
            cargarJovenes(); 
            toggleView('profiles'); 
        };