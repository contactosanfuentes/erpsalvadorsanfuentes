    function renderAdultos() {
        const tbody = document.getElementById('adultos-body');
        tbody.innerHTML = '';
        adultos.forEach((a, index) => {
            const waNumber = (a.telefono || '').replace(/\D/g, '');
            const waLink = waNumber ? `href="https://wa.me/${waNumber}" target="_blank"` : `onclick="customAlert('Agregue un número válido para usar WhatsApp.')"`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight:bold; text-align:center; background:var(--gris-fondo);">${index + 1}</td>
                <td style="text-align:center;">
                    <img src="${a.foto_url || 'https://ui-avatars.com/api/?name='+encodeURIComponent(a.nombre)+'&background=e2e8f0'}" class="credencial-img" onclick="cambiarFotoAdulto('${a.id}')" title="Clic para cambiar foto" style="cursor:pointer;">
                </td>
                <td><input type="text" value="${a.nombre || ''}" onchange="updateAdulto('${a.id}', 'nombre', this.value)"></td>
                <td><input type="text" value="${a.grupo || ''}" list="listaGruposDatalist" onchange="updateAdulto('${a.id}', 'grupo', this.value)"></td>
                <td><input type="text" value="${a.rol || ''}" onchange="updateAdulto('${a.id}', 'rol', this.value)"></td>
                <td><input type="text" value="${a.telefono || ''}" placeholder="+569..." onchange="updateAdulto('${a.id}', 'telefono', this.value)"></td>
                <td><input type="email" value="${a.email || ''}" onchange="updateAdulto('${a.id}', 'email', this.value)"></td>
                <td>
                    ${(a.observaciones || '').includes('▸')
                        ? `<div style="display:flex;gap:4px;align-items:center"><textarea readonly style="flex:1;min-height:32px;font-size:11px;resize:vertical;background:#fffbeb;border:1px solid #fde68a;padding:3px 5px;border-radius:4px" title="Información estructurada desde inscripción pública">${(a.observaciones || '').replace(/</g,'&lt;')}</textarea><button class="btn btn-sm btn-secondary" onclick="verObservacionesDetalle('adultos','${a.id}')" title="Ver detalle"><i class="fas fa-eye"></i></button></div>`
                        : `<input type="text" value="${(a.observaciones || '').replace(/"/g,'&quot;')}" onchange="updateAdulto('${a.id}', 'observaciones', this.value)">`
                    }
                </td>
                <td style="text-align:center;">
                    ${a.codigo_qr ? (a.confirmado
                        ? `<span style="display:inline-block;padding:3px 10px;border-radius:14px;font-size:0.72rem;font-weight:700;background:#dcfce7;color:#166534;" title="Confirmado vía QR el ${a.checkin_at?new Date(a.checkin_at).toLocaleString('es-CL'):''}"><i class="fas fa-check-circle"></i> Confirmado</span>`
                        : `<span style="display:inline-block;padding:3px 10px;border-radius:14px;font-size:0.72rem;font-weight:700;background:#fff7ed;color:#9a3412;cursor:pointer;" title="Pre-inscripción pública pendiente — clic para confirmar manualmente" onclick="confirmarInscripcionPublica('adultos','${a.id}')"><i class="fas fa-clock"></i> Pre-inscripción</span>`)
                    : `<span style="display:inline-block;padding:3px 10px;border-radius:14px;font-size:0.72rem;font-weight:700;background:#f1f5f9;color:#64748b;" title="Registro manual"><i class="fas fa-user-edit"></i> Manual</span>`}
                </td>
                <td style="text-align: center;">
                    <div style="display:flex; gap:5px; justify-content:center;">
                        <a ${waLink} class="btn btn-sm btn-success" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>
                        <button class="btn btn-sm btn-primary" onclick="opcionesComprobanteAdulto('${a.id}')" title="Acreditación / Correo"><i class="fas fa-id-badge"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarAdulto('${a.id}')" title="Eliminar Registro"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        document.getElementById('total-adultos').innerText = adultos.length;
    }

    window.cambiarFotoAdulto = async function(id) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async e => {
            const file = e.target.files[0];
            if (!file) return;
            
            const fileExt = file.name.split('.').pop();
            const fileName = `adulto_${id}_${Date.now()}.${fileExt}`;
            const filePath = `fotos_adultos/${eventoActual.id}/${fileName}`;
            
            const { error: uploadError } = await supabaseClient.storage
                .from('fotos')
                .upload(filePath, file);
                
            if (uploadError) {
                await customAlert('Error al subir la foto: ' + uploadError.message);
                return;
            }
            
            const { data: urlData } = supabaseClient.storage
                .from('fotos')
                .getPublicUrl(filePath);
            
            const publicUrl = urlData.publicUrl;
            
            await updateAdulto(id, 'foto_url', publicUrl);
            renderAdultos();
            await customAlert('Foto actualizada correctamente');
        };
        input.click();
    }

    window.agregarJovenInterno = async function() {
        if (!eventoActual) { await customAlert('Seleccione un evento'); return; }
        if (!unidadActiva) { await customAlert('Seleccione una unidad primero'); return; }

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-box large">
                <h3><i class="fas fa-search"></i> Buscar Joven (BD Interna)</h3>
                <input type="text" id="buscador-bd-joven" placeholder="Escriba Nombre, Apellido o RUT..." style="margin-bottom:10px;">
                <button class="btn btn-primary" id="btn-buscar-bd-joven" style="width:100%; margin-bottom:15px;"><i class="fas fa-search"></i> Buscar</button>
                <div id="resultados-busqueda-joven" class="search-results-modal"></div>
                <div class="modal-actions"><button class="btn btn-secondary" id="btn-cerrar-bd-joven">Cerrar</button></div>
            </div>`;
        document.body.appendChild(overlay);

        const inputBusqueda = overlay.querySelector('#buscador-bd-joven');
        const resultadosContainer = overlay.querySelector('#resultados-busqueda-joven');

        overlay.querySelector('#btn-cerrar-bd-joven').onclick = () => overlay.remove();
        inputBusqueda.addEventListener('keydown', e => { if(e.key === 'Enter') overlay.querySelector('#btn-buscar-bd-joven').click(); });

        overlay.querySelector('#btn-buscar-bd-joven').onclick = async () => {
            const query = inputBusqueda.value.trim();
            if(query.length < 2) { resultadosContainer.innerHTML = '<div style="padding:15px;text-align:center;">Escriba al menos 2 caracteres.</div>'; return; }
            resultadosContainer.innerHTML = '<div style="padding:15px;text-align:center;"><i class="fas fa-spinner fa-pulse"></i> Buscando...</div>';
            try {
                const { data: mmbb } = await supabaseClient
                    .from('mmbb_registrations')
                    .select('run, nombres, apellidos, foto_url, unidad, apoderado_titular_telefono, apoderado_titular_email')
                    .or(`run.ilike.%${query}%,nombres.ilike.%${query}%,apellidos.ilike.%${query}%`)
                    .limit(10);

                if (!mmbb || mmbb.length === 0) {
                    resultadosContainer.innerHTML = '<div style="padding:15px;text-align:center;color:var(--rojo-intenso);">No se encontraron jóvenes.</div>';
                    return;
                }

                resultadosContainer.innerHTML = mmbb.map((p, idx) => {
                    const foto = p.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.nombres+' '+p.apellidos)}&background=e2e8f0`;
                    return `<div class="search-item" id="add-joven-bd-${idx}" style="cursor:pointer;">
                        <img src="${foto}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;">
                        <div class="search-item-info">
                            <h4>${p.nombres} ${p.apellidos}</h4>
                            <p><i class="fas fa-id-card"></i> ${p.run || 'Sin RUT'} &nbsp;|&nbsp; <i class="fas fa-layer-group"></i> ${p.unidad || 'Sin unidad'}</p>
                        </div></div>`;
                }).join('');

                mmbb.forEach((p, idx) => {
                    overlay.querySelector(`#add-joven-bd-${idx}`).onclick = async function() {
                        const nomFull = `${p.nombres} ${p.apellidos}`;
                        const nuevo = {
                            evento_id: eventoActual.id, unidad_id: unidadActiva.id,
                            nombre_patrulla: nomFull, grupo_scout: 'Grupo Salvador Sanfuentes',
                            numero_integrantes: 1, telefono: p.apoderado_titular_telefono || '',
                            email: p.apoderado_titular_email || '', cuota: 0,
                            observaciones: `BD Interna | RUT: ${p.run || 'S/N'}`,
                            foto_url: p.foto_url || ''
                        };
                        const { data, error } = await supabaseClient.from('jovenes').insert(nuevo).select();
                        if (error) { await customAlert('Error: ' + error.message); return; }
                        if (data && data.length > 0) {
                            jovenes.push(data[0]); renderJovenes(); renderEntregas(); renderPlanilla();
                            overlay.remove(); customAlert(`✅ ${nomFull} agregado.`);
                        }
                    };
                });
            } catch(err) {
                resultadosContainer.innerHTML = '<div style="padding:15px;text-align:center;color:var(--rojo-intenso);">Error al conectar con la BD.</div>';
            }
        };
    };

    window.agregarAdultoInterno = async function() {
        if (!eventoActual) { await customAlert('Seleccione un evento'); return; }
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-box large">
                <h3><i class="fas fa-search"></i> Buscar Dirigente (BD Nacional)</h3>
                <input type="text" id="buscador-bd" placeholder="Escriba Nombre o RUT..." style="margin-bottom:10px;">
                <button class="btn btn-primary" id="btn-buscar-bd" style="width:100%; margin-bottom:15px;"><i class="fas fa-search"></i> Buscar</button>
                <div id="resultados-busqueda" class="search-results-modal"></div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="btn-cerrar-bd">Cerrar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        const inputBusqueda = overlay.querySelector('#buscador-bd');
        const resultadosContainer = overlay.querySelector('#resultados-busqueda');

        overlay.querySelector('#btn-cerrar-bd').onclick = () => overlay.remove();
        
        overlay.querySelector('#btn-buscar-bd').onclick = async () => {
            const query = inputBusqueda.value.trim();
            if(query.length < 3) return;
            resultadosContainer.innerHTML = '<div style="padding:15px; text-align:center; color:var(--texto-muted);"><i class="fas fa-spinner fa-pulse"></i> Buscando...</div>';
            
            try {
                const { data: mmbb } = await supabaseClient.from('mmbb_registrations').select('run, nombres, apellidos, foto_url, apoderado_titular_telefono').or(`run.ilike.%${query}%,nombres.ilike.%${query}%,apellidos.ilike.%${query}%`).limit(5);
                const { data: ads } = await supabaseClient.from('adultos_registros').select('run, nombres, apellidos, foto_url, telefono').or(`run.ilike.%${query}%,nombres.ilike.%${query}%,apellidos.ilike.%${query}%`).limit(5);
                
                let all = [];
                if (mmbb) all = all.concat(mmbb.map(p => ({ ...p, tipo: 'Caminante/Pionero (Apoyo)' })));
                if (ads) all = all.concat(ads.map(a => ({ ...a, tipo: 'Dirigente Oficial' })));

                if(all.length === 0) {
                    resultadosContainer.innerHTML = '<div style="padding:15px; text-align:center; color:var(--rojo-intenso);">No se encontraron resultados en la BD.</div>';
                    return;
                }

                resultadosContainer.innerHTML = all.map((p, idx) => {
                    const f = p.foto_url || 'https://ui-avatars.com/api/?name='+encodeURIComponent(p.nombres)+'&background=e2e8f0';
                    const tel = p.telefono || p.apoderado_titular_telefono || '';
                    const nomFull = `${p.nombres} ${p.apellidos}`;
                    return `
                        <div class="search-item" id="add-bd-${idx}" data-nombre="${nomFull}" data-tel="${tel}" data-foto="${f}">
                            <img src="${f}" alt="Foto">
                            <div class="search-item-info">
                                <h4>${nomFull}</h4>
                                <p><i class="fas fa-id-card"></i> ${p.run || 'S/N'} | <i class="fas fa-tag"></i> ${p.tipo}</p>
                            </div>
                        </div>
                    `;
                }).join('');

                all.forEach((p, idx) => {
                    overlay.querySelector(`#add-bd-${idx}`).onclick = async function() {
                        const rol = await customPrompt(`¿Qué rol cumplirá ${p.nombres} en este evento?`, "Staff Apoyo");
                        if(!rol) return;
                        
                        const nuevo = { 
                            evento_id: eventoActual.id, 
                            nombre: p.nombres + ' ' + p.apellidos, 
                            grupo: 'Grupo Local', 
                            rol: rol, 
                            email: '', 
                            telefono: p.telefono || p.apoderado_titular_telefono || '',
                            foto_url: p.foto_url || '',
                            observaciones: 'Agregado desde BD Interna' 
                        };

                        const { data, error } = await supabaseClient.from('adultos').insert(nuevo).select();
                        if (error) {
                            await customAlert('Error al guardar en la base de datos: ' + error.message);
                            return;
                        }
                        if (data && data.length > 0) { 
                            adultos.push(data[0]); 
                            renderAdultos(); 
                            renderEntregas(); 
                            customAlert("Adulto agregado al Staff."); 
                            overlay.remove();
                        }
                    };
                });

            } catch (error) {
                resultadosContainer.innerHTML = `
                    <div class="search-item" onclick="agregarFallbackDirigente()">
                        <img src="https://ui-avatars.com/api/?name=Dirigente+Demo" alt="Foto">
                        <div class="search-item-info">
                            <h4>Dirigente Demo (Búsqueda Fallida)</h4>
                            <p>Clic para agregar como demostración.</p>
                        </div>
                    </div>`;
            }
        };
    }

    window.agregarFallbackDirigente = async function() {
        const nuevo = { evento_id: eventoActual.id, nombre: "Dirigente de Prueba", grupo: "Grupo Salvador Sanfuentes", rol: "Jefe de Subcampo", telefono: "+56911223344", foto_url: "", observaciones: "Demo" };
        const { data, error } = await supabaseClient.from('adultos').insert(nuevo).select();
        if(!error && data && data.length > 0){ adultos.push(data[0]); renderAdultos(); document.querySelector('.modal-overlay').remove(); }
    };

    window.updateAdulto = async function(id, field, value) {
        try { await supabaseClient.from('adultos').update({ [field]: value }).eq('id', id); } catch(e){}
        const adulto = adultos.find(a => a.id == id);
        if (adulto) adulto[field] = value;
        if(field === 'telefono') renderAdultos();
    }

    window.eliminarAdulto = async function(id) {
        if(await customConfirm("¿Eliminar este miembro del staff?")) {
            try { await supabaseClient.from('adultos').delete().eq('id', id); }catch(e){}
            adultos = adultos.filter(a => a.id != id);
            renderAdultos(); renderEntregas();
        }
    }

    window.removeLastAdultoRow = async function() {
        if (adultos.length === 0) return;
        const last = adultos[adultos.length - 1];
        if (await customConfirm('¿Eliminar el último adulto?')) {
            try { await supabaseClient.from('adultos').delete().eq('id', last.id); }catch(e){}
            adultos.pop();
            renderAdultos();
        }
    }

    window.addAdultoRow = async function() {
        if (!eventoActual) { await customAlert('Seleccione un evento'); return; }
        const nuevo = { evento_id: eventoActual.id, nombre: '', grupo: 'Externo/Libre', rol: 'Staff', email: '', telefono: '', foto_url: '', observaciones: '' };
        const { data, error } = await supabaseClient.from('adultos').insert(nuevo).select();
        if (error) { await customAlert('Error al agregar la fila.'); return; }
        if (data && data.length > 0) { adultos.push(data[0]); renderAdultos(); renderEntregas(); }
    }

    // ========== RECURSOS ==========
