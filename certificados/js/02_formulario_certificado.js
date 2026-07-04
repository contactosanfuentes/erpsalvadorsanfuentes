function actualizarEtapas(){
    const u = document.getElementById('unidad').value;
    const sel = document.getElementById('etapa');
    sel.innerHTML = '<option value="">— selecciona —</option>';
    (ETAPAS[u]||[]).forEach(e => {
        sel.innerHTML += `<option value="${e}">${e}</option>`;
    });
}

function actualizarMotivo(){
    const tipo = document.getElementById('tipo').value;
    const etapa = document.getElementById('etapa').value;
    const unidad = document.getElementById('unidad').options[document.getElementById('unidad').selectedIndex].text;
    const nombre = document.getElementById('nombre').value;

    let motivo = '';
    if (tipo === 'DE PROGRESIÓN' && etapa) motivo = `Por haber alcanzado la etapa ${etapa} de la ${unidad}`;
    else if (tipo === 'DE ESPECIALIDAD') motivo = 'Por haber completado la especialidad';
    else if (tipo === 'DE COMPETENCIA') motivo = 'Por haber alcanzado la competencia';
    else if (tipo === 'DE PARTICIPACIÓN') motivo = 'Por su participación en el evento';
    else if (tipo === 'DE FORMACIÓN') {
        const nf = personaSeleccionada?.data?.nivel_formacion || '';
        motivo = nf ? `Por haber completado el Nivel de Formación ${nf} del PPF` : 'Por haber completado su formación';
    }
    else if (tipo === 'DE RECONOCIMIENTO') motivo = `En reconocimiento a su servicio voluntario`;

    if (motivo) document.getElementById('motivo').value = motivo;
}

function recolectar(){
    return {
        titulo: document.getElementById('tipo').value,
        nombre: document.getElementById('nombre').value || 'Nombre del Participante',
        unidad: document.getElementById('unidad').value,
        detalle: document.getElementById('motivo').value || 'Por su destacada participación',
        subdetalle: document.getElementById('detalle').value,
        nombreArchivo: `Cert_${document.getElementById('tipo').value.replace(/\s/g,'_')}_${document.getElementById('nombre').value.replace(/[^a-zA-Z0-9]/g,'_')}`
    };
}

function toast(msg, tipo){
    const t = document.createElement('div');
    t.className = `toast toast-${tipo==='ok'?'ok':tipo==='err'?'err':'info'}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(), 4000);
}

