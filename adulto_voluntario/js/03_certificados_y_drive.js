        window.generarCertificadoAdulto = async function(adultoId) {
            const adulto = window.padronAdultos.find(a => a.id === adultoId);
            if (!adulto) return;

            const tipos = [
                { key: 'FORMACIÓN',     label: `Formación — Nivel ${adulto.nivel_formacion}` },
                { key: 'COMPROMISO',    label: 'Compromiso PPF' },
                { key: 'RECONOCIMIENTO',label: 'Reconocimiento / Servicio' },
            ];
            const sel = prompt(`¿Qué tipo de certificado generar para ${adulto.nombreCompleto}?\n\n${tipos.map((t,i)=>`${i+1}. ${t.label}`).join('\n')}\n\nEscribe el número:`);
            if (!sel) return;

            const tipo = tipos[parseInt(sel)-1] || tipos[0];
            const detalles = {
                'FORMACIÓN':      { detalle: `Por haber completado el Nivel de Formación ${adulto.nivel_formacion} del Programa de Formación de Personas (PPF)`, subdetalle: 'En reconocimiento a su compromiso con el Movimiento Scout' },
                'COMPROMISO':     { detalle: 'Por haber suscrito y cumplido su Acuerdo de Programa de la Persona (APP)', subdetalle: adulto.etapa_ppf ? `Etapa PPF: ${adulto.etapa_ppf}` : 'Demostrando sus valores Guía-Scout' },
                'RECONOCIMIENTO': { detalle: `En reconocimiento a su servicio voluntario como ${(adulto.roles||['Dirigente']).join(' / ')}`, subdetalle: `Unidad: ${adulto.unidad_rol || ''}` }
            };
            const det = detalles[tipo.key];
            const datosCert = {
                titulo: tipo.key === 'RECONOCIMIENTO' ? 'DE RECONOCIMIENTO' : `DE ${tipo.key}`,
                nombre: adulto.nombreCompleto,
                unidad: adulto.unidad_rol || 'Adulto Voluntario',
                detalle: det.detalle,
                subdetalle: det.subdetalle,
                nombreArchivo: `Cert_${tipo.key.replace(/[^a-zA-Z0-9]/g,'_')}_${(adulto.apellidos||'').replace(/[^a-zA-Z0-9]/g,'_')}`
            };

            try {
                window.mostrarNotificacion('info', 'Generando certificado...');
                if (adulto.email) {
                    // Tiene correo → genera, sube a Drive Y envía correo
                    await Certificados.generarYEnviar(
                        datosCert, window.supabaseClient, 'adultos',
                        adulto.email,
                        `📜 Tu certificado: ${datosCert.titulo} — Grupo Scout Salvador Sanfuentes`
                    );
                    window.mostrarNotificacion('exito', `✅ Certificado guardado en Drive y enviado a ${adulto.email}.`);
                } else {
                    // Sin correo → solo Drive
                    await Certificados.generarYSubir(datosCert, window.supabaseClient, 'adultos');
                    window.mostrarNotificacion('exito', '✅ Certificado guardado en Drive.');
                }
            } catch(err) {
                console.error('Error certificado adulto:', err);
                window.mostrarNotificacion('error', 'No se pudo generar: ' + err.message);
            }
        };

        window.mostrarNotificacion = function(t, m) { const c=document.getElementById('toast-container'); const x=document.createElement('div'); x.className='toast'; let col=t==='exito'?'#10b981':t==='info'?'#3b82f6':'#ef4444'; x.style.borderLeftColor=col; x.innerHTML=`<div class="bg-white rounded-full p-1.5 shadow-sm border"><i class="fas fa-check-circle" style="color:${col}; font-size:1.5rem;"></i></div><span style="flex:1;">${m}</span><button onclick="this.parentElement.remove()" style="background:none; border:none; cursor:pointer; color:#94a3b8; font-size:1.2rem;"><i class="fas fa-times"></i></button>`; c.appendChild(x); setTimeout(()=>x.remove(),5000); };

        // ===== SUBIR CERTIFICADO A GOOGLE DRIVE =====
        window.subirCertificadoDrive = function(certId, adultoId, labelCert, nombreAdulto) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
            input.onchange = async function() {
                const file = input.files[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) { window.mostrarNotificacion('error', 'El archivo no puede superar 10 MB.'); return; }

                const campoInput = document.getElementById('ea-cert-' + certId);
                const btn = campoInput ? campoInput.parentElement.querySelector('.btn-subir-cert') : null;
                const btnHtmlOriginal = btn ? btn.innerHTML : '';
                if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true; }

                try {
                    window.mostrarNotificacion('info', 'Subiendo certificado a Drive...');
                    // Leer archivo como base64
                    const base64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result.split(',')[1]);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });

                    // Nombre descriptivo del archivo
                    const ext = file.name.split('.').pop();
                    const nombreLimpio = (nombreAdulto || 'adulto').replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');
                    const nombreArchivo = `Cert_${labelCert.replace(/[^a-zA-Z0-9]/g, '')}_${nombreLimpio}.${ext}`;

                    // Subir a la carpeta de adultos/dirigentes
                    const resultado = await window.DriveHelper.subir({
                        supabaseClient: window.supabaseClient,
                        nombre: nombreArchivo,
                        base64: base64,
                        mimeType: file.type || 'application/pdf',
                        claveCarpeta: 'adultos'
                    });

                    if (resultado.ok && resultado.link) {
                        if (campoInput) campoInput.value = resultado.link;
                        window.mostrarNotificacion('exito', 'Certificado subido. El enlace se completó automáticamente.');
                    } else {
                        throw new Error(resultado.error || 'Error desconocido');
                    }
                } catch (err) {
                    console.error('Error subiendo certificado:', err);
                    window.mostrarNotificacion('error', 'No se pudo subir: ' + err.message);
                } finally {
                    if (btn) { btn.innerHTML = btnHtmlOriginal; btn.disabled = false; }
                }
            };
            input.click();
        };

