// ============================================================
// 03_ficha_medica.js — Ficha Médica y Necesidades Emocionales
// Formato oficial AGSCh 2025 (4 páginas), dirigido por esquema:
// FICHA_SCHEMA define secciones y campos; de él se generan el
// formulario, la recolección a JSONB y el PDF. Instrucción del
// formato: campos sin datos se registran como "S/I" o "N/A".
// Requiere: `db` global y window.Autorizaciones (canvas firma).
// ============================================================
(function(){
    const FM = {};
    const _cache = {};   // mmbbId -> { j, ultima }
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    // ── Esquema del formato oficial ──
    // Tipos: text | date | textarea | sino | sino_esp | checks | radio
    const FICHA_SCHEMA = [
        { id:'personales', titulo:'Datos Personales', icono:'fa-id-card', campos:[
            { k:'nombre_completo', l:'Nombre completo', t:'text', pre: j => `${j.nombres||''} ${j.apellidos||''}`.trim() },
            { k:'nombre_social', l:'Nombre social', t:'text', pre: j => j.nombre_social },
            { k:'run', l:'RUN', t:'text', pre: j => j.run },
            { k:'fecha_nacimiento', l:'Fecha de nacimiento', t:'date', pre: j => j.fecha_nacimiento },
            { k:'nacionalidad', l:'Nacionalidad', t:'text', pre: j => j.nacionalidad },
            { k:'genero', l:'Género', t:'text' },
            { k:'estatura', l:'Estatura (m)', t:'text' },
            { k:'peso', l:'Peso (kg)', t:'text' }
        ]},
        { id:'grupo', titulo:'Datos de Grupo', icono:'fa-campground', campos:[
            { k:'nombre_grupo', l:'Nombre de grupo', t:'text', pre: () => 'Grupo Guías y Scouts Salvador Sanfuentes' },
            { k:'rama', l:'Rama', t:'text', pre: j => j.unidad },
            { k:'zona', l:'Zona', t:'text' },
            { k:'distrito', l:'Distrito', t:'text' }
        ]},
        { id:'emergencia', titulo:'Contactos de Emergencia', icono:'fa-phone-volume', campos:[
            { k:'ce1_nombre', l:'Contacto 1 · Nombre', t:'text', pre: j => j.apoderado_titular_nombre },
            { k:'ce1_parentesco', l:'Contacto 1 · Parentesco/Relación', t:'text', pre: j => j.apoderado_titular_parentesco },
            { k:'ce1_telefono', l:'Contacto 1 · Teléfono', t:'text', pre: j => j.apoderado_titular_telefono },
            { k:'ce2_nombre', l:'Contacto 2 · Nombre', t:'text', pre: j => j.apoderado_suplente1_nombre },
            { k:'ce2_parentesco', l:'Contacto 2 · Parentesco/Relación', t:'text', pre: j => j.apoderado_suplente1_parentesco },
            { k:'ce2_telefono', l:'Contacto 2 · Teléfono', t:'text', pre: j => j.apoderado_suplente1_telefono }
        ]},
        { id:'previsional', titulo:'Datos Previsionales', icono:'fa-hospital', campos:[
            { k:'prevision', l:'Previsión', t:'radio', op:['Fonasa','Isapre','Otro'], pre: j => j.prevision_salud },
            { k:'prevision_esp', l:'Especifique (Isapre u otro)', t:'text' },
            { k:'seguro_complementario', l:'¿Tiene seguro complementario de salud o escolar?', t:'sino', pre: j => j.tiene_seguro_complementario ? 'Sí' : (j.tiene_seguro_complementario === false ? 'No' : null) },
            { k:'seguro_institucion', l:'Institución convenio', t:'text', pre: j => j.aseguradora }
        ]},
        { id:'medicos', titulo:'Antecedentes Médicos', icono:'fa-notes-medical', campos:[
            { k:'grupo_sanguineo', l:'Grupo sanguíneo y factor Rh', t:'text', pre: j => j.grupo_sanguineo },
            { k:'alergias', l:'Alergias', t:'sino_esp', esp:'Especifique (medicamentos, alimentos, picaduras, plantas, látex, yodo, anestésicos, etc.)' },
            { k:'intolerancia', l:'Intolerancia alimentaria', t:'sino_esp', esp:'Especifique' }
        ]},
        { id:'cronicas', titulo:'Enfermedades Crónicas o Importantes', icono:'fa-heartbeat', campos:[
            { k:'enfermedades', l:'Marque las que apliquen', t:'checks', op:['Diabetes mellitus','Hipertensión arterial','Patología cardiaca','Dolor de cabeza','Asma','Tuberculosis','Epilepsia','Enfermedad renal','Alteraciones sanguíneas','Enfermedad autoinmune','Hipo/Hipertiroidismo','Otra'] },
            { k:'enfermedades_esp', l:'Especifique', t:'textarea' },
            { k:'medicamentos_cronicos', l:'Medicamentos, dosis y horarios', t:'textarea' }
        ]},
        { id:'salud_mental', titulo:'Antecedentes de Salud Mental', icono:'fa-brain', campos:[
            { k:'sm_diagnostico', l:'¿Diagnóstico de salud mental?', t:'sino_esp', esp:'Especifique' },
            { k:'sm_tratamiento', l:'¿Está en tratamiento actualmente?', t:'sino' },
            { k:'sm_medicamentos', l:'Medicamentos, dosis y horarios', t:'textarea' },
            { k:'sm_profesional', l:'Profesional tratante y contacto', t:'text' }
        ]},
        { id:'historial', titulo:'Historial Clínico', icono:'fa-file-medical', campos:[
            { k:'hospitalizaciones', l:'Hospitalizaciones previas', t:'sino_esp', esp:'Motivo y fecha' },
            { k:'cirugias', l:'Cirugías previas', t:'sino_esp', esp:'Cuál y fecha' }
        ]},
        { id:'recientes', titulo:'Condiciones Recientes', icono:'fa-thermometer-half', campos:[
            { k:'malestares', l:'¿Malestares en las últimas 2 semanas (dolor, fiebre, etc.)?', t:'sino_esp', esp:'Especifique' },
            { k:'trat_actual', l:'¿Está en tratamiento actualmente?', t:'sino_esp', esp:'Fecha de inicio, medicamentos, dosis y horarios' }
        ]},
        { id:'infecto', titulo:'Contacto Reciente con Enfermedades Infectocontagiosas', icono:'fa-virus', campos:[
            { k:'expuesto', l:'¿Ha estado expuesto de manera reciente a enfermedades infectocontagiosas?', t:'sino_esp', esp:'Especifique' },
            { k:'viaje_extranjero', l:'¿Ha viajado al extranjero el último año?', t:'sino_esp', esp:'País, fecha del viaje y vacuna administrada' }
        ]},
        { id:'vacunas', titulo:'Antecedentes de Vacunas', icono:'fa-syringe', campos:[
            { k:'pni_al_dia', l:'¿Tiene las vacunas del Plan Nacional de Inmunización al día?', t:'sino' },
            { k:'otras_vacunas', l:'¿Ha recibido otra vacuna? (ej: refuerzo antitetánica, antirrábica, fiebre amarilla)', t:'sino_esp', esp:'Especifique' }
        ]},
        { id:'gineco', titulo:'Información Gineco-Obstétrica (si aplica)', icono:'fa-venus', campos:[
            { k:'menstruaciones', l:'¿Tiene menstruaciones?', t:'sino' },
            { k:'ciclos', l:'Los ciclos menstruales son…', t:'radio', op:['Regulares','Irregulares'] },
            { k:'dismenorrea', l:'¿Sufre de dismenorrea (cólicos/dolores)?', t:'sino_esp', esp:'Medicamento para cólicos' },
            { k:'anticonceptivo', l:'Método anticonceptivo (nombre)', t:'text' },
            { k:'embarazo', l:'¿Está cursando un embarazo?', t:'sino_esp', esp:'Semanas de embarazo y fecha del último control' }
        ]},
        { id:'dental', titulo:'Antecedentes Dentales', icono:'fa-tooth', campos:[
            { k:'ultimo_control_dental', l:'Fecha del último control dental', t:'text' },
            { k:'trat_dental', l:'¿Tratamiento dental en curso?', t:'sino_esp', esp:'Especifique' }
        ]},
        { id:'necesidades', titulo:'Necesidades y Restricciones Especiales', icono:'fa-universal-access', campos:[
            { k:'necesidades_especiales', l:'Incluye aspectos médicos, alimentarios, neurodivergencias, religiosos, ayudas técnicas, etc.', t:'textarea', pre: j => j.condiciones_explicacion }
        ]},
        { id:'emocional', titulo:'Registro de Necesidades de Regulación Emocional', icono:'fa-hand-holding-heart', nota:'Información confidencial para prestar apoyo y prevenir situaciones que puedan desencadenar una desregulación.', campos:[
            { k:'re_diagnostico', l:'1. ¿Presenta un diagnóstico o características relevantes?', t:'sino_esp', esp:'¿Cuáles?' },
            { k:'re_intereses', l:'2. ¿Qué intereses y/o experiencias le generan disfrute?', t:'textarea' },
            { k:'re_gatillantes', l:'3. Situaciones que generan estrés o gatillan desregulaciones, y conductas previas observables (ansiedad/nerviosismo)', t:'textarea' },
            { k:'re_apoyo_comunicacion', l:'4a. Apoyo en comunicación (ej: lenguaje no verbal, pictogramas)', t:'sino_esp', esp:'Especifique' },
            { k:'re_sensorial', l:'4b. Dificultades sensoriales (ej: luces, ruidos, texturas)', t:'sino_esp', esp:'Especifique' },
            { k:'re_organizacion', l:'4c. Ayuda en organización/planificación (ej: rutinas visuales, recordatorios)', t:'sino_esp', esp:'Especifique' },
            { k:'re_otras', l:'4d. Otras necesidades específicas', t:'sino_esp', esp:'Especifique' },
            { k:'re_estrategias', l:'5. Estrategias que funcionan en casa o colegio para volver a la calma', t:'textarea' },
            { k:'re_observaciones', l:'6. Observaciones adicionales', t:'textarea' }
        ]}
    ];

    const SI = (v) => v ? (v.trim ? v.trim() : v) : '';
    const oSI = (v) => SI(v) || 'S/I';   // instrucción del formato: nunca dejar campos vacíos

    // ── Estado en la pestaña ──
    FM.cargar = async function(j) {
        const cont = document.getElementById(`fm-cont-${j.id}`);
        if (!cont) return;
        try {
            const { data } = await db.from('fichas_medicas')
                .select('id,created_at,firma_nombre')
                .eq('mmbb_id', j.id)
                .order('created_at', { ascending: false })
                .limit(1);
            const ultima = data?.[0] || null;
            _cache[j.id] = { j, ultimaId: ultima?.id || null };

            const meses6 = 1000 * 3600 * 24 * 182;
            const vigente = ultima && (Date.now() - new Date(ultima.created_at)) < meses6;
            const estadoHTML = ultima
                ? `<div class="ib ${vigente ? 'ok' : 'danger'} full" style="margin-bottom:12px">
                     <div class="l">Última ficha registrada</div>
                     <div class="v">${new Date(ultima.created_at).toLocaleDateString('es-CL')} · firmada por ${esc(ultima.firma_nombre)} ${vigente ? '' : '· <strong>Se recomienda actualizarla (más de 6 meses)</strong>'}</div>
                   </div>`
                : `<div class="ib danger full" style="margin-bottom:12px"><div class="l">Ficha médica</div><div class="v">Aún no registrada — es requerida para campamentos y salidas</div></div>`;

            cont.innerHTML = `${estadoHTML}
                <div style="display:flex;gap:10px;flex-wrap:wrap">
                    <button onclick="FichaMedica.abrir(${j.id})" style="background:var(--azul-profundo,#0E2586);color:white;border:none;border-radius:8px;padding:9px 16px;font-size:0.8rem;font-weight:600;cursor:pointer"><i class="fas fa-notes-medical"></i> ${ultima ? 'Actualizar ficha' : 'Completar ficha médica'}</button>
                    ${ultima ? `<button onclick="FichaMedica.descargarPDF(${ultima.id})" style="background:white;border:1px solid #cbd5e1;border-radius:8px;padding:9px 16px;font-size:0.8rem;cursor:pointer;color:#334155"><i class="fas fa-file-pdf" style="color:#dc2626"></i> Descargar PDF</button>` : ''}
                </div>
                <p style="font-size:0.7rem;color:#94a3b8;margin-top:12px"><i class="fas fa-lock"></i> Formato oficial AGSCh 2025. Información confidencial: solo la ven las guiadoras y dirigentes responsables. Al actualizar se conserva el historial de versiones.</p>`;
        } catch(e) {
            cont.innerHTML = `<div class="errb"><i class="fas fa-exclamation-circle"></i>${esc(e.message)}</div>`;
        }
    };

    // ── Render de campos ──
    function campoHTML(c, valor) {
        const v = valor ?? '';
        const inp = 'width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-size:0.8rem';
        const lbl = `<label style="font-weight:600;display:block;margin:10px 0 3px;font-size:0.78rem;color:#334155">${c.l}</label>`;
        switch (c.t) {
            case 'text':     return `${lbl}<input data-fk="${c.k}" type="text" value="${esc(v)}" style="${inp}">`;
            case 'date':     return `${lbl}<input data-fk="${c.k}" type="date" value="${esc(v)}" style="${inp}">`;
            case 'textarea': return `${lbl}<textarea data-fk="${c.k}" rows="2" style="${inp}">${esc(v)}</textarea>`;
            case 'sino':
                return `${lbl}<div>
                    <label style="margin-right:16px;cursor:pointer;font-size:0.8rem"><input type="radio" name="fm-${c.k}" value="Sí" ${v==='Sí'?'checked':''}> Sí</label>
                    <label style="cursor:pointer;font-size:0.8rem"><input type="radio" name="fm-${c.k}" value="No" ${v==='No'?'checked':''}> No</label></div>`;
            case 'sino_esp': {
                const val = typeof v === 'object' && v ? v : { r: '', esp: '' };
                return `${lbl}<div>
                    <label style="margin-right:16px;cursor:pointer;font-size:0.8rem"><input type="radio" name="fm-${c.k}" value="Sí" ${val.r==='Sí'?'checked':''}> Sí</label>
                    <label style="cursor:pointer;font-size:0.8rem"><input type="radio" name="fm-${c.k}" value="No" ${val.r==='No'?'checked':''}> No</label></div>
                    <input data-fk="${c.k}__esp" type="text" placeholder="${esc(c.esp)}" value="${esc(val.esp || '')}" style="${inp};margin-top:5px">`;
            }
            case 'radio':
                return `${lbl}<div>${c.op.map(o =>
                    `<label style="margin-right:14px;cursor:pointer;font-size:0.8rem"><input type="radio" name="fm-${c.k}" value="${esc(o)}" ${v===o?'checked':''}> ${esc(o)}</label>`).join('')}</div>`;
            case 'checks':
                return `${lbl}<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:4px">${c.op.map(o =>
                    `<label style="cursor:pointer;font-size:0.78rem"><input type="checkbox" data-fck="${c.k}" value="${esc(o)}" ${(Array.isArray(v) && v.includes(o))?'checked':''}> ${esc(o)}</label>`).join('')}</div>`;
        }
        return '';
    }

    // ── Modal del formulario ──
    FM.abrir = async function(mmbbId) {
        const c = _cache[mmbbId];
        if (!c) return;
        const j = c.j;
        // Cargar la última ficha completa para prellenar
        let datosPrevios = {};
        if (c.ultimaId) {
            const { data } = await db.from('fichas_medicas').select('datos').eq('id', c.ultimaId).single();
            datosPrevios = data?.datos || {};
        }
        const valorInicial = (campo) => {
            if (datosPrevios[campo.k] !== undefined && datosPrevios[campo.k] !== null && datosPrevios[campo.k] !== '' ) return datosPrevios[campo.k];
            return campo.pre ? (campo.pre(j) ?? '') : '';
        };

        const secciones = FICHA_SCHEMA.map((s, i) => `
            <details ${i === 0 ? 'open' : ''} style="border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;background:white">
                <summary style="padding:11px 14px;font-weight:700;font-size:0.83rem;cursor:pointer;color:var(--azul-profundo,#0E2586)"><i class="fas ${s.icono}" style="width:20px"></i> ${s.titulo}</summary>
                <div style="padding:2px 14px 13px">
                    ${s.nota ? `<p style="font-size:0.72rem;color:#64748b;margin:4px 0 2px">${s.nota}</p>` : ''}
                    ${s.campos.map(campo => campoHTML(campo, valorInicial(campo))).join('')}
                </div>
            </details>`).join('');

        const overlay = document.createElement('div');
        overlay.id = 'fm-modal';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:1000;display:flex;align-items:flex-start;justify-content:center;padding:18px;overflow-y:auto';
        overlay.innerHTML = `
        <div style="background:#f8fafc;border-radius:14px;max-width:680px;width:100%;margin:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
            <div style="background:var(--azul-profundo,#0E2586);color:white;padding:16px 22px;border-radius:14px 14px 0 0;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:5">
                <div>
                    <div style="font-weight:800;font-size:0.95rem">FICHA MÉDICA Y NECESIDADES EMOCIONALES</div>
                    <div style="font-size:0.75rem;opacity:0.85">${esc(j.nombres)} ${esc(j.apellidos)} · Formato AGSCh 2025</div>
                </div>
                <button onclick="document.getElementById('fm-modal').remove()" style="background:none;border:none;color:white;font-size:1.3rem;cursor:pointer">&times;</button>
            </div>
            <div style="padding:16px 18px">
                <p style="font-size:0.73rem;color:#64748b;margin-bottom:10px"><i class="fas fa-info-circle"></i> Completa todos los campos. Si no tienes la información escribe <strong>"S/I"</strong>; si no aplica, <strong>"N/A"</strong>. Los campos que quedan vacíos se registrarán automáticamente como "S/I".</p>
                ${secciones}

                <div style="border:1px solid #e2e8f0;border-radius:10px;background:white;padding:13px 14px;margin-top:12px">
                    <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;margin-bottom:10px">
                        <input type="checkbox" id="fm-doyfe" style="margin-top:3px">
                        <span style="font-size:0.8rem"><strong>Doy fe que la información contenida corresponde a la realidad de la persona que se individualiza.</strong></span>
                    </label>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
                        <input id="fm-firma-nombre" type="text" placeholder="Nombre de quien firma (titular/tutor/apoderado) *" value="${esc(j.apoderado_titular_nombre || '')}" style="padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-size:0.8rem">
                        <input id="fm-firma-tel" type="text" placeholder="Teléfono de contacto" value="${esc(j.apoderado_titular_telefono || '')}" style="padding:8px;border:1px solid #cbd5e1;border-radius:8px;font-size:0.8rem">
                    </div>
                    <div style="border:2px dashed #cbd5e1;border-radius:10px;background:#f8fafc;position:relative">
                        <canvas id="fm-firma" width="560" height="130" style="width:100%;height:130px;touch-action:none;display:block;border-radius:10px"></canvas>
                        <button onclick="Autorizaciones._limpiarFirma()" style="position:absolute;top:6px;right:6px;background:white;border:1px solid #cbd5e1;border-radius:6px;padding:3px 8px;font-size:0.7rem;cursor:pointer"><i class="fas fa-eraser"></i> Limpiar</button>
                    </div>
                </div>

                <div id="fm-error" style="display:none;background:#fef2f2;color:#b91c1c;border-radius:8px;padding:10px;font-size:0.78rem;margin-top:10px"></div>
                <button id="fm-btn-guardar" onclick="FichaMedica._guardar(${j.id})" style="width:100%;margin-top:14px;background:var(--azul-profundo,#0E2586);color:white;border:none;border-radius:10px;padding:13px;font-size:0.9rem;font-weight:700;cursor:pointer">
                    <i class="fas fa-file-medical"></i> Guardar ficha médica
                </button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        window.Autorizaciones._initFirma('fm-firma');
    };

    // ── Recolección y guardado ──
    FM._guardar = async function(mmbbId) {
        const err = document.getElementById('fm-error');
        const fallo = (m) => { err.style.display = 'block'; err.textContent = m; err.scrollIntoView({behavior:'smooth', block:'center'}); };
        err.style.display = 'none';

        if (!document.getElementById('fm-doyfe').checked) return fallo('Debes marcar "Doy fe que la información corresponde a la realidad" para continuar.');
        const firmaNombre = document.getElementById('fm-firma-nombre').value.trim();
        if (!firmaNombre) return fallo('Ingresa el nombre de quien firma la ficha.');
        if (!window.Autorizaciones._firmaLista()) return fallo('Dibuja la firma en el recuadro.');

        const datos = {};
        for (const s of FICHA_SCHEMA) {
            for (const campo of s.campos) {
                if (campo.t === 'sino' || campo.t === 'radio') {
                    const r = document.querySelector(`input[name="fm-${campo.k}"]:checked`);
                    datos[campo.k] = r ? r.value : 'S/I';
                } else if (campo.t === 'sino_esp') {
                    const r = document.querySelector(`input[name="fm-${campo.k}"]:checked`);
                    const espEl = document.querySelector(`[data-fk="${campo.k}__esp"]`);
                    datos[campo.k] = { r: r ? r.value : 'S/I', esp: oSI(espEl?.value) };
                } else if (campo.t === 'checks') {
                    datos[campo.k] = [...document.querySelectorAll(`input[data-fck="${campo.k}"]:checked`)].map(x => x.value);
                } else {
                    const el = document.querySelector(`[data-fk="${campo.k}"]`);
                    datos[campo.k] = oSI(el?.value);
                }
            }
        }

        const btn = document.getElementById('fm-btn-guardar');
        btn.disabled = true; btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Guardando...';
        const { error } = await db.from('fichas_medicas').insert({
            mmbb_id: mmbbId,
            datos,
            firma_nombre: firmaNombre,
            firma_telefono: document.getElementById('fm-firma-tel').value.trim() || null,
            firma_imagen: document.getElementById('fm-firma').toDataURL('image/png'),
            firma_user_agent: navigator.userAgent.slice(0, 250)
        });
        if (error) {
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-file-medical"></i> Guardar ficha médica';
            return fallo('Error al guardar: ' + error.message);
        }
        document.getElementById('fm-modal').remove();
        await FM.cargar(_cache[mmbbId].j);
        alert('✅ Ficha médica guardada correctamente.');
    };

    // ── PDF (recorre el mismo esquema) ──
    FM.descargarPDF = async function(fichaId) {
        const { data: f, error } = await db.from('fichas_medicas').select('*').eq('id', fichaId).single();
        if (error || !f) return alert('No se pudo recuperar la ficha.');
        if (!window.jspdf) {
            await new Promise((res, rej) => {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                s.onload = res; s.onerror = rej; document.head.appendChild(s);
            });
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const W = 210, M = 18, ancho = W - M * 2;
        let y = 18;
        const salto = (h) => { if (y + h > 282) { doc.addPage(); y = 18; } };
        const linea = (txt, opts = {}) => {
            doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
            doc.setFontSize(opts.size || 8.5);
            const ls = doc.splitTextToSize(txt, ancho);
            salto(ls.length * 4.1);
            doc.text(ls, opts.center ? W/2 : M, y, opts.center ? { align: 'center' } : {});
            y += ls.length * 4.1 + (opts.gap ?? 1.4);
        };
        const valTxt = (campo, v) => {
            if (v === undefined || v === null || v === '') return 'S/I';
            if (campo.t === 'sino_esp') return `${v.r || 'S/I'}${v.esp && v.esp !== 'S/I' ? ' — ' + v.esp : ''}`;
            if (campo.t === 'checks') return (v.length ? v.join(', ') : 'Ninguna');
            return String(v);
        };

        doc.setFillColor(14, 37, 134); doc.rect(0, 0, W, 4, 'F');
        linea('FICHA MÉDICA Y NECESIDADES EMOCIONALES', { bold: true, size: 13, center: true, gap: 1 });
        linea('Asociación de Guías y Scouts de Chile · Grupo Guías y Scouts Salvador Sanfuentes', { size: 8, center: true, gap: 4 });

        for (const s of FICHA_SCHEMA) {
            salto(9);
            doc.setFillColor(232, 238, 250);
            doc.rect(M - 2, y - 3.5, ancho + 4, 6, 'F');
            linea(s.titulo.toUpperCase(), { bold: true, size: 9, gap: 2.2 });
            for (const campo of s.campos) {
                linea(`${campo.l}:  ${valTxt(campo, f.datos[campo.k])}`, { gap: 1.1 });
            }
            y += 1.5;
        }

        y += 4; salto(40);
        linea('Doy fe que la información contenida corresponde a la realidad de la persona que se individualiza:  [ X ]', { bold: true, gap: 4 });
        if (f.firma_imagen) { try { doc.addImage(f.firma_imagen, 'PNG', M, y, 55, 13); } catch(e){} }
        y += 16;
        doc.setDrawColor(100); doc.line(M, y, M + 70, y); y += 4;
        linea(`${f.firma_nombre}${f.firma_telefono ? ' · Tel: ' + f.firma_telefono : ''}`, { size: 8, gap: 0.8 });
        linea('Titular / Tutor/a legal o Apoderado/a', { size: 7.5, gap: 3 });
        linea(`Fecha de llenado: ${new Date(f.created_at).toLocaleString('es-CL')} · Folio FM-${String(f.id).padStart(5, '0')}`, { size: 7.5, gap: 1 });
        linea('Entregue esta ficha a la persona Responsable de la Unidad y hágale saber cualquier precaución o necesidad específica. Este documento debe conservarse por un período mínimo de 6 meses después de finalizado el evento o salida.', { size: 7, gap: 0 });

        doc.save(`FichaMedica_FM${f.id}.pdf`);
    };

    window.FichaMedica = FM;
})();
