        async function enviarNotificacionHito(joven, tipo, detalles, adjuntos) {
            try {
                let destinatarios = [];
                const unidad = joven.unidad;
                if (EMAILS_POR_UNIDAD[unidad]) {
                    destinatarios.push(...EMAILS_POR_UNIDAD[unidad]);
                } else {
                    destinatarios.push('registro@salvadorsanfuentes.org');
                }
                if (joven.apoderado_titular_email) {
                    destinatarios.push(joven.apoderado_titular_email);
                }
                if (joven.email_institucional) {
                    destinatarios.push(joven.email_institucional);
                }
                destinatarios = [...new Set(destinatarios)];
                const toEmails = destinatarios.join(',');
                const ccEmails = CC_EMAILS.join(',');

                let asunto = '', textoHito = '', titulo = '';
                switch(tipo) {
                    case 'especialidad':
                        asunto = `🎉 ¡Nueva Especialidad Certificada! - ${joven.nombre}`;
                        titulo = 'Certificación de Especialidad Scout';
                        textoHito = `Se ha certificado la especialidad <strong>${escapeHtml(detalles.nombre)}</strong> (${escapeHtml(detalles.categoria)}). El joven ha completado los 4 pilares de evaluación (Explorar, Conocer, Hacer, Servir), demostrando dominio práctico y servicio.`;
                        break;
                    case 'competencia':
                        asunto = `🏆 Competencia alcanzada - ${joven.nombre}`;
                        titulo = 'Logro de Competencia Avanzada';
                        textoHito = `Se ha registrado la competencia <strong>${escapeHtml(detalles.nombre)}</strong> con nivel de <strong>Maestría</strong>. Esta competencia fue validada a través del proyecto: "${escapeHtml(detalles.proyecto)}".`;
                        break;
                    case 'etapa':
                        asunto = `✨ ¡Nuevo Avance en la Progresión Personal! - ${joven.nombre}`;
                        titulo = 'Avance de Etapa en la Progresión Personal';
                        const rol = getRolUnidad(joven);
                        textoHito = `${rol.articulo} <strong>${rol.nombre}</strong> ha alcanzado la etapa <strong>${escapeHtml(detalles.nuevaEtapa)}</strong> dentro de la unidad ${escapeHtml(joven.unidad)}. Este avance refleja el crecimiento personal y el compromiso vivido a través del Método Scout, reconociendo los aprendizajes y experiencias significativas de esta etapa de su desarrollo.`;
                        break;
                    default: return;
                }
                
                const logoUrl = 'https://i.imgur.com/11u9rUD.png';
                // Generar token de solo lectura (expira en 72h, un solo uso)
                const token = 'vp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
                await supabaseClient.from('tokens_perfil').insert({ token, joven_id: joven.id, usado: false });
                const linkVer = window.location.origin + '/ver_perfil.html?token=' + token;
                const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="es">
                    <head><meta charset="UTF-8"><title>${asunto}</title>
                    <style>
                        body { font-family: 'Segoe UI', sans-serif; background: #f4f7f9; margin:0; padding:20px; }
                        .container { max-width:600px; margin:0 auto; background:white; border-radius:15px; overflow:hidden; box-shadow:0 10px 25px rgba(14,37,134,0.1); border-left:5px solid #0E2586; }
                        .header { background:linear-gradient(135deg,#0E2586 0%,#1e3a8a 100%); color:white; padding:20px; text-align:center; }
                        .header img { height:80px; margin-bottom:10px; }
                        .header h2 { margin:0; font-size:24px; font-weight:800; }
                        .content { padding:30px; }
                        .hito-box { background:#f0fdf4; border-left:4px solid #10b981; padding:20px; margin:20px 0; border-radius:8px; }
                        .info-box { background:#f8fafc; padding:15px; border-radius:8px; margin:20px 0; border:1px solid #e2e8f0; }
                        .footer { background:#0E2586; color:white; text-align:center; padding:15px; font-size:12px; border-top:3px solid #FFD100; }
                        .btn { display:inline-block; background:#10b981; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; font-weight:bold; margin-top:15px; }
                    </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header"><img src="${logoUrl}"><h2>Grupo Guías y Scouts Salvador Sanfuentes</h2></div>
                            <div class="content">
                                <p>Estimada familia,</p>
                                <p>Nos complace informarles sobre un importante hito alcanzado por <strong>${escapeHtml(joven.nombre)}</strong>:</p>
                                <div class="hito-box"><h3 style="color:#0E2586; margin-top:0;">🏅 ${titulo}</h3><p>${textoHito}</p></div>
                                <div class="info-box"><p><strong>📌 Datos del joven:</strong><br>RUN: ${escapeHtml(joven.run)}<br>Unidad: ${escapeHtml(joven.unidad)}<br>Etapa actual: ${escapeHtml(joven.etapaActual)}</p>${detalles.detallesAdicionales ? `<p><strong>📝 Detalles adicionales:</strong><br>${escapeHtml(detalles.detallesAdicionales)}</p>` : ''}</div>
                                <p>Puede revisar el expediente completo en el siguiente enlace:</p>
                                <p style="text-align:center;"><a href="${linkVer}" class="btn">Ver expediente</a></p>
                                <p>¡Felicitaciones por este logro! Seguimos trabajando juntos en el desarrollo integral de nuestros jóvenes.</p>
                                <p>Saludos cordiales,<br>Dirección del Grupo</p>
                            </div>
                            <div class="footer"><p>Este correo es automático. Por favor no responder.</p><p>Grupo Guías y Scouts Salvador Sanfuentes · Sistema de Gestión Educativa</p></div>
                        </div>
                    

</body>
                    </html>
                `;
                
                const templateParams = {
                    to_email: toEmails,
                    cc_email: ccEmails,
                    subject: asunto,
                    html_content: htmlContent
                };
                // Adjuntar certificado PDF si viene como parámetro
                if (adjuntos && Array.isArray(adjuntos) && adjuntos.length > 0) {
                    templateParams.attachments = adjuntos;
                }
                await fetch('https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email',{method:'POST',headers:{'Content-Type':'application/json','apikey':'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4'},body:JSON.stringify(templateParams)});
                console.log(`Notificación enviada para ${tipo} a ${toEmails} (CC: ${ccEmails})`);

                // ── WhatsApp al apoderado titular ──
                const telApoderado = joven.apoderado_titular_telefono;
                if (telApoderado) {
                    const nombreApoderado = (joven.apoderado_titular_nombre || 'Apoderado').split(' ')[0];
                    const nombreJoven = joven.nombre.split(' ')[0];
                    const rama = joven.rama || '';
                    // Lema oficial por rama AGSCh
                    const LEMAS_RAMA = {
                        'Bandada': '¡Siempre Mejor! 🕊️',
                        'Manada': '¡Siempre lo Mejor! / ¡Buena Caza! 🐺',
                        'Tropa': '¡Siempre Listos! ⚜️',
                        'Compañía': '¡Siempre Listas! ⚜️',
                        'Avanzada': '¡Siempre Adelante! 🧭',
                        'Clan': '¡Siempre Listos para Servir! 🔥'
                    };
                    const lema = LEMAS_RAMA[rama] || '¡Siempre Listos, Siempre Listas! ⚜️';
                    let cuerpoWA = '';
                    if (tipo === 'especialidad') {
                        cuerpoWA = `¡Nueva Especialidad Certificada! ${joven.nombre} ha completado la especialidad "${detalles.nombre}" (${detalles.categoria}). Demostró dominio en los pilares: Explorar, Conocer, Hacer y Servir. ¡Felicitaciones a ${nombreJoven}! ${lema}`;
                    } else if (tipo === 'etapa') {
                        cuerpoWA = `¡Avance en la Progresión Personal! ${joven.nombre} ha alcanzado la etapa "${detalles.nuevaEtapa}" en la unidad ${joven.unidad} (Rama ${rama}). Este avance refleja su crecimiento, aprendizajes y experiencias vividas a través del Método Scout. El acompañamiento de la familia es fundamental. ¡Gracias por ser parte! ${lema}`;
                    } else if (tipo === 'competencia') {
                        cuerpoWA = `¡Competencia Alcanzada! ${joven.nombre} ha logrado la competencia "${detalles.nombre}".${detalles.proyecto ? ' Validada mediante el proyecto: "' + detalles.proyecto + '".' : ''} Evaluada y validada por su equipo de dirigentes. ¡Felicitaciones a ${nombreJoven}! ${lema}`;
                    }
                    if (cuerpoWA) {
                        console.log('📱 Enviando WA a:', telApoderado, '| Nombre:', nombreApoderado, '| Largo:', cuerpoWA.length);
                        try {
                            const waRes = await WA.enviar(telApoderado, nombreApoderado, cuerpoWA);
                            console.log('📱 Resultado WA:', JSON.stringify(waRes));
                            if (waRes.ok) { mostrarNotificacion('exito', 'WhatsApp enviado a ' + nombreApoderado); }
                            else { mostrarNotificacion('info', 'WhatsApp no enviado: ' + (waRes.error || 'error desconocido')); }
                        } catch(waErr) { console.error('📱 Error WA:', waErr); mostrarNotificacion('info', 'Error WhatsApp: ' + waErr.message); }
                    } else { console.log('📱 No se generó cuerpo WA para tipo:', tipo); }
                }
            } catch (error) {
                console.error('Error enviando notificación de hito:', error);
            }
        }

        // ================= RENDERIZADO CENTRAL DE EXPEDIENTE DEL BENEFICIARIO =================
