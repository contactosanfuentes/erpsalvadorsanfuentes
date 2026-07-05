    window.buscar = async function() {
        const q = document.getElementById('q').value.trim();
        if (!q || q.length < 2) return;

        const btn = document.getElementById('btnB');
        btn.innerHTML = '<span class="sc-spin"></span>';
        btn.disabled = true;

        const res = document.getElementById('res');
        res.innerHTML = '<div style="text-align:center;padding:30px;color:var(--azul-profundo)"><div style="display:inline-block;width:36px;height:36px;border:4px solid #e2e8f0;border-top-color:var(--azul-profundo);border-radius:50%;animation:spin .7s linear infinite"></div><p style="margin-top:10px;font-size:0.85rem">Buscando...</p></div>';

        // Buscar en mmbb_registrations (TODAS las columnas necesarias)
        const runLimpio = q.replace(/\./g, '').replace(/-/g, '');
        const { data: jovenesRaw, error } = await db
            .from('mmbb_registrations')
            .select('*')
            .or(`nombres.ilike.%${q}%,apellidos.ilike.%${q}%,run.ilike.%${runLimpio}%`)
            .limit(5);

        btn.innerHTML = '<i class="fas fa-search"></i> Buscar';
        btn.disabled = false;

        if (error) {
            res.innerHTML = `<div class="errb"><i class="fas fa-exclamation-circle"></i>Error: ${error.message}</div>`;
            return;
        }
        if (!jovenesRaw?.length) {
            res.innerHTML = '<div class="esm" style="background:white;border-radius:10px;padding:30px"><i class="fas fa-user-slash"></i>No se encontró ningún participante con ese dato.</div>';
            return;
        }

        // Mapear a objetos planos para evitar DataCloneError
        const jovenes = jovenesRaw.map(j => ({...j}));

        res.innerHTML = '';
        for (const j of jovenes) res.innerHTML += await renderJoven(j);

        // Activar listeners de tabs
        document.querySelectorAll('.tab-int').forEach(tab => {
            tab.onclick = () => cambiarTab(tab);
        });

        // Cargar autorizaciones y ficha médica de cada participante (asíncrono, no bloquea)
        for (const j of jovenes) {
            window.Autorizaciones?.cargar(j);
            window.FichaMedica?.cargar(j);
        }
    };

    function cambiarTab(tab) {
        const card = tab.closest('.jcard');
        const targetId = tab.dataset.tab;
        card.querySelectorAll('.tab-int').forEach(t => t.classList.remove('act'));
        tab.classList.add('act');
        card.querySelectorAll('.tab-content').forEach(c => c.classList.remove('act'));
        card.querySelector('#' + targetId).classList.add('act');
    }

    async function renderJoven(j) {
        const color = COLORES[j.unidad] || '#3498db';
        const inic = [(j.nombres||'')[0], (j.apellidos||'')[0]].join('').toUpperCase();
        const edad = j.fecha_nacimiento ? Math.floor((Date.now() - new Date(j.fecha_nacimiento)) / (365.25*24*3600*1000)) : null;
        const runL = (j.run||'').replace(/\./g,'').replace(/-/g,'').toUpperCase();
        const cardId = `card-${j.id}`;

        // ── ASISTENCIA: buscar en tabla "jovenes" del evento por email del apoderado ──
        let asistenciaHTML = '';
        let totalEventos = 0, asistidos = 0;
        if (j.apoderado_titular_email) {
            const { data: inscs } = await db
                .from('jovenes')
                .select('nombre_patrulla, grupo_scout, checkin_at, evento_id, confirmado, cuota')
                .ilike('email', j.apoderado_titular_email)
                .order('id', { ascending: false })
                .limit(8);

            if (inscs?.length) {
                totalEventos = inscs.length;
                asistidos = inscs.filter(i => i.confirmado).length;
                const evIds = [...new Set(inscs.map(i => i.evento_id).filter(Boolean))];
                let eMap = {};
                if (evIds.length) {
                    const { data: evs } = await db.from('eventos').select('id,nombre,fecha_inicio,lugar').in('id', evIds);
                    (evs||[]).forEach(e => eMap[e.id] = { id: e.id, nombre: e.nombre, fecha_inicio: e.fecha_inicio, lugar: e.lugar });
                }
                asistenciaHTML = inscs.map(ins => {
                    const ev = eMap[ins.evento_id];
                    const f = ev?.fecha_inicio
                        ? new Date(ev.fecha_inicio + 'T12:00:00').toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' })
                        : 'Sin fecha';
                    const cls = ins.confirmado ? 'ev-pres' : 'ev-pend';
                    const icon = ins.confirmado ? 'fa-check' : 'fa-clock';
                    const lugarStr = ev?.lugar ? ` · ${ev.lugar}` : '';
                    const horaLlegada = ins.checkin_at
                        ? `<span style="font-size:0.68rem;color:#16a34a"><i class="fas fa-door-open"></i> llegó ${new Date(ins.checkin_at).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'})} hrs</span>`
                        : '';
                    return `<div class="ev-row">
                        <div><div class="ev-nom">${ev?.nombre || 'Evento'}</div><div class="ev-fch">${f}${lugarStr} ${horaLlegada}</div></div>
                        <div class="ev-est ${cls}" title="${ins.confirmado ? 'Asistió' : 'Sin registro de asistencia'}"><i class="fas ${icon}"></i></div>
                    </div>`;
                }).join('');
            } else {
                asistenciaHTML = '<div class="esm"><i class="fas fa-calendar-times"></i>Sin eventos registrados.</div>';
            }
        } else {
            asistenciaHTML = '<div class="esm"><i class="fas fa-envelope-open"></i>Sin email del apoderado para vincular eventos.</div>';
        }

        // ── PAGOS: vía RPC portal_pagos (la tabla tiene RLS; la función expone solo lo del RUT) ──
        let pagosHTML = '';
        let totalPagado = 0, totalAnio = 0;
        const anioActual = new Date().getFullYear();
        const { data: movs } = await db.rpc('portal_pagos', { p_run: j.run || '' });

        if (movs?.length) {
            totalPagado = movs.reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);
            totalAnio = movs.filter(m => m.fecha && m.fecha.startsWith(String(anioActual)))
                            .reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);
            pagosHTML = movs.slice(0, 12).map(m => {
                const f = m.fecha ? new Date(m.fecha + 'T12:00:00').toLocaleDateString('es-CL') : '—';
                const monto = parseInt(m.monto || 0).toLocaleString('es-CL');
                return `<div class="pago-row">
                    <div class="pago-info"><div class="pago-desc">${m.concepto || 'Pago'}${m.referencia ? ` <small style="opacity:0.6">· ref ${m.referencia}</small>` : ''}</div><div class="pago-fch">${f}</div></div>
                    <div class="pago-monto">$${monto}</div>
                </div>`;
            }).join('');
        } else {
            pagosHTML = '<div class="esm"><i class="fas fa-receipt"></i>Sin pagos registrados a nombre de este participante.</div>';
        }

        // ── PROGRESIÓN: línea de etapas de su rama + camino simbólico (estructura real) ──
        let progresionHTML = '';
        let especialidadesHTML = '';
        const { data: prog } = await db
            .from('progresion_jovenes')
            .select('*')
            .eq('joven_id', j.id)
            .maybeSingle();

        const rama = ramaDe(j.unidad);
        const etapasRama = rama ? ETAPAS_RAMA[rama] : null;
        const etapaActual = prog?.etapa_actual || null;
        const idxActual = (etapasRama && etapaActual) ? etapasRama.indexOf(etapaActual) : -1;

        if (etapasRama) {
            // Línea de tiempo de etapas con insignias oficiales
            const pasos = etapasRama.map((et, i) => {
                const estado = idxActual < 0 ? 'fut' : (i < idxActual ? 'ok' : (i === idxActual ? 'act' : 'fut'));
                const estilos = {
                    ok:  'opacity:0.85;filter:none;border-color:#16a34a;background:#f0fdf4',
                    act: `border-color:${color};background:white;box-shadow:0 4px 14px rgba(0,0,0,0.13);transform:scale(1.06)`,
                    fut: 'opacity:0.38;filter:grayscale(1);border-color:#e2e8f0;background:#f8fafc'
                }[estado];
                const marca = estado === 'ok' ? '<i class="fas fa-check-circle" style="color:#16a34a"></i>'
                            : estado === 'act' ? `<strong style="color:${color}">Etapa actual</strong>` : '';
                return `<div style="flex:1;min-width:74px;text-align:center;border:2px solid;border-radius:12px;padding:10px 4px;${estilos};transition:all .2s">
                    <img src="${INSIGNIAS_ETAPA[et] || ''}" alt="${et}" style="width:46px;height:46px;object-fit:contain" onerror="this.style.display='none'">
                    <div style="font-size:0.72rem;font-weight:700;margin-top:4px;color:#334155">${et}</div>
                    <div style="font-size:0.62rem;margin-top:2px;min-height:12px">${marca}</div>
                </div>`;
            }).join('<div style="align-self:center;color:#cbd5e1"><i class="fas fa-chevron-right"></i></div>');

            progresionHTML = `<div class="sec">
                <div class="sec-titulo"><i class="fas fa-route"></i> Camino de progresión — ${rama}</div>
                <div style="display:flex;gap:6px;align-items:stretch;flex-wrap:wrap">${pasos}</div>
                ${idxActual < 0 ? '<p style="font-size:0.72rem;color:#94a3b8;margin-top:8px"><i class="fas fa-info-circle"></i> El consejo de unidad aún no registra la etapa. Las etapas mostradas son el recorrido completo de la rama.</p>' : ''}
            </div>`;
        }

        // Camino simbólico: promesa, proyecto personal, proyectos colectivos
        const camino = prog?.camino || {};
        const chips = [];
        if (camino.prom !== undefined) chips.push(`<div class="ib ${camino.prom ? 'ok' : ''}"><div class="l">Promesa</div><div class="v">${camino.prom ? '✓ Realizada' : 'En preparación'}</div></div>`);
        if (typeof camino.colectivos === 'number') chips.push(`<div class="ib"><div class="l">Proyectos colectivos</div><div class="v">${camino.colectivos}</div></div>`);
        if (camino.proyectoPersonal && String(camino.proyectoPersonal).trim()) chips.push(`<div class="ib full"><div class="l">Proyecto personal</div><div class="v">${String(camino.proyectoPersonal)}</div></div>`);
        if (chips.length) {
            progresionHTML += `<div class="sec"><div class="sec-titulo"><i class="fas fa-compass"></i> Camino simbólico</div><div class="info-grid">${chips.join('')}</div></div>`;
        }

        // Áreas de desarrollo: solo si el consejo de unidad ha registrado avances (> 0)
        const terr = prog?.territorios || {};
        const areasConAvance = AREAS.filter(a => (parseFloat(terr[a.k]) || 0) > 0);
        if (areasConAvance.length) {
            const barras = areasConAvance.map(a => {
                const pct = Math.min(100, Math.round(parseFloat(terr[a.k]) || 0));
                return `<div class="prog-bar-area">
                    <div class="prog-bar-lbl"><span><i class="fas ${a.ic}" style="color:${a.c};margin-right:5px"></i>${a.n}</span><strong style="color:${a.c}">${pct}%</strong></div>
                    <div class="prog-bar-track"><div class="prog-bar-fill" style="width:${pct}%;background:${a.c}"></div></div>
                </div>`;
            }).join('');
            progresionHTML += `<div class="sec"><div class="sec-titulo"><i class="fas fa-chart-line"></i> Avance por área de desarrollo</div>${barras}</div>`;
        }

        // Especialidades
        const esps = prog?.especialidades || [];
        if (Array.isArray(esps) && esps.length) {
            especialidadesHTML = `<div class="sec"><div class="sec-titulo"><i class="fas fa-star"></i> Especialidades obtenidas (${esps.length})</div>
                <div>${esps.map(e => {
                    const nombre = typeof e === 'string' ? e : (e.nombre || 'Especialidad');
                    const fecha = (typeof e === 'object' && e.fecha) ? ` <small style="opacity:0.7">(${new Date(e.fecha).toLocaleDateString('es-CL')})</small>` : '';
                    return `<span class="esp-tag"><i class="fas fa-medal"></i>${nombre}${fecha}</span>`;
                }).join('')}</div></div>`;
        }

        if (!progresionHTML) progresionHTML = '<div class="esm"><i class="fas fa-chart-line"></i>Sin registros de progresión aún. El consejo de unidad los irá completando durante el año.</div>';

        return `<div class="jcard" id="${cardId}">
            <!-- HEADER -->
            <div class="jh-card">
                <div class="av" style="background:${color}">
                    ${j.foto_url ? `<img src="${j.foto_url}" alt="">` : inic}
                </div>
                <div class="jinfo" style="flex:1">
                    <h2>${j.nombres} ${j.apellidos}</h2>
                    <p>${j.run || '—'}${edad ? ` · ${edad} años` : ''}</p>
                    <div class="badges">
                        <span class="b">${j.unidad || '—'}</span>
                        ${j.registro_pagado ? '<span class="b b-ok"><i class="fas fa-shield-alt"></i> Seguro vigente</span>' : '<span class="b b-warn"><i class="fas fa-exclamation-triangle"></i> Sin seguro</span>'}
                        ${j.tipo_miembro ? `<span class="b">${j.tipo_miembro}</span>` : ''}
                    </div>
                </div>
            </div>

            <!-- RESUMEN EJECUTIVO -->
            <div style="padding:16px 22px 0">
                <div class="resumen-grid">
                    <div class="res-stat"><div class="num">${totalEventos}</div><div class="lbl">Eventos</div></div>
                    <div class="res-stat"><div class="num">${asistidos}</div><div class="lbl">Asistidos</div></div>
                    <div class="res-stat"><div class="num">${(prog?.especialidades||[]).length}</div><div class="lbl">Especialidades</div></div>
                    <div class="res-stat"><div class="num">$${(totalPagado/1000).toFixed(0)}K</div><div class="lbl">Pagado</div></div>
                </div>
            </div>

            <!-- TABS -->
            <div class="tabs-int">
                <button class="tab-int act" data-tab="tab-general-${j.id}"><i class="fas fa-id-card"></i>General</button>
                <button class="tab-int" data-tab="tab-prog-${j.id}"><i class="fas fa-chart-line"></i>Progresión</button>
                <button class="tab-int" data-tab="tab-eventos-${j.id}"><i class="fas fa-calendar-check"></i>Eventos</button>
                <button class="tab-int" data-tab="tab-pagos-${j.id}"><i class="fas fa-receipt"></i>Pagos</button>
                <button class="tab-int" data-tab="tab-aut-${j.id}"><i class="fas fa-file-signature"></i>Autorizaciones</button>
                <button class="tab-int" data-tab="tab-fm-${j.id}"><i class="fas fa-notes-medical"></i>Ficha Médica</button>
            </div>

            <!-- TAB: GENERAL -->
            <div class="tab-content act" id="tab-general-${j.id}">
                <div class="sec">
                    <div class="sec-titulo"><i class="fas fa-id-card"></i> Datos personales</div>
                    <div class="info-grid">
                        <div class="ib"><div class="l">Nombre social</div><div class="v">${j.nombre_social || '—'}</div></div>
                        <div class="ib"><div class="l">Fecha nacimiento</div><div class="v">${j.fecha_nacimiento ? new Date(j.fecha_nacimiento+'T12:00:00').toLocaleDateString('es-CL') : '—'}</div></div>
                        <div class="ib"><div class="l">Nacionalidad</div><div class="v">${j.nacionalidad || '—'}</div></div>
                        <div class="ib"><div class="l">Religión</div><div class="v">${j.religion || '—'}</div></div>
                        <div class="ib full"><div class="l">Domicilio</div><div class="v">${j.domicilio || '—'}</div></div>
                    </div>
                </div>

                <div class="sec">
                    <div class="sec-titulo"><i class="fas fa-graduation-cap"></i> Información educacional</div>
                    <div class="info-grid">
                        <div class="ib"><div class="l">Institución</div><div class="v">${j.institucion_educacional || '—'}</div></div>
                        <div class="ib"><div class="l">Nivel</div><div class="v">${j.nivel || '—'}</div></div>
                    </div>
                </div>

                <div class="sec">
                    <div class="sec-titulo"><i class="fas fa-campground"></i> Datos del grupo</div>
                    <div class="info-grid">
                        <div class="ib"><div class="l">Unidad</div><div class="v">${j.unidad || '—'}</div></div>
                        <div class="ib"><div class="l">Tipo de miembro</div><div class="v">${j.tipo_miembro || '—'}</div></div>
                        <div class="ib"><div class="l">Fecha ingreso</div><div class="v">${j.fecha_ingreso_grupo ? new Date(j.fecha_ingreso_grupo+'T12:00:00').toLocaleDateString('es-CL') : '—'}</div></div>
                        <div class="ib"><div class="l">Adelanto</div><div class="v">${j.adelanto || '—'}</div></div>
                        <div class="ib ${j.registro_pagado?'ok':'danger'}"><div class="l">Registro anual</div><div class="v">${j.registro_pagado?'✓ Pagado':'✗ Pendiente'}</div></div>
                        <div class="ib ${j.progresion_documento?'ok':''}"><div class="l">Doc. progresión</div><div class="v">${j.progresion_documento?'✓ Firmado':'Pendiente'}</div></div>
                    </div>
                </div>

                <div class="sec">
                    <div class="sec-titulo"><i class="fas fa-heartbeat"></i> Salud y previsión</div>
                    <div class="info-grid">
                        <div class="ib"><div class="l">Previsión</div><div class="v">${j.prevision_salud || '—'}</div></div>
                        <div class="ib"><div class="l">Grupo sanguíneo</div><div class="v">${j.grupo_sanguineo || '—'}</div></div>
                        <div class="ib ${j.tiene_seguro_complementario ? 'ok' : ''}"><div class="l">Seguro complementario</div><div class="v">${j.tiene_seguro_complementario ? '✓ ' + (j.aseguradora || 'Sí') : 'No informado'}</div></div>
                        <div class="ib"><div class="l">Vacunas</div><div class="v">${j.vacunas || '—'}</div></div>
                    </div>
                    <p style="font-size:0.7rem;color:#94a3b8;margin-top:6px"><i class="fas fa-notes-medical"></i> Los antecedentes médicos completos se gestionan en la pestaña <strong>Ficha Médica</strong>.</p>
                </div>

                <div class="sec">
                    <div class="sec-titulo"><i class="fas fa-user-shield"></i> Apoderados registrados</div>
                    <div class="info-grid">
                        ${[['Titular', j.apoderado_titular_nombre, j.apoderado_titular_parentesco, j.apoderado_titular_telefono, j.apoderado_titular_email],
                           ['Suplente 1', j.apoderado_suplente1_nombre, j.apoderado_suplente1_parentesco, j.apoderado_suplente1_telefono, j.apoderado_suplente1_email],
                           ['Suplente 2', j.apoderado_suplente2_nombre, j.apoderado_suplente2_parentesco, j.apoderado_suplente2_telefono, j.apoderado_suplente2_email]]
                          .filter(a => a[1])
                          .map(a => `<div class="ib full"><div class="l">${a[0]}${a[2] ? ' · ' + a[2] : ''}</div>
                              <div class="v">${a[1]}</div>
                              <div style="font-size:0.74rem;color:#64748b;margin-top:2px">
                                ${a[3] ? `<i class="fas fa-phone" style="width:14px"></i> ${a[3]}` : ''} ${a[4] ? ` &nbsp;<i class="fas fa-envelope" style="width:14px"></i> ${a[4]}` : ''}
                              </div></div>`).join('') || '<div class="esm">Sin apoderados registrados.</div>'}
                    </div>
                    <p style="font-size:0.7rem;color:#94a3b8;margin-top:6px"><i class="fas fa-info-circle"></i> Si algún dato de contacto está incorrecto, avisa a la directiva del grupo para actualizarlo.</p>
                </div>

                <div class="sec">
                    <div class="sec-titulo"><i class="fas fa-tshirt"></i> Talla uniforme</div>
                    <div class="info-grid">
                        <div class="ib"><div class="l">Talla</div><div class="v">${j.talla || '—'}</div></div>
                        <div class="ib"><div class="l">Hombros</div><div class="v">${j.medida_hombros ? j.medida_hombros+' cm' : '—'}</div></div>
                        <div class="ib"><div class="l">Largo</div><div class="v">${j.medida_largo ? j.medida_largo+' cm' : '—'}</div></div>
                    </div>
                </div>
            </div>

            <!-- TAB: PROGRESIÓN -->
            <div class="tab-content" id="tab-prog-${j.id}">
                ${progresionHTML}
                ${especialidadesHTML}
            </div>

            <!-- TAB: EVENTOS -->
            <div class="tab-content" id="tab-eventos-${j.id}">
                <div class="sec">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
                        <div class="sec-titulo" style="margin:0"><i class="fas fa-calendar-check"></i> Historial de participación</div>
                        ${totalEventos ? `<span style="background:${asistidos/totalEventos >= 0.75 ? '#dcfce7;color:#166534' : '#fffbeb;color:#92400e'};padding:4px 12px;border-radius:20px;font-size:0.74rem;font-weight:700"><i class="fas fa-percentage"></i> Asistencia ${Math.round(asistidos/totalEventos*100)}% (${asistidos}/${totalEventos})</span>` : ''}
                    </div>
                    ${asistenciaHTML}
                    <button onclick="this.closest('.jcard').querySelector('[data-tab=tab-aut-${j.id}]').click()" style="margin-top:12px;width:100%;background:#eef2ff;color:var(--azul-profundo,#0E2586);border:1px dashed #c7d2fe;border-radius:10px;padding:10px;font-size:0.8rem;font-weight:600;cursor:pointer">
                        <i class="fas fa-calendar-plus"></i> Ver próximas actividades y firmar autorizaciones
                    </button>
                </div>
            </div>

            <!-- TAB: PAGOS -->
            <div class="tab-content" id="tab-pagos-${j.id}">
                <div class="sec">
                    <div class="sec-titulo"><i class="fas fa-receipt"></i> Movimientos en tesorería</div>
                    <div class="resumen-grid" style="margin-bottom:12px">
                        <div class="res-stat"><div class="num">$${(totalAnio/1000).toFixed(0)}K</div><div class="lbl">Pagado ${new Date().getFullYear()}</div></div>
                        <div class="res-stat"><div class="num">$${(totalPagado/1000).toFixed(0)}K</div><div class="lbl">Total histórico</div></div>
                        <div class="res-stat"><div class="num">${(movs||[]).length}</div><div class="lbl">Movimientos</div></div>
                        <div class="res-stat"><div class="num">${j.registro_pagado ? '✓' : '✗'}</div><div class="lbl">Registro anual</div></div>
                    </div>
                    ${j.monto_pagado ? `<div class="ib ok full" style="margin-bottom:10px"><div class="l">Monto registrado al inscribirse</div><div class="v">$${parseInt(j.monto_pagado).toLocaleString('es-CL')}</div></div>` : ''}
                    ${pagosHTML}
                    ${totalPagado > 0 ? `<div class="ib ok full" style="margin-top:10px;text-align:right"><div class="l">Total pagado en movimientos</div><div class="v" style="font-size:1.1rem">$${totalPagado.toLocaleString('es-CL')}</div></div>` : ''}
                </div>
            </div>

            <!-- TAB: AUTORIZACIONES -->
            <div class="tab-content" id="tab-aut-${j.id}">
                <div class="sec">
                    <div class="sec-titulo"><i class="fas fa-file-signature"></i> Autorizaciones de participación</div>
                    <div id="aut-cont-${j.id}"><div class="esm"><i class="fas fa-circle-notch fa-spin"></i>Cargando actividades...</div></div>
                </div>
            </div>

            <!-- TAB: FICHA MÉDICA -->
            <div class="tab-content" id="tab-fm-${j.id}">
                <div class="sec">
                    <div class="sec-titulo"><i class="fas fa-notes-medical"></i> Ficha Médica y Necesidades Emocionales</div>
                    <div id="fm-cont-${j.id}"><div class="esm"><i class="fas fa-circle-notch fa-spin"></i>Cargando...</div></div>
                </div>
            </div>

            <!-- TAB: FAMILIA -->
            <div class="tab-content" id="tab-flia-${j.id}" style="display:none"></div>

            <p style="font-size:0.71rem;color:var(--texto-claro);text-align:center;padding:12px;background:#f8fafc;border-top:1px solid var(--gris-claro)"><i class="fas fa-clock"></i> Datos al ${new Date().toLocaleDateString('es-CL')} · Solo lectura</p>
        </div>`;
    }
