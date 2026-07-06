    function renderIngresos() {
        const tbody = document.getElementById('ingresos-body');
        tbody.innerHTML = '';
        ingresos.forEach((ing, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight:bold; text-align:center; background:var(--gris-fondo);">${index + 1}</td>
                <td><input type="text" value="${ing.procedencia || ''}" onchange="updateIngreso('${ing.id}', 'procedencia', this.value)"></td>
                <td><input type="number" step="0.01" value="${ing.monto || 0}" onchange="updateIngreso('${ing.id}', 'monto', parseFloat(this.value)||0)"></td>
                <td style="text-align:center;"><button class="btn btn-sm btn-danger" onclick="eliminarIngreso('${ing.id}')"><i class="fas fa-trash"></i></button></td>
            `;
            tbody.appendChild(row);
        });
        updateTotalesRecursos();
    }

    window.updateIngreso = async function(id, field, value) {
        try { await supabaseClient.from('ingresos').update({ [field]: value }).eq('id', id); } catch(e){}
        const ing = ingresos.find(i => i.id == id);
        if (ing) ing[field] = value;
        updateTotalesRecursos();
    }

    window.eliminarIngreso = async function(id) {
        if(await customConfirm("¿Eliminar este ingreso?")) {
            try { await supabaseClient.from('ingresos').delete().eq('id', id); }catch(e){}
            ingresos = ingresos.filter(i => i.id != id);
            renderIngresos();
        }
    }

    window.addIngresoRow = async function() {
        if (!eventoActual) { await customAlert('Seleccione un evento'); return; }
        const procedencia = await customPrompt('Descripción o Procedencia del Ingreso:', 'Aporte externo');
        if(!procedencia) return;
        const montoStr = await customPrompt('Monto en CLP (Solo números):', '0');
        const montoNum = parseFloat(montoStr) || 0;

        const { data, error } = await supabaseClient.from('ingresos').insert({ evento_id: eventoActual.id, procedencia: procedencia, monto: montoNum }).select();
        if (!error && data && data.length > 0) { 
            ingresos.push(data[0]); 
            renderIngresos(); 
            await registrarMovimientoTesoreria('ingreso', data[0].procedencia, data[0].monto); 
        } else {
            await customAlert('Error al guardar ingreso.');
        }
    }

    function renderGastos() {
        const tbody = document.getElementById('gastos-body');
        tbody.innerHTML = '';
        gastos.forEach((gasto, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight:bold; text-align:center; background:var(--gris-fondo);">${index + 1}</td>
                <td><input type="text" value="${gasto.destino || ''}" onchange="updateGasto('${gasto.id}', 'destino', this.value)"></td>
                <td><input type="number" step="0.01" value="${gasto.monto || 0}" onchange="updateGasto('${gasto.id}', 'monto', parseFloat(this.value)||0)"></td>
                <td style="text-align:center;"><button class="btn btn-sm btn-danger" onclick="eliminarGasto('${gasto.id}')"><i class="fas fa-trash"></i></button></td>
            `;
            tbody.appendChild(row);
        });
        updateTotalesRecursos();
    }

    window.updateGasto = async function(id, field, value) {
        try { await supabaseClient.from('gastos').update({ [field]: value }).eq('id', id); } catch(e){}
        const gasto = gastos.find(g => g.id == id);
        if (gasto) gasto[field] = value;
        updateTotalesRecursos();
    }
    
    window.eliminarGasto = async function(id) {
        if(await customConfirm("¿Eliminar este gasto?")) {
            try { await supabaseClient.from('gastos').delete().eq('id', id); }catch(e){}
            gastos = gastos.filter(i => i.id != id);
            renderGastos();
        }
    }

    window.addGastoRow = async function() {
        if (!eventoActual) { await customAlert('Seleccione un evento'); return; }
        const destino = await customPrompt('Descripción o Destino del Gasto:', 'Compra de materiales');
        if(!destino) return;
        const montoStr = await customPrompt('Monto en CLP (Solo números):', '0');
        const montoNum = parseFloat(montoStr) || 0;

        const { data, error } = await supabaseClient.from('gastos').insert({ evento_id: eventoActual.id, destino: destino, monto: montoNum }).select();
        if (!error && data && data.length > 0) { 
            gastos.push(data[0]); 
            renderGastos(); 
            await registrarMovimientoTesoreria('egreso', data[0].destino, -data[0].monto); 
        } else {
            await customAlert('Error al guardar gasto.');
        }
    }

    async function registrarMovimientoTesoreria(tipo, concepto, monto) {
        if (!eventoActual) return;
        try {
            // Vínculo fuerte por evento_id; fallback por nombre para cuentas antiguas
            let { data: cuentas } = await supabaseClient.from('tesoreria_cuentas').select('id').eq('evento_id', eventoActual.id).limit(1);
            if (!cuentas?.length) ({ data: cuentas } = await supabaseClient.from('tesoreria_cuentas').select('id').is('evento_id', null).eq('nombre', eventoActual.nombre).eq('tipo', 'evento').limit(1));
            const cuenta = cuentas?.[0];
            if (!cuenta) { return; }
            const movimiento = { cuenta_id: cuenta.id, concepto: `${tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} evento: ${concepto}`, monto: tipo === 'ingreso' ? Math.abs(monto) : -Math.abs(monto), moneda: 'CLP', fecha: new Date().toISOString().split('T')[0], referencia: `Evento: ${eventoActual.nombre}`, archivo_url: null };
            await supabaseClient.from('tesoreria_movimientos').insert(movimiento);
        } catch(e) { console.warn("Error en registro de tesorería", e); }
    }

    function updateTotalesRecursos() {
        let totalIng = ingresos.reduce((a, i) => a + (i.monto || 0), 0);
        let totalGas = gastos.reduce((a, g) => a + (g.monto || 0), 0);
        document.getElementById('total-ingresos').innerText = totalIng.toFixed(2);
        document.getElementById('total-gastos').innerText = totalGas.toFixed(2);
        document.getElementById('recursos-disponibles').innerText = (totalIng - totalGas).toFixed(2);
    }

    window.updateIngresoFromInscripcion = async function(silent = false) {
        if (!eventoActual) return;
        let totalCLP = 0;
        jovenes.forEach(p => { totalCLP += (p.numero_integrantes || 0) * (p.cuota || 0); });
        
        let ingInscripcion = ingresos.find(i => i.procedencia === 'Inscripción jóvenes' || i.procedencia === 'Inscripciones');
        if (ingInscripcion) {
            const { error } = await supabaseClient.from('ingresos').update({ monto: totalCLP }).eq('id', ingInscripcion.id);
            if(!error) ingInscripcion.monto = totalCLP;
        } else {
            const { data, error } = await supabaseClient.from('ingresos').insert({ evento_id: eventoActual.id, procedencia: 'Inscripción jóvenes', monto: totalCLP }).select();
            if (!error && data) ingresos.push(data[0]);
        }
        renderIngresos();
        await registrarMovimientoTesoreria('ingreso', 'Inscripción jóvenes', totalCLP);
        if(!silent) customAlert("Sincronización completada.");
    }

    // ========== PLANILLA ==========
