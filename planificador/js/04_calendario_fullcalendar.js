    let _fcInstance = null;
    let _fcLibCargada = false;

    // El calendario es la vista principal; setVista queda como stub
    window.setVista = function() { iniciarCalendario(); };

    // ── Helpers del panel lateral ──
    window._plResize = function(delta) {
        const el = document.documentElement;
        const cur = parseInt(getComputedStyle(el).getPropertyValue('--panel-w').trim() || '360') || 360;
        const next = Math.max(240, Math.min(680, cur + delta));
        el.style.setProperty('--panel-w', next + 'px');
        try { localStorage.setItem('erp_panel_w', next + 'px'); } catch(e) {}
    };

    function _plMostrar(titulo, sub, html) {
        document.getElementById('pl-title-txt').innerHTML = titulo;
        document.getElementById('pl-sub-txt').textContent = sub || '';
        document.getElementById('pl-body').innerHTML = html;
        const p = document.getElementById('panelLateral');
        p.classList.add('activo');
        const bcm = document.getElementById('pl-cerrar-movil');
        if (bcm) bcm.style.display = window.innerWidth <= 768 ? 'block' : 'none';
    }

    window._plAbrirFormNueva = function(fecha) {
        const hoy = fecha || new Date().toISOString().slice(0,10);
        const fechaFmt = fecha ? new Date(fecha+'T12:00').toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : 'nueva reunión';
        _plMostrar('<i class="fas fa-plus-circle" style="color:#10b981;margin-right:5px"></i>Nueva Reunión', fechaFmt, `
            <div class="fg"><label>Título</label><input type="text" id="nl-titulo" placeholder="Ej: Reunión Tropa" style="width:100%"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">
                <div class="fg"><label>Unidad</label>
                    <select id="nl-unidad" style="width:100%">
                        <option value="Grupo">Grupo</option><option value="Bandada">Bandada</option>
                        <option value="Manada">Manada</option><option value="Tropa">Tropa</option>
                        <option value="Compañía">Compañía</option><option value="Avanzada">Avanzada</option>
                        <option value="Clan">Clan</option>
                    </select>
                </div>
                <div class="fg"><label>Fecha</label><input type="date" id="nl-fecha" value="${hoy}" style="width:100%"></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">
                <div class="fg"><label>Hora inicio</label><input type="time" id="nl-hinicio" value="09:00" style="width:100%"></div>
                <div class="fg"><label>Hora fin</label><input type="time" id="nl-hfin" value="11:00" style="width:100%"></div>
            </div>
            <div class="fg"><label>Lugar</label><input type="text" id="nl-lugar" placeholder="Local del grupo..." style="width:100%"></div>
            <div class="fg"><label>Objetivo</label><textarea id="nl-objetivo" rows="2" placeholder="Objetivo de la reunión..." style="width:100%;resize:vertical"></textarea></div>
            <button onclick="window._plGuardarNueva()" class="btn btn-p" style="width:100%;margin-top:4px"><i class="fas fa-save"></i> Crear Reunión</button>
            <div id="nl-msg" style="margin-top:8px;font-size:0.81rem;text-align:center"></div>`);
    };

    window._plGuardarNueva = async function() {
        const titulo = document.getElementById('nl-titulo').value.trim();
        const msg = document.getElementById('nl-msg');
        if (!titulo) { msg.innerHTML='<span style="color:#dc2626">El título es obligatorio</span>'; return; }
        msg.innerHTML='<span style="color:#64748b"><i class="fas fa-spinner fa-spin"></i> Guardando...</span>';
        try {
            document.getElementById('nTitulo').value = document.getElementById('nl-titulo').value;
            document.getElementById('nUnidad').value = document.getElementById('nl-unidad').value;
            document.getElementById('nFecha').value = document.getElementById('nl-fecha').value;
            document.getElementById('nHoraI').value = document.getElementById('nl-hinicio').value;
            document.getElementById('nHoraF').value = document.getElementById('nl-hfin').value;
            document.getElementById('nLugar').value = document.getElementById('nl-lugar').value;
            document.getElementById('nObjetivo').value = document.getElementById('nl-objetivo').value;
            await window.crearReunion();
            msg.innerHTML='<span style="color:#16a34a"><i class="fas fa-check-circle"></i> Reunión creada</span>';
            if (_fcInstance) setTimeout(()=>_fcInstance.refetchEvents(),700);
        } catch(e) { msg.innerHTML=`<span style="color:#dc2626">Error: ${e.message}</span>`; }
    };

    // Restaurar ancho guardado
    try {
        const sw = localStorage.getItem('erp_panel_w');
        if (sw) document.documentElement.style.setProperty('--panel-w', sw);
    } catch(e) {}

    async function _cargarLibFC() {
        if (_fcLibCargada) return;
        await new Promise((ok, fail) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.css';
            document.head.appendChild(link);
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js';
            s.onload = ok; s.onerror = fail;
            document.head.appendChild(s);
        });
        _fcLibCargada = true;
    }

    async function _cargarEventosCalendario() {
        const ahora = new Date();
        const desde = new Date(ahora.getFullYear(), ahora.getMonth() - 2, 1).toISOString();
        const hasta = new Date(ahora.getFullYear(), ahora.getMonth() + 8, 30).toISOString();
        const events = [];
        const colores = { planificada: '#0E2586', realizada: '#475569', cancelada: '#94a3b8' };

        // 1. Reuniones Supabase
        const { data: reu } = await db.from('reuniones')
            .select('id,titulo,fecha,hora_inicio,hora_fin,lugar,objetivo,estado,unidad,actividades,google_event_id')
            .gte('fecha', desde.slice(0,10)).lte('fecha', hasta.slice(0,10));
        (reu || []).forEach(r => {
            const col = colores[r.estado] || '#0E2586';
            events.push({
                id: 'reu_' + r.id,
                title: (r.unidad && r.unidad !== 'Grupo' ? `[${r.unidad}] ` : '') + r.titulo,
                start: r.hora_inicio ? `${r.fecha}T${r.hora_inicio}` : r.fecha,
                end:   r.hora_fin   ? `${r.fecha}T${r.hora_fin}`   : undefined,
                backgroundColor: col, borderColor: col,
                extendedProps: { tipo: 'reunion', raw: r }
            });
        });

        // 2. Google Calendar (excluir ya sincronizadas)
        try {
            const res = await fetch(GCAL_FN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': SKEY },
                body: JSON.stringify({ accion: 'listar_eventos', calendar_id: GCAL_ID, fecha_desde: desde, fecha_hasta: hasta, max: 200 })
            });
            const gc = await res.json();
            const syncedIds = new Set((reu||[]).map(r => r.google_event_id).filter(Boolean));
            (gc.resultado || []).forEach(e => {
                if (syncedIds.has(e.id)) return;
                events.push({
                    id: 'gc_' + e.id,
                    title: '📅 ' + e.titulo,
                    start: e.inicio, end: e.fin || e.inicio,
                    backgroundColor: '#d97706', borderColor: '#d97706',
                    extendedProps: { tipo: 'google', lugar: e.lugar, descripcion: e.descripcion, link: e.link, gcId: e.id }
                });
            });
        } catch(e) { console.warn('[GCal]', e.message); }

        // 3. Eventos/Campamentos
        const { data: evts } = await db.from('eventos')
            .select('id,nombre,fecha_inicio,fecha_fin,lugar')
            .gte('fecha_inicio', desde.slice(0,10)).lte('fecha_inicio', hasta.slice(0,10));
        (evts || []).forEach(ev => {
            events.push({
                id: 'evt_' + ev.id,
                title: '🏕 ' + ev.nombre,
                start: ev.fecha_inicio, end: ev.fecha_fin || ev.fecha_inicio,
                backgroundColor: '#16a34a', borderColor: '#16a34a',
                extendedProps: { tipo: 'evento', lugar: ev.lugar }
            });
        });

        return events;
    }

    async function iniciarCalendario() {
        const el = document.getElementById('fcEl');
        await _cargarLibFC();
        if (_fcInstance) { _fcInstance.refetchEvents(); return; }

        _fcInstance = new FullCalendar.Calendar(el, {
            locale: 'es',
            initialView: 'dayGridMonth',
            height: '100%',
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listMonth' },
            buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana', list: 'Lista' },
            events: async (info, succeed, fail) => {
                try { succeed(await _cargarEventosCalendario()); } catch(e) { fail(e); }
            },
            eventClick: function(info) {
                const p = info.event.extendedProps;
                if (p.tipo === 'reunion') {
                    seleccionarReunion(p.raw);
                    setTimeout(() => window._plMostrarDetalle(), 200);
                } else if (p.tipo === 'google') {
                    const det = [`📅 ${info.event.title}`, p.lugar ? '📍 ' + p.lugar : '', p.descripcion || ''].filter(Boolean).join('\n');
                    if (p.link && confirm(det + '\n\n¿Abrir en Google Calendar?')) window.open(p.link, '_blank');
                    else if (!p.link) alert(det);
                } else if (p.tipo === 'evento') {
                    alert(`🏕 ${info.event.title}${p.lugar ? '\n📍 ' + p.lugar : ''}`);
                }
            },
            dateClick: function(info) {
                const fecha = info.dateStr;
                const fechaFmt = new Date(fecha+'T12:00').toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
                const reu = (_fcInstance ? _fcInstance.getEvents() : [])
                    .filter(e => e.extendedProps?.tipo==='reunion' && e.startStr?.startsWith(fecha));
                const listHtml = reu.length
                    ? reu.map(r=>`<div onclick="seleccionarReunion(${JSON.stringify(r.extendedProps.raw).replace(/"/g,'&quot;')});_plMostrarDetalle()" style="background:#f8fafc;border-left:4px solid ${r.backgroundColor||'#0E2586'};border-radius:0 10px 10px 0;padding:11px 13px;margin-bottom:8px;cursor:pointer;transition:.15s" onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='#f8fafc'">
                        <div style="font-weight:700;font-size:0.88rem;color:#0E2586">${r.title}</div>
                        <div style="font-size:0.74rem;color:#64748b;margin-top:2px">${r.extendedProps?.raw?.hora_inicio||''} ${r.extendedProps?.raw?.lugar?'· '+r.extendedProps.raw.lugar:''}</div>
                    </div>`).join('') + `<button onclick="window._plAbrirFormNueva('${fecha}')" class="btn btn-p" style="width:100%;margin-top:4px;background:transparent;color:#0E2586;border:2px solid #0E2586"><i class="fas fa-plus"></i> Agregar reunión</button>`
                    : `<div style="text-align:center;padding:20px;color:#94a3b8;font-size:0.84rem"><i class="fas fa-calendar-times" style="font-size:1.5rem;display:block;margin-bottom:8px"></i>Sin reuniones este día</div>
                       <button onclick="window._plAbrirFormNueva('${fecha}')" class="btn btn-p" style="width:100%"><i class="fas fa-plus"></i> Crear reunión para este día</button>`;
                _plMostrar('<i class="fas fa-calendar-day" style="color:#0E2586;margin-right:5px"></i>'+fechaFmt, reu.length+' reunión(es)', listHtml);
            },
            eventDidMount: function(info) {
                info.el.title = info.event.title.replace(/^[📅🏕📋]\s/,'');
            }
        });
        _fcInstance.render();
    }

    window.recargarCalendario = function() { if (_fcInstance) _fcInstance.refetchEvents(); };

    // Refrescar calendario si está activo después de sincronizar
    const _origSync = window.sincronizarGoogleCalendar;
    if (typeof _origSync === 'function') {
        window.sincronizarGoogleCalendar = async function() {
            await _origSync();
            if (_fcInstance) setTimeout(() => _fcInstance.refetchEvents(), 2500);
        };
    }

    // Refrescar calendario después de crear/guardar una reunión
    const _origCrear = window.crearReunion;
    if (typeof _origCrear === 'function') {
        window.crearReunion = async function() {
            await _origCrear();
            if (_fcInstance) setTimeout(() => _fcInstance.refetchEvents(), 500);
        };
    }

    // Iniciar siempre en modo calendario (es la vista principal)
    setTimeout(() => iniciarCalendario(), 300);

    // ════ GENERAR ACTA ════
