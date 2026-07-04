        let filtroRamaVigente = 'todos';
        let solicitudProyectoActual = null;
        let solicitudJovenSeleccionado = null;

        function abrirModalProyectosVigentes() {
            filtroRamaVigente = 'todos';
            document.querySelectorAll('.pv-filter').forEach((b, i) => b.classList.toggle('active', i === 0));
            filtrarProyectosVigentes('todos');
            document.getElementById('modal-proyectos-vigentes').classList.add('active');
        }

        function recopilarProyectosVigentes() {
            const proyectos = [];
            personasJovenes.forEach(j => {
                if (j.rama !== 'Avanzada' && j.rama !== 'Clan') return;
                (j.camino?.proyectos_colectivos || []).forEach(p => {
                    if (p.estado === 'Finalizado') return;
                    // Evitar duplicados (mismo id)
                    if (proyectos.find(x => x.id === p.id)) return;
                    proyectos.push({
                        ...p,
                        rama: j.rama,
                        creadorNombre: j.nombre,
                        creadorFoto: j.foto,
                        creadorId: j.id,
                        participantesCount: (p.participantes || []).length
                    });
                });
            });
            return proyectos;
        }


        function renderTarjetaVigente(p, ramaBg, ramaColor, ramaLabel, sc, participantes) {
            const eh = escapeHtml;
            const uid = 'pv-' + p.id;
            let html = '<div class="' + ramaBg + ' border rounded-xl mb-3 shadow-sm hover:shadow-md transition overflow-hidden">';

            // ── Cabecera siempre visible ──
            html += '<div class="p-4">';
            html += '<div class="flex justify-between items-start gap-3 flex-wrap">';
            html += '<div class="flex-1 min-w-[200px]">';
            html += '<div class="flex items-center gap-2 mb-1 flex-wrap">';
            html += '<span class="font-extrabold text-gray-900 text-base">' + eh(p.nombre) + '</span>';
            html += '<span style="background:' + sc + '20;color:' + sc + ';padding:2px 8px;border-radius:6px;font-size:0.65rem;font-weight:700;">' + (p.estado || 'Planificación') + '</span>';
            if ((p.solicitudes_pendientes || []).length > 0) html += '<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:6px;font-size:0.65rem;font-weight:700;"><i class="fas fa-bell mr-1"></i>' + (p.solicitudes_pendientes || []).length + ' solicitud(es)</span>';
            html += '</div>';
            html += '<div class="flex items-center gap-3 text-xs text-gray-500 font-medium mb-2">';
            html += '<span style="color:' + ramaColor + ';font-weight:700;"><i class="fas fa-flag mr-1"></i>' + ramaLabel + '</span>';
            html += '<span><i class="fas fa-leaf mr-1"></i>' + eh(p.campoAccion || 'Sin campo') + '</span>';
            if (p.inicio) html += '<span><i class="fas fa-calendar mr-1"></i>' + p.inicio + (p.termino ? ' → ' + p.termino : '') + '</span>';
            html += '</div>';
            if (p.objetivo) html += '<p class="text-xs text-gray-600 mb-2 italic">' + eh(p.objetivo) + '</p>';
            html += '<div class="flex items-center gap-2">';
            html += '<img src="' + eh(p.creadorFoto || '') + '" style="width:20px;height:20px;border-radius:50%;object-fit:cover;border:1.5px solid ' + ramaColor + ';">';
            html += '<span class="text-xs text-gray-500 font-medium">Creado por <strong>' + eh(p.creadorNombre) + '</strong></span>';
            if (p.participantesCount > 0) html += '<span class="text-xs text-gray-400 ml-2"><i class="fas fa-users mr-1"></i>' + p.participantesCount + ' participantes</span>';
            html += '</div>';
            if (participantes) html += '<div class="flex mt-2" style="padding-left:6px;">' + participantes + '</div>';
            html += '</div>';

            // Botones derechos: ver detalle + solicitar unirse
            html += '<div class="flex flex-col gap-2 self-start">';
            html += '<button onclick="toggleDetallePV(' + p.id + ')" class="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg px-3 py-2 font-bold text-xs cursor-pointer transition flex items-center gap-1"><i class="fas fa-eye mr-1"></i> Ver detalle <i class="fas fa-chevron-down text-gray-400 text-xs" id="pv-' + p.id + '-ico"></i></button>';
            var _onclick = 'abrirSolicitudIncorporacion(' + p.id + ', \"' + eh(p.nombre) + '\", \"' + eh(p.campoAccion||'') + '\", \"' + p.rama + '\", ' + p.creadorId + ')';
            html += '<button onclick="' + _onclick + '" class="bg-white border-2 border-purple-300 text-purple-700 hover:bg-purple-600 hover:text-white hover:border-purple-600 rounded-xl px-4 py-2.5 font-bold text-xs cursor-pointer transition shadow-sm whitespace-nowrap"><i class="fas fa-user-plus mr-1"></i> Solicitar Unirse</button>';
            html += '</div>';
            html += '</div>'; // flex justify-between

            // Solicitudes pendientes
            if ((p.solicitudes_pendientes || []).length > 0) {
                html += '<div class="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">';
                html += '<p class="text-xs font-extrabold text-amber-800 uppercase tracking-wide mb-2"><i class="fas fa-bell text-amber-500 mr-1"></i> Solicitudes Pendientes de Aprobación</p>';
                (p.solicitudes_pendientes || []).forEach(s => {
                    html += '<div class="flex items-center gap-2 bg-white border border-amber-100 rounded-lg p-2 mb-1.5 shadow-sm">';
                    html += '<img src="' + eh(s.foto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(s.nombre) + '&size=28&background=fed7aa&color=9a3412') + '" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid #f59e0b;">';
                    html += '<div class="flex-1 min-w-0"><p class="text-xs font-bold text-gray-800 truncate">' + eh(s.nombre) + '</p><p class="text-gray-400" style="font-size:0.6rem;">' + eh(s.rama || '') + ' · ' + eh(s.fecha || '') + (s.mensaje ? ' · &ldquo;' + eh(s.mensaje) + '&rdquo;' : '') + '</p></div>';
                    html += '<button onclick="aprobarSolicitudDesdeVigentes(' + p.creadorId + ', ' + p.id + ', &quot;' + eh(s.run) + '&quot;)" class="bg-green-500 hover:bg-green-600 text-white border-none rounded-md px-2.5 py-1 text-xs font-bold cursor-pointer transition shadow-sm" title="Aprobar e incorporar"><i class="fas fa-check mr-1"></i>Aprobar</button>';
                    html += '<button onclick="rechazarSolicitudDesdeVigentes(' + p.creadorId + ', ' + p.id + ', &quot;' + eh(s.run) + '&quot;)" class="bg-gray-300 hover:bg-red-500 hover:text-white text-gray-600 border-none rounded-md px-2.5 py-1 text-xs font-bold cursor-pointer transition shadow-sm" title="Rechazar"><i class="fas fa-times"></i></button>';
                    html += '</div>';
                });
                html += '</div>';
            }
            html += '</div>'; // p-4

            // ── Panel de detalle expandible ──
            html += '<div id="pv-' + p.id + '" style="display:none;" class="border-t border-gray-200 bg-white px-4 pb-4 pt-3 flex flex-col gap-3">';

            if (p.justificacion) html += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Justificación</p><p class="text-xs text-gray-700">' + eh(p.justificacion) + '</p></div>';
            if (p.beneficiarios) html += '<p class="text-xs text-gray-700"><strong>Beneficiarios:</strong> ' + eh(p.beneficiarios) + '</p>';
            if (p.lugar) html += '<p class="text-xs text-gray-700"><strong>Lugar:</strong> ' + eh(p.lugar) + '</p>';

            if ((p.objetivosEspecificos || []).length) {
                html += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Objetivos Específicos</p><ul class="list-disc list-inside text-xs text-gray-700">';
                (p.objetivosEspecificos || []).forEach(o => { html += '<li>' + eh(o) + '</li>'; });
                html += '</ul></div>';
            }

            const respEntries = Object.entries(p.responsables || {}).filter(([, r]) => r && r.nombre);
            if (respEntries.length) {
                html += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Organigrama</p><div class="grid grid-cols-2 gap-1">';
                respEntries.forEach(([cargo, r]) => {
                    html += '<div class="bg-blue-50 border border-blue-100 rounded-lg px-2 py-1 flex items-center gap-1.5">';
                    if (r.foto) html += '<img src="' + eh(r.foto) + '" style="width:18px;height:18px;border-radius:50%;object-fit:cover;">';
                    html += '<span class="text-xs text-blue-800"><strong>' + eh(cargo) + ':</strong> ' + eh(r.nombre) + '</span></div>';
                });
                html += '</div></div>';
            }

            if ((p.participantes || []).length) {
                html += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Participantes</p><div class="flex flex-wrap gap-1">';
                (p.participantes || []).forEach(pt => { html += '<span class="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">' + eh(pt.nombre || '') + '</span>'; });
                html += '</div></div>';
            }

            if ((p.planAccion || []).length) {
                html += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Plan de Acción</p><div class="overflow-x-auto"><table class="w-full text-xs border-collapse"><thead><tr class="bg-gray-100"><th class="text-left p-1 border border-gray-200">Acción</th><th class="text-left p-1 border border-gray-200">Responsable</th><th class="text-left p-1 border border-gray-200">Cronograma</th></tr></thead><tbody>';
                (p.planAccion || []).forEach(a => { html += '<tr><td class="p-1 border border-gray-100">' + eh(a.accion || '') + '</td><td class="p-1 border border-gray-100">' + eh(a.responsable || '') + '</td><td class="p-1 border border-gray-100">' + eh(a.cronograma || '') + '</td></tr>'; });
                html += '</tbody></table></div></div>';
            }

            if ((p.presupuestoEstimado || []).length) {
                html += '<div><p class="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Presupuesto Estimado</p><div class="overflow-x-auto"><table class="w-full text-xs border-collapse"><thead><tr class="bg-gray-100"><th class="text-left p-1 border border-gray-200">Concepto</th><th class="text-center p-1 border border-gray-200">Cant.</th><th class="text-right p-1 border border-gray-200">Total</th></tr></thead><tbody>';
                (p.presupuestoEstimado || []).forEach(i => { html += '<tr><td class="p-1 border border-gray-100">' + eh(i.concepto || '') + '</td><td class="text-center p-1 border border-gray-100">' + (i.cantidad || 0) + '</td><td class="text-right p-1 border border-gray-100">$' + ((i.cantidad || 0) * (i.costoUnitario || 0)).toLocaleString('es-CL') + '</td></tr>'; });
                html += '</tbody></table></div></div>';
            }

            if (!(p.justificacion || p.beneficiarios || p.lugar || (p.objetivosEspecificos||[]).length || respEntries.length || (p.participantes||[]).length || (p.planAccion||[]).length || (p.presupuestoEstimado||[]).length)) {
                html += '<p class="text-xs text-gray-400 text-center py-2"><i class="fas fa-info-circle mr-1"></i> El proyecto no tiene información adicional cargada aún.</p>';
            }

            
            // Árbol del problema
            if (p.fichaExtendida && p.arbolProblema && (p.arbolProblema.problemaCentral || (p.arbolProblema.causas||[]).length || (p.arbolProblema.consecuencias||[]).length)) {
                html += '<div class=\"border border-amber-200 bg-amber-50 rounded-xl p-3\">';
                html += '<p class=\"text-[0.65rem] font-extrabold text-amber-700 uppercase tracking-wider mb-2\"><i class=\"fas fa-tree mr-1\"></i> Árbol del Problema</p>';
                if ((p.arbolProblema.consecuencias||[]).length) {
                    html += '<p class=\"text-[0.6rem] font-bold text-amber-600 uppercase mb-1\">Consecuencias / Efectos</p><div class=\"flex flex-wrap gap-1 mb-2\">';
                    (p.arbolProblema.consecuencias||[]).forEach(cons => { html += '<span class=\"bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full border border-amber-300\">' + escapeHtml(cons) + '</span>'; });
                    html += '</div>';
                }
                if (p.arbolProblema.problemaCentral) {
                    html += '<div class=\"bg-amber-600 text-white rounded-lg px-3 py-2 mb-2 text-xs font-extrabold text-center\">';
                    html += '<i class=\"fas fa-exclamation-circle mr-1\"></i> PROBLEMA CENTRAL<br><span class=\"font-medium text-amber-100\">' + escapeHtml(p.arbolProblema.problemaCentral) + '</span>';
                    html += '</div>';
                }
                if ((p.arbolProblema.causas||[]).length) {
                    html += '<p class=\"text-[0.6rem] font-bold text-green-700 uppercase mb-1\">Causas / Raíces</p><div class=\"flex flex-wrap gap-1\">';
                    (p.arbolProblema.causas||[]).forEach(causa => { html += '<span class=\"bg-green-100 text-green-900 text-xs px-2 py-0.5 rounded-full border border-green-300\">' + escapeHtml(causa) + '</span>'; });
                    html += '</div>';
                }
                html += '</div>';
            }

html += '</div>'; // detalle
            html += '</div>'; // card
            return html;
        }

        function toggleDetallePV(id) {
            const uid = 'pv-' + id;
            const panel = document.getElementById(uid);
            const ico = document.getElementById(uid + '-ico');
            if (!panel) return;
            const open = panel.style.display === 'none' || panel.style.display === '';
            panel.style.display = open ? 'flex' : 'none';
            if (ico) { ico.classList.toggle('fa-chevron-down', !open); ico.classList.toggle('fa-chevron-up', open); }
        }

        function filtrarProyectosVigentes(rama) {
            filtroRamaVigente = rama;
            document.querySelectorAll('.pv-filter').forEach(b => b.classList.remove('active'));
            event?.target?.classList?.add('active');
            const query = (document.getElementById('buscar-pv')?.value || '').toLowerCase();
            let proyectos = recopilarProyectosVigentes();
            if (rama !== 'todos') proyectos = proyectos.filter(p => p.rama === rama);
            if (query) proyectos = proyectos.filter(p => (p.nombre || '').toLowerCase().includes(query) || (p.campoAccion || '').toLowerCase().includes(query) || (p.creadorNombre || '').toLowerCase().includes(query));

            const container = document.getElementById('lista-proyectos-vigentes');
            if (!proyectos.length) {
                container.innerHTML = '<div class="text-center py-10 text-gray-400"><i class="fas fa-inbox text-4xl mb-4 block opacity-30"></i><p class="font-bold">No hay proyectos vigentes en esta categoría.</p></div>';
                return;
            }
            container.innerHTML = proyectos.map(p => {
                const ramaColor = p.rama === 'Avanzada' ? '#8B5CF6' : '#E31837';
                const ramaBg = p.rama === 'Avanzada' ? 'bg-purple-50 border-purple-200' : 'bg-red-50 border-red-200';
                const ramaLabel = p.rama === 'Avanzada' ? 'Pioneros' : 'Caminantes';
                const estadoColors = { 'En curso': '#3b82f6', 'Planificación': '#f59e0b', 'Evaluación': '#8b5cf6' };
                const sc = estadoColors[p.estado] || '#f59e0b';
                const participantes = (p.participantes || []).map(pt => `<img src="${escapeHtml(pt.foto || 'https://ui-avatars.com/api/?name='+encodeURIComponent(pt.nombre)+'&size=24&background=e2e8f0&color=475569')}" title="${escapeHtml(pt.nombre)}" style="width:24px;height:24px;border-radius:50%;border:2px solid white;margin-left:-6px;object-fit:cover;">`).join('');
                return renderTarjetaVigente(p, ramaBg, ramaColor, ramaLabel, sc, participantes);
            }).join('');
        }

        function abrirSolicitudIncorporacion(proyectoId, nombre, campo, rama, creadorId) {
            solicitudProyectoActual = { id: Number(proyectoId), nombre, campo, rama, creadorId };
            solicitudJovenSeleccionado = null;
            document.getElementById('solicitud-proyecto-info').innerHTML = `
                <p class="font-extrabold text-gray-900 text-base mb-1">${nombre}</p>
                <p class="text-xs text-gray-600"><i class="fas fa-leaf mr-1 text-${rama === 'Avanzada' ? 'purple' : 'red'}-500"></i>${campo} · <strong>${rama === 'Avanzada' ? 'Pioneros' : 'Caminantes'}</strong></p>`;
            document.getElementById('solicitud-buscar').value = '';
            document.getElementById('solicitud-resultados').classList.add('hidden');
            document.getElementById('solicitud-seleccionado').innerHTML = '';
            document.getElementById('solicitud-mensaje').value = '';
            document.getElementById('modal-solicitud-proyecto').classList.add('active');
        }

        function buscarSolicitante() {
            const query = document.getElementById('solicitud-buscar').value.toLowerCase().trim();
            const container = document.getElementById('solicitud-resultados');
            if (query.length < 2) { container.classList.add('hidden'); return; }
            const resultados = personasJovenes.filter(j =>
                (j.rama === 'Avanzada' || j.rama === 'Clan') &&
                (j.nombre.toLowerCase().includes(query) || (j.run || '').includes(query))
            ).slice(0, 8);
            if (!resultados.length) { container.innerHTML = '<p class="p-3 text-xs text-gray-400 text-center">No se encontraron jóvenes.</p>'; container.classList.remove('hidden'); return; }
            container.innerHTML = resultados.map(j => `
                <div class="flex items-center gap-2 p-2 hover:bg-purple-50 cursor-pointer transition rounded" onclick="seleccionarSolicitante(${j.id})">
                    <img src="${escapeHtml(j.foto)}" class="w-7 h-7 rounded-full object-cover border border-gray-200">
                    <div><p class="text-xs font-bold text-gray-800">${escapeHtml(j.nombre)}</p><p class="text-[0.65rem] text-gray-400">${escapeHtml(j.rama)} · ${escapeHtml(j.unidad)}</p></div>
                </div>`).join('');
            container.classList.remove('hidden');
        }

        function seleccionarSolicitante(jovenId) {
            const j = personasJovenes.find(x => x.id === jovenId);
            if (!j) return;
            solicitudJovenSeleccionado = j;
            document.getElementById('solicitud-resultados').classList.add('hidden');
            document.getElementById('solicitud-buscar').value = '';
            document.getElementById('solicitud-seleccionado').innerHTML = `
                <div class="flex items-center gap-3 bg-purple-50 border border-purple-200 p-3 rounded-xl">
                    <img src="${escapeHtml(j.foto)}" class="w-10 h-10 rounded-full object-cover border-2 border-purple-400">
                    <div><p class="font-bold text-sm text-gray-900">${escapeHtml(j.nombre)}</p><p class="text-xs text-gray-500">${j.rama} · ${j.unidad}</p></div>
                    <button onclick="solicitudJovenSeleccionado=null;this.parentElement.remove()" class="ml-auto text-red-400 hover:text-red-600"><i class="fas fa-times"></i></button>
                </div>`;
        }

        async function enviarSolicitudProyecto() {
            if (!solicitudProyectoActual || !solicitudJovenSeleccionado) {
                mostrarNotificacion('error', 'Selecciona un joven para solicitar incorporación.');
                return;
            }
            const j = solicitudJovenSeleccionado;
            const pId = solicitudProyectoActual.id;
            const creadorId = solicitudProyectoActual.creadorId;
            const creador = personasJovenes.find(x => x.id === creadorId);
            if (!creador) { mostrarNotificacion('error', 'No se encontró al creador del proyecto.'); return; }

            const proyectoCreador = creador.camino?.proyectos_colectivos?.find(p => p.id === pId);
            if (!proyectoCreador) { mostrarNotificacion('error', 'Proyecto no encontrado.'); return; }
            if ((proyectoCreador.participantes || []).find(pt => pt.run === j.run)) {
                mostrarNotificacion('info', j.nombre + ' ya participa en este proyecto.');
                return;
            }
            if ((proyectoCreador.solicitudes_pendientes || []).find(s => s.run === j.run)) {
                mostrarNotificacion('info', j.nombre + ' ya tiene una solicitud pendiente.');
                return;
            }

            try {
                if (!proyectoCreador.solicitudes_pendientes) proyectoCreador.solicitudes_pendientes = [];
                proyectoCreador.solicitudes_pendientes.push({
                    run: j.run,
                    nombre: j.nombre,
                    foto: j.foto,
                    rama: j.rama,
                    mensaje: document.getElementById('solicitud-mensaje').value.trim(),
                    fecha: new Date().toISOString().split('T')[0],
                    jovenId: j.id
                });

                await sincronizarProyectoConParticipantes(proyectoCreador, creadorId, false);
                mostrarNotificacion('exito', 'Solicitud de ' + j.nombre + ' enviada. Los integrantes del proyecto deben aprobarla.');
                document.getElementById('modal-solicitud-proyecto').classList.remove('active');
                filtrarProyectosVigentes(filtroRamaVigente);
            } catch (err) {
                console.error(err);
                mostrarNotificacion('error', 'Error al enviar solicitud: ' + err.message);
            }
        }

        async function aprobarSolicitudDesdeVigentes(creadorId, proyectoId, solicitanteRun) {
            await aprobarSolicitud(creadorId, proyectoId, solicitanteRun);
            filtrarProyectosVigentes(filtroRamaVigente);
        }

        async function rechazarSolicitudDesdeVigentes(creadorId, proyectoId, solicitanteRun) {
            await rechazarSolicitud(creadorId, proyectoId, solicitanteRun);
            filtrarProyectosVigentes(filtroRamaVigente);
        }

        // ── Funciones auxiliares Ficha de Proyecto Extendida ──
