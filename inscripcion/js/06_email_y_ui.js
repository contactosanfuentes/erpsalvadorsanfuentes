    function emailHTML(opts) {
        const { nombre, codigo, evento, eventoFecha, eventoLugar, tipo, rol, qrDataURL, fotoURL, datosMedicos, datosAlim, fichaURL } = opts;
        const tipoLabel = tipo === 'patrulla' ? 'participante' : 'adulto / staff';
        const fechaStr = eventoFecha
            ? new Date(eventoFecha + 'T12:00:00').toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
            : 'Fecha por confirmar';
        const lugarStr = eventoLugar || '';
        const fotoBlock = fotoURL
            ? `<img src="${fotoURL}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2);margin-bottom:8px" alt="">`
            : '';
        const rolBlock = rol ? `<p style="margin:4px 0 0;font-size:0.85rem;color:#0E2586;font-weight:600">Rol: ${rol}</p>` : '';

        // ── Bloque resumen médico (solo si hay datos) ──
        let medicoBlock = '';
        if (datosMedicos && Object.values(datosMedicos).some(v => v)) {
            const items = [];
            if (datosMedicos.sangre) items.push(`<strong>Grupo sanguíneo:</strong> ${datosMedicos.sangre}`);
            if (datosMedicos.prevision) items.push(`<strong>Previsión:</strong> ${datosMedicos.prevision}`);
            if (datosMedicos.alergias) items.push(`<strong>Alergias:</strong> ${datosMedicos.alergias}`);
            if (datosMedicos.medicamentos) items.push(`<strong>Medicamentos:</strong> ${datosMedicos.medicamentos}`);
            if (datosMedicos.condiciones) items.push(`<strong>Condiciones:</strong> ${datosMedicos.condiciones}`);
            if (datosMedicos.emergencia) items.push(`<strong>Contacto emergencia:</strong> ${datosMedicos.emergencia}`);
            if (fichaURL) items.push(`<strong>Ficha médica:</strong> <a href="${fichaURL}" style="color:#dc2626">Ver archivo adjunto</a>`);
            if (items.length) {
                medicoBlock = `
                    <div style="padding:0 24px 12px">
                        <div style="background:#fff5f5;border-left:4px solid #dc2626;border-radius:9px;padding:13px 15px">
                            <p style="margin:0 0 7px;font-size:0.76rem;color:#991b1b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">⚕ Ficha médica registrada</p>
                            ${items.map(it => `<p style="margin:3px 0;font-size:0.82rem;color:#7f1d1d">${it}</p>`).join('')}
                        </div>
                    </div>`;
            }
        }

        // ── Bloque preferencias alimentarias ──
        let alimBlock = '';
        if (datosAlim && datosAlim.length) {
            alimBlock = `
                <div style="padding:0 24px 12px">
                    <div style="background:#fffbeb;border-left:4px solid #d97706;border-radius:9px;padding:13px 15px">
                        <p style="margin:0 0 7px;font-size:0.76rem;color:#78350f;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">🍽 Preferencias alimentarias</p>
                        <p style="margin:0;font-size:0.85rem;color:#78350f">${datosAlim.join(' · ')}</p>
                    </div>
                </div>`;
        }

        return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f4f7f9;font-family:Arial,Helvetica,sans-serif">
            <div style="max-width:560px;margin:auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 22px rgba(0,0,0,0.1)">

                <!-- HEADER con logo del grupo -->
                <div style="background:linear-gradient(135deg,#0E2586,#1a36a8);padding:28px 24px;text-align:center;color:white">
                    <img src="https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/payment-receipts/insignias/11u9rUD.png" style="width:80px;height:auto;margin-bottom:10px;filter:brightness(0) invert(1)" alt="Logo Grupo Scout">
                    <h2 style="margin:0;font-size:1.25rem;font-weight:700">Grupo Guías y Scouts</h2>
                    <p style="margin:3px 0 0;font-size:0.92rem;opacity:0.92;font-weight:600">Salvador Sanfuentes</p>
                </div>

                <!-- DATOS DE LA INSCRIPCIÓN -->
                <div style="padding:26px 24px 20px;text-align:center;background:linear-gradient(180deg,#f8fafc 0%,white 100%)">
                    ${fotoBlock}
                    <h3 style="margin:0;font-size:1.1rem;color:#0E2586;font-weight:700">${nombre}</h3>
                    <p style="margin:4px 0 0;font-size:0.85rem;color:#64748b">Inscripción como ${tipoLabel}</p>
                    ${rolBlock}
                </div>

                <!-- EVENTO -->
                <div style="padding:0 24px 18px;text-align:center">
                    <div style="background:#eef3ff;border-radius:11px;padding:14px 16px;margin-bottom:6px">
                        <p style="margin:0;font-size:0.8rem;color:#1a36a8;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Evento</p>
                        <p style="margin:4px 0 0;font-size:1.05rem;color:#0E2586;font-weight:700">${evento}</p>
                        <p style="margin:6px 0 0;font-size:0.85rem;color:#475569">📅 ${fechaStr}</p>
                        ${lugarStr ? `<p style="margin:3px 0 0;font-size:0.85rem;color:#475569">📍 ${lugarStr}</p>` : ''}
                    </div>
                </div>

                <!-- QR EMBEBIDO -->
                <div style="padding:0 24px 18px;text-align:center">
                    <div style="background:white;border:2px solid #e2e8f0;border-radius:14px;padding:18px;display:inline-block">
                        <p style="margin:0 0 10px;font-size:0.78rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Tu código QR de acceso</p>
                        ${qrDataURL ? `<img src="${qrDataURL}" alt="Código QR" style="width:200px;height:200px;display:block;margin:0 auto">` : ''}
                        <p style="margin:10px 0 0;font-family:monospace;font-size:1rem;font-weight:700;letter-spacing:3px;color:#0E2586;background:#f4f7f9;padding:7px 14px;border-radius:6px;display:inline-block">${codigo}</p>
                    </div>
                </div>

                ${medicoBlock}
                ${alimBlock}

                <!-- INSTRUCCIONES -->
                <div style="background:#fffbeb;border-top:1px solid #fde68a;padding:16px 24px">
                    <p style="margin:0;font-size:0.85rem;color:#92400e;line-height:1.6">
                        <strong>⏳ Tu inscripción está pendiente de confirmación.</strong><br>
                        Presenta este código QR al llegar al evento. Un dirigente lo escaneará para confirmar tu participación.
                    </p>
                </div>

                <!-- FOOTER -->
                <div style="background:#0E2586;padding:14px 24px;text-align:center">
                    <p style="margin:0;font-size:0.78rem;color:rgba(255,255,255,0.85)">Grupo Guías y Scouts Salvador Sanfuentes</p>
                    <p style="margin:3px 0 0;font-size:0.72rem;color:rgba(255,255,255,0.6)">Este correo fue generado automáticamente desde el ERP Scout.</p>
                </div>
            </div>
        
</body></html>`;
    }

    function mostrarExito(codigo, nombre, tipo) {
        document.getElementById('selectorCard').style.display = 'none';
        document.getElementById('tipoCard').style.display = 'none';
        document.getElementById('formJoven').style.display = 'none';
        document.getElementById('formAdulto').style.display = 'none';

        const ss = document.getElementById('successScreen');
        ss.classList.add('show');
        document.getElementById('ticketCode').textContent = codigo;

        // QR codifica el código + tipo + evento_id para que el escáner sepa qué tabla consultar
        new QRCode(document.getElementById('qrcode'), {
            text: JSON.stringify({ codigo_qr: codigo, evento_id: eventoSel.id, tipo, nombre }),
            width: 200, height: 200,
            colorDark:'#0E2586', colorLight:'#ffffff', correctLevel: QRCode.CorrectLevel.H
        });
        ss.scrollIntoView({ behavior:'smooth' });
    }

    function alertaJov(msg) { document.getElementById('alertJov').innerHTML = `<div class="alert error"><i class="fas fa-circle-exclamation"></i>${msg}</div>`; }
    function alertaAdu(msg) { document.getElementById('alertAdu').innerHTML = `<div class="alert error"><i class="fas fa-circle-exclamation"></i>${msg}</div>`; }
    function showLoading(m) { document.getElementById('loadMsg').textContent = m; document.getElementById('loadingOverlay').classList.add('show'); }
    function hideLoading() { document.getElementById('loadingOverlay').classList.remove('show'); }

