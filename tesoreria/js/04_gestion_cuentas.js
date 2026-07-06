        function selectAccount(accId) {
            activeAccountId = accId;
            renderCuentas();
        }

        async function renderCuentas() {
            if (!activeAccountId && accounts.length) activeAccountId = accounts[0].id;
            const activeAcc = accounts.find(a => a.id === activeAccountId);
            
            if (activeAcc) {
                const { data: tipos } = await supabaseClient.from('cuenta_tipos_cuota').select('*').eq('cuenta_id', activeAcc.id);
                tiposCuotaMap.clear();
                (tipos || []).forEach(t => tiposCuotaMap.set(t.id, t));
            }

            let cardsHtml = `<div id="cuentasGridContainer" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-6">`;
            accounts.forEach(acc => {
                const saldo = (acc.movimientos || []).reduce((s, m) => s + m.monto, 0);
                const isActive = activeAccountId === acc.id;
                const esEventoProyecto = (acc.tipo === 'evento' || acc.tipo === 'proyecto');
                cardsHtml += `
                    <div class="account-card bg-white rounded-xl p-3 shadow-sm border ${isActive ? 'active border-indigo-500 bg-indigo-50' : 'border-slate-200'}" data-account-id="${acc.id}" onclick="selectAccount('${acc.id}')">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-bold px-2 py-1 rounded-full ${acc.tipo === 'general' ? 'bg-purple-100 text-purple-700' : acc.tipo === 'unidad' ? 'bg-blue-100 text-blue-700' : acc.tipo === 'proyecto' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}">${acc.tipo}</span>
                            ${esEventoProyecto ? `<button onclick="event.stopPropagation(); abrirConfigTiposCuota('${acc.id}', '${acc.nombre}')" class="text-slate-400 hover:text-indigo-600 text-sm"><i class="fas fa-cog"></i></button>` : '<i class="fas fa-grip-lines text-slate-300 text-sm"></i>'}
                        </div>
                        <p class="font-bold text-sm truncate" title="${acc.nombre}">${acc.nombre}</p>
                        ${acc.codigo ? `<p class="text-[0.6rem] font-mono text-slate-400 truncate" title="Código de trazabilidad${acc.evento_id ? ' — vinculado al evento' : ''}">${acc.codigo}${acc.evento_id ? ' 🔗' : ''}</p>` : ''}
                        <p class="text-lg font-black ${saldo < 0 ? 'text-rose-600' : 'text-emerald-600'}">${currencyFormatter.format(saldo)}</p>
                    </div>
                `;
            });
            cardsHtml += `</div>`;

            let movimientosHtml = '';
            if (activeAcc) {
                for (let m of (activeAcc.movimientos || []).slice(0, 20)) {
                    let infoCuotaHtml = '';
                    if (m.tipo_cuota_id && tiposCuotaMap.has(m.tipo_cuota_id)) {
                        const tipo = tiposCuotaMap.get(m.tipo_cuota_id);
                        const montoEsperado = tipo.monto;
                        const montoPagado = m.monto;
                        const diferencia = montoEsperado - montoPagado;
                        if (diferencia > 0) {
                            infoCuotaHtml = `<span class="text-xs text-amber-600 block mt-1">Monto cuota: ${currencyFormatter.format(montoEsperado)} | Pagado: ${currencyFormatter.format(montoPagado)} | Pendiente: ${currencyFormatter.format(diferencia)}</span>
                                             <button onclick="abrirComplemento('${activeAcc.id}', '${m.id}', ${diferencia})" class="text-xs text-indigo-600 hover:underline mt-1">Complementar</button>`;
                        } else if (diferencia < 0) {
                            infoCuotaHtml = `<span class="text-xs text-red-500 block mt-1">Sobrepago: ${currencyFormatter.format(Math.abs(diferencia))}</span>`;
                        } else {
                            infoCuotaHtml = `<span class="text-xs text-green-600 block mt-1">Cuota completa</span>`;
                        }
                    }
                    
                    let personaHtml = '';
                    if (m.persona_nombre) {
                        personaHtml = `<div class="text-xs text-slate-400 mt-1">${m.persona_nombre} (${m.persona_run || 'RUT no disponible'})</div>`;
                    } else if (m.persona_run) {
                        personaHtml = `<div class="text-xs text-slate-400 mt-1">RUT: ${m.persona_run}</div>`;
                    }
                    
                    movimientosHtml += `
                        <tr class="border-b border-slate-100 hover:bg-slate-50">
                            <td class="px-4 py-3 text-xs text-slate-500">${new Date(m.fecha).toLocaleDateString('es-CL')}<\/td>
                            <td class="px-4 py-3 font-medium">
                                ${m.concepto}
                                ${personaHtml}
                                ${infoCuotaHtml}
                              <\/td>
                            <td class="px-4 py-3 text-right font-bold ${m.monto < 0 ? 'text-rose-600' : 'text-emerald-600'}">${currencyFormatter.format(m.monto)}<\/td>
                            <td class="px-4 py-3 text-xs text-slate-400">${m.referencia || '-'}<\/td>
                            <td class="px-4 py-3">${m.archivo_url ? `<a href="${m.archivo_url}" target="_blank" class="text-indigo-600"><i class="fas fa-paperclip"></i></a>` : ''}<\/td>
                            <td class="px-4 py-3"><button onclick="openEditTxModal('${activeAcc.id}', '${m.id}')" class="text-blue-600 mr-2"><i class="fas fa-edit"></i></button><button onclick="deleteTransaction('${activeAcc.id}', '${m.id}')" class="text-rose-600"><i class="fas fa-trash"></i></button><\/td>
                          <\/tr>
                    `;
                }
                if (movimientosHtml === '') movimientosHtml = '}<tr><td colspan="6" class="py-20 text-center text-slate-300">Sin movimientos<\/td><\/tr>';
            } else {
                movimientosHtml = '<tr><td colspan="6" class="py-20 text-center text-slate-300">Selecciona una cuenta<\/td><\/tr>';
            }

            let html = `
                ${cardsHtml}
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="p-6 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white flex justify-between items-center">
                        <div><p class="text-indigo-200 text-xs font-bold uppercase tracking-wider">Saldo Disponible</p><h2 class="text-3xl font-black">${activeAcc ? currencyFormatter.format((activeAcc.movimientos || []).reduce((s, m) => s + m.monto, 0)) : '$0'}</h2></div>
                        <div class="flex gap-2"><button onclick="openTxModal('${activeAccountId}')" class="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-sm font-bold"><i class="fas fa-plus"></i> Movimiento</button><button onclick="deleteAccount('${activeAccountId}')" class="px-4 py-2 bg-rose-500 hover:bg-rose-400 rounded-xl text-sm font-bold"><i class="fas fa-trash"></i> Eliminar</button></div>
                    </div>
                    <div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b"><th class="px-4 py-3">Fecha</th><th>Concepto</th><th class="text-right">Monto</th><th>Ref.</th><th>Archivo</th><th>Acciones</th></thead><tbody>${movimientosHtml}</tbody><\/table><\/div>
                    ${(activeAcc?.movimientos?.length || 0) > 20 ? `<div class="p-4 text-center text-sm text-slate-400 border-t">Mostrando últimos 20 movimientos de ${activeAcc.movimientos.length}</div>` : ''}
                </div>
            `;
            document.getElementById('tesoreriaContent').innerHTML = html;
            initDragAndDropCuentas();
        }

        function initDragAndDropCuentas() {
            const container = document.getElementById('cuentasGridContainer');
            if (!container) return;
            new Sortable(container, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                handle: '.account-card',
                onEnd: async function() {
                    const newOrder = [];
                    const items = container.children;
                    for (let i = 0; i < items.length; i++) {
                        const accId = items[i].getAttribute('data-account-id');
                        newOrder.push({ id: accId, orden: i });
                    }
                    try {
                        for (let item of newOrder) {
                            await supabaseClient.from('tesoreria_cuentas').update({ orden: item.orden }).eq('id', item.id);
                        }
                        await cargarDatos();
                        if (activeAccountId && !accounts.find(a => a.id === activeAccountId)) {
                            activeAccountId = accounts.length ? accounts[0].id : null;
                        }
                        renderCuentas();
                        showToast('Orden de cuentas actualizado', 'success');
                    } catch (error) {
                        showToast('Error al guardar el orden: ' + error.message, 'error');
                    }
                }
            });
        }

        function openAddAccountModal() {
            document.getElementById('newAccName').value = '';
            document.getElementById('newAccType').value = 'general';
            tiposCuotaTemporales = [];
            actualizarListaTiposTemporales();
            toggleTiposCuotaEnCreacion();
            document.getElementById('modalAddAccount').classList.remove('hidden');
        }

        function toggleTiposCuotaEnCreacion() {
            const tipo = document.getElementById('newAccType').value;
            const container = document.getElementById('tiposCuotaContainerCreacion');
            if (tipo === 'evento' || tipo === 'proyecto') {
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }
        }

        function agregarTipoCuotaTemporal() {
            const nombre = document.getElementById('nuevoTipoNombre').value.trim();
            const monto = parseFloat(document.getElementById('nuevoTipoMonto').value);
            if (!nombre || isNaN(monto)) { showToast('Complete nombre y monto', 'warning'); return; }
            tiposCuotaTemporales.push({ nombre, monto });
            document.getElementById('nuevoTipoNombre').value = '';
            document.getElementById('nuevoTipoMonto').value = '';
            actualizarListaTiposTemporales();
        }

        function actualizarListaTiposTemporales() {
            const list = document.getElementById('tiposCuotaListCreacion');
            if (!list) return;
            list.innerHTML = tiposCuotaTemporales.map((t, idx) => `
                <div class="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <span class="flex-1">${t.nombre} - ${currencyFormatter.format(t.monto)}</span>
                    <button onclick="eliminarTipoTemporal(${idx})" class="text-rose-600"><i class="fas fa-trash"></i></button>
                </div>
            `).join('');
        }

        function eliminarTipoTemporal(idx) {
            tiposCuotaTemporales.splice(idx, 1);
            actualizarListaTiposTemporales();
        }

        async function guardarNuevaCuentaConTipos() {
            const name = document.getElementById('newAccName').value.trim();
            const type = document.getElementById('newAccType').value;
            if (!name) return;
            try {
                const { data, error } = await supabaseClient.from('tesoreria_cuentas').insert({ nombre: name, tipo: type }).select();
                if (error) throw error;
                const cuentaId = data[0].id;
                for (let t of tiposCuotaTemporales) {
                    await supabaseClient.from('cuenta_tipos_cuota').insert({ cuenta_id: cuentaId, nombre: t.nombre, monto: t.monto });
                }
                accounts.push({ ...data[0], movimientos: [] });
                closeModal('modalAddAccount');
                renderCurrentTab();
                showToast('Cuenta creada', 'success');
            } catch (error) { showToast('Error al crear cuenta: ' + error.message, 'error'); }
        }

        async function deleteAccount(accId) {
            if (!confirm('¿Eliminar esta cuenta? También se borrarán todos sus movimientos.')) return;
            try {
                await supabaseClient.from('tesoreria_cuentas').delete().eq('id', accId);
                accounts = accounts.filter(a => a.id !== accId);
                if (activeAccountId === accId) activeAccountId = accounts.length ? accounts[0].id : null;
                renderCurrentTab();
                showToast('Cuenta eliminada', 'info');
            } catch (error) { showToast('Error al eliminar cuenta: ' + error.message, 'error'); }
        }

        // Configurar tipos de cuota para una cuenta existente
        function abrirConfigTiposCuota(cuentaId, cuentaNombre) {
            document.getElementById('cuentaIdConfig').value = cuentaId;
            document.getElementById('cuentaNombreConfig').innerText = cuentaNombre;
            cargarTiposCuotaCuenta(cuentaId);
            document.getElementById('modalConfigTiposCuotaCuenta').classList.remove('hidden');
        }

        async function cargarTiposCuotaCuenta(cuentaId) {
            const { data: tipos } = await supabaseClient.from('cuenta_tipos_cuota').select('*').eq('cuenta_id', cuentaId);
            const list = document.getElementById('tiposCuotaCuentaList');
            list.innerHTML = (tipos || []).map(t => `
                <div class="flex items-center gap-2 p-2 bg-slate-50 rounded">
                    <span class="flex-1">${t.nombre} - ${currencyFormatter.format(t.monto)}</span>
                    <button onclick="eliminarTipoCuotaCuenta('${t.id}')" class="text-rose-600"><i class="fas fa-trash"></i></button>
                </div>
            `).join('');
        }

        async function agregarTipoCuotaCuenta() {
            const cuentaId = document.getElementById('cuentaIdConfig').value;
            const nombre = document.getElementById('nuevoTipoCuentaNombre').value.trim();
            const monto = parseFloat(document.getElementById('nuevoTipoCuentaMonto').value);
            if (!nombre || isNaN(monto)) { showToast('Complete nombre y monto', 'warning'); return; }
            try {
                await supabaseClient.from('cuenta_tipos_cuota').insert({ cuenta_id: cuentaId, nombre, monto });
                document.getElementById('nuevoTipoCuentaNombre').value = '';
                document.getElementById('nuevoTipoCuentaMonto').value = '';
                cargarTiposCuotaCuenta(cuentaId);
                showToast('Tipo de cuota agregado', 'success');
            } catch (error) { showToast('Error: ' + error.message, 'error'); }
        }

        async function eliminarTipoCuotaCuenta(id) {
            if (!confirm('¿Eliminar este tipo de cuota?')) return;
            try {
                await supabaseClient.from('cuenta_tipos_cuota').delete().eq('id', id);
                const cuentaId = document.getElementById('cuentaIdConfig').value;
                cargarTiposCuotaCuenta(cuentaId);
                showToast('Tipo eliminado', 'success');
            } catch (error) { showToast('Error: ' + error.message, 'error'); }
        }

        // ==================== TRANSACCIONES ====================
