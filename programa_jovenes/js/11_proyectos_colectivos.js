        function abrirModalCrearProyecto(jovenId, contexto = 'Clan') {
            currentJovenIdForProject = jovenId; currentEditProjectId = null; currentEvidencias = [];
            
            const modalTitle = document.getElementById('modal-proyecto').querySelector('h3');
            modalTitle.innerHTML = contexto === 'Avanzada' ? '<i class="fas fa-mountain mr-2 text-purple-600"></i> Formulación Proyecto de Avanzada ("Mi Propia Aventura")' : '<i class="fas fa-project-diagram mr-2 text-red-600"></i> Estructuración de Proyecto Colectivo (Clan)';
            document.getElementById('edit-proyecto-contexto').value = contexto;

            document.getElementById('responsables-container').innerHTML = '';
            areasResponsabilidad.forEach(area => {
                document.getElementById('responsables-container').innerHTML += `
                    <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm relative">
                        <label class="text-xs font-extrabold uppercase tracking-wide text-indigo-900 block mb-2"><i class="fas fa-sitemap mr-1 opacity-50"></i> ${area}</label>
                        <div class="flex gap-2 mb-2">
                            <input type="text" id="resp-${area}" placeholder="Buscar en Padrón Nacional (Jóvenes y Adultos)..." class="flex-1 border-b border-gray-300 pb-1 outline-none text-sm font-medium focus:border-indigo-500 bg-transparent transition">
                            <button onclick="buscarPersonaResponsable('${area}')" class="text-indigo-600 hover:text-indigo-800 transition"><i class="fas fa-search"></i></button>
                        </div>
                        <div id="resultados-${areaKey(area)}" class="search-results hidden absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg p-2 mt-1 max-h-32 overflow-y-auto shadow-xl z-20"></div>
                        <div id="selected-${area}" class="mt-1"></div>
                    </div>`;
                currentResponsables[area] = null;
            });
            currentParticipantes = []; document.getElementById('participantes-list').innerHTML = '';
            document.getElementById('proyecto-nombre').value = ''; document.getElementById('proyecto-objetivo').value = '';
            document.getElementById('edit-proyecto-id').value = '';
            document.getElementById('evidencias-list').innerHTML = '';
            
            const selectCampo = document.getElementById('proyecto-campo');
            selectCampo.innerHTML = contexto === 'Avanzada' 
                ? '<option value="Cultura y Artes">Cultura y Artes</option><option value="Actividad Física">Actividad Física</option><option value="Trabajo en Equipo">Trabajo en Equipo</option><option value="Innovación / Técnica">Innovación / Técnica</option><option value="Ciudadanía">Ciudadanía</option><option value="Comunicaciones">Comunicaciones</option><option value="Medio Ambiente">Medio Ambiente</option>' 
                : '<option value="Servicio">Intervención de Servicio / Comunitaria</option><option value="Trabajo">Mundo del Trabajo / Emprendimiento</option><option value="Viaje">Viaje / Inmersión Cultural</option><option value="Naturaleza">Naturaleza / Sustentabilidad (ODS)</option>';
            
            document.getElementById('modal-proyecto').classList.add('active');
        }

        async function editarProyectoColectivo(proyectoId, jovenId) {
            try {
                const pid = Number(proyectoId);
                const joven = personasJovenes.find(j => j.id === jovenId);
                if (!joven) {
                    mostrarNotificacion('error', 'No se encontró al joven.');
                    return;
                }
                const proyecto = joven.camino?.proyectos_colectivos?.find(p => p.id === pid);
                if (!proyecto) {
                    mostrarNotificacion('error', 'No se encontró el proyecto.');
                    return;
                }

                currentJovenIdForProject = jovenId;
                currentEditProjectId = pid;
                currentEvidencias = (proyecto.evidencias || []).map(e =>
                    typeof e === 'string' ? { url: e, nombre: e.split('/').pop() } : e
                );
                const contexto = joven.rama;

                const modalTitle = document.getElementById('modal-proyecto').querySelector('h3');
                modalTitle.innerHTML = contexto === 'Avanzada' ? '<i class="fas fa-mountain mr-2 text-purple-600"></i> Edición Proyecto de Avanzada ("Mi Propia Aventura")' : '<i class="fas fa-project-diagram mr-2 text-red-600"></i> Edición Proyecto Colectivo (Clan)';
                document.getElementById('edit-proyecto-contexto').value = contexto;

                document.getElementById('responsables-container').innerHTML = '';
                areasResponsabilidad.forEach(area => {
                    document.getElementById('responsables-container').innerHTML += `
                        <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm relative">
                            <label class="text-xs font-extrabold uppercase tracking-wide text-indigo-900 block mb-2"><i class="fas fa-sitemap mr-1 opacity-50"></i> ${area}</label>
                            <div class="flex gap-2 mb-2">
                                <input type="text" id="resp-${area}" placeholder="Buscar en Padrón Nacional (Jóvenes y Adultos)..." class="flex-1 border-b border-gray-300 pb-1 outline-none text-sm font-medium focus:border-indigo-500 bg-transparent transition">
                                <button onclick="buscarPersonaResponsable('${area}')" class="text-indigo-600 hover:text-indigo-800 transition"><i class="fas fa-search"></i></button>
                            </div>
                            <div id="resultados-${areaKey(area)}" class="search-results hidden absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg p-2 mt-1 max-h-32 overflow-y-auto shadow-xl z-20"></div>
                            <div id="selected-${area}" class="mt-1"></div>
                        </div>`;
                    currentResponsables[area] = null;
                });

                const selectCampo = document.getElementById('proyecto-campo');
                selectCampo.innerHTML = contexto === 'Avanzada' 
                    ? '<option value="Cultura y Artes">Cultura y Artes</option><option value="Actividad Física">Actividad Física</option><option value="Trabajo en Equipo">Trabajo en Equipo</option><option value="Innovación / Técnica">Innovación / Técnica</option><option value="Ciudadanía">Ciudadanía</option><option value="Comunicaciones">Comunicaciones</option><option value="Medio Ambiente">Medio Ambiente</option>' 
                    : '<option value="Servicio">Intervención de Servicio / Comunitaria</option><option value="Trabajo">Mundo del Trabajo / Emprendimiento</option><option value="Viaje">Viaje / Inmersión Cultural</option><option value="Naturaleza">Naturaleza / Sustentabilidad (ODS)</option>';

                document.getElementById('proyecto-nombre').value = proyecto.nombre || '';
                document.getElementById('proyecto-objetivo').value = proyecto.objetivo || '';
                document.getElementById('proyecto-campo').value = proyecto.campoAccion || (contexto === 'Avanzada' ? 'Cultura y Artes' : 'Servicio');
                document.getElementById('proyecto-inicio').value = proyecto.inicio || '';
                document.getElementById('proyecto-termino').value = proyecto.termino || '';
                document.getElementById('edit-proyecto-id').value = pid;
                document.getElementById('edit-proyecto-contexto').value = contexto;

                if (proyecto.responsables) {
                    for (const area in proyecto.responsables) {
                        const resp = proyecto.responsables[area];
                        if (resp) {
                            currentResponsables[area] = resp;
                            const selectedDiv = document.getElementById(`selected-${area}`);
                            if (selectedDiv) {
                                selectedDiv.innerHTML = `
                                    <div class="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow"><img src="${resp.foto}" class="w-5 h-5 rounded-full border border-white"> <span class="text-xs font-bold truncate">${resp.nombre}</span></div>
                                `;
                                document.getElementById(`resp-${area}`).value = '';
                            }
                        }
                    }
                }

                currentParticipantes = [];
                const participantesList = document.getElementById('participantes-list');
                if (participantesList) participantesList.innerHTML = '';
                if (proyecto.participantes && proyecto.participantes.length) {
                    proyecto.participantes.forEach(p => {
                        agregarParticipante(p.run, p.nombre, p.tipo, p.foto);
                    });
                }

                renderEvidenciasList();
                document.getElementById('modal-proyecto').classList.add('active');
            } catch (error) {
                console.error('Error en editarProyectoColectivo:', error);
                mostrarNotificacion('error', 'Error al abrir el proyecto para edición.');
            }
        }

        async function eliminarProyectoColectivoGlobal(proyectoId, jovenId) {
            const pid = Number(proyectoId);
            if (!confirm('¿Atención: Está seguro de eliminar este proyecto del historial de la unidad?')) return;
            try {
                const joven = personasJovenes.find(j => j.id === jovenId);
                if(joven) {
                    // Obtener el proyecto antes de eliminarlo para sincronizar con participantes
                    const proyectoAEliminar = joven.camino.proyectos_colectivos.find(p => p.id === pid);
                    if (proyectoAEliminar) {
                        // Sincronizar eliminación con todos los participantes
                        await sincronizarProyectoConParticipantes(proyectoAEliminar, joven.id, true);
                    }
                    joven.camino.proyectos_colectivos = joven.camino.proyectos_colectivos.filter(p => p.id !== pid);
                    await updateProgresionDB(joven.id, 'camino', joven.camino);
                }
                mostrarNotificacion('exito', 'Proyecto eliminado del portafolio.');
            } catch (error) {
                console.error('Error al eliminar proyecto:', error);
                mostrarNotificacion('error', 'Error en base de datos al eliminar proyecto.');
            }
        }

        async function buscarPersonaResponsable(area) {
            const input = document.getElementById(`resp-${area}`); const query = input.value.trim();
            if (query.length < 3) return;
            const resultsDiv = document.getElementById(`resultados-${areaKey(area)}`);
            resultsDiv.innerHTML = '<div class="text-center text-xs py-2 text-indigo-500"><i class="fas fa-spinner fa-pulse"></i> Consultando Servidores Sede Nacional...</div>'; resultsDiv.classList.remove('hidden');
            try {
                const { data: mmbb } = await supabaseClient.from('mmbb_registrations').select('run, nombres, apellidos, foto_url').or(`run.ilike.%${query}%,nombres.ilike.%${query}%,apellidos.ilike.%${query}%`);
                const { data: adultos } = await supabaseClient.from('adultos_registros').select('run, nombres, apellidos, foto_url').or(`run.ilike.%${query}%,nombres.ilike.%${query}%,apellidos.ilike.%${query}%`);
                let all = [];
                if (mmbb) all = all.concat(mmbb.map(p => ({ ...p, tipo: 'joven' })));
                if (adultos) all = all.concat(adultos.map(a => ({ ...a, tipo: 'adulto' })));
                let html = '';
                if (all.length) {
                    all.forEach(p => {
                        const f = p.foto_url || 'https://ui-avatars.com/api/?name='+encodeURIComponent(p.nombres)+'&background=e0e7ff&color=3730a3&bold=true';
                        html += `<div class="cursor-pointer hover:bg-indigo-50 p-2 rounded flex items-center gap-2 transition" onclick="seleccionarPersonaResponsable('${area}', '${p.run}', '${p.nombres} ${p.apellidos}', '${p.tipo}', '${f}')">
                                    <img src="${f}" class="w-6 h-6 rounded-full border border-indigo-200"> <span class="text-xs font-bold text-gray-700">${p.nombres} ${p.apellidos} (${p.tipo === 'joven' ? 'Joven' : 'Adulto'})</span>
                                 </div>`;
                    });
                }
                resultsDiv.innerHTML = html || '<div class="text-center text-xs py-2 text-red-400 font-bold">No registra membresía.</div>';
            } catch(e) { resultsDiv.innerHTML = '<div class="text-center text-xs py-2 text-red-500">Timeout DB</div>'; }
        }
        
        function seleccionarPersonaResponsable(area, run, nombre, tipo, foto) {
            currentResponsables[area] = { run, nombre, tipo, foto };
            document.getElementById(`selected-${area}`).innerHTML = `<div class="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow"><img src="${foto}" class="w-5 h-5 rounded-full border border-white"> <span class="text-xs font-bold truncate">${nombre}</span></div>`;
            document.getElementById(`resultados-${areaKey(area)}`).classList.add('hidden');
            document.getElementById(`resp-${area}`).value = '';
        }

        async function buscarPersonaParticipante() {
            const query = document.getElementById('buscar-participante').value.trim();
            if (query.length < 3) return;
            const res = document.getElementById('resultados-busqueda'); res.innerHTML = '<div class="text-center text-sm py-4 text-indigo-500 font-bold"><i class="fas fa-network-wired fa-pulse mr-2"></i> Enlazando con Base de Datos Nacional API...</div>'; res.classList.remove('hidden');
            try {
                const { data: mmbb } = await supabaseClient.from('mmbb_registrations').select('run, nombres, apellidos, foto_url').or(`run.ilike.%${query}%,nombres.ilike.%${query}%,apellidos.ilike.%${query}%`);
                const { data: adultos } = await supabaseClient.from('adultos_registros').select('run, nombres, apellidos, foto_url').or(`run.ilike.%${query}%,nombres.ilike.%${query}%,apellidos.ilike.%${query}%`);
                let all = [];
                if (mmbb) all = all.concat(mmbb.map(p => ({ ...p, tipo: 'joven' })));
                if (adultos) all = all.concat(adultos.map(a => ({ ...a, tipo: 'adulto' })));
                let html = '';
                if (all.length) {
                    all.forEach(p => { 
                        const f = p.foto_url || 'https://ui-avatars.com/api/?name='+encodeURIComponent(p.nombres)+'&background=e2e8f0&color=0f172a&bold=true'; 
                        html += `<div class="cursor-pointer hover:bg-gray-100 p-2 border-b border-gray-100 flex items-center gap-3 transition" onclick="agregarParticipante('${p.run}', '${p.nombres} ${p.apellidos}', '${p.tipo}', '${f}')">
                                    <img src="${f}" class="w-8 h-8 rounded-full border border-gray-300"> 
                                    <div class="flex flex-col"><span class="text-sm font-bold text-gray-800 leading-tight">${p.nombres} ${p.apellidos}</span><span class="text-[0.65rem] text-gray-400 font-mono">${p.tipo === 'joven' ? 'Joven' : 'Adulto'} - ID: ${p.run || 'SN'}</span></div>
                                 </div>`; 
                    });
                }
                res.innerHTML = html || '<div class="text-center font-bold text-red-500 py-4">Búsqueda infructuosa. Identidad no empadronada.</div>';
            } catch(e) { res.innerHTML = '<div class="text-center text-red-500 font-bold py-2">Error de capa de red.</div>'; }
        }
        
        function agregarParticipante(run, nombre, tipo, foto) {
            if (!currentParticipantes.some(p => p.run === run)) { 
                currentParticipantes.push({ run, nombre, tipo, foto }); 
                document.getElementById('participantes-list').innerHTML += `<div class="bg-white border border-gray-200 p-2 rounded-lg flex items-center gap-3 shadow-sm" id="part-${run}"><img src="${foto}" class="w-8 h-8 rounded-full"><span class="text-xs font-bold text-gray-700 flex-1 truncate">${nombre} (${tipo === 'joven' ? 'Joven' : 'Adulto'})</span><button onclick="document.getElementById('part-${run}').remove(); currentParticipantes = currentParticipantes.filter(x=>x.run!=='${run}')" class="text-red-400 hover:text-red-600 transition outline-none"><i class="fas fa-trash-alt"></i></button></div>`; 
            }
            document.getElementById('resultados-busqueda').classList.add('hidden');
        }

        // ── Solicitudes Pendientes de Proyectos ──
        function renderSolicitudesHTML(proyecto, jovenId) {
            const sols = proyecto.solicitudes_pendientes || [];
            if (!sols.length) return '';
            return `<div class="mt-3 pt-3 border-t border-orange-200 bg-orange-50 rounded-lg p-3">
                <p class="text-xs font-extrabold text-orange-800 uppercase tracking-wide mb-2"><i class="fas fa-bell mr-1 text-orange-500"></i> Solicitudes Pendientes (${sols.length})</p>
                ${sols.map((s, idx) => `<div class="flex items-center gap-2 bg-white border border-orange-200 rounded-lg p-2 mb-1.5 shadow-sm">
                    <img src="${escapeHtml(s.foto || 'https://ui-avatars.com/api/?name='+encodeURIComponent(s.nombre)+'&size=28&background=fed7aa&color=9a3412')}" class="w-7 h-7 rounded-full object-cover border border-orange-300">
                    <div class="flex-1 min-w-0"><p class="text-xs font-bold text-gray-800 truncate">${escapeHtml(s.nombre)}</p><p class="text-[0.6rem] text-gray-400">${escapeHtml(s.rama || '')} · ${escapeHtml(s.fecha || '')}</p>${s.mensaje ? `<p class="text-[0.6rem] text-gray-500 italic mt-0.5">"${escapeHtml(s.mensaje)}"</p>` : ''}</div>
                    <span class="text-[0.6rem] font-bold text-orange-600 bg-orange-100 border border-orange-200 rounded-md px-2 py-1 shrink-0" title="Solo el creador del proyecto puede aprobar o rechazar, desde su Portal Caminante"><i class="fas fa-mobile-alt mr-1"></i>Se gestiona en el Portal Caminante</span>
                </div>`).join('')}
            </div>`;
        }

        // Aprobación/rechazo: EXCLUSIVAMENTE desde el Portal Caminante (creador del proyecto).

        async function enviarNotificacionProyecto(run, nombrePersona, proyecto, rol, invitadoPor) {
            try {
                const nombreProyecto = typeof proyecto === 'string' ? proyecto : proyecto.nombre;
                const p = typeof proyecto === 'object' ? proyecto : {};
                let email = null;
                const { data: jov } = await supabaseClient.from('mmbb_registrations').select('email_apoderado, apoderado_titular_email').ilike('run', run).maybeSingle();
                if (jov) email = jov.email_apoderado || jov.apoderado_titular_email;
                if (!email) { const { data: adu } = await supabaseClient.from('adultos_registros').select('email').ilike('run', run).maybeSingle(); if (adu) email = adu.email; }
                if (!email) return;

                const fechaHoy = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
                const esResp = rol !== 'Participante';
                const nParts = (p.participantes || []).length;
                const nResps = Object.keys(p.responsables || {}).length;
                const orgHTML = Object.entries(p.responsables || {}).map(([c, r]) => `<tr><td style="padding:4px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #f1f5f9;">${c}</td><td style="padding:4px 8px;font-size:0.82rem;color:#1e293b;font-weight:600;border-bottom:1px solid #f1f5f9;">${r.nombre || 'Por asignar'}</td></tr>`).join('');
                const objHTML = (p.objetivosEspecificos || []).map(o => `<li style="margin-bottom:4px;color:#475569;font-size:0.82rem;">${o}</li>`).join('');

                const htmlContent = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head><body style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f7f9;margin:0;padding:20px;"><div style="max-width:620px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);"><div style="background:linear-gradient(135deg,#0E2586 0%,#1e3a8a 50%,#E31837 100%);padding:30px;text-align:center;"><img src="https://i.imgur.com/11u9rUD.png" style="height:70px;margin-bottom:12px;"><h1 style="color:white;margin:0;font-size:1.4rem;font-weight:800;">Grupo Guías y Scouts<br>Salvador Sanfuentes</h1><p style="color:rgba(255,255,255,0.85);font-size:0.85rem;margin:10px 0 0;">Invitación a Proyecto de Intervención Social</p></div><div style="padding:30px;"><p style="font-size:1rem;color:#1e293b;">Estimado/a <strong>${nombrePersona}</strong>,</p><p style="color:#475569;line-height:1.6;">Has sido ${esResp ? 'designado/a como <strong>' + rol + '</strong> en' : 'incorporado/a como participante en'} el siguiente proyecto:</p><div style="background:linear-gradient(135deg,#fef2f2,#fff7ed);border:2px solid #E31837;border-radius:14px;padding:22px;margin:20px 0;"><h2 style="margin:0 0 14px;font-size:1.15rem;color:#1e293b;">📋 ${nombreProyecto}</h2><table style="width:100%;border-collapse:collapse;"><tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;width:130px;border-bottom:1px solid #fde8e8;"><strong>Tu rol:</strong></td><td style="padding:5px 8px;border-bottom:1px solid #fde8e8;"><span style="background:${esResp ? '#E31837' : '#10b981'};color:white;padding:3px 12px;border-radius:6px;font-weight:700;font-size:0.78rem;">${rol}</span></td></tr><tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Invitado por:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">${invitadoPor}</td></tr>${p.campoAccion ? '<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Campo:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">' + p.campoAccion + '</td></tr>' : ''}${p.inicio ? '<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Período:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">' + p.inicio + (p.termino ? ' → ' + p.termino : '') + '</td></tr>' : ''}${p.lugar ? '<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Lugar:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">' + p.lugar + '</td></tr>' : ''}${p.beneficiarios ? '<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;border-bottom:1px solid #fde8e8;"><strong>Beneficiarios:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;border-bottom:1px solid #fde8e8;">' + p.beneficiarios + '</td></tr>' : ''}<tr><td style="padding:5px 8px;font-size:0.82rem;color:#64748b;"><strong>Equipo:</strong></td><td style="padding:5px 8px;font-size:0.82rem;color:#1e293b;">${nParts} participante(s), ${nResps} responsable(s)</td></tr></table></div>${p.objetivo ? '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:16px 0;"><p style="font-weight:700;font-size:0.82rem;color:#0E2586;margin:0 0 6px;">🎯 Objetivo:</p><p style="margin:0;font-size:0.85rem;color:#334155;line-height:1.5;">' + p.objetivo + '</p></div>' : ''}${p.justificacion ? '<div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px;margin:16px 0;"><p style="font-weight:700;font-size:0.82rem;color:#854d0e;margin:0 0 6px;">📝 Justificación:</p><p style="margin:0;font-size:0.85rem;color:#475569;line-height:1.5;">' + p.justificacion + '</p></div>' : ''}${objHTML ? '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:16px 0;"><p style="font-weight:700;font-size:0.82rem;color:#166534;margin:0 0 8px;">✅ Objetivos Específicos:</p><ol style="margin:0;padding-left:20px;">' + objHTML + '</ol></div>' : ''}${orgHTML ? '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;margin:16px 0;"><p style="font-weight:700;font-size:0.82rem;color:#1e40af;margin:0 0 8px;">👥 Organigrama:</p><table style="width:100%;border-collapse:collapse;">' + orgHTML + '</table></div>' : ''}${esResp ? '<div style="background:#fef2f2;border-left:4px solid #E31837;padding:14px 18px;border-radius:0 8px 8px 0;margin:20px 0;"><p style="margin:0;font-size:0.85rem;color:#991b1b;font-weight:600;">📌 Como ' + rol + ', coordina con el equipo y revisa el plan de acción.</p></div>' : '<div style="background:#f0fdf4;border-left:4px solid #10b981;padding:14px 18px;border-radius:0 8px 8px 0;margin:20px 0;"><p style="margin:0;font-size:0.85rem;color:#065f46;font-weight:600;">🌱 Ya eres parte del equipo. Ingresa al portal para ver el plan completo.</p></div>'}' + (p.fichaExtendida && p.arbolProblema && p.arbolProblema.problemaCentral ? '<div style="border:2px solid #92400e;border-radius:12px;overflow:hidden;margin:20px 0;"><div style="background:linear-gradient(135deg,#92400e,#78350f);padding:10px 16px;text-align:center;"><p style="margin:0;font-size:0.82rem;font-weight:700;color:white;letter-spacing:0.5px;">🌳 Árbol del Problema del Proyecto</p></div><div style="padding:16px;background:linear-gradient(180deg,#eff6ff 0%,#f0fdf4 50%,#fefce8 100%);">' + (p.arbolProblema.consecuencias && p.arbolProblema.consecuencias.length ? '<div style="background:#fef3c7;border:1.5px solid #f59e0b;border-radius:10px;padding:12px;text-align:center;margin-bottom:4px;"><p style="font-weight:700;font-size:0.72rem;color:#92400e;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">☀️ CONSECUENCIAS / EFECTOS</p>' + p.arbolProblema.consecuencias.map(function(c,i){return "<p style=\"margin:3px 0;font-size:0.82rem;color:#78350f;background:white;padding:5px 12px;border-radius:6px;border:1px solid #fde68a;\">" + (i+1) + ". " + c + "</p>"}).join("") + "</div>" : "") + '<div style="text-align:center;"><div style="width:6px;height:14px;background:#92400e;margin:0 auto;border-radius:3px;"></div></div><div style="background:linear-gradient(135deg,#dc2626,#991b1b);border:2px solid #7f1d1d;border-radius:10px;padding:14px;text-align:center;margin:4px 0;box-shadow:0 4px 12px rgba(153,27,27,0.2);"><p style="font-weight:800;font-size:0.72rem;color:#fecaca;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">🎯 PROBLEMA CENTRAL</p><p style="margin:0;font-size:0.92rem;color:white;font-weight:700;line-height:1.4;">' + p.arbolProblema.problemaCentral + '</p></div><div style="text-align:center;"><div style="width:6px;height:14px;background:#92400e;margin:0 auto;border-radius:3px;"></div></div>' + (p.arbolProblema.causas && p.arbolProblema.causas.length ? '<div style="background:#d1fae5;border:1.5px solid #10b981;border-radius:10px;padding:12px;text-align:center;margin-top:4px;"><p style="font-weight:700;font-size:0.72rem;color:#065f46;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">🌱 CAUSAS / RAÍCES</p>' + p.arbolProblema.causas.map(function(c,i){return "<p style=\"margin:3px 0;font-size:0.82rem;color:#064e3b;background:white;padding:5px 12px;border-radius:6px;border:1px solid #a7f3d0;\">" + (i+1) + ". " + c + "</p>"}).join("") + "</div>" : "") + '</div></div>' : '') + '<div style=\"text-align:center;margin:28px 0 12px;\"><a href=\"https://salvadorsanfuentes.netlify.app/portal_caminante.html\" style=\"display:inline-block;background:linear-gradient(135deg,#E31837,#b91c1c);color:white;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;box-shadow:0 4px 15px rgba(227,24,55,0.4);letter-spacing:0.5px;\">🚀 Acceder al Portal</a></div><p style="text-align:center;font-size:0.78rem;color:#94a3b8;">RUT + últimos 4 dígitos como clave.</p><div style="border-top:1px solid #e2e8f0;margin-top:24px;padding-top:16px;"><p style="font-size:0.88rem;color:#1e293b;font-weight:600;">Siempre Listos, Siempre Listas,<br><span style="color:#64748b;font-weight:400;">Dirección del Grupo</span></p></div></div><div style="background:#0E2586;color:white;text-align:center;padding:16px;border-top:3px solid #FFD100;"><p style="margin:0;font-size:0.72rem;opacity:0.7;">Correo automático — Sistema de Gestión Educativa</p></div></div>

</body></html>`;

                await fetch('/.netlify/functions/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to_email: email, subject: `${esResp ? '📋' : '🌱'} Invitación: "${nombreProyecto}" — Grupo Scout`, html_content: htmlContent }) });
            } catch(e) { console.warn('Error email:', e); }
        }

        // ── Proyectos Vigentes (Avanzada + Clan) ──
