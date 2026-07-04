        async function appSwitchView(viewId, element) {
            document.querySelectorAll('.view-content').forEach(v => v.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            
            document.getElementById(viewId).classList.add('active');
            if(element) element.classList.add('active');
            if (typeof _bnavSync === 'function') _bnavSync(viewId);

            const appContainer = document.getElementById('app-container');
            if (viewId === 'view-eventos') appContainer.classList.add('show-event-tools');
            else appContainer.classList.remove('show-event-tools');

            const { data: { session } } = await supabaseClient.auth.getSession();
            const tokenQuery = session ? `?token=${encodeURIComponent(session.access_token)}` : '';
            const iframes = { 'view-dashboard': 'dashboard.html', 'view-programa': 'programa_jovenes.html', 'view-adultos': 'adulto_voluntario.html', 'view-directorio': 'directorio.html', 'view-tesoreria': 'tesoreria.html' };

            if (iframes[viewId]) {
                const iframeId = viewId.replace('view-', '') + 'Iframe';
                const iframe = document.getElementById(iframeId);
                const baseUrl = iframes[viewId];
                const finalUrl = (viewId !== 'view-dashboard' && session) ? `${baseUrl}${tokenQuery}` : baseUrl;
                if(iframe && !iframe.src.includes(baseUrl)) iframe.src = finalUrl;
            }
        }

        function activateEventosTab(element, tabId) {
            document.querySelectorAll('.submenu-item').forEach(el => el.classList.remove('active'));
            element.classList.add('active');
            const eventosView = document.getElementById('view-eventos');
            if (!eventosView.classList.contains('active')) appSwitchView('view-eventos', document.getElementById('nav-eventos'));
            
            const iframe = document.getElementById('eventosIframe');
            if (iframe) {
                const baseSrc = iframe.src.split('#')[0] || 'eventos_iframe.html';
                iframe.src = baseSrc + '#' + tabId;
            }
        }

        // ========== BÚSQUEDA GLOBAL ==========
        async function performSearch(query) {
            let results = { jovenes: [], adultos: [], eventos: [] };
            
            try {
                try {
                    const { data } = await supabaseClient.from('mmbb_registrations')
                        .select('id, nombres, apellidos, unidad')
                        .or(`nombres.ilike.%${query}%,apellidos.ilike.%${query}%`)
                        .limit(4);
                    if (data) results.jovenes = data;
                } catch(e) {}
                
                try {
                    const { data } = await supabaseClient.from('adultos_registros')
                        .select('id, nombres, apellidos, roles')
                        .or(`nombres.ilike.%${query}%,apellidos.ilike.%${query}%`)
                        .limit(4);
                    if (data) results.adultos = data;
                } catch(e) {}
                
                try {
                    const { data } = await supabaseClient.from('eventos')
                        .select('id, nombre, fecha_inicio')
                        .ilike('nombre', `%${query}%`)
                        .limit(4);
                    if (data) results.eventos = data;
                } catch(e) {}
                
                renderSearchResults(results, query);
            } catch (error) {
                document.getElementById('search-results').innerHTML = `<div class="search-empty"><p>Error de búsqueda</p></div>`;
            }
        }

        function renderSearchResults(results, query) {
            let html = '';
            const searchResults = document.getElementById('search-results');
            
            if (results.jovenes.length === 0 && results.adultos.length === 0 && results.eventos.length === 0) {
                searchResults.innerHTML = `<div class="search-empty"><p>No se encontraron resultados para "${query}"</p></div>`;
                return;
            }
            
            if (results.jovenes.length > 0) {
                html += `<div class="search-category">Jóvenes</div>`;
                results.jovenes.forEach(j => {
                    html += `<div class="search-item" onclick="irAResultado('view-programa')">
                                <div class="search-item-icon icon-joven"><i class="fas fa-child"></i></div>
                                <div><p class="search-item-title">${j.nombres} ${j.apellidos || ''}</p>
                                <p class="search-item-subtitle">${j.unidad || 'Sin unidad'}</p></div>
                            </div>`;
                });
            }
            
            if (results.adultos.length > 0) {
                html += `<div class="search-category">Adultos</div>`;
                results.adultos.forEach(a => {
                    html += `<div class="search-item" onclick="irAResultado('view-adultos')">
                                <div class="search-item-icon icon-adulto"><i class="fas fa-user-tie"></i></div>
                                <div><p class="search-item-title">${a.nombres} ${a.apellidos || ''}</p>
                                <p class="search-item-subtitle">${a.roles?.[0] || 'Dirigente'}</p></div>
                            </div>`;
                });
            }
            
            if (results.eventos.length > 0) {
                html += `<div class="search-category">Eventos</div>`;
                results.eventos.forEach(e => {
                    html += `<div class="search-item" onclick="irAResultado('view-eventos')">
                                <div class="search-item-icon icon-evento"><i class="fas fa-campground"></i></div>
                                <div><p class="search-item-title">${e.nombre}</p>
                                <p class="search-item-subtitle">${e.fecha_inicio ? new Date(e.fecha_inicio).toLocaleDateString() : 'Fecha por definir'}</p></div>
                            </div>`;
                });
            }
            
            searchResults.innerHTML = html;
        }

        function irAResultado(viewId) {
            closeSearch();
            const navId = viewId.replace('view-', 'nav-');
            const navElement = document.getElementById(navId);
            if(navElement) appSwitchView(viewId, navElement);
        }

        function closeSearch() {
            const container = document.getElementById('search-container');
            const results = document.getElementById('search-results');
            const overlay = document.getElementById('global-overlay');
            if (container) container.classList.remove('focused');
            if (results) results.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        }

        // ========== INICIALIZACIÓN ==========
        window.onload = () => {
            fetchUserData();
            fetchRealNotifications();
            appSwitchView('view-dashboard', document.getElementById('nav-dashboard'));
            
            const searchInput = document.getElementById('global-search');
            const searchContainer = document.getElementById('search-container');
            const clearSearchBtn = document.getElementById('clear-search');
            
            if (searchInput) {
                document.addEventListener('keydown', (e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { 
                        e.preventDefault(); 
                        searchInput.focus(); 
                    }
                    if (e.key === 'Escape') closeSearch();
                });
                
                searchInput.addEventListener('focus', () => {
                    searchContainer.classList.add('focused');
                    // No activar overlay en móvil — distorsiona la vista
                    if (window.innerWidth > 768) {
                        document.getElementById('global-overlay').classList.add('active');
                    }
                    if (searchInput.value.trim().length >= 2) {
                        document.getElementById('search-results').classList.add('active');
                    }
                });
                
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value.trim();
                    if (clearSearchBtn) clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';
                    if (query.length >= 2) {
                        performSearch(query);
                        document.getElementById('search-results').classList.add('active');
                        if (window.innerWidth > 768) {
                            document.getElementById('global-overlay').classList.add('active');
                        }
                    } else {
                        document.getElementById('search-results').classList.remove('active');
                    }
                });
                
                if (clearSearchBtn) {
                    clearSearchBtn.addEventListener('click', () => { 
                        searchInput.value = ''; 
                        document.getElementById('search-results').classList.remove('active'); 
                        clearSearchBtn.style.display = 'none'; 
                        searchInput.focus(); 
                    });
                }
            }
            
            document.getElementById('global-overlay').addEventListener('click', closeSearch);
            
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#userDropdown') && !e.target.closest('.user-trigger')) {
                    const userDropdown = document.getElementById('userDropdown');
                    if (userDropdown) userDropdown.classList.remove('active');
                }
                if (!e.target.closest('#notifDropdown') && !e.target.closest('.notif-trigger')) {
                    const notifDropdown = document.getElementById('notifDropdown');
                    if (notifDropdown) notifDropdown.classList.remove('active');
                }
            });
        };