        const esMovil = () => window.innerWidth <= 768;

        function toggleSidebarColapso() {
            if (esMovil()) {
                // En móvil el hamburger abre/cierra el drawer
                const sb = document.getElementById('main-sidebar');
                sb.classList.contains('mobile-open') ? cerrarDrawerMovil() : abrirDrawerMovil();
            } else {
                document.getElementById('main-sidebar').classList.toggle('collapsed');
            }
        }

        function abrirDrawerMovil() {
            document.getElementById('main-sidebar').classList.add('mobile-open');
            document.getElementById('sidebarBackdrop').classList.add('visible');
        }
        function cerrarDrawerMovil() {
            document.getElementById('main-sidebar').classList.remove('mobile-open');
            document.getElementById('sidebarBackdrop').classList.remove('visible');
        }

        // Navegación desde el bottom nav
        function bnavGo(viewId, btnEl, navId) {
            const navItem = navId ? document.getElementById(navId) : null;
            if (navItem) { navItem.click(); }
            else { appSwitchView(viewId, null); }
            document.querySelectorAll('.bnav-item').forEach(b => b.classList.remove('act'));
            btnEl.classList.add('act');
            cerrarDrawerMovil();
        }

        // Cerrar drawer automáticamente al navegar desde el menú en móvil
        document.addEventListener('click', (e) => {
            if (esMovil() && e.target.closest('.sidebar .nav-item') && !e.target.closest('.has-submenu')) {
                setTimeout(cerrarDrawerMovil, 150);
            }
        });


        // Navegación solicitada desde iframes (home móvil)
        window.addEventListener('message', (ev) => {
            if (ev.data && ev.data.tipo === 'nav' && ev.data.view) {
                appSwitchView(ev.data.view, null);
                if (typeof _bnavSync === 'function') _bnavSync(ev.data.view);
            }
        });
        // Sincronizar resaltado del bottom nav con la vista activa
        const _bnavSync = (viewId) => {
            document.querySelectorAll('.bnav-item[data-view]').forEach(b => {
                b.classList.toggle('act', b.dataset.view === viewId);
            });
        };

        function toggleSubmenu(id, navElement) {
            const submenu = document.getElementById(id);
            const icon = navElement.querySelector('.toggle-icon');
            if (submenu.classList.contains('open')) {
                submenu.classList.remove('open'); 
                navElement.classList.remove('open');
                if(icon) icon.style.transform = 'rotate(0deg)';
            } else {
                submenu.classList.add('open'); 
                navElement.classList.add('open');
                if(icon) icon.style.transform = 'rotate(180deg)';
                if (!submenu.querySelector('.submenu-item.active')) {
                    const first = submenu.querySelector('.submenu-item');
                    if (first) activateEventosTab(first, first.dataset.tab);
                }
            }
        }

