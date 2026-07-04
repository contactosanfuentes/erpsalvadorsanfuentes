    let todosInvitables = [];
    let invitadosCustom = []; // emails agregados manualmente

    async function cargarInvitables(){
        if(!reunionActiva){ return; }
        const cont = document.getElementById('listaInvitables');

        // Recuperar invitados ya guardados (columna opcional 'invitados' — si no existe, ignoramos)
        const invitadosYaSeleccionados = new Set(reunionActiva.invitados_emails || []);
        invitadosCustom = [...(reunionActiva.invitados_custom || [])];
        renderInvitadosCustom();

        cont.innerHTML = '<div style="padding:22px;text-align:center;color:var(--texto-claro);font-size:0.85rem"><i class="fas fa-circle-notch fa-spin"></i> Cargando miembros...</div>';

        try {
            // Adultos registrados (dirigentes, staff)
            const adRes = await db.from('adultos_registros').select('id,nombres,apellidos,email,roles,unidad_rol').not('email','is',null).order('apellidos');
            const adultos = (adRes.data || []).map(a => ({
                tipo: 'adultos',
                id: 'ad_' + a.id,
                email: a.email,
                nombre: `${a.nombres || ''} ${a.apellidos || ''}`.trim(),
                extra: [a.roles, a.unidad_rol].filter(Boolean).join(' · ')
            }));

            // Apoderados de jóvenes (titular)
            const jvRes = await db.from('mmbb_registrations').select('id,nombres,apellidos,unidad,apoderado_titular_nombre,apoderado_titular_email').not('apoderado_titular_email','is',null).order('apellidos');
            const apoderados = (jvRes.data || []).map(j => ({
                tipo: 'apoderados',
                id: 'jv_' + j.id,
                email: j.apoderado_titular_email,
                nombre: j.apoderado_titular_nombre || `Apoderado de ${j.nombres} ${j.apellidos}`,
                extra: `Apoderado de ${j.nombres} ${j.apellidos} · ${j.unidad || '—'}`
            }));

            todosInvitables = [...adultos, ...apoderados];

            // Marcar los que ya estaban seleccionados
            todosInvitables.forEach(p => { p.seleccionado = invitadosYaSeleccionados.has(p.email); });

            renderListaInvitables();
        } catch(err){
            cont.innerHTML = `<div style="padding:22px;text-align:center;color:#dc2626;font-size:0.82rem"><i class="fas fa-exclamation-triangle"></i> Error al cargar: ${err.message}</div>`;
        }
    }

    function renderListaInvitables(){
        const cont = document.getElementById('listaInvitables');
        const q = (document.getElementById('filtroInvitados')?.value || '').toLowerCase();
        const tipo = document.getElementById('filtroTipoInvitado')?.value || '';
        const filtrados = todosInvitables.filter(p => {
            const matchQ = !q || p.nombre.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
            const matchT = !tipo || p.tipo === tipo;
            return matchQ && matchT;
        });
        if(!filtrados.length){
            cont.innerHTML = '<div style="padding:22px;text-align:center;color:var(--texto-claro);font-size:0.85rem"><i class="fas fa-inbox"></i> Sin resultados</div>';
            actualizarResumenInvitados();
            return;
        }
        cont.innerHTML = filtrados.map(p => {
            const bgTipo = p.tipo === 'adultos' ? '#e0e7ff' : '#fef3c7';
            const colorTipo = p.tipo === 'adultos' ? '#3730a3' : '#78350f';
            const labelTipo = p.tipo === 'adultos' ? 'Adulto' : 'Apoderado';
            return `<label class="inv-row" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--gris-claro);cursor:pointer;transition:0.12s" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
                <input type="checkbox" class="chk-inv" data-email="${p.email}" ${p.seleccionado?'checked':''} onchange="togglarInvitado('${p.email}',this.checked)" style="cursor:pointer;accent-color:var(--azul-profundo)">
                <div style="flex:1;min-width:0">
                    <div style="font-size:0.85rem;font-weight:600;color:var(--texto-oscuro);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.nombre}</div>
                    <div style="font-size:0.72rem;color:var(--texto-claro);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.email}${p.extra?' · '+p.extra:''}</div>
                </div>
                <span style="background:${bgTipo};color:${colorTipo};font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:10px;flex-shrink:0">${labelTipo}</span>
            </label>`;
        }).join('');
        actualizarResumenInvitados();
    }

    window.filtrarInvitados = function(){ renderListaInvitables(); };

    window.togglarInvitado = function(email, checked){
        const p = todosInvitables.find(x => x.email === email);
        if(p) p.seleccionado = checked;
        actualizarResumenInvitados();
    };

    window.toggleSelTodos = function(){
        const q = (document.getElementById('filtroInvitados')?.value || '').toLowerCase();
        const tipo = document.getElementById('filtroTipoInvitado')?.value || '';
        const filtrados = todosInvitables.filter(p => {
            const matchQ = !q || p.nombre.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
            const matchT = !tipo || p.tipo === tipo;
            return matchQ && matchT;
        });
        const todosSel = filtrados.every(p => p.seleccionado);
        filtrados.forEach(p => { p.seleccionado = !todosSel; });
        renderListaInvitables();
    };

    function actualizarResumenInvitados(){
        const sel = todosInvitables.filter(p => p.seleccionado).length;
        const tot = sel + invitadosCustom.length;
        document.getElementById('resumenInvitados').innerHTML = `<strong>${tot}</strong> invitado${tot!==1?'s':''} (${sel} del grupo${invitadosCustom.length?' + '+invitadosCustom.length+' extra':''})`;
    }

    window.agregarInvitadoCustom = function(){
        const inp = document.getElementById('invitadoCustom');
        const email = (inp.value || '').trim().toLowerCase();
        if(!email || !email.includes('@')){ alert('Email inválido.'); return; }
        if(invitadosCustom.includes(email)){ alert('Ya agregado.'); return; }
        invitadosCustom.push(email);
        inp.value = '';
        renderInvitadosCustom();
        actualizarResumenInvitados();
    };

    function renderInvitadosCustom(){
        const cont = document.getElementById('invitadosCustomLista');
        if(!invitadosCustom.length){ cont.innerHTML = ''; return; }
        cont.innerHTML = invitadosCustom.map(em =>
            `<span style="background:#f1f5f9;border:1px solid var(--gris-claro);padding:3px 10px;border-radius:14px;font-size:0.76rem;display:inline-flex;align-items:center;gap:5px">${em}<i class="fas fa-times" style="cursor:pointer;color:#64748b" onclick="quitarInvitadoCustom('${em}')"></i></span>`
        ).join('');
    }

    window.quitarInvitadoCustom = function(email){
        invitadosCustom = invitadosCustom.filter(e => e !== email);
        renderInvitadosCustom();
        actualizarResumenInvitados();
    };

    window.guardarInvitados = async function(){
        if(!reunionActiva) return;
        const emailsGrupo = todosInvitables.filter(p => p.seleccionado).map(p => p.email);

        // Intentamos guardar en columnas dedicadas; si no existen, usamos campo notas como fallback
        try {
            const { error } = await db.from('reuniones').update({
                invitados_emails: emailsGrupo,
                invitados_custom: invitadosCustom
            }).eq('id', reunionActiva.id);
            if(error){
                // Columnas no existen: guardar dentro de "notas" como marcador
                const todoEmails = [...emailsGrupo, ...invitadosCustom];
                const notasActuales = (reunionActiva.notas || '').replace(/\n?▸ INVITADOS:.*$/s, '');
                const nuevasNotas = notasActuales + (todoEmails.length ? `\n▸ INVITADOS: ${todoEmails.join(', ')}` : '');
                await db.from('reuniones').update({ notas: nuevasNotas }).eq('id', reunionActiva.id);
                reunionActiva.notas = nuevasNotas;
            }
            reunionActiva.invitados_emails = emailsGrupo;
            reunionActiva.invitados_custom = invitadosCustom;
            alert('Invitados guardados. Al sincronizar con Google Calendar recibirán la invitación por email.');
        } catch(err){
            alert('Error al guardar: ' + err.message);
        }
    };

    // Devuelve lista combinada de emails para pasar a Google Calendar
    function obtenerTodosLosInvitados(){
        const grupo = reunionActiva?.invitados_emails || [];
        const custom = reunionActiva?.invitados_custom || [];
        // Si se guardaron en notas (fallback), extraer
        if(!grupo.length && !custom.length && reunionActiva?.notas){
            const m = reunionActiva.notas.match(/▸ INVITADOS:\s*(.+?)(?:\n|$)/);
            if(m){
                return m[1].split(',').map(e => e.trim()).filter(Boolean);
            }
        }
        return [...new Set([...grupo, ...custom])];
    }

    // ── GOOGLE CALENDAR / ICS ──
    // Construye fechas en formato YYYYMMDDTHHMMSS (UTC o local) que Google Calendar acepta
