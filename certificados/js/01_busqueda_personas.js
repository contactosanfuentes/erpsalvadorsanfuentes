function buscarPersona(){
    clearTimeout(timeoutBuscar);
    const q = document.getElementById('buscar').value.trim();
    if (q.length < 2) { cerrarResultados(); return; }
    timeoutBuscar = setTimeout(async()=>{
        const resultadosDiv = document.getElementById('resultados');

        // Filtro de unidad para dirigentes (no admin, nivel < 4)
        const esDirigente = window.Permisos && Permisos.listo() && !Permisos.esAdmin() && Permisos.nivel() < 4;
        const miUnidad = esDirigente ? (Permisos.unidad() || '') : '';
        const keyword = miUnidad ? miUnidad.split(' ')[0] : ''; // ej: "Clan", "Tropa"

        // Buscar jóvenes
        let qJov = db.from('mmbb_registrations')
            .select('id,nombres,apellidos,unidad,apoderado_titular_email,run')
            .or(`nombres.ilike.%${q}%,apellidos.ilike.%${q}%,run.ilike.%${q}%`)
            .limit(8);
        if (keyword) qJov = qJov.ilike('unidad', `%${keyword}%`);
        const {data:jovenes} = await qJov;

        // Buscar adultos (solo si admin o tiene permiso)
        let adultos = [];
        if (!esDirigente || Permisos.puede('editar_adultos')) {
            const {data} = await db.from('adultos_registros')
                .select('id,nombres,apellidos,unidad_rol,email,nivel_formacion,nombreCompleto')
                .or(`nombres.ilike.%${q}%,apellidos.ilike.%${q}%,nombreCompleto.ilike.%${q}%`)
                .limit(8);
            adultos = data || [];
        }

        let html = '';
        (jovenes||[]).forEach(j => {
            const nom = `${j.nombres||''} ${j.apellidos||''}`.trim();
            html += `<div class="search-item" onclick="seleccionarJoven(${JSON.stringify(j).replace(/"/g,'&quot;')})">
                <div><div class="name">${nom}</div><div class="meta">${j.unidad||'Sin unidad'} · ${j.run||''}</div></div>
                <span class="badge badge-joven">Joven</span>
            </div>`;
        });
        (adultos||[]).forEach(a => {
            const nom = a.nombreCompleto || `${a.nombres||''} ${a.apellidos||''}`.trim();
            html += `<div class="search-item" onclick="seleccionarAdulto(${JSON.stringify(a).replace(/"/g,'&quot;')})">
                <div><div class="name">${nom}</div><div class="meta">${a.unidad_rol||'Adulto'} · ${a.nivel_formacion||''}</div></div>
                <span class="badge badge-adulto">Adulto</span>
            </div>`;
        });
        if (!html) html = '<div class="search-item"><div class="meta">Sin resultados</div></div>';
        resultadosDiv.innerHTML = html;
        resultadosDiv.classList.add('active');
    }, 300);
}

function seleccionarJoven(j){
    personaSeleccionada = { tipo:'joven', data:j };
    document.getElementById('nombre').value = `${j.nombres||''} ${j.apellidos||''}`.trim();
    document.getElementById('email').value = j.apoderado_titular_email || '';
    // Mapear unidad
    const u = j.unidad || '';
    const sel = document.getElementById('unidad');
    for (let o of sel.options) {
        if (u.includes(o.value) || u.includes(o.text.split('—')[0].trim())) { sel.value = o.value; break; }
    }
    actualizarEtapas();
    actualizarMotivo();
    cerrarResultados();
    toast('Joven seleccionado: ' + document.getElementById('nombre').value, 'info');
}

function seleccionarAdulto(a){
    personaSeleccionada = { tipo:'adulto', data:a };
    const nom = a.nombreCompleto || `${a.nombres||''} ${a.apellidos||''}`.trim();
    document.getElementById('nombre').value = nom;
    document.getElementById('email').value = a.email || '';
    document.getElementById('tipo').value = 'DE FORMACIÓN';
    actualizarMotivo();
    cerrarResultados();
    toast('Adulto seleccionado: ' + nom, 'info');
}

function cerrarResultados(){ document.getElementById('resultados').classList.remove('active'); }
document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap')) cerrarResultados();
});

