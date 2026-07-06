    function normalizarTelefono(tel){
        if(!tel) return null;
        // Limpiar todo lo que no sea dígito
        const digits = tel.replace(/\D/g, '');
        // Si ya tiene código de país
        if(digits.startsWith('569') && digits.length === 11) return '+' + digits;
        if(digits.startsWith('56') && digits.length === 11) return '+' + digits;
        // Teléfono chileno sin código: 9XXXXXXXX (9 dígitos)
        if(digits.startsWith('9') && digits.length === 9) return '+56' + digits;
        // 8 dígitos (fijo) → agregar 56
        if(digits.length === 8) return '+562' + digits;
        // Si tiene código de otro país
        if(digits.length >= 10) return '+' + digits;
        return null;
    }

    // Reemplazar variables del template con datos del contacto
    function resolverVars(plantillaVars, contacto){
        return plantillaVars.split(',').map(v => {
            const t = v.trim();
            return t
                .replace(/\{nombre\}/g, contacto.nombre ? contacto.nombre.split(' ')[0] : '')
                .replace(/\{unidad\}/g, contacto.unidad || '')
                .replace(/\{fecha\}/g, new Date().toLocaleDateString('es-CL'));
        });
    }

    // Enviar WhatsApp usando WA.enviar() de wa_api.js → Supabase wa-proxy
    async function enviarMensajeWA(telefono, vars){
        if(!waConfig.tplName){
            throw new Error('No hay plantilla configurada. Haz clic en ⚙ para configurar.');
        }
        const nombre = vars[0] || '';
        const cuerpo = vars.slice(1).join(' ') || '';
        const res = await WA.enviar(telefono, nombre, cuerpo);
        if(!res.ok) throw new Error(res.error || 'Error al enviar WhatsApp');
        return res;
    }

    // Obtener teléfono del contacto desde las tablas Supabase
    async function obtenerTelefonoContacto(contacto){
        // Buscar en adultos_registros por email
        try {
            const {data:a} = await db.from('adultos_registros').select('telefono').eq('email', contacto.email).maybeSingle();
            if(a?.telefono) return normalizarTelefono(a.telefono);
        } catch(e){}
        // Buscar en mmbb_registrations por email de apoderado
        try {
            const {data:j} = await db.from('mmbb_registrations').select('apoderado_titular_telefono').eq('apoderado_titular_email', contacto.email).maybeSingle();
            if(j?.apoderado_titular_telefono) return normalizarTelefono(j.apoderado_titular_telefono);
        } catch(e){}
        return null;
    }

    window.enviarWhatsApp = async function(){
        // Validaciones previas
        if(WA_TOKEN === 'TU_TOKEN_PERMANENTE_AQUI'){
            document.getElementById('waConfigPanel').style.display = 'block';
            syncWAFields();
            alerta('⚠ Configura tu token de WhatsApp Business primero.', 'err');
            return;
        }
        if(!waConfig.tplName){
            document.getElementById('waConfigPanel').style.display = 'block';
            syncWAFields();
            alerta('⚠ Configura el nombre de la plantilla de Meta primero.', 'err');
            return;
        }
        const validos = contactos.filter(c => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email));
        if(!validos.length) return alerta('No hay destinatarios seleccionados.', 'err');

        if(!confirm(`¿Enviar mensaje de WhatsApp a hasta ${validos.length} contactos?\n\nSe usará la plantilla "${waConfig.tplName}".\n\nNota: Solo se enviará a quienes tengan teléfono registrado.`)) return;

        const btnWA = document.getElementById('btnWA');
        btnWA.disabled = true;
        const progEl = document.getElementById('progWA');
        progEl.style.display = 'block';
        const logWA = document.getElementById('plogWA');
        const barWA = document.getElementById('pbWA');
        logWA.innerHTML = '';
        let ok = 0, err = 0, sinTel = 0;
        const total = validos.length;

        for(const [i, contacto] of validos.entries()){
            const telefono = await obtenerTelefonoContacto(contacto);
            if(!telefono){
                sinTel++;
                logWA.innerHTML += `<span style="color:#f59e0b">⊘ ${contacto.nombre} — sin teléfono registrado</span><br>`;
                barWA.style.width = Math.round((i+1)/total*100) + '%';
                logWA.scrollTop = logWA.scrollHeight;
                continue;
            }
            const vars = resolverVars(waConfig.tplVars, contacto);
            try {
                await enviarMensajeWA(telefono, vars);
                ok++;
                logWA.innerHTML += `<span style="color:#25D366">✓ ${contacto.nombre} (${telefono})</span><br>`;
            } catch(e) {
                err++;
                logWA.innerHTML += `<span style="color:var(--rojo)">✗ ${contacto.nombre} — ${e.message}</span><br>`;
            }
            barWA.style.width = Math.round((i+1)/total*100) + '%';
            logWA.scrollTop = logWA.scrollHeight;
            await new Promise(r => setTimeout(r, 200)); // Throttle para no superar límite de Meta
        }

        btnWA.disabled = false;
        const resumen = `WhatsApp: ${ok} enviados${err ? `, ${err} con error` : ''}${sinTel ? `, ${sinTel} sin teléfono` : ''}.`;
        alerta(resumen, ok > 0 ? 'ok' : 'err');
        await db.from('comunicaciones').insert({ asunto: document.getElementById('asunto').value.trim(), canal: 'whatsapp', total_enviados: ok, total_errores: err, total_sin_contacto: sinTel, destinatarios_count: validos.length }).catch(()=>{});
        cargarHistorial();
    };

    // ── ENVIAR AMBOS: email + WhatsApp con el mismo comunicado ──
    window.enviarAmbos = async function(){
        const asunto = document.getElementById('asunto').value.trim();
        const body = document.getElementById('editor').innerHTML.trim();
        if(!asunto) return alerta('Escribe un asunto.', 'err');
        if(!body || body === '<br>') return alerta('Escribe el mensaje.', 'err');
        const validos = contactos.filter(c => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email));
        if(!validos.length) return alerta('No hay destinatarios seleccionados.', 'err');
        if(!confirm(`¿Enviar por correo + WhatsApp a ${validos.length} destinatarios?\n\nCorreo: a todos con email válido.\nWhatsApp: solo a quienes tengan teléfono registrado.`)) return;

        const btnAmbos = document.getElementById('btnAmbos');
        const btnEnv = document.getElementById('btnEnv');
        const btnWA = document.getElementById('btnWA');
        btnAmbos.disabled = btnEnv.disabled = btnWA.disabled = true;

        const firma = document.getElementById('firma').value.trim();
        const saludo = document.getElementById('saludo').value;

        // Texto plano del editor para WhatsApp (sin HTML)
        const textoPlano = document.getElementById('editor').innerText.trim()
            .replace(/\n{3,}/g, '\n\n')
            .slice(0, 800);

        let okEmail = 0, errEmail = 0, okWA = 0, errWA = 0, sinTel = 0;

        document.getElementById('prog').classList.add('show');
        const log = document.getElementById('plog');
        const bar = document.getElementById('pb');
        log.innerHTML = '';

        for(const [i, c] of validos.entries()){
            const nombreCorto = c.nombre.split(' ')[0];

            // ── 1. Email ──
            const bp = body.replace(/\{nombre\}/g, nombreCorto).replace(/\{unidad\}/g, c.unidad||'').replace(/\{fecha\}/g, new Date().toLocaleDateString('es-CL'));
            const sp = saludo.replace('{nombre}', nombreCorto);
            const html = `<!DOCTYPE html><html><body style="margin:0;padding:26px;background:#f4f7f9;font-family:Poppins,sans-serif"><div style="max-width:500px;margin:auto;background:white;border-radius:13px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)"><div style="background:linear-gradient(135deg,#0E2586,#1a36a8);padding:20px;text-align:center"><img src="https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/11u9rUD.png" style="height:42px;margin-bottom:7px"><p style="color:rgba(255,255,255,0.8);font-size:0.8rem;margin:0">Grupo Guías y Scouts Salvador Sanfuentes</p></div><div style="padding:24px;font-size:0.88rem;line-height:1.8;color:#2d3748"><p><strong>${sp}</strong></p><br>${bp}<p style="margin-top:20px;color:#718096;font-size:0.82rem">Saludos,<br><strong style="color:#0E2586">${firma}</strong></p></div><div style="background:#f8fafc;padding:10px 20px;font-size:0.74rem;color:#718096;text-align:center;border-top:1px solid #e2e8f0">Enviado con ERP Scout · Grupo Salvador Sanfuentes</div></div></body></html>`;
            try {
                await fetch('https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({to_email: c.email, subject: asunto, html_content: html})});
                okEmail++;
                log.innerHTML += `<span style="color:var(--verde)">✉ ${c.nombre} — correo ✓</span><br>`;
            } catch(e) {
                errEmail++;
                log.innerHTML += `<span style="color:var(--rojo)">✉ ${c.nombre} — correo ✗</span><br>`;
            }

            // ── 2. WhatsApp ──
            const telefono = await obtenerTelefonoContacto(c);
            if(!telefono){
                sinTel++;
                log.innerHTML += `<span style="color:#f59e0b">📱 ${c.nombre} — sin teléfono</span><br>`;
            } else {
                const cuerpoWA = textoPlano.replace(/\{nombre\}/g, nombreCorto).replace(/\{unidad\}/g, c.unidad||'');
                const res = await WA.enviar(telefono, nombreCorto, cuerpoWA);
                if(res.ok){ okWA++; log.innerHTML += `<span style="color:#25D366">📱 ${c.nombre} — WhatsApp ✓</span><br>`; }
                else { errWA++; log.innerHTML += `<span style="color:var(--rojo)">📱 ${c.nombre} — WhatsApp ✗ ${res.error||''}</span><br>`; }
            }

            bar.style.width = Math.round((i+1)/validos.length*100) + '%';
            log.scrollTop = log.scrollHeight;
            await new Promise(r => setTimeout(r, 350));
        }

        btnAmbos.disabled = btnEnv.disabled = btnWA.disabled = false;
        alerta(`Completado — Correo: ${okEmail} enviados${errEmail ? `, ${errEmail} errores` : ''} | WhatsApp: ${okWA} enviados${errWA ? `, ${errWA} errores` : ''}${sinTel ? `, ${sinTel} sin teléfono` : ''}.`, 'ok');
        await db.from('comunicaciones').insert({ asunto: document.getElementById('asunto').value.trim(), canal: 'ambos', total_enviados: okEmail + okWA, total_errores: errEmail + errWA, total_sin_contacto: sinTel, destinatarios_count: validos.length }).catch(()=>{});
        cargarHistorial();
    };

    // Calcular cuántos contactos tienen WhatsApp (teléfono registrado) — se actualiza asíncronamente
    async function actualizarContadorWA(){
        const validos = contactos.filter(c => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email));
        // Estimación rápida: contar teléfonos en tabla adultos_registros
        let conTel = 0;
        try {
            const {count} = await db.from('adultos_registros').select('*', {count:'exact', head:true}).not('telefono', 'is', null);
            conTel += (count || 0);
        } catch(e){}
        try {
            const {count} = await db.from('mmbb_registrations').select('*', {count:'exact', head:true}).not('apoderado_titular_telefono', 'is', null);
            conTel += (count || 0);
        } catch(e){}
        document.getElementById('stWA').textContent = conTel;
    }

    // ════ Fin WhatsApp ════

    // ══════════════════════════════════════════════════
    // WHATSAPP INDIVIDUAL — Texto, Multimedia, Contactos
    // ══════════════════════════════════════════════════
