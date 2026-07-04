        function abrirModalCorreo(e, n) {
            if (!e || !e.includes('@')) {
                mostrarNotificacion('error', `${n} no tiene email registrado.`);
                return;
            }
            document.getElementById('correo-destinatario-email').value = e;
            document.getElementById('correo-destinatario-label').innerText = `${n} (${e})`;
            document.getElementById('modal-correo').classList.add('active');
        }
        function cerrarModalCorreo() { document.getElementById('modal-correo').classList.remove('active'); }
        async function enviarCorreoInterno() {
            const email = document.getElementById('correo-destinatario-email').value.trim();
            const asunto = document.getElementById('correo-asunto').value.trim();
            const mensaje = document.getElementById('correo-mensaje').value.trim();
            const nombre = document.getElementById('correo-destinatario-label').innerText.split(' (')[0];
            if (!email || !email.includes('@')) return mostrarNotificacion('error', 'Email destinatario inválido o vacío.');
            if (!asunto || !mensaje) return mostrarNotificacion('error', 'Escribe asunto y mensaje.');

            const btn = document.getElementById('btn-enviar-correo-interno');
            btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            const html = `<!DOCTYPE html><html><body style="margin:0;padding:26px;background:#f4f7f9;font-family:Arial,sans-serif"><div style="max-width:520px;margin:auto;background:white;border-radius:13px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)"><div style="background:linear-gradient(135deg,#0E2586,#1a36a8);padding:20px;text-align:center"><img src="https://i.imgur.com/11u9rUD.png" style="height:42px;margin-bottom:7px"><p style="color:rgba(255,255,255,0.8);font-size:0.8rem;margin:0">Grupo Guías y Scouts Salvador Sanfuentes</p></div><div style="padding:24px;font-size:0.88rem;line-height:1.8;color:#2d3748"><p>Hola <strong>${nombre}</strong>,</p><p>${mensaje.replace(/\n/g,'<br>')}</p><p style="margin-top:20px;color:#718096;font-size:0.82rem">Saludos,<br><strong style="color:#0E2586">Grupo Guías y Scouts Salvador Sanfuentes</strong></p></div><div style="background:#f8fafc;padding:10px 20px;font-size:0.74rem;color:#718096;text-align:center;border-top:1px solid #e2e8f0">Enviado con ERP Scout · Grupo Salvador Sanfuentes</div></div></body></html>`;

            try {
                const resp = await fetch('https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to_email: email, subject: asunto, html_content: html })
                });
                if (resp.ok) {
                    mostrarNotificacion('exito', `Correo enviado a ${email}`);
                    cerrarModalCorreo();
                    document.getElementById('correo-asunto').value = '';
                    document.getElementById('correo-mensaje').value = '';
                } else {
                    mostrarNotificacion('error', 'Error al enviar el correo. Intenta nuevamente.');
                }
            } catch(e) {
                mostrarNotificacion('error', 'Error de conexión al enviar el correo.');
            }
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Correo';
        }

        function copiarTelefonosMasivos() {
            const list = document.querySelectorAll('.row-checkbox:checked').length > 0 ? personasFiltradasCache.filter(p => document.querySelector(`.row-checkbox[value="${p.tipo}-${p.id}"]`).checked) : personasFiltradasCache;
            const tels = list.map(p => p.contactoRaw).filter(t => t).join(', '); navigator.clipboard.writeText(tels); mostrarNotificacion('exito', 'Teléfonos copiados.');
        }

        function copiarCorreosMasivos() {
            const list = document.querySelectorAll('.row-checkbox:checked').length > 0 ? personasFiltradasCache.filter(p => document.querySelector(`.row-checkbox[value="${p.tipo}-${p.id}"]`).checked) : personasFiltradasCache;
            const mails = list.map(p => p.email).filter(e => e).join(', '); navigator.clipboard.writeText(mails); mostrarNotificacion('exito', 'Correos copiados.');
        }

        function exportarCSV() {
            const headers = ['TIPO','NOMBRE','RAMA','EDAD','ESTADO','TELEFONO','EMAIL'];
            const list = document.querySelectorAll('.row-checkbox:checked').length > 0 ? personasFiltradasCache.filter(p => document.querySelector(`.row-checkbox[value="${p.tipo}-${p.id}"]`).checked) : personasFiltradasCache;
            const rows = list.map(p => `"${p.tipo}","${p.nombre}","${p.rama}","${p.edad}","${p.estadoInstitucional}","${p.contactoRaw}","${p.email}"`);
            const csv = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + "\n" + rows.join("\n");
            const link = document.createElement("a"); link.href = encodeURI(csv); link.download = "directorio_scout.csv"; link.click();
        }

        function imprimirDirectorio() { window.print(); }

        async function enviarWhatsAppMasivo() {
            const list = document.querySelectorAll('.row-checkbox:checked').length > 0
                ? personasFiltradasCache.filter(p => document.querySelector(`.row-checkbox[value="${p.tipo}-${p.id}"]`)?.checked)
                : personasFiltradasCache;

            const conTel = list.filter(p => p.contactoRaw);
            if (!conTel.length) return mostrarNotificacion('error', 'Ningún registro con teléfono en la lista actual.');

            const mensaje = prompt(`Mensaje a enviar por WhatsApp a ${conTel.length} persona(s):\n(Se usará la plantilla del grupo. Escribe el cuerpo del mensaje:)`);
            if (!mensaje) return;

            if (!confirm(`¿Enviar WhatsApp a ${conTel.length} persona(s)?`)) return;

            const btn = document.getElementById('btn-wa-masivo');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            let ok = 0, err = 0;
            for (const p of conTel) {
                const nombre = p.nombre.split(' ')[0];
                const res = await WA.enviar(p.contactoRaw, nombre, mensaje);
                if (res.ok) ok++; else err++;
                await new Promise(r => setTimeout(r, 220));
            }

            btn.disabled = false;
            btn.innerHTML = '<i class="fab fa-whatsapp"></i> Enviar WhatsApp';
            mostrarNotificacion('exito', `WhatsApp: ${ok} enviados${err ? `, ${err} con error` : ''}.`);
        }

        function mostrarNotificacion(t, m) {
            const toast = document.createElement('div'); toast.className = 'toast'; toast.style.borderLeft = `5px solid ${t==='exito'?'#10b981':'#ef4444'}`; toast.innerText = m;
            document.getElementById('toast-container').appendChild(toast); setTimeout(() => toast.remove(), 4000);
        }

