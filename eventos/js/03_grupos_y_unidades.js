    async function cargarGrupos() {
        const { data, error } = await supabaseClient.from('grupos_scout').select('nombre, activo').order('nombre');
        if (!error) gruposScout = data || [];
        actualizarDatalist();
    }

    function actualizarDatalist() {
        let datalist = document.getElementById('listaGruposDatalist');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'listaGruposDatalist';
            document.body.appendChild(datalist);
        }
        datalist.innerHTML = '';
        gruposScout.forEach(g => {
            const option = document.createElement('option');
            option.value = g.nombre;
            datalist.appendChild(option);
        });
        const inputGrupo = document.getElementById('filtroGrupo');
        if (inputGrupo) inputGrupo.setAttribute('list', 'listaGruposDatalist');
    }

    async function agregarNuevoGrupo() {
        const input = document.getElementById('filtroGrupo');
        const nuevo = input.value.trim();
        if (!nuevo) { await customAlert('Escriba un nombre de grupo'); return; }
        if (gruposScout.some(g => g.nombre.toLowerCase() === nuevo.toLowerCase())) { await customAlert('El grupo ya existe'); return; }
        const { error } = await supabaseClient.from('grupos_scout').insert({ nombre: nuevo, activo: true });
        if (!error) { await cargarGrupos(); await customAlert('Grupo agregado: ' + nuevo); }
    }

    // ========== FUNCIONES DE UNIDADES ==========
    async function cargarUnidades() {
        const { data, error } = await supabaseClient.from('unidades').select('*').order('id');
        if (!error) {
            unidades = data || [];
            if(!unidades.find(u => u.nombre === 'Varios')) unidades.push({id: 99, nombre: 'Varios'});
            if(!unidades.find(u => u.nombre === 'Clan')) unidades.push({id: 98, nombre: 'Clan'});
            if (unidades.length > 0) unidadActiva = unidades.find(u => u.nombre === 'Tropa') || unidades[0];
        }
    }

    function cambiarEncabezado(tipo, btn) {
        let unidadNombre = '';
        if (tipo === 'tropa') unidadNombre = 'Tropa';
        else if (tipo === 'manada') unidadNombre = 'Manada';
        else if (tipo === 'bandada') unidadNombre = 'Bandada';
        else if (tipo === 'compania') unidadNombre = 'Compañía';
        else if (tipo === 'caminantes') unidadNombre = 'Caminantes';
        else if (tipo === 'clan') unidadNombre = 'Clan';
        else if (tipo === 'varios') unidadNombre = 'Varios';
        
        if (unidadNombre && unidades.length) {
            const unidad = unidades.find(u => u.nombre === unidadNombre);
            if (unidad) unidadActiva = unidad;
        }

        currentHeaderType = tipo;
        document.querySelectorAll('.btn-header').forEach(b => { b.classList.remove('active'); b.classList.add('inactive'); });
        btn.classList.remove('inactive');
        btn.classList.add('active');

        const headerRow = document.getElementById('jovenes-header-row');
        let datosHeaders = headerConfig[tipo];
        
        let colorFondo = '';
        switch(tipo) {
            case 'tropa': colorFondo = '#4CAF50'; break;
            case 'manada': colorFondo = 'var(--amarillo)'; break;
            case 'bandada': colorFondo = '#4169E1'; break;
            case 'compania': colorFondo = '#40E0D0'; break;
            case 'caminantes': colorFondo = 'var(--morado)'; break;
            case 'clan': colorFondo = 'var(--rojo-intenso)'; break;
            case 'varios': colorFondo = 'var(--azul-profundo)'; break;
        }
        
        headerRow.innerHTML = '';
        const thRegistro = document.createElement('th');
        thRegistro.style.backgroundColor = colorFondo;
        thRegistro.style.color = (tipo==='manada'||tipo==='compania') ? 'var(--marron-oscuro)' : 'white';
        thRegistro.textContent = '#';
        headerRow.appendChild(thRegistro);

        // ── Columna Foto ──
        const thFoto = document.createElement('th');
        thFoto.style.backgroundColor = colorFondo;
        thFoto.style.color = (tipo==='manada'||tipo==='compania') ? 'var(--marron-oscuro)' : 'white';
        thFoto.textContent = 'Foto';
        thFoto.style.width = '60px';
        headerRow.appendChild(thFoto);
        
        for (let i = 0; i < datosHeaders.length; i++) {
            const th = document.createElement('th');
            th.style.backgroundColor = colorFondo;
            if (tipo === 'varios' || tipo === 'clan') {
                const arrSource = tipo === 'varios' ? 'customHeadersVarios' : 'customHeadersClan';
                th.innerHTML = `<input type="text" value="${datosHeaders[i]}" onchange="${arrSource}[${i}] = this.value; cambiarEncabezado('${tipo}', document.querySelector('.btn-header.${tipo}'));" style="background:transparent; color:white; border:1px solid rgba(255,255,255,0.5);">`;
            } else {
                th.style.color = (tipo==='manada'||tipo==='compania') ? 'var(--marron-oscuro)' : 'white';
                th.textContent = datosHeaders[i];
            }
            headerRow.appendChild(th);
        }
        
        // ── Columna Estado QR (para integración con inscripcion_publica.html) ──
        const thEstado = document.createElement('th');
        thEstado.style.backgroundColor = colorFondo;
        thEstado.style.color = (tipo==='manada'||tipo==='compania') ? 'var(--marron-oscuro)' : 'white';
        thEstado.textContent = 'Estado';
        thEstado.style.minWidth = '100px';
        headerRow.appendChild(thEstado);

        const thAcciones = document.createElement('th');
        thAcciones.style.backgroundColor = colorFondo;
        thAcciones.style.color = (tipo==='manada'||tipo==='compania') ? 'var(--marron-oscuro)' : 'white';
        thAcciones.textContent = 'Acciones';
        headerRow.appendChild(thAcciones);
        
        renderJovenes();
    }

    // ========== CARGA DE DATOS PRINCIPAL (con todas las tablas) ==========
