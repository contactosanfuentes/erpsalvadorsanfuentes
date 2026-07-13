    window.opcionesComprobanteJoven = function(id) {
        const j = jovenes.find(x => x.id == id);
        if(!j) return;
        const total = ((j.numero_integrantes || 0) * (j.cuota || 0)).toFixed(2);
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-box">
                <h3>Opciones de Patrulla</h3>
                <p><strong>Registro:</strong> ${j.nombre_patrulla}</p>
                <div class="modal-actions">
                    <button class="btn btn-success" id="btn-email-j"><i class="fas fa-envelope"></i> Correo</button>
                    <button class="btn btn-success" id="btn-wsp-j" style="background:#25D366"><i class="fab fa-whatsapp"></i> WhatsApp</button>
                    <button class="btn btn-warning" id="btn-cred-j"><i class="fas fa-id-badge"></i> Credencial</button>
                    <button class="btn btn-primary" id="btn-print-j"><i class="fas fa-print"></i> Comprobante</button>
                    <button class="btn" style="background:#7c3aed;color:white;" id="btn-cert-j"><i class="fas fa-certificate"></i> Certificado</button>
                    <button class="btn btn-secondary" id="btn-close-j">Cerrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('#btn-close-j').onclick = () => overlay.remove();

        overlay.querySelector('#btn-wsp-j').onclick = async () => {
            overlay.remove();
            const tel = (j.telefono || '').replace(/\D/g, '');
            if(!tel) { customAlert('Esta patrulla no tiene teléfono registrado.'); return; }
            let codigo = j.codigo_qr;
            if (!codigo) {
                codigo = 'GSS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2,5).toUpperCase();
                await supabaseClient.from('jovenes').update({ codigo_qr: codigo }).eq('id', j.id);
                j.codigo_qr = codigo; renderJovenes();
            }
            const telNorm = tel.startsWith('56') ? tel : '56' + tel;
            const cuerpoWA = `✅ Tu inscripción al evento "${eventoActual.nombre}" ha sido recibida.\n\nTu código de acceso: *${codigo}*\n\nPresenta el QR que llegará a tu correo al ingresar al evento. ¡Nos vemos pronto! 🏕️`;
            try { await WA.enviar(telNorm, j.nombre_patrulla.split(' ')[0], cuerpoWA); customAlert('✅ WhatsApp enviado.'); }
            catch(e) { window.open(`https://wa.me/${telNorm}?text=${encodeURIComponent(cuerpoWA)}`, '_blank'); }
        };

        // ── Botón Credencial: genera credencial individual tipo adulto ──
        overlay.querySelector('#btn-cred-j').onclick = () => {
            overlay.remove();
            imprimirCredencialJoven(j);
        };
        
        const reglasPasaporte = document.getElementById('pasaporte-reglas').value.replace(/\n/g, '<br>');
        const contactoE = document.getElementById('contacto-emergencia').value;
        const bloqueReglas = `
            <div style="background:#FEF3C7; padding:15px; border-left:4px solid #F59E0B; margin: 15px 0; border-radius: 8px;">
                <h4 style="margin:0 0 10px 0; color:#92400E;">Instrucciones y Reglas:</h4>
                <p style="margin:0; font-size:14px; color:#92400E;">${reglasPasaporte}</p>
                <p style="margin:10px 0 0 0; font-size:14px; color:#DC2626;"><strong>Teléfono Emergencia Central:</strong> ${contactoE}</p>
            </div>
        `;

        overlay.querySelector('#btn-cert-j').onclick = async () => {
            overlay.remove();
            const evtNombre = document.getElementById('evento-titulo')?.value || eventoActual?.nombre || 'Evento Scout';
            try {
                mostrarToastRealtime('Generando certificado de participación...', 'info');
                const datosCertEvtJ = {
                    titulo: 'DE PARTICIPACIÓN',
                    nombre: j.nombre_patrulla || j.nombre || '',
                    unidad: j.unidad || '',
                    detalle: `Por su participación en el evento "${evtNombre}"`,
                    subdetalle: 'Demostrando sus valores Guía-Scout',
                    nombreArchivo: `Cert_Participacion_${evtNombre.replace(/[^a-zA-Z0-9]/g,'_')}_${(j.nombre_patrulla||j.nombre||'').replace(/[^a-zA-Z0-9]/g,'_')}`
                };
                const resEvtJ = await Certificados.generarYSubir(datosCertEvtJ, supabaseClient, null);
                // Enviar correo con adjunto si hay email del apoderado
                const emailApodEvt = j.email_apoderado || j.apoderado_titular_email || '';
                if (emailApodEvt && resEvtJ?.pdfBase64) {
                    const SUPA_EMAIL = 'https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email';
                    const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
                    await fetch(SUPA_EMAIL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY },
                        body: JSON.stringify({
                            to_email: emailApodEvt,
                            subject: `📜 Certificado de participación — ${evtNombre}`,
                            html_content: `<h2>Certificado de Participación</h2><p>${datosCertEvtJ.nombre} participó en el evento <b>${evtNombre}</b>.</p><p>Adjunto el certificado oficial.</p><p>⚜ Grupo Guías y Scouts Salvador Sanfuentes</p>`,
                            attachments: [{ filename: (resEvtJ.codigo||'Cert') + '_Participacion.pdf', content: resEvtJ.pdfBase64, type: 'application/pdf' }]
                        })
                    }).catch(e => console.warn('Correo evento no enviado:', e));
                    mostrarToastRealtime('✅ Certificado guardado en Drive y enviado por correo.', 'success');
                } else {
                    mostrarToastRealtime('✅ Certificado guardado en Drive.', 'success');
                }
            } catch(err) {
                console.error('Error certificado:', err);
                mostrarToastRealtime('No se pudo generar: ' + err.message, 'error');
            }
        };

        overlay.querySelector('#btn-print-j').onclick = () => {
            overlay.remove();
            const evtTitulo = document.getElementById('evento-titulo').value || 'Evento Scout';
            const w = window.open('', '_blank');
            const pasaporteHtml = generarHtmlPasaporte(id);
            const croquisB64 = getCroquisDataUrl();

            w.document.write(`
                <html><head><title>Comprobante ${j.nombre_patrulla}</title>
                <style>
                    @page { size: letter portrait; margin: 1.5cm; }
                    @page landscape_page { size: letter landscape; margin: 1cm; }
                    body { font-family: 'Poppins', Arial, sans-serif; padding: 0; margin: 0; color: #333; }
                    .print-page { page-break-after: always; }
                    .header-print { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #0E2586; padding-bottom: 10px; margin-bottom: 15px; }
                    .header-print img { height: 50px; }
                    .box { border: 2px solid #0E2586; padding: 15px; border-radius: 10px; text-align:center; background:#f8fafc; margin-bottom: 15px;}
                    .croquis-container-print { page: landscape_page; page-break-before: always; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align:center; }
                    .croquis-container-print img { max-width: 100%; max-height: 85vh; object-fit: contain; border: 2px solid #ccc; border-radius: 8px; }
                </style></head>
                <body>
                    <div class="print-page">
                        <div class="header-print">
                            <img src="https://i.imgur.com/11u9rUD.png" alt="Logo">
                            <div style="text-align:center;">
                                <h2 style="margin:0; color:#0E2586;">${evtTitulo}</h2>
                                <h3 style="margin:5px 0 0; color:#333;">COMPROBANTE Y PASAPORTE</h3>
                            </div>
                            <img src="https://i.imgur.com/DcxzvpX.png" alt="Logo">
                        </div>
                        <div class="box">
                            <h2 style="margin-top:0;">COMPROBANTE DE INSCRIPCIÓN</h2>
                            <hr style="border-top:1px solid #ccc; margin:10px 0;">
                            <p style="margin:5px 0;"><strong>Registro/Patrulla:</strong> ${j.nombre_patrulla}</p>
                            <p style="margin:5px 0;"><strong>Grupo Scout:</strong> ${j.grupo_scout}</p>
                            <p style="margin:5px 0;"><strong>N° de Integrantes:</strong> ${j.numero_integrantes}</p>
                            <p style="margin:5px 0;"><strong>Total Cancelado:</strong> $${total}</p>
                        </div>
                        ${bloqueReglas}
                        ${pasaporteHtml}
                    </div>
                    ${croquisB64 ? `
                    <div class="croquis-container-print">
                        <h2 style="color:#0E2586; margin-bottom:15px; text-transform:uppercase;">Croquis Logístico y de Juego</h2>
                        <img src="${croquisB64}">
                    </div>` : ''}
                </body></html>
            `);
            w.document.close();
            setTimeout(() => w.print(), 800);
        };

        overlay.querySelector('#btn-email-j').onclick = async () => {
            overlay.remove();
            if(!j.email) { customAlert('Esta patrulla no tiene correo registrado.'); return; }
            let codigo = j.codigo_qr;
            if (!codigo) {
                codigo = 'GSS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2,5).toUpperCase();
                await supabaseClient.from('jovenes').update({ codigo_qr: codigo }).eq('id', j.id);
                j.codigo_qr = codigo;
                renderJovenes();
            }
            const qrPayload = JSON.stringify({ codigo_qr: codigo, evento_id: eventoActual.id, tipo: 'joven', nombre: j.nombre_patrulla });
            const htmlContent = emailHTMLEvento({
                nombre: j.nombre_patrulla, codigo, evento: eventoActual.nombre,
                eventoFecha: eventoActual.fecha_inicio, eventoLugar: eventoActual.lugar,
                tipo: 'patrulla', fotoURL: j.foto_url || ''
            });
            try {
                await fetch('https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email',{
                    method:'POST', headers:{'Content-Type':'application/json','apikey':'sb_publishable_JW9Y4kz_Wiy6e1E1KdzAyQ_PBbWUf6t'},
                    body: JSON.stringify({ to_email: j.email, subject: `Tu inscripción: ${eventoActual.nombre}`, html_content: htmlContent, qr_text: qrPayload })
                });
                customAlert('✅ Correo de inscripción enviado a ' + j.email);
            } catch(e) { customAlert('Error al enviar el correo.'); }
        };
    };

    window.opcionesComprobanteAdulto = function(id) {
        const a = adultos.find(x => x.id == id);
        if(!a) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-box">
                <h3>Opciones de Staff</h3>
                <p><strong>Nombre:</strong> ${a.nombre}</p>
                <div class="modal-actions">
                    <button class="btn btn-success" id="btn-email-a"><i class="fas fa-envelope"></i> Correo</button>
                    <button class="btn btn-success" id="btn-wsp-a" style="background:#25D366"><i class="fab fa-whatsapp"></i> WhatsApp</button>
                    <button class="btn btn-primary" id="btn-print-a"><i class="fas fa-print"></i> Credencial</button>
                    <button class="btn" style="background:#7c3aed;color:white;" id="btn-cert-a"><i class="fas fa-certificate"></i> Certificado</button>
                    <button class="btn btn-secondary" id="btn-close-a">Cerrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('#btn-close-a').onclick = () => overlay.remove();

        overlay.querySelector('#btn-wsp-a').onclick = async () => {
            overlay.remove();
            const tel = (a.telefono || '').replace(/\D/g, '');
            if(!tel) { customAlert('Este adulto no tiene teléfono registrado.'); return; }
            let codigoWA = a.codigo_qr;
            if (!codigoWA) {
                codigoWA = 'GSS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2,5).toUpperCase();
                await supabaseClient.from('adultos').update({ codigo_qr: codigoWA }).eq('id', a.id);
                a.codigo_qr = codigoWA; renderAdultos();
            }
            const telNormA = tel.startsWith('56') ? tel : '56' + tel;
            const cuerpoWA = `✅ Tu inscripción como *${a.rol}* en "${eventoActual.nombre}" ha sido recibida.\n\nTu código de acceso: *${codigoWA}*\n\nPresenta el QR al ingresar al evento. ¡Gracias por ser parte del equipo! 🍀`;
            try { await WA.enviar(telNormA, a.nombre.split(' ')[0], cuerpoWA); customAlert('✅ WhatsApp enviado.'); }
            catch(e) { window.open(`https://wa.me/${telNormA}?text=${encodeURIComponent(cuerpoWA)}`, '_blank'); }
        };
        
        overlay.querySelector('#btn-print-a').onclick = () => {
            overlay.remove();
            imprimirCredencialIndividual(a);
        };

        overlay.querySelector('#btn-cert-a').onclick = async () => {
            overlay.remove();
            const evtNombre = document.getElementById('evento-titulo')?.value || eventoActual?.nombre || 'Evento Scout';
            try {
                mostrarToastRealtime('Generando certificado de participación...', 'info');
                const datosCertEvtA = {
                    titulo: 'DE PARTICIPACIÓN',
                    nombre: a.nombre || '',
                    unidad: a.grupo || a.rol || 'Adulto',
                    detalle: `Por su participación como ${a.rol || 'integrante'} en el evento "${evtNombre}"`,
                    subdetalle: 'Reconocimiento al compromiso y servicio voluntario',
                    nombreArchivo: `Cert_Participacion_${evtNombre.replace(/[^a-zA-Z0-9]/g,'_')}_${(a.nombre||'').replace(/[^a-zA-Z0-9]/g,'_')}`
                };
                const resEvtA = await Certificados.generarYSubir(datosCertEvtA, supabaseClient, 'adultos');
                // Enviar correo con adjunto si hay email
                const emailAdultoEvt = a.email || '';
                if (emailAdultoEvt && resEvtA?.pdfBase64) {
                    const SUPA_EMAIL = 'https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email';
                    const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
                    await fetch(SUPA_EMAIL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY },
                        body: JSON.stringify({
                            to_email: emailAdultoEvt,
                            subject: `📜 Certificado de participación — ${evtNombre}`,
                            html_content: `<h2>Certificado de Participación</h2><p>${datosCertEvtA.nombre} participó como ${a.rol||'integrante'} en el evento <b>${evtNombre}</b>.</p><p>Adjunto el certificado oficial.</p><p>⚜ Grupo Guías y Scouts Salvador Sanfuentes</p>`,
                            attachments: [{ filename: (resEvtA.codigo||'Cert') + '_Participacion.pdf', content: resEvtA.pdfBase64, type: 'application/pdf' }]
                        })
                    }).catch(e => console.warn('Correo evento adulto no enviado:', e));
                    mostrarToastRealtime('✅ Certificado guardado en Drive y enviado por correo.', 'success');
                } else {
                    mostrarToastRealtime('✅ Certificado guardado en Drive.', 'success');
                }
            } catch(err) {
                console.error('Error certificado adulto evento:', err);
                mostrarToastRealtime('No se pudo generar: ' + err.message, 'error');
            }
        };

        overlay.querySelector('#btn-email-a').onclick = async () => {
            overlay.remove();
            if(!a.email) { customAlert("Este adulto no tiene un correo registrado."); return; }
            
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"><style>
                body{font-family:'Poppins',sans-serif;background:#F8FAFC;margin:0;padding:20px;color:#1E293B;}
                .container{max-width:600px;margin:0 auto;background:white;border-radius:15px;overflow:hidden;box-shadow:0 10px 25px rgba(30,58,138,0.1);border-left:5px solid #F80202;}
                .header{background:linear-gradient(135deg,#F80202 0%,#ff6b6b 100%);color:white;padding:20px;text-align:center;}
                .header img{height:80px;}
                .content{padding:30px;}
                .foto{text-align:center;margin-bottom:20px;}
                .foto img{width:120px;height:120px;object-fit:cover;border-radius:50%;border:4px solid #1E3A8A;}
                .info-item{margin-bottom:12px;padding:10px;background:#F8FAFC;border-radius:8px;border-left:4px solid #F80202;}
                .info-item strong{display:inline-block;min-width:140px;color:#1E3A8A;}
                .footer{background:#1E3A8A;color:white;text-align:center;padding:15px;font-size:12px;}
                </style></head>
                <body>
                <div class="container">
                    <div class="header">
                        <img src="https://i.imgur.com/11u9rUD.png">
                        <h2 style="margin:10px 0 0;">${eventoActual?.nombre || 'Evento Scout'}</h2>
                        <p style="margin:5px 0 0; opacity:0.9;">Acreditación de Staff</p>
                    </div>
                    <div class="content">
                        ${a.foto_url ? `<div class="foto"><img src="${a.foto_url}"></div>` : ''}
                        <p>Estimado/a <strong>${a.nombre}</strong>,</p>
                        <p>Se confirma su registro como STAFF para nuestro evento. Detalle de asignación:</p>
                        
                        <div class="info-item"><strong>Grupo:</strong> ${a.grupo || 'Externo/Libre'}</div>
                        <div class="info-item"><strong>Rol Asignado:</strong> <span style="color:#F80202; font-weight:bold;">${a.rol}</span></div>
                        
                        <p style="text-align:center; font-weight:bold; margin-top:25px; color:#1E3A8A;">¡Gracias por tu invaluable servicio!</p>
                        <p style="color:#64748b; font-size:12px; text-align:center; margin-top:20px;">Generado automáticamente por el Sistema ERP Scout</p>
                    </div>
                    <div class="footer">
                        <img src="https://i.imgur.com/11u9rUD.png" style="height:40px;filter:brightness(0) invert(1);">
                        <p style="margin:5px 0 0;">Este es un correo automático, por favor no responder.</p>
                    </div>
                </div>
                </body>
                </html>
            `;
            // Usar el mismo emailHTML de inscripcion_publica
            let codigoA = a.codigo_qr;
            if (!codigoA) {
                codigoA = 'GSS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2,5).toUpperCase();
                await supabaseClient.from('adultos').update({ codigo_qr: codigoA }).eq('id', a.id);
                a.codigo_qr = codigoA; renderAdultos();
            }
            const htmlEmailA = emailHTMLEvento({
                nombre: a.nombre, codigo: codigoA, evento: eventoActual.nombre,
                eventoFecha: eventoActual.fecha_inicio, eventoLugar: eventoActual.lugar,
                tipo: 'adulto', rol: a.rol, fotoURL: a.foto_url || ''
            });
            try {
                const qrPayloadA = JSON.stringify({ codigo_qr: codigoA, evento_id: eventoActual.id, tipo: 'adulto', nombre: a.nombre });
                await fetch('https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email',{
                    method:'POST', headers:{'Content-Type':'application/json','apikey':'sb_publishable_JW9Y4kz_Wiy6e1E1KdzAyQ_PBbWUf6t'},
                    body: JSON.stringify({ to_email: a.email, subject: `Tu inscripción: ${eventoActual.nombre}`, html_content: htmlEmailA, qr_text: qrPayloadA })
                });
                customAlert('✅ Correo de inscripción enviado a ' + a.email);
            } catch(e) { customAlert('Error al enviar el correo.'); }
        };
    };

    // ========== QR + EMAIL HELPERS (mismo formato que inscripcion_publica) ==========

    // QR generado server-side por send-email Edge Function — no se genera en el browser
    async function generarQRDataURLEvento(texto) {
        return texto; // Devuelve el texto crudo — el servidor genera el PNG
    }

    function emailHTMLEvento(opts) {
        const { nombre, codigo, evento, eventoFecha, eventoLugar, tipo, rol, qrDataURL, fotoURL } = opts;
        const tipoLabel = tipo === 'patrulla' ? 'participante' : 'adulto / staff';
        const fechaStr = eventoFecha
            ? new Date(eventoFecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
            : 'Fecha por confirmar';
        const lugarStr = eventoLugar || '';
        const fotoBlock = fotoURL ? `<img src="${fotoURL}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2);margin-bottom:8px" alt="">` : '';
        const rolBlock = rol ? `<p style="margin:4px 0 0;font-size:0.85rem;color:#0E2586;font-weight:600">Rol: ${rol}</p>` : '';
        return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif">
            <div style="max-width:560px;margin:auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 22px rgba(0,0,0,0.1)">
                <div style="background:linear-gradient(135deg,#0E2586,#1a36a8);padding:28px 24px;text-align:center;color:white">
                    <img src="https://i.imgur.com/11u9rUD.png" style="width:80px;height:auto;margin-bottom:10px;filter:brightness(0) invert(1)" alt="Logo">
                    <h2 style="margin:0;font-size:1.25rem;font-weight:700">Grupo Guías y Scouts</h2>
                    <p style="margin:3px 0 0;font-size:0.92rem;opacity:0.92;font-weight:600">Salvador Sanfuentes</p>
                </div>
                <div style="padding:26px 24px 20px;text-align:center;background:linear-gradient(180deg,#f8fafc 0%,white 100%)">
                    ${fotoBlock}
                    <h3 style="margin:0;font-size:1.1rem;color:#0E2586;font-weight:700">${nombre}</h3>
                    <p style="margin:4px 0 0;font-size:0.85rem;color:#64748b">Inscripción como ${tipoLabel}</p>
                    ${rolBlock}
                </div>
                <div style="padding:0 24px 18px;text-align:center">
                    <div style="background:#eef3ff;border-radius:11px;padding:14px 16px;margin-bottom:6px">
                        <p style="margin:0;font-size:0.8rem;color:#1a36a8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Evento</p>
                        <p style="margin:4px 0 0;font-size:1.05rem;color:#0E2586;font-weight:700">${evento}</p>
                        <p style="margin:6px 0 0;font-size:0.85rem;color:#475569">📅 ${fechaStr}</p>
                        ${lugarStr ? `<p style="margin:3px 0 0;font-size:0.85rem;color:#475569">📍 ${lugarStr}</p>` : ''}
                    </div>
                </div>
                <div style="padding:0 24px 18px;text-align:center">
                    <div style="background:white;border:2px solid #e2e8f0;border-radius:14px;padding:18px;display:inline-block">
                        <p style="margin:0 0 10px;font-size:0.78rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Tu código QR de acceso</p>
                        {{QR_IMG}}
                        <p style="margin:10px 0 0;font-family:monospace;font-size:1rem;font-weight:700;letter-spacing:3px;color:#0E2586;background:#f4f7f9;padding:7px 14px;border-radius:6px;display:inline-block">${codigo}</p>
                    </div>
                </div>
                <div style="background:#fffbeb;border-top:1px solid #fde68a;padding:16px 24px">
                    <p style="margin:0;font-size:0.85rem;color:#92400e;line-height:1.6">
                        <strong>⏳ Tu inscripción está pendiente de confirmación.</strong><br>
                        Presenta este código QR al llegar al evento. Un dirigente lo escaneará para confirmar tu participación.
                    </p>
                </div>
                <div style="background:#0E2586;padding:14px 24px;text-align:center">
                    <p style="margin:0;font-size:0.78rem;color:rgba(255,255,255,0.85)">Grupo Guías y Scouts Salvador Sanfuentes</p>
                    <p style="margin:3px 0 0;font-size:0.72rem;color:rgba(255,255,255,0.6)">Este correo fue generado desde el ERP Scout.</p>
                </div>
            </div>
        </body></html>`;
    }

    // ========== NAVEGACIÓN Y TABS ==========
