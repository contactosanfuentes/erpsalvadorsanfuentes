    async function editarEventoActual() {
        if (!eventoActual) { await customAlert('Seleccione un evento'); return; }
        const nuevoNombre = await customPrompt('Nuevo nombre:', eventoActual.nombre);
        if (nuevoNombre && nuevoNombre !== eventoActual.nombre) {
            eventoActual.nombre = nuevoNombre;
            try{ await supabaseClient.from('eventos').update({ nombre: nuevoNombre }).eq('id', eventoActual.id); }catch(e){}
            await cargarEventos();
            document.getElementById('selector-evento').value = eventoActual.id;
            document.getElementById('evento-titulo').value = nuevoNombre;
        }
    }

    async function guardarFechaEvento() {
        if (!eventoActual) return;
        const fecha = document.getElementById('evento-fecha').value;
        try{ await supabaseClient.from('eventos').update({ fecha_evento: fecha }).eq('id', eventoActual.id); }catch(e){}
        eventoActual.fecha_evento = fecha;
    }

    function actualizarUIPublicado(publicado) {
        const dot = document.getElementById('toggle-publicado-dot');
        const label = document.getElementById('label-publicado');
        const icono = document.getElementById('icono-publicado');
        if (publicado) {
            dot.style.transform = 'translateX(20px)';
            dot.parentElement.querySelector('span').style.background = '#10b981';
            label.textContent = 'Publicado';
            label.style.color = '#10b981';
            icono.style.color = '#10b981';
        } else {
            dot.style.transform = 'translateX(0)';
            dot.parentElement.querySelector('span').style.background = '#374151';
            label.textContent = 'No publicado';
            label.style.color = '#94a3b8';
            icono.style.color = '#94a3b8';
        }
    }

    function actualizarUIFichaSalud(val) {
        const dot = document.getElementById('toggle-ficha-salud-dot');
        const track = document.getElementById('track-ficha-salud');
        const label = document.getElementById('label-ficha-salud');
        const icono = document.getElementById('icono-ficha-salud');
        document.getElementById('toggle-ficha-salud').checked = val;
        if (val) {
            dot.style.transform = 'translateX(20px)';
            track.style.background = '#dc2626';
            label.textContent = 'Sí'; label.style.color = '#dc2626';
            icono.style.color = '#dc2626';
        } else {
            dot.style.transform = 'translateX(0)';
            track.style.background = '#374151';
            label.textContent = 'No'; label.style.color = '#94a3b8';
            icono.style.color = '#94a3b8';
        }
    }

    function actualizarUIDieta(val) {
        const dot = document.getElementById('toggle-dieta-dot');
        const track = document.getElementById('track-dieta');
        const label = document.getElementById('label-dieta');
        const icono = document.getElementById('icono-dieta');
        document.getElementById('toggle-dieta').checked = val;
        if (val) {
            dot.style.transform = 'translateX(20px)';
            track.style.background = '#f59e0b';
            label.textContent = 'Sí'; label.style.color = '#f59e0b';
            icono.style.color = '#f59e0b';
        } else {
            dot.style.transform = 'translateX(0)';
            track.style.background = '#374151';
            label.textContent = 'No'; label.style.color = '#94a3b8';
            icono.style.color = '#94a3b8';
        }
    }

    async function toggleFichaSalud(val) {
        if (!eventoActual) return;
        try {
            await supabaseClient.from('eventos').update({ pide_ficha_salud: val }).eq('id', eventoActual.id);
            eventoActual.pide_ficha_salud = val;
            actualizarUIFichaSalud(val);
        } catch(e) { console.error(e); }
    }

    // ── Tipo de evento: interno (participación por apoderados) / externo (inscripción pública) ──
    function actualizarUITipoEvento(tipo) {
        const esExterno = tipo === 'externo';
        const dot = document.getElementById('toggle-tipo-evento-dot');
        const track = document.getElementById('track-tipo-evento');
        const label = document.getElementById('label-tipo-evento');
        const icono = document.getElementById('icono-tipo-evento');
        if (!dot) return;
        document.getElementById('toggle-tipo-evento').checked = esExterno;
        if (esExterno) {
            dot.style.transform = 'translateX(20px)';
            track.style.background = '#f59e0b';
            label.textContent = 'Externo'; label.style.color = '#f59e0b';
            icono.className = 'fas fa-globe'; icono.style.color = '#f59e0b';
        } else {
            dot.style.transform = 'translateX(0)';
            track.style.background = '#0ea5e9';
            label.textContent = 'Interno'; label.style.color = '#38bdf8';
            icono.className = 'fas fa-house-flag'; icono.style.color = '#38bdf8';
        }
    }

    async function toggleTipoEvento(esExterno) {
        if (!eventoActual) return;
        const tipo = esExterno ? 'externo' : 'interno';
        try {
            await supabaseClient.from('eventos').update({ tipo }).eq('id', eventoActual.id);
            eventoActual.tipo = tipo;
            actualizarUITipoEvento(tipo);
        } catch(e) { console.error(e); }
    }

    async function toggleDietaEspecial(val) {
        if (!eventoActual) return;
        try {
            await supabaseClient.from('eventos').update({ pide_dieta_especial: val }).eq('id', eventoActual.id);
            eventoActual.pide_dieta_especial = val;
            actualizarUIDieta(val);
        } catch(e) { console.error(e); }
    }

    async function togglePublicadoEvento(publicado) {
        if (!eventoActual) return;
        try {
            await supabaseClient.from('eventos').update({ publicado }).eq('id', eventoActual.id);
            eventoActual.publicado = publicado;
            actualizarUIPublicado(publicado);
        } catch(e) { console.error(e); }
    }

    // ========== JÓVENES ==========
