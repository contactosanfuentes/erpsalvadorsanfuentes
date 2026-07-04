        window.mhNav = function(viewId) {
            try { window.parent.postMessage({ tipo: 'nav', view: viewId }, '*'); } catch(e) {}
        };
        function poblarHomeMovil() {
            try {
                // Saludo según hora + nombre del usuario
                const h = new Date().getHours();
                document.getElementById('mhSaludoTxt').textContent = h < 12 ? 'Buenos días ☀️' : h < 19 ? 'Buenas tardes 👋' : 'Buenas noches 🌙';
                const nom = (window.Permisos && (Permisos.nombre?.() || Permisos.usuario?.()?.nombre)) || 'Scout';
                document.getElementById('mhNombre').textContent = nom.split(' ').slice(0,2).join(' ');
                document.getElementById('mhAvatar').textContent = nom.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();

                // KPIs desde los elementos ya renderizados o reportData
                const d = window.reportData || {};
                const j = d.kpi?.jovenes ?? 0, a = d.kpi?.adultos ?? 0;
                // Usar '—' solo cuando realmente no hay datos (0 puede ser válido como estado cargando)
                document.getElementById('mhJovenes').textContent = j > 0 ? j : (d.kpi ? '0' : '—');
                document.getElementById('mhAdultos').textContent = a > 0 ? a : (d.kpi ? '0' : '—');
                document.getElementById('mhTotalMiembros').textContent = (j + a) > 0 ? (j + a) : '—';

                // Clonar listas ya renderizadas por el dashboard de escritorio
                const evSrc = document.getElementById('eventos-calendar-list');
                const evCount = document.getElementById('eventos-calendar-count');
                if (evSrc && evSrc.innerHTML.trim()) document.getElementById('mhEventosList').innerHTML = evSrc.innerHTML;
                if (evCount) document.getElementById('mhEventos').textContent = evCount.innerText || '—';

                const cumSrc = document.getElementById('birthdays-list');
                if (cumSrc && cumSrc.innerHTML.trim()) document.getElementById('mhCumplesList').innerHTML = cumSrc.innerHTML;

                const alSrc = document.getElementById('alertas-list');
                if (alSrc && alSrc.innerHTML.trim()) document.getElementById('mhAlertasList').innerHTML = alSrc.innerHTML;
            } catch(e) { console.warn('[mhHome]', e); }
        }
        window.mhAbrirTab = function(tab, chipBtn) {
            if (window.innerWidth > 768) return;

            // Actualizar chips
            document.querySelectorAll('.mh-chip').forEach(function(c) {
                c.style.background = 'white';
                c.style.color = '#475569';
                c.style.boxShadow = 'none';
                c.style.borderColor = '#e2e8f0';
            });
            if (chipBtn) {
                chipBtn.style.background = '#0E2586';
                chipBtn.style.color = 'white';
                chipBtn.style.boxShadow = '0 3px 8px rgba(14,37,134,.3)';
                chipBtn.style.borderColor = '#0E2586';
            }

            // Si ya está visible el dashboard, solo cambiar tab
            const dash = document.getElementById('app-dashboard');
            const isVisible = dash.style.getPropertyValue('display') === 'block';
            if (!isVisible) {
                // Ocultar el home y mostrar el dashboard
                document.getElementById('mobileHome').style.setProperty('display','none','important');
                // Vencer el display:none !important del CSS con setProperty
                dash.style.setProperty('display', 'block', 'important');
                document.getElementById('dash-btn-volver-home').style.setProperty('display','block','important');
            }

            if (typeof window.switchTab === 'function') {
                const btn = document.querySelector('.tab-button[onclick*="\'' + tab + '\'"]');
                window.switchTab(tab, btn);
            }
            window.scrollTo(0, 0);
        };
        window.mhVolver = function() {
            document.getElementById('app-dashboard').style.removeProperty('display');
            document.getElementById('dash-btn-volver-home').style.removeProperty('display');
            document.getElementById('mobileHome').style.removeProperty('display');
            window.scrollTo(0, 0);
            // Resetear chips al tab General
            var gen = document.querySelector('.mh-chip[data-tab="general"]');
            if (gen) mhAbrirTabChipOnly('general', gen);
        };
        function mhAbrirTabChipOnly(tab, btn) {
            document.querySelectorAll('.mh-chip').forEach(function(c){
                c.style.background='white'; c.style.color='#475569';
                c.style.boxShadow='none'; c.style.borderColor='#e2e8f0';
            });
            if (btn) {
                btn.style.background='#0E2586'; btn.style.color='white';
                btn.style.boxShadow='0 3px 8px rgba(14,37,134,.3)';
                btn.style.borderColor='#0E2586';
            }
        };
        // Poblar cuando termine la carga principal (varios intentos para esperar renders async)
        if (window.innerWidth <= 768) {
            [1500, 3000, 5000].forEach(t => setTimeout(poblarHomeMovil, t));
        }