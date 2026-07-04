        async function cargarDatos() {
            try {
                document.getElementById('tbodyDirectorio').innerHTML = '<tr><td colspan="11" class="text-center py-12 text-gray-400 font-bold"><i class="fas fa-circle-notch fa-spin text-3xl mb-3 text-blue-500 block"></i> Sincronizando datos...</td></tr>';

                // Inicializar Permisos si no está listo
                if (window.Permisos && !Permisos.listo()) {
                    const sb = window._sbClient || supabaseClient;
                    if (sb) await Permisos.init(sb);
                }
                // Espera adicional si aún no está listo
                if (window.Permisos && !Permisos.listo()) {
                    await new Promise(r => {
                        const t = setInterval(() => { if (Permisos.listo()) { clearInterval(t); r(); } }, 80);
                        setTimeout(() => { clearInterval(t); r(); }, 5000);
                    });
                }

                const esDirigente = window.Permisos && Permisos.listo() && !Permisos.esAdmin() && Permisos.nivel() < 4;
                const miUnidad = esDirigente ? Permisos.unidad() : null;

                // Jóvenes: filtrar por unidad si es dirigente
                let queryJovenes = supabaseClient.from('mmbb_registrations').select('*').order('apellidos');
                if (miUnidad) {
                    const palabraUnidad = miUnidad.split(' ')[0];
                    queryJovenes = queryJovenes.ilike('unidad', '%' + palabraUnidad + '%');
                }
                const { data: MMData } = await queryJovenes;

                // Filtro cliente como respaldo
                let MMDataFiltrada = MMData || [];
                if (miUnidad) {
                    const kw = miUnidad.split(' ')[0].toLowerCase();
                    MMDataFiltrada = MMDataFiltrada.filter(j => (j.unidad || '').toLowerCase().includes(kw));
                }

                // Adultos: dirigentes ven a TODOS (directorio completo de adultos)
                const { data: ADData } = await supabaseClient.from('adultos_registros').select('*').order('apellidos');

                jovenes = MMDataFiltrada.map(j => {
                    let rama = 'Tropa'; const u = (j.unit || j.unidad || '').toLowerCase();
                    if (u.includes('bandada')) rama = 'Bandada'; 
                    else if (u.includes('manada')) rama = 'Manada';
                    else if (u.includes('tropa')) rama = 'Tropa'; 
                    else if (u.includes('compañía')) rama = 'Compañía';
                    else if (u.includes('avanzada') || u.includes('pionero')) rama = 'Avanzada'; 
                    else if (u.includes('clan') || u.includes('caminante')) rama = 'Clan';
                    
                    const edad = calcularEdad(j.fecha_nacimiento);
                    return {
                        id: j.id, run: j.run || '', nombre: `${j.nombres} ${j.apellidos}`, tipo: 'joven', rama, unidad: j.unidad || 'S/U', 
                        etapa: j.adelanto || 'Sin etapa', edad, estadoInstitucional: j.registro_pagado ? 'aldia' : 'pendiente',
                        foto: j.foto_url || `https://ui-avatars.com/api/?name=${j.nombres}&background=0E2586&color=fff&bold=true`,
                        email: j.email_institucional || '', contactoRaw: j.apoderado_titular_telefono || '',
                        medica: j.condiciones_necesidades?.length > 0, cumple: esCumpleanosCercano(j.fecha_nacimiento),
                        anosServicio: calcularEdad(j.fecha_ingreso_grupo), validacion: validarAdelanto(rama, j.adelanto, edad)
                    };
                });

                adultos = (ADData || []).map(a => {
                    let rama = 'Institucional'; const u = (a.unidad_rol || '').toLowerCase();
                    if (u.includes('bandada')) rama = 'Bandada'; 
                    else if (u.includes('manada')) rama = 'Manada';
                    else if (u.includes('tropa')) rama = 'Tropa'; 
                    else if (u.includes('compañía')) rama = 'Compañía';
                    else if (u.includes('avanzada') || u.includes('pionero')) rama = 'Avanzada'; 
                    else if (u.includes('clan') || u.includes('caminante')) rama = 'Clan';

                    return {
                        id: a.id, run: a.run || '', nombre: `${a.nombres} ${a.apellidos}`, tipo: 'adulto', rama, 
                        unidad: a.unidad_rol || 'Grupo Scout', cargo: a.roles?.[0] || 'Adulto', edad: calcularEdad(a.fecha_nacimiento), 
                        estadoInstitucional: a.cuota_pagada ? 'aldia' : 'pendiente', foto: a.foto_url || `https://ui-avatars.com/api/?name=${a.nombres}&background=1e293b&color=fff&bold=true`,
                        email: a.email || '', contactoRaw: a.telefono || '', medica: a.alergias?.length > 0, cumple: esCumpleanosCercano(a.fecha_nacimiento),
                        anosServicio: calcularEdad(a.fecha_ingreso_grupo), validacion: '✅ N/A'
                    }
                });
                sortData('nombre', true); 
            } catch (err) { console.error(err); }
        }

        function renderTabla() {
            const search = document.getElementById('searchNombre').value.toLowerCase();
            const tipoF = document.getElementById('filtroTipo').value;
            const ramaF = document.getElementById('filtroUnidad').value;
            const instF = document.getElementById('filtroEstado').value;
            const recoF = document.getElementById('filtroReconocimiento').value;
            const espF = document.getElementById('filtroEspecial').value;

            let pool = [];
            if (tipoF === 'todos' || tipoF === 'joven') pool.push(...jovenes);
            if (tipoF === 'todos' || tipoF === 'adulto') pool.push(...adultos);

            pool = pool.filter(p => {
                const mSearch = p.nombre.toLowerCase().includes(search) || p.run.toLowerCase().includes(search) || p.contactoRaw.includes(search);
                const mRama = ramaF === 'todas' || p.rama === ramaF;
                const mInst = instF === 'todos' || p.estadoInstitucional === instF;
                let mReco = true;
                if (recoF === 'oro') mReco = p.anosServicio >= 8; else if (recoF === 'plata') mReco = p.anosServicio >= 6 && p.anosServicio < 8; else if (recoF === 'bronce') mReco = p.anosServicio >= 2 && p.anosServicio < 6;
                let mEsp = true;
                if (espF === 'medica') mEsp = p.medica; else if (espF === 'cumple') mEsp = p.cumple; else if (espF === 'falta_tel') mEsp = !p.contactoRaw;
                return mSearch && mRama && mInst && mReco && mEsp;
            });

            personasFiltradasCache = pool;
            const tbody = document.getElementById('tbodyDirectorio');
            tbody.innerHTML = pool.map(p => {
                const logo = LOGOS_UNIDADES[p.rama] || ''; const imgE = IMAGENES_ETAPAS[p.etapa] || ''; const reco = obtenerReconocimiento(p.anosServicio, p.rama);
                const safeNom = p.nombre.replace(/'/g, "\\'");
                const wsp = p.contactoRaw ? `href="https://wa.me/56${p.contactoRaw.replace(/\D/g,'')}" target="_blank"` : `style="opacity:0.3; cursor:not-allowed;"`;

                return `
                    <tr onclick="verDetalle('${p.tipo}', ${p.id})">
                        <td class="text-center chk-col" onclick="event.stopPropagation()"><input type="checkbox" class="row-checkbox" value="${p.tipo}-${p.id}" onchange="onCheckboxChange(this)"></td>
                        <td class="text-center"><img src="${p.foto}" class="avatar shadow-sm mx-auto"></td>
                        <td class="font-extrabold text-blue-900">${escapeHtml(p.nombre)} ${reco ? reco.iconHtml : ''} ${p.medica ? '<i class="fas fa-notes-medical text-red-500 ml-1"></i>':''}</td>
                        <td><span class="badge ${p.tipo==='joven'?'bg-blue-50 text-blue-700':'bg-purple-50 text-purple-700'}">${p.tipo.toUpperCase()}</span></td>
                        <td><span class="badge bg-slate-50 text-slate-700">${escapeHtml(p.cargo || p.rama)}</span></td>
                        <td><div class="flex items-center gap-2">${logo ? `<img src="${logo}" class="logo-unidad-mini">`:''}<span class="font-semibold text-slate-700">${escapeHtml(p.unidad)}</span></div></td>
                        <td class="font-bold">${p.edad} años ${p.cumple ? '🎂':''}</td>
                        <td><span class="badge ${p.estadoInstitucional==='aldia'?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-700'}">${p.estadoInstitucional==='aldia'?'AL DÍA':'PENDIENTE'}</span></td>
                        <td><div class="flex items-center gap-2">${imgE ? `<img src="${imgE}" class="insignia-prog shadow-sm">` : '<i class="fas fa-certificate text-gray-200"></i>'}<div class="flex flex-col"><span class="text-xs font-bold text-gray-800 leading-tight">${p.etapa}</span><span class="text-[0.65rem] font-black uppercase text-blue-500">${p.validacion}</span></div></div></td>
                        <td class="text-xs font-medium text-slate-500">${p.email || p.contactoRaw}</td>
                        <td class="text-center acciones-rapidas">
                            <div class="flex gap-2 justify-center" onclick="event.stopPropagation()">
                                <a ${wsp} class="bg-emerald-50 text-emerald-600 p-2 rounded-lg hover:bg-emerald-100 transition"><i class="fab fa-whatsapp"></i></a>
                                <button onclick="abrirModalCorreo('${p.email}', '${safeNom}')" class="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition"><i class="fas fa-envelope"></i></button>
                                <button onclick="verDetalle('${p.tipo}', ${p.id})" class="bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-100 transition"><i class="fas fa-external-link-alt"></i></button>
                            </div>
                        </td>
                    </tr>`;
            }).join('');
            updateKpis(pool);
        }

        function sortData(col, forceAsc = null) {
            if (forceAsc !== null) { currentSortAsc = forceAsc; currentSortColumn = col; }
            else if (currentSortColumn === col) { currentSortAsc = !currentSortAsc; }
            else { currentSortColumn = col; currentSortAsc = true; }
            renderTabla();
        }

        function updateKpis(data) {
            const j = data.filter(p => p.tipo === 'joven').length; const a = data.filter(p => p.tipo === 'adulto').length;
            const al = data.filter(p => p.medica).length; const p = data.filter(p => p.estadoInstitucional === 'aldia').length;
            document.getElementById('mini-kpis').innerHTML = `
                <div class="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between"><div><p class="text-xs font-bold text-indigo-500 uppercase">Padrón</p><p class="text-2xl font-black text-indigo-900">${data.length}</p></div><i class="fas fa-users text-3xl text-indigo-200"></i></div>
                <div class="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between"><div><p class="text-xs font-bold text-blue-500 uppercase">Beneficiarios</p><p class="text-2xl font-black text-blue-900">${j}</p></div><i class="fas fa-child text-3xl text-blue-200"></i></div>
                <div class="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center justify-between"><div><p class="text-xs font-bold text-red-500 uppercase">Alertas</p><p class="text-2xl font-black text-red-900">${al}</p></div><i class="fas fa-notes-medical text-3xl text-red-200"></i></div>
                <div class="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center justify-between"><div><p class="text-xs font-bold text-emerald-500 uppercase">Al día</p><p class="text-2xl font-black text-emerald-900">${p}</p></div><i class="fas fa-check-circle text-3xl text-emerald-200"></i></div>`;
        }

        // --- ACCIONES ---
        function verDetalle(t, id) { window.location.href = t === 'joven' ? `programa_jovenes.html?id=${id}` : `adultos.html?id=${id}`; }
        function toggleSelectAll() { const chk = document.getElementById('selectAll').checked; document.querySelectorAll('.row-checkbox').forEach(c => { c.checked = chk; c.closest('tr').classList.toggle('selected', chk); }); updateSelectionCounter(); }
        function onCheckboxChange(c) { c.closest('tr').classList.toggle('selected', c.checked); updateSelectionCounter(); }
        function updateSelectionCounter() { const n = document.querySelectorAll('.row-checkbox:checked').length; document.getElementById('selection-counter').innerText = `${n} seleccionados`; document.getElementById('selection-counter').classList.toggle('hidden', n === 0); document.getElementById('btn-clear-selection').classList.toggle('hidden', n === 0); }
        function clearSelection() { document.getElementById('selectAll').checked = false; document.querySelectorAll('.row-checkbox').forEach(c => { c.checked = false; c.closest('tr').classList.remove('selected'); }); updateSelectionCounter(); }
        
