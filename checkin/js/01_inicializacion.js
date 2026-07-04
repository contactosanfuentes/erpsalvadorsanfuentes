(async () => {
    const evResp = await db.from('eventos').select('id,nombre,fecha_inicio').order('creado_en', { ascending: false });
    const evs = (evResp.data || []).map(e => ({ id: e.id, nombre: e.nombre, fecha_inicio: e.fecha_inicio }));
    const sel = document.getElementById('selEv');
    sel.innerHTML = '<option value="">— Selecciona un evento —</option>';
    evs.forEach(e => {
        const o = document.createElement('option');
        o.value = e.id;
        o.textContent = e.nombre + (e.fecha_inicio ? ' (' + new Date(e.fecha_inicio + 'T12:00:00').toLocaleDateString('es-CL') + ')' : '');
        sel.appendChild(o);
    });

    window.cambiarEv = async function() {
        const id = document.getElementById('selEv').value;
        if (!id) { ev = null; return; }
        const evResp = await db.from('eventos').select('*').eq('id', id).single();
        if (!evResp.data) return;
        // Mapear a objeto plano (evita DataCloneError)
        ev = {
            id: evResp.data.id,
            nombre: evResp.data.nombre,
            fecha_inicio: evResp.data.fecha_inicio,
            fecha_fin: evResp.data.fecha_fin,
            lugar: evResp.data.lugar
        };
        // Si fue auto-seleccionado desde iframe, mostrar indicador visual
        const esEmbebido = !!(new URLSearchParams(window.location.search)).get('evento_id');
        document.getElementById('topbarEv').innerHTML = esEmbebido
            ? `<i class="fas fa-link" style="color:#FFD100;margin-right:5px"></i>${ev.nombre} <span style="font-size:0.72rem;opacity:0.7">(sincronizado)</span>`
            : ev.nombre;
        document.getElementById('tabsBar').style.display = 'block';
        await recargar();
    };

    window.recargar = async function() {
        if (!ev) return;
        // Lee tabla "jovenes" del evento (misma de eventos_iframe)
        const jResp = await db.from('jovenes').select('*').eq('evento_id', ev.id).order('id');
        // Lee tabla "adultos" del evento (misma de eventos_iframe)
        const aResp = await db.from('adultos').select('*').eq('evento_id', ev.id).order('id');
        // Mapear a objetos planos para evitar DataCloneError en iframes
        jovenes = (jResp.data || []).map(r => ({...r}));
        adultos = (aResp.data || []).map(r => ({...r}));
        renderListaActual();
        actualizarStats();
    };

    window.cambiarTab = function(tab, el) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('act'));
        el.classList.add('act');
        ['panelScanner','panelManual','panelLista'].forEach(id =>
            document.getElementById(id).classList.toggle('vis', id === 'panel' + tab.charAt(0).toUpperCase() + tab.slice(1))
        );
        if (tab !== 'scanner' && activo) detener();
    };

    window.cambiarSubTab = function(t, el) {
        document.querySelectorAll('.sub-tab').forEach(s => s.classList.remove('act'));
        el.classList.add('act');
        subTab = t;
        renderListaActual();
    };

    // ── ESCÁNER QR ──
    window.iniciar = async function() {
        if (!ev) { alert('Selecciona un evento primero.'); return; }
        scanner = new Html5Qrcode('reader');
        try {
            await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 200, height: 200 }, aspectRatio: 1.0 },
                async decoded => {
                    beepExito();
                    if (activo) await detener();
                    await procesarCodigo(decoded, 'resS');
                }, () => {});
            activo = true;
            document.getElementById('btnI').style.display = 'none';
            document.getElementById('btnD').style.display = 'inline-flex';
        } catch(e) { alert('No se pudo acceder a la cámara: ' + e.message); }
    };

    window.detener = async function() {
        if (scanner && activo) { await scanner.stop().catch(() => {}); activo = false; }
        document.getElementById('btnI').style.display = 'inline-flex';
        document.getElementById('btnD').style.display = 'none';
    };

    window.buscarM = async function() {
        const c = document.getElementById('cManual').value.trim().toUpperCase();
        if (!c) return;
        await procesarCodigo(c, 'resM');
    };

    // ── BUSCAR Y CONFIRMAR EN AMBAS TABLAS (jovenes + adultos) ──
    async function procesarCodigo(texto, resId) {
        if (!ev) { alert('Selecciona un evento primero.'); return; }

        // El QR puede venir como JSON con {codigo_qr, tipo, evento_id} o como texto plano
        let codigo = texto, tipoHint = null;
        try {
            const o = JSON.parse(texto);
            codigo = o.codigo_qr || texto;
            tipoHint = o.tipo;
        } catch(e) {}

        // Buscar primero en jovenes
        let tabla = 'jovenes';
        let { data, error } = await db.from('jovenes').select('*')
            .eq('codigo_qr', codigo).eq('evento_id', ev.id).maybeSingle();

        // Si no se encontró, buscar en adultos
        if (!data) {
            const r = await db.from('adultos').select('*')
                .eq('codigo_qr', codigo).eq('evento_id', ev.id).maybeSingle();
            if (r.data) { data = r.data; tabla = 'adultos'; }
        }

        const card = document.getElementById(resId);
        card.className = 'res show';

        if (!data) {
            beepError();
            card.classList.add('nok');
            card.innerHTML = `
                <div class="rh">
                    <div class="ri"><i class="fas fa-question"></i></div>
                    <div><div class="rn">Código no encontrado</div><div class="rs">${codigo}</div></div>
                </div>
                <p style="font-size:0.82rem;color:var(--texto-claro)">No hay inscripción con este código en el evento seleccionado.</p>`;
            return;
        }

        const esJoven = tabla === 'jovenes';
        const nombre = esJoven ? data.nombre_patrulla : data.nombre;
        const tipoBadge = esJoven
            ? '<span class="tipo-badge tipo-joven">Joven/Patrulla</span>'
            : '<span class="tipo-badge tipo-adulto">Adulto/Staff</span>';

        if (data.confirmado) {
            // YA CONFIRMADO
            card.classList.add('ya');
            const hora = data.checkin_at ? new Date(data.checkin_at).toLocaleTimeString('es-CL', {hour:'2-digit',minute:'2-digit'}) : '—';
            const detalleJov = esJoven
                ? `<div class="dato"><div class="l">Grupo Scout</div><div class="v">${data.grupo_scout || '—'}</div></div>
                   <div class="dato"><div class="l">Integrantes</div><div class="v">${data.numero_integrantes || 1}</div></div>`
                : `<div class="dato"><div class="l">Grupo</div><div class="v">${data.grupo || '—'}</div></div>
                   <div class="dato"><div class="l">Rol</div><div class="v">${data.rol || '—'}</div></div>`;
            card.innerHTML = `
                <div class="rh">
                    <div class="ri"><i class="fas fa-clock"></i></div>
                    <div><div class="rn">${nombre} ${tipoBadge}</div><div class="rs">Ya fue confirmado a las ${hora}</div></div>
                </div>
                <div class="dg">${detalleJov}</div>
                <div class="rb">
                    <button class="btn btn-r btn-sm" onclick="anular('${tabla}','${data.id}','${resId}')"><i class="fas fa-undo"></i> Revertir confirmación</button>
                </div>`;
        } else {
            // PENDIENTE → confirmar
            card.classList.add('ok');
            const detalleJov = esJoven
                ? `<div class="dato"><div class="l">Grupo Scout</div><div class="v">${data.grupo_scout || '—'}</div></div>
                   <div class="dato"><div class="l">Integrantes</div><div class="v">${data.numero_integrantes || 1}</div></div>
                   <div class="dato"><div class="l">Email</div><div class="v" style="font-size:0.78rem;word-break:break-all">${data.email || '—'}</div></div>
                   <div class="dato"><div class="l">Cuota</div><div class="v">$${parseInt(data.cuota || 0).toLocaleString('es-CL')}</div></div>`
                : `<div class="dato"><div class="l">Grupo</div><div class="v">${data.grupo || '—'}</div></div>
                   <div class="dato"><div class="l">Rol</div><div class="v">${data.rol || '—'}</div></div>
                   <div class="dato"><div class="l">Email</div><div class="v" style="font-size:0.78rem;word-break:break-all">${data.email || '—'}</div></div>
                   <div class="dato"><div class="l">Teléfono</div><div class="v">${data.telefono || '—'}</div></div>`;
            card.innerHTML = `
                <div class="rh">
                    <div class="ri"><i class="fas fa-check"></i></div>
                    <div><div class="rn">${nombre} ${tipoBadge}</div><div class="rs">Inscripción válida — pendiente de confirmar</div></div>
                </div>
                <div class="dg">
                    ${detalleJov}
                    ${data.observaciones ? `<div class="dato warn"><div class="l">⚠ Observaciones</div><div class="v">${data.observaciones}</div></div>` : ''}
                </div>
                <div class="rb">
                    <button class="btn btn-v" onclick="confirmar('${tabla}','${data.id}','${resId}')"><i class="fas fa-check-circle"></i> Confirmar entrada al evento</button>
                </div>`;
        }
        card.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }

    // ── Confirmar = setea confirmado=true y checkin_at ──
    window.confirmar = async function(tabla, id, resId) {
        const { error } = await db.from(tabla).update({
            confirmado: true,
            checkin_at: new Date().toISOString()
        }).eq('id', id);
        if (error) { alert('Error: ' + error.message); return; }
        await recargar();
        // Re-buscar para mostrar resultado actualizado
        const { data } = await db.from(tabla).select('codigo_qr').eq('id', id).single();
        if (data) await procesarCodigo(data.codigo_qr, resId);
    };

    window.anular = async function(tabla, id, resId) {
        if (!confirm('¿Revertir la confirmación de esta inscripción?')) return;
        await db.from(tabla).update({ confirmado: false, checkin_at: null }).eq('id', id);
        await recargar();
        const { data } = await db.from(tabla).select('codigo_qr').eq('id', id).single();
        if (data) await procesarCodigo(data.codigo_qr, resId);
    };

    // ── LISTA ──
    function renderListaActual() {
        const lista = subTab === 'jovenes' ? jovenes : adultos;
        const esJov = subTab === 'jovenes';

        // Header
        document.getElementById('tHead').innerHTML = esJov
            ? '<th>#</th><th>Patrulla / Nombre</th><th>Grupo Scout</th><th>Integrantes</th><th>Email</th><th>Estado</th><th>Acción</th>'
            : '<th>#</th><th>Nombre</th><th>Rol</th><th>Grupo</th><th>Email</th><th>Estado</th><th>Acción</th>';

        const tb = document.getElementById('tbody');
        if (!lista.length) {
            tb.innerHTML = `<tr><td colspan="7"><div class="empty"><i class="fas fa-users-slash"></i>Sin inscripciones de ${subTab} para este evento.</div></td></tr>`;
            return;
        }

        const tabla = esJov ? 'jovenes' : 'adultos';
        tb.innerHTML = lista.map((r, i) => {
            const conf = r.confirmado;
            const badge = conf
                ? '<span class="bg bg-v"><i class="fas fa-check"></i> Confirmado</span>'
                : '<span class="bg bg-g"><i class="fas fa-clock"></i> Pendiente</span>';
            const accion = !conf
                ? `<button class="btn btn-sm btn-v" onclick="confirmarDirecto('${tabla}','${r.id}')" title="Confirmar"><i class="fas fa-check"></i></button>`
                : `<button class="btn btn-sm" style="background:#f1f5f9;color:var(--texto-claro)" onclick="anularDirecto('${tabla}','${r.id}')" title="Revertir"><i class="fas fa-undo"></i></button>`;
            return esJov
                ? `<tr><td>${i+1}</td><td><strong>${r.nombre_patrulla||'—'}</strong></td><td>${r.grupo_scout||'—'}</td><td>${r.numero_integrantes||0}</td><td style="font-size:0.8rem">${r.email||'—'}</td><td>${badge}</td><td>${accion}</td></tr>`
                : `<tr><td>${i+1}</td><td><strong>${r.nombre||'—'}</strong></td><td>${r.rol||'—'}</td><td>${r.grupo||'—'}</td><td style="font-size:0.8rem">${r.email||'—'}</td><td>${badge}</td><td>${accion}</td></tr>`;
        }).join('');
    }

    window.confirmarDirecto = async function(tabla, id) {
        await db.from(tabla).update({ confirmado: true, checkin_at: new Date().toISOString() }).eq('id', id);
        await recargar();
    };
    window.anularDirecto = async function(tabla, id) {
        await db.from(tabla).update({ confirmado: false, checkin_at: null }).eq('id', id);
        await recargar();
    };

    window.filtrarLista = function() {
        const q = document.getElementById('filtro').value.toLowerCase();
        const lista = subTab === 'jovenes' ? jovenes : adultos;
        const filtered = lista.filter(r => {
            const txt = subTab === 'jovenes'
                ? `${r.nombre_patrulla||''} ${r.grupo_scout||''} ${r.email||''} ${r.codigo_qr||''}`
                : `${r.nombre||''} ${r.rol||''} ${r.grupo||''} ${r.email||''} ${r.codigo_qr||''}`;
            return txt.toLowerCase().includes(q);
        });
        const esJov = subTab === 'jovenes';
        const tabla = esJov ? 'jovenes' : 'adultos';
        const tb = document.getElementById('tbody');
        if (!filtered.length) { tb.innerHTML = '<tr><td colspan="7"><div class="empty">Sin coincidencias.</div></td></tr>'; return; }
        tb.innerHTML = filtered.map((r, i) => {
            const conf = r.confirmado;
            const badge = conf ? '<span class="bg bg-v"><i class="fas fa-check"></i> Confirmado</span>' : '<span class="bg bg-g"><i class="fas fa-clock"></i> Pendiente</span>';
            const accion = !conf
                ? `<button class="btn btn-sm btn-v" onclick="confirmarDirecto('${tabla}','${r.id}')"><i class="fas fa-check"></i></button>`
                : `<button class="btn btn-sm" style="background:#f1f5f9;color:var(--texto-claro)" onclick="anularDirecto('${tabla}','${r.id}')"><i class="fas fa-undo"></i></button>`;
            return esJov
                ? `<tr><td>${i+1}</td><td><strong>${r.nombre_patrulla||'—'}</strong></td><td>${r.grupo_scout||'—'}</td><td>${r.numero_integrantes||0}</td><td style="font-size:0.8rem">${r.email||'—'}</td><td>${badge}</td><td>${accion}</td></tr>`
                : `<tr><td>${i+1}</td><td><strong>${r.nombre||'—'}</strong></td><td>${r.rol||'—'}</td><td>${r.grupo||'—'}</td><td style="font-size:0.8rem">${r.email||'—'}</td><td>${badge}</td><td>${accion}</td></tr>`;
        }).join('');
    };

    function actualizarStats() {
        const total = jovenes.length + adultos.length;
        const conf = jovenes.filter(j => j.confirmado).length + adultos.filter(a => a.confirmado).length;
        document.getElementById('sTotal').textContent = total;
        document.getElementById('sConf').textContent = conf;
        document.getElementById('sPend').textContent = total - conf;
        document.getElementById('sPct').textContent = total ? Math.round(conf/total*100) + '%' : '0%';
    }

    window.exportarCSV = function() {
        const lista = subTab === 'jovenes' ? jovenes : adultos;
        if (!lista.length) { alert('No hay datos.'); return; }
        const esJov = subTab === 'jovenes';
        const headers = esJov
            ? ['#','Patrulla','Grupo Scout','Integrantes','Email','Teléfono','Cuota','Confirmado','Hora Confirmación','Observaciones']
            : ['#','Nombre','Rol','Grupo','Email','Teléfono','Confirmado','Hora Confirmación','Observaciones'];
        const rows = [headers];
        lista.forEach((r,i) => {
            const hora = r.checkin_at ? new Date(r.checkin_at).toLocaleString('es-CL') : '';
            rows.push(esJov
                ? [i+1, r.nombre_patrulla, r.grupo_scout, r.numero_integrantes, r.email, r.telefono, r.cuota, r.confirmado?'Sí':'No', hora, r.observaciones||'']
                : [i+1, r.nombre, r.rol, r.grupo, r.email, r.telefono, r.confirmado?'Sí':'No', hora, r.observaciones||'']);
        });
        const csv = rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8;'}));
        a.download = `${subTab}_${ev?.nombre?.replace(/\s/g,'_')||'evento'}.csv`;
        a.click();
    };

    // ── AUTO-SELECCIÓN cuando se embebe desde eventos_iframe ──
    // Lee ?evento_id=X de la URL y selecciona ese evento automáticamente
    // Se ejecuta al final para garantizar que cambiarEv/recargar ya están definidas
    const urlParams = new URLSearchParams(window.location.search);
    const autoEvId = urlParams.get('evento_id');
    if (autoEvId) {
        const optEncontrada = sel.querySelector(`option[value="${autoEvId}"]`);
        if (optEncontrada) {
            sel.value = autoEvId;
            await window.cambiarEv();
        } else {
            console.warn('checkin_qr: evento_id=' + autoEvId + ' no encontrado en la lista de eventos.');
        }
    }


})();
