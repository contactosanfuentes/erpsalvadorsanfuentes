    async function cargarEventos() {
        const grid = document.getElementById('eventosGrid');
        try {
            const response = await db
                .from('eventos')
                .select('id, nombre, fecha_inicio, fecha_fin, lugar, publicado, pide_ficha_salud, pide_dieta_especial')
                .eq('publicado', true)
                .order('creado_en', { ascending: false });

            if (response.error) {
                grid.innerHTML = `<div style="text-align:center;padding:18px;color:var(--rojo)"><i class="fas fa-exclamation-triangle" style="font-size:1.5rem;margin-bottom:7px;display:block"></i>Error: ${response.error.message}</div>`;
                return;
            }

            // Extraer solo los datos serializables (evita DataCloneError en iframes)
            const eventos = (response.data || []).map(e => ({
                id: e.id,
                nombre: e.nombre,
                fecha_inicio: e.fecha_inicio,
                fecha_fin: e.fecha_fin,
                lugar: e.lugar,
                pide_ficha_salud: e.pide_ficha_salud,
                pide_dieta_especial: e.pide_dieta_especial
            }));

            if (!eventos.length) {
                grid.innerHTML = '<div style="text-align:center;padding:18px;color:var(--texto-claro)"><i class="fas fa-calendar-times" style="font-size:1.5rem;margin-bottom:7px;display:block"></i>No hay eventos disponibles.</div>';
                return;
            }

            grid.innerHTML = '';
            eventos.forEach(ev => {
                const div = document.createElement('div');
                div.className = 'ev-op';
                const fecha = ev.fecha_inicio
                    ? new Date(ev.fecha_inicio + 'T12:00:00').toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' })
                    : 'Fecha a confirmar';
                const lugarStr = ev.lugar ? ` · ${ev.lugar}` : '';
                div.innerHTML = `
                    <div>
                        <h4>${ev.nombre}</h4>
                        <p><i class="fas fa-calendar" style="color:var(--azul-claro);margin-right:5px"></i>${fecha}${lugarStr}</p>
                    </div>
                    <i class="fas fa-chevron-right" style="color:var(--texto-claro)"></i>`;
                div.onclick = () => seleccionarEvento(ev, div);
                grid.appendChild(div);
            });
        } catch (err) {
            grid.innerHTML = `<div style="text-align:center;padding:18px;color:var(--rojo)"><i class="fas fa-exclamation-triangle" style="font-size:1.5rem;margin-bottom:7px;display:block"></i>Error al cargar eventos: ${err.message}</div>`;
        }
    }

    async function seleccionarEvento(ev, el) {
        document.querySelectorAll('.ev-op').forEach(e => e.classList.remove('sel'));
        el.classList.add('sel');
        eventoSel = ev;

        // Mostrar/ocultar secciones según configuración del evento
        const mostrarSalud = ev.pide_ficha_salud === true;
        const mostrarDieta = ev.pide_dieta_especial === true;
        document.querySelectorAll('.sec-salud').forEach(s => s.style.display = mostrarSalud ? '' : 'none');
        document.getElementById('sec-dieta-jov').style.display = mostrarDieta ? '' : 'none';
        document.getElementById('sec-dieta-adu').style.display = mostrarDieta ? '' : 'none';
        const fecha = ev.fecha_inicio
            ? new Date(ev.fecha_inicio + 'T12:00:00').toLocaleDateString('es-CL', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
            : 'Fecha a confirmar';
        const fechaFinStr = (ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio)
            ? ` — al ${new Date(ev.fecha_fin + 'T12:00:00').toLocaleDateString('es-CL', { day:'numeric', month:'long' })}`
            : '';
        const lugarHTML = ev.lugar ? `<p style="font-size:0.8rem;color:var(--texto-claro);margin-top:3px"><i class="fas fa-map-marker-alt" style="color:var(--azul-claro);margin-right:5px"></i>${ev.lugar}</p>` : '';
        const evHTML = `<h3 style="font-size:1rem;font-weight:700;color:var(--azul-profundo)">${ev.nombre}</h3><p style="font-size:0.82rem;color:var(--texto-claro);margin-top:4px"><i class="fas fa-calendar" style="color:var(--azul-claro);margin-right:5px"></i>${fecha}${fechaFinStr}</p>${lugarHTML}`;
        document.getElementById('evInfoJov').innerHTML = evHTML;
        document.getElementById('evInfoAdu').innerHTML = evHTML;

        // Cargar unidades disponibles desde la tabla "unidades" del sistema
        try {
            const uResp = await db.from('unidades').select('id,nombre').order('id');
            const unidadesData = (uResp.data || []).map(u => ({ id: u.id, nombre: u.nombre }));
            unidades = unidadesData;
            const sel = document.getElementById('j_unidad');
            sel.innerHTML = '<option value="">— Selecciona unidad —</option>';
            unidadesData.forEach(u => {
                const o = document.createElement('option');
                o.value = u.id;
                o.textContent = u.nombre;
                sel.appendChild(o);
            });
            // Si no hay unidades, agregar las estándar
            if (!unidadesData.length) {
                ['Manada','Tropa','Compañía','Avanzada','Clan','Varios'].forEach(n => {
                    const o = document.createElement('option');
                    o.value = `__${n}__`;
                    o.textContent = n;
                    sel.appendChild(o);
                });
            }
        } catch(e) {
            console.warn('Error cargando unidades:', e);
        }

        document.getElementById('tipoCard').style.display = 'block';
        document.getElementById('tipoCard').scrollIntoView({ behavior:'smooth', block:'start' });
    }

    window.seleccionarTipo = function(tipo, el) {
        document.querySelectorAll('.tipo-card').forEach(c => c.classList.remove('sel'));
        el.classList.add('sel');
        tipoSel = tipo;
        document.getElementById('formJoven').style.display = tipo === 'joven' ? 'block' : 'none';
        document.getElementById('formAdulto').style.display = tipo === 'adulto' ? 'block' : 'none';
        const target = tipo === 'joven' ? 'formJoven' : 'formAdulto';
        setTimeout(() => document.getElementById(target).scrollIntoView({ behavior:'smooth', block:'start' }), 100);
    };

    // ── Inscribir JOVEN — escribe en tabla "jovenes" igual que addJovenRow() de eventos_iframe ──
