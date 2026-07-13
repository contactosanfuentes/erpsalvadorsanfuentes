        let activeProfileId = null;
        function renderYouthProfile(joven) {
            try {
                activeProfileId = joven.id;
                const view = document.getElementById('youth-profile-view');
                
                const tab2Name = (joven.rama === 'Avanzada' || joven.rama === 'Clan') ? '<i class="fas fa-award"></i> Desarrollo de Competencias' : '<i class="fas fa-medal"></i> Central Especialidades (4 Pilares)';
                const tab2Key = (joven.rama === 'Avanzada' || joven.rama === 'Clan') ? 'p-competencias' : 'p-especialidades';
                
                const logoRama = LOGOS_UNIDADES[joven.rama] || '';

                let html = `
                    <div class="profile-header-card bg-gradient-to-r" style="background: linear-gradient(135deg, ${joven.color} 0%, rgba(0,0,0,0.8) 200%);">
                        <div style="position:relative;display:inline-block;">
                            <img src="${joven.foto}" class="profile-pic-large shadow-2xl" id="foto-joven-${joven.id}">
                            <button onclick="abrirMenuFoto(event, ${joven.id}, '${joven.foto}', 'joven')" style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.7);color:white;border:2px solid white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;transition:background 0.2s;" title="Editar foto"><i class="fas fa-camera"></i></button>
                            <input type="file" id="input-foto-joven-${joven.id}" accept="image/*" style="display:none" onchange="cambiarFotoJoven(${joven.id}, this)">
                        </div>
                        <div class="profile-info">
                            <h2>${escapeHtml(joven.nombre)}</h2>
                            <div class="badge-rama text-gray-800">
                                ${logoRama ? `<img src="${logoRama}" alt="Logo ${joven.rama}">` : ''}
                                Rama ${joven.rama} | <span class="opacity-70">${joven.unidad}</span>
                                ${joven.rama === 'Clan' ? `<span style="margin-left:10px;display:inline-flex;align-items:center;gap:5px;cursor:pointer;" onclick="toggleCompromisoCaminante(${joven.id})" title="${joven.compromiso_caminante ? 'Compromiso realizado ✓ (clic para desmarcar)' : 'Sin Compromiso aún (clic para marcar)'}"><img src="https://i.imgur.com/eX1hXDn.png?1" style="width:22px;height:22px;object-fit:contain;${joven.compromiso_caminante ? '' : 'filter:grayscale(1);opacity:0.35;'}"><span style="font-size:0.7rem;font-weight:700;${joven.compromiso_caminante ? 'color:#10B981;' : 'color:#94a3b8;'}">${joven.compromiso_caminante ? 'Compromiso ✓' : 'Sin Compromiso'}</span></span>` : ''}
                            </div>
                            <div class="profile-info-grid">
                                <p><i class="fas fa-birthday-cake text-amber-300"></i> Edad: ${joven.edad} años</p>
                                <p><i class="fas fa-route text-green-300"></i> Etapa Actual (Acta Oficial): 
                                    <select onchange="solicitarFirmaDigital(${joven.id}, 'etapa', this.value)" class="text-gray-900 bg-white/90 hover:bg-white border-none rounded-lg px-3 py-1 font-bold text-sm ml-2 outline-none shadow-sm cursor-pointer transition">
                                        ${etapasPorRama[joven.rama] ? etapasPorRama[joven.rama].map(e => `<option value="${e}" ${joven.etapaActual === e ? 'selected' : ''}>${e}</option>`).join('') : '<option>N/A</option>'}
                                    </select>
                                </p>
                                <p title="Contacto Apoderado Titular" class="clickable-phone" onclick="openWhatsApp('${escapeHtml(joven.apoderado_titular_telefono)}')"><i class="fas fa-phone-alt text-blue-300"></i> Red de Apoyo: ${escapeHtml(joven.contacto)}</p>
                                <p class="${(joven.condiciones_necesidades && joven.condiciones_necesidades.length) ? 'text-red-100 bg-red-900/50 border border-red-500/30' : ''}"><i class="fas fa-notes-medical ${joven.condiciones_necesidades && joven.condiciones_necesidades.length ? 'text-red-400' : 'text-pink-300'}"></i> Ficha Médica: ${joven.condiciones_necesidades && joven.condiciones_necesidades.length ? joven.condiciones_necesidades.join(', ') : 'Sin Restricciones Físicas'}</p>
                            </div>
                        </div>
                        <div class="profile-actions">
                            <button class="btn btn-warning shadow-xl px-5 py-3" onclick="imprimirExpediente(${joven.id})"><i class="fas fa-file-pdf text-lg"></i> Reporte PDF</button>
                            <button class="btn bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm shadow-xl px-5 py-3" onclick="abrirModalEditarJoven(${joven.id})"><i class="fas fa-user-edit text-lg"></i> Edición Gral.</button>
                            ${joven.rama !== 'Clan' ? `<button class="btn bg-amber-500 hover:bg-amber-600 text-white border-none shadow-xl px-5 py-3" onclick="mostrarModalPaseUnidad(${joven.id})"><i class="fas fa-exchange-alt text-lg"></i> Pase de Unidad</button>` : ''}
                            ${joven.rama === 'Clan' ? `<button class="btn bg-red-700 hover:bg-red-800 shadow-xl px-5 py-3 text-white" onclick="abrirModalTransferirAdulto(${joven.id})"><i class="fas fa-exchange-alt text-lg"></i> Transferir a Adultos</button>` : ''}
                            <button class="btn shadow-xl px-5 py-3 ${joven.activo ? 'bg-emerald-600 hover:bg-red-600 text-white' : 'bg-red-600 hover:bg-emerald-600 text-white'}" onclick="toggleActivoJoven(${joven.id})" title="${joven.activo ? 'Desactivar miembro (marcar como inactivo)' : 'Reactivar miembro'}"><i class="fas ${joven.activo ? 'fa-user-check' : 'fa-user-slash'} text-lg"></i> ${joven.activo ? 'Activo ✓' : 'Inactivo ✗'}</button>
                        </div>
                    </div>
                    <div class="profile-tabs shadow-sm">
                        <div class="profile-tab ${activeYouthProfileTab === 'p-desarrollo' ? 'active' : ''}" onclick="switchProfileTab(this, 'p-desarrollo')"><i class="fas fa-chart-line"></i> Bitácora de Progresión Curricular</div>
                        <div class="profile-tab ${activeYouthProfileTab === tab2Key ? 'active' : ''}" onclick="switchProfileTab(this, '${tab2Key}')">${tab2Name}</div>
                        <div class="profile-tab ${activeYouthProfileTab === 'p-info-general' ? 'active' : ''}" onclick="switchProfileTab(this, 'p-info-general')"><i class="fas fa-notes-medical"></i> Expediente Médico / Social / Institucional</div>
                        <div class="profile-tab ${activeYouthProfileTab === 'p-ciclo' ? 'active' : ''}" onclick="switchProfileTab(this, 'p-ciclo')"><i class="fas fa-calendar-alt"></i> Ciclo de Programa</div>
                    </div>
                    <div class="profile-content-area">
                        <div id="p-desarrollo" class="p-tab-pane ${activeYouthProfileTab === 'p-desarrollo' ? 'active' : ''}">
                            <h3 class="section-title mb-6"><i class="fas fa-route text-gray-400 mr-2"></i> Ruta de Progresión Personal</h3>
                            <div class="progression-stepper mb-10">
                                ${etapasPorRama[joven.rama] ? etapasPorRama[joven.rama].map((etapa, index) => {
                                    let clase = '';
                                    const currentIndex = etapasPorRama[joven.rama].indexOf(joven.etapaActual);
                                    if (etapa === joven.etapaActual) clase = 'active';
                                    else if (currentIndex > index) clase = 'completed';
                                    
                                    const imgUrl = IMAGENES_ETAPAS[etapa];
                                    const innerContent = imgUrl ? `<img src="${imgUrl}" alt="${etapa}">` : `<i class="fas ${iconoEtapa(etapa)}"></i>`;
                                    
                                    return `<div class="p-step ${clase}"><div class="p-step-icon">${innerContent}</div><div class="p-step-label">${etapa}</div></div>`;
                                }).join('') : '<div class="text-center text-gray-500">No hay etapas definidas para esta rama</div>'}
                            </div>
                `;
                // Contenido específico de cada rama (Bandada, Manada, Tropa, Compañía, Avanzada, Clan)
                if (joven.rama === 'Bandada') {
                    const colorSemilla = colorEtapaBandada[joven.etapaActual] || 'text-amber-700';
                    html += `<h3 class="section-title"><i class="fas fa-seedling text-blue-600 mr-2"></i> Mi Semillero (Evaluación por Acción Directa)</h3>
                             <p class="text-sm font-medium text-gray-500 mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-inner">"Juntas como golondrinas, con fuerza, volamos más alto y más lejos." Las semillas materializan hitos alcanzados observados empíricamente por la Guiadora.</p>
                             <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;
                    areasDesarrollo.forEach(area => {
                        const objs = joven.objetivos[area.valKey] || [];
                        html += `
                            <div class="border ${area.border} rounded-2xl p-5 ${area.bg} shadow-sm relative hover:shadow-md transition">
                                <i class="fas fa-tree text-8xl text-white absolute -right-6 -bottom-6 opacity-40 mix-blend-overlay"></i>
                                <h4 class="font-extrabold text-center border-b ${area.border} pb-2 mb-4 text-gray-800 uppercase tracking-wider text-sm flex items-center justify-center gap-2"><i class="fas ${area.icon} ${area.color} text-lg"></i> ${area.nombre}</h4>
                                <div class="flex flex-wrap justify-center min-h-[50px] gap-3 relative z-10">
                                    ${objs.map(o => `
                                        <div class="relative inline-block group">
                                            <i class="fas fa-seedling text-2xl cursor-pointer transition-transform hover:scale-125 ${o.estado === 'aprobado' ? colorSemilla : 'text-white drop-shadow-md'}" style="${o.estado !== 'aprobado' ? 'filter: brightness(0.9);' : 'filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));'}" title="${escapeHtml(o.texto)}" onclick="toggleObjetivoMenores(${joven.id}, '${area.valKey}', ${o.id})"></i>
                                            <div class="absolute top-0 -right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button class="bg-white rounded-full w-5 h-5 text-xs shadow" onclick="event.stopPropagation(); editarObjetivoMenor(${joven.id}, '${area.valKey}', ${o.id}, '${escapeHtml(o.texto)}')"><i class="fas fa-edit text-blue-500"></i></button>
                                                <button class="bg-white rounded-full w-5 h-5 text-xs shadow" onclick="event.stopPropagation(); eliminarObjetivoMenor(${joven.id}, '${area.valKey}', ${o.id})"><i class="fas fa-trash text-red-500"></i></button>
                                            </div>
                                        </div>
                                    `).join('')}
                                    ${objs.length===0?'<span class="text-xs text-gray-500 italic font-medium w-full text-center">Árbol sin cultivar</span>':''}
                                </div>
                                <button class="w-full mt-5 text-xs font-bold bg-white border ${area.border} py-2 rounded-lg shadow-sm hover:bg-gray-50 transition text-gray-700 relative z-10" onclick="abrirModalObjetivos(${joven.id}, 'Bandada', '${area.valKey}')"><i class="fas fa-plus text-blue-500 mr-1"></i> Sembrar Desafío</button>
                            </div>`;
                    });
                    const totalSemillas = areasDesarrollo.reduce((acc, area) => acc + (joven.objetivos[area.valKey] || []).filter(o => o.estado === 'aprobado').length, 0);
                    html += `</div><div class="mt-8 flex justify-center"><div class="bg-blue-600 text-white px-8 py-3 rounded-full font-extrabold text-lg shadow-lg flex items-center gap-3"><i class="fas fa-seedling text-2xl text-amber-300"></i> Semillas Totales Germinadas: <span class="bg-white text-blue-800 px-3 py-1 rounded-full">${totalSemillas}</span></div></div>`;

                } else if (joven.rama === 'Manada') {
                    const colorHuella = colorEtapaManada[joven.etapaActual] || 'text-amber-500';
                    html += `<h3 class="section-title"><i class="fas fa-map-marked-alt text-amber-500 mr-2"></i> Mapa de Seeonee</h3>
                             <p class="text-sm font-medium text-gray-500 mb-6 bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-inner">"El pueblo libre avanza dejando su huella." El color de las huellas refleja el nivel de maestría en la selva (Lobezno, Saltador, Diestro, Cazador).</p>
                             <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">`;
                    areasDesarrollo.forEach(area => {
                        const hitos = joven.mapaSeeonee.hitos[area.valKey] || [];
                        const objs = joven.objetivos[area.valKey] || [];
                        let huellas = '';
                        for(let i=1; i<=6; i++) {
                            const active = i <= hitos.length;
                            huellas += `<i class="fas fa-paw text-2xl cursor-pointer hover:opacity-80 transition-all transform ${active ? colorHuella + ' scale-110 drop-shadow-md' : 'text-gray-200 hover:scale-105'}" onclick="marcarHitoManada(${joven.id}, '${area.valKey}', ${i}, ${!active})" title="Presionar para registrar Hito ${i}"></i> `;
                        }
                        html += `
                            <div class="border ${area.border} rounded-2xl p-5 bg-white shadow-sm flex flex-col hover:shadow-md transition">
                                <div class="flex items-center gap-4 mb-4 pb-4 border-b ${area.border}">
                                    <div class="${area.bg} ${area.color} w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-inner border border-white"><i class="fas ${area.icon} text-2xl"></i></div>
                                    <div><h4 class="font-extrabold text-gray-800 text-base uppercase tracking-wide">${area.nombre}</h4><div class="mt-1 flex gap-1">${huellas}</div></div>
                                </div>
                                <div class="bg-gray-50 p-4 rounded-xl mt-1 flex-1 border border-gray-100">
                                    <ul class="text-xs space-y-2 mb-3">
                                        ${objs.map(o => `<li class="cursor-pointer hover:bg-white hover:shadow-sm p-2 rounded-lg flex justify-between items-center border border-transparent transition" onclick="toggleObjetivoMenores(${joven.id}, '${area.valKey}', ${o.id})">
                                            <div class="flex items-center gap-3">
                                                <i class="fas ${o.estado==='aprobado' ? 'fa-check-circle text-lg '+colorHuella : 'fa-circle text-gray-300 text-lg'}"></i> 
                                                <span class="font-medium ${o.estado==='aprobado'?'line-through text-gray-400':''}" style="font-size: 0.85rem;">${escapeHtml(o.texto)}</span>
                                            </div>
                                            <div class="flex gap-1">
                                                <button class="bg-white rounded-full w-5 h-5 text-xs shadow" onclick="event.stopPropagation(); editarObjetivoMenor(${joven.id}, '${area.valKey}', ${o.id}, '${escapeHtml(o.texto)}')"><i class="fas fa-edit text-blue-500"></i></button>
                                                <button class="bg-white rounded-full w-5 h-5 text-xs shadow" onclick="event.stopPropagation(); eliminarObjetivoMenor(${joven.id}, '${area.valKey}', ${o.id})"><i class="fas fa-trash text-red-500"></i></button>
                                            </div>
                                        </li>`).join('')}
                                    </ul>
                                    <button class="w-full text-xs font-bold text-gray-600 hover:text-amber-600 bg-white border border-dashed border-gray-300 rounded-lg py-2.5 transition shadow-sm" onclick="abrirModalObjetivos(${joven.id}, 'Manada', '${area.valKey}')"><i class="fas fa-plus mr-1"></i> Asignar Desafío Educativo</button>
                                </div>
                            </div>`;
                    });
                    html += `</div>`;

                } else if (joven.rama === 'Tropa' || joven.rama === 'Compañía') {
                    const isTropa = joven.rama === 'Tropa';
                    html += `<h3 class="section-title"><i class="fas ${isTropa?'fa-compass text-green-600':'fa-sun text-teal-500'} mr-2"></i> ${isTropa?'Bitácora de Exploración (Sistema de Patrullas)':'Diario de los Desafíos (Sistema de Equipos)'}</h3>
                             <div class="bg-indigo-50 border-l-8 border-indigo-500 p-5 rounded-r-xl shadow-sm mb-8">
                                <h4 class="font-extrabold mb-2 text-indigo-900 text-base uppercase tracking-wide"><i class="fas fa-users mr-2"></i> Flujo de Co-Evaluación Institucional (Peer Review)</h4>
                                <p class="text-sm font-medium text-indigo-800 leading-relaxed mb-3">El seguimiento metodológico no recae exclusivamente en la jefatura adulta. La autonomía se forja delegando poder a los jóvenes líderes. El flujo operativo mandatado es:</p>
                                <div class="flex flex-wrap items-center gap-3">
                                    <span class="badge-estado estado-propuesto text-sm py-1.5 px-3"><i class="fas fa-flag"></i> 1. Propuesto por el Joven</span> <i class="fas fa-arrow-right text-indigo-300"></i> 
                                    <span class="badge-estado estado-patrulla text-sm py-1.5 px-3"><i class="fas fa-users-cog"></i> 2. Validado en Consejo Patrulla</span> <i class="fas fa-arrow-right text-indigo-300"></i> 
                                    <span class="badge-estado estado-aprobado text-sm py-1.5 px-3"><i class="fas fa-file-signature"></i> 3. Aprobado en Consejo Unidad</span>
                                </div>
                                <p class="text-xs text-indigo-600 mt-3 font-bold"><i class="fas fa-hand-pointer mr-1"></i> Instrucción de Software: Haz clic sobre la "etiqueta de estado" del objetivo para iniciar el Consejo de Patrulla y avanzar al siguiente nivel.</p>
                             </div>
                             <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;
                    areasDesarrollo.forEach(area => {
                        const objs = joven.objetivos[area.valKey] || [];
                        html += `
                            <div class="border border-gray-200 rounded-2xl bg-white shadow-sm flex flex-col hover:shadow-md transition overflow-hidden">
                                <div class="${area.bg} p-4 border-b border-gray-200 flex justify-between items-center">
                                    <h4 class="font-extrabold text-gray-800 text-sm uppercase tracking-wide"><i class="fas ${area.icon} ${area.color} mr-2 text-lg"></i> ${area.nombre}</h4>
                                    <button class="text-xs bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg font-bold transition shadow-sm" onclick="abrirModalObjetivos(${joven.id}, '${joven.rama}', '${area.valKey}')"><i class="fas fa-plus"></i> Idear</button>
                                </div>
                                <div class="p-4 flex-1 bg-gray-50/50">
                                    <ul class="text-xs space-y-4">`;
                        objs.forEach(o => {
                            let claseBadge = o.estado === 'aprobado' ? 'estado-aprobado' : (o.estado === 'patrulla' ? 'estado-patrulla' : 'estado-propuesto');
                            let labelBadge = o.estado === 'aprobado' ? 'Acta de Consejo' : (o.estado === 'patrulla' ? 'Aprob. Patrulla' : 'En Ejecución');
                            let iconBadge = o.estado === 'aprobado' ? 'fa-check-double' : (o.estado === 'patrulla' ? 'fa-users' : 'fa-spinner fa-spin');
                            html += `
                                        <li class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 hover:border-blue-300 transition group relative">
                                            <div class="flex justify-between items-start">
                                                <span class="${o.estado==='aprobado'?'text-gray-400 font-medium':'text-gray-800 font-bold'} text-sm leading-relaxed flex-1">${escapeHtml(o.texto)}</span>
                                                <div class="flex gap-1 ml-2">
                                                    <button class="text-blue-500 hover:text-blue-700" onclick="event.stopPropagation(); editarObjetivo(${joven.id}, '${area.valKey}', ${o.id}, '${escapeHtml(o.texto)}')" title="Editar"><i class="fas fa-edit"></i></button>
                                                    <button class="text-red-500 hover:text-red-700" onclick="event.stopPropagation(); eliminarObjetivo(${joven.id}, '${area.valKey}', ${o.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                                                </div>
                                            </div>
                                            ${o.comentarios ? `<div class="bg-amber-50 p-2 rounded border border-amber-100 text-[0.7rem] text-amber-800 font-medium italic"><i class="fas fa-quote-left mr-1 opacity-50"></i>${escapeHtml(o.comentarios)}</div>` : ''}
                                            <div class="flex justify-end items-center mt-1 border-t border-gray-100 pt-3">
                                                <span class="badge-estado ${claseBadge} px-3 py-1.5" onclick="procesarAvanceTropa(${joven.id}, '${area.valKey}', ${o.id}, '${o.estado}')" title="Hacer clic para evaluar orgánicamente"><i class="fas ${iconBadge}"></i> ${labelBadge}</span>
                                            </div>
                                        </li>`;
                        });
                        if(objs.length===0) html += `<div class="text-center py-8"><i class="fas fa-clipboard-list text-3xl text-gray-200 mb-2 block"></i><span class="text-gray-400 font-medium">Bandeja vacía.<br>El joven no ha propuesto metas.</span></div>`;
                        html += `</ul></div></div>`;
                    });
                    html += `</div>`;
                    // Actividades de Patrulla/Equipo
                    html += `<div class="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div class="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                                    <div>
                                        <h4 class="font-extrabold text-gray-800 uppercase tracking-wide"><i class="fas fa-hiking ${isTropa?'text-green-600':'text-teal-500'} mr-2"></i> Actividades de ${isTropa?'Patrulla':'Equipo'}</h4>
                                        <p class="text-xs text-gray-500 mt-1 font-medium">Diseño, organización y ejecución de actividades donde el joven lidera o asume cargos específicos (ej: Encargado de Intendencia).</p>
                                    </div>
                                    <button class="btn btn-primary ${isTropa?'bg-green-600 hover:bg-green-700':'bg-teal-500 hover:bg-teal-600'} border-none shadow-lg px-4 py-2 font-bold" onclick="abrirModalActividadTropa(${joven.id})"><i class="fas fa-plus mr-2"></i> Registrar Actividad</button>
                                </div>
                                <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">`;
                    (joven.actividades_tropa || []).forEach(act => {
                        html += `
                            <div class="border border-gray-200 bg-white p-0 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col overflow-hidden relative">
                                <div class="absolute top-3 right-3 flex gap-2 z-10">
                                    <button class="bg-white/90 text-red-600 hover:bg-red-50 border border-red-200 w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition" onclick="eliminarActividadTropa(${joven.id}, ${act.id})" title="Eliminar Actividad"><i class="fas fa-trash"></i></button>
                                </div>
                                <div class="${isTropa?'bg-green-600':'bg-teal-500'} p-4 text-white flex justify-between items-center pr-16">
                                    <h5 class="font-extrabold text-lg truncate" title="${escapeHtml(act.nombre)}">${escapeHtml(act.nombre)}</h5>
                                </div>
                                <div class="p-5 flex-1 flex flex-col">
                                    <div class="mb-3 flex items-center gap-2">
                                        <span class="${isTropa?'bg-green-100 text-green-800 border-green-200':'bg-teal-100 text-teal-800 border-teal-200'} border text-xs font-bold px-3 py-1 rounded-full"><i class="fas fa-tag mr-1"></i> ${act.tipo}</span>
                                        <span class="text-xs font-bold text-gray-500"><i class="far fa-calendar-alt ml-2 mr-1"></i> ${act.fecha}</span>
                                    </div>
                                    <div class="mb-3">
                                        <p class="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1">Cargo / Rol Asumido</p>
                                        <p class="text-sm font-bold text-gray-800">${escapeHtml(act.rol)}</p>
                                    </div>
                                    <div>
                                        <p class="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1">Evaluación / Observaciones</p>
                                        <p class="text-sm font-medium text-gray-600 italic">"${escapeHtml(act.observaciones)}"</p>
                                    </div>
                                </div>
                            </div>`;
                    });
                    if ((joven.actividades_tropa || []).length === 0) {
                        html += `
                            <div class="col-span-full flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
                                <i class="fas fa-campground text-4xl text-gray-300 mb-3"></i>
                                <span class="text-gray-500 font-extrabold">Sin Actividades Registradas</span>
                                <span class="text-sm text-gray-400 font-medium mt-1">Registra aquí excursiones o campamentos donde el joven asumió responsabilidades.</span>
                            </div>`;
                    }
                    html += `</div></div>`;

                } else if (joven.rama === 'Avanzada') {
                    html += `<h3 class="section-title"><i class="fas fa-mountain text-purple-600 mr-2"></i> Herramientas Analíticas (Avanzada)</h3>
                             <p class="text-sm font-medium text-gray-600 mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100 shadow-inner">El enfoque lineal escolar se desecha. El joven de Avanzada diseña libremente su perfil mediante la ejecución de proyectos sociales ("Mi Propia Aventura") y evalúa heurísticamente su equilibrio personal con "El Sonar".</p>
                             <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm col-span-1 lg:col-span-2 flex flex-col md:flex-row items-center gap-8">
                                    <div class="flex-1 w-full">
                                        <div class="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                                            <h4 class="font-extrabold text-gray-800 uppercase tracking-wide"><i class="fas fa-satellite-dish text-purple-500 mr-2"></i> El Sonar Personal</h4>
                                            <button class="btn btn-sm btn-outline text-purple-700 hover:bg-purple-50 border-purple-200 font-bold" onclick="guardarSonar(${joven.id})"><i class="fas fa-save"></i> Trazar Gráfico</button>
                                        </div>
                                        <div class="space-y-3">`;
                    areasDesarrollo.forEach(area => {
                        const val = (joven.sonar && joven.sonar[area.valKey] !== undefined) ? joven.sonar[area.valKey] : 1;
                        html += `
                                            <div class="flex flex-col bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <div class="flex justify-between mb-2">
                                                    <span class="font-extrabold text-xs text-gray-700 uppercase tracking-wide">${area.nombre}</span>
                                                    <span class="font-bold text-white bg-purple-600 px-2 rounded text-xs shadow-sm" id="sval-${area.valKey}">${val}</span>
                                                </div>
                                                <input type="range" min="1" max="7" value="${val}" class="w-full accent-purple-600" id="sonar-${area.valKey}" oninput="updateSonar(${joven.id})">
                                            </div>`;
                    });
                    html += `           </div>
                                    </div>
                                    <div class="w-64 h-64 shrink-0 bg-gray-50 rounded-full p-2 border-4 border-white shadow-lg"><canvas id="radar-pionero-${joven.id}"></canvas></div>
                                </div>
                             </div>`;
                    setTimeout(() => { renderSonarCanvas(joven); }, 300);
                    // Proyectos de Avanzada
                    html += `<div class="mt-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div class="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
                                    <div>
                                        <h4 class="font-extrabold text-gray-800 uppercase tracking-wide"><i class="fas fa-project-diagram text-purple-500 mr-2"></i> Proyectos de Avanzada ("Mi Propia Aventura")</h4>
                                        <p class="text-xs text-gray-500 mt-1 font-medium">Diseño y ejecución de proyectos colectivos para respaldar la adquisición de competencias.</p>
                                    </div>
                                    <button class="btn btn-primary shadow-lg px-4 py-2 font-bold" onclick="abrirModalCrearProyecto(${joven.id}, 'Avanzada')"><i class="fas fa-plus mr-2"></i> Formular Proyecto</button>
                                </div>
                                <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">`;
                    const _extAv = obtenerProyectosExternos(joven);
                    (joven.camino.proyectos_colectivos || []).forEach(p => {
                        html += `
                            <div class="border border-gray-200 bg-white p-0 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col overflow-hidden relative">
                                <div class="absolute top-3 right-3 flex gap-2 z-10">
                                    <button class="bg-white/90 text-blue-600 hover:bg-white border border-white/50 w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition" onclick="editarProyectoColectivo('${p.id}', ${joven.id})" title="Editar Proyecto"><i class="fas fa-edit"></i></button>
                                    <button class="bg-white/90 text-red-600 hover:bg-white border border-white/50 w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition" onclick="eliminarProyectoColectivoGlobal('${p.id}', ${joven.id})" title="Eliminar Proyecto"><i class="fas fa-trash"></i></button>
                                </div>
                                <div class="bg-purple-600 p-4 text-white flex justify-between items-center pr-24">
                                    <h5 class="font-extrabold text-lg truncate" title="${escapeHtml(p.nombre)}">${escapeHtml(p.nombre)}</h5>
                                </div>
                                <div class="p-5 flex-1 flex flex-col">
                                    <div class="mb-4 flex items-center gap-2">
                                        <span class="bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold px-3 py-1 rounded-full"><i class="fas fa-star mr-1"></i> ${p.campoAccion}</span>
                                    </div>
                                    <div class="mb-4">
                                        <p class="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1">Objetivo General (SMART)</p>
                                        <p class="text-sm font-medium text-gray-700 italic border-l-4 border-purple-300 pl-3">"${escapeHtml(p.objetivo)}"</p>
                                    </div>
                                    <div class="grid grid-cols-2 gap-4 mb-5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div><span class="text-[0.65rem] font-bold text-gray-400 uppercase block">Inicio</span><span class="text-sm font-bold text-gray-800">${p.inicio}</span></div>
                                        <div><span class="text-[0.65rem] font-bold text-gray-400 uppercase block">Término Real/Est.</span><span class="text-sm font-bold text-gray-800">${p.termino || 'En Ejecución'}</span></div>
                                    </div>
                                    ${renderEvidenciasProyecto(p.evidencias)}
                                    ${renderSolicitudesHTML(p, joven.id)}
                                    ${renderDetalleProyectoPropio(p, '#8B5CF6', joven.id)}
                                </div>
                            </div>`;
                    });
                    // Proyectos externos (donde es responsable o participante)
                    _extAv.forEach(({proy: p, creadorJoven}) => {
                        const myRun = (joven.run || '').trim().toLowerCase();
                        const esResp = p.responsables && Object.values(p.responsables).some(r => r && r.run && r.run.toLowerCase() === myRun);
                        const rolBadge = esResp
                            ? '<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold"><i class="fas fa-star mr-1"></i>RESPONSABLE</span>'
                            : '<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold"><i class="fas fa-user mr-1"></i>PARTICIPANTE</span>';
                        const areaRol = esResp ? Object.entries(p.responsables || {}).find(([,r]) => r && r.run && r.run.toLowerCase() === myRun)?.[0] || '' : '';
                        html += renderProyectoExterno(p, creadorJoven, rolBadge, areaRol, joven.id);
                    });
                    if ((joven.camino.proyectos_colectivos || []).length === 0 && _extAv.length === 0) {
                        html += `
                            <div class="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/50">
                                <i class="fas fa-project-diagram text-5xl text-purple-200 mb-4"></i>
                                <span class="text-purple-800 font-extrabold">Sin Proyectos de Avanzada</span>
                                <span class="text-sm text-purple-600 font-medium max-w-md text-center mt-2">El Pionero debe diseñar y ejecutar proyectos colectivos ("Mi Propia Aventura") para poder validar integralmente sus competencias.</span>
                            </div>`;
                    }
                    html += `</div></div>`;

                } else if (joven.rama === 'Clan') {
                    html += `<h3 class="section-title"><i class="fas fa-fire text-red-600 mr-2"></i> Proyecto de Vida — Camino Simbólico</h3>
                             <div class="bg-gradient-to-r from-red-50 to-white p-6 rounded-2xl border border-red-200 shadow-sm mb-6 relative overflow-hidden">
                                <i class="fas fa-quote-right absolute text-8xl text-red-100 -top-4 -right-4 z-0"></i>
                                <div class="relative z-10">

                                    <!-- Compromiso Caminante -->
                                    <div class="mb-5 p-4 rounded-xl border ${joven.compromiso_caminante ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                                        <div class="flex items-center gap-3 mb-3">
                                            <img src="https://i.imgur.com/eX1hXDn.png" style="width:36px;height:36px;object-fit:contain;${joven.compromiso_caminante ? '' : 'filter:grayscale(1);opacity:0.4'}">
                                            <div>
                                                <p class="font-extrabold text-sm ${joven.compromiso_caminante ? 'text-green-800' : 'text-gray-500'}">Compromiso del Caminante</p>
                                                <p class="text-xs ${joven.compromiso_caminante ? 'text-green-600' : 'text-gray-400'}">El momento formal en que asume el estilo de vida scout</p>
                                            </div>
                                            <button onclick="toggleCompromisoCaminante(${joven.id})" class="ml-auto btn text-xs px-3 py-1.5 ${joven.compromiso_caminante ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'} border">
                                                <i class="fas ${joven.compromiso_caminante ? 'fa-check-circle' : 'fa-circle'} mr-1"></i>${joven.compromiso_caminante ? 'Realizado ✓' : 'Marcar como realizado'}
                                            </button>
                                        </div>
                                        <div class="grid gap-3" style="grid-template-columns:1fr 1fr 2fr">
                                            <div>
                                                <label class="text-xs font-bold text-gray-500 block mb-1">El día</label>
                                                <input type="date" id="comp-dia-${joven.id}" value="${escapeHtml(joven.camino.compromiso_dia||'')}" class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-red-400">
                                            </div>
                                            <div>
                                                <label class="text-xs font-bold text-gray-500 block mb-1">En (lugar)</label>
                                                <input type="text" id="comp-lugar-${joven.id}" value="${escapeHtml(joven.camino.compromiso_lugar||'')}" placeholder="Ej: Sede del Grupo" class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-red-400">
                                            </div>
                                            <div>
                                                <label class="text-xs font-bold text-gray-500 block mb-1">Me comprometí a</label>
                                                <input type="text" id="comp-que-${joven.id}" value="${escapeHtml(joven.camino.compromiso_que||'')}" placeholder="¿A qué se comprometió?" class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-red-400">
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Las tres preguntas -->
                                    <p class="text-xs font-bold text-red-800 uppercase tracking-wide mb-2">Las tres preguntas del camino</p>
                                    <div class="grid gap-3 mb-4" style="grid-template-columns:1fr 1fr 1fr">
                                        <div class="bg-red-50 border border-red-100 rounded-xl p-3">
                                            <p class="text-xs font-bold text-red-700 mb-1">¿Qué quiero para mi vida?</p>
                                            <textarea id="pv-q1-${joven.id}" rows="2" class="w-full bg-transparent border-none outline-none text-xs text-gray-700 resize-none" placeholder="Escribe aquí...">${escapeHtml(joven.camino.pv_q1||'')}</textarea>
                                        </div>
                                        <div class="bg-red-50 border border-red-100 rounded-xl p-3">
                                            <p class="text-xs font-bold text-red-700 mb-1">¿Quién quiero ser?</p>
                                            <textarea id="pv-q2-${joven.id}" rows="2" class="w-full bg-transparent border-none outline-none text-xs text-gray-700 resize-none" placeholder="Escribe aquí...">${escapeHtml(joven.camino.pv_q2||'')}</textarea>
                                        </div>
                                        <div class="bg-red-50 border border-red-100 rounded-xl p-3">
                                            <p class="text-xs font-bold text-red-700 mb-1">¿Qué puedo hacer para lograrlo?</p>
                                            <textarea id="pv-q3-${joven.id}" rows="2" class="w-full bg-transparent border-none outline-none text-xs text-gray-700 resize-none" placeholder="Escribe aquí...">${escapeHtml(joven.camino.pv_q3||'')}</textarea>
                                        </div>
                                    </div>

                                    <!-- Mi proyecto es -->
                                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Mi proyecto es</p>
                                    <textarea id="cam-vida-${joven.id}" rows="4" class="w-full bg-white border-2 border-red-100 rounded-xl p-4 text-sm focus:border-red-400 outline-none shadow-inner font-medium text-gray-800 transition" placeholder="El Caminante estructura y redacta su inserción ciudadana y proyecto existencial aquí...">${escapeHtml(joven.camino.proyectoPersonal)}</textarea>

                                    <!-- Potenciar / Reformular -->
                                    <div class="grid gap-3 mt-4" style="grid-template-columns:1fr 1fr">
                                        <div class="bg-gray-50 border border-gray-200 rounded-xl p-3">
                                            <p class="text-xs font-bold text-gray-600 mb-1"><i class="fas fa-rocket mr-1 text-indigo-500"></i> Potencio con nuevos objetivos</p>
                                            <textarea id="pv-pot-${joven.id}" rows="2" class="w-full bg-transparent border-none outline-none text-xs text-gray-700 resize-none" placeholder="Nuevos objetivos que agrega al proyecto...">${escapeHtml(joven.camino.pv_potenciar||'')}</textarea>
                                        </div>
                                        <div class="bg-gray-50 border border-gray-200 rounded-xl p-3">
                                            <p class="text-xs font-bold text-gray-600 mb-1"><i class="fas fa-sync-alt mr-1 text-amber-500"></i> Reformulo mi proyecto</p>
                                            <textarea id="pv-ref-${joven.id}" rows="2" class="w-full bg-transparent border-none outline-none text-xs text-gray-700 resize-none" placeholder="Qué cambiaría o ajustaría...">${escapeHtml(joven.camino.pv_reformular||'')}</textarea>
                                        </div>
                                    </div>

                                    <!-- Avances concretos -->
                                    <div class="mt-4">
                                        <p class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Avances concretos</p>
                                        <div class="flex flex-col gap-2" id="avances-erp-${joven.id}">${(joven.camino.pv_avances||[]).filter(a=>a&&String(a).trim()).map((a,i)=>`<div class="flex items-center gap-2 text-xs"><span class="text-gray-400 w-4">${i+1}.</span><span class="text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 flex-1">${escapeHtml(String(a))}</span></div>`).join('')||(joven.camino.pv_avances||[]).length===0?'<span class=\'text-xs text-gray-400 italic\'>Sin avances registrados</span>':''}</div>
                                        <p class="text-xs text-gray-400 mt-2 italic">Los avances se editan desde el Portal Caminante</p>
                                    </div>

                                    <!-- Adjuntos existentes -->
                                    <div class="mt-4 p-3 bg-white rounded-lg border border-red-100">
                                        <p class="text-xs font-bold text-red-800 mb-2"><i class="fas fa-paperclip mr-1"></i> Adjuntos</p>
                                        <div class="flex gap-2 mb-2 flex-wrap">
                                            <label class="btn bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 text-xs px-3 py-1.5 cursor-pointer transition"><i class="fas fa-image mr-1"></i> Imagen <input type="file" accept="image/*" multiple style="display:none" onchange="subirAdjuntoManifiesto(${joven.id}, 'imagen', this)"></label>
                                            <label class="btn bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200 text-xs px-3 py-1.5 cursor-pointer transition"><i class="fas fa-microphone mr-1"></i> Audio <input type="file" accept="audio/*" style="display:none" onchange="subirAdjuntoManifiesto(${joven.id}, 'audio', this)"></label>
                                        </div>
                                        <div id="adjuntos-manifiesto-${joven.id}" class="flex flex-wrap gap-2">${(joven.camino.adjuntos_manifiesto || []).map(adj => adj.tipo === 'imagen' ? '<a href="'+escapeHtml(adj.url)+'" target="_blank" class="block"><img src="'+escapeHtml(adj.url)+'" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:2px solid #fca5a5;"></a>' : '<a href="'+escapeHtml(adj.url)+'" target="_blank" class="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-200"><i class="fas fa-play mr-1"></i> '+escapeHtml(adj.nombre || 'Audio')+'</a>').join('')}</div>
                                    </div>

                                    <div class="text-right mt-4"><button class="btn btn-danger bg-red-600 hover:bg-red-700 shadow-lg px-6" onclick="guardarCamino(${joven.id})"><i class="fas fa-save mr-2"></i> Guardar</button></div>
                                </div>
                             </div>
                             
                             <div class="flex justify-between items-center mb-5 border-b border-gray-200 pb-2">
                                <div><h4 class="font-extrabold text-xl text-gray-800"><i class="fas fa-project-diagram text-red-500 mr-2"></i> Proyectos de Intervención Social</h4><p class="text-xs text-gray-500 font-medium">Requisito normativo etapa Antorcha: Mínimo 2 proyectos liderados en distintos campos de acción (ODS).</p></div>
                                <button class="btn btn-primary shadow-lg px-5 py-2.5 font-bold" onclick="abrirModalCrearProyecto(${joven.id}, 'Clan')"><i class="fas fa-plus mr-2"></i> Formular Proyecto (PM Tool)</button>
                             </div>
                             <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">`;
                    const _extClan = obtenerProyectosExternos(joven);
                    (joven.camino.proyectos_colectivos || []).forEach(p => {
                        html += `
                            <div class="border border-gray-200 bg-white p-0 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col overflow-hidden relative">
                                <div class="absolute top-3 right-3 flex gap-2 z-10">
                                    <button class="bg-white/90 text-blue-600 hover:bg-white border border-white/50 w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition" onclick="editarProyectoColectivo('${p.id}', ${joven.id})" title="Editar Proyecto"><i class="fas fa-edit"></i></button>
                                    <button class="bg-white/90 text-red-600 hover:bg-white border border-white/50 w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition" onclick="eliminarProyectoColectivoGlobal('${p.id}', ${joven.id})" title="Eliminar Proyecto"><i class="fas fa-trash"></i></button>
                                </div>
                                <div class="bg-red-600 p-4 text-white flex justify-between items-center pr-24">
                                    <h5 class="font-extrabold text-lg truncate" title="${escapeHtml(p.nombre)}">${escapeHtml(p.nombre)}</h5>
                                </div>
                                <div class="p-5 flex-1 flex flex-col">
                                    <div class="mb-4 flex items-center gap-2">
                                        <span class="bg-red-100 text-red-800 border border-red-200 text-xs font-bold px-3 py-1 rounded-full"><i class="fas fa-leaf mr-1"></i> ${p.campoAccion}</span>
                                    </div>
                                    <div class="mb-4">
                                        <p class="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1">Objetivo General (SMART)</p>
                                        <p class="text-sm font-medium text-gray-700 italic border-l-4 border-red-300 pl-3">"${escapeHtml(p.objetivo)}"</p>
                                    </div>
                                    <div class="grid grid-cols-2 gap-4 mb-5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div><span class="text-[0.65rem] font-bold text-gray-400 uppercase block">Inicio</span><span class="text-sm font-bold text-gray-800">${p.inicio}</span></div>
                                        <div><span class="text-[0.65rem] font-bold text-gray-400 uppercase block">Término Real/Est.</span><span class="text-sm font-bold text-gray-800">${p.termino || 'En Ejecución'}</span></div>
                                    </div>
                                    ${renderEvidenciasProyecto(p.evidencias)}
                                    ${renderSolicitudesHTML(p, joven.id)}
                                    ${renderDetalleProyectoPropio(p, '#E31837', joven.id)}
                                    <button class="btn w-full mt-3 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white transition font-bold shadow-sm" onclick="abrirModalEvaluacionDesarrollo(${joven.id}, ${p.id})"><i class="fas fa-clipboard-check mr-2"></i> Abrir Evaluación para el Desarrollo</button>
                                </div>
                            </div>`;
                    });
                    // Externos Clan
                    _extClan.forEach(({proy: p, creadorJoven}) => {
                        const myRun = (joven.run || '').trim().toLowerCase();
                        const esResp = p.responsables && Object.values(p.responsables).some(r => r && r.run && r.run.toLowerCase() === myRun);
                        const rolBadge = esResp
                            ? '<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold"><i class="fas fa-star mr-1"></i>RESPONSABLE</span>'
                            : '<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold"><i class="fas fa-user mr-1"></i>PARTICIPANTE</span>';
                        const areaRol = esResp ? Object.entries(p.responsables || {}).find(([,r]) => r && r.run && r.run.toLowerCase() === myRun)?.[0] || '' : '';
                        html += renderProyectoExterno(p, creadorJoven, rolBadge, areaRol, joven.id);
                    });
                    if((joven.camino.proyectos_colectivos || []).length === 0 && _extClan.length === 0) {
                        html += `<div class="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-red-200 rounded-2xl bg-red-50/50">
                                    <i class="fas fa-box-open text-5xl text-red-200 mb-4"></i>
                                    <span class="text-red-800 font-extrabold">Portafolio de Proyectos Vacío</span>
                                    <span class="text-sm text-red-600 font-medium max-w-md text-center mt-2">El Caminante debe idear e inscribir sus intervenciones sociales en el sistema para evidenciar la madurez de su servicio ciudadano.</span>
                                 </div>`;
                    }
                    html += `</div>`;
                }

                html += `</div>`; // cierra p-desarrollo

                // Pestaña 2: especialidades o competencias
                if (joven.rama === 'Avanzada' || joven.rama === 'Clan') {
                    const colorRama = joven.rama === 'Avanzada' ? 'text-purple-600' : 'text-red-600';
                    const bgRama = joven.rama === 'Avanzada' ? 'bg-purple-50' : 'bg-red-50';
                    const borderRama = joven.rama === 'Avanzada' ? 'border-purple-200' : 'border-red-200';
                    const btnRama = joven.rama === 'Avanzada' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-red-600 hover:bg-red-700';
                    html += `
                        <div id="p-competencias" class="p-tab-pane">
                            <div class="flex justify-between items-center border-b-2 border-gray-200 pb-4 mb-6">
                                <div>
                                    <h3 class="text-2xl font-extrabold text-gray-800"><i class="fas fa-award ${colorRama} mr-2"></i> Gestión de Competencias</h3>
                                    <p class="text-sm text-gray-500 mt-2 font-medium">Reemplaza el sistema de especialidades en Ramas Mayores. Las competencias estratégicas se adquieren a través de la ejecución y evaluación de proyectos.</p>
                                </div>
                                <button class="btn btn-primary shadow-xl px-6 py-3 font-bold ${btnRama} border-none" onclick="abrirModalCompetencia(${joven.id})"><i class="fas fa-plus-circle mr-2 text-lg"></i> Acreditar Competencia</button>
                            </div>
                            <div class="specialty-grid">`;
                    (joven.competencias_mayores || []).forEach(comp => {
                        const completada = comp.nivel === 'Maestría';
                        html += `
                            <div class="specialty-card ${completada ? 'bg-green-50 border-green-400' : 'bg-white'} overflow-hidden">
                                ${completada ? '<div class="absolute -top-3 -right-3 bg-green-500 text-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg border-4 border-white z-10"><i class="fas fa-check text-lg"></i></div>' : ''}
                                
                                <div class="specialty-header relative z-0">
                                    <div class="specialty-icon shadow-lg border-2 border-white" style="background:${completada ? '#10b981' : (joven.rama==='Avanzada'?'#8B5CF6':'#E31837')};"><i class="fas fa-certificate"></i></div>
                                    <div class="flex flex-col">
                                        <div class="specialty-title" title="${escapeHtml(comp.nombre)}">${escapeHtml(comp.nombre).length > 20 ? escapeHtml(comp.nombre).substring(0, 20)+'...' : escapeHtml(comp.nombre)}</div>
                                        <div class="specialty-category mt-1 shadow-sm border border-gray-200">${escapeHtml(comp.area || 'General')}</div>
                                    </div>
                                </div>
                                
                                <div class="bg-white/50 rounded-lg p-3 mb-4 border border-gray-100">
                                    <p class="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-1 border-b border-gray-100 pb-1">Proyecto de Respaldo</p>
                                    <p class="text-sm font-medium text-gray-700 italic">"${escapeHtml(comp.proyecto || 'Sin proyecto asociado')}"</p>
                                </div>

                                <div class="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200 mb-3">
                                    <span class="text-xs font-bold text-gray-500 uppercase">Nivel Dominio:</span>
                                    <span class="badge-estado ${comp.nivel==='Maestría'?'estado-aprobado':(comp.nivel==='Desarrollo'?'estado-patrulla':'estado-propuesto')}">${escapeHtml(comp.nivel)}</span>
                                </div>

                                ${comp.tutor ? `<div class="monitor-tag shadow-sm bg-white"><i class="fas fa-user-tie text-indigo-500 text-lg"></i> <div class="flex flex-col"><span class="text-[0.65rem] uppercase text-gray-400 tracking-wider">Tutor/Asesor</span><strong class="text-gray-700">${escapeHtml(comp.tutor)}</strong></div></div>` : '<div class="monitor-tag opacity-60"><i class="fas fa-exclamation-circle text-amber-500"></i> <span class="text-xs">Sin tutor vinculado</span></div>'}
                                
                                <button class="w-full mt-4 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold py-2.5 rounded-lg transition shadow-md" onclick="abrirModalCompetencia(${joven.id}, ${comp.id})"><i class="fas fa-edit mr-1"></i> Editar / Actualizar</button>
                            </div>`;
                    });
                    if((joven.competencias_mayores || []).length === 0) {
                        html += `<div class="col-span-full flex flex-col items-center justify-center p-14 ${bgRama} border-2 border-dashed ${borderRama} rounded-2xl">
                                    <i class="fas fa-award text-6xl ${colorRama} opacity-30 mb-4"></i>
                                    <span class="text-xl font-extrabold text-gray-600 mb-2">No hay Competencias Registradas</span>
                                    <span class="text-sm font-medium text-gray-500 text-center max-w-md">Para el desarrollo del Proyecto de Vida o Aventura, el joven debe adquirir y acreditar competencias tangibles.</span>
                                 </div>`;
                    }
                    html += `</div></div>`;
                } else {
                    // Especialidades
                    html += `
                        <div id="p-especialidades" class="p-tab-pane">
                            <div class="flex justify-between items-center border-b-2 border-gray-200 pb-4 mb-6">
                                <div>
                                    <h3 class="text-2xl font-extrabold text-gray-800"><i class="fas fa-medal text-blue-600 mr-2"></i> Central de Certificación Técnica</h3>
                                    <p class="text-sm text-gray-500 mt-2 font-medium">Validación empírica y rigurosa en 4 ejes: Explorar, Conocer, Hacer, Servir. Rechaza el examen teórico en favor de la praxis.</p>
                                </div>
                                <button class="btn btn-primary shadow-xl px-6 py-3 font-bold" onclick="abrirModalEspecialidad(${joven.id})"><i class="fas fa-plus-circle mr-2 text-lg"></i> Aperturar Disciplina</button>
                            </div>
                            <div class="specialty-grid">`;
                    (joven.especialidades || []).forEach(esp => {
                        const p = esp.pilares || { explorar:false, conocer:false, hacer:false, servir:false };
                        const completada = p.explorar && p.conocer && p.hacer && p.servir;
                        html += `
                            <div class="specialty-card ${completada ? 'bg-green-50 border-green-400' : 'bg-white'} overflow-hidden">
                                ${completada ? '<div class="absolute -top-3 -right-3 bg-green-500 text-white w-10 h-10 flex items-center justify-center rounded-full shadow-lg border-4 border-white z-10"><i class="fas fa-check text-lg"></i></div>' : ''}
                                
                                <div class="specialty-header relative z-0">
                                    <div class="specialty-icon shadow-lg border-2 border-white" style="background:${completada ? '#10b981' : 'var(--azul-profundo)'};"><i class="fas ${esp.icono}"></i></div>
                                    <div class="flex flex-col">
                                        <div class="specialty-title" title="${escapeHtml(esp.nombre)}">${escapeHtml(esp.nombre).length > 20 ? escapeHtml(esp.nombre).substring(0, 20)+'...' : escapeHtml(esp.nombre)}</div>
                                        <div class="specialty-category mt-1 shadow-sm border border-gray-200">${escapeHtml(esp.categoria || 'General')}</div>
                                    </div>
                                </div>
                                
                                <div class="bg-white/50 rounded-lg p-3 mb-4 border border-gray-100">
                                    <p class="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">Seguimiento de Pilares Evaluativos</p>
                                    <div class="pilares-grid">
                                        <div class="pilar-item ${p.explorar?'logrado shadow-sm':''}"><i class="fas ${p.explorar?'fa-check-circle':'fa-circle text-gray-200'}"></i> Explorar</div>
                                        <div class="pilar-item ${p.conocer?'logrado shadow-sm':''}"><i class="fas ${p.conocer?'fa-check-circle':'fa-circle text-gray-200'}"></i> Conocer</div>
                                        <div class="pilar-item ${p.hacer?'logrado shadow-sm':''}"><i class="fas ${p.hacer?'fa-check-circle':'fa-circle text-gray-200'}"></i> Hacer</div>
                                        <div class="pilar-item ${p.servir?'logrado shadow-sm':''}"><i class="fas ${p.servir?'fa-check-circle':'fa-circle text-gray-200'}"></i> Servir</div>
                                    </div>
                                </div>

                                ${esp.monitor ? `<div class="monitor-tag shadow-sm bg-white"><i class="fas fa-user-tie text-indigo-500 text-lg"></i> <div class="flex flex-col"><span class="text-[0.65rem] uppercase text-gray-400 tracking-wider">Monitor Asignado</span><strong class="text-gray-700">${escapeHtml(esp.monitor)}</strong></div></div>` : '<div class="monitor-tag opacity-60"><i class="fas fa-exclamation-circle text-amber-500"></i> <span class="text-xs">Sin monitor externo vinculado</span></div>'}
                                
                                <button class="w-full mt-4 bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold py-2.5 rounded-lg transition shadow-md" onclick="abrirModalEspecialidad(${joven.id}, ${esp.id})"><i class="fas fa-edit mr-1"></i> Auditar Avances / Invitar Experto</button>
                            </div>`;
                    });
                    if((joven.especialidades || []).length === 0) {
                        html += `<div class="col-span-full flex flex-col items-center justify-center p-14 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl">
                                    <i class="fas fa-award text-6xl text-gray-300 mb-4"></i>
                                    <span class="text-xl font-extrabold text-gray-600 mb-2">No hay Especialidades Registradas</span>
                                    <span class="text-sm font-medium text-gray-500 text-center max-w-md">El Catálogo Nacional de Especialidades está a disposición. Incentiva al joven a descubrir una vocación técnica e invita a un experto civil como Monitor.</span>
                                 </div>`;
                    }
                    html += `</div></div>`;
                }

                // Pestaña información general (resumida por brevedad, pero en versión completa está todo)
                html += `
                        <div id="p-info-general" class="p-tab-pane">
                            <div class="flex justify-between items-center border-b-2 border-gray-200 pb-4 mb-6">
                                <div><h3 class="text-2xl font-extrabold text-gray-800"><i class="fas fa-folder-open text-blue-600 mr-2"></i> Expediente Administrativo Integrado</h3><p class="text-sm text-gray-500 mt-1 font-medium">Datos sincronizados con Operación Registro Institucional y Ficha Médica de Campamento.</p></div>
                                <button class="btn btn-outline border-blue-300 text-blue-800 bg-blue-50 font-bold" onclick="abrirModalEditarJoven(${joven.id})"><i class="fas fa-pen mr-2"></i> Modificar Ficha</button>
                            </div>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <!-- Datos Demográficos -->
                                <div class="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                                    <h4 class="font-extrabold border-b border-gray-100 pb-3 mb-4 text-gray-800 text-sm uppercase tracking-wide"><i class="fas fa-id-badge text-blue-500 mr-2 text-lg"></i> Identificación y Demografía</h4>
                                    <div class="grid grid-cols-2 gap-4 text-sm">
                                        <div class="bg-gray-50 p-2 rounded"><span class="text-gray-400 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">RUN Nacional</span><strong class="text-gray-800 text-base">${escapeHtml(joven.run || 'No registra')}</strong></div>
                                        <div class="bg-gray-50 p-2 rounded"><span class="text-gray-400 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">Fec. Nacimiento</span><strong class="text-gray-800">${escapeHtml(joven.fecha_nacimiento || 'No registra')}</strong></div>
                                        <div class="bg-gray-50 p-2 rounded"><span class="text-gray-400 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">Nacionalidad</span><strong class="text-gray-800">${escapeHtml(joven.nacionalidad || 'No registra')}</strong></div>
                                        <div class="bg-gray-50 p-2 rounded"><span class="text-gray-400 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">Nombre Social</span><strong class="text-gray-800">${escapeHtml(joven.nombre_social || 'N/A')}</strong></div>
                                        <div class="col-span-2 bg-gray-50 p-2 rounded"><span class="text-gray-400 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">Domicilio Particular</span><strong class="text-gray-800 clickable-address" onclick="openMaps('${escapeHtml(joven.domicilio)}')">${escapeHtml(joven.domicilio || 'No registra')}</strong></div>
                                        <div class="col-span-2 bg-gray-50 p-2 rounded"><span class="text-gray-400 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">Educación (Colegio/Universidad)</span><strong class="text-gray-800 block">${escapeHtml(joven.institucion_educacional || 'No registra')}</strong><span class="text-xs text-gray-500">Nivel: ${escapeHtml(joven.nivel || 'No registra')}</span></div>
                                        <div class="col-span-2 bg-gray-50 p-2 rounded"><span class="text-gray-400 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">Religión o Creencia (Para animador Fe)</span><strong class="text-gray-800">${escapeHtml(joven.religion || 'No registra')}</strong></div>
                                    </div>
                                </div>

                                <!-- Apoderados -->
                                <div class="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                                    <h4 class="font-extrabold border-b border-gray-100 pb-3 mb-4 text-gray-800 text-sm uppercase tracking-wide"><i class="fas fa-users-cog text-blue-500 mr-2 text-lg"></i> Red de Apoyo (Apoderados)</h4>
                                    <div class="space-y-5 text-sm">
                                        <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm relative">
                                            <span class="absolute -top-3 -left-3 bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold shadow-md">1°</span>
                                            <span class="text-blue-900 font-extrabold text-sm uppercase tracking-wide block mb-2 border-b border-blue-200 pb-1">Contacto Titular Primario</span>
                                            <strong class="text-lg text-gray-800 block mb-1">${escapeHtml(joven.apoderado_titular_nombre || 'No registra')}</strong>
                                            <span class="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded inline-block mb-3">Parentesco: ${escapeHtml(joven.apoderado_titular_parentesco || 'N/A')}</span>
                                            <div class="flex flex-col gap-1 text-gray-700">
                                                <span class="bg-white p-1.5 rounded border border-blue-100 clickable-phone" onclick="openWhatsApp('${escapeHtml(joven.apoderado_titular_telefono)}')"><i class="fas fa-phone-alt text-blue-400 w-5 text-center"></i> ${escapeHtml(joven.apoderado_titular_telefono || 'No registra')}</span>
                                                <span class="bg-white p-1.5 rounded border border-blue-100"><i class="fas fa-envelope text-blue-400 w-5 text-center"></i> ${escapeHtml(joven.apoderado_titular_email || 'No registra')}</span>
                                            </div>
                                        </div>
                                        <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                                            <span class="absolute -top-3 -left-3 bg-gray-400 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold shadow-sm">2°</span>
                                            <span class="text-gray-600 font-extrabold text-sm uppercase tracking-wide block mb-2 border-b border-gray-200 pb-1">Contacto Suplente (Emergencia)</span>
                                            <strong class="text-base text-gray-800 block mb-1">${escapeHtml(joven.apoderado_suplente1_nombre || 'No registra')}</strong>
                                            <span class="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded inline-block mb-3">Parentesco: ${escapeHtml(joven.apoderado_suplente1_parentesco || 'N/A')}</span>
                                            <div class="flex flex-col gap-1 text-gray-600">
                                                <span class="bg-white p-1.5 rounded border border-gray-200 clickable-phone" onclick="openWhatsApp('${escapeHtml(joven.apoderado_suplente1_telefono)}')"><i class="fas fa-phone-alt text-gray-400 w-5 text-center"></i> ${escapeHtml(joven.apoderado_suplente1_telefono || 'No registra')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Salud (Expediente Crítico de Riesgo) -->
                                <div class="bg-white border-2 border-red-200 p-6 rounded-2xl shadow-sm md:col-span-2 relative overflow-hidden">
                                    <div class="absolute top-0 right-0 bg-red-600 text-white font-extrabold text-xs uppercase tracking-widest px-6 py-1 rounded-bl-xl shadow-md">Clasificación Crítica (Campamento)</div>
                                    <h4 class="font-extrabold border-b border-red-100 pb-3 mb-5 text-red-900 text-lg uppercase tracking-wide"><i class="fas fa-briefcase-medical text-red-600 mr-2 text-2xl"></i> Ficha Médica y Restricciones</h4>
                                    
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div class="space-y-4">
                                            <div class="bg-red-50 p-3 rounded-xl border border-red-100">
                                                <span class="text-red-800 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">Previsión Legal de Salud</span>
                                                <strong class="text-red-950 text-lg block">${escapeHtml(joven.prevision_salud || 'Sin Cobertura Base')}</strong>
                                                ${joven.numero_registro_isapre ? `<span class="text-xs text-red-700 bg-white px-2 py-0.5 rounded border border-red-200 mt-1 inline-block">Folio: ${escapeHtml(joven.numero_registro_isapre)}</span>` : ''}
                                            </div>
                                            <div class="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
                                                <span class="text-gray-500 font-bold uppercase tracking-widest text-[0.65rem]">Grupo Sanguíneo</span>
                                                <strong class="bg-red-600 text-white px-3 py-1 rounded-lg font-extrabold text-lg shadow-inner">${escapeHtml(joven.grupo_sanguineo || '???')}</strong>
                                            </div>
                                            <div class="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                                <span class="text-gray-500 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">Seguro Escolar / Complementario</span>
                                                ${joven.tiene_seguro_complementario ? `<strong class="text-green-700 block"><i class="fas fa-shield-check mr-1"></i> Cobertura Activa</strong><span class="text-xs text-gray-600 font-medium block mt-1">Aseguradora: ${escapeHtml(joven.aseguradora)}</span><span class="text-xs text-gray-600 font-medium block">Póliza: ${escapeHtml(joven.numero_poliza)}</span>` : '<strong class="text-gray-400"><i class="fas fa-times-circle mr-1"></i> No registra</strong>'}
                                            </div>
                                        </div>
                                        <div class="md:col-span-2 space-y-4">
                                            <div class="bg-red-50 p-4 rounded-xl border-2 border-red-300 shadow-sm h-full flex flex-col">
                                                <span class="text-red-900 font-extrabold uppercase tracking-widest text-sm block mb-3 flex items-center"><i class="fas fa-exclamation-triangle text-red-600 mr-2 text-xl"></i> Condiciones y Necesidades Especiales (Alergias, TEA, Asma)</span>
                                                ${joven.condiciones_necesidades && joven.condiciones_necesidades.length ? `<div class="flex flex-wrap gap-2 mb-3">${joven.condiciones_necesidades.map(c => `<span class="bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm">${escapeHtml(c)}</span>`).join('')}</div>` : '<div class="bg-white/50 text-red-800 p-3 rounded-lg border border-red-200 font-bold text-center mb-3">✓ Joven NO declara condiciones médicas especiales o alergias crónicas.</div>'}
                                                <div class="bg-white p-3 rounded-lg border border-red-100 flex-1">
                                                    <span class="text-gray-400 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">Aclaraciones Médicas / Tratamientos:</span>
                                                    <p class="text-sm text-gray-700 font-medium italic leading-relaxed">${escapeHtml(joven.condiciones_explicacion || 'Sin observaciones detalladas del apoderado en la ficha.')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="mt-4 pt-4 border-t border-red-100 flex flex-wrap gap-4 items-center bg-gray-50 p-3 rounded-xl">
                                        <span class="text-gray-800 font-extrabold uppercase text-sm"><i class="fas fa-tshirt text-gray-400 mr-2"></i> Logística Uniforme (Tallas):</span>
                                        <span class="bg-white border border-gray-300 px-3 py-1 rounded font-bold text-blue-900 text-sm">Talla General: ${escapeHtml(joven.talla || 'N/A')}</span>
                                        <span class="bg-white border border-gray-300 px-3 py-1 rounded font-bold text-gray-700 text-sm">Hombros: ${escapeHtml(joven.medida_hombros || 'N/A')} cm</span>
                                        <span class="bg-white border border-gray-300 px-3 py-1 rounded font-bold text-gray-700 text-sm">Largo: ${escapeHtml(joven.medida_largo || 'N/A')} cm</span>
                                    </div>
                                </div>
                                
                                <!-- Institucional / Financiero -->
                                <div class="bg-indigo-900 border border-indigo-800 p-6 rounded-2xl shadow-lg md:col-span-2 flex flex-col md:flex-row justify-between items-center gap-6 text-white">
                                    <div class="flex-1">
                                        <h4 class="font-extrabold text-white text-lg flex items-center mb-1"><i class="fas fa-building text-indigo-400 text-2xl mr-3"></i> Operación Registro Institucional (ORI)</h4>
                                        <p class="text-sm text-indigo-200 font-medium">Validación contable y legal requerida anualmente por Sede Nacional para habilitar el Seguro de Accidentes Scout.</p>
                                        <div class="mt-3 flex gap-4 text-xs font-bold uppercase tracking-widest text-indigo-300">
                                            <span><i class="far fa-calendar-alt mr-1"></i> Fec. Ingreso: ${escapeHtml(joven.fecha_ingreso_grupo || 'Pendiente')}</span>
                                            <span><i class="fas fa-tag mr-1"></i> Categoría: ${escapeHtml(joven.tipo_miembro || 'Beneficiario')}</span>
                                        </div>
                                    </div>
                                    <div class="flex flex-wrap gap-3 shrink-0">
                                        <div class="flex flex-col items-center justify-center w-28 h-24 rounded-xl border-2 ${joven.registro_pagado ? 'bg-green-500/20 border-green-400 text-green-300' : 'bg-red-500/20 border-red-500 text-red-400'} shadow-inner">
                                            <i class="fas ${joven.registro_pagado ? 'fa-check-circle' : 'fa-times-circle'} text-3xl mb-2 drop-shadow-md"></i>
                                            <span class="text-[0.65rem] font-extrabold uppercase text-center px-2 leading-tight">Cuota Nacional</span>
                                        </div>
                                        <div class="flex flex-col items-center justify-center w-28 h-24 rounded-xl border-2 ${joven.progresion_documento ? 'bg-blue-500/30 border-blue-400 text-blue-200' : 'bg-gray-800/50 border-gray-600 text-gray-500'} shadow-inner">
                                            <i class="fas fa-file-contract text-3xl mb-2 drop-shadow-md"></i>
                                            <span class="text-[0.65rem] font-extrabold uppercase text-center px-2 leading-tight">Autorización Firmada</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- NUEVA PESTAÑA: CICLO DE PROGRAMA (iframe placeholder) -->
                        <div id="p-ciclo" class="p-tab-pane">
                            <div class="bg-white border-2 border-dashed border-indigo-300 rounded-2xl p-12 text-center">
                                <i class="fas fa-calendar-alt text-6xl text-indigo-300 mb-4"></i>
                                <h3 class="text-2xl font-extrabold text-indigo-800 mb-2">Ciclo de Programa</h3>
                                <p class="text-gray-500 max-w-md mx-auto">Esta sección se integrará próximamente con el módulo de planificación anual, registro de campamentos y actividades institucionales.</p>
                                <div class="mt-6 p-4 bg-gray-50 rounded-xl inline-block shadow-inner">
                                    <span class="text-sm font-mono text-gray-400">iframe placeholder para contenido externo</span>
                                </div>
                            </div>
                        </div>
                    </div>`;
                
                view.innerHTML = html;
                const tabToActivate = document.querySelector(`.profile-tab[onclick*="'${activeYouthProfileTab}'"]`);
                if (tabToActivate) tabToActivate.click(); else document.querySelector('.profile-tab')?.click();
            } catch (error) {
                console.error('Error rendering profile:', error);
                document.getElementById('youth-profile-view').innerHTML = `
                    <div class="p-8 text-center text-red-600">
                        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                        <h3 class="text-xl font-bold">Error al cargar el expediente</h3>
                        <p class="mt-2">Ocurrió un problema al mostrar los datos. Por favor, intente nuevamente.</p>
                        <p class="text-sm text-gray-500 mt-4">Detalle técnico: ${error.message}</p>
                    </div>
                `;
            }
        }

        function switchProfileTab(btn, tabId) {
            const tabs = btn.parentElement.querySelectorAll('.profile-tab');
            tabs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            const panes = btn.parentElement.nextElementSibling.querySelectorAll('.p-tab-pane');
            panes.forEach(p => p.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            activeYouthProfileTab = tabId;
        }

        // ================= DB & LOGIC UPDATES =================
