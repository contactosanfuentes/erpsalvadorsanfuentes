    function renderInventario() {
        const tbody = document.getElementById('inventario-body');
        tbody.innerHTML = '';
        inventario.forEach((item, index) => {
            const esPrestamo = !!item.inventario_grupo_id;
            const row = document.createElement('tr');
            if (esPrestamo) row.style.background = '#fef3c7';
            const origenBadge = esPrestamo
                ? `<span style="display:inline-block;padding:3px 10px;border-radius:14px;font-size:0.72rem;font-weight:700;background:#fef3c7;color:#92400e;border:1px solid #fbbf24" title="Prestado del inventario del grupo — al eliminar se devolverá automáticamente"><i class="fas fa-handshake"></i> Préstamo del grupo</span>`
                : `<span style="display:inline-block;padding:3px 10px;border-radius:14px;font-size:0.72rem;font-weight:700;background:#dbeafe;color:#1e40af"><i class="fas fa-box"></i> Compra del evento</span>`;
            // Si es préstamo, los campos producto/cantidad no son editables libremente
            const prodInput = esPrestamo
                ? `<input type="text" value="${(item.producto || '').replace(/"/g,'&quot;')}" readonly style="background:#fef9c3;cursor:not-allowed" title="Ítem prestado del inventario del grupo (no editable)">`
                : `<input type="text" value="${(item.producto || '').replace(/"/g,'&quot;')}" onchange="updateInventario('${item.id}', 'producto', this.value)">`;
            const cantInput = esPrestamo
                ? `<input type="text" value="${item.cantidad_prestada || item.cantidad || 0}" readonly style="background:#fef9c3;cursor:not-allowed" title="Cantidad prestada">`
                : `<input type="text" value="${item.cantidad || ''}" onchange="updateInventario('${item.id}', 'cantidad', this.value)">`;
            row.innerHTML = `
                <td>${prodInput}</td>
                <td>${cantInput}</td>
                <td>${origenBadge}</td>
                <td style="text-align:center;"><button class="btn btn-danger btn-sm" onclick="eliminarInventario('${item.id}')" title="${esPrestamo ? 'Devolver al inventario del grupo' : 'Eliminar'}"><i class="fas ${esPrestamo ? 'fa-undo' : 'fa-trash'}"></i></button></td>
            `;
            tbody.appendChild(row);
        });
    }

    window.updateInventario = async function(id, field, value) {
        try{ await supabaseClient.from('inventario').update({ [field]: value }).eq('id', id); }catch(e){}
        const item = inventario.find(i => i.id == id);
        if (item) item[field] = value;
    }

    window.eliminarInventario = async function(id) {
        const item = inventario.find(i => i.id == id);
        if (!item) return;
        const esPrestamo = !!item.inventario_grupo_id;
        const msg = esPrestamo
            ? `¿Devolver este ítem al inventario del grupo? La cantidad prestada (${item.cantidad_prestada || 0}) volverá a estar disponible.`
            : "¿Eliminar producto?";
        if(!(await customConfirm(msg))) return;

        // Si es préstamo, descontar primero del cantidad_prestada en inventario_grupo
        if (esPrestamo && item.inventario_grupo_id) {
            try {
                const { data: itemGrupo } = await supabaseClient
                    .from('inventario_grupo').select('cantidad_prestada').eq('id', item.inventario_grupo_id).single();
                if (itemGrupo) {
                    const nuevaPrestada = Math.max(0, (itemGrupo.cantidad_prestada || 0) - (item.cantidad_prestada || 0));
                    await supabaseClient.from('inventario_grupo').update({ cantidad_prestada: nuevaPrestada }).eq('id', item.inventario_grupo_id);
                }
            } catch(e){ console.warn('Error devolviendo al grupo:', e); }
        }

        try{ await supabaseClient.from('inventario').delete().eq('id', id); }catch(e){}
        inventario = inventario.filter(i => i.id != id); renderInventario();
    }

    window.addInventarioRow = async function() {
        if (!eventoActual) { await customAlert('Seleccione un evento'); return; }
        const nuevo = { evento_id: eventoActual.id, producto: 'Nuevo', cantidad: '0' };
        try {
            const { data, error } = await supabaseClient.from('inventario').insert(nuevo).select();
            if (!error && data && data.length > 0) { inventario.push({...data[0]}); }
            else { nuevo.id = Date.now(); inventario.push(nuevo); }
        } catch(e){ nuevo.id = Date.now(); inventario.push(nuevo); }
        renderInventario();
    }

    // ── PEDIR PRESTADO DEL INVENTARIO DEL GRUPO ──
    window.abrirPrestamoInventarioGrupo = async function() {
        if (!eventoActual) { await customAlert('Seleccione un evento primero.'); return; }

        // Cargar items disponibles del inventario del grupo
        const { data: itemsGrupo, error } = await supabaseClient
            .from('inventario_grupo')
            .select('*')
            .order('categoria').order('producto');

        if (error) {
            await customAlert('Error al cargar el inventario del grupo: ' + error.message + '\n¿Existe la tabla inventario_grupo?');
            return;
        }
        if (!itemsGrupo || !itemsGrupo.length) {
            await customAlert('El inventario del grupo está vacío. Agrega ítems desde el módulo "Inventario del Grupo".');
            return;
        }

        // Modal de selección
        const existente = document.getElementById('modalPrestamoGrupo');
        if (existente) existente.remove();

        const modal = document.createElement('div');
        modal.id = 'modalPrestamoGrupo';
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px';

        const itemsDisponibles = itemsGrupo.filter(i => ((i.cantidad_total || 1) - (i.cantidad_prestada || 0)) > 0);
        const filasHTML = itemsDisponibles.map(item => {
            const total = item.cantidad_total || 1;
            const prest = item.cantidad_prestada || 0;
            const disp = total - prest;
            const catColor = { Campamento:'#3498db', Cocina:'#e67e22', Uniformes:'#8b5cf6', Herramientas:'#64748b', Actividades:'#27ae60', Documentos:'#e74c3c', General:'#94a3b8' }[item.categoria] || '#94a3b8';
            return `<tr data-id="${item.id}" data-disp="${disp}" data-producto="${(item.producto||'').replace(/"/g,'&quot;')}" data-cantxt="${(item.cantidad||'').replace(/"/g,'&quot;')}">
                <td style="padding:7px 10px"><input type="checkbox" class="chk-prestamo" style="transform:scale(1.1);cursor:pointer"></td>
                <td style="padding:7px 10px">
                    <strong style="font-size:0.86rem">${item.producto||''}</strong>
                    <div style="font-size:0.72rem;color:#64748b"><span style="background:${catColor};color:white;padding:1px 7px;border-radius:10px;font-size:0.68rem;font-weight:700">${item.categoria||'—'}</span> · ${item.unidad_responsable||'—'}${item.ubicacion?' · '+item.ubicacion:''}</div>
                </td>
                <td style="padding:7px 10px;text-align:center"><span style="font-size:0.92rem;font-weight:700;color:#0E2586">${disp}</span><div style="font-size:0.7rem;color:#64748b">de ${total} ${item.cantidad||''}</div></td>
                <td style="padding:7px 10px;text-align:center"><input type="number" class="inp-cant" min="1" max="${disp}" value="1" style="width:65px;padding:5px;border:1px solid #cbd5e1;border-radius:5px;text-align:center;font-size:0.86rem"></td>
            </tr>`;
        }).join('');

        modal.innerHTML = `
            <div style="background:white;border-radius:14px;max-width:720px;width:100%;max-height:85vh;overflow:hidden;box-shadow:0 15px 40px rgba(0,0,0,0.2);display:flex;flex-direction:column">
                <div style="background:linear-gradient(135deg,#0E2586,#1a36a8);color:white;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
                    <h3 style="margin:0;font-size:1.02rem;font-weight:600"><i class="fas fa-handshake" style="margin-right:8px;color:#FFD100"></i>Pedir prestado del inventario del grupo</h3>
                    <button onclick="document.getElementById('modalPrestamoGrupo').remove()" style="background:none;border:none;color:white;font-size:1.3rem;cursor:pointer"><i class="fas fa-times"></i></button>
                </div>
                <div style="padding:12px 20px;background:#fef3c7;border-bottom:1px solid #fbbf24;font-size:0.81rem;color:#78350f">
                    <i class="fas fa-info-circle"></i> Marca los ítems que quieres prestar y ajusta la cantidad. Al eliminarlos del evento se devolverán automáticamente al inventario del grupo.
                </div>
                <div style="padding:10px 20px;border-bottom:1px solid #e2e8f0">
                    <input type="text" id="filtroPrestamo" placeholder="Buscar ítem..." style="width:100%;padding:8px 12px;border:2px solid #e2e8f0;border-radius:8px;font-size:0.88rem;outline:none" oninput="filtrarPrestamo(this.value)">
                </div>
                <div style="flex:1;overflow-y:auto">
                    ${itemsDisponibles.length ? `<table style="width:100%;border-collapse:collapse">
                        <thead style="position:sticky;top:0;background:#f8fafc;z-index:1">
                            <tr>
                                <th style="padding:9px 10px;text-align:left;font-size:0.72rem;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0"><i class="fas fa-check"></i></th>
                                <th style="padding:9px 10px;text-align:left;font-size:0.72rem;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0">Producto</th>
                                <th style="padding:9px 10px;text-align:center;font-size:0.72rem;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0">Disponible</th>
                                <th style="padding:9px 10px;text-align:center;font-size:0.72rem;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0">Pedir</th>
                            </tr>
                        </thead>
                        <tbody id="tbodyPrestamo">${filasHTML}</tbody>
                    </table>` : '<div style="text-align:center;padding:40px;color:#94a3b8"><i class="fas fa-box-open" style="font-size:2rem;display:block;margin-bottom:8px"></i>No hay ítems disponibles para prestar.</div>'}
                </div>
                <div style="padding:12px 20px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:0.82rem;color:#64748b" id="prestamoResumen">0 ítems seleccionados</span>
                    <div style="display:flex;gap:8px">
                        <button onclick="document.getElementById('modalPrestamoGrupo').remove()" style="background:#f1f5f9;color:#334155;border:none;padding:9px 16px;border-radius:8px;font-weight:600;cursor:pointer">Cancelar</button>
                        <button onclick="confirmarPrestamoGrupo()" style="background:linear-gradient(135deg,#0E2586,#1a36a8);color:white;border:none;padding:9px 18px;border-radius:8px;font-weight:600;cursor:pointer"><i class="fas fa-handshake"></i> Pedir prestado</button>
                    </div>
                </div>
            </div>
        `;
        modal.onclick = e => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);

        // Actualizar resumen cuando cambian los checks
        modal.addEventListener('change', e => {
            if (e.target.classList.contains('chk-prestamo') || e.target.classList.contains('inp-cant')) {
                const marcados = modal.querySelectorAll('.chk-prestamo:checked');
                document.getElementById('prestamoResumen').textContent = marcados.length + ' ítem' + (marcados.length !== 1 ? 's' : '') + ' seleccionado' + (marcados.length !== 1 ? 's' : '');
            }
        });
    }

    window.filtrarPrestamo = function(q) {
        const tbody = document.getElementById('tbodyPrestamo');
        if (!tbody) return;
        const query = q.toLowerCase();
        tbody.querySelectorAll('tr').forEach(tr => {
            const txt = tr.textContent.toLowerCase();
            tr.style.display = (!query || txt.includes(query)) ? '' : 'none';
        });
    }

    window.confirmarPrestamoGrupo = async function() {
        const modal = document.getElementById('modalPrestamoGrupo');
        if (!modal) return;
        const marcados = [...modal.querySelectorAll('.chk-prestamo:checked')].map(chk => {
            const tr = chk.closest('tr');
            const cantInput = tr.querySelector('.inp-cant');
            return {
                id: tr.dataset.id,
                producto: tr.dataset.producto,
                cantxt: tr.dataset.cantxt,
                disp: parseInt(tr.dataset.disp),
                pedir: Math.min(parseInt(cantInput.value) || 1, parseInt(tr.dataset.disp))
            };
        });

        if (!marcados.length) { await customAlert('Selecciona al menos un ítem.'); return; }

        const btn = modal.querySelector('button[onclick="confirmarPrestamoGrupo()"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

        let ok = 0, err = 0;
        for (const m of marcados) {
            try {
                // 1. Insertar en inventario del evento con referencia al del grupo
                const { error: insErr } = await supabaseClient.from('inventario').insert({
                    evento_id: eventoActual.id,
                    producto: m.producto,
                    cantidad: `${m.pedir} ${m.cantxt||''}`.trim(),
                    inventario_grupo_id: parseInt(m.id),
                    cantidad_prestada: m.pedir
                });
                if (insErr) throw insErr;
                // 2. Aumentar cantidad_prestada en el inventario del grupo
                const { data: itemGrupo } = await supabaseClient.from('inventario_grupo').select('cantidad_prestada').eq('id', m.id).single();
                const nuevaPrest = (itemGrupo?.cantidad_prestada || 0) + m.pedir;
                await supabaseClient.from('inventario_grupo').update({ cantidad_prestada: nuevaPrest }).eq('id', m.id);
                ok++;
            } catch(e) {
                console.error('Error prestando ítem:', e);
                err++;
            }
        }

        modal.remove();
        await customAlert(`Préstamo completado: ${ok} ítem(s) agregado(s) al evento.${err ? ' ' + err + ' error(es).' : ''}`);
        // Recargar inventario del evento
        let { data: inv } = await supabaseClient.from('inventario').select('*').eq('evento_id', eventoActual.id);
        inventario = (inv || []).map(r => ({...r}));
        renderInventario();
    }

    // ========== MENÚ ==========
