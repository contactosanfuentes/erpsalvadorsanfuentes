    function renderPostas() {
        if (objetivosCatalogo.length === 0) { cargarObjetivosCatalogo().then(() => renderPostas()); return; }
        const container = document.getElementById('postas-container');
        const evtTitulo = document.getElementById('evento-titulo').value || 'Evento Scout';
        container.innerHTML = '';

        postasData.forEach((posta) => {
            const card = document.createElement('div');
            card.className = 'posta-card';
            card.innerHTML = `
                <div class="print-header-posta">
                    <img src="https://i.imgur.com/11u9rUD.png" alt="Logo">
                    <div class="title-box">
                        <h2>${evtTitulo}</h2>
                        <p style="margin:0; font-weight:bold; color:#444;">FICHA TÉCNICA DE POSTA</p>
                    </div>
                    <img src="https://i.imgur.com/DcxzvpX.png" alt="Logo">
                </div>

                <button class="btn-eliminar-posta no-print" onclick="eliminarPosta('${posta.id}')"><i class="fas fa-times"></i></button>
                <div class="posta-header" onclick="this.parentElement.querySelector('.posta-content').classList.toggle('hidden')">
                    <h3>Posta ${posta.numero}: <input type="text" value="${posta.nombre}" onchange="updatePostaField('${posta.id}', 'nombre', this.value)" onclick="event.stopPropagation()"></h3>
                    <select onchange="updatePostaField('${posta.id}', 'tipo', this.value)" onclick="event.stopPropagation()" class="no-print">
                        <option value="puntos" ${posta.tipo==='puntos'?'selected':''}>Por puntos</option>
                        <option value="tiempo" ${posta.tipo==='tiempo'?'selected':''}>Por tiempo</option>
                    </select>
                    <i class="fas fa-chevron-down no-print"></i>
                </div>

                <div class="posta-content">
                    <div id="objetivos-${posta.id}"></div>
                    
                    <p><strong>Objetivos Utilitarios:</strong></p>
                    <textarea onchange="updatePostaField('${posta.id}', 'objetivos_utilitarios', this.value)">${posta.objetivos_utilitarios || ''}</textarea>
                    <div class="text-print">${posta.objetivos_utilitarios || 'N/A'}</div>

                    <p><strong>Ambientación:</strong></p>
                    <textarea onchange="updatePostaField('${posta.id}', 'ambientacion', this.value)">${posta.ambientacion || ''}</textarea>
                    <div class="text-print">${posta.ambientacion || 'N/A'}</div>

                    <p><strong>Descripción:</strong></p>
                    <textarea onchange="updatePostaField('${posta.id}', 'descripcion', this.value)">${posta.descripcion || ''}</textarea>
                    <div class="text-print">${posta.descripcion || 'N/A'}</div>

                    <p><strong>Materiales:</strong></p>
                    <div id="materiales-${posta.id}" style="margin-bottom:10px;">
                        ${posta.materiales && posta.materiales.length > 0 ? 
                            posta.materiales.map((m, mIdx) => `
                                <div style="display:flex; align-items:center; margin-bottom:5px;">
                                    <span class="no-print">•</span> <input type="text" value="${m}" readonly style="flex:1; background:transparent; border:none;">
                                    <button class="btn btn-danger btn-sm no-print" onclick="eliminarMaterial('${posta.id}', ${mIdx})"><i class="fas fa-trash"></i></button>
                                </div>`).join('') : '<p>No hay materiales</p>'}
                    </div>
                    <div class="controls no-print">
                        <input type="text" id="nuevo-material-${posta.id}" placeholder="Nuevo material" style="flex:1;">
                        <button class="btn btn-success btn-sm" onclick="agregarMaterial('${posta.id}')"><i class="fas fa-plus"></i></button>
                    </div>

                    <p><strong>Criterios de Evaluación:</strong></p>
                    <div class="table-container">
                        <table class="criterios-table">
                            <thead><tr><th>Descripción</th><th>Puntos</th><th class="no-print">Acciones</th></tr></thead>
                            <tbody id="criterios-body-${posta.id}">
                                ${posta.criterios ? posta.criterios.map((c, cidx) => `
                                    <tr>
                                        <td><input type="text" value="${c.desc || ''}" onchange="updateCriterio('${posta.id}', ${cidx}, 'desc', this.value)"></td>
                                        <td><input type="number" step="0.01" value="${c.puntos || ''}" onchange="updateCriterio('${posta.id}', ${cidx}, 'puntos', this.value)"></td>
                                        <td class="no-print" style="text-align:center;"><button class="btn btn-danger btn-sm" onclick="eliminarCriterio('${posta.id}', ${cidx})"><i class="fas fa-trash"></i></button></td>
                                    </tr>`).join('') : ''}
                            </tbody>
                        </table>
                    </div>
                    <button class="btn btn-success btn-sm no-print" onclick="agregarCriterio('${posta.id}')"><i class="fas fa-plus"></i> Agregar Criterio</button>

                    <div class="posta-footer-signatures">
                        <div class="sig-box"><div class="sig-line"></div><div style="font-size:9pt; font-weight:bold;">ENCARGADO DE POSTA</div></div>
                        <div class="sig-box"><div class="sig-line"></div><div style="font-size:9pt; font-weight:bold;">DIRECCIÓN DE PROGRAMA</div></div>
                    </div>
                </div>
            `;
            container.appendChild(card);
            renderObjetivosEducativos(posta.id);
        });
        actualizarConsolidadoMateriales();
        renderPlanilla();
        actualizarSelectorElementosCroquis();
    }

    function renderObjetivosEducativos(postaId) {
        const contenedor = document.getElementById(`objetivos-${postaId}`);
        if (!contenedor) return;
        const posta = postasData.find(p => p.id == postaId);
        if (!posta) return;
        const unidadesLista = [{ nombre: 'manada', icono: '🐺', label: 'Manada' }, { nombre: 'tropa', icono: '⚜️', label: 'Tropa' }, { nombre: 'bandada', icono: '🕊️', label: 'Bandada' }, { nombre: 'compania', icono: '🏹', label: 'Compañía' }, { nombre: 'caminantes', icono: '🥾', label: 'Caminantes' }, { nombre: 'clan', icono: '🛶', label: 'Clan' }];
        
        let seleccionados = posta.objetivos_educativos || [];
        let resumenHtml = '';
        if (seleccionados.length > 0) {
            resumenHtml += '<div style="margin-bottom:10px; padding:10px; background:#e3f2fd; border-radius:8px;"><strong>✅ Objetivos seleccionados:</strong><div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">';
            seleccionados.forEach(id => {
                const obj = objetivosCatalogo.find(o => o.id == id);
                if (obj) { resumenHtml += `<span style="background:var(--azul-profundo); color:white; padding:4px 10px; border-radius:20px; font-size:12px;">${obj.texto} <button onclick="toggleObjetivoEducativo('${postaId}', ${id}, false)" style="background:none; border:none; color:white; cursor:pointer;">×</button></span>`; }
            });
            resumenHtml += '</div></div>';
        }

        let editorBotones = '<div style="margin-bottom:10px; display:flex; gap:5px; flex-wrap:wrap;">';
        unidadesLista.forEach(item => { editorBotones += `<button class="btn-unidad" onclick="mostrarObjetivosUnidad('${postaId}', '${item.nombre}')">${item.icono} ${item.label}</button>`; });
        editorBotones += '</div><div id="objetivos-lista-'+postaId+'" class="objetivos-lista"></div>';

        let html = `
            ${resumenHtml}
            <details class="objetivos-toggle">
                <summary><i class="fas fa-list-check"></i> Editar Objetivos Educativos <i class="fas fa-caret-down"></i></summary>
                <div class="objetivos-editor-panel">
                    ${editorBotones}
                </div>
            </details>
        `;

        contenedor.innerHTML = html;
        mostrarObjetivosUnidad(postaId, 'manada');
    }

    window.mostrarObjetivosUnidad = function(postaId, unidadStr) {
        const lista = document.getElementById(`objetivos-lista-${postaId}`);
        if (!lista) return;
        lista.setAttribute('data-unidad-activa', unidadStr);
        const posta = postasData.find(p => p.id == postaId);
        if (!posta) return;
        let seleccionados = posta.objetivos_educativos || [];
        
        const objetivosFiltrados = objetivosCatalogo.filter(obj => obj.rama_key && obj.rama_key.toLowerCase() === unidadStr.toLowerCase());
        const grupos = {};
        let html = '';
        objetivosFiltrados.forEach(obj => { const area = obj.area_key || 'otras'; if (!grupos[area]) grupos[area] = []; grupos[area].push(obj); });
        const ordenAreas = ['corporalidad', 'creatividad', 'caracter', 'afectividad', 'sociabilidad', 'espiritualidad', 'otras'];
        ordenAreas.forEach(area => {
            if (grupos[area]) {
                html += `<div style="margin-top:12px; font-weight:600; color:var(--azul-profundo); border-bottom:1px solid var(--border-color); font-size:14px;">${area.toUpperCase()}</div>`;
                grupos[area].forEach(obj => {
                    const checked = seleccionados.includes(obj.id) ? 'checked' : '';
                    const indicadores = obj.indicadores && Array.isArray(obj.indicadores) ? obj.indicadores.join(', ') : '';
                    html += `<div style="margin:8px 0 8px 15px; font-size:13px;"><input type="checkbox" id="obj-${postaId}-${obj.id}" value="${obj.id}" ${checked} onchange="toggleObjetivoEducativo('${postaId}', ${obj.id}, this.checked)"> <label for="obj-${postaId}-${obj.id}" title="${indicadores}">${obj.texto}</label></div>`;
                });
            }
        });
        if (objetivosFiltrados.length === 0) html += '<p style="font-size:13px;">No hay objetivos para esta unidad</p>';
        lista.innerHTML = html;
    }

    window.toggleObjetivoEducativo = async function(postaId, objetivoId, checked) {
        const posta = postasData.find(p => p.id == postaId);
        if (!posta) return;
        let seleccionados = posta.objetivos_educativos || [];
        if (checked) { if (!seleccionados.includes(objetivoId)) seleccionados.push(objetivoId); } else { seleccionados = seleccionados.filter(id => id != objetivoId); }
        try { await supabaseClient.from('postas').update({ objetivos_educativos: seleccionados }).eq('id', postaId); } catch(e){}
        posta.objetivos_educativos = seleccionados;
        renderObjetivosEducativos(postaId);
    }

    window.agregarMaterial = async function(postaId) {
        const input = document.getElementById(`nuevo-material-${postaId}`);
        const material = input.value.trim();
        if (!material) return;
        const posta = postasData.find(p => p.id == postaId);
        if (!posta) return;
        if (!posta.materiales) posta.materiales = [];
        posta.materiales.push(material);
        try { await supabaseClient.from('postas').update({ materiales: posta.materiales }).eq('id', postaId); }catch(e){}
        input.value = '';
        renderPostas();
    }

    window.eliminarMaterial = async function(postaId, index) {
        const posta = postasData.find(p => p.id == postaId);
        if (!posta || !posta.materiales) return;
        posta.materiales.splice(index, 1);
        try{ await supabaseClient.from('postas').update({ materiales: posta.materiales }).eq('id', postaId); }catch(e){}
        renderPostas();
    }

    window.eliminarPosta = async function(id) {
        if (await customConfirm('¿Eliminar esta posta permanentemente?')) {
            try { await supabaseClient.from('postas').delete().eq('id', id); } catch(e){}
            postasData = postasData.filter(p => p.id != id);
            renderPostas();
        }
    }

    window.updatePostaField = async function(id, field, value) {
        try{ await supabaseClient.from('postas').update({ [field]: value }).eq('id', id); }catch(e){}
        const posta = postasData.find(p => p.id == id);
        if (posta) posta[field] = value;
        if(field === 'nombre') { renderPlanilla(); actualizarSelectorElementosCroquis(); renderCroquis(); }
    }

    window.updateCriterio = async function(postaId, criterioIndex, field, value) {
        const posta = postasData.find(p => p.id == postaId);
        if (!posta) return;
        if (!posta.criterios) posta.criterios = [];
        if (!posta.criterios[criterioIndex]) posta.criterios[criterioIndex] = {};
        posta.criterios[criterioIndex][field] = value;
        try{ await supabaseClient.from('postas').update({ criterios: posta.criterios }).eq('id', postaId); }catch(e){}
        renderPlanilla();
    }

    window.agregarCriterio = async function(postaId) {
        const posta = postasData.find(p => p.id == postaId);
        if (!posta) return;
        if (!posta.criterios) posta.criterios = [];
        posta.criterios.push({ desc: '', puntos: '' });
        try{ await supabaseClient.from('postas').update({ criterios: posta.criterios }).eq('id', postaId); }catch(e){}
        renderPostas();
    }

    window.eliminarCriterio = async function(postaId, criterioIndex) {
        const posta = postasData.find(p => p.id == postaId);
        if (!posta || !posta.criterios) return;
        posta.criterios.splice(criterioIndex, 1);
        try{ await supabaseClient.from('postas').update({ criterios: posta.criterios }).eq('id', postaId); }catch(e){}
        renderPostas();
    }

    window.agregarNuevaPosta = async function() {
        if (!eventoActual) { await customAlert('Seleccione un evento'); return; }
        const nuevoNumero = postasData.length + 1;
        const nueva = { evento_id: eventoActual.id, numero: nuevoNumero, nombre: `Posta ${nuevoNumero}`, tipo: "puntos", ambientacion: "", materiales: [], objetivos_utilitarios: "", objetivos_educativos: [], descripcion: "", criterios: [] };
        try {
            const { data, error } = await supabaseClient.from('postas').insert(nueva).select();
            if (!error && data && data.length > 0) { postasData.push(data[0]); }
            else { nueva.id = Date.now(); postasData.push(nueva); }
        } catch(e) { nueva.id = Date.now(); postasData.push(nueva); }
        renderPostas();
    }

    function actualizarConsolidadoMateriales() {
        const materialesSet = new Set();
        postasData.forEach(posta => { if (posta.materiales && Array.isArray(posta.materiales)) { posta.materiales.forEach(m => materialesSet.add(m)); } });
        const lista = document.getElementById('lista-materiales-consolidados');
        if (lista) {
            lista.innerHTML = '';
            materialesSet.forEach(m => { const li = document.createElement('li'); li.textContent = m; lista.appendChild(li); });
            if (materialesSet.size === 0) lista.innerHTML = '<li style="list-style:none;">No hay materiales definidos en las postas.</li>';
        }
    }

    // ========== PASAPORTE ==========
