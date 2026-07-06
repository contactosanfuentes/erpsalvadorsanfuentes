// ============================================================
// 02_autorizaciones.js — Autorización digital de participación
// Formato oficial AGSCh 2025 (menores y mayores de edad).
// Flujo: apoderado/participante revisa eventos publicados,
// completa la autorización, firma en pantalla y obtiene el PDF.
// Requiere: variable global `db` (cliente Supabase) ya creada.
// ============================================================
(function(){
    const AUT = {};
    const _cache = {};   // mmbbId -> { j, eventos, auts }

    const hoyISO = () => new Date().toISOString().slice(0,10);
    const fmtFecha = (f) => f ? new Date(f + 'T12:00:00').toLocaleDateString('es-CL', {day:'2-digit', month:'long', year:'numeric'}) : '—';
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    function edadEn(fechaNac, fechaRef) {
        if (!fechaNac) return null;
        const n = new Date(fechaNac + 'T12:00:00');
        const r = new Date((fechaRef || hoyISO()) + 'T12:00:00');
        let e = r.getFullYear() - n.getFullYear();
        if (r.getMonth() < n.getMonth() || (r.getMonth() === n.getMonth() && r.getDate() < n.getDate())) e--;
        return e;
    }

    // ── Carga y render de la pestaña por joven ──
    AUT.cargar = async function(j) {
        const cont = document.getElementById(`aut-cont-${j.id}`);
        if (!cont) return;
        try {
            const [evsRes, autsRes, partRes] = await Promise.all([
                db.from('eventos')
                  .select('id,nombre,fecha_inicio,fecha_fin,lugar,tipo')
                  .eq('publicado', true)
                  .or(`fecha_fin.gte.${hoyISO()},fecha_inicio.gte.${hoyISO()}`)
                  .order('fecha_inicio', { ascending: true })
                  .limit(12),
                db.from('autorizaciones_apoderados')
                  .select('id,evento_id,tipo,firma_timestamp,autoriza_tratamiento')
                  .eq('mmbb_id', j.id),
                db.from('participaciones_eventos')
                  .select('evento_id,participa,updated_at')
                  .eq('mmbb_id', j.id)
            ]);
            const eventos = evsRes.data || [];
            const auts = autsRes.data || [];
            const parts = partRes.data || [];
            _cache[j.id] = { j, eventos, auts, parts };

            if (!eventos.length) {
                cont.innerHTML = '<div class="esm"><i class="fas fa-calendar-times"></i>No hay actividades próximas publicadas.</div>';
                return;
            }
            cont.innerHTML = eventos.map(ev => {
                const aut = auts.find(a => a.evento_id === ev.id);
                const part = parts.find(p => p.evento_id === ev.id);
                const esInterno = (ev.tipo || 'interno') === 'interno';
                const rango = ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio
                    ? `${fmtFecha(ev.fecha_inicio)} al ${fmtFecha(ev.fecha_fin)}` : fmtFecha(ev.fecha_inicio);

                const btnFirmar = `<button onclick="Autorizaciones.abrir(${j.id}, ${ev.id})" style="background:var(--azul-profundo,#0E2586);color:white;border:none;border-radius:8px;padding:7px 12px;font-size:0.75rem;font-weight:600;cursor:pointer"><i class="fas fa-pen-nib"></i> Firmar autorización</button>`;
                const badgeFirmada = aut ? `<span style="background:#dcfce7;color:#166534;font-size:0.7rem;font-weight:700;padding:4px 10px;border-radius:20px"><i class="fas fa-check-circle"></i> Autorización firmada ${new Date(aut.firma_timestamp).toLocaleDateString('es-CL')}</span>
                    <button onclick="Autorizaciones.descargarPDF(${aut.id})" style="background:none;border:1px solid #cbd5e1;border-radius:8px;padding:3px 9px;font-size:0.7rem;cursor:pointer;color:#334155"><i class="fas fa-file-pdf" style="color:#dc2626"></i> PDF</button>` : '';

                let acciones = '';
                if (esInterno) {
                    // ── Paso 1: decisión de participación · Paso 2: autorización ──
                    if (!part) {
                        acciones = `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                            <span style="font-size:0.72rem;color:#64748b;font-weight:600">¿Participará?</span>
                            <div style="display:flex;gap:6px">
                                <button onclick="Autorizaciones.decidir(${j.id}, ${ev.id}, true)" style="background:#16a34a;color:white;border:none;border-radius:8px;padding:7px 14px;font-size:0.75rem;font-weight:700;cursor:pointer"><i class="fas fa-check"></i> Sí</button>
                                <button onclick="Autorizaciones.decidir(${j.id}, ${ev.id}, false)" style="background:white;color:#b91c1c;border:1px solid #fecaca;border-radius:8px;padding:7px 14px;font-size:0.75rem;font-weight:700;cursor:pointer"><i class="fas fa-times"></i> No</button>
                            </div>
                        </div>`;
                    } else if (part.participa) {
                        acciones = `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                            <span style="background:#dcfce7;color:#166534;font-size:0.7rem;font-weight:700;padding:4px 10px;border-radius:20px"><i class="fas fa-user-check"></i> Participará</span>
                            ${aut ? badgeFirmada : btnFirmar}
                            <button onclick="Autorizaciones.decidir(${j.id}, ${ev.id}, false)" style="background:none;border:none;color:#94a3b8;font-size:0.68rem;cursor:pointer;text-decoration:underline">Cambiar a no participa</button>
                        </div>`;
                    } else {
                        acciones = `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                            <span style="background:#f1f5f9;color:#64748b;font-size:0.7rem;font-weight:700;padding:4px 10px;border-radius:20px"><i class="fas fa-user-slash"></i> No participará</span>
                            <button onclick="Autorizaciones.decidir(${j.id}, ${ev.id}, true)" style="background:none;border:none;color:#16a34a;font-size:0.68rem;cursor:pointer;text-decoration:underline;font-weight:700">Cambiar: sí participará</button>
                        </div>`;
                    }
                } else {
                    // ── Evento externo: inscripción por portal público; aquí solo la autorización ──
                    acciones = `<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                        ${aut ? badgeFirmada : btnFirmar}
                    </div>`;
                }

                return `<div class="ev-row" style="align-items:center">
                    <div>
                        <div class="ev-nom">${esc(ev.nombre)} ${esInterno
                            ? '<span style="background:#e0f2fe;color:#0369a1;font-size:0.62rem;font-weight:800;padding:2px 7px;border-radius:10px;vertical-align:middle">INTERNO</span>'
                            : '<span style="background:#fef3c7;color:#92400e;font-size:0.62rem;font-weight:800;padding:2px 7px;border-radius:10px;vertical-align:middle" title="La inscripción de delegaciones se realiza por el portal público">ABIERTO</span>'}</div>
                        <div class="ev-fch">${rango}${ev.lugar ? ' · ' + esc(ev.lugar) : ''}</div>
                        <div id="cuota-${j.id}-${ev.id}" style="margin-top:3px"></div>
                    </div>
                    ${acciones}
                </div>`;
            }).join('') + `<p style="font-size:0.7rem;color:#94a3b8;margin-top:10px"><i class="fas fa-info-circle"></i> En las actividades <strong>internas</strong> primero confirmas si participará y luego firmas la autorización oficial AGSCh. Las actividades <strong>abiertas</strong> reciben inscripciones de delegaciones por el portal público; aquí solo se firma la autorización. Los documentos se conservan un mínimo de 6 meses.</p>`;

            // ── Estado de cuota (async, no bloquea): internos si participa, externos si autorizó ──
            for (const ev of eventos) {
                const part = parts.find(p => p.evento_id === ev.id);
                const aut = auts.find(a => a.evento_id === ev.id);
                const esInterno = (ev.tipo || 'interno') === 'interno';
                const relevante = esInterno ? (part?.participa === true) : !!aut;
                if (!relevante) continue;
                db.rpc('portal_estado_cuota', { p_evento_id: ev.id, p_run: j.run || '', p_nombre: `${j.nombres || ''}|${j.apellidos || ''}` })
                  .then(({ data }) => {
                    const el = document.getElementById(`cuota-${j.id}-${ev.id}`);
                    const r = data?.[0];
                    if (!el || !r || !r.tiene_cuenta || !r.cuota_referencia) return;
                    const pagado = Number(r.total_pagado) || 0;
                    const cuota = Number(r.cuota_referencia) || 0;
                    el.innerHTML = pagado >= cuota
                        ? `<span style="background:#dcfce7;color:#166534;font-size:0.66rem;font-weight:700;padding:2px 8px;border-radius:10px"><i class="fas fa-coins"></i> Cuota pagada · $${pagado.toLocaleString('es-CL')}</span>`
                        : pagado > 0
                        ? `<span style="background:#fffbeb;color:#92400e;font-size:0.66rem;font-weight:700;padding:2px 8px;border-radius:10px"><i class="fas fa-coins"></i> Abonado $${pagado.toLocaleString('es-CL')} de $${cuota.toLocaleString('es-CL')}</span>`
                        : `<span style="background:#fef2f2;color:#b91c1c;font-size:0.66rem;font-weight:700;padding:2px 8px;border-radius:10px"><i class="fas fa-coins"></i> Cuota pendiente · $${cuota.toLocaleString('es-CL')}</span>`;
                  })
                  .catch(() => {});
            }
        } catch(e) {
            cont.innerHTML = `<div class="errb"><i class="fas fa-exclamation-circle"></i>No se pudieron cargar las actividades: ${esc(e.message)}</div>`;
        }
    };

    // ── Decisión de participación (eventos internos) ──
    AUT.decidir = async function(mmbbId, eventoId, participa) {
        const c = _cache[mmbbId];
        if (!c) return;
        const { error } = await db.from('participaciones_eventos').upsert({
            evento_id: eventoId,
            mmbb_id: mmbbId,
            participa,
            decidido_por: c.j.apoderado_titular_nombre || null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'evento_id,mmbb_id' });
        if (error) { alert('No se pudo guardar la decisión: ' + error.message); return; }
        await AUT.cargar(c.j);
    };

    // ── Modal del formulario ──
    AUT.abrir = function(mmbbId, eventoId) {
        const c = _cache[mmbbId];
        if (!c) return;
        const j = c.j;
        const ev = c.eventos.find(e => e.id === eventoId);
        if (!ev) return;

        const edad = edadEn(j.fecha_nacimiento, ev.fecha_inicio);
        const esMenor = edad === null ? true : edad < 18;   // sin fecha de nacimiento → tratar como menor (conservador)
        const rango = ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio
            ? `${fmtFecha(ev.fecha_inicio)} al ${fmtFecha(ev.fecha_fin)}` : fmtFecha(ev.fecha_inicio);

        const contactos = [
            { n: j.apoderado_titular_nombre, p: j.apoderado_titular_parentesco, t: j.apoderado_titular_telefono },
            { n: j.apoderado_suplente1_nombre, p: j.apoderado_suplente1_parentesco, t: j.apoderado_suplente1_telefono }
        ];

        const overlay = document.createElement('div');
        overlay.id = 'aut-modal';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:1000;display:flex;align-items:flex-start;justify-content:center;padding:18px;overflow-y:auto';
        overlay.innerHTML = `
        <div style="background:white;border-radius:14px;max-width:640px;width:100%;margin:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
            <div style="background:var(--azul-profundo,#0E2586);color:white;padding:16px 22px;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:center">
                <div>
                    <div style="font-weight:800;font-size:0.95rem">AUTORIZACIÓN DE PARTICIPACIÓN EN ACTIVIDADES PRESENCIALES</div>
                    <div style="font-size:0.75rem;opacity:0.85">${esMenor ? 'MENORES DE EDAD' : 'MAYORES DE EDAD'} · Formato AGSCh 2025</div>
                </div>
                <button onclick="document.getElementById('aut-modal').remove()" style="background:none;border:none;color:white;font-size:1.3rem;cursor:pointer">&times;</button>
            </div>
            <div style="padding:20px 22px;font-size:0.85rem;color:#334155">
                <div style="background:#f1f5f9;border-radius:10px;padding:12px 14px;margin-bottom:16px">
                    <div><strong>Actividad:</strong> ${esc(ev.nombre)}</div>
                    <div><strong>Fecha/s:</strong> ${rango}</div>
                    <div><strong>Lugar:</strong> ${esc(ev.lugar || 'Por confirmar')}</div>
                    <div><strong>Participante:</strong> ${esc(j.nombres)} ${esc(j.apellidos)} · RUN ${esc(j.run || '—')}${edad !== null ? ` · ${edad} años` : ''}</div>
                </div>

                ${esMenor ? `
                <div style="margin-bottom:14px">
                    <label style="font-weight:700;display:block;margin-bottom:4px">Nombre completo del apoderado/a o tutor/a legal *</label>
                    <input id="aut-apo-nombre" type="text" value="${esc(j.apoderado_titular_nombre || '')}" style="width:100%;padding:9px;border:1px solid #cbd5e1;border-radius:8px">
                    <label style="font-weight:700;display:block;margin:10px 0 4px">RUN del apoderado/a *</label>
                    <input id="aut-apo-run" type="text" placeholder="12.345.678-9" style="width:100%;padding:9px;border:1px solid #cbd5e1;border-radius:8px">
                </div>` : ''}

                <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 14px;font-size:0.78rem;line-height:1.5;margin-bottom:14px">
                    Al firmar esta autorización, declaro que ${esMenor ? 'el niño, niña o adolescente que represento no ha' : 'no he'} presentado en las últimas 48 horas signos o síntomas compatibles con enfermedades infecciosas o condiciones de salud que pudieran poner en riesgo ${esMenor ? 'su' : 'mi'} bienestar o el de los demás durante la realización de la actividad. Asimismo, manifiesto que no tengo conocimiento de ${esMenor ? 'que se encuentre' : 'encontrarme'} cursando alguna condición médica que ${esMenor ? 'le' : 'me'} impida participar de manera segura.
                    <br><br>
                    Entiendo y acepto que la organización de la actividad y/o la Asociación de Guías y Scouts de Chile no será responsable por eventuales complicaciones de salud que pudieran derivarse de condiciones preexistentes y/o no informadas, siempre que estas no tengan relación directa con accidentes en la actividad desarrollada.
                    ${!esMenor ? '<br><br>Adicionalmente, declaro que he notificado a mi núcleo familiar, círculo cercano y/o las personas con las que vivo de las actividades que realizaré, el lugar donde se desarrollarán y las fechas de las mismas.' : ''}
                </div>
                <label style="display:flex;gap:8px;align-items:flex-start;margin-bottom:16px;cursor:pointer">
                    <input type="checkbox" id="aut-declaro" style="margin-top:3px">
                    <span style="font-size:0.8rem"><strong>Acepto la declaración anterior.</strong></span>
                </label>

                <div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:16px">
                    <div style="font-weight:700;margin-bottom:6px">Autorización de tratamiento médico de urgencia *</div>
                    <div style="font-size:0.78rem;color:#64748b;margin-bottom:8px">¿Autoriza a quien es responsable de la actividad para que, en caso de urgencia y bajo recomendación de un profesional médico, disponga el tratamiento o intervenciones quirúrgicas que fueran necesarias realizar${esMenor ? ' al niño, niña o adolescente que representa' : ''}?</div>
                    <label style="margin-right:18px;cursor:pointer"><input type="radio" name="aut-trat" value="si"> <strong>SÍ autorizo</strong></label>
                    <label style="cursor:pointer"><input type="radio" name="aut-trat" value="no"> <strong>NO autorizo</strong></label>
                </div>

                <div style="font-weight:700;margin-bottom:6px">En cualquier caso de urgencia, comunicarse con: *</div>
                ${[0,1].map(i => `
                <div style="display:grid;grid-template-columns:2fr 1.2fr 1.2fr;gap:8px;margin-bottom:8px">
                    <input id="aut-ce-n${i}" placeholder="Nombre completo" value="${esc(contactos[i]?.n || '')}" style="padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-size:0.8rem">
                    <input id="aut-ce-p${i}" placeholder="Parentesco" value="${esc(contactos[i]?.p || '')}" style="padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-size:0.8rem">
                    <input id="aut-ce-t${i}" placeholder="Teléfono" value="${esc(contactos[i]?.t || '')}" style="padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-size:0.8rem">
                </div>`).join('')}

                <div style="font-weight:700;margin:16px 0 6px">Firma ${esMenor ? 'del apoderado/a o tutor/a legal' : 'del participante'} *</div>
                <div style="border:2px dashed #cbd5e1;border-radius:10px;background:#f8fafc;position:relative">
                    <canvas id="aut-firma" width="560" height="150" style="width:100%;height:150px;touch-action:none;display:block;border-radius:10px"></canvas>
                    <button onclick="Autorizaciones._limpiarFirma()" style="position:absolute;top:6px;right:6px;background:white;border:1px solid #cbd5e1;border-radius:6px;padding:3px 8px;font-size:0.7rem;cursor:pointer"><i class="fas fa-eraser"></i> Limpiar</button>
                </div>
                <p style="font-size:0.7rem;color:#94a3b8;margin-top:4px">Dibuja tu firma con el dedo o el mouse.</p>

                <div id="aut-error" style="display:none;background:#fef2f2;color:#b91c1c;border-radius:8px;padding:10px;font-size:0.78rem;margin-top:10px"></div>

                <button id="aut-btn-guardar" onclick="Autorizaciones._guardar(${j.id}, ${ev.id})" style="width:100%;margin-top:16px;background:var(--azul-profundo,#0E2586);color:white;border:none;border-radius:10px;padding:13px;font-size:0.9rem;font-weight:700;cursor:pointer">
                    <i class="fas fa-file-signature"></i> Firmar y enviar autorización
                </button>
                <p style="font-size:0.68rem;color:#94a3b8;text-align:center;margin-top:8px">Se registrará fecha, hora y dispositivo como respaldo de la firma electrónica simple.</p>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        _initFirma('aut-firma');
    };

    // ── Canvas de firma (mouse + touch) ──
    let _firmaTocada = false;
    function _initFirma(canvasId) {
        const cv = document.getElementById(canvasId);
        const ctx = cv.getContext('2d');
        ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        _firmaTocada = false;
        let dib = false;
        const pos = (e) => {
            const r = cv.getBoundingClientRect();
            const p = e.touches ? e.touches[0] : e;
            return { x: (p.clientX - r.left) * (cv.width / r.width), y: (p.clientY - r.top) * (cv.height / r.height) };
        };
        const ini = (e) => { dib = true; _firmaTocada = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
        const mov = (e) => { if (!dib) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); };
        const fin = () => { dib = false; };
        cv.addEventListener('mousedown', ini); cv.addEventListener('mousemove', mov);
        window.addEventListener('mouseup', fin);
        cv.addEventListener('touchstart', ini, {passive:false}); cv.addEventListener('touchmove', mov, {passive:false});
        cv.addEventListener('touchend', fin);
    }
    AUT._limpiarFirma = function() {
        const cv = document.getElementById('aut-firma') || document.getElementById('fm-firma');
        if (cv) { cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); _firmaTocada = false; }
    };
    AUT._firmaLista = () => _firmaTocada;
    AUT._initFirma = _initFirma;   // reutilizado por 03_ficha_medica.js

    // ── Guardar ──
    AUT._guardar = async function(mmbbId, eventoId) {
        const c = _cache[mmbbId]; const j = c.j;
        const ev = c.eventos.find(e => e.id === eventoId);
        const edad = edadEn(j.fecha_nacimiento, ev.fecha_inicio);
        const esMenor = edad === null ? true : edad < 18;
        const err = document.getElementById('aut-error');
        const fallo = (m) => { err.style.display = 'block'; err.textContent = m; };
        err.style.display = 'none';

        const apoNombre = esMenor ? document.getElementById('aut-apo-nombre').value.trim() : null;
        const apoRun = esMenor ? document.getElementById('aut-apo-run').value.trim() : null;
        if (esMenor && (!apoNombre || !apoRun)) return fallo('Completa nombre y RUN del apoderado/a o tutor/a legal.');
        if (!document.getElementById('aut-declaro').checked) return fallo('Debes aceptar la declaración de salud para continuar.');
        const trat = document.querySelector('input[name="aut-trat"]:checked');
        if (!trat) return fallo('Indica SÍ o NO en la autorización de tratamiento médico de urgencia.');
        const contactos = [0,1].map(i => ({
            nombre: document.getElementById(`aut-ce-n${i}`).value.trim(),
            parentesco: document.getElementById(`aut-ce-p${i}`).value.trim(),
            telefono: document.getElementById(`aut-ce-t${i}`).value.trim()
        })).filter(x => x.nombre || x.telefono);
        if (!contactos.length || !contactos[0].telefono) return fallo('Ingresa al menos un contacto de emergencia con teléfono.');
        if (!_firmaTocada) return fallo('Dibuja la firma en el recuadro.');

        const btn = document.getElementById('aut-btn-guardar');
        btn.disabled = true; btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Enviando...';

        const registro = {
            evento_id: eventoId,
            mmbb_id: mmbbId,
            tipo: esMenor ? 'menor' : 'mayor',
            participante_nombre: `${j.nombres || ''} ${j.apellidos || ''}`.trim(),
            participante_run: (j.run || '').trim(),
            apoderado_nombre: apoNombre,
            apoderado_run: apoRun,
            autoriza_tratamiento: trat.value === 'si',
            declaracion_salud: true,
            contactos_emergencia: contactos,
            firma_imagen: document.getElementById('aut-firma').toDataURL('image/png'),
            firma_user_agent: navigator.userAgent.slice(0, 250)
        };
        const { data, error } = await db.from('autorizaciones_apoderados').insert(registro).select().single();
        if (error) {
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-file-signature"></i> Firmar y enviar autorización';
            if ((error.code || '') === '23505') return fallo('Ya existe una autorización firmada para esta actividad. Cierra y recarga la búsqueda.');
            return fallo('Error al guardar: ' + error.message);
        }
        document.getElementById('aut-modal').remove();
        await AUT.cargar(j);   // refrescar estado
        try { await _generarPDF(data, ev); } catch(e) { console.error('[AUT] PDF:', e); }
        alert('✅ Autorización firmada correctamente. Se descargó una copia en PDF.');
    };

    // ── PDF con el texto del formato oficial AGSCh ──
    async function _cargarJsPDF() {
        if (window.jspdf) return;
        await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
        });
    }

    AUT.descargarPDF = async function(autId) {
        const { data: aut, error } = await db.from('autorizaciones_apoderados').select('*').eq('id', autId).single();
        if (error || !aut) return alert('No se pudo recuperar la autorización.');
        const { data: ev } = await db.from('eventos').select('id,nombre,fecha_inicio,fecha_fin,lugar').eq('id', aut.evento_id).single();
        await _generarPDF(aut, ev || {});
    };

    async function _generarPDF(aut, ev) {
        await _cargarJsPDF();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const W = 210, M = 20, ancho = W - M * 2;
        let y = 20;
        const esMenor = aut.tipo === 'menor';
        const ffirma = new Date(aut.firma_timestamp);

        const parrafo = (txt, opts = {}) => {
            doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
            doc.setFontSize(opts.size || 9.5);
            const lineas = doc.splitTextToSize(txt, ancho);
            if (y + lineas.length * 4.6 > 280) { doc.addPage(); y = 20; }
            doc.text(lineas, opts.center ? W/2 : M, y, opts.center ? { align: 'center' } : {});
            y += lineas.length * 4.6 + (opts.gap ?? 2.5);
        };

        doc.setFillColor(14, 37, 134); doc.rect(0, 0, W, 4, 'F');
        parrafo('AUTORIZACIÓN DE PARTICIPACIÓN EN ACTIVIDADES PRESENCIALES', { bold: true, size: 12.5, center: true, gap: 1 });
        parrafo(esMenor ? 'MENORES DE EDAD' : 'MAYORES DE EDAD', { bold: true, size: 10.5, center: true, gap: 1 });
        parrafo('Asociación de Guías y Scouts de Chile · Grupo Guías y Scouts Salvador Sanfuentes', { size: 8.5, center: true, gap: 6 });

        const fs = ffirma.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
        if (esMenor) {
            parrafo(`Con fecha ${fs}, Yo, ${aut.apoderado_nombre}, RUN ${aut.apoderado_run}, apoderada, apoderado, tutora o tutor legal de ${aut.participante_nombre}, RUN ${aut.participante_run}, autorizo para que participe en la actividad:`);
        } else {
            parrafo(`Con fecha ${fs}, Yo, ${aut.participante_nombre}, RUN ${aut.participante_run}, siendo mayor de edad, declaro que participaré en la actividad:`);
        }
        y += 2;
        const rango = ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio
            ? `${fmtFecha(ev.fecha_inicio)} al ${fmtFecha(ev.fecha_fin)}` : fmtFecha(ev.fecha_inicio);
        parrafo(`Nombre de la actividad:  ${ev.nombre || '—'}`, { bold: true });
        parrafo(`Fecha/s de la actividad:  ${rango}`, { bold: true });
        parrafo(`Lugar:  ${ev.lugar || 'Por confirmar'}`, { bold: true, gap: 6 });

        parrafo(`Al firmar esta autorización, declaro que ${esMenor ? 'el niño, niña o adolescente que represento no ha' : 'no he'} presentado en las últimas 48 horas signos o síntomas compatibles con enfermedades infecciosas o condiciones de salud que pudieran poner en riesgo ${esMenor ? 'su' : 'mi'} bienestar o el de los demás durante la realización de la actividad. Asimismo, manifiesto que no tengo conocimiento de ${esMenor ? 'que se encuentre' : 'encontrarme'} cursando alguna condición médica que ${esMenor ? 'le' : 'me'} impida participar de manera segura.`);
        parrafo('Entiendo y acepto que la organización de la actividad y/o la Asociación de Guías y Scouts de Chile no será responsable por eventuales complicaciones de salud que pudieran derivarse de condiciones preexistentes y/o no informadas, siempre que estas no tengan relación directa con accidentes en la actividad desarrollada.');
        if (!esMenor) parrafo('Adicionalmente, declaro que he notificado a mi núcleo familiar, círculo cercano y/o las personas con las que vivo de las actividades que realizaré, el lugar donde se desarrollarán y las fechas de las mismas.');
        y += 2;

        parrafo(`[ ${aut.autoriza_tratamiento ? 'X' : '  '} ] SÍ     [ ${aut.autoriza_tratamiento ? '  ' : 'X'} ] NO     Autorizo a quien es responsable de la actividad para que, en caso de urgencia y bajo recomendación de un profesional médico, disponga el tratamiento o intervenciones quirúrgicas que fueran necesarias realizar${esMenor ? ' al niño, niña o adolescente que represento' : ''}.`, { bold: true, gap: 6 });

        parrafo('En cualquier caso de urgencia, comunicarse con:', { bold: true, gap: 3 });
        (aut.contactos_emergencia || []).forEach(ce => {
            parrafo(`• ${ce.nombre || '—'}   ·   ${ce.parentesco || '—'}   ·   Tel: ${ce.telefono || '—'}`, { gap: 1.5 });
        });
        y += 10;

        // Firma
        if (aut.firma_imagen) {
            try { doc.addImage(aut.firma_imagen, 'PNG', M, y, 62, 17); } catch(e){}
        }
        y += 20;
        doc.setDrawColor(100); doc.line(M, y, M + 75, y); y += 4.5;
        parrafo(`${esMenor ? aut.apoderado_nombre : aut.participante_nombre} · RUN ${esMenor ? aut.apoderado_run : aut.participante_run}`, { size: 8.5, gap: 1 });
        parrafo(esMenor ? 'Apoderado/a o tutor/a legal' : 'Participante', { size: 8, gap: 6 });

        parrafo(`Firma electrónica simple registrada el ${ffirma.toLocaleString('es-CL')} · Folio AUT-${String(aut.id).padStart(5, '0')}`, { size: 7.5, gap: 1 });
        parrafo('Este documento debe conservarse por un período mínimo de 6 meses después de finalizado el evento o salida, en caso de ser necesarias consultas posteriores.', { size: 7, gap: 0 });

        const nombreArchivo = `Autorizacion_${(aut.participante_nombre || '').replace(/[^a-zA-Z0-9]/g, '_')}_AUT${aut.id}.pdf`;
        doc.save(nombreArchivo);
    }

    window.Autorizaciones = AUT;
})();
