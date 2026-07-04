    function formatearFechaCalendar(fechaStr, horaStr){
        // fechaStr: 'YYYY-MM-DD', horaStr: 'HH:MM' | null
        if(!fechaStr) return null;
        const h = horaStr || '09:00';
        // Construimos en zona local, luego volcamos a ISO sin caracteres separadores
        const dt = new Date(`${fechaStr}T${h}:00`);
        if(isNaN(dt.getTime())) return null;
        const pad = n => String(n).padStart(2,'0');
        return `${dt.getFullYear()}${pad(dt.getMonth()+1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
    }

    // Duración default 1h30min si falta hora_fin
    function calcularFin(fechaStr, horaInicio, horaFin){
        if(horaFin) return formatearFechaCalendar(fechaStr, horaFin);
        if(!horaInicio) return formatearFechaCalendar(fechaStr, '10:30');
        const [h,m] = horaInicio.split(':').map(Number);
        const finH = (h + 1) % 24;
        const finStr = `${String(finH).padStart(2,'0')}:${String(m+30 >= 60 ? m+30-60 : m+30).padStart(2,'0')}`;
        return formatearFechaCalendar(fechaStr, finStr);
    }

    // Construye descripción concatenando objetivo + actividades + notas
    function construirDescripcionCalendar(r){
        const partes = [];
        if(r.objetivo) partes.push('OBJETIVO:\n' + r.objetivo);
        if(Array.isArray(r.actividades) && r.actividades.length){
            const lineas = r.actividades
                .slice().sort((a,b) => (a.hora||'').localeCompare(b.hora||''))
                .map(a => `${a.hora || '—'} · ${a.nombre || ''}${a.descripcion ? ' — ' + a.descripcion : ''}`);
            partes.push('PROGRAMA:\n' + lineas.join('\n'));
        }
        if(r.notas) partes.push('NOTAS:\n' + r.notas);
        partes.push('\n— Generado desde ERP Scout · Grupo Guías y Scouts Salvador Sanfuentes');
        return partes.join('\n\n');
    }

    // Abre la URL de Google Calendar con el evento pre-llenado
    // Por defecto se crea en el calendario "primary" del usuario, pero si tiene el calendario
    // del grupo agregado en su Google Calendar, puede cambiarlo desde el desplegable "Calendario"
    window.abrirEnGoogleCalendar = function(){
        if(!reunionActiva) return;
        const r = reunionActiva;
        const inicio = formatearFechaCalendar(r.fecha, r.hora_inicio);
        const fin = calcularFin(r.fecha, r.hora_inicio, r.hora_fin);
        if(!inicio || !fin){ alert('La reunión no tiene fecha válida.'); return; }

        const descripcion = construirDescripcionCalendar(r);
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: r.titulo + ' · ' + (r.unidad || 'Grupo'),
            dates: `${inicio}/${fin}`,
            details: descripcion,
            location: r.lugar || 'Local del grupo',
            ctz: 'America/Santiago',
            src: GOOGLE_CALENDAR_ID  // sugiere guardarlo en el calendario del grupo
        });
        const url = 'https://calendar.google.com/calendar/render?' + params.toString();
        window.open(url, '_blank');
    };

    // Descarga un archivo .ics (compatible con Google, Outlook, Apple)
    window.descargarICS = function(){
        if(!reunionActiva) return;
        const r = reunionActiva;
        const inicio = formatearFechaCalendar(r.fecha, r.hora_inicio);
        const fin = calcularFin(r.fecha, r.hora_inicio, r.hora_fin);
        if(!inicio || !fin){ alert('La reunión no tiene fecha válida.'); return; }

        const descripcion = construirDescripcionCalendar(r).replace(/\n/g, '\\n');
        const now = new Date();
        const pad = n => String(n).padStart(2,'0');
        const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth()+1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
        const uid = `reunion-${r.id}@erp-scout.grupo-sanfuentes`;

        const ics = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//ERP Scout//Grupo Guias y Scouts Salvador Sanfuentes//ES',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTAMP:${stamp}`,
            `DTSTART;TZID=America/Santiago:${inicio}`,
            `DTEND;TZID=America/Santiago:${fin}`,
            `SUMMARY:${(r.titulo + ' · ' + (r.unidad || 'Grupo')).replace(/,/g, '\\,')}`,
            `DESCRIPTION:${descripcion.replace(/,/g, '\\,')}`,
            `LOCATION:${(r.lugar || 'Local del grupo').replace(/,/g, '\\,')}`,
            `STATUS:${r.estado === 'realizada' ? 'CONFIRMED' : r.estado === 'cancelada' ? 'CANCELLED' : 'TENTATIVE'}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `reunion_${(r.titulo || 'evento').replace(/[^\w]/g,'_').slice(0,40)}_${r.fecha || 'sinfecha'}.ics`;
        a.click();
    };

    // ══════════════════════════════════════════════
    // GOOGLE CALENDAR — Sincronización directa con el calendario del GRUPO
    // ══════════════════════════════════════════════
    // Reutiliza las mismas credenciales del dashboard (API Key + Calendar ID).
    // Las reuniones se agregan al calendario institucional del grupo,
    // NO al calendario personal del usuario que hace clic.
    //
    // Para que funcione hay que:
    //   1. En Google Cloud Console (mismo proyecto de la API Key), crear un
    //      OAuth 2.0 Client ID de tipo "Aplicación web" y pegarlo abajo.
    //   2. Agregar la URL de Netlify como "Origen autorizado de JavaScript".
    //   3. El usuario que sincronice debe tener permiso de EDICIÓN sobre el
    //      calendario del grupo (configurable desde Google Calendar → Compartir).
    // ──────────────────────────────────────────────
    // ── Google Calendar: sincronización vía Edge Function (service account) ──
    const GOOGLE_CALENDAR_ID = 'c_55638f9d91b7cabb9f93d361daf455b034f197e8cdfed2c8fd79ea5a6e91af2d@group.calendar.google.com';

    window.sincronizarGoogleCalendar = async function() {
        if (!reunionActiva) { alert('Selecciona una reunión primero.'); return; }
        if (!window.GoogleAPI) { alert('GoogleAPI helper no disponible. Recarga la página.'); return; }

        const r = reunionActiva;
        const btn = document.getElementById('btnSyncGC');
        const btnHtml = btn.innerHTML;

        // Construir fechas ISO con zona horaria Chile
        const inicio = `${r.fecha}T${r.hora_inicio || '09:00'}:00`;
        const horaFinCalc = r.hora_fin || (() => {
            const h = parseInt((r.hora_inicio||'09:00').split(':')[0]);
            const m = (r.hora_inicio||'09:00').split(':')[1] || '00';
            return `${String((h+1)%24).padStart(2,'0')}:${m}`;
        })();
        const fin = `${r.fecha}T${horaFinCalc}:00`;
        const emailsInvitados = typeof obtenerTodosLosInvitados === 'function' ? obtenerTodosLosInvitados() : [];
        const descripcion = typeof construirDescripcionCalendar === 'function' ? construirDescripcionCalendar(r) : (r.objetivo || '');

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';

            let resultado;

            if (r.google_event_id) {
                // Actualizar evento existente via edge function
                resultado = await GoogleAPI.call('google-calendar', {
                    accion: 'actualizar_evento',
                    calendar_id: GOOGLE_CALENDAR_ID,
                    event_id: r.google_event_id,
                    titulo: `${r.titulo} · ${r.unidad || 'Grupo'}`,
                    lugar: r.lugar || 'Local del grupo',
                    descripcion,
                    fecha_inicio: inicio,
                    fecha_fin: fin
                });
            } else {
                // Crear evento nuevo en el calendario del grupo
                resultado = await GoogleAPI.Calendar.crearEvento({
                    calendarId: GOOGLE_CALENDAR_ID,
                    titulo: `${r.titulo} · ${r.unidad || 'Grupo'}`,
                    lugar: r.lugar || 'Local del grupo',
                    descripcion,
                    fechaInicio: inicio,
                    fechaFin: fin,
                    invitados: emailsInvitados,
                    enviarInvitaciones: emailsInvitados.length > 0
                });

                // Guardar el ID del evento en la BD para futuros updates
                if (resultado?.ok && resultado.resultado?.id) {
                    const eventId = resultado.resultado.id;
                    await db.from('reuniones').update({ google_event_id: eventId }).eq('id', r.id);
                    reunionActiva.google_event_id = eventId;
                    // Actualizar también el item en la lista
                    const listItem = document.querySelector(`.reunion-item.sel`);
                    if (listItem) listItem.dataset.gcid = eventId;
                }
            }

            if (!resultado?.ok) throw new Error(resultado?.error || resultado?.message || 'Respuesta inesperada de la API');

            btn.innerHTML = '<i class="fas fa-check"></i> ¡Sincronizado!';
            btn.style.background = '#16a34a';
            setTimeout(() => { btn.innerHTML = btnHtml; btn.style.background = '#34a853'; btn.disabled = false; }, 3000);

            const link = resultado.resultado?.link || resultado.resultado?.htmlLink;
            if (link) {
                if (confirm(`✅ Reunión sincronizada con el calendario del grupo${emailsInvitados.length ? ` · ${emailsInvitados.length} invitación(es) enviada(s)` : ''}.\n\n¿Abrir en Google Calendar?`)) {
                    window.open(link, '_blank');
                }
            } else {
                alert(`✅ Reunión ${r.google_event_id ? 'actualizada' : 'creada'} en el calendario del grupo.`);
            }

        } catch(err) {
            console.error('[Calendar Sync]', err);
            alert('Error al sincronizar: ' + (err.message || err));
            btn.innerHTML = btnHtml;
            btn.style.background = '#34a853';
            btn.disabled = false;
        }
    };

    // ════ VISTA CALENDARIO ════
    const GCAL_ID = 'c_55638f9d91b7cabb9f93d361daf455b034f197e8cdfed2c8fd79ea5a6e91af2d@group.calendar.google.com';
    const GCAL_FN = SURL + '/functions/v1/google-calendar';
