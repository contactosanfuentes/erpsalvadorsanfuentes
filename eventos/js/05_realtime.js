    let realtimeChannel = null;
    function iniciarRealtime(eventoId) {
        // Desuscribir canal anterior si existe
        if (realtimeChannel) {
            supabaseClient.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }
        if (!eventoId) return;

        realtimeChannel = supabaseClient
            .channel(`evento-${eventoId}`)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'jovenes',
                filter: `evento_id=eq.${eventoId}`
            }, payload => {
                // Solo agregar si no existe ya (evita duplicados del propio insert)
                if (!jovenes.find(j => j.id === payload.new.id)) {
                    jovenes.push(payload.new);
                    renderJovenes();
                    renderEntregas();
                    renderPlanilla();
                    mostrarToastRealtime(`📋 Nuevo registro: ${payload.new.nombre_patrulla || 'Joven'}`);
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'jovenes',
                filter: `evento_id=eq.${eventoId}`
            }, payload => {
                const idx = jovenes.findIndex(j => j.id === payload.new.id);
                if (idx !== -1) { jovenes[idx] = payload.new; renderJovenes(); renderEntregas(); }
            })
            .on('postgres_changes', {
                event: 'DELETE', schema: 'public', table: 'jovenes'
            }, payload => {
                const prev = payload.old;
                jovenes = jovenes.filter(j => j.id !== prev.id);
                renderJovenes(); renderEntregas(); renderPlanilla();
            })
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'adultos',
                filter: `evento_id=eq.${eventoId}`
            }, payload => {
                if (!adultos.find(a => a.id === payload.new.id)) {
                    adultos.push(payload.new);
                    renderAdultos();
                    mostrarToastRealtime(`👤 Nuevo staff: ${payload.new.nombre || 'Adulto'}`);
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'adultos',
                filter: `evento_id=eq.${eventoId}`
            }, payload => {
                const idx = adultos.findIndex(a => a.id === payload.new.id);
                if (idx !== -1) { adultos[idx] = payload.new; renderAdultos(); }
            })
            .on('postgres_changes', {
                event: 'DELETE', schema: 'public', table: 'adultos'
            }, payload => {
                adultos = adultos.filter(a => a.id !== payload.old.id);
                renderAdultos();
            })
            .subscribe(status => {
                const dot = document.getElementById('realtime-dot');
                if (dot) dot.style.background = status === 'SUBSCRIBED' ? '#22c55e' : '#f59e0b';
            });
    }

    function mostrarToastRealtime(msg) {
        let toast = document.getElementById('realtime-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'realtime-toast';
            toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#0E2586;color:white;padding:12px 18px;border-radius:10px;font-size:0.85rem;font-weight:600;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:opacity 0.3s;';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.opacity = '1';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3500);
    }

    // Sincronizar el iframe de Check-in QR con el evento activo
    // (si la pestaña ya fue abierta, recarga el iframe con el nuevo evento_id)
    function actualizarIframeCheckinQR() {
        const iframe = document.getElementById('checkinQRIframe');
        if (!iframe || iframe.src === 'about:blank' || !iframe.src.includes('checkin_qr.html')) return;
        const evId = eventoActual?.id;
        const nuevaSrc = evId ? `checkin_qr.html?evento_id=${evId}` : 'checkin_qr.html';
        // Solo recargar si el evento cambió
        const currentUrl = new URL(iframe.src, window.location.href);
        const currentEvId = currentUrl.searchParams.get('evento_id');
        if (String(currentEvId) !== String(evId || '')) {
            iframe.src = nuevaSrc;
        }
    }

