        async function cargarJovenes() {
            if (datosCargados) return;
            try {
                // ═══ FILTRO POR UNIDAD ═══
                // Asegurar que Permisos está listo antes de filtrar
                if (window.Permisos && !Permisos.listo()) {
                    await new Promise(r => {
                        const t = setInterval(() => { if (Permisos.listo()) { clearInterval(t); r(); } }, 80);
                        setTimeout(() => { clearInterval(t); r(); }, 5000);
                    });
                }

                const esDirigente = window.Permisos && Permisos.listo() && !Permisos.esAdmin() && Permisos.nivel() < 4;
                const miUnidad    = esDirigente ? (Permisos.unidad() || '') : '';
                const keyword     = miUnidad ? miUnidad.split(' ')[0] : ''; // "Clan"

                // Filtro a nivel DB
                let queryJovenes = supabaseClient.from('mmbb_registrations').select('*').order('apellidos');
                if (keyword) {
                    queryJovenes = queryJovenes.ilike('unidad', '%' + keyword + '%');
                }
                const { data, error } = await queryJovenes;
                if (error) throw error;

                // Filtro secundario a nivel cliente (garantía adicional)
                let dataFiltrada = data || [];
                if (keyword) {
                    const kw = keyword.toLowerCase();
                    dataFiltrada = dataFiltrada.filter(j => (j.unidad || '').toLowerCase().includes(kw));
                }
                const { data: progData } = await supabaseClient.from('progresion_jovenes').select('*');
                if (progData) progData.forEach(p => { progresionJovenes[p.joven_id] = p; });

                personasJovenes = dataFiltrada.map(j => {
                    let rama = 'Tropa', color = '#00853F';
                    const unidadLower = (j.unidad || '').toLowerCase();
                    if (unidadLower.includes('bandada')) { rama = 'Bandada'; color = '#4169E1'; }
                    else if (unidadLower.includes('manada')) { rama = 'Manada'; color = '#FFD100'; }
                    else if (unidadLower.includes('tropa')) { rama = 'Tropa'; color = '#00853F'; }
                    else if (unidadLower.includes('compañía') || unidadLower.includes('compania')) { rama = 'Compañía'; color = '#40E0D0'; }
                    else if (unidadLower.includes('avanzada')) { rama = 'Avanzada'; color = '#8B5CF6'; }
                    else if (unidadLower.includes('clan') || unidadLower.includes('caminante')) { rama = 'Clan'; color = '#E31837'; }
                    
                    const prog = progresionJovenes[j.id] || {};
                    let etapaValida = prog.etapa_actual || j.adelanto;
                    if (!etapaValida || !etapasPorRama[rama] || !etapasPorRama[rama].includes(etapaValida)) {
                        etapaValida = etapasPorRama[rama] ? etapasPorRama[rama][0] : '';
                    }
                    
                    const objetivos = (prog.territorios && prog.territorios.objetivos) ? prog.territorios.objetivos : 
                                     (prog.semillero?.objetivos || { corporalidad:[], creatividad:[], caracter:[], afectividad:[], sociabilidad:[], espiritualidad:[] });
                    areasDesarrollo.forEach(area => {
                        if (!objetivos[area.valKey]) objetivos[area.valKey] = [];
                    });
                    
                    return {
                        id: j.id, nombre: `${j.nombres || ''} ${j.apellidos || ''}`.trim(), 
                        nombres: j.nombres, apellidos: j.apellidos,
                        rama, unidad: j.unidad || 'Unidad no especificada', 
                        edad: j.fecha_nacimiento ? calcularEdad(j.fecha_nacimiento) : 0,
                        activo: j.activo !== false,
                        foto: j.foto_url || 'https://ui-avatars.com/api/?name='+encodeURIComponent(j.nombres)+'&background=f1f5f9&color=0E2586&bold=true',
                        contacto: j.apoderado_titular_nombre ? `${j.apoderado_titular_nombre} (${j.apoderado_titular_telefono || 'Sin fono'})` : 'No registra apoderado',
                        etapaActual: etapaValida, 
                        color,
                        genero: j.genero || 'M',
                        
                        run: j.run, fecha_nacimiento: j.fecha_nacimiento, nacionalidad: j.nacionalidad, domicilio: j.domicilio,
                        religion: j.religion, institucion_educacional: j.institucion_educacional, nivel: j.nivel,
                        apoderado_titular_nombre: j.apoderado_titular_nombre, apoderado_titular_parentesco: j.apoderado_titular_parentesco,
                        apoderado_titular_telefono: j.apoderado_titular_telefono, apoderado_titular_email: j.apoderado_titular_email,
                        apoderado_suplente1_nombre: j.apoderado_suplente1_nombre, apoderado_suplente1_parentesco: j.apoderado_suplente1_parentesco,
                        apoderado_suplente1_telefono: j.apoderado_suplente1_telefono, apoderado_suplente1_email: j.apoderado_suplente1_email,
                        apoderado_suplente2_nombre: j.apoderado_suplente2_nombre, apoderado_suplente2_parentesco: j.apoderado_suplente2_parentesco,
                        apoderado_suplente2_telefono: j.apoderado_suplente2_telefono, apoderado_suplente2_email: j.apoderado_suplente2_email,
                        prevision_salud: j.prevision_salud, numero_registro_isapre: j.numero_registro_isapre,
                        tiene_seguro_complementario: j.tiene_seguro_complementario, aseguradora: j.aseguradora, numero_poliza: j.numero_poliza,
                        grupo_sanguineo: j.grupo_sanguineo, vacunas: j.vacunas, condiciones_necesidades: j.condiciones_necesidades || [],
                        condiciones_explicacion: j.condiciones_explicacion,
                        max_nivel_educacional_jefe: j.max_nivel_educacional_jefe, ocupacion_jefe: j.ocupacion_jefe,
                        cantidad_personas_hogar: j.cantidad_personas_hogar, vivienda: j.vivienda, bienes_hogar: j.bienes_hogar || [],
                        registro_pagado: j.registro_pagado, email_creado_dominio: j.email_creado_dominio,
                        compromiso_caminante: j.compromiso_caminante || false,
                        progresion_documento: j.progresion_documento, monto_pagado: j.monto_pagado, comprobante_url: j.comprobante_url,
                        email_institucional: j.email_institucional, fecha_ingreso_grupo: j.fecha_ingreso_grupo,
                        adelanto: j.adelanto, tipo_miembro: j.tipo_miembro, nombre_social: j.nombre_social,
                        medida_hombros: j.medida_hombros, medida_largo: j.medida_largo, talla: j.talla,

                        objetivos: objetivos,
                        mapaSeeonee: prog.mapa_seeonee || { hitos: {}, etapaActual:'Lobezno' },
                        sonar: prog.sonar || { caracter:1, afectividad:1, creatividad:1, corporalidad:1, sociabilidad:1, espiritualidad:1 },
                        competencias_mayores: (prog.territorios && prog.territorios.competencias_mayores) ? prog.territorios.competencias_mayores : [],
                        camino: prog.camino || { proyectoPersonal:"", proyectos_colectivos:[] },
                        especialidades: prog.especialidades || [],
                        actividades_tropa: (prog.territorios && prog.territorios.actividades_tropa) ? prog.territorios.actividades_tropa : []
                    };
                });
                datosCargados = true;
                renderYouthList();
                // Si hay id en URL, seleccionar ese joven
                const urlParams = new URLSearchParams(window.location.search);
                const idParam = urlParams.get('id');
                if (idParam) {
                    const joven = personasJovenes.find(j => j.id == idParam);
                    if (joven) {
                        setTimeout(() => {
                            renderYouthProfile(joven);
                            const items = document.querySelectorAll('.youth-list-item');
                            items.forEach(item => {
                                if (item.innerText.includes(joven.nombre)) item.click();
                            });
                        }, 500);
                    }
                }
            } catch (error) { 
                mostrarNotificacion('error', 'Fallo crítico de conexión con Base de Datos del Sistema Nacional.'); 
                console.error("Supabase Error:", error); 
            }
        }

        function filterByUnit(unidad, btn) {
            document.querySelectorAll('.youth-tag').forEach(el => { el.classList.remove('active'); el.style.opacity = '0.4'; });
            btn.classList.add('active'); btn.style.opacity = '1';
            activeFilterUnit = unidad; renderYouthList();
        }
        function filterYouthList() { renderYouthList(); }
        let mostrarInactivos = false;
        function toggleMostrarInactivos() {
            mostrarInactivos = !mostrarInactivos;
            const btn = document.getElementById('btn-toggle-inactivos');
            btn.innerHTML = mostrarInactivos ? '<i class="fas fa-eye-slash"></i> Ocultar inactivos' : '<i class="fas fa-eye"></i> Ver inactivos';
            btn.style.background = mostrarInactivos ? '#fef3c7' : '';
            btn.style.color = mostrarInactivos ? '#92400e' : '';
            renderYouthList();
        }

        // Renderiza evidencias — sin template literals anidados
        function renderEvidenciasProyecto(evs) {
            if (!evs || !evs.length) return '';
            var h = '<div class="mt-auto pt-4 border-t border-gray-100">';
            h += '<p class="text-xs font-bold text-gray-500 mb-2">';
            h += '<i class="fas fa-paperclip mr-1"></i> Evidencias (' + evs.length + ')</p>';
            h += '<div class="flex flex-wrap gap-2">';
            evs.forEach(function(ev) {
                var url = typeof ev === 'string' ? ev : (ev.url || '');
                var nom = typeof ev === 'string' ? url.split('/').pop() : (ev.nombre || 'archivo');
                if (nom.length > 12) nom = nom.slice(0, 10) + '…';
                var m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                var did = m ? m[1] : null;
                var thumb = did ? 'https://drive.google.com/thumbnail?id=' + did + '&sz=w200' : url;
                var isImg = !!did || /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url);
                if (isImg) {
                    h += '<a href="' + url + '" target="_blank" ';
                    h += 'style="display:block;width:70px;height:70px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">';
                    h += '<img src="' + thumb + '" style="width:70px;height:70px;object-fit:cover"></a>';
                } else {
                    h += '<a href="' + url + '" target="_blank" ';
                    h += 'style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:4px 8px;font-size:11px;color:#4b5563">';
                    h += nom + '</a>';
                }
            });
            h += '</div></div>';
            return h;
        }

        function renderYouthList() {
            const query = document.getElementById('search-youth').value.toLowerCase();
            const ul = document.getElementById('youth-ul-list'); ul.innerHTML = '';
            let conteo = 0; let inactivos = 0;
            personasJovenes.forEach(j => {
                if (!j.activo) inactivos++;
                if (!mostrarInactivos && !j.activo) return;
                if ((activeFilterUnit === 'Todas' || j.rama === activeFilterUnit) && (j.nombre.toLowerCase().includes(query) || j.unidad.toLowerCase().includes(query))) {
                    conteo++;
                    const li = document.createElement('li'); li.className = 'youth-list-item';
                    if (!j.activo) li.style.opacity = '0.45';
                    li.onclick = () => { document.querySelectorAll('.youth-list-item').forEach(e => e.classList.remove('active')); li.classList.add('active'); renderYouthProfile(j); };
                    li.innerHTML = `<img src="${j.foto}" class="youth-list-pic" style="border-color:${j.activo ? j.color : '#94a3b8'};${!j.activo ? 'filter:grayscale(0.8);' : ''}"><div class="youth-list-info"><h4>${j.nombre}${!j.activo ? ' <span style="color:#ef4444;font-size:0.6rem;font-weight:700;background:#fef2f2;padding:1px 6px;border-radius:4px;margin-left:4px;">INACTIVO</span>' : ''}</h4><p><i class="fas fa-users text-[0.65rem] mr-1"></i>${j.unidad}</p></div><div class="youth-list-badge" style="background:${j.activo ? j.color : '#94a3b8'}"></div>`;
                    ul.appendChild(li);
                }
            });
            if(conteo === 0) {
                ul.innerHTML = `<div class="p-6 text-center text-gray-400"><i class="fas fa-search text-3xl mb-3 opacity-50 block"></i><p class="font-medium text-sm">No se encontraron registros en el padrón nacional.</p></div>`;
            }
            const badge = document.getElementById('badge-inactivos');
            if (badge) badge.textContent = inactivos > 0 ? `(${inactivos} inactivos)` : '';
        }

        function formatPhoneForWhatsApp(phone) {
            if (!phone) return null;
            let digits = phone.replace(/\D/g, '');
            if (digits.length === 9 && digits.startsWith('9')) {
                digits = '56' + digits;
            } else if (digits.length === 8) {
                digits = '562' + digits;
            } else if (digits.length === 11 && digits.startsWith('56')) {
                // ok
            } else if (digits.length === 10 && digits.startsWith('9')) {
                digits = '56' + digits;
            }
            return digits;
        }
        function openWhatsApp(phone) {
            const formatted = formatPhoneForWhatsApp(phone);
            if (formatted) {
                window.open(`https://wa.me/${formatted}`, '_blank');
            } else {
                mostrarNotificacion('info', 'No se pudo abrir WhatsApp: número no válido');
            }
        }
        function openMaps(address) {
            if (address && address.trim()) {
                window.open(`https://www.google.com/maps/search/${encodeURIComponent(address)}`, '_blank');
            } else {
                mostrarNotificacion('info', 'Dirección no disponible');
            }
        }

        // ================= FUNCIÓN PARA ENVÍO DE CORREOS DE HITO =================
