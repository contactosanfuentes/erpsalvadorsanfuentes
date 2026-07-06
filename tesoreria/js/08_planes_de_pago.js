        function renderPlanesPago() { let html = `<div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"><h3 class="text-xl font-bold mb-6">Planes de Pago</h3><button onclick="abrirModalPlanPago()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold mb-4">+ Nuevo Plan</button><div id="listaPlanes"></div></div>`; document.getElementById('tesoreriaContent').innerHTML = html; cargarListaPlanes(); }
        async function cargarListaPlanes() { 
            const { data: planes, error } = await supabaseClient.from('planes_pago').select('*').order('created_at', { ascending: false });
            if (error) { showToast('Error cargando planes: ' + error.message, 'error'); return; }
            let html = '<table class="w-full text-left"><thead><th>Responsable</th><th>Monto</th><th>Cuotas</th><th>Estado</th><th>Acciones</th></thead><tbody>';
            (planes || []).forEach(p => { html += `<tr><td>${p.nombre_responsable}<\/td><td>${currencyFormatter.format(p.monto_total)}<\/td><td>${p.numero_cuotas}<\/td><td>${p.estado}<\/td><td><button onclick="verPlan('${p.id}')" class="text-indigo-600">Ver</button><\/td><\/tr>`; });
            html += '</tbody><\/table>';
            document.getElementById('listaPlanes').innerHTML = html || '<p class="text-slate-400">No hay planes.</p>';
        }

        async function buscarPersonaPlan(rut) {
            if (rut.length < 3) return;
            const resultsDiv = document.getElementById('planSearchResults');
            resultsDiv.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Buscando...';
            try {
                const [mmbb, adultos] = await Promise.all([
                    supabaseClient.from('mmbb_registrations').select('run, nombres, apellidos, email, telefono, domicilio').ilike('run', `%${rut}%`),
                    supabaseClient.from('adultos_registros').select('run, nombres, apellidos, email, telefono, domicilio').ilike('run', `%${rut}%`)
                ]);
                let html = '';
                mmbb.data?.forEach(p => { html += `<div class="p-1 hover:bg-indigo-50 cursor-pointer" onclick="seleccionarPersonaPlan('${p.run}', '${p.nombres} ${p.apellidos}', '${p.email || ''}', '${p.telefono || ''}', '${p.domicilio || ''}')">${p.nombres} ${p.apellidos} (MMBB)</div>`; });
                adultos.data?.forEach(p => { html += `<div class="p-1 hover:bg-indigo-50 cursor-pointer" onclick="seleccionarPersonaPlan('${p.run}', '${p.nombres} ${p.apellidos}', '${p.email || ''}', '${p.telefono || ''}', '${p.domicilio || ''}')">${p.nombres} ${p.apellidos} (Adulto)</div>`; });
                resultsDiv.innerHTML = html || 'No se encontraron resultados.';
            } catch (err) { resultsDiv.innerHTML = 'Error en búsqueda.'; }
        }
        window.seleccionarPersonaPlan = function(run, nombre, email, telefono, direccion) {
            document.getElementById('planRunResp').value = run;
            document.getElementById('planNombreResp').value = nombre;
            if (email) document.getElementById('planEmailResp').value = email;
            if (telefono) document.getElementById('planTelefonoResp').value = telefono;
            if (direccion) document.getElementById('planDireccionResp').value = direccion;
            document.getElementById('planSearchResults').innerHTML = '';
            showToast(`Persona seleccionada: ${nombre}`, 'success');
        };

        function abrirModalPlanPago() { 
            document.getElementById('modalPlanPago').classList.remove('hidden'); 
            document.getElementById('planFechaInicio').value = new Date().toISOString().split('T')[0]; 
            firmaTesoreroData = { hasSignature: false }; 
            firmaResponsableData = { hasSignature: false }; 
            document.getElementById('cuotasContainer').style.display = 'none'; 
            setTimeout(() => { 
                if (document.getElementById('firmaTesoreroCanvas') && document.getElementById('firmaResponsableCanvas')) {
                    initSignatureCanvas('firmaTesoreroCanvas', 'firmaTesoreroPlaceholder', 'clearFirmaTesorero', 'saveFirmaTesorero', 'firmaTesoreroPreview', 'firmaTesoreroImage', 'firmaTesoreroTimestamp', (data) => firmaTesoreroData = data);
                    initSignatureCanvas('firmaResponsableCanvas', 'firmaResponsablePlaceholder', 'clearFirmaResponsable', 'saveFirmaResponsable', 'firmaResponsablePreview', 'firmaResponsableImage', 'firmaResponsableTimestamp', (data) => firmaResponsableData = data);
                } else {
                    console.warn('Canvas de firmas no encontrados, reintentando...');
                    setTimeout(() => {
                        initSignatureCanvas('firmaTesoreroCanvas', 'firmaTesoreroPlaceholder', 'clearFirmaTesorero', 'saveFirmaTesorero', 'firmaTesoreroPreview', 'firmaTesoreroImage', 'firmaTesoreroTimestamp', (data) => firmaTesoreroData = data);
                        initSignatureCanvas('firmaResponsableCanvas', 'firmaResponsablePlaceholder', 'clearFirmaResponsable', 'saveFirmaResponsable', 'firmaResponsablePreview', 'firmaResponsableImage', 'firmaResponsableTimestamp', (data) => firmaResponsableData = data);
                    }, 200);
                }
            }, 150); 
        }
        function cerrarModalPlanPago() { document.getElementById('modalPlanPago').classList.add('hidden'); }

        function generarTablaCuotas() {
            const numCuotas = parseInt(document.getElementById('planNumCuotas').value);
            const montoTotal = parseFloat(document.getElementById('planMontoTotal').value);
            const fechaInicio = document.getElementById('planFechaInicio').value;
            const periodo = document.getElementById('planPeriodo').value;
            if (isNaN(numCuotas) || numCuotas <= 0 || isNaN(montoTotal) || montoTotal <= 0 || !fechaInicio) {
                document.getElementById('cuotasContainer').style.display = 'none';
                return;
            }
            const montoBase = montoTotal / numCuotas;
            let html = '';
            for (let i = 1; i <= numCuotas; i++) {
                let fecha = new Date(fechaInicio);
                if (periodo === 'mensual') fecha.setMonth(fecha.getMonth() + i - 1);
                else if (periodo === 'quincenal') fecha.setDate(fecha.getDate() + 15 * (i - 1));
                else if (periodo === 'semanal') fecha.setDate(fecha.getDate() + 7 * (i - 1));
                const fechaStr = fecha.toISOString().split('T')[0];
                html += `<tr>
                            <td class="px-4 py-2 text-center">${i}<\/td>
                            <td class="px-4 py-2"><input type="number" class="cuota-monto w-full px-2 py-1 border rounded" value="${montoBase.toFixed(0)}" onchange="actualizarResumenCuotas()"><\/td>
                            <td class="px-4 py-2"><input type="date" class="cuota-fecha w-full px-2 py-1 border rounded" value="${fechaStr}"><\/td>
                            <td class="px-4 py-2 text-center"><button onclick="eliminarFilaCuota(this)" class="text-rose-600"><i class="fas fa-trash"></i><\/button><\/td>
                           <\/tr>`;
            }
            document.getElementById('cuotasList').innerHTML = html;
            document.getElementById('cuotasContainer').style.display = 'block';
            cambiarTipoCuota();
            actualizarResumenCuotas();
        }
        function eliminarFilaCuota(btn) { if (confirm('¿Eliminar esta cuota?')) { const row = btn.closest('tr'); row.remove(); const rows = document.querySelectorAll('#cuotasList tr'); rows.forEach((row, index) => { row.cells[0].innerText = index + 1; }); actualizarResumenCuotas(); } }
        function actualizarResumenCuotas() {
            const montos = Array.from(document.querySelectorAll('.cuota-monto')).map(input => parseFloat(input.value) || 0);
            const total = montos.reduce((a, b) => a + b, 0);
            const promedio = montos.length ? total / montos.length : 0;
            document.getElementById('resumenTotal').innerText = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(total);
            document.getElementById('resumenPromedio').innerText = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(promedio);
        }
        function cambiarTipoCuota() {
            const tipo = document.getElementById('planTipoCuota').value;
            const inputs = document.querySelectorAll('.cuota-monto');
            if (tipo === 'fija') {
                const montoTotal = parseFloat(document.getElementById('planMontoTotal').value) || 0;
                const numCuotas = parseInt(document.getElementById('planNumCuotas').value) || 1;
                const montoFijo = montoTotal / numCuotas;
                inputs.forEach(input => {
                    input.value = montoFijo.toFixed(0);
                    input.readOnly = true;
                    input.classList.add('bg-slate-100');
                });
                actualizarResumenCuotas();
            } else {
                inputs.forEach(input => {
                    input.readOnly = false;
                    input.classList.remove('bg-slate-100');
                });
                actualizarResumenCuotas();
            }
        }
        function recalcularCuotasPorMontoTotal() {
            const tipo = document.getElementById('planTipoCuota').value;
            if (tipo === 'fija') {
                generarTablaCuotas();
            } else {
                actualizarResumenCuotas();
            }
        }

        function initSignatureCanvas(canvasId, placeholderId, clearBtnId, saveBtnId, previewId, imageId, timestampId, callback) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn(`Canvas ${canvasId} no encontrado`);
                return;
            }
            const placeholder = document.getElementById(placeholderId);
            const preview = document.getElementById(previewId);
            const image = document.getElementById(imageId);
            const timestamp = document.getElementById(timestampId);
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#1E293B';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            let drawing = false, lastX = 0, lastY = 0;
            function getCoords(e) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height;
                let clientX, clientY;
                if (e.touches) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
                else { clientX = e.clientX; clientY = e.clientY; }
                return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
            }
            function startDrawing(e) {
                e.preventDefault();
                drawing = true;
                const coords = getCoords(e);
                lastX = coords.x;
                lastY = coords.y;
                placeholder.style.display = 'none';
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
            }
            function draw(e) {
                if (!drawing) return;
                e.preventDefault();
                const coords = getCoords(e);
                ctx.lineTo(coords.x, coords.y);
                ctx.stroke();
                lastX = coords.x;
                lastY = coords.y;
            }
            function stopDrawing(e) {
                e.preventDefault();
                drawing = false;
            }
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('mouseout', stopDrawing);
            canvas.addEventListener('touchstart', startDrawing, { passive: false });
            canvas.addEventListener('touchmove', draw, { passive: false });
            canvas.addEventListener('touchend', stopDrawing);
            canvas.addEventListener('touchcancel', stopDrawing);
            canvas.addEventListener('contextmenu', (e) => e.preventDefault());
            document.getElementById(clearBtnId).addEventListener('click', function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                placeholder.style.display = 'block';
                preview.classList.remove('active');
                callback({ hasSignature: false });
            });
            document.getElementById(saveBtnId).addEventListener('click', function() {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const hasDrawing = Array.from(imageData.data).some(val => val !== 0);
                if (!hasDrawing) { alert('Por favor, realice su firma antes de guardar.'); return; }
                const compressedCanvas = document.createElement('canvas');
                const maxWidth = 400;
                const scale = Math.min(1, maxWidth / canvas.width);
                compressedCanvas.width = canvas.width * scale;
                compressedCanvas.height = canvas.height * scale;
                compressedCanvas.getContext('2d').drawImage(canvas, 0, 0, compressedCanvas.width, compressedCanvas.height);
                const compressedUrl = compressedCanvas.toDataURL('image/jpeg', 0.5);
                const data = { hasSignature: true, image: compressedUrl, timestamp: new Date().toLocaleString('es-CL') };
                image.src = compressedUrl;
                timestamp.textContent = `Firmado: ${data.timestamp}`;
                preview.classList.add('active');
                callback(data);
            });
        }

        async function guardarPlanPago() {
            const runResp = document.getElementById('planRunResp').value.trim();
            const nombreResp = document.getElementById('planNombreResp').value.trim();
            const emailResp = document.getElementById('planEmailResp').value.trim();
            const telefonoResp = document.getElementById('planTelefonoResp').value.trim();
            const direccionResp = document.getElementById('planDireccionResp').value.trim();
            const runTes = document.getElementById('planRunTes').value.trim();
            const nombreTes = document.getElementById('planNombreTes').value.trim();
            const observaciones = document.getElementById('planObservaciones').value.trim();
            const montoTotal = parseFloat(document.getElementById('planMontoTotal').value);
            const numCuotas = parseInt(document.getElementById('planNumCuotas').value);
            const fechaInicio = document.getElementById('planFechaInicio').value;
            const fechaFin = document.getElementById('planFechaFin').value;

            if (!runResp || !nombreResp || !emailResp || !runTes || !nombreTes || isNaN(montoTotal) || isNaN(numCuotas) || !fechaInicio || !fechaFin) {
                alert('Complete todos los campos obligatorios (*).');
                return;
            }
            if (!firmaTesoreroData.hasSignature || !firmaResponsableData.hasSignature) {
                alert('Ambas firmas son requeridas.');
                return;
            }

            const btn = document.querySelector('#modalPlanPago .bg-indigo-600');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Guardando...';

            try {
                const uploadFirma = async (dataUrl, prefix) => {
                    const blob = await (await fetch(dataUrl)).blob();
                    const fileName = `${prefix}_${Date.now()}.jpg`;
                    await supabaseClient.storage.from(PAYMENT_BUCKET).upload(fileName, blob, { contentType: 'image/jpeg' });
                    return supabaseClient.storage.from(PAYMENT_BUCKET).getPublicUrl(fileName).data.publicUrl;
                };
                const firmaTesUrl = await uploadFirma(firmaTesoreroData.image, 'firma_tesorero');
                const firmaRespUrl = await uploadFirma(firmaResponsableData.image, 'firma_responsable');

                const cuotaMontos = Array.from(document.querySelectorAll('.cuota-monto')).map(input => parseFloat(input.value) || 0);
                const cuotaFechas = Array.from(document.querySelectorAll('.cuota-fecha')).map(input => input.value);

                const logoUrl = 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/11u9rUD.png';
                const fechaActual = new Date().toLocaleString('es-CL');
                const documentoHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Plan de Pagos</title><style>body{font-family:Arial;padding:20px;} .header{text-align:center;margin-bottom:20px;} .compromiso{background:#f0f7ff;padding:15px;border-left:4px solid #1E3A8A;margin:20px 0;} table{border-collapse:collapse;width:100%;margin:10px 0;} th,td{border:1px solid #ccc;padding:8px;text-align:left;}</style></head><body><div class="header"><img src="${logoUrl}" style="height:80px;"><br><h2>Grupo Guía y Scouts Salvador Sanfuentes</h2></div><h3>Plan de Pagos</h3><p><strong>Responsable:</strong> ${nombreResp} (RUN: ${runResp})</p><p><strong>Email:</strong> ${emailResp}</p><p><strong>Teléfono:</strong> ${telefonoResp || 'No informado'}</p><p><strong>Dirección:</strong> ${direccionResp || 'No informada'}</p><p><strong>Tesorero:</strong> ${nombreTes} (RUN: ${runTes})</p><p><strong>Monto Total:</strong> $${montoTotal.toLocaleString('es-CL')}</p><p><strong>Número de Cuotas:</strong> ${numCuotas}</p><p><strong>Período:</strong> ${fechaInicio} al ${fechaFin}</p>${observaciones ? `<p><strong>Observaciones:</strong> ${observaciones}</p>` : ''}<h4>Detalle de Cuotas</h4><table border="1" cellpadding="5"> <th>N°</th><th>Monto</th><th>Vencimiento</th> ${cuotaMontos.map((m, i)=>`<tr><td>${i+1}<\/td><td>$${m.toLocaleString('es-CL')}<\/td><td>${cuotaFechas[i]}<\/td><\/tr>`).join('')}  <\/table><div class="compromiso"><strong>Declaración de compromiso:</strong> El responsable ${nombreResp} declara conocer y aceptar las condiciones del plan de pagos, comprometiéndose a cumplir con el pago de las cuotas en las fechas establecidas. El incumplimiento podrá derivar en la suspensión de beneficios o actividades, según lo estipulado en el reglamento interno del grupo.</div><h4>Firmas</h4><p>Tesorero: <img src="${firmaTesUrl}" style="max-width:200px; border:1px solid #ccc;"></p><p>Responsable: <img src="${firmaRespUrl}" style="max-width:200px; border:1px solid #ccc;"></p><p><em>Documento generado el ${fechaActual}</em></p></body></html>`;

                // Enviar correo con el plan de pagos
                await fetch('/.netlify/functions/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to_email: emailResp,
                        cc_email: CC_EMAILS,
                        subject: `Plan de Pagos — ${nombreResp}`,
                        html_content: documentoHTML
                    })
                });

                // Subir el plan de pagos a Google Drive (carpeta Administración/Planes de Pago)
                try {
                    // Renderizar el HTML a canvas y luego a PDF
                    const divTemp = document.createElement('div');
                    divTemp.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:white;padding:20px;';
                    divTemp.innerHTML = documentoHTML.replace(/<html[^>]*>|<\/html>|<head[^>]*>[\s\S]*?<\/head>|<body[^>]*>|<\/body>/gi, '');
                    document.body.appendChild(divTemp);
                    const canvas = await html2canvas(divTemp, { scale: 1.5, backgroundColor: '#ffffff' });
                    document.body.removeChild(divTemp);
                    const { jsPDF } = window.jspdf;
                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
                    const imgW = pdf.internal.pageSize.getWidth();
                    const imgH = (canvas.height * imgW) / canvas.width;
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH);
                    const pdfBase64 = pdf.output('datauristring').split(',')[1];
                    const nombreArchivo = `Plan_Pagos_${nombreResp.replace(/[^a-zA-Z0-9]/g,'_')}_${new Date().getFullYear()}.pdf`;
                    await window.DriveHelper.subir({
                        supabaseClient,
                        nombre: nombreArchivo,
                        base64: pdfBase64,
                        mimeType: 'application/pdf',
                        claveCarpeta: 'admin_planes_pago',
                        nombrePersona: nombreResp
                    });
                    console.log('✅ Plan de pagos subido a Drive');
                } catch(driveErr) {
                    console.warn('No se pudo subir a Drive:', driveErr.message);
                }

                const { data: planData, error: planError } = await supabaseClient
                    .from('planes_pago')
                    .insert({
                        run_responsable: runResp,
                        nombre_responsable: nombreResp,
                        email_responsable: emailResp,
                        telefono_responsable: telefonoResp || null,
                        direccion_responsable: direccionResp || null,
                        run_tesorero: runTes,
                        nombre_tesorero: nombreTes,
                        observaciones: observaciones || null,
                        monto_total: montoTotal,
                        numero_cuotas: numCuotas,
                        fecha_inicio: fechaInicio,
                        fecha_fin: fechaFin,
                        firma_tesorero_url: firmaTesUrl,
                        firma_responsable_url: firmaRespUrl,
                        estado: 'activo'
                    })
                    .select();
                if (planError) throw planError;

                if (planData && planData.length > 0) {
                    const planId = planData[0].id;
                    for (let i = 0; i < cuotaMontos.length; i++) {
                        await supabaseClient
                            .from('pagos_plan')
                            .insert({
                                plan_id: planId,
                                numero_cuota: i + 1,
                                monto: cuotaMontos[i],
                                fecha_vencimiento: cuotaFechas[i],
                                estado: 'pendiente'
                            });
                    }
                }

                showToast('Plan de pago guardado y correo enviado', 'success');
                cerrarModalPlanPago();
                if (currentTab === 'planes') cargarListaPlanes();
            } catch (error) {
                console.error('Error guardando plan:', error);
                showToast('Error: ' + error.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Guardar Plan y Enviar Correo';
            }
        }

        // ==================== DETALLE DEL PLAN ====================
        async function verPlan(planId) {
            currentPlanId = planId;
            try {
                const { data: plan, error: planError } = await supabaseClient.from('planes_pago').select('*').eq('id', planId).single();
                if (planError) throw planError;
                const { data: cuotas, error: cuotasError } = await supabaseClient.from('pagos_plan').select('*').eq('plan_id', planId).order('numero_cuota');
                if (cuotasError) throw cuotasError;

                const totalPagado = (cuotas || []).reduce((sum, c) => sum + (c.monto_pagado || 0), 0);
                const saldoPendiente = plan.monto_total - totalPagado;

                const infoDiv = document.getElementById('detallePlanInfo');
                infoDiv.innerHTML = `
                    <p><strong>Responsable:</strong> ${plan.nombre_responsable} (${plan.run_responsable})</p>
                    <p><strong>Email:</strong> ${plan.email_responsable}</p>
                    <p><strong>Teléfono:</strong> ${plan.telefono_responsable || 'No informado'}</p>
                    <p><strong>Dirección:</strong> ${plan.direccion_responsable || 'No informada'}</p>
                    <p><strong>Tesorero:</strong> ${plan.nombre_tesorero}</p>
                    <p><strong>Monto Total:</strong> ${currencyFormatter.format(plan.monto_total)}</p>
                    <p><strong>Total Pagado:</strong> ${currencyFormatter.format(totalPagado)}</p>
                    <p><strong>Saldo Pendiente:</strong> ${currencyFormatter.format(saldoPendiente)}</p>
                    <p><strong>Número de Cuotas:</strong> ${plan.numero_cuotas}</p>
                    <p><strong>Período:</strong> ${plan.fecha_inicio} al ${plan.fecha_fin}</p>
                    ${plan.observaciones ? `<p><strong>Observaciones:</strong> ${plan.observaciones}</p>` : ''}
                    <p><strong>Estado:</strong> ${plan.estado}</p>
                `;

                let cuotasHtml = '';
                if (!cuotas || cuotas.length === 0) {
                    cuotasHtml = '<p class="text-slate-500 text-center">No hay cuotas registradas para este plan.</p>';
                } else {
                    for (let c of cuotas) {
                        const montoPagado = c.monto_pagado || 0;
                        const saldoCuota = c.monto - montoPagado;
                        const estadoCuota = saldoCuota <= 0 ? 'pagado' : (montoPagado > 0 ? 'parcial' : 'pendiente');
                        const fechaPago = c.fecha_pago ? new Date(c.fecha_pago).toLocaleDateString('es-CL') : '-';
                        const comprobante = c.comprobante_url ? `<a href="${c.comprobante_url}" target="_blank" class="text-indigo-600"><i class="fas fa-file-pdf"></i> Ver</a>` : '-';
                        const diferencia = montoPagado - c.monto;
                        const diferenciaHtml = (estadoCuota === 'pagado' && Math.abs(diferencia) > 0) ? `<span class="ml-2 text-xs ${diferencia > 0 ? 'text-green-600' : 'text-red-600'}">(${diferencia > 0 ? `+${currencyFormatter.format(diferencia)}` : `${currencyFormatter.format(diferencia)}`} de diferencia)</span>` : '';
                        const acciones = (estadoCuota !== 'pagado') ? `<button onclick="abrirModalPagoCuota('${c.id}', ${c.monto}, ${c.numero_cuota})" class="ml-2 text-indigo-600 hover:underline"><i class="fas fa-dollar-sign"></i></button>` : '-';
                        cuotasHtml += `
                            <div class="p-3 border rounded-lg flex items-center justify-between">
                                <div>
                                    <span class="font-bold">Cuota ${c.numero_cuota}</span> - Vence: ${c.fecha_vencimiento} - Monto: ${currencyFormatter.format(c.monto)}${diferenciaHtml}
                                    ${estadoCuota === 'parcial' ? `<br><span class="text-xs text-slate-500">Pagado: ${currencyFormatter.format(montoPagado)} - Saldo pendiente: ${currencyFormatter.format(saldoCuota)}</span>` : ''}
                                </div>
                                <div>
                                    <span class="px-2 py-1 rounded-full text-xs ${estadoCuota === 'pagado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${estadoCuota}</span>
                                    ${acciones}
                                    ${comprobante !== '-' ? ` ${comprobante}` : ''}
                                    ${estadoCuota !== 'pendiente' ? `<span class="ml-2 text-xs text-slate-500">Pagado: ${currencyFormatter.format(montoPagado)} el ${fechaPago}</span>` : ''}
                                </div>
                            </div>
                        `;
                    }
                }
                document.getElementById('detalleCuotas').innerHTML = cuotasHtml;
                document.getElementById('modalVerPlan').classList.remove('hidden');
            } catch (error) {
                console.error('Error al cargar plan:', error);
                showToast('Error al cargar el plan: ' + error.message, 'error');
                document.getElementById('detallePlanInfo').innerHTML = `<p class="text-red-600">Error: ${error.message}</p>`;
            }
        }

        function cerrarModalVerPlan() { document.getElementById('modalVerPlan').classList.add('hidden'); }
        function handlePagoCuotaFile(input) { const file = input.files[0]; if (!file) { document.getElementById('pagoCuotaFileLabel').innerHTML = 'Seleccionar archivo'; pagoCuotaFileData = null; return; } document.getElementById('pagoCuotaFileLabel').innerHTML = file.name; pagoCuotaFileData = file; }
        function abrirModalPagoCuota(cuotaId, montoCuota, numeroCuota) {
            currentCuotaId = cuotaId;
            document.getElementById('pagoCuotaInfo').innerText = `Cuota N° ${numeroCuota} - Monto: ${currencyFormatter.format(montoCuota)}`;
            document.getElementById('pagoCuotaMonto').value = '';
            document.getElementById('pagoCuotaFileLabel').innerHTML = 'Seleccionar archivo';
            document.getElementById('pagoCuotaFile').value = '';
            pagoCuotaFileData = null;
            document.getElementById('modalPagoCuota').classList.remove('hidden');
        }
        function cerrarModalPagoCuota() { document.getElementById('modalPagoCuota').classList.add('hidden'); }
        async function guardarPagoCuota() {
            const monto = parseFloat(document.getElementById('pagoCuotaMonto').value);
            if (isNaN(monto) || monto <= 0) { alert('Ingrese un monto válido'); return; }

            const { data: cuota, error: cuotaError } = await supabaseClient.from('pagos_plan').select('*').eq('id', currentCuotaId).single();
            if (cuotaError) { showToast('Error al obtener la cuota', 'error'); return; }

            const montoPagadoActual = cuota.monto_pagado || 0;
            const nuevoMontoPagado = montoPagadoActual + monto;
            let estado = 'pendiente';
            let mensaje = '';
            if (nuevoMontoPagado >= cuota.monto) {
                estado = 'pagado';
                mensaje = `Se ha completado el pago de la cuota. Monto total pagado: ${currencyFormatter.format(nuevoMontoPagado)}`;
            } else {
                estado = 'parcial';
                mensaje = `Pago parcial registrado. Queda un saldo pendiente de ${currencyFormatter.format(cuota.monto - nuevoMontoPagado)} para completar la cuota.`;
                if (!confirm(`${mensaje}\n¿Desea continuar?`)) return;
            }

            let comprobanteUrl = null;
            if (pagoCuotaFileData) {
                try {
                    const fileName = `comprobante_cuota_${currentCuotaId}_${Date.now()}.${pagoCuotaFileData.name.split('.').pop()}`;
                    const { error } = await supabaseClient.storage.from(PAYMENT_BUCKET).upload(fileName, pagoCuotaFileData);
                    if (error) throw error;
                    const { data: urlData } = supabaseClient.storage.from(PAYMENT_BUCKET).getPublicUrl(fileName);
                    comprobanteUrl = urlData.publicUrl;
                } catch (err) { showToast('Error al subir comprobante: ' + err.message, 'error'); return; }
            }

            try {
                const { error } = await supabaseClient.from('pagos_plan').update({
                    estado: estado,
                    fecha_pago: estado === 'pagado' ? new Date().toISOString().split('T')[0] : null,
                    comprobante_url: comprobanteUrl,
                    monto_pagado: nuevoMontoPagado
                }).eq('id', currentCuotaId);
                if (error) throw error;
                showToast(mensaje, 'success');
                cerrarModalPagoCuota();
                verPlan(currentPlanId);
            } catch (error) { showToast('Error al guardar pago: ' + error.message, 'error'); }
        }

        // ==================== CONFIGURACIÓN ====================
