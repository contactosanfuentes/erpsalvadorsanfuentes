        window.guardarEdicionAdulto = async function(event) {
            if (!window.currentEditAdultoId) return;

            // ── Verificar modo de acceso ──────────────────────────────────────
            const a = window.padronAdultos.find(x => x.id === window.currentEditAdultoId);
            const miEmail  = Permisos.listo() ? (Permisos.perfil()?.email || '') : '';
            const nivel    = Permisos.listo() ? Permisos.nivel() : 5;
            const esPropio = !!miEmail && (a?.email?.toLowerCase() === miEmail.toLowerCase());
            const esAdmin  = nivel >= 4;
            const esAsesorado = Permisos.listo() && Permisos.esAsesorDe && Permisos.esAsesorDe(window.currentEditAdultoId);

            // Perfil propio de dirigente → no puede guardar nada
            if (!esAdmin && esPropio) {
                window.mostrarNotificacion('error', 'No puedes editar tu propio perfil. Contacta al administrador.');
                return;
            }
            // ──────────────────────────────────────────────────────────────────

            const getVal = (tr, sel) => { const el = tr.querySelector(sel); return (el && el.style.display !== 'none') ? el.value.trim() : ''; };
            const compRows = Array.from(document.querySelectorAll('#tbody-competencias tr')).map(tr => ({ competencia: getVal(tr,'.c-comp'), nivel_comp: getVal(tr,'.c-niv'), comportamiento: getVal(tr,'.c-beh'), accion: getVal(tr,'.c-acc'), plazo: getVal(tr,'.c-pla') })).filter(r => r.competencia);
            const rutaRows = Array.from(document.querySelectorAll('#tbody-ruta tr')).map(tr => ({ competencia: getVal(tr,'.r-comp'), nivel_comp: getVal(tr,'.r-niv'), comportamiento: getVal(tr,'.r-beh'), diagnostico: getVal(tr,'.r-diag'), resultados: getVal(tr,'.r-res'), experiencia: getVal(tr,'.r-exp'), plazo: getVal(tr,'.r-plazo') })).filter(r => r.competencia);
            const segRows = Array.from(document.querySelectorAll('#tbody-seguimiento tr')).map(tr => ({ competencia: getVal(tr,'.s-comp'), nivel_comp: getVal(tr,'.s-niv'), comportamiento: getVal(tr,'.s-beh'), actividad: getVal(tr,'.s-act'), entidad: getVal(tr,'.s-ent'), fecha: getVal(tr,'.s-fec'), comentarios: getVal(tr,'.s-com') })).filter(r => r.competencia);

            // ── Para AP (asesorado): solo guardar campos PPF ──────────────────
            let payload;
            if (!esAdmin && esAsesorado && !esPropio) {
                payload = {
                    etapa_ppf: document.getElementById('ea-etapa-ppf')?.value || a.etapa_ppf,
                    compromiso_formacion: document.getElementById('ea-c-form')?.value.trim() || '',
                    compromiso_unidad: document.getElementById('ea-c-uni')?.value.trim() || '',
                    compromiso_asistencia: document.getElementById('ea-c-asis')?.value.trim() || '',
                    compromiso_ap: document.getElementById('ea-c-ap')?.value.trim() || '',
                    compromiso_ppf: document.getElementById('ea-c-ppf')?.value.trim() || '',
                    compromiso_evaluacion: document.getElementById('ea-c-eval')?.value.trim() || '',
                    compromiso_otros: document.getElementById('ea-c-otros')?.value.trim() || '',
                    ppf_competencias: compRows,
                    ppf_ruta_aprendizaje: rutaRows,
                    ppf_seguimiento: segRows
                };
            } else {
                // Admin/coordinación: guardar todo
                const funcRows = Array.from(document.querySelectorAll('#tbody-funciones tr')).map(tr => ({ funcion: getVal(tr,'.f-fun'), tarea: getVal(tr,'.f-tar') })).filter(r => r.funcion);
                const acontRows = Array.from(document.querySelectorAll('#tbody-acont tr')).map(tr => ({ criterio: getVal(tr,'.ac-crit'), nivel_comp: getVal(tr,'.ac-niv'), comportamiento: getVal(tr,'.ac-beh'), acciones: getVal(tr,'.ac-acc') })).filter(r => r.criterio);
                const condRows = Array.from(document.querySelectorAll('#tbody-cond tr')).map(tr => ({ criterio: getVal(tr,'.co-crit'), nivel_comp: getVal(tr,'.co-niv'), comportamiento: getVal(tr,'.co-beh'), calificacion: getVal(tr,'.co-cal'), observaciones: getVal(tr,'.co-obs') })).filter(r => r.criterio);
                const starRows = Array.from(document.querySelectorAll('#tbody-star tr')).map(tr => ({ criterio: getVal(tr,'.st-crit'), nivel_comp: getVal(tr,'.st-niv'), comportamiento: getVal(tr,'.st-beh'), situacion: getVal(tr,'.st-sit'), accion: getVal(tr,'.st-acc'), resultado: getVal(tr,'.st-res') })).filter(r => r.criterio);
                const certificados_formacion = {
                    ingreso: document.getElementById('ea-cert-ingreso')?.value.trim() || '',
                    basico:  document.getElementById('ea-cert-basico')?.value.trim()  || '',
                    medio:   document.getElementById('ea-cert-medio')?.value.trim()   || '',
                    avanzado:document.getElementById('ea-cert-avanzado')?.value.trim()|| '',
                    im3:     document.getElementById('ea-cert-im3')?.value.trim()     || '',
                    im4:     document.getElementById('ea-cert-im4')?.value.trim()     || ''
                };
                payload = {
                    nombres: document.getElementById('ea-nombres').value.trim(), apellidos: document.getElementById('ea-apellidos').value.trim(),
                    fecha_nacimiento: document.getElementById('ea-fnac').value || null, nacionalidad: document.getElementById('ea-nac').value.trim(),
                    profesion: document.getElementById('ea-prof').value.trim(), domicilio: document.getElementById('ea-dom').value.trim(),
                    telefono: document.getElementById('ea-tel').value.trim(), email: document.getElementById('ea-email').value.trim(),
                    emergencia_nombre: document.getElementById('ea-em-nom').value.trim(), emergencia_parentesco: document.getElementById('ea-em-par').value.trim(),
                    emergencia_telefono: document.getElementById('ea-em-tel').value.trim(), prevision_salud: document.getElementById('ea-prev').value,
                    isapre_nombre: document.getElementById('ea-isa').value.trim(), grupo_sanguineo: document.getElementById('ea-sangre').value,
                    alergias: document.getElementById('ea-aler').value.split(',').map(s=>s.trim()).filter(s=>s),
                    fase_ciclo_vida: document.getElementById('ea-fase-ciclo').value, etapa_ppf: document.getElementById('ea-etapa-ppf').value,
                    ap_nombre: document.getElementById('ea-ap').value.trim(), apf_nombre: document.getElementById('ea-apf').value.trim(),
                    compromiso_formacion: document.getElementById('ea-c-form').value.trim(), compromiso_unidad: document.getElementById('ea-c-uni').value.trim(),
                    compromiso_asistencia: document.getElementById('ea-c-asis').value.trim(), compromiso_ap: document.getElementById('ea-c-ap').value.trim(),
                    compromiso_ppf: document.getElementById('ea-c-ppf').value.trim(), compromiso_evaluacion: document.getElementById('ea-c-eval').value.trim(),
                    compromiso_otros: document.getElementById('ea-c-otros').value.trim(), ppf_competencias: compRows, ppf_ruta_aprendizaje: rutaRows,
                    ppf_seguimiento: segRows, desempeno_funciones: funcRows, desempeno_acontecimientos: acontRows, desempeno_conductual: condRows,
                    desempeno_star: starRows, unidad_rol: document.getElementById('ea-uni-rol').value.trim(),
                    roles: document.getElementById('ea-cargo').value ? [document.getElementById('ea-cargo').value.trim()] : [],
                    nivel_formacion: document.getElementById('ea-niv-form').value, cuota_pagada: document.getElementById('ea-cuota').checked,
                    certificados_formacion: certificados_formacion
                };
            }
            // ──────────────────────────────────────────────────────────────────
            try {
                let btn = event.currentTarget; btn.dataset.originalText = btn.innerHTML; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...'; btn.disabled = true;
                const { error } = await window.supabaseClient.from('adultos_registros').update(payload).eq('id', window.currentEditAdultoId);
                if (error) throw error;
                const index = window.padronAdultos.findIndex(a => a.id === window.currentEditAdultoId);
                if (index !== -1) { Object.assign(window.padronAdultos[index], payload); window.padronAdultos[index].nombreCompleto = `${payload.nombres} ${payload.apellidos}`; window.renderAdultProfile(window.padronAdultos[index]); }
                window.cerrarModalEditarAdulto(); window.renderAdultList(); window.mostrarNotificacion('exito', 'Expediente actualizado en la BD.');

                // ── Si cambió el nivel de formación, generar certificado y enviarlo por correo ──
                const adultoActual = window.padronAdultos.find(a => a.id === window.currentEditAdultoId);
                if (adultoActual && payload.nivel_formacion !== 'Sin Formación' && 
                    adultoActual.nivel_formacion !== payload.nivel_formacion) {
                    try {
                        window.mostrarNotificacion('info', `Generando certificado de Nivel ${payload.nivel_formacion}...`);
                        const datosCertForm = {
                            titulo: 'DE FORMACIÓN',
                            nombre: `${payload.nombres} ${payload.apellidos}`.trim(),
                            unidad: payload.unidad_rol || 'Adulto Voluntario',
                            detalle: `Por haber completado el Nivel de Formación ${payload.nivel_formacion} del Programa de Formación de Personas (PPF)`,
                            subdetalle: 'En reconocimiento a su compromiso con el desarrollo del Movimiento Scout',
                            nombreArchivo: `Cert_Formacion_${payload.nivel_formacion}_${(payload.apellidos||'').replace(/[^a-zA-Z0-9]/g,'_')}`
                        };
                        const resDriveForm = await Certificados.generarYSubir(datosCertForm, window.supabaseClient, 'adultos');
                        const pdfFormCorreo = resDriveForm?.pdfBase64;
                        // Enviar certificado por correo al adulto si tiene email
                        const emailAdulto = payload.email || adultoActual.email;
                        if (emailAdulto && pdfFormCorreo && pdfFormCorreo.length > 500) {
                            const SUPA_EMAIL = 'https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email';
                            const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aXhtYXhob3h2YW1vZWN1YXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTg1NDMsImV4cCI6MjA4ODM3NDU0M30.ZLeJIWdip2f00h4TqkZH7eqMX4wpwphaqkJpAa0N0X4';
                            await fetch(SUPA_EMAIL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'apikey': SUPA_KEY },
                                body: JSON.stringify({
                                    to_email: emailAdulto,
                                    subject: `📜 Certificado de Formación — Nivel ${payload.nivel_formacion}`,
                                    html_content: `<h2>Certificado de Formación</h2><p>${datosCertForm.nombre} ha completado el <b>Nivel ${payload.nivel_formacion}</b> del Programa de Formación de Personas (PPF).</p><p>Adjunto el certificado oficial en PDF.</p><p>⚜ Grupo Guías y Scouts Salvador Sanfuentes</p>`,
                                    attachments: [{ filename: datosCertForm.nombreArchivo + '.pdf', content: pdfFormCorreo, type: 'application/pdf' }]
                                })
                            });
                            window.mostrarNotificacion('exito', `✅ Certificado de Nivel ${payload.nivel_formacion} guardado en Drive y enviado a ${emailAdulto}.`);
                        } else {
                            window.mostrarNotificacion('exito', `✅ Certificado de Nivel ${payload.nivel_formacion} guardado en Drive.`);
                        }
                    } catch(err) { console.error('Error cert formación:', err); }
                }
                btn.disabled = false; btn.innerHTML = btn.dataset.originalText;

                // ── Notificaciones por correo (máx 1 vez por dirigente por día, guardado en Supabase) ──
                const CC_ADMINS = 'responsable@salvadorsanfuentes.org,asistente@salvadorsanfuentes.org,guiasyscouts@salvadorsanfuentes.org';
                const { data: notifExiste } = await window.supabaseClient
                    .from('notificaciones_enviadas')
                    .select('id')
                    .eq('tipo', 'expediente_adulto')
                    .eq('referencia_id', String(window.currentEditAdultoId))
                    .eq('fecha', new Date().toISOString().slice(0,10))
                    .maybeSingle();
                if (notifExiste) {
                    // Ya se notificó hoy — no repetir
                } else {
                    await window.supabaseClient.from('notificaciones_enviadas').insert({
                        tipo: 'expediente_adulto',
                        referencia_id: String(window.currentEditAdultoId),
                        fecha: new Date().toISOString().slice(0,10)
                    }).then(() => {});
                const nombreCompleto = `${payload.nombres} ${payload.apellidos}`;
                const fecha = new Date().toLocaleString('es-CL');
                const htmlBase = (titulo, intro) => `<!DOCTYPE html><html><body style="margin:0;padding:26px;background:#f4f7f9;font-family:Arial,sans-serif"><div style="max-width:520px;margin:auto;background:white;border-radius:13px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08)"><div style="background:linear-gradient(135deg,#0E2586,#1a36a8);padding:20px;text-align:center"><img src="https://i.imgur.com/11u9rUD.png" style="height:42px;margin-bottom:7px"><p style="color:rgba(255,255,255,0.8);font-size:0.8rem;margin:0">Grupo Guías y Scouts Salvador Sanfuentes</p></div><div style="padding:24px;font-size:0.88rem;line-height:1.8;color:#2d3748"><h3 style="color:#0E2586;margin-top:0">${titulo}</h3>${intro}<table style="width:100%;border-collapse:collapse;margin-top:12px"><tr style="background:#f0f4ff"><td style="padding:8px;font-weight:bold">Nombre</td><td style="padding:8px">${nombreCompleto}</td></tr><tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">${payload.email||'No registrado'}</td></tr><tr style="background:#f0f4ff"><td style="padding:8px;font-weight:bold">Teléfono</td><td style="padding:8px">${payload.telefono||'No registrado'}</td></tr><tr><td style="padding:8px;font-weight:bold">Unidad / Rol</td><td style="padding:8px">${payload.unidad_rol||'No especificado'}</td></tr><tr style="background:#f0f4ff"><td style="padding:8px;font-weight:bold">Nivel formación</td><td style="padding:8px">${payload.nivel_formacion||'No especificado'}</td></tr></table><p style="margin-top:20px;color:#718096;font-size:0.82rem">Actualizado el ${fecha}<br><strong style="color:#0E2586">ERP Scout · Grupo Salvador Sanfuentes</strong></p></div></div>

</body></html>`;

                // 1. Correo al propio dirigente
                if (payload.email) {
                    fetch('https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email', {method:'POST',headers:{'Content-Type':'application/json','apikey':'sb_publishable_JW9Y4kz_Wiy6e1E1KdzAyQ_PBbWUf6t'},body:JSON.stringify({
                        to_email: payload.email,
                        subject: `✅ Tu expediente ha sido actualizado — ${nombreCompleto}`,
                        html_content: htmlBase('Expediente actualizado', `<p>Hola <strong>${payload.nombres}</strong>, confirmamos que tu expediente de dirigente ha sido actualizado correctamente en el sistema.</p>`)
                    })}).catch(() => {});
                }

                // 2. Correo a los administradores
                fetch('https://hyixmaxhoxvamoecuars.supabase.co/functions/v1/send-email', {method:'POST',headers:{'Content-Type':'application/json','apikey':'sb_publishable_JW9Y4kz_Wiy6e1E1KdzAyQ_PBbWUf6t'},body:JSON.stringify({
                    to_email: CC_ADMINS,
                    subject: `📋 Expediente modificado — ${nombreCompleto}`,
                    html_content: htmlBase('Expediente de dirigente modificado', `<p>Se ha actualizado el expediente del siguiente dirigente en el sistema ERP Scout.</p>`)
                })}).catch(() => {});
                } // fin else throttle
            } catch (e) { console.error(e); window.mostrarNotificacion('error', 'Error al guardar los datos.'); if(btn) { btn.disabled = false; btn.innerHTML = btn.dataset.originalText; } }
        };

        // ================= REPORTE PDF MEJORADO =================
        // ── Helper: construye el HTML del expediente ──
