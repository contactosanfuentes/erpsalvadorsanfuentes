        window.actualizarCampoAdulto = async function(id, field, value) { try { let payload = {}; payload[field] = value; const { error } = await window.supabaseClient.from('adultos_registros').update(payload).eq('id', id); if (error) throw error; const index = window.padronAdultos.findIndex(a => a.id === id); if (index !== -1) { window.padronAdultos[index][field] = value; window.renderAdultProfile(window.padronAdultos[index]); } window.mostrarNotificacion('exito', 'Dato actualizado correctamente.'); } catch (e) { console.error(e); window.mostrarNotificacion('error', 'Error al actualizar.'); } };

        window.verAcuerdoOriginal = function(id) {
            const adulto = window.padronAdultos.find(x => x.id === id);
            if (!adulto || !adulto.compromisoOficial) return;
            const comp = adulto.compromisoOficial;
            let c = {};
            try { c = typeof comp.compromisos === 'string' ? JSON.parse(comp.compromisos) : (comp.compromisos || {}); } catch(err) {}
            const e = window.escapeHtml;
            const w = window.open('', '_blank');

            const doc = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Compromiso Original Firmado - ${e(comp.nombre)}</title>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Poppins', sans-serif; margin: 0; padding: 40px; color: #1e293b; background: #f8fafc; line-height: 1.6; }
                    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 8px solid #1e3a8a; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
                    .header-logo { max-width: 90px; height: auto; margin-bottom: 15px; }
                    h1 { color: #1e3a8a; font-size: 24px; margin: 0 0 5px 0; font-weight: 800; text-transform: uppercase; }
                    .subtitle { color: #64748b; font-size: 14px; margin: 0; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; background: #f1f5f9; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
                    .info-item strong { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
                    .info-item span { font-weight: 600; font-size: 14px; color: #0f172a; }
                    .compromiso-section { margin-bottom: 25px; }
                    .section-title { color: #1e3a8a; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; font-weight: 800; }
                    .compromiso-item { margin-bottom: 20px; padding-left: 15px; border-left: 4px solid #3b82f6; }
                    .compromiso-item h3 { margin: 0 0 8px 0; color: #1e3a8a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
                    .compromiso-item p { margin: 0; font-size: 14px; background: #fafafa; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; line-height: 1.5; color: #334155; }
                    .firma-container { margin-top: 50px; text-align: center; border-top: 2px dashed #cbd5e1; padding-top: 40px; }
                    .firma-img { max-width: 300px; max-height: 150px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: white; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                    .firma-text { color: #1e3a8a; font-weight: 800; font-size: 16px; margin-bottom: 5px; }
                    .timestamp { color: #64748b; font-size: 11px; margin-top: 10px; }
                    .print-btn { display: block; margin: 40px auto 0; background: #1e3a8a; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600; font-family: 'Poppins', sans-serif; transition: background 0.2s; }
                    .print-btn:hover { background: #1e40af; }
                    @media print { body { padding: 0; background: white; } .container { box-shadow: none; border: none; padding: 0; } .print-btn { display: none; } }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="https://i.imgur.com/11u9rUD.png" alt="Logo Grupo Salvador Sanfuentes" class="header-logo" onerror="this.src='https://via.placeholder.com/100x100/1e3a8a/ffffff?text=Logo+Grupo'">
                        <h1>COMPROMISO PERSONAL DE VOLUNTARIADO</h1>
                        <p class="subtitle">Grupo Guía y Scouts Salvador Sanfuentes</p>
                    </div>
                    <div class="info-grid">
                        <div class="info-item"><strong>Nombre Completo</strong><span>${e(comp.nombre)}</span></div>
                        <div class="info-item"><strong>RUN</strong><span>${e(comp.run)}</span></div>
                        <div class="info-item"><strong>Fecha de Registro</strong><span>${e(comp.fecha)}</span></div>
                        <div class="info-item"><strong>Correo Electrónico</strong><span>${e(comp.email)}</span></div>
                        ${comp.ap_nombre ? `<div class="info-item"><strong>Acompañante Personal (AP)</strong><span>${e(comp.ap_nombre)}</span></div>` : ''}
                        ${comp.apf_nombre ? `<div class="info-item"><strong>Asesor P. Formación (APF)</strong><span>${e(comp.apf_nombre)}</span></div>` : ''}
                    </div>
                    <div class="compromiso-section">
                        <h2 class="section-title">Acuerdos Establecidos</h2>
                        <div class="compromiso-item"><h3>1. Formación Institucional (Cursos)</h3><p>${e(c.compromiso_formacion || c.formacion || 'Sin redactar')}</p></div>
                        <div class="compromiso-item"><h3>2. Trabajo en la Unidad (Metas)</h3><p>${e(c.compromiso_unidad || c.unidad || 'Sin redactar')}</p></div>
                        <div class="compromiso-item"><h3>3. Participación y Asistencia</h3><p>${e(c.compromiso_asistencia || c.asistencia || 'Sin redactar')}</p></div>
                        <div class="compromiso-item"><h3>4. Relación y Trabajo con AP</h3><p>${e(c.compromiso_ap || c.ap || 'Sin redactar')}</p></div>
                        <div class="compromiso-item"><h3>5. Desarrollo General del PPF</h3><p>${e(c.compromiso_ppf || c.ppf || 'Sin redactar')}</p></div>
                        <div class="compromiso-item"><h3>6. Criterios Evaluación Final</h3><p>${e(c.compromiso_evaluacion || c.evaluacion || 'Sin redactar')}</p></div>
                        <div class="compromiso-item"><h3>7. Otros Acuerdos Extras</h3><p>${e(c.compromiso_otros || c.otros || 'Sin registrar')}</p></div>
                    </div>
                    <div class="firma-container">
                        <div class="firma-text">Firma Digital del Voluntario</div>
                        ${comp.firma_url ? `<img src="${comp.firma_url}" class="firma-img" alt="Firma">` : '<div style="padding: 20px; border: 1px solid #cbd5e1; display: inline-block; border-radius: 8px; color: #64748b;">Firma no disponible</div>'}
                        <div class="timestamp">Documento firmado electrónicamente. Registro digital con sello de tiempo:<br>${e(comp.firma_timestamp || comp.created_at || 'N/A')}</div>
                    </div>
                    <button class="print-btn" onclick="window.print()">🖨️ Imprimir o Guardar PDF</button>
                </div>
            

</body>
            </html>`;
            w.document.write(doc);
            w.document.close();
        };

        window.cargarAdultos = async function() {
            // Inicializar Permisos si no está listo aún
            if (window.Permisos && !Permisos.listo()) {
                const sb = window._sbClient || window.supabaseClient;
                if (sb) await Permisos.init(sb);
            }
            // Esperar confirmación (máx 5s adicionales)
            if (window.Permisos && !Permisos.listo()) {
                await new Promise(r => {
                    const t = setInterval(() => { if (Permisos.listo()) { clearInterval(t); r(); } }, 80);
                    setTimeout(() => { clearInterval(t); r(); }, 5000);
                });
            }
            try {
                // Dirigentes solo ven adultos de su unidad; coordinación y admin ven todos
                let queryAdultos = window.supabaseClient.from('adultos_registros').select('*').order('apellidos');
                const esDirigente = window.Permisos && Permisos.listo() && !Permisos.esAdmin() && Permisos.nivel() < 4;
                if (esDirigente && Permisos.unidad()) {
                    const palabraUnidad = Permisos.unidad().split(' ')[0];
                    queryAdultos = queryAdultos.ilike('unidad_rol', '%' + palabraUnidad + '%');
                }
                const { data, error } = await queryAdultos;
                if (error) throw error;
                const { data: compromisos, error: errComp } = await window.supabaseClient.from('compromisos_adultos').select('*');
                
                const normalizeRun = (r) => r ? String(r).replace(/[^0-9Kk]/g, '').toUpperCase() : '';
                const compMap = {}; 
                if (compromisos && !errComp) { compromisos.forEach(c => { compMap[normalizeRun(c.run)] = c; }); }
                
                window.padronAdultos = (data || []).map(a => {
                    const compOficial = compMap[normalizeRun(a.run)] || null; 
                    let cJSON = {};
                    if (compOficial && compOficial.compromisos) {
                        try { cJSON = typeof compOficial.compromisos === 'string' ? JSON.parse(compOficial.compromisos) : compOficial.compromisos; } catch(e) {}
                    }
                    
                    let nivelMapeado = a.nivel_formacion || 'Sin Formación';
                    if (nivelMapeado.toLowerCase() === 'inicial') nivelMapeado = 'Básico';
                    else if (nivelMapeado.toLowerCase() === 'medio') nivelMapeado = 'Medio';
                    else if (nivelMapeado.toLowerCase() === 'avanzado' || nivelMapeado.toLowerCase() === 'director' || nivelMapeado.toLowerCase() === 'formador') nivelMapeado = 'Avanzado';

                    return { id: a.id, nombreCompleto: `${a.nombres} ${a.apellidos}`.trim(), nombres: a.nombres, apellidos: a.apellidos, run: a.run, fecha_nacimiento: a.fecha_nacimiento, edad: window.calcularEdad(a.fecha_nacimiento), foto_url: a.foto_url || 'https://ui-avatars.com/api/?name='+encodeURIComponent(a.nombres)+'&background=1e293b&color=fff&bold=true', email: a.email, telefono: a.telefono, domicilio: a.domicilio, nacionalidad: a.nacionalidad, roles: a.roles || [], unidad_rol: a.unidad_rol || 'Sin Unidad Asignada', nivel_formacion: nivelMapeado, cursos: a.cursos || [], fase_ciclo_vida: a.fase_ciclo_vida || 'Captación/Ingreso', compromisoOficial: compOficial, ap_nombre: compOficial && compOficial.ap_nombre ? compOficial.ap_nombre : (a.ap_nombre || ''), apf_nombre: compOficial && compOficial.apf_nombre ? compOficial.apf_nombre : (a.apf_nombre || ''), etapa_ppf: a.etapa_ppf || 'Inicial', compromiso_formacion: cJSON.compromiso_formacion || cJSON.formacion || a.compromiso_formacion || '', compromiso_unidad: cJSON.compromiso_unidad || cJSON.unidad || a.compromiso_unidad || '', compromiso_asistencia: cJSON.compromiso_asistencia || cJSON.asistencia || a.compromiso_asistencia || '', compromiso_ap: cJSON.compromiso_ap || cJSON.ap || a.compromiso_ap || '', compromiso_ppf: cJSON.compromiso_ppf || cJSON.ppf || a.compromiso_ppf || '', compromiso_evaluacion: cJSON.compromiso_evaluacion || cJSON.evaluacion || a.compromiso_evaluacion || '', compromiso_otros: cJSON.compromiso_otros || cJSON.otros || a.compromiso_otros || '', ppf_competencias: a.ppf_competencias || [], ppf_ruta_aprendizaje: a.ppf_ruta_aprendizaje || [], ppf_seguimiento: a.ppf_seguimiento || [], desempeno_funciones: a.desempeno_funciones || [], desempeno_acontecimientos: a.desempeno_acontecimientos || [], desempeno_conductual: a.desempeno_conductual || [], desempeno_star: a.desempeno_star || [], cert_antecedentes_url: a.cert_antecedentes_url, cert_inhabilidad_url: a.cert_inhabilidad_url, cert_inhabilidad_relevante_url: a.cert_inhabilidad_relevante_url, cuota_pagada: a.cuota_pagada, emergencia_nombre: a.emergencia_nombre, emergencia_telefono: a.emergencia_telefono, emergencia_parentesco: a.emergencia_parentesco, prevision_salud: a.prevision_salud, isapre_nombre: a.isapre_nombre, grupo_sanguineo: a.grupo_sanguineo, alergias: a.alergias || [], profesion: a.profesion, disponibilidad: a.disponibilidad, certificados_formacion: a.certificados_formacion || {}, activo: a.activo !== false };
                });
                window.renderAdultList();
            } catch (e) { 
                console.error('❌ Error cargarAdultos:', e);
                window.mostrarNotificacion('error', 'Error al cargar datos: ' + e.message); 
            }
        };

        window.filterByFormacion = function(nivel, btn) { document.querySelectorAll('.adult-tag').forEach(el=>{el.classList.remove('active'); el.style.opacity='0.5';}); btn.classList.add('active'); btn.style.opacity='1'; window.activeFilter = nivel; window.renderAdultList(); };
        window.filterAdultList = function() { window.renderAdultList(); };
        window.mostrarInactivosAdultos = false;
        window.toggleInactivosAdultos = function() { window.mostrarInactivosAdultos = !window.mostrarInactivosAdultos; const btn = document.getElementById('btn-toggle-inactivos-adultos'); btn.innerHTML = window.mostrarInactivosAdultos ? '<i class="fas fa-eye-slash"></i> Ocultar inactivos' : '<i class="fas fa-eye"></i> Ver inactivos'; btn.style.background = window.mostrarInactivosAdultos ? '#fef3c7' : ''; btn.style.color = window.mostrarInactivosAdultos ? '#92400e' : ''; window.renderAdultList(); };
        window.toggleActivoAdulto = async function(adultoId) { const a = window.padronAdultos.find(x => x.id === adultoId); if (!a) return; const nv = !a.activo; try { const { error } = await window.supabaseClient.from('adultos_registros').update({ activo: nv }).eq('id', adultoId); if (error) throw error; a.activo = nv; window.renderAdultProfile(a); window.renderAdultList(); window.mostrarNotificacion('exito', a.nombreCompleto + (nv ? ' marcado como ACTIVO.' : ' marcado como INACTIVO.')); } catch(e) { window.mostrarNotificacion('error', 'Error: ' + e.message); } };
        window.renderAdultList = function() { const query = document.getElementById('search-adult').value.toLowerCase(); const ul = document.getElementById('adult-ul-list'); ul.innerHTML = ''; let count = 0; window.padronAdultos.forEach(a => { if (!window.mostrarInactivosAdultos && !a.activo) return; const matchName = a.nombreCompleto.toLowerCase().includes(query) || (a.roles.join(' ')).toLowerCase().includes(query) || a.unidad_rol.toLowerCase().includes(query); const matchFilter = window.activeFilter === 'Todos' || a.nivel_formacion === window.activeFilter; if (matchName && matchFilter) { count++; const li = document.createElement('li'); li.className = 'adult-list-item'; if (!a.activo) li.style.opacity = '0.45'; let badgeColor = '#94A3B8'; if(a.nivel_formacion === 'Básico') badgeColor = '#3B82F6'; else if(a.nivel_formacion === 'Medio') badgeColor = '#8B5CF6'; else if(a.nivel_formacion === 'Avanzado') badgeColor = '#10B981'; li.onclick = () => { document.querySelectorAll('.adult-list-item').forEach(e=>e.classList.remove('active')); li.classList.add('active'); window.renderAdultProfile(a); }; const mainRole = a.roles && a.roles.length > 0 ? a.roles[0] : 'Voluntario'; li.innerHTML = `<img src="${a.foto_url}" class="adult-list-pic" style="border-color:${a.activo ? badgeColor : '#94a3b8'};${!a.activo ? 'filter:grayscale(0.8);' : ''}"><div class="adult-list-info"><h4>${window.escapeHtml(a.nombreCompleto)}${!a.activo ? ' <span style="color:#ef4444;font-size:0.6rem;font-weight:700;background:#fef2f2;padding:1px 6px;border-radius:4px;margin-left:4px;">INACTIVO</span>' : ''}</h4><p>${getLogoUnidad(a.unidad_rol) ? `<img src="${getLogoUnidad(a.unidad_rol)}" style="width:16px;height:16px;object-fit:contain;vertical-align:-2px;margin-right:4px;">` : `<i class="fas fa-id-badge text-[0.65rem] mr-1 text-slate-400"></i>`}${window.escapeHtml(mainRole)} - <span class="font-semibold">${window.escapeHtml(a.unidad_rol)}</span></p></div><div class="ml-auto w-3 h-3 rounded-full" style="background:${a.activo ? badgeColor : '#94a3b8'}"></div>`; ul.appendChild(li); } }); if(count === 0) ul.innerHTML = `<div class="p-8 text-center text-slate-400"><i class="fas fa-search text-4xl mb-4 opacity-30 block"></i><p class="text-sm font-semibold">No se encontraron dirigentes.</p></div>`; };

