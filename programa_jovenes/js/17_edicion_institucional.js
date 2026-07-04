        function abrirModalEditarJoven(jovenId) {
            const joven = personasJovenes.find(j => j.id === jovenId);
            if (!joven) return;
            currentEditJovenId = jovenId;
            const e = (s) => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

            // Determinar nivel de acceso
            const esDirigente = window.Permisos && Permisos.listo() && Permisos.nivel() < 4;
            const soloUnidad  = esDirigente; // dirigentes solo pueden cambiar unidad/estado, no datos personales
            const dis = soloUnidad ? 'disabled style="opacity:0.5;pointer-events:none;background:#f1f5f9;"' : '';
            const disFset = soloUnidad ? 'style="opacity:0.6;pointer-events:none;"' : '';
            
            let html = `
                ${soloUnidad ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 14px;margin-bottom:16px;font-size:0.82rem;color:#1e40af;display:flex;align-items:center;gap:8px;"><i class="fas fa-info-circle"></i> <b>Acceso de dirigente:</b> Solo puedes modificar la unidad asignada y el estado del joven. Los datos personales solo pueden ser editados por coordinación o administración.</div>` : ''}
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="space-y-6" ${disFset}>
                        <fieldset class="modal-edit-section border-t-4 border-t-blue-500 shadow-sm" ${soloUnidad ? 'disabled' : ''}><legend><i class="fas fa-fingerprint text-blue-600 mr-2"></i> Identificación Demográfica Civil</legend><div class="section-content"><div class="form-grid">
                            <div class="form-item"><label>Nombres Legales</label><input type="text" id="ed-nombres" value="${e(joven.nombres)}" class="bg-gray-50 focus:bg-white" ${dis}></div>
                            <div class="form-item"><label>Apellidos Legales</label><input type="text" id="ed-apellidos" value="${e(joven.apellidos)}" class="bg-gray-50 focus:bg-white" ${dis}></div>
                            <div class="form-item"><label>RUN (Rol Único Nacional)</label><input type="text" id="ed-run" value="${e(joven.run)}" placeholder="XX.XXX.XXX-X" class="font-mono bg-blue-50/30" ${dis}></div>
                            <div class="form-item"><label>Fecha de Nacimiento</label><input type="date" id="ed-fnac" value="${joven.fecha_nacimiento}" ${dis}></div>
                            <div class="form-item"><label>Nacionalidad</label><input type="text" id="ed-nac" value="${e(joven.nacionalidad)}" ${dis}></div>
                            <div class="form-item"><label>Nombre Social (Ley Identidad)</label><input type="text" id="ed-nsoc" value="${e(joven.nombre_social)}" placeholder="Si aplica..." ${dis}></div>
                            <div class="form-item full-width"><label>Domicilio Particular de Residencia</label><input type="text" id="ed-dom" value="${e(joven.domicilio)}" placeholder="Calle, Número, Comuna, Región" ${dis}></div>
                            <div class="form-item"><label>Religión o Confesión</label><input type="text" id="ed-rel" value="${e(joven.religion)}" placeholder="(Para Animación de Fe)" ${dis}></div>
                            <div class="form-item"><label>Institución Educacional</label><input type="text" id="ed-inst" value="${e(joven.institucion_educacional)}" ${dis}></div>
                            <div class="form-item"><label>Nivel Curricular que cursa</label><input type="text" id="ed-nivel" value="${e(joven.nivel)}" placeholder="Ej: 8vo Básico" ${dis}></div>
                        </div></div></fieldset>

                        <fieldset class="modal-edit-section border-t-4 border-t-indigo-500 shadow-sm" ${soloUnidad ? 'disabled' : ''}><legend><i class="fas fa-users text-indigo-600 mr-2"></i> Red de Soporte y Tutores Legales</legend><div class="section-content"><div class="form-grid">
                            <div class="form-item full-width"><label class="text-indigo-900 border-b-2 border-indigo-100 pb-1 text-sm"><i class="fas fa-star text-amber-400 mr-1"></i> Apoderado Titular (Responsable Legal)</label></div>
                            <div class="form-item full-width"><label>Nombre Completo</label><input type="text" id="ed-apt-nom" value="${e(joven.apoderado_titular_nombre)}" class="bg-indigo-50/30" ${dis}></div>
                            <div class="form-item"><label>Vínculo o Parentesco</label><input type="text" id="ed-apt-par" value="${e(joven.apoderado_titular_parentesco)}" placeholder="Madre, Padre, Tutor..." ${dis}></div>
                            <div class="form-item"><label>Teléfono de Contacto</label><input type="text" id="ed-apt-tel" value="${e(joven.apoderado_titular_telefono)}" class="font-mono" ${dis}></div>
                            <div class="form-item full-width"><label>Correo Electrónico (Para envío de recibos)</label><input type="email" id="ed-apt-ema" value="${e(joven.apoderado_titular_email)}" ${dis}></div>
                            
                            <div class="form-item full-width mt-4"><label class="text-gray-700 border-b border-gray-200 pb-1 text-sm"><i class="fas fa-shield-alt text-gray-400 mr-1"></i> Apoderado Suplente (Casos de Emergencia)</label></div>
                            <div class="form-item full-width"><label>Nombre Completo</label><input type="text" id="ed-aps-nom" value="${e(joven.apoderado_suplente1_nombre)}" class="bg-gray-50" ${dis}></div>
                            <div class="form-item"><label>Teléfono Urgencia</label><input type="text" id="ed-aps-tel" value="${e(joven.apoderado_suplente1_telefono)}" class="font-mono bg-red-50/20 focus:bg-red-50" ${dis}></div>
                        </div></div></fieldset>
                    </div>
                    
                    <div class="space-y-6">
                        <fieldset class="modal-edit-section border-t-4 border-t-red-600 shadow-md relative overflow-hidden" ${soloUnidad ? 'disabled style="opacity:0.5;pointer-events:none;"' : ''}>
                            <div class="absolute top-2 right-2 opacity-10"><i class="fas fa-heartbeat text-8xl text-red-500"></i></div>
                            <legend class="bg-red-50 text-red-900 border-b border-red-200"><i class="fas fa-briefcase-medical text-red-600 mr-2"></i> Expediente Médico (Ficha Crítica de Campamento)</legend>
                            <div class="section-content relative z-10"><div class="form-grid">
                            
                            <div class="form-item"><label class="text-red-900">Sistema Previsional de Salud Base</label><select id="ed-prev" class="bg-white border-red-200 focus:border-red-500"><option ${joven.prevision_salud==='Fonasa'?'selected':''}>Fonasa</option><option ${joven.prevision_salud==='Isapre'?'selected':''}>Isapre</option><option ${joven.prevision_salud==='Capredena'?'selected':''}>Capredena</option><option ${joven.prevision_salud==='Dipreca'?'selected':''}>Dipreca</option><option ${joven.prevision_salud==='Particular'?'selected':''}>Particular</option><option>Otra</option></select></div>
                            <div class="form-item"><label class="text-red-900">Institución / N° Registro (Si es Isapre)</label><input type="text" id="ed-isapre" value="${e(joven.numero_registro_isapre)}" placeholder="Cruz Blanca, Banmédica..."></div>
                            <div class="form-item"><label class="text-red-900 font-extrabold bg-red-100 p-1 rounded">Grupo Sanguíneo y Factor Rh</label><select id="ed-sangre" class="font-bold border-red-300 text-red-700 bg-red-50"><option value="">Desconocido</option><option ${joven.grupo_sanguineo==='A+'?'selected':''}>A+</option><option ${joven.grupo_sanguineo==='A-'?'selected':''}>A-</option><option ${joven.grupo_sanguineo==='B+'?'selected':''}>B+</option><option ${joven.grupo_sanguineo==='B-'?'selected':''}>B-</option><option ${joven.grupo_sanguineo==='AB+'?'selected':''}>AB+</option><option ${joven.grupo_sanguineo==='AB-'?'selected':''}>AB-</option><option ${joven.grupo_sanguineo==='O+'?'selected':''}>O+</option><option ${joven.grupo_sanguineo==='O-'?'selected':''}>O-</option></select></div>
                            <div class="form-item bg-gray-50 p-2 rounded-lg border border-gray-200 mt-2"><label class="flex items-center gap-2 cursor-pointer mb-0 text-sm"><input type="checkbox" id="ed-seguro" ${joven.tiene_seguro_complementario?'checked':''} class="w-5 h-5 text-red-600"> <span class="font-bold text-gray-800">Posee Seguro de Salud Complementario</span></label></div>
                            <div class="form-item"><label>Aseguradora (Cia. Seguros)</label><input type="text" id="ed-aseg" value="${e(joven.aseguradora)}" placeholder="MetLife, Chilena Consolidada..."></div>
                            <div class="form-item"><label>Número Póliza Respaldo</label><input type="text" id="ed-pol" value="${e(joven.numero_poliza)}" class="font-mono"></div>
                            
                            <div class="form-item full-width mt-3"><label class="text-red-900"><i class="fas fa-syringe mr-1 text-red-500"></i> Esquema de Vacunación (Separar por comas)</label><input type="text" id="ed-vac" value="${e(joven.vacunas)}" placeholder="Ej: Tétanos 2021, Fiebre Amarilla, COVID Bivalente..." class="border-red-200 focus:border-red-500"></div>
                            <div class="form-item full-width"><label class="text-red-900 font-extrabold"><i class="fas fa-exclamation-triangle text-red-500 mr-1"></i> Condiciones Críticas, Restricciones Alimentarias o Alergias Severas</label><input type="text" id="ed-cond" value="${e(joven.condiciones_necesidades?joven.condiciones_necesidades.join(','):'')}" placeholder="Ej: Alergia a la Penicilina, Asma crónica, Intolerancia al Gluten, Celíaco, TEA, etc." class="border-red-400 bg-red-50/50 focus:bg-white focus:ring-2 focus:ring-red-200 shadow-inner font-bold text-red-900"></div>
                            <div class="form-item full-width"><label class="text-gray-700"><i class="fas fa-comment-medical text-gray-400 mr-1"></i> Tratamientos o Dosificación de Medicamentos</label><textarea id="ed-cond-exp" rows="3" class="bg-gray-50 focus:bg-white" placeholder="Detalle si el joven requiere inhalador SOS, horarios de fármacos, o instrucciones específicas ante crisis...">${e(joven.condiciones_explicacion)}</textarea></div>
                        </div></div></fieldset>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <fieldset class="modal-edit-section border-t-4 border-t-emerald-500 shadow-sm mb-0" ${soloUnidad ? 'disabled style="opacity:0.5;pointer-events:none;"' : ''}><legend><i class="fas fa-tshirt text-emerald-600 mr-2"></i> Logística Uniforme</legend><div class="section-content p-4"><div class="form-grid">
                                <div class="form-item full-width"><label>Talla Camisa Oficial</label><select id="ed-talla"><option value="">-- No registra --</option><option ${joven.talla==='10'?'selected':''}>10</option><option ${joven.talla==='12'?'selected':''}>12</option><option ${joven.talla==='14'?'selected':''}>14</option><option ${joven.talla==='16'?'selected':''}>16</option><option ${joven.talla==='XS'?'selected':''}>XS</option><option ${joven.talla==='S'?'selected':''}>S</option><option ${joven.talla==='M'?'selected':''}>M</option><option ${joven.talla==='L'?'selected':''}>L</option><option ${joven.talla==='XL'?'selected':''}>XL</option><option ${joven.talla==='XXL'?'selected':''}>XXL</option></select></div>
                                <div class="form-item"><label>Hombros (cm)</label><input type="number" step="0.1" id="ed-hombros" value="${joven.medida_hombros||''}" class="bg-emerald-50/30"></div>
                                <div class="form-item"><label>Largo Total (cm)</label><input type="number" step="0.1" id="ed-largo" value="${joven.medida_largo||''}" class="bg-emerald-50/30"></div>
                            </div></div></fieldset>

                            <fieldset class="modal-edit-section border-t-4 border-t-gray-800 shadow-sm mb-0"><legend class="bg-gray-100"><i class="fas fa-building text-gray-700 mr-2"></i> Oficina Nacional (ORI)</legend><div class="section-content p-4"><div class="form-grid">
                                <div class="form-item full-width"><label>Unidad Actual Asignada</label><input type="text" id="ed-uni" value="${e(joven.unidad)}" class="font-bold text-gray-800 bg-gray-50 border-gray-300"></div>
                                <div class="form-item"><label>Fecha Ingreso Grupo</label><input type="date" id="ed-fing" value="${joven.fecha_ingreso_grupo}" ${dis}></div>
                                <div class="form-item"><label>Clasif. Membresía</label><input type="text" id="ed-tmi" value="${e(joven.tipo_miembro)}" placeholder="Beneficiario, Aspirante..." ${dis}></div>
                                <div class="form-item full-width bg-green-50 p-2 rounded border border-green-200"><label class="flex items-center gap-2 cursor-pointer mb-0 text-green-900"><input type="checkbox" id="ed-reg" ${joven.registro_pagado?'checked':''} class="w-5 h-5 text-green-600" ${dis}> <strong class="text-sm">Registro Institucional Pagado (SAS Vigente)</strong></label></div>
                                <div class="form-item full-width bg-blue-50 p-2 rounded border border-blue-200 mt-0"><label class="flex items-center gap-2 cursor-pointer mb-0 text-blue-900"><input type="checkbox" id="ed-doc" ${joven.progresion_documento?'checked':''} class="w-5 h-5 text-blue-600" ${dis}> <strong class="text-sm">Consentimiento de Participación Firmado</strong></label></div>
                                <div class="form-item full-width bg-${joven.activo!==false?'emerald':'red'}-50 p-2 rounded border border-${joven.activo!==false?'emerald':'red'}-200 mt-0"><label class="flex items-center gap-2 cursor-pointer mb-0 text-${joven.activo!==false?'emerald':'red'}-900"><input type="checkbox" id="ed-activo" ${joven.activo!==false?'checked':''} class="w-5 h-5 text-emerald-600"> <strong class="text-sm">${joven.activo!==false?'✅ Joven Activo/a en el Grupo':'⚠️ Joven Inactivo/a — marcar para reactivar'}</strong></label></div>
                            </div></div></fieldset>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('modal-edit-content').innerHTML = html;
            document.getElementById('modal-editar-joven').classList.add('active');
        }

        function cerrarModalEditarJoven() { document.getElementById('modal-editar-joven').classList.remove('active'); currentEditJovenId = null; }

        async function guardarEdicionJoven() {
            if (!currentEditJovenId) return;

            const esDirigente = window.Permisos && Permisos.listo() && Permisos.nivel() < 4;

            let payload;
            if (esDirigente) {
                // Dirigentes: solo pueden cambiar unidad y estado activo
                payload = {
                    unidad: document.getElementById('ed-uni').value.trim(),
                    activo: document.getElementById('ed-activo')?.checked ?? true
                };
            } else {
                // Coordinación / Admin: guardan todo
                payload = {
                    nombres: document.getElementById('ed-nombres').value.trim(),
                    apellidos: document.getElementById('ed-apellidos').value.trim(),
                    run: document.getElementById('ed-run').value.trim().toUpperCase(),
                    fecha_nacimiento: document.getElementById('ed-fnac').value || null,
                    nacionalidad: document.getElementById('ed-nac').value.trim(),
                    nombre_social: document.getElementById('ed-nsoc').value.trim(),
                    domicilio: document.getElementById('ed-dom').value.trim(),
                    religion: document.getElementById('ed-rel').value.trim(),
                    institucion_educacional: document.getElementById('ed-inst').value.trim(),
                    nivel: document.getElementById('ed-nivel').value.trim(),
                    apoderado_titular_nombre: document.getElementById('ed-apt-nom').value.trim(),
                    apoderado_titular_parentesco: document.getElementById('ed-apt-par').value.trim(),
                    apoderado_titular_telefono: document.getElementById('ed-apt-tel').value.trim(),
                    apoderado_titular_email: document.getElementById('ed-apt-ema').value.trim(),
                    apoderado_suplente1_nombre: document.getElementById('ed-aps-nom').value.trim(),
                    apoderado_suplente1_telefono: document.getElementById('ed-aps-tel').value.trim(),
                    prevision_salud: document.getElementById('ed-prev').value,
                    numero_registro_isapre: document.getElementById('ed-isapre').value.trim(),
                    grupo_sanguineo: document.getElementById('ed-sangre').value,
                    tiene_seguro_complementario: document.getElementById('ed-seguro').checked,
                    aseguradora: document.getElementById('ed-aseg').value.trim(),
                    numero_poliza: document.getElementById('ed-pol').value.trim(),
                    vacunas: document.getElementById('ed-vac').value.trim(),
                    condiciones_necesidades: document.getElementById('ed-cond').value.split(',').map(s=>s.trim()).filter(s=>s),
                    condiciones_explicacion: document.getElementById('ed-cond-exp').value.trim(),
                    talla: document.getElementById('ed-talla').value,
                    medida_hombros: document.getElementById('ed-hombros').value ? parseFloat(document.getElementById('ed-hombros').value) : null,
                    medida_largo: document.getElementById('ed-largo').value ? parseFloat(document.getElementById('ed-largo').value) : null,
                    unidad: document.getElementById('ed-uni').value.trim(),
                    fecha_ingreso_grupo: document.getElementById('ed-fing').value || null,
                    tipo_miembro: document.getElementById('ed-tmi').value.trim(),
                    registro_pagado: document.getElementById('ed-reg').checked,
                    progresion_documento: document.getElementById('ed-doc').checked,
                    activo: document.getElementById('ed-activo')?.checked ?? true
                };
            }

            try {
                const btn = document.querySelector('#modal-editar-joven .btn-success');
                const htmlOld = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Transmitiendo cifrado...';
                btn.disabled = true;

                const { error } = await supabaseClient.from('mmbb_registrations').update(payload).eq('id', currentEditJovenId);
                if (error) throw error;
                
                const index = personasJovenes.findIndex(j => j.id === currentEditJovenId);
                if (index !== -1) {
                    Object.assign(personasJovenes[index], payload);
                    personasJovenes[index].nombre = `${payload.nombres} ${payload.apellidos}`;
                    renderYouthProfile(personasJovenes[index]);
                }
                
                btn.innerHTML = htmlOld;
                btn.disabled = false;
                
                mostrarNotificacion('exito', 'Transacción Completa. Expediente Institucional sincronizado con la Base de Datos de Grupo.');
                cerrarModalEditarJoven();
                renderYouthList();
            } catch (error) { 
                console.error("SysError DB Edit:", error); 
                mostrarNotificacion('error', 'Fallo de integridad de datos remotos al guardar. Ver consola.'); 
                const btn = document.querySelector('#modal-editar-joven .btn-success');
                btn.innerHTML = '<i class="fas fa-cloud-upload-alt mr-2"></i> Reintentar Sincronización';
                btn.disabled = false;
            }
        }

        // ================= FUNCIONES PARA TRANSFERIR A ADULTOS =================
