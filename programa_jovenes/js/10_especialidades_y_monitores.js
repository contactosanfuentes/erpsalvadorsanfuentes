        function abrirModalEspecialidad(jId, espId = null) {
            const j = personasJovenes.find(x => x.id === jId);
            document.getElementById('mesp-joven-id').value = jId;
            const isEdit = espId !== null;
            document.getElementById('mesp-id').value = isEdit ? espId : '';
            let esp = isEdit ? j.especialidades.find(e => e.id === espId) : { nombre:'', categoria:'General', monitor:'', monitorEmail:'', pilares:{explorar:false, conocer:false, hacer:false, servir:false} };
            if(!esp) return;

            document.getElementById('mesp-nombre').value = esp.nombre;
            document.getElementById('mesp-categoria').value = esp.categoria || 'Deportes';
            document.getElementById('mesp-monitor').value = esp.monitor || '';
            document.getElementById('mesp-monitor-email').value = esp.monitorEmail || '';
            document.getElementById('mesp-p-explorar').checked = esp.pilares?.explorar || false;
            document.getElementById('mesp-p-conocer').checked = esp.pilares?.conocer || false;
            document.getElementById('mesp-p-hacer').checked = esp.pilares?.hacer || false;
            document.getElementById('mesp-p-servir').checked = esp.pilares?.servir || false;
            
            document.getElementById('mesp-btn-eliminar').style.display = isEdit ? 'block' : 'none';
            document.getElementById('modal-especialidad').classList.add('active');
        }
        async function guardarEdicionEspecialidad() {
            const jId = parseInt(document.getElementById('mesp-joven-id').value);
            const eIdStr = document.getElementById('mesp-id').value;
            const j = personasJovenes.find(x => x.id === jId);
            const nombre = document.getElementById('mesp-nombre').value.trim();
            if(!nombre) return mostrarNotificacion('error', 'Requisito Indispensable: Tipificar la disciplina a certificar.');

            const pExplorar = document.getElementById('mesp-p-explorar').checked;
            const pConocer = document.getElementById('mesp-p-conocer').checked;
            const pHacer = document.getElementById('mesp-p-hacer').checked;
            const pServir = document.getElementById('mesp-p-servir').checked;
            const completadaAhora = pExplorar && pConocer && pHacer && pServir;

            let completadaAntes = false;
            if (eIdStr) {
                const espAntes = j.especialidades.find(e => e.id === Number(eIdStr));
                if (espAntes && espAntes.pilares) {
                    completadaAntes = espAntes.pilares.explorar && espAntes.pilares.conocer && espAntes.pilares.hacer && espAntes.pilares.servir;
                }
            }

            const nEsp = {
                id: eIdStr ? parseFloat(eIdStr) : Date.now(),
                nombre: nombre, categoria: document.getElementById('mesp-categoria').value,
                monitor: document.getElementById('mesp-monitor').value.trim(),
                monitorEmail: document.getElementById('mesp-monitor-email').value.trim(),
                icono: 'fa-certificate',
                pilares: { explorar: pExplorar, conocer: pConocer, hacer: pHacer, servir: pServir }
            };

            let arr = j.especialidades || [];
            if(eIdStr) { const idx = arr.findIndex(e => e.id === nEsp.id); if(idx > -1) arr[idx] = nEsp; } 
            else { arr.push(nEsp); }
            updateProgresionDB(jId, 'especialidades', arr);
            document.getElementById('modal-especialidad').classList.remove('active');
            mostrarNotificacion('exito', 'Progreso de Especialidad guardado de forma segura.');
            
            if (completadaAhora && !completadaAntes) {
                // Generar certificado primero para adjuntarlo al correo de notificación
                let adjuntoEsp = null;
                try {
                    mostrarNotificacion('info', 'Generando certificado de especialidad...');
                    const nomJoven = `${j.nombres || ''} ${j.apellidos || ''}`.trim();
                    const datosCertEsp = {
                        titulo: 'DE ESPECIALIDAD',
                        nombre: nomJoven,
                        unidad: j.unidad,
                        detalle: `Por haber completado la especialidad "${nombre}" (${nEsp.categoria})`,
                        subdetalle: 'Demostrando dominio en los pilares: Explorar, Conocer, Hacer y Servir',
                        nombreArchivo: `Cert_Especialidad_${nombre.replace(/[^a-zA-Z0-9]/g,'_')}_${(j.apellidos||'').replace(/[^a-zA-Z0-9]/g,'_')}`
                    };
                    const resDriveEsp = await Certificados.generarYSubir(datosCertEsp, window.supabaseClient, null);
                    if (resDriveEsp?.pdfBase64 && resDriveEsp.pdfBase64.length > 500) {
                        const nombrePdfEsp = (resDriveEsp.codigo || '') + '_' + (datosCertEsp.nombreArchivo || 'Certificado') + '.pdf';
                        adjuntoEsp = [{ filename: nombrePdfEsp.replace(/[^a-zA-Z0-9._-]/g,'_'), content: resDriveEsp.pdfBase64, type: 'application/pdf' }];
                    }
                    mostrarNotificacion('exito', '✅ Certificado de especialidad guardado en Drive.');
                } catch(err) { console.error('Error certificado especialidad:', err); }
                // Enviar notificación CON el certificado adjunto
                await enviarNotificacionHito(j, 'especialidad', { nombre: nombre, categoria: nEsp.categoria }, adjuntoEsp);
            }
        }
        function eliminarEspecialidadActual() {
            if(!confirm("ALERTA DE SEGURIDAD: ¿Está seguro de revocar y eliminar permanentemente esta Especialidad del Registro Nacional del joven?")) return;
            const jId = parseInt(document.getElementById('mesp-joven-id').value);
            const eIdStr = document.getElementById('mesp-id').value;
            const j = personasJovenes.find(x => x.id === jId);
            j.especialidades = j.especialidades.filter(e => e.id !== parseFloat(eIdStr));
            updateProgresionDB(jId, 'especialidades', j.especialidades);
            document.getElementById('modal-especialidad').classList.remove('active');
            mostrarNotificacion('info', 'Expediente depurado.');
        }

        // Buscar monitor externo con desplegable
        async function buscarMonitorExterno(tipo) {
            const query = tipo === 'especialidad' ? document.getElementById('mesp-monitor').value.trim() : document.getElementById('mcomp-tutor').value.trim();
            if (query.length < 3) return;
            const resultadosDiv = tipo === 'especialidad' ? document.getElementById('resultados-monitor-especialidad') : document.getElementById('resultados-monitor-competencia');
            resultadosDiv.innerHTML = '<div class="text-center text-xs py-2 text-indigo-500"><i class="fas fa-spinner fa-pulse"></i> Buscando...</div>';
            resultadosDiv.classList.remove('hidden');
            try {
                const { data } = await supabaseClient.from('adultos_registros')
                    .select('nombres, apellidos, email')
                    .or(`nombres.ilike.%${query}%,apellidos.ilike.%${query}%,email.ilike.%${query}%`)
                    .limit(10);
                let html = '';
                if (data && data.length) {
                    data.forEach(adulto => {
                        html += `<div class="cursor-pointer hover:bg-indigo-50 p-2 rounded flex items-center gap-2 transition" onclick="seleccionarMonitor('${tipo}', '${adulto.nombres} ${adulto.apellidos}', '${adulto.email}', this)">${adulto.nombres} ${adulto.apellidos} (${adulto.email})</div>`;
                    });
                } else {
                    html = '<div class="text-center text-xs py-2 text-red-400 font-bold">No encontrado</div>';
                }
                resultadosDiv.innerHTML = html;
            } catch (error) {
                resultadosDiv.innerHTML = '<div class="text-center text-xs py-2 text-red-500">Error en la búsqueda</div>';
            }
        }

        function seleccionarMonitor(tipo, nombre, email, elemento) {
            if (tipo === 'especialidad') {
                document.getElementById('mesp-monitor').value = nombre;
                document.getElementById('mesp-monitor-email').value = email;
                document.getElementById('resultados-monitor-especialidad').classList.add('hidden');
            } else {
                document.getElementById('mcomp-tutor').value = nombre;
                document.getElementById('mcomp-tutor-email').value = email;
                document.getElementById('resultados-monitor-competencia').classList.add('hidden');
            }
        }

        // Notificación con EmailJS
        async function notificarMonitorExterno(tipo) {
            let nombre, email, jovenId, tipoTexto;
            if (tipo === 'especialidad') {
                nombre = document.getElementById('mesp-monitor').value.trim();
                email = document.getElementById('mesp-monitor-email').value.trim();
                jovenId = document.getElementById('mesp-joven-id').value;
                tipoTexto = 'Monitor Externo de Especialidad';
            } else if (tipo === 'competencia') {
                nombre = document.getElementById('mcomp-tutor').value.trim();
                email = document.getElementById('mcomp-tutor-email').value.trim();
                jovenId = document.getElementById('mcomp-joven-id').value;
                tipoTexto = 'Tutor/Asesor de Competencia';
            } else return;

            if (!nombre || !email) {
                mostrarNotificacion('error', 'Complete el nombre y correo del monitor/tutor antes de notificar.');
                return;
            }

            const joven = personasJovenes.find(j => j.id == jovenId);
            if (!joven) return;

            const baseUrl = window.location.origin + window.location.pathname;
            const linkAceptar = `${baseUrl}?id=${joven.id}&aceptar=${tipo}`;

            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; background: #f4f7f9; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; }
                        .header { background: #0E2586; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                        .header img { max-height: 80px; margin-bottom: 10px; }
                        .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                        .btn { display: inline-block; background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="https://i.imgur.com/11u9rUD.png" alt="Logo Grupo Scout">
                            <h2>Invitación a colaborar</h2>
                        </div>
                        <div class="content">
                            <p>Estimado/a <strong>${escapeHtml(nombre)}</strong>,</p>
                            <p>El <strong>Grupo Guías y Scouts Salvador Sanfuentes</strong> le extiende una cordial invitación para colaborar como <strong>${tipoTexto}</strong> del joven <strong>${escapeHtml(joven.nombre)}</strong> (RUN: ${escapeHtml(joven.run)}).</p>
                            <p>Su experiencia y conocimientos serán de gran valor para apoyar la progresión educativa del beneficiario en el marco del Método Scout.</p>
                            <p>Para aceptar esta invitación y comenzar a registrar su acompañamiento, haga clic en el siguiente enlace:</p>
                            <p style="text-align: center;"><a href="${linkAceptar}" class="btn">Aceptar invitación</a></p>
                            <p>Si tiene alguna duda, puede contactar a la dirección del grupo respondiendo a este correo.</p>
                            <p>¡Muchas gracias por su valiosa colaboración!</p>
                        </div>
                        <div class="footer">
                            <p>Grupo Guías y Scouts Salvador Sanfuentes · Sistema de Gestión Educativa</p>
                            <p>Este correo es automático, por favor no responder directamente.</p>
                        </div>
                    </div>
                

</body>
                </html>
            `;

            const templateParams = {
                to_email: email,
                subject: `Invitación a colaborar como ${tipoTexto} - ${joven.nombre}`,
                html_content: htmlContent
            };
            try {
                await fetch('https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email',{method:'POST',headers:{'Content-Type':'application/json','apikey':'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4'},body:JSON.stringify(templateParams)});
                mostrarNotificacion('exito', `Invitación enviada a ${email}`);
            } catch (error) {
                console.error('Error email:', error);
                mostrarNotificacion('error', 'Error al enviar la invitación. Verifique consola.');
            }
        }

        // ================= GESTOR DE PROYECTOS COLECTIVOS Y DE AVANZADA =================
