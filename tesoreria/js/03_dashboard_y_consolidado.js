        function renderDashboard() {
            const totalIngresos = accounts.reduce((sum, acc) => sum + (acc.movimientos?.filter(m => m.monto > 0).reduce((s, m) => s + m.monto, 0) || 0), 0);
            const totalEgresos = accounts.reduce((sum, acc) => sum + (acc.movimientos?.filter(m => m.monto < 0).reduce((s, m) => s + Math.abs(m.monto), 0) || 0), 0);
            const saldoTotal = accounts.reduce((sum, acc) => sum + (acc.movimientos?.reduce((s, m) => s + m.monto, 0) || 0), 0);
            const cuentasNegativas = accounts.filter(acc => (acc.movimientos?.reduce((s, m) => s + m.monto, 0) || 0) < 0);
            let html = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-indigo-600 text-white p-8 rounded-3xl shadow-xl"><p class="text-indigo-100 text-xs font-black uppercase tracking-widest mb-1">Saldo Consolidado</p><h3 class="text-3xl font-black">${currencyFormatter.format(saldoTotal)}</h3><p class="mt-4 text-xs bg-white/10 w-fit px-2 py-1 rounded font-bold">${accounts.length} CUENTAS</p></div>
                    <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"><p class="text-emerald-500 text-xs font-black uppercase tracking-widest mb-1">Ingresos de Grupo</p><h3 class="text-3xl font-bold text-slate-800">${currencyFormatter.format(totalIngresos)}</h3></div>
                    <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"><p class="text-rose-500 text-xs font-black uppercase tracking-widest mb-1">Egresos de Grupo</p><h3 class="text-3xl font-bold text-slate-800">${currencyFormatter.format(totalEgresos)}</h3></div>
                </div>
                <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mt-6"><h4 class="font-black text-xs text-slate-400 uppercase tracking-widest mb-6">Evolución de Saldos (últimos 12 meses)</h4><div class="h-64"><canvas id="evolutionChart"></canvas></div></div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"><h4 class="font-black text-xs text-slate-400 uppercase tracking-widest mb-6">Saldos por Cuenta</h4><div class="h-64"><canvas id="dashboardChart"></canvas></div></div>
                    <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"><h4 class="font-black text-xs text-slate-400 uppercase tracking-widest mb-6">Alertas y Notificaciones</h4><div class="space-y-3 max-h-64 overflow-y-auto pr-2" id="alertasContainer">${cuentasNegativas.length === 0 ? '<p class="text-slate-400 text-center py-4">No hay alertas de cuentas</p>' : ''}${cuentasNegativas.map(acc => { const saldo = acc.movimientos?.reduce((s, m) => s + m.monto, 0) || 0; return `<div class="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl"><i class="fas fa-exclamation-triangle text-rose-500"></i><div class="flex-1"><p class="font-bold text-rose-800">Cuenta con saldo negativo</p><p class="text-sm">${acc.nombre}: ${currencyFormatter.format(saldo)}</p></div></div>`; }).join('')}</div></div>
                </div>
            `;
            document.getElementById('tesoreriaContent').innerHTML = html;
            const ctx = document.getElementById('dashboardChart')?.getContext('2d');
            if (ctx) { if (chartInstance) chartInstance.destroy(); chartInstance = new Chart(ctx, { type: 'bar', data: { labels: accounts.map(a => a.nombre), datasets: [{ data: accounts.map(a => a.movimientos?.reduce((s, m) => s + m.monto, 0) || 0), backgroundColor: accounts.map(a => (a.movimientos?.reduce((s, m) => s + m.monto, 0) || 0) < 0 ? '#f43f5e' : '#6366f1'), borderRadius: 8 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } }); }
            const evoCtx = document.getElementById('evolutionChart')?.getContext('2d');
            if (evoCtx) { const meses = ['Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar']; const saldoMensual = [1200000,1250000,1300000,1280000,1350000,1400000,1450000,1500000,1550000,1600000,1650000,saldoTotal]; if (evoChartInstance) evoChartInstance.destroy(); evoChartInstance = new Chart(evoCtx, { type: 'line', data: { labels: meses, datasets: [{ label: 'Saldo total', data: saldoMensual, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false } }); }
        }

        // ==================== CONSOLIDADO ====================
        function renderConsolidado() {
            let rows = '';
            let totalIng = 0, totalEgr = 0, totalBal = 0;
            accounts.forEach(acc => {
                let ing = (acc.movimientos || []).filter(m => m.monto > 0).reduce((s, m) => s + m.monto, 0);
                let egr = (acc.movimientos || []).filter(m => m.monto < 0).reduce((s, m) => s + Math.abs(m.monto), 0);
                let bal = (acc.movimientos || []).reduce((s, m) => s + m.monto, 0);
                totalIng += ing; totalEgr += egr; totalBal += bal;
                rows += `<tr class="hover:bg-slate-50 cursor-pointer" onclick="selectAccount('${acc.id}')">
                            <td class="px-6 py-4 font-bold">${acc.nombre}<\/td>
                            <td class="px-6 py-4 capitalize">${acc.tipo}<\/td>
                            <td class="px-6 py-4 text-right text-emerald-600">${currencyFormatter.format(ing)}<\/td>
                            <td class="px-6 py-4 text-right text-rose-600">${currencyFormatter.format(egr)}<\/td>
                            <td class="px-6 py-4 text-right font-black ${bal < 0 ? 'text-rose-600' : ''}">${currencyFormatter.format(bal)}<\/td>
                           <\/tr>`;
            });
            let html = `
                <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                        <h3 class="font-bold text-slate-700">Resumen Consolidado<\/h3>
                        <div class="flex gap-2">
                            <button onclick="exportToPDF()" class="text-xs font-bold text-indigo-600 hover:underline px-3 py-1 border border-indigo-200 rounded-lg"><i class="fas fa-file-pdf mr-1"><\/i>PDF<\/button>
                            <button onclick="exportToExcel()" class="text-xs font-bold text-green-600 hover:underline px-3 py-1 border border-green-200 rounded-lg"><i class="fas fa-file-excel mr-1"><\/i>Excel<\/button>
                            <button onclick="window.print()" class="text-xs font-bold text-slate-600 hover:underline px-3 py-1 border border-slate-200 rounded-lg"><i class="fas fa-print mr-1"><\/i>Imprimir<\/button>
                        <\/div>
                    <\/div>
                    <div class="overflow-x-auto">
                        <table id="consolidadoTable" class="w-full text-left text-sm">
                            <thead class="bg-slate-50 text-slate-400 font-bold text-xs uppercase">
                                <th class="px-6 py-4">Cuenta<\/th><th>Tipo<\/th><th class="text-right">Ingresos<\/th><th class="text-right">Egresos<\/th><th class="text-right">Saldo<\/th>
                            <\/thead>
                            <tbody class="divide-y divide-slate-100">${rows}<\/tbody>
                            <tfoot class="bg-indigo-50/50 font-bold border-t border-indigo-100">
                                <td colspan="2" class="px-6 py-4">TOTAL GRUPO<\/td>
                                <td class="px-6 py-4 text-right">${currencyFormatter.format(totalIng)}<\/td>
                                <td class="px-6 py-4 text-right">${currencyFormatter.format(totalEgr)}<\/td>
                                <td class="px-6 py-4 text-right text-indigo-700">${currencyFormatter.format(totalBal)}<\/td>
                            <\/tfoot>
                         <\/table>
                    <\/div>
                <\/div>
            `;
            document.getElementById('tesoreriaContent').innerHTML = html;
        }

        function exportToPDF() {
            const table = document.getElementById('consolidadoTable');
            if (!table) return;
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html><head><title>Consolidado Financiero<\/title>
                <style>body{font-family:Arial;padding:20px;} table{border-collapse:collapse;width:100%;} th{background:#0e2586;color:white;padding:8px;} td{border:1px solid #ccc;padding:8px;}<\/style>
                <\/head><body><h1 style="text-align:center;">Consolidado Financiero<\/h1>${table.outerHTML}<\/body><\/html>
            `);
            printWindow.document.close();
            printWindow.print();
            // Subir consolidado a Drive en paralelo
            (async () => {
                try {
                    const canvas = await html2canvas(table, { scale: 1.5, backgroundColor: '#ffffff' });
                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });
                    const imgW = pdf.internal.pageSize.getWidth();
                    const imgH = (canvas.height * imgW) / canvas.width;
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH);
                    const pdfBase64 = pdf.output('datauristring').split(',')[1];
                    const fecha = new Date().toLocaleDateString('es-CL').replace(/\//g,'-');
                    await window.DriveHelper.subir({
                        supabaseClient,
                        nombre: `Consolidado_Financiero_${fecha}.pdf`,
                        base64: pdfBase64,
                        mimeType: 'application/pdf',
                        claveCarpeta: 'admin_tesoreria'
                    });
                    console.log('✅ Consolidado financiero guardado en Drive');
                } catch(e) { console.warn('Drive no disponible:', e.message); }
            })();
        }

        function exportToExcel() {
            const table = document.getElementById('consolidadoTable');
            if (!table) return;
            const wb = XLSX.utils.table_to_book(table, { sheet: "Consolidado" });
            XLSX.writeFile(wb, "consolidado_financiero.xlsx");
        }

        // ==================== CUENTAS ====================
