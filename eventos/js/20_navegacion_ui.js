    function cambiarPestanaPorHash() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const btn = document.querySelector(`.tab-btn[data-tab="${hash}"]`);
            if (btn) {
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.getElementById(hash).classList.add('active');
                btn.classList.add('active');
                if (hash === 'croquis') { actualizarSelectorElementosCroquis(); renderCroquis(); }
                // Lazy-load del iframe Check-in QR — solo carga cuando se selecciona la pestaña
                // (evita solicitar permisos de cámara innecesariamente al abrir eventos)
                // Pasa el evento_id actual para auto-seleccionarlo en el iframe
                if (hash === 'checkin-qr') {
                    const iframe = document.getElementById('checkinQRIframe');
                    if (iframe) {
                        const evId = eventoActual?.id;
                        const nuevaSrc = evId ? `checkin_qr.html?evento_id=${evId}` : 'checkin_qr.html';
                        // Solo recargar si la URL cambió (evita recarga innecesaria al volver a la pestaña con el mismo evento)
                        if (!iframe.src.endsWith(nuevaSrc.split('/').pop())) {
                            iframe.src = nuevaSrc;
                        }
                    }
                }
            }
        }
    }

    // Recargar el iframe Check-in QR (botón del header del panel)
    window.reloadCheckinQR = function() {
        const iframe = document.getElementById('checkinQRIframe');
        if (iframe) {
            const evId = eventoActual?.id;
            const nuevaSrc = evId ? `checkin_qr.html?evento_id=${evId}&_t=${Date.now()}` : `checkin_qr.html?_t=${Date.now()}`;
            iframe.src = 'about:blank';
            setTimeout(() => { iframe.src = nuevaSrc; }, 100);
        }
    }

    window.addEventListener('hashchange', cambiarPestanaPorHash);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            window.location.hash = this.dataset.tab;
        });
    });

    // ========== SIDEBAR COLLAPSIBLE ==========
    const sidebar = document.getElementById('sidebar-nav');
    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    const collapsedKey = 'sidebarCollapsed';
    let collapsed = localStorage.getItem(collapsedKey) === 'true';

    function setSidebarCollapsed(state) {
        collapsed = state;
        if (collapsed) {
            sidebar.classList.add('collapsed');
            toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        } else {
            sidebar.classList.remove('collapsed');
            toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        }
        localStorage.setItem(collapsedKey, state);
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => setSidebarCollapsed(!collapsed));
        setSidebarCollapsed(collapsed);
    }

    // ========== INICIALIZACIÓN ==========
