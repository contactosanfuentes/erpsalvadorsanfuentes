    window.inscribirJoven = async function() {
        if (!eventoSel) return alertaJov('Selecciona un evento primero.');

        const nombre_patrulla = document.getElementById('j_nombre').value.trim();
        const unidad_id_str   = document.getElementById('j_unidad').value;
        const email           = document.getElementById('j_email').value.trim();
        const telefono        = document.getElementById('j_tel').value.trim();
        const terms           = document.getElementById('j_terms').checked;

        if (!nombre_patrulla || !unidad_id_str || !email || !telefono)
            return alertaJov('Completa todos los campos obligatorios (*).');
        if (!terms) return alertaJov('Acepta los términos de participación.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alertaJov('Correo electrónico inválido.');

        // unidad_id puede ser numérico (de tabla unidades) o un placeholder __nombre__
        let unidad_id = unidad_id_str.startsWith('__') ? null : parseInt(unidad_id_str);

        showLoading('Registrando inscripción en eventos...');
        document.getElementById('btnInscJov').disabled = true;

        const codigo_qr = generarCodigo();

        // ── INSERT en tabla "jovenes" — mismos campos que usa addJovenRow() ──
        // Nuevos campos: codigo_qr (QR único), confirmado=false (queda pendiente), checkin_at=null, foto_url
        const insertData = {
            evento_id:          eventoSel.id,
            unidad_id:          unidad_id,
            nombre_patrulla:    nombre_patrulla,
            grupo_scout:        document.getElementById('j_grupo').value.trim() || 'Externo',
            numero_integrantes: parseInt(document.getElementById('j_integrantes').value) || 1,
            telefono:           telefono,
            email:              email,
            cuota:              parseFloat(document.getElementById('j_cuota').value) || 0,
            observaciones:      armarObservacionesEstructuradas('j', document.getElementById('j_obs').value.trim()) || '',
            codigo_qr:          codigo_qr,
            confirmado:         false,
            checkin_at:         null
        };
        // foto_url solo si la columna existe en la tabla jovenes
        if (fotoJovenURL) insertData.foto_url = fotoJovenURL;

        const { data, error } = await db.from('jovenes').insert(insertData).select().single();

        hideLoading();
        document.getElementById('btnInscJov').disabled = false;

        if (error) {
            // Si falla por columna foto_url inexistente, reintentar sin ella
            if (error.message.includes('foto_url')) {
                delete insertData.foto_url;
                const r2 = await db.from('jovenes').insert(insertData).select().single();
                if (r2.error) return alertaJov('Error: ' + r2.error.message);
            } else {
                return alertaJov('Error al guardar: ' + error.message);
            }
        }

        // ── Generar QR como dataURL para incrustarlo en el email ──
        const qrPayload = JSON.stringify({ codigo_qr, evento_id: eventoSel.id, tipo: 'joven', nombre: nombre_patrulla });
        const qrDataURL = await generarQRDataURL(qrPayload, 220);

        // Recolectar datos médicos y alimentarios para el email
        const datosMedJov = recolectarDatosMedicos('j');
        const datosAlimJov = recolectarDatosAlim('j');

        // Enviar email con QR embebido y logo del grupo
        try {
            await fetch('https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email',{method:'POST',headers:{'Content-Type':'application/json','apikey':'sb_publishable_JW9Y4kz_Wiy6e1E1KdzAyQ_PBbWUf6t'},body:JSON.stringify({
                to_email: email,
                subject: `Tu inscripción: ${eventoSel.nombre}`,
                html_content: emailHTML({
                    nombre: nombre_patrulla,
                    codigo: codigo_qr,
                    evento: eventoSel.nombre,
                    eventoFecha: eventoSel.fecha_inicio,
                    eventoLugar: eventoSel.lugar,
                    tipo: 'patrulla',
                    qrDataURL: qrDataURL,
                    fotoURL: fotoJovenURL,
                    datosMedicos: datosMedJov,
                    datosAlim: datosAlimJov,
                    fichaURL: fichaJovenURL
                })})
            });
        } catch(e) { console.warn('EmailJS:', e); }

        mostrarExito(codigo_qr, nombre_patrulla, 'joven');

        // ── WhatsApp: confirmación automática de inscripción ──
        const telNorm = WA.normalizar(telefono);
        if (telNorm) {
            const cuerpoWA = `✅ Tu inscripción al evento "${eventoSel.nombre}" ha sido recibida.\n\nTu código de acceso: *${codigo_qr}*\n\nPresenta el QR que llegará a tu correo al ingresar al evento. ¡Nos vemos pronto! 🏕️`;
            WA.enviar(telNorm, nombre_patrulla.split(' ')[0], cuerpoWA).catch(() => {});
        }
    };

    // ── Inscribir ADULTO — escribe en tabla "adultos" ──
    window.inscribirAdulto = async function() {
        if (!eventoSel) return alertaAdu('Selecciona un evento primero.');

        const nombre   = document.getElementById('a_nombre').value.trim();
        const email    = document.getElementById('a_email').value.trim();
        const telefono = document.getElementById('a_tel').value.trim();
        const terms    = document.getElementById('a_terms').checked;

        if (!nombre || !email || !telefono)
            return alertaAdu('Completa todos los campos obligatorios (*).');
        if (!terms) return alertaAdu('Acepta los términos de participación.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alertaAdu('Correo electrónico inválido.');

        showLoading('Registrando inscripción en eventos...');
        document.getElementById('btnInscAdu').disabled = true;

        const codigo_qr = generarCodigo();

        // ── INSERT en tabla "adultos" — mismos campos que usa addAdultoRow() ──
        const insertData = {
            evento_id:     eventoSel.id,
            nombre:        nombre,
            grupo:         document.getElementById('a_grupo').value.trim() || 'Externo/Libre',
            rol:           document.getElementById('a_rol').value,
            email:         email,
            telefono:      telefono,
            foto_url:      fotoAdultoURL || '',
            observaciones: armarObservacionesEstructuradas('a', document.getElementById('a_obs').value.trim()) || '',
            codigo_qr:     codigo_qr,
            confirmado:    false,
            checkin_at:    null
        };

        const { data, error } = await db.from('adultos').insert(insertData).select().single();

        hideLoading();
        document.getElementById('btnInscAdu').disabled = false;

        if (error) {
            return alertaAdu('Error al guardar: ' + error.message);
        }

        // Generar QR como dataURL e incrustarlo en el email
        const qrPayload = JSON.stringify({ codigo_qr, evento_id: eventoSel.id, tipo: 'adulto', nombre });
        const qrDataURL = await generarQRDataURL(qrPayload, 220);

        // Recolectar datos médicos y alimentarios
        const datosMedAdu = recolectarDatosMedicos('a');
        const datosAlimAdu = recolectarDatosAlim('a');

        try {
            await fetch('https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email',{method:'POST',headers:{'Content-Type':'application/json','apikey':'sb_publishable_JW9Y4kz_Wiy6e1E1KdzAyQ_PBbWUf6t'},body:JSON.stringify({
                to_email: email,
                subject: `Tu inscripción: ${eventoSel.nombre}`,
                html_content: emailHTML({
                    nombre,
                    codigo: codigo_qr,
                    evento: eventoSel.nombre,
                    eventoFecha: eventoSel.fecha_inicio,
                    eventoLugar: eventoSel.lugar,
                    tipo: 'adulto',
                    rol: document.getElementById('a_rol').value,
                    qrDataURL: qrDataURL,
                    fotoURL: fotoAdultoURL,
                    datosMedicos: datosMedAdu,
                    datosAlim: datosAlimAdu,
                    fichaURL: fichaAdultoURL
                })})
            });
        } catch(e) { console.warn('EmailJS:', e); }

        mostrarExito(codigo_qr, nombre, 'adulto');

        // ── WhatsApp: confirmación automática de inscripción ──
        const telNormA = WA.normalizar(telefono);
        if (telNormA) {
            const cuerpoWA = `✅ Tu inscripción como *${document.getElementById('a_rol').value}* en "${eventoSel.nombre}" ha sido recibida.\n\nTu código de acceso: *${codigo_qr}*\n\nPresenta el QR al ingresar al evento. ¡Gracias por ser parte del equipo! 🍀`;
            WA.enviar(telNormA, nombre.split(' ')[0], cuerpoWA).catch(() => {});
        }
    };

    function generarCodigo() {
        return 'GSS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2,5).toUpperCase();
    }

    // ── EMAIL HTML — con QR embebido como imagen + logo del grupo ──
