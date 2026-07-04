    let _waIndDest = null;       // { nombre, telefono }
    let _waIndTab  = 'texto';    // 'texto' | 'media' | 'contacto'
    let _waIndFile = null;       // { b64, mimeType, filename, tipo }
    let _waIndContactos = [];    // [{nombre, telefono, email, cargo}]

    window.waIndSetTab = function(tab, el) {
        _waIndTab = tab;
        document.querySelectorAll('.wa-ind-tab').forEach(b => {
            b.style.background = 'transparent'; b.style.color = '#64748b'; b.style.boxShadow = 'none';
        });
        el.style.background = 'white'; el.style.color = '#075e54'; el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)';
        ['Texto','Media','Contacto'].forEach(t => {
            document.getElementById('waIndPane'+t).style.display = (t.toLowerCase() === tab) ? '' : 'none';
        });
    };

    // Buscar destinatario (adultos + apoderados de jóvenes)
    let _waIndBusqTimeout;
    window.waIndBuscar = function() {
        clearTimeout(_waIndBusqTimeout);
        const q = document.getElementById('waIndBuscar').value.trim();
        if (q.length < 2) { document.getElementById('waIndResultados').style.display='none'; return; }
        _waIndBusqTimeout = setTimeout(async () => {
            const res = document.getElementById('waIndResultados');
            res.style.display = 'block'; res.innerHTML = '<div style="padding:8px;font-size:0.8rem;color:#64748b">Buscando...</div>';
            try {
                const [{data:adul},{data:jovenes}] = await Promise.all([
                    db.from('adultos_registros').select('nombres,apellidos,telefono,email,unidad_rol').ilike('nombres', `%${q}%`).limit(6),
                    db.from('mmbb_registrations').select('nombres,apellidos,apoderado_titular_telefono,apoderado_titular_nombre,unidad').ilike('nombres', `%${q}%`).limit(4)
                ]);
                const items = [
                    ...(adul||[]).filter(a=>a.telefono).map(a=>({
                        nombre:`${a.nombres} ${a.apellidos}`, telefono:a.telefono, email:a.email||'', rol:a.unidad_rol||'Dirigente'
                    })),
                    ...(jovenes||[]).filter(j=>j.apoderado_titular_telefono).map(j=>({
                        nombre:j.apoderado_titular_nombre||`Apoderado de ${j.nombres}`, telefono:j.apoderado_titular_telefono, email:'', rol:`Apoderado · ${j.unidad||''}`
                    }))
                ];
                if (!items.length) { res.innerHTML='<div style="padding:8px;font-size:0.8rem;color:#94a3b8">Sin resultados con teléfono registrado.</div>'; return; }
                res.innerHTML = items.map(it=>`
                    <div onclick="waIndSelDest(${JSON.stringify(it).replace(/"/g,'&quot;')})"
                        style="padding:9px 12px;cursor:pointer;font-size:0.83rem;border-bottom:1px solid #f1f5f9;transition:0.15s"
                        onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='white'">
                        <div style="font-weight:600;color:#1e293b">${it.nombre}</div>
                        <div style="color:#64748b;font-size:0.75rem"><i class="fas fa-phone" style="color:#25D366;margin-right:4px"></i>${it.telefono} · ${it.rol}</div>
                    </div>`).join('');
            } catch(e) { res.innerHTML='<div style="padding:8px;color:#ef4444;font-size:0.8rem">Error: '+e.message+'</div>'; }
        }, 300);
    };

    window.waIndSelDest = function(it) {
        _waIndDest = it;
        document.getElementById('waIndBuscar').value = '';
        document.getElementById('waIndResultados').style.display = 'none';
        document.getElementById('waIndDest').style.display = 'block';
        document.getElementById('waIndDestNombre').textContent = it.nombre;
        document.getElementById('waIndDestTel').textContent = '📱 ' + it.telefono + (it.email ? ' · ' + it.email : '');
    };

    window.waIndLimpiarDest = function() {
        _waIndDest = null;
        document.getElementById('waIndDest').style.display = 'none';
        document.getElementById('waIndBuscar').value = '';
    };

    // Archivo multimedia
    window.waIndFileSeleccionado = async function(input) {
        const file = input.files[0]; if (!file) return;
        const maxMB = 16;
        if (file.size > maxMB * 1024 * 1024) { alerta(`Archivo muy grande (máx ${maxMB} MB).`, 'err'); return; }
        try {
            const b64 = await WA.fileToBase64(file);
            const tipo = WA.tipoDesdeFile(file);
            _waIndFile = { b64, mimeType: file.type, filename: file.name, tipo };
            const iconMap = { imagen:'fa-image', video:'fa-video', audio:'fa-music', documento:'fa-file-pdf' };
            document.getElementById('waIndFileIcon').className = 'fas ' + (iconMap[tipo]||'fa-file') + ' style="font-size:1.3rem;color:#25D366"';
            document.getElementById('waIndFileName').textContent = file.name;
            document.getElementById('waIndFileSize').textContent = (file.size/1024).toFixed(0) + ' KB · ' + tipo;
            document.getElementById('waIndDropzone').style.display = 'none';
            document.getElementById('waIndFilePreview').style.display = 'block';
        } catch(e) { alerta('Error al leer archivo: '+e.message,'err'); }
        input.value = '';
    };

    window.waIndQuitarFile = function() {
        _waIndFile = null;
        document.getElementById('waIndDropzone').style.display = 'block';
        document.getElementById('waIndFilePreview').style.display = 'none';
        document.getElementById('waIndCaption').value = '';
    };

    // Buscar adulto para compartir como contacto
    let _waIndBusqContactoTimeout;
    window.waIndBuscarAdulto = function() {
        clearTimeout(_waIndBusqContactoTimeout);
        const q = document.getElementById('waIndBuscarContacto').value.trim();
        if (q.length < 2) { document.getElementById('waIndContactoResultados').style.display='none'; return; }
        _waIndBusqContactoTimeout = setTimeout(async () => {
            const res = document.getElementById('waIndContactoResultados');
            res.style.display = 'block';
            const {data} = await db.from('adultos_registros').select('nombres,apellidos,telefono,email,unidad_rol').ilike('nombres',`%${q}%`).limit(8);
            if (!data?.length) { res.innerHTML='<div style="padding:8px;font-size:0.8rem;color:#94a3b8">Sin resultados.</div>'; return; }
            res.innerHTML = data.map(a=>`
                <div onclick="waIndAgregarContacto(${JSON.stringify({nombre:`${a.nombres} ${a.apellidos}`,telefono:a.telefono||'',email:a.email||'',cargo:a.unidad_rol||''}).replace(/"/g,'&quot;')})"
                    style="padding:8px 11px;cursor:pointer;font-size:0.82rem;border-bottom:1px solid #f1f5f9"
                    onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='white'">
                    <strong>${a.nombres} ${a.apellidos}</strong>
                    <div style="font-size:0.73rem;color:#64748b">${a.unidad_rol||''} · ${a.telefono||'—'}</div>
                </div>`).join('');
        }, 300);
    };

    window.waIndAgregarContacto = function(it) {
        if (_waIndContactos.find(c=>c.telefono===it.telefono)) return;
        _waIndContactos.push(it);
        document.getElementById('waIndBuscarContacto').value = '';
        document.getElementById('waIndContactoResultados').style.display = 'none';
        _renderContactosSel();
    };

    function _renderContactosSel() {
        document.getElementById('waIndContactosSeleccionados').innerHTML = _waIndContactos.map((c,i)=>`
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:4px 10px;font-size:0.78rem;display:flex;align-items:center;gap:5px">
                <i class="fas fa-address-card" style="color:#128c7e"></i>${c.nombre}
                <span onclick="_waIndQuitarContacto(${i})" style="cursor:pointer;color:#64748b;margin-left:3px">✕</span>
            </div>`).join('');
    }
    window._waIndQuitarContacto = function(i) { _waIndContactos.splice(i,1); _renderContactosSel(); };

    // Enviar
    window.waIndEnviar = async function() {
        if (!_waIndDest) { alerta('Selecciona un destinatario primero.', 'err'); return; }
        const btn = document.getElementById('btnWaInd');
        const status = document.getElementById('waIndStatus');
        btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        status.textContent = '';
        try {
            let res;
            if (_waIndTab === 'texto') {
                const texto = document.getElementById('waIndTexto').value.trim();
                if (!texto) throw new Error('Escribe un mensaje.');
                res = await WA.enviarTexto(_waIndDest.telefono, texto);
            } else if (_waIndTab === 'media') {
                if (!_waIndFile) throw new Error('Selecciona un archivo primero.');
                status.textContent = 'Subiendo archivo a WhatsApp...';
                res = await WA.enviarMedia(_waIndDest.telefono, _waIndDest.nombre, {
                    ..._waIndFile, caption: document.getElementById('waIndCaption').value.trim()
                });
            } else if (_waIndTab === 'contacto') {
                if (!_waIndContactos.length) throw new Error('Agrega al menos un contacto para compartir.');
                res = await WA.enviarContactos(_waIndDest.telefono, _waIndDest.nombre, _waIndContactos);
            }
            if (res.ok) {
                status.innerHTML = '<span style="color:#16a34a"><i class="fas fa-check-circle"></i> Enviado ✓</span>';
                if (_waIndTab === 'texto') document.getElementById('waIndTexto').value = '';
                if (_waIndTab === 'media') waIndQuitarFile();
                if (_waIndTab === 'contacto') { _waIndContactos=[]; _renderContactosSel(); document.getElementById('waIndBuscarContacto').value=''; }
            } else {
                throw new Error(res.error || 'Error al enviar');
            }
        } catch(e) {
            status.innerHTML = `<span style="color:#ef4444"><i class="fas fa-times-circle"></i> ${e.message}</span>`;
        }
        btn.disabled = false; btn.innerHTML = '<i class="fab fa-whatsapp"></i> Enviar';
    };

    window.limpiar=function(){
        document.getElementById('asunto').value='';
        document.getElementById('editor').innerHTML='';
        document.getElementById('alertR').innerHTML='';
        document.getElementById('prog').classList.remove('show');
        document.getElementById('progWA').style.display='none';
        archivosAdjuntos=[];
        renderAdjuntosLista();
        upPreview();
    };

