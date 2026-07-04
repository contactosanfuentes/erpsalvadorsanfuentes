    function renderJovenes() {
        const tbody = document.getElementById('jovenes-body');
        tbody.innerHTML = '';
        const jovenesFiltrados = jovenes.filter(j => j.unidad_id === unidadActiva?.id);
        jovenesFiltrados.forEach((p, index) => {
            const total = (p.numero_integrantes || 0) * (p.cuota || 0);
            const waNumber = (p.telefono || '').replace(/\D/g, '');
            const waLink = waNumber ? `href="https://wa.me/${waNumber}" target="_blank"` : `onclick="customAlert('Agregue un número válido para usar WhatsApp.')"`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight:bold; text-align:center; background:var(--gris-fondo);">${index + 1}</td>
                <td style="text-align:center;">
                    <img src="${p.foto_url || 'https://ui-avatars.com/api/?name='+encodeURIComponent(p.nombre_patrulla||'?')+'&background=e2e8f0'}" class="credencial-img" onclick="cambiarFotoJoven('${p.id}')" title="Clic para cambiar foto" style="cursor:pointer;">
                </td>
                <td><input type="text" value="${p.nombre_patrulla || ''}" onchange="updateJoven('${p.id}', 'nombre_patrulla', this.value)"></td>
                <td><input type="text" value="${p.grupo_scout || ''}" list="listaGruposDatalist" onchange="updateJoven('${p.id}', 'grupo_scout', this.value)"></td>
                <td><input type="number" min="0" value="${p.numero_integrantes || 0}" onchange="updateJoven('${p.id}', 'numero_integrantes', parseInt(this.value)||0)"></td>
                <td><input type="text" value="${p.telefono || ''}" placeholder="+569..." onchange="updateJoven('${p.id}', 'telefono', this.value)"></td>
                <td><input type="email" value="${p.email || ''}" onchange="updateJoven('${p.id}', 'email', this.value)"></td>
                <td><input type="number" step="0.01" value="${p.cuota || 0}" onchange="updateJoven('${p.id}', 'cuota', parseFloat(this.value)||0)"></td>
                <td style="text-align: right; background:var(--gris-fondo);"><strong>${total.toFixed(2)}</strong></td>
                <td>
                    ${(p.observaciones || '').includes('▸')
                        ? `<div style="display:flex;gap:4px;align-items:center"><textarea readonly style="flex:1;min-height:32px;font-size:11px;resize:vertical;background:#fffbeb;border:1px solid #fde68a;padding:3px 5px;border-radius:4px" title="Información estructurada desde inscripción pública">${(p.observaciones || '').replace(/</g,'&lt;')}</textarea><button class="btn btn-sm btn-secondary" onclick="verObservacionesDetalle('jovenes','${p.id}')" title="Ver detalle"><i class="fas fa-eye"></i></button></div>`
                        : `<input type="text" value="${(p.observaciones || '').replace(/"/g,'&quot;')}" onchange="updateJoven('${p.id}', 'observaciones', this.value)">`
                    }
                </td>
                <td style="text-align:center;">
                    ${p.codigo_qr ? (p.confirmado
                        ? `<span style="display:inline-block;padding:3px 10px;border-radius:14px;font-size:0.72rem;font-weight:700;background:#dcfce7;color:#166534;" title="Confirmado vía QR el ${p.checkin_at?new Date(p.checkin_at).toLocaleString('es-CL'):''}"><i class="fas fa-check-circle"></i> Confirmado</span>`
                        : `<span style="display:inline-block;padding:3px 10px;border-radius:14px;font-size:0.72rem;font-weight:700;background:#fff7ed;color:#9a3412;cursor:pointer;" title="Inscripción pública pendiente — clic para confirmar manualmente" onclick="confirmarInscripcionPublica('jovenes','${p.id}')"><i class="fas fa-clock"></i> Pre-inscripción</span>`)
                    : `<span style="display:inline-block;padding:3px 10px;border-radius:14px;font-size:0.72rem;font-weight:700;background:#f1f5f9;color:#64748b;" title="Registro manual"><i class="fas fa-user-edit"></i> Manual</span>`}
                </td>
                <td style="text-align: center;">
                    <div style="display:flex; gap:5px; justify-content:center;">
                        <a ${waLink} class="btn btn-sm btn-success" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>
                        <button class="btn btn-sm btn-primary" onclick="opcionesComprobanteJoven('${p.id}')" title="Acreditación / Credencial / Correo"><i class="fas fa-id-badge"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarJoven('${p.id}')" title="Eliminar Registro"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        updateTotalsJovenes();
    }

    // ── Cambiar foto de joven ──
    window.cambiarFotoJoven = async function(id) {
        if (!eventoActual) { await customAlert('Seleccione un evento'); return; }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async e => {
            const file = e.target.files[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `joven_${id}_${Date.now()}.${fileExt}`;
            const filePath = `fotos_jovenes/${eventoActual.id}/${fileName}`;

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
            await updateJoven(id, 'foto_url', publicUrl);
            renderJovenes();
            await customAlert('Foto actualizada correctamente');
        };
        input.click();
    }

    window.updateJoven = async function(id, field, value) {
        try { await supabaseClient.from('jovenes').update({ [field]: value }).eq('id', id); } catch(e){}
        const joven = jovenes.find(j => j.id == id);
        if (joven) joven[field] = value;
        updateTotalsJovenes();
        renderPuntuacion();
        actualizarSelectorPasaporte();
        if(field === 'telefono') renderJovenes();
        if(field === 'cuota' || field === 'numero_integrantes') updateIngresoFromInscripcion(true);
    }

    // ── INTEGRACIÓN INSCRIPCIÓN PÚBLICA: ver detalle de observaciones estructuradas ──
    window.verObservacionesDetalle = function(tabla, id) {
        const lista = tabla === 'jovenes' ? jovenes : adultos;
        const item = lista.find(x => x.id == id);
        if (!item) return;
        const obs = item.observaciones || '';
        const nombre = tabla === 'jovenes' ? (item.nombre_patrulla || 'Joven') : (item.nombre || 'Adulto');

        // Parsear secciones marcadas con ▸
        const lineas = obs.split('\n');
        let general = [], medico = [], alim = [];
        lineas.forEach(l => {
            if (l.startsWith('▸ MÉDICO:')) medico.push(l.replace('▸ MÉDICO:','').trim());
            else if (l.startsWith('▸ ALIMENTACIÓN:')) alim.push(l.replace('▸ ALIMENTACIÓN:','').trim());
            else if (l.startsWith('OBSERVACIONES:')) general.push(l.replace('OBSERVACIONES:','').trim());
            else if (l.trim()) general.push(l.trim());
        });

        // Detectar URL de ficha médica dentro del bloque médico
        let fichaURL = null;
        const medFull = medico.join(' | ');
        const m = medFull.match(/Ficha adjunta:\s*(https?:\/\/\S+)/i);
        if (m) fichaURL = m[1];

        // Parsear datos médicos individuales (Sangre: X | Alergias: Y | ...)
        const medicoItems = [];
        medFull.split('|').forEach(p => {
            const parts = p.split(':');
            if (parts.length >= 2) {
                const k = parts[0].trim();
                const v = parts.slice(1).join(':').trim();
                if (k === 'Ficha adjunta') return;
                if (k && v) medicoItems.push({ k, v });
            }
        });

        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;';
        modal.innerHTML = `
            <div style="background:white;border-radius:14px;max-width:560px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 15px 40px rgba(0,0,0,0.2)">
                <div style="background:linear-gradient(135deg,#0E2586,#1a36a8);color:white;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
                    <h3 style="margin:0;font-size:1rem;font-weight:600"><i class="fas fa-user-md" style="margin-right:8px"></i>Detalle de ${nombre}</h3>
                    <button onclick="this.closest('div[style*=fixed]').remove()" style="background:none;border:none;color:white;font-size:1.3rem;cursor:pointer"><i class="fas fa-times"></i></button>
                </div>
                <div style="padding:20px">
                    ${general.length ? `
                        <div style="margin-bottom:16px">
                            <h4 style="font-size:0.78rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.4px;margin:0 0 8px;border-bottom:2px solid #e2e8f0;padding-bottom:5px"><i class="fas fa-sticky-note" style="color:#64748b;margin-right:5px"></i>Observaciones generales</h4>
                            <p style="font-size:0.85rem;color:#334155;margin:0">${general.join('<br>')}</p>
                        </div>` : ''}

                    ${medicoItems.length || fichaURL ? `
                        <div style="margin-bottom:16px;background:#fff5f5;border-left:4px solid #dc2626;border-radius:8px;padding:13px 15px">
                            <h4 style="font-size:0.78rem;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:0.4px;margin:0 0 10px"><i class="fas fa-briefcase-medical" style="margin-right:5px"></i>Ficha médica</h4>
                            ${medicoItems.map(x => `<p style="margin:4px 0;font-size:0.85rem;color:#7f1d1d"><strong>${x.k}:</strong> ${x.v}</p>`).join('')}
                            ${fichaURL ? `<p style="margin-top:10px"><a href="${fichaURL}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;background:#dc2626;color:white;padding:7px 14px;border-radius:7px;text-decoration:none;font-size:0.82rem;font-weight:600"><i class="fas fa-file-medical"></i> Ver ficha médica adjunta</a></p>` : ''}
                        </div>` : ''}

                    ${alim.length ? `
                        <div style="background:#fffbeb;border-left:4px solid #d97706;border-radius:8px;padding:13px 15px">
                            <h4 style="font-size:0.78rem;font-weight:700;color:#78350f;text-transform:uppercase;letter-spacing:0.4px;margin:0 0 8px"><i class="fas fa-utensils" style="margin-right:5px"></i>Preferencias alimentarias</h4>
                            <p style="margin:0;font-size:0.85rem;color:#78350f">${alim.join(' · ')}</p>
                        </div>` : ''}

                    ${!general.length && !medicoItems.length && !alim.length && !fichaURL
                        ? '<p style="text-align:center;color:#94a3b8;font-size:0.85rem;padding:20px">Sin observaciones registradas.</p>' : ''}
                </div>
                <div style="padding:12px 20px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;gap:8px;justify-content:space-between;align-items:center;">
                    <button onclick="generarFichaDocumento('${tabla}','${id}')" style="background:#0E2586;color:white;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:0.83rem;font-weight:600;display:flex;align-items:center;gap:7px;"><i class="fas fa-file-medical"></i> Ver / Generar Ficha</button>
                    <button onclick="this.closest('div[style*=fixed]').remove()" style="background:#64748b;color:white;border:none;padding:8px 18px;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:600;">Cerrar</button>
                </div>
            </div>`;
        modal.onclick = e => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    }


    // ── FICHA FORMAL DE PARTICIPANTE (Salud / Dieta) ──
    const _cargarLibEvento = (src) => new Promise((res, rej) => {
        if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
        const s = document.createElement('script'); s.src = src;
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });

    function _buildFichaHTML(datos) {
        const { nombre, unidad, medicoItems, fichaURL, alimItems, eventoNombre, fechaEvento } = datos;
        const logoSrc = 'https://hyixmaxhoxvamoecuars.supabase.co/storage/v1/object/public/logos/grupo.png';
        const tieneSalud = medicoItems.length > 0 || fichaURL;
        const tieneDieta = alimItems.length > 0;
        const hoy = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

        const filasTabla = (items) => items.map(x => `
            <tr>
                <td style="padding:7px 12px;font-size:0.82rem;font-weight:700;color:#475569;background:#f8fafc;width:36%;border-bottom:1px solid #e2e8f0;">${x.k}</td>
                <td style="padding:7px 12px;font-size:0.85rem;color:#1e293b;border-bottom:1px solid #e2e8f0;">${x.v || '—'}</td>
            </tr>`).join('');

        const saludSection = tieneSalud ? `
            <div style="margin-bottom:20px;">
                <div style="background:#dc2626;color:white;padding:9px 14px;border-radius:8px 8px 0 0;display:flex;align-items:center;gap:8px;">
                    <i class="fas fa-heartbeat"></i>
                    <span style="font-weight:700;font-size:0.88rem;letter-spacing:0.5px;">DATOS DE SALUD Y PRIMEROS AUXILIOS</span>
                </div>
                <table style="width:100%;border-collapse:collapse;border:1px solid #fecaca;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;">
                    ${filasTabla(medicoItems)}
                </table>
                ${fichaURL ? `<div style="margin-top:10px;"><a href="${fichaURL}" target="_blank" style="display:inline-flex;align-items:center;gap:7px;background:#dc2626;color:white;padding:8px 16px;border-radius:8px;text-decoration:none;font-size:0.83rem;font-weight:600;"><i class="fas fa-file-medical"></i> Ver Ficha Médica Adjunta</a></div>` : ''}
            </div>` : '';

        const dietaSection = tieneDieta ? `
            <div style="margin-bottom:20px;">
                <div style="background:#d97706;color:white;padding:9px 14px;border-radius:8px 8px 0 0;display:flex;align-items:center;gap:8px;">
                    <i class="fas fa-utensils"></i>
                    <span style="font-weight:700;font-size:0.88rem;letter-spacing:0.5px;">ALIMENTACIÓN / DIETA ESPECIAL</span>
                </div>
                <div style="border:1px solid #fde68a;border-top:none;border-radius:0 0 8px 8px;padding:12px 14px;background:#fffbeb;">
                    ${alimItems.map(x => `<p style="margin:5px 0;font-size:0.85rem;color:#78350f;display:flex;align-items:center;gap:7px;"><i class="fas fa-check-circle" style="color:#d97706;flex-shrink:0;"></i>${x}</p>`).join('')}
                </div>
            </div>` : '';

        return `
        <div id="ficha-imprimible" style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;">
            <div style="border:2px solid #0E2586;border-radius:10px;overflow:hidden;margin-bottom:20px;">
                <div style="background:linear-gradient(135deg,#001558,#0E2586);color:white;padding:16px 20px;display:flex;align-items:center;gap:16px;">
                    <img src="${logoSrc}" style="width:54px;height:54px;border-radius:50%;background:white;padding:3px;flex-shrink:0;" onerror="this.style.display='none'">
                    <div>
                        <div style="font-size:0.68rem;font-weight:600;letter-spacing:1.5px;opacity:0.8;text-transform:uppercase;">Grupo Guías y Scouts Salvador Sanfuentes</div>
                        <div style="font-size:1.05rem;font-weight:900;">FICHA DE PARTICIPANTE</div>
                        <div style="font-size:0.78rem;opacity:0.85;margin-top:2px;"><i class="fas fa-campground" style="margin-right:4px;"></i>${eventoNombre}</div>
                    </div>
                </div>
                <div style="background:#f8fafc;padding:14px 20px;display:grid;grid-template-columns:1fr 1fr;gap:12px;border-bottom:1px solid #e2e8f0;">
                    <div>
                        <div style="font-size:0.65rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:2px;">Participante</div>
                        <div style="font-size:1rem;font-weight:800;color:#0E2586;">${nombre}</div>
                    </div>
                    <div>
                        <div style="font-size:0.65rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:2px;">Grupo / Unidad</div>
                        <div style="font-size:0.9rem;font-weight:600;color:#334155;">${unidad || '—'}</div>
                    </div>
                    <div>
                        <div style="font-size:0.65rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:2px;">Fecha del evento</div>
                        <div style="font-size:0.85rem;color:#334155;">${fechaEvento}</div>
                    </div>
                    <div>
                        <div style="font-size:0.65rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:2px;">Emitida el</div>
                        <div style="font-size:0.85rem;color:#334155;">${hoy}</div>
                    </div>
                </div>
            </div>

            ${saludSection}
            ${dietaSection}

            <div style="margin-top:28px;display:grid;grid-template-columns:1fr 1fr;gap:24px;">
                <div style="text-align:center;padding-top:8px;border-top:2px solid #0E2586;">
                    <div style="font-size:0.72rem;color:#64748b;font-weight:600;">Firma Apoderado / Participante</div>
                </div>
                <div style="text-align:center;padding-top:8px;border-top:2px solid #0E2586;">
                    <div style="font-size:0.72rem;color:#64748b;font-weight:600;">Firma Dirigente Responsable</div>
                </div>
            </div>
            <div style="margin-top:18px;text-align:center;font-size:0.68rem;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px;">
                ERP Scout — Grupo Guías y Scouts Salvador Sanfuentes · Asociación de Guías y Scouts de Chile
            </div>
        </div>`;
    }

    function _parsearObsParaFicha(obs) {
        const lineas = (obs || '').split('\n');
        const medicoItems = [], alimItems = [];
        let fichaURL = null;
        lineas.forEach(l => {
            if (l.startsWith('▸ MÉDICO:')) {
                const medFull = l.replace('▸ MÉDICO:', '').trim();
                const m = medFull.match(/Ficha adjunta:\s*(https?:\/\/\S+)/i);
                if (m) fichaURL = m[1];
                medFull.split('|').forEach(p => {
                    const parts = p.split(':');
                    if (parts.length >= 2) {
                        const k = parts[0].trim(), v = parts.slice(1).join(':').trim();
                        if (k !== 'Ficha adjunta' && k && v) medicoItems.push({ k, v });
                    }
                });
            } else if (l.startsWith('▸ ALIMENTACIÓN:')) {
                l.replace('▸ ALIMENTACIÓN:', '').trim().split(',').forEach(x => { if (x.trim()) alimItems.push(x.trim()); });
            }
        });
        return { medicoItems, alimItems, fichaURL };
    }

    window.generarFichaDocumento = function(tabla, id) {
        const lista = tabla === 'jovenes' ? jovenes : adultos;
        const item = lista.find(x => x.id == id);
        if (!item) return;
        const nombre = tabla === 'jovenes' ? (item.nombre_patrulla || 'Joven') : (item.nombre || 'Adulto');
        const unidad = tabla === 'jovenes' ? (item.grupo_scout || '') : (item.unidad_rol || '');
        const eventoNombre = eventoActual?.nombre || 'Evento';
        const fechaEvento = eventoActual?.fecha_inicio
            ? new Date(eventoActual.fecha_inicio + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
            : '—';

        const { medicoItems, alimItems, fichaURL } = _parsearObsParaFicha(item.observaciones);
        if (!medicoItems.length && !alimItems.length && !fichaURL) {
            customAlert('Este participante no tiene datos de salud ni dieta registrados.');
            return;
        }

        const fichaHtml = _buildFichaHTML({ nombre, unidad, medicoItems, alimItems, fichaURL, eventoNombre, fechaEvento });

        const old = document.getElementById('modal-ficha-doc');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'modal-ficha-doc';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10001;display:flex;flex-direction:column;align-items:center;padding:20px;overflow-y:auto;';
        modal.innerHTML = `
            <div style="background:white;border-radius:14px;max-width:740px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,0.3);margin:auto;">
                <div style="background:linear-gradient(135deg,#001558,#0E2586);color:white;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-radius:14px 14px 0 0;">
                    <h3 style="margin:0;font-size:0.95rem;font-weight:700;"><i class="fas fa-file-medical" style="margin-right:8px;"></i>Ficha de Participante — ${nombre}</h3>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <button id="btn-imprimir-ficha" onclick="window._imprimirFichaParticipante()" style="background:#10b981;color:white;border:none;padding:7px 14px;border-radius:7px;cursor:pointer;font-size:0.82rem;font-weight:600;display:flex;align-items:center;gap:6px;"><i class="fas fa-print"></i> Imprimir</button>
                        <button id="btn-drive-ficha" onclick="window._guardarFichaEnDrive('${tabla}','${id}')" style="background:#f59e0b;color:white;border:none;padding:7px 14px;border-radius:7px;cursor:pointer;font-size:0.82rem;font-weight:600;display:flex;align-items:center;gap:6px;"><i class="fab fa-google-drive"></i> Guardar en Drive</button>
                        <button onclick="document.getElementById('modal-ficha-doc').remove()" style="background:rgba(255,255,255,0.15);color:white;border:none;padding:7px 12px;border-radius:7px;cursor:pointer;font-size:1rem;"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <div id="ficha-doc-content" style="padding:22px;">
                    ${fichaHtml}
                </div>
            </div>`;
        modal.onclick = e => { if (e.target === modal) modal.remove(); };
        document.body.appendChild(modal);
    };

    window._imprimirFichaParticipante = function() {
        const contenido = document.getElementById('ficha-doc-content')?.innerHTML;
        if (!contenido) return;
        const win = window.open('', '_blank', 'width=820,height=700');
        win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ficha de Participante</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { margin: 20px; font-family: Arial, sans-serif; }
                @media print { @page { margin: 14mm; size: A4; } button { display: none !important; } }
            </style></head>
            <body>${contenido}
            <script>
                window.onload = function() {
                    setTimeout(function() { window.print(); window.onafterprint = function() { window.close(); }; }, 500);
                };
            <\/script></body></html>`);
        win.document.close();
    };

    window._guardarFichaEnDrive = async function(tabla, id) {
        const btn = document.getElementById('btn-drive-ficha');
        const orig = btn?.innerHTML;
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando PDF...'; }
        try {
            await _cargarLibEvento('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            await _cargarLibEvento('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');

            const cont = document.getElementById('ficha-doc-content');
            const canvas = await html2canvas(cont, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const imgW = 210, imgH = (canvas.height * 210) / canvas.width;
            let posY = 0;
            while (posY < imgH) {
                if (posY > 0) pdf.addPage();
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -posY, imgW, imgH);
                posY += 297;
            }
            const base64 = btoa(pdf.output());

            const lista = tabla === 'jovenes' ? jovenes : adultos;
            const item = lista.find(x => x.id == id);
            const nombre = tabla === 'jovenes' ? (item?.nombre_patrulla || 'Joven') : (item?.nombre || 'Adulto');
            const eventoNombre = eventoActual?.nombre || 'Evento';
            const nombreArchivo = `Ficha_${nombre.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g,'_')}.pdf`;

            if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo a Drive...';

            const res = await window.DriveHelper.subir({
                supabaseClient,
                nombre: nombreArchivo,
                base64,
                mimeType: 'application/pdf',
                claveCarpeta: 'raiz',
                nombrePersona: eventoNombre
            });

            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fab fa-google-drive"></i> ✓ Guardado'; btn.style.background = '#10b981'; }
            if (res?.webViewLink) {
                customAlert(`✅ Ficha guardada en Drive.\n\nCarpeta: ${eventoNombre}\nArchivo: ${nombreArchivo}`);
            }
        } catch(e) {
            console.error('[FICHA DRIVE]', e);
            if (btn) { btn.disabled = false; btn.innerHTML = orig || '<i class="fab fa-google-drive"></i> Guardar en Drive'; btn.style.background = '#ef4444'; }
            customAlert('Error al guardar en Drive: ' + e.message);
        }
    };

        // ── INTEGRACIÓN INSCRIPCIÓN PÚBLICA: confirmar manualmente desde la tabla ──
    window.confirmarInscripcionPublica = async function(tabla, id) {
        const ok = await customConfirm("¿Confirmar manualmente esta pre-inscripción pública?\n\nNormalmente se confirma escaneando el QR en el módulo Check-in QR, pero también puedes hacerlo aquí.");
        if (!ok) return;
        try {
            const { error } = await supabaseClient.from(tabla).update({
                confirmado: true,
                checkin_at: new Date().toISOString()
            }).eq('id', id);
            if (error) throw error;
            // Actualizar el array local
            if (tabla === 'jovenes') {
                const j = jovenes.find(x => x.id == id);
                if (j) { j.confirmado = true; j.checkin_at = new Date().toISOString(); }
                renderJovenes();
            } else {
                const a = adultos.find(x => x.id == id);
                if (a) { a.confirmado = true; a.checkin_at = new Date().toISOString(); }
                renderAdultos();
            }
            await customAlert("Inscripción confirmada exitosamente.");
        } catch(e) {
            await customAlert("Error al confirmar: " + e.message);
        }
    }

    window.eliminarJoven = async function(id) {
        if(await customConfirm("¿Eliminar este registro de forma permanente?")) {
            try { await supabaseClient.from('jovenes').delete().eq('id', id); }catch(e){}
            jovenes = jovenes.filter(j => j.id != id);
            renderJovenes();
            updateIngresoFromInscripcion(true);
            renderPlanilla();
            renderPuntuacion();
            renderEntregas();
        }
    }

    window.removeLastJovenRow = async function() {
        if (jovenes.length === 0) return;
        const jovenesUnidad = jovenes.filter(j => j.unidad_id === unidadActiva?.id);
        if (jovenesUnidad.length === 0) return;
        const last = jovenesUnidad[jovenesUnidad.length - 1];
        if (await customConfirm('¿Eliminar la última patrulla?')) {
            try { await supabaseClient.from('jovenes').delete().eq('id', last.id); }catch(e){}
            jovenes = jovenes.filter(j => j.id !== last.id);
            renderJovenes();
        }
    }

    function updateTotalsJovenes() {
        let totalJovenes = 0, totalCLP = 0;
        jovenes.forEach(p => {
            totalJovenes += p.numero_integrantes || 0;
            totalCLP += (p.numero_integrantes || 0) * (p.cuota || 0);
        });
        document.getElementById('total-jovenes').innerText = totalJovenes;
        document.getElementById('total-clp').innerText = totalCLP.toFixed(2);
        document.getElementById('total-patrullas').innerText = jovenes.length;
    }

    window.addJovenRow = async function() {
        if (!eventoActual) { await customAlert('Seleccione un evento'); return; }
        if (!unidadActiva) { await customAlert('No hay unidad seleccionada'); return; }
        
        const grupoFiltro = document.getElementById('filtroGrupo')?.value || '';
        const nuevo = { evento_id: eventoActual.id, unidad_id: unidadActiva.id, nombre_patrulla: '', grupo_scout: grupoFiltro, numero_integrantes: 0, telefono: '', email: '', cuota: 0, observaciones: '' };
        
        const { data, error } = await supabaseClient.from('jovenes').insert(nuevo).select();
        if (error) {
            await customAlert('Error al guardar en la base de datos: ' + error.message);
            return;
        }
        if (data && data.length > 0) { 
            jovenes.push(data[0]); 
            renderJovenes(); 
            renderEntregas(); 
            renderPlanilla(); 
        }
    }

    // ========== ADULTOS ==========
