        async function crearCuentasBase() {
            try {
                const { data: existentes } = await supabaseClient.from('tesoreria_cuentas').select('nombre');
                const nombresExistentes = new Set(existentes.map(c => c.nombre));
                const cuentasNuevas = cuentasBase.filter(c => !nombresExistentes.has(c.nombre));
                if (cuentasNuevas.length === 0) { showToast('Todas las cuentas base ya existen', 'info'); return; }
                await supabaseClient.from('tesoreria_cuentas').insert(cuentasNuevas);
                showToast(`Se crearon ${cuentasNuevas.length} cuentas base`, 'success');
                await cargarDatos();
            } catch (error) { showToast('Error al crear cuentas base: ' + error.message, 'error'); }
        }

        // ==================== NAVEGACIÓN ====================
        function switchTesoreriaTab(tab) {
            currentTab = tab;
            document.querySelectorAll('#tesoreriaTabs button').forEach(btn => {
                btn.classList.remove('active-tab', 'text-white');
                btn.classList.add('text-slate-500', 'hover:bg-slate-300/50');
            });
            const activeBtn = Array.from(document.querySelectorAll('#tesoreriaTabs button')).find(btn => btn.textContent.trim().toLowerCase() === tab);
            if (activeBtn) { activeBtn.classList.add('active-tab'); activeBtn.classList.remove('text-slate-500', 'hover:bg-slate-300/50'); }
            renderCurrentTab();
        }

        function renderCurrentTab() {
            if (currentTab === 'dashboard') renderDashboard();
            else if (currentTab === 'consolidado') renderConsolidado();
            else if (currentTab === 'cuentas') renderCuentas();
            else if (currentTab === 'registro') renderRegistroAnual();
            else if (currentTab === 'transferencias') renderTransferencias();
            else if (currentTab === 'config') renderConfig();
            else if (currentTab === 'planes') renderPlanesPago();
        }

        // ==================== CARGA DE DATOS ====================
        async function cargarDatos() {
            try {
                const { data: cuentas } = await supabaseClient.from('tesoreria_cuentas').select('*').order('orden', { ascending: true, nullsFirst: false }).order('nombre');
                accounts = cuentas || [];
                if (accounts.length === 0) { await crearCuentasBase(); const { data: nuevas } = await supabaseClient.from('tesoreria_cuentas').select('*').order('orden'); accounts = nuevas || []; }
                for (let acc of accounts) {
                    const { data: movs } = await supabaseClient.from('tesoreria_movimientos').select('*').eq('cuenta_id', acc.id).order('fecha', { ascending: false });
                    acc.movimientos = movs || [];
                }
                const { data: transfers } = await supabaseClient.from('tesoreria_transferencias').select('*').order('fecha', { ascending: false });
                transferHistory = transfers || [];
                renderCurrentTab();
                showToast('Datos cargados', 'success');
            } catch (error) { showToast('Error al cargar datos: ' + error.message, 'error'); }
        }

        // ==================== DASHBOARD ====================
