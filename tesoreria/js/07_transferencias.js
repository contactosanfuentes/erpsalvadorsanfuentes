        function renderTransferencias() {
            let historialHtml = transferHistory.map(t => `<tr><td class="px-4 py-3">${t.fecha}<\/td><td class="px-4 py-3">${t.origen}<\/td><td class="px-4 py-3">${t.destino}<\/td><td class="px-4 py-3 text-right font-bold">${currencyFormatter.format(t.monto)}<\/td><td class="px-4 py-3">${t.concepto}<\/td><\/tr>`).join('');
            let html = `<div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"><div class="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center"><h3 class="font-bold text-slate-700">Historial de Transferencias</h3><button onclick="openTransferModal()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"><i class="fas fa-exchange-alt"></i> Nueva Transferencia</button></div><div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="bg-slate-50 text-slate-400 font-bold text-xs uppercase"><th class="px-4 py-4">Fecha</th><th>Origen</th><th>Destino</th><th class="text-right">Monto</th><th>Concepto</th></thead><tbody class="divide-y divide-slate-100">${historialHtml || '<tr><td colspan="5" class="py-20 text-center text-slate-300">No hay transferencias registradas<\/td><\/tr>'}</tbody><\/table><\/div><\/div>`;
            document.getElementById('tesoreriaContent').innerHTML = html;
        }
        function openTransferModal() {
            populateTransferSelects();
            document.getElementById('transferAmount').value = '';
            document.getElementById('transferConcept').value = '';
            document.getElementById('modalTransfer').classList.remove('hidden');
        }
        function populateTransferSelects() {
            const fromSelect = document.getElementById('transferFrom');
            const toSelect = document.getElementById('transferTo');
            fromSelect.innerHTML = '<option value="">Seleccionar cuenta origen</option>';
            toSelect.innerHTML = '<option value="">Seleccionar cuenta destino</option>';
            accounts.forEach(acc => {
                fromSelect.innerHTML += `<option value="${acc.id}">${acc.nombre}</option>`;
                toSelect.innerHTML += `<option value="${acc.id}">${acc.nombre}</option>`;
            });
        }
        async function executeTransfer() {
            const fromId = document.getElementById('transferFrom').value;
            const toId = document.getElementById('transferTo').value;
            const amount = parseFloat(document.getElementById('transferAmount').value);
            const concept = document.getElementById('transferConcept').value.trim() || 'Transferencia';
            if (!fromId || !toId || isNaN(amount) || amount <= 0) { alert('Complete todos los campos correctamente.'); return; }
            if (fromId === toId) { alert('Las cuentas origen y destino deben ser diferentes.'); return; }
            const fromAcc = accounts.find(a => a.id === fromId);
            const toAcc = accounts.find(a => a.id === toId);
            if (!fromAcc || !toAcc) return;
            const fecha = new Date().toISOString().split('T')[0];
            try {
                const { data: movFrom, error: errFrom } = await supabaseClient.from('tesoreria_movimientos').insert({ cuenta_id: fromId, concepto: `Transferencia a ${toAcc.nombre}: ${concept}`, monto: -amount, moneda: 'CLP', fecha }).select();
                if (errFrom) throw errFrom;
                const { data: movTo, error: errTo } = await supabaseClient.from('tesoreria_movimientos').insert({ cuenta_id: toId, concepto: `Transferencia desde ${fromAcc.nombre}: ${concept}`, monto: amount, moneda: 'CLP', fecha }).select();
                if (errTo) throw errTo;
                const { error: errHist } = await supabaseClient.from('tesoreria_transferencias').insert({ fecha, origen: fromAcc.nombre, destino: toAcc.nombre, monto: amount, concepto: concept });
                if (errHist) throw errHist;
                if (!fromAcc.movimientos) fromAcc.movimientos = [];
                if (!toAcc.movimientos) toAcc.movimientos = [];
                fromAcc.movimientos.push(movFrom[0]);
                toAcc.movimientos.push(movTo[0]);
                transferHistory.push({ fecha, origen: fromAcc.nombre, destino: toAcc.nombre, monto: amount, concepto: concept });
                closeModal('modalTransfer');
                renderCurrentTab();
                showToast('Transferencia realizada', 'success');
            } catch (error) { showToast('Error al realizar transferencia: ' + error.message, 'error'); }
        }

        // ==================== PLANES DE PAGO ====================
        function checkTesoreroAndSwitch() { const CLAVE = 'tesorero2026'; const clave = prompt('Ingrese clave de tesorero para acceder a Planes de Pago:'); if (clave === CLAVE) switchTesoreriaTab('planes'); else alert('Clave incorrecta'); }
