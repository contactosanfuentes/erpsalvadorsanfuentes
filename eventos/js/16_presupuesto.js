    async function cargarPresupuesto(eventoId) {
        const { data: secciones } = await supabaseClient.from('secciones_presupuesto').select('*').order('orden');
        seccionesPresupuesto = (secciones && secciones.length > 0) ? secciones : [
            { id: 1, nombre: 'Comidas', icono: '🍽️' }, { id: 2, nombre: 'Programa', icono: '🎯' }, { id: 3, nombre: 'Administración', icono: '📋' },
            { id: 4, nombre: 'Logística', icono: '🚚' }, { id: 5, nombre: 'Operaciones', icono: '📡' }, { id: 6, nombre: 'Comunicaciones', icono: '📞' }
        ];
        
        const { data: config } = await supabaseClient.from('configuracion_presupuesto').select('*').eq('evento_id', eventoId).maybeSingle();
        if (config) {
            configuracionPresupuesto = config;
            document.getElementById('presupuesto-participantes').value = config.participantes || 0;
            document.getElementById('presupuesto-staff').value = config.staff || 0;
            document.getElementById('presupuesto-dias').value = config.dias || 1;
            document.getElementById('presupuesto-cuota').value = config.cuota || 0;
            document.getElementById('presupuesto-nota').value = config.nota || '';
        }
        
        const { data: items } = await supabaseClient.from('items_presupuesto').select('*').eq('evento_id', eventoId).order('orden');
        itemsPresupuesto = items || [];
        setTimeout(actualizarResumenPresupuesto, 100);
    }

    function renderPresupuesto() {
        const container = document.getElementById('secciones-presupuesto-container');
        if (!container) return;
        container.innerHTML = '';
        const itemsPorSeccion = {};
        itemsPresupuesto.forEach(item => {
            if (!itemsPorSeccion[item.seccion_id]) itemsPorSeccion[item.seccion_id] = [];
            itemsPorSeccion[item.seccion_id].push(item);
        });
        
        seccionesPresupuesto.forEach(seccion => {
            const items = itemsPorSeccion[seccion.id] || [];
            const totalSeccion = items.reduce((s, i) => s + (i.costo_final || 0), 0);
            const div = document.createElement('div');
            div.className = 'seccion-presupuesto';
            div.innerHTML = `
                <div class="seccion-header">
                    <span>${seccion.icono}</span> ${seccion.nombre}
                    <span style="margin-left:auto; color: var(--azul-profundo);">Total: $${totalSeccion.toFixed(2)}</span>
                </div>
                <div class="table-container" style="margin-top: 10px;">
                    <table class="items-table">
                        <thead> <th>Concepto</th><th>Cant.</th><th>Costo Unit.</th><th>Costo Real</th><th>Especie</th><th>Costo Final</th><th>Responsable</th><th>Acción</th> </thead>
                        <tbody>
                            ${items.map(item => `
                                  <tr>
                                    <td><input type="text" value="${item.concepto}" onchange="actualizarItemPresupuesto('${item.id}', 'concepto', this.value)"></td>
                                    <td><input type="number" value="${item.cantidad}" step="0.01" onchange="actualizarItemPresupuesto('${item.id}', 'cantidad', this.value)"></td>
                                    <td><input type="number" value="${item.costo_unitario}" step="0.01" onchange="actualizarItemPresupuesto('${item.id}', 'costo_unitario', this.value)"></td>
                                    <td><input type="number" value="${item.costo_real}" step="0.01" onchange="actualizarItemPresupuesto('${item.id}', 'costo_real', this.value)"></td>
                                    <td><input type="number" value="${item.especie}" step="0.01" onchange="actualizarItemPresupuesto('${item.id}', 'especie', this.value)"></td>
                                    <td><input type="number" value="${item.costo_final}" step="0.01" onchange="actualizarItemPresupuesto('${item.id}', 'costo_final', this.value)" style="font-weight:bold; background:var(--gris-fondo);"></td>
                                    <td><input type="text" value="${item.responsable || ''}" onchange="actualizarItemPresupuesto('${item.id}', 'responsable', this.value)"></td>
                                    <td style="text-align:center;"><button class="btn btn-danger btn-sm" onclick="eliminarItemPresupuesto('${item.id}')"><i class="fas fa-trash"></i></button></td>
                                  </tr>
                            `).join('')}
                        </tbody>
                      </table>
                </div>
                <div class="controls" style="margin-top:15px;"><button class="btn btn-success btn-sm" onclick="agregarItemASeccion(${seccion.id})"><i class="fas fa-plus"></i> Agregar Ítem</button></div>
            `;
            container.appendChild(div);
        });
        actualizarResumenPresupuesto();
    }

    window.actualizarItemPresupuesto = async function(id, campo, valor) {
        const item = itemsPresupuesto.find(i => i.id == id);
        if (!item) return;
        item[campo] = (campo === 'concepto' || campo === 'responsable') ? valor : (parseFloat(valor) || 0);
        if (campo === 'cantidad' || campo === 'costo_unitario' || campo === 'costo_real' || campo === 'especie') {
            if (campo === 'cantidad' || campo === 'costo_unitario') item.costo_real = (item.cantidad || 0) * (item.costo_unitario || 0);
            item.costo_final = (item.costo_real || 0) - (item.especie || 0);
        }
        try{ await supabaseClient.from('items_presupuesto').update({ [campo]: item[campo], costo_real: item.costo_real, costo_final: item.costo_final }).eq('id', id); }catch(e){}
        renderPresupuesto();
    }

    window.eliminarItemPresupuesto = async function(id) {
        if(await customConfirm("¿Eliminar ítem del presupuesto?")) {
            try{ await supabaseClient.from('items_presupuesto').delete().eq('id', id); }catch(e){}
            itemsPresupuesto = itemsPresupuesto.filter(i => i.id != id); renderPresupuesto();
        }
    }

    window.agregarItemASeccion = async function(seccionId) {
        if (!eventoActual) return;
        const nuevo = { evento_id: eventoActual.id, seccion_id: seccionId, concepto: 'Nuevo concepto', cantidad: 0, costo_unitario: 0, costo_real: 0, especie: 0, costo_final: 0, orden: 0 };
        try{
            const { data } = await supabaseClient.from('items_presupuesto').insert(nuevo).select();
            if (data && data.length > 0) { itemsPresupuesto.push(data[0]); renderPresupuesto(); }
            else { nuevo.id = Date.now(); itemsPresupuesto.push(nuevo); renderPresupuesto(); }
        }catch(e){ nuevo.id = Date.now(); itemsPresupuesto.push(nuevo); renderPresupuesto(); }
    }

    window.agregarItemPresupuesto = function() { if (seccionesPresupuesto.length > 0) agregarItemASeccion(seccionesPresupuesto[0].id); }

    window.guardarPresupuesto = async function() {
        if (!eventoActual) return;
        const config = {
            evento_id: eventoActual.id,
            participantes: parseFloat(document.getElementById('presupuesto-participantes').value) || 0,
            staff: parseFloat(document.getElementById('presupuesto-staff').value) || 0,
            dias: parseFloat(document.getElementById('presupuesto-dias').value) || 1,
            cuota: parseFloat(document.getElementById('presupuesto-cuota').value) || 0,
            nota: document.getElementById('presupuesto-nota').value
        };
        try{ await supabaseClient.from('configuracion_presupuesto').upsert(config, { onConflict: 'evento_id' }); }catch(e){}
        customAlert('Configuración guardada exitosamente');
    }

    function actualizarResumenPresupuesto() {
        const p = parseFloat(document.getElementById('presupuesto-participantes')?.value) || 0;
        const s = parseFloat(document.getElementById('presupuesto-staff')?.value) || 0;
        const c = parseFloat(document.getElementById('presupuesto-cuota')?.value) || 0;
        const tP = p + s;
        const tG = itemsPresupuesto.reduce((sum, i) => sum + (i.costo_final || 0), 0);
        const tC = itemsPresupuesto.reduce((sum, i) => sum + (i.costo_real || 0), 0);
        const tE = itemsPresupuesto.reduce((sum, i) => sum + (i.especie || 0), 0);
        const rec = p * c;
        const dif = tG - rec;
        
        document.getElementById('presupuesto-total-personas').innerText = tP;
        document.getElementById('presupuesto-total-general').innerText = `$${tG.toFixed(2)}`;
        document.getElementById('presupuesto-total-costo').innerText = `$${tC.toFixed(2)}`;
        document.getElementById('presupuesto-total-especie').innerText = `$${tE.toFixed(2)}`;
        document.getElementById('presupuesto-costo-unitario').innerText = `Costo unitario: $${tP > 0 ? (tG / tP).toFixed(2) : 0}`;
        document.getElementById('presupuesto-recaudacion').innerText = `Recaudación esperada: $${rec.toFixed(2)}`;
        document.getElementById('presupuesto-diferencia').innerText = `Diferencia: $${dif.toFixed(2)}`;
        document.getElementById('presupuesto-diferencia').style.color = dif > 0 ? 'var(--rojo-intenso)' : 'var(--verde)';
    }

    window.actualizarConfiguracionPresupuesto = function() {
        actualizarResumenPresupuesto();
        guardarPresupuesto();
    }

    // ========== OBJETIVOS Y METAS ==========
