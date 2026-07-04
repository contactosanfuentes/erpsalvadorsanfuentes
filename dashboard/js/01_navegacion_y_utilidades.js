        window.switchTab = function(tab, button) {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-${tab}`).classList.remove('hidden');
            
            setTimeout(() => {
                if (tab === 'admin') { if (chartFondos) chartFondos.resize(); if (chartEvolucion) chartEvolucion.resize(); }
                if (tab === 'adultos') { if (chartCargos) chartCargos.resize(); if (chartCiclo) chartCiclo.resize(); }
            }, 200);
        };

        function getInitials(nombre) { return nombre ? nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'; }

        function extraerRama(texto) {
            if(!texto) return null;
            const str = texto.toLowerCase();
            if (str.includes('bandada')) return 'Bandada';
            if (str.includes('manada')) return 'Manada';
            if (str.includes('tropa')) return 'Tropa';
            if (str.includes('compañía') || str.includes('compania') || str.includes('cia')) return 'Compañía';
            if (str.includes('avanzada') || str.includes('pionero')) return 'Avanzada';
            if (str.includes('clan') || str.includes('caminante')) return 'Clan';
            return null;
        }

        function resolverEtapa(rama, etapaActual, adelanto) {
            if (!rama) return null;
            let etapaValida = etapaActual || adelanto;
            if (!etapaValida || !ETAPAS_POR_RAMA[rama] || !ETAPAS_POR_RAMA[rama].includes(etapaValida)) {
                etapaValida = ETAPAS_POR_RAMA[rama] ? ETAPAS_POR_RAMA[rama][0] : null;
            }
            return etapaValida;
        }

        // ==================== FUNCIÓN DE IMPRESIÓN ESTRUCTURADA ====================
        function exportarPDFEstructurado() {
            const data = window.reportData;
            
            // Construimos las filas de las tablas
            const filasGenerales = data.finanzas.cuentasGenerales.map(c => `<tr><td>${c.nombre}</td><td style="text-align:right; font-weight:bold; color:${c.saldo < 0 ? '#b91c1c' : '#0E2586'}">${currency.format(c.saldo)}</td></tr>`).join('');
            const filasUnidades = data.finanzas.cuentasUnidades.map(c => {
                const rama = extraerRama(c.nombre);
                const logo = LOGOS_RAMAS[rama] ? `<img src="${LOGOS_RAMAS[rama]}" style="width:16px; height:16px; vertical-align:middle; margin-right:8px;">` : '';
                return `<tr><td>${logo}${c.nombre}</td><td style="text-align:right; font-weight:bold; color:${c.saldo < 0 ? '#b91c1c' : '#0E2586'}">${currency.format(c.saldo)}</td></tr>`;
            }).join('');
            
            const filasCenso = data.jovenes.censoUnidades.map(u => {
                const logo = LOGOS_RAMAS[u.nombre] ? `<img src="${LOGOS_RAMAS[u.nombre]}" style="width:20px; height:20px; vertical-align:middle; margin-right:8px;">` : '';
                return `<tr>
                    <td style="font-weight:bold;">${logo}${u.nombre}</td>
                    <td style="text-align:center;">${u.censo}</td>
                    <td style="text-align:center; color:#64748b;">${u.ideal}</td>
                    <td style="text-align:center; font-weight:bold; color:${u.censo < u.ideal * 0.6 ? '#b91c1c' : '#059669'}">${Math.round((u.censo/u.ideal)*100)}%</td>
                </tr>`;
            }).join('');

            const htmlInforme = `
                <!-- Encabezado -->
                <div style="border-bottom: 3px solid #0E2586; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <h1 style="margin:0; font-size: 24pt; color: #0E2586; font-weight: 900;">Informe de Gestión Consolidado</h1>
                        <p style="margin:0; font-size: 12pt; color: #64748B; font-weight: bold;">ERP Scout - Grupo Guías y Scouts</p>
                    </div>
                    <div style="text-align: right; color: #64748B; font-size: 10pt;">
                        Generado el: ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </div>

                <!-- SECCIÓN 1: KPIs GLOBALES -->
                <h2 style="font-size: 14pt; color: #1E293B; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px;">1. Resumen Global</h2>
                <div style="display: flex; gap: 20px; margin-bottom: 30px;" class="avoid-break">
                    <div style="flex: 1; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 10pt; color: #64748B; font-weight: bold; text-transform: uppercase;">Total Jóvenes</div>
                        <div style="font-size: 24pt; color: #2563eb; font-weight: 900;">${data.kpi.jovenes}</div>
                    </div>
                    <div style="flex: 1; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 10pt; color: #64748B; font-weight: bold; text-transform: uppercase;">Total Adultos</div>
                        <div style="font-size: 24pt; color: #059669; font-weight: 900;">${data.kpi.adultos}</div>
                    </div>
                    <div style="flex: 1; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 10pt; color: #64748B; font-weight: bold; text-transform: uppercase;">Cuentas Activas</div>
                        <div style="font-size: 24pt; color: #d97706; font-weight: 900;">${data.kpi.cuentas}</div>
                    </div>
                    <div style="flex: 1; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 10pt; color: #64748B; font-weight: bold; text-transform: uppercase;">Saldo Consolidado</div>
                        <div style="font-size: 20pt; color: #7c3aed; font-weight: 900;">${currency.format(data.kpi.saldoTotal)}</div>
                    </div>
                </div>

                <!-- SECCIÓN 2: JÓVENES -->
                <div class="avoid-break">
                    <h2 style="font-size: 14pt; color: #1E293B; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px;">2. Censo de Jóvenes por Unidad</h2>
                    <table>
                        <thead><tr><th>Unidad</th><th style="text-align:center;">Censo Real</th><th style="text-align:center;">Censo Ideal</th><th style="text-align:center;">Cumplimiento</th></tr></thead>
                        <tbody>${filasCenso}</tbody>
                    </table>
                </div>

                <!-- SECCIÓN 3: FINANZAS -->
                <div class="avoid-break" style="margin-top: 30px;">
                    <h2 style="font-size: 14pt; color: #1E293B; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px;">3. Estado Financiero</h2>
                    <div style="display: flex; gap: 20px;">
                        <div style="flex: 1;">
                            <h3 style="font-size: 11pt; color: #475569; margin-bottom: 10px;">Cuentas Generales</h3>
                            <table>
                                <thead><tr><th>Nombre de Cuenta</th><th style="text-align:right;">Saldo Actual</th></tr></thead>
                                <tbody>${filasGenerales || '<tr><td colspan="2" style="text-align:center;">Sin datos</td></tr>'}</tbody>
                                <tfoot><tr><td style="font-weight:bold; background:#f8fafc;">SUBTOTAL</td><td style="text-align:right; font-weight:bold; background:#f8fafc; color:#059669;">${currency.format(data.finanzas.totalGeneral)}</td></tr></tfoot>
                            </table>
                        </div>
                        <div style="flex: 1;">
                            <h3 style="font-size: 11pt; color: #475569; margin-bottom: 10px;">Cuentas por Unidad</h3>
                            <table>
                                <thead><tr><th>Unidad</th><th style="text-align:right;">Saldo Actual</th></tr></thead>
                                <tbody>${filasUnidades || '<tr><td colspan="2" style="text-align:center;">Sin datos</td></tr>'}</tbody>
                                <tfoot><tr><td style="font-weight:bold; background:#f8fafc;">SUBTOTAL</td><td style="text-align:right; font-weight:bold; background:#f8fafc; color:#4f46e5;">${currency.format(data.finanzas.totalUnidades)}</td></tr></tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- SECCIÓN 4: CUMPLIMIENTO ADULTOS -->
                <div class="avoid-break" style="margin-top: 30px;">
                    <h2 style="font-size: 14pt; color: #1E293B; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px;">4. Compromisos de Adultos Voluntarios</h2>
                    <p style="font-size: 11pt;">De un total de <strong>${data.adultos.total}</strong> adultos registrados, <strong>${data.adultos.firmados}</strong> tienen su compromiso vigente al día (${Math.round((data.adultos.firmados/data.adultos.total)*100)}%).</p>
                    ${data.adultos.sinCompromiso.length > 0 ? `
                        <h3 style="font-size: 11pt; color: #b91c1c; margin-bottom: 10px; margin-top:15px;">Atención: Dirigentes sin compromiso registrado</h3>
                        <ul style="column-count: 2; font-size: 10pt; color: #475569; padding-left: 20px;">
                            ${data.adultos.sinCompromiso.map(a => `<li>${a.nombre} <span style="font-size:8pt; color:#94a3b8;">(${a.cargo})</span></li>`).join('')}
                        </ul>
                    ` : '<p style="color:#059669; font-weight:bold;">¡Excelente! Todos los adultos tienen su compromiso al día.</p>'}
                </div>
            `;

            document.getElementById('print-report').innerHTML = htmlInforme;
            
            // Invocar el cuadro de diálogo de impresión del navegador
            setTimeout(() => { window.print(); }, 500);
        }

