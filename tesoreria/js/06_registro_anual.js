        // ============================================================
        // REGISTRO ANUAL AGSCh — renovable por año, ligado a ACTIVOS.
        // Fuente de verdad: tabla registros_anuales (un pago por
        // miembro por año). La lista se construye SIEMPRE desde los
        // miembros marcados como activos en el ERP: si alguien se
        // activa/desactiva, la lista de pendientes se ajusta sola.
        // ============================================================
        let anioRegistro = new Date().getFullYear();
        let registrosAnioMap = new Map();   // mmbb_id -> registro del año

        function cambiarAnioRegistro(delta) { anioRegistro += delta; renderRegistroAnual(); }

        async function renderRegistroAnual() {
            const container = document.getElementById('tesoreriaContent');
            container.innerHTML = '<div class="bg-white p-12 text-center text-slate-300 rounded-3xl"><i class="fas fa-circle-notch fa-spin text-2xl"></i></div>';
            try {
                const [miembrosRes, regsRes, configRes] = await Promise.all([
                    supabaseClient.from('mmbb_registrations')
                        .select('id, nombres, apellidos, run, unidad, tipo_miembro, foto_url')
                        .eq('activo', true)
                        .order('unidad').order('apellidos'),
                    supabaseClient.from('registros_anuales')
                        .select('id, mmbb_id, monto, fecha_pago, comprobante_url, origen')
                        .eq('anio', anioRegistro),
                    supabaseClient.from('configuracion_cuotas').select('*')
                ]);
                const miembros = miembrosRes.data || [];
                miembrosRegistro = miembros;
                const registros = regsRes.data || [];
                registrosAnioMap = new Map(registros.map(r => [r.mmbb_id, r]));
                const configMap = {};
                (configRes.data || []).forEach(c => configMap[c.tipo_miembro] = c.monto);

                // Stats del año (sobre ACTIVOS) + histórico de inactivos que pagaron ese año
                const pagadosActivos = miembros.filter(m => registrosAnioMap.has(m.id));
                const recaudado = registros.reduce((a, r) => a + (parseFloat(r.monto) || 0), 0);
                const idsActivos = new Set(miembros.map(m => m.id));
                const pagosInactivos = registros.filter(r => !idsActivos.has(r.mmbb_id)).length;

                let rows = '';
                miembros.forEach(m => {
                    const nombreCompleto = `${m.nombres || ''} ${m.apellidos || ''}`.trim();
                    const tipo = m.tipo_miembro || 'regular';
                    const cuota = configMap[tipo] || 0;
                    const reg = registrosAnioMap.get(m.id);
                    const pagado = reg ? (parseFloat(reg.monto) || 0) : 0;
                    const deuda = Math.max(0, cuota - pagado);
                    const estadoPago = reg
                        ? `<span class="text-emerald-600 font-bold"><i class="fas fa-check-circle"></i> ${reg.fecha_pago ? new Date(reg.fecha_pago + 'T12:00:00').toLocaleDateString('es-CL') : (reg.origen === 'importado' ? 'Importado' : 'Pagado')}</span>`
                        : `<span class="text-rose-500 font-bold"><i class="fas fa-clock"></i> Pendiente</span>`;
                    rows += `<tr>
                                <td class="px-4 py-3">${m.foto_url ? `<img src="${m.foto_url}" class="h-8 w-8 rounded-full object-cover">` : '-'}</td>
                                <td class="px-4 py-3 font-bold">${nombreCompleto}</td>
                                <td class="px-4 py-3">${m.run || ''}</td>
                                <td class="px-4 py-3">${m.unidad || ''}</td>
                                <td class="px-4 py-3 capitalize">${tipo}</td>
                                <td class="px-4 py-3">${estadoPago}</td>
                                <td class="px-4 py-3 text-right">${currencyFormatter.format(cuota)}</td>
                                <td class="px-4 py-3 text-right">${currencyFormatter.format(pagado)}</td>
                                <td class="px-4 py-3 text-right font-black ${deuda > 0 ? 'text-rose-600' : 'text-emerald-600'}">${currencyFormatter.format(deuda)}</td>
                                <td class="px-4 py-3">${reg?.comprobante_url ? `<a href="${reg.comprobante_url}" target="_blank" class="text-indigo-600"><i class="fas fa-file-pdf"></i></a>` : '-'}</td>
                                <td class="px-4 py-3 whitespace-nowrap">${reg
                                    ? `<button onclick="anularRegistroAnual(${reg.id}, '${nombreCompleto.replace(/'/g,'')}')" class="text-rose-400 hover:text-rose-600 text-xs" title="Anular este registro (error de digitación)"><i class="fas fa-rotate-left"></i> Anular</button>`
                                    : `<button onclick="abrirModalPagoRegistro(${m.id})" class="text-indigo-600 hover:underline"><i class="fas fa-dollar-sign"></i> Pagar</button>`}</td>
                               </tr>`;
                });
                if (!rows) rows = '<tr><td colspan="11" class="py-20 text-center text-slate-300">No hay miembros activos en el ERP</td></tr>';

                container.innerHTML = `
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div class="bg-white rounded-2xl border border-slate-200 p-4 text-center"><p class="text-2xl font-black text-slate-700">${miembros.length}</p><p class="text-xs text-slate-400 font-bold uppercase">Miembros activos</p></div>
                    <div class="bg-white rounded-2xl border border-slate-200 p-4 text-center"><p class="text-2xl font-black text-emerald-600">${pagadosActivos.length}</p><p class="text-xs text-slate-400 font-bold uppercase">Registrados ${anioRegistro}</p></div>
                    <div class="bg-white rounded-2xl border border-slate-200 p-4 text-center"><p class="text-2xl font-black text-rose-600">${miembros.length - pagadosActivos.length}</p><p class="text-xs text-slate-400 font-bold uppercase">Pendientes</p></div>
                    <div class="bg-white rounded-2xl border border-slate-200 p-4 text-center"><p class="text-2xl font-black text-indigo-600">${currencyFormatter.format(recaudado)}</p><p class="text-xs text-slate-400 font-bold uppercase">Recaudado ${anioRegistro}</p></div>
                </div>
                <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
                        <div class="flex items-center gap-3">
                            <button onclick="cambiarAnioRegistro(-1)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500"><i class="fas fa-chevron-left"></i></button>
                            <h3 class="font-bold text-slate-700">Registro Anual AGSCh ${anioRegistro}</h3>
                            <button onclick="cambiarAnioRegistro(1)" class="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500"><i class="fas fa-chevron-right"></i></button>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="abrirModalAgregarPersona()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"><i class="fas fa-user-plus"></i> Agregar Manual</button>
                            <button onclick="abrirModalConfigCuotas()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"><i class="fas fa-cog"></i> Configurar Cuotas</button>
                        </div>
                    </div>
                    <div class="overflow-x-auto"><table class="w-full text-left text-sm">
                        <thead class="bg-slate-50 text-slate-400 font-bold text-xs uppercase"><th class="px-4 py-4">Foto</th><th>Nombre</th><th>RUN</th><th>Unidad</th><th>Tipo</th><th>Registro ${anioRegistro}</th><th class="text-right">Cuota</th><th class="text-right">Pagado</th><th class="text-right">Deuda</th><th>Comprobante</th><th>Acciones</th></thead>
                        <tbody class="divide-y divide-slate-100">${rows}</tbody>
                    </table></div>
                    <div class="p-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400">
                        <i class="fas fa-link"></i> Lista sincronizada con los miembros <strong>activos</strong> del ERP: al activar o desactivar a alguien, los pendientes se ajustan automáticamente.
                        ${pagosInactivos ? ` · <i class="fas fa-archive"></i> Además hay <strong>${pagosInactivos}</strong> registro(s) ${anioRegistro} de miembros hoy inactivos (historial preservado).` : ''}
                    </div>
                </div>`;
            } catch (error) { container.innerHTML = `<div class="bg-white p-8 text-center">Error al cargar registro anual: ${error.message}</div>`; }
        }

        // ── Anular un registro del año (errores de digitación) ──
        async function anularRegistroAnual(regId, nombre) {
            if (!confirm(`¿Anular el registro ${anioRegistro} de ${nombre}?\nEsto NO borra el movimiento de tesorería (si existe, ajústalo en la cuenta REGISTRO).`)) return;
            const { error } = await supabaseClient.from('registros_anuales').delete().eq('id', regId);
            if (error) { showToast('Error: ' + error.message, 'error'); return; }
            // Compatibilidad: si es el año en curso, reflejar en el flag antiguo
            if (anioRegistro === new Date().getFullYear()) {
                const reg = [...registrosAnioMap.entries()].find(([, r]) => r.id === regId);
                if (reg) await supabaseClient.from('mmbb_registrations').update({ registro_pagado: false }).eq('id', reg[0]);
            }
            showToast('Registro anulado', 'success');
            renderRegistroAnual();
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
            try {
                const { data: nuevo, error } = await supabaseClient.from('mmbb_registrations').insert({
                    run, nombres: partes[0] || '', apellidos: partes.slice(1).join(' ') || '',
                    unidad, tipo_miembro: tipo, activo: true,
                    registro_pagado: !isNaN(monto) && monto > 0, monto_pagado: isNaN(monto) ? null : monto,
                    created_at: new Date().toISOString()
                }).select().single();
                if (error) throw error;
                if (nuevo && !isNaN(monto) && monto > 0) {
                    await supabaseClient.from('registros_anuales').insert({
                        anio: anioRegistro, mmbb_id: nuevo.id, monto, fecha_pago: new Date().toISOString().split('T')[0], origen: 'tesoreria'
                    });
                }
                showToast('Persona agregada correctamente', 'success');
                cerrarModalPersona();
                renderRegistroAnual();
            } catch (error) { showToast('Error al agregar persona: ' + error.message, 'error'); }
        }

        // Fix: el botón Cerrar de #modalConfigCuotas llamaba a esta función inexistente.
        function cerrarModalConfigCuotas() { document.getElementById('modalConfigCuotas').classList.add('hidden'); }
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
            const miembro = miembrosRegistro.find(m => m.id === Number(miembroId));
            if (!miembro) return;
            document.getElementById('pagoRegistroId').value = miembro.id;
            document.getElementById('pagoRegistroNombre').innerText = `Registro AGSCh ${anioRegistro} — ${miembro.nombres} ${miembro.apellidos}`;
            document.getElementById('pagoRegistroMonto').value = '';
            document.getElementById('pagoRegistroFileLabel').innerHTML = 'Seleccionar archivo';
            document.getElementById('pagoRegistroFile').value = '';
            pagoRegistroFileData = null;
            document.getElementById('modalPagoRegistro').classList.remove('hidden');
        }
        function cerrarModalPagoRegistro() { document.getElementById('modalPagoRegistro').classList.add('hidden'); }

        async function guardarPagoRegistro() {
            const miembroId = Number(document.getElementById('pagoRegistroId').value);
            const miembro = miembrosRegistro.find(m => m.id === miembroId);
            const monto = parseFloat(document.getElementById('pagoRegistroMonto').value);
            if (!miembro || isNaN(monto) || monto <= 0) { alert('Ingrese un monto válido'); return; }
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
                const hoy = new Date().toISOString().split('T')[0];
                // 1. Registro del año (fuente de verdad; UNIQUE evita duplicados)
                const { error: eReg } = await supabaseClient.from('registros_anuales').insert({
                    anio: anioRegistro, mmbb_id: miembroId, monto, fecha_pago: hoy, comprobante_url: comprobanteUrl, origen: 'tesoreria'
                });
                if (eReg) {
                    if ((eReg.code || '') === '23505') { showToast(`Ya existe un registro ${anioRegistro} para esta persona.`, 'warning'); cerrarModalPagoRegistro(); renderRegistroAnual(); return; }
                    throw eReg;
                }
                // 2. Compatibilidad con el flag antiguo (solo año en curso)
                if (anioRegistro === new Date().getFullYear()) {
                    await supabaseClient.from('mmbb_registrations').update({ registro_pagado: true, monto_pagado: monto, comprobante_url: comprobanteUrl }).eq('id', miembroId);
                }
                // 3. Movimiento en la cuenta REGISTRO, trazable a la persona
                const cuentaRegistro = accounts.find(a => (a.nombre || '').toUpperCase() === 'REGISTRO');
                if (cuentaRegistro) {
                    await supabaseClient.from('tesoreria_movimientos').insert({
                        cuenta_id: cuentaRegistro.id,
                        concepto: `Registro AGSCh ${anioRegistro} — ${miembro.nombres} ${miembro.apellidos}`,
                        monto, moneda: 'CLP',
                        referencia: comprobanteUrl ? `Comprobante: ${comprobanteUrl}` : `Registro anual ${anioRegistro}`,
                        fecha: hoy, archivo_url: comprobanteUrl,
                        persona_run: miembro.run || null,
                        persona_nombre: `${miembro.nombres || ''} ${miembro.apellidos || ''}`.trim(),
                        persona_tipo: 'joven'
                    });
                } else {
                    showToast('Registro guardado. Ojo: no existe la cuenta "REGISTRO" en tesorería — el movimiento contable no se creó.', 'warning');
                }
                showToast('Pago de registro guardado', 'success');
                cerrarModalPagoRegistro();
                renderRegistroAnual();
                await cargarDatos();
            } catch (error) { showToast('Error al guardar pago: ' + error.message, 'error'); }
        }
