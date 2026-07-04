    window.generarActa = async function() {
        if (!reunionActiva) return;
        if (!window.GoogleAPI) { alert('GoogleAPI no disponible.'); return; }

        const r = reunionActiva;
        const btn = document.getElementById('btnGenerarActa');
        const origHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando acta…';

        try {
            // Construir lista de asistentes (nombres desde emails del grupo + custom)
            const emailsGrupo = r.invitados_emails || [];
            const emailsCustom = r.invitados_custom || [];
            const todosEmails = [...emailsGrupo, ...emailsCustom];

            // Intentar resolver emails a nombres desde la BD
            const asistentesNombres = [];
            if (emailsGrupo.length) {
                const { data: adultos } = await db.from('adultos_registros')
                    .select('nombres,apellidos,email')
                    .in('email', emailsGrupo);
                (adultos || []).forEach(a => {
                    asistentesNombres.push(`${a.nombres} ${a.apellidos}`);
                    emailsGrupo.splice(emailsGrupo.indexOf(a.email), 1);
                });
            }
            // Los que no se resolvieron → usar email directamente
            [...emailsGrupo, ...emailsCustom].forEach(e => {
                if (!asistentesNombres.some(n => n.includes(e))) asistentesNombres.push(e);
            });
            if (!asistentesNombres.length) asistentesNombres.push('(por completar)');

            // Temas desde actividades
            const temas = (r.actividades || []).map(a => {
                let t = '';
                if (a.hora) t += `[${a.hora}] `;
                if (a.tipo) t += `${a.tipo}: `;
                t += a.nombre || '';
                if (a.desc) t += ` — ${a.desc}`;
                return t;
            });
            if (r.objetivo) temas.unshift(`Objetivo: ${r.objetivo}`);
            if (!temas.length) temas.push('(ver programa de la reunión)');

            // Acuerdos desde el textarea
            const acuerdosRaw = (document.getElementById('actaAcuerdos')?.value || '').trim();
            const acuerdos = acuerdosRaw ? acuerdosRaw.split('\n').filter(l => l.trim()) : [];

            // Próxima reunión
            const proxFecha = document.getElementById('actaProxFecha')?.value || '';
            const proxLugar = document.getElementById('actaProxLugar')?.value || '';
            const proxInfo = proxFecha
                ? `${new Date(proxFecha + 'T12:00').toLocaleDateString('es-CL', {weekday:'long',day:'numeric',month:'long',year:'numeric'})}${proxLugar ? ' — ' + proxLugar : ''}`
                : '(por definir)';

            // Convocante: nombre del usuario logueado
            const convocante = window.Permisos?.nombre?.() || window.Permisos?.usuario?.()?.nombre || 'Responsable de Grupo';

            // Fecha formateada
            const fechaFmt = r.fecha
                ? new Date(r.fecha + 'T12:00').toLocaleDateString('es-CL', {weekday:'long',day:'numeric',month:'long',year:'numeric'})
                : new Date().toLocaleDateString('es-CL');

            const horaFmt = r.hora_inicio ? ` · ${r.hora_inicio}${r.hora_fin ? ' a ' + r.hora_fin : ''}` : '';

            // Llamar a la edge function de Google Docs
            const resultado = await GoogleAPI.Docs.crearActa({
                fecha: fechaFmt + horaFmt,
                lugar: r.lugar || 'Sede del Grupo',
                convocante,
                asistentes: asistentesNombres,
                temas: [...temas, ...(acuerdos.length ? ['— ACUERDOS —', ...acuerdos] : []), `Próxima reunión: ${proxInfo}`]
            });

            if (!resultado?.ok) throw new Error(resultado?.error || 'Error al generar el documento');

            const url = resultado.resultado?.url;

            // Guardar URL del acta en la reunión
            if (url) {
                await db.from('reuniones').update({ acta_url: url }).eq('id', r.id);
                reunionActiva.acta_url = url;
            }

            btn.innerHTML = '<i class="fas fa-check"></i> Acta generada';
            btn.style.background = '#16a34a';
            setTimeout(() => { btn.innerHTML = origHtml; btn.style.background = ''; btn.disabled = false; }, 3000);

            if (url && confirm(`✅ Acta generada correctamente.\n\n¿Abrir en Google Docs?`)) {
                window.open(url, '_blank');
            }
        } catch(e) {
            console.error('[ACTA]', e);
            alert('Error al generar el acta: ' + e.message);
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
    };

    window._plMostrarDetalle = function() {
        const det = document.getElementById('panelDetalle');
        const r = reunionActiva;
        if (!det || !r) return;
        const fechaFmt = r.fecha ? new Date(r.fecha+'T12:00').toLocaleDateString('es-CL',{weekday:'long',day:'numeric',month:'long'}) : '';
        // Botón eliminar visible siempre en el panel lateral
        const btnEliminar = `<div style="padding:8px 14px;border-bottom:1px solid #fee2e2;background:#fff5f5;">
            <button onclick="eliminarReunion()" style="background:#dc2626;color:white;border:none;padding:7px 16px;border-radius:8px;font-size:0.79rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:inherit">
                <i class="fas fa-trash-alt"></i> Eliminar esta reunión
            </button></div>`;
        _plMostrar(
            '<i class="fas fa-clipboard-list" style="color:#0E2586;margin-right:5px"></i>'+(r.titulo||'Reunión'),
            fechaFmt + (r.unidad ? ' · '+r.unidad : ''),
            btnEliminar + det.innerHTML
        );
    };
