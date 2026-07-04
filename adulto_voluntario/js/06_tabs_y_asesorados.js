        window.switchTab = function(btn, tabId) { btn.parentElement.querySelectorAll('.profile-tab').forEach(t=>t.classList.remove('active')); btn.classList.add('active'); btn.parentElement.nextElementSibling.querySelectorAll('.p-tab-pane').forEach(p=>p.classList.remove('active')); document.getElementById(tabId).classList.add('active'); window.activeTab = tabId; };

        window.cargarProyectosAsesor = async function(adultoId, runAdulto) {
            const container = document.getElementById('asesor-proyectos-' + adultoId);
            if (!container) return;
            const myRun = (runAdulto || '').trim().toLowerCase();
            container.innerHTML = '<div class="col-span-full flex flex-col items-center justify-center p-10"><i class="fas fa-spinner fa-spin text-3xl text-gray-300 mb-3"></i><span class="text-gray-400 text-sm">Buscando proyectos...</span></div>';
            try {
                const { data: progs } = await window.supabaseClient.from('progresion_jovenes').select('joven_id, camino');
                // Buscar proyectos de mmbb_registrations también para obtener nombres
                const jovenIds = (progs || []).map(p => p.joven_id);
                const { data: jovens } = jovenIds.length > 0
                    ? await window.supabaseClient.from('mmbb_registrations').select('id, nombres, apellidos, run, unidad, foto_url').in('id', jovenIds)
                    : { data: [] };

                const proyectosEncontrados = [];
                const seen = new Set();
                for (const pg of (progs || [])) {
                    const joven = (jovens || []).find(j => j.id === pg.joven_id);
                    for (const proy of (pg.camino?.proyectos_colectivos || [])) {
                        if (!proy.id || seen.has(proy.id)) continue;
                        const esResp = proy.responsables && Object.values(proy.responsables).some(r => r && r.run && r.run.trim().toLowerCase() === myRun);
                        const esPart = (proy.participantes || []).some(pt => pt && pt.run && pt.run.toLowerCase() === myRun);
                        if (esResp || esPart) {
                            seen.add(proy.id);
                            proyectosEncontrados.push({ proy, joven, esResp,
                                areaRol: esResp ? (Object.entries(proy.responsables || {}).find(([, r]) => r && r.run && r.run.trim().toLowerCase() === myRun)?.[0] || '') : '' });
                        }
                    }
                }

                if (!proyectosEncontrados.length) {
                    container.innerHTML = '<div class="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50"><i class="fas fa-project-diagram text-5xl text-gray-200 mb-4"></i><span class="text-gray-400 font-bold">Sin proyectos asignados</span><span class="text-sm text-gray-400 mt-2 max-w-xs text-center">Este dirigente no aparece como responsable ni participante en ningún proyecto vigente.</span></div>';
                    return;
                }

                container.innerHTML = proyectosEncontrados.map(({ proy: p, joven, esResp, areaRol }) => {
                    const eh = s => (s || '').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
                    const sc = { 'Finalizado': '#10b981', 'En curso': '#3b82f6', 'Planificación': '#f59e0b', 'Evaluación': '#8b5cf6' };
                    const color = sc[p.estado] || '#f59e0b';
                    const pid = 'aes-' + p.id;
                    const rolBadge = esResp
                        ? '<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold"><i class="fas fa-star mr-1"></i>RESPONSABLE</span>'
                        : '<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold"><i class="fas fa-user mr-1"></i>PARTICIPANTE</span>';
                    const creadorNombre = joven ? `${joven.nombres} ${joven.apellidos}` : 'Desconocido';

                    let html = '<div class="border-2 border-gray-200 bg-gray-50 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col overflow-hidden">';
                    html += '<div class="absolute top-3 right-3">' + rolBadge + '</div>';

                    // Header
                    html += '<div class="bg-red-700 p-4 text-white flex justify-between items-center pr-4 relative">';
                    html += '<div class="flex-1"><h5 class="font-extrabold text-base truncate">' + eh(p.nombre) + '</h5>';
                    html += '<span style="background:' + color + '30;color:' + color + '" class="text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block">' + (p.estado || 'Planificación') + '</span></div>';
                    html += '<div class="flex flex-col items-end gap-1 ml-2">' + rolBadge + '</div></div>';

                    // Body
                    html += '<div class="p-4 flex flex-col gap-2 flex-1">';
                    html += '<div class="flex flex-wrap gap-1">';
                    html += '<span class="bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold px-2 py-0.5 rounded-full"><i class="fas fa-leaf mr-1"></i>' + eh(p.campoAccion || '') + '</span>';
                    if (areaRol) html += '<span class="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-2 py-0.5 rounded-full"><i class="fas fa-briefcase mr-1"></i>' + eh(areaRol) + '</span>';
                    html += '<span class="bg-white text-gray-500 border border-gray-200 text-xs px-2 py-0.5 rounded-full">' + (p.inicio || '?') + ' → ' + (p.termino || 'En ejecución') + '</span>';
                    html += '</div>';

                    // Objetivo
                    html += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Objetivo</p>';
                    html += '<p class="text-xs text-gray-700 italic border-l-4 border-red-200 pl-2">"' + eh(p.objetivo || '') + '"</p></div>';

                    // Acordeón detalles
                    html += '<div class="mt-1 pt-2 border-t border-gray-100">';
                    html += '<button onclick="window.toggleAsesorDetalle(this)" class="w-full flex items-center justify-between text-xs font-bold text-gray-500 hover:text-gray-800 transition py-1 px-2 rounded-lg hover:bg-gray-100">';
                    html += '<span><i class="fas fa-eye mr-1"></i> Ver detalles completos</span><i class="fas fa-chevron-down" id="' + pid + '-ico"></i></button>';
                    html += '<div id="' + pid + '" style="display:none;" class="mt-2 flex flex-col gap-2">';
                    // Resumen básico siempre presente en el panel
                    html += '<div class="bg-gray-100 rounded-lg p-3 mb-2">';
                    html += '<div class="grid grid-cols-2 gap-2 text-xs">';
                    html += '<div><span class="text-gray-400 font-bold uppercase text-[0.6rem] block">Inicio</span><span class="font-bold text-gray-700">' + (p.inicio || 'Sin fecha') + '</span></div>';
                    html += '<div><span class="text-gray-400 font-bold uppercase text-[0.6rem] block">Término</span><span class="font-bold text-gray-700">' + (p.termino || 'En ejecución') + '</span></div>';
                    html += '</div></div>';

                    if (p.justificacion) html += '<div><p class="text-[0.62rem] font-extrabold text-gray-400 uppercase mb-0.5">Justificación</p><p class="text-xs text-gray-700">' + eh(p.justificacion) + '</p></div>';
                    if (p.beneficiarios) html += '<p class="text-xs text-gray-600"><strong>Beneficiarios:</strong> ' + eh(p.beneficiarios) + '</p>';
                    if (p.lugar) html += '<p class="text-xs text-gray-600"><strong>Lugar:</strong> ' + eh(p.lugar) + '</p>';

                    const respEntries = Object.entries(p.responsables || {}).filter(([, r]) => r && r.nombre);
                    if (respEntries.length) {
                        html += '<div><p class="text-[0.62rem] font-extrabold text-gray-400 uppercase mb-0.5">Organigrama</p><div class="grid grid-cols-2 gap-1">';
                        respEntries.forEach(([cargo, r]) => { html += '<div class="bg-blue-50 border border-blue-100 rounded px-2 py-0.5 text-xs text-blue-800"><strong>' + eh(cargo) + ':</strong> ' + eh(r.nombre) + '</div>'; });
                        html += '</div></div>';
                    }

                    if ((p.participantes || []).length) {
                        html += '<div><p class="text-[0.62rem] font-extrabold text-gray-400 uppercase mb-0.5">Participantes</p><div class="flex flex-wrap gap-1">';
                        (p.participantes || []).forEach(pt => { html += '<span class="bg-white border border-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">' + eh(pt.nombre || '') + '</span>'; });
                        html += '</div></div>';
                    }

                    if ((p.planAccion || []).length) {
                        html += '<div><p class="text-[0.62rem] font-extrabold text-gray-400 uppercase mb-0.5">Plan de Acción</p><div class="overflow-x-auto"><table class="w-full text-xs border-collapse"><thead><tr class="bg-gray-100"><th class="text-left p-1 border border-gray-200">Acción</th><th class="text-left p-1 border border-gray-200">Responsable</th><th class="text-left p-1 border border-gray-200">Cronograma</th></tr></thead><tbody>';
                        (p.planAccion || []).forEach(a => { html += '<tr><td class="p-1 border border-gray-100">' + eh(a.accion || '') + '</td><td class="p-1 border border-gray-100">' + eh(a.responsable || '') + '</td><td class="p-1 border border-gray-100">' + eh(a.cronograma || '') + '</td></tr>'; });
                        html += '</tbody></table></div></div>';
                    }

                    if (p.fichaExtendida && p.arbolProblema && p.arbolProblema.problemaCentral) {
                        html += '<div class="border border-amber-200 bg-amber-50 rounded-xl p-2">';
                        html += '<p class="text-[0.62rem] font-extrabold text-amber-700 uppercase mb-1"><i class="fas fa-tree mr-1"></i> Árbol del Problema</p>';
                        if ((p.arbolProblema.consecuencias || []).length) {
                            html += '<p class="text-[0.6rem] font-bold text-amber-600 uppercase mb-1">Consecuencias</p><div class="flex flex-wrap gap-1 mb-1">';
                            (p.arbolProblema.consecuencias || []).forEach(cons => { html += '<span class="bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full border border-amber-300">' + eh(cons) + '</span>'; });
                            html += '</div>';
                        }
                        html += '<div class="bg-amber-600 text-white rounded px-2 py-1 text-xs font-extrabold text-center mb-1">' + eh(p.arbolProblema.problemaCentral) + '</div>';
                        if ((p.arbolProblema.causas || []).length) {
                            html += '<p class="text-[0.6rem] font-bold text-green-700 uppercase mb-1">Causas</p><div class="flex flex-wrap gap-1">';
                            (p.arbolProblema.causas || []).forEach(causa => { html += '<span class="bg-green-100 text-green-900 text-xs px-2 py-0.5 rounded-full border border-green-300">' + eh(causa) + '</span>'; });
                            html += '</div>';
                        }
                        html += '</div>';
                    }

                    if (!p.justificacion && !p.beneficiarios && !p.lugar && !respEntries.length && !(p.participantes || []).length && !(p.planAccion || []).length) {
                        html += '<p class="text-xs text-gray-400 text-center py-2"><i class="fas fa-info-circle mr-1"></i> Sin información adicional cargada.</p>';
                    }

                    html += '</div></div>'; // panel + acordeón
                    html += '<div class="mt-auto pt-2 border-t border-gray-100 px-1 pb-1"><p class="text-xs text-gray-400"><i class="fas fa-user mr-1"></i> Liderado por <strong>' + eh(creadorNombre) + '</strong></p></div>';
                    html += '</div></div>'; // body + card
                    return html;
                }).join('');

            } catch (err) {
                container.innerHTML = '<div class="col-span-full p-8 text-center text-red-500 text-sm"><i class="fas fa-exclamation-triangle mr-2"></i>Error al cargar proyectos: ' + err.message + '</div>';
            }
        };

        window.toggleAsesorDetalle = function(btn) {
            const panel = btn.nextElementSibling;
            if (!panel) return;
            const ico = btn.querySelector('i');
            const open = panel.style.display === 'none' || panel.style.display === '';
            panel.style.display = open ? 'flex' : 'none';
            panel.style.flexDirection = 'column';
            if (ico) { ico.className = open ? 'fas fa-chevron-up' : 'fas fa-chevron-down'; }
        };

        window.switchSubTab = function(btn, tabId, containerId) { const container = document.getElementById(containerId); container.parentElement.querySelectorAll('.sub-tab-btn').forEach(b => { b.classList.remove('text-blue-600','text-indigo-600','border-b-2','border-blue-600','border-indigo-600'); b.classList.add('text-slate-500', 'bg-transparent'); b.classList.remove('bg-indigo-50/50', 'bg-blue-50/50'); }); btn.classList.remove('text-slate-500', 'bg-transparent'); if(containerId === 'desempeno-container') { btn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600', 'bg-blue-50/50'); } else { btn.classList.add('text-indigo-600', 'border-b-2', 'border-indigo-600', 'bg-indigo-50/50'); } container.querySelectorAll('.sub-tab-pane').forEach(p => p.classList.remove('active')); container.querySelector('#' + tabId).classList.add('active'); };
        window.switchModalTab = function(tabId, btn) { const container = btn.closest('.modal-box'); container.querySelectorAll('.edit-tab-btn').forEach(b => { b.classList.remove('text-indigo-600', 'border-b-4', 'border-indigo-600', 'bg-white'); b.classList.add('text-slate-500', 'bg-transparent'); }); btn.classList.remove('text-slate-500', 'bg-transparent'); btn.classList.add('text-indigo-600', 'border-b-4', 'border-indigo-600', 'bg-white'); container.querySelectorAll('.edit-tab-pane').forEach(p => p.classList.remove('active')); container.querySelector('#' + tabId).classList.add('active'); };
        window.abrirModalDesdeBoton = function(id, targetTab) { window.abrirModalEditarAdulto(id); const btn = document.querySelector(`.edit-tab-btn[onclick*="'${targetTab}'"]`); if(btn) window.switchModalTab(targetTab, btn); };
        window.cerrarModalEditarAdulto = function() { document.getElementById('modal-editar-adulto').classList.remove('active'); window.currentEditAdultoId = null; };

