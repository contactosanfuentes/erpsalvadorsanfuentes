        function reindexarItems(containerId) {
            const rows = document.getElementById(containerId).querySelectorAll('.arbol-item-row');
            rows.forEach((row, i) => { const badge = row.querySelector('span'); if (badge) badge.textContent = i + 1; });
        }
        function agregarItemArbol(containerId, placeholder, badgeClass, borderClass) {
            const container = document.getElementById(containerId);
            const count = container.querySelectorAll('.arbol-item-row').length + 1;
            container.insertAdjacentHTML('beforeend', `<div class="flex gap-2 mb-2 items-center arbol-item-row"><span class="${badgeClass} font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0">${count}</span><input type="text" class="flex-1 border ${borderClass} rounded-lg p-2 text-sm focus:border-amber-600 outline-none bg-white/80" placeholder="${placeholder} ${count}..."><button onclick="this.parentElement.remove();reindexarItems('${containerId}')" class="text-gray-500 hover:text-red-600 text-sm px-1"><i class="fas fa-times"></i></button></div>`);
        }
        function agregarObjetivoFicha() {
            const container = document.getElementById('ficha-objetivos-container');
            const count = container.querySelectorAll('.ficha-obj-row').length + 1;
            container.insertAdjacentHTML('beforeend', `<div class="flex gap-2 mb-2 items-start ficha-obj-row"><span class="bg-amber-200 text-amber-900 font-extrabold text-xs w-6 h-6 rounded-full flex items-center justify-center mt-2 shrink-0">${count}</span><textarea class="ficha-obj-item flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:border-amber-400 outline-none" rows="1" placeholder="Objetivo específico ${count}..."></textarea><button onclick="this.parentElement.remove();reindexarObjetivos()" class="text-red-400 hover:text-red-600 text-sm px-2 mt-2"><i class="fas fa-times"></i></button></div>`);
        }
        function reindexarObjetivos() {
            document.querySelectorAll('#ficha-objetivos-container .ficha-obj-row').forEach((row, i) => { const badge = row.querySelector('span'); if (badge) badge.textContent = i + 1; });
        }
        function agregarFilaAccion() {
            const container = document.getElementById('ficha-acciones-rows');
            const count = container.querySelectorAll('.ficha-accion-row').length + 1;
            container.insertAdjacentHTML('beforeend', `<div class="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-1 mb-1.5 ficha-accion-row items-center"><span class="ficha-row-num bg-gray-100 text-gray-600 font-bold text-xs w-6 h-8 rounded flex items-center justify-center">${count}</span><input type="text" class="ficha-accion border border-gray-200 rounded p-1.5 text-sm" placeholder="Acción a realizar..."><input type="text" class="ficha-recurso border border-gray-200 rounded p-1.5 text-sm" placeholder="Materiales necesarios..."><input type="text" class="ficha-responsable border border-gray-200 rounded p-1.5 text-sm" placeholder="¿Quién lo hace?"><input type="text" class="ficha-crono border border-gray-200 rounded p-1.5 text-sm" placeholder="Fecha o período"><button onclick="this.parentElement.remove();reindexarAcciones()" class="text-red-400 hover:text-red-600 text-sm px-1"><i class="fas fa-times"></i></button></div>`);
        }
        function reindexarAcciones() {
            document.querySelectorAll('#ficha-acciones-rows .ficha-accion-row').forEach((row, i) => { const num = row.querySelector('.ficha-row-num'); if (num) num.textContent = i + 1; });
        }
        function agregarFilaPresupuesto() {
            document.getElementById('ficha-presupuesto-rows').insertAdjacentHTML('beforeend', `<div class="grid grid-cols-[1fr_100px_100px_100px_auto] gap-1 mb-1.5 ficha-ppto-row items-center"><input type="text" class="ficha-ppto-item border border-gray-200 rounded p-1.5 text-sm" placeholder="Concepto..."><input type="number" class="ficha-ppto-cant border border-gray-200 rounded p-1.5 text-sm text-center" placeholder="0" oninput="calcSubtotalFicha(this)"><input type="number" class="ficha-ppto-unit border border-gray-200 rounded p-1.5 text-sm text-center" placeholder="$0" oninput="calcSubtotalFicha(this)"><span class="ficha-ppto-sub text-center font-bold text-sm text-gray-700">$0</span><button onclick="this.parentElement.remove();calcTotalPresupuesto()" class="text-red-400 hover:text-red-600 text-sm px-1"><i class="fas fa-times"></i></button></div>`);
        }
        function calcSubtotalFicha(el) {
            const row = el.closest('.ficha-ppto-row');
            const cant = parseFloat(row.querySelector('.ficha-ppto-cant').value) || 0;
            const unit = parseFloat(row.querySelector('.ficha-ppto-unit').value) || 0;
            row.querySelector('.ficha-ppto-sub').textContent = '$' + (cant * unit).toLocaleString('es-CL');
            calcTotalPresupuesto();
        }
        function calcTotalPresupuesto() {
            let total = 0;
            document.querySelectorAll('#ficha-presupuesto-rows .ficha-ppto-row').forEach(row => {
                const cant = parseFloat(row.querySelector('.ficha-ppto-cant')?.value) || 0;
                const unit = parseFloat(row.querySelector('.ficha-ppto-unit')?.value) || 0;
                total += cant * unit;
            });
            document.getElementById('ficha-ppto-total').textContent = 'Total: $' + total.toLocaleString('es-CL');
        }

        function cerrarModalProyecto() { document.getElementById('modal-proyecto').classList.remove('active'); }
        
        async function guardarProyectoColectivo() {
            const n = document.getElementById('proyecto-nombre').value, o = document.getElementById('proyecto-objetivo').value, c = document.getElementById('proyecto-campo').value === 'Otros' ? (document.getElementById('proyecto-campo-otro').value.trim() || 'Otros') : document.getElementById('proyecto-campo').value, i = document.getElementById('proyecto-inicio').value;
            if (!n || !o || !c || !i) return alert('Campos obligatorios requeridos (Nom, Obj, Campo, Fecha).');
            
            const j = personasJovenes.find(x => x.id === currentJovenIdForProject);
            const editIdStr = document.getElementById('edit-proyecto-id').value;
            
            const fichaExtendidaActiva = document.getElementById('toggle-ficha-proyecto')?.checked || false;
            const nProj = { 
                id: editIdStr ? Number(editIdStr) : Date.now(), 
                nombre: n, objetivo: o, campoAccion: c, inicio: i, termino: document.getElementById('proyecto-termino').value, 
                responsables: currentResponsables, participantes: [...currentParticipantes], creadorRun: j.run,
                evidencias: currentEvidencias || [],
                fichaExtendida: fichaExtendidaActiva
            };
            
            if (editIdStr) {
                const idx = j.camino.proyectos_colectivos.findIndex(p => p.id === Number(editIdStr));
                if (idx !== -1) j.camino.proyectos_colectivos[idx] = nProj;
            } else {
                j.camino.proyectos_colectivos.push(nProj);
            }
            
            // Sincronizar el proyecto con todos los participantes (incluyendo el creador)
            await sincronizarProyectoConParticipantes(nProj, j.id, false);
            
            await updateProgresionDB(j.id, 'camino', j.camino);
            
            // Si se marcó crear evento
            if (document.getElementById('crear-evento-desde-proyecto').checked) {
                try {
                    mostrarNotificacion('info', 'Creando evento con datos del proyecto...');
                    const descripcion = [
                        nProj.objetivo ? 'Objetivo: ' + nProj.objetivo : '',
                        nProj.justificacion ? 'Justificación: ' + nProj.justificacion : '',
                        nProj.beneficiarios ? 'Beneficiarios: ' + nProj.beneficiarios : '',
                        nProj.campoAccion ? 'Campo de Acción: ' + nProj.campoAccion : ''
                    ].filter(Boolean).join('\n');

                    const { data: evtData, error: evtErr } = await supabaseClient.from('eventos').insert({
                        nombre: nProj.nombre, fecha_inicio: nProj.inicio || null, fecha_fin: nProj.termino || null,
                        lugar: nProj.lugar || '', descripcion, publicado: false
                    }).select().single();
                    if (evtErr) throw evtErr;
                    const evId = evtData.id;

                    await supabaseClient.from('tesoreria_cuentas').insert({ nombre: nProj.nombre, tipo: 'evento', orden: 0 });
                    if (nProj.objetivo) await supabaseClient.from('objetivos_evento').insert({ evento_id: evId, objetivo_general: nProj.objetivo });

                    const numParts = (nProj.participantes || []).length;
                    const numStaff = Object.keys(nProj.responsables || {}).length;
                    const dias = (nProj.inicio && nProj.termino) ? Math.max(1, Math.ceil((new Date(nProj.termino) - new Date(nProj.inicio)) / 86400000)) : 1;
                    await supabaseClient.from('configuracion_presupuesto').insert({ evento_id: evId, participantes: numParts, staff: numStaff, dias, nota: 'Importado desde proyecto: ' + nProj.nombre });

                    for (const part of (nProj.participantes || [])) {
                        try {
                            const { data: mmbb } = await supabaseClient.from('mmbb_registrations').select('nombres, apellidos, unidad, email_apoderado, apoderado_titular_email, apoderado_titular_telefono, foto_url').ilike('run', part.run).maybeSingle();
                            await supabaseClient.from('jovenes').insert({ evento_id: evId, nombre_patrulla: mmbb ? (mmbb.nombres+' '+mmbb.apellidos) : part.nombre, grupo_scout: 'Salvador Sanfuentes', numero_integrantes: 1, email: mmbb?.email_apoderado || mmbb?.apoderado_titular_email || '', telefono: mmbb?.apoderado_titular_telefono || '', foto_url: mmbb?.foto_url || part.foto || '', moneda: 'CLP', confirmado: false, observaciones: 'Unidad: '+(mmbb?.unidad||'N/A') });
                        } catch(e) { console.warn(e); }
                    }

                    for (const [cargo, resp] of Object.entries(nProj.responsables || {})) {
                        if (!resp || !resp.run) continue;
                        try {
                            let d = null;
                            const { data: adu } = await supabaseClient.from('adultos_registros').select('nombres, apellidos, email, telefono, foto_url').ilike('run', resp.run).maybeSingle();
                            if (adu) d = adu; else { const { data: jv } = await supabaseClient.from('mmbb_registrations').select('nombres, apellidos, email_apoderado, apoderado_titular_telefono, foto_url').ilike('run', resp.run).maybeSingle(); if (jv) d = { nombres: jv.nombres, apellidos: jv.apellidos, email: jv.email_apoderado, telefono: jv.apoderado_titular_telefono, foto_url: jv.foto_url }; }
                            await supabaseClient.from('adultos').insert({ evento_id: evId, nombre: d ? (d.nombres+' '+d.apellidos) : resp.nombre, grupo: 'Salvador Sanfuentes', rol: cargo, email: d?.email || '', telefono: d?.telefono || '', foto_url: d?.foto_url || resp.foto || '', confirmado: false, observaciones: cargo+' — Importado' });
                        } catch(e) { console.warn(e); }
                    }

                    const fichaActiva = document.getElementById('toggle-ficha-proyecto')?.checked;
                    if (fichaActiva) {
                        const pptoRows = document.querySelectorAll('#ficha-presupuesto-rows .ficha-ppto-row');
                        const { data: secs } = await supabaseClient.from('secciones_presupuesto').select('id').order('orden').limit(1);
                        const secId = secs?.[0]?.id || 1; let ord = 0;
                        for (const row of pptoRows) {
                            const c = row.querySelector('.ficha-ppto-item')?.value?.trim();
                            const q = parseFloat(row.querySelector('.ficha-ppto-cant')?.value) || 0;
                            const u = parseFloat(row.querySelector('.ficha-ppto-unit')?.value) || 0;
                            if (c && (q > 0 || u > 0)) await supabaseClient.from('items_presupuesto').insert({ evento_id: evId, seccion_id: secId, concepto: c, cantidad: q, costo_unitario: u, costo_final: q*u, orden: ++ord, observaciones: 'Desde ficha' });
                        }
                        const indRows = document.querySelectorAll('#ficha-indicadores-container .ficha-ind-row');
                        let mOrd = 0;
                        for (const row of indRows) {
                            const ins = row.querySelectorAll('input');
                            const desc = ins[0]?.value?.trim(); const meta = ins[1]?.value?.trim();
                            if (desc) await supabaseClient.from('metas_evento').insert({ evento_id: evId, descripcion: desc, valor_esperado: parseFloat(meta)||0, unidad: 'unidad', orden: ++mOrd });
                        }
                    }

                    mostrarNotificacion('exito', 'Evento "'+nProj.nombre+'" creado con '+numParts+' participante(s), '+numStaff+' responsable(s) y datos de presupuesto.');
                } catch(evtE) { console.error(evtE); mostrarNotificacion('info', 'Proyecto guardado, error al crear evento: '+evtE.message); }
                document.getElementById('crear-evento-desde-proyecto').checked = false;
            }
            
            // Enviar notificaciones por email a participantes y responsables del proyecto
            try {
                const creadorNombre = j.nombre;
                for (const part of (nProj.participantes || [])) {
                    if (part.run !== j.run) await enviarNotificacionProyecto(part.run, part.nombre, nProj, 'Participante', creadorNombre);
                }
                for (const [cargo, resp] of Object.entries(nProj.responsables || {})) {
                    if (resp && resp.run && resp.run !== j.run) await enviarNotificacionProyecto(resp.run, resp.nombre, nProj, cargo, creadorNombre);
                }
            } catch(emailErr) { console.warn('Error enviando emails:', emailErr); }
            
            cerrarModalProyecto(); mostrarNotificacion('exito', 'El Proyecto ha sido guardado exitosamente en el portafolio.');
        }

        // Funciones de evidencias
        // Extraer ID de Drive desde URL pública
