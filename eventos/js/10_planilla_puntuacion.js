    function renderPlanilla() {
        const contenedor = document.getElementById('planilla-contenedor');
        if (!contenedor) return;
        contenedor.innerHTML = '';
        if (postasData.length === 0) { contenedor.innerHTML = '<p>No hay postas creadas.</p>'; return; }
        if (jovenes.length === 0) { contenedor.innerHTML = '<p>No hay patrullas registradas.</p>'; return; }

        postasData.forEach((posta) => {
            const divPosta = document.createElement('div');
            divPosta.className = 'posta-planilla';
            divPosta.innerHTML = `<h3>Posta ${posta.numero}: ${posta.nombre}</h3>`;
            const tabla = document.createElement('table');
            tabla.className = 'planilla-tabla';
            let header = '<thead><tr><th>Patrulla</th><th>Grupo</th>';
            if (posta.tipo === 'tiempo') {
                header += '<th>Minutos</th><th>Segundos</th><th>Puntos</th>';
            } else {
                if (posta.criterios && posta.criterios.length > 0) {
                    posta.criterios.forEach((c, cIdx) => { header += `<th>${c.desc || 'Criterio ' + (cIdx+1)}</th>`; });
                } else {
                    header += '<th>Puntaje</th>';
                }
            }
            header += '</tr></thead><tbody>';
            jovenes.forEach(joven => {
                header += `<tr><td>${joven.nombre_patrulla}</td><td>${joven.grupo_scout}</td>`;
                if (!planillaData[joven.id]) planillaData[joven.id] = {};
                if (!planillaData[joven.id][posta.id]) planillaData[joven.id][posta.id] = [];
                
                if (posta.tipo === 'tiempo') {
                    let min = planillaData[joven.id][posta.id][0]?.min || '';
                    let seg = planillaData[joven.id][posta.id][0]?.seg || '';
                    if (typeof planillaData[joven.id][posta.id][0] === 'string') {
                        const parts = planillaData[joven.id][posta.id][0].split(':');
                        min = parts[0] || '';
                        seg = parts[1] || '';
                    }
                    header += `<td><input type="number" min="0" value="${min}" onchange="actPlanillaTiempo('${joven.id}', '${posta.id}', 'min', this.value)"></td>`;
                    header += `<td><input type="number" min="0" max="59" value="${seg}" onchange="actPlanillaTiempo('${joven.id}', '${posta.id}', 'seg', this.value)"></td>`;
                    let puntos = '';
                    if (min !== '' && seg !== '') { const segundos = parseInt(min)*60 + parseInt(seg); puntos = Math.max(1, 20 - Math.floor(segundos / 10)); }
                    header += `<td><strong>${puntos}</strong></td>`;
                } else {
                    if (posta.criterios && posta.criterios.length > 0) {
                        let totalPts = 0;
                        posta.criterios.forEach((c, cIdx) => {
                            const valor = planillaData[joven.id][posta.id][cIdx] || '';
                            header += `<td><input type="number" step="0.01" value="${valor}" onchange="actPlanilla('${joven.id}', '${posta.id}', '${cIdx}', this.value)"></td>`;
                            totalPts += parseFloat(valor) || 0;
                        });
                        header += `<td><strong>${totalPts.toFixed(2)}</strong></td>`;
                    } else {
                        const valor = planillaData[joven.id][posta.id][0] || '';
                        header += `<td><input type="number" step="0.01" value="${valor}" onchange="actPlanilla('${joven.id}', '${posta.id}', '0', this.value)"></td>`;
                    }
                }
                header += `</tr>`;
            });
            header += '</tbody>';
            tabla.innerHTML = header;
            divPosta.appendChild(tabla);
            contenedor.appendChild(divPosta);
        });
    }

    window.actPlanilla = async function(jovenId, postaId, idx, valor) {
        if (!planillaData[jovenId]) planillaData[jovenId] = {};
        if (!planillaData[jovenId][postaId]) planillaData[jovenId][postaId] = [];
        planillaData[jovenId][postaId][idx] = valor;
        await supabaseClient.from('planilla_data').upsert({
            evento_id: eventoActual.id,
            patrulla_id: jovenId,
            posta_id: postaId,
            criterio_idx: parseInt(idx),
            valor: valor.toString()
        }, { onConflict: 'evento_id, patrulla_id, posta_id, criterio_idx' });
        renderPlanilla();
        renderPuntuacion();
    }

    window.actPlanillaTiempo = async function(jovenId, postaId, campo, valor) {
        if (!planillaData[jovenId]) planillaData[jovenId] = {};
        if (!planillaData[jovenId][postaId]) planillaData[jovenId][postaId] = [];
        let current = planillaData[jovenId][postaId][0] || {};
        if (typeof current === 'string') {
            const parts = current.split(':');
            current = { min: parts[0] || '', seg: parts[1] || '' };
        }
        current[campo] = valor;
        const valorStr = `${current.min}:${current.seg}`;
        planillaData[jovenId][postaId][0] = current;
        await supabaseClient.from('planilla_data').upsert({
            evento_id: eventoActual.id,
            patrulla_id: jovenId,
            posta_id: postaId,
            criterio_idx: 0,
            valor: valorStr
        }, { onConflict: 'evento_id, patrulla_id, posta_id, criterio_idx' });
        renderPlanilla();
        renderPuntuacion();
    }

    window.guardarPlanilla = function() { customAlert('Los cambios se guardan automáticamente en la base de datos.'); }
    
    // ========== IMPRESIÓN PLANILLAS POR POSTA EN HORIZONTAL ==========
    window.imprimirPlanillasDivididas = function() {
        if (postasData.length === 0) {
            customAlert("No hay postas creadas.");
            return;
        }
        if (jovenes.length === 0) {
            customAlert("No hay patrullas registradas.");
            return;
        }

        const evtTitulo = document.getElementById('evento-titulo').value || 'Evento Scout';
        const fecha = document.getElementById('evento-fecha').value || '';

        let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Planillas de Puntuación - ${evtTitulo}</title>
            <style>
                @page {
                    size: landscape;
                    margin: 1.5cm;
                }
                body {
                    font-family: 'Poppins', 'Segoe UI', Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background: white;
                    color: #000;
                }
                .planilla-page {
                    page-break-after: always;
                    margin-bottom: 20px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #0E2586;
                    padding-bottom: 10px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 18pt;
                    color: #0E2586;
                }
                .header h2 {
                    margin: 5px 0 0;
                    font-size: 14pt;
                    font-weight: normal;
                }
                .posta-title {
                    font-size: 16pt;
                    font-weight: bold;
                    margin: 20px 0 15px;
                    color: #0E2586;
                    border-left: 5px solid #F80202;
                    padding-left: 15px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    font-size: 11pt;
                }
                th, td {
                    border: 1px solid #ccc;
                    padding: 8px 6px;
                    text-align: center;
                    vertical-align: middle;
                }
                th {
                    background-color: #f2f2f2;
                    font-weight: bold;
                }
                .patrulla-col {
                    text-align: left;
                    background-color: #fafafa;
                }
                .footer {
                    font-size: 9pt;
                    text-align: center;
                    margin-top: 20px;
                    color: #666;
                }
            </style>
        </head>
        <body>
        `;

        postasData.forEach((posta, idx) => {
            html += `
            <div class="planilla-page">
                <div class="header">
                    <h1>${evtTitulo}</h1>
                    <h2>Planilla de Puntuación - Posta ${posta.numero}: ${posta.nombre}</h2>
                    ${fecha ? `<p>Fecha: ${fecha}</p>` : ''}
                </div>
                <div class="posta-title">
                    Posta ${posta.numero}: ${posta.nombre}
                    ${posta.tipo === 'tiempo' ? ' (Por tiempo)' : ' (Por puntos)'}
                </div>
            `;

            let tableHtml = '<table><thead><tr>';
            tableHtml += '<th>#</th><th>Patrulla / Registro</th><th>Grupo Scout</th>';
            
            if (posta.tipo === 'tiempo') {
                tableHtml += '<th>Minutos</th><th>Segundos</th><th>Puntos Obtenidos</th>';
            } else {
                if (posta.criterios && posta.criterios.length > 0) {
                    posta.criterios.forEach(c => {
                        tableHtml += `<th>${c.desc || 'Criterio'}</th>`;
                    });
                    tableHtml += '<th>Total</th>';
                } else {
                    tableHtml += '<th>Puntaje</th>';
                }
            }
            tableHtml += '</tr></thead><tbody>';

            jovenes.forEach((joven, idxRow) => {
                tableHtml += `<tr>
                    <td style="text-align:center;">${idxRow + 1}</td>
                    <td class="patrulla-col">${joven.nombre_patrulla || 'Sin nombre'}</td>
                    <td class="patrulla-col">${joven.grupo_scout || '-'}</td>`;

                if (posta.tipo === 'tiempo') {
                    let tiempo = planillaData[joven.id]?.[posta.id]?.[0];
                    let min = '', seg = '';
                    if (tiempo) {
                        if (typeof tiempo === 'object') {
                            min = tiempo.min || '';
                            seg = tiempo.seg || '';
                        } else if (typeof tiempo === 'string' && tiempo.includes(':')) {
                            [min, seg] = tiempo.split(':');
                        }
                    }
                    tableHtml += `<td style="text-align:center;">${min || ''}</td>
                                  <td style="text-align:center;">${seg || ''}</td>
                                  <td style="text-align:center;">&nbsp;</td>`;
                } else {
                    if (posta.criterios && posta.criterios.length > 0) {
                        let totalPts = 0;
                        for (let i = 0; i < posta.criterios.length; i++) {
                            let val = planillaData[joven.id]?.[posta.id]?.[i] || '';
                            tableHtml += `<td style="text-align:center;">${val}</td>`;
                            totalPts += parseFloat(val) || 0;
                        }
                        tableHtml += `<td style="text-align:center; font-weight:bold;">${totalPts.toFixed(2)}</td>`;
                    } else {
                        let val = planillaData[joven.id]?.[posta.id]?.[0] || '';
                        tableHtml += `<td style="text-align:center;">${val}</td>`;
                    }
                }
                tableHtml += `</tr>`;
            });

            tableHtml += '</tbody></table>';
            html += tableHtml;
            html += `<div class="footer">Generado por Sistema ERP Scout - Firma del Encargado: _________________________</div>`;
            html += `</div>`; // cierra planilla-page
        });

        html += `</body></html>`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    // ========== PUNTUACIÓN (Resumen) ==========
    function renderPuntuacion() {
        const thead = document.querySelector('#puntuacion-table thead tr');
        const tbody = document.getElementById('puntuacion-body');
        
        let headerRow = '<th>#</th><th>Registro</th><th>Grupo</th>';
        postasData.forEach(p => {
            if (p.tipo === 'tiempo') {
                headerRow += `<th>${p.nombre}<br>(min:seg)</th>`;
            } else {
                headerRow += `<th>${p.nombre}</th>`;
            }
        });
        headerRow += '<th style="background:var(--azul-profundo); color:white;">Total General</th>';
        thead.innerHTML = headerRow;

        tbody.innerHTML = '';
        jovenes.forEach((joven, index) => {
            let cells = `<td style="background:var(--gris-fondo); text-align:center;">${index+1}</td><td><strong>${joven.nombre_patrulla}</strong></td><td>${joven.grupo_scout}</td>`;
            let total = 0;
            postasData.forEach((posta) => {
                let pData = puntuaciones[joven.id]?.[posta.id];
                if (posta.tipo === 'tiempo') {
                    let min = '', seg = '';
                    if (pData && typeof pData === 'string' && pData.includes(':')) {
                        [min, seg] = pData.split(':');
                    } else if (pData && typeof pData === 'object') {
                        min = pData.min || '';
                        seg = pData.seg || '';
                    }
                    let timeStr = (min!==''&&seg!=='') ? `${min}:${seg}` : '-';
                    cells += `<td style="text-align:center;">${timeStr}</td>`;
                    if (min !== '' && seg !== '') {
                        const segundos = parseInt(min)*60 + parseInt(seg);
                        total += Math.max(1, 20 - Math.floor(segundos / 10));
                    }
                } else {
                    let ptsPosta = 0;
                    if (posta.criterios && posta.criterios.length > 0) {
                        let planillaPosta = planillaData[joven.id]?.[posta.id] || [];
                        for (let i=0; i<posta.criterios.length; i++) {
                            ptsPosta += parseFloat(planillaPosta[i]) || 0;
                        }
                    } else {
                        ptsPosta = parseFloat(pData) || 0;
                    }
                    cells += `<td style="text-align:center;">${ptsPosta}</td>`;
                    total += ptsPosta;
                }
            });
            cells += `<td style="font-weight:900; font-size:16px; text-align:center; background:var(--gris-fondo); color:var(--azul-profundo);">${total}</td>`;
            const row = document.createElement('tr');
            row.innerHTML = cells;
            tbody.appendChild(row);
        });
    }

    // ========== POSTAS ==========
