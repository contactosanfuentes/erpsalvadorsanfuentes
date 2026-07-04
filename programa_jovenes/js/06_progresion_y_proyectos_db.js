        async function updateProgresionDB(jovenId, field, dataObj) {
            try {
                let payload = { joven_id: jovenId };
                if (field === 'objetivos' || field === 'competencias_mayores' || field === 'actividades_tropa') {
                    const { data: dbData } = await supabaseClient.from('progresion_jovenes').select('territorios').eq('joven_id', jovenId).maybeSingle();
                    let currentTerritorios = dbData?.territorios || {};
                    currentTerritorios[field] = dataObj;
                    payload['territorios'] = currentTerritorios;
                } else {
                    payload[field] = dataObj;
                }
                const { error } = await supabaseClient.from('progresion_jovenes').upsert(payload, { onConflict: 'joven_id' });
                if (error) throw error;
                const j = personasJovenes.find(x => x.id === jovenId);
                if (j) {
                    if(field === 'objetivos') j.objetivos = dataObj;
                    else if(field === 'mapa_seeonee') j.mapaSeeonee = dataObj;
                    else if(field === 'etapa_actual') j.etapaActual = dataObj;
                    else if(field === 'sonar') j.sonar = dataObj;
                    else if(field === 'competencias_mayores') j.competencias_mayores = dataObj;
                    else if(field === 'actividades_tropa') j.actividades_tropa = dataObj;
                    else if(field === 'especialidades') j.especialidades = dataObj;
                    else if(field === 'camino') j.camino = dataObj;
                    renderYouthProfile(j);
                }
            } catch(e) { console.error(e); mostrarNotificacion('error', 'Error crítico guardando datos en la nube (Verificar conexión a Supabase).'); }
        }

        async function abandonarProyectoExterno(proyId, jovenId) {
            const joven = personasJovenes.find(j => j.id === jovenId);
            if (!joven) return;
            if (!confirm(`¿Seguro que quieres quitar a ${joven.nombre} de este proyecto? Ya no aparecerá como responsable ni participante.`)) return;
            try {
                const myRun = (joven.run || '').trim().toLowerCase();
                // Buscar el proyecto en todos los jovenes
                for (const otro of personasJovenes) {
                    const proys = otro.camino?.proyectos_colectivos || [];
                    const idx = proys.findIndex(p => p.id === proyId);
                    if (idx === -1) continue;
                    const proy = proys[idx];
                    // Quitar de responsables
                    if (proy.responsables) {
                        for (const area in proy.responsables) {
                            if (proy.responsables[area]?.run?.toLowerCase() === myRun) delete proy.responsables[area];
                        }
                    }
                    // Quitar de participantes
                    if (proy.participantes) proy.participantes = proy.participantes.filter(pt => pt?.run?.toLowerCase() !== myRun);
                    otro.camino.proyectos_colectivos[idx] = proy;
                    await updateProgresionDB(otro.id, 'camino', otro.camino);
                    mostrarNotificacion('exito', `${joven.nombre} fue removido del proyecto.`);
                    renderFichaJoven(jovenId);
                    return;
                }
                mostrarNotificacion('error', 'Proyecto no encontrado.');
            } catch(e) { mostrarNotificacion('error', 'Error: ' + e.message); }
        }


        function renderDetalleProyectoPropio(p, accentColor, jovenId) {
            const eh = escapeHtml;
            let h = '';
            h += '<div class="mt-3 pt-3 border-t border-gray-100">';
            h += '<button onclick="toggleDetallePropio(' + p.id + ', this)" class="w-full flex items-center justify-between text-xs font-bold text-gray-500 hover:text-gray-800 transition py-1 px-2 rounded-lg hover:bg-gray-50">';
            h += '<span><i class="fas fa-eye mr-1"></i> Ver detalles completos</span>';
            h += '<i class="fas fa-chevron-down transition-transform"></i>';
            h += '</button>';
            h += '<div id="det-' + p.id + '" style="display:none;" class="mt-3 flex flex-col gap-3">';

            // Campos básicos extra
            if (p.justificacion) h += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Justificación</p><p class="text-xs text-gray-700">' + eh(p.justificacion) + '</p></div>';
            if (p.beneficiarios) h += '<p class="text-xs text-gray-600"><strong>Beneficiarios:</strong> ' + eh(p.beneficiarios) + '</p>';
            if (p.lugar) h += '<p class="text-xs text-gray-600"><strong>Lugar:</strong> ' + eh(p.lugar) + '</p>';

            // Objetivos específicos
            if ((p.objetivosEspecificos||[]).length) {
                h += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Objetivos Específicos</p><ul class="list-disc list-inside text-xs text-gray-700">';
                (p.objetivosEspecificos||[]).forEach(o => { h += '<li>' + eh(o) + '</li>'; });
                h += '</ul></div>';
            }

            // Organigrama
            const respEntries = Object.entries(p.responsables||{}).filter(([,r])=>r&&r.nombre);
            if (respEntries.length) {
                h += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Organigrama</p><div class="grid grid-cols-2 gap-1">';
                respEntries.forEach(([cargo,r]) => {
                    h += '<div class="bg-blue-50 border border-blue-100 rounded-lg px-2 py-1 flex items-center gap-1.5">';
                    if (r.foto) h += '<img src="' + eh(r.foto) + '" style="width:18px;height:18px;border-radius:50%;object-fit:cover;">';
                    h += '<span class="text-xs text-blue-800"><strong>' + eh(cargo) + ':</strong> ' + eh(r.nombre) + '</span></div>';
                });
                h += '</div></div>';
            }

            // Participantes
            if ((p.participantes||[]).length) {
                h += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Participantes</p><div class="flex flex-wrap gap-1">';
                (p.participantes||[]).forEach(pt => { h += '<span class="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">' + eh(pt.nombre||'') + '</span>'; });
                h += '</div></div>';
            }

            // Plan de acción
            if ((p.planAccion||[]).length) {
                h += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Plan de Acción</p><div class="overflow-x-auto"><table class="w-full text-xs border-collapse"><thead><tr class="bg-gray-100"><th class="text-left p-1 border border-gray-200">Acción</th><th class="text-left p-1 border border-gray-200">Recursos</th><th class="text-left p-1 border border-gray-200">Responsable</th><th class="text-left p-1 border border-gray-200">Cronograma</th></tr></thead><tbody>';
                (p.planAccion||[]).forEach(a => { h += '<tr><td class="p-1 border border-gray-100">' + eh(a.accion||'') + '</td><td class="p-1 border border-gray-100">' + eh(a.recurso||'') + '</td><td class="p-1 border border-gray-100">' + eh(a.responsable||'') + '</td><td class="p-1 border border-gray-100">' + eh(a.cronograma||'') + '</td></tr>'; });
                h += '</tbody></table></div></div>';
            }

            // Presupuesto
            if ((p.presupuestoEstimado||[]).length) {
                const total = (p.presupuestoEstimado||[]).reduce((s,i)=>s+((i.cantidad||0)*(i.costoUnitario||0)),0);
                h += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Presupuesto Estimado</p><div class="overflow-x-auto"><table class="w-full text-xs border-collapse"><thead><tr class="bg-gray-100"><th class="text-left p-1 border border-gray-200">Concepto</th><th class="text-center p-1 border border-gray-200">Cant.</th><th class="text-right p-1 border border-gray-200">C/U</th><th class="text-right p-1 border border-gray-200">Total</th></tr></thead><tbody>';
                (p.presupuestoEstimado||[]).forEach(i => { h += '<tr><td class="p-1 border border-gray-100">' + eh(i.concepto||'') + '</td><td class="text-center p-1 border border-gray-100">' + (i.cantidad||0) + '</td><td class="text-right p-1 border border-gray-100">$' + (i.costoUnitario||0).toLocaleString('es-CL') + '</td><td class="text-right p-1 border border-gray-100 font-bold">$' + ((i.cantidad||0)*(i.costoUnitario||0)).toLocaleString('es-CL') + '</td></tr>'; });
                h += '</tbody><tfoot><tr><td colspan="3" class="text-right p-1 font-extrabold text-gray-700 border border-gray-200">TOTAL</td><td class="text-right p-1 border border-gray-200 font-extrabold text-indigo-700">$' + total.toLocaleString('es-CL') + '</td></tr></tfoot></table></div></div>';
            }

            // Indicadores
            if ((p.indicadores||[]).length) {
                h += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Indicadores de Éxito</p><div class="flex flex-col gap-1">';
                (p.indicadores||[]).forEach(ind => { h += '<div class="flex justify-between items-center bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs"><span class="text-gray-700">' + eh(ind.descripcion||'') + '</span><span class="font-bold text-indigo-700 ml-2 whitespace-nowrap">Meta: ' + eh(ind.meta||'') + '</span></div>'; });
                h += '</div></div>';
            }

            // Árbol del Problema
            if (p.fichaExtendida && p.arbolProblema && (p.arbolProblema.problemaCentral || (p.arbolProblema.causas||[]).length || (p.arbolProblema.consecuencias||[]).length)) {
                h += '<div class="border border-amber-200 bg-amber-50 rounded-xl p-3">';
                h += '<p class="text-[0.65rem] font-extrabold text-amber-700 uppercase tracking-wider mb-2"><i class="fas fa-tree mr-1"></i> Árbol del Problema</p>';
                // Consecuencias (arriba)
                if ((p.arbolProblema.consecuencias||[]).length) {
                    h += '<div class="mb-2"><p class="text-[0.6rem] font-bold text-amber-600 uppercase mb-1">Consecuencias / Efectos</p><div class="flex flex-wrap gap-1">';
                    (p.arbolProblema.consecuencias||[]).forEach(cons => { h += '<span class="bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full border border-amber-300">' + eh(cons) + '</span>'; });
                    h += '</div></div>';
                }
                // Problema central
                if (p.arbolProblema.problemaCentral) {
                    h += '<div class="bg-amber-600 text-white rounded-lg px-3 py-2 mb-2 text-xs font-extrabold text-center shadow">';
                    h += '<i class="fas fa-exclamation-circle mr-1"></i> PROBLEMA CENTRAL<br>';
                    h += '<span class="font-medium text-amber-100">' + eh(p.arbolProblema.problemaCentral) + '</span>';
                    h += '</div>';
                }
                // Causas (abajo)
                if ((p.arbolProblema.causas||[]).length) {
                    h += '<div><p class="text-[0.6rem] font-bold text-green-700 uppercase mb-1">Causas / Raíces</p><div class="flex flex-wrap gap-1">';
                    (p.arbolProblema.causas||[]).forEach(causa => { h += '<span class="bg-green-100 text-green-900 text-xs px-2 py-0.5 rounded-full border border-green-300">' + eh(causa) + '</span>'; });
                    h += '</div></div>';
                }
                h += '</div>';
            }

            // Fallback si no hay datos extra
            const hasExtra = p.justificacion||p.beneficiarios||p.lugar||
                (p.objetivosEspecificos||[]).length||
                Object.entries(p.responsables||{}).filter(([,r])=>r&&r.nombre).length||
                (p.participantes||[]).length||
                (p.planAccion||[]).length||
                (p.presupuestoEstimado||[]).length||
                (p.indicadores||[]).length||
                (p.fichaExtendida&&p.arbolProblema&&p.arbolProblema.problemaCentral);
            if (!hasExtra) {
                h += '<p class="text-xs text-gray-400 text-center py-2"><i class="fas fa-info-circle mr-1"></i> Este proyecto no tiene información adicional cargada aún.</p>';
            }

            h += '</div>'; // det-xxx
            h += '</div>'; // mt-3 pt-3
            return h;
        }

        function toggleDetallePropio(id, btn) {
            const panel = document.getElementById('det-' + id);
            if (!panel) return;
            const open = panel.style.display === 'none' || panel.style.display === '';
            panel.style.display = open ? 'flex' : 'none';
            panel.style.flexDirection = 'column';
            const ico = btn.querySelector('i.fa-chevron-down, i.fa-chevron-up');
            if (ico) { ico.classList.toggle('fa-chevron-down', !open); ico.classList.toggle('fa-chevron-up', open); }
        }
        function renderProyectoExterno(p, creadorJoven, rolBadge, areaRol, jovenId) {
            const eh = escapeHtml;
            let html = '';
            html += '<div class="border-2 border-gray-200 bg-gray-50 p-0 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col overflow-hidden relative">';
            html += '<div class="absolute top-3 right-3 flex gap-2 z-10">' + rolBadge + '</div>';
            html += '<div class="bg-gray-500 p-4 text-white flex justify-between items-center pr-28">';
            html += '<h5 class="font-extrabold text-lg truncate" title="' + eh(p.nombre) + '">' + eh(p.nombre) + '</h5>';
            html += '</div>';
            html += '<div class="p-5 flex-1 flex flex-col gap-2">';

            // Badges campo + area + fechas
            html += '<div class="flex items-center gap-2 flex-wrap">';
            html += '<span class="bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold px-3 py-1 rounded-full"><i class="fas fa-leaf mr-1"></i> ' + eh(p.campoAccion||'') + '</span>';
            if (areaRol) html += '<span class="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full"><i class="fas fa-briefcase mr-1"></i> ' + eh(areaRol) + '</span>';
            html += '<span class="bg-white text-gray-600 border border-gray-200 text-xs px-2 py-1 rounded-full">' + (p.inicio||'?') + ' → ' + (p.termino||'En ejecución') + '</span>';
            html += '</div>';

            // Objetivo (visible siempre)
            html += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Objetivo General</p>';
            html += '<p class="text-sm font-medium text-gray-700 italic border-l-4 border-gray-300 pl-3">&ldquo;' + eh(p.objetivo||'') + '&rdquo;</p></div>';

            // Acordeón de detalles — reutiliza renderDetalleProyectoPropio
            html += renderDetalleProyectoPropio(p, '#6b7280', jovenId);

            // Footer: gestión + botón abandonar
            html += '<div class="mt-auto pt-3 border-t border-gray-200 flex items-center justify-between">';
            html += '<p class="text-xs text-gray-400"><i class="fas fa-lock mr-1"></i> Gestionado por ' + eh(creadorJoven.nombre||'') + '</p>';
            html += '<button onclick="abandonarProyectoExterno(' + p.id + ', ' + jovenId + ')" class="bg-red-50 hover:bg-red-500 hover:text-white text-red-600 border border-red-200 rounded-lg px-3 py-1.5 font-bold text-xs cursor-pointer transition"><i class="fas fa-door-open mr-1"></i> Abandonar</button>';
            html += '</div>';
            html += '</div></div>';
            return html;
        }
        // Obtener proyectos donde joven es responsable o participante (no creador)
        function obtenerProyectosExternos(joven) {
            const myRun = (joven.run || '').trim().toLowerCase();
            const propiosIds = new Set((joven.camino.proyectos_colectivos || []).map(p => p.id));
            const externos = [];
            for (const otro of personasJovenes) {
                if (otro.id === joven.id) continue;
                for (const proy of (otro.camino?.proyectos_colectivos || [])) {
                    if (propiosIds.has(proy.id)) continue;
                    const esResp = proy.responsables && Object.values(proy.responsables).some(r => r && r.run && r.run.trim().toLowerCase() === myRun);
                    const esPart = (proy.participantes || []).some(pt => pt && pt.run && pt.run.trim().toLowerCase() === myRun);
                    if (esResp || esPart) externos.push({ proy, creadorJoven: otro });
                }
            }
            return externos;
        }
        // Función auxiliar para sincronizar un proyecto con todos sus participantes
        async function sincronizarProyectoConParticipantes(proyecto, creadorId, esEliminacion = false) {
            // Obtener todos los IDs de participantes (incluyendo responsables y participantes)
            const idsParticipantes = new Set();
            
            // Agregar creador
            idsParticipantes.add(creadorId);
            
            // Agregar responsables
            if (proyecto.responsables) {
                Object.values(proyecto.responsables).forEach(resp => {
                    if (resp && resp.run) {
                        const joven = personasJovenes.find(j => j.run === resp.run);
                        if (joven) idsParticipantes.add(joven.id);
                    }
                });
            }
            
            // Agregar participantes
            if (proyecto.participantes) {
                proyecto.participantes.forEach(part => {
                    if (part && part.run) {
                        const joven = personasJovenes.find(j => j.run === part.run);
                        if (joven && (joven.rama === 'Avanzada' || joven.rama === 'Clan')) {
                            idsParticipantes.add(joven.id);
                        }
                    }
                });
            }
            
            // Para cada participante, actualizar su lista de proyectos
            for (const id of idsParticipantes) {
                const joven = personasJovenes.find(j => j.id === id);
                if (joven && (joven.rama === 'Avanzada' || joven.rama === 'Clan')) {
                    let proyectosActualizados = [...(joven.camino.proyectos_colectivos || [])];
                    
                    if (esEliminacion) {
                        // Eliminar el proyecto de la lista
                        proyectosActualizados = proyectosActualizados.filter(p => p.id !== proyecto.id);
                    } else {
                        // Actualizar o agregar el proyecto
                        const indexExistente = proyectosActualizados.findIndex(p => p.id === proyecto.id);
                        if (indexExistente !== -1) {
                            proyectosActualizados[indexExistente] = { ...proyecto };
                        } else {
                            proyectosActualizados.push({ ...proyecto });
                        }
                    }
                    
                    joven.camino.proyectos_colectivos = proyectosActualizados;
                    await updateProgresionDB(joven.id, 'camino', joven.camino);
                }
            }
        }

        async function cambiarEtapaJoven(id, etapa) {
            const j = personasJovenes.find(x => x.id === id);
            const etapaAnterior = j.etapaActual;
            updateProgresionDB(id, 'etapa_actual', etapa);
            mostrarNotificacion('exito', 'Etapa formalizada e ingresada al registro histórico.');
            if (etapaAnterior !== etapa) {
                // ── Paso 1: Generar certificado y subirlo a Drive ANTES de notificar ──
                let adjuntoCert = null;
                try {
                    mostrarNotificacion('info', 'Generando certificado de progresión...');
                    const nombreJoven = `${j.nombres || ''} ${j.apellidos || ''}`.trim();
                    const datosCert = {
                        titulo: 'DE PROGRESIÓN',
                        nombre: nombreJoven,
                        unidad: j.unidad,
                        detalle: `Por haber alcanzado la etapa ${etapa} de la ${j.unidad}`,
                        subdetalle: 'Demostrando sus valores Guía-Scout',
                        nombreArchivo: `Cert_Progresion_${etapa}_${(j.apellidos||'').replace(/[^a-zA-Z0-9]/g,'_')}`
                    };
                    // Generar y subir a Drive (incluye QR automático)
                    const resDrive = await Certificados.generarYSubir(datosCert, window.supabaseClient, null);
                    if (resDrive?.pdfBase64 && resDrive.pdfBase64.length > 500) {
                        const nombrePdf = (resDrive.codigo || '') + '_' + (datosCert.nombreArchivo || 'Certificado') + '.pdf';
                        adjuntoCert = [{ filename: nombrePdf.replace(/[^a-zA-Z0-9._-]/g,'_'), content: resDrive.pdfBase64, type: 'application/pdf' }];
                        console.log('[CERT] Adjunto preparado:', nombrePdf, Math.round(resDrive.pdfBase64.length/1024), 'KB');
                    }
                    mostrarNotificacion('exito', '✅ Certificado generado y guardado en Drive.');
                } catch(err) {
                    console.error('Error certificado:', err);
                    mostrarNotificacion('info', 'Certificado no generado: ' + err.message);
                }
                // ── Paso 2: Enviar notificación (correo + WhatsApp) CON el certificado adjunto ──
                await enviarNotificacionHito(j, 'etapa', { nuevaEtapa: etapa }, adjuntoCert);
            }
        }

        // --- OBJETIVOS (MENORES E INTERMEDIOS) ---
