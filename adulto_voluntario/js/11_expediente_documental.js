        function buildExpedienteDoc(a, qrHtml) {
            const e = window.escapeHtml;
            const formatArray = (arr) => arr && arr.length ? arr.map(item => `<li>${e(item)}</li>`).join('') : '<li>No registrado</li>';
            
            const competenciasHtml = (a.ppf_competencias && a.ppf_competencias.length) ? 
                a.ppf_competencias.map(c => `<tr><td><strong>${e(c.competencia)}</strong><br><small>${e(c.nivel_comp)}</small></td><td>${e(c.comportamiento)}</td><td>${e(c.accion)}</td><td>${e(c.plazo)}</td></tr>`).join('') :
                '<tr><td colspan="4">No hay competencias registradas</td></tr>';
            
            const rutaHtml = (a.ppf_ruta_aprendizaje && a.ppf_ruta_aprendizaje.length) ?
                a.ppf_ruta_aprendizaje.map(r => `<tr><td><strong>${e(r.competencia)}</strong><br><small>${e(r.nivel_comp)}</small></td><td>${e(r.comportamiento)}</td><td>${e(r.diagnostico)}</td><td>${e(r.resultados)}</td><td>${e(r.experiencia)}</td><td>${e(r.plazo)}</td></tr>`).join('') :
                '<tr><td colspan="6">No hay ruta de aprendizaje</td></tr>';
            
            const seguimientoHtml = (a.ppf_seguimiento && a.ppf_seguimiento.length) ?
                a.ppf_seguimiento.map(s => `<tr><td><strong>${e(s.competencia)}</strong><br><small>${e(s.nivel_comp)}</small></td><td>${e(s.comportamiento)}</td><td>${e(s.actividad)}</td><td>${e(s.entidad)}</td><td>${e(s.fecha)}</td><td>${e(s.comentarios)}</td></tr>`).join('') :
                '<tr><td colspan="6">No hay seguimiento</td></tr>';
            
            const funcionesHtml = (a.desempeno_funciones && a.desempeno_funciones.length) ?
                a.desempeno_funciones.map(f => `<tr><td>${e(f.funcion)}</td><td>${e(f.tarea)}</td></tr>`).join('') :
                '<tr><td colspan="2">Sin funciones definidas</td></tr>';
            
            const acontHtml = (a.desempeno_acontecimientos && a.desempeno_acontecimientos.length) ?
                a.desempeno_acontecimientos.map(ac => `<tr><td><strong>${e(ac.criterio)}</strong><br><small>${e(ac.nivel_comp)}</small></td><td>${e(ac.comportamiento)}</td><td>${e(ac.acciones)}</td></tr>`).join('') :
                '<tr><td colspan="3">No hay acontecimientos</td></tr>';
            
            const conductualHtml = (a.desempeno_conductual && a.desempeno_conductual.length) ?
                a.desempeno_conductual.map(co => `<tr><td><strong>${e(co.criterio)}</strong><br><small>${e(co.nivel_comp)}</small></td><td>${e(co.comportamiento)}</td><td>${e(co.calificacion)}</td><td>${e(co.observaciones)}</td></tr>`).join('') :
                '<tr><td colspan="4">Sin evaluación conductual</td></tr>';
            
            const starHtml = (a.desempeno_star && a.desempeno_star.length) ?
                a.desempeno_star.map(st => `<tr><td><strong>${e(st.criterio)}</strong><br><small>${e(st.nivel_comp)}</small></td><td>${e(st.comportamiento)}</td><td>${e(st.situacion)}</td><td>${e(st.accion)}</td><td>${e(st.resultado)}</td></tr>`).join('') :
                '<tr><td colspan="5">Sin entrevista STAR</td></tr>';
            
            const certificadosHtml = `
                <tr><td>Certificado de Antecedentes</td><td>${a.cert_antecedentes_url ? `<a href="${a.cert_antecedentes_url}" target="_blank">Ver documento</a>` : 'No adjuntado'}</td></tr>
                <tr><td>Certificado de Inhabilidad (Menores)</td><td>${a.cert_inhabilidad_url ? `<a href="${a.cert_inhabilidad_url}" target="_blank">Ver documento</a>` : 'No adjuntado'}</td></tr>
                <tr><td>Certificado Inhabilidad Maltrato Relevante</td><td>${a.cert_inhabilidad_relevante_url ? `<a href="${a.cert_inhabilidad_relevante_url}" target="_blank">Ver documento</a>` : 'No adjuntado'}</td></tr>
            `;

            let badgeImgUrl = 'https://i.imgur.com/75Pkg1G.png';
            if (a.nivel_formacion === 'Básico') badgeImgUrl = 'https://i.imgur.com/Doq2Vak.png';
            else if (a.nivel_formacion === 'Medio') badgeImgUrl = 'https://i.imgur.com/z0zOKwF.png';
            else if (a.nivel_formacion === 'Avanzado') badgeImgUrl = 'https://i.imgur.com/kZhPHVF.jpeg';
            else if (a.nivel_formacion === 'IM3') badgeImgUrl = 'https://i.imgur.com/IjZ6pzf.jpeg';
            else if (a.nivel_formacion === 'IM4') badgeImgUrl = 'https://i.imgur.com/AOwrUX8.jpeg';

            const certs = a.certificados_formacion || {};
            const certsFormacionHtml = `
                <tr><td>Certificado Etapa Ingreso</td><td>${certs.ingreso ? `<a href="${e(certs.ingreso)}" target="_blank">Ver documento</a>` : 'No adjuntado'}</td></tr>
                <tr><td>Certificado Nivel Básico</td><td>${certs.basico ? `<a href="${e(certs.basico)}" target="_blank">Ver documento</a>` : 'No adjuntado'}</td></tr>
                <tr><td>Certificado Nivel Medio</td><td>${certs.medio ? `<a href="${e(certs.medio)}" target="_blank">Ver documento</a>` : 'No adjuntado'}</td></tr>
                <tr><td>Certificado N. Avanzado (IM)</td><td>${certs.avanzado ? `<a href="${e(certs.avanzado)}" target="_blank">Ver documento</a>` : 'No adjuntado'}</td></tr>
                <tr><td>Certificado IM3</td><td>${certs.im3 ? `<a href="${e(certs.im3)}" target="_blank">Ver documento</a>` : 'No adjuntado'}</td></tr>
                <tr><td>Certificado IM4</td><td>${certs.im4 ? `<a href="${e(certs.im4)}" target="_blank">Ver documento</a>` : 'No adjuntado'}</td></tr>
            `;
            const doc = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Expediente Completo - ${e(a.nombreCompleto)}</title>
                <style>
                    body { font-family: 'Poppins', 'Segoe UI', Arial, sans-serif; margin: 0; padding: 30px; color: #1e293b; font-size: 11pt; line-height: 1.4; }
                    .doc-header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; }
                    .doc-header img { max-width: 100px; height: auto; margin-bottom: 10px; }
                    .doc-header h1 { font-size: 24pt; color: #1e3a8a; margin: 0; font-weight: 800; text-transform: uppercase; }
                    h2 { font-size: 16pt; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; margin-top: 25px; margin-bottom: 12px; padding-bottom: 4px; }
                    h3 { font-size: 13pt; color: #334155; margin: 15px 0 8px; }
                    .foto { text-align: center; margin-bottom: 20px; }
                    .foto img { max-width: 180px; border-radius: 12px; border: 2px solid #1e3a8a; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                    .datos-personales { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: #f8fafc; padding: 15px; border-radius: 12px; margin-bottom: 20px; }
                    .info-item { background: white; padding: 8px 12px; border-radius: 8px; border-left: 4px solid #3b82f6; }
                    .info-item strong { display: block; font-size: 9pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
                    .info-item span { font-weight: 600; font-size: 11pt; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; }
                    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; vertical-align: top; }
                    th { background: #f1f5f9; font-weight: 700; color: #1e3a8a; }
                    .certificados-table td:first-child { font-weight: 600; background: #f8fafc; width: 40%; }
                    .footer { margin-top: 30px; text-align: center; font-size: 8pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
                    @media print { body { padding: 0; margin: 0.5cm; } .no-break { page-break-inside: avoid; } }
                </style>
            </head>
            <body>
                <div class="doc-header">
                    <img src="https://i.imgur.com/11u9rUD.png" alt="Logo Grupo Salvador Sanfuentes" onerror="this.src='https://via.placeholder.com/100x100/1e3a8a/ffffff?text=Logo+Grupo'">
                    <h1>Expediente Institucional</h1>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12pt; font-weight: 600;">Grupo Guía y Scouts Salvador Sanfuentes</p>
                </div>
                <div class="foto"><img src="${a.foto_url}" alt="Foto del dirigente" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(a.nombreCompleto)}&background=1e3a8a&color=fff&bold=true'"></div>
                
                <h2>Datos Personales</h2>
                <div class="datos-personales">
                    <div class="info-item"><strong>Nombre completo</strong><span>${e(a.nombreCompleto)}</span></div>
                    <div class="info-item"><strong>RUN</strong><span>${e(a.run)}</span></div>
                    <div class="info-item"><strong>Fecha Nacimiento</strong><span>${e(a.fecha_nacimiento)} (${a.edad} años)</span></div>
                    <div class="info-item"><strong>Nacionalidad</strong><span>${e(a.nacionalidad)}</span></div>
                    <div class="info-item"><strong>Profesión/Oficio</strong><span>${e(a.profesion || 'No especificada')}</span></div>
                    <div class="info-item"><strong>Teléfono</strong><span>${e(a.telefono)}</span></div>
                    <div class="info-item"><strong>Email</strong><span>${e(a.email)}</span></div>
                    <div class="info-item"><strong>Domicilio</strong><span>${e(a.domicilio)}</span></div>
                    <div class="info-item"><strong>Disponibilidad</strong><span>${e(a.disponibilidad || 'No especificada')}</span></div>
                </div>

                <h2>Nivel de Formación y Certificaciones</h2>
                <div style="display: flex; align-items: center; gap: 20px; background: #f8fafc; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                    <img src="${badgeImgUrl}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 50%; border: 2px solid #1e3a8a; background: white; padding: 4px;" alt="Insignia Nivel">
                    <div>
                        <h3 style="margin: 0 0 5px 0; color: #1e3a8a;">Nivel Actual: ${e(a.nivel_formacion)}</h3>
                        <p style="margin: 0; font-size: 10pt; color: #64748b;">Ruta de progresión de formación para adultos en el Movimiento Scout.</p>
                    </div>
                </div>
                <table class="certificados-table">${certsFormacionHtml}</table>

                <h2>Ficha Médica y Contacto de Emergencia</h2>
                <table>
                    <tr><th>Previsión de Salud</th><td>${e(a.prevision_salud || 'No registra')} ${a.isapre_nombre ? '('+e(a.isapre_nombre)+')' : ''}</td></tr>
                    <tr><th>Grupo Sanguíneo</th><td>${e(a.grupo_sanguineo || 'Desconocido')}</td></tr>
                    <tr><th>Alergias / Condiciones</th><td>${a.alergias && a.alergias.length ? a.alergias.map(alg=>e(alg)).join(', ') : 'Ninguna declarada'}</td></tr>
                    <tr><th>Contacto Emergencia</th><td>${e(a.emergencia_nombre || 'No registra')} (${e(a.emergencia_parentesco || '')})<br>Tel: ${e(a.emergencia_telefono)} ${a.emergencia_email ? ' | Email: '+e(a.emergencia_email) : ''}</td></tr>
                </table>
                <h2>Datos Institucionales</h2>
                <table>
                    <tr><th>Fase Ciclo de Vida</th><td>${e(a.fase_ciclo_vida || 'Captación/Ingreso')}</td></tr>
                    <tr><th>Unidad Asignada</th><td>${e(a.unidad_rol)}</td></tr>
                    <tr><th>Cuota Anual Pagada</th><td>${a.cuota_pagada ? 'Sí' : 'No'}</td></tr>
                </table>
                <h2>Documentos VCM</h2>
                <table class="certificados-table">${certificadosHtml}</table>
                <h2>Formación y Acuerdos PPF</h2>
                <table>
                    <tr><th>Asesor Personal (AP)</th><td>${e(a.ap_nombre || 'No asignado')}</td></tr>
                    <tr><th>Asesor P. Formación (APF)</th><td>${e(a.apf_nombre || 'No asignado')}</td></tr>
                    <tr><th>Etapa PPF</th><td>${e(a.etapa_ppf)}</td></tr>
                    <tr><th>1. Formación Institucional</th><td>${e(a.compromiso_formacion || 'Sin redactar')}</td></tr>
                    <tr><th>2. Trabajo en la Unidad</th><td>${e(a.compromiso_unidad || 'Sin redactar')}</td></tr>
                    <tr><th>3. Asistencia a Actividades</th><td>${e(a.compromiso_asistencia || 'Sin redactar')}</td></tr>
                    <tr><th>4. Relación con el AP</th><td>${e(a.compromiso_ap || 'Sin redactar')}</td></tr>
                    <tr><th>5. Desarrollo de la PPF</th><td>${e(a.compromiso_ppf || 'Sin redactar')}</td></tr>
                    <tr><th>6. Evaluación Final</th><td>${e(a.compromiso_evaluacion || 'Sin redactar')}</td></tr>
                    <tr><th>7. Otros Acuerdos</th><td>${e(a.compromiso_otros || 'Sin registrar')}</td></tr>
                </table>
                <h3>Competencias a Desarrollar</h3>
                <table><thead><tr><th>Competencia (Nivel)</th><th>Comportamiento</th><th>Acciones</th><th>Plazo</th></tr></thead><tbody>${competenciasHtml}</tbody></table>
                <h3>Ruta de Aprendizaje</h3>
                <table><thead><tr><th>Competencia (Nivel)</th><th>Comportamiento</th><th>Diagnóstico</th><th>Resultados Esperados</th><th>Experiencia</th><th>Plazo</th></tr></thead><tbody>${rutaHtml}</tbody></table>
                <h3>Seguimiento de Experiencias</h3>
                <table><thead><tr><th>Competencia (Nivel)</th><th>Comportamiento</th><th>Actividad</th><th>Entidad/Lugar</th><th>Fecha</th><th>Comentarios</th></tr></thead><tbody>${seguimientoHtml}</tbody></table>
                <h2>Gestión del Desempeño</h2>
                <h3>Funciones y Tareas</h3>
                <table><thead><tr><th>Función</th><th>Tareas</th></tr></thead><tbody>${funcionesHtml}</tbody></table>
                <h3>Acontecimientos Relevantes</h3>
                <table><thead><tr><th>Criterio / Competencia (Nivel)</th><th>Comportamiento Asignado</th><th>Acciones Observadas</th></tr></thead><tbody>${acontHtml}</tbody></table>
                <h3>Calificación Conductual</h3>
                <table><thead><tr><th>Criterio / Competencia (Nivel)</th><th>Comportamiento Observado</th><th>Calificación</th><th>Observaciones</th></tr></thead><tbody>${conductualHtml}</tbody></table>
                <h3>Entrevista STAR</h3>
                <table><thead><tr><th>Competencia (Nivel)</th><th>Comportamiento</th><th>Situación/Tarea</th><th>Acción</th><th>Resultado</th></tr></thead><tbody>${starHtml}</tbody></table>
                ${qrHtml || ''}
                <div class="footer">Documento generado desde ERP Scout — Grupo Guía y Scouts Salvador Sanfuentes<br>Fecha de generación: ${new Date().toLocaleString('es-CL')}</div>
            

</body>
            </html>`;
            return doc;
        }

        // ── Imprimir expediente (ventana nueva + print dialog) ──
        window.imprimirExpedienteAdulto = function(id) {
            const a = window.padronAdultos.find(x => x.id === id);
            if (!a) return;
            const w = window.open('', '_blank');
            const doc = buildExpedienteDoc(a, null);
            w.document.write(doc);
            w.document.close();
            setTimeout(() => { w.print(); }, 1000);
        };

        // ── Generar expediente: Drive + QR + Email ──
        // ── Generar expediente: html2canvas + jsPDF + Drive + QR + Email ──
        // ── Modal personalizado para expediente ──
        function mostrarModalExpediente(a) {
            return new Promise(resolve => {
                const emailPre = a.email || '';
                const modal = document.createElement('div');
                modal.id = 'modal-expte';
                modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.55);display:flex;align-items:center;justify-content:center;padding:16px;';
                modal.innerHTML = `
                <div style="background:white;border-radius:20px;box-shadow:0 25px 60px rgba(0,0,0,0.25);max-width:480px;width:100%;overflow:hidden;font-family:'Poppins',Arial,sans-serif;">
                    <!-- Cabecera -->
                    <div style="background:linear-gradient(135deg,#0E2586,#1a36a8);padding:20px 24px 18px;">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:8px;"><i class="fas fa-file-alt" style="color:white;font-size:1.2rem;"></i></div>
                            <div>
                                <p style="color:rgba(255,255,255,0.7);font-size:0.72rem;margin:0;text-transform:uppercase;letter-spacing:1px;">Expediente Institucional</p>
                                <h3 style="color:white;font-size:1rem;font-weight:700;margin:0;">${a.nombreCompleto}</h3>
                            </div>
                        </div>
                    </div>
                    <!-- Cuerpo -->
                    <div style="padding:22px 24px 8px;">
                        <!-- Opción Drive -->
                        <div style="border:2px solid #e0e7ff;border-radius:12px;padding:16px;margin-bottom:12px;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                                <i class="fas fa-cloud-upload-alt" style="color:#4f46e5;font-size:1.1rem;"></i>
                                <span style="font-weight:700;color:#1e293b;font-size:0.9rem;">Guardar en Drive + QR</span>
                            </div>
                            <!-- Toggle correo -->
                            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:0;" id="lbl-toggle-correo">
                                <div style="position:relative;width:40px;height:22px;flex-shrink:0;">
                                    <input type="checkbox" id="chk-enviar-correo" style="opacity:0;width:0;height:0;position:absolute;" ${emailPre ? 'checked' : ''}>
                                    <span id="toggle-track" style="position:absolute;inset:0;background:${emailPre ? '#4f46e5' : '#cbd5e1'};border-radius:99px;transition:background 0.2s;"></span>
                                    <span id="toggle-thumb" style="position:absolute;top:3px;left:${emailPre ? '21px' : '3px'};width:16px;height:16px;background:white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.2);transition:left 0.2s;"></span>
                                </div>
                                <span style="font-size:0.85rem;color:#475569;">Enviar por correo</span>
                            </label>
                            <!-- Campos de correo -->
                            <div id="campos-correo" style="display:${emailPre ? 'block' : 'none'};margin-top:12px;">
                                <label style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Para</label>
                                <input type="email" id="expte-email-1" value="${emailPre}" placeholder="correo@dominio.com"
                                    style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 12px;font-size:0.875rem;color:#1e293b;outline:none;margin-top:4px;box-sizing:border-box;transition:border 0.15s;"
                                    onfocus="this.style.border='1.5px solid #4f46e5'" onblur="this.style.border='1.5px solid #e2e8f0'">
                                <div id="campo-cc" style="display:none;margin-top:8px;">
                                    <label style="font-size:0.75rem;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">CC / Otro destinatario</label>
                                    <input type="email" id="expte-email-2" placeholder="otro@correo.com"
                                        style="width:100%;border:1.5px solid #e2e8f0;border-radius:8px;padding:8px 12px;font-size:0.875rem;color:#1e293b;outline:none;margin-top:4px;box-sizing:border-box;transition:border 0.15s;"
                                        onfocus="this.style.border='1.5px solid #4f46e5'" onblur="this.style.border='1.5px solid #e2e8f0'">
                                </div>
                                <button onclick="document.getElementById('campo-cc').style.display=document.getElementById('campo-cc').style.display==='none'?'block':'none';this.textContent=document.getElementById('campo-cc').style.display==='block'?'– Quitar segundo destinatario':'+ Agregar otro destinatario'"
                                    style="background:none;border:none;color:#4f46e5;font-size:0.78rem;font-weight:600;cursor:pointer;padding:6px 0 0;text-decoration:underline;">+ Agregar otro destinatario</button>
                            </div>
                        </div>
                    </div>
                    <!-- Botones -->
                    <div style="padding:0 24px 22px;display:flex;flex-direction:column;gap:10px;">
                        <button id="btn-generar-expte" style="background:linear-gradient(135deg,#0E2586,#1a36a8);color:white;border:none;border-radius:12px;padding:13px;font-size:0.92rem;font-weight:700;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.2s;"
                            onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                            <i class="fas fa-cloud-upload-alt"></i> Generar y guardar en Drive
                        </button>
                        <button id="btn-solo-imprimir" style="background:#f1f5f9;color:#475569;border:1.5px solid #e2e8f0;border-radius:12px;padding:11px;font-size:0.875rem;font-weight:600;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;transition:background 0.2s;"
                            onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">
                            <i class="fas fa-print"></i> Solo imprimir
                        </button>
                        <button id="btn-cancelar-expte" style="background:none;border:none;color:#94a3b8;font-size:0.8rem;cursor:pointer;padding:4px;">Cancelar</button>
                    </div>
                </div>`;
                document.body.appendChild(modal);

                // Toggle correo
                const chk = modal.querySelector('#chk-enviar-correo');
                const track = modal.querySelector('#toggle-track');
                const thumb = modal.querySelector('#toggle-thumb');
                const campos = modal.querySelector('#campos-correo');
                chk.addEventListener('change', () => {
                    const on = chk.checked;
                    track.style.background = on ? '#4f46e5' : '#cbd5e1';
                    thumb.style.left = on ? '21px' : '3px';
                    campos.style.display = on ? 'block' : 'none';
                });

                const cerrar = () => { modal.remove(); resolve(null); };
                modal.querySelector('#btn-cancelar-expte').onclick = cerrar;
                modal.addEventListener('click', e => { if (e.target === modal) cerrar(); });

                modal.querySelector('#btn-solo-imprimir').onclick = () => { modal.remove(); resolve({ accion: 'imprimir' }); };
                modal.querySelector('#btn-generar-expte').onclick = () => {
                    const enviarCorreo = chk.checked;
                    const em1 = (modal.querySelector('#expte-email-1')?.value || '').trim();
                    const em2 = (modal.querySelector('#expte-email-2')?.value || '').trim();
                    const destinatarios = [em1, em2].filter(e => e && e.includes('@'));
                    modal.remove();
                    resolve({ accion: 'drive', enviarCorreo, destinatarios });
                };
            });
        }

        // ── Generar expediente: html2canvas + jsPDF + Drive + QR + Email ──
        window.generarExpedienteAdulto = async function(id) {
            const a = window.padronAdultos.find(x => x.id === id);
            if (!a) return;

            const opcion = await mostrarModalExpediente(a);
            if (!opcion) return;
            if (opcion.accion === 'imprimir') { window.imprimirExpedienteAdulto(id); return; }

            window.mostrarNotificacion('info', '⏳ Generando expediente PDF...');

            try {
                // ── Paso 1: Asegurar jsPDF y html2canvas ──
                const cargarLib = (src) => new Promise((res, rej) => {
                    const s = document.createElement('script'); s.src = src;
                    s.onload = res; s.onerror = () => rej(new Error('No cargó: ' + src));
                    document.head.appendChild(s);
                });
                if (!window.jspdf)       await cargarLib('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
                if (!window.html2canvas) await cargarLib('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');

                // ── Paso 2: Renderizar HTML en contenedor visible ──
                const fullHtml = buildExpedienteDoc(a, null);
                const cssMatch  = fullHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
                const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

                const wrap = document.createElement('div');
                wrap.style.cssText = 'position:fixed;top:0;left:0;width:794px;background:white;z-index:99999;font-family:Arial,sans-serif;color:#1e293b;font-size:11pt;line-height:1.4;';
                if (cssMatch) { const s = document.createElement('style'); s.textContent = cssMatch[1]; wrap.appendChild(s); }
                const inner = document.createElement('div'); inner.style.cssText = 'padding:24px;';
                inner.innerHTML = bodyMatch ? bodyMatch[1] : fullHtml;
                wrap.appendChild(inner);
                document.body.appendChild(wrap);

                await Promise.all(Array.from(wrap.querySelectorAll('img')).map(img =>
                    img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
                ));
                await new Promise(r => setTimeout(r, 400));

                // ── html2canvas → jsPDF multi-página ──
                async function htmlABase64(containerEl) {
                    const canvas = await html2canvas(containerEl, {
                        scale: 1.5, useCORS: true, allowTaint: true, logging: false, width: 794, windowWidth: 794
                    });
                    const { jsPDF } = window.jspdf;
                    const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                    const pW   = pdf.internal.pageSize.getWidth();
                    const pH   = pdf.internal.pageSize.getHeight();
                    const imgH = (canvas.height / canvas.width) * pW;
                    const imgData = canvas.toDataURL('image/jpeg', 0.88);
                    let yPos = 0;
                    while (yPos < imgH) {
                        if (yPos > 0) pdf.addPage();
                        pdf.addImage(imgData, 'JPEG', 0, -yPos, pW, imgH);
                        yPos += pH;
                    }
                    return pdf.output('datauristring').split(',')[1];
                }

                const base64v1 = await htmlABase64(wrap);
                document.body.removeChild(wrap);

                // ── Paso 3: Subir a Drive ──
                window.mostrarNotificacion('info', '☁️ Subiendo a Google Drive...');
                const nombreArchivo = `Expediente_${(a.nombreCompleto||'').replace(/[^a-zA-Z0-9]/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`;
                const resDrive = await window.DriveHelper.subir({
                    supabaseClient: window.supabaseClient,
                    nombre: nombreArchivo, base64: base64v1,
                    mimeType: 'application/pdf',
                    claveCarpeta: 'adultos', nombrePersona: a.nombreCompleto
                });
                if (!resDrive.ok) throw new Error(resDrive.error || 'Error al subir a Drive');
                const driveUrl = resDrive.link;

                // ── Paso 4: QR ──
                if (!window.QRCode) await cargarLib('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
                const qrDiv = document.createElement('div');
                qrDiv.style.cssText = 'position:fixed;left:-9999px;top:0;';
                document.body.appendChild(qrDiv);
                new QRCode(qrDiv, { text: driveUrl, width: 128, height: 128, correctLevel: QRCode.CorrectLevel.H });
                await new Promise(r => setTimeout(r, 600));
                const qrCanvas = qrDiv.querySelector('canvas');
                const qrDataUrl = qrCanvas ? qrCanvas.toDataURL('image/png') : null;
                document.body.removeChild(qrDiv);

                // ── Paso 5: Re-generar PDF con QR ──
                let base64final = base64v1;
                if (qrDataUrl) {
                    const qrHtml = `<div style="border:2px solid #1e3a8a;padding:12px 18px;border-radius:10px;display:flex;align-items:center;gap:16px;background:#f0f4ff;margin:20px 0 4px;page-break-inside:avoid;"><img src="${qrDataUrl}" style="width:80px;height:80px;flex-shrink:0;" alt="QR Drive"><div><p style="font-size:9pt;font-weight:800;color:#1e3a8a;margin:0 0 4px;text-transform:uppercase;">✔ Verificable en Google Drive</p><p style="font-size:7pt;color:#334155;margin:0;word-break:break-all;max-width:400px;">${driveUrl}</p></div></div>`;
                    const fullHtml2 = buildExpedienteDoc(a, qrHtml);
                    const cssMatch2  = fullHtml2.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
                    const bodyMatch2 = fullHtml2.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                    const wrap2 = document.createElement('div');
                    wrap2.style.cssText = 'position:fixed;top:0;left:0;width:794px;background:white;z-index:99999;font-family:Arial,sans-serif;color:#1e293b;font-size:11pt;line-height:1.4;';
                    if (cssMatch2) { const s = document.createElement('style'); s.textContent = cssMatch2[1]; wrap2.appendChild(s); }
                    const inner2 = document.createElement('div'); inner2.style.cssText = 'padding:24px;';
                    inner2.innerHTML = bodyMatch2 ? bodyMatch2[1] : fullHtml2;
                    wrap2.appendChild(inner2);
                    document.body.appendChild(wrap2);
                    await Promise.all(Array.from(wrap2.querySelectorAll('img')).map(img =>
                        img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })
                    ));
                    await new Promise(r => setTimeout(r, 300));
                    base64final = await htmlABase64(wrap2);
                    document.body.removeChild(wrap2);
                    try { await window.DriveHelper.actualizar({ fileId: resDrive.id, base64: base64final, mimeType: 'application/pdf' }); }
                    catch(e) { console.warn('[EXPTE] Drive no actualizado con QR:', e.message); }
                }

                // ── Paso 6: Correo ──
                if (opcion.enviarCorreo && opcion.destinatarios?.length) {
                    window.mostrarNotificacion('info', `📧 Enviando a ${opcion.destinatarios.join(', ')}...`);
                    const nombreCorto = (a.nombres||'').split(' ')[0] || a.nombreCompleto;
                    const htmlCorreo = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#0E2586,#1a36a8);padding:28px 32px;text-align:center;">
        <img src="https://i.imgur.com/11u9rUD.png" alt="Logo" style="height:52px;margin-bottom:12px;"><br>
        <span style="color:rgba(255,255,255,0.8);font-size:0.78rem;letter-spacing:1px;text-transform:uppercase;">Grupo Guía y Scouts Salvador Sanfuentes</span>
      </td></tr>
      <!-- Cuerpo -->
      <tr><td style="padding:32px;">
        <h2 style="color:#0E2586;font-size:1.25rem;margin:0 0 8px;">Expediente Institucional</h2>
        <p style="color:#475569;font-size:0.95rem;margin:0 0 20px;">Hola <strong style="color:#1e293b;">${nombreCorto}</strong>,</p>
        <p style="color:#475569;font-size:0.9rem;line-height:1.7;margin:0 0 20px;">
          Adjunto encontrarás tu <strong>expediente institucional actualizado</strong> del Grupo Guía y Scouts Salvador Sanfuentes.
          Este documento incluye tu información personal, formación PPF, desempeño y documentación institucional vigente.
        </p>
        <!-- Botón Drive -->
        <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr><td style="background:#0E2586;border-radius:10px;padding:13px 28px;text-align:center;">
            <a href="${driveUrl}" target="_blank" style="color:white;font-weight:700;font-size:0.9rem;text-decoration:none;display:inline-flex;align-items:center;gap:8px;">
              📂 Ver en Google Drive
            </a>
          </td></tr>
        </table>
        <p style="color:#94a3b8;font-size:0.8rem;line-height:1.6;margin:0;">
          Si tienes dudas sobre el contenido de tu expediente, contacta al equipo directivo del grupo.<br>
          El documento también ha quedado guardado de forma permanente en nuestra carpeta institucional de Drive.
        </p>
      </td></tr>
      <!-- Footer -->
      <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 32px;text-align:center;">
        <p style="color:#94a3b8;font-size:0.75rem;margin:0;">ERP Scout · Grupo Guía y Scouts Salvador Sanfuentes<br>
        Este correo fue generado automáticamente — ${new Date().toLocaleDateString('es-CL', {day:'numeric',month:'long',year:'numeric'})}</p>
      </td></tr>
    </table>
  </td></tr>
</table>

</body></html>`;
                    try {
                        for (const dest of opcion.destinatarios) {
                            await window.supabaseClient.functions.invoke('send-email', {
                                body: {
                                    to_email: dest,
                                    subject: `📋 Expediente institucional — ${a.nombreCompleto}`,
                                    html_content: htmlCorreo,
                                    attachments: [{ filename: nombreArchivo, content: base64final, type: 'application/pdf' }]
                                }
                            });
                        }
                        window.mostrarNotificacion('exito', `✅ Expediente guardado en Drive y enviado a ${opcion.destinatarios.join(', ')}.`);
                    } catch(mailErr) {
                        console.warn('[EXPTE] Error correo:', mailErr);
                        window.mostrarNotificacion('error', 'Drive OK, error al enviar correo: ' + mailErr.message);
                    }
                } else {
                    window.mostrarNotificacion('exito', '✅ Expediente guardado en Drive con QR de verificación.');
                }

            } catch(err) {
                console.error('[EXPTE] Error:', err);
                window.mostrarNotificacion('error', 'Error al generar expediente: ' + err.message);
            }
        };

                        // Inicialización robusta - espera que Supabase esté listo
