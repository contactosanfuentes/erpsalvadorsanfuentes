        function openTxModal(accId, prefill = null) {
            activeAccountId = accId;
            const acc = accounts.find(a => a.id === accId);
            document.getElementById('txTarget').innerText = acc ? acc.nombre : '';
            // Limpiar campos
            document.getElementById('txConcepto').value = '';
            document.getElementById('txMonto').value = '';
            document.getElementById('txTipo').value = 'ingreso';
            document.getElementById('txMoneda').value = 'CLP';
            document.getElementById('txRef').value = '';
            document.getElementById('fileLabel').innerHTML = 'Adjuntar comprobante (opcional)';
            document.getElementById('txFile').value = '';
            pendingFileData = null;
            document.getElementById('searchRut').value = '';
            document.getElementById('searchResults').innerHTML = '';
            document.getElementById('personaData').value = '';
            document.getElementById('txTipoMovimiento').value = 'corriente';
            toggleTipoCuota();

            if (prefill) {
                if (prefill.tipoMovimiento) document.getElementById('txTipoMovimiento').value = prefill.tipoMovimiento;
                if (prefill.concepto) document.getElementById('txConcepto').value = prefill.concepto;
                if (prefill.monto) document.getElementById('txMonto').value = prefill.monto;
                if (prefill.tipo) document.getElementById('txTipo').value = prefill.tipo;
                if (prefill.moneda) document.getElementById('txMoneda').value = prefill.moneda;
                if (prefill.referencia) document.getElementById('txRef').value = prefill.referencia;
                if (prefill.personaData) {
                    const pd = prefill.personaData;
                    document.getElementById('searchRut').value = pd.run;
                    document.getElementById('personaData').value = JSON.stringify(pd);
                    showToast(`Persona: ${pd.nombre}`, 'success');
                }
                if (prefill.tipoMovimiento === 'cuota') {
                    toggleTipoCuota();
                    setTimeout(() => {
                        if (prefill.tipoCuotaId) {
                            const select = document.getElementById('txTipoCuota');
                            const esperarCarga = setInterval(() => {
                                if (select.options.length > 1) {
                                    clearInterval(esperarCarga);
                                    for (let i = 0; i < select.options.length; i++) {
                                        if (select.options[i].value === prefill.tipoCuotaId) {
                                            select.selectedIndex = i;
                                            break;
                                        }
                                    }
                                }
                            }, 100);
                        }
                    }, 200);
                }
            }
            document.getElementById('modalAddTx').classList.remove('hidden');
        }

        function toggleTipoCuota() {
            const tipoMov = document.getElementById('txTipoMovimiento').value;
            const container = document.getElementById('txTipoCuotaContainer');
            if (tipoMov === 'cuota') {
                container.classList.remove('hidden');
                cargarTiposCuotaParaSelect();
            } else {
                container.classList.add('hidden');
            }
        }

        async function cargarTiposCuotaParaSelect() {
            const cuenta = accounts.find(a => a.id === activeAccountId);
            if (!cuenta) return;
            const { data: tipos } = await supabaseClient.from('cuenta_tipos_cuota').select('*').eq('cuenta_id', activeAccountId);
            const select = document.getElementById('txTipoCuota');
            select.innerHTML = '<option value="">Seleccione un tipo</option>';
            (tipos || []).forEach(t => {
                select.innerHTML += `<option value="${t.id}" data-monto="${t.monto}" data-nombre="${t.nombre}">${t.nombre} (${currencyFormatter.format(t.monto)})</option>`;
            });
        }

        function debounce(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(...args), wait);
            };
        }

        document.getElementById('searchRut')?.addEventListener('input', debounce(async (e) => {
            const rut = e.target.value.trim();
            if (rut.length < 3) return;
            const resultsDiv = document.getElementById('searchResults');
            resultsDiv.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Buscando...';
            try {
                const [mmbb, adultos] = await Promise.all([
                    supabaseClient.from('mmbb_registrations').select('run, nombres, apellidos, email, telefono, domicilio').ilike('run', `%${rut}%`),
                    supabaseClient.from('adultos_registros').select('run, nombres, apellidos, email, telefono, domicilio').ilike('run', `%${rut}%`)
                ]);
                let html = '';
                mmbb.data?.forEach(p => {
                    html += `<div class="p-2 hover:bg-indigo-50 cursor-pointer" onclick="selectPersona('mmbb', '${p.run}', '${p.nombres} ${p.apellidos}', '${p.email || ''}', '${p.telefono || ''}', '${p.domicilio || ''}')">${p.nombres} ${p.apellidos} (${p.run}) - MMBB</div>`;
                });
                adultos.data?.forEach(p => {
                    html += `<div class="p-2 hover:bg-indigo-50 cursor-pointer" onclick="selectPersona('adulto', '${p.run}', '${p.nombres} ${p.apellidos}', '${p.email || ''}', '${p.telefono || ''}', '${p.domicilio || ''}')">${p.nombres} ${p.apellidos} (${p.run}) - Adulto</div>`;
                });
                resultsDiv.innerHTML = html || 'No se encontraron resultados.';
            } catch (err) { resultsDiv.innerHTML = 'Error en búsqueda.'; }
        }, 300));

        window.selectPersona = function(tipo, run, nombre, email, telefono, direccion) {
            document.getElementById('searchRut').value = run;
            document.getElementById('searchResults').innerHTML = '';
            document.getElementById('personaData').value = JSON.stringify({ tipo, run, nombre, email, telefono, direccion });
            showToast(`Persona seleccionada: ${nombre}`, 'success');
        };

        async function handleFileSelect(input) {
            const file = input.files[0];
            if (!file) {
                document.getElementById('fileLabel').innerHTML = 'Adjuntar comprobante (opcional)';
                pendingFileData = null;
                return;
            }
            try {
                const fileName = `comprobante_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const { error } = await supabaseClient.storage.from(PAYMENT_BUCKET).upload(fileName, file);
                if (error) throw error;
                const { data: urlData } = supabaseClient.storage.from(PAYMENT_BUCKET).getPublicUrl(fileName);
                pendingFileData = { name: file.name, url: urlData.publicUrl };
                document.getElementById('fileLabel').innerHTML = file.name;
            } catch (err) { showToast('Error al subir archivo: ' + err.message, 'error'); }
        }

        async function addTransaction() {
            const concepto = document.getElementById('txConcepto').value.trim();
            let monto = parseFloat(document.getElementById('txMonto').value);
            const tipo = document.getElementById('txTipo').value;
            const moneda = document.getElementById('txMoneda').value;
            const ref = document.getElementById('txRef').value.trim();
            const personaData = document.getElementById('personaData').value;
            const tipoMovimiento = document.getElementById('txTipoMovimiento').value;
            const tipoCuotaId = document.getElementById('txTipoCuota').value;
            if (!concepto || isNaN(monto)) return;
            
            if (tipoMovimiento === 'cuota' && !tipoCuotaId) {
                showToast('Debe seleccionar un tipo de cuota', 'warning');
                return;
            }

            if (tipo === 'egreso') monto = -Math.abs(monto);
            const account = accounts.find(a => a.id === activeAccountId);
            if (!account) return;

            let finalConcepto = concepto;
            if (tipoMovimiento === 'cuota' && tipoCuotaId) {
                const tipoSelect = document.getElementById('txTipoCuota');
                const selectedOption = tipoSelect.options[tipoSelect.selectedIndex];
                if (selectedOption && selectedOption.getAttribute('data-nombre')) {
                    finalConcepto = `${selectedOption.getAttribute('data-nombre')} - ${concepto}`;
                }
            }

            const insertData = {
                cuenta_id: activeAccountId,
                concepto: finalConcepto,
                monto,
                moneda,
                referencia: ref,
                fecha: new Date().toISOString().split('T')[0],
                archivo_url: pendingFileData ? pendingFileData.url : null
            };
            if (personaData) {
                const { tipo, run, nombre, email, telefono, direccion } = JSON.parse(personaData);
                insertData.persona_run = run;
                insertData.persona_tipo = tipo;
                insertData.persona_nombre = nombre;
                insertData.persona_email = email;
                insertData.persona_telefono = telefono;
                insertData.persona_direccion = direccion;
            }
            if (tipoMovimiento === 'cuota' && tipoCuotaId) {
                insertData.tipo_cuota_id = tipoCuotaId;
            }

            try {
                const { data, error } = await supabaseClient.from('tesoreria_movimientos').insert(insertData).select();
                if (error) throw error;
                if (data) {
                    if (!account.movimientos) account.movimientos = [];
                    account.movimientos.push(data[0]);
                    closeModal('modalAddTx');
                    renderCurrentTab();
                    showToast('Movimiento registrado', 'success');
                }
            } catch (error) { showToast('Error al registrar movimiento: ' + error.message, 'error'); }
        }

        function openEditTxModal(accId, movId) {
            const account = accounts.find(a => a.id === accId);
            if (!account) return;
            const mov = account.movimientos.find(m => m.id === movId);
            if (!mov) return;
            document.getElementById('editAccountId').value = accId;
            document.getElementById('editTxId').value = movId;
            document.getElementById('editConcepto').value = mov.concepto || '';
            document.getElementById('editMonto').value = Math.abs(mov.monto);
            document.getElementById('editMoneda').value = mov.moneda || 'CLP';
            document.getElementById('editRef').value = mov.referencia || '';
            document.getElementById('modalEditTx').classList.remove('hidden');
        }

        async function updateTransaction() {
            const accId = document.getElementById('editAccountId').value;
            const movId = document.getElementById('editTxId').value;
            const concepto = document.getElementById('editConcepto').value.trim();
            let monto = parseFloat(document.getElementById('editMonto').value);
            const moneda = document.getElementById('editMoneda').value;
            const ref = document.getElementById('editRef').value.trim();
            if (!concepto || isNaN(monto)) return;
            const account = accounts.find(a => a.id === accId);
            if (!account) return;
            const mov = account.movimientos.find(m => m.id === movId);
            if (!mov) return;
            const signo = mov.monto > 0 ? 1 : -1;
            const nuevoMonto = signo * Math.abs(monto);
            try {
                const { error } = await supabaseClient.from('tesoreria_movimientos').update({ concepto, monto: nuevoMonto, moneda, referencia: ref }).eq('id', movId);
                if (error) throw error;
                mov.concepto = concepto;
                mov.monto = nuevoMonto;
                mov.moneda = moneda;
                mov.referencia = ref;
                closeModal('modalEditTx');
                renderCurrentTab();
                showToast('Movimiento actualizado', 'success');
            } catch (error) { showToast('Error al actualizar: ' + error.message, 'error'); }
        }

        async function deleteTransaction(accId, movId) {
            if (!confirm('¿Eliminar este movimiento?')) return;
            try {
                await supabaseClient.from('tesoreria_movimientos').delete().eq('id', movId);
                const account = accounts.find(a => a.id === accId);
                if (account) {
                    account.movimientos = account.movimientos.filter(m => m.id !== movId);
                }
                renderCurrentTab();
                showToast('Movimiento eliminado', 'info');
            } catch (error) { showToast('Error al eliminar: ' + error.message, 'error'); }
        }

        // ==================== REGISTRO ANUAL ====================
