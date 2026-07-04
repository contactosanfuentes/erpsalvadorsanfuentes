        async function renderRegistroAnual() {
            const container = document.getElementById('tesoreriaContent');
            try {
                const añoActual = new Date().getFullYear();
                const fechaInicio = new Date(añoActual, 0, 1).toISOString();
                const { data: miembros } = await supabaseClient
                    .from('mmbb_registrations')
                    .select('id, nombres, apellidos, run, unidad, tipo_miembro, registro_pagado, monto_pagado, foto_url, comprobante_url')
                    .gte('created_at', fechaInicio)
                    .order('apellidos');
                miembrosRegistro = miembros || [];
                const { data: config } = await supabaseClient.from('configuracion_cuotas').select('*');
                const configMap = {};
                config?.forEach(c => configMap[c.tipo_miembro] = c.monto);
                let rows = '';
                if (miembros && miembros.length > 0) {
                    miembros.forEach(m => {
                        const nombreCompleto = `${m.nombres || ''} ${m.apellidos || ''}`.trim();
                        const tipo = m.tipo_miembro || 'regular';
                        const montoEsperado = configMap[tipo] || 0;
                        const pagado = m.registro_pagado ? (m.monto_pagado || montoEsperado) : 0;
                        const deuda = montoEsperado - pagado;
                        rows += `<tr>
                                    <td class="px-4 py-3">${m.foto_url ? `<img src="${m.foto_url}" class="h-8 w-8 rounded-full object-cover">` : '-'}<\/td>
                                    <td class="px-4 py-3 font-bold">${nombreCompleto}<\/td>
                                    <td class="px-4 py-3">${m.run || ''}<\/td>
                                    <td class="px-4 py-3">${m.unidad || ''}<\/td>
                                    <td class="px-4 py-3 capitalize">${tipo}<\/td>
                                    <td class="px-4 py-3 text-right">${currencyFormatter.format(montoEsperado)}<\/td>
                                    <td class="px-4 py-3 text-right">${currencyFormatter.format(pagado)}<\/td>
                                    <td class="px-4 py-3 text-right font-black ${deuda > 0 ? 'text-rose-600' : 'text-emerald-600'}">${currencyFormatter.format(deuda)}<\/td>
                                    <td class="px-4 py-3">${m.comprobante_url ? `<a href="${m.comprobante_url}" target="_blank" class="text-indigo-600"><i class="fas fa-file-pdf"></i></a>` : '-'}<\/td>
                                    <td class="px-4 py-3"><button onclick="abrirModalPagoRegistro('${m.id}')" class="text-indigo-600 hover:underline"><i class="fas fa-dollar-sign"></i> Pagar</button><\/td>
                                   <\/tr>`;
                    });
                } else { rows = '<tr><td colspan="10" class="py-20 text-center text-slate-300">No hay registros para el año actual<\/td><\/tr>'; }
                let html = `<div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"><div class="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center"><h3 class="font-bold text-slate-700">Registro Anual ${añoActual}<\/h3><div class="flex gap-2"><button onclick="abrirModalAgregarPersona()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"><i class="fas fa-user-plus"></i> Agregar Manual</button><button onclick="abrirModalConfigCuotas()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"><i class="fas fa-cog"></i> Configurar Cuotas</button><\/div><\/div><div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="bg-slate-50 text-slate-400 font-bold text-xs uppercase"><th class="px-4 py-4">Foto<\/th><th>Nombre<\/th><th>RUN<\/th><th>Unidad<\/th><th>Tipo<\/th><th class="text-right">Cuota<\/th><th class="text-right">Pagado<\/th><th class="text-right">Deuda<\/th><th>Comprobante<\/th><th>Acciones<\/th><\/thead><tbody class="divide-y divide-slate-100">${rows}<\/tbody><\/table><\/div><\/div>`;
                container.innerHTML = html;
            } catch (error) { container.innerHTML = `<div class="bg-white p-8 text-center">Error al cargar registro anual: ${error.message}<\/div>`; }
        }

        function abrirModalAgregarPersona() { document.getElementById('modalAgregarPersona').classList.remove('hidden'); }
        function cerrarModalPersona() { document.getElementById('modalAgregarPersona').classList.add('hidden'); }
        async function agregarPersonaManual() {
            const run = document.getElementById('manualRun').value.trim();
            const nombre = document.getElementById('manualNombre').value.trim();
            const unidad = document.getElementById('manualUnidad').value.trim();
            const tipo = document.getElementById('manualTipo').value;
            let monto = parseFloat(document.getElementById('manualMonto').value);
            if (!run || !nombre || !unidad) { showToast('RUN, Nombre y Unidad son obligatorios', 'warning'); return; }
            const partes = nombre.split(' ');
            const primerNombre = partes[0] || '';
            const apellidos = partes.slice(1).join(' ') || '';
            try {
                const { error } = await supabaseClient.from('mmbb_registrations').insert({ run, nombres: primerNombre, apellidos: apellidos, unidad, tipo_miembro: tipo, registro_pagado: !isNaN(monto) && monto > 0, monto_pagado: isNaN(monto) ? null : monto, created_at: new Date().toISOString() });
                if (error) throw error;
                showToast('Persona agregada correctamente', 'success');
                cerrarModalPersona();
                renderRegistroAnual();
            } catch (error) { showToast('Error al agregar persona: ' + error.message, 'error'); }
        }

        function abrirModalConfigCuotas() {
            const montoNuevo = parseFloat(prompt('Monto para nuevos ingresos:'));
            if (isNaN(montoNuevo)) return;
            const montoRegular = parseFloat(prompt('Monto para miembros regulares:'));
            if (isNaN(montoRegular)) return;
            guardarConfigCuotas(montoNuevo, montoRegular);
        }
        async function guardarConfigCuotas(montoNuevo, montoRegular) {
            try {
                await supabaseClient.from('configuracion_cuotas').upsert([{ tipo_miembro: 'nuevo', monto: montoNuevo }, { tipo_miembro: 'regular', monto: montoRegular }]);
                showToast('Configuración guardada.', 'success');
                renderRegistroAnual();
            } catch (error) { showToast('Error al guardar configuración: ' + error.message, 'error'); }
        }

        function handlePagoRegistroFile(input) {
            const file = input.files[0];
            if (!file) { document.getElementById('pagoRegistroFileLabel').innerHTML = 'Seleccionar archivo'; pagoRegistroFileData = null; return; }
            document.getElementById('pagoRegistroFileLabel').innerHTML = file.name;
            pagoRegistroFileData = file;
        }

        function abrirModalPagoRegistro(miembroId) {
            const miembro = miembrosRegistro.find(m => m.id === miembroId);
            if (!miembro) return;
            document.getElementById('pagoRegistroId').value = miembroId;
            document.getElementById('pagoRegistroNombre').innerText = `Pagando para: ${miembro.nombres} ${miembro.apellidos}`;
            document.getElementById('pagoRegistroMonto').value = miembro.monto_pagado || '';
            document.getElementById('pagoRegistroFileLabel').innerHTML = 'Seleccionar archivo';
            document.getElementById('pagoRegistroFile').value = '';
            pagoRegistroFileData = null;
            document.getElementById('modalPagoRegistro').classList.remove('hidden');
        }
        function cerrarModalPagoRegistro() { document.getElementById('modalPagoRegistro').classList.add('hidden'); }
        async function guardarPagoRegistro() {
            const miembroId = document.getElementById('pagoRegistroId').value;
            const monto = parseFloat(document.getElementById('pagoRegistroMonto').value);
            if (isNaN(monto) || monto <= 0) { alert('Ingrese un monto válido'); return; }
            let comprobanteUrl = null;
            if (pagoRegistroFileData) {
                try {
                    const fileName = `comprobante_registro_${miembroId}_${Date.now()}.${pagoRegistroFileData.name.split('.').pop()}`;
                    const { error } = await supabaseClient.storage.from(PAYMENT_BUCKET).upload(fileName, pagoRegistroFileData);
                    if (error) throw error;
                    const { data: urlData } = supabaseClient.storage.from(PAYMENT_BUCKET).getPublicUrl(fileName);
                    comprobanteUrl = urlData.publicUrl;
                } catch (err) { showToast('Error al subir comprobante: ' + err.message, 'error'); return; }
            }
            try {
                const { error } = await supabaseClient.from('mmbb_registrations').update({ registro_pagado: true, monto_pagado: monto, comprobante_url: comprobanteUrl }).eq('id', miembroId);
                if (error) throw error;
                const cuentaRegistro = accounts.find(a => a.nombre === 'REGISTRO');
                if (cuentaRegistro) {
                    const movimiento = {
                        cuenta_id: cuentaRegistro.id,
                        concepto: `Pago de registro anual - ${miembroId}`,
                        monto: monto,
                        moneda: 'CLP',
                        referencia: comprobanteUrl ? `Comprobante: ${comprobanteUrl}` : '',
                        fecha: new Date().toISOString().split('T')[0],
                        archivo_url: comprobanteUrl
                    };
                    await supabaseClient.from('tesoreria_movimientos').insert(movimiento);
                }
                showToast('Pago registrado correctamente', 'success');
                cerrarModalPagoRegistro();
                renderRegistroAnual();
                await cargarDatos();
            } catch (error) { showToast('Error al guardar pago: ' + error.message, 'error'); }
        }

        // ==================== TRANSFERENCIAS ====================
